// routes/usuarios.js

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { executeQuery, executeTransaction } = require('../config/database');
const { authenticateToken, requireGestora } = require('../middleware/auth');

// ENDPOINT: Obtener información completa de un usuario por su ID de cuenta
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.params.id;
        const result = await executeQuery(`
            SELECT 
                u.usu_id, u.usu_correo, u.usu_tipo, u.usu_activo, u.usu_fecha_registro,
                ui.usu_cedula, ui.usu_primer_nombre, ui.usu_segundo_nombre, 
                ui.usu_primer_apellido, ui.usu_segundo_apellido, ui.usu_telefono, 
                ui.usu_direccion, ui.are_id, ac.are_descripcion
            FROM cuentas u
            JOIN usuarios_info ui ON u.usu_id = ui.usu_id
            LEFT JOIN areas_conocimiento ac ON ui.are_id = ac.are_id
            WHERE u.usu_id = ?
        `, [userId]);

        if (!result.success || result.data.length === 0) {
            return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
        }
        res.json({ success: true, data: result.data[0] });
    } catch (error) {
        console.error('Error obteniendo información del usuario:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// ENDPOINT: Obtener todos los usuarios que son consultores
router.get('/tipo/consultor', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT 
                ui.usu_cedula,
                ui.usu_id,
                CONCAT_WS(' ', ui.usu_primer_nombre, ui.usu_segundo_nombre, ui.usu_primer_apellido, ui.usu_segundo_apellido) as nombre_completo,
                ui.usu_telefono,
                c.usu_correo,
                ac.are_descripcion as especialidad
            FROM usuarios_info ui
            JOIN cuentas c ON ui.usu_id = c.usu_id
            LEFT JOIN areas_conocimiento ac ON ui.are_id = ac.are_id
            WHERE c.usu_tipo = 'Consultor' AND c.usu_activo = 1
            ORDER BY nombre_completo;
        `;
        const result = await executeQuery(query);
        if (!result.success) throw new Error(result.error);
        
        res.json({ success: true, data: result.data });
    } catch (error) {
        console.error('Error al obtener consultores:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// ENDPOINT: Obtener un consultor por su CÉDULA
router.get('/cedula/:cedula', authenticateToken, async (req, res) => {
    try {
        const { cedula } = req.params;
        const query = `
            SELECT 
                ui.usu_cedula, ui.usu_id, ui.are_id,
                ui.usu_primer_nombre, ui.usu_segundo_nombre, ui.usu_primer_apellido, ui.usu_segundo_apellido,
                ui.usu_telefono, ui.usu_direccion,
                c.usu_correo, ac.are_descripcion
            FROM usuarios_info ui
            JOIN cuentas c ON ui.usu_id = c.usu_id
            LEFT JOIN areas_conocimiento ac ON ui.are_id = ac.are_id
            WHERE ui.usu_cedula = ?;
        `;
        const result = await executeQuery(query, [cedula]);
        if (!result.success) throw new Error(result.error);
        if (result.data.length === 0) return res.status(404).json({ success: false, message: 'Consultor no encontrado' });

        res.json({ success: true, data: result.data[0] });
    } catch (error) {
        console.error('Error al obtener detalle de consultor:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
});

// ENDPOINT: Crear un nuevo usuario de tipo Consultor
router.post('/consultor', [authenticateToken, requireGestora], async (req, res) => {
    try {
        const {
            usu_correo,
            usu_contraseña,
            usu_cedula,
            usu_primer_nombre,
            usu_segundo_nombre,
            usu_primer_apellido,
            usu_segundo_apellido,
            usu_telefono,
            usu_direccion,
            are_id
        } = req.body;

        if (!usu_correo || !usu_contraseña || !usu_cedula || !usu_primer_nombre || !usu_primer_apellido) {
            return res.status(400).json({ success: false, message: 'Faltan campos obligatorios.' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(usu_contraseña, salt);

        const queries = [
            {
                query: "INSERT INTO cuentas (usu_correo, usu_contraseña, usu_tipo, usu_fecha_registro, usu_activo) VALUES (?, ?, 'Consultor', NOW(), 1);",
                values: [usu_correo, hashedPassword]
            },
            {
                query: `INSERT INTO usuarios_info (usu_id, usu_cedula, are_id, usu_primer_nombre, usu_segundo_nombre, usu_primer_apellido, usu_segundo_apellido, usu_telefono, usu_direccion) 
                        VALUES (LAST_INSERT_ID(), ?, ?, ?, ?, ?, ?, ?, ?);`,
                values: [
                    usu_cedula, are_id, usu_primer_nombre, usu_segundo_nombre || null, usu_primer_apellido, 
                    usu_segundo_apellido || null, usu_telefono || null, usu_direccion || null
                ]
            }
        ];
        
        const transactionResult = await executeTransaction(queries);

        if (!transactionResult.success) {
            return res.status(500).json({ success: false, message: 'Error al crear el consultor. La cédula o el correo pueden ya existir.', error: transactionResult.error });
        }

        res.status(201).json({ success: true, message: 'Consultor creado exitosamente.' });

    } catch (error) {
        console.error('Error al crear consultor:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});

// ENDPOINT PARA CREAR UN CONSULTOR, SU CONTRATO Y ASIGNARLO A LA GESTORA LOGUEADA
router.post('/completo/consultor', [authenticateToken, requireGestora], async (req, res) => {
    try {
        // ----- ¡AQUÍ ESTÁ LA LÍNEA CLAVE DE DEPURACIÓN! -----
        console.log('Datos recibidos del frontend:', req.body);
        // ----------------------------------------------------

        const {
            usu_correo, usu_password, usu_cedula, usu_primer_nombre, usu_segundo_nombre,
            usu_primer_apellido, usu_segundo_apellido, usu_telefono, usu_direccion, are_id,
            oamp, oamp_consecutivo, oamp_valor_total, oamp_terminos, gc_observaciones
        } = req.body;

        const passwordRecibida = req.body.usu_password || req.body.usu_contraseña;

         if (!usu_correo || !passwordRecibida || !usu_cedula || !usu_primer_nombre) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios (correo, contraseña, cédula, nombre).' });
    }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(passwordRecibida, salt);
        
        const gestora_cedula = req.user.usu_cedula;

        const queries = [
            {
                query: "INSERT INTO cuentas (usu_correo, usu_contraseña, usu_tipo, usu_fecha_registro, usu_activo) VALUES (?, ?, 'Consultor', NOW(), 1);",
                params: [usu_correo, hashedPassword]
            },
            {
                query: `INSERT INTO usuarios_info (usu_id, usu_cedula, are_id, usu_primer_nombre, usu_segundo_nombre, usu_primer_apellido, usu_segundo_apellido, usu_telefono, usu_direccion) 
                        VALUES (LAST_INSERT_ID(), ?, ?, ?, ?, ?, ?, ?, ?);`,
                params: [usu_cedula, are_id, usu_primer_nombre, usu_segundo_nombre || null, usu_primer_apellido, usu_segundo_apellido || null, usu_telefono || null, usu_direccion || null]
            },
            {
                query: `INSERT INTO contratos (oamp, pos_id, usu_cedula, oamp_consecutivo, oamp_terminos, oamp_fecha_generacion, oamp_estado, oamp_valor_total, oamp_documento_firmado)
                        VALUES (?, ?, ?, ?, ?, NOW(), 'Enviado', ?, ?);`,
                params: [oamp, null, usu_cedula, oamp_consecutivo, oamp_terminos || 'Términos estándar', oamp_valor_total || 0, null]
            },
            {
                query: `INSERT INTO gestora_consultores (gestora_cedula, consultor_cedula, gc_observaciones)
                        VALUES (?, ?, ?);`,
                params: [gestora_cedula, usu_cedula, gc_observaciones || 'Creado y asignado por gestora.']
            }
        ];
        
        const transactionResult = await executeTransaction(queries);

        if (!transactionResult.success) {
            return res.status(500).json({ success: false, message: 'Error al crear el consultor. La cédula o el correo pueden ya existir.', error: transactionResult.error });
        }

        res.status(201).json({ success: true, message: 'Consultor, contrato y asignación creados exitosamente.' });

    } catch (error) {
        console.error('Error en la creación completa del consultor:', error);
        res.status(500).json({ success: false, message: 'Error interno del servidor.' });
    }
});


module.exports = router;