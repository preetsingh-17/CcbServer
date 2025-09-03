const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

// Mapeo de tipos de usuario para compatibilidad
const mapUserType = (usu_tipo) => {
  const typeMap = {
    'Administrador': 'gestora',
    'Consultor': 'consultor', 
    'Profesional': 'gestora',
    'Reclutador': 'reclutador'
  };
  return typeMap[usu_tipo] || 'consultor';
};

// Middleware para verificar JWT
const authenticateToken = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        message: 'Token de acceso requerido',
        error: 'UNAUTHORIZED'
      });
    }

    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar el usuario en la base de datos para asegurar que sigue activo
    const result = await executeQuery(
      `SELECT c.usu_id, c.usu_correo, c.usu_tipo, c.usu_activo, ui.usu_cedula
       FROM cuentas c
       LEFT JOIN usuarios_info ui ON c.usu_id = ui.usu_id
       WHERE c.usu_id = ? AND c.usu_activo = 1`,
      [decoded.userId]
    );

    if (!result.success || result.data.length === 0) {
      return res.status(401).json({
        message: 'Usuario no válido o inactivo',
        error: 'UNAUTHORIZED'
      });
    }

    // Agregar información del usuario al request
    const user = result.data[0];
    req.user = {
            id: user.usu_id,
            username: user.usu_correo,
            email: user.usu_correo,
            rol: mapUserType(user.usu_tipo),
            tipo_original: user.usu_tipo,
            usu_cedula: user.usu_cedula // <-- ¡LA CÉDULA AHORA ESTÁ AQUÍ!
          };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        message: 'Token inválido',
        error: 'INVALID_TOKEN'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        message: 'Token expirado',
        error: 'TOKEN_EXPIRED'
      });
    }

    console.error('Error en autenticación:', error);
    return res.status(500).json({
      message: 'Error interno del servidor',
      error: 'INTERNAL_ERROR'
    });
  }
};

// Middleware para verificar roles específicos
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        message: 'Usuario no autenticado',
        error: 'UNAUTHORIZED'
      });
    }

    // Convertir a array si es un string
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(req.user.rol)) {
      return res.status(403).json({
        message: `Acceso denegado. Se requiere rol: ${roles.join(' o ')}. Tu rol es: ${req.user.rol} (${req.user.tipo_original})`,
        error: 'FORBIDDEN'
      });
    }

    next();
  };
};

// Middleware para verificar si el usuario es gestora (Administrador)
const requireGestora = requireRole(['gestora']);

// Middleware para verificar si el usuario es consultor
const requireConsultor = requireRole(['consultor']);

// Middleware para verificar si el usuario es reclutador
const requireReclutador = requireRole(['reclutador']);

// Middleware para verificar si el usuario es consultor o gestora
const requireConsultorOrGestora = requireRole(['consultor', 'gestora']);

module.exports = {
  authenticateToken,
  requireRole,
  requireGestora,
  requireConsultor,
  requireReclutador,
  requireConsultorOrGestora
}; 