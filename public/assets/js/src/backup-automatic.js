/*
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 12 2019
 *
 */

/* global globalRootUrl, globalTranslate, Form, SemanticLocalization, BackupApi, Config, PbxApi */

const automaticBackup = {
	$timeStart: $('#time-start'),
	$everySelect: $('#every'),
	$enableTgl: $('#enable-disable-toggle'),
	$ftpPort: $('#ftp_port'),
	$formObj: $('#backup-automatic-form'),
	$createNowTgl: $('#create-now'),
	$ftpMode: $('#ftp_sftp_mode'),
	$checkBtn: $('#check-connection-btn'),
	$checkResult: $('#check-connection-result'),
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
		automaticBackup.$ftpMode.dropdown({
			onChange: automaticBackup.onChangeMode
		});
		automaticBackup.initializeForm();

		automaticBackup.onChangeMode();

		automaticBackup.$checkBtn.on('click', automaticBackup.onCheckConnection);
	},

	/**
	 * Проверка подключения к удалённому серверу.
	 * Сначала сохраняет форму, потом вызывает checkStorageFtp.
	 */
	onCheckConnection() {
		automaticBackup.$checkBtn.addClass('loading');
		automaticBackup.$checkResult.html('');
		// Сохраняем форму чтобы данные попали в БД.
		const formData = automaticBackup.$formObj.form('get values');
		$.ajax({
			url: `${globalRootUrl}module-backup/save`,
			method: 'POST',
			data: formData,
			success() {
				// После сохранения проверяем подключение.
				const ruleId = formData.id || '1';
				$.api({
					url: `${Config.pbxUrl}/pbxcore/api/modules/ModuleBackup/checkStorageFtp?id=${ruleId}`,
					on: 'now',
					successTest: PbxApi.successTest,
					onSuccess() {
						automaticBackup.$checkBtn.removeClass('loading');
						automaticBackup.$checkResult.html(
							`<i class="check circle green icon"></i>${globalTranslate.bkp_CheckConnectionSuccess}`
						);
					},
					onFailure() {
						automaticBackup.$checkBtn.removeClass('loading');
						automaticBackup.$checkResult.html(
							`<i class="times circle red icon"></i>${globalTranslate.bkp_CheckConnectionFail}`
						);
					},
				});
			},
			error() {
				automaticBackup.$checkBtn.removeClass('loading');
				automaticBackup.$checkResult.html(
					`<i class="times circle red icon"></i>${globalTranslate.bkp_CheckConnectionFail}`
				);
			},
		});
	},

	onChangeMode(){
		let val = automaticBackup.$ftpMode.val();
		if (val === '3') {
			$('#ftp-port-field').hide();
		} else {
			$('#ftp-port-field').show();
		}
		// Переинициализируем форму с актуальными правилами валидации.
		automaticBackup.initializeForm();
	},

	onEnableToggleChange() {
		if (automaticBackup.$enableTgl.checkbox('is unchecked')) {
			$('.disability').addClass('disabled');
		} else {
			$('.disability').removeClass('disabled');
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
		// Формируем правила валидации в зависимости от режима.
		const rules = $.extend(true, {}, automaticBackup.validateRules);
		if (automaticBackup.$ftpMode.val() === '3') {
			// WebDAV не использует порт — убираем валидацию.
			delete rules.ftp_port;
		}
		Form.validateRules = rules;
		Form.cbBeforeSendForm = automaticBackup.cbBeforeSendForm;
		Form.cbAfterSendForm = automaticBackup.cbAfterSendForm;
		Form.initialize();
	},
};

$(document).ready(() => {
	automaticBackup.initialize();
});

