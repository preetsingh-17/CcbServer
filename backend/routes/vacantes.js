const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken, requireReclutador } = require('../middleware/auth');

const router = express.Router();

// GET /api/vacantes - Obtener vacantes
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { estado, page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '1=1';
    let params = [];

    if (req.user.rol === 'reclutador') {
      whereClause += ' AND v.reclutador_id = ?';
      params.push(req.user.id);
    }

    if (estado) {
      whereClause += ' AND v.estado = ?';
      params.push(estado);
    }

    const result = await executeQuery(`
      SELECT 
        v.*,
        r.username as reclutador_username,
        COUNT(p.id) as total_postulaciones
      FROM vacantes v
      LEFT JOIN usuarios r ON v.reclutador_id = r.id
      LEFT JOIN postulaciones p ON v.id = p.vacante_id
      WHERE ${whereClause}
      GROUP BY v.id
      ORDER BY v.fecha_publicacion DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    res.json({
      success: true,
      data: { vacantes: result.data }
    });

  } catch (error) {
    console.error('Error al obtener vacantes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router; 