/**
 * HelpDesk AI — api.js
 * API communication module
 * Handles all communication with the N8N webhook and backend services
 *
 * ===== CONFIGURACIÓN =====
 * Antes de usar en producción, configura WEBHOOK_URL con la URL real de tu webhook N8N.
 */

'use strict';

// ===== CONFIGURATION =====
var HelpDeskAPI = (function() {

  /**
   * IMPORTANTE: Reemplaza esta URL con la URL real de tu Webhook en N8N.
   * Ejemplo: https://tu-n8n.dominio.com/webhook/helpdesk-incidencia
   *
   * Para obtener la URL:
   * 1. Crea un workflow en N8N
   * 2. Agrega un nodo "Webhook"
   * 3. Configura el método como POST
   * 4. Copia la URL del webhook
   * 5. Pégala aquí
   */
  var WEBHOOK_URL = 'http://localhost:5678/webhook/helpdesk/incidencia';

  /**
   * URL para consulta de tickets (endpoint de tu API o N8N)
   * Configura según tu implementación
   */
  var TICKETS_API_URL = 'AQUI_API_TICKETS';

  /**
   * Timeout para requests en milisegundos
   */
  var REQUEST_TIMEOUT = 30000;

  /**
   * Versión de la API
   */
  var API_VERSION = 'v1';

  // ===== PRIVATE METHODS =====

  /**
   * Genera un número de ticket único
   * @returns {string}
   */
  function generateTicketId() {
    var timestamp = Date.now().toString(36).toUpperCase();
    var random = Math.random().toString(36).substr(2, 4).toUpperCase();
    return 'TK-' + random + timestamp.slice(-4);
  }

  /**
   * Crea un AbortController con timeout
   * @param {number} ms
   * @returns {{signal: AbortSignal, abort: Function}}
   */
  function createTimeoutController(ms) {
    var controller = new AbortController();
    var timeoutId = setTimeout(function() {
      controller.abort();
    }, ms);

    // Override abort to also clear timeout
    var originalAbort = controller.abort.bind(controller);
    controller.abort = function() {
      clearTimeout(timeoutId);
      originalAbort();
    };

    return controller;
  }

  /**
   * Procesa la respuesta HTTP
   * @param {Response} response
   * @returns {Promise}
   */
  function handleResponse(response) {
    var contentType = response.headers.get('Content-Type') || '';

    if (!response.ok) {
      return response.text().then(function(text) {
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

    return response.text().then(function(text) {
      try {
        return JSON.parse(text);
      } catch (e) {
        return { success: true, raw: text };
      }
    });
  }

  /**
   * Construye los headers por defecto para los requests
   * @returns {Object}
   */
  function buildHeaders() {
    return {
      'Content-Type': 'application/json',
      'X-Client': 'HelpDesk-AI-Frontend',
      'X-Version': API_VERSION,
      'X-Timestamp': new Date().toISOString()
    };
  }

  // ===== PUBLIC API =====
  return {

    /**
     * ENVIAR INCIDENCIA AL WEBHOOK DE N8N
     *
     * Este es el método principal que envía los datos del formulario
     * al Webhook de N8N para su procesamiento.
     *
     * Flujo:
     * 1. Genera número de ticket único
     * 2. Construye payload JSON completo
     * 3. Envía POST al webhook de N8N
     * 4. N8N valida → guarda en DB → llama a OpenAI → notifica Telegram
     * 5. Retorna respuesta con datos del ticket procesado
     *
     * @param {Object} formData - Datos del formulario de incidencia
     * @param {string} formData.nombre - Nombre completo del solicitante
     * @param {string} formData.correo - Correo electrónico
     * @param {string} formData.telefono - Teléfono de contacto
     * @param {string} formData.area - Área afectada
     * @param {string} formData.incidencia - Tipo de incidencia
     * @param {string} formData.prioridad - Prioridad percibida por el usuario
     * @param {string} formData.descripcion - Descripción detallada
     * @returns {Promise<Object>} - Respuesta con número de ticket y análisis IA
     */
    enviarIncidencia: function(formData) {
      // Generar número de ticket único
      var ticketNumber = generateTicketId();
      var timestamp = new Date().toISOString();

      // Construir payload completo
      var payload = {
        // Datos del solicitante
        nombre:      formData.nombre.trim(),
        correo:      formData.correo.trim().toLowerCase(),
        telefono:    formData.telefono.trim(),
        area:        formData.area,
        incidencia:  formData.incidencia,
        prioridad:   formData.prioridad,
        descripcion: formData.descripcion.trim(),

        // Metadata generada por el frontend
        ticket_number: ticketNumber,
        timestamp:     timestamp,
        origen:        'web-frontend',
        version:       API_VERSION,

        // Info del cliente (útil para debugging)
        metadata: {
          user_agent:   navigator.userAgent,
          language:     navigator.language,
          timezone:     Intl.DateTimeFormat().resolvedOptions().timeZone,
          url:          window.location.href
        }
      };

      console.log('[HelpDeskAPI] Enviando incidencia al webhook N8N:', {
        ticket: ticketNumber,
        area: payload.area,
        tipo: payload.incidencia,
        prioridad: payload.prioridad
      });

      // ===== MODO SIMULACIÓN =====
      // Si WEBHOOK_URL no está configurado, simula la respuesta para desarrollo
      if (WEBHOOK_URL === 'http://localhost:5678/webhook/helpdesk/incidencia' || !WEBHOOK_URL) {
        console.warn('[HelpDeskAPI] ⚠️ Webhook no configurado. Usando modo simulación.');
        console.info('[HelpDeskAPI] Configura WEBHOOK_URL en js/api.js con la URL real de tu N8N.');
        return HelpDeskAPI._simulateWebhook(payload);
      }

      // ===== ENVÍO REAL AL WEBHOOK =====
      var controller = createTimeoutController(REQUEST_TIMEOUT);

      return fetch(WEBHOOK_URL, {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify(payload),
        signal: controller.signal
      })
      .then(handleResponse)
      .then(function(data) {
        controller.abort(); // Clear timeout
        console.log('[HelpDeskAPI] ✅ Incidencia enviada exitosamente:', data);

        // Normalizar respuesta
        return {
          success: true,
          ticket_number: data.ticket_number || ticketNumber,
          message: data.message || 'Incidencia registrada exitosamente',
          ia: data.ia || data.ai_analysis || null,
          timestamp: timestamp
        };
      })
      .catch(function(error) {
        controller.abort();

        if (error.name === 'AbortError') {
          var timeoutError = new Error('La solicitud tardó demasiado. Por favor intenta nuevamente.');
          timeoutError.code = 'TIMEOUT';
          throw timeoutError;
        }

        if (!navigator.onLine) {
          var offlineError = new Error('Sin conexión a internet. Verifica tu conexión y vuelve a intentarlo.');
          offlineError.code = 'OFFLINE';
          throw offlineError;
        }

        console.error('[HelpDeskAPI] ❌ Error al enviar incidencia:', error);
        throw error;
      });
    },

    /**
     * CONSULTAR TICKET POR NÚMERO
     *
     * Busca los detalles de un ticket específico
     *
     * @param {string} ticketNumber - Número de ticket (ej: TK-2847)
     * @returns {Promise<Object>} - Datos completos del ticket
     */
    consultarTicket: function(ticketNumber) {
      if (!ticketNumber || !ticketNumber.trim()) {
        return Promise.reject(new Error('Número de ticket requerido'));
      }

      var cleanNumber = ticketNumber.trim().replace(/^#/, '').toUpperCase();

      // Si la API de tickets no está configurada, usar datos de mock
      if (TICKETS_API_URL === 'AQUI_API_TICKETS' || !TICKETS_API_URL) {
        console.warn('[HelpDeskAPI] ⚠️ API de tickets no configurada. Usando datos de demostración.');
        return HelpDeskAPI._getMockTicket(cleanNumber);
      }

      var controller = createTimeoutController(REQUEST_TIMEOUT);
      var url = TICKETS_API_URL + '/' + encodeURIComponent(cleanNumber);

      return fetch(url, {
        method: 'GET',
        headers: buildHeaders(),
        signal: controller.signal
      })
      .then(handleResponse)
      .then(function(data) {
        controller.abort();
        return data;
      })
      .catch(function(error) {
        controller.abort();
        if (error.status === 404) {
          throw new Error('Ticket no encontrado. Verifica el número e intenta nuevamente.');
        }
        throw error;
      });
    },

    /**
     * LISTAR TICKETS
     *
     * Obtiene la lista de tickets (con filtros opcionales)
     *
     * @param {Object} filters - Filtros opcionales
     * @param {string} filters.estado - Estado del ticket
     * @param {string} filters.prioridad - Prioridad
     * @param {string} filters.categoria - Categoría IA
     * @returns {Promise<Array>} - Array de tickets
     */
    listarTickets: function(filters) {
      filters = filters || {};

      // Si la API no está configurada, retornar datos mock
      if (TICKETS_API_URL === 'AQUI_API_TICKETS' || !TICKETS_API_URL) {
        return Promise.resolve(HelpDeskAPI._getMockTickets());
      }

      var params = new URLSearchParams();
      if (filters.estado)    params.set('estado', filters.estado);
      if (filters.prioridad) params.set('prioridad', filters.prioridad);
      if (filters.categoria) params.set('categoria', filters.categoria);

      var url = TICKETS_API_URL + (params.toString() ? '?' + params.toString() : '');
      var controller = createTimeoutController(REQUEST_TIMEOUT);

      return fetch(url, {
        method: 'GET',
        headers: buildHeaders(),
        signal: controller.signal
      })
      .then(handleResponse)
      .then(function(data) {
        controller.abort();
        return Array.isArray(data) ? data : (data.tickets || data.data || []);
      });
    },

    // ===== SIMULATION & MOCK DATA =====

    /**
     * Simula la respuesta del webhook para desarrollo
     * @param {Object} payload
     * @returns {Promise<Object>}
     * @private
     */
    _simulateWebhook: function(payload) {
      return new Promise(function(resolve) {
        // Simular delay de red + procesamiento N8N + IA
        setTimeout(function() {
          var categories = {
            'Hardware':       'Hardware / Equipos',
            'Software':       'Software / Aplicaciones',
            'Red':            'Red / Conectividad',
            'Seguridad':      'Seguridad Informática',
            'Email':          'Correo Electrónico',
            'Impresoras':     'Periféricos',
            'Telefonia':      'Telefonía',
            'Accesos':        'Accesos y Permisos',
            'Base de Datos':  'Base de Datos',
            'Otro':           'General'
          };

          var suggestions = {
            'Hardware':      'Verificar conexiones físicas y reiniciar el equipo. Si persiste, revisar componentes internos.',
            'Software':      'Reiniciar la aplicación y verificar actualizaciones pendientes. Revisar logs de error.',
            'Red':           'Verificar conectividad física y configuración de red. Revisar switch y router.',
            'Seguridad':     'Aislar el equipo afectado y notificar al equipo de seguridad inmediatamente.',
            'Email':         'Verificar configuración del cliente de correo y estado del servidor de mail.',
            'Impresoras':    'Reiniciar cola de impresión y verificar drivers del dispositivo.',
            'Telefonia':     'Verificar conectividad VoIP y estado del servidor de telefonía.',
            'Accesos':       'Revisar permisos en Active Directory y políticas de grupo.',
            'Base de Datos': 'Verificar servicios de BD y revisar logs de errores del motor.',
            'Otro':          'El equipo revisará los detalles para determinar la solución apropiada.'
          };

          var summaries = {
            'Baja':    'Incidencia de baja prioridad registrada. Será atendida según disponibilidad del equipo.',
            'Media':   'Incidencia de prioridad media detectada. El equipo de soporte la revisará en las próximas horas.',
            'Alta':    'Incidencia de alta prioridad registrada. El equipo de soporte ha sido notificado urgentemente.',
            'Critica': 'INCIDENCIA CRÍTICA detectada. El equipo de soporte senior fue alertado de inmediato.'
          };

          var iaResponse = {
            categoria:        categories[payload.incidencia] || payload.incidencia,
            prioridad:        payload.prioridad,
            resumen:          summaries[payload.prioridad] || 'Incidencia registrada y clasificada por la IA.',
            sugerencia:       suggestions[payload.incidencia] || 'El equipo revisará los detalles de tu incidencia.',
            respuesta_usuario: 'Estimado/a ' + payload.nombre.split(' ')[0] + ', ' +
              'su incidencia ha sido registrada con el número ' + payload.ticket_number + '. ' +
              'Ha sido clasificada como prioridad ' + payload.prioridad + ' en la categoría ' +
              (categories[payload.incidencia] || payload.incidencia) + '. ' +
              'Nuestro equipo de soporte ha sido notificado y estará en contacto a la brevedad. ' +
              'Puede consultar el estado en cualquier momento con su número de ticket.'
          };

          resolve({
            success: true,
            ticket_number: payload.ticket_number,
            message: 'Incidencia registrada exitosamente (modo demo)',
            ia: iaResponse,
            timestamp: payload.timestamp
          });
        }, 2000); // 2s para simular procesamiento real
      });
    },

    /**
     * Retorna un ticket mock para demostración
     * @param {string} ticketNumber
     * @returns {Promise<Object>}
     * @private
     */
    _getMockTicket: function(ticketNumber) {
      var mockTickets = HelpDeskAPI._getMockTickets();
      var found = mockTickets.find(function(t) {
        return t.ticket_number === ticketNumber ||
               t.ticket_number.replace('TK-', '') === ticketNumber.replace('TK-', '');
      });

      if (found) {
        return Promise.resolve(found);
      }

      // Generar ticket genérico si no se encuentra
      return Promise.resolve({
        id: Math.floor(Math.random() * 1000),
        ticket_number: ticketNumber.startsWith('TK-') ? ticketNumber : 'TK-' + ticketNumber,
        nombre: 'Usuario de Prueba',
        correo: 'usuario@empresa.com',
        telefono: '300 000 0000',
        area: 'Sistemas',
        incidencia: 'Software',
        prioridad: 'Media',
        descripcion: 'Descripción de prueba para el ticket ' + ticketNumber,
        categoria_ia: 'Software / Aplicaciones',
        resumen_ia: 'Incidencia de software de prioridad media. En revisión por el equipo de soporte.',
        estado: 'En progreso',
        fecha_creacion: new Date().toISOString()
      });
    },

    /**
     * Retorna lista de tickets mock para demostración
     * @returns {Array<Object>}
     * @private
     */
    _getMockTickets: function() {
      return [
        {
          id: 1,
          ticket_number: 'TK-2847',
          nombre: 'Carlos Rodríguez Pérez',
          correo: 'carlos.rodriguez@empresa.com',
          telefono: '311 234 5678',
          area: 'Sistemas',
          incidencia: 'Red',
          prioridad: 'Alta',
          descripcion: 'Pérdida total de conectividad en la oficina principal. Los 30 empleados del piso 3 no tienen acceso a internet ni a los servidores internos desde las 9:00 AM de hoy.',
          categoria_ia: 'Red / Conectividad',
          resumen_ia: 'Falla crítica de red afectando a 30 usuarios en oficina principal. Alta prioridad confirmada por IA.',
          estado: 'En progreso',
          fecha_creacion: new Date(Date.now() - 1800000).toISOString()
        },
        {
          id: 2,
          ticket_number: 'TK-2846',
          nombre: 'María González López',
          correo: 'maria.gonzalez@empresa.com',
          telefono: '320 345 6789',
          area: 'Contabilidad',
          incidencia: 'Software',
          prioridad: 'Media',
          descripcion: 'El aplicativo de facturación lanza error "Error 500 - Internal Server Error" al intentar generar facturas. El problema comenzó desde la actualización de ayer.',
          categoria_ia: 'Software / Aplicaciones',
          resumen_ia: 'Error 500 en aplicativo de facturación post-actualización. Requiere revisión de logs y rollback potencial.',
          estado: 'Resuelto',
          fecha_creacion: new Date(Date.now() - 86400000).toISOString()
        },
        {
          id: 3,
          ticket_number: 'TK-2845',
          nombre: 'Juan Pérez Martínez',
          correo: 'juan.perez@empresa.com',
          telefono: '315 456 7890',
          area: 'Ventas',
          incidencia: 'Hardware',
          prioridad: 'Baja',
          descripcion: 'El monitor de mi computadora parpadea intermitentemente. No afecta el trabajo pero es molesto. El problema ocurre cada 15-20 minutos.',
          categoria_ia: 'Hardware / Equipos',
          resumen_ia: 'Falla de monitor con parpadeo intermitente. Baja prioridad. Posible problema de cable o configuración de frecuencia.',
          estado: 'Abierto',
          fecha_creacion: new Date(Date.now() - 172800000).toISOString()
        },
        {
          id: 4,
          ticket_number: 'TK-2844',
          nombre: 'Ana Martínez Silva',
          correo: 'ana.martinez@empresa.com',
          telefono: '316 567 8901',
          area: 'Recursos Humanos',
          incidencia: 'Accesos',
          prioridad: 'Alta',
          descripcion: 'No puedo acceder al sistema de nómina. Mi contraseña fue reseteada por el sistema automáticamente y el enlace de recuperación no llega a mi correo corporativo.',
          categoria_ia: 'Accesos / Permisos',
          resumen_ia: 'Bloqueo de acceso al sistema de nómina. Revisar configuración de AD y flujo de recuperación de contraseña.',
          estado: 'En espera',
          fecha_creacion: new Date(Date.now() - 259200000).toISOString()
        },
        {
          id: 5,
          ticket_number: 'TK-2843',
          nombre: 'Pedro López García',
          correo: 'pedro.lopez@empresa.com',
          telefono: '317 678 9012',
          area: 'Gerencia',
          incidencia: 'Software',
          prioridad: 'Critica',
          descripcion: 'URGENTE: La base de datos de clientes no responde. El sistema CRM está caído completamente. Estamos perdiendo ventas en tiempo real.',
          categoria_ia: 'Base de Datos',
          resumen_ia: 'CRM crítico fuera de línea. Impacto directo en ventas. Intervención inmediata del equipo de BD requerida.',
          estado: 'En progreso',
          fecha_creacion: new Date(Date.now() - 3600000).toISOString()
        },
        {
          id: 6,
          ticket_number: 'TK-2842',
          nombre: 'Luisa Fernández Torres',
          correo: 'luisa.fernandez@empresa.com',
          telefono: '318 789 0123',
          area: 'Administracion',
          incidencia: 'Impresoras',
          prioridad: 'Baja',
          descripcion: 'La impresora HP del área administrativa imprime páginas en blanco. El problema comenzó hace 2 días. Ya intenté reiniciar el equipo pero persiste.',
          categoria_ia: 'Periféricos',
          resumen_ia: 'Falla de impresora con salida en blanco. Posible problema de cartuchos o driver. Baja prioridad.',
          estado: 'Resuelto',
          fecha_creacion: new Date(Date.now() - 432000000).toISOString()
        }
      ];
    },

    // Exponer configuración (solo lectura, para debugging)
    getConfig: function() {
      return {
        webhookConfigured: WEBHOOK_URL !== 'http://localhost:5678/webhook/helpdesk/incidencia',
        ticketsApiConfigured: TICKETS_API_URL !== 'AQUI_API_TICKETS',
        timeout: REQUEST_TIMEOUT,
        version: API_VERSION
      };
    }
  };

})();

// Log de configuración
console.log('[HelpDeskAPI] Configuración:', HelpDeskAPI.getConfig());
