<?php
/**
 * Copyright © MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Alexey Portnov, 11 2018
 */

namespace Modules\ModuleBackup\App\Controllers;


use MikoPBX\AdminCabinet\Controllers\BaseController;
use MikoPBX\Modules\PbxExtensionUtils;
use Modules\ModuleBackup\App\Forms\ModuleBackupAutomaticForm;
use Modules\ModuleBackup\App\Forms\ModuleBackupCreateForm;
use Modules\ModuleBackup\App\Forms\ModuleBackupRestoreForm;
use Modules\ModuleBackup\Models\BackupRules as ModuleBackupModel;


class ModuleBackupController extends BaseController
{
    private $whatBackupTpl;
    private $moduleUniqueID =  'ModuleBackup';
    private $moduleDir;

    public function initialize(): void
    {
        $this->moduleDir           = PbxExtensionUtils::getModuleDir($this->moduleUniqueID);
        $this->view->logoImagePath = "{$this->url->get()}assets/img/cache/{$this->moduleUniqueID}/logo.png";
        $this->view->submitMode    = null;
        $this->whatBackupTpl = [
            'backup-config'      => '1',
            'backup-cdr'         => '1',
            'backup-records'     => '1',
            'backup-sound-files' => '1',
        ];
        parent::initialize();

    }


    /**
     * Список доступных для скачивания бекапов
     *
     */
    public function indexAction(): void
    {
        $semanticCollectionCSS = $this->assets->collection('SemanticUICSS');
        $semanticCollectionCSS->addCss('css/vendor/semantic/progress.min.css', true);

        $headerCollectionCSS = $this->assets->collection('headerCSS');
        $headerCollectionCSS->addCss("css/cache/{$this->moduleUniqueID}/module-backup.css", true);

        $semanticCollectionJS = $this->assets->collection('SemanticUIJS');
        $semanticCollectionJS->addJs('js/vendor/semantic/progress.min.js', true);

        $footerCollection = $this->assets->collection('footerJS');
        $footerCollection->addJs('js/vendor/resumable.js', true);
        $footerCollection->addJs('js/pbx/main/form.js', true);
        $footerCollection->addJs("js/cache/{$this->moduleUniqueID}/backup-api.js", true);
        $footerCollection->addJs("js/cache/{$this->moduleUniqueID}/backup-index-worker.js", true);
        $footerCollection->addJs("js/cache/{$this->moduleUniqueID}/backup-index.js", true);


        $this->view->pick("{$this->moduleDir}/App/Views/index");

        // Очистим кеш хранилища для получения актульной информации о свободном месте
        $this->session->remove('checkStorage');
    }

    /**
     * Форма мгновенного создания бекапа
     *
     */
    public function createAction(): void
    {
        $semanticCollectionCSS = $this->assets->collection('SemanticUICSS');
        $semanticCollectionCSS->addCss('css/vendor/semantic/progress.min.css', true);

        $semanticCollectionJS = $this->assets->collection('SemanticUIJS');
        $semanticCollectionJS->addJs('js/vendor/semantic/progress.min.js', true);

        $footerCollectionJS = $this->assets->collection('footerJS');
        $footerCollectionJS->addJs('js/pbx/main/form.js', true);
        $footerCollectionJS->addJs("js/cache/{$this->moduleUniqueID}/backup-api.js", true);
        $footerCollectionJS->addJs("js/cache/{$this->moduleUniqueID}/backup-create-worker.js", true);
        $footerCollectionJS->addJs("js/cache/{$this->moduleUniqueID}/backup-create.js", true);


        $whatBackup             = $this->whatBackupTpl;
        $this->view->form       = new ModuleBackupCreateForm(null, $whatBackup);
        $this->view->whatBackup = $whatBackup;
        $this->view->submitMode = null;
        $this->view->pick("{$this->moduleDir}/App/Views/create");
    }

    /**
     * Форма восстановления из бекапа
     *
     */
    public function restoreAction(): void
    {
        $semanticCollectionCSS = $this->assets->collection('SemanticUICSS');
        $semanticCollectionCSS->addCss('css/vendor/semantic/progress.min.css', true);
        $semanticCollectionCSS->addCss('css/vendor/semantic/modal.min.css', true);

        $semanticCollectionJS = $this->assets->collection('SemanticUIJS');
        $semanticCollectionJS->addJs('js/vendor/semantic/progress.min.js', true);
        $semanticCollectionJS->addJs('js/vendor/semantic/modal.min.js', true);

        $footerCollectionJS = $this->assets->collection('footerJS');
        $footerCollectionJS->addJs('js/pbx/main/form.js', true);
        $footerCollectionJS->addJs("js/cache/{$this->moduleUniqueID}/backup-api.js", true);
        $footerCollectionJS->addJs("js/cache/{$this->moduleUniqueID}/backup-restore-worker.js", true);
        $footerCollectionJS->addJs("js/cache/{$this->moduleUniqueID}/backup-restore.js", true);

        $this->view->form       = new ModuleBackupRestoreForm();
        $this->view->submitMode = null;
        $this->view->pick("{$this->moduleDir}/App/Views/restore");
    }

    /**
     * Форма настройки автоматического бекапа
     *
     */
    public function automaticAction(): void
    {
        $semanticCollectionCSS = $this->assets->collection('SemanticUICSS');
        $semanticCollectionCSS->addCss('css/vendor/semantic/calendar.min.css', true);

        $semanticCollectionJS = $this->assets->collection('SemanticUIJS');
        $semanticCollectionJS->addJs('js/vendor/semantic/calendar.min.js', true);

        $footerCollectionJS = $this->assets->collection('footerJS');
        $footerCollectionJS->addJs('js/pbx/main/form.js', true);
        $footerCollectionJS->addJs("js/cache/{$this->moduleUniqueID}/backup-api.js", true);
        $footerCollectionJS->addJs("js/cache/{$this->moduleUniqueID}/backup-automatic.js", true);

        $entity = ModuleBackupModel::findFirst();
        if ($entity === null) {
            $entity                      = new ModuleBackupModel();
            $entity->what_backup         = json_encode($this->whatBackupTpl);
            $entity->at_time             = '0:00';
            $entity->keep_older_versions = 3;
        }

        $weekDays = ['0' => $this->translation->_('bkp_EveryDay')];
        for ($i = '1'; $i <= 7; $i++) {
            $weekDays[$i] = $this->translation->_(
                date(
                    'D',
                    strtotime("Sunday +{$i} days")
                )
            );
        }
        $this->view->form = new ModuleBackupAutomaticForm(
            $entity,
            ['week-days' => $weekDays]
        );
        $whatBackup       = json_decode($entity->what_backup, true);
        foreach ($this->whatBackupTpl as $key => $value) {
            if ( ! array_key_exists($key, $whatBackup)) {
                $whatBackup[$key] = $value;
            }
        }
        $this->view->formbackup = new ModuleBackupCreateForm(null, $whatBackup);
        $this->view->whatBackup = $whatBackup;
        $this->view->submitMode = null;
        $this->view->pick("{$this->moduleDir}/App/Views/automatic");
    }

    /**
     * Удаление файла бекпапа
     *
     */
    public function deleteAction(): void
    {
    }

    /**
     * Скачивание бекапа через браузер
     *
     */
    public function downloadAction(): void
    {
    }

    /**
     * Сохранение настроек автоматического резервного копирования
     *
     */
    public function saveAction(): void
    {
        if ( ! $this->request->isPost()) {
            $this->forward('module-backup/automatic');
        }

        $data = $this->request->getPost();
        $rule = ModuleBackupModel::findFirst();
        if ($rule === null) {
            $rule = new ModuleBackupModel();
        }
        // Пройдемся по полям базы данных
        foreach ($rule as $name => $value) {
            switch ($name) {
                case 'id':
                case 'what_backup':
                    break;
                case 'enabled':
                    if (array_key_exists($name, $data)) {
                        $rule->$name = ($data[$name] === 'on') ? 1 : 0;
                    } else {
                        $rule->$name = 0;
                    }
                    break;
                default:
                    $rule->$name = $data[$name];
            }
        }
        // Пройдемся по чекбоксам того что нужно сохранять и сформируем JSON
        $what_backup = [];
        foreach ($data as $name => $value) {
            if (strpos($name, 'backup-') === 0) {
                $what_backup[$name] = ($data[$name] == 'on') ? '1' : '0';
            }
        }
        $rule->what_backup = json_encode($what_backup);
        if ( ! $rule->save()) {
            $errors = $rule->getMessages();
            $this->flash->error(implode('<br>', $errors));
        }
    }
}


