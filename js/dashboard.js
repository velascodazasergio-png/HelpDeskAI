/**
 * HelpDesk AI — dashboard.js (FIXED)
 * Fixes aplicados:
 *  1. els se inicializa DENTRO de init() — garantiza que DOM existe
 *  2. openModal obtiene refs en tiempo de ejecución, no desde caché
 *  3. try/catch en innerHTML por si falla la construcción
 *  4. updateStats con querySelector seguro
 *  5. Event listeners de modal usan getElementById directo
 *  6. modalOverlay se verifica con hidden=true al init por seguridad
 */

'use strict';

(function() {

  // ===== STATE =====
  var state = {
    tickets: [],
    filtered: [],
    view: 'grid',
    searchQuery: '',
    filters: {
      estado: '',
      prioridad: '',
      categoria: ''
    }
  };

  // ===== DOM REFS — se asignan en init() para garantizar que el DOM existe =====
  var els = {};

  function initEls() {
    els = {
      grid:            document.getElementById('ticketsGrid'),
      noResults:       document.getElementById('noResults'),
      searchInput:     document.getElementById('searchInput'),
      searchClear:     document.getElementById('searchClear'),
      filterToggle:    document.getElementById('filterToggle'),
      filterRow:       document.getElementById('filterRow'),
      filterEstado:    document.getElementById('filterEstado'),
      filterPrioridad: document.getElementById('filterPrioridad'),
      filterCategoria: document.getElementById('filterCategoria'),
      clearFilters:    document.getElementById('clearFilters'),
      viewGrid:        document.getElementById('viewGrid'),
      viewList:        document.getElementById('viewList'),
      ticketLookup:    document.getElementById('ticketLookup'),
      lookupBtn:       document.getElementById('lookupBtn'),
      statTotal:       document.getElementById('statTotal'),
      statOpen:        document.getElementById('statOpen'),
      statProgress:    document.getElementById('statProgress'),
      statResolved:    document.getElementById('statResolved')
    };

    // Asegurar que el modal empieza oculto siempre
    var overlay = document.getElementById('modalOverlay');
    if (overlay) {
      overlay.hidden = true;
    }
    document.body.style.overflow = '';
  }

  // ===== INIT =====
  function init() {
    initEls();
    loadTickets();
    bindEvents();
  }

  // ===== LOAD TICKETS =====
  function loadTickets() {
    HelpDeskAPI.listarTickets().then(function(tickets) {
      state.tickets = tickets;
      state.filtered = tickets;
      render();
      updateStats();
    }).catch(function(err) {
      console.error('[Dashboard] Error cargando tickets:', err);
      if (window.HelpDeskUtils) {
        HelpDeskUtils.showToast('Error al cargar los tickets', 'error');
      }
    });
  }

  // ===== RENDER TICKETS =====
  function render() {
    if (!els.grid) return;
    els.grid.innerHTML = '';

    if (state.filtered.length === 0) {
      if (els.noResults) els.noResults.hidden = false;
      return;
    }

    if (els.noResults) els.noResults.hidden = true;

    state.filtered.forEach(function(ticket, index) {
      var card = createTicketCard(ticket, index);
      els.grid.appendChild(card);
    });
  }

  // ===== CREATE TICKET CARD =====
  function createTicketCard(ticket, index) {
    var card = document.createElement('div');
    card.className = 'ticket-item';
    card.setAttribute('data-priority', ticket.prioridad || '');
    card.setAttribute('data-ticket-id', ticket.ticket_number);
    card.style.animationDelay = (index * 0.05) + 's';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute('aria-label', 'Ver detalles del ticket ' + ticket.ticket_number);

    var sanitize   = window.HelpDeskUtils ? HelpDeskUtils.sanitize   : function(s) { return s || '—'; };
    var formatDate = window.HelpDeskUtils ? HelpDeskUtils.formatDate  : function(d) { return new Date(d).toLocaleDateString('es-CO'); };
    var date       = formatDate(ticket.fecha_creacion);

    card.innerHTML =
      '<div class="ti-header">' +
        '<span class="ti-id">' + sanitize(ticket.ticket_number) + '</span>' +
        '<div class="ti-badges">' +
          '<span class="badge-priority" data-value="' + sanitize(ticket.prioridad) + '">' + sanitize(ticket.prioridad) + '</span>' +
          '<span class="badge-status" data-value="' + sanitize(ticket.estado) + '">' + sanitize(ticket.estado) + '</span>' +
        '</div>' +
      '</div>' +
      '<p class="ti-title">' + sanitize(ticket.incidencia) + ' — ' + sanitize(ticket.area) + '</p>' +
      '<p class="ti-desc">' + sanitize(ticket.descripcion) + '</p>' +
      '<div class="ti-ai">' +
        '<span class="ti-ai-dot">✦</span>' +
        'IA: ' + sanitize(ticket.categoria_ia || ticket.incidencia) +
      '</div>' +
      '<div class="ti-footer">' +
        '<span class="ti-meta ti-area">' + sanitize(ticket.area) + '</span>' +
        '<span class="ti-meta">' + date + '</span>' +
        '<svg class="ti-arrow" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>' +
      '</div>';

    card.addEventListener('click', function() { openModal(ticket); });
    card.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openModal(ticket);
      }
    });

    return card;
  }

  // ===== UPDATE STATS =====
  function updateStats() {
    function setNum(el, val) {
      if (!el) return;
      var num = el.querySelector('.sp-num');
      if (num) num.textContent = val;
    }
    setNum(els.statTotal,    state.tickets.length);
    setNum(els.statOpen,     state.tickets.filter(function(t) { return t.estado === 'Abierto'; }).length);
    setNum(els.statProgress, state.tickets.filter(function(t) { return t.estado === 'En progreso'; }).length);
    setNum(els.statResolved, state.tickets.filter(function(t) { return t.estado === 'Resuelto'; }).length);
  }

  // ===== FILTER & SEARCH =====
  function applyFilters() {
    var query = state.searchQuery.toLowerCase().trim();
    var f     = state.filters;

    state.filtered = state.tickets.filter(function(ticket) {
      if (query) {
        var searchable = [
          ticket.ticket_number,
          ticket.nombre,
          ticket.area,
          ticket.incidencia,
          ticket.descripcion,
          ticket.estado,
          ticket.categoria_ia
        ].join(' ').toLowerCase();
        if (!searchable.includes(query)) return false;
      }
      if (f.estado    && ticket.estado    !== f.estado)    return false;
      if (f.prioridad && ticket.prioridad !== f.prioridad) return false;
      if (f.categoria && !(ticket.categoria_ia || '').includes(f.categoria)) return false;
      return true;
    });

    render();
  }

  // ===== OPEN MODAL =====
  function openModal(ticket) {
    // Siempre obtener referencias frescas del DOM
    var overlay = document.getElementById('modalOverlay');
    var body    = document.getElementById('modalBody');
    var titleEl = document.getElementById('modalTitle');
    var numEl   = document.getElementById('modalTicketNum');

    if (!overlay || !body) {
      console.error('[Dashboard] No se encontró #modalOverlay o #modalBody.');
      return;
    }

    var sanitize   = window.HelpDeskUtils ? HelpDeskUtils.sanitize  : function(s) { return s || '—'; };
    var formatDate = window.HelpDeskUtils ? HelpDeskUtils.formatDate : function(d) { return new Date(d).toLocaleDateString('es-CO'); };

    if (titleEl) titleEl.textContent = (ticket.incidencia || '—') + ' — ' + (ticket.area || '—');
    if (numEl)   numEl.textContent   = ticket.ticket_number || '';

    try {
      body.innerHTML =
        '<div class="modal-section">' +
          '<h4 class="modal-section-title">Datos del solicitante</h4>' +
          '<div class="modal-fields">' +
            '<div class="modal-field">' +
              '<span class="mf-label">Nombre</span>' +
              '<span class="mf-value">' + sanitize(ticket.nombre) + '</span>' +
            '</div>' +
            '<div class="modal-field">' +
              '<span class="mf-label">Correo</span>' +
              '<span class="mf-value">' + sanitize(ticket.correo) + '</span>' +
            '</div>' +
            '<div class="modal-field">' +
              '<span class="mf-label">Teléfono</span>' +
              '<span class="mf-value">' + sanitize(ticket.telefono) + '</span>' +
            '</div>' +
            '<div class="modal-field">' +
              '<span class="mf-label">Área</span>' +
              '<span class="mf-value">' + sanitize(ticket.area) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="modal-section">' +
          '<h4 class="modal-section-title">Detalles de la incidencia</h4>' +
          '<div class="modal-fields">' +
            '<div class="modal-field">' +
              '<span class="mf-label">Tipo</span>' +
              '<span class="mf-value">' + sanitize(ticket.incidencia) + '</span>' +
            '</div>' +
            '<div class="modal-field">' +
              '<span class="mf-label">Prioridad</span>' +
              '<span class="mf-value">' +
                '<span class="badge-priority" data-value="' + sanitize(ticket.prioridad) + '">' + sanitize(ticket.prioridad) + '</span>' +
              '</span>' +
            '</div>' +
            '<div class="modal-field">' +
              '<span class="mf-label">Estado</span>' +
              '<span class="mf-value">' +
                '<span class="badge-status" data-value="' + sanitize(ticket.estado) + '">' + sanitize(ticket.estado) + '</span>' +
              '</span>' +
            '</div>' +
            '<div class="modal-field">' +
              '<span class="mf-label">Fecha</span>' +
              '<span class="mf-value">' + formatDate(ticket.fecha_creacion) + '</span>' +
            '</div>' +
            '<div class="modal-field modal-field--full">' +
              '<span class="mf-label">Descripción</span>' +
              '<span class="mf-value mf-value--muted">' + sanitize(ticket.descripcion) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>' +

        '<div class="modal-section">' +
          '<h4 class="modal-section-title">Análisis de Inteligencia Artificial</h4>' +
          '<div class="modal-ai-box">' +
            '<div class="modal-ai-header">' +
              '<span>✦</span><span>Clasificación GPT-4</span>' +
            '</div>' +
            '<div class="modal-fields">' +
              '<div class="modal-field">' +
                '<span class="mf-label">Categoría detectada</span>' +
                '<span class="mf-value">' + sanitize(ticket.categoria_ia || ticket.incidencia) + '</span>' +
              '</div>' +
              '<div class="modal-field">' +
                '<span class="mf-label">Prioridad IA</span>' +
                '<span class="mf-value">' + sanitize(ticket.prioridad) + '</span>' +
              '</div>' +
              '<div class="modal-field modal-field--full">' +
                '<span class="mf-label">Resumen ejecutivo</span>' +
                '<span class="mf-value mf-value--muted">' + sanitize(ticket.resumen_ia || 'Análisis IA no disponible') + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
        '</div>';
    } catch (e) {
      console.error('[Dashboard] Error al construir modal body:', e);
      body.innerHTML = '<p style="color:#fca5a5;padding:1rem;">Error al cargar los detalles del ticket.</p>';
    }

    overlay.hidden = false;
    document.body.style.overflow = 'hidden';

    setTimeout(function() {
      var closeBtn = document.getElementById('modalClose');
      if (closeBtn) closeBtn.focus();
    }, 100);
  }

  // ===== CLOSE MODAL =====
  function closeModal() {
    var overlay = document.getElementById('modalOverlay');
    if (overlay) overlay.hidden = true;
    document.body.style.overflow = '';
  }

  // ===== TICKET LOOKUP =====
  function lookupTicket() {
    var num = els.ticketLookup ? els.ticketLookup.value.trim() : '';
    if (!num) {
      if (window.HelpDeskUtils) HelpDeskUtils.showToast('Ingresa un número de ticket', 'error');
      return;
    }

    var btn = els.lookupBtn;
    if (btn) { btn.disabled = true; btn.textContent = 'Buscando...'; }

    HelpDeskAPI.consultarTicket(num)
      .then(function(ticket) { openModal(ticket); })
      .catch(function(err) {
        if (window.HelpDeskUtils) HelpDeskUtils.showToast(err.message || 'Ticket no encontrado', 'error');
      })
      .finally(function() {
        if (btn) { btn.disabled = false; btn.textContent = 'Consultar'; }
      });
  }

  // ===== BIND EVENTS =====
  function bindEvents() {

    // Search
    if (els.searchInput) {
      var debouncedSearch = window.HelpDeskUtils
        ? HelpDeskUtils.debounce(function() {
            state.searchQuery = els.searchInput.value;
            if (els.searchClear) els.searchClear.hidden = !state.searchQuery;
            applyFilters();
          }, 300)
        : function() {
            state.searchQuery = els.searchInput.value;
            if (els.searchClear) els.searchClear.hidden = !state.searchQuery;
            applyFilters();
          };
      els.searchInput.addEventListener('input', debouncedSearch);
    }

    if (els.searchClear) {
      els.searchClear.addEventListener('click', function() {
        if (els.searchInput) els.searchInput.value = '';
        state.searchQuery = '';
        els.searchClear.hidden = true;
        applyFilters();
      });
    }

    // Filter toggle
    if (els.filterToggle && els.filterRow) {
      els.filterToggle.addEventListener('click', function() {
        els.filterRow.hidden = !els.filterRow.hidden;
        els.filterToggle.classList.toggle('active', !els.filterRow.hidden);
      });
    }

    if (els.filterEstado) {
      els.filterEstado.addEventListener('change', function() {
        state.filters.estado = this.value; applyFilters();
      });
    }
    if (els.filterPrioridad) {
      els.filterPrioridad.addEventListener('change', function() {
        state.filters.prioridad = this.value; applyFilters();
      });
    }
    if (els.filterCategoria) {
      els.filterCategoria.addEventListener('change', function() {
        state.filters.categoria = this.value; applyFilters();
      });
    }

    if (els.clearFilters) {
      els.clearFilters.addEventListener('click', function() {
        state.filters = { estado: '', prioridad: '', categoria: '' };
        state.searchQuery = '';
        if (els.filterEstado)    els.filterEstado.value    = '';
        if (els.filterPrioridad) els.filterPrioridad.value = '';
        if (els.filterCategoria) els.filterCategoria.value = '';
        if (els.searchInput)     els.searchInput.value     = '';
        if (els.searchClear)     els.searchClear.hidden    = true;
        applyFilters();
      });
    }

    // View toggle
    if (els.viewGrid) {
      els.viewGrid.addEventListener('click', function() {
        state.view = 'grid';
        if (els.grid) els.grid.classList.remove('list-view');
        els.viewGrid.classList.add('view-btn--active');
        if (els.viewList) els.viewList.classList.remove('view-btn--active');
      });
    }
    if (els.viewList) {
      els.viewList.addEventListener('click', function() {
        state.view = 'list';
        if (els.grid) els.grid.classList.add('list-view');
        els.viewList.classList.add('view-btn--active');
        if (els.viewGrid) els.viewGrid.classList.remove('view-btn--active');
      });
    }

    // Ticket lookup
    if (els.lookupBtn)    els.lookupBtn.addEventListener('click', lookupTicket);
    if (els.ticketLookup) els.ticketLookup.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') lookupTicket();
    });

    // Modal close — listener delegado en document para evitar refs rotas
    document.addEventListener('click', function(e) {
      var id = e.target && e.target.id;
      if (id === 'modalClose' || id === 'modalClosBtn' || id === 'modalOverlay') {
        closeModal();
      }
    });

    // ESC cierra el modal
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') closeModal();
    });
  }

  // ===== START =====
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();