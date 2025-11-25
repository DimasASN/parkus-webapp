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
    
    // Obtener valores del formulario
    const username = document.getElementById('username')?.value;
    const nombre = document.getElementById('nombre')?.value;
    const correo = document.getElementById('correo')?.value;
    const telefono = document.getElementById('telefono')?.value;
    const password = document.getElementById('password')?.value;
    const confirmPassword = document.getElementById('confirmPassword')?.value;
    
    // Validar campos
    if (!username || !nombre || !correo || !password) {
      mostrarError('Por favor completa todos los campos obligatorios');
      return;
    }
    
    // Validar que las contraseñas coincidan
    if (password !== confirmPassword) {
      mostrarError('Las contraseñas no coinciden');
      return;
    }
    
    // Validar longitud de contraseña
    if (password.length < 6) {
      mostrarError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    
    // Validar formato de correo
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(correo)) {
      mostrarError('Por favor ingresa un correo válido');
      return;
    }
    
    // Deshabilitar el botón mientras procesa
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registrando...';
    
    try {
      // Preparar datos del usuario
      const userData = {
        username,
        nombre,
        correo,
        password,
        telefono: telefono || null,
        id_tipo_usuario: 3, // 3 = Cliente por defecto
        id_empresa: null
      };
      
      // Llamar a la API
      const result = await auth.register(userData);
      
      if (result.success) {
        mostrarExito('¡Registro exitoso! Ahora puedes iniciar sesión');
        
        // Esperar 1.5 segundos y redirigir al login
        setTimeout(() => {
          window.location.href = 'login.html';
        }, 1500);
      } else {
        mostrarError(result.message || 'Error al registrar usuario');
      }
    } catch (error) {
      console.error('Error en registro:', error);
      mostrarError('Error al conectar con el servidor');
    } finally {
      // Rehabilitar el botón
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
  
  /**
   * Función para mostrar/ocultar contraseña
   */
  function togglePassword(inputId, btnId) {
    const passwordInput = document.getElementById(inputId);
    const toggleBtn = document.getElementById(btnId);
    
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      toggleBtn.textContent = '🙈';
    } else {
      passwordInput.type = 'password';
      toggleBtn.textContent = '👁️';
    }
  }