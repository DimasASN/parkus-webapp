const express = require('express');
const router = express.Router();
const {
  getAllParqueaderos,
  getParqueaderoById,
  getLugaresDisponibles,
} = require('../controllers/parqueaderoController');

/**
 * @route   GET /api/parqueaderos
 * @desc    Obtener todos los parqueaderos
 * @access  Public
 */
router.get('/', getAllParqueaderos);

/**
 * @route   GET /api/parqueaderos/:id
 * @desc    Obtener información detallada de un parqueadero
 * @access  Public
 */
router.get('/:id', getParqueaderoById);

/**
 * @route   GET /api/parqueaderos/:id/disponibles
 * @desc    Obtener lugares disponibles de un parqueadero
 * @access  Public
 */
router.get('/:id/disponibles', getLugaresDisponibles);

module.exports = router;