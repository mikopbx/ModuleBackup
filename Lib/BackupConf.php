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

use MikoPBX\Core\System\System;
use MikoPBX\Modules\Config\ConfigClass;
use MikoPBX\Core\System\Util;
use MikoPBX\PBXCoreREST\Lib\PBXApiResult;
use Modules\ModuleBackup\Lib\RestApi\Controllers\GetController;
use Modules\ModuleBackup\Lib\RestApi\Controllers\PostController;
use Modules\ModuleBackup\Models\BackupRules;

class BackupConf extends ConfigClass
{

    /**
     * @param array $tasks
     */
    public function createCronTasks(array &$tasks): void
    {
        $cron_user = $this->getCronUser();
        $commands = BackupRules::find('enabled="1"');
        foreach ($commands as $cmd) {
            $time = $this->getExecutionTime($cmd);
            if ($time === '') {
                // Не корректно описано расписание.
                continue;
            }
            $workerPath     = Util::getFilePathByClassName(WorkerBackup::class);
            $nohupPath      = Util::which('nohup');
            $phpPath        = Util::which('php');
            $command        = "{$nohupPath} {$phpPath} -f {$workerPath} ";
            $params         = "none backup {$cmd->id}";

            $tasks[] = "{$time} {$cron_user}{$command} {$params} > /dev/null 2>&1 &\n";
        }
    }

    /**
     * Returns array of additional routes for PBXCoreREST interface from module
     *
     * @return array
     */
    public function getPBXCoreRESTAdditionalRoutes(): array
    {
        return [
            [GetController::class, 'callAction', '/pbxcore/api/modules/ModuleBackup/{actionName}', 'get', '/'],
            [PostController::class, 'callAction', '/pbxcore/api/modules/ModuleBackup/{actionName}', 'post', '/'],
        ];
    }

    /**
     * RestAPI processor
     *
     * @param PBXApiResult $request
     */
    public function moduleRestAPICallback($request): PBXApiResult
    {
        clearstatcache();
        $res = new PBXApiResult();
        $res->processor = __METHOD__;
        $action = $request['action'];
        $data   = $request['data'];

        if ('list' === $action) {
            $res = Backup::listBackups();
        } elseif ('startScheduled' === $action) {
            $res = Backup::startScheduled();
        } elseif ('start' === $action) {
            $res = Backup::start($data);
        } elseif ('stop' === $action) {
            $res = Backup::stop($data['id']);
        } elseif ('remove' === $action) {
            $res = Backup::remove($data['id']);
        } elseif ('checkStorageFtp' === $action) {
            $res = Backup::checkStorageFtp($data['id']);
        } elseif ('download' === $action) {
            $res = Backup::download($data['id']);
        } elseif ('unpackUploadedImgConf' === $action) {
            $res = Backup::unpackUploadedImgConf($data);
        } elseif ('convertConfig' === $action) {
            $res = Backup::convertConfig($data['config_file']);
        } elseif ('getEstimatedSize' === $action) {
            $res = Backup::getEstimatedSize();
        } elseif ('statusUpload' === $action) {
            $res = Backup::statusUpload($data['id']);
        } elseif ('recover' === $action) {
            $options = $data['options'] ?? null;
            $res  = Backup::startRecover($data['id'], $options);
        }

        $res->function = $action;

        return $res;
    }

    /**
     * Обработчик события изменения данных в базе настроек mikopbx.db.
     *
     * @param mixed $data
     */
    public function modelsEventChangeData($data): void
    {
        if ($data['model'] === BackupRules::class) {
            System::invokeActions(['cron' => 0]);
        }
    }

    /**
     * Возвращает время выполнения операции для Cron.
     * @param BackupRules $cmd
     * @return string
     */
    private function getExecutionTime(BackupRules $cmd): string{
        $every = (string)$cmd->every;
        $day = ('0' === $every) ? '*' : $every;
        $arr_time = explode(':', $cmd->at_time);
        if (count($arr_time) !== 2) {
            $h = '*';
            $m = '*';
        } else {
            [$h, $m] = $arr_time;
            $m = (strpos($m, '0') === 0) ? $m[1] : $m;
        }
        if ('*' === $h && '*' === $m && '*' === $day) {
            // Не корректно описано расписание.
            $time = '';
        } else {
            $time = "{$m} {$h} * * {$day}";
        }
        return $time;
    }

    /**
     * Возвращает пользователя Cron.
     * @return string
     */
    private function getCronUser(): string{
        if (Util::isSystemctl()) {
            $cron_user = 'root ';
        } else {
            $cron_user = '';
        }
        return $cron_user;
    }

}