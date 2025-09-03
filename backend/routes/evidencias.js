// routes/evidencias.js

const express = require('express');
const router = express.Router();
const multer = require('multer');
const { executeQuery, executeTransaction } = require('../config/database');
const { authenticateToken, requireConsultor } = require('../middleware/auth');

// Configuración de Multer para manejar la subida de archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Endpoint para que un consultor suba la evidencia de una programación
// Se espera un FormData con los campos del formulario y los archivos
router.post(
    '/cargar',
    [authenticateToken, requireConsultor],
    upload.fields([ // Aceptamos hasta 2 archivos con nombres específicos
        { name: 'evi_evidencias', maxCount: 1 },
        { name: 'evi_pantallazo_avanza', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            const {
                tipo, // 'grupal' o 'individual'
                pro_id, // ID de la programación
                rr_id, // ID del responsable (necesitarás obtenerlo)
                mes,
                fecha,
                hora_inicio,
                hora_fin,
                horas_dictar,
                valor_hora,
                valor_total_horas,
                tematica_dictada,
                numero_asistentes,
                direccion,
                // Campos solo para individuales
                razon_social,
                nombre_asesorado,
                identificacion_asesorado
            } = req.body;

            const usu_cedula = req.user.usu_cedula;

            if (!tipo || !pro_id || !req.files) {
                return res.status(400).json({ success: false, message: 'Faltan datos o archivos para la evidencia.' });
            }

            let queries = [];
            const tablaProgramaciones = tipo === 'grupal' ? 'programaciones_grupales' : 'programaciones_individuales';
            const idProgramacion = tipo === 'grupal' ? 'pro_id' : 'proin_id';
            const campoEstado = tipo === 'grupal' ? 'pro_estado' : 'proin_estado';

           if (tipo === 'grupal') {
    const evidenciaFile = req.files['evi_evidencias'][0];
    // Query 1: Insertar la evidencia
    queries.push({
        query: `INSERT INTO evidencias_grupales (
                    usu_cedula, pro_id, rr_id, evi_mes, evi_fecha, evi_hora_inicio, evi_hora_fin,
                    evi_horas_dictar, evi_valor_hora, evi_valor_total_horas,
                    evi_tematica_dictada, evi_numero_asistentes, evi_direccion, evi_estado, 
                    evi_evidencias, evi_nombre_archivo, evi_tipo_archivo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', ?, ?, ?);`, // <-- Añadimos 4 '?'
        params: [
            usu_cedula, pro_id, rr_id || 1, mes, fecha, hora_inicio, hora_fin,
            horas_dictar, valor_hora, valor_total_horas, tematica_dictada,
            numero_asistentes, direccion, 
            evidenciaFile.buffer, 
            evidenciaFile.originalname, // <-- Guardamos el nombre original
            evidenciaFile.mimetype      // <-- Guardamos el tipo de archivo
        ]
    });
} else if (tipo === 'individual') {
    const evidenciaFile = req.files['evi_evidencias'][0];
    const pantallazoFile = req.files['evi_pantallazo_avanza'][0];
    // Query 1: Insertar la evidencia
    queries.push({
        query: `INSERT INTO evidencias_individuales (
                    usu_cedula, proin_id, rr_id, eviin_mes, eviin_fecha, eviin_hora_inicio, eviin_hora_fin,
                    eviin_horas_dictar, eviin_valor_hora, eviin_valor_total_horas, eviin_tematica_dictada,
                    eviin_numero_asistentes, eviin_direccion, eviin_estado, eviin_razon_social,
                    eviin_nombre_asesorado, eviin_identificacion_asesorado, 
                    eviin_evidencias, eviin_nombre_archivo, eviin_tipo_archivo,
                    evi_pantallazo_avanza, eviin_pantallazo_nombre, eviin_pantallazo_tipo
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pendiente', ?, ?, ?, ?, ?, ?, ?, ?, ?);`, // <-- Añadimos 4 '?'
        params: [
            usu_cedula, pro_id, rr_id || 1, mes, fecha, hora_inicio, hora_fin,
            horas_dictar, valor_hora, valor_total_horas, tematica_dictada,
            numero_asistentes, direccion, razon_social,
            nombre_asesorado, identificacion_asesorado, 
            evidenciaFile.buffer, 
            evidenciaFile.originalname, // <-- Nombre evidencia principal
            evidenciaFile.mimetype,     // <-- Tipo evidencia principal
            pantallazoFile.buffer,
            pantallazoFile.originalname, // <-- Nombre pantallazo
            pantallazoFile.mimetype      // <-- Tipo pantallazo
        ]
    });
} else {
    return res.status(400).json({ success: false, message: 'Tipo de programación no válido.' });
}
    queries.push({
    query: `UPDATE ${tablaProgramaciones} SET ${campoEstado} = ? WHERE ${idProgramacion} = ?;`,
    params: ['Pendiente', pro_id]
});
            const result = await executeTransaction(queries);

            if (!result.success) {
                throw new Error(result.error);
            }

            res.status(201).json({ success: true, message: 'Evidencia cargada exitosamente.' });

        } catch (error) {
            console.error("Error al cargar evidencia:", error);
            res.status(500).json({ success: false, message: 'Error interno del servidor.' });
        }
    }
);

// GET /api/evidencias/:id - Obtener una evidencia específica por ID de programación
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params; // ej: "grupal_7"

        let tipo, realId;
        if (id.startsWith('grupal_')) {
            tipo = 'grupal';
            realId = id.replace('grupal_', '');
        } else if (id.startsWith('individual_')) {
            tipo = 'individual';
            realId = id.replace('individual_', '');
        } else {
            return res.status(400).json({ success: false, message: 'ID de programación inválido.' });
        }

        let query;
        if (tipo === 'grupal') {
            query = 'SELECT * FROM evidencias_grupales WHERE pro_id = ?';
        } else {
            query = 'SELECT * FROM evidencias_individuales WHERE proin_id = ?';
        }

        const result = await executeQuery(query, [realId]);

        if (!result.success) {
            return res.status(500).json({ success: false, message: 'Error al buscar la evidencia.' });
        }

        if (result.data.length === 0) {
            return res.status(404).json({ success: false, message: 'No se encontró evidencia para esta programación.' });
        }
        
        // No enviamos los buffers de los archivos, solo los datos del formulario
        const evidenciaData = result.data[0];
        delete evidenciaData.evi_evidencias;
        delete evidenciaData.evi_pantallazo_avanza;

        res.json({ success: true, data: evidenciaData });

    } catch (error) {
        console.error("Error al obtener evidencia:", error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

// GET /api/evidencias/download/:id/:fileType - Descargar un archivo de evidencia
router.get('/download/:id/:fileType', authenticateToken, async (req, res) => {
    try {
        const { id, fileType } = req.params; // fileType puede ser 'principal' o 'pantallazo'
        
        let tipo, realId, tabla, campos;
        if (id.startsWith('grupal_')) {
            tipo = 'grupal';
            realId = id.replace('grupal_', '');
            tabla = 'evidencias_grupales';
            campos = {
                data: 'evi_evidencias',
                nombre: 'evi_nombre_archivo',
                tipo: 'evi_tipo_archivo',
                id_col: 'pro_id'
            };
        } else if (id.startsWith('individual_')) {
            tipo = 'individual';
            realId = id.replace('individual_', '');
            tabla = 'evidencias_individuales';
            // Dependiendo del fileType, seleccionamos las columnas correctas
            if (fileType === 'principal') {
                campos = { data: 'eviin_evidencias', nombre: 'eviin_nombre_archivo', tipo: 'eviin_tipo_archivo', id_col: 'proin_id' };
            } else if (fileType === 'pantallazo') {
                campos = { data: 'evi_pantallazo_avanza', nombre: 'eviin_pantallazo_nombre', tipo: 'eviin_pantallazo_tipo', id_col: 'proin_id' };
            } else {
                return res.status(400).json({ success: false, message: 'Tipo de archivo no válido.' });
            }
        } else {
            return res.status(400).json({ success: false, message: 'ID de programación inválido.' });
        }

        const query = `SELECT ${campos.data}, ${campos.nombre}, ${campos.tipo} FROM ${tabla} WHERE ${campos.id_col} = ?`;
        const result = await executeQuery(query, [realId]);

        if (!result.success || result.data.length === 0) {
            return res.status(404).send('Archivo no encontrado.');
        }

        const fileData = result.data[0];
        const buffer = fileData[campos.data];
        const nombre = fileData[campos.nombre] || 'archivo_descargado';
        const tipoArchivo = fileData[campos.tipo] || 'application/octet-stream';
        
        // Establecer las cabeceras para forzar la descarga en el navegador
        res.setHeader('Content-Type', tipoArchivo);
        res.setHeader('Content-Disposition', `attachment; filename="${nombre}"`);
        res.send(buffer);

    } catch (error) {
        console.error("Error al descargar evidencia:", error);
        res.status(500).send('Error interno del servidor.');
    }
});

// NUEVO ENDPOINT: Servir imagen de evidencia GRUPAL para visualización
// Se ha eliminado 'authenticateToken' de esta línea
// Endpoint para servir imagen de evidencia GRUPAL
router.get('/imagen/grupal/:evi_id', async (req, res) => {
    try {
        const { evi_id } = req.params;
        const query = "SELECT evi_evidencias, evi_tipo_archivo FROM evidencias_grupales WHERE evi_id = ?";
        const result = await executeQuery(query, [evi_id]);

        if (result.success && result.data.length > 0) {
            const file = result.data[0];
            if (file.evi_evidencias) {
                res.setHeader('Content-Type', file.evi_tipo_archivo || 'image/png');
                res.send(file.evi_evidencias);
            } else {
                res.status(404).json({ message: 'Buffer de imagen no encontrado.' });
            }
        } else {
            res.status(404).json({ message: 'Evidencia no encontrada.' });
        }
    } catch (error) {
        console.error("Error al servir imagen grupal:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// Endpoint para servir PANTALLAZO de evidencia INDIVIDUAL
router.get('/imagen/individual/pantallazo/:eviin_id', async (req, res) => {
    try {
        const { eviin_id } = req.params;
        const query = "SELECT evi_pantallazo_avanza, eviin_pantallazo_tipo FROM evidencias_individuales WHERE eviin_id = ?";
        const result = await executeQuery(query, [eviin_id]);

        if (result.success && result.data.length > 0) {
            const file = result.data[0];
            const buffer = file.evi_pantallazo_avanza; 
            if (buffer) {
                res.setHeader('Content-Type', file.eviin_pantallazo_tipo || 'image/png');
                res.send(buffer);
            } else {
                res.status(404).json({ message: 'Buffer de imagen no encontrado.' });
            }
        } else {
            res.status(404).json({ message: 'Evidencia no encontrada.' });
        }
    } catch (error) {
        console.error("Error al servir pantallazo individual:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});

// NUEVO ENDPOINT: Servir IMAGEN PRINCIPAL de evidencia INDIVIDUAL
router.get('/imagen/individual/principal/:eviin_id', async (req, res) => {
    try {
        const { eviin_id } = req.params;
        const query = "SELECT eviin_evidencias, eviin_tipo_archivo FROM evidencias_individuales WHERE eviin_id = ?";
        const result = await executeQuery(query, [eviin_id]);

        if (result.success && result.data.length > 0) {
            const file = result.data[0];
            const buffer = file.eviin_evidencias; 
            if (buffer) {
                res.setHeader('Content-Type', file.eviin_tipo_archivo || 'image/png');
                res.send(buffer);
            } else {
                res.status(404).json({ message: 'Buffer de imagen principal no encontrado.' });
            }
        } else {
            res.status(404).json({ message: 'Evidencia no encontrada.' });
        }
    } catch (error) {
        console.error("Error al servir imagen individual principal:", error);
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
});


// NEW ENDPOINT: Get feedback for a returned evidence
router.get('/feedback/:tipo/:id', [authenticateToken], async (req, res) => {
    const { tipo, id } = req.params;
    const isGrupal = tipo === 'grupal';
    const evidenceTable = isGrupal ? 'evidencias_grupales' : 'evidencias_individuales';
    const evidenceIdField = isGrupal ? 'evi_id' : 'eviin_id';

    const query = `
        SELECT v.val_observaciones 
        FROM valoraciones v
        JOIN ${evidenceTable} e ON v.${evidenceIdField} = e.${evidenceIdField}
        WHERE e.${isGrupal ? 'pro_id' : 'proin_id'} = ?
        ORDER BY v.val_id DESC
        LIMIT 1
    `;

    try {
        const result = await executeQuery(query, [id]);
        if (result.success && result.data.length > 0) {
            res.json({ success: true, data: result.data[0] });
        } else {
            res.status(404).json({ success: false, message: 'No se encontró feedback para esta evidencia.' });
        }
    } catch (error) {
        console.error('Error fetching feedback:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});


// NEW ENDPOINT: Update an existing evidence
router.put(
    '/editar/:tipo/:id',
    [authenticateToken, requireConsultor],
    upload.fields([
        { name: 'evi_evidencias', maxCount: 1 },
        { name: 'evi_pantallazo_avanza', maxCount: 1 }
    ]),
    async (req, res) => {
        try {
            const { tipo, id } = req.params;
            const isGrupal = tipo === 'grupal';
            const {
                rr_id,
                tematica_dictada,
                numero_asistentes,
                razon_social,
                nombre_asesorado,
                identificacion_asesorado
            } = req.body;
            
            // Nombres de tablas y columnas dinámicos
            const evidenceTable = isGrupal ? 'evidencias_grupales' : 'evidencias_individuales';
            const programmingTable = isGrupal ? 'programaciones_grupales' : 'programaciones_individuales';
            const id_col_evidence = isGrupal ? 'pro_id' : 'proin_id';
            const id_col_programming = isGrupal ? 'pro_id' : 'proin_id';
            const estado_col_evidence = isGrupal ? 'evi_estado' : 'eviin_estado';
            const estado_col_programming = isGrupal ? 'pro_estado' : 'proin_estado';

            // ------------------- INICIO DE LA LÓGICA DE TRANSACCIÓN -------------------
            
            // 1. Prepara la consulta para actualizar la tabla de EVIDENCIAS
            let updateEvidenceQuery = `UPDATE ${evidenceTable} SET 
                rr_id = ?, 
                ${isGrupal ? 'evi_tematica_dictada' : 'eviin_tematica_dictada'} = ?,
                ${isGrupal ? 'evi_numero_asistentes' : 'eviin_numero_asistentes'} = ?,
                ${estado_col_evidence} = 'Pendiente'`;

            const paramsEvidence = [
                rr_id,
                tematica_dictada,
                isGrupal ? numero_asistentes : 1
            ];

            if (req.files['evi_evidencias']) {
                const evidenciaFile = req.files['evi_evidencias'][0];
                updateEvidenceQuery += `, ${isGrupal ? 'evi_evidencias' : 'eviin_evidencias'} = ?, ${isGrupal ? 'evi_nombre_archivo' : 'eviin_nombre_archivo'} = ?, ${isGrupal ? 'evi_tipo_archivo' : 'eviin_tipo_archivo'} = ?`;
                paramsEvidence.push(evidenciaFile.buffer, evidenciaFile.originalname, evidenciaFile.mimetype);
            }
            
            if (!isGrupal) {
                updateEvidenceQuery += `, eviin_razon_social = ?, eviin_nombre_asesorado = ?, eviin_identificacion_asesorado = ?`;
                paramsEvidence.push(razon_social, nombre_asesorado, identificacion_asesorado);

                if (req.files['evi_pantallazo_avanza']) {
                    const pantallazoFile = req.files['evi_pantallazo_avanza'][0];
                    updateEvidenceQuery += `, evi_pantallazo_avanza = ?, eviin_pantallazo_nombre = ?, eviin_pantallazo_tipo = ?`;
                    paramsEvidence.push(pantallazoFile.buffer, pantallazoFile.originalname, pantallazoFile.mimetype);
                }
            }
            
            updateEvidenceQuery += ` WHERE ${id_col_evidence} = ?`;
            paramsEvidence.push(id);

            // 2. Prepara la consulta para sincronizar el estado en la tabla de PROGRAMACIONES
            const syncProgrammingQuery = `
                UPDATE ${programmingTable} 
                SET ${estado_col_programming} = 'Pendiente' 
                WHERE ${id_col_programming} = ?`;

            // 3. Ejecuta ambas consultas en una transacción para asegurar la integridad de los datos
            const queries = [
                { query: updateEvidenceQuery, params: paramsEvidence },
                { query: syncProgrammingQuery, params: [id] }
            ];

            const result = await executeTransaction(queries);

            if (!result.success) {
                throw new Error(result.error.sqlMessage || result.error);
            }
            
            res.status(200).json({ success: true, message: 'Evidencia actualizada y reenviada para revisión.' });

        } catch (error) {
            console.error("Error al editar evidencia:", error);
            res.status(500).json({ success: false, message: 'Error interno del servidor.' });
        }
    }
);


module.exports = router;