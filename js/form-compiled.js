/**
 * form-compiled.js — Reconectado a los IDs reales de form.html
 * Usa HelpDeskAPI (api.js) para el envío real al webhook N8N
 */

(function () {
  'use strict';

  // ── Constantes ──────────────────────────────────────────────────────────────
  var MIN_DESC = 30;
  var MAX_DESC = 2000;
  var PHONE_RE = /^[+]?[\d\s\-(). ]{7,20}$/;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  // ── Mapa de IDs reales del HTML ──────────────────────────────────────────────
  // form.html usa:  id="incidenciaForm", id="nombre", id="correo", id="telefono",
  //                 id="area", id="incidencia", id="prioridad", id="descripcion"
  //                 id="submitBtn", id="charCount"
  //                 id="fg-nombre", id="error-nombre" … (el fg- es el wrapper del grupo)

  // ── Validadores ─────────────────────────────────────────────────────────────
  var validators = {
    nombre: function (v) {
      v = v.trim();
      if (!v)         return 'El nombre completo es requerido.';
      if (v.length < 3) return 'El nombre debe tener al menos 3 caracteres.';
      if (v.length > 100) return 'El nombre no puede superar 100 caracteres.';
      if (!/^[a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s'\-]+$/.test(v))
        return 'El nombre solo puede contener letras y espacios.';
      return '';
    },
    correo: function (v) {
      v = v.trim();
      if (!v)              return 'El correo electrónico es requerido.';
      if (!EMAIL_RE.test(v)) return 'Ingresa un correo electrónico válido.';
      return '';
    },
    telefono: function (v) {
      v = v.trim();
      if (!v)               return 'El teléfono es requerido.';
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
  function setFieldError(fieldId, msg) {
    var fg  = document.getElementById('fg-' + fieldId);   // el div.form-group
    var err = document.getElementById('error-' + fieldId); // el span.form-error
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

  function setLoading(on) {
    var btn     = document.getElementById('submitBtn');
    var btnText = btn && btn.querySelector('.btn-text');
    var btnLoad = btn && btn.querySelector('.btn-loading');
    var arrow   = btn && btn.querySelector('.btn-arrow');
    if (!btn) return;
    btn.disabled = on;
    if (btnText) btnText.hidden = on;
    if (btnLoad) btnLoad.hidden = !on;
    if (arrow)   arrow.hidden   = on;
  }

  function showGlobalError(msg) {
    var el  = document.getElementById('formError');
    var txt = document.getElementById('formErrorMsg');
    if (!el) return;
    if (txt) txt.textContent = msg;
    el.hidden = false;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function updateCharCount() {
    var desc  = document.getElementById('descripcion');
    var count = document.getElementById('charCount');
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

  // ── Submit ───────────────────────────────────────────────────────────────────
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

    setLoading(true);

    // Usar HelpDeskAPI (api.js) que ya maneja la URL del webhook y el modo simulación
    if (typeof HelpDeskAPI === 'undefined') {
      setLoading(false);
      showGlobalError('Error interno: módulo API no cargado. Verifica que api.js esté incluido.');
      return;
    }

    HelpDeskAPI.enviarIncidencia({
      nombre:      values.nombre.trim(),
      correo:      values.correo.trim().toLowerCase(),
      telefono:    values.telefono.trim(),
      area:        values.area,
      incidencia:  values.incidencia,
      prioridad:   values.prioridad,
      descripcion: values.descripcion.trim()
    })
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
    })
    .finally
      ? HelpDeskAPI.enviarIncidencia // already handled above — use .then/.catch chain
      : null; // no-op fallback
  }

  // .finally polyfill via wrapper
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

  // Reescribir handleSubmit para usar el wrapper de finally
  function handleSubmitFinal(e) {
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
      showGlobalError('Error interno: módulo API no cargado.');
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
    var form = document.getElementById('incidenciaForm'); // ID real en form.html
    if (!form) return;

    form.addEventListener('submit', handleSubmitFinal);
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