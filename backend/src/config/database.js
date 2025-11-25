const { PrismaClient } = require('@prisma/client');

// Instancia única de Prisma Client
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Manejo de desconexión al cerrar la aplicación
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

module.exports = prisma;