/**
 * form-compiled.js — IDs sincronizados con form.html
 *
 * form.html usa:
 *   id="incident-form"      ← el <form>
 *   id="nombre"             ← inputs
 *   id="correo"
 *   id="telefono"
 *   id="area"
 *   id="incidencia"
 *   id="prioridad"
 *   id="descripcion"
 *   id="submit-btn"         ← botón submit
 *   id="btn-text"           ← span texto normal
 *   id="btn-loader"         ← span loading
 *   id="char-count"         ← contador de caracteres
 *   id="fg-{campo}"         ← div.form-group wrapper  (fg-nombre, fg-correo, etc.)
 *   id="{campo}-error"      ← span de error           (nombre-error, correo-error, etc.)
 */

(function () {
  'use strict';

  // ── Constantes ──────────────────────────────────────────────────────────────
  var MIN_DESC = 30;
  var MAX_DESC = 2000;
  var PHONE_RE = /^[+]?[\d\s\-(). ]{7,20}$/;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // ── Validadores ─────────────────────────────────────────────────────────────
  var validators = {
    nombre: function (v) {
      v = v.trim();
      if (!v)           return 'El nombre completo es requerido.';
      if (v.length < 3) return 'El nombre debe tener al menos 3 caracteres.';
      if (v.length > 100) return 'El nombre no puede superar 100 caracteres.';
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'\-]+$/.test(v))
        return 'El nombre solo puede contener letras y espacios.';
      return '';
    },
    correo: function (v) {
      v = v.trim();
      if (!v)               return 'El correo electrónico es requerido.';
      if (!EMAIL_RE.test(v)) return 'Ingresa un correo electrónico válido.';
      return '';
    },
    telefono: function (v) {
      v = v.trim();
      if (!v)                return 'El teléfono es requerido.';
      if (!PHONE_RE.test(v)) return 'Ingresa un número de teléfono válido (7–20 dígitos).';
      return '';
    },
    area: function (v) {
      return v ? '' : 'Selecciona el área afectada.';
    },
    incidencia: function (v) {
      return v ? '' : 'Selecciona el tipo de incidencia.';
    },
    prioridad: function (v) {
      return v ? '' : 'Selecciona la prioridad.';
    },
    descripcion: function (v) {
      v = v.trim();
      if (!v)                  return 'La descripción es requerida.';
      if (v.length < MIN_DESC) return 'La descripción debe tener al menos ' + MIN_DESC + ' caracteres. Tienes ' + v.length + '.';
      if (v.length > MAX_DESC) return 'La descripción no puede superar ' + MAX_DESC + ' caracteres.';
      return '';
    }
  };

  // ── UI helpers ───────────────────────────────────────────────────────────────
  // form.html: wrapper = id="fg-{campo}"  |  error span = id="{campo}-error"
  function setFieldError(fieldId, msg) {
    var fg  = document.getElementById('fg-' + fieldId);      // div.form-group
    var err = document.getElementById(fieldId + '-error');    // span.form-error  ← CORREGIDO
    if (fg) {
      fg.classList.toggle('is-error',   !!msg);
      fg.classList.toggle('is-success', !msg);
    }
    if (err) err.textContent = msg || '';
  }

  function clearAll() {
    ['nombre', 'correo', 'telefono', 'area', 'incidencia', 'prioridad', 'descripcion']
      .forEach(function (id) { setFieldError(id, ''); });
  }

  // Controla el estado del botón de submit
  // form.html: id="submit-btn"  |  id="btn-text"  |  id="btn-loader"
  function setLoading(on) {
    var btn    = document.getElementById('submit-btn');   // ← CORREGIDO
    var text   = document.getElementById('btn-text');     // ← CORREGIDO
    var loader = document.getElementById('btn-loader');   // ← CORREGIDO
    var arrow  = btn && btn.querySelector('.btn-arrow');

    if (!btn) return;
    btn.disabled = on;
    if (text)   text.style.display   = on ? 'none' : '';
    if (loader) loader.style.display = on ? 'inline-flex' : 'none';
    if (arrow)  arrow.style.display  = on ? 'none' : '';
  }

  // Actualiza el contador de caracteres
  // form.html: id="char-count"
  function updateCharCount() {
    var desc  = document.getElementById('descripcion');
    var count = document.getElementById('char-count');    // ← CORREGIDO
    if (!desc || !count) return;
    var len = desc.value.length;
    count.textContent = len + ' / ' + MAX_DESC;
    count.className = 'char-count' +
      (len > MAX_DESC * 0.9 ? ' near-limit' : '') +
      (len >= MAX_DESC       ? ' at-limit'   : '');
  }

  // ── Validación en tiempo real ────────────────────────────────────────────────
  function attachRealtime() {
    Object.keys(validators).forEach(function (id) {
      var el = document.getElementById(id);
      if (!el) return;

      el.addEventListener('blur', function () {
        setFieldError(id, validators[id](el.value));
      });

      el.addEventListener('input', function () {
        var fg = document.getElementById('fg-' + id);
        if (fg && fg.classList.contains('is-error')) {
          setFieldError(id, validators[id](el.value));
        }
        if (id === 'descripcion') updateCharCount();
      });
    });
  }

  // ── Submit ───────────────────────────────────────────────────────────────────
  function handleSubmit(e) {
    e.preventDefault();
    clearAll();

    var fields = ['nombre', 'correo', 'telefono', 'area', 'incidencia', 'prioridad', 'descripcion'];
    var values = {};
    var hasError = false;

    fields.forEach(function (id) {
      var el  = document.getElementById(id);
      var val = el ? el.value : '';
      values[id] = val;
      var msg = validators[id](val);
      if (msg) {
        setFieldError(id, msg);
        hasError = true;
      }
    });

    if (hasError) {
      var firstError = document.querySelector('.form-group.is-error');
      if (firstError) firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    if (typeof HelpDeskAPI === 'undefined') {
      alert('Error interno: api.js no está cargado. Verifica que el archivo existe en js/api.js');
      return;
    }

    setLoading(true);

    var formData = {
      nombre:      values.nombre.trim(),
      correo:      values.correo.trim().toLowerCase(),
      telefono:    values.telefono.trim(),
      area:        values.area,
      incidencia:  values.incidencia,
      prioridad:   values.prioridad,
      descripcion: values.descripcion.trim()
    };

    HelpDeskAPI.enviarIncidencia(formData)
      .then(function (response) {
        setLoading(false);
        if (response.success) {
          sessionStorage.setItem('lastTicket',       JSON.stringify(response));
          sessionStorage.setItem('lastTicketNumber', response.ticket_number || '');
          window.location.href = 'success.html';
        } else {
          mostrarErrorGlobal('Hubo un problema al registrar la incidencia. Intenta nuevamente.');
        }
      })
      .catch(function (err) {
        setLoading(false);
        var msg = (err && err.message)
          ? err.message
          : 'Error de conexión. Verifica tu internet e intenta nuevamente.';
        mostrarErrorGlobal(msg);
      });
  }

  // Muestra error debajo del botón (no hay #formError en el HTML, usa alert como fallback)
  function mostrarErrorGlobal(msg) {
    // Intentar mostrar en un elemento existente o crear uno temporal
    var existing = document.getElementById('form-global-error');
    if (!existing) {
      existing = document.createElement('p');
      existing.id = 'form-global-error';
      existing.style.cssText = 'color:#f87171;margin-top:1rem;text-align:center;font-size:0.9rem;';
      var actions = document.querySelector('.form-actions');
      if (actions) actions.appendChild(existing);
    }
    existing.textContent = '⚠ ' + msg;
    existing.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    var form = document.getElementById('incident-form');   // ← CORREGIDO (era 'incidenciaForm')
    if (!form) {
      console.warn('[HelpDeskForm] No se encontró #incident-form en el DOM.');
      return;
    }

    form.addEventListener('submit', handleSubmit);
    attachRealtime();
    updateCharCount();

    console.log('[HelpDeskForm] ✅ Formulario inicializado. Webhook:', HelpDeskAPI ? HelpDeskAPI.getConfig().webhookUrl : 'api.js no cargado');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.HelpDeskForm = { validators: validators };

})();