// Variable para controlar el intervalo de actualización
let intervaloActualizacion = null;
const INTERVALO_REFRESH = 30000; // 30 segundos

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  
  // Cargar información del usuario si está autenticado
  cargarInfoUsuario();
  
  // Cargar lista de parqueaderos
  cargarParqueaderos();
  
  // Iniciar actualización automática
  iniciarActualizacionAutomatica();
  
  // Event listener para el botón de logout (si existe)
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', auth.logout);
  }
});

/**
 * Iniciar actualización automática de parqueaderos
 */
function iniciarActualizacionAutomatica() {
  // Limpiar intervalo previo si existe
  if (intervaloActualizacion) {
    clearInterval(intervaloActualizacion);
  }
  
  // Crear nuevo intervalo
  intervaloActualizacion = setInterval(() => {
    cargarParqueaderos(true); // true = actualización silenciosa
  }, INTERVALO_REFRESH);
  
  // Agregar indicador visual de última actualización
  agregarIndicadorActualizacion();
}

/**
 * Agregar indicador visual de última actualización
 */
function agregarIndicadorActualizacion() {
  // Buscar si ya existe el indicador
  let indicador = document.getElementById('update-indicator');
  
  if (!indicador) {
    indicador = document.createElement('div');
    indicador.id = 'update-indicator';
    indicador.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
      color: white;
      padding: 12px 20px;
      border-radius: 25px;
      font-size: 0.85rem;
      box-shadow: var(--shadow-lg);
      z-index: 1000;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: fadeIn 0.3s ease-out;
      font-weight: 600;
    `;
    
    indicador.innerHTML = `
      <span id="update-icon" style="font-size: 1.2rem;">🔄</span>
      <span id="update-text">Actualizado ahora</span>
    `;
    
    document.body.appendChild(indicador);
    
    // Agregar animación CSS si no existe
    if (!document.getElementById('update-animations')) {
      const style = document.createElement('style');
      style.id = 'update-animations';
      style.textContent = `
        @keyframes pulse-rotate {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50% { transform: scale(1.2) rotate(180deg); }
        }
        .updating {
          animation: pulse-rotate 1s ease-in-out infinite;
          display: inline-block;
        }
      `;
      document.head.appendChild(style);
    }
  }
  
  actualizarTextoIndicador();
}

/**
 * Actualizar texto del indicador con tiempo transcurrido
 */
function actualizarTextoIndicador() {
  const updateText = document.getElementById('update-text');
  if (!updateText) return;
  
  const ahora = new Date();
  const segundos = Math.floor((ahora - (window.ultimaActualizacion || ahora)) / 1000);
  
  if (segundos < 60) {
    updateText.textContent = 'Actualizado ahora';
  } else {
    const minutos = Math.floor(segundos / 60);
    updateText.textContent = `Actualizado hace ${minutos}m`;
  }
  
  // Actualizar cada 10 segundos
  setTimeout(actualizarTextoIndicador, 10000);
}

/**
 * Cargar información del usuario autenticado
 */
function cargarInfoUsuario() {
  const userNameElement = document.getElementById('userName');
  const userGreeting = document.getElementById('userGreeting');
  const authButtons = document.getElementById('authButtons');
  const userMenu = document.getElementById('userMenu');
  
  if (auth.isAuthenticated()) {
    const user = auth.getUser();
    
    // Mostrar nombre del usuario
    if (userNameElement) {
      userNameElement.textContent = user.nombre;
    }
    
    if (userGreeting) {
      userGreeting.textContent = `¡Hola, ${user.nombre}!`;
    }
    
    // Ocultar botones de login/registro y mostrar menú de usuario
    if (authButtons) {
      authButtons.style.display = 'none';
    }
    if (userMenu) {
      userMenu.style.display = 'flex';
    }
  } else {
    // Mostrar botones de login/registro
    if (authButtons) {
      authButtons.style.display = 'flex';
    }
    if (userMenu) {
      userMenu.style.display = 'none';
    }
  }
}

/**
 * Cargar todos los parqueaderos
 * @param {boolean} silencioso - Si es true, no muestra loading ni notificaciones
 */
async function cargarParqueaderos(silencioso = false) {
  const container = document.getElementById('parqueaderos-container');
  const loadingElement = document.getElementById('loading');
  
  if (!container) {
    console.error('No se encontró el contenedor de parqueaderos');
    return;
  }
  
  try {
    // Mostrar loading solo si no es actualización silenciosa
    if (!silencioso && loadingElement) {
      loadingElement.style.display = 'block';
    }
    
    // Agregar efecto visual de actualización
    if (silencioso) {
      const updateIcon = document.getElementById('update-icon');
      if (updateIcon) {
        updateIcon.classList.add('updating');
      }
    }
    
    // Obtener parqueaderos de la API
    const result = await parqueaderos.getAll();
    
    if (result.success && result.data.length > 0) {
      // Renderizar parqueaderos
      container.innerHTML = result.data.map(park => crearTarjetaParqueadero(park)).join('');
      
      // Actualizar timestamp
      window.ultimaActualizacion = new Date();
      
      // Actualizar indicador
      if (silencioso) {
        const updateText = document.getElementById('update-text');
        if (updateText) {
          updateText.textContent = 'Actualizado ahora';
        }
      }
    } else {
      container.innerHTML = '<p class="no-data">No hay parqueaderos disponibles en este momento</p>';
    }
  } catch (error) {
    console.error('Error cargando parqueaderos:', error);
    if (!silencioso) {
      container.innerHTML = '<p class="error">Error al cargar los parqueaderos. Por favor intenta de nuevo.</p>';
    }
  } finally {
    // Ocultar loading
    if (!silencioso && loadingElement) {
      loadingElement.style.display = 'none';
    }
    
    // Remover efecto de actualización
    if (silencioso) {
      const updateIcon = document.getElementById('update-icon');
      if (updateIcon) {
        updateIcon.classList.remove('updating');
      }
    }
  }
}

/**
 * Crear HTML de tarjeta de parqueadero
 */
function crearTarjetaParqueadero(park) {
  const disponibilidad = park.info_parqueadero?.lug_disponibles || 0;
  const total = park.info_parqueadero?.cantidad_lugares || 0;
  const precio = park.info_parqueadero?.precio_lugar || 0;
  
  // Determinar clase de disponibilidad
  let disponibilidadClass = 'baja-disponibilidad';
  const porcentajeDisponible = (disponibilidad / total) * 100;
  
  if (porcentajeDisponible > 50) {
    disponibilidadClass = 'alta-disponibilidad';
  } else if (porcentajeDisponible > 20) {
    disponibilidadClass = 'media-disponibilidad';
  } else if (disponibilidad === 0) {
    disponibilidadClass = 'sin-espacios';
  }
  
  return `
    <div class="parqueadero-card">
      <div class="card-header">
        <h3>${park.nombre}</h3>
        <span class="disponibilidad-badge ${disponibilidadClass}">
          ${disponibilidad} disponibles
        </span>
      </div>
      <div class="card-body">
        <p class="direccion">${park.direccion}</p>
        ${park.descripcion ? `<p class="descripcion">${park.descripcion}</p>` : ''}
        <div class="disponibilidad-info">
          <span class="capacidad">Capacidad: ${total} lugares</span>
          <span class="capacidad">Ocupados: ${park.info_parqueadero?.lug_ocupados || 0}</span>
        </div>
        <div class="precio-badge" style="margin-top: 1rem; display: inline-block;">
          💰 $${parseFloat(precio).toLocaleString('es-CO')} / hora
        </div>
      </div>
      <div class="card-footer">
        ${disponibilidad > 0 
          ? `<button class="btn-primary" onclick="verDetallesParqueadero(${park.id_empresa})">Ver detalles y reservar</button>`
          : `<button class="btn-disabled" disabled>Sin espacios</button>`
        }
      </div>
    </div>
  `;
}

/**
 * Ver detalles de un parqueadero
 */
function verDetallesParqueadero(id) {
  // Guardar el ID en localStorage para usarlo en la página de detalles
  localStorage.setItem('parqueadero_seleccionado', id);
  
  // Redirigir a página de detalles/reserva
  window.location.href = `parqueos.html?id=${id}`;
}

/**
 * Buscar parqueaderos (función opcional si tienes un buscador)
 */
function buscarParqueaderos(termino) {
  const cards = document.querySelectorAll('.parqueadero-card');
  
  cards.forEach(card => {
    const nombre = card.querySelector('h3').textContent.toLowerCase();
    const direccion = card.querySelector('.direccion').textContent.toLowerCase();
    
    if (nombre.includes(termino.toLowerCase()) || direccion.includes(termino.toLowerCase())) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}

// Limpiar intervalo cuando se cierre/abandone la página
window.addEventListener('beforeunload', () => {
  if (intervaloActualizacion) {
    clearInterval(intervaloActualizacion);
  }
});
