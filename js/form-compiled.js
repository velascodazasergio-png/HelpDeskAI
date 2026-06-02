/**
 * form-compiled.js — Versión compilada de form.ts para uso directo en el navegador
 * HelpDesk AI — Sistema de Gestión de Incidencias
 *
 * FIXES aplicados:
 * 1. Modo simulación activado por bandera IS_DEMO, no por URL exacta
 * 2. Mejor manejo de errores de red con mensajes claros
 * 3. Corregido el bug de tipos ValidationResult (isValid vs valido)
 */

(function () {
  "use strict";

  // ─── Configuración ────────────────────────────────────────────────────────────

  /**
   * Pon aquí la URL real de tu Webhook N8N cuando lo tengas configurado.
   * Mientras tanto, IS_DEMO = true activa la simulación automáticamente.
   */
  const WEBHOOK_URL = "http://localhost:5678/webhook/helpdesk/incidencia";

  /**
   * IS_DEMO: true  → simula toda la respuesta sin llamar al servidor
   *          false → llama al WEBHOOK_URL real
   *
   * Cambia a false SOLO cuando N8N esté corriendo en producción.
   */
  const IS_DEMO = true;

  const MIN_DESC_LENGTH = 30;
  const MAX_DESC_LENGTH = 2000;
  const PHONE_REGEX = /^[+]?[\d\s\-().]{7,20}$/;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // ─── Validadores ──────────────────────────────────────────────────────────────

  function validateNombre(valor) {
    const v = valor.trim();
    if (!v) return { valido: false, mensaje: "El nombre completo es requerido." };
    if (v.length < 3) return { valido: false, mensaje: "El nombre debe tener al menos 3 caracteres." };
    if (v.length > 100) return { valido: false, mensaje: "El nombre no puede superar 100 caracteres." };
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'\-]+$/.test(v))
      return { valido: false, mensaje: "El nombre solo puede contener letras y espacios." };
    return { valido: true, mensaje: "" };
  }

  function validateCorreo(valor) {
    const v = valor.trim().toLowerCase();
    if (!v) return { valido: false, mensaje: "El correo electrónico es requerido." };
    if (!EMAIL_REGEX.test(v)) return { valido: false, mensaje: "Ingresa un correo electrónico válido." };
    if (v.length > 254) return { valido: false, mensaje: "El correo es demasiado largo." };
    return { valido: true, mensaje: "" };
  }

  function validateTelefono(valor) {
    const v = valor.trim();
    if (!v) return { valido: false, mensaje: "El teléfono es requerido." };
    if (!PHONE_REGEX.test(v))
      return { valido: false, mensaje: "Ingresa un número de teléfono válido (7–20 dígitos)." };
    return { valido: true, mensaje: "" };
  }

  function validateArea(valor) {
    if (!valor || valor === "") return { valido: false, mensaje: "Selecciona el área afectada." };
    return { valido: true, mensaje: "" };
  }

  function validateIncidencia(valor) {
    if (!valor || valor === "") return { valido: false, mensaje: "Selecciona el tipo de incidencia." };
    return { valido: true, mensaje: "" };
  }

  function validatePrioridad(valor) {
    if (!valor || valor === "") return { valido: false, mensaje: "Selecciona la prioridad." };
    return { valido: true, mensaje: "" };
  }

  function validateDescripcion(valor) {
    const v = valor.trim();
    if (!v) return { valido: false, mensaje: "La descripción es requerida." };
    if (v.length < MIN_DESC_LENGTH)
      return {
        valido: false,
        mensaje: `La descripción debe tener al menos ${MIN_DESC_LENGTH} caracteres. Tienes ${v.length}.`,
      };
    if (v.length > MAX_DESC_LENGTH)
      return { valido: false, mensaje: `La descripción no puede superar ${MAX_DESC_LENGTH} caracteres.` };
    return { valido: true, mensaje: "" };
  }

  // ─── Validación completa ───────────────────────────────────────────────────────

  function validateForm(input) {
    const errors = new Map();
    const checks = [
      ["nombre",      validateNombre],
      ["correo",      validateCorreo],
      ["telefono",    validateTelefono],
      ["area",        validateArea],
      ["incidencia",  validateIncidencia],
      ["prioridad",   validatePrioridad],
      ["descripcion", validateDescripcion],
    ];
    for (const [field, fn] of checks) {
      const result = fn(input[field]);
      if (!result.valido) errors.set(field, result);
    }
    return errors;
  }

  // ─── Generador de número de ticket ────────────────────────────────────────────

  function generateTicketNumber() {
    const ts   = Date.now().toString(36).toUpperCase();
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `TK-${ts}-${rand}`;
  }

  // ─── Payload para N8N ─────────────────────────────────────────────────────────

  function buildWebhookPayload(data, ticketNumber) {
    return {
      ticket_number: ticketNumber,
      nombre:        data.nombre,
      correo:        data.correo,
      telefono:      data.telefono,
      area:          data.area,
      incidencia:    data.incidencia,
      prioridad:     data.prioridad,
      descripcion:   data.descripcion,
      timestamp:     new Date().toISOString(),
      origen:        "web",
      version:       "1.0.0",
      metadata: {
        userAgent: navigator.userAgent,
        language:  navigator.language,
        timezone:  Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };
  }

  // ─── Helpers de simulación IA ─────────────────────────────────────────────────

  function detectCategory(incidencia) {
    const map = {
      hardware:   "Hardware",
      software:   "Software",
      red:        "Red / Conectividad",
      acceso:     "Acceso / Seguridad",
      correo:     "Comunicaciones",
      impresora:  "Periféricos",
      seguridad:  "Seguridad Informática",
      telefon:    "Telefonía",
      base:       "Base de Datos",
      otro:       "General",
    };
    const inc = incidencia.toLowerCase();
    for (const [key, val] of Object.entries(map)) {
      if (inc.includes(key)) return val;
    }
    return "General";
  }

  function getSuggestion(incidencia) {
    const suggestions = {
      hardware:  "Verificar conexiones físicas y estado del equipo. Documentar síntomas con fotos.",
      software:  "Reiniciar la aplicación y verificar actualizaciones pendientes.",
      red:       "Verificar cable de red, reiniciar router/switch. Probar con otro dispositivo.",
      acceso:    "Verificar credenciales y permisos con el administrador de sistemas.",
      correo:    "Verificar configuración SMTP/IMAP y cuota de almacenamiento.",
      impresora: "Verificar drivers, conexión USB/red y cola de impresión.",
      seguridad: "Aislar el sistema afectado e informar al equipo de seguridad inmediatamente.",
      base:      "Verificar servicio de BD y revisar logs de errores del motor.",
    };
    const inc = incidencia.toLowerCase();
    for (const [key, val] of Object.entries(suggestions)) {
      if (inc.includes(key)) return val;
    }
    return "Un técnico especializado revisará su incidencia y le contactará en breve.";
  }

  function getETA(prioridad) {
    const eta = {
      "crítica": "2 horas",
      "critica": "2 horas",
      "alta":    "4 horas",
      "media":   "1 día hábil",
      "baja":    "3 días hábiles",
    };
    return eta[prioridad.toLowerCase()] || "próximas 24 horas";
  }

  // ─── Simulación de respuesta ──────────────────────────────────────────────────

  function simulateWebhookResponse(payload) {
    return new Promise((resolve) => {
      // Simula el tiempo de procesamiento N8N + OpenAI (~2s)
      setTimeout(() => {
        const mockAI = {
          categoria: detectCategory(payload.incidencia),
          prioridad: payload.prioridad,
          resumen: `Incidencia de tipo "${payload.incidencia}" reportada por ${payload.nombre} en el área de ${payload.area}. Se requiere atención ${payload.prioridad.toLowerCase()}.`,
          sugerencia: getSuggestion(payload.incidencia),
          respuesta_usuario: `Estimado/a ${payload.nombre.split(" ")[0]}, su incidencia ha sido registrada con el número ${payload.ticket_number}. Nuestro equipo de soporte fue notificado y la IA clasificó su caso como prioridad ${payload.prioridad}. Tiempo estimado de respuesta: ${getETA(payload.prioridad)}.`,
        };
        resolve({
          success:       true,
          ticket_number: payload.ticket_number,
          mensaje:       "Incidencia registrada exitosamente (modo demo).",
          ia:            mockAI,
        });
      }, 2000);
    });
  }

  // ─── Envío al webhook ─────────────────────────────────────────────────────────

  async function sendToWebhook(payload) {
    // Modo demo: siempre simula, sin llamadas de red
    if (IS_DEMO) {
      console.info("[HelpDesk] Modo demo activo — simulando respuesta N8N + IA");
      return simulateWebhookResponse(payload);
    }

    // Producción: llamada real
    let response;
    try {
      response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Source":     "helpdesk-web",
          "X-Version":    "1.0.0",
        },
        body: JSON.stringify(payload),
      });
    } catch (networkErr) {
      // Error de red (CORS, servidor caído, sin internet)
      const msg = navigator.onLine
        ? `No se pudo conectar con el servidor. Verifica que N8N esté corriendo en ${WEBHOOK_URL}`
        : "Sin conexión a internet. Verifica tu red e intenta de nuevo.";
      throw new Error(msg);
    }

    if (!response.ok) {
      let detail = "";
      try { detail = await response.text(); } catch (_) {}
      throw new Error(`Error del servidor (${response.status})${detail ? ": " + detail : ""}`);
    }

    return response.json();
  }

  // ─── Manejo de UI ─────────────────────────────────────────────────────────────

  function showFieldError(fieldId, mensaje) {
    const group   = document.getElementById(`fg-${fieldId}`);
    const field   = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}-error`);

    if (group) group.classList.add("is-error");
    if (field) {
      field.classList.add("error");
      field.classList.remove("success");
      field.setAttribute("aria-invalid", "true");
    }
    if (errorEl) {
      errorEl.textContent = mensaje;
    }
  }

  function clearFieldError(fieldId) {
    const group   = document.getElementById(`fg-${fieldId}`);
    const field   = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}-error`);

    if (group) {
      group.classList.remove("is-error");
      group.classList.add("is-success");
    }
    if (field) {
      field.classList.remove("error");
      field.classList.add("success");
      field.setAttribute("aria-invalid", "false");
    }
    if (errorEl) errorEl.textContent = "";
  }

  function clearAllErrors() {
    ["nombre", "correo", "telefono", "area", "incidencia", "prioridad", "descripcion"].forEach(clearFieldError);
    const globalErr = document.getElementById("global-error");
    if (globalErr) globalErr.style.display = "none";
  }

  function setSubmitLoading(loading) {
    const btn      = document.getElementById("submit-btn");
    const btnText  = document.getElementById("btn-text");
    const btnLoader = document.getElementById("btn-loader");
    if (!btn) return;
    btn.disabled = loading;
    if (btnText)   btnText.style.display   = loading ? "none"   : "inline";
    if (btnLoader) btnLoader.style.display = loading ? "flex"   : "none";
  }

  function updateCharCount() {
    const desc    = document.getElementById("descripcion");
    const counter = document.getElementById("char-count");
    if (!desc || !counter) return;
    const len = desc.value.length;
    counter.textContent = `${len} / ${MAX_DESC_LENGTH}`;
    counter.classList.toggle("near-limit", len > MAX_DESC_LENGTH * 0.85 && len <= MAX_DESC_LENGTH);
    counter.classList.toggle("at-limit", len > MAX_DESC_LENGTH);
  }

  function showGlobalError(mensaje) {
    let alertEl = document.getElementById("global-error");
    if (!alertEl) {
      alertEl = document.createElement("div");
      alertEl.id = "global-error";
      alertEl.className = "form-alert form-alert--error";
      alertEl.style.cssText = "margin-bottom:1rem;";
      const form = document.getElementById("incident-form");
      form?.parentElement?.insertBefore(alertEl, form);
    }
    alertEl.innerHTML = `<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg><p>⚠ ${mensaje}</p>`;
    alertEl.style.display = "flex";
    alertEl.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => { if (alertEl) alertEl.style.display = "none"; }, 8000);
  }

  // ─── Validación en tiempo real ────────────────────────────────────────────────

  function attachRealtimeValidation() {
    const validatorMap = {
      nombre:      validateNombre,
      correo:      validateCorreo,
      telefono:    validateTelefono,
      area:        validateArea,
      incidencia:  validateIncidencia,
      prioridad:   validatePrioridad,
      descripcion: validateDescripcion,
    };

    for (const [fieldId, validator] of Object.entries(validatorMap)) {
      const el = document.getElementById(fieldId);
      if (!el) continue;

      el.addEventListener("blur", () => {
        const result = validator(el.value);
        if (!result.valido) showFieldError(fieldId, result.mensaje);
        else clearFieldError(fieldId);
      });

      el.addEventListener("input", () => {
        const errorEl = document.getElementById(`${fieldId}-error`);
        if (errorEl && errorEl.textContent) {
          const result = validator(el.value);
          if (result.valido) clearFieldError(fieldId);
        }
        if (fieldId === "descripcion") updateCharCount();
      });
    }
  }

  // ─── Submit handler ───────────────────────────────────────────────────────────

  async function handleFormSubmit(event) {
    event.preventDefault();
    clearAllErrors();

    const input = {
      nombre:      document.getElementById("nombre")?.value      ?? "",
      correo:      document.getElementById("correo")?.value      ?? "",
      telefono:    document.getElementById("telefono")?.value    ?? "",
      area:        document.getElementById("area")?.value        ?? "",
      incidencia:  document.getElementById("incidencia")?.value  ?? "",
      prioridad:   document.getElementById("prioridad")?.value   ?? "",
      descripcion: document.getElementById("descripcion")?.value ?? "",
    };

    const errors = validateForm(input);

    if (errors.size > 0) {
      errors.forEach((result, field) => showFieldError(field, result.mensaje));
      // Scroll al primer campo con error
      const firstErr = document.querySelector(".form-group.is-error");
      firstErr?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const validData = {
      nombre:      input.nombre.trim(),
      correo:      input.correo.trim().toLowerCase(),
      telefono:    input.telefono.trim(),
      area:        input.area,
      incidencia:  input.incidencia,
      prioridad:   input.prioridad,
      descripcion: input.descripcion.trim(),
    };

    const ticketNumber = generateTicketNumber();
    const payload      = buildWebhookPayload(validData, ticketNumber);

    setSubmitLoading(true);

    try {
      const response = await sendToWebhook(payload);

      if (response.success) {
        sessionStorage.setItem("lastTicket",       JSON.stringify(response));
        sessionStorage.setItem("lastTicketNumber", response.ticket_number ?? ticketNumber);
        window.location.href = "success.html";
      } else {
        showGlobalError("Hubo un problema al registrar tu incidencia. Por favor intenta nuevamente.");
      }
    } catch (err) {
      console.error("[HelpDesk] Error enviando formulario:", err);
      const msg = err instanceof Error
        ? err.message
        : "Error inesperado. Por favor recarga la página e intenta nuevamente.";
      showGlobalError(msg);
    } finally {
      setSubmitLoading(false);
    }
  }

  // ─── Inicialización ───────────────────────────────────────────────────────────

  function initForm() {
    const form = document.getElementById("incident-form");
    if (!form) return;

    form.addEventListener("submit", handleFormSubmit);
    attachRealtimeValidation();
    updateCharCount();

    // Activar pasos del sidebar según sección visible
    const steps    = document.querySelectorAll(".step-item");
    const sections = document.querySelectorAll(".form-section");

    if (sections.length > 0 && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const idx = Array.from(sections).indexOf(entry.target);
              steps.forEach((s, i) => s.classList.toggle("ss-step--active", i === idx));
            }
          });
        },
        { threshold: 0.5 }
      );
      sections.forEach((s) => observer.observe(s));
    }

    // Log de modo activo
    if (IS_DEMO) {
      console.info(
        "%c HelpDesk AI %c Modo Demo activo — el formulario simula el flujo N8N + IA ",
        "background:#6c63ff;color:#fff;padding:2px 6px;border-radius:3px 0 0 3px;",
        "background:#1a1d27;color:#a78bfa;padding:2px 6px;border-radius:0 3px 3px 0;"
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initForm);
  } else {
    initForm();
  }

  // Exponer para debugging
  window.HelpDeskForm = {
    validate:       validateForm,
    generateTicket: generateTicketNumber,
    isDemo:         IS_DEMO,
  };
})();