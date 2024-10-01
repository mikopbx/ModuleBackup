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

namespace Modules\ModuleBackup\Setup;

use MikoPBX\Common\Models\PbxSettings;
use MikoPBX\Modules\Setup\PbxExtensionSetupBase;
use Modules\ModuleBackup\Lib\MikoPBXVersion;

class PbxExtensionSetup extends PbxExtensionSetupBase
{
    /**
     * Создает структуру для хранения настроек модуля в своей модели
     * и заполняет настройки по-умолчанию если таблицы не было в системе
     * см (unInstallDB)
     *
     * Регистрирует модуль в PbxExtensionModules
     *
     * @return bool результат установки
     */
    public function installDB(): bool
    {
        $result = $this->createSettingsTableByModelsAnnotations();

        // Регаем модуль в PBXExtensionsModules
        if ($result) {
            $result = $this->registerNewModule();
        }

        // Добавим иконку в левое меню
        if ($result) {
            $result = $this->addToSidebar();
        }

        return $result;
    }


    /**
     * Добавляет модуль в боковое меню
     *
     * @return bool
     */
    public function addToSidebar(): bool
    {
        $menuSettingsKey           = "AdditionalMenuItem{$this->moduleUniqueID}";
        $textClass = MikoPBXVersion::getTextClass();
        $unCamelizedControllerName = $textClass::uncamelize($this->moduleUniqueID, '-');
        $menuSettings              = PbxSettings::findFirstByKey($menuSettingsKey);
        if ($menuSettings === null) {
            $menuSettings      = new PbxSettings();
            $menuSettings->key = $menuSettingsKey;
        }
        $value               = [
            'uniqid'        => $this->moduleUniqueID,
            'href'          => "/admin-cabinet/{$unCamelizedControllerName}",
            'group'         => 'maintenance',
            'iconClass'     => 'history',
            'caption'       => "Breadcrumb{$this->moduleUniqueID}",
            'showAtSidebar' => true,
        ];
        $menuSettings->value = json_encode($value);

        return $menuSettings->save();
    }
}