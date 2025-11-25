const { verifyToken } = require('../utils/jwt');

/**
 * Middleware de autenticación JWT
 * Verifica que el usuario esté autenticado
 */
function authenticate(req, res, next) {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No se proporcionó token de autenticación',
      });
    }

    const token = authHeader.substring(7); // Remover "Bearer "

    // Verificar token
    const decoded = verifyToken(token);

    // Agregar información del usuario a la request
    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
      error: error.message,
    });
  }
}

/**
 * Middleware para verificar tipo de usuario
 * @param {number[]} allowedTypes - Array de IDs de tipos permitidos
 */
function authorize(...allowedTypes) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no autenticado',
      });
    }

    if (!allowedTypes.includes(req.user.id_tipo_usuario)) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para acceder a este recurso',
      });
    }

    next();
  };
}

module.exports = {
  authenticate,
  authorize,
};
