/*
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 12 2019
 *
 */

/* global BackupApi, PbxApi, globalTranslate, Resumable, globalRootUrl, UserMessage */

const mergingCheckWorker = {
	timeOut: 3000,
	timeOutHandle: '',
	errorCounts: 0,
	$progressBarLabel: $('#upload-progress-bar').find('.label'),
	fileID: null,
	filePath: '',
	isXML: false,
	initialize(fileID, filePath, isXML = false) {
		// Запустим обновление статуса провайдера
		mergingCheckWorker.fileID = fileID;
		mergingCheckWorker.isXML = isXML;
		mergingCheckWorker.filePath = filePath;
		mergingCheckWorker.restartWorker(fileID);
	},
	restartWorker() {
		window.clearTimeout(mergingCheckWorker.timeoutHandle);
		mergingCheckWorker.worker();
	},
	worker() {
		PbxApi.FilesGetStatusUploadFile(mergingCheckWorker.fileID, mergingCheckWorker.cbAfterResponse);
		mergingCheckWorker.timeoutHandle = window.setTimeout(
			mergingCheckWorker.worker,
			mergingCheckWorker.timeOut,
		);
	},
	cbAfterResponse(response) {
		if (mergingCheckWorker.errorCounts > 10) {
			mergingCheckWorker.$progressBarLabel.text(globalTranslate.bkp_UploadError);
			UserMessage.showError(globalTranslate.bkp_UploadError);
			window.clearTimeout(mergingCheckWorker.timeoutHandle);
		}
		if (response === undefined || Object.keys(response).length === 0) {
			mergingCheckWorker.errorCounts += 1;
			return;
		}
		if (response.d_status === 'UPLOAD_COMPLETE') {
			mergingCheckWorker.$progressBarLabel.text(globalTranslate.bkp_UploadComplete);
			BackupApi.BackupUnpackUploadedImgConf(mergingCheckWorker.filePath, mergingCheckWorker.cbAfterMoveBackupFile);
			window.clearTimeout(mergingCheckWorker.timeoutHandle);
		} else if (response.d_status !== undefined) {
			mergingCheckWorker.$progressBarLabel.text(globalTranslate.bkp_UploadProcessingFiles);
			mergingCheckWorker.errorCounts = 0;
		} else {
			mergingCheckWorker.errorCounts += 1;
		}
	},
	cbAfterMoveBackupFile(response){
		window.location.reload();
	}

};