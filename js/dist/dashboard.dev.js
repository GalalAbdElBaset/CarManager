"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

/**
 * Dashboard Module - Statistics Only
 * Desktop only - Shows all statistics without tables
 */
var DashboardModule = function () {
  var isInitialized = false;
  var carsData = [];
  var clientsData = [];
  var requestsData = [];

  function init() {
    if (isInitialized) return;
    console.log('📊 Dashboard Module Initialized - Statistics Only');
    loadAllData();
    isInitialized = true;
  }

  function loadAllData() {
    var _ref, _ref2;

    return regeneratorRuntime.async(function loadAllData$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.prev = 0;
            _context.next = 3;
            return regeneratorRuntime.awrap(Promise.all([API.getCars(), API.getClients(), API.getRequests()]));

          case 3:
            _ref = _context.sent;
            _ref2 = _slicedToArray(_ref, 3);
            carsData = _ref2[0];
            clientsData = _ref2[1];
            requestsData = _ref2[2];
            loadMainStats();
            loadCarsStats();
            loadClientsStats();
            loadRequestsStats();
            _context.next = 18;
            break;

          case 14:
            _context.prev = 14;
            _context.t0 = _context["catch"](0);
            console.error('Error loading dashboard data:', _context.t0);
            App.showToast('Failed to load dashboard data', 'error');

          case 18:
          case "end":
            return _context.stop();
        }
      }
    }, null, null, [[0, 14]]);
  } // ========== MAIN STATS ==========


  function loadMainStats() {
    var totalSales = calculateTotalSales();
    document.getElementById('total-cars').textContent = carsData.length || 0;
    document.getElementById('total-sales').textContent = '$' + totalSales.toLocaleString();
    document.getElementById('total-clients').textContent = clientsData.length || 0;
    document.getElementById('total-requests').textContent = requestsData.length || 0;
  }

  function calculateTotalSales() {
    var completedRequests = requestsData.filter(function (r) {
      return r.status === 'completed';
    });

    var carIds = _toConsumableArray(new Set(completedRequests.map(function (r) {
      return r.carid;
    }).filter(function (id) {
      return id;
    })));

    var total = 0;
    carIds.forEach(function (carId) {
      var car = carsData.find(function (c) {
        return c.id == carId;
      });
      if (car && car.price) total += parseFloat(car.price);
    });
    return total;
  } // ========== CARS STATISTICS ==========


  function loadCarsStats() {
    // Available vs Rented (based on requests)
    var requestedCarIds = new Set(requestsData.map(function (r) {
      return r.carid;
    }).filter(function (id) {
      return id;
    }));
    var rentedCount = carsData.filter(function (c) {
      return requestedCarIds.has(c.id);
    }).length;
    var availableCount = carsData.length - rentedCount;
    document.getElementById('available-cars').textContent = availableCount;
    document.getElementById('rented-cars').textContent = rentedCount; // Average Price

    var totalPrice = carsData.reduce(function (sum, car) {
      return sum + (parseFloat(car.price) || 0);
    }, 0);
    var avgPrice = carsData.length > 0 ? totalPrice / carsData.length : 0;
    document.getElementById('avg-price').textContent = '$' + Math.round(avgPrice).toLocaleString(); // Min & Max Price

    var prices = carsData.map(function (c) {
      return parseFloat(c.price);
    }).filter(function (p) {
      return p > 0;
    });
    var minPrice = prices.length > 0 ? Math.min.apply(Math, _toConsumableArray(prices)) : 0;
    var maxPrice = prices.length > 0 ? Math.max.apply(Math, _toConsumableArray(prices)) : 0;
    document.getElementById('min-price').textContent = '$' + minPrice.toLocaleString();
    document.getElementById('max-price').textContent = '$' + maxPrice.toLocaleString(); // Most Popular Brand

    var brandCount = {};
    carsData.forEach(function (car) {
      if (car.brand) {
        brandCount[car.brand] = (brandCount[car.brand] || 0) + 1;
      }
    });
    var mostPopularBrand = '-';
    var maxBrandCount = 0;

    for (var _i2 = 0, _Object$entries = Object.entries(brandCount); _i2 < _Object$entries.length; _i2++) {
      var _Object$entries$_i = _slicedToArray(_Object$entries[_i2], 2),
          brand = _Object$entries$_i[0],
          count = _Object$entries$_i[1];

      if (count > maxBrandCount) {
        maxBrandCount = count;
        mostPopularBrand = brand;
      }
    }

    document.getElementById('most-popular-brand').textContent = mostPopularBrand; // Most Popular Model

    var modelCount = {};
    carsData.forEach(function (car) {
      if (car.model) {
        var key = "".concat(car.brand, " ").concat(car.model);
        modelCount[key] = (modelCount[key] || 0) + 1;
      }
    });
    var mostPopularModel = '-';
    var maxModelCount = 0;

    for (var _i3 = 0, _Object$entries2 = Object.entries(modelCount); _i3 < _Object$entries2.length; _i3++) {
      var _Object$entries2$_i = _slicedToArray(_Object$entries2[_i3], 2),
          model = _Object$entries2$_i[0],
          _count = _Object$entries2$_i[1];

      if (_count > maxModelCount) {
        maxModelCount = _count;
        mostPopularModel = model;
      }
    }

    document.getElementById('most-popular-model').textContent = mostPopularModel; // Most Popular Category

    var categoryCount = {};
    carsData.forEach(function (car) {
      if (car.category) {
        categoryCount[car.category] = (categoryCount[car.category] || 0) + 1;
      }
    });
    var mostPopularCategory = '-';
    var maxCategoryCount = 0;

    for (var _i4 = 0, _Object$entries3 = Object.entries(categoryCount); _i4 < _Object$entries3.length; _i4++) {
      var _Object$entries3$_i = _slicedToArray(_Object$entries3[_i4], 2),
          category = _Object$entries3$_i[0],
          _count2 = _Object$entries3$_i[1];

      if (_count2 > maxCategoryCount) {
        maxCategoryCount = _count2;
        mostPopularCategory = category;
      }
    }

    document.getElementById('most-popular-category').textContent = mostPopularCategory; // Most Popular Color

    var colorCount = {};
    carsData.forEach(function (car) {
      if (car.color) {
        colorCount[car.color] = (colorCount[car.color] || 0) + 1;
      }
    });
    var mostPopularColor = '-';
    var maxColorCount = 0;

    for (var _i5 = 0, _Object$entries4 = Object.entries(colorCount); _i5 < _Object$entries4.length; _i5++) {
      var _Object$entries4$_i = _slicedToArray(_Object$entries4[_i5], 2),
          color = _Object$entries4$_i[0],
          _count3 = _Object$entries4$_i[1];

      if (_count3 > maxColorCount) {
        maxColorCount = _count3;
        mostPopularColor = color;
      }
    }

    document.getElementById('most-popular-color').textContent = mostPopularColor; // Most Popular Condition

    var conditionCount = {};
    carsData.forEach(function (car) {
      if (car.condition) {
        conditionCount[car.condition] = (conditionCount[car.condition] || 0) + 1;
      }
    });
    var mostPopularCondition = '-';
    var maxConditionCount = 0;

    for (var _i6 = 0, _Object$entries5 = Object.entries(conditionCount); _i6 < _Object$entries5.length; _i6++) {
      var _Object$entries5$_i = _slicedToArray(_Object$entries5[_i6], 2),
          condition = _Object$entries5$_i[0],
          _count4 = _Object$entries5$_i[1];

      if (_count4 > maxConditionCount) {
        maxConditionCount = _count4;
        mostPopularCondition = condition;
      }
    } // Format condition for display


    var conditionMap = {
      'excellent': 'Excellent',
      'very_good': 'Very Good',
      'good': 'Good',
      'fair': 'Fair',
      'needs_maintenance': 'Needs Maintenance'
    };
    mostPopularCondition = conditionMap[mostPopularCondition] || mostPopularCondition;
    document.getElementById('most-popular-condition').textContent = mostPopularCondition;
  } // ========== CLIENTS STATISTICS ==========


  function loadClientsStats() {
    // New clients this month
    var now = new Date();
    var currentMonth = now.getMonth();
    var currentYear = now.getFullYear();
    var newClientsMonth = clientsData.filter(function (client) {
      if (!client.registeredat) return false;
      var date = new Date(client.registeredat);
      return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
    }).length;
    document.getElementById('new-clients-month').textContent = newClientsMonth; // New clients this week

    var currentWeekStart = new Date();
    currentWeekStart.setDate(now.getDate() - now.getDay());
    currentWeekStart.setHours(0, 0, 0, 0);
    var newClientsWeek = clientsData.filter(function (client) {
      if (!client.registeredat) return false;
      var date = new Date(client.registeredat);
      return date >= currentWeekStart;
    }).length;
    document.getElementById('new-clients-week').textContent = newClientsWeek; // Most Active Client (most requests)

    var clientRequestCount = {};
    requestsData.forEach(function (req) {
      if (req.clientid) {
        clientRequestCount[req.clientid] = (clientRequestCount[req.clientid] || 0) + 1;
      }
    });
    var mostActiveClient = '-';
    var maxRequests = 0;

    var _loop = function _loop() {
      var _Object$entries6$_i = _slicedToArray(_Object$entries6[_i7], 2),
          clientId = _Object$entries6$_i[0],
          count = _Object$entries6$_i[1];

      if (count > maxRequests) {
        maxRequests = count;
        var client = clientsData.find(function (c) {
          return c.id == clientId;
        });
        mostActiveClient = client ? client.name : '-';
      }
    };

    for (var _i7 = 0, _Object$entries6 = Object.entries(clientRequestCount); _i7 < _Object$entries6.length; _i7++) {
      _loop();
    }

    document.getElementById('most-active-client').textContent = mostActiveClient;
  } // ========== REQUESTS STATISTICS ==========


  function loadRequestsStats() {
    var active = requestsData.filter(function (r) {
      return r.status === 'active';
    }).length;
    var completed = requestsData.filter(function (r) {
      return r.status === 'completed';
    }).length;
    var pending = requestsData.filter(function (r) {
      return r.status === 'pending';
    }).length;
    document.getElementById('active-requests').textContent = active;
    document.getElementById('completed-requests').textContent = completed;
    document.getElementById('pending-requests').textContent = pending; // Completion Rate

    var total = requestsData.length;
    var completionRate = total > 0 ? Math.round(completed / total * 100) : 0;
    document.getElementById('completion-rate').textContent = completionRate + '%'; // Average Order Value (from completed requests)

    var completedRequests = requestsData.filter(function (r) {
      return r.status === 'completed';
    });
    var totalOrderValue = 0;
    completedRequests.forEach(function (req) {
      var car = carsData.find(function (c) {
        return c.id == req.carid;
      });
      if (car && car.price) totalOrderValue += parseFloat(car.price);
    });
    var avgOrderValue = completedRequests.length > 0 ? totalOrderValue / completedRequests.length : 0;
    document.getElementById('avg-order-value').textContent = '$' + Math.round(avgOrderValue).toLocaleString();
  }

  return {
    init: init
  };
}(); // Initialize on page load


document.addEventListener('DOMContentLoaded', function () {
  DashboardModule.init();
});
//# sourceMappingURL=dashboard.dev.js.map
