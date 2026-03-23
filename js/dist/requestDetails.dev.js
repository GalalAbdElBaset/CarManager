"use strict";

var currentRequestId = null;
document.addEventListener('click', function (e) {
  var btn = e.target.closest('[data-view-request]');

  if (btn) {
    currentRequestId = btn.dataset.viewRequest;
    fetch("".concat(API_URL, "/requests/").concat(currentRequestId, "?_expand=client")).then(function (r) {
      return r.json();
    }).then(function (rq) {
      var box = document.querySelector('[data-screen="request-details"] .content');
      box.innerHTML = "\n                <p><strong>Client:</strong> ".concat(rq.client.name, "</p>\n                <p><strong>Car:</strong> ").concat(rq.brand, " ").concat(rq.model, "</p>\n                <span class=\"badge\">").concat(rq.status, "</span>\n            ");
      showScreen('request-details');
    });
  }
});
//# sourceMappingURL=requestDetails.dev.js.map
