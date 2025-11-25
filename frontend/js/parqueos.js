// Variable global para almacenar todos los parqueaderos
let todosLosParqueaderos = [];
let parqueaderosFiltrados = [];

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  // Cargar parqueaderos
  cargarParqueaderos();
  
  // Event listener para búsqueda
  const searchInput = document.getElementById('searchInput');
  if (searchInput) {
    searchInput.addEventListener('input', aplicarFiltros);
  }
});

/**
 * Cargar todos los parqueaderos desde la API
 */
async function cargarParqueaderos() {
  const listContainer = document.getElementById('listContainer');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const emptyState = document.getElementById('emptyState');
  
  if (!listContainer) {
    console.error('No se encontró el contenedor de lista');
    return;
  }
  
  try {
    // Mostrar loading
    if (loadingIndicator) {
      loadingIndicator.style.display = 'block';
    }
    
    // Ocultar estado vacío
    if (emptyState) {
      emptyState.hidden = true;
    }
    
    // Limpiar contenedor
    listContainer.innerHTML = '';
    
    // Obtener parqueaderos de la API
    const result = await parqueaderos.getAll();
    
    if (result.success && result.data.length > 0) {
      todosLosParqueaderos = result.data;
      parqueaderosFiltrados = [...result.data];
      
      // Renderizar parqueaderos
      renderizarParqueaderos(parqueaderosFiltrados);
    } else {
      // No hay parqueaderos
      if (emptyState) {
        emptyState.hidden = false;
        emptyState.querySelector('p').textContent = 'No hay parqueaderos disponibles en este momento.';
      }
    }
  } catch (error) {
    console.error('Error cargando parqueaderos:', error);
    listContainer.innerHTML = '<p class="error">Error al cargar los parqueaderos. Por favor intenta de nuevo.</p>';
  } finally {
    // Ocultar loading
    if (loadingIndicator) {
      loadingIndicator.style.display = 'none';
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
          ${parseFloat(precio).toLocaleString('es-CO')} / h
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