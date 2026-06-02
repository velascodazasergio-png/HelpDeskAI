/**
 * form.ts — Lógica de validación y envío del formulario de incidencias
 * HelpDesk AI — Sistema de Gestión de Incidencias
 * TypeScript: compilar con tsc form.ts --target ES6 --outFile ../js/form-compiled.js
 */

import type {
  FormInput,
  ValidatedFormData,
  ValidationResult,
  WebhookPayload,
  WebhookResponse,
  AIAnalysis,
} from "./types";

// ─── Constantes ────────────────────────────────────────────────────────────────

const WEBHOOK_URL: string = "AQUI_WEBHOOK_N8N";
const MIN_DESC_LENGTH: number = 30;
const MAX_DESC_LENGTH: number = 2000;
const PHONE_REGEX: RegExp = /^[+]?[\d\s\-().]{7,20}$/;
const EMAIL_REGEX: RegExp = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// ─── Utilidades de validación ──────────────────────────────────────────────────

function validateNombre(valor: string): ValidationResult {
  const v = valor.trim();
  if (!v) return { valido: false, mensaje: "El nombre completo es requerido." };
  if (v.length < 3) return { valido: false, mensaje: "El nombre debe tener al menos 3 caracteres." };
  if (v.length > 100) return { valido: false, mensaje: "El nombre no puede superar 100 caracteres." };
  if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'-]+$/.test(v))
    return { valido: false, mensaje: "El nombre solo puede contener letras y espacios." };
  return { valido: true, mensaje: "" };
}

function validateCorreo(valor: string): ValidationResult {
  const v = valor.trim().toLowerCase();
  if (!v) return { valido: false, mensaje: "El correo electrónico es requerido." };
  if (!EMAIL_REGEX.test(v)) return { valido: false, mensaje: "Ingresa un correo electrónico válido." };
  if (v.length > 254) return { valido: false, mensaje: "El correo es demasiado largo." };
  return { valido: true, mensaje: "" };
}

function validateTelefono(valor: string): ValidationResult {
  const v = valor.trim();
  if (!v) return { valido: false, mensaje: "El teléfono es requerido." };
  if (!PHONE_REGEX.test(v))
    return { valido: false, mensaje: "Ingresa un número de teléfono válido (7–20 dígitos)." };
  return { valido: true, mensaje: "" };
}

function validateArea(valor: string): ValidationResult {
  if (!valor || valor === "") return { valido: false, mensaje: "Selecciona el área afectada." };
  return { valido: true, mensaje: "" };
}

function validateIncidencia(valor: string): ValidationResult {
  if (!valor || valor === "") return { valido: false, mensaje: "Selecciona el tipo de incidencia." };
  return { valido: true, mensaje: "" };
}

function validatePrioridad(valor: string): ValidationResult {
  if (!valor || valor === "") return { valido: false, mensaje: "Selecciona la prioridad." };
  return { valido: true, mensaje: "" };
}

function validateDescripcion(valor: string): ValidationResult {
  const v = valor.trim();
  if (!v) return { valido: false, mensaje: "La descripción es requerida." };
  if (v.length < MIN_DESC_LENGTH)
    return {
      valido: false,
      mensaje: `La descripción debe tener al menos ${MIN_DESC_LENGTH} caracteres. Tienes ${v.length}.`,
    };
  if (v.length > MAX_DESC_LENGTH)
    return {
      valido: false,
      mensaje: `La descripción no puede superar ${MAX_DESC_LENGTH} caracteres.`,
    };
  return { valido: true, mensaje: "" };
}

// ─── Validación completa del formulario ───────────────────────────────────────

function validateForm(input: FormInput): Map<keyof FormInput, ValidationResult> {
  const errors = new Map<keyof FormInput, ValidationResult>();

  const checks: [keyof FormInput, (v: string) => ValidationResult][] = [
    ["nombre", validateNombre],
    ["correo", validateCorreo],
    ["telefono", validateTelefono],
    ["area", validateArea],
    ["incidencia", validateIncidencia],
    ["prioridad", validatePrioridad],
    ["descripcion", validateDescripcion],
  ];

  for (const [field, fn] of checks) {
    const result = fn(input[field] as string);
    if (!result.valido) errors.set(field, result);
  }

  return errors;
}

// ─── Generación de número de ticket ───────────────────────────────────────────

function generateTicketNumber(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `TK-${ts}-${rand}`;
}

// ─── Construcción del payload para N8N ────────────────────────────────────────

function buildWebhookPayload(data: ValidatedFormData, ticketNumber: string): WebhookPayload {
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

// ─── Envío al webhook de N8N ──────────────────────────────────────────────────

async function sendToWebhook(payload: WebhookPayload): Promise<WebhookResponse> {
  if (WEBHOOK_URL === "AQUI_WEBHOOK_N8N") {
    // Modo simulación — sin backend real configurado
    await new Promise((r) => setTimeout(r, 1800));
    const mockAI: AIAnalysis = {
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

  return response.json() as Promise<WebhookResponse>;
}

// ─── Helpers de simulación IA ─────────────────────────────────────────────────

function detectCategory(incidencia: string): string {
  const map: Record<string, string> = {
    hardware: "Hardware",
    software: "Software",
    red: "Red / Conectividad",
    acceso: "Acceso / Seguridad",
    correo: "Comunicaciones",
    impresora: "Periféricos",
    otro: "General",
  };
  for (const [key, val] of Object.entries(map)) {
    if (incidencia.toLowerCase().includes(key)) return val;
  }
  return "General";
}

function getSuggestion(incidencia: string): string {
  const suggestions: Record<string, string> = {
    hardware: "Verificar conexiones físicas y estado del equipo. Documentar síntomas con fotos.",
    software: "Reiniciar la aplicación y verificar actualizaciones pendientes.",
    red: "Verificar cable de red, reiniciar router/switch. Probar con otro dispositivo.",
    acceso: "Verificar credenciales y permisos con el administrador de sistemas.",
    correo: "Verificar configuración SMTP/IMAP y cuota de almacenamiento.",
    impresora: "Verificar drivers, conexión USB/red y cola de impresión.",
  };
  for (const [key, val] of Object.entries(suggestions)) {
    if (incidencia.toLowerCase().includes(key)) return val;
  }
  return "Un técnico especializado revisará su incidencia y le contactará en breve.";
}

function getETA(prioridad: string): string {
  const eta: Record<string, string> = {
    critica: "2 horas",
    alta: "4 horas",
    media: "1 día hábil",
    baja: "3 días hábiles",
  };
  return eta[prioridad.toLowerCase()] ?? "próximas 24 horas";
}

// ─── Manejo de UI ─────────────────────────────────────────────────────────────

function showFieldError(fieldId: string, mensaje: string): void {
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

function clearFieldError(fieldId: string): void {
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

function clearAllErrors(): void {
  const fields = ["nombre", "correo", "telefono", "area", "incidencia", "prioridad", "descripcion"];
  fields.forEach(clearFieldError);
}

function setSubmitLoading(loading: boolean): void {
  const btn = document.getElementById("submit-btn") as HTMLButtonElement | null;
  const btnText = document.getElementById("btn-text");
  const btnLoader = document.getElementById("btn-loader");
  if (!btn) return;
  btn.disabled = loading;
  if (btnText) btnText.style.display = loading ? "none" : "inline";
  if (btnLoader) btnLoader.style.display = loading ? "flex" : "none";
}

function updateCharCount(): void {
  const desc = document.getElementById("descripcion") as HTMLTextAreaElement | null;
  const counter = document.getElementById("char-count");
  if (!desc || !counter) return;
  const len = desc.value.length;
  counter.textContent = `${len} / ${MAX_DESC_LENGTH}`;
  counter.style.color = len < MIN_DESC_LENGTH ? "var(--error)" : len > MAX_DESC_LENGTH * 0.9 ? "var(--warning)" : "var(--text-muted)";
}

// ─── Validación en tiempo real (blur) ─────────────────────────────────────────

function attachRealtimeValidation(): void {
  const validatorMap: Record<string, (v: string) => ValidationResult> = {
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
      const val = (el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
      const result = validator(val);
      if (!result.valido) showFieldError(fieldId, result.mensaje);
      else clearFieldError(fieldId);
    });

    el.addEventListener("input", () => {
      const val = (el as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement).value;
      const errorEl = document.getElementById(`${fieldId}-error`);
      if (errorEl && errorEl.style.display === "block") {
        const result = validator(val);
        if (result.valido) clearFieldError(fieldId);
      }
      if (fieldId === "descripcion") updateCharCount();
    });
  }
}

// ─── Submit handler principal ─────────────────────────────────────────────────

async function handleFormSubmit(event: Event): Promise<void> {
  event.preventDefault();
  clearAllErrors();

  const formEl = document.getElementById("incident-form") as HTMLFormElement | null;
  if (!formEl) return;

  // Leer valores
  const input: FormInput = {
    nombre: (document.getElementById("nombre") as HTMLInputElement)?.value ?? "",
    correo: (document.getElementById("correo") as HTMLInputElement)?.value ?? "",
    telefono: (document.getElementById("telefono") as HTMLInputElement)?.value ?? "",
    area: (document.getElementById("area") as HTMLSelectElement)?.value ?? "",
    incidencia: (document.getElementById("incidencia") as HTMLSelectElement)?.value ?? "",
    prioridad: (document.getElementById("prioridad") as HTMLSelectElement)?.value ?? "",
    descripcion: (document.getElementById("descripcion") as HTMLTextAreaElement)?.value ?? "",
  };

  // Validar
  const errors = validateForm(input);
  if (errors.size > 0) {
    errors.forEach((result, field) => showFieldError(field, result.mensaje));
    // Scroll al primer error
    const firstErrorField = document.querySelector(".form-input.error, .form-select.error");
    firstErrorField?.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }

  // Todo válido — preparar envío
  const validData: ValidatedFormData = {
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
      // Guardar datos para success.html
      sessionStorage.setItem("lastTicket", JSON.stringify(response));
      sessionStorage.setItem("lastTicketNumber", response.ticket_number ?? ticketNumber);
      window.location.href = "success.html";
    } else {
      showGlobalError("Hubo un problema al registrar tu incidencia. Por favor intenta nuevamente.");
    }
  } catch (err: unknown) {
    console.error("Error enviando formulario:", err);
    const msg =
      err instanceof Error
        ? err.message
        : "Error de conexión. Verifica tu internet e intenta nuevamente.";
    showGlobalError(msg);
  } finally {
    setSubmitLoading(false);
  }
}

function showGlobalError(mensaje: string): void {
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
    if (alertEl) alertEl.style.display = "none";
  }, 8000);
}

// ─── Inicialización ───────────────────────────────────────────────────────────

function initForm(): void {
  const form = document.getElementById("incident-form");
  if (!form) return;

  form.addEventListener("submit", handleFormSubmit);
  attachRealtimeValidation();
  updateCharCount();

  // Marcar pasos del sidebar como activos
  const steps = document.querySelectorAll<HTMLElement>(".step-item");
  const sections = document.querySelectorAll<HTMLElement>(".form-section");
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = Array.from(sections).indexOf(entry.target as HTMLElement);
          steps.forEach((s, i) => s.classList.toggle("active", i === idx));
        }
      });
    },
    { threshold: 0.5 }
  );
  sections.forEach((s) => observer.observe(s));
}

// Arrancar cuando el DOM esté listo
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initForm);
} else {
  initForm();
}

export {
  validateForm,
  validateNombre,
  validateCorreo,
  validateTelefono,
  validateDescripcion,
  generateTicketNumber,
  buildWebhookPayload,
  sendToWebhook,
};
