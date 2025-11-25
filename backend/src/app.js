const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config();

const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');

// Crear aplicación Express
const app = express();

// Configuración de CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  optionsSuccessStatus: 200,
};

// Middlewares globales
app.use(helmet()); // Seguridad HTTP headers
app.use(cors(corsOptions)); // CORS
app.use(morgan('dev')); // Logs de requests
app.use(express.json()); // Parse JSON
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded

// Conversión de BigInt a string para JSON
BigInt.prototype.toJSON = function () {
  return this.toString();
};

// Rutas principales
app.use('/api', routes);

// Ruta raíz
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Bienvenido a ParkUS API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      auth: {
        register: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        profile: 'GET /api/auth/profile',
      },
      parqueaderos: {
        getAll: 'GET /api/parqueaderos',
        getById: 'GET /api/parqueaderos/:id',
        getDisponibles: 'GET /api/parqueaderos/:id/disponibles',
      },
      reservas: {
        crear: 'POST /api/reservas',
        liberar: 'POST /api/reservas/liberar',
        consultarPorPlaca: 'GET /api/reservas/placa/:placa',
      },
    },
  });
});

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada',
  });
});

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

module.exports = app;
