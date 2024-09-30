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

namespace Modules\ModuleBackup\Lib;

use MikoPBX\Common\Handlers\CriticalErrorsHandler;
use MikoPBX\Core\System\{Processes, Util};
use MikoPBX\Core\Workers\WorkerBase;
use Modules\ModuleBackup\Models\BackupRules;

require_once 'Globals.php';

class WorkerBackup extends WorkerBase
{
    public function start($argv): void
    {
        if (count($argv) < 3) {
            return;
        }

        $id = trim($argv[1]);
        if (empty($id)) {
            return;
        }
        Util::mwMkdir(Backup::getBackupDir(), true);

        if ('none' !== $id) {
            $b = new Backup($id);
            $b->createArchive();
        } elseif (count($argv) === 4) {
            $PID = Processes::getPidOfProcess("{$argv[1]} {$argv[2]} {$argv[3]}", '' . getmypid() . ' ');
            if (!empty($PID)) {
                return;
            }
            // Другого процесса с аналогичными установками не запущено.
            $res = BackupRules::findFirstById($argv[3]);
            if ($res && Util::isJson($res->what_backup)) {
                $resultMount  = Backup::checkStorageFtp($res->id);
                if (!$resultMount->success) {
                    Util::sysLogMsg('Backup', 'Failed to mount backup disk...', LOG_ERR);
                    return;
                }
                $backup_dir   = Backup::getMountPath($res);
                // Удаляем старые резервные копии, если необходимо.
                if ($res->keep_older_versions > 0) {
                    $out      = [];
                    $findPath = Util::which('find');
                    $sortPath = Util::which('sort');
                    $rmPath   = Util::which('rm');
                    Processes::mwExec("{$findPath} {$backup_dir} -mindepth 1 -maxdepth 1 -type d  | {$sortPath}", $out);
                    if (count($out) >= $res->keep_older_versions) {
                        $count_dir = count($out) - $res->keep_older_versions;
                        while ($count_dir >= 0){
                            Processes::mwExec("{$rmPath} -rf {$out[$count_dir]}");
                            $count_dir--;
                        }
                    }
                }
                // Запускаем резервное копирование.
                $id                = 'backup_' . time();
                $options           = json_decode($res->what_backup, true);
                $options['backup'] = $backup_dir;
                if ($res->ftp_sftp_mode !== '1' && $res->ftp_sftp_mode !== '3') {
                    $options['type'] = 'zip';
                }
                $b = new Backup($id, $options);
                $b->createArchive();
            }
        }
    }

}

// Start worker process
$workerClassname = WorkerBackup::class;
if (isset($argv) && count($argv) > 1) {
    cli_set_process_title("$workerClassname $argv[1] $argv[2]");
    try {
        $worker = new $workerClassname();
        $worker->start($argv);
    } catch (\Throwable $e) {
        CriticalErrorsHandler::handleExceptionWithSyslog($e);
    }
}


