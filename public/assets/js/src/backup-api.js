/*
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 12 2019
 *
 */
/* global localStorage,Config, PbxApi */

const BackupApi = {
	backupGetFilesList: `${Config.pbxUrl}/pbxcore/api/modules/ModuleBackup/list`, // Получить список архивов
	backupDownloadFile: `${Config.pbxUrl}/pbxcore/api/modules/ModuleBackup/download`, // Получить архив /pbxcore/api/modules/ModuleBackup/download?id=backup_1530703760
	backupDeleteFile: `${Config.pbxUrl}/pbxcore/api/modules/ModuleBackup/remove`, // Удалить архив curl http://172.16.156.212/pbxcore/api/modules/ModuleBackup/remove?id=backup_1530714645
	backupRecover: `${Config.pbxUrl}/pbxcore/api/modules/ModuleBackup/recover`, // Восстановить архив curl -X POST -d '{"id": "backup_1534838222", "options":{"backup-sound-files":"1"}}' http://172.16.156.212/pbxcore/api/modules/ModuleBackup/recover;
	backupStart: `${Config.pbxUrl}/pbxcore/api/modules/ModuleBackup/start`, // Начать архивирование curl -X POST -d '{"backup-config":"1","backup-records":"1","backup-cdr":"1","backup-sound-files":"1"}' http://172.16.156.212/pbxcore/api/modules/ModuleBackup/start;
	backupStop: `${Config.pbxUrl}/pbxcore/api/modules/ModuleBackup/stop`, // Приостановить архивирование curl -X POST -d '{"id":"backup_1530703760"}' http://172.16.156.212/pbxcore/api/modules/ModuleBackup/start;
	backupUnpackUploadedImgConf: `${Config.pbxUrl}/pbxcore/api/modules/ModuleBackup/unpackUploadedImgConf`,
	backupGetEstimatedSize: `${Config.pbxUrl}/pbxcore/api/modules/ModuleBackup/getEstimatedSize`,
	backupStartScheduled: `${Config.pbxUrl}/pbxcore/api/modules/ModuleBackup/startScheduled`, // curl 'http://172.16.156.223/pbxcore/api/modules/ModuleBackup/startScheduled'


	/**
	 * Проверка ответа на JSON
	 * @param jsonString
	 * @returns {boolean|any}
	 */
	tryParseJSON(jsonString) {
		try {
			const o = JSON.parse(jsonString);

			// Handle non-exception-throwing cases:
			// Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
			// but... JSON.parse(null) returns null, and typeof null === "object",
			// so we must check for that, too. Thankfully, null is falsey, so this suffices:
			if (o && typeof o === 'object') {
				return o;
			}
		} catch (e) {
			//
		}
		return false;
	},

	/**
	 * Получить список архивов
	 */
	BackupGetFilesList(callback) {
		$.api({
			url: BackupApi.backupGetFilesList,
			on: 'now',
			successTest: PbxApi.successTest,
			onSuccess(response) {
				callback(response.data);
			},
			onError() {
				callback(false);
			},
		});
	},
	/**
	 * Скачать файл архива по указанному ID
	 */
	BackupDownloadFile(fileId, callback) {
		$.api({
			url: `${BackupApi.backupDownloadFile}?id={id}`,
			on: 'now',
			urlData: {
				id: fileId,
			},
			successTest: PbxApi.successTest,
			onSuccess(response) {
				callback(response.data);
			},
			onError() {
				callback(false);
			},
		});
		//window.location = `${BackupApi.backupDownloadFile}?id=${fileId}`;
	},
	/**
	 * Удалить файл по указанному ID
	 * @param fileId - идентификатор файла с архивом
	 * @param callback - функция для обработки результата
	 */
	BackupDeleteFile(fileId, callback) {
		$.api({
			url: `${BackupApi.backupDeleteFile}?id={id}`,
			on: 'now',
			urlData: {
				id: fileId,
			},
			successTest: PbxApi.successTest,
			onSuccess() {
				callback(true);
			},
			onError() {
				callback(false);
			},
		});
	},
	/**
	 * Восстановить систему по указанному ID бекапа
	 * @param jsonParams - {"id": "backup_1534838222", "options":{"backup-sound-files":"1"}}'
	 * @param callback - функция для обработки результата
	 */
	BackupRecover(jsonParams, callback) {
		$.api({
			url: BackupApi.backupRecover,
			method: 'POST',
			data: JSON.stringify(jsonParams),
			on: 'now',
			successTest: PbxApi.successTest,
			onSuccess() {
				callback(true);
			},
			onError() {
				callback(false);
			},
		});
	},
	/**
	 * Начало архивирование системы
	 * @param jsonParams -
	 * {
	 * 	"backup-config":"1",
	 * 	"backup-records":"1",
	 * 	"backup-cdr":"1",
	 * 	"backup-sound-files":"1"
	 * 	}
	 * @param callback - функция для обработки результата
	 */
	BackupStart(jsonParams, callback) {
		$.api({
			url: BackupApi.backupStart,
			on: 'now',
			method: 'POST',
			data: JSON.stringify(jsonParams),
			successTest: PbxApi.successTest,
			onSuccess(response) {
				callback(response.data);
			},
			onError() {
				callback(false);
			},
		});
	},
	/**
	 * Приостановить архивирование системы
	 * @param fileId - ИД с файлом архива
	 * @param callback - функция для обработки результата
	 */
	BackupStop(fileId, callback) {
		$.api({
			url: BackupApi.backupStop,
			on: 'now',
			method: 'POST',
			data: `{'id':'${fileId}'}`,
			successTest: PbxApi.successTest,
			onSuccess(response) {
				callback(response.data);
			},
			onError() {
				callback(false);
			},
		});
	},

	/**
	 * Получить размер файлов для бекапа
	 * @param callback - функция для обработки результата
	 */
	BackupGetEstimatedSize(callback) {
		$.api({
			url: BackupApi.backupGetEstimatedSize,
			on: 'now',
			successTest: PbxApi.successTest,
			onSuccess(response) {
				callback(response.data);
			},
			onError() {
				callback(false);
			},
		});
	},

	/**
	 * Перенести закачанный файл в папку с бекапами
	 * @param filePath - Path полученный из fileUpload
	 * @param callback - функция для обработки результата
	 */
	BackupUnpackUploadedImgConf(filePath, callback) {
		$.api({
			url: BackupApi.backupUnpackUploadedImgConf,
			on: 'now',
			method: 'POST',
			data: `{"temp_file":"${filePath}"}`,
			successTest: PbxApi.successTest,
			onSuccess(response) {
				callback(response.data);
			},
			onError() {
				callback(false);
			},
		});
	},

	/**
	 * Запускает запланированное резервное копирование сразу
	 *
	 */
	BackupStartScheduled(callback) {
		$.api({
			url: BackupApi.backupStartScheduled,
			on: 'now',
			successTest: PbxApi.successTest,
			onSuccess() {
				callback(true);
			},
			onError() {
				callback(false);
			},
		});
	},
};

// export default BackupApi;
