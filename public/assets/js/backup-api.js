"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/*
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 12 2019
 *
 */

/* global localStorage,Config, PbxApi */
var BackupApi = {
  backupGetFilesList: "".concat(Config.pbxUrl, "/pbxcore/api/modules/ModuleBackup/list"),
  // Получить список архивов
  backupDownloadFile: "".concat(Config.pbxUrl, "/pbxcore/api/modules/ModuleBackup/download"),
  // Получить архив /pbxcore/api/modules/ModuleBackup/download?id=backup_1530703760
  backupDeleteFile: "".concat(Config.pbxUrl, "/pbxcore/api/modules/ModuleBackup/remove"),
  // Удалить архив curl http://172.16.156.212/pbxcore/api/modules/ModuleBackup/remove?id=backup_1530714645
  backupRecover: "".concat(Config.pbxUrl, "/pbxcore/api/modules/ModuleBackup/recover"),
  // Восстановить архив curl -X POST -d '{"id": "backup_1534838222", "options":{"backup-sound-files":"1"}}' http://172.16.156.212/pbxcore/api/modules/ModuleBackup/recover;
  backupStart: "".concat(Config.pbxUrl, "/pbxcore/api/modules/ModuleBackup/start"),
  // Начать архивирование curl -X POST -d '{"backup-config":"1","backup-records":"1","backup-cdr":"1","backup-sound-files":"1"}' http://172.16.156.212/pbxcore/api/modules/ModuleBackup/start;
  backupStop: "".concat(Config.pbxUrl, "/pbxcore/api/modules/ModuleBackup/stop"),
  // Приостановить архивирование curl -X POST -d '{"id":"backup_1530703760"}' http://172.16.156.212/pbxcore/api/modules/ModuleBackup/start;
  backupUnpackUploadedImgConf: "".concat(Config.pbxUrl, "/pbxcore/api/modules/ModuleBackup/unpackUploadedImgConf"),
  backupGetEstimatedSize: "".concat(Config.pbxUrl, "/pbxcore/api/modules/ModuleBackup/getEstimatedSize"),
  backupStartScheduled: "".concat(Config.pbxUrl, "/pbxcore/api/modules/ModuleBackup/startScheduled"),
  // curl 'http://172.16.156.223/pbxcore/api/modules/ModuleBackup/startScheduled'

  /**
   * Проверка ответа на JSON
   * @param jsonString
   * @returns {boolean|any}
   */
  tryParseJSON: function () {
    function tryParseJSON(jsonString) {
      try {
        var o = JSON.parse(jsonString); // Handle non-exception-throwing cases:
        // Neither JSON.parse(false) or JSON.parse(1234) throw errors, hence the type-checking,
        // but... JSON.parse(null) returns null, and typeof null === "object",
        // so we must check for that, too. Thankfully, null is falsey, so this suffices:

        if (o && _typeof(o) === 'object') {
          return o;
        }
      } catch (e) {//
      }

      return false;
    }

    return tryParseJSON;
  }(),

  /**
   * Получить список архивов
   */
  BackupGetFilesList: function () {
    function BackupGetFilesList(callback) {
      $.api({
        url: BackupApi.backupGetFilesList,
        on: 'now',
        successTest: PbxApi.successTest,
        onSuccess: function () {
          function onSuccess(response) {
            callback(response.data);
          }

          return onSuccess;
        }(),
        onError: function () {
          function onError() {
            callback(false);
          }

          return onError;
        }()
      });
    }

    return BackupGetFilesList;
  }(),

  /**
   * Скачать файл архива по указанному ID
   */
  BackupDownloadFile: function () {
    function BackupDownloadFile(fileId, callback) {
      $.api({
        url: "".concat(BackupApi.backupDownloadFile, "?id={id}"),
        on: 'now',
        urlData: {
          id: fileId
        },
        successTest: PbxApi.successTest,
        onSuccess: function () {
          function onSuccess(response) {
            callback(response.data);
          }

          return onSuccess;
        }(),
        onError: function () {
          function onError() {
            callback(false);
          }

          return onError;
        }()
      }); //window.location = `${BackupApi.backupDownloadFile}?id=${fileId}`;
    }

    return BackupDownloadFile;
  }(),

  /**
   * Удалить файл по указанному ID
   * @param fileId - идентификатор файла с архивом
   * @param callback - функция для обработки результата
   */
  BackupDeleteFile: function () {
    function BackupDeleteFile(fileId, callback) {
      $.api({
        url: "".concat(BackupApi.backupDeleteFile, "?id={id}"),
        on: 'now',
        urlData: {
          id: fileId
        },
        successTest: PbxApi.successTest,
        onSuccess: function () {
          function onSuccess() {
            callback(true);
          }

          return onSuccess;
        }(),
        onError: function () {
          function onError() {
            callback(false);
          }

          return onError;
        }()
      });
    }

    return BackupDeleteFile;
  }(),

  /**
   * Восстановить систему по указанному ID бекапа
   * @param jsonParams - {"id": "backup_1534838222", "options":{"backup-sound-files":"1"}}'
   * @param callback - функция для обработки результата
   */
  BackupRecover: function () {
    function BackupRecover(jsonParams, callback) {
      $.api({
        url: BackupApi.backupRecover,
        method: 'POST',
        data: JSON.stringify(jsonParams),
        on: 'now',
        successTest: PbxApi.successTest,
        onSuccess: function () {
          function onSuccess() {
            callback(true);
          }

          return onSuccess;
        }(),
        onError: function () {
          function onError() {
            callback(false);
          }

          return onError;
        }()
      });
    }

    return BackupRecover;
  }(),

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
  BackupStart: function () {
    function BackupStart(jsonParams, callback) {
      $.api({
        url: BackupApi.backupStart,
        on: 'now',
        method: 'POST',
        data: JSON.stringify(jsonParams),
        successTest: PbxApi.successTest,
        onSuccess: function () {
          function onSuccess(response) {
            callback(response.data);
          }

          return onSuccess;
        }(),
        onError: function () {
          function onError() {
            callback(false);
          }

          return onError;
        }()
      });
    }

    return BackupStart;
  }(),

  /**
   * Приостановить архивирование системы
   * @param fileId - ИД с файлом архива
   * @param callback - функция для обработки результата
   */
  BackupStop: function () {
    function BackupStop(fileId, callback) {
      $.api({
        url: BackupApi.backupStop,
        on: 'now',
        method: 'POST',
        data: "{'id':'".concat(fileId, "'}"),
        successTest: PbxApi.successTest,
        onSuccess: function () {
          function onSuccess(response) {
            callback(response.data);
          }

          return onSuccess;
        }(),
        onError: function () {
          function onError() {
            callback(false);
          }

          return onError;
        }()
      });
    }

    return BackupStop;
  }(),

  /**
   * Получить размер файлов для бекапа
   * @param callback - функция для обработки результата
   */
  BackupGetEstimatedSize: function () {
    function BackupGetEstimatedSize(callback) {
      $.api({
        url: BackupApi.backupGetEstimatedSize,
        on: 'now',
        successTest: PbxApi.successTest,
        onSuccess: function () {
          function onSuccess(response) {
            callback(response.data);
          }

          return onSuccess;
        }(),
        onError: function () {
          function onError() {
            callback(false);
          }

          return onError;
        }()
      });
    }

    return BackupGetEstimatedSize;
  }(),

  /**
   * Перенести закачанный файл в папку с бекапами
   * @param filePath - Path полученный из fileUpload
   * @param callback - функция для обработки результата
   */
  BackupUnpackUploadedImgConf: function () {
    function BackupUnpackUploadedImgConf(filePath, callback) {
      $.api({
        url: BackupApi.backupUnpackUploadedImgConf,
        on: 'now',
        method: 'POST',
        data: "{\"temp_file\":\"".concat(filePath, "\"}"),
        successTest: PbxApi.successTest,
        onSuccess: function () {
          function onSuccess(response) {
            callback(response.data);
          }

          return onSuccess;
        }(),
        onError: function () {
          function onError() {
            callback(false);
          }

          return onError;
        }()
      });
    }

    return BackupUnpackUploadedImgConf;
  }(),

  /**
   * Запускает запланированное резервное копирование сразу
   *
   */
  BackupStartScheduled: function () {
    function BackupStartScheduled(callback) {
      $.api({
        url: BackupApi.backupStartScheduled,
        on: 'now',
        successTest: PbxApi.successTest,
        onSuccess: function () {
          function onSuccess() {
            callback(true);
          }

          return onSuccess;
        }(),
        onError: function () {
          function onError() {
            callback(false);
          }

          return onError;
        }()
      });
    }

    return BackupStartScheduled;
  }()
}; // export default BackupApi;
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9iYWNrdXAtYXBpLmpzIl0sIm5hbWVzIjpbIkJhY2t1cEFwaSIsImJhY2t1cEdldEZpbGVzTGlzdCIsIkNvbmZpZyIsInBieFVybCIsImJhY2t1cERvd25sb2FkRmlsZSIsImJhY2t1cERlbGV0ZUZpbGUiLCJiYWNrdXBSZWNvdmVyIiwiYmFja3VwU3RhcnQiLCJiYWNrdXBTdG9wIiwiYmFja3VwVW5wYWNrVXBsb2FkZWRJbWdDb25mIiwiYmFja3VwR2V0RXN0aW1hdGVkU2l6ZSIsImJhY2t1cFN0YXJ0U2NoZWR1bGVkIiwidHJ5UGFyc2VKU09OIiwianNvblN0cmluZyIsIm8iLCJKU09OIiwicGFyc2UiLCJlIiwiQmFja3VwR2V0RmlsZXNMaXN0IiwiY2FsbGJhY2siLCIkIiwiYXBpIiwidXJsIiwib24iLCJzdWNjZXNzVGVzdCIsIlBieEFwaSIsIm9uU3VjY2VzcyIsInJlc3BvbnNlIiwiZGF0YSIsIm9uRXJyb3IiLCJCYWNrdXBEb3dubG9hZEZpbGUiLCJmaWxlSWQiLCJ1cmxEYXRhIiwiaWQiLCJCYWNrdXBEZWxldGVGaWxlIiwiQmFja3VwUmVjb3ZlciIsImpzb25QYXJhbXMiLCJtZXRob2QiLCJzdHJpbmdpZnkiLCJCYWNrdXBTdGFydCIsIkJhY2t1cFN0b3AiLCJCYWNrdXBHZXRFc3RpbWF0ZWRTaXplIiwiQmFja3VwVW5wYWNrVXBsb2FkZWRJbWdDb25mIiwiZmlsZVBhdGgiLCJCYWNrdXBTdGFydFNjaGVkdWxlZCJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBOzs7Ozs7OztBQU9BO0FBRUEsSUFBTUEsU0FBUyxHQUFHO0FBQ2pCQyxFQUFBQSxrQkFBa0IsWUFBS0MsTUFBTSxDQUFDQyxNQUFaLDJDQUREO0FBQzZEO0FBQzlFQyxFQUFBQSxrQkFBa0IsWUFBS0YsTUFBTSxDQUFDQyxNQUFaLCtDQUZEO0FBRWlFO0FBQ2xGRSxFQUFBQSxnQkFBZ0IsWUFBS0gsTUFBTSxDQUFDQyxNQUFaLDZDQUhDO0FBRzZEO0FBQzlFRyxFQUFBQSxhQUFhLFlB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QUFBLFFBQVEsQ0FBQyxJQUFELENBQVI7QUFDQTs7QUFOSTtBQUFBO0FBT0xVLFFBQUFBLE9BUEs7QUFBQSw2QkFPSztBQUNUVixZQUFBQSxRQUFRLENBQUMsS0FBRCxDQUFSO0FBQ0E7O0FBVEk7QUFBQTtBQUFBLE9BQU47QUFXQTs7QUFyTmdCO0FBQUE7QUFBQSxDQUFsQixDLENBd05BIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAoQykgTUlLTyBMTEMgLSBBbGwgUmlnaHRzIFJlc2VydmVkXG4gKiBVbmF1dGhvcml6ZWQgY29weWluZyBvZiB0aGlzIGZpbGUsIHZpYSBhbnkgbWVkaXVtIGlzIHN0cmljdGx5IHByb2hpYml0ZWRcbiAqIFByb3ByaWV0YXJ5IGFuZCBjb25maWRlbnRpYWxcbiAqIFdyaXR0ZW4gYnkgTmlrb2xheSBCZWtldG92LCAxMiAyMDE5XG4gKlxuICovXG4vKiBnbG9iYWwgbG9jYWxTdG9yYWdlLENvbmZpZywgUGJ4QXBpICovXG5cbmNvbnN0IEJhY2t1cEFwaSA9IHtcblx0YmFja3VwR2V0RmlsZXNMaXN0OiBgJHtDb25maWcucGJ4VXJsfS9wYnhjb3JlL2FwaS9tb2R1bGVzL01vZHVsZUJhY2t1cC9saXN0YCwgLy8g0J/QvtC70YPRh9C40YLRjCDRgdC/0LjRgdC+0Log0LDRgNGF0LjQstC+0LJcblx0YmFja3VwRG93bmxvYWRGaWxlOiBgJHtDb25maWcucGJ4VXJsfS9wYnhjb3JlL2FwaS9tb2R1bGVzL01vZHVsZUJhY2t1cC9kb3dubG9hZGAsIC8vINCf0L7Qu9GD0YfQuNGC0Ywg0LDRgNGF0LjQsiAvcGJ4Y29yZS9hcGkvbW9kdWxlcy9Nb2R1bGVCYWNrdXAvZG93bmxvYWQ/aWQ9YmFja3VwXzE1MzA3MDM3NjBcblx0YmFja3VwRGVsZXRlRmlsZTogYCR7Q29uZmlnLnBieFVybH0vcGJ4Y29yZS9hcGkvbW9kdWxlcy9Nb2R1bGVCYWNrdXAvcmVtb3ZlYCwgLy8g0KPQtNCw0LvQuNGC0Ywg0LDRgNGF0LjQsiBjdXJsIGh0dHA6Ly8xNzIuMTYuMTU2LjIxMi9wYnhjb3JlL2FwaS9tb2R1bGVzL01vZHVsZUJhY2t1cC9yZW1vdmU/aWQ9YmFja3VwXzE1MzA3MTQ2NDVcblx0YmFja3VwUmVjb3ZlcjogYCR7Q29uZmlnLnBieFVybH0vcGJ4Y29yZS9hcGkvbW9kdWxlcy9Nb2R1bGVCYWNrdXAvcmVjb3ZlcmAsIC8vINCS0L7RgdGB0YLQsNC90L7QstC40YLRjCDQsNGA0YXQuNCyIGN1cmwgLVggUE9TVCAtZCAne1wiaWRcIjogXCJiYWNrdXBfMTUzNDgzODIyMlwiLCBcIm9wdGlvbnNcIjp7XCJiYWNrdXAtc291bmQtZmlsZXNcIjpcIjFcIn19JyBodHRwOi8vMTcyLjE2LjE1Ni4yMTIvcGJ4Y29yZS9hcGkvbW9kdWxlcy9Nb2R1bGVCYWNrdXAvcmVjb3Zlcjtcblx0YmFja3VwU3RhcnQ6IGAke0NvbmZpZy5wYnhVcmx9L3BieGNvcmUvYXBpL21vZHVsZXMvTW9kdWxlQmFja3VwL3N0YXJ0YCwgLy8g0J3QsNGH0LDRgtGMINCw0YDRhdC40LLQuNGA0L7QstCw0L3QuNC1IGN1cmwgLVggUE9TVCAtZCAne1wiYmFja3VwLWNvbmZpZ1wiOlwiMVwiLFwiYmFja3VwLXJlY29yZHNcIjpcIjFcIixcImJhY2t1cC1jZHJcIjpcIjFcIixcImJhY2t1cC1zb3VuZC1maWxlc1wiOlwiMVwifScgaHR0cDovLzE3Mi4xNi4xNTYuMjEyL3BieGNvcmUvYXBpL21vZHVsZXMvTW9kdWxlQmFja3VwL3N0YXJ0O1xuXHRiYWNrdXBTdG9wOiBgJHtDb25maWcucGJ4VXJsfS9wYnhjb3JlL2FwaS9tb2R1bGVzL01vZHVsZUJhY2t1cC9zdG9wYCwgLy8g0J/RgNC40L7RgdGC0LDQvdC+0LLQuNGC0Ywg0LDRgNGF0LjQstC40YDQvtCy0LDQvdC40LUgY3VybCAtWCBQT1NUIC1kICd7XCJpZFwiOlwiYmFja3VwXzE1MzA3MDM3NjBcIn0nIGh0dHA6Ly8xNzIuMTYuMTU2LjIxMi9wYnhjb3JlL2FwaS9tb2R1bGVzL01vZHVsZUJhY2t1cC9zdGFydDtcblx0YmFja3VwVW5wYWNrVXBsb2FkZWRJbWdDb25mOiBgJHtDb25maWcucGJ4VXJsfS9wYnhjb3JlL2FwaS9tb2R1bGVzL01vZHVsZUJhY2t1cC91bnBhY2tVcGxvYWRlZEltZ0NvbmZgLFxuXHRiYWNrdXBHZXRFc3RpbWF0ZWRTaXplOiBgJHtDb25maWcucGJ4VXJsfS9wYnhjb3JlL2FwaS9tb2R1bGVzL01vZHVsZUJhY2t1cC9nZXRFc3RpbWF0ZWRTaXplYCxcblx0YmFja3VwU3RhcnRTY2hlZHVsZWQ6IGAke0NvbmZpZy5wYnhVcmx9L3BieGNvcmUvYXBpL21vZHVsZXMvTW9kdWxlQmFja3VwL3N0YXJ0U2NoZWR1bGVkYCwgLy8gY3VybCAnaHR0cDovLzE3Mi4xNi4xNTYuMjIzL3BieGNvcmUvYXBpL21vZHVsZXMvTW9kdWxlQmFja3VwL3N0YXJ0U2NoZWR1bGVkJ1xuXG5cblx0LyoqXG5cdCAqINCf0YDQvtCy0LXRgNC60LAg0L7RgtCy0LXRgtCwINC90LAgSlNPTlxuXHQgKiBAcGFyYW0ganNvblN0cmluZ1xuXHQgKiBAcmV0dXJucyB7Ym9vbGVhbnxhbnl9XG5cdCAqL1xuXHR0cnlQYXJzZUpTT04oanNvblN0cmluZykge1xuXHRcdHRyeSB7XG5cdFx0XHRjb25zdCBvID0gSlNPTi5wYXJzZShqc29uU3RyaW5nKTtcblxuXHRcdFx0Ly8gSGFuZGxlIG5vbi1leGNlcHRpb24tdGhyb3dpbmcgY2FzZXM6XG5cdFx0XHQvLyBOZWl0aGVyIEpTT04ucGFyc2UoZmFsc2UpIG9yIEpTT04ucGFyc2UoMTIzNCkgdGhyb3cgZXJyb3JzLCBoZW5jZSB0aGUgdHlwZS1jaGVja2luZyxcblx0XHRcdC8vIGJ1dC4uLiBKU09OLnBhcnNlKG51bGwpIHJldHVybnMgbnVsbCwgYW5kIHR5cGVvZiBudWxsID09PSBcIm9iamVjdFwiLFxuXHRcdFx0Ly8gc28gd2UgbXVzdCBjaGVjayBmb3IgdGhhdCwgdG9vLiBUaGFua2Z1bGx5LCBudWxsIGlzIGZhbHNleSwgc28gdGhpcyBzdWZmaWNlczpcblx0XHRcdGlmIChvICYmIHR5cGVvZiBvID09PSAnb2JqZWN0Jykge1xuXHRcdFx0XHRyZXR1cm4gbztcblx0XHRcdH1cblx0XHR9IGNhdGNoIChlKSB7XG5cdFx0XHQvL1xuXHRcdH1cblx0XHRyZXR1cm4gZmFsc2U7XG5cdH0sXG5cblx0LyoqXG5cdCAqINCf0L7Qu9GD0YfQuNGC0Ywg0YHQv9C40YHQvtC6INCw0YDRhdC40LLQvtCyXG5cdCAqL1xuXHRCYWNrdXBHZXRGaWxlc0xpc3QoY2FsbGJhY2spIHtcblx0XHQkLmFwaSh7XG5cdFx0XHR1cmw6IEJhY2t1cEFwaS5iYWNrdXBHZXRGaWxlc0xpc3QsXG5cdFx0XHRvbjogJ25vdycsXG5cdFx0XHRzdWNjZXNzVGVzdDogUGJ4QXBpLnN1Y2Nlc3NUZXN0LFxuXHRcdFx0b25TdWNjZXNzKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGNhbGxiYWNrKHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0fSxcblx0XHRcdG9uRXJyb3IoKSB7XG5cdFx0XHRcdGNhbGxiYWNrKGZhbHNlKTtcblx0XHRcdH0sXG5cdFx0fSk7XG5cdH0sXG5cdC8qKlxuXHQgKiDQodC60LDRh9Cw0YLRjCDRhNCw0LnQuyDQsNGA0YXQuNCy0LAg0L/QviDRg9C60LDQt9Cw0L3QvdC+0LzRgyBJRFxuXHQgKi9cblx0QmFja3VwRG93bmxvYWRGaWxlKGZpbGVJZCwgY2FsbGJhY2spIHtcblx0XHQkLmFwaSh7XG5cdFx0XHR1cmw6IGAke0JhY2t1cEFwaS5iYWNrdXBEb3dubG9hZEZpbGV9P2lkPXtpZH1gLFxuXHRcdFx0b246ICdub3cnLFxuXHRcdFx0dXJsRGF0YToge1xuXHRcdFx0XHRpZDogZmlsZUlkLFxuXHRcdFx0fSxcblx0XHRcdHN1Y2Nlc3NUZXN0OiBQYnhBcGkuc3VjY2Vzc1Rlc3QsXG5cdFx0XHRvblN1Y2Nlc3MocmVzcG9uc2UpIHtcblx0XHRcdFx0Y2FsbGJhY2socmVzcG9uc2UuZGF0YSk7XG5cdFx0XHR9LFxuXHRcdFx0b25FcnJvcigpIHtcblx0XHRcdFx0Y2FsbGJhY2soZmFsc2UpO1xuXHRcdFx0fSxcblx0XHR9KTtcblx0XHQvL3dpbmRvdy5sb2NhdGlvbiA9IGAke0JhY2t1cEFwaS5iYWNrdXBEb3dubG9hZEZpbGV9P2lkPSR7ZmlsZUlkfWA7XG5cdH0sXG5cdC8qKlxuXHQgKiDQo9C00LDQu9C40YLRjCDRhNCw0LnQuyDQv9C+INGD0LrQsNC30LDQvdC90L7QvNGDIElEXG5cdCAqIEBwYXJhbSBmaWxlSWQgLSDQuNC00LXQvdGC0LjRhNC40LrQsNGC0L7RgCDRhNCw0LnQu9CwINGBINCw0YDRhdC40LLQvtC8XG5cdCAqIEBwYXJhbSBjYWxsYmFjayAtINGE0YPQvdC60YbQuNGPINC00LvRjyDQvtCx0YDQsNCx0L7RgtC60Lgg0YDQtdC30YPQu9GM0YLQsNGC0LBcblx0ICovXG5cdEJhY2t1cERlbGV0ZUZpbGUoZmlsZUlkLCBjYWxsYmFjaykge1xuXHRcdCQuYXBpKHtcblx0XHRcdHVybDogYCR7QmFja3VwQXBpLmJhY2t1cERlbGV0ZUZpbGV9P2lkPXtpZH1gLFxuXHRcdFx0b246ICdub3cnLFxuXHRcdFx0dXJsRGF0YToge1xuXHRcdFx0XHRpZDogZmlsZUlkLFxuXHRcdFx0fSxcblx0XHRcdHN1Y2Nlc3NUZXN0OiBQYnhBcGkuc3VjY2Vzc1Rlc3QsXG5cdFx0XHRvblN1Y2Nlc3MoKSB7XG5cdFx0XHRcdGNhbGxiYWNrKHRydWUpO1xuXHRcdFx0fSxcblx0XHRcdG9uRXJyb3IoKSB7XG5cdFx0XHRcdGNhbGxiYWNrKGZhbHNlKTtcblx0XHRcdH0sXG5cdFx0fSk7XG5cdH0sXG5cdC8qKlxuXHQgKiDQktC+0YHRgdGC0LDQvdC+0LLQuNGC0Ywg0YHQuNGB0YLQtdC80YMg0L/QviDRg9C60LDQt9Cw0L3QvdC+0LzRgyBJRCDQsdC10LrQsNC/0LBcblx0ICogQHBhcmFtIGpzb25QYXJhbXMgLSB7XCJpZFwiOiBcImJhY2t1cF8xNTM0ODM4MjIyXCIsIFwib3B0aW9uc1wiOntcImJhY2t1cC1zb3VuZC1maWxlc1wiOlwiMVwifX0nXG5cdCAqIEBwYXJhbSBjYWxsYmFjayAtINGE0YPQvdC60YbQuNGPINC00LvRjyDQvtCx0YDQsNCx0L7RgtC60Lgg0YDQtdC30YPQu9GM0YLQsNGC0LBcblx0ICovXG5cdEJhY2t1cFJlY292ZXIoanNvblBhcmFtcywgY2FsbGJhY2spIHtcblx0XHQkLmFwaSh7XG5cdFx0XHR1cmw6IEJhY2t1cEFwaS5iYWNrdXBSZWNvdmVyLFxuXHRcdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0XHRkYXRhOiBKU09OLnN0cmluZ2lmeShqc29uUGFyYW1zKSxcblx0XHRcdG9uOiAnbm93Jyxcblx0XHRcdHN1Y2Nlc3NUZXN0OiBQYnhBcGkuc3VjY2Vzc1Rlc3QsXG5cdFx0XHRvblN1Y2Nlc3MoKSB7XG5cdFx0XHRcdGNhbGxiYWNrKHRydWUpO1xuXHRcdFx0fSxcblx0XHRcdG9uRXJyb3IoKSB7XG5cdFx0XHRcdGNhbGxiYWNrKGZhbHNlKTtcblx0XHRcdH0sXG5cdFx0fSk7XG5cdH0sXG5cdC8qKlxuXHQgKiDQndCw0YfQsNC70L4g0LDRgNGF0LjQstC40YDQvtCy0LDQvdC40LUg0YHQuNGB0YLQtdC80Ytcblx0ICogQHBhcmFtIGpzb25QYXJhbXMgLVxuXHQgKiB7XG5cdCAqIFx0XCJiYWNrdXAtY29uZmlnXCI6XCIxXCIsXG5cdCAqIFx0XCJiYWNrdXAtcmVjb3Jkc1wiOlwiMVwiLFxuXHQgKiBcdFwiYmFja3VwLWNkclwiOlwiMVwiLFxuXHQgKiBcdFwiYmFja3VwLXNvdW5kLWZpbGVzXCI6XCIxXCJcblx0ICogXHR9XG5cdCAqIEBwYXJhbSBjYWxsYmFjayAtINGE0YPQvdC60YbQuNGPINC00LvRjyDQvtCx0YDQsNCx0L7RgtC60Lgg0YDQtdC30YPQu9GM0YLQsNGC0LBcblx0ICovXG5cdEJhY2t1cFN0YXJ0KGpzb25QYXJhbXMsIGNhbGxiYWNrKSB7XG5cdFx0JC5hcGkoe1xuXHRcdFx0dXJsOiBCYWNrdXBBcGkuYmFja3VwU3RhcnQsXG5cdFx0XHRvbjogJ25vdycsXG5cdFx0XHRtZXRob2Q6ICdQT1NUJyxcblx0XHRcdGRhdGE6IEpTT04uc3RyaW5naWZ5KGpzb25QYXJhbXMpLFxuXHRcdFx0c3VjY2Vzc1Rlc3Q6IFBieEFwaS5zdWNjZXNzVGVzdCxcblx0XHRcdG9uU3VjY2VzcyhyZXNwb25zZSkge1xuXHRcdFx0XHRjYWxsYmFjayhyZXNwb25zZS5kYXRhKTtcblx0XHRcdH0sXG5cdFx0XHRvbkVycm9yKCkge1xuXHRcdFx0XHRjYWxsYmFjayhmYWxzZSk7XG5cdFx0XHR9LFxuXHRcdH0pO1xuXHR9LFxuXHQvKipcblx0ICog0J/RgNC40L7RgdGC0LDQvdC+0LLQuNGC0Ywg0LDRgNGF0LjQstC40YDQvtCy0LDQvdC40LUg0YHQuNGB0YLQtdC80Ytcblx0ICogQHBhcmFtIGZpbGVJZCAtINCY0JQg0YEg0YTQsNC50LvQvtC8INCw0YDRhdC40LLQsFxuXHQgKiBAcGFyYW0gY2FsbGJhY2sgLSDRhNGD0L3QutGG0LjRjyDQtNC70Y8g0L7QsdGA0LDQsdC+0YLQutC4INGA0LXQt9GD0LvRjNGC0LDRgtCwXG5cdCAqL1xuXHRCYWNrdXBTdG9wKGZpbGVJZCwgY2FsbGJhY2spIHtcblx0XHQkLmFwaSh7XG5cdFx0XHR1cmw6IEJhY2t1cEFwaS5iYWNrdXBTdG9wLFxuXHRcdFx0b246ICdub3cnLFxuXHRcdFx0bWV0aG9kOiAnUE9TVCcsXG5cdFx0XHRkYXRhOiBgeydpZCc6JyR7ZmlsZUlkfSd9YCxcblx0XHRcdHN1Y2Nlc3NUZXN0OiBQYnhBcGkuc3VjY2Vzc1Rlc3QsXG5cdFx0XHRvblN1Y2Nlc3MocmVzcG9uc2UpIHtcblx0XHRcdFx0Y2FsbGJhY2socmVzcG9uc2UuZGF0YSk7XG5cdFx0XHR9LFxuXHRcdFx0b25FcnJvcigpIHtcblx0XHRcdFx0Y2FsbGJhY2soZmFsc2UpO1xuXHRcdFx0fSxcblx0XHR9KTtcblx0fSxcblxuXHQvKipcblx0ICog0J/QvtC70YPRh9C40YLRjCDRgNCw0LfQvNC10YAg0YTQsNC50LvQvtCyINC00LvRjyDQsdC10LrQsNC/0LBcblx0ICogQHBhcmFtIGNhbGxiYWNrIC0g0YTRg9C90LrRhtC40Y8g0LTQu9GPINC+0LHRgNCw0LHQvtGC0LrQuCDRgNC10LfRg9C70YzRgtCw0YLQsFxuXHQgKi9cblx0QmFja3VwR2V0RXN0aW1hdGVkU2l6ZShjYWxsYmFjaykge1xuXHRcdCQuYXBpKHtcblx0XHRcdHVybDogQmFja3VwQXBpLmJhY2t1cEdldEVzdGltYXRlZFNpemUsXG5cdFx0XHRvbjogJ25vdycsXG5cdFx0XHRzdWNjZXNzVGVzdDogUGJ4QXBpLnN1Y2Nlc3NUZXN0LFxuXHRcdFx0b25TdWNjZXNzKHJlc3BvbnNlKSB7XG5cdFx0XHRcdGNhbGxiYWNrKHJlc3BvbnNlLmRhdGEpO1xuXHRcdFx0fSxcblx0XHRcdG9uRXJyb3IoKSB7XG5cdFx0XHRcdGNhbGxiYWNrKGZhbHNlKTtcblx0XHRcdH0sXG5cdFx0fSk7XG5cdH0sXG5cblx0LyoqXG5cdCAqINCf0LXRgNC10L3QtdGB0YLQuCDQt9Cw0LrQsNGH0LDQvdC90YvQuSDRhNCw0LnQuyDQsiDQv9Cw0L/QutGDINGBINCx0LXQutCw0L/QsNC80Lhcblx0ICogQHBhcmFtIGZpbGVQYXRoIC0gUGF0aCDQv9C+0LvRg9GH0LXQvdC90YvQuSDQuNC3IGZpbGVVcGxvYWRcblx0ICogQHBhcmFtIGNhbGxiYWNrIC0g0YTRg9C90LrRhtC40Y8g0LTQu9GPINC+0LHRgNCw0LHQvtGC0LrQuCDRgNC10LfRg9C70YzRgtCw0YLQsFxuXHQgKi9cblx0QmFja3VwVW5wYWNrVXBsb2FkZWRJbWdDb25mKGZpbGVQYXRoLCBjYWxsYmFjaykge1xuXHRcdCQuYXBpKHtcblx0XHRcdHVybDogQmFja3VwQXBpLmJhY2t1cFVucGFja1VwbG9hZGVkSW1nQ29uZixcblx0XHRcdG9uOiAnbm93Jyxcblx0XHRcdG1ldGhvZDogJ1BPU1QnLFxuXHRcdFx0ZGF0YTogYHtcInRlbXBfZmlsZVwiOlwiJHtmaWxlUGF0aH1cIn1gLFxuXHRcdFx0c3VjY2Vzc1Rlc3Q6IFBieEFwaS5zdWNjZXNzVGVzdCxcblx0XHRcdG9uU3VjY2VzcyhyZXNwb25zZSkge1xuXHRcdFx0XHRjYWxsYmFjayhyZXNwb25zZS5kYXRhKTtcblx0XHRcdH0sXG5cdFx0XHRvbkVycm9yKCkge1xuXHRcdFx0XHRjYWxsYmFjayhmYWxzZSk7XG5cdFx0XHR9LFxuXHRcdH0pO1xuXHR9LFxuXG5cdC8qKlxuXHQgKiDQl9Cw0L/Rg9GB0LrQsNC10YIg0LfQsNC/0LvQsNC90LjRgNC+0LLQsNC90L3QvtC1INGA0LXQt9C10YDQstC90L7QtSDQutC+0L/QuNGA0L7QstCw0L3QuNC1INGB0YDQsNC30YNcblx0ICpcblx0ICovXG5cdEJhY2t1cFN0YXJ0U2NoZWR1bGVkKGNhbGxiYWNrKSB7XG5cdFx0JC5hcGkoe1xuXHRcdFx0dXJsOiBCYWNrdXBBcGkuYmFja3VwU3RhcnRTY2hlZHVsZWQsXG5cdFx0XHRvbjogJ25vdycsXG5cdFx0XHRzdWNjZXNzVGVzdDogUGJ4QXBpLnN1Y2Nlc3NUZXN0LFxuXHRcdFx0b25TdWNjZXNzKCkge1xuXHRcdFx0XHRjYWxsYmFjayh0cnVlKTtcblx0XHRcdH0sXG5cdFx0XHRvbkVycm9yKCkge1xuXHRcdFx0XHRjYWxsYmFjayhmYWxzZSk7XG5cdFx0XHR9LFxuXHRcdH0pO1xuXHR9LFxufTtcblxuLy8gZXhwb3J0IGRlZmF1bHQgQmFja3VwQXBpO1xuIl19