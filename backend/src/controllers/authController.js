const prisma = require('../config/database');
const { generateToken } = require('../utils/jwt');

/**
 * Registrar un nuevo usuario (SIN hasheo)
 */
async function register(req, res, next) {
  try {
    const { username, nombre, password, telefono, correo, id_tipo_usuario, id_empresa } = req.body;

    // Validaciones básicas
    if (!username || !password || !correo) {
      return res.status(400).json({
        success: false,
        message: 'Username, password y correo son obligatorios',
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await prisma.usuario.findUnique({
      where: { username },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'El username ya está en uso',
      });
    }

    // Crear usuario (contraseña sin hashear)
    const newUser = await prisma.usuario.create({
      data: {
        username,
        nombre,
        password, // ← SIN hashear
        telefono: telefono ? BigInt(telefono) : null,
        correo,
        id_tipo_usuario: id_tipo_usuario || 2,
        id_empresa: id_empresa || null,
      },
      select: {
        username: true,
        nombre: true,
        correo: true,
        telefono: true,
        id_tipo_usuario: true,
        id_empresa: true,
      },
    });

    // Convertir BigInt a string para JSON
    const userData = {
      ...newUser,
      telefono: newUser.telefono ? newUser.telefono.toString() : null,
    };

    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: userData,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Iniciar sesión (SIN hasheo)
 */
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    // Validaciones
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username y password son obligatorios',
      });
    }

    // Buscar usuario
    const user = await prisma.usuario.findUnique({
      where: { username },
      include: {
        tipo_usuario: true,
        empresa: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Verificar contraseña (comparación directa, sin bcrypt)
    if (password !== user.password) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Generar token
    const token = generateToken({
      username: user.username,
      id_tipo_usuario: user.id_tipo_usuario,
      id_empresa: user.id_empresa,
    });

    // Preparar datos del usuario
    const userData = {
      username: user.username,
      nombre: user.nombre,
      correo: user.correo,
      telefono: user.telefono ? user.telefono.toString() : null,
      tipo_usuario: user.tipo_usuario?.nombre,
      empresa: user.empresa?.nombre,
    };

    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        user: userData,
        token,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Obtener perfil del usuario autenticado
 */
async function getProfile(req, res, next) {
  try {
    const user = await prisma.usuario.findUnique({
      where: { username: req.user.username },
      include: {
        tipo_usuario: true,
        empresa: true,
      },
      select: {
        username: true,
        nombre: true,
        correo: true,
        telefono: true,
        tipo_usuario: {
          select: {
            nombre: true,
          },
        },
        empresa: {
          select: {
            id_empresa: true,
            nombre: true,
            direccion: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    const userData = {
      ...user,
      telefono: user.telefono ? user.telefono.toString() : null,
    };

    res.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  register,
  login,
  getProfile,
};