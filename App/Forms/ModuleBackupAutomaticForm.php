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

namespace Modules\ModuleBackup\App\Forms;

use Phalcon\Forms\Element\Check;
use Phalcon\Forms\Element\Hidden;
use Phalcon\Forms\Element\Numeric;
use Phalcon\Forms\Element\Password;
use Phalcon\Forms\Element\Select;
use Phalcon\Forms\Element\Text;
use Phalcon\Forms\Form;

class ModuleBackupAutomaticForm extends Form
{
    public function initialize($entity = null, $options = null)
    {
        foreach ($entity as $key => $value) {
            switch ($key) {
                case 'id':
                case '***ALL HIDDEN ABOVE***':
                    $this->add(new Hidden($key));
                    break;
                case 'ftp_secret':
                    $this->add(new Password($key));
                    break;
                case 'keep_older_versions':
                case 'ftp_port':
                case '***ALL INTEGER ABOVE***':
                    $this->add(new Numeric($key));
                    break;
                case 'every':
                    $action = new Select(
                        $key,
                        $options['week-days'],
                        [
                        'using'    => [
                            'id',
                            'name',
                        ],
                        'useEmpty' => false,
                        'value'    => empty($entity->$key) ? 0 : $value,
                        'class'    => 'ui selection dropdown',
                        ]
                    );
                    $this->add($action);
                    break;
                case 'ftp_sftp_mode':
                    $arrConnType = [
                        '1' => $this->translation->_('bkp_SFTPMode'),
                        '3' => $this->translation->_('bkp_WebDavMode'),
                    ];
                    $library = new Select(
                        $key,
                        $arrConnType,
                        [
                                        'using'    => [
                                            'id',
                                            'name',
                                        ],
                                        'useEmpty' => false,
                                        'value'    => $entity->$key,
                                        'class'    => 'ui selection dropdown library-type-select',
                                    ]
                    );
                    $this->add($library);
                    break;
                case 'enabled':
                    $this->addCheckBox($key, intval($entity->$key) === 1);
                    break;
                default:
                    $this->add(new Text($key));
            }
        }
    }

    /**
     * Adds a checkbox to the form field with the given name.
     * Can be deleted if the module depends on MikoPBX later than 2024.3.0
     *
     * @param string $fieldName The name of the form field.
     * @param bool $checked Indicates whether the checkbox is checked by default.
     * @param string $checkedValue The value assigned to the checkbox when it is checked.
     * @return void
     */
    public function addCheckBox(string $fieldName, bool $checked, string $checkedValue = 'on'): void
    {
        $checkAr = ['value' => null];
        if ($checked) {
            $checkAr = ['checked' => $checkedValue,'value' => $checkedValue];
        }
        $this->add(new Check($fieldName, $checkAr));
    }
}
