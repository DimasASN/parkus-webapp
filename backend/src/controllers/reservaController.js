const prisma = require('../config/database');

/**
 * Crear una reserva (asignar lugar a un vehículo)
 */
async function crearReserva(req, res, next) {
  try {
    const { id_empresa, numero_lugar, placa_vehiculo, doc_conductor, nombre_conductor, telefono_conductor, correo_conductor, modelo_vehiculo, marca_vehiculo } =
      req.body;

    // Validaciones
    if (!id_empresa || !numero_lugar || !placa_vehiculo || !doc_conductor) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos obligatorios: id_empresa, numero_lugar, placa_vehiculo, doc_conductor',
      });
    }

    // Verificar que el lugar existe y está disponible
    const lugar = await prisma.info_lugares.findUnique({
      where: {
        id_empresa_lugar: {
          id_empresa: parseInt(id_empresa),
          lugar: parseInt(numero_lugar),
        },
      },
    });

    if (!lugar) {
      return res.status(404).json({
        success: false,
        message: 'El lugar no existe',
      });
    }

    if (lugar.id_estado !== 1) {
      // Asumiendo que 1 es "Disponible"
      return res.status(400).json({
        success: false,
        message: 'El lugar no está disponible',
      });
    }

    // Crear o actualizar conductor
    await prisma.info_conductor.upsert({
      where: { documento: doc_conductor },
      update: {
        nombre: nombre_conductor,
        telefono: telefono_conductor ? BigInt(telefono_conductor) : null,
        correo: correo_conductor,
      },
      create: {
        documento: doc_conductor,
        nombre: nombre_conductor,
        telefono: telefono_conductor ? BigInt(telefono_conductor) : null,
        correo: correo_conductor,
      },
    });

    // Crear o actualizar vehículo
    await prisma.info_auto.upsert({
      where: { placa: placa_vehiculo },
      update: {
        modelo: modelo_vehiculo,
        marca: marca_vehiculo,
        doc_conductor,
      },
      create: {
        placa: placa_vehiculo,
        modelo: modelo_vehiculo,
        marca: marca_vehiculo,
        doc_conductor,
      },
    });

    // Actualizar el lugar
    const lugarActualizado = await prisma.info_lugares.update({
      where: {
        id_empresa_lugar: {
          id_empresa: parseInt(id_empresa),
          lugar: parseInt(numero_lugar),
        },
      },
      data: {
        placa_vehiculo,
        id_estado: 2, // Asumiendo que 2 es "Ocupado"
      },
    });

    // Actualizar contadores del parqueadero
    await prisma.info_park.update({
      where: { id_empresa: parseInt(id_empresa) },
      data: {
        lug_disponibles: { decrement: 1 },
        lug_ocupados: { increment: 1 },
      },
    });

    res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente',
      data: {
        id_empresa: lugarActualizado.id_empresa,
        numero_lugar: lugarActualizado.lugar,
        placa_vehiculo: lugarActualizado.placa_vehiculo,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Liberar un lugar (finalizar reserva)
 */
async function liberarLugar(req, res, next) {
  try {
    const { id_empresa, numero_lugar } = req.body;

    if (!id_empresa || !numero_lugar) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos: id_empresa y numero_lugar son obligatorios',
      });
    }

    // Verificar que el lugar existe y está ocupado
    const lugar = await prisma.info_lugares.findUnique({
      where: {
        id_empresa_lugar: {
          id_empresa: parseInt(id_empresa),
          lugar: parseInt(numero_lugar),
        },
      },
    });

    if (!lugar) {
      return res.status(404).json({
        success: false,
        message: 'El lugar no existe',
      });
    }

    if (lugar.id_estado === 1) {
      return res.status(400).json({
        success: false,
        message: 'El lugar ya está disponible',
      });
    }

    // Liberar el lugar
    await prisma.info_lugares.update({
      where: {
        id_empresa_lugar: {
          id_empresa: parseInt(id_empresa),
          lugar: parseInt(numero_lugar),
        },
      },
      data: {
        placa_vehiculo: null,
        id_estado: 1, // Disponible
      },
    });

    // Actualizar contadores
    await prisma.info_park.update({
      where: { id_empresa: parseInt(id_empresa) },
      data: {
        lug_disponibles: { increment: 1 },
        lug_ocupados: { decrement: 1 },
      },
    });

    res.json({
      success: true,
      message: 'Lugar liberado exitosamente',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Consultar reserva por placa
 */
async function consultarReservaPorPlaca(req, res, next) {
  try {
    const { placa } = req.params;

    const reservas = await prisma.info_lugares.findMany({
      where: {
        placa_vehiculo: placa,
        id_estado: { not: 1 }, // No disponible
      },
      include: {
        empresa: true,
        estado_lugar: true,
      },
    });

    if (reservas.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron reservas activas para esta placa',
      });
    }

    const data = reservas.map((reserva) => ({
      parqueadero: reserva.empresa.nombre,
      direccion: reserva.empresa.direccion,
      numero_lugar: reserva.lugar,
      estado: reserva.estado_lugar?.descripcion,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  crearReserva,
  liberarLugar,
  consultarReservaPorPlaca,
};