/**
 * parqueos.js
 * Vista: parqueos.html
 * Mobile-first, lista dinámica, mock + opción de API real.
 *
 * Para conectar a un backend real, cambiar API_URL a la URL base de tu API.
 */

document.addEventListener("DOMContentLoaded", () => {
    // === CONFIG ===
    // Si quieres usar tu backend real, pon la URL aquí, por ejemplo:
    // const API_URL = "https://mi-backend.com/api";
    // Si API_URL es null, se usa el mock local.
    const API_URL = null;
  
    // Elementos del DOM
    const listContainer = document.getElementById("listContainer");
    const searchInput = document.getElementById("searchInput");
    const sortSelect = document.getElementById("sortSelect");
    const onlyAvailableToggle = document.getElementById("onlyAvailableToggle");
    const refreshBtn = document.getElementById("refreshBtn");
    const emptyState = document.getElementById("emptyState");
    const clearFiltersBtn = document.getElementById("clearFiltersBtn");
    const backBtn = document.getElementById("backBtn");
  
    // Estado local
    let parqueaderos = []; // datos crudos
    let filtered = [];     // datos filtrados/ordenados
  
    // Manejo de navegación atrás
    backBtn && backBtn.addEventListener("click", () => history.back());
  
    // Funciones para obtener datos
    async function fetchParqueaderos() {
      if (API_URL) {
        // Petición real al backend
        try {
          const res = await fetch(`${API_URL}/parqueaderos`);
          if (!res.ok) throw new Error("Error al cargar parqueaderos");
          return await res.json();
        } catch (err) {
          console.error(err);
          alert("No se pudo conectar con el servidor.");
          return [];
        }
      } else {
        // Mock local (útil para prototipado)
        return mockParqueaderos();
      }
    }
  
    // Mock de datos: puedes editar estos objetos para probar distintos casos
    function mockParqueaderos() {
      return [
        {
          id: "p-101",
          nombre: "Parqueadero Central",
          direccion: "Calle 10 #5-20",
          capacidad: 30,
          disponibles: 5,
          precio_hora: 3000,
          distancia_km: 1.2,
          descripcion: "Cerca a la estación central. Seguridad 24/7."
        },
        {
          id: "p-102",
          nombre: "Estacionamiento Norte",
          direccion: "Av. Norte 45",
          capacidad: 50,
          disponibles: 0,
          precio_hora: 2500,
          distancia_km: 3.4,
          descripcion: "Amplio, cubierto, ideal para jornadas largas."
        },
        {
          id: "p-103",
          nombre: "Parqueo La Plaza",
          direccion: "Cra 8 #22-10",
          capacidad: 15,
          disponibles: 2,
          precio_hora: 4000,
          distancia_km: 0.6,
          descripcion: "Muy céntrico, tarifas altas en horas pico."
        },
        {
          id: "p-104",
          nombre: "MiniPark Sur",
          direccion: "Transversal Sur 12",
          capacidad: 10,
          disponibles: 6,
          precio_hora: 2000,
          distancia_km: 4.1,
          descripcion: "Económico y rápido acceso a la autopista."
        }
      ];
    }
  
    // Render de tarjeta individual
    function renderCard(p) {
      // contenedor tarjeta
      const card = document.createElement("article");
      card.className = "card";
      card.setAttribute("data-id", p.id);
  
      const meta = document.createElement("div");
      meta.className = "meta";
  
      const title = document.createElement("h3");
      title.textContent = p.nombre;
      meta.appendChild(title);
  
      const addr = document.createElement("p");
      addr.textContent = p.direccion;
      meta.appendChild(addr);
  
      const desc = document.createElement("p");
      desc.textContent = p.descripcion;
      meta.appendChild(desc);
  
      const infoRow = document.createElement("div");
      infoRow.style.marginTop = "8px";
  
      const capBadge = document.createElement("span");
      capBadge.className = "badge";
      capBadge.textContent = `Capacidad ${p.capacidad}`;
      infoRow.appendChild(capBadge);
  
      const avail = document.createElement("span");
      avail.className = "availability";
      avail.style.marginLeft = "8px";
      avail.textContent = `${p.disponibles} disponibles`;
      infoRow.appendChild(avail);
  
      meta.appendChild(infoRow);
  
      // acciones (precio + reservar)
      const actions = document.createElement("div");
      actions.className = "actions";
  
      const price = document.createElement("div");
      price.className = "price";
      price.textContent = `${formatCurrency(p.precio_hora)} / h`;
      actions.appendChild(price);
  
      const btn = document.createElement("button");
      btn.className = "btn-reserve";
      btn.textContent = "Reservar";
      btn.addEventListener("click", () => onReserveClick(p));
      // disable si no hay disponibles
      if (!p.disponibles || p.disponibles <= 0) {
        btn.disabled = true;
        btn.style.opacity = 0.6;
        btn.textContent = "Sin espacios";
      }
  
      actions.appendChild(btn);
  
      card.appendChild(meta);
      card.appendChild(actions);
  
      return card;
    }
  
    // formatea moneda local (COP) sin usar Intl para compatibilidad simple
    function formatCurrency(num) {
      // asume valor entero en pesos
      return `${num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")}`;
    }
  
    // Render completo de lista a partir de filtered
    function renderList() {
      listContainer.innerHTML = "";
      if (!filtered.length) {
        emptyState.hidden = false;
        return;
      }
      emptyState.hidden = true;
  
      const fragment = document.createDocumentFragment();
      filtered.forEach(p => fragment.appendChild(renderCard(p)));
      listContainer.appendChild(fragment);
    }
  
    // Aplica filtros y ordenamientos sobre 'parqueaderos' -> setea 'filtered'
    function applyFilters() {
      const q = searchInput.value.trim().toLowerCase();
      const onlyAvailable = onlyAvailableToggle.checked;
      const sort = sortSelect.value;
  
      let arr = parqueaderos.slice();
  
      // búsqueda por nombre o dirección
      if (q) {
        arr = arr.filter(p => {
          return (p.nombre && p.nombre.toLowerCase().includes(q)) ||
                 (p.direccion && p.direccion.toLowerCase().includes(q));
        });
      }
  
      // si toggle solo disponibles o sort seleccion 'disponibles'
      if (onlyAvailable || sort === "disponibles") {
        arr = arr.filter(p => p.disponibles && p.disponibles > 0);
      }
  
      // ordenamiento por precio
      if (sort === "precio-asc") {
        arr.sort((a,b) => a.precio_hora - b.precio_hora);
      } else if (sort === "precio-desc") {
        arr.sort((a,b) => b.precio_hora - a.precio_hora);
      } else {
        // recomendado (por defecto): ordenar por distancia si existe, sino por disponibilidad
        arr.sort((a,b) => {
          if (a.distancia_km != null && b.distancia_km != null) return a.distancia_km - b.distancia_km;
          return (b.disponibles || 0) - (a.disponibles || 0);
        });
      }
  
      filtered = arr;
      renderList();
    }
  
    // evento click reservar
    function onReserveClick(parqueadero) {
      // verifica sesión
      const usuario = localStorage.getItem("usuario");
      if (!usuario) {
        // redirigir a login y guardar intención de reserva
        localStorage.setItem("intencionReserva", JSON.stringify({ parqueaderoId: parqueadero.id }));
        window.location.href = "login.html";
        return;
      }
  
      // guardamos la selección y redirigimos a la página de reserva
      localStorage.setItem("seleccionParqueadero", JSON.stringify(parqueadero));
      // Puedes pasar por querystring si lo prefieres:
      // window.location.href = `reserva.html?id=${encodeURIComponent(parqueadero.id)}`;
      window.location.href = "reserva.html";
    }
  
    // Inicialización: cargar datos y establecer listeners
    async function init() {
      // UI listeners
      searchInput.addEventListener("input", debounce(() => applyFilters(), 250));
      sortSelect.addEventListener("change", applyFilters);
      onlyAvailableToggle.addEventListener("change", applyFilters);
      refreshBtn.addEventListener("click", loadData);
      clearFiltersBtn && clearFiltersBtn.addEventListener("click", () => {
        searchInput.value = "";
        onlyAvailableToggle.checked = false;
        sortSelect.value = "recomendado";
        applyFilters();
      });
  
      // Cargar datos
      await loadData();
    }
  
    // Carga datos (fetch/mock) y aplica filtros
    async function loadData() {
      listContainer.innerHTML = '<p style="padding:12px;background:#fff;border-radius:8px;">Cargando...</p>';
      parqueaderos = await fetchParqueaderos();
  
      // normalizar campos mínimos por si el backend no los trae
      parqueaderos = parqueaderos.map(p => ({
        id: p.id || String(Math.random()).slice(2,9),
        nombre: p.nombre || "Parqueadero sin nombre",
        direccion: p.direccion || "-",
        capacidad: Number(p.capacidad) || 0,
        disponibles: Number(p.disponibles) || 0,
        precio_hora: Number(p.precio_hora) || 0,
        distancia_km: p.distancia_km != null ? Number(p.distancia_km) : null,
        descripcion: p.descripcion || ""
      }));
  
      applyFilters();
    }
  
    // util: debounce
    function debounce(fn, wait) {
      let t;
      return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn.apply(this, args), wait);
      };
    }
  
    // Iniciar
    init();
  });
  