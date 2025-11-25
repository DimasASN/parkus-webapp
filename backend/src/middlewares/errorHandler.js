/**
 * Middleware global para manejo de errores
 */
function errorHandler(err, req, res, next) {
    console.error('Error:', err);
  
    // Error de Prisma - registro duplicado
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Ya existe un registro con esos datos',
        field: err.meta?.target,
      });
    }
  
    // Error de Prisma - registro no encontrado
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Registro no encontrado',
      });
    }
  
    // Error de validación
    if (err.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: 'Error de validación',
        errors: err.errors,
      });
    }
  
    // Error por defecto
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Error interno del servidor',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    });
  }
  
  module.exports = errorHandler;