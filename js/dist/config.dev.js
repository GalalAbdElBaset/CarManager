"use strict";

// API Base URL
var API_BASE_URL = 'http://localhost:3000';

function getLocalData(key) {
  var response;
  return regeneratorRuntime.async(function getLocalData$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          _context.prev = 0;
          _context.next = 3;
          return regeneratorRuntime.awrap(fetch("".concat(API_BASE_URL, "/").concat(key)));

        case 3:
          response = _context.sent;

          if (response.ok) {
            _context.next = 8;
            break;
          }

          if (!(response.status === 404)) {
            _context.next = 7;
            break;
          }

          return _context.abrupt("return", []);

        case 7:
          throw new Error("Failed to fetch ".concat(key));

        case 8:
          _context.next = 10;
          return regeneratorRuntime.awrap(response.json());

        case 10:
          return _context.abrupt("return", _context.sent);

        case 13:
          _context.prev = 13;
          _context.t0 = _context["catch"](0);
          console.error("Error fetching ".concat(key, ":"), _context.t0);
          return _context.abrupt("return", []);

        case 17:
        case "end":
          return _context.stop();
      }
    }
  }, null, null, [[0, 13]]);
}

function setLocalData(key, data) {
  var existingData, _iteratorNormalCompletion, _didIteratorError, _iteratorError, _iterator, _step, item, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, _item;

  return regeneratorRuntime.async(function setLocalData$(_context2) {
    while (1) {
      switch (_context2.prev = _context2.next) {
        case 0:
          _context2.prev = 0;
          _context2.next = 3;
          return regeneratorRuntime.awrap(getLocalData(key));

        case 3:
          existingData = _context2.sent;
          // Delete all existing items
          _iteratorNormalCompletion = true;
          _didIteratorError = false;
          _iteratorError = undefined;
          _context2.prev = 7;
          _iterator = existingData[Symbol.iterator]();

        case 9:
          if (_iteratorNormalCompletion = (_step = _iterator.next()).done) {
            _context2.next = 21;
            break;
          }

          item = _step.value;
          _context2.prev = 11;
          _context2.next = 14;
          return regeneratorRuntime.awrap(fetch("".concat(API_BASE_URL, "/").concat(key, "/").concat(item.id), {
            method: 'DELETE'
          }));

        case 14:
          _context2.next = 18;
          break;

        case 16:
          _context2.prev = 16;
          _context2.t0 = _context2["catch"](11);

        case 18:
          _iteratorNormalCompletion = true;
          _context2.next = 9;
          break;

        case 21:
          _context2.next = 27;
          break;

        case 23:
          _context2.prev = 23;
          _context2.t1 = _context2["catch"](7);
          _didIteratorError = true;
          _iteratorError = _context2.t1;

        case 27:
          _context2.prev = 27;
          _context2.prev = 28;

          if (!_iteratorNormalCompletion && _iterator["return"] != null) {
            _iterator["return"]();
          }

        case 30:
          _context2.prev = 30;

          if (!_didIteratorError) {
            _context2.next = 33;
            break;
          }

          throw _iteratorError;

        case 33:
          return _context2.finish(30);

        case 34:
          return _context2.finish(27);

        case 35:
          // Post all new items
          _iteratorNormalCompletion2 = true;
          _didIteratorError2 = false;
          _iteratorError2 = undefined;
          _context2.prev = 38;
          _iterator2 = data[Symbol.iterator]();

        case 40:
          if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
            _context2.next = 53;
            break;
          }

          _item = _step2.value;
          _context2.prev = 42;
          _context2.next = 45;
          return regeneratorRuntime.awrap(fetch("".concat(API_BASE_URL, "/").concat(key), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify(_item)
          }));

        case 45:
          _context2.next = 50;
          break;

        case 47:
          _context2.prev = 47;
          _context2.t2 = _context2["catch"](42);
          console.error("Error posting ".concat(key, " item:"), _context2.t2);

        case 50:
          _iteratorNormalCompletion2 = true;
          _context2.next = 40;
          break;

        case 53:
          _context2.next = 59;
          break;

        case 55:
          _context2.prev = 55;
          _context2.t3 = _context2["catch"](38);
          _didIteratorError2 = true;
          _iteratorError2 = _context2.t3;

        case 59:
          _context2.prev = 59;
          _context2.prev = 60;

          if (!_iteratorNormalCompletion2 && _iterator2["return"] != null) {
            _iterator2["return"]();
          }

        case 62:
          _context2.prev = 62;

          if (!_didIteratorError2) {
            _context2.next = 65;
            break;
          }

          throw _iteratorError2;

        case 65:
          return _context2.finish(62);

        case 66:
          return _context2.finish(59);

        case 67:
          _context2.next = 72;
          break;

        case 69:
          _context2.prev = 69;
          _context2.t4 = _context2["catch"](0);
          console.error("Error setting ".concat(key, ":"), _context2.t4);

        case 72:
        case "end":
          return _context2.stop();
      }
    }
  }, null, null, [[0, 69], [7, 23, 27, 35], [11, 16], [28,, 30, 34], [38, 55, 59, 67], [42, 47], [60,, 62, 66]]);
}

function initializeLocalStorage() {
  var carsResponse, clientsResponse, requestsResponse;
  return regeneratorRuntime.async(function initializeLocalStorage$(_context3) {
    while (1) {
      switch (_context3.prev = _context3.next) {
        case 0:
          _context3.prev = 0;
          _context3.next = 3;
          return regeneratorRuntime.awrap(fetch("".concat(API_BASE_URL, "/cars")));

        case 3:
          carsResponse = _context3.sent;

          if (!(carsResponse.status === 404)) {
            _context3.next = 7;
            break;
          }

          _context3.next = 7;
          return regeneratorRuntime.awrap(fetch("".concat(API_BASE_URL, "/cars"), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id: 'init',
              _dummy: true
            })
          }));

        case 7:
          _context3.next = 9;
          return regeneratorRuntime.awrap(fetch("".concat(API_BASE_URL, "/clients")));

        case 9:
          clientsResponse = _context3.sent;

          if (!(clientsResponse.status === 404)) {
            _context3.next = 13;
            break;
          }

          _context3.next = 13;
          return regeneratorRuntime.awrap(fetch("".concat(API_BASE_URL, "/clients"), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id: 'init',
              _dummy: true
            })
          }));

        case 13:
          _context3.next = 15;
          return regeneratorRuntime.awrap(fetch("".concat(API_BASE_URL, "/requests")));

        case 15:
          requestsResponse = _context3.sent;

          if (!(requestsResponse.status === 404)) {
            _context3.next = 19;
            break;
          }

          _context3.next = 19;
          return regeneratorRuntime.awrap(fetch("".concat(API_BASE_URL, "/requests"), {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              id: 'init',
              _dummy: true
            })
          }));

        case 19:
          _context3.next = 24;
          break;

        case 21:
          _context3.prev = 21;
          _context3.t0 = _context3["catch"](0);
          console.error('Error initializing storage:', _context3.t0);

        case 24:
        case "end":
          return _context3.stop();
      }
    }
  }, null, null, [[0, 21]]);
} // Initialize on load


initializeLocalStorage(); // Export functions for use in other modules

window.getLocalData = getLocalData;
window.setLocalData = setLocalData;
//# sourceMappingURL=config.dev.js.map
