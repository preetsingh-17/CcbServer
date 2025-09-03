// routes/responsables.js

const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

// ENDPOINT para obtener una lista de todos los responsables de rutas activos
router.get('/', authenticateToken, async (req, res) => {
    try {
        const query = `
            SELECT 
                rr.rr_id, 
                CONCAT(ui.usu_primer_nombre, ' ', ui.usu_primer_apellido) as nombre_responsable,
                r.rut_nombre
            FROM responsable_rutas rr
            JOIN cuentas c ON rr.usu_id = c.usu_id
            JOIN usuarios_info ui ON c.usu_id = ui.usu_id
            JOIN rutas r ON rr.rut_id = r.rut_id
            WHERE rr.rr_activo = TRUE
            ORDER BY nombre_responsable;
        `;
        const result = await executeQuery(query);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        res.json({ success: true, data: result.data });

    } catch (error) {
        console.error("Error al obtener responsables de rutas:", error);
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
});

module.exports = router;