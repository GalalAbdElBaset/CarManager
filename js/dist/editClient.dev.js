"use strict";

var currentEditClientId = null; // open edit screen

document.addEventListener('click', function (e) {
  var btn = e.target.closest('[data-edit-client]');

  if (btn) {
    currentEditClientId = btn.dataset.editClient;
    fetch("".concat(API_URL, "/clients/").concat(currentEditClientId)).then(function (r) {
      return r.json();
    }).then(function (c) {
      var inputs = document.querySelectorAll('[data-screen="edit-client"] input');
      inputs[0].value = c.name;
      inputs[1].value = c.phone;
      showScreen('edit-client');
    });
  }
}); // update client

var updateBtn = document.querySelector('[data-update-client]');

if (updateBtn) {
  updateBtn.addEventListener('click', function () {
    var inputs = document.querySelectorAll('[data-screen="edit-client"] input');
    var name = inputs[0].value;
    var phone = inputs[1].value;
    fetch("".concat(API_URL, "/clients/").concat(currentEditClientId), {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: name,
        phone: phone
      })
    }).then(function () {
      showToast('Client updated', 'success');
      loadClients();
      showScreen('clients-list');
    });
  });
}
//# sourceMappingURL=editClient.dev.js.map
