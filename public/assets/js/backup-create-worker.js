"use strict";

/*
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 12 2019
 *
 */

/* global BackupApi, globalRootUrl, globalTranslate */

var backupCreateWorker = {
  timeOut: 5000,
  timeOutHandle: '',
  $submitButton: $('#submitbutton'),
  $stopCreateBackup: $('#stopbackupbutton'),
  waitBackupId: '',
  $progressBar: $('#backup-progress-bar'),
  backupIsPreparing: false,
  initialize: function initialize(waitBackupId) {
    backupCreateWorker.waitBackupId = waitBackupId;
    // Запустим обновление статуса создания резервной копии
    backupCreateWorker.restartWorker();
  },
  restartWorker: function restartWorker() {
    window.clearTimeout(backupCreateWorker.timeoutHandle);
    backupCreateWorker.worker();
  },
  worker: function worker() {
    BackupApi.BackupGetFilesList(backupCreateWorker.cbAfterGetFiles);
    backupCreateWorker.timeoutHandle = window.setTimeout(backupCreateWorker.worker, backupCreateWorker.timeOut);
  },
  cbAfterGetFiles: function cbAfterGetFiles(response) {
    if (response.length === 0 || response === false) {
      window.clearTimeout(backupCreateWorker.timeoutHandle);
      backupCreateWorker.$submitButton.show();
      backupCreateWorker.$submitButton.removeClass('loading');
      backupCreateWorker.$stopCreateBackup.hide();
    } else {
      // ["0": {
      // 		"date": "1530715058",
      // 		"size": 13.66,
      // 		"progress": 10,
      // 		"total": 32,
      // 		"config": {
      // 			"backup-config": "1",
      // 			"backup-records": "1",
      // 			"backup-cdr": "1",
      // 			"backup-sound-files": "1"
      // 		},
      // 		"pid": "",
      // 		"id": "backup_1530715058"
      // }]
      var percentOfTotal = 0;
      $.each(response, function (key, value) {
        if (backupCreateWorker.waitBackupId === '' && value.pid.length > 0) {
          backupCreateWorker.waitBackupId = value.id;
        }
        if (backupCreateWorker.waitBackupId === value.id) {
          backupCreateWorker.$submitButton.hide();
          backupCreateWorker.$stopCreateBackup.attr('data-value', backupCreateWorker.waitBackupId).show();
          percentOfTotal = value.total > 0 ? 100 * (value.progress / value.total) : 0;
          var activeText = value.stage === 'preparing' ? "".concat(globalTranslate.bkp_PreparingFileList, ": {value} / {total}") : '{value} of {total} done';
          backupCreateWorker.$progressBar.progress({
            duration: value.progress,
            total: value.total,
            percent: parseInt(percentOfTotal, 10),
            text: {
              active: activeText
            }
          });
          if (value.total === value.progress && value.stage !== 'preparing' && backupCreateWorker.backupIsPreparing) {
            window.location = "".concat(globalRootUrl, "module-backup/index");
          }
          backupCreateWorker.backupIsPreparing = value.pid.length > 0;
        }
      });
      if (backupCreateWorker.backupIsPreparing === false) {
        backupCreateWorker.$submitButton.show();
        backupCreateWorker.$stopCreateBackup.hide();
        backupCreateWorker.$submitButton.removeClass('loading');
        window.clearTimeout(backupCreateWorker.timeoutHandle);
      }
    }
  }
};

//# sourceMappingURL=backup-create-worker.js.map