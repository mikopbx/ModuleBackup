/*
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 12 2019
 *
 */

/* global BackupApi, PbxApi, globalTranslate, Resumable, globalRootUrl, UserMessage, mergingCheckWorker */

const backupIndex = {
	$templateRow: $('#backup-template-row'),
	$dummy: $('#dummy-row'),
	$uploadButton: $('#uploadbtn'),
	$progressBar: $('#upload-progress-bar'),
	$progressBarLabel: $('#upload-progress-bar').find('.label'),
	$statusToggle: $('#module-status-toggle'),
	$body: $('body'),
	resumable: null,
	initialize() {
		backupIndex.checkStatusToggle();
		window.addEventListener('ModuleStatusChanged', backupIndex.checkStatusToggle);
		backupIndex.$progressBar.hide();
		backupIndex.$body.on('click', 'a.download', (e) => {
			e.preventDefault();
			const id = $(e.target).closest('a').attr('data-value');
			BackupApi.BackupDownloadFile(id,backupIndex.cbAfterDownloadFile);
			//window.location = `${BackupApi.backupDownloadFile}?id=${fileId}`;
		});
		backupIndex.$body.on('click', 'a.delete', (e) => {
			e.preventDefault();
			const id = $(e.target).closest('a').attr('data-value');
			BackupApi.BackupDeleteFile(id, backupIndex.cbAfterDeleteFile);
		});
		//backupIndex.initializeResumable();
		PbxApi.SystemUploadFileAttachToBtn('uploadbtn',['img', 'zip', 'xml'], backupIndex.cbResumable);
	},
	/**
	 * Изменение статуса кнопок при изменении статуса модуля
	 */
	checkStatusToggle() {
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
	cbAfterDownloadFile(response){
		if (response) {
			window.location = response;
		} else {
			UserMessage.showError(globalTranslate.bkp_ErrorOnDownloadBackup)
		}
	},
	/**
	 * Коллбек после удаления файла бекапа
	 * @param response
	 */
	cbAfterDeleteFile(response) {
		if (response) {
			window.location = `${globalRootUrl}module-backup/index`;
		}
	},
	/**
	 * Обработка ответа BackupGetFilesList
	 * @param response
	 */
	cbBackupGetFilesListAfterResponse(response) {
		backupIndex.$dummy.show();
		if (response.length === 0 || response === false) {
			setTimeout(() => {
				BackupApi.BackupGetFilesList(backupIndex.cbBackupGetFilesListAfterResponse);
			}, 3000);
			return;
		}
		backupIndex.$dummy.hide();
		$.each(response, (key, value) => {
			let $newRow = $(`tr#${value.id}`);
			if ($newRow.length > 0) {
				$newRow.remove();
			}
			$newRow = backupIndex.$templateRow.clone();
			$newRow.attr('id', value.id);
			$newRow.addClass('backupIndex-file');
			const arhDate = new Date(1000 * value.date);
			$newRow.find('.create-date').html(arhDate.toLocaleString());
			$newRow.find('.file-size').html(`${value.size} MB`);
			if (value.pid.length + value.pid_recover.length > 0) {
				$newRow.find('a').each((index, obj) => {
					$(obj).remove();
				});
				const percentOfTotal = 100 * (value.progress / value.total);
				$newRow.find('.status').html(`<i class="spinner loading icon"></i> ${parseInt(percentOfTotal, 10)} %`);
				setTimeout(() => {
					BackupApi.BackupGetFilesList(backupIndex.cbBackupGetFilesListAfterResponse);
				}, 3000);
			} else {
				$newRow.find('a').each((index, obj) => {
					$(obj).attr('href', $(obj).attr('href') + value.id);
					$(obj).attr('data-value', value.id);
				});
				$newRow.find('.status').html('<i class="archive icon"></i>');
			}
			$newRow.appendTo('#existing-backup-files-table');
		});
	},
	/**
	 * Callback file upload with chunks
	 * @param action
	 * @param params
	 */
	cbResumable(action, params){
		switch (action) {
			case 'fileSuccess':
				let isXML = false;
				if (params.file.file !== undefined && params.file.file.type !== undefined) {
					isXML = params.file.file.type === 'text/xml';
				}
				backupIndex.checkStatusFileMerging(params.response, isXML);
				backupIndex.$uploadButton.removeClass('loading');
				break;
			case 'uploadStart':
				backupIndex.$uploadButton.addClass('loading');
				backupIndex.$progressBar.show();
				backupIndex.$progressBarLabel.text(globalTranslate.bkp_UploadInProgress);
				break;
			case 'progress':
				backupIndex.$progressBar.progress({
					percent: params.percent,
				});
				break;
			case 'error':
				backupIndex.$progressBarLabel.text(globalTranslate.bkp_UploadError);
				backupIndex.$uploadButton.removeClass('loading');
				UserMessage.showError(`${globalTranslate.bkp_UploadError}<br>${params.message}`);
				break;
			default:


		}
	},
	/**
	 * Запуск процесса ожидания склеивания файла после загрузки на сервер
	 *
	 * @param response ответ функции /pbxcore/api/upload/status
	 */
	checkStatusFileMerging(response, isXML) {
		if (response === undefined || BackupApi.tryParseJSON(response) === false) {
			UserMessage.showError(`${globalTranslate.bkp_UploadError}`);
			return;
		}
		const json = JSON.parse(response);
		if (json === undefined || json.data === undefined) {
			UserMessage.showError(`${globalTranslate.bkp_UploadError}`);
			return;
		}
		const fileID = json.data.upload_id;
		const filePath = json.data.filename;
		mergingCheckWorker.initialize(fileID, filePath, isXML);
	},

};


$(document).ready(() => {
	backupIndex.initialize();
});
