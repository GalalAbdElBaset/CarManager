"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

// ==================== THEME MANAGER (UNIFIED) ====================
// This file handles theme switching across ALL pages and modules
// Include this file AFTER main.js in all HTML files
var ThemeManager = function () {
  // ==================== CONSTANTS ====================
  var STORAGE_KEY = 'darkMode';
  var THEMES = {
    LIGHT: 'light',
    DARK: 'dark'
  }; // ==================== PRIVATE STATE ====================

  var currentTheme = THEMES.LIGHT;
  var isInitialized = false; // ==================== CORE FUNCTIONS ====================

  /**
   * Initialize theme manager
   * Loads saved preference or system preference
   */

  function init() {
    if (isInitialized) return; // Load saved theme or use system preference

    var savedTheme = localStorage.getItem(STORAGE_KEY);
    var systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'true') {
      setTheme(THEMES.DARK);
    } else if (savedTheme === 'false') {
      setTheme(THEMES.LIGHT);
    } else if (systemPrefersDark) {
      setTheme(THEMES.DARK);
    } else {
      setTheme(THEMES.LIGHT);
    } // Listen for system theme changes (only if user hasn't set preference)


    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
      if (localStorage.getItem(STORAGE_KEY) === null) {
        setTheme(e.matches ? THEMES.DARK : THEMES.LIGHT);
      }
    }); // Bind all theme toggle buttons

    bindThemeButtons();
    isInitialized = true;
    console.log('🎨 Theme Manager initialized - Current theme:', currentTheme);
  }
  /**
   * Set theme and update all UI elements
   */


  function setTheme(theme) {
    currentTheme = theme; // Update body class

    if (theme === THEMES.DARK) {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    } // Update all theme toggle buttons


    updateAllThemeButtons(); // Save to localStorage

    localStorage.setItem(STORAGE_KEY, theme === THEMES.DARK ? 'true' : 'false'); // Dispatch custom event for other modules to listen

    window.dispatchEvent(new CustomEvent('themeChanged', {
      detail: {
        theme: currentTheme,
        isDark: theme === THEMES.DARK
      }
    }));
  }
  /**
   * Toggle between light and dark themes
   */


  function toggleTheme() {
    var newTheme = currentTheme === THEMES.LIGHT ? THEMES.DARK : THEMES.LIGHT;
    setTheme(newTheme);
  }
  /**
   * Update ALL theme toggle buttons on the page
   * This includes:
   * - #theme-toggle (desktop floating button)
   * - #theme-toggle-desktop (sidebar button)
   * - Any element with class .Mood or .Mood-sidebar
   * - Any element with data-action="theme"
   */


  function updateAllThemeButtons() {
    var isDark = currentTheme === THEMES.DARK;
    var iconName = isDark ? 'fa-moon' : 'fa-sun';
    var buttonText = isDark ? ' Dark' : ' Light'; // Update #theme-toggle (desktop floating button)

    var desktopToggle = document.getElementById('theme-toggle');

    if (desktopToggle) {
      var icon = desktopToggle.querySelector('i');

      if (icon) {
        icon.className = "fa-solid ".concat(iconName);
      }
    } // Update #theme-toggle-desktop (sidebar button)


    var sidebarToggle = document.getElementById('theme-toggle-desktop');

    if (sidebarToggle) {
      var _icon = sidebarToggle.querySelector('i');

      if (_icon) {
        _icon.className = "fa-solid ".concat(iconName);
      } // Update text content (keep the icon and text)


      var textNode = Array.from(sidebarToggle.childNodes).find(function (node) {
        return node.nodeType === Node.TEXT_NODE && node.textContent.trim();
      });

      if (textNode) {
        textNode.textContent = buttonText;
      } else {
        var span = sidebarToggle.querySelector('span');
        if (span) span.textContent = buttonText;
      }
    } // Update any element with class .Mood (without ID)


    document.querySelectorAll('.Mood:not(#theme-toggle)').forEach(function (btn) {
      var icon = btn.querySelector('i');

      if (icon) {
        icon.className = "fa-solid ".concat(iconName);
      }
    }); // Update any element with class .Mood-sidebar

    document.querySelectorAll('.Mood-sidebar:not(#theme-toggle-desktop)').forEach(function (btn) {
      var icon = btn.querySelector('i');

      if (icon) {
        icon.className = "fa-solid ".concat(iconName);
      }
    }); // Update any element with data-action="theme"

    document.querySelectorAll('[data-action="theme"]').forEach(function (btn) {
      var icon = btn.querySelector('i');

      if (icon && btn.id !== 'theme-toggle-desktop') {
        icon.className = "fa-solid ".concat(iconName);
      }
    });
  }
  /**
   * Bind click events to all theme toggle buttons
   */


  function bindThemeButtons() {
    // Remove existing listeners to avoid duplicates
    var allThemeButtons = [document.getElementById('theme-toggle'), document.getElementById('theme-toggle-desktop')].concat(_toConsumableArray(document.querySelectorAll('.Mood')), _toConsumableArray(document.querySelectorAll('.Mood-sidebar')), _toConsumableArray(document.querySelectorAll('[data-action="theme"]'))).filter(Boolean); // Use a Set to remove duplicates

    var uniqueButtons = _toConsumableArray(new Set(allThemeButtons));

    uniqueButtons.forEach(function (btn) {
      // Remove old listener
      btn.removeEventListener('click', toggleTheme); // Add new listener

      btn.addEventListener('click', toggleTheme);
    });
  }
  /**
   * Get current theme
   */


  function getCurrentTheme() {
    return currentTheme;
  }
  /**
   * Check if dark mode is active
   */


  function isDarkMode() {
    return currentTheme === THEMES.DARK;
  } // ==================== PUBLIC API ====================


  return {
    init: init,
    setTheme: setTheme,
    toggleTheme: toggleTheme,
    getCurrentTheme: getCurrentTheme,
    isDarkMode: isDarkMode,
    THEMES: THEMES
  };
}(); // ==================== AUTO-INITIALIZATION ====================
// Initialize when DOM is ready


if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    return ThemeManager.init();
  });
} else {
  ThemeManager.init();
} // ==================== GLOBAL EXPORTS ====================
// Make available globally


window.ThemeManager = ThemeManager;
window.toggleTheme = ThemeManager.toggleTheme;
window.getCurrentTheme = ThemeManager.getCurrentTheme;
window.isDarkMode = ThemeManager.isDarkMode;
//# sourceMappingURL=theme.dev.js.map
