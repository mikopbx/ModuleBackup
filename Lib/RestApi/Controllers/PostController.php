<?php
/**
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 4 2020
 *
 */

namespace Modules\ModuleBackup\Lib\RestApi\Controllers;

use MikoPBX\Core\System\Util;
use MikoPBX\PBXCoreREST\Controllers\BaseController;
use Modules\ModuleBackup\Lib\Backup;
use Phalcon\Di;
use JsonException;

/**
 * POST Начать резервное копирование.
 *   curl -X POST -d '{"backup-config":"1","backup-records":"1","backup-cdr":"1","backup-sound-files":"1"}'
 *   http://172.16.156.212/pbxcore/api/backup/start; Продолжить выполнение резервного копирования: curl -X POST -d
 *   '{"id":"backup_1531123800"}' http://172.16.156.212/pbxcore/api/modules/ModuleBackup/start; Приостановить процесс
 *   curl -X POST -d
 *   '{"id":"backup_1531123800"}' http://172.16.156.212/pbxcore/api/modules/ModuleBackup/stop; Загрузка файла на АТС.
 *   curl -F
 *   "file=@backup_1531474060.zip" http://172.16.156.212/pbxcore/api/modules/ModuleBackup/upload; Конвертация старого
 *   конфига.
 *
 *
 * Восстановить из резервной копии.
 *  curl -X POST -d '{"id": "backup_1534838222",
 *  "options":{"backup-config":"1","backup-records":"1","backup-cdr":"1","backup-sound-files":"1"}}'
 *  http://172.16.156.212/pbxcore/api/modules/ModuleBackup/recover; curl -X POST -d '{"id": "backup_1534838222",
 *  "options":{"backup-sound-files":"1"}}' http://172.16.156.212/pbxcore/api/modules/ModuleBackup/recover;
 */
class PostController extends BaseController
{
    public function callAction($actionName)
    {
        try {
            $row_data = $this->request->getRawBody();
            $data     = json_decode($row_data, true, 512, JSON_THROW_ON_ERROR);
            $this->sendRequestToBackendWorker('modules', $actionName, $data, 'ModuleBackup');
        } catch (JsonException $e) {
            $this->sendError(400, 'Request has bad JSON');
            return;
        }
    }

}