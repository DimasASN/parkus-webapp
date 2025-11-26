const prisma = require('../config/database');

/**
 * Crear una reserva (asignar lugar a un vehículo)
 */
async function crearReserva(req, res, next) {
  try {
    const { 
      id_empresa, 
      numero_lugar, 
      placa_vehiculo, 
      doc_conductor, 
      nombre_conductor, 
      telefono_conductor, 
      correo_conductor, 
      modelo_vehiculo, 
      marca_vehiculo 
    } = req.body;

    console.log('🎫 Creando reserva:', {
      id_empresa,
      numero_lugar,
      placa_vehiculo,
      doc_conductor
    });

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
      // 1 = Disponible
      return res.status(400).json({
        success: false,
        message: 'El lugar no está disponible',
      });
    }

    console.log('✅ Lugar disponible, procediendo a reservar...');

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

    console.log('✅ Conductor registrado/actualizado');

    // Crear o actualizar vehículo
    await prisma.info_auto.upsert({
      where: { placa: placa_vehiculo.toUpperCase() },
      update: {
        modelo: modelo_vehiculo,
        marca: marca_vehiculo,
        doc_conductor,
      },
      create: {
        placa: placa_vehiculo.toUpperCase(),
        modelo: modelo_vehiculo,
        marca: marca_vehiculo,
        doc_conductor,
      },
    });

    console.log('✅ Vehículo registrado/actualizado');

    // ⚠️ CAMBIO IMPORTANTE: Actualizar el lugar con estado 3 (Reservado)
    const lugarActualizado = await prisma.info_lugares.update({
      where: {
        id_empresa_lugar: {
          id_empresa: parseInt(id_empresa),
          lugar: parseInt(numero_lugar),
        },
      },
      data: {
        placa_vehiculo: placa_vehiculo.toUpperCase(),
        id_estado: 3, // ✅ 3 = Reservado (antes estaba en 2)
      },
    });

    console.log('✅ Lugar actualizado a RESERVADO (estado 3)');

    // Actualizar contadores del parqueadero
    await prisma.info_park.update({
      where: { id_empresa: parseInt(id_empresa) },
      data: {
        lug_disponibles: { decrement: 1 },
        lug_ocupados: { increment: 1 },
      },
    });

    console.log('✅ Contadores actualizados');
    console.log('🎉 Reserva creada exitosamente');

    res.status(201).json({
      success: true,
      message: 'Reserva creada exitosamente',
      data: {
        id_empresa: lugarActualizado.id_empresa,
        numero_lugar: lugarActualizado.lugar,
        placa_vehiculo: lugarActualizado.placa_vehiculo,
        estado: 'Reservado', // Estado textual
        estado_id: 3,
      },
    });
  } catch (error) {
    console.error('❌ Error creando reserva:', error);
    next(error);
  }
}

/**
 * Liberar un lugar (finalizar reserva)
 */
async function liberarLugar(req, res, next) {
  try {
    const { id_empresa, numero_lugar } = req.body;

    console.log('🔓 Liberando lugar:', { id_empresa, numero_lugar });

    if (!id_empresa || !numero_lugar) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos: id_empresa y numero_lugar son obligatorios',
      });
    }

    // Verificar que el lugar existe y está ocupado o reservado
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

    // ✅ MEJORA: Permitir liberar tanto si está Ocupado (2) como Reservado (3)
    if (lugar.id_estado === 1) {
      return res.status(400).json({
        success: false,
        message: 'El lugar ya está disponible',
      });
    }

    console.log(`✅ Liberando lugar en estado ${lugar.id_estado}`);

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

    console.log('✅ Lugar liberado');

    // Actualizar contadores
    await prisma.info_park.update({
      where: { id_empresa: parseInt(id_empresa) },
      data: {
        lug_disponibles: { increment: 1 },
        lug_ocupados: { decrement: 1 },
      },
    });

    console.log('✅ Contadores actualizados');
    console.log('🎉 Lugar liberado exitosamente');

    res.json({
      success: true,
      message: 'Lugar liberado exitosamente',
      data: {
        id_empresa: parseInt(id_empresa),
        numero_lugar: parseInt(numero_lugar),
        estado: 'Disponible',
      },
    });
  } catch (error) {
    console.error('❌ Error liberando lugar:', error);
    next(error);
  }
}

/**
 * Marcar lugar como ocupado (cuando el vehículo llega físicamente)
 */
async function marcarComoOcupado(req, res, next) {
  try {
    const { id_empresa, numero_lugar } = req.body;

    console.log('🚗 Marcando lugar como ocupado:', { id_empresa, numero_lugar });

    if (!id_empresa || !numero_lugar) {
      return res.status(400).json({
        success: false,
        message: 'Faltan datos: id_empresa y numero_lugar son obligatorios',
      });
    }

    // Verificar que el lugar existe y está reservado
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

    if (lugar.id_estado !== 3) {
      // 3 = Reservado
      return res.status(400).json({
        success: false,
        message: 'Solo se pueden marcar como ocupados los lugares reservados',
      });
    }

    // Actualizar estado a Ocupado
    await prisma.info_lugares.update({
      where: {
        id_empresa_lugar: {
          id_empresa: parseInt(id_empresa),
          lugar: parseInt(numero_lugar),
        },
      },
      data: {
        id_estado: 2, // ✅ 2 = Ocupado
      },
    });

    console.log('✅ Lugar marcado como OCUPADO (estado 2)');
    console.log('🎉 Estado actualizado exitosamente');

    res.json({
      success: true,
      message: 'Lugar marcado como ocupado exitosamente',
      data: {
        id_empresa: parseInt(id_empresa),
        numero_lugar: parseInt(numero_lugar),
        estado: 'Ocupado',
        estado_id: 2,
      },
    });
  } catch (error) {
    console.error('❌ Error marcando como ocupado:', error);
    next(error);
  }
}

/**
 * Consultar reserva por placa
 */
async function consultarReservaPorPlaca(req, res, next) {
  try {
    const { placa } = req.params;

    console.log('🔍 Consultando reservas para placa:', placa);

    const reservas = await prisma.info_lugares.findMany({
      where: {
        placa_vehiculo: placa.toUpperCase(),
        id_estado: { not: 1 }, // No disponible (incluye Reservado y Ocupado)
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

    console.log(`✅ Encontradas ${reservas.length} reserva(s)`);

    const data = reservas.map((reserva) => ({
      parqueadero: reserva.empresa.nombre,
      direccion: reserva.empresa.direccion,
      numero_lugar: reserva.lugar,
      estado: reserva.estado_lugar?.descripcion,
      placa_vehiculo: reserva.placa_vehiculo,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('❌ Error consultando reserva:', error);
    next(error);
  }
}

module.exports = {
  crearReserva,
  liberarLugar,
  marcarComoOcupado, // ✅ Nueva función exportada
  consultarReservaPorPlaca,
};
