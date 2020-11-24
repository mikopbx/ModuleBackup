<?php
/**
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 10 2019
 *
 */

namespace Modules\ModuleBackup\App\Forms;

use Phalcon\Forms\Element\Check;
use Phalcon\Forms\Form;


class ModuleBackupCreateForm extends Form
{

    public function initialize($entity = null, $options = null)
    {
        foreach ($options as $name => $value) {
            $cheskarr = ['value' => null];
            if ($value) {
                $cheskarr = ['checked' => 'checked', 'value' => null];
            }
            $this->add(new Check($name, $cheskarr));
        }
    }
}