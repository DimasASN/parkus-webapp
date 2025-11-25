// Variable global para almacenar todos los parqueaderos
let todosLosParqueaderos = [];
let parqueaderosFiltrados = [];

// Variable para controlar el intervalo de actualización
let intervaloActualizacion = null;
const INTERVALO_REFRESH = 30000; // 30 segundos

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Cargar parqueaderos
  cargarParqueaderos();
  
  // Iniciar actualización automática
  iniciarActualizacionAutomatica();
  
  // Event listener para búsqueda
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', aplicarFiltros);
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
 * Cargar todos los parqueaderos desde la API
 * @param {boolean} silencioso - Si es true, no muestra loading ni resetea filtros
 */
async function cargarParqueaderos(silencioso = false) {
  const listContainer = document.getElementById('listContainer');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const emptyState = document.getElementById('emptyState');
  
  if (!listContainer) {
    console.error('No se encontró el contenedor de lista');
    return;
  }
  
  try {
    // Mostrar loading solo si no es actualización silenciosa
    if (!silencioso && loadingIndicator) {
      loadingIndicator.style.display = 'block';
    }
    
    // Agregar efecto visual de actualización
    if (silencioso) {
      const updateIcon = document.getElementById('update-icon');
      if (updateIcon) {
        updateIcon.classList.add('updating');
      }
    }
    
    // Ocultar estado vacío
    if (emptyState) {
      emptyState.hidden = true;
    }
    
    // Si no es silencioso, limpiar contenedor
    if (!silencioso) {
      listContainer.innerHTML = '';
    }
    
    // Obtener parqueaderos de la API
    const result = await parqueaderos.getAll();
    
    if (result.success && result.data.length > 0) {
      todosLosParqueaderos = result.data;
      
      // Actualizar timestamp
      window.ultimaActualizacion = new Date();
      
      // Si es actualización silenciosa, mantener filtros aplicados
      if (silencioso) {
        aplicarFiltros();
        
        // Actualizar indicador
        const updateText = document.getElementById('update-text');
        if (updateText) {
          updateText.textContent = 'Actualizado ahora';
        }
      } else {
        // Primera carga, mostrar todos
        parqueaderosFiltrados = [...result.data];
        renderizarParqueaderos(parqueaderosFiltrados);
      }
    } else {
      // No hay parqueaderos
      if (emptyState) {
        emptyState.hidden = false;
        emptyState.querySelector('p').textContent = 'No hay parqueaderos disponibles en este momento.';
      }
    }
  } catch (error) {
    console.error('Error cargando parqueaderos:', error);
    if (!silencioso) {
      listContainer.innerHTML = '<p style="color: var(--danger); text-align: center; padding: 2rem;">Error al cargar los parqueaderos. Por favor intenta de nuevo.</p>';
    }
  } finally {
    // Ocultar loading
    if (!silencioso && loadingIndicator) {
      loadingIndicator.style.display = 'none';
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
 * Renderizar lista de parqueaderos
 */
function renderizarParqueaderos(parqueaderos) {
  const listContainer = document.getElementById('listContainer');
  const emptyState = document.getElementById('emptyState');
  
  if (parqueaderos.length === 0) {
    listContainer.innerHTML = '';
    if (emptyState) {
      emptyState.hidden = false;
    }
    return;
  }
  
  if (emptyState) {
    emptyState.hidden = true;
  }
  
  listContainer.innerHTML = parqueaderos.map(park => crearTarjetaParqueadero(park)).join('');
}

/**
 * Crear HTML de tarjeta de parqueadero
 */
function crearTarjetaParqueadero(park) {
  const disponibles = park.info_parqueadero?.lug_disponibles || 0;
  const total = park.info_parqueadero?.cantidad_lugares || 0;
  const precio = park.info_parqueadero?.precio_lugar || 0;
  const ocupados = park.info_parqueadero?.lug_ocupados || 0;
  
  // Determinar estado de disponibilidad
  let estadoTexto = 'Sin espacios';
  let estadoClass = 'sin-espacios';
  
  if (disponibles > 0) {
    estadoTexto = `${disponibles} disponibles`;
    const porcentaje = (disponibles / total) * 100;
    
    if (porcentaje > 50) {
      estadoClass = 'alta-disponibilidad';
    } else if (porcentaje > 20) {
      estadoClass = 'media-disponibilidad';
    } else {
      estadoClass = 'baja-disponibilidad';
    }
  }
  
  return `
    <div class="parqueadero-card">
      <div class="card-header">
        <h3>${park.nombre}</h3>
        <div class="precio-badge">
          $${parseFloat(precio).toLocaleString('es-CO')} / h
        </div>
      </div>
      
      <div class="card-body">
        <p class="direccion">${park.direccion}</p>
        
        ${park.descripcion ? `<p class="descripcion">${park.descripcion}</p>` : ''}
        
        <div class="disponibilidad-info">
          <span class="capacidad">Capacidad ${total}</span>
          <span class="disponibilidad-badge ${estadoClass}">
            ${estadoTexto}
          </span>
        </div>
      </div>
      
      <div class="card-footer">
        ${disponibles > 0 
          ? `<button class="btn-primary" onclick="verDetalleParqueadero(${park.id_empresa})">Reservar</button>`
          : `<button class="btn-disabled" disabled>Sin espacios</button>`
        }
      </div>
    </div>
  `;
}

/**
 * Aplicar filtros y búsqueda
 */
function aplicarFiltros() {
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const onlyAvailableToggle = document.getElementById('onlyAvailableToggle');
  
  let filtrados = [...todosLosParqueaderos];
  
  // Filtro de búsqueda
  if (searchInput && searchInput.value.trim()) {
    const termino = searchInput.value.toLowerCase().trim();
    filtrados = filtrados.filter(park => 
      park.nombre.toLowerCase().includes(termino) ||
      park.direccion.toLowerCase().includes(termino)
    );
  }
  
  // Filtro solo disponibles
  if (onlyAvailableToggle && onlyAvailableToggle.checked) {
    filtrados = filtrados.filter(park => 
      (park.info_parqueadero?.lug_disponibles || 0) > 0
    );
  }
  
  // Ordenamiento
  if (sortSelect) {
    const sortValue = sortSelect.value;
    
    switch(sortValue) {
      case 'precio-asc':
        filtrados.sort((a, b) => 
          (a.info_parqueadero?.precio_lugar || 0) - (b.info_parqueadero?.precio_lugar || 0)
        );
        break;
        
      case 'precio-desc':
        filtrados.sort((a, b) => 
          (b.info_parqueadero?.precio_lugar || 0) - (a.info_parqueadero?.precio_lugar || 0)
        );
        break;
        
      case 'disponibles':
        filtrados.sort((a, b) => 
          (b.info_parqueadero?.lug_disponibles || 0) - (a.info_parqueadero?.lug_disponibles || 0)
        );
        break;
        
      default: // recomendado
        // Ordenar por disponibilidad > 0 primero, luego por cantidad de disponibles
        filtrados.sort((a, b) => {
          const dispA = a.info_parqueadero?.lug_disponibles || 0;
          const dispB = b.info_parqueadero?.lug_disponibles || 0;
          
          if (dispA > 0 && dispB === 0) return -1;
          if (dispA === 0 && dispB > 0) return 1;
          return dispB - dispA;
        });
    }
  }
  
  parqueaderosFiltrados = filtrados;
  renderizarParqueaderos(filtrados);
}

/**
 * Limpiar filtros
 */
function limpiarFiltros() {
  const searchInput = document.getElementById('searchInput');
  const sortSelect = document.getElementById('sortSelect');
  const onlyAvailableToggle = document.getElementById('onlyAvailableToggle');
  
  if (searchInput) searchInput.value = '';
  if (sortSelect) sortSelect.value = 'recomendado';
  if (onlyAvailableToggle) onlyAvailableToggle.checked = false;
  
  aplicarFiltros();
}

/**
 * Ver detalle de un parqueadero
 */
function verDetalleParqueadero(id) {
  // Guardar el ID en localStorage
  localStorage.setItem('parqueadero_seleccionado', id);
  
  // Redirigir a página de detalle
  window.location.href = `detalle-parqueadero.html?id=${id}`;
}

// Limpiar intervalo cuando se cierre/abandone la página
window.addEventListener('beforeunload', () => {
  if (intervaloActualizacion) {
    clearInterval(intervaloActualizacion);
  }
});
