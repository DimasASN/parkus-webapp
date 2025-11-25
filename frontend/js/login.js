// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  
    // Si ya está autenticado, redirigir al index
    if (auth.isAuthenticated()) {
      window.location.href = 'index.html';
      return;
    }
  
    // Obtener el formulario de login
    const loginForm = document.getElementById('loginForm');
    
    if (loginForm) {
      loginForm.addEventListener('submit', handleLogin);
    }
  });
  
  /**
   * Manejar el submit del formulario de login
   */
  async function handleLogin(event) {
    event.preventDefault();
    
    // Obtener valores del formulario
    const username = document.getElementById('username')?.value;
    const password = document.getElementById('password')?.value;
    
    // Validar campos
    if (!username || !password) {
      mostrarError('Por favor completa todos los campos');
      return;
    }
    
    // Deshabilitar el botón mientras procesa
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Iniciando sesión...';
    
    try {
      // Llamar a la API
      const result = await auth.login(username, password);
      
      if (result.success) {
        mostrarExito('¡Bienvenido ' + result.data.user.nombre + '!');
        
        // Redirigir según el tipo de usuario
        const user = result.data.user;
        
        // Si es admin o operario, redirigir a parqueos
        // Si es cliente, redirigir al index
        if (user.tipo_usuario === 'Admin' || user.tipo_usuario === 'Operario') {
          window.location.href = 'parqueos.html';
        } else {
          window.location.href = 'index.html';
        }
      } else {
        mostrarError(result.message || 'Usuario o contraseña incorrectos');
      }
    } catch (error) {
      console.error('Error en login:', error);
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
  function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.getElementById('togglePasswordBtn');
    
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      toggleBtn.textContent = '🙈';
    } else {
      passwordInput.type = 'password';
      toggleBtn.textContent = '👁️';
    }
  }