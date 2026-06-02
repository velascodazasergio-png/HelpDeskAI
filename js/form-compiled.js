/**
 * form-compiled.js — Versión compilada de form.ts para uso directo en el navegador
 * HelpDesk AI — Sistema de Gestión de Incidencias
 * Generado a partir de: ts/form.ts
 * Nota: En producción, compilar con: tsc ts/form.ts --target ES2020 --outFile js/form-compiled.js
 */

(function () {
  "use strict";

  // ─── Constantes ──────────────────────────────────────────────────────────────
  const WEBHOOK_URL = "AQUI_WEBHOOK_N8N";
  const MIN_DESC_LENGTH = 30;
  const MAX_DESC_LENGTH = 2000;
  const PHONE_REGEX = /^[+]?[\d\s\-().]{7,20}$/;
  const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // ─── Validadores ─────────────────────────────────────────────────────────────

  function validateNombre(valor) {
    const v = valor.trim();
    if (!v) return { valido: false, mensaje: "El nombre completo es requerido." };
    if (v.length < 3) return { valido: false, mensaje: "El nombre debe tener al menos 3 caracteres." };
    if (v.length > 100) return { valido: false, mensaje: "El nombre no puede superar 100 caracteres." };
    if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/.test(v))
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

  // ─── Validación completa ──────────────────────────────────────────────────────

  function validateForm(input) {
    const errors = new Map();
    const checks = [
      ["nombre", validateNombre],
      ["correo", validateCorreo],
      ["telefono", validateTelefono],
      ["area", validateArea],
      ["incidencia", validateIncidencia],
      ["prioridad", validatePrioridad],
      ["descripcion", validateDescripcion],
    ];
    for (const [field, fn] of checks) {
      const result = fn(input[field]);
      if (!result.valido) errors.set(field, result);
    }
    return errors;
  }

  // ─── Generador de ticket ──────────────────────────────────────────────────────

  function generateTicketNumber() {
    const ts = Date.now().toString(36).toUpperCase();
    const rand = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    return `TK-${ts}-${rand}`;
  }

  // ─── Payload para N8N ─────────────────────────────────────────────────────────

  function buildWebhookPayload(data, ticketNumber) {
    return {
      ticket_number: ticketNumber,
      nombre: data.nombre,
      correo: data.correo,
      telefono: data.telefono,
      area: data.area,
      incidencia: data.incidencia,
      prioridad: data.prioridad,
      descripcion: data.descripcion,
      timestamp: new Date().toISOString(),
      origen: "web",
      version: "1.0.0",
      metadata: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    };
  }

  // ─── Helpers de simulación IA ────────────────────────────────────────────────

  function detectCategory(incidencia) {
    const map = {
      hardware: "Hardware",
      software: "Software",
      red: "Red / Conectividad",
      acceso: "Acceso / Seguridad",
      correo: "Comunicaciones",
      impresora: "Periféricos",
      otro: "General",
    };
    const inc = incidencia.toLowerCase();
    for (const [key, val] of Object.entries(map)) {
      if (inc.includes(key)) return val;
    }
    return "General";
  }

  function getSuggestion(incidencia) {
    const suggestions = {
      hardware: "Verificar conexiones físicas y estado del equipo. Documentar síntomas con fotos.",
      software: "Reiniciar la aplicación y verificar actualizaciones pendientes.",
      red: "Verificar cable de red, reiniciar router/switch. Probar con otro dispositivo.",
      acceso: "Verificar credenciales y permisos con el administrador de sistemas.",
      correo: "Verificar configuración SMTP/IMAP y cuota de almacenamiento.",
      impresora: "Verificar drivers, conexión USB/red y cola de impresión.",
    };
    const inc = incidencia.toLowerCase();
    for (const [key, val] of Object.entries(suggestions)) {
      if (inc.includes(key)) return val;
    }
    return "Un técnico especializado revisará su incidencia y le contactará en breve.";
  }

  function getETA(prioridad) {
    const eta = {
      crítica: "2 horas",
      critica: "2 horas",
      alta: "4 horas",
      media: "1 día hábil",
      baja: "3 días hábiles",
    };
    return eta[prioridad.toLowerCase()] || "próximas 24 horas";
  }

  // ─── Envío al webhook ─────────────────────────────────────────────────────────

  async function sendToWebhook(payload) {
    if (WEBHOOK_URL === "AQUI_WEBHOOK_N8N") {
      await new Promise((r) => setTimeout(r, 1800));
      const mockAI = {
        categoria: detectCategory(payload.incidencia),
        prioridad: payload.prioridad,
        resumen: `Incidencia de tipo "${payload.incidencia}" reportada por ${payload.nombre} en el área de ${payload.area}. Se requiere atención ${payload.prioridad.toLowerCase()}.`,
        sugerencia: getSuggestion(payload.incidencia),
        respuesta_usuario: `Estimado/a ${payload.nombre}, su incidencia ha sido registrada con el número ${payload.ticket_number}. Nuestro equipo de soporte fue notificado y la IA clasificó su caso como prioridad ${payload.prioridad}. Tiempo estimado de respuesta: ${getETA(payload.prioridad)}.`,
      };
      return {
        success: true,
        ticket_number: payload.ticket_number,
        mensaje: "Incidencia registrada exitosamente.",
        ia: mockAI,
      };
    }

    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Source": "helpdesk-web",
        "X-Version": "1.0.0",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => "Error desconocido");
      throw new Error(`Error del servidor (${response.status}): ${errorText}`);
    }
    return response.json();
  }

  // ─── Manejo de UI ─────────────────────────────────────────────────────────────

  function showFieldError(fieldId, mensaje) {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (field) {
      field.classList.add("error");
      field.classList.remove("success");
      field.setAttribute("aria-invalid", "true");
    }
    if (errorEl) {
      errorEl.textContent = mensaje;
      errorEl.style.display = "block";
    }
  }

  function clearFieldError(fieldId) {
    const field = document.getElementById(fieldId);
    const errorEl = document.getElementById(`${fieldId}-error`);
    if (field) {
      field.classList.remove("error");
      field.classList.add("success");
      field.setAttribute("aria-invalid", "false");
    }
    if (errorEl) {
      errorEl.textContent = "";
      errorEl.style.display = "none";
    }
  }

  function clearAllErrors() {
    ["nombre", "correo", "telefono", "area", "incidencia", "prioridad", "descripcion"].forEach(
      clearFieldError
    );
  }

  function setSubmitLoading(loading) {
    const btn = document.getElementById("submit-btn");
    const btnText = document.getElementById("btn-text");
    const btnLoader = document.getElementById("btn-loader");
    if (!btn) return;
    btn.disabled = loading;
    if (btnText) btnText.style.display = loading ? "none" : "inline";
    if (btnLoader) btnLoader.style.display = loading ? "flex" : "none";
  }

  function updateCharCount() {
    const desc = document.getElementById("descripcion");
    const counter = document.getElementById("char-count");
    if (!desc || !counter) return;
    const len = desc.value.length;
    counter.textContent = `${len} / ${MAX_DESC_LENGTH}`;
    counter.style.color =
      len < MIN_DESC_LENGTH
        ? "var(--error)"
        : len > MAX_DESC_LENGTH * 0.9
        ? "var(--warning)"
        : "var(--text-muted)";
  }

  // ─── Validación en tiempo real ────────────────────────────────────────────────

  function attachRealtimeValidation() {
    const validatorMap = {
      nombre: validateNombre,
      correo: validateCorreo,
      telefono: validateTelefono,
      area: validateArea,
      incidencia: validateIncidencia,
      prioridad: validatePrioridad,
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
        if (errorEl && errorEl.style.display === "block") {
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
      nombre: document.getElementById("nombre")?.value ?? "",
      correo: document.getElementById("correo")?.value ?? "",
      telefono: document.getElementById("telefono")?.value ?? "",
      area: document.getElementById("area")?.value ?? "",
      incidencia: document.getElementById("incidencia")?.value ?? "",
      prioridad: document.getElementById("prioridad")?.value ?? "",
      descripcion: document.getElementById("descripcion")?.value ?? "",
    };

    const errors = validateForm(input);
    if (errors.size > 0) {
      errors.forEach((result, field) => showFieldError(field, result.mensaje));
      const firstErrorField = document.querySelector(".form-input.error, .form-select.error");
      firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    const validData = {
      nombre: input.nombre.trim(),
      correo: input.correo.trim().toLowerCase(),
      telefono: input.telefono.trim(),
      area: input.area,
      incidencia: input.incidencia,
      prioridad: input.prioridad,
      descripcion: input.descripcion.trim(),
    };

    const ticketNumber = generateTicketNumber();
    const payload = buildWebhookPayload(validData, ticketNumber);

    setSubmitLoading(true);

    try {
      const response = await sendToWebhook(payload);
      if (response.success) {
        sessionStorage.setItem("lastTicket", JSON.stringify(response));
        sessionStorage.setItem("lastTicketNumber", response.ticket_number ?? ticketNumber);
        window.location.href = "success.html";
      } else {
        showGlobalError("Hubo un problema al registrar tu incidencia. Por favor intenta nuevamente.");
      }
    } catch (err) {
      console.error("Error enviando formulario:", err);
      const msg =
        err instanceof Error ? err.message : "Error de conexión. Verifica tu internet e intenta nuevamente.";
      showGlobalError(msg);
    } finally {
      setSubmitLoading(false);
    }
  }

  function showGlobalError(mensaje) {
    let alertEl = document.getElementById("global-error");
    if (!alertEl) {
      alertEl = document.createElement("div");
      alertEl.id = "global-error";
      alertEl.className = "global-error-banner";
      const form = document.getElementById("incident-form");
      form?.parentElement?.insertBefore(alertEl, form);
    }
    alertEl.textContent = `⚠ ${mensaje}`;
    alertEl.style.display = "block";
    alertEl.scrollIntoView({ behavior: "smooth", block: "center" });
    setTimeout(() => {
      alertEl.style.display = "none";
    }, 8000);
  }

  // ─── Init ─────────────────────────────────────────────────────────────────────

  function initForm() {
    const form = document.getElementById("incident-form");
    if (!form) return;

    form.addEventListener("submit", handleFormSubmit);
    attachRealtimeValidation();
    updateCharCount();

    // Observer para steps del sidebar
    const steps = document.querySelectorAll(".step-item");
    const sections = document.querySelectorAll(".form-section");

    if (sections.length > 0 && "IntersectionObserver" in window) {
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              const idx = Array.from(sections).indexOf(entry.target);
              steps.forEach((s, i) => s.classList.toggle("active", i === idx));
            }
          });
        },
        { threshold: 0.5 }
      );
      sections.forEach((s) => observer.observe(s));
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initForm);
  } else {
    initForm();
  }

  // Exponer utilidades globalmente para debugging en desarrollo
  window.HelpDeskForm = {
    validate: validateForm,
    generateTicket: generateTicketNumber,
  };
})();
