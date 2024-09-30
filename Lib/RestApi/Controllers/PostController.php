<?php
/*
 * MikoPBX - free phone system for small business
 * Copyright © 2017-2024 Alexey Portnov and Nikolay Beketov
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation; either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program.
 * If not, see <https://www.gnu.org/licenses/>.
 */

namespace Modules\ModuleBackup\Lib\RestApi\Controllers;

use MikoPBX\PBXCoreREST\Controllers\BaseController;
use MikoPBX\PBXCoreREST\Lib\PbxExtensionsProcessor;
use JsonException;

/**
 * @RoutePrefix("/pbxcore/api/modules/ModuleBackup")
 *
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
     /**
      * @param string $actionName The name of the action.
      *
      * @Post("/start")
      * @Post("/stop")
      * @Post("/upload")
      * @Post("/recover")
      */
    public function callAction(string $actionName)
    {
        try {
            $row_data = $this->request->getRawBody();
            $data     = json_decode($row_data, true, 512, JSON_THROW_ON_ERROR);
            $this->sendRequestToBackendWorker(PbxExtensionsProcessor::class, $actionName, $data, 'ModuleBackup');
        } catch (JsonException $e) {
            $this->sendError(400, 'Request has bad JSON');
            return;
        }
    }

}