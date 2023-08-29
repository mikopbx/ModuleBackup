<?php
/*
 * MikoPBX - free phone system for small business
 * Copyright © 2017-2023 Alexey Portnov and Nikolay Beketov
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

/**
 * @RoutePrefix("/pbxcore/api/modules/ModuleBackup")
 *
 * GET Резервное копирование.
 *
 * Получить список доступных резервных копий.
 *   curl http://127.0.0.1/pbxcore/api/modules/ModuleBackup/list;
 * Скачать файл лога.
 *   curl http://172.16.156.212/pbxcore/api/modules/ModuleBackup/download?id=backup_1530715058
 * Удалить резервную копию
 *   curl http://127.0.0.1/pbxcore/api/modules/ModuleBackup/remove?id=backup_1564399526
 * Старт резервного копирования по расписанию вручную.
 *   curl http://127.0.0.1/pbxcore/api/modules/ModuleBackup/startScheduled
 * Получить предполагаемый размер резервной копии
 *   curl http://172.16.156.212/pbxcore/api/modules/ModuleBackup/getEstimatedSize
 *
 * Восстановить из резервной копии.
 *  curl http://172.16.156.212/pbxcore/api/modules/ModuleBackup/recover?id=backup_1531123800
 * Проверить соединение с FTP / SFTP хранилищем.
 *  curl http://172.16.156.212/pbxcore/api/modules/ModuleBackup/checkStorageFtp?id=1
 */
class GetController extends BaseController
{
    /**
     * @Get("/list")
     * @Get("/download")
     * @Get("/remove")
     * @Get("/startScheduled")
     * @Get("/getEstimatedSize")
     * @Get("/recover")
     * @Get("/checkStorageFtp")
     *
     * @param string $actionName The name of the action.
     * @return void
     */
    public function callAction(string $actionName): void
    {
        $this->sendRequestToBackendWorker(PbxExtensionsProcessor::class, $actionName, $_REQUEST, 'ModuleBackup');
    }

}