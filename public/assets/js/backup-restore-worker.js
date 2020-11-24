"use strict";

/*
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 12 2019
 *
 */

/* global BackupApi, globalTranslate, globalRootUrl */
var restoreWorker = {
  timeOut: 3000,
  timeOutHandle: '',
  $submitButton: $('#submitbutton'),
  waitRestoreId: undefined,
  $progressBar: $('#restore-progress-bar'),
  restoreIsProcessing: false,
  $formObj: $('#backup-restore-form'),
  formAlreadyBuilded: false,
  initialize: function () {
    function initialize(waitRestoreId) {
      // Если модуль отключен возврат в начало
      if (!$('#module-status-toggle').checkbox('is checked')) {
        window.location = "".concat(globalRootUrl, "module-backup/index");
      }

      restoreWorker.waitRestoreId = waitRestoreId; // Запустим обновление статуса восстановления резервной копии

      restoreWorker.restartWorker();
    }

    return initialize;
  }(),
  restartWorker: function () {
    function restartWorker() {
      window.clearTimeout(restoreWorker.timeoutHandle);
      restoreWorker.worker();
    }

    return restartWorker;
  }(),
  worker: function () {
    function worker() {
      BackupApi.BackupGetFilesList(restoreWorker.cbAfterGetFiles);
      restoreWorker.timeoutHandle = window.setTimeout(restoreWorker.worker, restoreWorker.timeOut);
    }

    return worker;
  }(),
  cbAfterGetFiles: function () {
    function cbAfterGetFiles(response) {
      if (response.length === 0 || response === false) {
        window.clearTimeout(restoreWorker.timeoutHandle);
        restoreWorker.$submitButton.removeClass('loading');
      } else {
        var percentOfTotal = 0;
        $.each(response, function (key, value) {
          restoreWorker.restoreIsProcessing = value.pid_recover.length > 0 || restoreWorker.restoreIsProcessing;

          if (restoreWorker.waitRestoreId === undefined && value.pid_recover.length > 0) {
            restoreWorker.waitRestoreId = value.id;
          }

          if (restoreWorker.waitRestoreId === value.id && restoreWorker.restoreIsProcessing > 0) {
            percentOfTotal = 100 * (value.progress_recover / value.total);
            restoreWorker.$progressBar.progress({
              duration: value.progress_recover,
              total: value.total,
              percent: parseInt(percentOfTotal, 10),
              text: {
                active: '{value} of {total} done'
              }
            });

            if (value.progress_recover === value.total) {
              restoreWorker.$submitButton.removeClass('loading');
            }
          } // Построим форму с чекбоксами


          if (restoreWorker.waitRestoreId === value.id) {
            if (!restoreWorker.formAlreadyBuilded) {
              $.each(value.config, function (configKey, configValue) {
                if (configValue === '1') {
                  var locLabel = "bkp_".concat(configKey);
                  var html = '<div class="ui segment"><div class="field"><div class="ui toggle checkbox">';
                  html += "<input type=\"checkbox\" name=\"".concat(configKey, "\" checked = \"checked\" class=\"hidden\"/>");
                  html += "<label>".concat(globalTranslate[locLabel], "</label>");
                  html += '</div></div></div>';
                  restoreWorker.$formObj.prepend(html);
                }
              });
              $('.checkbox').checkbox({
                onChange: restoreWorker.onChangeCheckbox
              });
              restoreWorker.formAlreadyBuilded = true;
            }
          }
        });

        if (restoreWorker.restoreIsProcessing === false) {
          window.clearTimeout(restoreWorker.timeoutHandle);
        }
      }
    }

    return cbAfterGetFiles;
  }(),

  /**
   * При выключении всех чекбоксов отключить кнопку
   */
  onChangeCheckbox: function () {
    function onChangeCheckbox() {
      var formResult = restoreWorker.$formObj.form('get values');
      var options = {};
      $.each(formResult, function (key, value) {
        if (value) {
          options[key] = '1';
        }
      });

      if (Object.entries(options).length === 0) {
        restoreWorker.$submitButton.addClass('disabled');
      } else {
        restoreWorker.$submitButton.removeClass('disabled');
      }
    }

    return onChangeCheckbox;
  }()
};
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInNyYy9iYWNrdXAtcmVzdG9yZS13b3JrZXIuanMiXSwibmFtZXMiOlsicmVzdG9yZVdvcmtlciIsInRpbWVPdXQiLCJ0aW1lT3V0SGFuZGxlIiwiJHN1Ym1pdEJ1dHRvbiIsIiQiLCJ3YWl0UmVzdG9yZUlkIiwidW5kZWZpbmVkIiwiJHByb2dyZXNzQmFyIiwicmVzdG9yZUlzUHJvY2Vzc2luZyIsIiRmb3JtT2JqIiwiZm9ybUFscmVhZHlCdWlsZGVkIiwiaW5pdGlhbGl6ZSIsImNoZWNrYm94Iiwid2luZG93IiwibG9jYXRpb24iLCJnbG9iYWxSb290VXJsIiwicmVzdGFydFdvcmtlciIsImNsZWFyVGltZW91dCIsInRpbWVvdXRIYW5kbGUiLCJ3b3JrZXIiLCJCYWNrdXBBcGkiLCJCYWNrdXBHZXRGaWxlc0xpc3QiLCJjYkFmdGVyR2V0RmlsZXMiLCJzZXRUaW1lb3V0IiwicmVzcG9uc2UiLCJsZW5ndGgiLCJyZW1vdmVDbGFzcyIsInBlcmNlbnRPZlRvdGFsIiwiZWFjaCIsImtleSIsInZhbHVlIiwicGlkX3JlY292ZXIiLCJpZCIsInByb2dyZXNzX3JlY292ZXIiLCJ0b3RhbCIsInByb2dyZXNzIiwiZHVyYXRpb24iLCJwZXJjZW50IiwicGFyc2VJbnQiLCJ0ZXh0IiwiYWN0aXZlIiwiY29uZmlnIiwiY29uZmlnS2V5IiwiY29uZmlnVmFsdWUiLCJsb2NMYWJlbCIsImh0bWwiLCJnbG9iYWxUcmFuc2xhdGUiLCJwcmVwZW5kIiwib25DaGFuZ2UiLCJvbkNoYW5nZUNoZWNrYm94IiwiZm9ybVJlc3VsdCIsImZvcm0iLCJvcHRpb25zIiwiT2JqZWN0IiwiZW50cmllcyIsImFkZENsYXNzIl0sIm1hcHBpbmdzIjoiOztBQUFBOzs7Ozs7OztBQVFBO0FBRUEsSUFBTUEsYUFBYSxHQUFHO0FBQ3JCQyxFQUFBQSxPQUFPLEVBQUUsSUFEWTtBQUVyQkMsRUFBQUEsYUFBYSxFQUFFLEVBRk07QUFHckJDLEVBQUFBLGFBQWEsRUFBRUMsQ0FBQyxDQUFDLGVBQUQs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akIsYUFBYSxDQUFDa0IsYUFBbEM7QUFDQTtBQUNEO0FBQ0Q7O0FBOUVvQjtBQUFBOztBQStFckI7OztBQUdBK0IsRUFBQUEsZ0JBbEZxQjtBQUFBLGdDQWtGRjtBQUNsQixVQUFNQyxVQUFVLEdBQUdsRCxhQUFhLENBQUNTLFFBQWQsQ0FBdUIwQyxJQUF2QixDQUE0QixZQUE1QixDQUFuQjtBQUNBLFVBQU1DLE9BQU8sR0FBRyxFQUFoQjtBQUNBaEQsTUFBQUEsQ0FBQyxDQUFDd0IsSUFBRixDQUFPc0IsVUFBUCxFQUFtQixVQUFDckIsR0FBRCxFQUFNQyxLQUFOLEVBQWdCO0FBQ2xDLFlBQUlBLEtBQUosRUFBVztBQUNWc0IsVUFBQUEsT0FBTyxDQUFDdkIsR0FBRCxDQUFQLEdBQWUsR0FBZjtBQUNBO0FBQ0QsT0FKRDs7QUFLQSxVQUFJd0IsTUFBTSxDQUFDQyxPQUFQLENBQWVGLE9BQWYsRUFBd0IzQixNQUF4QixLQUFtQyxDQUF2QyxFQUEwQztBQUN6Q3pCLFFBQUFBLGFBQWEsQ0FBQ0csYUFBZCxDQUE0Qm9ELFFBQTVCLENBQXFDLFVBQXJDO0FBQ0EsT0FGRCxNQUVPO0FBQ052RCxRQUFBQSxhQUFhLENBQUNHLGFBQWQsQ0FBNEJ1QixXQUE1QixDQUF3QyxVQUF4QztBQUNBO0FBQ0Q7O0FBL0ZvQjtBQUFBO0FBQUEsQ0FBdEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogQ29weXJpZ2h0IChDKSBNSUtPIExMQyAtIEFsbCBSaWdodHMgUmVzZXJ2ZWRcbiAqIFVuYXV0aG9yaXplZCBjb3B5aW5nIG9mIHRoaXMgZmlsZSwgdmlhIGFueSBtZWRpdW0gaXMgc3RyaWN0bHkgcHJvaGliaXRlZFxuICogUHJvcHJpZXRhcnkgYW5kIGNvbmZpZGVudGlhbFxuICogV3JpdHRlbiBieSBOaWtvbGF5IEJla2V0b3YsIDEyIDIwMTlcbiAqXG4gKi9cblxuLyogZ2xvYmFsIEJhY2t1cEFwaSwgZ2xvYmFsVHJhbnNsYXRlLCBnbG9iYWxSb290VXJsICovXG5cbmNvbnN0IHJlc3RvcmVXb3JrZXIgPSB7XG5cdHRpbWVPdXQ6IDMwMDAsXG5cdHRpbWVPdXRIYW5kbGU6ICcnLFxuXHQkc3VibWl0QnV0dG9uOiAkKCcjc3VibWl0YnV0dG9uJyksXG5cdHdhaXRSZXN0b3JlSWQ6IHVuZGVmaW5lZCxcblx0JHByb2dyZXNzQmFyOiAkKCcjcmVzdG9yZS1wcm9ncmVzcy1iYXInKSxcblx0cmVzdG9yZUlzUHJvY2Vzc2luZzogZmFsc2UsXG5cdCRmb3JtT2JqOiAkKCcjYmFja3VwLXJlc3RvcmUtZm9ybScpLFxuXHRmb3JtQWxyZWFkeUJ1aWxkZWQ6IGZhbHNlLFxuXHRpbml0aWFsaXplKHdhaXRSZXN0b3JlSWQpIHtcblx0XHQvLyDQldGB0LvQuCDQvNC+0LTRg9C70Ywg0L7RgtC60LvRjtGH0LXQvSDQstC+0LfQstGA0LDRgiDQsiDQvdCw0YfQsNC70L5cblx0XHRpZiAoISQoJyNtb2R1bGUtc3RhdHVzLXRvZ2dsZScpLmNoZWNrYm94KCdpcyBjaGVja2VkJykpIHtcblx0XHRcdHdpbmRvdy5sb2NhdGlvbiA9IGAke2dsb2JhbFJvb3RVcmx9bW9kdWxlLWJhY2t1cC9pbmRleGA7XG5cdFx0fVxuXHRcdHJlc3RvcmVXb3JrZXIud2FpdFJlc3RvcmVJZCA9IHdhaXRSZXN0b3JlSWQ7XG5cdFx0Ly8g0JfQsNC/0YPRgdGC0LjQvCDQvtCx0L3QvtCy0LvQtdC90LjQtSDRgdGC0LDRgtGD0YHQsCDQstC+0YHRgdGC0LDQvdC+0LLQu9C10L3QuNGPINGA0LXQt9C10YDQstC90L7QuSDQutC+0L/QuNC4XG5cdFx0cmVzdG9yZVdvcmtlci5yZXN0YXJ0V29ya2VyKCk7XG5cdH0sXG5cdHJlc3RhcnRXb3JrZXIoKSB7XG5cdFx0d2luZG93LmNsZWFyVGltZW91dChyZXN0b3JlV29ya2VyLnRpbWVvdXRIYW5kbGUpO1xuXHRcdHJlc3RvcmVXb3JrZXIud29ya2VyKCk7XG5cdH0sXG5cdHdvcmtlcigpIHtcblx0XHRCYWNrdXBBcGkuQmFja3VwR2V0RmlsZXNMaXN0KHJlc3RvcmVXb3JrZXIuY2JBZnRlckdldEZpbGVzKTtcblx0XHRyZXN0b3JlV29ya2VyLnRpbWVvdXRIYW5kbGUgPSB3aW5kb3cuc2V0VGltZW91dChyZXN0b3JlV29ya2VyLndvcmtlciwgcmVzdG9yZVdvcmtlci50aW1lT3V0KTtcblx0fSxcblx0Y2JBZnRlckdldEZpbGVzKHJlc3BvbnNlKSB7XG5cdFx0aWYgKHJlc3BvbnNlLmxlbmd0aCA9PT0gMCB8fCByZXNwb25zZSA9PT0gZmFsc2UpIHtcblx0XHRcdHdpbmRvdy5jbGVhclRpbWVvdXQocmVzdG9yZVdvcmtlci50aW1lb3V0SGFuZGxlKTtcblx0XHRcdHJlc3RvcmVXb3JrZXIuJHN1Ym1pdEJ1dHRvbi5yZW1vdmVDbGFzcygnbG9hZGluZycpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRsZXQgcGVyY2VudE9mVG90YWwgPSAwO1xuXHRcdFx0JC5lYWNoKHJlc3BvbnNlLCAoa2V5LCB2YWx1ZSkgPT4ge1xuXHRcdFx0XHRyZXN0b3JlV29ya2VyLnJlc3RvcmVJc1Byb2Nlc3NpbmcgPSAodmFsdWUucGlkX3JlY292ZXIubGVuZ3RoID4gMCkgfHwgcmVzdG9yZVdvcmtlci5yZXN0b3JlSXNQcm9jZXNzaW5nO1xuXHRcdFx0XHRpZiAocmVzdG9yZVdvcmtlci53YWl0UmVzdG9yZUlkID09PSB1bmRlZmluZWQgJiYgdmFsdWUucGlkX3JlY292ZXIubGVuZ3RoID4gMCkge1xuXHRcdFx0XHRcdHJlc3RvcmVXb3JrZXIud2FpdFJlc3RvcmVJZCA9IHZhbHVlLmlkO1xuXHRcdFx0XHR9XG5cdFx0XHRcdGlmIChyZXN0b3JlV29ya2VyLndhaXRSZXN0b3JlSWQgPT09IHZhbHVlLmlkICYmIHJlc3RvcmVXb3JrZXIucmVzdG9yZUlzUHJvY2Vzc2luZyA+IDApIHtcblx0XHRcdFx0XHRwZXJjZW50T2ZUb3RhbCA9IDEwMCAqICh2YWx1ZS5wcm9ncmVzc19yZWNvdmVyIC8gdmFsdWUudG90YWwpO1xuXG5cdFx0XHRcdFx0cmVzdG9yZVdvcmtlci4kcHJvZ3Jlc3NCYXIucHJvZ3Jlc3Moe1xuXHRcdFx0XHRcdFx0ZHVyYXRpb246IHZhbHVlLnByb2dyZXNzX3JlY292ZXIsXG5cdFx0XHRcdFx0XHR0b3RhbDogdmFsdWUudG90YWwsXG5cdFx0XHRcdFx0XHRwZXJjZW50OiBwYXJzZUludChwZXJjZW50T2ZUb3RhbCwgMTApLFxuXHRcdFx0XHRcdFx0dGV4dDoge1xuXHRcdFx0XHRcdFx0XHRhY3RpdmU6ICd7dmFsdWV9IG9mIHt0b3RhbH0gZG9uZScsXG5cdFx0XHRcdFx0XHR9LFxuXHRcdFx0XHRcdH0pO1xuXG5cdFx0XHRcdFx0aWYgKHZhbHVlLnByb2dyZXNzX3JlY292ZXIgPT09IHZhbHVlLnRvdGFsKSB7XG5cdFx0XHRcdFx0XHRyZXN0b3JlV29ya2VyLiRzdWJtaXRCdXR0b24ucmVtb3ZlQ2xhc3MoJ2xvYWRpbmcnKTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblxuXHRcdFx0XHQvLyDQn9C+0YHRgtGA0L7QuNC8INGE0L7RgNC80YMg0YEg0YfQtdC60LHQvtC60YHQsNC80Lhcblx0XHRcdFx0aWYgKHJlc3RvcmVXb3JrZXIud2FpdFJlc3RvcmVJZCA9PT0gdmFsdWUuaWQpIHtcblx0XHRcdFx0XHRpZiAoIXJlc3RvcmVXb3JrZXIuZm9ybUFscmVhZHlCdWlsZGVkKSB7XG5cdFx0XHRcdFx0XHQkLmVhY2godmFsdWUuY29uZmlnLCAoY29uZmlnS2V5LCBjb25maWdWYWx1ZSkgPT4ge1xuXHRcdFx0XHRcdFx0XHRpZiAoY29uZmlnVmFsdWUgPT09ICcxJykge1xuXHRcdFx0XHRcdFx0XHRcdGNvbnN0IGxvY0xhYmVsID0gYGJrcF8ke2NvbmZpZ0tleX1gO1xuXHRcdFx0XHRcdFx0XHRcdGxldCBodG1sID0gJzxkaXYgY2xhc3M9XCJ1aSBzZWdtZW50XCI+PGRpdiBjbGFzcz1cImZpZWxkXCI+PGRpdiBjbGFzcz1cInVpIHRvZ2dsZSBjaGVja2JveFwiPic7XG5cdFx0XHRcdFx0XHRcdFx0aHRtbCArPSBgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG5hbWU9XCIke2NvbmZpZ0tleX1cIiBjaGVja2VkID0gXCJjaGVja2VkXCIgY2xhc3M9XCJoaWRkZW5cIi8+YDtcblx0XHRcdFx0XHRcdFx0XHRodG1sICs9IGA8bGFiZWw+JHtnbG9iYWxUcmFuc2xhdGVbbG9jTGFiZWxdfTwvbGFiZWw+YDtcblx0XHRcdFx0XHRcdFx0XHRodG1sICs9ICc8L2Rpdj48L2Rpdj48L2Rpdj4nO1xuXHRcdFx0XHRcdFx0XHRcdHJlc3RvcmVXb3JrZXIuJGZvcm1PYmoucHJlcGVuZChodG1sKTtcblx0XHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0fSk7XG5cdFx0XHRcdFx0XHQkKCcuY2hlY2tib3gnKS5jaGVja2JveCh7XG5cdFx0XHRcdFx0XHRcdG9uQ2hhbmdlOiByZXN0b3JlV29ya2VyLm9uQ2hhbmdlQ2hlY2tib3gsXG5cdFx0XHRcdFx0XHR9KTtcblx0XHRcdFx0XHRcdHJlc3RvcmVXb3JrZXIuZm9ybUFscmVhZHlCdWlsZGVkID0gdHJ1ZTtcblx0XHRcdFx0XHR9XG5cdFx0XHRcdH1cblx0XHRcdH0pO1xuXHRcdFx0aWYgKHJlc3RvcmVXb3JrZXIucmVzdG9yZUlzUHJvY2Vzc2luZyA9PT0gZmFsc2UpIHtcblx0XHRcdFx0d2luZG93LmNsZWFyVGltZW91dChyZXN0b3JlV29ya2VyLnRpbWVvdXRIYW5kbGUpO1xuXHRcdFx0fVxuXHRcdH1cblx0fSxcblx0LyoqXG5cdCAqINCf0YDQuCDQstGL0LrQu9GO0YfQtdC90LjQuCDQstGB0LXRhSDRh9C10LrQsdC+0LrRgdC+0LIg0L7RgtC60LvRjtGH0LjRgtGMINC60L3QvtC/0LrRg1xuXHQgKi9cblx0b25DaGFuZ2VDaGVja2JveCgpIHtcblx0XHRjb25zdCBmb3JtUmVzdWx0ID0gcmVzdG9yZVdvcmtlci4kZm9ybU9iai5mb3JtKCdnZXQgdmFsdWVzJyk7XG5cdFx0Y29uc3Qgb3B0aW9ucyA9IHt9O1xuXHRcdCQuZWFjaChmb3JtUmVzdWx0LCAoa2V5LCB2YWx1ZSkgPT4ge1xuXHRcdFx0aWYgKHZhbHVlKSB7XG5cdFx0XHRcdG9wdGlvbnNba2V5XSA9ICcxJztcblx0XHRcdH1cblx0XHR9KTtcblx0XHRpZiAoT2JqZWN0LmVudHJpZXMob3B0aW9ucykubGVuZ3RoID09PSAwKSB7XG5cdFx0XHRyZXN0b3JlV29ya2VyLiRzdWJtaXRCdXR0b24uYWRkQ2xhc3MoJ2Rpc2FibGVkJyk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdHJlc3RvcmVXb3JrZXIuJHN1Ym1pdEJ1dHRvbi5yZW1vdmVDbGFzcygnZGlzYWJsZWQnKTtcblx0XHR9XG5cdH0sXG59OyJdfQ==