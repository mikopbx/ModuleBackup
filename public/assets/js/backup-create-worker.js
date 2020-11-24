"use strict";

/*
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 12 2019
 *
 */

/* global BackupApi, globalRootUrl */
var backupCreateWorker = {
  timeOut: 3000,
  timeOutHandle: '',
  $submitButton: $('#submitbutton'),
  $stopCreateBackup: $('#stopbackupbutton'),
  waitBackupId: '',
  $progressBar: $('#backup-progress-bar'),
  backupIsPreparing: false,
  initialize: function () {
    function initialize(waitBackupId) {
      backupCreateWorker.waitBackupId = waitBackupId; // Запустим обновление статуса создания резервной копии

      backupCreateWorker.restartWorker();
    }

    return initialize;
  }(),
  restartWorker: function () {
    function restartWorker() {
      window.clearTimeout(backupCreateWorker.timeoutHandle);
      backupCreateWorker.worker();
    }

    return restartWorker;
  }(),
  worker: function () {
    function worker() {
      BackupApi.BackupGetFilesList(backupCreateWorker.cbAfterGetFiles);
      backupCreateWorker.timeoutHandle = window.setTimeout(backupCreateWorker.worker, backupCreateWorker.timeOut);
    }

    return worker;
  }(),
  cbAfterGetFiles: function () {
    function cbAfterGetFiles(response) {
      if (response.length === 0 || response === false) {
        window.clearTimeout(backupCreateWorker.timeoutHandle);
        backupCreateWorker.$submitButton.show();
        backupCreateWorker.$submitButton.removeClass('loading');
        backupCreateWorker.$stopCreateBackup.hide();
      } else {
        // ["0": {
        // 		"date": "1530715058",
        // 		"size": 13.66,
        // 		"progress": 10,
        // 		"total": 32,
        // 		"config": {
        // 			"backup-config": "1",
        // 			"backup-records": "1",
        // 			"backup-cdr": "1",
        // 			"backup-sound-files": "1"
        // 		},
        // 		"pid": "",
        // 		"id": "backup_1530715058"
        // }]
        var percentOfTotal = 0;
        $.each(response, function (key, value) {
          if (backupCreateWorker.waitBackupId === '' && value.pid.length > 0) {
            backupCreateWorker.waitBackupId = value.id;
          }

          if (backupCreateWorker.waitBackupId === value.id) {
            backupCreateWorker.$submitButton.hide();
            backupCreateWorker.$stopCreateBackup.attr('data-value', backupCreateWorker.waitBackupId).show();
            percentOfTotal = 100 * (value.progress / value.total);
            backupCreateWorker.$progressBar.progress({
              duration: value.progress,
              total: value.total,
              percent: parseInt(percentOfTotal, 10),
              text: {
                active: '{value} of {total} done'
              }
            });

            if (value.total === value.progress && backupCreateWorker.backupIsPreparing) {
              window.location = "".concat(globalRootUrl, "module-backup/index");
            }

            backupCreateWorker.backupIsPreparing = value.pid.length > 0;
          }
        });

        if (backupCreateWorker.backupIsPreparing === false) {
          backupCreateWorker.$submitButton.show();
          backupCreateWorker.$stopCreateBackup.hide();
          backupCreateWorker.$submitButton.removeClass('loading');
          window.clearTimeout(backupCreateWorker.timeoutHandle);
        }
      }
    }

    return cbAfterGetFiles;
  }()
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9iYWNrdXAtY3JlYXRlLXdvcmtlci5qcyJdLCJuYW1lcyI6WyJiYWNrdXBDcmVhdGVXb3JrZXIiLCJ0aW1lT3V0IiwidGltZU91dEhhbmRsZSIsIiRzdWJtaXRCdXR0b24iLCIkIiwiJHN0b3BDcmVhdGVCYWNrdXAiLCJ3YWl0QmFja3VwSWQiLCIkcHJvZ3Jlc3NCYXIiLCJiYWNrdXBJc1ByZXBhcmluZyIsImluaXRpYWxpemUiLCJyZXN0YXJ0V29ya2VyIiwid2luZG93IiwiY2xlYXJUaW1lb3V0IiwidGltZW91dEhhbmRsZSIsIndvcmtlciIsIkJhY2t1cEFwaSIsIkJhY2t1cEdldEZpbGVzTGlzdCIsImNiQWZ0ZXJHZXRGaWxlcyIsInNldFRpbWVvdXQiLCJyZXNwb25zZSIsImxlbmd0aCIsInNob3ciLCJyZW1vdmVDbGFzcyIsImhpZGUiLCJwZXJjZW50T2ZUb3RhbCIsImVhY2giLCJrZXkiLCJ2YWx1ZSIsInBpZCIsImlkIiwiYXR0ciIsInByb2dyZXNzIiwidG90YWwiLCJkdXJhdGlvbiIsInBlcmNlbnQiLCJwYXJzZUludCIsInRleHQiLCJhY3RpdmUiLCJsb2NhdGlvbiIsImdsb2JhbFJvb3RVcmwiXSwibWFwcGluZ3MiOiI7O0FBQUE7Ozs7Ozs7O0FBUUE7QUFFQSxJQUFNQSxrQkFBa0IsR0FBRztBQUMxQkMsRUFBQUEsT0FBTyxFQUFFLElBRGlCO0FBRTFCQyxFQUFBQSxhQUFhLEVBQUUsRUFGVztBQUcxQkMsRUFBQUEsYUFBYSxFQUFFQyxDQUFDLENBQUMsZUFBRCxDQUhVO0FBSTFCQyxFQUFBQSxpQkFBaUIsRUFBRUQsQ0FBQyxDQUFDLG1CQUFELENBSk07QUFLMUJFLEVBQUFBLFlBQVksRUFBRSxFQUxZO0FBTTFCQyxFQUFBQSxZQUFZLEVBQUVILENBQUMsQ0FBQyxzQkFBRCxDQU5XO0FBTzFCSSxFQUFBQSxpQkFBaUIsRUFBRSxLQVBPO0FBUTFCQyxFQUFBQSxVQVIwQjtBQUFBLHdCQVFmSCxZQVJlLEVBUUQ7QUFDeEJOLE1BQUFB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QWtCLENBQUNRLGlCQUFuQixHQUF3Q21CLEtBQUssQ0FBQ0MsR0FBTixDQUFVUixNQUFWLEdBQW1CLENBQTNEO0FBQ0E7QUFDRCxTQXhCRDs7QUF5QkEsWUFBSXBCLGtCQUFrQixDQUFDUSxpQkFBbkIsS0FBeUMsS0FBN0MsRUFBb0Q7QUFDbkRSLFVBQUFBLGtCQUFrQixDQUFDRyxhQUFuQixDQUFpQ2tCLElBQWpDO0FBQ0FyQixVQUFBQSxrQkFBa0IsQ0FBQ0ssaUJBQW5CLENBQXFDa0IsSUFBckM7QUFDQXZCLFVBQUFBLGtCQUFrQixDQUFDRyxhQUFuQixDQUFpQ21CLFdBQWpDLENBQTZDLFNBQTdDO0FBQ0FYLFVBQUFBLE1BQU0sQ0FBQ0MsWUFBUCxDQUFvQlosa0JBQWtCLENBQUNhLGFBQXZDO0FBQ0E7QUFDRDtBQUNEOztBQTlFeUI7QUFBQTtBQUFBLENBQTNCIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIENvcHlyaWdodCAoQykgTUlLTyBMTEMgLSBBbGwgUmlnaHRzIFJlc2VydmVkXG4gKiBVbmF1dGhvcml6ZWQgY29weWluZyBvZiB0aGlzIGZpbGUsIHZpYSBhbnkgbWVkaXVtIGlzIHN0cmljdGx5IHByb2hpYml0ZWRcbiAqIFByb3ByaWV0YXJ5IGFuZCBjb25maWRlbnRpYWxcbiAqIFdyaXR0ZW4gYnkgTmlrb2xheSBCZWtldG92LCAxMiAyMDE5XG4gKlxuICovXG5cbi8qIGdsb2JhbCBCYWNrdXBBcGksIGdsb2JhbFJvb3RVcmwgKi9cblxuY29uc3QgYmFja3VwQ3JlYXRlV29ya2VyID0ge1xuXHR0aW1lT3V0OiAzMDAwLFxuXHR0aW1lT3V0SGFuZGxlOiAnJyxcblx0JHN1Ym1pdEJ1dHRvbjogJCgnI3N1Ym1pdGJ1dHRvbicpLFxuXHQkc3RvcENyZWF0ZUJhY2t1cDogJCgnI3N0b3BiYWNrdXBidXR0b24nKSxcblx0d2FpdEJhY2t1cElkOiAnJyxcblx0JHByb2dyZXNzQmFyOiAkKCcjYmFja3VwLXByb2dyZXNzLWJhcicpLFxuXHRiYWNrdXBJc1ByZXBhcmluZzogZmFsc2UsXG5cdGluaXRpYWxpemUod2FpdEJhY2t1cElkKSB7XG5cdFx0YmFja3VwQ3JlYXRlV29ya2VyLndhaXRCYWNrdXBJZCA9IHdhaXRCYWNrdXBJZDtcblx0XHQvLyDQl9Cw0L/Rg9GB0YLQuNC8INC+0LHQvdC+0LLQu9C10L3QuNC1INGB0YLQsNGC0YPRgdCwINGB0L7Qt9C00LDQvdC40Y8g0YDQtdC30LXRgNCy0L3QvtC5INC60L7Qv9C40Lhcblx0XHRiYWNrdXBDcmVhdGVXb3JrZXIucmVzdGFydFdvcmtlcigpO1xuXHR9LFxuXHRyZXN0YXJ0V29ya2VyKCkge1xuXHRcdHdpbmRvdy5jbGVhclRpbWVvdXQoYmFja3VwQ3JlYXRlV29ya2VyLnRpbWVvdXRIYW5kbGUpO1xuXHRcdGJhY2t1cENyZWF0ZVdvcmtlci53b3JrZXIoKTtcblx0fSxcblx0d29ya2VyKCkge1xuXHRcdEJhY2t1cEFwaS5CYWNrdXBHZXRGaWxlc0xpc3QoYmFja3VwQ3JlYXRlV29ya2VyLmNiQWZ0ZXJHZXRGaWxlcyk7XG5cdFx0YmFja3VwQ3JlYXRlV29ya2VyLnRpbWVvdXRIYW5kbGUgPSB3aW5kb3cuc2V0VGltZW91dChcblx0XHRcdGJhY2t1cENyZWF0ZVdvcmtlci53b3JrZXIsXG5cdFx0XHRiYWNrdXBDcmVhdGVXb3JrZXIudGltZU91dCxcblx0XHQpO1xuXHR9LFxuXHRjYkFmdGVyR2V0RmlsZXMocmVzcG9uc2UpIHtcblx0XHRpZiAocmVzcG9uc2UubGVuZ3RoID09PSAwIHx8IHJlc3BvbnNlID09PSBmYWxzZSkge1xuXHRcdFx0d2luZG93LmNsZWFyVGltZW91dChiYWNrdXBDcmVhdGVXb3JrZXIudGltZW91dEhhbmRsZSk7XG5cdFx0XHRiYWNrdXBDcmVhdGVXb3JrZXIuJHN1Ym1pdEJ1dHRvbi5zaG93KCk7XG5cdFx0XHRiYWNrdXBDcmVhdGVXb3JrZXIuJHN1Ym1pdEJ1dHRvbi5yZW1vdmVDbGFzcygnbG9hZGluZycpO1xuXHRcdFx0YmFja3VwQ3JlYXRlV29ya2VyLiRzdG9wQ3JlYXRlQmFja3VwLmhpZGUoKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0Ly8gW1wiMFwiOiB7XG5cdFx0XHQvLyBcdFx0XCJkYXRlXCI6IFwiMTUzMDcxNTA1OFwiLFxuXHRcdFx0Ly8gXHRcdFwic2l6ZVwiOiAxMy42Nixcblx0XHRcdC8vIFx0XHRcInByb2dyZXNzXCI6IDEwLFxuXHRcdFx0Ly8gXHRcdFwidG90YWxcIjogMzIsXG5cdFx0XHQvLyBcdFx0XCJjb25maWdcIjoge1xuXHRcdFx0Ly8gXHRcdFx0XCJiYWNrdXAtY29uZmlnXCI6IFwiMVwiLFxuXHRcdFx0Ly8gXHRcdFx0XCJiYWNrdXAtcmVjb3Jkc1wiOiBcIjFcIixcblx0XHRcdC8vIFx0XHRcdFwiYmFja3VwLWNkclwiOiBcIjFcIixcblx0XHRcdC8vIFx0XHRcdFwiYmFja3VwLXNvdW5kLWZpbGVzXCI6IFwiMVwiXG5cdFx0XHQvLyBcdFx0fSxcblx0XHRcdC8vIFx0XHRcInBpZFwiOiBcIlwiLFxuXHRcdFx0Ly8gXHRcdFwiaWRcIjogXCJiYWNrdXBfMTUzMDcxNTA1OFwiXG5cdFx0XHQvLyB9XVxuXHRcdFx0bGV0IHBlcmNlbnRPZlRvdGFsID0gMDtcblx0XHRcdCQuZWFjaChyZXNwb25zZSwgKGtleSwgdmFsdWUpID0+IHtcblx0XHRcdFx0aWYgKGJhY2t1cENyZWF0ZVdvcmtlci53YWl0QmFja3VwSWQgPT09ICcnICYmIHZhbHVlLnBpZC5sZW5ndGggPiAwKSB7XG5cdFx0XHRcdFx0YmFja3VwQ3JlYXRlV29ya2VyLndhaXRCYWNrdXBJZCA9IHZhbHVlLmlkO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChiYWNrdXBDcmVhdGVXb3JrZXIud2FpdEJhY2t1cElkID09PSB2YWx1ZS5pZCkge1xuXHRcdFx0XHRcdGJhY2t1cENyZWF0ZVdvcmtlci4kc3VibWl0QnV0dG9uLmhpZGUoKTtcblx0XHRcdFx0XHRiYWNrdXBDcmVhdGVXb3JrZXIuJHN0b3BDcmVhdGVCYWNrdXBcblx0XHRcdFx0XHRcdC5hdHRyKCdkYXRhLXZhbHVlJywgYmFja3VwQ3JlYXRlV29ya2VyLndhaXRCYWNrdXBJZClcblx0XHRcdFx0XHRcdC5zaG93KCk7XG5cdFx0XHRcdFx0cGVyY2VudE9mVG90YWwgPSAxMDAgKiAodmFsdWUucHJvZ3Jlc3MgLyB2YWx1ZS50b3RhbCk7XG5cblx0XHRcdFx0XHRiYWNrdXBDcmVhdGVXb3JrZXIuJHByb2dyZXNzQmFyLnByb2dyZXNzKHtcblx0XHRcdFx0XHRcdGR1cmF0aW9uOiB2YWx1ZS5wcm9ncmVzcyxcblx0XHRcdFx0XHRcdHRvdGFsOiB2YWx1ZS50b3RhbCxcblx0XHRcdFx0XHRcdHBlcmNlbnQ6IHBhcnNlSW50KHBlcmNlbnRPZlRvdGFsLCAxMCksXG5cdFx0XHRcdFx0XHR0ZXh0OiB7XG5cdFx0XHRcdFx0XHRcdGFjdGl2ZTogJ3t2YWx1ZX0gb2Yge3RvdGFsfSBkb25lJyxcblx0XHRcdFx0XHRcdH0sXG5cdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0aWYgKHZhbHVlLnRvdGFsID09PSB2YWx1ZS5wcm9ncmVzcyAmJiBiYWNrdXBDcmVhdGVXb3JrZXIuYmFja3VwSXNQcmVwYXJpbmcpIHtcblx0XHRcdFx0XHRcdHdpbmRvdy5sb2NhdGlvbiA9IGAke2dsb2JhbFJvb3RVcmx9bW9kdWxlLWJhY2t1cC9pbmRleGA7XG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGJhY2t1cENyZWF0ZVdvcmtlci5iYWNrdXBJc1ByZXBhcmluZyA9ICh2YWx1ZS5waWQubGVuZ3RoID4gMCk7XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0aWYgKGJhY2t1cENyZWF0ZVdvcmtlci5iYWNrdXBJc1ByZXBhcmluZyA9PT0gZmFsc2UpIHtcblx0XHRcdFx0YmFja3VwQ3JlYXRlV29ya2VyLiRzdWJtaXRCdXR0b24uc2hvdygpO1xuXHRcdFx0XHRiYWNrdXBDcmVhdGVXb3JrZXIuJHN0b3BDcmVhdGVCYWNrdXAuaGlkZSgpO1xuXHRcdFx0XHRiYWNrdXBDcmVhdGVXb3JrZXIuJHN1Ym1pdEJ1dHRvbi5yZW1vdmVDbGFzcygnbG9hZGluZycpO1xuXHRcdFx0XHR3aW5kb3cuY2xlYXJUaW1lb3V0KGJhY2t1cENyZWF0ZVdvcmtlci50aW1lb3V0SGFuZGxlKTtcblx0XHRcdH1cblx0XHR9XG5cdH0sXG59O1xuXG5cbiJdfQ==