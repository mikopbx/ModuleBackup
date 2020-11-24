"use strict";

/*
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 12 2019
 *
 */

/* global BackupApi, globalTranslate, globalRootUrl, restoreWorker */
var restoreBackup = {
  $progressBar: $('#restore-progress-bar'),
  $formObj: $('#backup-restore-form'),
  $submitButton: $('#submitbutton'),
  $deleteButton: $('#deletebutton'),
  $restoreModalForm: $('#restore-modal-form'),
  currentBackupId: window.location.pathname.split('/')[4],
  initialize: function () {
    function initialize() {
      restoreBackup.$restoreModalForm.modal();
      restoreBackup.$submitButton.on('click', function (e) {
        e.preventDefault();
        if (restoreWorker.restoreIsProcessing) return;
        var formResult = restoreBackup.$formObj.form('get values');
        var options = {};
        $.each(formResult, function (key, value) {
          if (value) {
            options[key] = '1';
          }
        });

        if (Object.entries(options).length > 0) {
          var params = {
            id: restoreBackup.currentBackupId,
            options: options
          };
          restoreBackup.$restoreModalForm.modal({
            closable: false,
            onDeny: function () {
              function onDeny() {
                return true;
              }

              return onDeny;
            }(),
            onApprove: function () {
              function onApprove() {
                restoreWorker.$submitButton.addClass('loading');
                restoreWorker.restoreIsProcessing = true;
                BackupApi.BackupRecover(params, restoreBackup.cbAfterRestore);
                return true;
              }

              return onApprove;
            }()
          }).modal('show');
        }
      });
      restoreBackup.$deleteButton.on('click', function (e) {
        e.preventDefault();
        if (restoreWorker.restoreIsProcessing) return;
        BackupApi.BackupDeleteFile(restoreBackup.currentBackupId, restoreBackup.cbAfterDeleteFile);
      });
      restoreWorker.initialize(restoreBackup.currentBackupId);
    }

    return initialize;
  }(),
  cbAfterRestore: function () {
    function cbAfterRestore() {
      restoreWorker.initialize(restoreBackup.currentBackupId);
    }

    return cbAfterRestore;
  }(),
  cbAfterDeleteFile: function () {
    function cbAfterDeleteFile(response) {
      if (response) {
        window.location = "".concat(globalRootUrl, "module-backup/index");
      }
    }

    return cbAfterDeleteFile;
  }()
};
$(document).ready(function () {
  restoreBackup.initialize();
});
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9iYWNrdXAtcmVzdG9yZS5qcyJdLCJuYW1lcyI6WyJyZXN0b3JlQmFja3VwIiwiJHByb2dyZXNzQmFyIiwiJCIsIiRmb3JtT2JqIiwiJHN1Ym1pdEJ1dHRvbiIsIiRkZWxldGVCdXR0b24iLCIkcmVzdG9yZU1vZGFsRm9ybSIsImN1cnJlbnRCYWNrdXBJZCIsIndpbmRvdyIsImxvY2F0aW9uIiwicGF0aG5hbWUiLCJzcGxpdCIsImluaXRpYWxpemUiLCJtb2RhbCIsIm9uIiwiZSIsInByZXZlbnREZWZhdWx0IiwicmVzdG9yZVdvcmtlciIsInJlc3RvcmVJc1Byb2Nlc3NpbmciLCJmb3JtUmVzdWx0IiwiZm9ybSIsIm9wdGlvbnMiLCJlYWNoIiwia2V5IiwidmFsdWUiLCJPYmplY3QiLCJlbnRyaWVzIiwibGVuZ3RoIiwicGFyYW1zIiwiaWQiLCJjbG9zYWJsZSIsIm9uRGVueSIsIm9uQXBwcm92ZSIsImFkZENsYXNzIiwiQmFja3VwQXBpIiwiQmFja3VwUmVjb3ZlciIsImNiQWZ0ZXJSZXN0b3JlIiwiQmFja3VwRGVsZXRlRmlsZSIsImNiQWZ0ZXJEZWxldGVGaWxlIiwicmVzcG9uc2UiLCJnbG9iYWxSb290VXJsIiwiZG9jdW1lbnQiLCJyZWFkeSJdLCJtYXBwaW5ncyI6Ijs7QUFBQTs7Ozs7Ozs7QUFRQTtBQUVBLElBQU1BLGFBQWEsR0FBRztBQUNyQkMsRUFBQUEsWUFBWSxFQUFFQyxDQUFDLENBQUMsdUJBQUQsQ0FETTtBQUVyQkMsRUFBQUEsUUFBUSxFQUFFRCxDQUFDLENBQUMsc0JBQUQsQ0FGVTtBQUdyQkUsRUFBQUEsYUFBYSxFQUFFRixDQUFDLENBQUMsZUFBRCxDQUhLO0FBSXJCRyxFQUFBQSxhQUFhLEVBQUVILENBQUMsQ0FBQyxlQUFELENBSks7QUFLckJJLEVBQUFBLGlCQUFpQixFQUFFSixDQUFDLENBQUMscUJBQUQsQ0FMQztBQU1yQkssRUFBQUEsZUFBZSxFQUFFQyxNQUFNLENBQUNDLFFBQVAsQ0FBZ0JDLFFBQWhCLENBQXlCQyxLQUF6QixDQUErQixHQUEvQixFQUFvQyxDQUFwQyxDQU5JO0FBT3JCQyxFQUFBQSxVQVBxQjtBQUFBLDBCQU9SO0FBQ1paLE1BQUFBLGFBQWEsQ0FBQ00saUJBQWQsQ0FBZ0NPLEtBQWhDO0FBQ0FiLE1BQUFBLGFBQWEsQ0FBQ0ksYUFBZCxDQUE0QlUsRUFBNUIsQ0FBK0IsT0FBL0IsRUFBd0MsVUFBQ0MsQ0FBRCxFQUFPO0FBQzlDQSxRQUFBQSxDQUFDLENBQUNDLGNBQUY7QUFDQSxZQUFJQyxhQUFhLENBQUNDLG1CQUFsQixFQUF1QztBQUN2QyxZQUFNQyxVQUFVLEdBQUduQixhQUFhLENBQUNHLFFBQWQsQ0FBdUJpQixJQUF2QixDQUE0QixZQUE1QixDQUFuQjtBQUNBLFlBQU1DLE9BQU8sR0FBRyxFQUFoQjtBQUNBbkIsUUFBQUEsQ0FBQyxDQUFDb0IsSUFBRixDQUFPSCxVQUFQLEVBQW1CLFVBQUNJLEdBQUQsRUFBTUMsS0FBTixFQUFnQjtBQUNsQyxjQUFJQSxLQUFKLEVBQVc7QUFDVkgsWUFBQUEsT0FBTyxDQUFDRSxHQUFELENBQVAsR0FBZSxHQUFmO0FBQ0E7QUFDRCxTQUpEOztBQUtBLFlBQUlFLE1BQU0sQ0FBQ0MsT0FBUCxDQUFlTCxPQUFmLEVBQXdCTSxNQUF4QixHQUFpQyxDQUFyQyxFQUF3QztBQUN2QyxjQUFNQyxNQUFNLEdBQUc7QUFDZEMsWUFBQUEsRUFBRSxFQUFFN0IsYUFBYSxDQUFDTyxlQURKO0FBRWRjLFlBQUFBLE9BQU8sRUFBUEE7QUFGYyxXQUFmO0FBSUFyQixVQUFBQSxhQUFhLENBQUNNLGlCQUFkLENBQ0VPLEtBREYsQ0FDUTtBQUNOaUIsWUFBQUEsUUFBUSxFQUFFLEtBREo7QUFFTkMsWUFBQUEsTUFBTTtBQUFFO0FBQUEsdUJBQU0sSUFBTjtBQUFBOztBQUFGO0FBQUEsZUFGQTtBQUdOQyxZQUFBQSxTQUFTO0FBQUUsbUNBQU07QUFDaEJmLGdCQUFBQSxhQUFhLENBQUNiLGFBQWQsQ0FBNEI2QixRQUE1QixDQUFxQyxTQUFyQztBQUNBaEIsZ0JBQUFBLGFBQWEsQ0FBQ0MsbUJBQWQsR0FBb0MsSUFBcEM7QUFDQWdCLGdCQUFBQSxTQUFTLENBQUNDLGFBQVYsQ0FBd0JQLE1BQXhCLEVBQWdDNUIsYUFBYSxDQUFDb0MsY0FBOUM7QUFDQSx1QkFBTyxJQUFQO0FBQ0E7O0FBTFE7QUFBQTtBQUhILFdBRFIsRUFXRXZCLEtBWEYsQ0FXUSxNQVhSO0FBWUE7QUFDRCxPQTVCRDtBQTZCQWIsTUFBQUEsYUFBYSxDQUFDSyxhQUFkLENBQTRCUyxFQUE1QixDQUErQixPQUEvQixFQUF3QyxVQUFDQyxDQUFELEVBQU87QUFDOUNBLFFBQUFBLENBQUMsQ0FBQ0MsY0FBRjtBQUNBLFlBQUlDLGFBQWEsQ0FBQ0MsbUJBQWxCLEVBQXVDO0FBQ3ZDZ0IsUUFBQUEsU0FBUyxDQUFDRyxnQkFBVixDQUEyQnJDLGFBQWEsQ0FBQ08sZUFBekMsRUFBMERQLGFBQWEsQ0FBQ3NDLGlCQUF4RTtBQUNBLE9BSkQ7QUFLQXJCLE1BQUFBLGFBQWEsQ0FBQ0wsVUFBZCxDQUF5QlosYUFBYSxDQUFDTyxlQUF2QztBQUNBOztBQTVDb0I7QUFBQTtBQTZDckI2QixFQUFBQSxjQTdDcUI7QUFBQSw4QkE2Q0o7QUFDaEJuQixNQUFBQSxhQUFhLENBQUNMLFVBQWQsQ0FBeUJaLGFBQWEsQ0FBQ08sZUFBdkM7QUFDQTs7QUEvQ29CO0FBQUE7QUFnRHJCK0IsRUFBQUEsaUJBaERxQjtBQUFBLCtCQWdESEMsUUFoREcsRUFnRE87QUFDM0IsVUFBSUEsUUFBSixFQUFjO0FBQ2IvQixRQUFBQSxNQUFNLENBQUNDLFFBQVAsYUFBcUIrQixhQUFyQjtBQUNBO0FBQ0Q7O0FBcERvQjtBQUFBO0FBQUEsQ0FBdEI7QUF3REF0QyxDQUFDLENBQUN1QyxRQUFELENBQUQsQ0FBWUMsS0FBWixDQUFrQixZQUFNO0FBQ3ZCMUMsRUFBQUEsYUFBYSxDQUFDWSxVQUFkO0FBQ0EsQ0FGRCIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBDb3B5cmlnaHQgKEMpIE1JS08gTExDIC0gQWxsIFJpZ2h0cyBSZXNlcnZlZFxuICogVW5hdXRob3JpemVkIGNvcHlpbmcgb2YgdGhpcyBmaWxlLCB2aWEgYW55IG1lZGl1bSBpcyBzdHJpY3RseSBwcm9oaWJpdGVkXG4gKiBQcm9wcmlldGFyeSBhbmQgY29uZmlkZW50aWFsXG4gKiBXcml0dGVuIGJ5IE5pa29sYXkgQmVrZXRvdiwgMTIgMjAxOVxuICpcbiAqL1xuXG4vKiBnbG9iYWwgQmFja3VwQXBpLCBnbG9iYWxUcmFuc2xhdGUsIGdsb2JhbFJvb3RVcmwsIHJlc3RvcmVXb3JrZXIgKi9cblxuY29uc3QgcmVzdG9yZUJhY2t1cCA9IHtcblx0JHByb2dyZXNzQmFyOiAkKCcjcmVzdG9yZS1wcm9ncmVzcy1iYXInKSxcblx0JGZvcm1PYmo6ICQoJyNiYWNrdXAtcmVzdG9yZS1mb3JtJyksXG5cdCRzdWJtaXRCdXR0b246ICQoJyNzdWJtaXRidXR0b24nKSxcblx0JGRlbGV0ZUJ1dHRvbjogJCgnI2RlbGV0ZWJ1dHRvbicpLFxuXHQkcmVzdG9yZU1vZGFsRm9ybTogJCgnI3Jlc3RvcmUtbW9kYWwtZm9ybScpLFxuXHRjdXJyZW50QmFja3VwSWQ6IHdpbmRvdy5sb2NhdGlvbi5wYXRobmFtZS5zcGxpdCgnLycpWzRdLFxuXHRpbml0aWFsaXplKCkge1xuXHRcdHJlc3RvcmVCYWNrdXAuJHJlc3RvcmVNb2RhbEZvcm0ubW9kYWwoKTtcblx0XHRyZXN0b3JlQmFja3VwLiRzdWJtaXRCdXR0b24ub24oJ2NsaWNrJywgKGUpID0+IHtcblx0XHRcdGUucHJldmVudERlZmF1bHQoKTtcblx0XHRcdGlmIChyZXN0b3JlV29ya2VyLnJlc3RvcmVJc1Byb2Nlc3NpbmcpIHJldHVybjtcblx0XHRcdGNvbnN0IGZvcm1SZXN1bHQgPSByZXN0b3JlQmFja3VwLiRmb3JtT2JqLmZvcm0oJ2dldCB2YWx1ZXMnKTtcblx0XHRcdGNvbnN0IG9wdGlvbnMgPSB7fTtcblx0XHRcdCQuZWFjaChmb3JtUmVzdWx0LCAoa2V5LCB2YWx1ZSkgPT4ge1xuXHRcdFx0XHRpZiAodmFsdWUpIHtcblx0XHRcdFx0XHRvcHRpb25zW2tleV0gPSAnMSc7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0aWYgKE9iamVjdC5lbnRyaWVzKG9wdGlvbnMpLmxlbmd0aCA+IDApIHtcblx0XHRcdFx0Y29uc3QgcGFyYW1zID0ge1xuXHRcdFx0XHRcdGlkOiByZXN0b3JlQmFja3VwLmN1cnJlbnRCYWNrdXBJZCxcblx0XHRcdFx0XHRvcHRpb25zLFxuXHRcdFx0XHR9O1xuXHRcdFx0XHRyZXN0b3JlQmFja3VwLiRyZXN0b3JlTW9kYWxGb3JtXG5cdFx0XHRcdFx0Lm1vZGFsKHtcblx0XHRcdFx0XHRcdGNsb3NhYmxlOiBmYWxzZSxcblx0XHRcdFx0XHRcdG9uRGVueTogKCkgPT4gdHJ1ZSxcblx0XHRcdFx0XHRcdG9uQXBwcm92ZTogKCkgPT4ge1xuXHRcdFx0XHRcdFx0XHRyZXN0b3JlV29ya2VyLiRzdWJtaXRCdXR0b24uYWRkQ2xhc3MoJ2xvYWRpbmcnKTtcblx0XHRcdFx0XHRcdFx0cmVzdG9yZVdvcmtlci5yZXN0b3JlSXNQcm9jZXNzaW5nID0gdHJ1ZTtcblx0XHRcdFx0XHRcdFx0QmFja3VwQXBpLkJhY2t1cFJlY292ZXIocGFyYW1zLCByZXN0b3JlQmFja3VwLmNiQWZ0ZXJSZXN0b3JlKTtcblx0XHRcdFx0XHRcdFx0cmV0dXJuIHRydWU7XG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0pXG5cdFx0XHRcdFx0Lm1vZGFsKCdzaG93Jyk7XG5cdFx0XHR9XG5cdFx0fSk7XG5cdFx0cmVzdG9yZUJhY2t1cC4kZGVsZXRlQnV0dG9uLm9uKCdjbGljaycsIChlKSA9PiB7XG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KCk7XG5cdFx0XHRpZiAocmVzdG9yZVdvcmtlci5yZXN0b3JlSXNQcm9jZXNzaW5nKSByZXR1cm47XG5cdFx0XHRCYWNrdXBBcGkuQmFja3VwRGVsZXRlRmlsZShyZXN0b3JlQmFja3VwLmN1cnJlbnRCYWNrdXBJZCwgcmVzdG9yZUJhY2t1cC5jYkFmdGVyRGVsZXRlRmlsZSk7XG5cdFx0fSk7XG5cdFx0cmVzdG9yZVdvcmtlci5pbml0aWFsaXplKHJlc3RvcmVCYWNrdXAuY3VycmVudEJhY2t1cElkKTtcblx0fSxcblx0Y2JBZnRlclJlc3RvcmUoKSB7XG5cdFx0cmVzdG9yZVdvcmtlci5pbml0aWFsaXplKHJlc3RvcmVCYWNrdXAuY3VycmVudEJhY2t1cElkKTtcblx0fSxcblx0Y2JBZnRlckRlbGV0ZUZpbGUocmVzcG9uc2UpIHtcblx0XHRpZiAocmVzcG9uc2UpIHtcblx0XHRcdHdpbmRvdy5sb2NhdGlvbiA9IGAke2dsb2JhbFJvb3RVcmx9bW9kdWxlLWJhY2t1cC9pbmRleGA7XG5cdFx0fVxuXHR9LFxufTtcblxuXG4kKGRvY3VtZW50KS5yZWFkeSgoKSA9PiB7XG5cdHJlc3RvcmVCYWNrdXAuaW5pdGlhbGl6ZSgpO1xufSk7XG5cbiJdfQ==