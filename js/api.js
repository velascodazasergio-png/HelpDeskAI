/**
 * HelpDesk AI — api.js
 * Módulo de comunicación con el Webhook de N8N
 *
 * ===== CONFIGURACIÓN =====
 * WEBHOOK_URL apunta a N8N en el puerto 5679 (docker-compose expone 5679:5678)
 * Si cambias el puerto en docker-compose.yml, actualiza aquí también.
 */

'use strict';

var HelpDeskAPI = (function () {

  // ─── CONFIGURACIÓN ────────────────────────────────────────────────────────
  // Puerto 5679 → es el puerto del HOST mapeado en docker-compose.yml (5679:5678)
  var WEBHOOK_URL = 'http://localhost:5679/webhook/helpdesk/incidencia';

  // URL para consulta de tickets desde PostgreSQL vía N8N
  // Configura este endpoint en N8N si quieres consultas reales de tickets
  var TICKETS_API_URL = 'AQUI_API_TICKETS';

  var REQUEST_TIMEOUT = 30000;
  var API_VERSION = 'v1';

  // Pon en true para forzar modo simulación aunque N8N esté corriendo
  var FORCE_SIMULATION = false;

  // ─── PRIVADOS ─────────────────────────────────────────────────────────────

  function generateTicketId() {
    var timestamp = Date.now().toString(36).toUpperCase();
    var random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return 'TK-' + random + timestamp.slice(-4);
  }

  function createTimeoutController(ms) {
    var controller = new AbortController();
    var timeoutId = setTimeout(function () {
      controller.abort();
    }, ms);
    var originalAbort = controller.abort.bind(controller);
    controller.abort = function () {
      clearTimeout(timeoutId);
      originalAbort();
    };
    return controller;
  }

  function handleResponse(response) {
    var contentType = response.headers.get('Content-Type') || '';
    if (!response.ok) {
      return response.text().then(function (text) {
        var error;
        try {
          var errData = JSON.parse(text);
          error = new Error(errData.message || 'Error del servidor');
          error.status = response.status;
          error.data = errData;
        } catch (e) {
          error = new Error('Error del servidor: ' + response.status);
          error.status = response.status;
        }
        throw error;
      });
    }
    if (contentType.includes('application/json')) {
      return response.json();
    }
    return response.text().then(function (text) {
      try { return JSON.parse(text); }
      catch (e) { return { success: true, raw: text }; }
    });
  }

  function buildHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Client': 'HelpDesk-AI-Frontend',
      'X-Version': API_VERSION,
      'X-Timestamp': new Date().toISOString()
    };
  }

  // ─── PÚBLICO ──────────────────────────────────────────────────────────────
  return {

    /**
     * Envía la incidencia al Webhook de N8N.
     * Si FORCE_SIMULATION = true o WEBHOOK_URL está vacío, usa datos simulados.
     */
    enviarIncidencia: function (formData) {
      var ticketNumber = generateTicketId();
      var timestamp = new Date().toISOString();

      var payload = {
        nombre:      formData.nombre.trim(),
        correo:      formData.correo.trim().toLowerCase(),
        telefono:    formData.telefono.trim(),
        area:        formData.area,
        incidencia:  formData.incidencia,
        prioridad:   formData.prioridad,
        descripcion: formData.descripcion.trim(),
        ticket_number: ticketNumber,
        timestamp:     timestamp,
        origen:        'web-frontend',
        version:       API_VERSION,
        metadata: {
          user_agent: navigator.userAgent,
          language:   navigator.language,
          timezone:   Intl.DateTimeFormat().resolvedOptions().timeZone,
          url:        window.location.href
        }
      };

      console.log('[HelpDeskAPI] Enviando incidencia →', {
        ticket: ticketNumber,
        area: payload.area,
        tipo: payload.incidencia,
        prioridad: payload.prioridad,
        webhook: WEBHOOK_URL
      });

      // Modo simulación: solo si FORCE_SIMULATION = true o URL vacía
      if (FORCE_SIMULATION || !WEBHOOK_URL) {
        console.warn('[HelpDeskAPI] ⚠️ Modo simulación activo.');
        return HelpDeskAPI._simulateWebhook(payload);
      }

      // ── Envío real ────────────────────────────────────────────────────────
      var controller = createTimeoutController(REQUEST_TIMEOUT);

      return fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(payload),
        signal: controller.signal
      })
      .then(handleResponse)
      .then(function (data) {
        controller.abort();
        console.log('[HelpDeskAPI] ✅ Respuesta N8N:', data);
        return {
          success: true,
          ticket_number: data.ticket_number || ticketNumber,
          message:       data.mensaje || data.message || 'Incidencia registrada exitosamente',
          ia:            data.ia || data.ai_analysis || null,
          timestamp:     timestamp
        };
      })
      .catch(function (error) {
        controller.abort();
        if (error.name === 'AbortError') {
          var te = new Error('La solicitud tardó demasiado. Intenta nuevamente.');
          te.code = 'TIMEOUT';
          throw te;
        }
        if (!navigator.onLine) {
          var oe = new Error('Sin conexión a internet. Verifica tu conexión.');
          oe.code = 'OFFLINE';
          throw oe;
        }
        console.error('[HelpDeskAPI] ❌ Error:', error);
        throw error;
      });
    },

    /**
     * Consulta un ticket por número.
     * Usa mock si TICKETS_API_URL no está configurada.
     */
    consultarTicket: function (ticketNumber) {
      if (!ticketNumber || !ticketNumber.trim()) {
        return Promise.reject(new Error('Número de ticket requerido'));
      }
      var cleanNumber = ticketNumber.trim().replace(/^#/, '').toUpperCase();

      if (TICKETS_API_URL === 'AQUI_API_TICKETS' || !TICKETS_API_URL) {
        console.warn('[HelpDeskAPI] ⚠️ API de tickets no configurada. Usando datos de demostración.');
        return HelpDeskAPI._getMockTicket(cleanNumber);
      }

      var controller = createTimeoutController(REQUEST_TIMEOUT);
      var url = TICKETS_API_URL + '/' + encodeURIComponent(cleanNumber);

      return fetch(url, { method: 'GET', headers: buildHeaders(), signal: controller.signal })
        .then(handleResponse)
        .then(function (data) { controller.abort(); return data; })
        .catch(function (error) {
          controller.abort();
          if (error.status === 404) throw new Error('Ticket no encontrado. Verifica el número.');
          throw error;
        });
    },

    /**
     * Lista tickets con filtros opcionales.
     */
    listarTickets: function (filters) {
      filters = filters || {};
      if (TICKETS_API_URL === 'AQUI_API_TICKETS' || !TICKETS_API_URL) {
        return Promise.resolve(HelpDeskAPI._getMockTickets());
      }
      var params = new URLSearchParams();
      if (filters.estado)    params.set('estado', filters.estado);
      if (filters.prioridad) params.set('prioridad', filters.prioridad);
      if (filters.categoria) params.set('categoria', filters.categoria);
      var url = TICKETS_API_URL + (params.toString() ? '?' + params.toString() : '');
      var controller = createTimeoutController(REQUEST_TIMEOUT);
      return fetch(url, { method: 'GET', headers: buildHeaders(), signal: controller.signal })
        .then(handleResponse)
        .then(function (data) {
          controller.abort();
          return Array.isArray(data) ? data : (data.tickets || data.data || []);
        });
    },

    // ── Simulación ────────────────────────────────────────────────────────────

    _simulateWebhook: function (payload) {
      return new Promise(function (resolve) {
        setTimeout(function () {
          var categories = {
            'Hardware': 'Hardware / Equipos', 'Software': 'Software / Aplicaciones',
            'Red': 'Red / Conectividad', 'Seguridad': 'Seguridad Informática',
            'Email': 'Correo Electrónico', 'Impresoras': 'Periféricos',
            'Telefonia': 'Telefonía', 'Accesos': 'Accesos y Permisos',
            'Base de Datos': 'Base de Datos', 'Otro': 'General'
          };
          var suggestions = {
            'Hardware': 'Verificar conexiones físicas y reiniciar el equipo.',
            'Software': 'Reiniciar la aplicación y verificar actualizaciones pendientes.',
            'Red': 'Verificar conectividad física y configuración de red.',
            'Seguridad': 'Aislar el equipo afectado y notificar al equipo de seguridad.',
            'Email': 'Verificar configuración del cliente de correo y estado del servidor.',
            'Impresoras': 'Reiniciar cola de impresión y verificar drivers.',
            'Telefonia': 'Verificar conectividad VoIP y estado del servidor.',
            'Accesos': 'Revisar permisos en Active Directory y políticas de grupo.',
            'Base de Datos': 'Verificar servicios de BD y revisar logs de errores.',
            'Otro': 'El equipo revisará los detalles para determinar la solución.'
          };
          var summaries = {
            'Baja': 'Incidencia de baja prioridad. Será atendida según disponibilidad.',
            'Media': 'Incidencia de prioridad media. El equipo la revisará en las próximas horas.',
            'Alta': 'Incidencia de alta prioridad. El equipo fue notificado urgentemente.',
            'Critica': 'INCIDENCIA CRÍTICA. El equipo senior fue alertado de inmediato.'
          };
          resolve({
            success: true,
            ticket_number: payload.ticket_number,
            message: 'Incidencia registrada (modo demo)',
            ia: {
              categoria: categories[payload.incidencia] || payload.incidencia,
              prioridad: payload.prioridad,
              resumen: summaries[payload.prioridad] || 'Incidencia registrada y clasificada.',
              sugerencia: suggestions[payload.incidencia] || 'El equipo revisará tu incidencia.',
              respuesta_usuario: 'Estimado/a ' + payload.nombre.split(' ')[0] +
                ', su incidencia ' + payload.ticket_number + ' fue registrada con prioridad ' +
                payload.prioridad + '. El equipo de soporte fue notificado.'
            },
            timestamp: payload.timestamp
          });
        }, 2000);
      });
    },

    _getMockTicket: function (ticketNumber) {
      var mockTickets = HelpDeskAPI._getMockTickets();
      var found = mockTickets.find(function (t) {
        return t.ticket_number === ticketNumber ||
               t.ticket_number.replace('TK-', '') === ticketNumber.replace('TK-', '');
      });
      if (found) return Promise.resolve(found);
      return Promise.resolve({
        id: Math.floor(Math.random() * 1000),
        ticket_number: ticketNumber.startsWith('TK-') ? ticketNumber : 'TK-' + ticketNumber,
        nombre: 'Usuario de Prueba', correo: 'usuario@empresa.com',
        telefono: '300 000 0000', area: 'Sistemas', incidencia: 'Software',
        prioridad: 'Media', descripcion: 'Descripción de prueba para ' + ticketNumber,
        categoria_ia: 'Software / Aplicaciones',
        resumen_ia: 'Incidencia de software en revisión.',
        estado: 'En progreso', fecha_creacion: new Date().toISOString()
      });
    },

    _getMockTickets: function () {
      return [
        {
          id: 1, ticket_number: 'TK-2847',
          nombre: 'Carlos Rodríguez Pérez', correo: 'carlos.rodriguez@empresa.com',
          telefono: '311 234 5678', area: 'Sistemas', incidencia: 'Red', prioridad: 'Alta',
          descripcion: 'Pérdida total de conectividad en la oficina principal. 30 empleados sin acceso desde las 9:00 AM.',
          categoria_ia: 'Red / Conectividad',
          resumen_ia: 'Falla crítica de red afectando a 30 usuarios. Alta prioridad confirmada.',
          estado: 'En progreso', fecha_creacion: new Date(Date.now() - 1800000).toISOString()
        },
        {
          id: 2, ticket_number: 'TK-2846',
          nombre: 'María González López', correo: 'maria.gonzalez@empresa.com',
          telefono: '320 345 6789', area: 'Contabilidad', incidencia: 'Software', prioridad: 'Media',
          descripcion: 'El aplicativo de facturación lanza Error 500 desde la actualización de ayer.',
          categoria_ia: 'Software / Aplicaciones',
          resumen_ia: 'Error 500 post-actualización. Requiere revisión de logs.',
          estado: 'Resuelto', fecha_creacion: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 3, ticket_number: 'TK-2845',
          nombre: 'Juan Pérez Martínez', correo: 'juan.perez@empresa.com',
          telefono: '315 456 7890', area: 'Ventas', incidencia: 'Hardware', prioridad: 'Baja',
          descripcion: 'Monitor parpadea intermitentemente cada 15-20 minutos.',
          categoria_ia: 'Hardware / Equipos',
          resumen_ia: 'Falla de monitor con parpadeo. Posible problema de cable o frecuencia.',
          estado: 'Abierto', fecha_creacion: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: 4, ticket_number: 'TK-2844',
          nombre: 'Ana Martínez Silva', correo: 'ana.martinez@empresa.com',
          telefono: '316 567 8901', area: 'Recursos Humanos', incidencia: 'Accesos', prioridad: 'Alta',
          descripcion: 'No puedo acceder al sistema de nómina. El enlace de recuperación no llega.',
          categoria_ia: 'Accesos / Permisos',
          resumen_ia: 'Bloqueo de acceso a nómina. Revisar AD y flujo de recuperación.',
          estado: 'En espera', fecha_creacion: new Date(Date.now() - 259200000).toISOString()
        },
        {
          id: 5, ticket_number: 'TK-2843',
          nombre: 'Pedro López García', correo: 'pedro.lopez@empresa.com',
          telefono: '317 678 9012', area: 'Gerencia', incidencia: 'Software', prioridad: 'Critica',
          descripcion: 'URGENTE: La base de datos de clientes no responde. CRM caído completamente.',
          categoria_ia: 'Base de Datos',
          resumen_ia: 'CRM crítico fuera de línea. Impacto directo en ventas.',
          estado: 'En progreso', fecha_creacion: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 6, ticket_number: 'TK-2842',
          nombre: 'Luisa Fernández Torres', correo: 'luisa.fernandez@empresa.com',
          telefono: '318 789 0123', area: 'Administracion', incidencia: 'Impresoras', prioridad: 'Baja',
          descripcion: 'La impresora HP imprime páginas en blanco desde hace 2 días.',
          categoria_ia: 'Periféricos',
          resumen_ia: 'Falla de impresora con salida en blanco. Posible problema de cartuchos.',
          estado: 'Resuelto', fecha_creacion: new Date(Date.now() - 432000000).toISOString()
        }
      ];
    },

    getConfig: function () {
      return {
        webhookUrl: WEBHOOK_URL,
        simulationForced: FORCE_SIMULATION,
        ticketsApiConfigured: TICKETS_API_URL !== 'AQUI_API_TICKETS',
        timeout: REQUEST_TIMEOUT,
        version: API_VERSION
      };
    }
  };

})();

console.log('[HelpDeskAPI] Config:', HelpDeskAPI.getConfig());