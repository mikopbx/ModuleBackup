/*
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 12 2019
 *
 */

/* global globalRootUrl, globalTranslate, Form, SemanticLocalization, BackupApi */

const automaticBackup = {
	$timeStart: $('#time-start'),
	$everySelect: $('#every'),
	$enableTgl: $('#enable-disable-toggle'),
	$sftpTgl: $('#sftp-toggle'),
	$ftpPort: $('#ftp_port'),
	$formObj: $('#backup-automatic-form'),
	$createNowTgl: $('#create-now'),
	validateRules: {
		ftp_host: {
			identifier: 'ftp_host',
			rules: [
				{
					type: 'empty',
					prompt: globalTranslate.bkp_ValidateHostEmpty,
				},
			],
		},
		ftp_port: {
			identifier: 'ftp_port',
			rules: [
				{
					type: 'integer[0..65535]',
					prompt: globalTranslate.bkp_ValidatePortEmpty,
				},
			],
		},
		at_time: {
			identifier: 'at_time',
			rules: [
				{
					type: 'empty',
					prompt: globalTranslate.bkp_ValidateTimeEmpty,
				},
			],
		},
		keep_older_versions: {
			identifier: 'keep_older_versions',
			rules: [
				{
					type: 'integer[1..99]',
					prompt: globalTranslate.bkp_ValidateKeepVersionsEmpty,
				},
			],
		},
	},
	initialize() {
		// Если модуль отключен возврат в начало
		if (!$('#module-status-toggle').checkbox('is checked')) {
			window.location = `${globalRootUrl}module-backup/index`;
		}
		automaticBackup.$everySelect.dropdown();
		automaticBackup.$timeStart.calendar({
			firstDayOfWeek: SemanticLocalization.calendarFirstDayOfWeek,
			text: SemanticLocalization.calendarText,
			type: 'time',
			disableMinute: false,
			ampm: false,
		});
		automaticBackup.$enableTgl.checkbox({
			onChange: automaticBackup.onEnableToggleChange,
			fireOnInit: true,
		});
		automaticBackup.$sftpTgl.checkbox({
			onChange: automaticBackup.onSftpToggleChange,
		});
		$('#ftp_sftp_mode').dropdown();
		automaticBackup.initializeForm();
	},

	onEnableToggleChange() {
		if (automaticBackup.$enableTgl.checkbox('is unchecked')) {
			$('.disability').addClass('disabled');
		} else {
			$('.disability').removeClass('disabled');
		}
	},
	onSftpToggleChange() {
		if (automaticBackup.$sftpTgl.checkbox('is checked')) {
			automaticBackup.$ftpPort.val('22');
		} else {
			automaticBackup.$ftpPort.val('21');
		}
	},
	cbBeforeSendForm(settings) {
		const result = settings;
		result.data = automaticBackup.$formObj.form('get values');
		return result;
	},
	cbAfterSendForm() {
		if (automaticBackup.$createNowTgl.checkbox('is checked')) {
			BackupApi.BackupStartScheduled(automaticBackup.cbAfterStartScheduled);
		}
	},
	cbAfterStartScheduled(result) {
		if (result) {
			window.location = `${globalRootUrl}module-backup/index`;
		}
	},
	initializeForm() {
		Form.$formObj = automaticBackup.$formObj;
		Form.url = `${globalRootUrl}module-backup/save`;
		Form.validateRules = automaticBackup.validateRules;
		Form.cbBeforeSendForm = automaticBackup.cbBeforeSendForm;
		Form.cbAfterSendForm = automaticBackup.cbAfterSendForm;
		Form.initialize();
	},
};

$(document).ready(() => {
	automaticBackup.initialize();
});

