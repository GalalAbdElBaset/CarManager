"use strict";

/**
 * Clients Module - Handles all client-related functionality
 */
var ClientsModule = function () {
  // ==================== INITIALIZATION ====================
  function init() {
    console.log('👥 Clients Module Initialized');
    loadClients();
    bindEvents();
  }

  function bindEvents() {
    // Add client form submit
    var addForm = document.getElementById('add-client-form');

    if (addForm) {
      addForm.addEventListener('submit', addClient);
    } // Edit client form submit


    var editForm = document.getElementById('edit-client-form');

    if (editForm) {
      editForm.addEventListener('submit', updateClient);
    } // Edit button in details header


    var editHeaderBtn = document.getElementById('edit-from-details');

    if (editHeaderBtn) {
      editHeaderBtn.addEventListener('click', function () {
        var clientId = editHeaderBtn.dataset.clientId;
        if (clientId) editClient(clientId);
      });
    }
  } // ==================== LOAD CLIENTS ====================


  function loadClients() {
    var container, countElement, clients;
    return regeneratorRuntime.async(function loadClients$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            container = document.getElementById('clients-container');
            countElement = document.getElementById('clients-count');

            if (container) {
              _context.next = 4;
              break;
            }

            return _context.abrupt("return");

          case 4:
            _context.prev = 4;
            container.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"><div class="spinner"></div><p>جاري تحميل العملاء...</p></div></div>';
            _context.next = 8;
            return regeneratorRuntime.awrap(API.getClients());

          case 8:
            clients = _context.sent;

            if (countElement) {
              countElement.innerHTML = "<span class=\"badge\">".concat(clients.length, " \u0639\u0645\u064A\u0644</span>");
            }

            displayClients(clients);
            _context.next = 18;
            break;

          case 13:
            _context.prev = 13;
            _context.t0 = _context["catch"](4);
            console.error('Error loading clients:', _context.t0);
            container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>خطأ في تحميل العملاء</h3><p>يرجى المحاولة مرة أخرى</p></div>';
            App.showToast('فشل تحميل العملاء', 'error');

          case 18:
          case "end":
            return _context.stop();
        }
      }
    }, null, null, [[4, 13]]);
  } // ==================== DISPLAY CLIENTS ====================


  function displayClients(clients) {
    var container = document.getElementById('clients-container');
    if (!container) return;

    if (!clients || clients.length === 0) {
      container.innerHTML = "\n                <div class=\"empty-state\">\n                    <i class=\"fa-solid fa-users-slash\"></i>\n                    <h3>\u0644\u0627 \u064A\u0648\u062C\u062F \u0639\u0645\u0644\u0627\u0621</h3>\n                    <p>\u0623\u0636\u0641 \u0623\u0648\u0644 \u0639\u0645\u064A\u0644 \u0644\u0644\u0628\u062F\u0621</p>\n                    <button type=\"button\" class=\"btn btn-primary\" onclick=\"App.showAddScreen()\">\n                        <i class=\"fa-solid fa-plus\"></i> \u0625\u0636\u0627\u0641\u0629 \u0639\u0645\u064A\u0644\n                    </button>\n                </div>\n            ";
      return;
    } // Sort by newest first


    clients.sort(function (a, b) {
      return new Date(b.registeredAt || 0) - new Date(a.registeredAt || 0);
    });
    var html = '<div class="clients-grid">';
    clients.forEach(function (client) {
      html += createClientCard(client);
    });
    html += '</div>';
    container.innerHTML = html;
  } // ==================== CREATE CLIENT CARD ====================


  function createClientCard(client) {
    var initials = App.getInitials(client.name);
    var phone = client.phone || 'لا يوجد رقم';
    var email = client.email || '';
    return "\n            <div class=\"client-card\" onclick=\"ClientsModule.viewClientDetails('".concat(client.id, "')\">\n                <div class=\"client-card-header\">\n                    <div class=\"client-avatar\">").concat(App.escapeHtml(initials), "</div>\n                    <div class=\"client-badge\">\u0639\u0645\u064A\u0644</div>\n                </div>\n                <div class=\"client-card-body\">\n                    <h3 class=\"client-name\">").concat(App.escapeHtml(client.name), "</h3>\n                    ").concat(email ? "<div class=\"client-email\"><i class=\"fa-solid fa-envelope\"></i> ".concat(App.escapeHtml(email), "</div>") : '', "\n                    <div class=\"client-phone\"><i class=\"fa-solid fa-phone\"></i> ").concat(App.escapeHtml(phone), "</div>\n                    ").concat(client.notes ? "<div class=\"client-notes\"><i class=\"fa-solid fa-note-sticky\"></i> ".concat(App.escapeHtml(client.notes.substring(0, 30))).concat(client.notes.length > 30 ? '...' : '', "</div>") : '', "\n                </div>\n                <div class=\"client-card-footer\">\n                    <div class=\"client-actions\">\n                        <button type=\"button\" class=\"btn-icon btn-call\" onclick=\"event.stopPropagation(); callClient('").concat(client.phone, "')\" title=\"\u0627\u062A\u0635\u0627\u0644\">\n                            <i class=\"fa-solid fa-phone\"></i>\n                        </button>\n                        <button type=\"button\" class=\"btn-icon btn-whatsapp\" onclick=\"event.stopPropagation(); whatsAppClient('").concat(client.phone, "')\" title=\"\u0648\u0627\u062A\u0633\u0627\u0628\">\n                            <i class=\"fa-brands fa-whatsapp\"></i>\n                        </button>\n                        <button type=\"button\" class=\"btn-icon btn-edit\" onclick=\"event.stopPropagation(); ClientsModule.editClient('").concat(client.id, "')\" title=\"\u062A\u0639\u062F\u064A\u0644\">\n                            <i class=\"fa-solid fa-pen\"></i>\n                        </button>\n                        <button type=\"button\" class=\"btn-icon btn-delete\" onclick=\"event.stopPropagation(); ClientsModule.deleteClient('").concat(client.id, "')\" title=\"\u062D\u0630\u0641\">\n                            <i class=\"fa-solid fa-trash\"></i>\n                        </button>\n                    </div>\n                </div>\n            </div>\n        ");
  } // ==================== VIEW CLIENT DETAILS ====================


  function viewClientDetails(clientId) {
    var client, container, initials, phone, email, notes, editHeaderBtn;
    return regeneratorRuntime.async(function viewClientDetails$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            _context2.next = 3;
            return regeneratorRuntime.awrap(API.getClient(clientId));

          case 3:
            client = _context2.sent;
            container = document.getElementById('client-details-container');

            if (container) {
              _context2.next = 7;
              break;
            }

            return _context2.abrupt("return");

          case 7:
            initials = App.getInitials(client.name);
            phone = client.phone || 'لا يوجد رقم';
            email = client.email || 'لا يوجد بريد إلكتروني';
            notes = client.notes || 'لا توجد ملاحظات';
            container.innerHTML = "\n                <div class=\"client-profile\">\n                    <div class=\"profile-header\">\n                        <div class=\"profile-avatar-wrapper\">\n                            <div class=\"profile-avatar\">".concat(App.escapeHtml(initials), "</div>\n                        </div>\n                        <div class=\"profile-title\">\n                            <h2>").concat(App.escapeHtml(client.name), "</h2>\n                            <span class=\"member-since\">\u0639\u0645\u064A\u0644 \u0645\u0646\u0630 ").concat(formatDate(client.registeredAt), "</span>\n                        </div>\n                    </div>\n\n                    <div class=\"info-cards\">\n                        <div class=\"info-card\">\n                            <div class=\"info-icon\">\n                                <i class=\"fa-solid fa-phone\"></i>\n                            </div>\n                            <div class=\"info-content\">\n                                <label>\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062A\u0641</label>\n                                <div class=\"info-value\">").concat(App.escapeHtml(phone), "</div>\n                                <div class=\"info-actions\">\n                                    <button type=\"button\" class=\"btn-sm btn-call\" onclick=\"callClient('").concat(client.phone, "')\">\n                                        <i class=\"fa-solid fa-phone\"></i> \u0627\u062A\u0635\u0627\u0644\n                                    </button>\n                                    <button type=\"button\" class=\"btn-sm btn-whatsapp\" onclick=\"whatsAppClient('").concat(client.phone, "')\">\n                                        <i class=\"fa-brands fa-whatsapp\"></i> \u0648\u0627\u062A\u0633\u0627\u0628\n                                    </button>\n                                </div>\n                            </div>\n                        </div>\n\n                        <div class=\"info-card\">\n                            <div class=\"info-icon\">\n                                <i class=\"fa-solid fa-envelope\"></i>\n                            </div>\n                            <div class=\"info-content\">\n                                <label>\u0627\u0644\u0628\u0631\u064A\u062F \u0627\u0644\u0625\u0644\u0643\u062A\u0631\u0648\u0646\u064A</label>\n                                <div class=\"info-value\">").concat(App.escapeHtml(email), "</div>\n                                <a href=\"mailto:").concat(App.escapeHtml(client.email), "\" class=\"btn-sm btn-email\">\n                                    <i class=\"fa-solid fa-envelope\"></i> \u0625\u0631\u0633\u0627\u0644 \u0628\u0631\u064A\u062F\n                                </a>\n                            </div>\n                        </div>\n                    </div>\n\n                    <div class=\"notes-section\">\n                        <div class=\"notes-header\">\n                            <i class=\"fa-solid fa-note-sticky\"></i>\n                            <h3>\u0645\u0644\u0627\u062D\u0638\u0627\u062A</h3>\n                        </div>\n                        <div class=\"notes-content\">\n                            ").concat(App.escapeHtml(notes), "\n                        </div>\n                    </div>\n\n                    <div class=\"quick-actions\">\n                        <button type=\"button\" class=\"btn btn-secondary\" onclick=\"ClientsModule.editClient('").concat(client.id, "')\">\n                            <i class=\"fa-solid fa-pen\"></i> \u062A\u0639\u062F\u064A\u0644 \u0627\u0644\u0645\u0644\u0641\n                        </button>\n                    </div>\n                </div>\n            "); // Store client ID for edit button in header

            editHeaderBtn = document.getElementById('edit-from-details');

            if (editHeaderBtn) {
              editHeaderBtn.dataset.clientId = client.id;
            }

            App.showScreen('client-details');
            _context2.next = 21;
            break;

          case 17:
            _context2.prev = 17;
            _context2.t0 = _context2["catch"](0);
            console.error('Error viewing client:', _context2.t0);
            App.showToast('فشل تحميل تفاصيل العميل', 'error');

          case 21:
          case "end":
            return _context2.stop();
        }
      }
    }, null, null, [[0, 17]]);
  } // ==================== ADD CLIENT ====================


  function addClient(e) {
    var name, email, countryCode, phoneNumber, notes, phone, newClient;
    return regeneratorRuntime.async(function addClient$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            e.preventDefault();
            name = document.getElementById('add-client-name').value.trim();
            email = document.getElementById('add-client-email').value.trim();
            countryCode = document.getElementById('country-code').value;
            phoneNumber = document.getElementById('add-client-phone').value.trim();
            notes = document.getElementById('add-client-notes').value.trim();

            if (name) {
              _context3.next = 9;
              break;
            }

            App.showToast('اسم العميل مطلوب', 'error');
            return _context3.abrupt("return");

          case 9:
            phone = phoneNumber ? "".concat(countryCode, " ").concat(phoneNumber) : '';
            newClient = {
              name: name,
              email: email || null,
              phone: phone,
              notes: notes,
              registeredAt: new Date().toISOString()
            };
            _context3.prev = 11;
            _context3.next = 14;
            return regeneratorRuntime.awrap(API.addClient(newClient));

          case 14:
            App.showToast('تم إضافة العميل بنجاح', 'success');
            document.getElementById('add-client-form').reset();
            _context3.next = 18;
            return regeneratorRuntime.awrap(loadClients());

          case 18:
            App.showScreen('clients-list');
            _context3.next = 25;
            break;

          case 21:
            _context3.prev = 21;
            _context3.t0 = _context3["catch"](11);
            console.error('Error adding client:', _context3.t0);
            App.showToast('فشل إضافة العميل', 'error');

          case 25:
          case "end":
            return _context3.stop();
        }
      }
    }, null, null, [[11, 21]]);
  } // ==================== EDIT CLIENT ====================


  function editClient(clientId) {
    var client, phoneMatch, countryCode, phoneNumber, countrySelect;
    return regeneratorRuntime.async(function editClient$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;
            _context4.next = 3;
            return regeneratorRuntime.awrap(API.getClient(clientId));

          case 3:
            client = _context4.sent;
            document.getElementById('edit-client-name').value = client.name || '';
            document.getElementById('edit-client-email').value = client.email || '';

            if (client.phone) {
              phoneMatch = client.phone.match(/(\+\d+)?\s*(.+)/);

              if (phoneMatch) {
                countryCode = phoneMatch[1] || '+20';
                phoneNumber = phoneMatch[2] || '';
                countrySelect = document.getElementById('edit-country-code');
                if (countrySelect) countrySelect.value = countryCode;
                document.getElementById('edit-client-phone').value = phoneNumber.trim();
              }
            }

            document.getElementById('edit-client-notes').value = client.notes || '';
            document.getElementById('update-client').dataset.clientId = clientId;
            App.showScreen('edit-client');
            _context4.next = 16;
            break;

          case 12:
            _context4.prev = 12;
            _context4.t0 = _context4["catch"](0);
            console.error('Error editing client:', _context4.t0);
            App.showToast('فشل تحميل بيانات العميل', 'error');

          case 16:
          case "end":
            return _context4.stop();
        }
      }
    }, null, null, [[0, 12]]);
  } // ==================== UPDATE CLIENT ====================


  function updateClient(e) {
    var clientId, name, email, countryCode, phoneNumber, notes, phone, updateData;
    return regeneratorRuntime.async(function updateClient$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            e.preventDefault();
            clientId = document.getElementById('update-client').dataset.clientId;

            if (clientId) {
              _context5.next = 4;
              break;
            }

            return _context5.abrupt("return");

          case 4:
            name = document.getElementById('edit-client-name').value.trim();
            email = document.getElementById('edit-client-email').value.trim();
            countryCode = document.getElementById('edit-country-code').value;
            phoneNumber = document.getElementById('edit-client-phone').value.trim();
            notes = document.getElementById('edit-client-notes').value.trim();

            if (name) {
              _context5.next = 12;
              break;
            }

            App.showToast('اسم العميل مطلوب', 'error');
            return _context5.abrupt("return");

          case 12:
            phone = phoneNumber ? "".concat(countryCode, " ").concat(phoneNumber) : '';
            updateData = {
              name: name,
              email: email || null,
              phone: phone,
              notes: notes,
              updatedAt: new Date().toISOString()
            };
            _context5.prev = 14;
            _context5.next = 17;
            return regeneratorRuntime.awrap(API.updateClient(clientId, updateData));

          case 17:
            App.showToast('تم تحديث العميل بنجاح', 'success');
            _context5.next = 20;
            return regeneratorRuntime.awrap(loadClients());

          case 20:
            App.showScreen('clients-list');
            _context5.next = 27;
            break;

          case 23:
            _context5.prev = 23;
            _context5.t0 = _context5["catch"](14);
            console.error('Error updating client:', _context5.t0);
            App.showToast('فشل تحديث العميل', 'error');

          case 27:
          case "end":
            return _context5.stop();
        }
      }
    }, null, null, [[14, 23]]);
  } // ==================== DELETE CLIENT ====================


  function deleteClient(clientId) {
    return regeneratorRuntime.async(function deleteClient$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            if (confirm('هل أنت متأكد من حذف هذا العميل؟')) {
              _context6.next = 2;
              break;
            }

            return _context6.abrupt("return");

          case 2:
            _context6.prev = 2;
            _context6.next = 5;
            return regeneratorRuntime.awrap(API.deleteClient(clientId));

          case 5:
            App.showToast('تم حذف العميل بنجاح', 'success');
            _context6.next = 8;
            return regeneratorRuntime.awrap(loadClients());

          case 8:
            _context6.next = 14;
            break;

          case 10:
            _context6.prev = 10;
            _context6.t0 = _context6["catch"](2);
            console.error('Error deleting client:', _context6.t0);
            App.showToast('فشل حذف العميل', 'error');

          case 14:
          case "end":
            return _context6.stop();
        }
      }
    }, null, null, [[2, 10]]);
  } // ==================== HELPER FUNCTIONS ====================


  function formatDate(dateString) {
    if (!dateString) return 'غير معروف';
    var date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  function callClient(phone) {
    if (phone && phone !== 'لا يوجد رقم') {
      window.location.href = "tel:".concat(phone.replace(/\s/g, ''));
    } else {
      App.showToast('لا يوجد رقم هاتف', 'warning');
    }
  }

  function whatsAppClient(phone) {
    if (phone && phone !== 'لا يوجد رقم') {
      var cleanPhone = phone.replace(/\D/g, '');
      window.open("https://wa.me/".concat(cleanPhone), '_blank');
    } else {
      App.showToast('لا يوجد رقم هاتف', 'warning');
    }
  } // Public API


  return {
    init: init,
    loadClients: loadClients,
    viewClientDetails: viewClientDetails,
    editClient: editClient,
    deleteClient: deleteClient
  };
}(); // Make module globally available


window.ClientsModule = ClientsModule;
window.callClient = ClientsModule.callClient;
window.whatsAppClient = ClientsModule.whatsAppClient;
//# sourceMappingURL=clients.dev.js.map
