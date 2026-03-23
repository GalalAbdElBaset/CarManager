"use strict";

// API Fake
var API_URL = 'http://localhost:3000'; // Toast Message

function showToast(message, type, duration) {
  if (!type) type = 'info';
  if (!duration) duration = 3000;
  var toast = document.getElementById('toast');
  var icons = {
    success: 'fa-circle-check',
    error: 'fa-circle-xmark',
    info: 'fa-circle-info'
  };
  toast.className = '';
  toast.classList.add('show');
  toast.classList.add(type);
  toast.innerHTML = "\n        <div class=\"toast-body\">\n            <i class=\"fa-solid ".concat(icons[type], "\"></i>\n            <span>").concat(message, "</span>\n        </div>\n        <div class=\"toast-progress\">\n            <div class=\"toast-progress-bar\"></div>\n        </div>\n    ");
  var bar = toast.querySelector('.toast-progress-bar');
  bar.style.animationDuration = duration + 'ms';
  setTimeout(function () {
    toast.classList.remove('show');
  }, duration);
} // Clients


function addClient(name, phone, notes) {
  fetch(API_URL + '/clients').then(function (res) {
    return res.json();
  }).then(function (clients) {
    var exist = clients.find(function (c) {
      return c.phone === phone;
    });

    if (exist) {
      showToast('Client already exists', 'error');
      return;
    }

    var clientData = {
      name: name,
      phone: phone,
      notes: notes
    };
    fetch(API_URL + '/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(clientData)
    }).then(function (res) {
      return res.json();
    }).then(function () {
      showToast('Client added successfully', 'success');
      loadClients();
    });
  });
}

function loadClients() {
  fetch(API_URL + '/clients').then(function (res) {
    return res.json();
  }).then(function (data) {
    renderClients(data);
  });
}

function renderClients(clients) {
  var box = document.querySelector('[data-screen="clients-list"] .content');
  if (!box) return;
  box.innerHTML = '';
  clients.forEach(function (client) {
    var div = document.createElement('div');
    div.className = 'card';
    div.setAttribute('data-id', client.id);
    div.setAttribute('data-go', 'client-details');
    div.innerHTML = "\n            <strong>".concat(client.name, "</strong>\n            <span>").concat(client.phone, "</span>\n        ");
    box.appendChild(div);
  });
} // Requests (Related To Clients)
// كل request ليه clientId


function addRequest(clientId, brand, model) {
  var requestData = {
    clientId: clientId,
    brand: brand,
    model: model,
    status: 'open'
  };
  fetch(API_URL + '/requests', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestData)
  }).then(function (res) {
    return res.json();
  }).then(function () {
    showToast('Request added', 'success');
    loadRequests();
  });
}

function loadRequests() {
  fetch(API_URL + '/requests?_expand=client').then(function (res) {
    return res.json();
  }).then(function (data) {
    renderRequests(data);
  });
}

function renderRequests(requests) {
  var box = document.querySelector('[data-screen="requests-list"] .content');
  if (!box) return;
  box.innerHTML = '';
  requests.forEach(function (req) {
    var div = document.createElement('div');
    div.className = 'card';
    div.setAttribute('data-id', req.id);
    div.setAttribute('data-go', 'request-details');
    div.innerHTML = "\n            <strong>".concat(req.client ? req.client.name : 'Unknown Client', "</strong>\n            <span>").concat(req.brand, " - ").concat(req.model, "</span>\n            <span class=\"badge\">").concat(req.status, "</span>\n        ");
    box.appendChild(div);
  });
} // Initial Load


loadClients();
loadRequests();
//# sourceMappingURL=Requsts.dev.js.map
