const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { executeQuery } = require('../config/database');
const { authenticateToken, requireGestora, requireConsultorOrGestora } = require('../middleware/auth');

const router = express.Router();

// GET /api/eventos - Obtener todos los eventos
router.get('/', authenticateToken, requireConsultorOrGestora, async (req, res) => {
  try {
    const { page = 1, limit = 10, estado, consultor_id } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    let params = [];

    if (estado) {
      whereClause += ' AND e.estado = ?';
      params.push(estado);
    }

    if (consultor_id) {
      whereClause += ' AND e.consultor_id = ?';
      params.push(consultor_id);
    }

    // Si es consultor, solo ver sus eventos
    if (req.user.rol === 'consultor') {
      const consultorResult = await executeQuery(
        'SELECT id FROM consultores WHERE usuario_id = ?',
        [req.user.id]
      );
      
      if (consultorResult.success && consultorResult.data.length > 0) {
        whereClause += ' AND e.consultor_id = ?';
        params.push(consultorResult.data[0].id);
      }
    }

    const query = `
      SELECT 
        e.*,
        c.nombre as consultor_nombre,
        c.apellido as consultor_apellido,
        c.cedula as consultor_cedula,
        g.username as gestora_username
      FROM eventos e
      LEFT JOIN consultores c ON e.consultor_id = c.id
      LEFT JOIN usuarios g ON e.gestora_id = g.id
      WHERE ${whereClause}
      ORDER BY e.fecha_inicio DESC
      LIMIT ? OFFSET ?
    `;

    const result = await executeQuery(query, [...params, parseInt(limit), parseInt(offset)]);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener eventos',
        error: 'DATABASE_ERROR'
      });
    }

    res.json({
      success: true,
      data: {
        eventos: result.data
      }
    });

  } catch (error) {
    console.error('Error al obtener eventos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/eventos - Crear nuevo evento
router.post('/', [
  body('titulo').notEmpty().withMessage('El título es requerido'),
  body('fecha_inicio').isISO8601().withMessage('Fecha de inicio inválida'),
  body('fecha_fin').isISO8601().withMessage('Fecha de fin inválida'),
  body('consultor_id').optional().isInt().withMessage('ID de consultor inválido')
], authenticateToken, requireGestora, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos inválidos',
        errors: errors.array()
      });
    }

    const {
      titulo, descripcion, fecha_inicio, fecha_fin, lugar,
      tipo_evento, consultor_id, max_participantes, presupuesto
    } = req.body;

    const insertResult = await executeQuery(`
      INSERT INTO eventos (
        titulo, descripcion, fecha_inicio, fecha_fin, lugar,
        tipo_evento, consultor_id, gestora_id, max_participantes, presupuesto
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      titulo, descripcion, fecha_inicio, fecha_fin, lugar,
      tipo_evento, consultor_id, req.user.id, max_participantes, presupuesto
    ]);

    if (!insertResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Error al crear evento',
        error: 'DATABASE_ERROR'
      });
    }

    res.status(201).json({
      success: true,
      message: 'Evento creado exitosamente',
      data: {
        evento_id: insertResult.data.insertId
      }
    });

  } catch (error) {
    console.error('Error al crear evento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router; 