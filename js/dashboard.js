/**
 * HelpDesk AI — dashboard.js
 * Tickets dashboard logic: search, filter, display, modal
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

  // ===== DOM REFS =====
  var els = {
    grid: document.getElementById('ticketsGrid'),
    noResults: document.getElementById('noResults'),
    searchInput: document.getElementById('searchInput'),
    searchClear: document.getElementById('searchClear'),
    filterToggle: document.getElementById('filterToggle'),
    filterRow: document.getElementById('filterRow'),
    filterEstado: document.getElementById('filterEstado'),
    filterPrioridad: document.getElementById('filterPrioridad'),
    filterCategoria: document.getElementById('filterCategoria'),
    clearFilters: document.getElementById('clearFilters'),
    viewGrid: document.getElementById('viewGrid'),
    viewList: document.getElementById('viewList'),
    ticketLookup: document.getElementById('ticketLookup'),
    lookupBtn: document.getElementById('lookupBtn'),
    ticketDetailPanel: document.getElementById('ticketDetailPanel'),
    tdpClose: document.getElementById('tdpClose'),
    modalOverlay: document.getElementById('modalOverlay'),
    modal: document.getElementById('ticketModal'),
    modalClose: document.getElementById('modalClose'),
    modalClosBtn: document.getElementById('modalClosBtn'),
    modalTitle: document.getElementById('modalTitle'),
    modalTicketNum: document.getElementById('modalTicketNum'),
    modalBody: document.getElementById('modalBody'),
    statTotal: document.getElementById('statTotal'),
    statOpen: document.getElementById('statOpen'),
    statProgress: document.getElementById('statProgress'),
    statResolved: document.getElementById('statResolved')
  };

  // ===== INIT =====
  function init() {
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
      els.noResults.hidden = false;
      return;
    }

    els.noResults.hidden = true;

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

    var date = window.HelpDeskUtils
      ? HelpDeskUtils.formatDate(ticket.fecha_creacion)
      : new Date(ticket.fecha_creacion).toLocaleDateString('es-CO');

    var sanitize = window.HelpDeskUtils ? HelpDeskUtils.sanitize : function(s) { return s || '—'; };

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
    var total = state.tickets.length;
    var open = state.tickets.filter(function(t) { return t.estado === 'Abierto'; }).length;
    var progress = state.tickets.filter(function(t) { return t.estado === 'En progreso'; }).length;
    var resolved = state.tickets.filter(function(t) { return t.estado === 'Resuelto'; }).length;

    if (els.statTotal) els.statTotal.querySelector('.sp-num').textContent = total;
    if (els.statOpen) els.statOpen.querySelector('.sp-num').textContent = open;
    if (els.statProgress) els.statProgress.querySelector('.sp-num').textContent = progress;
    if (els.statResolved) els.statResolved.querySelector('.sp-num').textContent = resolved;
  }

  // ===== FILTER & SEARCH =====
  function applyFilters() {
    var query = state.searchQuery.toLowerCase().trim();
    var f = state.filters;

    state.filtered = state.tickets.filter(function(ticket) {
      // Search
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

      // Estado filter
      if (f.estado && ticket.estado !== f.estado) return false;

      // Prioridad filter
      if (f.prioridad && ticket.prioridad !== f.prioridad) return false;

      // Categoría filter
      if (f.categoria && !(ticket.categoria_ia || '').includes(f.categoria)) return false;

      return true;
    });

    render();
  }

  // ===== OPEN MODAL =====
  function openModal(ticket) {
    if (!els.modalOverlay || !els.modal) return;

    var sanitize = window.HelpDeskUtils ? HelpDeskUtils.sanitize : function(s) { return s || '—'; };
    var formatDate = window.HelpDeskUtils ? HelpDeskUtils.formatDate : function(d) { return new Date(d).toLocaleDateString('es-CO'); };

    if (els.modalTitle) els.modalTitle.textContent = ticket.incidencia + ' — ' + ticket.area;
    if (els.modalTicketNum) els.modalTicketNum.textContent = ticket.ticket_number;

    if (els.modalBody) {
      els.modalBody.innerHTML =
        // Información del solicitante
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

        // Detalles de la incidencia
        '<div class="modal-section">' +
          '<h4 class="modal-section-title">Detalles de la incidencia</h4>' +
          '<div class="modal-fields">' +
            '<div class="modal-field">' +
              '<span class="mf-label">Tipo</span>' +
              '<span class="mf-value">' + sanitize(ticket.incidencia) + '</span>' +
            '</div>' +
            '<div class="modal-field">' +
              '<span class="mf-label">Prioridad</span>' +
              '<span class="mf-value"><span class="badge-priority" data-value="' + sanitize(ticket.prioridad) + '">' + sanitize(ticket.prioridad) + '</span></span>' +
            '</div>' +
            '<div class="modal-field">' +
              '<span class="mf-label">Estado</span>' +
              '<span class="mf-value"><span class="badge-status" data-value="' + sanitize(ticket.estado) + '">' + sanitize(ticket.estado) + '</span></span>' +
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

        // Análisis IA
        '<div class="modal-section">' +
          '<h4 class="modal-section-title">Análisis de Inteligencia Artificial</h4>' +
          '<div class="modal-ai-box">' +
            '<div class="modal-ai-header">' +
              '<span>✦</span>' +
              '<span>Clasificación GPT-4</span>' +
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
    }

    els.modalOverlay.hidden = false;
    document.body.style.overflow = 'hidden';

    // Focus trap
    setTimeout(function() {
      var closeBtn = els.modal.querySelector('.modal-close');
      if (closeBtn) closeBtn.focus();
    }, 100);
  }

  // ===== CLOSE MODAL =====
  function closeModal() {
    if (els.modalOverlay) {
      els.modalOverlay.hidden = true;
      document.body.style.overflow = '';
    }
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
      .then(function(ticket) {
        openModal(ticket);
      })
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
        els.searchInput.value = '';
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

    // Filters
    if (els.filterEstado) {
      els.filterEstado.addEventListener('change', function() {
        state.filters.estado = this.value;
        applyFilters();
      });
    }
    if (els.filterPrioridad) {
      els.filterPrioridad.addEventListener('change', function() {
        state.filters.prioridad = this.value;
        applyFilters();
      });
    }
    if (els.filterCategoria) {
      els.filterCategoria.addEventListener('change', function() {
        state.filters.categoria = this.value;
        applyFilters();
      });
    }

    // Clear filters
    if (els.clearFilters) {
      els.clearFilters.addEventListener('click', function() {
        state.filters = { estado: '', prioridad: '', categoria: '' };
        state.searchQuery = '';
        if (els.filterEstado) els.filterEstado.value = '';
        if (els.filterPrioridad) els.filterPrioridad.value = '';
        if (els.filterCategoria) els.filterCategoria.value = '';
        if (els.searchInput) els.searchInput.value = '';
        if (els.searchClear) els.searchClear.hidden = true;
        applyFilters();
      });
    }

    // View toggle
    if (els.viewGrid) {
      els.viewGrid.addEventListener('click', function() {
        state.view = 'grid';
        els.grid.classList.remove('list-view');
        els.viewGrid.classList.add('view-btn--active');
        els.viewList.classList.remove('view-btn--active');
      });
    }
    if (els.viewList) {
      els.viewList.addEventListener('click', function() {
        state.view = 'list';
        els.grid.classList.add('list-view');
        els.viewList.classList.add('view-btn--active');
        els.viewGrid.classList.remove('view-btn--active');
      });
    }

    // Ticket lookup
    if (els.lookupBtn) {
      els.lookupBtn.addEventListener('click', lookupTicket);
    }
    if (els.ticketLookup) {
      els.ticketLookup.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') lookupTicket();
      });
    }

    // Modal close
    if (els.modalClose) {
      els.modalClose.addEventListener('click', closeModal);
    }
    if (els.modalClosBtn) {
      els.modalClosBtn.addEventListener('click', closeModal);
    }
    if (els.modalOverlay) {
      els.modalOverlay.addEventListener('click', function(e) {
        if (e.target === els.modalOverlay) closeModal();
      });
    }

    // Keyboard
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
