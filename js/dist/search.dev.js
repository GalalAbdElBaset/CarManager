"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance"); }

function _iterableToArrayLimit(arr, i) { if (!(Symbol.iterator in Object(arr) || Object.prototype.toString.call(arr) === "[object Arguments]")) { return; } var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

/**
 * Search Module - Handles all search functionality
 * Enhanced with separate search fields for each criterion
 */
var SearchModule = function () {
  var searchResults = [];
  var cachedData = {
    clients: [],
    requests: [],
    cars: []
  }; // Search criteria object

  var searchCriteria = {
    clientName: '',
    phone: '',
    email: '',
    request: '',
    carName: ''
  };
  var currentFilters = {
    type: '',
    status: '',
    brand: '',
    model: '',
    color: '',
    category: '',
    condition: ''
  };
  var debouncedSearch = App.debounce(performSearch, 300); // ==================== HELPER FUNCTIONS ====================

  /**
   * Normalize text for search (lowercase, trim)
   */

  function normalizeText(text) {
    if (!text) return '';
    return String(text).toLowerCase().trim();
  }
  /**
   * Normalize phone number for partial matching
   * Removes spaces, symbols, and country code prefix
   */


  function normalizePhone(phone) {
    if (!phone) return ''; // Remove all non-digit characters

    var normalized = String(phone).replace(/\D/g, ''); // Remove leading country code if present (keep last 10-12 digits)

    if (normalized.length > 10) {
      normalized = normalized.slice(-10);
    }

    return normalized;
  }
  /**
   * Check if a phone number matches a search term
   * Supports partial matching
   */


  function phoneMatches(phone, searchTerm) {
    if (!phone || !searchTerm) return false;
    var normalizedPhone = normalizePhone(phone);
    var normalizedSearch = normalizePhone(searchTerm);
    if (normalizedSearch.length === 0) return false; // Check if search term is contained in phone number

    return normalizedPhone.includes(normalizedSearch);
  }
  /**
   * Calculate Levenshtein distance between two strings
   * Lightweight fuzzy matching algorithm
   */


  function levenshteinDistance(str1, str2) {
    var s1 = normalizeText(str1);
    var s2 = normalizeText(str2);
    if (s1.length === 0) return s2.length;
    if (s2.length === 0) return s1.length;
    var matrix = [];

    for (var i = 0; i <= s2.length; i++) {
      matrix[i] = [i];
    }

    for (var j = 0; j <= s1.length; j++) {
      matrix[0][j] = j;
    }

    for (var _i = 1; _i <= s2.length; _i++) {
      for (var _j = 1; _j <= s1.length; _j++) {
        var cost = s2[_i - 1] === s1[_j - 1] ? 0 : 1;
        matrix[_i][_j] = Math.min(matrix[_i - 1][_j] + 1, matrix[_i][_j - 1] + 1, matrix[_i - 1][_j - 1] + cost);
      }
    }

    return matrix[s2.length][s1.length];
  }
  /**
   * Fuzzy match for client names
   * First tries exact includes, then approximate matching
   */


  function fuzzyMatch(text, searchTerm) {
    if (!text || !searchTerm) return false;
    var normalizedText = normalizeText(text);
    var normalizedSearch = normalizeText(searchTerm); // Exact match or includes

    if (normalizedText.includes(normalizedSearch)) return true; // For short search terms, require exact match

    if (normalizedSearch.length < 3) return false; // Check if search term appears as a word boundary

    var words = normalizedText.split(/\s+/);
    if (words.some(function (word) {
      return word.includes(normalizedSearch);
    })) return true; // Levenshtein distance for approximate matching

    var distance = levenshteinDistance(normalizedText, normalizedSearch);
    var maxLength = Math.max(normalizedText.length, normalizedSearch.length);
    var similarity = 1 - distance / maxLength; // Accept if similarity is above 70%

    return similarity >= 0.7;
  }
  /**
   * Safe HTML escaping before highlighting
   */


  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
  /**
   * Highlight search keywords in text
   */


  function highlightText(text, searchTerm) {
    if (!text || !searchTerm) return escapeHtml(text);
    var escapedText = escapeHtml(text);
    var normalizedSearch = normalizeText(searchTerm);
    if (normalizedSearch.length === 0) return escapedText;
    var regex = new RegExp("(".concat(normalizedSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), ")"), 'gi');
    return escapedText.replace(regex, '<span class="highlight">$1</span>');
  }
  /**
   * Check if a client matches all search criteria
   */


  function clientMatches(client) {
    var clientName = client.name || '';
    var clientPhone = client.phone || '';
    var clientEmail = client.email || '';
    var clientNotes = client.notes || ''; // Check client name

    if (searchCriteria.clientName && !fuzzyMatch(clientName, searchCriteria.clientName)) {
      return false;
    } // Check phone


    if (searchCriteria.phone && !phoneMatches(clientPhone, searchCriteria.phone)) {
      return false;
    } // Check email


    if (searchCriteria.email && !normalizeText(clientEmail).includes(normalizeText(searchCriteria.email))) {
      return false;
    } // Check request (search in client notes)


    if (searchCriteria.request && !normalizeText(clientNotes).includes(normalizeText(searchCriteria.request))) {
      return false;
    } // Check car name (clients don't have car names)


    if (searchCriteria.carName) {
      return false;
    }

    return true;
  }
  /**
   * Check if a request matches all search criteria
   */


  function requestMatches(request) {
    var title = request.title || '';
    var notes = request.notes || '';
    var clientName = request.clientName || '';
    var carData = request.carData;
    var carName = carData ? "".concat(carData.brand || '', " ").concat(carData.model || '').trim() : ''; // Check client name

    if (searchCriteria.clientName && !normalizeText(clientName).includes(normalizeText(searchCriteria.clientName))) {
      return false;
    } // Check phone (requests don't have direct phone, but can search through client)


    if (searchCriteria.phone) {
      var client = cachedData.clients.find(function (c) {
        return c.id == request.clientid;
      });
      var clientPhone = client ? client.phone : '';

      if (!phoneMatches(clientPhone, searchCriteria.phone)) {
        return false;
      }
    } // Check email (requests don't have direct email, but can search through client)


    if (searchCriteria.email) {
      var _client = cachedData.clients.find(function (c) {
        return c.id == request.clientid;
      });

      var clientEmail = _client ? _client.email : '';

      if (!normalizeText(clientEmail).includes(normalizeText(searchCriteria.email))) {
        return false;
      }
    } // Check request (title or notes)


    if (searchCriteria.request) {
      var requestText = "".concat(title, " ").concat(notes);

      if (!normalizeText(requestText).includes(normalizeText(searchCriteria.request))) {
        return false;
      }
    } // Check car name


    if (searchCriteria.carName && !normalizeText(carName).includes(normalizeText(searchCriteria.carName))) {
      return false;
    }

    return true;
  }
  /**
   * Check if a car matches all search criteria
   */


  function carMatches(car) {
    var carName = "".concat(car.brand || '', " ").concat(car.model || '').trim();
    var carNotes = car.notes || ''; // Check client name (cars don't have client names)

    if (searchCriteria.clientName) {
      return false;
    } // Check phone (cars don't have phone)


    if (searchCriteria.phone) {
      return false;
    } // Check email (cars don't have email)


    if (searchCriteria.email) {
      return false;
    } // Check request (search in car notes)


    if (searchCriteria.request && !normalizeText(carNotes).includes(normalizeText(searchCriteria.request))) {
      return false;
    } // Check car name


    if (searchCriteria.carName && !normalizeText(carName).includes(normalizeText(searchCriteria.carName))) {
      return false;
    }

    return true;
  } // ==================== INITIALIZATION ====================


  function init() {
    console.log('🔍 Search Module Initialized');
    bindEvents();
    loadAllData();
    setupFilterVisibility();
  }

  function bindEvents() {
    // Search input fields
    var searchClientName = document.getElementById('search-client-name');
    var searchPhone = document.getElementById('search-phone');
    var searchEmail = document.getElementById('search-email');
    var searchRequest = document.getElementById('search-request');
    var searchCarName = document.getElementById('search-car-name');

    if (searchClientName) {
      searchClientName.addEventListener('input', function (e) {
        searchCriteria.clientName = e.target.value;
        debouncedSearch();
      });
    }

    if (searchPhone) {
      searchPhone.addEventListener('input', function (e) {
        searchCriteria.phone = e.target.value;
        debouncedSearch();
      });
    }

    if (searchEmail) {
      searchEmail.addEventListener('input', function (e) {
        searchCriteria.email = e.target.value;
        debouncedSearch();
      });
    }

    if (searchRequest) {
      searchRequest.addEventListener('input', function (e) {
        searchCriteria.request = e.target.value;
        debouncedSearch();
      });
    }

    if (searchCarName) {
      searchCarName.addEventListener('input', function (e) {
        searchCriteria.carName = e.target.value;
        debouncedSearch();
      });
    } // Apply search button


    var applyBtn = document.getElementById('apply-search');

    if (applyBtn) {
      applyBtn.addEventListener('click', function () {
        performSearch();
      });
    } // Clear all button


    var clearBtn = document.getElementById('clear-all-search');

    if (clearBtn) {
      clearBtn.addEventListener('click', clearAllSearchFields);
    } // Type filter


    var typeFilter = document.getElementById('search-type');

    if (typeFilter) {
      typeFilter.addEventListener('change', function (e) {
        currentFilters.type = e.target.value;
        setupFilterVisibility();
        performSearch();
      });
    } // Status filter


    var statusFilter = document.getElementById('search-status');

    if (statusFilter) {
      statusFilter.addEventListener('change', function (e) {
        currentFilters.status = e.target.value;
        performSearch();
      });
    } // Car filters


    var brandFilter = document.getElementById('filter-brand');
    var modelFilter = document.getElementById('filter-model');
    var colorFilter = document.getElementById('filter-color');
    var categoryFilter = document.getElementById('filter-category');
    var conditionFilter = document.getElementById('filter-condition');

    if (brandFilter) {
      brandFilter.addEventListener('change', function (e) {
        currentFilters.brand = e.target.value;
        updateModelFilter();
        performSearch();
      });
    }

    if (modelFilter) {
      modelFilter.addEventListener('change', function (e) {
        currentFilters.model = e.target.value;
        performSearch();
      });
    }

    if (colorFilter) {
      colorFilter.addEventListener('change', function (e) {
        currentFilters.color = e.target.value;
        performSearch();
      });
    }

    if (categoryFilter) {
      categoryFilter.addEventListener('change', function (e) {
        currentFilters.category = e.target.value;
        performSearch();
      });
    }

    if (conditionFilter) {
      conditionFilter.addEventListener('change', function (e) {
        currentFilters.condition = e.target.value;
        performSearch();
      });
    } // Sort select


    var sortSelect = document.getElementById('search-sort');

    if (sortSelect) {
      sortSelect.addEventListener('change', function (e) {
        sortResults(e.target.value);
      });
    } // Results container click


    var resultsContainer = document.getElementById('search-results');

    if (resultsContainer) {
      resultsContainer.addEventListener('click', handleResultClick);
    }
  }

  function clearAllSearchFields() {
    // Clear search criteria
    searchCriteria = {
      clientName: '',
      phone: '',
      email: '',
      request: '',
      carName: ''
    }; // Clear input fields

    var searchClientName = document.getElementById('search-client-name');
    var searchPhone = document.getElementById('search-phone');
    var searchEmail = document.getElementById('search-email');
    var searchRequest = document.getElementById('search-request');
    var searchCarName = document.getElementById('search-car-name');
    if (searchClientName) searchClientName.value = '';
    if (searchPhone) searchPhone.value = '';
    if (searchEmail) searchEmail.value = '';
    if (searchRequest) searchRequest.value = '';
    if (searchCarName) searchCarName.value = ''; // Clear filters

    currentFilters = {
      type: '',
      status: '',
      brand: '',
      model: '',
      color: '',
      category: '',
      condition: ''
    };
    var typeFilter = document.getElementById('search-type');
    var statusFilter = document.getElementById('search-status');
    var brandFilter = document.getElementById('filter-brand');
    var modelFilter = document.getElementById('filter-model');
    var colorFilter = document.getElementById('filter-color');
    var categoryFilter = document.getElementById('filter-category');
    var conditionFilter = document.getElementById('filter-condition');
    if (typeFilter) typeFilter.value = '';
    if (statusFilter) statusFilter.value = '';
    if (brandFilter) brandFilter.value = '';
    if (modelFilter) modelFilter.value = '';
    if (colorFilter) colorFilter.value = '';
    if (categoryFilter) categoryFilter.value = '';
    if (conditionFilter) conditionFilter.value = '';
    updateCarFilters();
    performSearch();
    App.showToast('All search fields cleared', 'success', 1500);
  }

  function setupFilterVisibility() {
    var carFiltersDiv = document.getElementById('car-filters');

    if (carFiltersDiv) {
      if (currentFilters.type === 'car' || currentFilters.type === '') {
        carFiltersDiv.style.display = 'flex';
      } else {
        carFiltersDiv.style.display = 'none';
      }
    }
  } // ==================== HELPER FUNCTIONS FOR FILTERS ====================


  function getUniqueValues(data, field) {
    if (!data || !Array.isArray(data)) return [];
    var values = data.map(function (item) {
      return item[field];
    }).filter(function (value) {
      return value && value !== '' && value !== null && value !== 'undefined';
    }).map(function (value) {
      return String(value).trim();
    });
    return _toConsumableArray(new Set(values)).sort();
  }

  function updateModelFilter() {
    var modelFilter = document.getElementById('filter-model');
    if (!modelFilter) return;
    var currentBrand = currentFilters.brand;
    var models = [];

    if (currentBrand && currentBrand !== '') {
      var filteredCars = cachedData.cars.filter(function (car) {
        return car.brand && car.brand.toLowerCase() === currentBrand.toLowerCase();
      });
      models = getUniqueValues(filteredCars, 'model');
    } else {
      models = getUniqueValues(cachedData.cars, 'model');
    }

    var currentModel = currentFilters.model;
    modelFilter.innerHTML = '<option value="">All Models</option>';
    models.forEach(function (model) {
      var selected = currentModel === model ? 'selected' : '';
      modelFilter.innerHTML += "<option value=\"".concat(App.escapeHtml(model), "\" ").concat(selected, ">").concat(App.escapeHtml(model), "</option>");
    });
  }

  function updateCarFilters() {
    var cars = cachedData.cars || [];
    var brandFilter = document.getElementById('filter-brand');
    var colorFilter = document.getElementById('filter-color');
    var categoryFilter = document.getElementById('filter-category');
    var conditionFilter = document.getElementById('filter-condition');
    var brands = getUniqueValues(cars, 'brand');
    var colors = getUniqueValues(cars, 'color');
    var categories = getUniqueValues(cars, 'category');
    var conditions = getUniqueValues(cars, 'condition');

    if (brandFilter) {
      brandFilter.innerHTML = '<option value="">All Brands</option>';
      brands.forEach(function (brand) {
        var selected = currentFilters.brand === brand ? 'selected' : '';
        brandFilter.innerHTML += "<option value=\"".concat(App.escapeHtml(brand), "\" ").concat(selected, ">").concat(App.escapeHtml(brand), "</option>");
      });
    }

    if (colorFilter) {
      colorFilter.innerHTML = '<option value="">All Colors</option>';
      colors.forEach(function (color) {
        var selected = currentFilters.color === color ? 'selected' : '';
        colorFilter.innerHTML += "<option value=\"".concat(App.escapeHtml(color), "\" ").concat(selected, ">").concat(App.escapeHtml(color), "</option>");
      });
    }

    if (categoryFilter) {
      categoryFilter.innerHTML = '<option value="">All Categories</option>';
      categories.forEach(function (category) {
        var selected = currentFilters.category === category ? 'selected' : '';
        categoryFilter.innerHTML += "<option value=\"".concat(App.escapeHtml(category), "\" ").concat(selected, ">").concat(App.escapeHtml(category), "</option>");
      });
    }

    if (conditionFilter) {
      conditionFilter.innerHTML = '<option value="">All Conditions</option>';
      conditions.forEach(function (condition) {
        var selected = currentFilters.condition === condition ? 'selected' : '';
        conditionFilter.innerHTML += "<option value=\"".concat(App.escapeHtml(condition), "\" ").concat(selected, ">").concat(App.escapeHtml(condition), "</option>");
      });
    }

    updateModelFilter();
  } // ==================== DATA LOADING ====================


  function loadAllData() {
    var _ref, _ref2, clients, requests, cars;

    return regeneratorRuntime.async(function loadAllData$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            showLoading(true);
            _context.prev = 1;
            _context.next = 4;
            return regeneratorRuntime.awrap(Promise.all([API.getClients()["catch"](function () {
              return [];
            }), API.getRequests()["catch"](function () {
              return [];
            }), API.getCars()["catch"](function () {
              return [];
            })]));

          case 4:
            _ref = _context.sent;
            _ref2 = _slicedToArray(_ref, 3);
            clients = _ref2[0];
            requests = _ref2[1];
            cars = _ref2[2];
            cachedData = {
              clients: clients,
              requests: requests,
              cars: cars
            };
            updateCarFilters();
            _context.next = 13;
            return regeneratorRuntime.awrap(performSearch());

          case 13:
            _context.next = 19;
            break;

          case 15:
            _context.prev = 15;
            _context.t0 = _context["catch"](1);
            console.error('Error loading data:', _context.t0);
            showEmptyState('Error loading data');

          case 19:
            _context.prev = 19;
            showLoading(false);
            return _context.finish(19);

          case 22:
          case "end":
            return _context.stop();
        }
      }
    }, null, null, [[1, 15, 19, 22]]);
  } // ==================== SEARCH FUNCTIONALITY ====================


  function performSearch() {
    var allItems, hasSearchCriteria, sortSelect;
    return regeneratorRuntime.async(function performSearch$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            try {
              allItems = [].concat(_toConsumableArray(cachedData.clients.map(function (item) {
                return _objectSpread({}, item, {
                  _type: 'client'
                });
              })), _toConsumableArray(cachedData.requests.map(function (item) {
                var client = cachedData.clients.find(function (c) {
                  return c.id == item.clientid;
                });
                var car = cachedData.cars.find(function (c) {
                  return c.id == item.carid;
                });
                return _objectSpread({}, item, {
                  clientName: client ? client.name : 'Unknown',
                  carData: car || null,
                  _type: 'request'
                });
              })), _toConsumableArray(cachedData.cars.map(function (item) {
                return _objectSpread({}, item, {
                  _type: 'car'
                });
              }))); // Apply search criteria

              hasSearchCriteria = Object.values(searchCriteria).some(function (value) {
                return value && value.trim() !== '';
              });

              if (hasSearchCriteria) {
                allItems = allItems.filter(function (item) {
                  if (item._type === 'client') {
                    return clientMatches(item);
                  } else if (item._type === 'request') {
                    return requestMatches(item);
                  } else if (item._type === 'car') {
                    return carMatches(item);
                  }

                  return false;
                });
              } // Apply type filter


              if (currentFilters.type) {
                allItems = allItems.filter(function (item) {
                  return item._type === currentFilters.type;
                });
              } // Apply status filter (only for requests)


              if (currentFilters.status) {
                allItems = allItems.filter(function (item) {
                  return item._type === 'request' && item.status === currentFilters.status;
                });
              } // Apply car filters


              if (currentFilters.brand || currentFilters.model || currentFilters.color || currentFilters.category || currentFilters.condition) {
                allItems = allItems.filter(function (item) {
                  var carToCheck = null;

                  if (item._type === 'car') {
                    carToCheck = item;
                  } else if (item._type === 'request' && item.carData) {
                    carToCheck = item.carData;
                  } else {
                    return true;
                  }

                  if (!carToCheck) return true; // Brand filter

                  if (currentFilters.brand && currentFilters.brand !== '') {
                    var carBrand = (carToCheck.brand || '').toLowerCase();
                    var filterBrand = currentFilters.brand.toLowerCase();
                    if (carBrand !== filterBrand) return false;
                  } // Model filter


                  if (currentFilters.model && currentFilters.model !== '') {
                    var carModel = (carToCheck.model || '').toLowerCase();
                    var filterModel = currentFilters.model.toLowerCase();
                    if (carModel !== filterModel) return false;
                  } // Color filter


                  if (currentFilters.color && currentFilters.color !== '') {
                    var carColor = (carToCheck.color || '').toLowerCase();
                    var filterColor = currentFilters.color.toLowerCase();
                    if (carColor !== filterColor) return false;
                  } // Category filter


                  if (currentFilters.category && currentFilters.category !== '') {
                    var carCategory = (carToCheck.category || '').toLowerCase();
                    var filterCategory = currentFilters.category.toLowerCase();
                    if (carCategory !== filterCategory) return false;
                  } // Condition filter


                  if (currentFilters.condition && currentFilters.condition !== '') {
                    var carCondition = (carToCheck.condition || '').toLowerCase();
                    var filterCondition = currentFilters.condition.toLowerCase();
                    if (carCondition !== filterCondition) return false;
                  }

                  return true;
                });
              }

              searchResults = allItems;
              updateResultsCount();
              sortSelect = document.getElementById('search-sort');

              if (sortSelect && sortSelect.value !== 'relevance') {
                sortResults(sortSelect.value, false);
              } else {
                displayResults();
              }
            } catch (error) {
              console.error('Search error:', error);
              showEmptyState('An error occurred during search');
            }

          case 1:
          case "end":
            return _context2.stop();
        }
      }
    });
  } // ==================== SORTING ====================


  function sortResults(sortBy) {
    var refreshDisplay = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;

    var getName = function getName(item) {
      switch (item._type) {
        case 'client':
          return item.name || '';

        case 'request':
          return item.title || '';

        case 'car':
          return "".concat(item.brand || '', " ").concat(item.model || '');

        default:
          return '';
      }
    };

    var getDate = function getDate(item) {
      switch (item._type) {
        case 'client':
          return item.registeredat || item.registeredAt || '';

        case 'request':
          return item.createdAt || item.createdat || '';

        case 'car':
          return item.createdAt || item.createdat || '';

        default:
          return '';
      }
    };

    switch (sortBy) {
      case 'name_asc':
        searchResults.sort(function (a, b) {
          return getName(a).localeCompare(getName(b));
        });
        break;

      case 'name_desc':
        searchResults.sort(function (a, b) {
          return getName(b).localeCompare(getName(a));
        });
        break;

      case 'date_new':
        searchResults.sort(function (a, b) {
          var dateA = new Date(getDate(a) || 0);
          var dateB = new Date(getDate(b) || 0);
          return dateB - dateA;
        });
        break;

      case 'date_old':
        searchResults.sort(function (a, b) {
          var dateA = new Date(getDate(a) || 0);
          var dateB = new Date(getDate(b) || 0);
          return dateA - dateB;
        });
        break;

      default:
        break;
    }

    if (refreshDisplay) {
      displayResults();
    } else {
      displayResults();
    }
  } // ==================== DISPLAY RESULTS ====================


  function updateResultsCount() {
    var countElement = document.getElementById('search-results-count');

    if (countElement) {
      countElement.textContent = "Search Results (".concat(searchResults.length, ")");
    }
  }

  function displayResults() {
    var container = document.getElementById('search-results');
    if (!container) return;

    if (searchResults.length === 0) {
      var hasCriteria = Object.values(searchCriteria).some(function (v) {
        return v && v.trim() !== '';
      });
      showEmptyState(hasCriteria ? 'No results found' : 'Enter search criteria to find clients, requests, or cars');
      return;
    }

    var grouped = {
      client: searchResults.filter(function (item) {
        return item._type === 'client';
      }),
      request: searchResults.filter(function (item) {
        return item._type === 'request';
      }),
      car: searchResults.filter(function (item) {
        return item._type === 'car';
      })
    };
    var html = '';

    if (grouped.client.length > 0) {
      html += '<div class="search-type-header"><h4><i class="fa-solid fa-users"></i> Clients (' + grouped.client.length + ')</h4></div>';
      grouped.client.forEach(function (item) {
        html += createClientResult(item);
      });
    }

    if (grouped.request.length > 0) {
      html += '<div class="search-type-header"><h4><i class="fa-solid fa-file-lines"></i> Requests (' + grouped.request.length + ')</h4></div>';
      grouped.request.forEach(function (item) {
        html += createRequestResult(item);
      });
    }

    if (grouped.car.length > 0) {
      html += '<div class="search-type-header"><h4><i class="fa-solid fa-car"></i> Cars (' + grouped.car.length + ')</h4></div>';
      grouped.car.forEach(function (item) {
        html += createCarResult(item);
      });
    }

    container.innerHTML = html;
  }

  function createClientResult(item) {
    var highlightedName = highlightText(item.name || 'Unnamed Client', searchCriteria.clientName);
    var highlightedPhone = item.phone && item.phone !== 'No phone' ? highlightText(item.phone, searchCriteria.phone) : item.phone || 'No phone number';
    var highlightedEmail = item.email && item.email !== 'No email' ? highlightText(item.email, searchCriteria.email) : '';
    var highlightedNotes = item.notes ? highlightText(item.notes, searchCriteria.request) : '';
    return "\n            <div class=\"search-result-item\" data-type=\"client\" data-id=\"".concat(App.escapeHtml(item.id), "\">\n                <div class=\"search-result-icon\"><i class=\"fa-solid fa-user\"></i></div>\n                <div class=\"search-result-content\">\n                    <div class=\"search-result-title\">").concat(highlightedName, "</div>\n                    <div class=\"search-result-subtitle\">\n                        <i class=\"fa-solid fa-phone\"></i> ").concat(highlightedPhone, "\n                    </div>\n                    ").concat(highlightedEmail ? "\n                    <div class=\"search-result-subtitle\">\n                        <i class=\"fa-solid fa-envelope\"></i> ".concat(highlightedEmail, "\n                    </div>\n                    ") : '', "\n                    ").concat(highlightedNotes ? "\n                    <div class=\"search-result-notes\">\n                        <i class=\"fa-regular fa-note-sticky\"></i> ".concat(App.truncateText(highlightedNotes, 60), "\n                    </div>\n                    ") : '', "\n                </div>\n                <div class=\"search-result-action\">\n                    <i class=\"fa-solid fa-chevron-left\"></i>\n                </div>\n            </div>\n        ");
  }

  function createRequestResult(item) {
    var status = item.status || 'pending';
    var statusText = status === 'active' ? 'Active' : status === 'pending' ? 'Pending' : 'Completed';
    var statusIcon = status === 'active' ? 'fa-play-circle' : status === 'pending' ? 'fa-clock' : 'fa-check-circle';
    var highlightedTitle = highlightText(item.title || 'Untitled Request', searchCriteria.request);
    var highlightedClientName = highlightText(item.clientName || 'Unknown', searchCriteria.clientName);
    var highlightedNotes = item.notes ? highlightText(item.notes, searchCriteria.request) : '';
    var carName = item.carData ? "".concat(item.carData.brand || '', " ").concat(item.carData.model || '').trim() : 'No car';
    var highlightedCarName = highlightText(carName, searchCriteria.carName);
    return "\n            <div class=\"search-result-item\" data-type=\"request\" data-id=\"".concat(App.escapeHtml(item.id), "\">\n                <div class=\"search-result-icon\"><i class=\"fa-solid fa-file-lines\"></i></div>\n                <div class=\"search-result-content\">\n                    <div class=\"search-result-title\">").concat(highlightedTitle, "</div>\n                    <div class=\"search-result-subtitle\">\n                        <i class=\"fa-solid fa-user\"></i> ").concat(highlightedClientName, "\n                    </div>\n                    <div class=\"search-result-subtitle\">\n                        <i class=\"fa-solid fa-car\"></i> ").concat(highlightedCarName, "\n                    </div>\n                    ").concat(highlightedNotes ? "\n                    <div class=\"search-result-notes\">\n                        <i class=\"fa-regular fa-note-sticky\"></i> ".concat(App.truncateText(highlightedNotes, 60), "\n                    </div>\n                    ") : '', "\n                    <div class=\"search-result-status\">\n                        <span class=\"status status-").concat(status, "\">\n                            <i class=\"fa-solid ").concat(statusIcon, "\"></i>\n                            ").concat(statusText, "\n                        </span>\n                    </div>\n                </div>\n                <div class=\"search-result-action\">\n                    <i class=\"fa-solid fa-chevron-left\"></i>\n                </div>\n            </div>\n        ");
  }

  function createCarResult(item) {
    var conditionDisplay = App.formatCondition(item.condition);
    var carName = "".concat(item.brand || '', " ").concat(item.model || '').trim();
    var highlightedCarName = highlightText(carName, searchCriteria.carName);
    var highlightedNotes = item.notes ? highlightText(item.notes, searchCriteria.request) : '';
    return "\n            <div class=\"search-result-item\" data-type=\"car\" data-id=\"".concat(App.escapeHtml(item.id), "\">\n                <div class=\"search-result-icon\"><i class=\"fa-solid fa-car\"></i></div>\n                <div class=\"search-result-content\">\n                    <div class=\"search-result-title\">").concat(highlightedCarName, " (").concat(App.escapeHtml(item.year || ''), ")</div>\n                    <div class=\"search-result-subtitle\">\n                        <span><i class=\"fa-solid fa-tag\"></i> ").concat(App.escapeHtml(item.category || 'Not specified'), "</span>\n                        <span><i class=\"fa-solid fa-palette\"></i> ").concat(App.escapeHtml(item.color || 'Not specified'), "</span>\n                        <span><i class=\"fa-solid fa-clipboard-check\"></i> ").concat(App.escapeHtml(conditionDisplay), "</span>\n                    </div>\n                    <div class=\"search-result-notes\">\n                        <i class=\"fa-solid fa-dollar-sign\"></i> ").concat(item.price ? App.formatPrice(item.price) : 'Price on request', "\n                    </div>\n                    ").concat(highlightedNotes ? "\n                    <div class=\"search-result-notes\">\n                        <i class=\"fa-regular fa-note-sticky\"></i> ".concat(App.truncateText(highlightedNotes, 60), "\n                    </div>\n                    ") : '', "\n                </div>\n                <div class=\"search-result-action\">\n                    <i class=\"fa-solid fa-chevron-left\"></i>\n                </div>\n            </div>\n        ");
  } // ==================== CLICK HANDLER ====================


  function handleResultClick(e) {
    var resultItem = e.target.closest('.search-result-item');
    if (!resultItem) return;
    var type = resultItem.dataset.type;
    var id = resultItem.dataset.id;
    if (!type || !id) return;
    sessionStorage.setItem('viewItem', JSON.stringify({
      type: type,
      id: id
    }));
    App.showToast("Loading details...", 'info', 1000);
    var page = type === 'client' ? 'index.html' : type === 'request' ? 'requests.html' : 'cars.html';
    window.location.href = page;
  } // ==================== UI STATES ====================


  function showLoading(show) {
    var container = document.getElementById('search-results');
    var countElement = document.getElementById('search-results-count');
    if (!container) return;

    if (show) {
      if (countElement) countElement.textContent = 'Searching...';
      container.innerHTML = "\n                <div class=\"search-loading\">\n                    <div class=\"loading-spinner\">\n                        <div class=\"spinner\"></div>\n                        <p>Loading data...</p>\n                    </div>\n                </div>\n            ";
    }
  }

  function showEmptyState(message) {
    var container = document.getElementById('search-results');
    var countElement = document.getElementById('search-results-count');
    if (!container) return;
    if (countElement) countElement.textContent = 'Search Results (0)';
    container.innerHTML = "\n            <div class=\"empty-search-state\">\n                <i class=\"fa-solid fa-magnifying-glass\"></i>\n                <p>".concat(App.escapeHtml(message), "</p>\n            </div>\n        ");
  }

  function checkStoredItem() {
    var stored = sessionStorage.getItem('viewItem');

    if (stored) {
      try {
        var _JSON$parse = JSON.parse(stored),
            type = _JSON$parse.type,
            id = _JSON$parse.id;

        sessionStorage.removeItem('viewItem');
        setTimeout(function () {
          if (type === 'client' && window.ClientsModule) {
            ClientsModule.viewClientDetails(id);
          } else if (type === 'request' && window.RequestsModule) {
            RequestsModule.loadRequestDetails(id);
          } else if (type === 'car' && window.CarsModule) {
            CarsModule.viewCarDetails(id);
          }
        }, 300);
      } catch (e) {
        console.error('Error parsing stored item:', e);
      }
    }
  }

  return {
    init: init,
    refreshData: loadAllData,
    performSearch: performSearch,
    checkStoredItem: checkStoredItem
  };
}();

window.SearchModule = SearchModule;
document.addEventListener('DOMContentLoaded', function () {
  if (document.getElementById('search-screen')) {
    SearchModule.init();
    SearchModule.checkStoredItem();
  }
});
//# sourceMappingURL=search.dev.js.map
