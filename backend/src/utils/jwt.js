const jwt = require('jsonwebtoken');

/**
 * Genera un token JWT
 * @param {Object} payload - Datos a incluir en el token
 * @returns {string} Token JWT
 */
function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}

/**
 * Verifica un token JWT
 * @param {string} token - Token a verificar
 * @returns {Object} Payload decodificado
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    throw new Error('Token inválido o expirado');
  }
}

module.exports = {
  generateToken,
  verifyToken,
};