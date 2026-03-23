"use strict";

/**
 * Cars Module - Handles all car-related functionality
 */
var CarsModule = function () {
  // ==================== INITIALIZATION ====================
  function init() {
    console.log('🚗 Cars Module Initialized');
    loadCars();
    bindEvents();
  }

  function bindEvents() {
    var addForm = document.getElementById('add-car-form');

    if (addForm) {
      addForm.addEventListener('submit', addCar);
    }

    var editForm = document.getElementById('edit-car-form');

    if (editForm) {
      editForm.addEventListener('submit', updateCar);
    }
  } // ==================== LOAD CARS ====================


  function loadCars() {
    var container, cars;
    return regeneratorRuntime.async(function loadCars$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            container = document.getElementById('cars-container');

            if (container) {
              _context.next = 3;
              break;
            }

            return _context.abrupt("return");

          case 3:
            _context.prev = 3;
            container.innerHTML = '<div class="loading-overlay"><div class="loading-spinner"><div class="spinner"></div><p>جاري تحميل السيارات...</p></div></div>';
            _context.next = 7;
            return regeneratorRuntime.awrap(API.getCars());

          case 7:
            cars = _context.sent;
            displayCars(cars);
            _context.next = 16;
            break;

          case 11:
            _context.prev = 11;
            _context.t0 = _context["catch"](3);
            console.error('Error loading cars:', _context.t0);
            container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-triangle-exclamation"></i><h3>خطأ في تحميل السيارات</h3><p>يرجى المحاولة مرة أخرى</p></div>';
            App.showToast('فشل تحميل السيارات', 'error');

          case 16:
          case "end":
            return _context.stop();
        }
      }
    }, null, null, [[3, 11]]);
  } // ==================== DISPLAY CARS ====================


  function displayCars(cars) {
    var container = document.getElementById('cars-container');
    if (!container) return;

    if (!cars || cars.length === 0) {
      container.innerHTML = "\n                <div class=\"empty-state\">\n                    <i class=\"fa-solid fa-car-side\"></i>\n                    <h3>\u0644\u0627 \u062A\u0648\u062C\u062F \u0633\u064A\u0627\u0631\u0627\u062A</h3>\n                    <p>\u0623\u0636\u0641 \u0623\u0648\u0644 \u0633\u064A\u0627\u0631\u0629 \u0644\u0644\u0628\u062F\u0621</p>\n                    <button type=\"button\" class=\"btn btn-primary\" onclick=\"App.showAddScreen()\">\n                        <i class=\"fa-solid fa-plus\"></i> \u0625\u0636\u0627\u0641\u0629 \u0633\u064A\u0627\u0631\u0629\n                    </button>\n                </div>\n            ";
      return;
    }

    var html = '';
    cars.forEach(function (car) {
      html += createCarCard(car);
    });
    container.innerHTML = html;
  }

  function createCarCard(car) {
    return "\n            <div class=\"car-card\" onclick=\"CarsModule.viewCarDetails('".concat(car.id, "')\">\n                <div style=\"display: flex; align-items: center; gap: 1rem;\">\n                    <div class=\"car-icon\">\n                        <i class=\"fa-solid fa-car\"></i>\n                    </div>\n                    <div class=\"car-info\" style=\"flex: 1;\">\n                        <div class=\"car-name\">").concat(App.escapeHtml(car.brand || ''), " ").concat(App.escapeHtml(car.model || ''), " ").concat(App.escapeHtml(car.year || ''), "</div>\n                        <div class=\"car-details\">\n                            ").concat(car.condition ? "<span><i class=\"fa-solid fa-clipboard-check\"></i> ".concat(App.escapeHtml(car.condition), "</span>") : '', "\n                            ").concat(car.paint ? "<span><i class=\"fa-solid fa-palette\"></i> ".concat(App.escapeHtml(car.paint), "</span>") : '', "\n                            ").concat(car.category ? "<span><i class=\"fa-solid fa-tag\"></i> ".concat(App.escapeHtml(car.category), "</span>") : '', "\n                        </div>\n                        <div class=\"car-price\">\n                            ").concat(car.price ? App.formatPrice(car.price) : 'السعر عند الطلب', "\n                        </div>\n                    </div>\n                    <div class=\"car-actions\" onclick=\"event.stopPropagation()\">\n                        <button type=\"button\" class=\"btn-icon btn-edit\" onclick=\"CarsModule.editCar('").concat(car.id, "')\" title=\"\u062A\u0639\u062F\u064A\u0644\">\n                            <i class=\"fa-solid fa-pen\"></i>\n                        </button>\n                        <button type=\"button\" class=\"btn-icon btn-delete\" onclick=\"CarsModule.deleteCar('").concat(car.id, "')\" title=\"\u062D\u0630\u0641\">\n                            <i class=\"fa-solid fa-trash\"></i>\n                        </button>\n                    </div>\n                </div>\n            </div>\n        ");
  } // ==================== VIEW CAR DETAILS ====================


  function viewCarDetails(carId) {
    var car, container;
    return regeneratorRuntime.async(function viewCarDetails$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            _context2.next = 3;
            return regeneratorRuntime.awrap(API.getCar(carId));

          case 3:
            car = _context2.sent;
            container = document.getElementById('car-details-container');

            if (container) {
              _context2.next = 7;
              break;
            }

            return _context2.abrupt("return");

          case 7:
            container.innerHTML = "\n                <div class=\"car-details-view\">\n                    <div class=\"detail-header\">\n                        <i class=\"fa-solid fa-car\"></i>\n                        <h3>".concat(App.escapeHtml(car.brand || ''), " ").concat(App.escapeHtml(car.model || ''), " ").concat(App.escapeHtml(car.year || ''), "</h3>\n                    </div>\n                    \n                    <div style=\"background: var(--card-bg); padding: 1.5rem; border-radius: 16px;\">\n                        <div style=\"display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;\">\n                            <div><strong>\u0627\u0644\u062D\u0627\u0644\u0629:</strong> ").concat(App.escapeHtml(car.condition || 'غير محدد'), "</div>\n                            <div><strong>\u0627\u0644\u0644\u0648\u0646:</strong> ").concat(App.escapeHtml(car.paint || 'غير محدد'), "</div>\n                            <div><strong>\u0627\u0644\u0641\u0626\u0629:</strong> ").concat(App.escapeHtml(car.category || 'غير محدد'), "</div>\n                            <div><strong>\u0627\u0644\u0633\u0639\u0631:</strong> ").concat(car.price ? App.formatPrice(car.price) : 'السعر عند الطلب', "</div>\n                        </div>\n                    </div>\n                    \n                    <div style=\"display: flex; gap: 1rem; margin-top: 1.5rem;\">\n                        <button type=\"button\" class=\"btn btn-warning\" onclick=\"CarsModule.editCar('").concat(car.id, "')\" style=\"flex: 1;\">\n                            <i class=\"fa-solid fa-pen\"></i> \u062A\u0639\u062F\u064A\u0644\n                        </button>\n                        <button type=\"button\" class=\"btn btn-danger\" onclick=\"CarsModule.deleteCar('").concat(car.id, "')\" style=\"flex: 1;\">\n                            <i class=\"fa-solid fa-trash\"></i> \u062D\u0630\u0641\n                        </button>\n                    </div>\n                </div>\n            ");
            App.showScreen('car-details');
            _context2.next = 15;
            break;

          case 11:
            _context2.prev = 11;
            _context2.t0 = _context2["catch"](0);
            console.error('Error viewing car:', _context2.t0);
            App.showToast('فشل تحميل تفاصيل السيارة', 'error');

          case 15:
          case "end":
            return _context2.stop();
        }
      }
    }, null, null, [[0, 11]]);
  } // ==================== ADD CAR ====================


  function addCar(e) {
    var carData;
    return regeneratorRuntime.async(function addCar$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            e.preventDefault();
            carData = {
              brand: document.getElementById('add-car-brand').value.trim(),
              model: document.getElementById('add-car-model').value.trim(),
              year: document.getElementById('add-car-year').value.trim(),
              condition: document.getElementById('add-car-condition').value,
              paint: document.getElementById('add-car-paint').value.trim(),
              category: document.getElementById('add-car-category').value,
              price: document.getElementById('add-car-price').value.trim()
            };

            if (!(!carData.brand || !carData.model || !carData.year || !carData.condition || !carData.paint || !carData.category)) {
              _context3.next = 5;
              break;
            }

            App.showToast('جميع الحقول مطلوبة', 'error');
            return _context3.abrupt("return");

          case 5:
            _context3.prev = 5;
            _context3.next = 8;
            return regeneratorRuntime.awrap(API.addCar(carData));

          case 8:
            App.showToast('تم إضافة السيارة بنجاح', 'success');
            document.getElementById('add-car-form').reset();
            _context3.next = 12;
            return regeneratorRuntime.awrap(loadCars());

          case 12:
            App.showScreen('cars-list');
            _context3.next = 19;
            break;

          case 15:
            _context3.prev = 15;
            _context3.t0 = _context3["catch"](5);
            console.error('Error adding car:', _context3.t0);
            App.showToast('فشل إضافة السيارة', 'error');

          case 19:
          case "end":
            return _context3.stop();
        }
      }
    }, null, null, [[5, 15]]);
  } // ==================== EDIT CAR ====================


  function editCar(carId) {
    var car;
    return regeneratorRuntime.async(function editCar$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;
            _context4.next = 3;
            return regeneratorRuntime.awrap(API.getCar(carId));

          case 3:
            car = _context4.sent;
            document.getElementById('edit-car-brand').value = car.brand || '';
            document.getElementById('edit-car-model').value = car.model || '';
            document.getElementById('edit-car-year').value = car.year || '';
            document.getElementById('edit-car-condition').value = car.condition || '';
            document.getElementById('edit-car-paint').value = car.paint || '';
            document.getElementById('edit-car-category').value = car.category || '';
            document.getElementById('edit-car-price').value = car.price || '';
            document.getElementById('update-car').dataset.carId = carId;
            App.showScreen('edit-car');
            _context4.next = 19;
            break;

          case 15:
            _context4.prev = 15;
            _context4.t0 = _context4["catch"](0);
            console.error('Error editing car:', _context4.t0);
            App.showToast('فشل تحميل السيارة للتعديل', 'error');

          case 19:
          case "end":
            return _context4.stop();
        }
      }
    }, null, null, [[0, 15]]);
  } // ==================== UPDATE CAR ====================


  function updateCar(e) {
    var carId, carData;
    return regeneratorRuntime.async(function updateCar$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            e.preventDefault();
            carId = document.getElementById('update-car').dataset.carId;

            if (carId) {
              _context5.next = 4;
              break;
            }

            return _context5.abrupt("return");

          case 4:
            carData = {
              brand: document.getElementById('edit-car-brand').value.trim(),
              model: document.getElementById('edit-car-model').value.trim(),
              year: document.getElementById('edit-car-year').value.trim(),
              condition: document.getElementById('edit-car-condition').value,
              paint: document.getElementById('edit-car-paint').value.trim(),
              category: document.getElementById('edit-car-category').value,
              price: document.getElementById('edit-car-price').value.trim()
            };

            if (!(!carData.brand || !carData.model || !carData.year || !carData.condition || !carData.paint || !carData.category)) {
              _context5.next = 8;
              break;
            }

            App.showToast('جميع الحقول مطلوبة', 'error');
            return _context5.abrupt("return");

          case 8:
            _context5.prev = 8;
            _context5.next = 11;
            return regeneratorRuntime.awrap(API.updateCar(carId, carData));

          case 11:
            App.showToast('تم تحديث السيارة بنجاح', 'success');
            _context5.next = 14;
            return regeneratorRuntime.awrap(loadCars());

          case 14:
            App.showScreen('cars-list');
            _context5.next = 21;
            break;

          case 17:
            _context5.prev = 17;
            _context5.t0 = _context5["catch"](8);
            console.error('Error updating car:', _context5.t0);
            App.showToast('فشل تحديث السيارة', 'error');

          case 21:
          case "end":
            return _context5.stop();
        }
      }
    }, null, null, [[8, 17]]);
  } // ==================== DELETE CAR ====================


  function deleteCar(carId) {
    return regeneratorRuntime.async(function deleteCar$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            if (confirm('هل أنت متأكد من حذف هذه السيارة؟')) {
              _context6.next = 2;
              break;
            }

            return _context6.abrupt("return");

          case 2:
            _context6.prev = 2;
            _context6.next = 5;
            return regeneratorRuntime.awrap(API.deleteCar(carId));

          case 5:
            App.showToast('تم حذف السيارة بنجاح', 'success');
            _context6.next = 8;
            return regeneratorRuntime.awrap(loadCars());

          case 8:
            _context6.next = 14;
            break;

          case 10:
            _context6.prev = 10;
            _context6.t0 = _context6["catch"](2);
            console.error('Error deleting car:', _context6.t0);
            App.showToast('فشل حذف السيارة', 'error');

          case 14:
          case "end":
            return _context6.stop();
        }
      }
    }, null, null, [[2, 10]]);
  } // Public API


  return {
    init: init,
    loadCars: loadCars,
    viewCarDetails: viewCarDetails,
    editCar: editCar,
    deleteCar: deleteCar
  };
}();

window.CarsModule = CarsModule;
//# sourceMappingURL=cars.dev.js.map
