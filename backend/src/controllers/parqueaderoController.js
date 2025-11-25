const prisma = require('../config/database');

/**
 * Obtener todos los parqueaderos disponibles
 */
async function getAllParqueaderos(req, res, next) {
  try {
    const parqueaderos = await prisma.empresa.findMany({
      include: {
        info_park: true,
      },
      where: {
        info_park: {
          isNot: null, // Solo empresas que tienen parqueadero
        },
      },
    });

    // Convertir BigInt a string para JSON
    const data = parqueaderos.map((park) => ({
      id_empresa: park.id_empresa,
      nombre: park.nombre,
      nit: park.nit ? park.nit.toString() : null,
      telefono: park.telefono ? park.telefono.toString() : null,
      direccion: park.direccion,
      descripcion: park.descripcion,
      info_parqueadero: park.info_park
        ? {
            cantidad_lugares: park.info_park.cantidad_lugares,
            precio_lugar: park.info_park.precio_lugar ? parseFloat(park.info_park.precio_lugar) : null,
            lug_disponibles: park.info_park.lug_disponibles,
            lug_ocupados: park.info_park.lug_ocupados,
          }
        : null,
    }));

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener información de un parqueadero específico
 */
async function getParqueaderoById(req, res, next) {
  try {
    const { id } = req.params;

    const parqueadero = await prisma.empresa.findUnique({
      where: { id_empresa: parseInt(id) },
      include: {
        info_park: true,
        info_lugares: {
          include: {
            estado_lugar: true,
          },
        },
      },
    });

    if (!parqueadero) {
      return res.status(404).json({
        success: false,
        message: 'Parqueadero no encontrado',
      });
    }

    // Formatear datos
    const data = {
      id_empresa: parqueadero.id_empresa,
      nombre: parqueadero.nombre,
      nit: parqueadero.nit ? parqueadero.nit.toString() : null,
      telefono: parqueadero.telefono ? parqueadero.telefono.toString() : null,
      direccion: parqueadero.direccion,
      descripcion: parqueadero.descripcion,
      info_parqueadero: parqueadero.info_park
        ? {
            cantidad_lugares: parqueadero.info_park.cantidad_lugares,
            precio_lugar: parqueadero.info_park.precio_lugar
              ? parseFloat(parqueadero.info_park.precio_lugar)
              : null,
            lug_disponibles: parqueadero.info_park.lug_disponibles,
            lug_ocupados: parqueadero.info_park.lug_ocupados,
          }
        : null,
      lugares: parqueadero.info_lugares.map((lugar) => ({
        numero_lugar: lugar.lugar,
        placa_vehiculo: lugar.placa_vehiculo,
        estado: lugar.estado_lugar?.descripcion || 'Sin estado',
      })),
    };

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener lugares disponibles de un parqueadero
 */
async function getLugaresDisponibles(req, res, next) {
  try {
    const { id } = req.params;

    const lugaresDisponibles = await prisma.info_lugares.findMany({
      where: {
        id_empresa: parseInt(id),
        id_estado: 1, // Asumiendo que 1 es "Disponible"
      },
      include: {
        estado_lugar: true,
      },
    });

    res.json({
      success: true,
      data: lugaresDisponibles.map((lugar) => ({
        numero_lugar: lugar.lugar,
        estado: lugar.estado_lugar?.descripcion,
      })),
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllParqueaderos,
  getParqueaderoById,
  getLugaresDisponibles,
};