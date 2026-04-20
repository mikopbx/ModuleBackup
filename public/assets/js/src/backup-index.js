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
		backupIndex.$body.on('click', 'a.stop-backup', (e) => {
			e.preventDefault();
			const id = $(e.target).closest('a').attr('data-value');
			BackupApi.BackupStop(id, backupIndex.cbAfterStopBackup);
		});
		PbxApi.SystemUploadFileAttachToBtn('uploadbtn',['img', 'zip', 'xml', 'csv', 'tar'], backupIndex.cbResumable);
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
	 * Коллбек после остановки бекапа
	 * @param response
	 */
	cbAfterStopBackup(response) {
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
			// Нет данных — не опрашиваем бесконечно.
			return;
		}
		backupIndex.$dummy.hide();
		let needPolling = false;
		$.each(response, (key, value) => {
			let $row = $(`tr#${value.id}`);
			const isNew = ($row.length === 0);

			if (isNew) {
				$row = backupIndex.$templateRow.clone();
				$row.attr('id', value.id);
				$row.addClass('backupIndex-file');
			}

			// Дата — обновляем только при создании строки.
			if (isNew) {
				const arhDate = new Date(1000 * value.date);
				let month = ''+(arhDate.getMonth()+1);
				let day   = ''+arhDate.getDate();
				if(month.length === 1) month = '0' + month;
				if(day.length === 1) day = '0' + day;
				let hours = '' + arhDate.getHours();
				let minutes = '' + arhDate.getMinutes();
				let seconds = '' + arhDate.getSeconds();
				if (hours.length === 1) hours = '0' + hours;
				if (minutes.length === 1) minutes = '0' + minutes;
				if (seconds.length === 1) seconds = '0' + seconds;
				$row.find('.create-date').html(arhDate.getFullYear() + '.' + month + '.' + day + ' ' + hours + ':' + minutes + ':' + seconds);
				$row.find('.create-date').attr('data-order', value.date);
				$row.find('.create-date').attr('data-sort', value.date);
			}

			// Размер — обновляем всегда.
			$row.find('.file-size').html(`${value.size} MB`);

			if (value.pid.length + value.pid_recover.length > 0) {
				// Бекап в процессе.
				const percentOfTotal = value.total > 0 ? 100 * (value.progress / value.total) : 0;
				const stageLabel = value.stage === 'preparing'
					? `${globalTranslate.bkp_PreparingFileList} `
					: '';
				$row.find('.status').html(`<i class="spinner loading icon"></i> ${stageLabel}${parseInt(percentOfTotal, 10)} %`);
				// Кнопка стоп — обновляем только при создании или если кнопок нет.
				if (isNew || $row.find('a.stop-backup').length === 0) {
					const $actionsCell = $row.find('td').last();
					$actionsCell.html(
						`<div class="ui small basic icon buttons action-buttons">` +
						`<a href="#" class="ui button stop-backup popuped" data-value="${value.id}" data-content="${globalTranslate.bkp_StopCreateBackup}">` +
						`<i class="icon stop red"></i></a></div>`
					);
				}
				needPolling = true;
			} else if (isNew || $row.find('a.download').length === 0) {
				// Бекап завершён — устанавливаем кнопки действий.
				$row.find('.status').html('<i class="archive icon"></i>');
				// Восстанавливаем кнопки из шаблона.
				const $freshRow = backupIndex.$templateRow.clone();
				const $actionsCell = $row.find('td').last();
				$actionsCell.html($freshRow.find('td').last().html());
				$row.find('a').each((index, obj) => {
					$(obj).attr('href', $(obj).attr('href') + value.id);
					$(obj).attr('data-value', value.id);
				});
			}

			if (isNew) {
				$row.appendTo('#existing-backup-files-table');
			}
		});

		if (needPolling) {
			setTimeout(() => {
				BackupApi.BackupGetFilesList(backupIndex.cbBackupGetFilesListAfterResponse);
			}, 5000);
		}

		let idTable = $('#existing-backup-files-table');
		if(idTable.attr('data-dt-init') !== '1'){
			idTable.DataTable({
				'order': [[ 1, 'dsc' ]],
				paging: false,
				searching: false,
				info: false,
				columns: [
					{ orderable: false},
					{ type: 'date'},
					null,
					{ orderable: false },
				]
			});
			idTable.attr('data-dt-init', '1');
		}
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
			case 'fileAdded':
				// Проверяем свободное место перед загрузкой.
				if (params.file && params.file.file && params.file.file.size) {
					const fileSizeMB = Math.round(params.file.file.size / 1024 / 1024);
					$.api({
						url: `${globalRootUrl}pbxcore/api/storage/list`,
						on: 'now',
						onSuccess(response) {
							if (response && response.data) {
								let freeSpaceMB = 0;
								$.each(response.data, (i, disk) => {
									if (disk.mounted && disk.mounted.indexOf('/storage/') === 0) {
										freeSpaceMB = parseInt(disk.free_space) || 0;
										return false; // Берём первый storage-диск.
									}
								});
								const requiredMB = (fileSizeMB * 2) + 500;
								if (freeSpaceMB > 0 && freeSpaceMB < requiredMB) {
									UserMessage.showError(
										`${globalTranslate.bkp_UploadError}<br>` +
										`Free: ${freeSpaceMB} MB, required: ${requiredMB} MB`
									);
								}
							}
						},
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
