"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

// js/dom-manager.js
var DOMManager =
/*#__PURE__*/
function () {
  function DOMManager() {
    _classCallCheck(this, DOMManager);

    this.preventAllRefresh();
    this.initGlobalHandlers();
  } // منع جميع سلوكيات Refresh


  _createClass(DOMManager, [{
    key: "preventAllRefresh",
    value: function preventAllRefresh() {
      // 1. منع سلوك الفورمات
      document.addEventListener('submit', function (e) {
        console.warn('Form submit prevented by DOMManager');
        e.preventDefault();
        e.stopPropagation();
        return false;
      }, {
        capture: true
      }); // 2. ضبط جميع الأزرار ليكون type="button"

      this.fixAllButtons(); // 3. مراقبة DOM للتأكد من بقاء الأزرار آمنة

      this.observeDOMChanges(); // 4. منع Enter في حقول الإدخال

      this.preventEnterSubmit(); // 5. منع قبل إغلاق الصفحة

      this.preventUnload();
    } // إصلاح جميع الأزرار

  }, {
    key: "fixAllButtons",
    value: function fixAllButtons() {
      document.querySelectorAll('button').forEach(function (btn) {
        if (!btn.hasAttribute('type') || btn.type === 'submit') {
          btn.type = 'button';
          btn.setAttribute('data-fixed', 'true');
        }
      });
    } // مراقبة تغييرات DOM

  }, {
    key: "observeDOMChanges",
    value: function observeDOMChanges() {
      var _this = this;

      var observer = new MutationObserver(function (mutations) {
        mutations.forEach(function (mutation) {
          if (mutation.addedNodes.length) {
            setTimeout(function () {
              return _this.fixAllButtons();
            }, 50);
          }
        });
      });
      observer.observe(document.body, {
        childList: true,
        subtree: true
      });
    } // منع Enter من إرسال الفورم

  }, {
    key: "preventEnterSubmit",
    value: function preventEnterSubmit() {
      document.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
          var target = e.target;

          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
            // إذا كان داخل فورم، امنعه
            if (target.closest('form')) {
              e.preventDefault();
              e.stopPropagation();
              console.log('Enter key prevented in form field');
            }
          }
        }
      });
    } // إضافة مستمع حدث آمن

  }, {
    key: "addSafeListener",
    value: function addSafeListener(selector, event, handler) {
      document.addEventListener(event, function (e) {
        var target = e.target.closest(selector);

        if (target) {
          e.preventDefault();
          e.stopPropagation();
          handler.call(target, e);
        }
      });
    } // منع إغلاق الصفحة

  }, {
    key: "preventUnload",
    value: function preventUnload() {
      window.addEventListener('beforeunload', function (e) {// لا تفعل شيئاً - فقط تمنع الرسالة الافتراضية
      });
    } // تهيئة المعالجين العامين

  }, {
    key: "initGlobalHandlers",
    value: function initGlobalHandlers() {
      // معالج النقر العام
      document.addEventListener('click', function (e) {
        var target = e.target; // منع النقر على أي زر

        if (target.tagName === 'BUTTON' || target.closest('button')) {
          e.preventDefault();
          e.stopPropagation();
        } // منع النقر على روابط فارغة


        if (target.tagName === 'A' && (target.getAttribute('href') === '#' || target.getAttribute('href') === 'javascript:void(0)')) {
          e.preventDefault();
          e.stopPropagation();
        }
      }, {
        capture: true
      });
    } // عرض رسالة تحذير

  }, {
    key: "showWarning",
    value: function showWarning(message) {
      console.warn("[DOMManager] ".concat(message));
    }
  }]);

  return DOMManager;
}(); // إنشاء نسخة واحدة فقط


var domManagerInstance = null;

function getDOMManager() {
  if (!domManagerInstance) {
    domManagerInstance = new DOMManager();
  }

  return domManagerInstance;
} // التصدير


if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DOMManager: DOMManager,
    getDOMManager: getDOMManager
  };
}
//# sourceMappingURL=dom-manager.dev.js.map
