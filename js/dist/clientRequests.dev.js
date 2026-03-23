"use strict";

document.addEventListener('click', function (e) {
  var btn = e.target.closest('[data-view-client]');

  if (btn) {
    var clientId = btn.dataset.viewClient;
    fetch("".concat(API_URL, "/requests?clientId=").concat(clientId)).then(function (r) {
      return r.json();
    }).then(function (reqs) {
      var screen = document.querySelector('[data-screen="matches"] .content');
      screen.innerHTML = '';
      reqs.forEach(function (r) {
        var card = document.createElement('div');
        card.className = 'card';
        card.innerHTML = "\n                    <strong>".concat(r.brand, " ").concat(r.model, "</strong>\n                    <span class=\"badge\">").concat(r.status, "</span>\n                ");
        screen.appendChild(card);
      });
      showScreen('matches');
    });
  }
});
//# sourceMappingURL=clientRequests.dev.js.map
