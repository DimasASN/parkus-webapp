// Variable global para almacenar el parqueadero actual
let parqueaderoActual = null;

// Esperar a que el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
  
  // Obtener ID del parqueadero de la URL
  const urlParams = new URLSearchParams(window.location.search);
  const idParqueadero = urlParams.get('id') || localStorage.getItem('parqueadero_seleccionado');
  
  if (!idParqueadero) {
    mostrarError('No se especificó un parqueadero');
    setTimeout(() => {
      window.location.href = 'parqueos.html';
    }, 2000);
    return;
  }
  
  // Cargar información del parqueadero
  cargarParqueadero(idParqueadero);
  
  // Event listeners
  const reservaForm = document.getElementById('reservaForm');
  if (reservaForm) {
    reservaForm.addEventListener('submit', handleReserva);
  }
  
  const consultarPlacaBtn = document.getElementById('consultarPlacaBtn');
  if (consultarPlacaBtn) {
    consultarPlacaBtn.addEventListener('click', consultarPorPlaca);
  }
});

/**
 * Cargar detalles de un parqueadero específico
 */
async function cargarParqueadero(id) {
  const infoContainer = document.getElementById('info-parqueadero');
  const lugaresContainer = document.getElementById('lugares-container');
  
  try {
    // Obtener detalles del parqueadero
    const result = await parqueaderos.getById(id);
    
    if (result.success) {
      parqueaderoActual = result.data;
      
      // Mostrar información del parqueadero
      if (infoContainer) {
        infoContainer.innerHTML = `
          <div style="background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
            <h2 style="font-size: 2rem; font-weight: 800; color: var(--dark); margin-bottom: 0.5rem;">${result.data.nombre}</h2>
            <p class="direccion" style="font-size: 1.1rem; margin-bottom: 2rem;">${result.data.direccion}</p>
            
            <div class="info-stats">
              <div class="stat">
                <span class="stat-label">Total de lugares</span>
                <span class="stat-value">${result.data.info_parqueadero?.cantidad_lugares || 0}</span>
              </div>
              <div class="stat disponibles">
                <span class="stat-label">Disponibles</span>
                <span class="stat-value">${result.data.info_parqueadero?.lug_disponibles || 0}</span>
              </div>
              <div class="stat ocupados">
                <span class="stat-label">Ocupados</span>
                <span class="stat-value">${result.data.info_parqueadero?.lug_ocupados || 0}</span>
              </div>
              <div class="stat precio">
                <span class="stat-label">Precio por hora</span>
                <span class="stat-value">${parseFloat(result.data.info_parqueadero?.precio_lugar || 0).toLocaleString('es-CO')}</span>
              </div>
            </div>
          </div>
        `;
      }
      
      // Mostrar lugares
      if (lugaresContainer && result.data.lugares) {
        lugaresContainer.innerHTML = result.data.lugares
          .map(lugar => crearTarjetaLugar(lugar))
          .join('');
      }
    } else {
      mostrarError('No se pudo cargar el parqueadero');
      setTimeout(() => {
        window.location.href = 'parqueos.html';
      }, 2000);
    }
  } catch (error) {
    console.error('Error cargando parqueadero:', error);
    mostrarError('Error al cargar la información del parqueadero');
  }
}

/**
 * Crear HTML de tarjeta de lugar
 */
function crearTarjetaLugar(lugar) {
  const esDisponible = lugar.estado === 'Disponible';
  const estadoClass = lugar.estado.toLowerCase().replace(' ', '-');
  
  return `
    <div class="lugar-card estado-${estadoClass}" 
         ${esDisponible ? `onclick="seleccionarLugar(${lugar.numero_lugar})"` : ''}>
      <div class="lugar-numero">${lugar.numero_lugar}</div>
      <div class="lugar-estado">${lugar.estado}</div>
      ${lugar.placa_vehiculo ? `<div class="lugar-placa">${lugar.placa_vehiculo}</div>` : ''}
    </div>
  `;
}

/**
 * Seleccionar un lugar para reservar
 */
function seleccionarLugar(numeroLugar) {
  const lugarInput = document.getElementById('numero_lugar');
  if (lugarInput) {
    lugarInput.value = numeroLugar;
  }
  
  // Remover clase 'seleccionado' de todos los lugares
  document.querySelectorAll('.lugar-card').forEach(card => {
    card.classList.remove('seleccionado');
  });
  
  // Agregar clase 'seleccionado' al lugar clickeado
  const lugarCards = document.querySelectorAll('.lugar-card');
  lugarCards.forEach(card => {
    if (card.querySelector('.lugar-numero').textContent == numeroLugar) {
      card.classList.add('seleccionado');
    }
  });
  
  // Scroll al formulario
  const reservaForm = document.getElementById('reservaForm');
  if (reservaForm) {
    reservaForm.scrollIntoView({ behavior: 'smooth' });
  }
  
  mostrarExito(`Lugar ${numeroLugar} seleccionado`);
}

/**
 * Manejar creación de reserva
 */
async function handleReserva(event) {
  event.preventDefault();
  
  if (!parqueaderoActual) {
    mostrarError('No hay parqueadero seleccionado');
    return;
  }
  
  // Obtener datos del formulario
  const formData = {
    id_empresa: parqueaderoActual.id_empresa,
    numero_lugar: parseInt(document.getElementById('numero_lugar').value),
    placa_vehiculo: document.getElementById('placa_vehiculo').value.toUpperCase(),
    doc_conductor: document.getElementById('doc_conductor').value,
    nombre_conductor: document.getElementById('nombre_conductor').value,
    telefono_conductor: document.getElementById('telefono_conductor').value,
    correo_conductor: document.getElementById('correo_conductor').value,
    modelo_vehiculo: document.getElementById('modelo_vehiculo').value,
    marca_vehiculo: document.getElementById('marca_vehiculo').value,
  };
  
  // Validar campos obligatorios
  if (!formData.numero_lugar || !formData.placa_vehiculo || !formData.doc_conductor || !formData.nombre_conductor) {
    mostrarError('Por favor completa todos los campos obligatorios');
    return;
  }
  
  const submitBtn = event.target.querySelector('button[type="submit"]');
  const originalText = submitBtn.textContent;
  submitBtn.disabled = true;
  submitBtn.textContent = 'Creando reserva...';
  
  try {
    const result = await reservas.crear(formData);
    
    if (result.success) {
      mostrarExito('¡Reserva creada exitosamente!');
      
      // Limpiar formulario
      event.target.reset();
      
      // Recargar información del parqueadero
      setTimeout(() => {
        cargarParqueadero(parqueaderoActual.id_empresa);
      }, 1500);
    } else {
      mostrarError(result.message || 'Error al crear la reserva');
    }
  } catch (error) {
    console.error('Error creando reserva:', error);
    mostrarError('Error al conectar con el servidor');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = originalText;
  }
}

/**
 * Consultar reserva por placa
 */
async function consultarPorPlaca() {
  const placaInput = document.getElementById('consulta_placa');
  const resultadoContainer = document.getElementById('resultado-consulta');
  
  if (!placaInput || !resultadoContainer) return;
  
  const placa = placaInput.value.trim().toUpperCase();
  
  if (!placa) {
    mostrarError('Por favor ingresa una placa');
    return;
  }
  
  resultadoContainer.innerHTML = '<p>Buscando...</p>';
  
  try {
    const result = await reservas.consultarPorPlaca(placa);
    
    if (result.success && result.data.length > 0) {
      resultadoContainer.innerHTML = `
        <h4>Reservas encontradas para ${placa}</h4>
        ${result.data.map(reserva => `
          <div class="reserva-info" style="background: #f5f5f5; padding: 1rem; margin: 0.5rem 0; border-radius: 8px;">
            <p><strong>Parqueadero:</strong> ${reserva.parqueadero}</p>
            <p><strong>Dirección:</strong> ${reserva.direccion}</p>
            <p><strong>Lugar:</strong> ${reserva.numero_lugar}</p>
            <p><strong>Estado:</strong> <span class="badge">${reserva.estado}</span></p>
          </div>
        `).join('')}
      `;
    } else {
      resultadoContainer.innerHTML = '<p class="no-data">No se encontraron reservas activas para esta placa</p>';
    }
  } catch (error) {
    console.error('Error consultando reserva:', error);
    resultadoContainer.innerHTML = '<p class="error">Error al consultar la reserva</p>';
  }
}