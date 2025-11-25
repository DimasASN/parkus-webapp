const prisma = require('../config/database');
const { generateToken } = require('../utils/jwt');

/**
 * Registrar un nuevo usuario (SIN hasheo)
 */
async function register(req, res, next) {
  try {
    const { username, nombre, password, telefono, correo, id_tipo_usuario, id_empresa } = req.body;

    console.log('📥 Datos recibidos en registro:', req.body);

    // Validaciones básicas
    if (!username || !password || !correo || !nombre) {
      return res.status(400).json({
        success: false,
        message: 'Username, nombre, password y correo son obligatorios',
      });
    }

    // Validar formato de correo
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(correo)) {
      return res.status(400).json({
        success: false,
        message: 'El formato del correo no es válido',
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

    // ✅ IMPORTANTE: Usuarios de la web siempre son tipo 3 (Cliente)
    const tipoUsuario = id_tipo_usuario || 3;
    
    // Preparar datos para insertar
    const datosUsuario = {
      username: username.toLowerCase(), // Asegurar minúsculas
      nombre,
      password, // ← SIN hashear (como está actualmente)
      telefono: telefono ? BigInt(telefono) : null,
      correo,
      id_tipo_usuario: tipoUsuario, // ✅ Por defecto tipo 3 (Cliente)
      id_empresa: id_empresa || null, // ✅ null por defecto
    };

    console.log('💾 Intentando insertar usuario:', datosUsuario);
    
    // Crear usuario (contraseña sin hashear)
    const newUser = await prisma.usuario.create({
      data: datosUsuario,
      select: {
        username: true,
        nombre: true,
        correo: true,
        telefono: true,
        id_tipo_usuario: true,
        id_empresa: true,
      },
    });

    console.log('✅ Usuario creado exitosamente:', newUser);

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
    console.error('❌ Error en registro:', error);
    
    // Errores específicos de Prisma
    if (error.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'El username ya está registrado',
      });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Error de clave foránea: verifica id_tipo_usuario e id_empresa',
      });
    }
    
    next(error);
  }
}

/**
 * Iniciar sesión (SIN hasheo)
 */
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    console.log('🔐 Intento de login:', { username });

    // Validaciones
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username y password son obligatorios',
      });
    }

    // Buscar usuario
    const user = await prisma.usuario.findUnique({
      where: { username: username.toLowerCase() }, // Buscar en minúsculas
      include: {
        tipo_usuario: true,
        empresa: true,
      },
    });

    if (!user) {
      console.log('❌ Usuario no encontrado:', username);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    // Verificar contraseña (comparación directa, sin bcrypt)
    if (password !== user.password) {
      console.log('❌ Contraseña incorrecta para:', username);
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
      });
    }

    console.log('✅ Login exitoso:', username);

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
    console.error('❌ Error en login:', error);
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
