const app = require('./app');
const prisma = require('./config/database');

const PORT = process.env.PORT || 3000;

// Función para iniciar el servidor
async function startServer() {
  try {
    // Verificar conexión a la base de datos
    await prisma.$connect();
    console.log('✅ Conexión exitosa a la base de datos');

    // Iniciar servidor
    const server = app.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
      console.log(`📍 Entorno: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🌐 URL: http://localhost:${PORT}`);
      console.log(`📚 API Docs: http://localhost:${PORT}/api`);
    });

    // Manejo de señales para cerrar el servidor limpiamente
    process.on('SIGTERM', async () => {
      console.log('SIGTERM recibido. Cerrando servidor...');
      await prisma.$disconnect();
      server.close(() => {
        console.log('Servidor cerrado');
        process.exit(0);
      });
    });

    process.on('SIGINT', async () => {
      console.log('\nSIGINT recibido. Cerrando servidor...');
      await prisma.$disconnect();
      server.close(() => {
        console.log('Servidor cerrado');
        process.exit(0);
      });
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Iniciar servidor
startServer();