<?php

namespace Modules\ModuleBackup\Lib\RestApi\Controllers;

use MikoPBX\Core\System\Util;
use MikoPBX\PBXCoreREST\Controllers\BaseController;
use Modules\ModuleBackup\Lib\Backup;
use Phalcon\Di;

/**
 * /api/backup/{name} GET Резервное копирование.
 *
 * Получить список доступных резервных копий.
 *   curl http://127.0.0.1/pbxcore/api/modules/ModuleBackup/list;
 * Скачать файл лога.
 *   curl http://172.16.156.212/pbxcore/api/modules/ModuleBackup/download?id=backup_1530715058
 * Удалить резервную копию
 *   curl http://127.0.0.1/pbxcore/api/modules/ModuleBackup/remove?id=backup_1564399526
 * Старт резервного копирования по расписанию вручную.
 *   curl http://127.0.0.1/pbxcore/api/modules/ModuleBackup/startScheduled
 * Получить пердполагаемый размер резервной копии
 *   curl http://172.16.156.212/pbxcore/api/modules/ModuleBackup/getEstimatedSize
 *
 * Восстановить из резервной копии.
 *  curl http://172.16.156.212/pbxcore/api/modules/ModuleBackup/recover?id=backup_1531123800
 * Проверить соединение с FTP / SFTP хранилищем.
 *  curl http://172.16.156.212/pbxcore/api/modules/ModuleBackup/checkStorageFtp?id=1
 */
class GetController extends BaseController
{
    public function callAction($actionName): void
    {
        $this->sendRequestToBackendWorker('modules', $actionName, $_REQUEST, 'ModuleBackup');
    }

}