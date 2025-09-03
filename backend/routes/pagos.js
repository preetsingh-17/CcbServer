const express = require('express');
const { executeQuery } = require('../config/database');
const { authenticateToken, requireGestora, requireConsultorOrGestora } = require('../middleware/auth');

const router = express.Router();

// GET /api/pagos - Obtener pagos
router.get('/', authenticateToken, requireConsultorOrGestora, async (req, res) => {
  try {
    const { consultor_id, estado } = req.query;
    
    let whereClause = '1=1';
    let params = [];

    if (req.user.rol === 'consultor') {
      // Si es consultor, solo ver sus pagos
      const consultorResult = await executeQuery(
        'SELECT id FROM consultores WHERE usuario_id = ?',
        [req.user.id]
      );
      
      if (consultorResult.success && consultorResult.data.length > 0) {
        whereClause += ' AND p.consultor_id = ?';
        params.push(consultorResult.data[0].id);
      }
    } else if (consultor_id) {
      whereClause += ' AND p.consultor_id = ?';
      params.push(consultor_id);
    }

    if (estado) {
      whereClause += ' AND p.estado = ?';
      params.push(estado);
    }

    const result = await executeQuery(`
      SELECT 
        p.*,
        c.nombre as consultor_nombre,
        c.apellido as consultor_apellido,
        e.titulo as evento_titulo
      FROM pagos p
      LEFT JOIN consultores c ON p.consultor_id = c.id
      LEFT JOIN eventos e ON p.evento_id = e.id
      WHERE ${whereClause}
      ORDER BY p.fecha_pago DESC
    `, params);

    res.json({
      success: true,
      data: { pagos: result.data }
    });

  } catch (error) {
    console.error('Error al obtener pagos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

module.exports = router; 