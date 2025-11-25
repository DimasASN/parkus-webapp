// Configuración de la API
const API_URL = 'https://parkus-backend-production.up.railway.app/api';

// ============================================================
// UTILIDAD PARA HACER REQUESTS
// ============================================================
async function apiRequest(endpoint, options = {}) {
  const token = localStorage.getItem('token');
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();
    
    // Si el token expiró, redirigir al login
    if (response.status === 401 && window.location.pathname !== '/login.html') {
      localStorage.clear();
      window.location.href = 'login.html';
      return null;
    }
    
    return data;
  } catch (error) {
    console.error('Error en request:', error);
    throw error;
  }
}

// ============================================================
// FUNCIONES DE AUTENTICACIÓN
// ============================================================
const auth = {
  /**
   * Iniciar sesión
   */
  async login(username, password) {
    const data = await apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    
    if (data.success) {
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.user));
    }
    
    return data;
  },
  
  /**
   * Registrar nuevo usuario
   */
  async register(userData) {
    return await apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },
  
  /**
   * Obtener perfil del usuario autenticado
   */
  async getProfile() {
    return await apiRequest('/auth/profile');
  },
  
  /**
   * Cerrar sesión
   */
  logout() {
    localStorage.clear();
    window.location.href = 'login.html';
  },
  
  /**
   * Verificar si está autenticado
   */
  isAuthenticated() {
    return !!localStorage.getItem('token');
  },
  
  /**
   * Obtener usuario actual
   */
  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
};

// ============================================================
// FUNCIONES DE PARQUEADEROS
// ============================================================
const parqueaderos = {
  /**
   * Obtener todos los parqueaderos
   */
  async getAll() {
    return await apiRequest('/parqueaderos');
  },
  
  /**
   * Obtener un parqueadero por ID
   */
  async getById(id) {
    return await apiRequest(`/parqueaderos/${id}`);
  },
  
  /**
   * Obtener lugares disponibles de un parqueadero
   */
  async getDisponibles(id) {
    return await apiRequest(`/parqueaderos/${id}/disponibles`);
  }
};

// ============================================================
// FUNCIONES DE RESERVAS
// ============================================================
const reservas = {
  /**
   * Crear una nueva reserva
   */
  async crear(reservaData) {
    return await apiRequest('/reservas', {
      method: 'POST',
      body: JSON.stringify(reservaData),
    });
  },
  
  /**
   * Liberar un lugar
   */
  async liberar(id_empresa, numero_lugar) {
    return await apiRequest('/reservas/liberar', {
      method: 'POST',
      body: JSON.stringify({ id_empresa, numero_lugar }),
    });
  },
  
  /**
   * Consultar reserva por placa
   */
  async consultarPorPlaca(placa) {
    return await apiRequest(`/reservas/placa/${placa}`);
  }
};

// ============================================================
// UTILIDADES - NOTIFICACIONES MODERNAS
// ============================================================

/**
 * Mostrar notificación moderna
 */
function mostrarNotificacion(mensaje, tipo = 'info') {
  // Eliminar notificaciones anteriores
  const existente = document.querySelector('.notification');
  if (existente) existente.remove();
  
  const colores = {
    success: { bg: '#10b981', icon: '✓' },
    error: { bg: '#ef4444', icon: '✕' },
    warning: { bg: '#f59e0b', icon: '⚠' },
    info: { bg: '#3b82f6', icon: 'ℹ' }
  };
  
  const config = colores[tipo] || colores.info;
  
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${config.bg};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.2);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    max-width: 400px;
    animation: slideIn 0.3s ease-out;
  `;
  
  notification.innerHTML = `
    <span style="font-size: 1.5rem; font-weight: bold;">${config.icon}</span>
    <span style="flex: 1;">${mensaje}</span>
    <button onclick="this.parentElement.remove()" style="
      background: rgba(255,255,255,0.2);
      border: none;
      color: white;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
    ">×</button>
  `;
  
  // Agregar animación
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from {
        transform: translateX(400px);
        opacity: 0;
      }
      to {
        transform: translateX(0);
        opacity: 1;
      }
    }
  `;
  if (!document.querySelector('style[data-notifications]')) {
    style.setAttribute('data-notifications', 'true');
    document.head.appendChild(style);
  }
  
  document.body.appendChild(notification);
  
  // Auto-eliminar después de 5 segundos
  setTimeout(() => {
    notification.style.animation = 'slideIn 0.3s ease-out reverse';
    setTimeout(() => notification.remove(), 300);
  }, 5000);
}

/**
 * Mostrar mensaje de éxito
 */
function mostrarExito(mensaje) {
  mostrarNotificacion(mensaje, 'success');
}

/**
 * Mostrar mensaje de error
 */
function mostrarError(mensaje) {
  mostrarNotificacion(mensaje, 'error');
}

/**
 * Proteger página (requiere autenticación)
 */
function protegerPagina() {
  if (!auth.isAuthenticated()) {
    window.location.href = 'login.html';
  }
}
