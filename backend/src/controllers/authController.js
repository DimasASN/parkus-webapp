const prisma = require('../config/database');
const { generateToken } = require('../utils/jwt');

/**
 * Registrar un nuevo usuario (SIN hasheo)
 */
async function register(req, res, next) {
  try {
    console.log('\n========================================');
    console.log('🚀 INICIO DE REGISTRO DE USUARIO');
    console.log('========================================');
    
    const { username, nombre, password, telefono, correo, id_tipo_usuario, id_empresa } = req.body;

    console.log('📥 Datos recibidos:', {
      username,
      nombre,
      correo,
      telefono,
      password: password ? '***' : undefined,
      id_tipo_usuario,
      id_empresa
    });

    // ==========================================
    // VALIDACIONES BÁSICAS
    // ==========================================
    if (!username) {
      console.log('❌ Falta username');
      return res.status(400).json({
        success: false,
        message: 'El nombre de usuario es obligatorio',
      });
    }

    if (!nombre) {
      console.log('❌ Falta nombre');
      return res.status(400).json({
        success: false,
        message: 'El nombre completo es obligatorio',
      });
    }

    if (!password) {
      console.log('❌ Falta password');
      return res.status(400).json({
        success: false,
        message: 'La contraseña es obligatoria',
      });
    }

    if (!correo) {
      console.log('❌ Falta correo');
      return res.status(400).json({
        success: false,
        message: 'El correo electrónico es obligatorio',
      });
    }

    if (!telefono) {
      console.log('❌ Falta teléfono');
      return res.status(400).json({
        success: false,
        message: 'El teléfono es obligatorio',
      });
    }

    // Validar formato de correo
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(correo)) {
      console.log('❌ Formato de correo inválido:', correo);
      return res.status(400).json({
        success: false,
        message: 'El formato del correo no es válido',
      });
    }

    console.log('✅ Validaciones básicas completadas');

    // ==========================================
    // VERIFICAR SI EL USUARIO YA EXISTE
    // ==========================================
    console.log('🔍 Verificando si el usuario ya existe...');
    
    const existingUser = await prisma.usuario.findUnique({
      where: { username: username.toLowerCase() },
    });

    if (existingUser) {
      console.log('❌ Usuario ya existe:', username);
      return res.status(409).json({
        success: false,
        message: 'El nombre de usuario ya está registrado. Por favor elige otro.',
      });
    }

    console.log('✅ Usuario disponible');

    // ==========================================
    // PREPARAR DATOS PARA INSERTAR
    // ==========================================
    const tipoUsuario = id_tipo_usuario || 3;
    
    const datosUsuario = {
      username: username.toLowerCase().trim(),
      nombre: nombre.trim(),
      password: password, // SIN hashear
      telefono: telefono ? BigInt(telefono) : null,
      correo: correo.trim(),
      id_tipo_usuario: tipoUsuario,
      id_empresa: id_empresa || null,
    };

    console.log('💾 Datos preparados para insertar:', {
      ...datosUsuario,
      password: '***',
      telefono: datosUsuario.telefono ? datosUsuario.telefono.toString() : null
    });

    // ==========================================
    // VERIFICAR QUE EXISTE EL TIPO DE USUARIO
    // ==========================================
    console.log('🔍 Verificando tipo de usuario en BD...');
    
    const tipoExiste = await prisma.tipo_usuario.findUnique({
      where: { id: tipoUsuario }
    });

    if (!tipoExiste) {
      console.log('❌ Tipo de usuario no existe en BD:', tipoUsuario);
      return res.status(400).json({
        success: false,
        message: 'Error de configuración: tipo de usuario inválido',
      });
    }

    console.log('✅ Tipo de usuario existe:', tipoExiste.nombre);

    // ==========================================
    // INSERTAR EN BASE DE DATOS
    // ==========================================
    console.log('💾 Intentando crear usuario en BD...');
    
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

    console.log('✅✅✅ USUARIO CREADO EXITOSAMENTE ✅✅✅');
    console.log('Usuario creado:', {
      ...newUser,
      telefono: newUser.telefono ? newUser.telefono.toString() : null
    });

    // Convertir BigInt a string para JSON
    const userData = {
      ...newUser,
      telefono: newUser.telefono ? newUser.telefono.toString() : null,
    };

    console.log('========================================');
    console.log('🎉 REGISTRO COMPLETADO CON ÉXITO');
    console.log('========================================\n');

    res.status(201).json({
      success: true,
      message: '¡Usuario registrado exitosamente! Ahora puedes iniciar sesión.',
      data: userData,
    });

  } catch (error) {
    console.log('\n========================================');
    console.error('❌❌❌ ERROR EN REGISTRO ❌❌❌');
    console.error('Tipo de error:', error.constructor.name);
    console.error('Código de error:', error.code);
    console.error('Mensaje:', error.message);
    console.error('Stack:', error.stack);
    console.log('========================================\n');
    
    // Errores específicos de Prisma
    if (error.code === 'P2002') {
      const campo = error.meta?.target?.[0] || 'campo';
      return res.status(409).json({
        success: false,
        message: `El ${campo} ya está registrado. Por favor usa otro.`,
      });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        message: 'Error de configuración en la base de datos. Contacta al administrador.',
      });
    }

    if (error.code === 'P2010') {
      return res.status(500).json({
        success: false,
        message: 'Error de consulta en la base de datos. Verifica los datos ingresados.',
      });
    }
    
    return res.status(500).json({
      success: false,
      message: 'Error al registrar usuario. Por favor intenta de nuevo.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Iniciar sesión (SIN hasheo)
 */
async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    console.log('🔐 Intento de login:', username);

    // Validaciones
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username y password son obligatorios',
      });
    }

    // Buscar usuario
    const user = await prisma.usuario.findUnique({
      where: { username: username.toLowerCase() },
      include: {
        tipo_usuario: true,
        empresa: true,
      },
    });

    if (!user) {
      console.log('❌ Usuario no encontrado:', username);
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos',
      });
    }

    // Verificar contraseña (comparación directa)
    if (password !== user.password) {
      console.log('❌ Contraseña incorrecta para:', username);
      return res.status(401).json({
        success: false,
        message: 'Usuario o contraseña incorrectos',
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
      message: '¡Bienvenido de nuevo!',
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
