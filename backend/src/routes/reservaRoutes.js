const express = require('express');
const router = express.Router();
const {
  crearReserva,
  liberarLugar,
  marcarComoOcupado,
  consultarReservaPorPlaca,
} = require('../controllers/reservaController');
const { authenticate } = require('../middlewares/auth');

/**
 * @route   POST /api/reservas
 * @desc    Crear una nueva reserva (estado: RESERVADO)
 * @access  Private
 */
router.post('/', authenticate, crearReserva);

/**
 * @route   POST /api/reservas/ocupar
 * @desc    Marcar un lugar reservado como ocupado (cuando el vehículo llega)
 * @access  Private
 */
router.post('/ocupar', authenticate, marcarComoOcupado);

/**
 * @route   POST /api/reservas/liberar
 * @desc    Liberar un lugar ocupado o reservado
 * @access  Private
 */
router.post('/liberar', authenticate, liberarLugar);

/**
 * @route   GET /api/reservas/placa/:placa
 * @desc    Consultar reservas por placa
 * @access  Public
 */
router.get('/placa/:placa', consultarReservaPorPlaca);

module.exports = router;
