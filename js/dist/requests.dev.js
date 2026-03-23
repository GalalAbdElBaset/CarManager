"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

// ==================== REQUESTS MODULE ====================
// Load clients for request form
function loadClientsForRequest() {
  var select, clients, option;
  return regeneratorRuntime.async(function loadClientsForRequest$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          select = document.getElementById('request-client');

          if (select) {
            _context.next = 3;
            break;
          }

          return _context.abrupt("return");

        case 3:
          select.innerHTML = '<option value="" disabled selected>Select Client</option>';
          _context.prev = 4;
          _context.next = 7;
          return regeneratorRuntime.awrap(API.getClients());

        case 7:
          clients = _context.sent;

          if (!(!clients || clients.length === 0)) {
            _context.next = 15;
            break;
          }

          option = document.createElement('option');
          option.value = '';
          option.disabled = true;
          option.textContent = 'No clients available. Please add clients first.';
          select.appendChild(option);
          return _context.abrupt("return");

        case 15:
          clients.forEach(function (client) {
            var option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;
            select.appendChild(option);
          });
          _context.next = 21;
          break;

        case 18:
          _context.prev = 18;
          _context.t0 = _context["catch"](4);
          console.error('Error loading clients:', _context.t0);

        case 21:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[4, 18]]);
} // Load cars for request form


function loadCarsForRequest() {
  var select, cars, option;
  return regeneratorRuntime.async(function loadCarsForRequest$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          select = document.getElementById('request-car');

          if (select) {
            _context2.next = 3;
            break;
          }

          return _context2.abrupt("return");

        case 3:
          select.innerHTML = '<option value="" disabled selected>Select Car</option>';
          _context2.prev = 4;
          _context2.next = 7;
          return regeneratorRuntime.awrap(API.getCars());

        case 7:
          cars = _context2.sent;

          if (!(!cars || cars.length === 0)) {
            _context2.next = 15;
            break;
          }

          option = document.createElement('option');
          option.value = '';
          option.disabled = true;
          option.textContent = 'No cars available. Please add cars first.';
          select.appendChild(option);
          return _context2.abrupt("return");

        case 15:
          cars.forEach(function (car) {
            var option = document.createElement('option');
            option.value = car.id;
            option.textContent = "".concat(car.brand || '', " ").concat(car.model || '', " (").concat(car.year || '', ") - ").concat(car.price || '0', " EGP");
            select.appendChild(option);
          });
          _context2.next = 21;
          break;

        case 18:
          _context2.prev = 18;
          _context2.t0 = _context2["catch"](4);
          console.error('Error loading cars:', _context2.t0);

        case 21:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[4, 18]]);
} // Load clients for edit form


function loadClientsForEdit(selectedClientId) {
  var select, clients, option;
  return regeneratorRuntime.async(function loadClientsForEdit$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          select = document.getElementById('edit-request-client');

          if (select) {
            _context3.next = 3;
            break;
          }

          return _context3.abrupt("return");

        case 3:
          select.innerHTML = '<option value="" disabled>Select Client</option>';
          _context3.prev = 4;
          _context3.next = 7;
          return regeneratorRuntime.awrap(API.getClients());

        case 7:
          clients = _context3.sent;

          if (!(!clients || clients.length === 0)) {
            _context3.next = 15;
            break;
          }

          option = document.createElement('option');
          option.value = '';
          option.disabled = true;
          option.textContent = 'No clients available. Please add clients first.';
          select.appendChild(option);
          return _context3.abrupt("return");

        case 15:
          clients.forEach(function (client) {
            var option = document.createElement('option');
            option.value = client.id;
            option.textContent = client.name;

            if (client.id === selectedClientId) {
              option.selected = true;
            }

            select.appendChild(option);
          });
          _context3.next = 21;
          break;

        case 18:
          _context3.prev = 18;
          _context3.t0 = _context3["catch"](4);
          console.error('Error loading clients for edit:', _context3.t0);

        case 21:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[4, 18]]);
} // Load cars for edit form


function loadCarsForEdit(selectedCarId) {
  var select, cars, option, deletedCarOption;
  return regeneratorRuntime.async(function loadCarsForEdit$(_context4) {
    while (1) {
      switch (_context4.prev = _context4.next) {
        case 0:
          select = document.getElementById('edit-request-car');

          if (select) {
            _context4.next = 3;
            break;
          }

          return _context4.abrupt("return");

        case 3:
          select.innerHTML = '<option value="" disabled>Select Car</option>';
          _context4.prev = 4;
          _context4.next = 7;
          return regeneratorRuntime.awrap(API.getCars());

        case 7:
          cars = _context4.sent;

          if (!(!cars || cars.length === 0)) {
            _context4.next = 15;
            break;
          }

          option = document.createElement('option');
          option.value = '';
          option.disabled = true;
          option.textContent = 'No cars available. Please add cars first.';
          select.appendChild(option);
          return _context4.abrupt("return");

        case 15:
          cars.forEach(function (car) {
            var option = document.createElement('option');
            option.value = car.id;
            option.textContent = "".concat(car.brand || '', " ").concat(car.model || '', " (").concat(car.year || '', ") - ").concat(car.price || '0', " EGP");

            if (car.id === selectedCarId) {
              option.selected = true;
            }

            select.appendChild(option);
          });

          if (selectedCarId && !cars.some(function (car) {
            return car.id === selectedCarId;
          })) {
            deletedCarOption = document.createElement('option');
            deletedCarOption.value = selectedCarId;
            deletedCarOption.disabled = true;
            deletedCarOption.textContent = '⚠️ The car no longer exists (it has been deleted)';
            deletedCarOption.style.backgroundColor = '#fff3f3';
            deletedCarOption.style.color = '#d32f2f';
            select.appendChild(deletedCarOption);
            deletedCarOption.selected = true;
          }

          _context4.next = 22;
          break;

        case 19:
          _context4.prev = 19;
          _context4.t0 = _context4["catch"](4);
          console.error('Error loading cars for edit:', _context4.t0);

        case 22:
        case "end":
          return _context4.stop();
      }
    }
  }, null, null, [[4, 19]]);
} // Load all requests


function loadRequests() {
  var _ref, _ref2, requests, clients, cars;

  return regeneratorRuntime.async(function loadRequests$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          showLoading(true);
          _context5.prev = 1;
          _context5.next = 4;
          return regeneratorRuntime.awrap(Promise.all([API.getRequests(), API.getClients(), API.getCars()]));

        case 4:
          _ref = _context5.sent;
          _ref2 = _slicedToArray(_ref, 3);
          requests = _ref2[0];
          clients = _ref2[1];
          cars = _ref2[2];
          renderRequests(requests, clients, cars);
          _context5.next = 16;
          break;

        case 12:
          _context5.prev = 12;
          _context5.t0 = _context5["catch"](1);
          console.error('Error loading requests:', _context5.t0);
          showToast('Failed to load requests', 'error');

        case 16:
          _context5.prev = 16;
          showLoading(false);
          return _context5.finish(16);

        case 19:
        case "end":
          return _context5.stop();
      }
    }
  }, null, null, [[1, 12, 16, 19]]);
} // Check if car exists


function isCarExists(carId, cars) {
  return cars && cars.some(function (car) {
    return car.id === carId;
  });
} // Render requests


function renderRequests(requests, clients, cars) {
  var list = document.querySelector('[data-screen="requests-list"] .content');
  if (!list) return;
  list.innerHTML = '';

  if (!requests || !requests.length) {
    list.innerHTML = "\n            <div class=\"empty-state\">\n                <i class=\"fa-solid fa-file-lines\"></i>\n                <h3>No Requests Yet</h3>\n                <p>Create your first request to get started</p>\n            </div>\n        ";
    return;
  }

  requests.forEach(function (req) {
    var client = clients.find(function (c) {
      return c.id === req.clientId;
    });
    var car = cars.find(function (c) {
      return c.id === req.carId;
    });
    var carExists = isCarExists(req.carId, cars);
    var statusClass = req.status === 'active' ? 'status-active' : req.status === 'completed' ? 'status-completed' : 'status-pending';
    var card = document.createElement('div');
    card.className = 'request-card';

    if (!carExists) {
      card.classList.add('warning');
    }

    var carDisplay = '';

    if (carExists && car) {
      carDisplay = "".concat(car.brand || '', " ").concat(car.model || '', " (").concat(car.year || '', ")");
    } else if (req.carDetails) {
      carDisplay = "".concat(req.carDetails.brand || '', " ").concat(req.carDetails.model || '', " (").concat(req.carDetails.year || '', ")");
    } else {
      carDisplay = '⚠️ Car no longer available';
    }

    var priceDisplay = '';

    if (carExists && car) {
      priceDisplay = (car.price || '0') + ' EGP';
    } else if (req.carDetails && req.carDetails.price) {
      priceDisplay = req.carDetails.price + ' EGP (old)';
    } else {
      priceDisplay = 'unavailable';
    }

    card.innerHTML = "\n            <div class=\"request-header\">\n                <h4>".concat(escapeHtml(req.title), "</h4>\n                <span class=\"status ").concat(statusClass, "\">").concat(escapeHtml(req.status), "</span>\n            </div>\n            \n            <div class=\"request-details\">\n                <p><i class=\"fa-solid fa-user\"></i> Client: ").concat(client ? escapeHtml(client.name) : 'Unknown', "</p>\n                <p><i class=\"fa-solid fa-car\"></i> Car: ").concat(escapeHtml(carDisplay), "</p>\n                <p><i class=\"fa-solid fa-tag\"></i> Price: ").concat(escapeHtml(priceDisplay), "</p>\n                ").concat(!carExists ? '<p class="warning-text"><i class="fa-solid fa-exclamation-triangle"></i> This car has been removed from the system.</p>' : '', "\n            </div>\n\n            <div class=\"request-actions\">\n                <button type=\"button\" class=\"btn-icon btn-view\" data-view-request=\"").concat(req.id, "\">\n                    <i class=\"fa-solid fa-eye\"></i>\n                </button>\n                <button type=\"button\" class=\"btn-icon btn-edit\" data-edit-request=\"").concat(req.id, "\">\n                    <i class=\"fa-solid fa-pen\"></i>\n                </button>\n                <button type=\"button\" class=\"btn-icon btn-delete\" data-delete-request=\"").concat(req.id, "\">\n                    <i class=\"fa-solid fa-trash\"></i>\n                </button>\n            </div>\n        ");
    list.appendChild(card);
  }); // Add animation

  setTimeout(function () {
    var cards = list.querySelectorAll('.request-card');
    cards.forEach(function (card, index) {
      card.style.animationDelay = "".concat(index * 50, "ms");
      card.classList.add('animate-in');
    });
  }, 100);
} // Add request


function addRequest(clientId, carId, status) {
  var _ref3, _ref4, requests, clients, cars, client, car, title, newRequest;

  return regeneratorRuntime.async(function addRequest$(_context6) {
    while (1) {
      switch (_context6.prev = _context6.next) {
        case 0:
          if (!(!clientId || !carId)) {
            _context6.next = 3;
            break;
          }

          showToast('Please select client and car', 'error');
          return _context6.abrupt("return");

        case 3:
          showLoading(true);
          _context6.prev = 4;
          _context6.next = 7;
          return regeneratorRuntime.awrap(Promise.all([API.getRequests(), API.getClients(), API.getCars()]));

        case 7:
          _ref3 = _context6.sent;
          _ref4 = _slicedToArray(_ref3, 3);
          requests = _ref4[0];
          clients = _ref4[1];
          cars = _ref4[2];
          client = clients.find(function (c) {
            return c.id === clientId;
          });
          car = cars.find(function (c) {
            return c.id === carId;
          });

          if (client) {
            _context6.next = 17;
            break;
          }

          showToast('Client not found', 'error');
          return _context6.abrupt("return");

        case 17:
          if (car) {
            _context6.next = 20;
            break;
          }

          showToast('Car not found', 'error');
          return _context6.abrupt("return");

        case 20:
          title = "".concat(car.brand, " ").concat(car.model, " - Request");
          newRequest = {
            title: title,
            clientId: clientId,
            carId: carId,
            carDetails: {
              brand: car.brand,
              model: car.model,
              year: car.year,
              price: car.price,
              paint: car.paint,
              condition: car.condition,
              category: car.category
            },
            clientName: client.name,
            status: status || "active",
            createdAt: new Date().toISOString()
          };
          _context6.next = 24;
          return regeneratorRuntime.awrap(API.addRequest(newRequest));

        case 24:
          showToast('Request added successfully', 'success');
          document.getElementById('request-client').value = '';
          document.getElementById('request-car').value = '';
          document.getElementById('request-status').value = 'active';
          loadRequests();
          showScreen('requests-list');
          _context6.next = 36;
          break;

        case 32:
          _context6.prev = 32;
          _context6.t0 = _context6["catch"](4);
          console.error('Error adding request:', _context6.t0);
          showToast('Failed to add request', 'error');

        case 36:
          _context6.prev = 36;
          showLoading(false);
          return _context6.finish(36);

        case 39:
        case "end":
          return _context6.stop();
      }
    }
  }, null, null, [[4, 32, 36, 39]]);
} // Load request details


function loadRequestDetails(id) {
  var _ref5, _ref6, request, clients, cars, client, car, carExists;

  return regeneratorRuntime.async(function loadRequestDetails$(_context7) {
    while (1) {
      switch (_context7.prev = _context7.next) {
        case 0:
          showLoading(true);
          _context7.prev = 1;
          _context7.next = 4;
          return regeneratorRuntime.awrap(Promise.all([API.getRequest(id), API.getClients(), API.getCars()]));

        case 4:
          _ref5 = _context7.sent;
          _ref6 = _slicedToArray(_ref5, 3);
          request = _ref6[0];
          clients = _ref6[1];
          cars = _ref6[2];

          if (request) {
            _context7.next = 12;
            break;
          }

          showToast('Request not found', 'error');
          return _context7.abrupt("return");

        case 12:
          client = clients.find(function (c) {
            return c.id === request.clientId;
          });
          car = cars.find(function (c) {
            return c.id === request.carId;
          });
          carExists = isCarExists(request.carId, cars);
          renderRequestDetails(request, client, car, carExists);
          showScreen('request-details');
          _context7.next = 23;
          break;

        case 19:
          _context7.prev = 19;
          _context7.t0 = _context7["catch"](1);
          console.error('Error loading request details:', _context7.t0);
          showToast('Failed to load request details', 'error');

        case 23:
          _context7.prev = 23;
          showLoading(false);
          return _context7.finish(23);

        case 26:
        case "end":
          return _context7.stop();
      }
    }
  }, null, null, [[1, 19, 23, 26]]);
} // Render request details


function renderRequestDetails(request, client, car, carExists) {
  var box = document.querySelector('[data-screen="request-details"] .content');
  if (!box) return;
  var statusClass = request.status === 'active' ? 'status-active' : request.status === 'completed' ? 'status-completed' : 'status-pending';
  var carData = carExists && car ? car : request.carDetails || {};
  var carDisplay = '';

  if (carExists && car) {
    carDisplay = "".concat(car.brand || '', " ").concat(car.model || '', " (").concat(car.year || '', ")");
  } else if (request.carDetails) {
    carDisplay = "".concat(request.carDetails.brand || '', " ").concat(request.carDetails.model || '', " (").concat(request.carDetails.year || '', ")");
  } else {
    carDisplay = 'not available';
  }

  var warningMessage = '';

  if (!carExists) {
    warningMessage = "\n            <div class=\"warning-message\">\n                <i class=\"fa-solid fa-exclamation-triangle\"></i> \n                <strong>Warning:</strong> This vehicle has been removed from the system. The data shown is from when the request was created.\n            </div>";
  }

  box.innerHTML = "\n        <div class=\"card\">\n            <h3>".concat(escapeHtml(request.title), "</h3>\n            <hr>\n            ").concat(warningMessage, "\n            <p><strong><i class=\"fa-solid fa-user\"></i> Client:</strong> ").concat(client ? escapeHtml(client.name) : '-', "</p>\n            <p><strong><i class=\"fa-solid fa-car\"></i> Car:</strong> ").concat(escapeHtml(carDisplay), "</p>\n            <p><strong><i class=\"fa-solid fa-palette\"></i> Paint:</strong> ").concat(escapeHtml(carData.paint || 'N/A'), "</p>\n            <p><strong><i class=\"fa-solid fa-clipboard-list\"></i> Condition:</strong> ").concat(escapeHtml(carData.condition || 'N/A'), "</p>\n            <p><strong><i class=\"fa-solid fa-tag\"></i> Category:</strong> ").concat(escapeHtml(carData.category || 'N/A'), "</p>\n            <p><strong><i class=\"fa-solid fa-tag\"></i> Price:</strong> ").concat(escapeHtml(carData.price ? carData.price + ' EGP' : 'N/A'), " ").concat(!carExists && carData.price ? '(old)' : '', "</p>\n            <p>\n                <strong>Status:</strong>\n                <span class=\"status ").concat(statusClass, "\">\n                    ").concat(escapeHtml(request.status), "\n                </span>\n            </p>\n            <p><strong>Created:</strong> ").concat(new Date(request.createdAt).toLocaleDateString(), "</p>\n        </div>\n\n        <div class=\"action-buttons\">\n            <button type=\"button\" class=\"btn btn-secondary\" data-go=\"requests-list\">\n                <i class=\"fa-solid fa-arrow-left\"></i> Back\n            </button>\n            <button type=\"button\" class=\"btn btn-warning\" data-edit-request=\"").concat(request.id, "\">\n                <i class=\"fa-solid fa-pen\"></i> Edit\n            </button>\n            <button type=\"button\" class=\"btn btn-danger\" data-delete-request=\"").concat(request.id, "\">\n                <i class=\"fa-solid fa-trash\"></i> Delete\n            </button>\n        </div>\n    ");
} // Edit request


function editRequest(id) {
  var request, statusSelect;
  return regeneratorRuntime.async(function editRequest$(_context8) {
    while (1) {
      switch (_context8.prev = _context8.next) {
        case 0:
          showLoading(true);
          _context8.prev = 1;
          _context8.next = 4;
          return regeneratorRuntime.awrap(API.getRequest(id));

        case 4:
          request = _context8.sent;

          if (request) {
            _context8.next = 8;
            break;
          }

          showToast('Request not found', 'error');
          return _context8.abrupt("return");

        case 8:
          _context8.next = 10;
          return regeneratorRuntime.awrap(loadClientsForEdit(request.clientId));

        case 10:
          _context8.next = 12;
          return regeneratorRuntime.awrap(loadCarsForEdit(request.carId));

        case 12:
          statusSelect = document.getElementById('edit-request-status');

          if (statusSelect) {
            statusSelect.value = request.status || 'active';
          }

          document.getElementById('update-request').dataset.id = id;
          showScreen('edit-request');
          _context8.next = 22;
          break;

        case 18:
          _context8.prev = 18;
          _context8.t0 = _context8["catch"](1);
          console.error('Error loading request for edit:', _context8.t0);
          showToast('Failed to load request data', 'error');

        case 22:
          _context8.prev = 22;
          showLoading(false);
          return _context8.finish(22);

        case 25:
        case "end":
          return _context8.stop();
      }
    }
  }, null, null, [[1, 18, 22, 25]]);
} // Update request


function updateRequest(e) {
  var id, clientId, carId, status, _ref7, _ref8, requests, cars, clients, requestIndex, car, client, updatedRequest;

  return regeneratorRuntime.async(function updateRequest$(_context9) {
    while (1) {
      switch (_context9.prev = _context9.next) {
        case 0:
          e.preventDefault();
          id = document.getElementById('update-request').dataset.id;
          clientId = document.getElementById('edit-request-client').value;
          carId = document.getElementById('edit-request-car').value;
          status = document.getElementById('edit-request-status').value;

          if (!(!clientId || !carId)) {
            _context9.next = 8;
            break;
          }

          showToast('Please select both client and car', 'error');
          return _context9.abrupt("return");

        case 8:
          showLoading(true);
          _context9.prev = 9;
          _context9.next = 12;
          return regeneratorRuntime.awrap(Promise.all([API.getRequests(), API.getCars(), API.getClients()]));

        case 12:
          _ref7 = _context9.sent;
          _ref8 = _slicedToArray(_ref7, 3);
          requests = _ref8[0];
          cars = _ref8[1];
          clients = _ref8[2];
          requestIndex = requests.findIndex(function (r) {
            return r.id === id;
          });
          car = cars.find(function (c) {
            return c.id === carId;
          });
          client = clients.find(function (c) {
            return c.id === clientId;
          });

          if (!(requestIndex !== -1)) {
            _context9.next = 28;
            break;
          }

          if (client) {
            _context9.next = 24;
            break;
          }

          showToast('Client not found', 'error');
          return _context9.abrupt("return");

        case 24:
          updatedRequest = _objectSpread({}, requests[requestIndex], {
            clientId: clientId,
            carId: carId,
            clientName: client.name,
            status: status || "active",
            updatedAt: new Date().toISOString()
          });

          if (car) {
            updatedRequest.carDetails = {
              brand: car.brand,
              model: car.model,
              year: car.year,
              price: car.price,
              paint: car.paint,
              condition: car.condition,
              category: car.category
            };
            updatedRequest.title = "".concat(car.brand, " ").concat(car.model, " - Request");
          }

          _context9.next = 28;
          return regeneratorRuntime.awrap(API.updateRequest(id, updatedRequest));

        case 28:
          showToast('Request updated successfully', 'success');
          loadRequests();
          showScreen('requests-list');
          _context9.next = 37;
          break;

        case 33:
          _context9.prev = 33;
          _context9.t0 = _context9["catch"](9);
          console.error('Error updating request:', _context9.t0);
          showToast('Failed to update request', 'error');

        case 37:
          _context9.prev = 37;
          showLoading(false);
          return _context9.finish(37);

        case 40:
        case "end":
          return _context9.stop();
      }
    }
  }, null, null, [[9, 33, 37, 40]]);
} // Delete request


function deleteRequest(id) {
  return regeneratorRuntime.async(function deleteRequest$(_context10) {
    while (1) {
      switch (_context10.prev = _context10.next) {
        case 0:
          if (confirm('Are you sure you want to delete this request?')) {
            _context10.next = 2;
            break;
          }

          return _context10.abrupt("return");

        case 2:
          showLoading(true);
          _context10.prev = 3;
          _context10.next = 6;
          return regeneratorRuntime.awrap(API.deleteRequest(id));

        case 6:
          showToast('Request deleted successfully', 'success');
          loadRequests();
          showScreen('requests-list');
          _context10.next = 15;
          break;

        case 11:
          _context10.prev = 11;
          _context10.t0 = _context10["catch"](3);
          console.error('Error deleting request:', _context10.t0);
          showToast('Failed to delete request', 'error');

        case 15:
          _context10.prev = 15;
          showLoading(false);
          return _context10.finish(15);

        case 18:
        case "end":
          return _context10.stop();
      }
    }
  }, null, null, [[3, 11, 15, 18]]);
} // Show loading state


function showLoading(show) {
  var container = document.querySelector('[data-screen="requests-list"] .content');
  if (!container) return;

  if (show) {
    var loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading-overlay';
    loadingDiv.innerHTML = "\n            <div class=\"loading-spinner\">\n                <div class=\"spinner\"></div>\n                <p>Loading requests...</p>\n            </div>\n        ";
    container.appendChild(loadingDiv);
  } else {
    var loadingOverlay = container.querySelector('.loading-overlay');
    if (loadingOverlay) loadingOverlay.remove();
  }
} // Escape HTML


function escapeHtml(text) {
  if (!text) return '';
  var div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
} // Event listeners


document.addEventListener('DOMContentLoaded', function () {
  // View request buttons
  document.querySelectorAll('[data-view-request]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      loadRequestDetails(this.dataset.viewRequest);
    });
  }); // Delete request buttons

  document.querySelectorAll('[data-delete-request]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      deleteRequest(this.dataset.deleteRequest);
    });
  }); // Edit request buttons

  document.querySelectorAll('[data-edit-request]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      editRequest(this.dataset.editRequest);
    });
  }); // Save request button

  document.querySelectorAll('[data-save-request]').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var clientEl = document.getElementById('request-client');
      var carEl = document.getElementById('request-car');
      var statusEl = document.getElementById('request-status');

      if (!clientEl || !carEl) {
        showToast('Form not ready', 'error');
        return;
      }

      var clientId = clientEl.value;
      var carId = carEl.value;
      var status = statusEl ? statusEl.value : 'active';

      if (!clientId || !carId) {
        showToast('Please select both client and car', 'error');
        return;
      }

      addRequest(clientId, carId, status);
    });
  }); // Update request button

  var updateBtn = document.getElementById('update-request');

  if (updateBtn) {
    updateBtn.addEventListener('click', updateRequest);
  }
}); // Load data when entering add request screen

document.querySelectorAll('[data-go="add-request"]').forEach(function (btn) {
  btn.addEventListener('click', function () {
    setTimeout(function () {
      loadClientsForRequest();
      loadCarsForRequest();
    }, 100);
  });
}); // Make functions globally available

window.loadRequests = loadRequests;
window.loadRequestDetails = loadRequestDetails;
window.loadClientsForRequest = loadClientsForRequest;
window.loadCarsForRequest = loadCarsForRequest;
//# sourceMappingURL=requests.dev.js.map
