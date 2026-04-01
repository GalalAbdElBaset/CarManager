"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

/**
 * Clients Module - Compact Grid with Smart Expandable Cards
 * ✅ FIXED: Smart expand direction detection
 * ✅ FIXED: Prevent multiple cards open at once
 * ✅ FIXED: Maintain expanded state after reload
 * ✅ ENHANCED: Smooth transitions + rapid click protection
 */
var ClientsModule = function () {
  var currentClients = [];
  var isInitialized = false;
  var isLoading = false;
  var expandedClientId = null;
  var expandedCardElement = null;
  var expandedDirection = null;
  var isAnimating = false;
  var outsideClickBound = false;
  /** ===== HELPER FUNCTIONS ===== */

  function getAvatarColor(name) {
    var colors = ['#4361ee', '#4895ef', '#3f37c9', '#4cc9f0', '#06d6a0', '#ffb703', '#e63946', '#f72585', '#7209b7', '#560bad'];
    var hash = 0;

    for (var i = 0; i < name.length; i++) {
      hash = (hash << 5) - hash + name.charCodeAt(i) | 0;
    }

    return colors[Math.abs(hash) % colors.length];
  }

  function formatDateTime(dateString) {
    if (!dateString) return 'No date';

    try {
      var date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (_unused) {
      return 'Invalid date';
    }
  }

  function forceCloseCard(card) {
    if (!card) return;
    var expandable = card.querySelector('[data-expandable="true"]');
    var chevron = card.querySelector('.chevron-icon');
    card.classList.remove('expanded', 'expand-up', 'expand-down');
    if (expandable) expandable.classList.remove('expanded');
    if (chevron) chevron.classList.remove('rotated');
  }
  /** ===== INIT ===== */


  function init() {
    if (isInitialized) return;
    bindEvents();
    loadClients();
    isInitialized = true;
    console.log('👥 Clients Module Initialized');
  }
  /** ===== EVENT BINDING ===== */


  function bindEvents() {
    var container = document.getElementById('clients-container');
    if (container) container.addEventListener('click', handleContainerClick);

    if (!outsideClickBound) {
      document.addEventListener('click', handleOutsideClick);
      outsideClickBound = true;
    }

    window.addEventListener('resize', function () {
      if (expandedCardElement) collapseExpandedCard();
    });
  }

  function handleContainerClick(e) {
    var toggleBtn = e.target.closest('[data-action="toggle"]');

    if (toggleBtn) {
      e.stopPropagation();
      var card = toggleBtn.closest('.compact-card');
      if (card) toggleCard(card.dataset.clientId);
      return;
    }

    var actionBtn = e.target.closest('[data-action]');

    if (actionBtn && actionBtn !== toggleBtn) {
      e.stopPropagation();
      handleCardAction(actionBtn);
    }
  }

  function handleCardAction(btn) {
    var action = btn.dataset.action;
    var id = btn.dataset.id;
    var phone = btn.dataset.phone;

    switch (action) {
      case 'call':
        return callClient(phone);

      case 'whatsapp':
        return whatsAppClient(phone);

      case 'edit':
        return editClient(id);

      case 'delete':
        return deleteClient(id);

      case 'view':
        return viewClientDetails(id);
    }
  }

  function handleOutsideClick(e) {
    if (!expandedCardElement) return;
    if (!expandedCardElement.contains(e.target)) collapseExpandedCard();
  }
  /** ===== COLLAPSE CARD ===== */


  function collapseExpandedCard() {
    if (!expandedCardElement || isAnimating) return;
    var card = expandedCardElement;
    var expandable = card.querySelector('[data-expandable="true"]');
    var chevron = card.querySelector('.chevron-icon');
    if (expandable) expandable.classList.remove('expanded');
    if (chevron) chevron.classList.remove('rotated');

    var handleTransitionEnd = function handleTransitionEnd() {
      card.classList.remove('expanded', 'expand-up', 'expand-down');
      expandedCardElement = null;
      expandedClientId = null;
      expandedDirection = null;
      isAnimating = false;
      card.removeEventListener('transitionend', handleTransitionEnd);
    };

    card.addEventListener('transitionend', handleTransitionEnd, {
      once: true
    });
    setTimeout(handleTransitionEnd, 250);
  }
  /** ===== SMART EXPAND ===== */


  function toggleExpand(card) {
    if (isAnimating) return;
    var isExpanded = card.classList.contains('expanded');

    if (expandedCardElement && expandedCardElement !== card) {
      forceCloseCard(expandedCardElement);
      expandedCardElement = null;
      expandedClientId = null;
      expandedDirection = null;
    }

    if (isExpanded) return collapseExpandedCard();
    isAnimating = true; // DETECT SCROLL CONTAINER

    var gridContainer = card.closest('.clients-compact-grid');
    var scrollContainer = gridContainer;

    if (!scrollContainer || getComputedStyle(scrollContainer).overflowY !== 'auto' && getComputedStyle(scrollContainer).overflowY !== 'scroll') {
      scrollContainer = document.documentElement;
    }

    var containerRect = scrollContainer.getBoundingClientRect();
    var cardRect = card.getBoundingClientRect();
    var expandable = card.querySelector('[data-expandable="true"]');
    var neededSpace = expandable ? expandable.scrollHeight + 20 : 200;
    var spaceBelow = containerRect.bottom - cardRect.bottom;
    var spaceAbove = cardRect.top - containerRect.top;
    var openUpward = spaceBelow < neededSpace && spaceAbove > spaceBelow;

    if (openUpward) {
      card.classList.add('expanded', 'expand-up');
      card.classList.remove('expand-down');
      expandedDirection = 'up';
      card.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      });
    } else {
      card.classList.add('expanded', 'expand-down');
      card.classList.remove('expand-up');
      expandedDirection = 'down';
      card.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      });
    }

    expandedCardElement = card;
    expandedClientId = card.dataset.clientId;
    var chevron = card.querySelector('.chevron-icon');
    if (chevron) chevron.classList.add('rotated');
    if (expandable) expandable.classList.add('expanded');

    var handleTransitionEnd = function handleTransitionEnd() {
      isAnimating = false;
      card.removeEventListener('transitionend', handleTransitionEnd);
    };

    card.addEventListener('transitionend', handleTransitionEnd, {
      once: true
    });
    setTimeout(function () {
      isAnimating = false;
    }, 300);
  }

  function toggleCard(clientId) {
    var card = document.querySelector(".compact-card[data-client-id=\"".concat(clientId, "\"]"));
    if (!card) return;
    toggleExpand(card);
  }
  /** ===== LOAD CLIENTS ===== */


  function loadClients() {
    var container;
    return regeneratorRuntime.async(function loadClients$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            container = document.getElementById('clients-container');

            if (!(!container || isLoading)) {
              _context.next = 3;
              break;
            }

            return _context.abrupt("return");

          case 3:
            isLoading = true;
            _context.prev = 4;
            container.innerHTML = '<div class="loading-overlay"><div class="spinner"></div><p>Loading clients...</p></div>';
            _context.next = 8;
            return regeneratorRuntime.awrap(API.getClients());

          case 8:
            currentClients = _context.sent;
            displayClients(currentClients);
            _context.next = 15;
            break;

          case 12:
            _context.prev = 12;
            _context.t0 = _context["catch"](4);
            container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>Error loading clients</h3></div>';

          case 15:
            _context.prev = 15;
            isLoading = false;
            return _context.finish(15);

          case 18:
          case "end":
            return _context.stop();
        }
      }
    }, null, null, [[4, 12, 15, 18]]);
  }

  function displayClients(clients) {
    var container = document.getElementById('clients-container');
    if (!container) return;

    if (!clients || clients.length === 0) {
      container.innerHTML = "<div class=\"empty-state\"><h3>No clients found</h3></div>";
      return;
    }

    var sorted = _toConsumableArray(clients).sort(function (a, b) {
      return new Date(b.registeredat || 0) - new Date(a.registeredat || 0);
    });

    container.innerHTML = '<div class="clients-compact-grid">' + sorted.map(function (c) {
      return createCompactCard(c, c.id === expandedClientId);
    }).join('') + '</div>'; // Restore expanded card

    if (expandedClientId) {
      var card = document.querySelector(".compact-card[data-client-id=\"".concat(expandedClientId, "\"]"));

      if (card) {
        expandedCardElement = card;
        if (expandedDirection === 'up') card.classList.add('expanded', 'expand-up');else card.classList.add('expanded', 'expand-down');
        var chevron = card.querySelector('.chevron-icon');
        if (chevron) chevron.classList.add('rotated');
        var expandable = card.querySelector('[data-expandable="true"]');
        if (expandable) expandable.classList.add('expanded');
      }
    }
  }
  /** ===== CREATE CARD HTML ===== */


  function createCompactCard(client, isExpanded) {
    var initials = App.getInitials(client.name);
    var avatarColor = getAvatarColor(client.name);
    var phone = client.phone || '';
    var email = client.email || '';
    var dateTime = formatDateTime(client.registeredat);
    return "\n        <div class=\"compact-card ".concat(isExpanded ? 'expanded' : '', "\" data-client-id=\"").concat(client.id, "\">\n            <div class=\"card-header\" data-action=\"toggle\">\n                <div class=\"card-left\">\n                    <div class=\"card-avatar\" style=\"background:").concat(avatarColor, "\">").concat(initials, "</div>\n                    <div class=\"card-info\">\n                        <h4 class=\"card-name\">").concat(App.escapeHtml(client.name), "</h4>\n                        <div class=\"card-date\">").concat(phone || 'No phone', "</div>\n                    </div>\n                </div>\n                <div class=\"chevron-icon ").concat(isExpanded ? 'rotated' : '', "\"><i class=\"fa-solid fa-chevron-down\"></i></div>\n            </div>\n            <div class=\"card-expandable ").concat(isExpanded ? 'expanded' : '', "\" data-expandable=\"true\">\n                <div class=\"expandable-content\">\n                    ").concat(email ? "<div class=\"info-row\"><div class=\"info-label\"><i class=\"fa-solid fa-envelope\"></i>Email</div><div class=\"info-value\">".concat(App.escapeHtml(email), "</div></div>") : '', "\n                    ").concat(phone ? "<div class=\"info-row\"><div class=\"info-label\"><i class=\"fa-solid fa-phone\"></i>Phone</div><div class=\"info-value\">".concat(App.escapeHtml(phone), "</div></div>") : '', "\n                    <div class=\"info-row\"><div class=\"info-label\"><i class=\"fa-solid fa-clock\"></i>Registered</div><div class=\"info-value\">").concat(dateTime, "</div></div>\n                </div>\n            </div>\n        </div>");
  }
  /** ===== CALL/WHATSAPP ===== */


  function callClient(phone) {
    if (!phone) return App.showToast('No phone available', 'warning');
    window.location.href = "tel:".concat(phone.replace(/\s/g, ''));
  }

  function whatsAppClient(phone) {
    if (!phone) return App.showToast('No phone available', 'warning');
    window.open("https://wa.me/".concat(phone.replace(/\D/g, '')), '_blank');
  }

  return {
    init: init,
    loadClients: loadClients,
    toggleCard: toggleCard,
    callClient: callClient,
    whatsAppClient: whatsAppClient
  };
}();

window.ClientsModule = ClientsModule;
document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('clients-container')) ClientsModule.init();
});
//# sourceMappingURL=clients.dev.js.map
