const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const { executeQuery } = require('../config/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Función para generar JWT
const generateToken = (userId, email, tipo) => {
  return jwt.sign(
    { userId, email, tipo },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// Mapeo de tipos de usuario para compatibilidad con el frontend
const mapUserType = (usu_tipo) => {
  const typeMap = {
    'Administrador': 'gestora',
    'Consultor': 'consultor', 
    'Profesional': 'gestora', // Profesional también como consultor
    'Reclutador': 'reclutador'
  };
  return typeMap[usu_tipo] || 'consultor';
};

// POST /api/auth/login - Iniciar sesión
router.post('/login', [
  body('username').notEmpty().withMessage('El email es requerido'),
  body('password').isLength({ min: 1 }).withMessage('La contraseña es requerida'),
  body('selectedRole').isIn(['gestora', 'consultor', 'reclutador']).withMessage('Rol inválido')
], async (req, res) => {
  try {
    // Validar entrada
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: errors.array()
      });
    }

    const { username, password, selectedRole } = req.body;

    // Buscar usuario en la base de datos por email
    const result = await executeQuery(
      `SELECT c.usu_id, c.usu_correo, c.usu_contraseña, c.usu_tipo, c.usu_activo, ui.usu_cedula
       FROM cuentas c
       LEFT JOIN usuarios_info ui ON c.usu_id = ui.usu_id
       WHERE c.usu_correo = ? AND c.usu_activo = 1`,
      [username]
    );

    if (!result.success || result.data.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas',
        error: 'INVALID_CREDENTIALS'
      });
    }

    const user = result.data[0];

    // Verificar contraseña - primero intentar como texto plano (para las passwords 12345)
    let isPasswordValid = false;
    
    if (user.usu_contraseña === password) {
      // Contraseña en texto plano coincide
      isPasswordValid = true;
    } else {
      // Intentar comparar como hash bcrypt
      try {
        isPasswordValid = await bcrypt.compare(password, user.usu_contraseña);
      } catch (error) {
        isPasswordValid = false;
      }
    }

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales incorrectas',
        error: 'INVALID_CREDENTIALS'
      });
    }

    // Mapear el tipo de usuario de la BD al tipo esperado por el frontend
    const mappedRole = mapUserType(user.usu_tipo);

    // Verificar que el rol seleccionado coincida con el rol del usuario
    if (mappedRole !== selectedRole) {
      return res.status(403).json({
        success: false,
        message: `Este usuario es de tipo '${user.usu_tipo}' y no tiene permisos para el rol '${selectedRole}'`,
        error: 'ROLE_MISMATCH'
      });
    }

    // Generar token JWT
    const token = generateToken(user.usu_id, user.usu_correo, mappedRole);

    // Datos adicionales según el rol
    let additionalData = {};
    
    if (mappedRole === 'consultor') {
      // Buscar información adicional del consultor
      additionalData.consultorInfo = {
        id: user.usu_id,
        email: user.usu_correo,
        tipo: user.usu_tipo
      };
    }

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        token,
        user: {
          id: user.usu_id,
          username: user.usu_correo,
          email: user.usu_correo,
          rol: mappedRole,
          tipo_original: user.usu_tipo,
          usu_cedula: user.usu_cedula
        },
        ...additionalData
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/auth/verify - Verificar token
router.post('/verify', authenticateToken, async (req, res) => {
  try {
    // Si llegamos aquí, el token es válido (verificado por el middleware)
    let additionalData = {};
    
    if (req.user.rol === 'consultor') {
      // Buscar información adicional del consultor
      additionalData.consultorInfo = {
        id: req.user.id,
        email: req.user.email
      };
    }

    res.json({
      success: true,
      message: 'Token válido',
      data: {
        user: req.user,
        ...additionalData
      }
    });
  } catch (error) {
    console.error('Error en verify:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    res.json({
      success: true,
      message: 'Sesión cerrada exitosamente'
    });
  } catch (error) {
    console.error('Error en logout:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

// GET /api/auth/me - Obtener información del usuario actual
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Obtener la cédula desde usuarios_info
    const userResult = await executeQuery(
      `SELECT c.usu_id, c.usu_correo, c.usu_tipo, ui.usu_cedula
       FROM cuentas c
       LEFT JOIN usuarios_info ui ON c.usu_id = ui.usu_id
       WHERE c.usu_id = ?`,
      [req.user.id]
    );

    let user = req.user;
    if (userResult.success && userResult.data.length > 0) {
      user = {
        ...user,
        usu_cedula: userResult.data[0].usu_cedula
      };
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('Error en /me:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
});

module.exports = router; 