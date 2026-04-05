"use strict";

/*
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 12 2019
 *
 */

/* global BackupApi, PbxApi, globalTranslate, Resumable, globalRootUrl, UserMessage, mergingCheckWorker */

var backupIndex = {
  $templateRow: $('#backup-template-row'),
  $dummy: $('#dummy-row'),
  $uploadButton: $('#uploadbtn'),
  $progressBar: $('#upload-progress-bar'),
  $progressBarLabel: $('#upload-progress-bar').find('.label'),
  $statusToggle: $('#module-status-toggle'),
  $body: $('body'),
  resumable: null,
  initialize: function initialize() {
    backupIndex.checkStatusToggle();
    window.addEventListener('ModuleStatusChanged', backupIndex.checkStatusToggle);
    backupIndex.$progressBar.hide();
    backupIndex.$body.on('click', 'a.download', function (e) {
      e.preventDefault();
      var id = $(e.target).closest('a').attr('data-value');
      BackupApi.BackupDownloadFile(id, backupIndex.cbAfterDownloadFile);
      //window.location = `${BackupApi.backupDownloadFile}?id=${fileId}`;
    });
    backupIndex.$body.on('click', 'a.delete', function (e) {
      e.preventDefault();
      var id = $(e.target).closest('a').attr('data-value');
      BackupApi.BackupDeleteFile(id, backupIndex.cbAfterDeleteFile);
    });
    backupIndex.$body.on('click', 'a.stop-backup', function (e) {
      e.preventDefault();
      var id = $(e.target).closest('a').attr('data-value');
      BackupApi.BackupStop(id, backupIndex.cbAfterStopBackup);
    });
    PbxApi.SystemUploadFileAttachToBtn('uploadbtn', ['img', 'zip', 'xml', 'csv', 'tar'], backupIndex.cbResumable);
  },
  /**
   * Изменение статуса кнопок при изменении статуса модуля
   */
  checkStatusToggle: function checkStatusToggle() {
    if (backupIndex.$statusToggle.checkbox('is checked')) {
      $('.disability').removeClass('disabled');
      BackupApi.BackupGetFilesList(backupIndex.cbBackupGetFilesListAfterResponse);
    } else {
      $('.disability').addClass('disabled');
    }
  },
  /**
   * Коллбек перед скачиванием файла архива
   */
  cbAfterDownloadFile: function cbAfterDownloadFile(response) {
    if (response) {
      window.location = response;
    } else {
      UserMessage.showError(globalTranslate.bkp_ErrorOnDownloadBackup);
    }
  },
  /**
   * Коллбек после удаления файла бекапа
   * @param response
   */
  cbAfterDeleteFile: function cbAfterDeleteFile(response) {
    if (response) {
      window.location = "".concat(globalRootUrl, "module-backup/index");
    }
  },
  /**
   * Коллбек после остановки бекапа
   * @param response
   */
  cbAfterStopBackup: function cbAfterStopBackup(response) {
    if (response) {
      window.location = "".concat(globalRootUrl, "module-backup/index");
    }
  },
  /**
   * Обработка ответа BackupGetFilesList
   * @param response
   */
  cbBackupGetFilesListAfterResponse: function cbBackupGetFilesListAfterResponse(response) {
    backupIndex.$dummy.show();
    if (response.length === 0 || response === false) {
      setTimeout(function () {
        BackupApi.BackupGetFilesList(backupIndex.cbBackupGetFilesListAfterResponse);
      }, 3000);
      return;
    }
    backupIndex.$dummy.hide();
    $.each(response, function (key, value) {
      var $newRow = $("tr#".concat(value.id));
      if ($newRow.length > 0) {
        $newRow.remove();
      }
      $newRow = backupIndex.$templateRow.clone();
      $newRow.attr('id', value.id);
      $newRow.addClass('backupIndex-file');
      var arhDate = new Date(1000 * value.date);
      var month = '' + (arhDate.getMonth() + 1);
      var day = '' + arhDate.getDate();
      if (month.length === 1) {
        month = '0' + month;
      }
      if (day.length === 1) {
        day = '0' + day;
      }
      var hours = '' + arhDate.getHours();
      var minutes = '' + arhDate.getMinutes();
      var seconds = '' + arhDate.getSeconds();
      if (hours.length === 1) hours = '0' + hours;
      if (minutes.length === 1) minutes = '0' + minutes;
      if (seconds.length === 1) seconds = '0' + seconds;
      $newRow.find('.create-date').html(arhDate.getFullYear() + '.' + month + '.' + day + ' ' + hours + ':' + minutes + ':' + seconds);
      $newRow.find('.create-date').attr('data-order', value.date);
      $newRow.find('.create-date').attr('data-sort', value.date);
      $newRow.find('.file-size').html("".concat(value.size, " MB"));
      if (value.pid.length + value.pid_recover.length > 0) {
        $newRow.find('a').each(function (index, obj) {
          $(obj).remove();
        });
        var percentOfTotal = 100 * (value.progress / value.total);
        $newRow.find('.status').html("<i class=\"spinner loading icon\"></i> ".concat(parseInt(percentOfTotal, 10), " %"));
        var $actionsCell = $newRow.find('td').last();
        $actionsCell.html("<div class=\"ui small basic icon buttons action-buttons\">" + "<a href=\"#\" class=\"ui button stop-backup popuped\" data-value=\"".concat(value.id, "\" data-content=\"").concat(globalTranslate.bkp_StopCreateBackup, "\">") + "<i class=\"icon stop red\"></i></a></div>");
        setTimeout(function () {
          BackupApi.BackupGetFilesList(backupIndex.cbBackupGetFilesListAfterResponse);
        }, 3000);
      } else {
        $newRow.find('a').each(function (index, obj) {
          $(obj).attr('href', $(obj).attr('href') + value.id);
          $(obj).attr('data-value', value.id);
        });
        $newRow.find('.status').html('<i class="archive icon"></i>');
      }
      $newRow.appendTo('#existing-backup-files-table');
    });
    var idTable = $('#existing-backup-files-table');
    if (idTable.attr('data-dt-init') !== '1') {
      idTable.DataTable({
        'order': [[1, 'dsc']],
        paging: false,
        searching: false,
        columns: [{
          orderable: false
        }, {
          type: 'date'
        }, null, {
          orderable: false
        }]
      });
      idTable.attr('data-dt-init', '1');
    }
  },
  /**
  	 * Callback file upload with chunks
  	 * @param action
  	 * @param params
  	 */
  cbResumable: function cbResumable(action, params) {
    switch (action) {
      case 'fileSuccess':
        var isXML = false;
        if (params.file.file !== undefined && params.file.file.type !== undefined) {
          isXML = params.file.file.type === 'text/xml';
        }
        backupIndex.checkStatusFileMerging(params.response, isXML);
        backupIndex.$uploadButton.removeClass('loading');
        break;
      case 'fileAdded':
        // Проверяем свободное место перед загрузкой.
        if (params.file && params.file.file && params.file.file.size) {
          var fileSizeMB = Math.round(params.file.file.size / 1024 / 1024);
          $.api({
            url: "".concat(globalRootUrl, "pbxcore/api/storage/list"),
            on: 'now',
            onSuccess: function onSuccess(response) {
              if (response && response.data) {
                var freeSpaceMB = 0;
                $.each(response.data, function (i, disk) {
                  if (disk.mounted && disk.mounted.indexOf('/storage/') === 0) {
                    freeSpaceMB = parseInt(disk.free_space) || 0;
                    return false; // Берём первый storage-диск.
                  }
                });
                var requiredMB = fileSizeMB * 2 + 500;
                if (freeSpaceMB > 0 && freeSpaceMB < requiredMB) {
                  UserMessage.showError("".concat(globalTranslate.bkp_UploadError, "<br>") + "Free: ".concat(freeSpaceMB, " MB, required: ").concat(requiredMB, " MB"));
                }
              }
            }
          });
        }
        break;
      case 'uploadStart':
        backupIndex.$uploadButton.addClass('loading');
        backupIndex.$progressBar.show();
        backupIndex.$progressBarLabel.text(globalTranslate.bkp_UploadInProgress);
        break;
      case 'progress':
        backupIndex.$progressBar.progress({
          percent: params.percent
        });
        break;
      case 'error':
        backupIndex.$progressBarLabel.text(globalTranslate.bkp_UploadError);
        backupIndex.$uploadButton.removeClass('loading');
        UserMessage.showError("".concat(globalTranslate.bkp_UploadError, "<br>").concat(params.message));
        break;
      default:
    }
  },
  /**
   * Запуск процесса ожидания склеивания файла после загрузки на сервер
   *
   * @param response ответ функции /pbxcore/api/upload/status
   */
  checkStatusFileMerging: function checkStatusFileMerging(response, isXML) {
    if (response === undefined || BackupApi.tryParseJSON(response) === false) {
      UserMessage.showError("".concat(globalTranslate.bkp_UploadError));
      return;
    }
    var json = JSON.parse(response);
    if (json === undefined || json.data === undefined) {
      UserMessage.showError("".concat(globalTranslate.bkp_UploadError));
      return;
    }
    var fileID = json.data.upload_id;
    var filePath = json.data.filename;
    mergingCheckWorker.initialize(fileID, filePath, isXML);
  }
};
$(document).ready(function () {
  backupIndex.initialize();
});
//# sourceMappingURL=backup-index.js.map