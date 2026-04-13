"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Clients Module - ULTIMATE PRODUCTION GRADE V7 (FULLY FIXED)
 * Features: Fixed table header, XSS protection, Memory safe, Virtual scrolling ready, Loading skeleton
 */
// ==================== CONFIGURATION ====================
var CLIENTS_CONFIG = {
  VIEW: {
    DESKTOP_BREAKPOINT: 1024,
    MOBILE_BREAKPOINT: 768
  },
  VALIDATION: {
    MIN_NAME_LENGTH: 2,
    MAX_NAME_LENGTH: 100,
    MAX_NOTES_LENGTH: 500,
    PHONE_MIN_DIGITS: 8,
    PHONE_MAX_DIGITS: 15
  },
  ANIMATION: {
    DURATION: 300,
    EXPAND_DELAY: 50
  },
  REQUEST: {
    LOCK_TIMEOUT: 5000,
    MAX_NAVIGATION_STACK: 20,
    MAX_RETRY_COUNT: 3
  },
  WHATSAPP: {
    DEFAULT_MESSAGE: 'Hello 👋',
    DEFAULT_COUNTRY_CODE: '20'
  },
  PERFORMANCE: {
    VIRTUALIZATION_THRESHOLD: 200,
    DEBOUNCE_DELAY: 250,
    SKELETON_COUNT: 5
  },
  DISPLAY: {
    INITIAL_COUNT: 5,
    LOAD_STEP: 5,
    MAX_PER_PAGE: 100
  }
}; // ==================== DEPENDENCY INJECTION ====================

var API_INSTANCE = null;

function setAPI(api) {
  API_INSTANCE = api;
}

function getAPI() {
  if (!API_INSTANCE && window.API) {
    API_INSTANCE = window.API;
  }

  return API_INSTANCE;
} // ==================== DEBOUNCE UTILITY ====================


function debounce(func, delay) {
  var timeout;
  return function executedFunction() {
    var context = this;
    var args = arguments;

    var later = function later() {
      timeout = null;
      func.apply(context, args);
    };

    clearTimeout(timeout);
    timeout = setTimeout(later, delay);
  };
} // ==================== LOGGER ====================


var Logger = {
  prefix: '[Clients]',
  log: function log() {
    var args = Array.from(arguments);
    args.unshift(this.prefix);
    console.log.apply(console, args);
  },
  info: function info() {
    var args = Array.from(arguments);
    args.unshift(this.prefix + ' ℹ️');
    console.info.apply(console, args);
  },
  warn: function warn() {
    var args = Array.from(arguments);
    args.unshift(this.prefix + ' ⚠️');
    console.warn.apply(console, args);
  },
  error: function error() {
    var args = Array.from(arguments);
    args.unshift(this.prefix + ' ❌');
    console.error.apply(console, args);
  }
}; // ==================== STATE MANAGEMENT (with cleanup) ====================

var createStore = function createStore(initialState) {
  var state = initialState || {};
  var listeners = [];

  function getState() {
    return state;
  }

  function setState(newState) {
    var oldState = _objectSpread({}, state);

    state = _objectSpread({}, state, {}, newState);
    listeners.forEach(function (listener) {
      try {
        listener(state, oldState);
      } catch (e) {
        Logger.error('Store listener error:', e);
      }
    });
  }

  function subscribe(listener) {
    listeners.push(listener);
    return function unsubscribe() {
      var index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    };
  }

  function destroy() {
    listeners = [];
  }

  return {
    getState: getState,
    setState: setState,
    subscribe: subscribe,
    destroy: destroy
  };
}; // ==================== UTILITIES ====================


var ClientUtils = {
  escapeHtml: function escapeHtml(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  },
  // ✅ Stronger sanitization for dataset attributes
  sanitizeForAttribute: function sanitizeForAttribute(str) {
    if (!str) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\\/g, '&#92;');
  },
  encodeEmail: function encodeEmail(email) {
    if (!email) return '';
    return encodeURIComponent(email);
  },
  formatDate: function formatDate(dateString) {
    if (!dateString) return 'No date';

    try {
      var date = new Date(dateString);
      if (isNaN(date.getTime())) throw new Error();
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return 'Invalid date';
    }
  },
  getAvatarColor: function getAvatarColor(name) {
    var colors = ['#4361ee', '#4895ef', '#3f37c9', '#4cc9f0', '#06d6a0', '#ffb703', '#e63946', '#f72585', '#7209b7', '#560bad'];
    var hash = 0;

    for (var i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i);
      hash = hash | 0;
    }

    return colors[Math.abs(hash) % colors.length];
  },
  getInitials: function getInitials(name) {
    if (!name) return '?';
    return name.split(' ').map(function (n) {
      return n[0];
    }).join('').toUpperCase().slice(0, 2);
  },
  cleanPhoneNumber: function cleanPhoneNumber(phone) {
    if (!phone) return '';
    return phone.replace(/\s/g, '');
  },
  formatPhoneForWhatsApp: function formatPhoneForWhatsApp(phone) {
    if (!phone) return '';
    var digitsOnly = phone.replace(/[^\d]/g, '');

    if (digitsOnly.startsWith('0')) {
      digitsOnly = digitsOnly.substring(1);
    }

    if (!digitsOnly.startsWith(CLIENTS_CONFIG.WHATSAPP.DEFAULT_COUNTRY_CODE)) {
      digitsOnly = CLIENTS_CONFIG.WHATSAPP.DEFAULT_COUNTRY_CODE + digitsOnly;
    }

    return digitsOnly;
  },
  getWhatsAppUrl: function getWhatsAppUrl(phone) {
    var cleanPhone = this.formatPhoneForWhatsApp(phone);
    var message = CLIENTS_CONFIG.WHATSAPP.DEFAULT_MESSAGE;
    return 'https://wa.me/' + cleanPhone + '?text=' + encodeURIComponent(message);
  },
  extractPhoneParts: function extractPhoneParts(phone) {
    if (!phone) return {
      code: '+20',
      number: ''
    };
    var match = phone.match(/^\s*(\+\d+)?\s*(.*)$/);

    if (match) {
      return {
        code: match[1] || '+20',
        number: (match[2] || '').trim()
      };
    }

    return {
      code: '+20',
      number: phone
    };
  },
  validateName: function validateName(name) {
    if (!name || !name.trim()) {
      return {
        valid: false,
        message: 'Client name is required'
      };
    }

    if (name.length < CLIENTS_CONFIG.VALIDATION.MIN_NAME_LENGTH) {
      return {
        valid: false,
        message: 'Name must be at least ' + CLIENTS_CONFIG.VALIDATION.MIN_NAME_LENGTH + ' characters'
      };
    }

    if (name.length > CLIENTS_CONFIG.VALIDATION.MAX_NAME_LENGTH) {
      return {
        valid: false,
        message: 'Name must not exceed ' + CLIENTS_CONFIG.VALIDATION.MAX_NAME_LENGTH + ' characters'
      };
    }

    return {
      valid: true
    };
  },
  validateEmail: function validateEmail(email) {
    if (!email || !email.trim()) return {
      valid: true
    };
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    if (!emailRegex.test(email)) {
      return {
        valid: false,
        message: 'Please enter a valid email address'
      };
    }

    return {
      valid: true
    };
  },
  validatePhone: function validatePhone(phoneNumber) {
    if (!phoneNumber || !phoneNumber.trim()) return {
      valid: true
    };
    var digitsOnly = phoneNumber.replace(/\D/g, '');

    if (digitsOnly.length === 0) {
      return {
        valid: false,
        message: 'Phone number must contain at least one digit'
      };
    }

    if (digitsOnly.length < CLIENTS_CONFIG.VALIDATION.PHONE_MIN_DIGITS || digitsOnly.length > CLIENTS_CONFIG.VALIDATION.PHONE_MAX_DIGITS) {
      return {
        valid: false,
        message: 'Phone number must be between ' + CLIENTS_CONFIG.VALIDATION.PHONE_MIN_DIGITS + ' and ' + CLIENTS_CONFIG.VALIDATION.PHONE_MAX_DIGITS + ' digits'
      };
    }

    return {
      valid: true
    };
  },
  validateNotes: function validateNotes(notes) {
    if (notes && notes.length > CLIENTS_CONFIG.VALIDATION.MAX_NOTES_LENGTH) {
      return {
        valid: false,
        message: 'Notes must not exceed ' + CLIENTS_CONFIG.VALIDATION.MAX_NOTES_LENGTH + ' characters'
      };
    }

    return {
      valid: true
    };
  }
}; // ==================== REQUEST LOCK MANAGER ====================

var RequestLockManager = function () {
  var currentRequests = {};
  var pendingRequests = new Map();

  function generateId() {
    return Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  function safeApiCall(fn, context) {
    var requestId, result;
    return regeneratorRuntime.async(function safeApiCall$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            requestId = generateId();
            currentRequests[context] = requestId;
            pendingRequests.set(requestId, true);
            _context.prev = 3;
            _context.next = 6;
            return regeneratorRuntime.awrap(fn());

          case 6:
            result = _context.sent;

            if (!(currentRequests[context] !== requestId)) {
              _context.next = 10;
              break;
            }

            Logger.warn('Request cancelled - newer request exists:', context);
            return _context.abrupt("return", null);

          case 10:
            return _context.abrupt("return", result);

          case 13:
            _context.prev = 13;
            _context.t0 = _context["catch"](3);

            if (!(currentRequests[context] !== requestId)) {
              _context.next = 18;
              break;
            }

            Logger.warn('Request error ignored - newer request exists:', context);
            return _context.abrupt("return", null);

          case 18:
            throw _context.t0;

          case 19:
            _context.prev = 19;
            pendingRequests["delete"](requestId);
            return _context.finish(19);

          case 22:
          case "end":
            return _context.stop();
        }
      }
    }, null, null, [[3, 13, 19, 22]]);
  }

  function cancelAllPending() {
    currentRequests = {};
    pendingRequests.clear();
    Logger.log('All pending requests cancelled');
  }

  return {
    safeApiCall: safeApiCall,
    cancelAllPending: cancelAllPending
  };
}(); // ==================== CUSTOM CONFIRM MODAL ====================


var CustomConfirm = {
  show: function show(message, onConfirm, onCancel) {
    if (window.App && window.App.confirm) {
      window.App.confirm(message, onConfirm, onCancel);
    } else {
      if (confirm(message)) {
        if (onConfirm) onConfirm();
      } else {
        if (onCancel) onCancel();
      }
    }
  }
}; // ==================== CACHED DOM ELEMENTS ====================

var CachedElements = {
  elements: {},
  get: function get(id) {
    if (this.elements[id] && document.body.contains(this.elements[id])) {
      return this.elements[id];
    }

    this.elements[id] = document.getElementById(id);
    return this.elements[id];
  },
  clear: function clear() {
    this.elements = {};
  }
}; // ==================== LOADING SKELETON ====================

var LoadingSkeleton = {
  renderDesktopSkeleton: function renderDesktopSkeleton() {
    var rows = [];
    rows.push('<div class="data-table-container"><table class="data-table clients-table"><thead>');
    rows.push('<tr><th>Client</th><th>Phone</th><th>Email</th><th>Registered</th><th>Actions</th></tr>');
    rows.push('</thead><tbody>');

    for (var i = 0; i < CLIENTS_CONFIG.PERFORMANCE.SKELETON_COUNT; i++) {
      rows.push('<tr class="skeleton-row">');
      rows.push('<td><div class="skeleton-text"></div></td>');
      rows.push('<td><div class="skeleton-text"></div></td>');
      rows.push('<td><div class="skeleton-text"></div></td>');
      rows.push('<td><div class="skeleton-text"></div></td>');
      rows.push('<td><div class="skeleton-buttons"><div class="skeleton-btn"></div><div class="skeleton-btn"></div><div class="skeleton-btn"></div></div></td>');
      rows.push('</tr>');
    }

    rows.push('</tbody></table></div>');
    return rows.join('');
  },
  renderMobileSkeleton: function renderMobileSkeleton() {
    var rows = [];
    rows.push('<div class="clients-compact-grid">');

    for (var i = 0; i < CLIENTS_CONFIG.PERFORMANCE.SKELETON_COUNT; i++) {
      rows.push('<div class="compact-card skeleton-card">');
      rows.push('<div class="card-header">');
      rows.push('<div class="card-left">');
      rows.push('<div class="card-avatar skeleton-avatar"></div>');
      rows.push('<div class="card-info">');
      rows.push('<h4 class="card-name skeleton-text"></h4>');
      rows.push('<div class="card-date skeleton-text"></div>');
      rows.push('</div></div>');
      rows.push('</div>');
      rows.push('</div>');
    }

    rows.push('</div>');
    return rows.join('');
  }
}; // ==================== DOM RENDERER (FIXED - Buttons in Header) ====================

var DOMRenderer =
/*#__PURE__*/
function () {
  function DOMRenderer(container, displayCount) {
    _classCallCheck(this, DOMRenderer);

    this.container = container;
    this.displayCount = displayCount || CLIENTS_CONFIG.DISPLAY.INITIAL_COUNT;
    this.allClients = [];
    this.pendingUpdate = false;
    this.isLoading = false;
  }

  _createClass(DOMRenderer, [{
    key: "setDisplayCount",
    value: function setDisplayCount(count) {
      this.displayCount = count;
    }
  }, {
    key: "getAllClients",
    value: function getAllClients() {
      return this.allClients;
    }
  }, {
    key: "setAllClients",
    value: function setAllClients(clients) {
      this.allClients = clients;
    }
  }, {
    key: "escapeHtml",
    value: function escapeHtml(str) {
      return ClientUtils.escapeHtml(str);
    }
  }, {
    key: "sanitizeForAttribute",
    value: function sanitizeForAttribute(str) {
      return ClientUtils.sanitizeForAttribute(str);
    }
  }, {
    key: "encodeEmail",
    value: function encodeEmail(email) {
      return ClientUtils.encodeEmail(email);
    }
  }, {
    key: "formatDate",
    value: function formatDate(dateString) {
      return ClientUtils.formatDate(dateString);
    }
  }, {
    key: "getAvatarColor",
    value: function getAvatarColor(name) {
      return ClientUtils.getAvatarColor(name);
    }
  }, {
    key: "getInitials",
    value: function getInitials(name) {
      return ClientUtils.getInitials(name);
    }
  }, {
    key: "safeId",
    value: function safeId(id) {
      return this.escapeHtml(String(id));
    }
  }, {
    key: "getDisplayedClients",
    value: function getDisplayedClients() {
      return this.allClients.slice(0, this.displayCount);
    }
  }, {
    key: "hasMore",
    value: function hasMore() {
      return this.allClients.length > this.displayCount;
    }
  }, {
    key: "isShowingAll",
    value: function isShowingAll() {
      return this.displayCount >= this.allClients.length;
    }
  }, {
    key: "getRemainingCount",
    value: function getRemainingCount() {
      return this.allClients.length - this.displayCount;
    }
  }, {
    key: "scheduleRender",
    value: function scheduleRender(renderFn) {
      if (this.pendingUpdate) return;
      this.pendingUpdate = true;
      requestAnimationFrame(function () {
        renderFn();
        this.pendingUpdate = false;
      }.bind(this));
    } // ✅ Desktop table with fixed header (corrected)

  }, {
    key: "renderDesktopTable",
    value: function renderDesktopTable(clients) {
      try {
        if (!clients || clients.length === 0) {
          return '<div class="empty-state" role="status" aria-live="polite"><i class="fa-solid fa-users-slash"></i><h3>No clients found</h3><p>Add your first client to get started</p><button type="button" class="btn btn-primary" data-action="add" aria-label="Add new client"><i class="fa-solid fa-plus"></i> Add Client</button></div>';
        }

        var rows = [];
        rows.push('<div class="data-table-container"><table class="data-table clients-table" role="table" aria-label="Clients list"><thead>'); // ✅ Fixed: proper row opening

        rows.push('<tr>');
        rows.push('<th scope="col">Client</th>');
        rows.push('<th scope="col">Phone</th>');
        rows.push('<th scope="col">Email</th>');
        rows.push('<th scope="col">Registered</th>');
        rows.push('<th scope="col" style="text-align: right;">'); // ✅ Buttons in header (right side)

        if (this.isShowingAll()) {
          rows.push('<button type="button" class="btn btn-sm btn-secondary view-less-header-btn" data-action="view-less" aria-label="Show less clients" style="margin-left: auto; display: inline-flex; align-items: center; gap: 6px;">');
          rows.push('<i class="fa-solid fa-arrow-up"></i> View Less');
          rows.push('</button>');
        } else {
          var remaining = this.getRemainingCount();
          var step = CLIENTS_CONFIG.DISPLAY.LOAD_STEP;
          var nextCount = Math.min(step, remaining);
          rows.push('<button type="button" class="btn btn-sm btn-primary load-more-header-btn" data-action="load-more" aria-label="Load more clients" style="margin-left: auto; display: inline-flex; align-items: center; gap: 6px;">');
          rows.push('<i class="fa-solid fa-arrow-down"></i> Load More (' + nextCount + ')');
          rows.push('</button>');
          rows.push('<button type="button" class="btn btn-sm btn-secondary view-all-header-btn" data-action="view-all" aria-label="View all clients" style="margin-left: 8px; display: inline-flex; align-items: center; gap: 6px;">');
          rows.push('<i class="fa-solid fa-list"></i> View All (' + this.allClients.length + ')');
          rows.push('</button>');
        }

        rows.push('</th>');
        rows.push('</tr>');
        rows.push('</thead><tbody>');

        for (var i = 0; i < clients.length; i++) {
          var client = clients[i];
          var safeClientId = this.safeId(client.id); // ✅ Stronger sanitization for dataset

          var safePhone = client.phone ? this.sanitizeForAttribute(client.phone) : '';
          rows.push('<tr data-client-id="' + safeClientId + '">');
          rows.push('<td><strong>' + this.escapeHtml(client.name) + '</strong></td>');
          rows.push('<td>' + (client.phone ? this.escapeHtml(client.phone) : 'No phone') + '</td>');
          rows.push('<td>' + (client.email ? this.escapeHtml(client.email) : 'No email') + '</td>');
          rows.push('<td><small>' + this.formatDate(client.registeredat) + '</small></td>');
          rows.push('<td><div class="action-buttons" style="justify-content: flex-end;">');
          rows.push('<button class="action-btn call" data-action="call" data-phone="' + safePhone + '" title="Call" aria-label="Call client"><i class="fa-solid fa-phone"></i></button>');
          rows.push('<button class="action-btn whatsapp" data-action="whatsapp" data-phone="' + safePhone + '" title="WhatsApp" aria-label="Send WhatsApp message"><i class="fa-brands fa-whatsapp"></i></button>');
          rows.push('<button class="action-btn view" data-action="view" data-id="' + safeClientId + '" title="View" aria-label="View client details"><i class="fa-solid fa-eye"></i></button>');
          rows.push('<button class="action-btn edit" data-action="edit" data-id="' + safeClientId + '" title="Edit" aria-label="Edit client"><i class="fa-solid fa-pen"></i></button>');
          rows.push('<button class="action-btn delete" data-action="delete" data-id="' + safeClientId + '" title="Delete" aria-label="Delete client"><i class="fa-solid fa-trash"></i></button>');
          rows.push('</div>');
          rows.push('</td>');
          rows.push('</tr>');
        }

        rows.push('</tbody>');
        rows.push('</table></div>');
        return rows.join('');
      } catch (error) {
        Logger.error('Error rendering desktop table:', error);
        return '<div class="empty-state error-boundary" role="alert" aria-live="assertive"><i class="fa-solid fa-circle-exclamation"></i><h3>Error rendering clients</h3><p>Please try again</p><button type="button" class="btn btn-primary" data-action="retry" aria-label="Try again"><i class="fa-solid fa-rotate-right"></i> Retry</button></div>';
      }
    } // ✅ Mobile cards with buttons in header

  }, {
    key: "renderMobileCards",
    value: function renderMobileCards(clients, expandedId) {
      try {
        if (!clients || clients.length === 0) {
          return '<div class="empty-state" role="status" aria-live="polite"><i class="fa-solid fa-users-slash"></i><h3>No clients found</h3><p>Add your first client to get started</p><button type="button" class="btn btn-primary" data-action="add" aria-label="Add new client"><i class="fa-solid fa-plus"></i> Add Client</button></div>';
        }

        var rows = []; // ✅ Mobile header with buttons

        rows.push('<div class="mobile-controls-header" style="display: flex; justify-content: flex-end; padding: 12px 16px; background: var(--surface); border-bottom: 1px solid var(--border); margin-bottom: 8px;">');

        if (this.isShowingAll()) {
          rows.push('<button type="button" class="btn btn-sm btn-secondary view-less-mobile-btn" data-action="view-less" aria-label="Show less clients" style="display: inline-flex; align-items: center; gap: 6px;">');
          rows.push('<i class="fa-solid fa-arrow-up"></i> View Less');
          rows.push('</button>');
        } else {
          var remaining = this.getRemainingCount();
          var step = CLIENTS_CONFIG.DISPLAY.LOAD_STEP;
          var nextCount = Math.min(step, remaining);
          rows.push('<button type="button" class="btn btn-sm btn-primary load-more-mobile-btn" data-action="load-more" aria-label="Load more clients" style="display: inline-flex; align-items: center; gap: 6px;">');
          rows.push('<i class="fa-solid fa-arrow-down"></i> Load More (' + nextCount + ')');
          rows.push('</button>');
          rows.push('<button type="button" class="btn btn-sm btn-secondary view-all-mobile-btn" data-action="view-all" aria-label="View all clients" style="margin-left: 8px; display: inline-flex; align-items: center; gap: 6px;">');
          rows.push('<i class="fa-solid fa-list"></i> View All (' + this.allClients.length + ')');
          rows.push('</button>');
        }

        rows.push('</div>');
        rows.push('<div class="clients-compact-grid" role="list" aria-label="Clients list">');

        for (var i = 0; i < clients.length; i++) {
          var client = clients[i];
          var isExpanded = expandedId === String(client.id);
          var expandedClass = isExpanded ? 'expanded' : '';
          var safeClientId = this.safeId(client.id);
          var safePhone = client.phone ? this.sanitizeForAttribute(client.phone) : '';
          rows.push('<div class="compact-card ' + expandedClass + '" data-client-id="' + safeClientId + '" role="listitem">');
          rows.push('<div class="card-header" data-action="toggle" role="button" tabindex="0" aria-label="Toggle details for ' + this.escapeHtml(client.name) + '" aria-expanded="' + isExpanded + '">');
          rows.push('<div class="card-left">');
          rows.push('<div class="card-avatar" style="background: ' + this.getAvatarColor(client.name) + ';" aria-hidden="true">' + this.getInitials(client.name) + '</div>');
          rows.push('<div class="card-info">');
          rows.push('<h4 class="card-name">' + this.escapeHtml(client.name) + '</h4>');
          rows.push('<div class="card-date">' + (client.phone ? this.escapeHtml(client.phone) : 'No phone') + '</div>');
          rows.push('</div></div>');
          rows.push('<div class="chevron-icon ' + (isExpanded ? 'rotated' : '') + '" aria-hidden="true"><i class="fa-solid fa-chevron-down"></i></div>');
          rows.push('</div>');
          rows.push('<div class="card-actions-horizontal">');
          rows.push('<button class="btn-action btn-call" data-action="call" data-phone="' + safePhone + '" title="Call" aria-label="Call client"><i class="fa-solid fa-phone"></i><span>Call</span></button>');
          rows.push('<button class="btn-action btn-whatsapp" data-action="whatsapp" data-phone="' + safePhone + '" title="WhatsApp" aria-label="Send WhatsApp message"><i class="fa-brands fa-whatsapp"></i><span>WhatsApp</span></button>');
          rows.push('<button class="btn-action btn-edit" data-action="edit" data-id="' + safeClientId + '" title="Edit" aria-label="Edit client"><i class="fa-solid fa-pen"></i><span>Edit</span></button>');
          rows.push('<button class="btn-action btn-delete" data-action="delete" data-id="' + safeClientId + '" title="Delete" aria-label="Delete client"><i class="fa-solid fa-trash"></i><span>Delete</span></button>');
          rows.push('<button class="btn-action btn-view" data-action="view" data-id="' + safeClientId + '" title="View" aria-label="View client details"><i class="fa-solid fa-eye"></i><span>View</span></button>');
          rows.push('</div>');
          rows.push('<div class="card-expandable" data-expandable="true">');
          rows.push('<div class="expandable-content"><div class="info-section">');

          if (client.email) {
            rows.push('<div class="info-row"><div class="info-label"><i class="fa-solid fa-envelope"></i><span>Email</span></div><div class="info-value">' + this.escapeHtml(client.email) + '</div></div>');
          }

          if (client.phone) {
            rows.push('<div class="info-row"><div class="info-label"><i class="fa-solid fa-phone"></i><span>Phone</span></div><div class="info-value">' + this.escapeHtml(client.phone) + '</div></div>');
          }

          rows.push('<div class="info-row"><div class="info-label"><i class="fa-solid fa-clock"></i><span>Registered</span></div><div class="info-value">' + this.formatDate(client.registeredat) + '</div></div>');

          if (client.notes) {
            rows.push('<div class="info-row"><div class="info-label"><i class="fa-solid fa-note-sticky"></i><span>Notes</span></div><div class="info-value">' + this.escapeHtml(client.notes) + '</div></div>');
          }

          rows.push('</div></div></div></div>');
        }

        rows.push('</div>');
        return rows.join('');
      } catch (error) {
        Logger.error('Error rendering mobile cards:', error);
        return '<div class="empty-state error-boundary" role="alert" aria-live="assertive"><i class="fa-solid fa-circle-exclamation"></i><h3>Error rendering clients</h3><p>Please try again</p><button type="button" class="btn btn-primary" data-action="retry" aria-label="Try again"><i class="fa-solid fa-rotate-right"></i> Retry</button></div>';
      }
    }
  }, {
    key: "renderClientDetails",
    value: function renderClientDetails(client) {
      try {
        var initials = this.getInitials(client.name);
        var avatarColor = this.getAvatarColor(client.name);
        var isDesktop = window.innerWidth >= CLIENTS_CONFIG.VIEW.DESKTOP_BREAKPOINT;
        var containerClass = isDesktop ? 'client-profile desktop-profile' : 'client-profile';
        var safeClientId = this.safeId(client.id);
        var safePhone = client.phone ? this.sanitizeForAttribute(client.phone) : '';
        var rows = [];
        rows.push('<div class="' + containerClass + '" role="region" aria-label="Client profile">');
        rows.push('<div class="profile-header">');
        rows.push('<div class="profile-avatar" style="background: ' + avatarColor + ';" aria-label="Avatar">' + this.escapeHtml(initials) + '</div>');
        rows.push('<div class="profile-title">');
        rows.push('<h2>' + this.escapeHtml(client.name) + '</h2>');
        rows.push('<span class="member-since">Client since ' + this.formatDate(client.registeredat) + '</span>');
        rows.push('</div></div>');
        rows.push('<div class="info-cards">');
        rows.push('<div class="info-card">');
        rows.push('<div class="info-icon"><i class="fa-solid fa-phone" aria-hidden="true"></i></div>');
        rows.push('<div class="info-content">');
        rows.push('<label>Phone</label>');
        rows.push('<div class="info-value">' + (client.phone ? this.escapeHtml(client.phone) : 'No phone') + '</div>');
        rows.push('<div class="info-actions">');
        rows.push('<button type="button" class="btn-sm btn-call" data-action="call" data-phone="' + safePhone + '" aria-label="Call client"><i class="fa-solid fa-phone"></i> Call</button>');
        rows.push('<button type="button" class="btn-sm btn-whatsapp" data-action="whatsapp" data-phone="' + safePhone + '" aria-label="Send WhatsApp message"><i class="fa-brands fa-whatsapp"></i> WhatsApp</button>');
        rows.push('</div></div></div>');
        rows.push('<div class="info-card">');
        rows.push('<div class="info-icon"><i class="fa-solid fa-envelope" aria-hidden="true"></i></div>');
        rows.push('<div class="info-content">');
        rows.push('<label>Email</label>');
        rows.push('<div class="info-value">' + (client.email ? this.escapeHtml(client.email) : 'No email') + '</div>');

        if (client.email) {
          rows.push('<a href="mailto:' + this.encodeEmail(client.email) + '" class="btn-sm" aria-label="Send email to client"><i class="fa-solid fa-envelope"></i> Send Email</a>');
        }

        rows.push('</div></div></div>');

        if (client.notes) {
          rows.push('<div class="notes-section">');
          rows.push('<div class="notes-header"><i class="fa-solid fa-note-sticky" aria-hidden="true"></i><h3>Notes</h3></div>');
          rows.push('<div class="notes-content">' + this.escapeHtml(client.notes).replace(/\n/g, '<br>') + '</div>');
          rows.push('</div>');
        }

        rows.push('<div class="quick-actions">');
        rows.push('<button type="button" class="btn btn-secondary" data-action="edit" data-id="' + safeClientId + '" aria-label="Edit client profile"><i class="fa-solid fa-pen"></i> Edit Profile</button>');
        rows.push('</div></div>');
        return rows.join('');
      } catch (error) {
        Logger.error('Error rendering client details:', error);
        return '<div class="empty-state error-boundary" role="alert" aria-live="assertive"><i class="fa-solid fa-circle-exclamation"></i><h3>Error loading client details</h3><p>Please try again</p><button type="button" class="btn btn-primary" data-action="retry" aria-label="Try again"><i class="fa-solid fa-rotate-right"></i> Retry</button></div>';
      }
    }
  }, {
    key: "showLoading",
    value: function showLoading() {
      var isDesktop = window.innerWidth >= CLIENTS_CONFIG.VIEW.DESKTOP_BREAKPOINT;

      if (isDesktop) {
        this.container.innerHTML = LoadingSkeleton.renderDesktopSkeleton();
      } else {
        this.container.innerHTML = LoadingSkeleton.renderMobileSkeleton();
      }
    }
  }, {
    key: "showError",
    value: function showError(message, retryCount) {
      retryCount = retryCount || 0;
      this.container.innerHTML = '<div class="empty-state error-boundary" role="alert" aria-live="assertive" data-retry-count="' + retryCount + '"><i class="fa-solid fa-triangle-exclamation"></i><h3>Error loading clients</h3><p>' + this.escapeHtml(message) + '</p><button type="button" class="btn btn-primary" data-action="retry" aria-label="Try again"><i class="fa-solid fa-rotate-right"></i> Try Again</button></div>';
    }
  }, {
    key: "updateStats",
    value: function updateStats(count) {
      var countElement = CachedElements.get('clients-count');

      if (countElement) {
        var displayedCount = Math.min(this.displayCount, this.allClients.length);
        var statsText = this.hasMore() && this.displayCount < this.allClients.length ? displayedCount + ' / ' + this.allClients.length + ' clients' : this.allClients.length + ' clients';
        countElement.innerHTML = '<span class="badge" style="background: var(--primary); color: white; padding: 0.2rem 0.6rem; border-radius: 20px;" aria-label="Total clients: ' + this.allClients.length + '">' + statsText + '</span>';
      }
    }
  }, {
    key: "updateClientsList",
    value: function updateClientsList(allClients, expandedId, displayCount) {
      var self = this;
      this.allClients = allClients;

      if (displayCount !== undefined) {
        this.displayCount = displayCount;
      }

      this.scheduleRender(function () {
        var isDesktop = window.innerWidth >= CLIENTS_CONFIG.VIEW.DESKTOP_BREAKPOINT;
        var displayedClients = self.getDisplayedClients();

        if (isDesktop) {
          self.container.innerHTML = self.renderDesktopTable(displayedClients);
        } else {
          self.container.innerHTML = self.renderMobileCards(displayedClients, expandedId);
        }

        self.updateStats(self.allClients.length);
      });
    }
  }]);

  return DOMRenderer;
}(); // ==================== MAIN MODULE ====================


var ClientsModule = function () {
  // Store instance
  var store = createStore({
    clients: [],
    isLoading: false,
    expandedCardId: null,
    currentClient: null,
    currentClientId: null,
    displayCount: CLIENTS_CONFIG.DISPLAY.INITIAL_COUNT
  }); // ✅ Navigation stack using Set to prevent duplicates

  var navigationSet = new Set(['list']);
  var navigationStack = ['list']; // DOM Elements

  var container = null;
  var renderer = null;
  var resizeTimeout = null;
  var isInitialized = false;
  var eventListenersAttached = false;
  var isProcessingAction = false;
  var retryCount = 0; // Screen Management

  var screens = {
    list: CachedElements.get('clients-list'),
    add: CachedElements.get('add-client'),
    details: CachedElements.get('client-details'),
    edit: CachedElements.get('edit-client')
  };

  function showScreen(screenId, addToStack) {
    addToStack = addToStack !== undefined ? addToStack : true;

    if (addToStack) {
      var currentScreen = getCurrentScreen();

      if (currentScreen && currentScreen !== screenId) {
        // ✅ Prevent duplicates using Set
        if (!navigationSet.has(currentScreen)) {
          navigationSet.add(currentScreen);
          navigationStack.push(currentScreen);

          if (navigationStack.length > CLIENTS_CONFIG.REQUEST.MAX_NAVIGATION_STACK) {
            var removed = navigationStack.shift();
            navigationSet["delete"](removed);
          }
        }
      }
    }

    for (var key in screens) {
      if (screens[key]) {
        screens[key].classList.remove('active');
        screens[key].style.display = 'none';
      }
    }

    var targetScreen = screens[screenId];

    if (targetScreen) {
      targetScreen.style.display = 'block';
      targetScreen.classList.add('active');
    }
  }

  function goBack() {
    if (navigationStack.length > 0) {
      var previousScreen = navigationStack.pop();
      navigationSet["delete"](previousScreen);
      showScreen(previousScreen, false);
    } else {
      showScreen('list', false);
    }
  }

  function goBackTo(screenId) {
    var newStack = [];
    var newSet = new Set();

    for (var i = 0; i < navigationStack.length; i++) {
      if (navigationStack[i] === screenId) {
        newStack.push(navigationStack[i]);
        newSet.add(navigationStack[i]);
      }
    }

    if (newStack.length === 0) {
      newStack = [screenId];
      newSet.add(screenId);
    }

    navigationStack = newStack;
    navigationSet = newSet;
    showScreen(screenId, false);
  }

  function getCurrentScreen() {
    for (var key in screens) {
      if (screens[key] && screens[key].classList.contains('active')) {
        return key;
      }
    }

    return 'list';
  } // Card Management


  function collapseExpandedCard() {
    var expandedCardId = store.getState().expandedCardId;
    if (!expandedCardId) return;
    var expandedCard = document.querySelector('.compact-card.expanded');

    if (expandedCard) {
      expandedCard.classList.remove('expanded');
      var chevron = expandedCard.querySelector('.chevron-icon');
      if (chevron) chevron.classList.remove('rotated');
    }

    store.setState({
      expandedCardId: null
    });
  }

  function toggleCard(card) {
    var clientId = card.dataset.clientId;
    var isExpanded = card.classList.contains('expanded');

    if (!isExpanded && store.getState().expandedCardId) {
      collapseExpandedCard();
    }

    card.classList.toggle('expanded');
    var chevron = card.querySelector('.chevron-icon');
    if (chevron) chevron.classList.toggle('rotated');
    store.setState({
      expandedCardId: isExpanded ? null : clientId
    });

    if (!isExpanded) {
      var expandable = card.querySelector('[data-expandable="true"]');

      if (expandable) {
        setTimeout(function () {
          expandable.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        }, 100);
      }
    }
  } // Load More / View All / View Less functionality


  function handleLoadMore() {
    var currentDisplayCount = store.getState().displayCount;
    var totalClients = store.getState().clients.length;
    var newDisplayCount = Math.min(currentDisplayCount + CLIENTS_CONFIG.DISPLAY.LOAD_STEP, totalClients);
    store.setState({
      displayCount: newDisplayCount
    });

    if (renderer) {
      renderer.updateClientsList(store.getState().clients, store.getState().expandedCardId, store.getState().displayCount);
    }

    Logger.log('Loaded more - Display count:', store.getState().displayCount);
  }

  function handleViewAll() {
    var totalClients = store.getState().clients.length;
    store.setState({
      displayCount: totalClients
    });

    if (renderer) {
      renderer.updateClientsList(store.getState().clients, store.getState().expandedCardId, store.getState().displayCount);
    }

    Logger.log('View all - Display count:', store.getState().displayCount);
  }

  function handleViewLess() {
    store.setState({
      displayCount: CLIENTS_CONFIG.DISPLAY.INITIAL_COUNT
    });

    if (renderer) {
      renderer.updateClientsList(store.getState().clients, store.getState().expandedCardId, store.getState().displayCount);
    }

    Logger.log('View less - Display count:', store.getState().displayCount);
  } // Global Loader Controls


  function showGlobalLoader(show) {
    var loader = CachedElements.get('crmLoader');

    if (loader) {
      if (show) {
        loader.style.display = 'flex';
        loader.classList.remove('fade-out');
      } else {
        loader.classList.add('fade-out');
        setTimeout(function () {
          if (loader) loader.style.display = 'none';
        }, 500);
      }
    }
  }

  function withActionGuard(fn) {
    return function _callee() {
      var _args2 = arguments;
      return regeneratorRuntime.async(function _callee$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              if (!isProcessingAction) {
                _context2.next = 3;
                break;
              }

              Logger.warn('Action already in progress, skipping...');
              return _context2.abrupt("return");

            case 3:
              isProcessingAction = true;
              _context2.prev = 4;
              _context2.next = 7;
              return regeneratorRuntime.awrap(fn.apply(this, _args2));

            case 7:
              return _context2.abrupt("return", _context2.sent);

            case 8:
              _context2.prev = 8;
              isProcessingAction = false;
              return _context2.finish(8);

            case 11:
            case "end":
              return _context2.stop();
          }
        }
      }, null, this, [[4,, 8, 11]]);
    };
  }

  function loadClients() {
    var API, clientsData, clients;
    return regeneratorRuntime.async(function loadClients$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            if (!(!container || !renderer || store.getState().isLoading)) {
              _context3.next = 2;
              break;
            }

            return _context3.abrupt("return");

          case 2:
            store.setState({
              isLoading: true
            });
            renderer.showLoading();
            API = getAPI();

            if (API) {
              _context3.next = 10;
              break;
            }

            Logger.error('API not available');
            renderer.showError('API service not available');
            store.setState({
              isLoading: false
            });
            return _context3.abrupt("return");

          case 10:
            _context3.prev = 10;
            _context3.next = 13;
            return regeneratorRuntime.awrap(RequestLockManager.safeApiCall(function () {
              return API.getClients();
            }, 'loadClients'));

          case 13:
            clientsData = _context3.sent;

            if (!(clientsData === null)) {
              _context3.next = 16;
              break;
            }

            return _context3.abrupt("return");

          case 16:
            clients = Array.isArray(clientsData) ? clientsData : [];
            clients.sort(function (a, b) {
              return new Date(b.registeredat || 0) - new Date(a.registeredat || 0);
            });
            store.setState({
              clients: clients
            });

            if (renderer) {
              renderer.updateClientsList(clients, store.getState().expandedCardId, store.getState().displayCount);
            }

            showGlobalLoader(false);
            retryCount = 0;
            _context3.next = 29;
            break;

          case 24:
            _context3.prev = 24;
            _context3.t0 = _context3["catch"](10);
            Logger.error('Error loading clients:', _context3.t0);
            retryCount++;

            if (retryCount < CLIENTS_CONFIG.REQUEST.MAX_RETRY_COUNT) {
              Logger.log('Retrying... Attempt ' + (retryCount + 1));
              setTimeout(function () {
                loadClients();
              }, 1000 * retryCount);
            } else {
              renderer.showError(_context3.t0.message || 'Failed to load clients', retryCount);

              if (window.App && window.App.showToast) {
                window.App.showToast('Failed to load clients', 'error');
              }
            }

          case 29:
            _context3.prev = 29;
            store.setState({
              isLoading: false
            });
            return _context3.finish(29);

          case 32:
          case "end":
            return _context3.stop();
        }
      }
    }, null, null, [[10, 24, 29, 32]]);
  } // ==================== ADD CLIENT ====================


  var addClientSubmit = withActionGuard(function _callee2(e) {
    var name, email, countryCode, phoneNumber, notes, nameValidation, emailValidation, phoneValidation, notesValidation, phone, submitBtn, originalText, API;
    return regeneratorRuntime.async(function _callee2$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            e.preventDefault();
            name = CachedElements.get('add-client-name').value.trim();
            email = CachedElements.get('add-client-email').value.trim();
            countryCode = CachedElements.get('country-code').value;
            phoneNumber = CachedElements.get('add-client-phone').value.trim();
            notes = CachedElements.get('add-client-notes').value.trim();
            nameValidation = ClientUtils.validateName(name);

            if (nameValidation.valid) {
              _context4.next = 10;
              break;
            }

            if (window.App && window.App.showToast) window.App.showToast(nameValidation.message, 'error');
            return _context4.abrupt("return");

          case 10:
            emailValidation = ClientUtils.validateEmail(email);

            if (emailValidation.valid) {
              _context4.next = 14;
              break;
            }

            if (window.App && window.App.showToast) window.App.showToast(emailValidation.message, 'error');
            return _context4.abrupt("return");

          case 14:
            phoneValidation = ClientUtils.validatePhone(phoneNumber);

            if (phoneValidation.valid) {
              _context4.next = 18;
              break;
            }

            if (window.App && window.App.showToast) window.App.showToast(phoneValidation.message, 'error');
            return _context4.abrupt("return");

          case 18:
            notesValidation = ClientUtils.validateNotes(notes);

            if (notesValidation.valid) {
              _context4.next = 22;
              break;
            }

            if (window.App && window.App.showToast) window.App.showToast(notesValidation.message, 'error');
            return _context4.abrupt("return");

          case 22:
            phone = phoneNumber ? countryCode + ' ' + phoneNumber : '';
            submitBtn = document.querySelector('#add-client-form button[type="submit"]');
            originalText = submitBtn ? submitBtn.innerHTML : null;

            if (submitBtn) {
              submitBtn.disabled = true;
              submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
            }

            API = getAPI();

            if (API) {
              _context4.next = 30;
              break;
            }

            if (window.App && window.App.showToast) window.App.showToast('API service not available', 'error');
            return _context4.abrupt("return");

          case 30:
            _context4.prev = 30;
            _context4.next = 33;
            return regeneratorRuntime.awrap(RequestLockManager.safeApiCall(function () {
              return API.addClient({
                name: name,
                email: email || null,
                phone: phone || null,
                notes: notes || null
              });
            }, 'addClient'));

          case 33:
            if (window.App && window.App.showToast) {
              window.App.showToast('Client added successfully', 'success');
            }

            CachedElements.get('add-client-form').reset();
            _context4.next = 37;
            return regeneratorRuntime.awrap(loadClients());

          case 37:
            goBack();
            _context4.next = 44;
            break;

          case 40:
            _context4.prev = 40;
            _context4.t0 = _context4["catch"](30);
            Logger.error('Error adding client:', _context4.t0);

            if (window.App && window.App.showToast) {
              window.App.showToast(_context4.t0.message || 'Failed to add client', 'error');
            }

          case 44:
            _context4.prev = 44;

            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalText;
            }

            return _context4.finish(44);

          case 47:
          case "end":
            return _context4.stop();
        }
      }
    }, null, null, [[30, 40, 44, 47]]);
  }); // ==================== EDIT CLIENT ====================

  function editClient(clientId) {
    var API, client, parts, countrySelect, hiddenInput;
    return regeneratorRuntime.async(function editClient$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            if (!store.getState().isLoading) {
              _context5.next = 3;
              break;
            }

            Logger.warn('Already loading, skipping edit');
            return _context5.abrupt("return");

          case 3:
            API = getAPI();

            if (API) {
              _context5.next = 7;
              break;
            }

            if (window.App && window.App.showToast) window.App.showToast('API service not available', 'error');
            return _context5.abrupt("return");

          case 7:
            _context5.prev = 7;
            Logger.log('Editing client with ID:', clientId);
            _context5.next = 11;
            return regeneratorRuntime.awrap(RequestLockManager.safeApiCall(function () {
              return API.getClient(clientId);
            }, 'getClient_' + clientId));

          case 11:
            client = _context5.sent;

            if (!(client === null)) {
              _context5.next = 14;
              break;
            }

            return _context5.abrupt("return");

          case 14:
            if (client) {
              _context5.next = 17;
              break;
            }

            if (window.App && window.App.showToast) window.App.showToast('Client not found', 'error');
            return _context5.abrupt("return");

          case 17:
            CachedElements.get('edit-client-name').value = client.name || '';
            CachedElements.get('edit-client-email').value = client.email || '';
            CachedElements.get('edit-client-notes').value = client.notes || '';

            if (client.phone) {
              parts = ClientUtils.extractPhoneParts(client.phone);
              countrySelect = CachedElements.get('edit-country-code');
              if (countrySelect) countrySelect.value = parts.code;
              CachedElements.get('edit-client-phone').value = parts.number;
            } else {
              CachedElements.get('edit-client-phone').value = '';
            }

            hiddenInput = CachedElements.get('edit-client-id');

            if (hiddenInput) {
              hiddenInput.value = clientId;
            }

            showScreen('edit');
            _context5.next = 30;
            break;

          case 26:
            _context5.prev = 26;
            _context5.t0 = _context5["catch"](7);
            Logger.error('Error editing client:', _context5.t0);

            if (window.App && window.App.showToast) {
              window.App.showToast('Failed to load client data', 'error');
            }

          case 30:
          case "end":
            return _context5.stop();
        }
      }
    }, null, null, [[7, 26]]);
  } // ==================== UPDATE CLIENT ====================


  var updateClientSubmit = withActionGuard(function _callee3(e) {
    var hiddenInput, clientId, name, email, countryCode, phoneNumber, notes, nameValidation, emailValidation, phoneValidation, notesValidation, phone, submitBtn, originalText, API, result;
    return regeneratorRuntime.async(function _callee3$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            e.preventDefault();
            hiddenInput = CachedElements.get('edit-client-id');
            clientId = hiddenInput ? hiddenInput.value : null;

            if (clientId) {
              _context6.next = 7;
              break;
            }

            Logger.error('No clientId found in hidden input');

            if (window.App && window.App.showToast) {
              window.App.showToast('Invalid client ID - Please try again', 'error');
            }

            return _context6.abrupt("return");

          case 7:
            name = CachedElements.get('edit-client-name').value.trim();
            email = CachedElements.get('edit-client-email').value.trim();
            countryCode = CachedElements.get('edit-country-code').value;
            phoneNumber = CachedElements.get('edit-client-phone').value.trim();
            notes = CachedElements.get('edit-client-notes').value.trim();
            nameValidation = ClientUtils.validateName(name);

            if (nameValidation.valid) {
              _context6.next = 16;
              break;
            }

            if (window.App && window.App.showToast) window.App.showToast(nameValidation.message, 'error');
            return _context6.abrupt("return");

          case 16:
            emailValidation = ClientUtils.validateEmail(email);

            if (emailValidation.valid) {
              _context6.next = 20;
              break;
            }

            if (window.App && window.App.showToast) window.App.showToast(emailValidation.message, 'error');
            return _context6.abrupt("return");

          case 20:
            phoneValidation = ClientUtils.validatePhone(phoneNumber);

            if (phoneValidation.valid) {
              _context6.next = 24;
              break;
            }

            if (window.App && window.App.showToast) window.App.showToast(phoneValidation.message, 'error');
            return _context6.abrupt("return");

          case 24:
            notesValidation = ClientUtils.validateNotes(notes);

            if (notesValidation.valid) {
              _context6.next = 28;
              break;
            }

            if (window.App && window.App.showToast) window.App.showToast(notesValidation.message, 'error');
            return _context6.abrupt("return");

          case 28:
            phone = phoneNumber ? countryCode + ' ' + phoneNumber : '';
            submitBtn = document.querySelector('#edit-client-form button[type="submit"]');
            originalText = submitBtn ? submitBtn.innerHTML : null;

            if (submitBtn) {
              submitBtn.disabled = true;
              submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';
            }

            API = getAPI();

            if (API) {
              _context6.next = 36;
              break;
            }

            if (window.App && window.App.showToast) window.App.showToast('API service not available', 'error');
            return _context6.abrupt("return");

          case 36:
            _context6.prev = 36;
            _context6.next = 39;
            return regeneratorRuntime.awrap(RequestLockManager.safeApiCall(function () {
              return API.updateClient(clientId, {
                name: name,
                email: email || null,
                phone: phone || null,
                notes: notes || null
              });
            }, 'updateClient_' + clientId));

          case 39:
            result = _context6.sent;

            if (!(result === null)) {
              _context6.next = 42;
              break;
            }

            return _context6.abrupt("return");

          case 42:
            if (window.App && window.App.showToast) {
              window.App.showToast('Client updated successfully', 'success');
            }

            if (hiddenInput) hiddenInput.value = '';
            _context6.next = 46;
            return regeneratorRuntime.awrap(loadClients());

          case 46:
            goBack();
            _context6.next = 53;
            break;

          case 49:
            _context6.prev = 49;
            _context6.t0 = _context6["catch"](36);
            Logger.error('Error updating client:', _context6.t0);

            if (window.App && window.App.showToast) {
              window.App.showToast(_context6.t0.message || 'Failed to update client', 'error');
            }

          case 53:
            _context6.prev = 53;

            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = originalText;
            }

            return _context6.finish(53);

          case 56:
          case "end":
            return _context6.stop();
        }
      }
    }, null, null, [[36, 49, 53, 56]]);
  }); // ==================== DELETE CLIENT ====================

  var deleteClient = withActionGuard(function _callee5(clientId) {
    return regeneratorRuntime.async(function _callee5$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            CustomConfirm.show('Are you sure you want to delete this client? All associated requests will also be deleted.', function _callee4() {
              var API, requests, clientRequests, i;
              return regeneratorRuntime.async(function _callee4$(_context7) {
                while (1) {
                  switch (_context7.prev = _context7.next) {
                    case 0:
                      API = getAPI();

                      if (API) {
                        _context7.next = 4;
                        break;
                      }

                      if (window.App && window.App.showToast) window.App.showToast('API service not available', 'error');
                      return _context7.abrupt("return");

                    case 4:
                      _context7.prev = 4;
                      _context7.prev = 5;
                      _context7.next = 8;
                      return regeneratorRuntime.awrap(RequestLockManager.safeApiCall(function () {
                        return API.getRequests();
                      }, 'getRequests'));

                    case 8:
                      requests = _context7.sent;

                      if (!(requests !== null)) {
                        _context7.next = 19;
                        break;
                      }

                      clientRequests = requests.filter(function (req) {
                        return req.clientid == clientId;
                      });
                      i = 0;

                    case 12:
                      if (!(i < clientRequests.length)) {
                        _context7.next = 18;
                        break;
                      }

                      _context7.next = 15;
                      return regeneratorRuntime.awrap(RequestLockManager.safeApiCall(function () {
                        return API.deleteRequest(clientRequests[i].id);
                      }, 'deleteRequest_' + clientRequests[i].id));

                    case 15:
                      i++;
                      _context7.next = 12;
                      break;

                    case 18:
                      if (clientRequests.length > 0 && window.App && window.App.showToast) {
                        window.App.showToast('Deleted ' + clientRequests.length + ' request(s) associated with this client', 'info');
                      }

                    case 19:
                      _context7.next = 24;
                      break;

                    case 21:
                      _context7.prev = 21;
                      _context7.t0 = _context7["catch"](5);
                      Logger.warn('Error deleting requests:', _context7.t0);

                    case 24:
                      _context7.next = 26;
                      return regeneratorRuntime.awrap(RequestLockManager.safeApiCall(function () {
                        return API.deleteClient(clientId);
                      }, 'deleteClient_' + clientId));

                    case 26:
                      if (window.App && window.App.showToast) {
                        window.App.showToast('Client deleted successfully', 'success');
                      }

                      if (store.getState().expandedCardId === String(clientId)) {
                        collapseExpandedCard();
                      }

                      _context7.next = 30;
                      return regeneratorRuntime.awrap(loadClients());

                    case 30:
                      if (!(window.RequestsModule && window.RequestsModule.loadRequests)) {
                        _context7.next = 33;
                        break;
                      }

                      _context7.next = 33;
                      return regeneratorRuntime.awrap(window.RequestsModule.loadRequests());

                    case 33:
                      _context7.next = 39;
                      break;

                    case 35:
                      _context7.prev = 35;
                      _context7.t1 = _context7["catch"](4);
                      Logger.error('Error deleting client:', _context7.t1);

                      if (window.App && window.App.showToast) {
                        window.App.showToast('Failed to delete client', 'error');
                      }

                    case 39:
                    case "end":
                      return _context7.stop();
                  }
                }
              }, null, null, [[4, 35], [5, 21]]);
            }, function () {
              Logger.log('Delete cancelled');
            });

          case 1:
          case "end":
            return _context8.stop();
        }
      }
    });
  }); // ==================== VIEW CLIENT DETAILS ====================

  function viewClientDetails(clientId) {
    var API, client, detailsContainer, editHeaderBtn;
    return regeneratorRuntime.async(function viewClientDetails$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            if (!store.getState().isLoading) {
              _context9.next = 3;
              break;
            }

            Logger.warn('Already loading, skipping view');
            return _context9.abrupt("return");

          case 3:
            API = getAPI();

            if (API) {
              _context9.next = 7;
              break;
            }

            if (window.App && window.App.showToast) window.App.showToast('API service not available', 'error');
            return _context9.abrupt("return");

          case 7:
            _context9.prev = 7;
            _context9.next = 10;
            return regeneratorRuntime.awrap(RequestLockManager.safeApiCall(function () {
              return API.getClient(clientId);
            }, 'getClientDetails_' + clientId));

          case 10:
            client = _context9.sent;

            if (!(client === null)) {
              _context9.next = 13;
              break;
            }

            return _context9.abrupt("return");

          case 13:
            if (client) {
              _context9.next = 16;
              break;
            }

            if (window.App && window.App.showToast) window.App.showToast('Client not found', 'error');
            return _context9.abrupt("return");

          case 16:
            store.setState({
              currentClient: client,
              currentClientId: clientId
            });
            detailsContainer = CachedElements.get('client-details-container');

            if (detailsContainer) {
              detailsContainer.innerHTML = renderer.renderClientDetails(client);
            }

            editHeaderBtn = CachedElements.get('edit-from-details');
            if (editHeaderBtn) editHeaderBtn.dataset.id = client.id;
            showScreen('details');
            _context9.next = 28;
            break;

          case 24:
            _context9.prev = 24;
            _context9.t0 = _context9["catch"](7);
            Logger.error('Error viewing client:', _context9.t0);

            if (window.App && window.App.showToast) {
              window.App.showToast('Failed to load client details', 'error');
            }

          case 28:
          case "end":
            return _context9.stop();
        }
      }
    }, null, null, [[7, 24]]);
  }

  function refreshCurrentDetails() {
    var currentClient = store.getState().currentClient;

    if (currentClient && getCurrentScreen() === 'details') {
      var detailsContainer = CachedElements.get('client-details-container');

      if (detailsContainer) {
        detailsContainer.innerHTML = renderer.renderClientDetails(currentClient);
      }
    }
  } // ==================== ACTIONS ====================


  function callClient(phone) {
    if (phone && phone !== 'No phone') {
      var cleanPhone = ClientUtils.cleanPhoneNumber(phone);
      window.location.href = 'tel:' + cleanPhone;
    } else {
      if (window.App && window.App.showToast) window.App.showToast('No phone number available', 'warning');
    }
  }

  function whatsAppClient(phone) {
    if (phone && phone !== 'No phone') {
      var url = ClientUtils.getWhatsAppUrl(phone);
      window.open(url, '_blank');
    } else {
      if (window.App && window.App.showToast) window.App.showToast('No phone number available', 'warning');
    }
  } // ==================== EVENT HANDLING (Optimized - Container level) ====================


  function handleGlobalClick(e) {
    var target = e.target;
    var actionElement = target.closest('[data-action]');
    if (!actionElement) return;
    var action = actionElement.dataset.action;
    var id = actionElement.dataset.id;
    var phone = actionElement.dataset.phone;
    var forceScreen = actionElement.dataset.force;
    e.preventDefault();
    e.stopPropagation();

    switch (action) {
      case 'add':
        showScreen('add');
        break;

      case 'back':
        if (forceScreen) {
          goBackTo(forceScreen);
        } else {
          goBack();
        }

        break;

      case 'load-more':
        handleLoadMore();
        break;

      case 'view-all':
        handleViewAll();
        break;

      case 'view-less':
        handleViewLess();
        break;

      case 'toggle':
        var card = actionElement.closest('.compact-card');
        if (card) toggleCard(card);
        break;

      case 'call':
        callClient(phone);
        break;

      case 'whatsapp':
        whatsAppClient(phone);
        break;

      case 'view':
        if (id) viewClientDetails(id);
        break;

      case 'edit':
        if (id) editClient(id);
        break;

      case 'delete':
        if (id) deleteClient(id);
        break;

      case 'retry':
        retryCount = 0;
        loadClients();
        break;

      case 'theme':
        if (window.App && window.App.toggleTheme) window.App.toggleTheme();
        break;
    }
  } // ✅ Event delegation on container level for better performance


  function attachContainerEvents() {
    if (container) {
      container.removeEventListener('click', handleGlobalClick);
      container.addEventListener('click', handleGlobalClick);
    } // Also keep body for elements outside container


    document.body.removeEventListener('click', handleGlobalClick);
    document.body.addEventListener('click', function (e) {
      // Only handle if target is not inside container or is outside
      if (container && !container.contains(e.target)) {
        handleGlobalClick(e);
      }
    });
  }

  var handleResize = debounce(function () {
    if (getCurrentScreen() === 'list' && renderer && store.getState().clients.length > 0) {
      renderer.updateClientsList(store.getState().clients, store.getState().expandedCardId, store.getState().displayCount);
    }

    if (getCurrentScreen() === 'details' && store.getState().currentClient) {
      refreshCurrentDetails();
    }

    if (store.getState().expandedCardId) {
      collapseExpandedCard();
    }
  }, CLIENTS_CONFIG.PERFORMANCE.DEBOUNCE_DELAY);

  function bindFormEvents() {
    var addForm = CachedElements.get('add-client-form');
    var editForm = CachedElements.get('edit-client-form');

    if (addForm) {
      addForm.removeEventListener('submit', addClientSubmit);
      addForm.addEventListener('submit', addClientSubmit);
    }

    if (editForm) {
      editForm.removeEventListener('submit', updateClientSubmit);
      editForm.addEventListener('submit', updateClientSubmit);
    }
  } // ✅ Complete cleanup function


  function destroy() {
    if (eventListenersAttached) {
      if (container) {
        container.removeEventListener('click', handleGlobalClick);
      }

      document.body.removeEventListener('click', handleGlobalClick);
      window.removeEventListener('resize', handleResize);
      eventListenersAttached = false;
    }

    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
      resizeTimeout = null;
    }

    RequestLockManager.cancelAllPending();
    CachedElements.clear(); // ✅ Clean up store listeners

    if (store && store.destroy) {
      store.destroy();
    }

    isInitialized = false;
    Logger.log('🧹 Clients Module Destroyed - All listeners cleaned');
  }

  function initEventListeners() {
    if (eventListenersAttached) return;
    attachContainerEvents();
    window.addEventListener('resize', handleResize);
    eventListenersAttached = true;
  } // ✅ Initialize with dependency injection


  function init(apiInstance) {
    return regeneratorRuntime.async(function init$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            if (!isInitialized) {
              _context10.next = 3;
              break;
            }

            Logger.warn('Clients Module already initialized');
            return _context10.abrupt("return");

          case 3:
            // ✅ Set API instance if provided
            if (apiInstance) {
              setAPI(apiInstance);
            }

            container = CachedElements.get('clients-container');

            if (container) {
              _context10.next = 7;
              break;
            }

            return _context10.abrupt("return");

          case 7:
            renderer = new DOMRenderer(container, CLIENTS_CONFIG.DISPLAY.INITIAL_COUNT);
            bindFormEvents();
            initEventListeners();
            _context10.next = 12;
            return regeneratorRuntime.awrap(loadClients());

          case 12:
            isInitialized = true;
            Logger.log('✅ Clients Module Initialized (FULLY FIXED V7)');

          case 14:
          case "end":
            return _context10.stop();
        }
      }
    });
  }

  return {
    init: init,
    destroy: destroy,
    setAPI: setAPI,
    loadClients: loadClients,
    viewClientDetails: viewClientDetails,
    editClient: editClient,
    deleteClient: deleteClient,
    callClient: callClient,
    whatsAppClient: whatsAppClient,
    goBack: goBack,
    goBackTo: goBackTo,
    getCurrentClients: function getCurrentClients() {
      return store.getState().clients.slice();
    }
  };
}(); // ✅ Export with optional dependency injection


window.ClientsModule = ClientsModule;
window.setClientsAPI = ClientsModule.setAPI; // Auto-initialize

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('clients-container')) {
      ClientsModule.init();
    }
  });
} else {
  if (document.getElementById('clients-container')) {
    ClientsModule.init();
  }
}

window.addEventListener('beforeunload', function () {
  if (window.ClientsModule && window.ClientsModule.destroy) {
    window.ClientsModule.destroy();
  }
});
//# sourceMappingURL=clients.dev.js.map
