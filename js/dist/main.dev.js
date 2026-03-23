"use strict";

/**
 * Main Module - Core application functionality
 * Handles loader, toast, theme, and utility functions
 */
if ('caches' in window) {
  caches.keys().then(function (names) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = names[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var name = _step.value;
        caches["delete"](name);
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  });
}

var App = function () {
  // ========== INITIALIZATION ==========
  function init() {
    console.log('🚀 App initialized'); // Hide loader after 1.5 seconds

    setTimeout(hideLoader, 1500); // Initialize theme

    initTheme(); // Set active nav link based on current page

    setActiveNavLink();
  }

  function hideLoader() {
    var loader = document.getElementById('crmLoader');
    if (!loader) return;
    loader.classList.add('fade-out');
    setTimeout(function () {
      loader.style.display = 'none';
    }, 500);
  }

  function initTheme() {
    var isDark = localStorage.getItem('darkMode') === 'true';

    if (isDark) {
      document.body.classList.add('dark');
      updateThemeIcon(true);
    } // Add theme toggle event


    var themeToggle = document.getElementById('theme-toggle');

    if (themeToggle) {
      themeToggle.addEventListener('click', toggleTheme);
    }
  }

  function updateThemeIcon(isDark) {
    var icon = document.querySelector('#theme-toggle i');
    if (!icon) return;

    if (isDark) {
      icon.classList.remove('fa-sun');
      icon.classList.add('fa-moon');
    } else {
      icon.classList.remove('fa-moon');
      icon.classList.add('fa-sun');
    }
  }

  function setActiveNavLink() {
    var currentPage = window.location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(function (link) {
      var href = link.getAttribute('href');

      if (href === currentPage) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  } // ========== TOAST NOTIFICATIONS ==========


  function showToast(message) {
    var type = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'info';
    var duration = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 3000;
    var toast = document.getElementById('toast');
    if (!toast) return;

    if (window.toastTimeout) {
      clearTimeout(window.toastTimeout);
    }

    toast.className = "show ".concat(type);
    toast.innerHTML = "\n            <div class=\"toast-body\">\n                <i class=\"toast-icon fa-solid ".concat(getToastIcon(type), "\"></i>\n                <span>").concat(escapeHtml(message), "</span>\n            </div>\n            <div class=\"toast-progress\">\n                <div class=\"toast-progress-bar\" style=\"animation: progress ").concat(duration, "ms linear;\"></div>\n            </div>\n        ");
    window.toastTimeout = setTimeout(function () {
      toast.classList.remove('show');
    }, duration);
  }

  function getToastIcon(type) {
    var icons = {
      success: 'fa-circle-check',
      error: 'fa-circle-exclamation',
      warning: 'fa-triangle-exclamation',
      info: 'fa-circle-info'
    };
    return icons[type] || icons.info;
  } // ========== SCREEN NAVIGATION (Internal) ==========


  function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(function (screen) {
      screen.style.display = 'none';
      screen.classList.remove('active');
    });
    var targetScreen = document.getElementById(screenId);

    if (targetScreen) {
      targetScreen.style.display = 'block';
      targetScreen.classList.add('active');
    }
  } // ========== THEME TOGGLE ==========


  function toggleTheme() {
    document.body.classList.toggle('dark');
    var isDark = document.body.classList.contains('dark');
    updateThemeIcon(isDark);
    localStorage.setItem('darkMode', isDark);
  } // ========== UTILITY FUNCTIONS ==========


  function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe.toString().replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  }

  function formatPrice(price) {
    if (!price) return 'Price on request';
    var numPrice = parseFloat(price);
    if (isNaN(numPrice)) return price;
    return numPrice.toLocaleString('en-US') + ' EGP';
  }

  function formatCondition(condition) {
    if (!condition) return 'Not specified';
    var conditions = {
      'excellent': 'Excellent',
      'very_good': 'Very Good',
      'good': 'Good',
      'fair': 'Fair',
      'needs_maintenance': 'Needs Maintenance'
    };
    return conditions[condition] || condition.replace(/_/g, ' ').replace(/\b\w/g, function (l) {
      return l.toUpperCase();
    });
  }

  function truncateText(text) {
    var maxLength = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 100;
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  }

  function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(function (word) {
      return word[0];
    }).join('').toUpperCase().substring(0, 2);
  }

  function debounce(func, wait) {
    var timeout;
    return function () {
      var _this = this;

      for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
        args[_key] = arguments[_key];
      }

      clearTimeout(timeout);
      timeout = setTimeout(function () {
        return func.apply(_this, args);
      }, wait);
    };
  } // ========== PUBLIC API ==========


  return {
    init: init,
    showScreen: showScreen,
    showToast: showToast,
    toggleTheme: toggleTheme,
    escapeHtml: escapeHtml,
    formatPrice: formatPrice,
    formatCondition: formatCondition,
    truncateText: truncateText,
    getInitials: getInitials,
    debounce: debounce
  };
}(); // Initialize on DOM ready


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    return App.init();
  });
} else {
  App.init();
} // Make App globally available


window.App = App;
window.showToast = App.showToast;
window.showScreen = App.showScreen;
window.escapeHtml = App.escapeHtml;
window.formatPrice = App.formatPrice;
window.formatCondition = App.formatCondition;
window.truncateText = App.truncateText;
window.getInitials = App.getInitials;
//# sourceMappingURL=main.dev.js.map
