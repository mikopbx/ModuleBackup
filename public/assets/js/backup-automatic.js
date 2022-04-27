"use strict";

/*
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 12 2019
 *
 */

/* global globalRootUrl, globalTranslate, Form, SemanticLocalization, BackupApi */
var automaticBackup = {
  $timeStart: $('#time-start'),
  $everySelect: $('#every'),
  $enableTgl: $('#enable-disable-toggle'),
  $ftpPort: $('#ftp_port'),
  $formObj: $('#backup-automatic-form'),
  $createNowTgl: $('#create-now'),
  $ftpMode: $('#ftp_sftp_mode'),
  validateRules: {
    ftp_host: {
      identifier: 'ftp_host',
      rules: [{
        type: 'empty',
        prompt: globalTranslate.bkp_ValidateHostEmpty
      }]
    },
    ftp_port: {
      identifier: 'ftp_port',
      rules: [{
        type: 'integer[0..65535]',
        prompt: globalTranslate.bkp_ValidatePortEmpty
      }]
    },
    at_time: {
      identifier: 'at_time',
      rules: [{
        type: 'empty',
        prompt: globalTranslate.bkp_ValidateTimeEmpty
      }]
    },
    keep_older_versions: {
      identifier: 'keep_older_versions',
      rules: [{
        type: 'integer[1..99]',
        prompt: globalTranslate.bkp_ValidateKeepVersionsEmpty
      }]
    }
  },
  initialize: function initialize() {
    // Если модуль отключен возврат в начало
    if (!$('#module-status-toggle').checkbox('is checked')) {
      window.location = "".concat(globalRootUrl, "module-backup/index");
    }

    automaticBackup.$everySelect.dropdown();
    automaticBackup.$timeStart.calendar({
      firstDayOfWeek: SemanticLocalization.calendarFirstDayOfWeek,
      text: SemanticLocalization.calendarText,
      type: 'time',
      disableMinute: false,
      ampm: false
    });
    automaticBackup.$enableTgl.checkbox({
      onChange: automaticBackup.onEnableToggleChange,
      fireOnInit: true
    });
    automaticBackup.$ftpMode.dropdown({
      onChange: automaticBackup.onChangeMode
    });
    automaticBackup.initializeForm();
    automaticBackup.onChangeMode();
  },
  onChangeMode: function onChangeMode() {
    var val = automaticBackup.$ftpMode.val();

    if (val === '1') {
      automaticBackup.$ftpPort.parent().show();
    } else if (val === '3') {
      automaticBackup.$ftpPort.parent().hide();
    } else {
      automaticBackup.$ftpPort.parent().show();
    }
  },
  onEnableToggleChange: function onEnableToggleChange() {
    if (automaticBackup.$enableTgl.checkbox('is unchecked')) {
      $('.disability').addClass('disabled');
    } else {
      $('.disability').removeClass('disabled');
    }
  },
  cbBeforeSendForm: function cbBeforeSendForm(settings) {
    var result = settings;
    result.data = automaticBackup.$formObj.form('get values');
    return result;
  },
  cbAfterSendForm: function cbAfterSendForm() {
    if (automaticBackup.$createNowTgl.checkbox('is checked')) {
      BackupApi.BackupStartScheduled(automaticBackup.cbAfterStartScheduled);
    }
  },
  cbAfterStartScheduled: function cbAfterStartScheduled(result) {
    if (result) {
      window.location = "".concat(globalRootUrl, "module-backup/index");
    }
  },
  initializeForm: function initializeForm() {
    Form.$formObj = automaticBackup.$formObj;
    Form.url = "".concat(globalRootUrl, "module-backup/save");
    Form.validateRules = automaticBackup.validateRules;
    Form.cbBeforeSendForm = automaticBackup.cbBeforeSendForm;
    Form.cbAfterSendForm = automaticBackup.cbAfterSendForm;
    Form.initialize();
  }
};
$(document).ready(function () {
  automaticBackup.initialize();
});
//# sourceMappingURL=backup-automatic.js.map