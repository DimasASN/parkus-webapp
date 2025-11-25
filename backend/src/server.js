const express = require('express');
const cors = require('cors');
const app = require('./app'); // <--- IMPORTA LA INSTANCIA DE EXPRESS CORRECTAMENTE
const prisma = require('./config/database');

// 🚨 SOLUCIÓN CORS: Usar tu URL pública como origen permitido
const FRONTEND_URL = 'https://courageous-contentment-production-eaff.up.railway.app'; 

// 1. APLICAR CORS AL OBJETO 'app' (ANTES DE INICIAR EL SERVIDOR)
app.use(cors({
    origin: FRONTEND_URL, 
    credentials: true 
}));

const PORT = process.env.PORT || 3000;

// Función para iniciar el servidor
async function startServer() {
    try {
        // Verificar conexión a la base de datos
        await prisma.$connect();
        console.log('✅ Conexión exitosa a la base de datos');

        // 2. Iniciar servidor usando la aplicación con CORS aplicado
        const server = app.listen(PORT, () => {
            console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
            console.log(`📍 Entorno: ${process.env.NODE_ENV || 'development'}`);
            console.log(`🌐 URL: http://localhost:${PORT}`);
            console.log(`📚 API Docs: http://localhost:${PORT}/api`);
        });

        // Manejo de señales para cerrar el servidor limpiamente (restaurado)
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