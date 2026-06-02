/**
 * ticket.ts — Lógica de consulta y gestión de tickets
 * HelpDesk AI — Sistema de Gestión de Incidencias
 * TypeScript: compilar con tsc ticket.ts --target ES6 --outFile ../js/ticket-compiled.js
 */

import type { Ticket, TicketStatus, TicketPriority, DashboardState } from "./types";

// ─── Constantes ────────────────────────────────────────────────────────────────

const TICKETS_API_URL: string = "AQUI_API_TICKETS";
const CACHE_TTL_MS: number = 60_000; // 1 minuto

// ─── Cache simple en memoria ──────────────────────────────────────────────────

interface CacheEntry {
  data: Ticket;
  timestamp: number;
}

const ticketCache = new Map<string, CacheEntry>();

function getCached(ticketNumber: string): Ticket | null {
  const entry = ticketCache.get(ticketNumber);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    ticketCache.delete(ticketNumber);
    return null;
  }
  return entry.data;
}

function setCache(ticketNumber: string, data: Ticket): void {
  ticketCache.set(ticketNumber, { data, timestamp: Date.now() });
}

// ─── Datos mock para demostración ─────────────────────────────────────────────

const MOCK_TICKETS: Ticket[] = [
  {
    id: 1,
    ticket_number: "TK-2847",
    nombre: "Carlos Ramírez",
    correo: "carlos.ramirez@empresa.com",
    telefono: "+57 300 123 4567",
    area: "Infraestructura",
    incidencia: "Red / Conectividad",
    prioridad: "Alta",
    descripcion:
      "No hay conexión a internet en el piso 3 del edificio principal. Afecta a 12 usuarios. El switch del rack parece apagado.",
    categoria_ia: "Red / Conectividad",
    resumen_ia:
      "Interrupción de red en piso 3 afectando 12 usuarios. Posible falla en switch de distribución.",
    estado: "En Proceso",
    fecha_creacion: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    comentarios: [
      {
        id: 1,
        ticket_id: 1,
        autor: "Soporte T1",
        mensaje: "Se verificó el switch principal. Requiere reemplazo del módulo de alimentación.",
        fecha: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        tipo: "interno",
      },
    ],
  },
  {
    id: 2,
    ticket_number: "TK-2843",
    nombre: "Ana Martínez",
    correo: "ana.martinez@empresa.com",
    telefono: "+57 315 987 6543",
    area: "Recursos Humanos",
    incidencia: "Software",
    prioridad: "Media",
    descripcion:
      "El sistema de nómina no abre desde ayer. Aparece el error 'Connection timeout' al intentar iniciar sesión.",
    categoria_ia: "Software",
    resumen_ia:
      "Falla en sistema de nómina con error de timeout. Probable problema de conectividad con servidor de base de datos.",
    estado: "Abierto",
    fecha_creacion: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 3,
    ticket_number: "TK-2839",
    nombre: "Roberto Sánchez",
    correo: "roberto.sanchez@empresa.com",
    telefono: "+57 320 456 7890",
    area: "Contabilidad",
    incidencia: "Hardware",
    prioridad: "Baja",
    descripcion: "La impresora del área no imprime en color. Solo imprime en blanco y negro aunque el modo color está seleccionado.",
    categoria_ia: "Periféricos",
    resumen_ia: "Falla en impresión a color. Posible cartucho de color agotado o driver desactualizado.",
    estado: "Resuelto",
    fecha_creacion: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    fecha_resolucion: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 4,
    ticket_number: "TK-2835",
    nombre: "Laura Díaz",
    correo: "laura.diaz@empresa.com",
    telefono: "+57 310 234 5678",
    area: "Ventas",
    incidencia: "Acceso / Contraseña",
    prioridad: "Alta",
    descripcion: "No puedo acceder al CRM. Mi contraseña fue reseteada sin previo aviso y tampoco llega el correo de recuperación.",
    categoria_ia: "Acceso / Seguridad",
    resumen_ia: "Bloqueo de acceso a CRM. Usuario sin recibir correo de recuperación. Revisar filtros de spam y estado de cuenta.",
    estado: "En Proceso",
    fecha_creacion: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 5,
    ticket_number: "TK-2831",
    nombre: "Miguel Torres",
    correo: "miguel.torres@empresa.com",
    telefono: "+57 318 765 4321",
    area: "Gerencia",
    incidencia: "Hardware",
    prioridad: "Crítica",
    descripcion: "El laptop del gerente general no enciende. Tiene una presentación importante en 2 horas. Necesita reemplazo urgente.",
    categoria_ia: "Hardware",
    resumen_ia: "Falla crítica en laptop gerencial. Requiere sustitución inmediata por impacto en reunión ejecutiva.",
    estado: "En Proceso",
    fecha_creacion: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
  },
  {
    id: 6,
    ticket_number: "TK-2828",
    nombre: "Sofía Gómez",
    correo: "sofia.gomez@empresa.com",
    telefono: "+57 312 345 6789",
    area: "Marketing",
    incidencia: "Software",
    prioridad: "Media",
    descripcion: "Adobe Photoshop se cierra inesperadamente cuando intento exportar archivos en formato PNG de más de 100MB.",
    categoria_ia: "Software",
    resumen_ia: "Falla en Adobe Photoshop al exportar PNG de gran tamaño. Posible problema de memoria RAM insuficiente.",
    estado: "Resuelto",
    fecha_creacion: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    fecha_resolucion: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── Funciones de consulta ─────────────────────────────────────────────────────

async function fetchTicketByNumber(ticketNumber: string): Promise<Ticket | null> {
  const normalized = ticketNumber.trim().toUpperCase();

  // Verificar caché
  const cached = getCached(normalized);
  if (cached) return cached;

  // Si la API real no está configurada, usar mock
  if (TICKETS_API_URL === "AQUI_API_TICKETS") {
    await new Promise((r) => setTimeout(r, 800)); // Simular latencia
    const found = MOCK_TICKETS.find(
      (t) => t.ticket_number.toUpperCase() === normalized
    ) ?? null;
    if (found) setCache(normalized, found);
    return found;
  }

  // Llamada real a la API
  const response = await fetch(`${TICKETS_API_URL}/${encodeURIComponent(normalized)}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "X-Source": "helpdesk-web",
    },
  });

  if (response.status === 404) return null;
  if (!response.ok) throw new Error(`Error API (${response.status})`);

  const ticket: Ticket = await response.json();
  setCache(normalized, ticket);
  return ticket;
}

async function fetchAllTickets(
  status?: TicketStatus,
  priority?: TicketPriority,
  page: number = 1,
  limit: number = 12
): Promise<{ tickets: Ticket[]; total: number; pages: number }> {
  if (TICKETS_API_URL === "AQUI_API_TICKETS") {
    await new Promise((r) => setTimeout(r, 600));
    let filtered = [...MOCK_TICKETS];
    if (status) filtered = filtered.filter((t) => t.estado === status);
    if (priority) filtered = filtered.filter((t) => t.prioridad === priority);
    const start = (page - 1) * limit;
    return {
      tickets: filtered.slice(start, start + limit),
      total: filtered.length,
      pages: Math.ceil(filtered.length / limit),
    };
  }

  const params = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(status && { status }),
    ...(priority && { priority }),
  });

  const response = await fetch(`${TICKETS_API_URL}?${params}`, {
    headers: { "X-Source": "helpdesk-web" },
  });

  if (!response.ok) throw new Error(`Error API (${response.status})`);
  return response.json();
}

// ─── Helpers de formato ────────────────────────────────────────────────────────

function formatDate(dateStr: string): string {
  try {
    return new Intl.DateTimeFormat("es-CO", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

function getTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  const hours = Math.floor(mins / 60);
  const days = Math.floor(hours / 24);
  if (days > 0) return `hace ${days} día${days > 1 ? "s" : ""}`;
  if (hours > 0) return `hace ${hours} hora${hours > 1 ? "s" : ""}`;
  if (mins > 0) return `hace ${mins} minuto${mins > 1 ? "s" : ""}`;
  return "hace un momento";
}

function getPriorityClass(prioridad: string): string {
  const map: Record<string, string> = {
    crítica: "priority-critical",
    alta: "priority-high",
    media: "priority-medium",
    baja: "priority-low",
  };
  return map[prioridad.toLowerCase()] ?? "priority-low";
}

function getStatusClass(estado: string): string {
  const map: Record<string, string> = {
    "abierto": "status-open",
    "en proceso": "status-progress",
    "resuelto": "status-resolved",
    "cerrado": "status-closed",
  };
  return map[estado.toLowerCase()] ?? "status-open";
}

function getStatusIcon(estado: string): string {
  const map: Record<string, string> = {
    "abierto": "🔴",
    "en proceso": "🟡",
    "resuelto": "🟢",
    "cerrado": "⚫",
  };
  return map[estado.toLowerCase()] ?? "🔵";
}

// ─── Renderizado de ticket individual ─────────────────────────────────────────

function renderTicketDetail(ticket: Ticket, container: HTMLElement): void {
  const priorityClass = getPriorityClass(ticket.prioridad);
  const statusClass = getStatusClass(ticket.estado);
  const statusIcon = getStatusIcon(ticket.estado);

  container.innerHTML = `
    <div class="ticket-detail-card">
      <div class="ticket-detail-header ${priorityClass}">
        <div class="ticket-detail-id">
          <span class="ticket-icon">🎫</span>
          <span>${ticket.ticket_number}</span>
        </div>
        <div class="ticket-detail-badges">
          <span class="badge badge-priority ${priorityClass}">${ticket.prioridad}</span>
          <span class="badge badge-status ${statusClass}">${statusIcon} ${ticket.estado}</span>
        </div>
      </div>

      <div class="ticket-detail-body">
        <div class="ticket-grid">
          <div class="ticket-info-group">
            <h4>👤 Información del Usuario</h4>
            <p><strong>Nombre:</strong> ${escapeHtml(ticket.nombre)}</p>
            <p><strong>Correo:</strong> <a href="mailto:${escapeHtml(ticket.correo)}">${escapeHtml(ticket.correo)}</a></p>
            <p><strong>Teléfono:</strong> ${escapeHtml(ticket.telefono)}</p>
          </div>

          <div class="ticket-info-group">
            <h4>📋 Detalles de la Incidencia</h4>
            <p><strong>Área:</strong> ${escapeHtml(ticket.area)}</p>
            <p><strong>Tipo:</strong> ${escapeHtml(ticket.incidencia)}</p>
            <p><strong>Fecha:</strong> ${formatDate(ticket.fecha_creacion)}</p>
            ${ticket.fecha_resolucion ? `<p><strong>Resuelto:</strong> ${formatDate(ticket.fecha_resolucion)}</p>` : ""}
          </div>
        </div>

        <div class="ticket-description-block">
          <h4>📝 Descripción</h4>
          <p>${escapeHtml(ticket.descripcion)}</p>
        </div>

        ${ticket.categoria_ia || ticket.resumen_ia ? `
        <div class="ticket-ai-block">
          <h4>🤖 Análisis de Inteligencia Artificial</h4>
          ${ticket.categoria_ia ? `<p><strong>Categoría IA:</strong> <span class="ai-tag">${escapeHtml(ticket.categoria_ia)}</span></p>` : ""}
          ${ticket.resumen_ia ? `<div class="ai-summary"><p>${escapeHtml(ticket.resumen_ia)}</p></div>` : ""}
        </div>
        ` : ""}

        ${ticket.comentarios && ticket.comentarios.length > 0 ? `
        <div class="ticket-comments-block">
          <h4>💬 Actividad del Ticket</h4>
          <div class="comments-list">
            ${ticket.comentarios.map((c) => `
              <div class="comment-item">
                <div class="comment-header">
                  <strong>${escapeHtml(c.autor)}</strong>
                  <span class="comment-time">${getTimeAgo(c.fecha)}</span>
                </div>
                <p>${escapeHtml(c.mensaje)}</p>
              </div>
            `).join("")}
          </div>
        </div>
        ` : ""}
      </div>
    </div>
  `;
}

// ─── Renderizado de tarjeta de ticket (dashboard) ─────────────────────────────

function renderTicketCard(ticket: Ticket): string {
  const priorityClass = getPriorityClass(ticket.prioridad);
  const statusClass = getStatusClass(ticket.estado);
  const statusIcon = getStatusIcon(ticket.estado);
  const timeAgo = getTimeAgo(ticket.fecha_creacion);

  return `
    <article class="ticket-card ${priorityClass}" data-ticket="${escapeHtml(ticket.ticket_number)}" role="button" tabindex="0" aria-label="Ticket ${ticket.ticket_number}">
      <div class="ticket-card-header">
        <span class="ticket-number">${escapeHtml(ticket.ticket_number)}</span>
        <span class="badge badge-status ${statusClass}">${statusIcon} ${ticket.estado}</span>
      </div>
      <h3 class="ticket-card-title">${escapeHtml(ticket.incidencia)}</h3>
      <p class="ticket-card-desc">${escapeHtml(ticket.resumen_ia ?? ticket.descripcion.substring(0, 120) + "...")}</p>
      <div class="ticket-card-footer">
        <div class="ticket-meta">
          <span class="ticket-area">📁 ${escapeHtml(ticket.area)}</span>
          <span class="ticket-time">🕒 ${timeAgo}</span>
        </div>
        <span class="badge badge-priority ${priorityClass}">${ticket.prioridad}</span>
      </div>
    </article>
  `;
}

// ─── Seguridad: escape HTML ───────────────────────────────────────────────────

function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str ?? ""));
  return div.innerHTML;
}

// ─── Estado del dashboard ─────────────────────────────────────────────────────

let dashboardState: DashboardState = {
  tickets: [],
  filteredTickets: [],
  currentPage: 1,
  totalPages: 1,
  selectedTicket: null,
  viewMode: "grid",
  filters: {},
  isLoading: false,
  searchQuery: "",
};

// ─── Inicialización del dashboard ─────────────────────────────────────────────

async function initDashboard(): Promise<void> {
  const container = document.getElementById("tickets-container");
  if (!container) return;

  setDashboardLoading(true);
  try {
    const result = await fetchAllTickets();
    dashboardState.tickets = result.tickets;
    dashboardState.filteredTickets = result.tickets;
    dashboardState.totalPages = result.pages;
    renderDashboard();
  } catch (err) {
    console.error("Error cargando tickets:", err);
    container.innerHTML = `<div class="error-state"><p>❌ Error al cargar tickets. Intenta nuevamente.</p></div>`;
  } finally {
    setDashboardLoading(false);
  }
}

function setDashboardLoading(loading: boolean): void {
  dashboardState.isLoading = loading;
  const loader = document.getElementById("dashboard-loader");
  const container = document.getElementById("tickets-container");
  if (loader) loader.style.display = loading ? "flex" : "none";
  if (container) container.style.display = loading ? "none" : "grid";
}

function renderDashboard(): void {
  const container = document.getElementById("tickets-container");
  if (!container) return;

  const { filteredTickets } = dashboardState;

  if (filteredTickets.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-icon">🔍</span>
        <h3>No se encontraron tickets</h3>
        <p>Intenta con otros filtros o registra una nueva incidencia.</p>
      </div>
    `;
    return;
  }

  container.innerHTML = filteredTickets.map(renderTicketCard).join("");

  // Agregar listeners de click en tarjetas
  container.querySelectorAll<HTMLElement>(".ticket-card").forEach((card) => {
    const ticketNum = card.dataset.ticket;
    if (!ticketNum) return;
    card.addEventListener("click", () => openTicketModal(ticketNum));
    card.addEventListener("keydown", (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") openTicketModal(ticketNum);
    });
  });

  // Actualizar contador
  const countEl = document.getElementById("results-count");
  if (countEl) countEl.textContent = `${filteredTickets.length} ticket${filteredTickets.length !== 1 ? "s" : ""}`;
}

// ─── Modal de detalle ─────────────────────────────────────────────────────────

async function openTicketModal(ticketNumber: string): Promise<void> {
  const modal = document.getElementById("ticket-modal");
  const modalContent = document.getElementById("modal-ticket-content");
  if (!modal || !modalContent) return;

  modalContent.innerHTML = `<div class="modal-loading"><div class="spinner"></div><p>Cargando ticket...</p></div>`;
  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  try {
    const ticket = await fetchTicketByNumber(ticketNumber);
    if (ticket) {
      renderTicketDetail(ticket, modalContent);
    } else {
      modalContent.innerHTML = `<div class="error-state"><p>❌ Ticket no encontrado.</p></div>`;
    }
  } catch (err) {
    modalContent.innerHTML = `<div class="error-state"><p>❌ Error al cargar el ticket.</p></div>`;
  }
}

function closeTicketModal(): void {
  const modal = document.getElementById("ticket-modal");
  if (!modal) return;
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";
}

// ─── Búsqueda y filtrado ──────────────────────────────────────────────────────

function applyFilters(): void {
  const { tickets, searchQuery, filters } = dashboardState;
  let result = [...tickets];

  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(
      (t) =>
        t.ticket_number.toLowerCase().includes(q) ||
        t.nombre.toLowerCase().includes(q) ||
        t.area.toLowerCase().includes(q) ||
        t.incidencia.toLowerCase().includes(q) ||
        t.descripcion.toLowerCase().includes(q)
    );
  }

  if (filters.estado) result = result.filter((t) => t.estado === filters.estado);
  if (filters.prioridad) result = result.filter((t) => t.prioridad === filters.prioridad);

  dashboardState.filteredTickets = result;
  renderDashboard();
}

// ─── Lookup rápido de ticket ──────────────────────────────────────────────────

async function lookupTicket(ticketNumber: string): Promise<void> {
  const resultContainer = document.getElementById("lookup-result");
  if (!resultContainer) return;

  if (!ticketNumber.trim()) {
    resultContainer.innerHTML = `<p class="lookup-hint">⚠ Ingresa un número de ticket válido.</p>`;
    return;
  }

  resultContainer.innerHTML = `<div class="lookup-loading"><div class="spinner-sm"></div> Buscando...</div>`;

  try {
    const ticket = await fetchTicketByNumber(ticketNumber);
    if (ticket) {
      resultContainer.innerHTML = `
        <div class="lookup-card ${getPriorityClass(ticket.prioridad)}" role="button" tabindex="0" onclick="openTicketModal('${escapeHtml(ticket.ticket_number)}')">
          <div class="lookup-top">
            <strong>${escapeHtml(ticket.ticket_number)}</strong>
            <span class="badge badge-status ${getStatusClass(ticket.estado)}">${getStatusIcon(ticket.estado)} ${ticket.estado}</span>
          </div>
          <p>${escapeHtml(ticket.incidencia)} — ${escapeHtml(ticket.area)}</p>
          <p class="lookup-time">📅 ${formatDate(ticket.fecha_creacion)}</p>
          <span class="badge badge-priority ${getPriorityClass(ticket.prioridad)}">${ticket.prioridad}</span>
        </div>
      `;
    } else {
      resultContainer.innerHTML = `<p class="lookup-empty">🔍 No se encontró el ticket <strong>${escapeHtml(ticketNumber)}</strong>.</p>`;
    }
  } catch {
    resultContainer.innerHTML = `<p class="lookup-error">❌ Error al buscar el ticket. Intenta nuevamente.</p>`;
  }
}

// ─── Exponer funciones globalmente ────────────────────────────────────────────

declare global {
  interface Window {
    HelpDeskTickets: {
      init: () => Promise<void>;
      lookup: (num: string) => Promise<void>;
      closeModal: () => void;
      applyFilters: () => void;
      openModal: (num: string) => Promise<void>;
    };
  }
}

window.HelpDeskTickets = {
  init: initDashboard,
  lookup: lookupTicket,
  closeModal: closeTicketModal,
  applyFilters,
  openModal: openTicketModal,
};

// Escuchar cierre de modal con Escape
document.addEventListener("keydown", (e: KeyboardEvent) => {
  if (e.key === "Escape") closeTicketModal();
});

export {
  fetchTicketByNumber,
  fetchAllTickets,
  renderTicketCard,
  renderTicketDetail,
  formatDate,
  getTimeAgo,
  getPriorityClass,
  getStatusClass,
  escapeHtml,
};
