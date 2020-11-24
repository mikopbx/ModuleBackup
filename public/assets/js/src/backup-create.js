/*
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 12 2019
 *
 */

/* global BackupApi, globalRootUrl, backupCreateWorker */

const createBackup = {
	$formObj: $('#backup-create-form'),
	$submitButton: $('#submitbutton'),
	$stopCreateBackup: $('#stopbackupbutton'),
	$statusToggle: $('#module-status-toggle'),
	initialize() {
		// Если модуль отключен возврат в начало
		if (!$('#module-status-toggle').checkbox('is checked')) {
			window.location = `${globalRootUrl}module-backup/index`;
		}
		createBackup.$submitButton.addClass('loading');
		createBackup.$stopCreateBackup.hide();
		$('.backup-options').checkbox();
		createBackup.$submitButton.on('click', (e) => {
			e.preventDefault();
			createBackup.$formObj
				.form({
					on: 'blur',
					fields: createBackup.validateRules,
					onSuccess() {
						const formData = createBackup.$formObj.form('get values');
						const sendData = {};
						Object.keys(formData).forEach((key) => {
							sendData[key] = (formData[key] === 'on') ? '1' : '0';
						});
						backupCreateWorker.backupIsPreparing = true;
						createBackup.$submitButton.addClass('loading');
						BackupApi.BackupStart(sendData, createBackup.cbAfterSendForm);
					},
				});
			createBackup.$formObj.form('validate form');
		});
		createBackup.$stopCreateBackup.on('click', (e) => {
			e.preventDefault();
			const id = $(e.target).closest('button').attr('data-value');
			BackupApi.BackupStop(id, createBackup.cbAfterSendForm);
		});
		backupCreateWorker.initialize('');
		BackupApi.BackupGetEstimatedSize(createBackup.cbAfterGetEstimatedSize);
	},
	cbAfterSendForm(response) {
		if (response.length === 0 || response === false) {
			createBackup.$submitButton.removeClass('loading');
		} else {
			backupCreateWorker.initialize(response.id);
		}
	},
	cbAfterGetEstimatedSize(response) {
		if (response.length === 0 || response === false) return;
		$.each(response, (key, value) => {
			const $el = $(`#${key}`).parent().find('label');
			if ($el !== undefined) {
				$el.html(`${$el.html()} ( ${value} Mb )`);
			}
		});
	},
};


$(document).ready(() => {
	createBackup.initialize();
});

