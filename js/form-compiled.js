/**
 * form-compiled.js — Reconectado a los IDs reales de form.html
 * Usa HelpDeskAPI (api.js) para el envío real al webhook N8N
 *
 * FIXES aplicados:
 *  - id="incident-form"   (era incidenciaForm)
 *  - id="submit-btn"      (era submitBtn)
 *  - id="char-count"      (era charCount)
 *  - id="formError"       ahora se crea dinámicamente si no existe
 *  - error span: "{fieldId}-error"  (era "error-{fieldId}")
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
  // IDs en form.html:
  //   grupo wrapper → id="fg-{fieldId}"
  //   span error    → id="{fieldId}-error"   ← OJO: sufijo, no prefijo
  function setFieldError(fieldId, msg) {
    var fg  = document.getElementById('fg-' + fieldId);      // div.form-group
    var err = document.getElementById(fieldId + '-error');    // span.form-error
    if (fg) {
      fg.classList.toggle('is-error',   !!msg);
      fg.classList.toggle('is-success', !msg);
    }
    if (err) err.textContent = msg || '';
  }

  function clearAll() {
    ['nombre','correo','telefono','area','incidencia','prioridad','descripcion']
      .forEach(function (id) { setFieldError(id, ''); });
    var alert = document.getElementById('formError');
    if (alert) alert.hidden = true;
  }

  // id="submit-btn" | .btn-text | .btn-loading | .btn-arrow  (IDs del HTML)
  function setLoading(on) {
    var btn     = document.getElementById('submit-btn');
    var btnText = document.getElementById('btn-text');
    var btnLoad = document.getElementById('btn-loader');
    var arrow   = btn && btn.querySelector('.btn-arrow');
    if (!btn) return;
    btn.disabled = on;
    if (btnText) btnText.style.display = on ? 'none' : '';
    if (btnLoad) btnLoad.style.display = on ? 'flex' : 'none';
    if (arrow)   arrow.style.display   = on ? 'none' : '';
  }

  // Crea el banner de error global dinámicamente si no existe en el HTML
  function showGlobalError(msg) {
    var el = document.getElementById('formError');
    if (!el) {
      el = document.createElement('div');
      el.id        = 'formError';
      el.className = 'form-alert form-alert--error';
      // Insertar justo antes del botón de submit
      var actions = document.querySelector('.form-actions');
      if (actions) {
        actions.parentNode.insertBefore(el, actions);
      } else {
        var form = document.getElementById('incident-form');
        if (form) form.appendChild(el);
      }
    }
    el.innerHTML = '<p>' + msg + '</p>';
    el.hidden = false;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // id="char-count"  (con guión, no camelCase)
  function updateCharCount() {
    var desc  = document.getElementById('descripcion');
    var count = document.getElementById('char-count');
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
        var msg = validators[id](el.value);
        setFieldError(id, msg);
      });

      el.addEventListener('input', function () {
        var fg = document.getElementById('fg-' + id);
        if (fg && fg.classList.contains('is-error')) {
          var msg = validators[id](el.value);
          setFieldError(id, msg);
        }
        if (id === 'descripcion') updateCharCount();
      });
    });
  }

  // ── Submit con manejo de loading via wrapper ──────────────────────────────────
  function enviarConFinally(formData) {
    setLoading(true);
    return HelpDeskAPI.enviarIncidencia(formData)
      .then(function (response) {
        setLoading(false);
        return response;
      })
      .catch(function (err) {
        setLoading(false);
        throw err;
      });
  }

  function handleSubmit(e) {
    e.preventDefault();
    clearAll();

    var fields = ['nombre','correo','telefono','area','incidencia','prioridad','descripcion'];
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
      showGlobalError('Error interno: api.js no está cargado. Verifica que el archivo existe en js/api.js');
      return;
    }

    var formData = {
      nombre:      values.nombre.trim(),
      correo:      values.correo.trim().toLowerCase(),
      telefono:    values.telefono.trim(),
      area:        values.area,
      incidencia:  values.incidencia,
      prioridad:   values.prioridad,
      descripcion: values.descripcion.trim()
    };

    enviarConFinally(formData)
      .then(function (response) {
        if (response.success) {
          sessionStorage.setItem('lastTicket',       JSON.stringify(response));
          sessionStorage.setItem('lastTicketNumber', response.ticket_number || '');
          window.location.href = 'success.html';
        } else {
          showGlobalError('Hubo un problema al registrar la incidencia. Intenta nuevamente.');
        }
      })
      .catch(function (err) {
        var msg = (err && err.message)
          ? err.message
          : 'Error de conexión. Verifica tu internet e intenta nuevamente.';
        showGlobalError(msg);
      });
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  function init() {
    var form = document.getElementById('incident-form');  // ID real en form.html
    if (!form) {
      console.warn('[HelpDeskForm] No se encontró #incident-form en esta página.');
      return;
    }

    form.addEventListener('submit', handleSubmit);
    attachRealtime();
    updateCharCount();

    console.log('[HelpDeskForm] Formulario inicializado correctamente.');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exponer para debugging
  window.HelpDeskForm = { validators: validators };

})();