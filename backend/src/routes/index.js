const express = require('express');
const router = express.Router();

const authRoutes = require('./authRoutes');
const parqueaderoRoutes = require('./parqueaderoRoutes');
const reservaRoutes = require('./reservaRoutes');

// Rutas principales
router.use('/auth', authRoutes);
router.use('/parqueaderos', parqueaderoRoutes);
router.use('/reservas', reservaRoutes);

// Ruta de health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'API ParkUS funcionando correctamente',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;