/*
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 12 2019
 *
 */

/* global BackupApi, globalTranslate, globalRootUrl, restoreWorker */

const restoreBackup = {
	$progressBar: $('#restore-progress-bar'),
	$formObj: $('#backup-restore-form'),
	$submitButton: $('#submitbutton'),
	$deleteButton: $('#deletebutton'),
	$restoreModalForm: $('#restore-modal-form'),
	currentBackupId: window.location.pathname.split('/')[4],
	initialize() {
		restoreBackup.$restoreModalForm.modal();
		restoreBackup.$submitButton.on('click', (e) => {
			e.preventDefault();
			if (restoreWorker.restoreIsProcessing) return;
			const formResult = restoreBackup.$formObj.form('get values');
			const options = {};
			$.each(formResult, (key, value) => {
				if (value) {
					options[key] = '1';
				}
			});
			if (Object.entries(options).length > 0) {
				const params = {
					id: restoreBackup.currentBackupId,
					options,
				};
				restoreBackup.$restoreModalForm
					.modal({
						closable: false,
						onDeny: () => true,
						onApprove: () => {
							restoreWorker.$submitButton.addClass('loading');
							restoreWorker.restoreIsProcessing = true;
							BackupApi.BackupRecover(params, restoreBackup.cbAfterRestore);
							return true;
						},
					})
					.modal('show');
			}
		});
		restoreBackup.$deleteButton.on('click', (e) => {
			e.preventDefault();
			if (restoreWorker.restoreIsProcessing) return;
			BackupApi.BackupDeleteFile(restoreBackup.currentBackupId, restoreBackup.cbAfterDeleteFile);
		});
		restoreWorker.initialize(restoreBackup.currentBackupId);
	},
	cbAfterRestore() {
		restoreWorker.initialize(restoreBackup.currentBackupId);
	},
	cbAfterDeleteFile(response) {
		if (response) {
			window.location = `${globalRootUrl}module-backup/index`;
		}
	},
};


$(document).ready(() => {
	restoreBackup.initialize();
});

