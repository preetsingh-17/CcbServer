// routes/areas.js
const express = require('express');
const router = express.Router();
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await executeQuery('SELECT are_id, are_descripcion FROM areas_conocimiento ORDER BY are_descripcion');
        if (!result.success) {
            throw new Error(result.error);
        }
        res.json({ success: true, data: result.data });
    } catch (error) {
        console.error("Error al obtener áreas de conocimiento:", error);
        res.status(500).json({ success: false, message: "Error interno del servidor" });
    }
});

module.exports = router;