"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(source, true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(source).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance"); }

function _iterableToArray(iter) { if (Symbol.iterator in Object(iter) || Object.prototype.toString.call(iter) === "[object Arguments]") return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } }

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * API Module - Handles all HTTP requests to Supabase REST API
 * OPTIMIZED: All filtering, sorting, pagination done on backend
 * PERFORMANCE: Lightweight filter options, no full dataset fetches
 */
var API = function () {
  var BASE_URL = "https://pjgixwacmudsjcdjwqdc.supabase.co/rest/v1";
  var API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2l4d2FjbXVkc2pjZGp3cWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTI2MDQsImV4cCI6MjA4OTY2ODYwNH0.cXZLKO3QbW-G7hca4_8c8pH2n7suRHvvBJO6F459lkU"; // ==================== HELPER FUNCTIONS ====================

  function getHeaders() {
    var method = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'GET';
    var headers = {
      "Content-Type": "application/json",
      "apikey": API_KEY,
      "Authorization": "Bearer ".concat(API_KEY)
    };

    if (method === 'POST' || method === 'PATCH' || method === 'DELETE') {
      headers["Prefer"] = "return=representation";
    }

    return headers;
  }

  function handleResponse(response) {
    var errorMessage, error;
    return regeneratorRuntime.async(function handleResponse$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (response.ok) {
              _context.next = 13;
              break;
            }

            errorMessage = "HTTP error! status: ".concat(response.status);
            _context.prev = 2;
            _context.next = 5;
            return regeneratorRuntime.awrap(response.json());

          case 5:
            error = _context.sent;
            errorMessage = error.message || errorMessage;
            _context.next = 12;
            break;

          case 9:
            _context.prev = 9;
            _context.t0 = _context["catch"](2);
            errorMessage = response.statusText || errorMessage;

          case 12:
            throw new Error(errorMessage);

          case 13:
            if (!(response.status === 204)) {
              _context.next = 15;
              break;
            }

            return _context.abrupt("return", true);

          case 15:
            return _context.abrupt("return", response.json());

          case 16:
          case "end":
            return _context.stop();
        }
      }
    }, null, null, [[2, 9]]);
  }

  function fetchWithRetry(url, options) {
    var retries,
        _loop,
        i,
        _ret,
        _args3 = arguments;

    return regeneratorRuntime.async(function fetchWithRetry$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            retries = _args3.length > 2 && _args3[2] !== undefined ? _args3[2] : 2;

            _loop = function _loop(i) {
              return regeneratorRuntime.async(function _loop$(_context2) {
                while (1) {
                  switch (_context2.prev = _context2.next) {
                    case 0:
                      _context2.prev = 0;
                      _context2.next = 3;
                      return regeneratorRuntime.awrap(fetch(url, options));

                    case 3:
                      _context2.t0 = _context2.sent;
                      return _context2.abrupt("return", {
                        v: _context2.t0
                      });

                    case 7:
                      _context2.prev = 7;
                      _context2.t1 = _context2["catch"](0);

                      if (!(i === retries - 1)) {
                        _context2.next = 11;
                        break;
                      }

                      throw _context2.t1;

                    case 11:
                      _context2.next = 13;
                      return regeneratorRuntime.awrap(new Promise(function (resolve) {
                        return setTimeout(resolve, 1000 * (i + 1));
                      }));

                    case 13:
                    case "end":
                      return _context2.stop();
                  }
                }
              }, null, null, [[0, 7]]);
            };

            i = 0;

          case 3:
            if (!(i < retries)) {
              _context3.next = 12;
              break;
            }

            _context3.next = 6;
            return regeneratorRuntime.awrap(_loop(i));

          case 6:
            _ret = _context3.sent;

            if (!(_typeof(_ret) === "object")) {
              _context3.next = 9;
              break;
            }

            return _context3.abrupt("return", _ret.v);

          case 9:
            i++;
            _context3.next = 3;
            break;

          case 12:
          case "end":
            return _context3.stop();
        }
      }
    });
  } // ==================== LIGHTWEIGHT FILTER OPTIONS (NO FULL DATASET) ====================

  /**
   * Get unique brands from cars (lightweight query)
   */


  function getUniqueBrands() {
    var response, cars, brands;
    return regeneratorRuntime.async(function getUniqueBrands$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;
            _context4.next = 3;
            return regeneratorRuntime.awrap(fetchWithRetry("".concat(BASE_URL, "/cars?select=brand&brand=not.is.null"), {
              headers: getHeaders('GET')
            }));

          case 3:
            response = _context4.sent;
            _context4.next = 6;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 6:
            cars = _context4.sent;
            brands = _toConsumableArray(new Set(cars.map(function (c) {
              return c.brand;
            }).filter(function (b) {
              return b;
            }))).sort();
            return _context4.abrupt("return", brands);

          case 11:
            _context4.prev = 11;
            _context4.t0 = _context4["catch"](0);
            console.error('Error fetching unique brands:', _context4.t0);
            return _context4.abrupt("return", []);

          case 15:
          case "end":
            return _context4.stop();
        }
      }
    }, null, null, [[0, 11]]);
  }
  /**
   * Get unique years from cars (lightweight query)
   */


  function getUniqueYears() {
    var response, cars, years;
    return regeneratorRuntime.async(function getUniqueYears$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.prev = 0;
            _context5.next = 3;
            return regeneratorRuntime.awrap(fetchWithRetry("".concat(BASE_URL, "/cars?select=year&year=not.is.null"), {
              headers: getHeaders('GET')
            }));

          case 3:
            response = _context5.sent;
            _context5.next = 6;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 6:
            cars = _context5.sent;
            years = _toConsumableArray(new Set(cars.map(function (c) {
              return c.year;
            }).filter(function (y) {
              return y;
            }))).sort(function (a, b) {
              return b - a;
            });
            return _context5.abrupt("return", years);

          case 11:
            _context5.prev = 11;
            _context5.t0 = _context5["catch"](0);
            console.error('Error fetching unique years:', _context5.t0);
            return _context5.abrupt("return", []);

          case 15:
          case "end":
            return _context5.stop();
        }
      }
    }, null, null, [[0, 11]]);
  }
  /**
   * Get unique colors from cars (lightweight query)
   */


  function getUniqueColors() {
    var response, cars, colors;
    return regeneratorRuntime.async(function getUniqueColors$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.prev = 0;
            _context6.next = 3;
            return regeneratorRuntime.awrap(fetchWithRetry("".concat(BASE_URL, "/cars?select=color&color=not.is.null"), {
              headers: getHeaders('GET')
            }));

          case 3:
            response = _context6.sent;
            _context6.next = 6;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 6:
            cars = _context6.sent;
            colors = _toConsumableArray(new Set(cars.map(function (c) {
              return c.color;
            }).filter(function (c) {
              return c;
            }))).sort();
            return _context6.abrupt("return", colors);

          case 11:
            _context6.prev = 11;
            _context6.t0 = _context6["catch"](0);
            console.error('Error fetching unique colors:', _context6.t0);
            return _context6.abrupt("return", []);

          case 15:
          case "end":
            return _context6.stop();
        }
      }
    }, null, null, [[0, 11]]);
  }
  /**
   * Get unique categories from cars (lightweight query)
   */


  function getUniqueCategories() {
    var response, cars, categories;
    return regeneratorRuntime.async(function getUniqueCategories$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.prev = 0;
            _context7.next = 3;
            return regeneratorRuntime.awrap(fetchWithRetry("".concat(BASE_URL, "/cars?select=category&category=not.is.null"), {
              headers: getHeaders('GET')
            }));

          case 3:
            response = _context7.sent;
            _context7.next = 6;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 6:
            cars = _context7.sent;
            categories = _toConsumableArray(new Set(cars.map(function (c) {
              return c.category;
            }).filter(function (c) {
              return c;
            }))).sort();
            return _context7.abrupt("return", categories);

          case 11:
            _context7.prev = 11;
            _context7.t0 = _context7["catch"](0);
            console.error('Error fetching unique categories:', _context7.t0);
            return _context7.abrupt("return", []);

          case 15:
          case "end":
            return _context7.stop();
        }
      }
    }, null, null, [[0, 11]]);
  }
  /**
   * Get unique conditions from cars (lightweight query)
   */


  function getUniqueConditions() {
    var response, cars, conditions;
    return regeneratorRuntime.async(function getUniqueConditions$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.prev = 0;
            _context8.next = 3;
            return regeneratorRuntime.awrap(fetchWithRetry("".concat(BASE_URL, "/cars?select=condition&condition=not.is.null"), {
              headers: getHeaders('GET')
            }));

          case 3:
            response = _context8.sent;
            _context8.next = 6;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 6:
            cars = _context8.sent;
            conditions = _toConsumableArray(new Set(cars.map(function (c) {
              return c.condition;
            }).filter(function (c) {
              return c;
            }))).sort();
            return _context8.abrupt("return", conditions);

          case 11:
            _context8.prev = 11;
            _context8.t0 = _context8["catch"](0);
            console.error('Error fetching unique conditions:', _context8.t0);
            return _context8.abrupt("return", []);

          case 15:
          case "end":
            return _context8.stop();
        }
      }
    }, null, null, [[0, 11]]);
  }
  /**
   * Get models by brand (lightweight query)
   * @param {string} brand - Car brand
   * @returns {Promise<Array>} - Array of unique models
   */


  function getModelsByBrand(brand) {
    var response, cars, models;
    return regeneratorRuntime.async(function getModelsByBrand$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            if (brand) {
              _context9.next = 2;
              break;
            }

            return _context9.abrupt("return", []);

          case 2:
            _context9.prev = 2;
            _context9.next = 5;
            return regeneratorRuntime.awrap(fetchWithRetry("".concat(BASE_URL, "/cars?select=model&brand=eq.").concat(encodeURIComponent(brand), "&model=not.is.null"), {
              headers: getHeaders('GET')
            }));

          case 5:
            response = _context9.sent;
            _context9.next = 8;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 8:
            cars = _context9.sent;
            models = _toConsumableArray(new Set(cars.map(function (c) {
              return c.model;
            }).filter(function (m) {
              return m;
            }))).sort();
            return _context9.abrupt("return", models);

          case 13:
            _context9.prev = 13;
            _context9.t0 = _context9["catch"](2);
            console.error('Error fetching models by brand:', _context9.t0);
            return _context9.abrupt("return", []);

          case 17:
          case "end":
            return _context9.stop();
        }
      }
    }, null, null, [[2, 13]]);
  } // ==================== SEARCH FUNCTIONS (ALL BACKEND FILTERING) ====================

  /**
   * Search clients with full backend filtering
   * @param {Object} filters - Search filters
   * @param {number} page - Page number (1-based)
   * @param {number} limit - Items per page
   * @param {AbortSignal} signal - AbortController signal
   * @returns {Promise<Object>} - { data, total, page, totalPages }
   */


  function searchClients() {
    var filters,
        page,
        limit,
        signal,
        url,
        offset,
        sortMap,
        response,
        total,
        contentRange,
        match,
        data,
        _args10 = arguments;
    return regeneratorRuntime.async(function searchClients$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            filters = _args10.length > 0 && _args10[0] !== undefined ? _args10[0] : {};
            page = _args10.length > 1 && _args10[1] !== undefined ? _args10[1] : 1;
            limit = _args10.length > 2 && _args10[2] !== undefined ? _args10[2] : 20;
            signal = _args10.length > 3 && _args10[3] !== undefined ? _args10[3] : null;
            _context10.prev = 4;
            url = "".concat(BASE_URL, "/clients?select=*");

            if (filters.name) {
              url += "&name=ilike.*".concat(encodeURIComponent(filters.name), "*");
            }

            if (filters.phone && filters.phone.length >= 2) {
              url += "&phone=ilike.*".concat(encodeURIComponent(filters.phone), "*");
            }

            if (filters.email && filters.email.length >= 2) {
              url += "&email=ilike.*".concat(encodeURIComponent(filters.email), "*");
            }

            if (filters.notes) {
              url += "&notes=ilike.*".concat(encodeURIComponent(filters.notes), "*");
            }

            offset = (page - 1) * limit;
            url += "&limit=".concat(limit, "&offset=").concat(offset);
            sortMap = {
              'name_asc': 'name.asc',
              'name_desc': 'name.desc',
              'date_new': 'registeredat.desc',
              'date_old': 'registeredat.asc',
              'relevance': 'registeredat.desc'
            };
            url += "&order=".concat(sortMap[filters.sortBy] || 'registeredat.desc');
            _context10.next = 16;
            return regeneratorRuntime.awrap(fetchWithRetry(url, {
              headers: _objectSpread({}, getHeaders('GET'), {
                'Prefer': 'count=exact'
              }),
              signal: signal
            }));

          case 16:
            response = _context10.sent;
            total = 0;
            contentRange = response.headers.get('content-range');

            if (contentRange) {
              match = contentRange.match(/\/(\d+)/);
              if (match) total = parseInt(match[1], 10);
            }

            _context10.next = 22;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 22:
            data = _context10.sent;
            return _context10.abrupt("return", {
              data: Array.isArray(data) ? data.map(function (c) {
                return _objectSpread({}, c, {
                  _type: 'client'
                });
              }) : [],
              total: total,
              page: page,
              totalPages: Math.ceil(total / limit)
            });

          case 26:
            _context10.prev = 26;
            _context10.t0 = _context10["catch"](4);

            if (!(_context10.t0.name === 'AbortError')) {
              _context10.next = 30;
              break;
            }

            throw _context10.t0;

          case 30:
            console.error('Error searching clients:', _context10.t0);
            throw _context10.t0;

          case 32:
          case "end":
            return _context10.stop();
        }
      }
    }, null, null, [[4, 26]]);
  }
  /**
   * Search cars with full backend filtering
   */


  function searchCars() {
    var filters,
        page,
        limit,
        signal,
        url,
        searchTerm,
        offset,
        sortMap,
        response,
        total,
        contentRange,
        match,
        data,
        _args11 = arguments;
    return regeneratorRuntime.async(function searchCars$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            filters = _args11.length > 0 && _args11[0] !== undefined ? _args11[0] : {};
            page = _args11.length > 1 && _args11[1] !== undefined ? _args11[1] : 1;
            limit = _args11.length > 2 && _args11[2] !== undefined ? _args11[2] : 20;
            signal = _args11.length > 3 && _args11[3] !== undefined ? _args11[3] : null;
            _context11.prev = 4;
            url = "".concat(BASE_URL, "/cars?select=*");

            if (filters.carName) {
              searchTerm = encodeURIComponent(filters.carName);
              url += "&or=(brand.ilike.*".concat(searchTerm, "*,model.ilike.*").concat(searchTerm, "*)");
            }

            if (filters.notes) {
              url += "&notes=ilike.*".concat(encodeURIComponent(filters.notes), "*");
            }

            if (filters.brand) url += "&brand=eq.".concat(encodeURIComponent(filters.brand));
            if (filters.model) url += "&model=eq.".concat(encodeURIComponent(filters.model));
            if (filters.year) url += "&year=eq.".concat(filters.year);
            if (filters.color) url += "&color=eq.".concat(encodeURIComponent(filters.color));
            if (filters.category) url += "&category=eq.".concat(encodeURIComponent(filters.category));
            if (filters.condition) url += "&condition=eq.".concat(encodeURIComponent(filters.condition));
            offset = (page - 1) * limit;
            url += "&limit=".concat(limit, "&offset=").concat(offset);
            sortMap = {
              'name_asc': 'brand.asc,model.asc',
              'name_desc': 'brand.desc,model.desc',
              'price_asc': 'price.asc',
              'price_desc': 'price.desc',
              'year_desc': 'year.desc',
              'date_new': 'createdat.desc',
              'date_old': 'createdat.asc',
              'relevance': 'createdat.desc'
            };
            url += "&order=".concat(sortMap[filters.sortBy] || 'createdat.desc');
            _context11.next = 20;
            return regeneratorRuntime.awrap(fetchWithRetry(url, {
              headers: _objectSpread({}, getHeaders('GET'), {
                'Prefer': 'count=exact'
              }),
              signal: signal
            }));

          case 20:
            response = _context11.sent;
            total = 0;
            contentRange = response.headers.get('content-range');

            if (contentRange) {
              match = contentRange.match(/\/(\d+)/);
              if (match) total = parseInt(match[1], 10);
            }

            _context11.next = 26;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 26:
            data = _context11.sent;
            return _context11.abrupt("return", {
              data: Array.isArray(data) ? data.map(function (c) {
                return _objectSpread({}, c, {
                  _type: 'car'
                });
              }) : [],
              total: total,
              page: page,
              totalPages: Math.ceil(total / limit)
            });

          case 30:
            _context11.prev = 30;
            _context11.t0 = _context11["catch"](4);

            if (!(_context11.t0.name === 'AbortError')) {
              _context11.next = 34;
              break;
            }

            throw _context11.t0;

          case 34:
            console.error('Error searching cars:', _context11.t0);
            throw _context11.t0;

          case 36:
          case "end":
            return _context11.stop();
        }
      }
    }, null, null, [[4, 30]]);
  }
  /**
   * Search requests with full backend filtering
   */


  function searchRequests() {
    var filters,
        page,
        limit,
        signal,
        url,
        searchTerm,
        offset,
        sortMap,
        response,
        total,
        contentRange,
        match,
        data,
        clientIds,
        clientsMap,
        dataWithClients,
        _args12 = arguments;
    return regeneratorRuntime.async(function searchRequests$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            filters = _args12.length > 0 && _args12[0] !== undefined ? _args12[0] : {};
            page = _args12.length > 1 && _args12[1] !== undefined ? _args12[1] : 1;
            limit = _args12.length > 2 && _args12[2] !== undefined ? _args12[2] : 20;
            signal = _args12.length > 3 && _args12[3] !== undefined ? _args12[3] : null;
            _context12.prev = 4;
            url = "".concat(BASE_URL, "/requests?select=*");

            if (filters.status) {
              url += "&status=eq.".concat(filters.status);
            }

            if (filters.request) {
              searchTerm = encodeURIComponent(filters.request);
              url += "&or=(title.ilike.*".concat(searchTerm, "*,notes.ilike.*").concat(searchTerm, "*)");
            }

            offset = (page - 1) * limit;
            url += "&limit=".concat(limit, "&offset=").concat(offset);
            sortMap = {
              'date_new': 'createdat.desc',
              'date_old': 'createdat.asc',
              'relevance': 'createdat.desc'
            };
            url += "&order=".concat(sortMap[filters.sortBy] || 'createdat.desc');
            _context12.next = 14;
            return regeneratorRuntime.awrap(fetchWithRetry(url, {
              headers: _objectSpread({}, getHeaders('GET'), {
                'Prefer': 'count=exact'
              }),
              signal: signal
            }));

          case 14:
            response = _context12.sent;
            total = 0;
            contentRange = response.headers.get('content-range');

            if (contentRange) {
              match = contentRange.match(/\/(\d+)/);
              if (match) total = parseInt(match[1], 10);
            }

            _context12.next = 20;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 20:
            data = _context12.sent;

            if (!(Array.isArray(data) && data.length > 0)) {
              _context12.next = 29;
              break;
            }

            clientIds = _toConsumableArray(new Set(data.map(function (r) {
              return r.clientid;
            }).filter(function (id) {
              return id;
            })));

            if (!(clientIds.length > 0)) {
              _context12.next = 29;
              break;
            }

            _context12.next = 26;
            return regeneratorRuntime.awrap(getClientsMap(clientIds));

          case 26:
            clientsMap = _context12.sent;
            dataWithClients = data.map(function (request) {
              return _objectSpread({}, request, {
                _type: 'request',
                client_name: clientsMap.get(request.clientid) || 'Unknown Client'
              });
            });
            return _context12.abrupt("return", {
              data: dataWithClients,
              total: total,
              page: page,
              totalPages: Math.ceil(total / limit)
            });

          case 29:
            return _context12.abrupt("return", {
              data: Array.isArray(data) ? data.map(function (r) {
                return _objectSpread({}, r, {
                  _type: 'request',
                  client_name: 'Unknown Client'
                });
              }) : [],
              total: total,
              page: page,
              totalPages: Math.ceil(total / limit)
            });

          case 32:
            _context12.prev = 32;
            _context12.t0 = _context12["catch"](4);

            if (!(_context12.t0.name === 'AbortError')) {
              _context12.next = 36;
              break;
            }

            throw _context12.t0;

          case 36:
            console.error('Error searching requests:', _context12.t0);
            throw _context12.t0;

          case 38:
          case "end":
            return _context12.stop();
        }
      }
    }, null, null, [[4, 32]]);
  }
  /**
   * Helper function to get clients map by IDs
   */


  function getClientsMap(ids) {
    var idsParam, url, response, clients, map;
    return regeneratorRuntime.async(function getClientsMap$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            if (!(!ids || ids.length === 0)) {
              _context13.next = 2;
              break;
            }

            return _context13.abrupt("return", new Map());

          case 2:
            _context13.prev = 2;
            idsParam = ids.join(',');
            url = "".concat(BASE_URL, "/clients?select=id,name&id=in.(").concat(idsParam, ")");
            _context13.next = 7;
            return regeneratorRuntime.awrap(fetch(url, {
              headers: getHeaders('GET')
            }));

          case 7:
            response = _context13.sent;

            if (response.ok) {
              _context13.next = 10;
              break;
            }

            return _context13.abrupt("return", new Map());

          case 10:
            _context13.next = 12;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 12:
            clients = _context13.sent;
            map = new Map();

            if (Array.isArray(clients)) {
              clients.forEach(function (client) {
                map.set(client.id, client.name || 'Unknown Client');
              });
            }

            return _context13.abrupt("return", map);

          case 18:
            _context13.prev = 18;
            _context13.t0 = _context13["catch"](2);
            console.error('Error fetching clients map:', _context13.t0);
            return _context13.abrupt("return", new Map());

          case 22:
          case "end":
            return _context13.stop();
        }
      }
    }, null, null, [[2, 18]]);
  } // ==================== LEGACY COMPATIBILITY FUNCTIONS ====================


  function getClients() {
    var page,
        limit,
        result,
        _args14 = arguments;
    return regeneratorRuntime.async(function getClients$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            page = _args14.length > 0 && _args14[0] !== undefined ? _args14[0] : 1;
            limit = _args14.length > 1 && _args14[1] !== undefined ? _args14[1] : 100;
            _context14.next = 4;
            return regeneratorRuntime.awrap(searchClients({}, page, limit));

          case 4:
            result = _context14.sent;
            return _context14.abrupt("return", result.data);

          case 6:
          case "end":
            return _context14.stop();
        }
      }
    });
  }

  function getCars() {
    var page,
        limit,
        result,
        _args15 = arguments;
    return regeneratorRuntime.async(function getCars$(_context15) {
      while (1) {
        switch (_context15.prev = _context15.next) {
          case 0:
            page = _args15.length > 0 && _args15[0] !== undefined ? _args15[0] : 1;
            limit = _args15.length > 1 && _args15[1] !== undefined ? _args15[1] : 100;
            _context15.next = 4;
            return regeneratorRuntime.awrap(searchCars({}, page, limit));

          case 4:
            result = _context15.sent;
            return _context15.abrupt("return", result.data);

          case 6:
          case "end":
            return _context15.stop();
        }
      }
    });
  }

  function getRequests() {
    var page,
        limit,
        result,
        _args16 = arguments;
    return regeneratorRuntime.async(function getRequests$(_context16) {
      while (1) {
        switch (_context16.prev = _context16.next) {
          case 0:
            page = _args16.length > 0 && _args16[0] !== undefined ? _args16[0] : 1;
            limit = _args16.length > 1 && _args16[1] !== undefined ? _args16[1] : 100;
            _context16.next = 4;
            return regeneratorRuntime.awrap(searchRequests({}, page, limit));

          case 4:
            result = _context16.sent;
            return _context16.abrupt("return", result.data);

          case 6:
          case "end":
            return _context16.stop();
        }
      }
    });
  } // ==================== CRUD OPERATIONS ====================


  function getClient(id) {
    var response, data;
    return regeneratorRuntime.async(function getClient$(_context17) {
      while (1) {
        switch (_context17.prev = _context17.next) {
          case 0:
            _context17.prev = 0;
            _context17.next = 3;
            return regeneratorRuntime.awrap(fetchWithRetry("".concat(BASE_URL, "/clients?id=eq.").concat(id, "&select=*"), {
              headers: getHeaders('GET')
            }));

          case 3:
            response = _context17.sent;
            _context17.next = 6;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 6:
            data = _context17.sent;
            return _context17.abrupt("return", data[0] || null);

          case 10:
            _context17.prev = 10;
            _context17.t0 = _context17["catch"](0);
            console.error("Error fetching client ".concat(id, ":"), _context17.t0);
            throw _context17.t0;

          case 14:
          case "end":
            return _context17.stop();
        }
      }
    }, null, null, [[0, 10]]);
  }

  function addClient(client) {
    var newClient, response, data;
    return regeneratorRuntime.async(function addClient$(_context18) {
      while (1) {
        switch (_context18.prev = _context18.next) {
          case 0:
            _context18.prev = 0;
            newClient = {
              name: client.name,
              email: client.email || null,
              phone: client.phone || null,
              notes: client.notes || null,
              registeredat: new Date().toISOString(),
              updatedat: new Date().toISOString()
            };
            _context18.next = 4;
            return regeneratorRuntime.awrap(fetchWithRetry("".concat(BASE_URL, "/clients"), {
              method: "POST",
              headers: getHeaders('POST'),
              body: JSON.stringify(newClient)
            }));

          case 4:
            response = _context18.sent;
            _context18.next = 7;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 7:
            data = _context18.sent;
            return _context18.abrupt("return", Array.isArray(data) ? data[0] : data);

          case 11:
            _context18.prev = 11;
            _context18.t0 = _context18["catch"](0);
            console.error('Error adding client:', _context18.t0);
            throw _context18.t0;

          case 15:
          case "end":
            return _context18.stop();
        }
      }
    }, null, null, [[0, 11]]);
  }

  function updateClient(id, client) {
    var updatedClient, response, data;
    return regeneratorRuntime.async(function updateClient$(_context19) {
      while (1) {
        switch (_context19.prev = _context19.next) {
          case 0:
            _context19.prev = 0;
            updatedClient = {
              name: client.name,
              email: client.email || null,
              phone: client.phone || null,
              notes: client.notes || null,
              updatedat: new Date().toISOString()
            };
            _context19.next = 4;
            return regeneratorRuntime.awrap(fetchWithRetry("".concat(BASE_URL, "/clients?id=eq.").concat(id), {
              method: "PATCH",
              headers: getHeaders('PATCH'),
              body: JSON.stringify(updatedClient)
            }));

          case 4:
            response = _context19.sent;
            _context19.next = 7;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 7:
            data = _context19.sent;
            return _context19.abrupt("return", Array.isArray(data) ? data[0] : data);

          case 11:
            _context19.prev = 11;
            _context19.t0 = _context19["catch"](0);
            console.error("Error updating client ".concat(id, ":"), _context19.t0);
            throw _context19.t0;

          case 15:
          case "end":
            return _context19.stop();
        }
      }
    }, null, null, [[0, 11]]);
  }

  function deleteClient(id) {
    var response;
    return regeneratorRuntime.async(function deleteClient$(_context20) {
      while (1) {
        switch (_context20.prev = _context20.next) {
          case 0:
            _context20.prev = 0;
            _context20.next = 3;
            return regeneratorRuntime.awrap(fetchWithRetry("".concat(BASE_URL, "/clients?id=eq.").concat(id), {
              method: "DELETE",
              headers: getHeaders('DELETE')
            }));

          case 3:
            response = _context20.sent;
            _context20.next = 6;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 6:
            return _context20.abrupt("return", _context20.sent);

          case 9:
            _context20.prev = 9;
            _context20.t0 = _context20["catch"](0);
            console.error("Error deleting client ".concat(id, ":"), _context20.t0);
            throw _context20.t0;

          case 13:
          case "end":
            return _context20.stop();
        }
      }
    }, null, null, [[0, 9]]);
  }

  function getRequest(id) {
    var response, data;
    return regeneratorRuntime.async(function getRequest$(_context21) {
      while (1) {
        switch (_context21.prev = _context21.next) {
          case 0:
            _context21.prev = 0;
            _context21.next = 3;
            return regeneratorRuntime.awrap(fetchWithRetry("".concat(BASE_URL, "/requests?id=eq.").concat(id, "&select=*"), {
              headers: getHeaders('GET')
            }));

          case 3:
            response = _context21.sent;
            _context21.next = 6;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 6:
            data = _context21.sent;
            return _context21.abrupt("return", data[0] || null);

          case 10:
            _context21.prev = 10;
            _context21.t0 = _context21["catch"](0);
            console.error("Error fetching request ".concat(id, ":"), _context21.t0);
            throw _context21.t0;

          case 14:
          case "end":
            return _context21.stop();
        }
      }
    }, null, null, [[0, 10]]);
  }

  function addRequest(request) {
    var newRequest, response, data;
    return regeneratorRuntime.async(function addRequest$(_context22) {
      while (1) {
        switch (_context22.prev = _context22.next) {
          case 0:
            _context22.prev = 0;
            newRequest = {
              clientid: request.clientId,
              carid: request.carId,
              status: request.status,
              title: request.title || "Request - ".concat(new Date().toLocaleDateString()),
              notes: request.notes || null,
              createdat: new Date().toISOString()
            };
            _context22.next = 4;
            return regeneratorRuntime.awrap(fetchWithRetry("".concat(BASE_URL, "/requests"), {
              method: "POST",
              headers: getHeaders('POST'),
              body: JSON.stringify(newRequest)
            }));

          case 4:
            response = _context22.sent;
            _context22.next = 7;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 7:
            data = _context22.sent;
            return _context22.abrupt("return", Array.isArray(data) ? data[0] : data);

          case 11:
            _context22.prev = 11;
            _context22.t0 = _context22["catch"](0);
            console.error('Error adding request:', _context22.t0);
            throw _context22.t0;

          case 15:
          case "end":
            return _context22.stop();
        }
      }
    }, null, null, [[0, 11]]);
  }

  function updateRequest(id, request) {
    var updatedRequest, response, data;
    return regeneratorRuntime.async(function updateRequest$(_context23) {
      while (1) {
        switch (_context23.prev = _context23.next) {
          case 0:
            _context23.prev = 0;
            updatedRequest = {
              clientid: request.clientId,
              carid: request.carId,
              status: request.status,
              title: request.title,
              notes: request.notes || null
            };
            _context23.next = 4;
            return regeneratorRuntime.awrap(fetchWithRetry("".concat(BASE_URL, "/requests?id=eq.").concat(id), {
              method: "PATCH",
              headers: getHeaders('PATCH'),
              body: JSON.stringify(updatedRequest)
            }));

          case 4:
            response = _context23.sent;
            _context23.next = 7;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 7:
            data = _context23.sent;
            return _context23.abrupt("return", Array.isArray(data) ? data[0] : data);

          case 11:
            _context23.prev = 11;
            _context23.t0 = _context23["catch"](0);
            console.error("Error updating request ".concat(id, ":"), _context23.t0);
            throw _context23.t0;

          case 15:
          case "end":
            return _context23.stop();
        }
      }
    }, null, null, [[0, 11]]);
  }

  function deleteRequest(id) {
    var response;
    return regeneratorRuntime.async(function deleteRequest$(_context24) {
      while (1) {
        switch (_context24.prev = _context24.next) {
          case 0:
            _context24.prev = 0;
            _context24.next = 3;
            return regeneratorRuntime.awrap(fetchWithRetry("".concat(BASE_URL, "/requests?id=eq.").concat(id), {
              method: "DELETE",
              headers: getHeaders('DELETE')
            }));

          case 3:
            response = _context24.sent;
            _context24.next = 6;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 6:
            return _context24.abrupt("return", _context24.sent);

          case 9:
            _context24.prev = 9;
            _context24.t0 = _context24["catch"](0);
            console.error("Error deleting request ".concat(id, ":"), _context24.t0);
            throw _context24.t0;

          case 13:
          case "end":
            return _context24.stop();
        }
      }
    }, null, null, [[0, 9]]);
  }

  function getCar(id) {
    var response, data;
    return regeneratorRuntime.async(function getCar$(_context25) {
      while (1) {
        switch (_context25.prev = _context25.next) {
          case 0:
            _context25.prev = 0;
            _context25.next = 3;
            return regeneratorRuntime.awrap(fetchWithRetry("".concat(BASE_URL, "/cars?id=eq.").concat(id, "&select=*"), {
              headers: getHeaders('GET')
            }));

          case 3:
            response = _context25.sent;
            _context25.next = 6;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 6:
            data = _context25.sent;
            return _context25.abrupt("return", data[0] || null);

          case 10:
            _context25.prev = 10;
            _context25.t0 = _context25["catch"](0);
            console.error("Error fetching car ".concat(id, ":"), _context25.t0);
            throw _context25.t0;

          case 14:
          case "end":
            return _context25.stop();
        }
      }
    }, null, null, [[0, 10]]);
  }

  function addCar(car) {
    var newCar, response, data;
    return regeneratorRuntime.async(function addCar$(_context26) {
      while (1) {
        switch (_context26.prev = _context26.next) {
          case 0:
            _context26.prev = 0;
            newCar = {
              brand: car.brand,
              model: car.model,
              year: car.year,
              condition: car.condition,
              color: car.color,
              category: car.category,
              price: car.price || null,
              notes: car.notes || null,
              licenseplate: car.licensePlate || null,
              clientid: car.clientId || null,
              createdat: new Date().toISOString()
            };
            _context26.next = 4;
            return regeneratorRuntime.awrap(fetchWithRetry("".concat(BASE_URL, "/cars"), {
              method: "POST",
              headers: getHeaders('POST'),
              body: JSON.stringify(newCar)
            }));

          case 4:
            response = _context26.sent;
            _context26.next = 7;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 7:
            data = _context26.sent;
            return _context26.abrupt("return", Array.isArray(data) ? data[0] : data);

          case 11:
            _context26.prev = 11;
            _context26.t0 = _context26["catch"](0);
            console.error('Error adding car:', _context26.t0);
            throw _context26.t0;

          case 15:
          case "end":
            return _context26.stop();
        }
      }
    }, null, null, [[0, 11]]);
  }

  function updateCar(id, car) {
    var updatedCar, response, data;
    return regeneratorRuntime.async(function updateCar$(_context27) {
      while (1) {
        switch (_context27.prev = _context27.next) {
          case 0:
            _context27.prev = 0;
            updatedCar = {
              brand: car.brand,
              model: car.model,
              year: car.year,
              condition: car.condition,
              color: car.color,
              category: car.category,
              price: car.price || null,
              notes: car.notes || null,
              licenseplate: car.licensePlate || null
            };
            _context27.next = 4;
            return regeneratorRuntime.awrap(fetchWithRetry("".concat(BASE_URL, "/cars?id=eq.").concat(id), {
              method: "PATCH",
              headers: getHeaders('PATCH'),
              body: JSON.stringify(updatedCar)
            }));

          case 4:
            response = _context27.sent;
            _context27.next = 7;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 7:
            data = _context27.sent;
            return _context27.abrupt("return", Array.isArray(data) ? data[0] : data);

          case 11:
            _context27.prev = 11;
            _context27.t0 = _context27["catch"](0);
            console.error("Error updating car ".concat(id, ":"), _context27.t0);
            throw _context27.t0;

          case 15:
          case "end":
            return _context27.stop();
        }
      }
    }, null, null, [[0, 11]]);
  }

  function deleteCar(id) {
    var response;
    return regeneratorRuntime.async(function deleteCar$(_context28) {
      while (1) {
        switch (_context28.prev = _context28.next) {
          case 0:
            _context28.prev = 0;
            _context28.next = 3;
            return regeneratorRuntime.awrap(fetchWithRetry("".concat(BASE_URL, "/cars?id=eq.").concat(id), {
              method: "DELETE",
              headers: getHeaders('DELETE')
            }));

          case 3:
            response = _context28.sent;
            _context28.next = 6;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 6:
            return _context28.abrupt("return", _context28.sent);

          case 9:
            _context28.prev = 9;
            _context28.t0 = _context28["catch"](0);
            console.error("Error deleting car ".concat(id, ":"), _context28.t0);
            throw _context28.t0;

          case 13:
          case "end":
            return _context28.stop();
        }
      }
    }, null, null, [[0, 9]]);
  } // ==================== EXPORT API ====================


  var apiExports = {
    BASE_URL: BASE_URL,
    getHeaders: getHeaders,
    handleResponse: handleResponse,
    // Lightweight filter options
    getUniqueBrands: getUniqueBrands,
    getUniqueYears: getUniqueYears,
    getUniqueColors: getUniqueColors,
    getUniqueCategories: getUniqueCategories,
    getUniqueConditions: getUniqueConditions,
    getModelsByBrand: getModelsByBrand,
    // Search functions (backend filtering)
    searchClients: searchClients,
    searchCars: searchCars,
    searchRequests: searchRequests,
    // Legacy compatibility
    getClients: getClients,
    getCars: getCars,
    getRequests: getRequests,
    // CRUD operations
    getClient: getClient,
    addClient: addClient,
    updateClient: updateClient,
    deleteClient: deleteClient,
    getRequest: getRequest,
    addRequest: addRequest,
    updateRequest: updateRequest,
    deleteRequest: deleteRequest,
    getCar: getCar,
    addCar: addCar,
    updateCar: updateCar,
    deleteCar: deleteCar
  };
  return apiExports;
}();

window.API = API;
//# sourceMappingURL=api.dev.js.map
