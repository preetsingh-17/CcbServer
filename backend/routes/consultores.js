const express = require('express');
const { body, validationResult, param } = require('express-validator');
const { executeQuery, executeTransaction } = require('../config/database');
const { authenticateToken, requireGestora, requireConsultorOrGestora } = require('../middleware/auth');

const router = express.Router();

// GET /api/consultores - Obtener todos los consultores
router.get('/', authenticateToken, requireConsultorOrGestora, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', activo } = req.query;
    const offset = (page - 1) * limit;

    let whereClause = '1=1';
    let params = [];

    // Filtro por búsqueda
    if (search) {
      whereClause += ' AND (c.nombre LIKE ? OR c.apellido LIKE ? OR c.cedula LIKE ? OR c.especialidad LIKE ?)';
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam, searchParam);
    }

    // Filtro por estado activo
    if (activo !== undefined) {
      whereClause += ' AND c.activo = ?';
      params.push(activo === 'true');
    }

    // Consulta principal con información del usuario
    const query = `
      SELECT 
        c.*,
        u.username,
        u.email,
        u.activo as usuario_activo
      FROM consultores c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      WHERE ${whereClause}
      ORDER BY c.nombre, c.apellido
      LIMIT ? OFFSET ?
    `;

    // Consulta para contar total
    const countQuery = `
      SELECT COUNT(*) as total
      FROM consultores c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      WHERE ${whereClause}
    `;

    const [result, countResult] = await Promise.all([
      executeQuery(query, [...params, parseInt(limit), parseInt(offset)]),
      executeQuery(countQuery, params)
    ]);

    if (!result.success || !countResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener consultores',
        error: 'DATABASE_ERROR'
      });
    }

    const total = countResult.data[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      data: {
        consultores: result.data,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalItems: total,
          itemsPerPage: parseInt(limit)
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener consultores:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/consultores/:id - Obtener consultor por ID
router.get('/:id', [
  param('id').isInt().withMessage('ID debe ser un número entero')
], authenticateToken, requireConsultorOrGestora, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: errors.array()
      });
    }

    const { id } = req.params;

    const result = await executeQuery(`
      SELECT 
        c.*,
        u.username,
        u.email,
        u.activo as usuario_activo
      FROM consultores c
      LEFT JOIN usuarios u ON c.usuario_id = u.id
      WHERE c.id = ?
    `, [id]);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: 'Error al obtener consultor',
        error: 'DATABASE_ERROR'
      });
    }

    if (result.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consultor no encontrado',
        error: 'NOT_FOUND'
      });
    }

    res.json({
      success: true,
      data: {
        consultor: result.data[0]
      }
    });

  } catch (error) {
    console.error('Error al obtener consultor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/consultores - Crear nuevo consultor
router.post('/', [
  body('cedula').notEmpty().withMessage('La cédula es requerida'),
  body('nombre').notEmpty().withMessage('El nombre es requerido'),
  body('apellido').notEmpty().withMessage('El apellido es requerido'),
  body('telefono').optional().isMobilePhone().withMessage('Teléfono inválido'),
  body('email').isEmail().withMessage('Email inválido'),
  body('especialidad').optional().isString(),
  body('tarifa_hora').optional().isFloat({ min: 0 }).withMessage('Tarifa debe ser un número positivo')
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
      cedula,
      nombre,
      apellido,
      telefono,
      direccion,
      fecha_nacimiento,
      especialidad,
      tarifa_hora,
      email
    } = req.body;

    // Verificar si ya existe un consultor con esa cédula
    const existingResult = await executeQuery(
      'SELECT id FROM consultores WHERE cedula = ?',
      [cedula]
    );

    if (existingResult.success && existingResult.data.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un consultor con esa cédula',
        error: 'CEDULA_EXISTS'
      });
    }

    // Crear consultor
    const insertResult = await executeQuery(`
      INSERT INTO consultores (
        cedula, nombre, apellido, telefono, direccion, 
        fecha_nacimiento, especialidad, tarifa_hora
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      cedula, nombre, apellido, telefono, direccion,
      fecha_nacimiento, especialidad, tarifa_hora
    ]);

    if (!insertResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Error al crear consultor',
        error: 'DATABASE_ERROR'
      });
    }

    // Obtener el consultor creado
    const newConsultorResult = await executeQuery(
      'SELECT * FROM consultores WHERE id = ?',
      [insertResult.data.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Consultor creado exitosamente',
      data: {
        consultor: newConsultorResult.data[0]
      }
    });

  } catch (error) {
    console.error('Error al crear consultor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// PUT /api/consultores/:id - Actualizar consultor
router.put('/:id', [
  param('id').isInt().withMessage('ID debe ser un número entero'),
  body('cedula').optional().notEmpty().withMessage('La cédula no puede estar vacía'),
  body('nombre').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
  body('apellido').optional().notEmpty().withMessage('El apellido no puede estar vacío'),
  body('telefono').optional().isMobilePhone().withMessage('Teléfono inválido'),
  body('especialidad').optional().isString(),
  body('tarifa_hora').optional().isFloat({ min: 0 }).withMessage('Tarifa debe ser un número positivo')
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

    const { id } = req.params;
    const updateData = req.body;

    // Verificar que el consultor existe
    const existingResult = await executeQuery(
      'SELECT id FROM consultores WHERE id = ?',
      [id]
    );

    if (!existingResult.success || existingResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consultor no encontrado',
        error: 'NOT_FOUND'
      });
    }

    // Construir query de actualización dinámicamente
    const fields = [];
    const values = [];

    Object.keys(updateData).forEach(key => {
      if (updateData[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });

    if (fields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay datos para actualizar',
        error: 'NO_UPDATE_DATA'
      });
    }

    values.push(id);

    const updateResult = await executeQuery(`
      UPDATE consultores 
      SET ${fields.join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP
      WHERE id = ?
    `, values);

    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Error al actualizar consultor',
        error: 'DATABASE_ERROR'
      });
    }

    // Obtener consultor actualizado
    const updatedResult = await executeQuery(
      'SELECT * FROM consultores WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Consultor actualizado exitosamente',
      data: {
        consultor: updatedResult.data[0]
      }
    });

  } catch (error) {
    console.error('Error al actualizar consultor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// DELETE /api/consultores/:id - Eliminar (desactivar) consultor
router.delete('/:id', [
  param('id').isInt().withMessage('ID debe ser un número entero')
], authenticateToken, requireGestora, async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Parámetros inválidos',
        errors: errors.array()
      });
    }

    const { id } = req.params;

    // Verificar que el consultor existe
    const existingResult = await executeQuery(
      'SELECT id FROM consultores WHERE id = ?',
      [id]
    );

    if (!existingResult.success || existingResult.data.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Consultor no encontrado',
        error: 'NOT_FOUND'
      });
    }

    // Desactivar en lugar de eliminar
    const updateResult = await executeQuery(
      'UPDATE consultores SET activo = FALSE WHERE id = ?',
      [id]
    );

    if (!updateResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Error al desactivar consultor',
        error: 'DATABASE_ERROR'
      });
    }

    res.json({
      success: true,
      message: 'Consultor desactivado exitosamente'
    });

  } catch (error) {
    console.error('Error al desactivar consultor:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router; 