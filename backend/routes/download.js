const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// Ruta unificada para todas las descargas de archivos
// Se ha eliminado el prefijo "/download" de aquí.
// La ruta ahora es /:fileType/:id y se combinará con el prefijo de server.js
router.get('/:fileType/:id', authenticateToken, async (req, res) => {
    try {
        const { fileType, id } = req.params;

        let query;
        const params = [id];

        // Determinamos la consulta SQL correcta según el tipo de archivo solicitado
        switch (fileType) {
            case 'evidencia-individual':
                query = 'SELECT eviin_evidencias AS data, eviin_nombre_archivo AS nombre, eviin_tipo_archivo AS tipo FROM evidencias_individuales WHERE eviin_id = ?';
                break;
            case 'avanza-individual':
                query = 'SELECT evi_pantallazo_avanza AS data, eviin_pantallazo_nombre AS nombre, eviin_pantallazo_tipo AS tipo FROM evidencias_individuales WHERE eviin_id = ?';
                break;
            case 'evidencia-grupal':
                query = 'SELECT evi_evidencias AS data, evi_nombre_archivo AS nombre, evi_tipo_archivo AS tipo FROM evidencias_grupales WHERE evi_id = ?';
                break;
            default:
                return res.status(400).json({ success: false, message: 'Tipo de archivo no válido.' });
        }

        const result = await executeQuery(query, params);

        if (!result.success || result.data.length === 0 || !result.data[0].data) {
            return res.status(404).json({ success: false, message: 'Archivo no encontrado en la base de datos.' });
        }

        const file = result.data[0];
        const fileContents = file.data;
        const fileName = file.nombre || 'archivo-descargado';
        const fileTypeHeader = file.tipo || 'application/octet-stream';

        // Establecer las cabeceras para forzar la descarga
        res.setHeader('Content-Type', fileTypeHeader);
        res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
        
        // Enviar el buffer del archivo
        res.send(fileContents);

    } catch (error) {
        console.error(`Error descargando archivo (tipo: ${req.params.fileType}, id: ${req.params.id}):`, error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

module.exports = router;
