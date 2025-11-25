// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  
    // Cargar información del usuario si está autenticado
    cargarInfoUsuario();
    
    // Cargar lista de parqueaderos
    cargarParqueaderos();
    
    // Event listener para el botón de logout (si existe)
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', auth.logout);
    }
  });
  
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
        userMenu.style.display = 'block';
      }
    } else {
      // Mostrar botones de login/registro
      if (authButtons) {
        authButtons.style.display = 'block';
      }
      if (userMenu) {
        userMenu.style.display = 'none';
      }
    }
  }
  
  /**
   * Cargar todos los parqueaderos
   */
  async function cargarParqueaderos() {
    const container = document.getElementById('parqueaderos-container');
    const loadingElement = document.getElementById('loading');
    
    if (!container) {
      console.error('No se encontró el contenedor de parqueaderos');
      return;
    }
    
    try {
      // Mostrar loading
      if (loadingElement) {
        loadingElement.style.display = 'block';
      }
      
      // Obtener parqueaderos de la API
      const result = await parqueaderos.getAll();
      
      if (result.success && result.data.length > 0) {
        // Renderizar parqueaderos
        container.innerHTML = result.data.map(park => crearTarjetaParqueadero(park)).join('');
      } else {
        container.innerHTML = '<p class="no-data">No hay parqueaderos disponibles en este momento</p>';
      }
    } catch (error) {
      console.error('Error cargando parqueaderos:', error);
      container.innerHTML = '<p class="error">Error al cargar los parqueaderos. Por favor intenta de nuevo.</p>';
    } finally {
      // Ocultar loading
      if (loadingElement) {
        loadingElement.style.display = 'none';
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
    let disponibilidadClass = 'baja';
    const porcentajeDisponible = (disponibilidad / total) * 100;
    
    if (porcentajeDisponible > 50) {
      disponibilidadClass = 'alta';
    } else if (porcentajeDisponible > 20) {
      disponibilidadClass = 'media';
    }
    
    return `
      <div class="parqueadero-card">
        <div class="card-header">
          <h3>${park.nombre}</h3>
          <span class="disponibilidad ${disponibilidadClass}">
            ${disponibilidad} disponibles
          </span>
        </div>
        <div class="card-body">
          <p class="direccion">📍 ${park.direccion}</p>
          ${park.descripcion ? `<p class="descripcion">${park.descripcion}</p>` : ''}
          <div class="info-row">
            <span class="info-item">
              <strong>Total:</strong> ${total} lugares
            </span>
            <span class="info-item">
              <strong>Ocupados:</strong> ${park.info_parqueadero?.lug_ocupados || 0}
            </span>
          </div>
          <div class="precio">
            💰 $${parseFloat(precio).toLocaleString('es-CO')} / hora
          </div>
        </div>
        <div class="card-footer">
          <button class="btn btn-primary" onclick="verDetallesParqueadero(${park.id_empresa})">
            Ver detalles y reservar
          </button>
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