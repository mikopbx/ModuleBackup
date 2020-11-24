<?php
/**
 * Copyright © MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Alexey Portnov, 2 2020
 */

namespace Modules\ModuleBackup\Lib;

use MikoPBX\Core\System\Util;
use MikoPBX\Core\Workers\WorkerBase;

require_once 'Globals.php';

class WorkerRecover extends WorkerBase
{
    public function start($argv): void
    {
        $id = trim($argv[1]);
        if (empty($id)) {
            exit;
        }
        $b = new Backup($id);
        $b->recoverWithProgress();
    }

}

// Start worker process
$workerClassname = WorkerRecover::class;
if (isset($argv) && count($argv) > 1) {
    cli_set_process_title($workerClassname);
    try {
        $worker = new $workerClassname();
        $worker->start($argv);
    } catch (\Throwable $e) {
        global $errorLogger;
        $errorLogger->captureException($e);
        Util::sysLogMsg("{$workerClassname}_EXCEPTION", $e->getMessage());
    }
}