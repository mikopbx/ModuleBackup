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

//CREATE TABLE m_ModuleBackup (
//     id INTEGER PRIMARY KEY AUTOINCREMENT,
//     enabled  INTEGER,
//     every  INTEGER,
//     at_time    TEXT,
//     keep_older_versions INTEGER,
//     ftp_host  TEXT,
//     ftp_port  INTEGER,
//     ftp_username  TEXT,
//     ftp_secret  TEXT,
//     ftp_path  TEXT,
//     ftp_sftp_mode  INTEGER,
//     what_backup   TEXT
// );

//TODO::Не забыть перезапустить CRON после изменения расписания
//  // case BackupRules::class: //TODO:: Перенести в модуль
//             //     $this->modified_tables[self::R_CRON] = true;
//             //     break;


namespace Modules\ModuleBackup\Models;

use MikoPBX\Modules\Models\ModulesModelsBase;

class BackupRules extends ModulesModelsBase
{


    /**
     * @Primary
     * @Identity
     * @Column(type="integer", nullable=false)
     */
    public $id;

    /**
     * Если 1 то правило активное и можно делать бекпы по расписанию
     *
     * @Column(type="integer", nullable=true)
     */
    public $enabled;

    /**
     * Если 0 то ежедневно, иначе по номеру дня недели с 1 до 7
     *
     * @Column(type="integer", nullable=true)
     */
    public $every;

    /**
     * Время создания бекапа
     *
     * @Column(type="string", nullable=true)
     */
    public $at_time;

    /**
     * Количество хранимых версий
     *
     * @Column(type="integer", nullable=true)
     */
    public $keep_older_versions;

    /**
     * Адрес ftp/sftp сервера для хранения бекапа
     *
     * @Column(type="string", nullable=true)
     */
    public $ftp_host;

    /**
     * Порт ftp/sftp сервера 21 или 22
     *
     * @Column(type="integer", nullable=true)
     */
    public $ftp_port;

    /**
     * Логин ftp/sftp
     *
     * @Column(type="string", nullable=true)
     */
    public $ftp_username;

    /**
     * Пароль ftp/sftp
     *
     * @Column(type="string", nullable=true)
     */
    public $ftp_secret;

    /**
     * Путь ftp/sftp
     *
     * @Column(type="string", nullable=true)
     */
    public $ftp_path;

    /**
     * Если 1 то SFTP если 0 то FTP
     *
     * @Column(type="string", nullable=true)
     */
    public $ftp_sftp_mode;

    /**
     * JSON структура с информацией о том что надо сохранять
     *
     * @Column(type="string", nullable=true)
     */
    public $what_backup;


    public function initialize(): void
    {
        $this->setSource('m_ModuleBackup');
        parent::initialize();
    }

}