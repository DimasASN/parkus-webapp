const bcrypt = require('bcryptjs');

/**
 * Hashea una contraseña
 * @param {string} password - Contraseña en texto plano
 * @returns {Promise<string>} Contraseña hasheada
 */
async function hashPassword(password) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

/**
 * Compara una contraseña con su hash
 * @param {string} password - Contraseña en texto plano
 * @param {string} hash - Hash almacenado
 * @returns {Promise<boolean>} True si coinciden
 */
async function comparePassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

module.exports = {
  hashPassword,
  comparePassword,
};