"use strict";

/*
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 12 2019
 *
 */

/* global BackupApi, globalRootUrl, backupCreateWorker */
var createBackup = {
  $formObj: $('#backup-create-form'),
  $submitButton: $('#submitbutton'),
  $stopCreateBackup: $('#stopbackupbutton'),
  $statusToggle: $('#module-status-toggle'),
  initialize: function () {
    function initialize() {
      // Если модуль отключен возврат в начало
      if (!$('#module-status-toggle').checkbox('is checked')) {
        window.location = "".concat(globalRootUrl, "module-backup/index");
      }

      createBackup.$submitButton.addClass('loading');
      createBackup.$stopCreateBackup.hide();
      $('.backup-options').checkbox();
      createBackup.$submitButton.on('click', function (e) {
        e.preventDefault();
        createBackup.$formObj.form({
          on: 'blur',
          fields: createBackup.validateRules,
          onSuccess: function () {
            function onSuccess() {
              var formData = createBackup.$formObj.form('get values');
              var sendData = {};
              Object.keys(formData).forEach(function (key) {
                sendData[key] = formData[key] === 'on' ? '1' : '0';
              });
              backupCreateWorker.backupIsPreparing = true;
              createBackup.$submitButton.addClass('loading');
              BackupApi.BackupStart(sendData, createBackup.cbAfterSendForm);
            }

            return onSuccess;
          }()
        });
        createBackup.$formObj.form('validate form');
      });
      createBackup.$stopCreateBackup.on('click', function (e) {
        e.preventDefault();
        var id = $(e.target).closest('button').attr('data-value');
        BackupApi.BackupStop(id, createBackup.cbAfterSendForm);
      });
      backupCreateWorker.initialize('');
      BackupApi.BackupGetEstimatedSize(createBackup.cbAfterGetEstimatedSize);
    }

    return initialize;
  }(),
  cbAfterSendForm: function () {
    function cbAfterSendForm(response) {
      if (response.length === 0 || response === false) {
        createBackup.$submitButton.removeClass('loading');
      } else {
        backupCreateWorker.initialize(response.id);
      }
    }

    return cbAfterSendForm;
  }(),
  cbAfterGetEstimatedSize: function () {
    function cbAfterGetEstimatedSize(response) {
      if (response.length === 0 || response === false) return;
      $.each(response, function (key, value) {
        var $el = $("#".concat(key)).parent().find('label');

        if ($el !== undefined) {
          $el.html("".concat($el.html(), " ( ").concat(value, " Mb )"));
        }
      });
    }

    return cbAfterGetEstimatedSize;
  }()
};
$(document).ready(function () {
  createBackup.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9iYWNrdXAtY3JlYXRlLmpzIl0sIm5hbWVzIjpbImNyZWF0ZUJhY2t1cCIsIiRmb3JtT2JqIiwiJCIsIiRzdWJtaXRCdXR0b24iLCIkc3RvcENyZWF0ZUJhY2t1cCIsIiRzdGF0dXNUb2dnbGUiLCJpbml0aWFsaXplIiwiY2hlY2tib3giLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImdsb2JhbFJvb3RVcmwiLCJhZGRDbGFzcyIsImhpZGUiLCJvbiIsImUiLCJwcmV2ZW50RGVmYXVsdCIsImZvcm0iLCJmaWVsZHMiLCJ2YWxpZGF0ZVJ1bGVzIiwib25TdWNjZXNzIiwiZm9ybURhdGEiLCJzZW5kRGF0YSIsIk9iamVjdCIsImtleXMiLCJmb3JFYWNoIiwia2V5IiwiYmFja3VwQ3JlYXRlV29ya2VyIiwiYmFja3VwSXNQcmVwYXJpbmciLCJCYWNrdXBBcGkiLCJCYWNrdXBTdGFydCIsImNiQWZ0ZXJTZW5kRm9ybSIsImlkIiwidGFyZ2V0IiwiY2xvc2VzdCIsImF0dHIiLCJCYWNrdXBTdG9wIiwiQmFja3VwR2V0RXN0aW1hdGVkU2l6ZSIsImNiQWZ0ZXJHZXRFc3RpbWF0ZWRTaXplIiwicmVzcG9uc2UiLCJsZW5ndGgiLCJyZW1vdmVDbGFzcyIsImVhY2giLCJ2YWx1ZSIsIiRlbCIsInBhcmVudCIsImZpbmQiLCJ1bmRlZmluZWQiLCJodG1sIiwiZG9jdW1lbnQiLCJyZWFkeSJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7Ozs7QUFRQTtBQUVBLElBQU1BLFlBQVksR0FBRztBQUNwQkMsRUFBQUEsUUFBUSxFQUFFQyxDQUFDLENBQUMscUJBQUQsQ0FEUztBQUVwQkMsRUFBQUEsYUFBYSxFQUFFRCxDQUFDLENBQUMsZUFBRCxDQUZJO0FBR3BCRSxFQUFBQSxpQkFBaUIsRUFBRUYsQ0FBQyxDQUFDLG1CQUFELENBSEE7QUFJcEJHLEVBQUFBLGFBQWEsRUFBRUgsQ0FBQyxDQUFDLHVCQUFELENBSkk7QUFLcEJJLEVBQUFBLFVBTG9CO0FBQUEsMEJBS1A7QUFDWjtB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QUFvQixDQUFwQixJQUF5QkQsUUFBUSxLQUFLLEtBQTFDLEVBQWlEO0FBQ2pEcEMsTUFBQUEsQ0FBQyxDQUFDdUMsSUFBRixDQUFPSCxRQUFQLEVBQWlCLFVBQUNiLEdBQUQsRUFBTWlCLEtBQU4sRUFBZ0I7QUFDaEMsWUFBTUMsR0FBRyxHQUFHekMsQ0FBQyxZQUFLdUIsR0FBTCxFQUFELENBQWFtQixNQUFiLEdBQXNCQyxJQUF0QixDQUEyQixPQUEzQixDQUFaOztBQUNBLFlBQUlGLEdBQUcsS0FBS0csU0FBWixFQUF1QjtBQUN0QkgsVUFBQUEsR0FBRyxDQUFDSSxJQUFKLFdBQVlKLEdBQUcsQ0FBQ0ksSUFBSixFQUFaLGdCQUE0QkwsS0FBNUI7QUFDQTtBQUNELE9BTEQ7QUFNQTs7QUF2RG1CO0FBQUE7QUFBQSxDQUFyQjtBQTJEQXhDLENBQUMsQ0FBQzhDLFFBQUQsQ0FBRCxDQUFZQyxLQUFaLENBQWtCLFlBQU07QUFDdkJqRCxFQUFBQSxZQUFZLENBQUNNLFVBQWI7QUFDQSxDQUZEIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAoQykgTUlLTyBMTEMgLSBBbGwgUmlnaHRzIFJlc2VydmVkXG4gKiBVbmF1dGhvcml6ZWQgY29weWluZyBvZiB0aGlzIGZpbGUsIHZpYSBhbnkgbWVkaXVtIGlzIHN0cmljdGx5IHByb2hpYml0ZWRcbiAqIFByb3ByaWV0YXJ5IGFuZCBjb25maWRlbnRpYWxcbiAqIFdyaXR0ZW4gYnkgTmlrb2xheSBCZWtldG92LCAxMiAyMDE5XG4gKlxuICovXG5cbi8qIGdsb2JhbCBCYWNrdXBBcGksIGdsb2JhbFJvb3RVcmwsIGJhY2t1cENyZWF0ZVdvcmtlciAqL1xuXG5jb25zdCBjcmVhdGVCYWNrdXAgPSB7XG5cdCRmb3JtT2JqOiAkKCcjYmFja3VwLWNyZWF0ZS1mb3JtJyksXG5cdCRzdWJtaXRCdXR0b246ICQoJyNzdWJtaXRidXR0b24nKSxcblx0JHN0b3BDcmVhdGVCYWNrdXA6ICQoJyNzdG9wYmFja3VwYnV0dG9uJyksXG5cdCRzdGF0dXNUb2dnbGU6ICQoJyNtb2R1bGUtc3RhdHVzLXRvZ2dsZScpLFxuXHRpbml0aWFsaXplKCkge1xuXHRcdC8vINCV0YHQu9C4INC80L7QtNGD0LvRjCDQvtGC0LrQu9GO0YfQtdC9INCy0L7Qt9Cy0YDQsNGCINCyINC90LDRh9Cw0LvQvlxuXHRcdGlmICghJCgnI21vZHVsZS1zdGF0dXMtdG9nZ2xlJykuY2hlY2tib3goJ2lzIGNoZWNrZWQnKSkge1xuXHRcdFx0d2luZG93LmxvY2F0aW9uID0gYCR7Z2xvYmFsUm9vdFVybH1tb2R1bGUtYmFja3VwL2luZGV4YDtcblx0XHR9XG5cdFx0Y3JlYXRlQmFja3VwLiRzdWJtaXRCdXR0b24uYWRkQ2xhc3MoJ2xvYWRpbmcnKTtcblx0XHRjcmVhdGVCYWNrdXAuJHN0b3BDcmVhdGVCYWNrdXAuaGlkZSgpO1xuXHRcdCQoJy5iYWNrdXAtb3B0aW9ucycpLmNoZWNrYm94KCk7XG5cdFx0Y3JlYXRlQmFja3VwLiRzdWJtaXRCdXR0b24ub24oJ2NsaWNrJywgKGUpID0+IHtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdGNyZWF0ZUJhY2t1cC4kZm9ybU9ialxuXHRcdFx0XHQuZm9ybSh7XG5cdFx0XHRcdFx0b246ICdibHVyJyxcblx0XHRcdFx0XHRmaWVsZHM6IGNyZWF0ZUJhY2t1cC52YWxpZGF0ZVJ1bGVzLFxuXHRcdFx0XHRcdG9uU3VjY2VzcygpIHtcblx0XHRcdFx0XHRcdGNvbnN0IGZvcm1EYXRhID0gY3JlYXRlQmFja3VwLiRmb3JtT2JqLmZvcm0oJ2dldCB2YWx1ZXMnKTtcblx0XHRcdFx0XHRcdGNvbnN0IHNlbmREYXRhID0ge307XG5cdFx0XHRcdFx0XHRPYmplY3Qua2V5cyhmb3JtRGF0YSkuZm9yRWFjaCgoa2V5KSA9PiB7XG5cdFx0XHRcdFx0XHRcdHNlbmREYXRhW2tleV0gPSAoZm9ybURhdGFba2V5XSA9PT0gJ29uJykgPyAnMScgOiAnMCc7XG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdGJhY2t1cENyZWF0ZVdvcmtlci5iYWNrdXBJc1ByZXBhcmluZyA9IHRydWU7XG5cdFx0XHRcdFx0XHRjcmVhdGVCYWNrdXAuJHN1Ym1pdEJ1dHRvbi5hZGRDbGFzcygnbG9hZGluZycpO1xuXHRcdFx0XHRcdFx0QmFja3VwQXBpLkJhY2t1cFN0YXJ0KHNlbmREYXRhLCBjcmVhdGVCYWNrdXAuY2JBZnRlclNlbmRGb3JtKTtcblx0XHRcdFx0XHR9LFxuXHRcdFx0XHR9KTtcblx0XHRcdGNyZWF0ZUJhY2t1cC4kZm9ybU9iai5mb3JtKCd2YWxpZGF0ZSBmb3JtJyk7XG5cdFx0fSk7XG5cdFx0Y3JlYXRlQmFja3VwLiRzdG9wQ3JlYXRlQmFja3VwLm9uKCdjbGljaycsIChlKSA9PiB7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRjb25zdCBpZCA9ICQoZS50YXJnZXQpLmNsb3Nlc3QoJ2J1dHRvbicpLmF0dHIoJ2RhdGEtdmFsdWUnKTtcblx0XHRcdEJhY2t1cEFwaS5CYWNrdXBTdG9wKGlkLCBjcmVhdGVCYWNrdXAuY2JBZnRlclNlbmRGb3JtKTtcblx0XHR9KTtcblx0XHRiYWNrdXBDcmVhdGVXb3JrZXIuaW5pdGlhbGl6ZSgnJyk7XG5cdFx0QmFja3VwQXBpLkJhY2t1cEdldEVzdGltYXRlZFNpemUoY3JlYXRlQmFja3VwLmNiQWZ0ZXJHZXRFc3RpbWF0ZWRTaXplKTtcblx0fSxcblx0Y2JBZnRlclNlbmRGb3JtKHJlc3BvbnNlKSB7XG5cdFx0aWYgKHJlc3BvbnNlLmxlbmd0aCA9PT0gMCB8fCByZXNwb25zZSA9PT0gZmFsc2UpIHtcblx0XHRcdGNyZWF0ZUJhY2t1cC4kc3VibWl0QnV0dG9uLnJlbW92ZUNsYXNzKCdsb2FkaW5nJyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGJhY2t1cENyZWF0ZVdvcmtlci5pbml0aWFsaXplKHJlc3BvbnNlLmlkKTtcblx0XHR9XG5cdH0sXG5cdGNiQWZ0ZXJHZXRFc3RpbWF0ZWRTaXplKHJlc3BvbnNlKSB7XG5cdFx0aWYgKHJlc3BvbnNlLmxlbmd0aCA9PT0gMCB8fCByZXNwb25zZSA9PT0gZmFsc2UpIHJldHVybjtcblx0XHQkLmVhY2gocmVzcG9uc2UsIChrZXksIHZhbHVlKSA9PiB7XG5cdFx0XHRjb25zdCAkZWwgPSAkKGAjJHtrZXl9YCkucGFyZW50KCkuZmluZCgnbGFiZWwnKTtcblx0XHRcdGlmICgkZWwgIT09IHVuZGVmaW5lZCkge1xuXHRcdFx0XHQkZWwuaHRtbChgJHskZWwuaHRtbCgpfSAoICR7dmFsdWV9IE1iIClgKTtcblx0XHRcdH1cblx0XHR9KTtcblx0fSxcbn07XG5cblxuJChkb2N1bWVudCkucmVhZHkoKCkgPT4ge1xuXHRjcmVhdGVCYWNrdXAuaW5pdGlhbGl6ZSgpO1xufSk7XG5cbiJdfQ==