"use strict";

/*
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 12 2019
 *
 */

/* global BackupApi, globalTranslate, globalRootUrl */

var restoreWorker = {
  timeOut: 5000,
  timeOutHandle: '',
  $submitButton: $('#submitbutton'),
  waitRestoreId: undefined,
  $progressBar: $('#restore-progress-bar'),
  restoreIsProcessing: false,
  $formObj: $('#backup-restore-form'),
  formAlreadyBuilded: false,
  initialize: function initialize(waitRestoreId) {
    // Если модуль отключен возврат в начало
    if (!$('#module-status-toggle').checkbox('is checked')) {
      window.location = "".concat(globalRootUrl, "module-backup/index");
    }
    restoreWorker.waitRestoreId = waitRestoreId;
    // Запустим обновление статуса восстановления резервной копии
    restoreWorker.restartWorker();
  },
  restartWorker: function restartWorker() {
    window.clearTimeout(restoreWorker.timeoutHandle);
    restoreWorker.worker();
  },
  worker: function worker() {
    BackupApi.BackupGetFilesList(restoreWorker.cbAfterGetFiles);
    restoreWorker.timeoutHandle = window.setTimeout(restoreWorker.worker, restoreWorker.timeOut);
  },
  cbAfterGetFiles: function cbAfterGetFiles(response) {
    if (response.length === 0 || response === false) {
      window.clearTimeout(restoreWorker.timeoutHandle);
      restoreWorker.$submitButton.removeClass('loading');
    } else {
      var percentOfTotal = 0;
      $.each(response, function (key, value) {
        restoreWorker.restoreIsProcessing = value.pid_recover.length > 0 || restoreWorker.restoreIsProcessing;
        if (restoreWorker.waitRestoreId === undefined && value.pid_recover.length > 0) {
          restoreWorker.waitRestoreId = value.id;
        }
        if (restoreWorker.waitRestoreId === value.id && restoreWorker.restoreIsProcessing > 0) {
          percentOfTotal = 100 * (value.progress_recover / value.total);
          restoreWorker.$progressBar.progress({
            duration: value.progress_recover,
            total: value.total,
            percent: parseInt(percentOfTotal, 10),
            text: {
              active: '{value} of {total} done'
            }
          });
          if (value.progress_recover === value.total) {
            restoreWorker.$submitButton.removeClass('loading');
          }
        }

        // Построим форму с чекбоксами
        if (restoreWorker.waitRestoreId === value.id) {
          if (!restoreWorker.formAlreadyBuilded) {
            $.each(value.config, function (configKey, configValue) {
              if (configValue === '1') {
                var locLabel = "bkp_".concat(configKey);
                var html = '<div class="ui segment"><div class="field"><div class="ui toggle checkbox">';
                html += "<input type=\"checkbox\" name=\"".concat(configKey, "\" checked = \"checked\" class=\"hidden\"/>");
                html += "<label>".concat(globalTranslate[locLabel], "</label>");
                html += '</div></div></div>';
                restoreWorker.$formObj.prepend(html);
              }
            });
            $('.checkbox').checkbox({
              onChange: restoreWorker.onChangeCheckbox
            });
            restoreWorker.formAlreadyBuilded = true;
          }
        }
      });
      if (restoreWorker.restoreIsProcessing === false) {
        window.clearTimeout(restoreWorker.timeoutHandle);
      }
    }
  },
  /**
   * При выключении всех чекбоксов отключить кнопку
   */
  onChangeCheckbox: function onChangeCheckbox() {
    var formResult = restoreWorker.$formObj.form('get values');
    var options = {};
    $.each(formResult, function (key, value) {
      if (value) {
        options[key] = '1';
      }
    });
    if (Object.entries(options).length === 0) {
      restoreWorker.$submitButton.addClass('disabled');
    } else {
      restoreWorker.$submitButton.removeClass('disabled');
    }
  }
};
//# sourceMappingURL=backup-restore-worker.js.map