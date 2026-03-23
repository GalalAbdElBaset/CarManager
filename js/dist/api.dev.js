"use strict";

/**
 * API Module - Handles all HTTP requests to Supabase REST API
 */
var API = function () {
  var BASE_URL = "https://pjgixwacmudsjcdjwqdc.supabase.co/rest/v1";
  var API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBqZ2l4d2FjbXVkc2pjZGp3cWRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTI2MDQsImV4cCI6MjA4OTY2ODYwNH0.cXZLKO3QbW-G7hca4_8c8pH2n7suRHvvBJO6F459lkU";

  function getHeaders() {
    return {
      "Content-Type": "application/json",
      "apikey": API_KEY,
      "Authorization": "Bearer ".concat(API_KEY),
      "Prefer": "return=representation"
    };
  }

  function handleResponse(response) {
    var error;
    return regeneratorRuntime.async(function handleResponse$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (response.ok) {
              _context.next = 5;
              break;
            }

            _context.next = 3;
            return regeneratorRuntime.awrap(response.json()["catch"](function () {
              return {};
            }));

          case 3:
            error = _context.sent;
            throw new Error(error.message || "HTTP error! status: ".concat(response.status));

          case 5:
            if (!(response.status === 204)) {
              _context.next = 7;
              break;
            }

            return _context.abrupt("return", true);

          case 7:
            return _context.abrupt("return", response.json());

          case 8:
          case "end":
            return _context.stop();
        }
      }
    });
  } // ==================== CLIENTS API ====================


  function getClients() {
    var response;
    return regeneratorRuntime.async(function getClients$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return regeneratorRuntime.awrap(fetch("".concat(BASE_URL, "/clients?select=*"), {
              headers: getHeaders()
            }));

          case 2:
            response = _context2.sent;
            return _context2.abrupt("return", handleResponse(response));

          case 4:
          case "end":
            return _context2.stop();
        }
      }
    });
  }

  function getClient(id) {
    var response, data;
    return regeneratorRuntime.async(function getClient$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return regeneratorRuntime.awrap(fetch("".concat(BASE_URL, "/clients?id=eq.").concat(id, "&select=*"), {
              headers: getHeaders()
            }));

          case 2:
            response = _context3.sent;
            _context3.next = 5;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 5:
            data = _context3.sent;
            return _context3.abrupt("return", data[0] || null);

          case 7:
          case "end":
            return _context3.stop();
        }
      }
    });
  }

  function addClient(client) {
    var newClient, response, data;
    return regeneratorRuntime.async(function addClient$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            newClient = {
              name: client.name,
              email: client.email,
              phone: client.phone,
              notes: client.notes,
              registeredat: client.registeredAt,
              updatedat: client.updatedAt
            };
            _context4.next = 3;
            return regeneratorRuntime.awrap(fetch("".concat(BASE_URL, "/clients"), {
              method: "POST",
              headers: getHeaders(),
              body: JSON.stringify(newClient)
            }));

          case 3:
            response = _context4.sent;
            _context4.next = 6;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 6:
            data = _context4.sent;
            return _context4.abrupt("return", data[0]);

          case 8:
          case "end":
            return _context4.stop();
        }
      }
    });
  }

  function updateClient(id, client) {
    var updatedClient, response, data;
    return regeneratorRuntime.async(function updateClient$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            updatedClient = {
              name: client.name,
              email: client.email,
              phone: client.phone,
              notes: client.notes,
              updatedat: client.updatedAt
            };
            _context5.next = 3;
            return regeneratorRuntime.awrap(fetch("".concat(BASE_URL, "/clients?id=eq.").concat(id), {
              method: "PATCH",
              headers: getHeaders(),
              body: JSON.stringify(updatedClient)
            }));

          case 3:
            response = _context5.sent;
            _context5.next = 6;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 6:
            data = _context5.sent;
            return _context5.abrupt("return", data[0]);

          case 8:
          case "end":
            return _context5.stop();
        }
      }
    });
  }

  function deleteClient(id) {
    var response;
    return regeneratorRuntime.async(function deleteClient$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return regeneratorRuntime.awrap(fetch("".concat(BASE_URL, "/clients?id=eq.").concat(id), {
              method: "DELETE",
              headers: getHeaders()
            }));

          case 2:
            response = _context6.sent;
            return _context6.abrupt("return", handleResponse(response));

          case 4:
          case "end":
            return _context6.stop();
        }
      }
    });
  } // ==================== REQUESTS API ====================


  function getRequests() {
    var response;
    return regeneratorRuntime.async(function getRequests$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.next = 2;
            return regeneratorRuntime.awrap(fetch("".concat(BASE_URL, "/requests?select=*"), {
              headers: getHeaders()
            }));

          case 2:
            response = _context7.sent;
            return _context7.abrupt("return", handleResponse(response));

          case 4:
          case "end":
            return _context7.stop();
        }
      }
    });
  }

  function getRequest(id) {
    var response, data;
    return regeneratorRuntime.async(function getRequest$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.next = 2;
            return regeneratorRuntime.awrap(fetch("".concat(BASE_URL, "/requests?id=eq.").concat(id, "&select=*"), {
              headers: getHeaders()
            }));

          case 2:
            response = _context8.sent;
            _context8.next = 5;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 5:
            data = _context8.sent;
            return _context8.abrupt("return", data[0] || null);

          case 7:
          case "end":
            return _context8.stop();
        }
      }
    });
  }

  function addRequest(request) {
    var newRequest, response, data;
    return regeneratorRuntime.async(function addRequest$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            newRequest = {
              clientid: request.clientId,
              carid: request.carId,
              status: request.status,
              title: request.title || "New Request",
              clientname: request.clientName,
              carname: request.carName,
              notes: request.notes || "",
              createdat: new Date().toISOString()
            };
            console.log("Sending request:", newRequest);
            _context9.next = 4;
            return regeneratorRuntime.awrap(fetch("".concat(BASE_URL, "/requests"), {
              method: "POST",
              headers: getHeaders(),
              body: JSON.stringify(newRequest)
            }));

          case 4:
            response = _context9.sent;
            _context9.next = 7;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 7:
            data = _context9.sent;
            return _context9.abrupt("return", data[0]);

          case 9:
          case "end":
            return _context9.stop();
        }
      }
    });
  }

  function updateRequest(id, request) {
    var updatedRequest, response, data;
    return regeneratorRuntime.async(function updateRequest$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            updatedRequest = {
              clientid: request.clientId,
              carid: request.carId,
              status: request.status,
              title: request.title,
              clientname: request.clientName,
              carname: request.carName,
              notes: request.notes
            };
            _context10.next = 3;
            return regeneratorRuntime.awrap(fetch("".concat(BASE_URL, "/requests?id=eq.").concat(id), {
              method: "PATCH",
              headers: getHeaders(),
              body: JSON.stringify(updatedRequest)
            }));

          case 3:
            response = _context10.sent;
            _context10.next = 6;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 6:
            data = _context10.sent;
            return _context10.abrupt("return", data[0]);

          case 8:
          case "end":
            return _context10.stop();
        }
      }
    });
  }

  function deleteRequest(id) {
    var response;
    return regeneratorRuntime.async(function deleteRequest$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            _context11.next = 2;
            return regeneratorRuntime.awrap(fetch("".concat(BASE_URL, "/requests?id=eq.").concat(id), {
              method: "DELETE",
              headers: getHeaders()
            }));

          case 2:
            response = _context11.sent;
            return _context11.abrupt("return", handleResponse(response));

          case 4:
          case "end":
            return _context11.stop();
        }
      }
    });
  } // ==================== CARS API ====================


  function getCars() {
    var response;
    return regeneratorRuntime.async(function getCars$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            _context12.next = 2;
            return regeneratorRuntime.awrap(fetch("".concat(BASE_URL, "/cars?select=*"), {
              headers: getHeaders()
            }));

          case 2:
            response = _context12.sent;
            return _context12.abrupt("return", handleResponse(response));

          case 4:
          case "end":
            return _context12.stop();
        }
      }
    });
  }

  function getCar(id) {
    var response, data;
    return regeneratorRuntime.async(function getCar$(_context13) {
      while (1) {
        switch (_context13.prev = _context13.next) {
          case 0:
            _context13.next = 2;
            return regeneratorRuntime.awrap(fetch("".concat(BASE_URL, "/cars?id=eq.").concat(id, "&select=*"), {
              headers: getHeaders()
            }));

          case 2:
            response = _context13.sent;
            _context13.next = 5;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 5:
            data = _context13.sent;
            return _context13.abrupt("return", data[0] || null);

          case 7:
          case "end":
            return _context13.stop();
        }
      }
    });
  }

  function addCar(car) {
    var newCar, response, data;
    return regeneratorRuntime.async(function addCar$(_context14) {
      while (1) {
        switch (_context14.prev = _context14.next) {
          case 0:
            newCar = {
              brand: car.brand,
              model: car.model,
              year: car.year,
              condition: car.condition,
              color: car.color,
              category: car.category,
              price: car.price,
              notes: car.notes || null,
              licenseplate: car.licensePlate || null,
              clientid: car.clientId || null,
              createdat: new Date().toISOString()
            };
            _context14.next = 3;
            return regeneratorRuntime.awrap(fetch("".concat(BASE_URL, "/cars"), {
              method: "POST",
              headers: getHeaders(),
              body: JSON.stringify(newCar)
            }));

          case 3:
            response = _context14.sent;
            _context14.next = 6;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 6:
            data = _context14.sent;
            return _context14.abrupt("return", data[0]);

          case 8:
          case "end":
            return _context14.stop();
        }
      }
    });
  }

  function updateCar(id, car) {
    var updatedCar, response, data;
    return regeneratorRuntime.async(function updateCar$(_context15) {
      while (1) {
        switch (_context15.prev = _context15.next) {
          case 0:
            updatedCar = {
              brand: car.brand,
              model: car.model,
              year: car.year,
              condition: car.condition,
              color: car.color,
              category: car.category,
              price: car.price,
              notes: car.notes || null
            };
            _context15.next = 3;
            return regeneratorRuntime.awrap(fetch("".concat(BASE_URL, "/cars?id=eq.").concat(id), {
              method: "PATCH",
              headers: getHeaders(),
              body: JSON.stringify(updatedCar)
            }));

          case 3:
            response = _context15.sent;
            _context15.next = 6;
            return regeneratorRuntime.awrap(handleResponse(response));

          case 6:
            data = _context15.sent;
            return _context15.abrupt("return", data[0]);

          case 8:
          case "end":
            return _context15.stop();
        }
      }
    });
  }

  function deleteCar(id) {
    var response;
    return regeneratorRuntime.async(function deleteCar$(_context16) {
      while (1) {
        switch (_context16.prev = _context16.next) {
          case 0:
            _context16.next = 2;
            return regeneratorRuntime.awrap(fetch("".concat(BASE_URL, "/cars?id=eq.").concat(id), {
              method: "DELETE",
              headers: getHeaders()
            }));

          case 2:
            response = _context16.sent;
            return _context16.abrupt("return", handleResponse(response));

          case 4:
          case "end":
            return _context16.stop();
        }
      }
    });
  }

  return {
    getClients: getClients,
    getClient: getClient,
    addClient: addClient,
    updateClient: updateClient,
    deleteClient: deleteClient,
    getRequests: getRequests,
    getRequest: getRequest,
    addRequest: addRequest,
    updateRequest: updateRequest,
    deleteRequest: deleteRequest,
    getCars: getCars,
    getCar: getCar,
    addCar: addCar,
    updateCar: updateCar,
    deleteCar: deleteCar
  };
}();

window.API = API;
//# sourceMappingURL=api.dev.js.map
