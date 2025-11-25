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
  
  // Obtener valores del formulario con los IDs correctos
  const username = document.getElementById('username')?.value.trim();
  const nombre = document.getElementById('nombre')?.value.trim();
  const correo = document.getElementById('correo')?.value.trim();
  const telefono = document.getElementById('telefono')?.value.trim();
  const password = document.getElementById('password')?.value;
  const password2 = document.getElementById('password2')?.value;
  
  // Validar campos obligatorios
  if (!username || !nombre || !correo || !telefono || !password) {
    mostrarError('Por favor completa todos los campos obligatorios');
    return;
  }
  
  // Validar que las contraseñas coincidan
  if (password !== password2) {
    mostrarError('Las contraseñas no coinciden');
    return;
  }
  
  // Validar longitud de contraseña
  if (password.length < 6) {
    mostrarError('La contraseña debe tener al menos 6 caracteres');
    return;
  }
  
  // Validar formato de correo
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(correo)) {
    mostrarError('Por favor ingresa un correo válido');
    return;
  }

  // Validar teléfono (solo números, 10 dígitos)
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(telefono)) {
    mostrarError('El teléfono debe tener 10 dígitos numéricos');
    return;
  }

  // Validar username (solo letras, números y guiones bajos)
  const usernameRegex = /^[a-zA-Z0-9_]{3,50}$/;
  if (!usernameRegex.test(username)) {
    mostrarError('El username debe tener entre 3-50 caracteres (solo letras, números y guiones bajos)');
    return;
  }
  
  // Deshabilitar el botón mientras procesa
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Registrando...';
  
  try {
    // ✅ Preparar datos del usuario
    // IMPORTANTE: id_tipo_usuario siempre es 3 (Cliente)
    // id_empresa siempre es null (no aplica para clientes)
    const userData = {
      username: username.toLowerCase(),  // Convertir a minúsculas
      nombre,
      correo,
      telefono,
      password,
      id_tipo_usuario: 3, // ✅ Tipo Cliente - SIEMPRE 3
      id_empresa: null    // ✅ No aplica para clientes - SIEMPRE null
    };
    
    console.log('Enviando datos de registro:', userData);
    
    // Llamar a la API
    const result = await auth.register(userData);
    
    console.log('Respuesta del servidor:', result);
    
    if (result.success) {
      mostrarExito('¡Registro exitoso! Redirigiendo al inicio de sesión...');
      
      // Limpiar formulario
      event.target.reset();
      
      // Esperar 2 segundos y redirigir al login
      setTimeout(() => {
        window.location.href = 'login.html';
      }, 2000);
    } else {
      mostrarError(result.message || 'Error al registrar usuario');
    }
  } catch (error) {
    console.error('Error en registro:', error);
    mostrarError('Error al conectar con el servidor. Por favor intenta de nuevo.');
  } finally {
    // Rehabilitar el botón
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}
