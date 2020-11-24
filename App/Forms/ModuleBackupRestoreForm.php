<?php
/**
 * Copyright (C) MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Nikolay Beketov, 10 2019
 *
 */

namespace Modules\ModuleBackup\App\Forms;

use Phalcon\Forms\Element\File;
use Phalcon\Forms\Form;


class ModuleBackupRestoreForm extends Form
{

    public function initialize($entity = null, $options = null)
    {
        $this->add(new File('restore-file'));
    }
}