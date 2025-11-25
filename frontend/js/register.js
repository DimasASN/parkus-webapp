// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  
  // Si ya está autenticado, redirigir al index
  if (auth.isAuthenticated()) {
    window.location.href = 'index.html';
    return;
  }

  // Obtener el formulario de registro
  const registerForm = document.getElementById('registerForm');
  
  if (registerForm) {
    registerForm.addEventListener('submit', handleRegister);
  }
});

/**
 * Manejar el submit del formulario de registro
 */
async function handleRegister(event) {
  event.preventDefault();
  
  console.log('🚀 Iniciando proceso de registro...');
  
  // Obtener valores del formulario
  const username = document.getElementById('username')?.value.trim();
  const nombre = document.getElementById('nombre')?.value.trim();
  const correo = document.getElementById('correo')?.value.trim();
  const telefono = document.getElementById('telefono')?.value.trim();
  const password = document.getElementById('password')?.value;
  const password2 = document.getElementById('password2')?.value;
  
  console.log('📝 Datos del formulario:', {
    username,
    nombre,
    correo,
    telefono,
    password: '***',
    password2: '***'
  });
  
  // ==========================================
  // VALIDACIONES EN FRONTEND
  // ==========================================
  
  // Validar campos obligatorios
  if (!username || !nombre || !correo || !telefono || !password) {
    mostrarError('❌ Por favor completa todos los campos obligatorios');
    console.log('❌ Campos faltantes');
    return;
  }
  
  // Validar que las contraseñas coincidan
  if (password !== password2) {
    mostrarError('❌ Las contraseñas no coinciden');
    console.log('❌ Contraseñas no coinciden');
    return;
  }
  
  // Validar longitud de contraseña
  if (password.length < 6) {
    mostrarError('❌ La contraseña debe tener al menos 6 caracteres');
    console.log('❌ Contraseña muy corta');
    return;
  }
  
  // Validar formato de correo
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(correo)) {
    mostrarError('❌ Por favor ingresa un correo válido (ejemplo: usuario@correo.com)');
    console.log('❌ Formato de correo inválido');
    return;
  }

  // Validar teléfono (solo números, 10 dígitos)
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(telefono)) {
    mostrarError('❌ El teléfono debe tener exactamente 10 dígitos numéricos');
    console.log('❌ Formato de teléfono inválido');
    return;
  }

  // Validar username (solo letras, números y guiones bajos)
  const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
  if (!usernameRegex.test(username)) {
    mostrarError('❌ El nombre de usuario debe tener entre 3-50 caracteres (solo letras, números y guiones bajos)');
    console.log('❌ Formato de username inválido');
    return;
  }
  
  console.log('✅ Validaciones del formulario completadas');
  
  // ==========================================
  // ENVIAR DATOS AL SERVIDOR
  // ==========================================
  
  // Deshabilitar el botón y mostrar estado de carga
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = '⏳ Registrando...';
  submitBtn.style.opacity = '0.7';
  
  // Mostrar mensaje de "procesando"
  mostrarNotificacion('⏳ Creando tu cuenta, por favor espera...', 'info');
  
  try {
    // Preparar datos del usuario
    const userData = {
      username: username.toLowerCase(),
      nombre,
      correo,
      telefono,
      password,
      id_tipo_usuario: 3, // ✅ Tipo Cliente - SIEMPRE 3
      id_empresa: null    // ✅ No aplica para clientes - SIEMPRE null
    };
    
    console.log('📤 Enviando datos al servidor:', {
      ...userData,
      password: '***'
    });
    
    // Llamar a la API
    const result = await auth.register(userData);
    
    console.log('📥 Respuesta del servidor:', result);
    
    // ==========================================
    // PROCESAR RESPUESTA
    // ==========================================
    
    if (result.success) {
      console.log('✅✅✅ REGISTRO EXITOSO ✅✅✅');
      
      // Mostrar mensaje de éxito
      mostrarExito(`✅ ¡Cuenta creada exitosamente para ${nombre}!`);
      
      // Limpiar formulario
      event.target.reset();
      
      // Mostrar mensaje adicional
      setTimeout(() => {
        mostrarNotificacion('🔄 Redirigiendo al inicio de sesión...', 'info');
      }, 1500);
      
      // Esperar 3 segundos y redirigir al login
      setTimeout(() => {
        console.log('➡️ Redirigiendo a login...');
        window.location.href = 'login.html';
      }, 3000);
      
    } else {
      console.log('❌ Error del servidor:', result.message);
      mostrarError(`❌ ${result.message || 'Error al registrar usuario'}`);
    }
    
  } catch (error) {
    console.error('❌❌❌ ERROR EN REGISTRO ❌❌❌');
    console.error('Error completo:', error);
    
    // Intentar obtener mensaje de error específico
    let mensajeError = 'Error al conectar con el servidor. Por favor verifica tu conexión e intenta de nuevo.';
    
    if (error.message) {
      mensajeError = error.message;
    }
    
    mostrarError(`❌ ${mensajeError}`);
    
  } finally {
    // Rehabilitar el botón
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
    submitBtn.style.opacity = '1';
    console.log('🔄 Botón rehabilitado');
  }
}

/**
 * Mostrar notificación con tipo personalizado
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
  // Esta función ya existe en api.js, pero la duplicamos por si acaso
  if (typeof window.mostrarNotificacion === 'function') {
    window.mostrarNotificacion(mensaje, tipo);
  } else {
    // Fallback simple
    alert(mensaje);
  }
}
