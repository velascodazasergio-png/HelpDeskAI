/**
 * HelpDesk AI — app.js
 * Main application logic: navbar, animations, UI interactions
 */

'use strict';

// ===== NAVBAR =====
(function initNavbar() {
  const navbar = document.getElementById('navbar');
  const hamburger = document.getElementById('hamburger');
  const navLinks = document.querySelector('.nav-links');

  if (!navbar) return;

  // Scroll effect
  function onScroll() {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hamburger menu
  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function() {
      const isOpen = navLinks.classList.toggle('open');
      hamburger.classList.toggle('active', isOpen);
      hamburger.setAttribute('aria-expanded', isOpen.toString());
    });

    // Close on outside click
    document.addEventListener('click', function(e) {
      if (!navbar.contains(e.target)) {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
      }
    });

    // Close on nav link click
    navLinks.querySelectorAll('a').forEach(function(link) {
      link.addEventListener('click', function() {
        navLinks.classList.remove('open');
        hamburger.classList.remove('active');
      });
    });
  }
})();

// ===== SCROLL REVEAL ANIMATIONS =====
(function initScrollReveal() {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -60px 0px'
  });

  // Observe elements
  const revealEls = document.querySelectorAll(
    '.benefit-card, .step, .stat-pill, .ticket-item, .status-card'
  );

  revealEls.forEach(function(el, index) {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transitionDelay = (index * 0.06) + 's';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });

  // Inject CSS for is-visible
  const style = document.createElement('style');
  style.textContent = '.is-visible { opacity: 1 !important; transform: translateY(0) !important; }';
  document.head.appendChild(style);
})();

// ===== SMOOTH SCROLL FOR ANCHORS =====
(function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const navHeight = parseInt(
          getComputedStyle(document.documentElement).getPropertyValue('--nav-height')
        ) || 70;
        const targetPos = target.getBoundingClientRect().top + window.scrollY - navHeight - 20;
        window.scrollTo({ top: targetPos, behavior: 'smooth' });
      }
    });
  });
})();

// ===== ANIMATED COUNTERS (for stats) =====
(function initCounters() {
  const counters = document.querySelectorAll('.stat-num, .sp-num');
  if (!counters.length) return;

  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = el.getAttribute('data-target');
        if (target) {
          animateCounter(el, parseInt(target));
        }
        observer.unobserve(el);
      }
    });
  }, { threshold: 0.5 });

  counters.forEach(function(counter) {
    const text = counter.textContent.trim();
    const num = parseInt(text.replace(/\D/g, ''));
    if (!isNaN(num) && num > 0) {
      counter.setAttribute('data-target', num);
      counter.setAttribute('data-original', text);
      counter.textContent = '0';
      observer.observe(counter);
    }
  });

  function animateCounter(el, target) {
    const original = el.getAttribute('data-original') || target;
    const duration = 1200;
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    let step = 0;

    const timer = setInterval(function() {
      step++;
      current = Math.min(Math.round(increment * step), target);
      el.textContent = current;

      if (step >= steps) {
        clearInterval(timer);
        el.textContent = original; // Restore original formatting
      }
    }, duration / steps);
  }
})();

// ===== KEYBOARD NAVIGATION =====
(function initKeyboard() {
  document.addEventListener('keydown', function(e) {
    // ESC closes modals
    if (e.key === 'Escape') {
      const overlay = document.getElementById('modalOverlay');
      if (overlay && !overlay.hidden) {
        overlay.hidden = true;
        document.body.style.overflow = '';
      }
    }
  });
})();

// ===== UTILITY FUNCTIONS =====
window.HelpDeskUtils = {
  /**
   * Format date to locale string
   * @param {string|Date} date
   * @returns {string}
   */
  formatDate: function(date) {
    const d = new Date(date);
    return d.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  /**
   * Generate random ticket number
   * @returns {string}
   */
  generateTicketNumber: function() {
    const num = Math.floor(1000 + Math.random() * 9000);
    return 'TK-' + num;
  },

  /**
   * Show toast notification
   * @param {string} message
   * @param {string} type - 'success' | 'error' | 'info'
   */
  showToast: function(message, type) {
    type = type || 'info';

    // Remove existing toasts
    const existing = document.querySelectorAll('.hd-toast');
    existing.forEach(function(t) { t.remove(); });

    const toast = document.createElement('div');
    toast.className = 'hd-toast hd-toast--' + type;
    toast.innerHTML =
      '<span class="hd-toast-icon">' + (type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ') + '</span>' +
      '<span>' + message + '</span>';

    // Styles
    Object.assign(toast.style, {
      position: 'fixed',
      bottom: '24px',
      right: '24px',
      background: type === 'success' ? '#166534' : type === 'error' ? '#7f1d1d' : '#1e3a8a',
      border: '1px solid ' + (type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : '#3b82f6'),
      color: '#fff',
      padding: '0.75rem 1.25rem',
      borderRadius: '0.75rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '0.875rem',
      fontFamily: 'var(--font-body)',
      fontWeight: '500',
      zIndex: '9999',
      boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
      animation: 'toastIn 0.3s ease both',
      maxWidth: '380px'
    });

    // Inject animation keyframes once
    if (!document.getElementById('toast-styles')) {
      const style = document.createElement('style');
      style.id = 'toast-styles';
      style.textContent = `
        @keyframes toastIn {
          from { opacity: 0; transform: translateY(16px) scale(0.95); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes toastOut {
          to { opacity: 0; transform: translateY(8px); }
        }
      `;
      document.head.appendChild(style);
    }

    document.body.appendChild(toast);

    // Auto-dismiss
    setTimeout(function() {
      toast.style.animation = 'toastOut 0.3s ease both';
      setTimeout(function() { toast.remove(); }, 300);
    }, 4000);
  },

  /**
   * Debounce function
   * @param {Function} fn
   * @param {number} delay
   * @returns {Function}
   */
  debounce: function(fn, delay) {
    let timer;
    return function() {
      const args = arguments;
      const ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
    };
  },

  /**
   * Sanitize string for safe display
   * @param {string} str
   * @returns {string}
   */
  sanitize: function(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  }
};

// ===== LOG SYSTEM INFO =====
console.log(
  '%c HelpDesk AI %c v1.0.0 ',
  'background:#6c63ff;color:#fff;padding:4px 8px;border-radius:4px 0 0 4px;font-weight:bold;',
  'background:#1a1d27;color:#a78bfa;padding:4px 8px;border-radius:0 4px 4px 0;'
);
console.log('%c Sistema de Gestión de Incidencias con IA · N8N · Telegram', 'color:#8a8fa8;');
