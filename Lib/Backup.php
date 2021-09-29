<?php
/*
 * Copyright © MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Alexey Portnov, 9 2020
 */

namespace Modules\ModuleBackup\Lib;

use Exception;
use MikoPBX\PBXCoreREST\Lib\PBXApiResult;
use MikoPBX\Core\System\{Processes, Storage, System, Util};
use MikoPBX\Modules\PbxExtensionBase;
use Modules\ModuleBackup\Models\BackupRules;
use Phalcon\Di;

class Backup extends PbxExtensionBase
{
    private $id;
    private array $dirs;
    private array $dirs_mem;
    private string $file_list;
    private string $errorFile;
    private string $result_file;
    private string $result_dir;
    private string $progress_file;
    private string $progress_file_recover;
    private string $config_file;
    private array $options;
    private string $options_recover_file;
    private int $progress = 0;
    private string $type = 'img'; // img | zip

    public function __construct($id, $options = null)
    {
        parent::__construct();
        $this->dirs     = [
            'backup'           => self::getBackupDir(),
            'custom_modules'   => $this->config->path('core.modulesDir'),
            'media'            => $this->config->path('asterisk.mediadir'),
            'astspooldir'      => $this->config->path('asterisk.astspooldir'),
            'settings_db_path' => $this->config->path('database.dbfile'),
            'cdr_db_path'      => $this->config->path('cdrDatabase.dbfile'),
            'tmp'              => $this->config->path('core.tempDir'),
        ];

        $this->dirs_mem = self::getAsteriskDirsMem();
        // Проверим особенность бекапа на сетевой диск.
        $duPath      = Util::which('du');
        $busyboxPath = Util::which('busybox');
        $awkPath     = Util::which('awk');

        Processes::mwExec(
            "{$duPath} /storage/*/{$id}/flist.txt -d 0 2> /dev/null | {$busyboxPath} {$awkPath} '{print $2}'",
            $out
        );
        if (($out[0] ?? false) && file_exists($out[0])) {
            $this->dirs['backup'] = dirname($out[0], 2);
        } elseif (is_array($options) && isset($options['backup'])) {
            // Переопределяем каталог с бекапом.
            $this->dirs['backup'] = $options['backup'];
        }
        $this->id = $id;
        $b_dir    = "{$this->dirs['backup']}/{$this->id}";
        Util::mwMkdir($b_dir);

        if (isset($options['type'])) {
            $this->type = $options['type'];
        }
        if (file_exists("{$this->dirs['backup']}/{$this->id}/resultfile.zip")) {
            $this->type = 'zip';
        }

        $this->file_list             = "{$this->dirs['backup']}/{$this->id}/flist.txt";
        $this->result_file           = "{$this->dirs['backup']}/{$this->id}/resultfile.{$this->type}";
        $this->result_dir            = "{$this->dirs['backup']}/{$this->id}/mnt_point";
        $this->progress_file         = "{$this->dirs['backup']}/{$this->id}/progress.txt";
        $this->errorFile             = "{$this->dirs['backup']}/{$this->id}/error.txt";
        $this->config_file           = "{$this->dirs['backup']}/{$this->id}/config.json";
        $this->options_recover_file  = "{$this->dirs['backup']}/{$this->id}/options_recover.json";
        $this->progress_file_recover = "{$this->dirs['backup']}/{$this->id}/progress_recover.txt";

        if (( ! is_array($options) || $options === null) && file_exists($this->config_file)) {
            $this->options = json_decode(file_get_contents($this->config_file), true);
        } else {
            $this->options = $options;
        }

        if ( ! is_array($this->options) || $this->options === null) {
            $this->options = [
                'backup-config'      => '1',
                'backup-records'     => '1',
                'backup-cdr'         => '1',
                'backup-sound-files' => '1',
            ];
        }
        if ( ! file_exists($this->config_file) && false === @file_put_contents(
                $this->config_file,
                json_encode($this->options),
                JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES
            )) {
            Util::sysLogMsg('Backup', 'Failed create file ' . $this->config_file);
        }
    }

    /**
     * Возвращает массив с путями к системным директориям на диске
     *
     * @return array
     */
    public static function getAsteriskDirsMem(): array
    {
        $path2dirs                   = [];
        $path2dirs['dbpath']         = '/etc/asterisk/db'; // Замена на $dirsConfig->path('astDatabase.dbfile')
        $path2dirs['astlogpath']     = '/var/asterisk/log'; // Замена на $dirsConfig->path('asterisk.astlogdir')
        $path2dirs['media']          = '/var/asterisk/spool/media';
        $path2dirs['astspooldir']    = '/var/asterisk/spool'; // Замена на $dirsConfig->path('asterisk.astspooldir')
        $path2dirs['backup']         = '/var/asterisk/backup';
        $path2dirs['tmp']            = '/ultmp';
        $path2dirs['custom_modules'] = '/var/asterisk/custom_modules';
        $path2dirs['datapath']       = '/var/asterisk'; // Замена на $dirsConfig->path('asterisk.astvarlibdir')
        $path2dirs['php_session']    = '/var/tmp/php';
        $path2dirs['cache_js_dir']   = '/var/cache/www/cache_js_dir';
        $path2dirs['cache_css_dir']  = '/var/cache/www/cache_css_dir';
        $path2dirs['cache_img_dir']  = '/var/cache/www/cache_img_dir';

        return $path2dirs;
    }

    /**
     * Распаковывает вспомогательные данные из архива резервной копии.
     *
     * @param array $data
     *
     * @return PBXApiResult
     */
    public static function unpackUploadedImgConf($data): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;

        if ( ! file_exists($data['temp_file'])) {
            $res->messages[] = "Backup file {$data['temp_file']} not found";
            return $res;
        }
        $backupDir         = self::getBackupDir();
        $di                = Di::getDefault();
        $uploadDir         = $di->getShared('config')->path('www.uploadDir');
        $data['dir_name']  = str_ireplace($uploadDir.'/', '', dirname($data['temp_file']));
        $data['dir_name']  = str_ireplace('img', '', $data['dir_name']);
        $data['extension'] = Util::getExtensionOfFile(basename($data['temp_file']));
        $data['res_file']  = $backupDir . '/' . $data['dir_name'].'/resultfile.'.$data['extension'];
        $data['mnt_point'] = $backupDir . '/' . $data['dir_name'] . '/mnt_point';
        Util::mwMkdir($data['mnt_point']);

        $mvPath = Util::which('mv');
        Processes::mwExec("{$mvPath} {$data['temp_file']} {$data['res_file']}");
        $res->data['id']        = $data['dir_name'];
        $res->success = true;
        if ($data['extension'] === 'img') {
            $mountPath = Util::which('mount');
            $resMwExec       = Processes::mwExec("{$mountPath} -o loop {$data['res_file']} {$data['mnt_point']}");
            if ($resMwExec !== 0) {
                $res->success = false;
                $message = "Fail mount {$data['res_file']}... on loop device...";
                $res->messages[]=$message;
                Util::sysLogMsg('Backup_unpack_conf_img', $message);
                return $res;
            }

            self::unpackImgBackup($res, $backupDir, $data);
        } elseif ($data['extension'] === 'zip') {
            self::unpackZipBackup($backupDir, $data);
        } elseif ($data['extension'] === 'xml'){
            $converter = new OldConfigConverter($data['res_file']);
            $converter->parse();
            $converter->makeConfig();
        }
        return $res;
    }

    public static function unpackImgBackup($res, $backupDir, $data):PBXApiResult
    {
        // Если бекап выполнялся в каталоге оперативной памяти:
        $path_b_dir = "{$data['mnt_point']}/var/asterisk/backup/{$data['dir_name']}";
        if ( ! file_exists($path_b_dir)) {
            // Бекап выполнялся на диск - хранилище
            $path_b_dir = "{$data['mnt_point']}/storage/usbdisk[1-9]/mikopbx/backup/{$data['dir_name']}";
        }
        $duPath      = Util::which('du');
        $busyboxPath = Util::which('busybox');
        $awkPath     = Util::which('awk');
        Processes::mwExec(
            "{$duPath} {$data['mnt_point']}/storage/*/{$data['dir_name']}/flist.txt -d 0 2> /dev/null | {$busyboxPath} {$awkPath} '{print $2}'",
            $out
        );
        if (($out[0] ?? false) && file_exists($out[0])) {
            // бекап выполнялся на сетевой диск.
            $path_b_dir = dirname($out[0]);
        }

        if ( ! file_exists($path_b_dir)) {
            Processes::mwExec(
                "{$duPath} {$data['mnt_point']}/storage/usbdisk[1-9]/mikopbx/backup/*/flist.txt -d 0 2> /dev/null | {$busyboxPath} {$awkPath} '{print $2}'",
                $out
            );
            if (($out[0] ?? false) && file_exists($out[0])) {
                // бекап выполнялся на сетевой диск.
                $path_b_dir = dirname($out[0]);
                $new_id     = basename($path_b_dir);
                if ($data['dir_name'] !== $new_id) {
                    $result['new_id'] = $new_id;
                }
            }
        }
        $cpPath = Util::which('cp');
        $resMwExec    = Processes::mwExec("{$cpPath} {$path_b_dir}/* {$backupDir}/{$data['dir_name']}");

        $umountPath = Util::which('umount');
        Processes::mwExec("{$umountPath} {$data['res_file']}");
        if (isset($res->data['new_id'])) {
            $mvPath           = Util::which('mv');
            $resMwExec              = Processes::mwExec(
                "{$mvPath} {$backupDir}/{$data['dir_name']} {$backupDir}/{$res->data['new_id']}"
            );
            $data['dir_name'] = $res->data['new_id'];
        }
        if ($resMwExec !== 0) {
            $res->success = false;
            $message = 'Fail mount cp data from loop device...';
            $res->messages[]=$message;
            Util::sysLogMsg('Backup_unpack_conf_img', $message);
        }

        if ( ! file_exists("{$backupDir}/{$data['dir_name']}/flist.txt") ||
            ! file_exists("{$backupDir}/{$data['dir_name']}/config.json")) {
            $res->success = false;
            $message = 'Broken backup file';
            $res->messages[]=$message;
            Util::sysLogMsg('Backup_unpack_conf_img', $message);
        }
        if (!$res->success) {
            unlink($data['res_file']);
        }

        return $res;
    }

    public static function unpackZipBackup($backupDir, $data):void
    {
        file_put_contents("{$backupDir}/{$data['dir_name']}/progress.txt", '0');

        self::staticExtractFile(
            $data['dir_name'],
            $data['res_file'],
            "{$backupDir}/{$data['dir_name']}/flist.txt"
        );
        self::staticExtractFile(
            $data['dir_name'],
            $data['res_file'],
            "{$backupDir}/{$data['dir_name']}/progress.txt"
        );
        self::staticExtractFile(
            $data['dir_name'],
            $data['res_file'],
            "{$backupDir}/{$data['dir_name']}/config.json"
        );    }

    /**
     * Возвращает полный путь к директории с резервными копиями.
     *
     * @return string
     */
    public static function getBackupDir(): string
    {
        $di = Di::getDefault();
        return $di->getShared('config')->path('core.mediaMountPoint').'/mikopbx/backup';
    }

    /**
     * Извлеч файл из архива.
     *
     * @param $id
     * @param $arh
     * @param $filename
     */
    public static function staticExtractFile($id, $arh, $filename): void
    {
        $umountPath  = Util::which('umount');
        $mountPath   = Util::which('mount');
        $cpPath      = Util::which('cp');
        $mvPath      = Util::which('mv');
        $duPath      = Util::which('du');
        $sevenZaPath = Util::which('7za');
        $grepPath    = Util::which('grep');
        $awkPath     = Util::which('awk');
        $busyboxPath = Util::which('busybox');

        $type = Util::getExtensionOfFile($arh);
        if ($type === 'img') {
            $result_dir = basename($arh) . '/mnt_point';
            if ( ! Storage::diskIsMounted($arh, '')) {
                Processes::mwExec("{$mountPath} -o loop {$arh} {$result_dir}");
            }
            Processes::mwExec("{$duPath} /storage/*/{$id} -d 0 2> /dev/null | {$busyboxPath} {$awkPath} '{print $2}'", $out);
            if (($out[0] ?? false) && file_exists($out[0])) {
                $src_file = $out[0];
            } else {
                $src_file = "{$result_dir}{$filename}";
            }
            Processes::mwExec("{$cpPath} '{$src_file}' '{$filename}'", $arr_out);
            Processes::mwExec("{$umountPath} $arh");
        } else {
            Processes::mwExec("{$sevenZaPath} e -y -r -spf {$arh} {$filename}");
            if ( ! file_exists($filename)) {
                $command_status = Processes::mwExec(
                    "{$sevenZaPath} l {$arh} | {$grepPath} '" . basename(
                        $filename
                    ) . "' | {$busyboxPath} {$awkPath} '{print $6}'",
                    $out
                );
                if ($command_status === 0) {
                    $path_to_file = implode('', $out);

                    $file_dir = dirname($path_to_file);
                    Util::mwMkdir($file_dir);
                    $file_dir = dirname($filename);
                    Util::mwMkdir($file_dir);
                    Processes::mwExec("{$sevenZaPath} e -y -r -spf {$arh} {$path_to_file}");
                    Processes::mwExec("{$mvPath} $path_to_file $filename");
                }
            }
        }
    }

    /**
     * Старт бекапа.
     *
     * @param array | null $options
     *
     * @return PBXApiResult
     */
    public static function start($options = null): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;
        $id     = 'backup_' . time();
        if ($options !== null) {
            if (isset($options['id'])) {
                $id = $options['id'];
            }
            // Инициализируем настройки резервного копирования.
            $b = new Backup($id, $options);
            unset($b);
        }
        $workerPath = Util::getFilePathByClassName(WorkerBackup::class);
        $phpPath    = Util::which('php');
        $command    = "{$phpPath} -f {$workerPath}";
        Processes::processWorker($command, "{$id} backup", 'WorkerBackup', 'start');
        usleep(2000000);
        $res->success = true;
        $res->data['id']   = $id;

        return $res;
    }

    /**
     * Старт бекапа.
     *
     * @param string $id
     * @param        $options
     *
     * @return PBXApiResult
     */
    public static function startRecover($id, $options = null): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;

        if (empty($id)) {
            $res->messages[]= 'ID is empty';
            return $res;
        }
        $b = new Backup($id);
        $b->saveOptionsRecoverFile($options);
        $workerPath = Util::getFilePathByClassName(WorkerRecover::class);
        $phpPath    = Util::which('php');
        $command    = "{$phpPath} -f {$workerPath}";
        Processes::processWorker($command, "$id recover", WorkerRecover::class, 'start');
        $res->success=true;
        $res->data[]   = $id;
        return $res;
    }

    /**
     * Сохраняем настройки восстановления.
     *
     * @param $options
     */
    public function saveOptionsRecoverFile($options): void
    {
        if ($options === null && file_exists($this->options_recover_file)) {
            // Удаляем ненужный файл настроек.
            unlink($this->options_recover_file);
        }

        if ($options !== null) {
            // Сохраняем настройки. Файл будет использоваться фоновым процессом.
            file_put_contents($this->options_recover_file, json_encode($options, JSON_UNESCAPED_SLASHES));
        }
    }

    /**
     * Приостановить резервное копирование.
     *
     * @param $id
     *
     * @return PBXApiResult
     */
    public static function stop($id): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;
        $workerPath = Util::getFilePathByClassName(WorkerBackup::class);
        $phpPath    = Util::which('php');
        $command    = "{$phpPath} -f {$workerPath}";
        Processes::processWorker($command, "{$id} backup", WorkerBackup::class, 'stop');
        $res->success = true;
        $res->data[]   = $id;
        return $res;
    }

    /**
     * Удаление резервной копии.
     *
     * @param $id
     *
     * @return PBXApiResult
     */
    public static function remove($id): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;
        if (empty($id)) {
            $res->messages[] = 'ID is empty';
            return $res;
        }
        $b_dir  = self::getBackupDir() . "/{$id}";
        $b_dirs = [];
        if (file_exists($b_dir)) {
            $b_dirs[] = $b_dir;
        }
        $list = self::listBackups()->data;
        foreach ($list as $backup_data) {
            if ($id === $backup_data['id'] && isset($backup_data['config']['backup'])) {
                $b_dir = $backup_data['config']['backup'] . "/{$id}";
                if (file_exists($b_dir)) {
                    $b_dirs[] = $b_dir;
                }
            }
        }

        $BackupRules = BackupRules::find('enabled="1"');
        foreach ($BackupRules as $res) {
            $b_dir = '/storage/' . $res->ftp_host . '.' . $res->ftp_port . "/{$id}";
            if (file_exists($b_dir)) {
                $b_dirs[] = $b_dir;
            }
        }

        if (empty($b_dirs)) {
            $res->messages[] = 'Backup file not found for id='.$id;
            return $res;
        }

        $ret = Processes::mwExec('rm -rf ' . implode(' ', $b_dirs));
        clearstatcache();
        $res->success = $ret === 0;

        return $res;
    }

    /**
     * Возвращает список доступных резервных копий.
     *
     * @param string $backup_dir
     *
     * @return PBXApiResult
     */
    public static function listBackups(string $backup_dir = ''): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;

        // Проверка каталогов FTP / SFTP бекапа:
        if (empty($backup_dir)) {
            self::listBackupsFtp($res->data);
        }

        if ( ! empty($backup_dir)) {
            $dirs['backup'] = $backup_dir;
        } else {
            $dirs['backup'] = self::getBackupDir();
        }

        if ( ! is_dir($dirs['backup'])) {
            $res->success = true;
            $res->data = [];
            $res->messages[]="Backup dir '{$dirs['backup']}' not exist";
            return $res;
        }

        $entries = scandir($dirs['backup']);
        foreach ($entries as $entry) {
            $base_filename = basename($entry);
            $pid              = self::getPID("{$base_filename} backup");
            $pid_recover      = self::getPID("{$base_filename} recover");
            if ($base_filename === '.' || $base_filename === '..') {
                continue;
            }
            $filename = "{$dirs['backup']}/{$base_filename}/resultfile.zip";
            if ( ! file_exists($filename)) {
                $filename = "{$dirs['backup']}/{$base_filename}/resultfile.img";
            }

            $file_progress = "{$dirs['backup']}/{$base_filename}/progress.txt";
            if (file_exists($file_progress)) {
                $size = 0;
                if (file_exists($filename)) {
                    $size = round(filesize($filename) / 1024 / 1024, 2); // размер в мегабайтах.
                }
                // Получим данные по прогрессу и количеству файлов.
                $file_data   = file_get_contents($file_progress);
                $data        = explode('/', $file_data);
                $progress    = (!empty($data) && is_numeric($data[0])) ? trim($data[0]) * 1 : 0;
                $total       = (count($data) > 1 && is_numeric($data[1])) ? trim($data[1]) * 1 : 0;
                $config_file = "{$dirs['backup']}/{$base_filename}/config.json";

                if (file_exists("{$dirs['backup']}/{$base_filename}/progress_recover.txt")) {
                    $file_data        = file_get_contents("{$dirs['backup']}/{$base_filename}/progress_recover.txt");
                    $data             = explode('/', $file_data);
                    $progress_recover = (!empty($data)) ? trim($data[0]) * 1 : 0;
                    if ($total === 0) {
                        $total = (count($data) > 1) ? trim($data[1]) * 1 : 0;
                    }
                } else {
                    $progress_recover = '';
                }

                $config = null;
                if (file_exists($config_file)) {
                    $config = json_decode(file_get_contents($config_file), true);
                }
                // Вычислим timestamp.
                $arr_fname        = explode('_', $base_filename);
                $data = [
                    'date'             => preg_replace("/[^0-9+]/", '', $arr_fname[1]) ?? time(),
                    'size'             => $size,
                    'progress'         => $progress,
                    'total'            => $total,
                    'config'           => $config,
                    'pid'              => $pid,
                    'id'               => $base_filename,
                    'progress_recover' => $progress_recover,
                    'pid_recover'      => $pid_recover,
                ];
                $errorMsgFile = "{$dirs['backup']}/{$base_filename}/error.txt";
                if(file_exists($errorMsgFile)){
                    $errorMsg = file_get_contents($errorMsgFile);
                    if(!empty($errorMsg)){
                        $data['error'] = $errorMsg;
                    }
                }
                $res->data[] = $data;
            }
        }
        $res->success = true;
        return $res;
    }

    /**
     * Получаем данные по резервным копиям с SFTP / FTP ресурсов.
     *
     * @param $data
     */
    public static function listBackupsFtp(&$data): void
    {
        $dirs       = [
            'backup' => self::getBackupDir(),
        ];

        $tmp_data = [$data];

        $BackupRules = BackupRules::find('enabled="1"');
        foreach ($BackupRules as $res) {
            $backup_dir   = '/storage/' . $res->ftp_host . '.' . $res->ftp_port;
            $disk_mounted = Storage::isStorageDiskMounted($backup_dir);
            if ( ! $disk_mounted) {
                if ($res->ftp_sftp_mode === '1') {
                    $disk_mounted = Storage::mountSftpDisk(
                        $res->ftp_host,
                        $res->ftp_port,
                        $res->ftp_username,
                        $res->ftp_secret,
                        $res->ftp_path,
                        $backup_dir
                    );
                } else {
                    $disk_mounted = Storage::mountFtp(
                        $res->ftp_host,
                        $res->ftp_port,
                        $res->ftp_username,
                        $res->ftp_secret,
                        $res->ftp_path,
                        $backup_dir
                    );
                }
            }
            if ( ! $disk_mounted) {
                continue;
            }

            $ftpIsLocalhost = self::ftpIsLocalhost($backup_dir, $dirs['backup']);
            if($ftpIsLocalhost === true){
                continue;
            }
            $out         = [];
            $timeoutPath = Util::which('timeout');
            $command     = "{$timeoutPath} 3 ls -l {$backup_dir}";
            Processes::mwExec($command, $out);
            $response = trim(implode('', $out));
            if ('Terminated' === $response) {
                // Удаленный сервер не ответил / или не корректно указан пароль.
                continue;
            }
            $result = self::listBackups($backup_dir)->data;
            foreach ($result as &$b) {
                $b['m_BackupRules_id']   = $res->id;
                $b['m_BackupRules_host'] = $res->ftp_host;
                $b['m_BackupRules_port'] = $res->ftp_port;
            }
            unset($b);
            $tmp_data[] = $result;
        }

        $data = array_merge(...$tmp_data);
    }

    /**
     * Проверим, не является ли удаленный диск локальным.
     * @param string $backup_dir
     * @param        $backup
     * @return bool
     */
    private static function ftpIsLocalhost(string $backup_dir, $backup): bool{
        $ftpIsLocalhost = false;
        $test_data = md5(time());
        file_put_contents("{$backup_dir}/test.tmp", $test_data);
        if (file_exists("{$backup}/test.tmp")) {
            $test_data_res = file_get_contents("{$backup}/test.tmp");
            if ($test_data_res === $test_data) {
                unlink("{$backup_dir}/test.tmp");
                // Это локальный диск подключен по SFTP. Не нужно обрабатывать.
                $ftpIsLocalhost = true;
            }
        }
        // Чистим временный файл.
        unlink("{$backup_dir}/test.tmp");
        return $ftpIsLocalhost;
    }
    /**
     * Проверяет, активен ли процесс резервного копирования.
     *
     * @param $id
     *
     * @return string
     */
    public static function getPID($id): string
    {
        return Processes::getPidOfProcess($id);
    }

    /**
     * Start backup action by schedule
     *
     * @return PBXApiResult
     */
    public static function startScheduled(): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;
        $commands       = BackupRules::find('enabled="1"');
        $queue_commands = [];
        $workerPath     = Util::getFilePathByClassName(WorkerBackup::class);
        $phpPath        = Util::which('php');
        $nohupPath      = Util::which('nohup');
        foreach ($commands as $cmd) {
            $command          = "{$nohupPath} {$phpPath} -f {$workerPath} ";
            $params           = "none backup {$cmd->id} > /dev/null 2>&1 &";
            $queue_commands[] = "{$command} {$params}\n";
        }
        Processes::mwExecCommands($queue_commands);
        if (!empty($queue_commands)) {
            $res->success=true;
        }
        return $res;
    }

    /**
     * Проверка возможности подключения диска.
     *
     * @param $id
     *
     * @return PBXApiResult
     */
    public static function checkStorageFtp($id): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;
        $first_by_id    = BackupRules::findFirstById($id);
        if ($first_by_id === null) {
            $res->messages[]='Backup rule not found for id='.$id;
            return $res;
        }
        $backup_dir = '/storage/' . $first_by_id->ftp_host . '.' . $first_by_id->ftp_port;
        /** @var Storage::isStorageDiskMounted $disk_mounted */
        $disk_mounted       = Storage::isStorageDiskMounted("$backup_dir ");
        $disk_mounted_start = $disk_mounted;
        if ( ! $disk_mounted) {
            if ($first_by_id->ftp_sftp_mode === '1') {
                $disk_mounted = Storage::mountSftpDisk(
                    $first_by_id->ftp_host,
                    $first_by_id->ftp_port,
                    $first_by_id->ftp_username,
                    $first_by_id->ftp_secret,
                    $first_by_id->ftp_path,
                    $backup_dir
                );
            } else {
                $disk_mounted = Storage::mountFtp(
                    $first_by_id->ftp_host,
                    $first_by_id->ftp_port,
                    $first_by_id->ftp_username,
                    $first_by_id->ftp_secret,
                    $first_by_id->ftp_path,
                    $backup_dir
                );
            }
        }
        if ( ! $disk_mounted) {
            $res->messages[]='Failed to mount backup disk...';
            return $res;
        }
        $res->success = true;
        if ( ! $disk_mounted_start) {
            Storage::umountDisk($backup_dir);
        }

        return $res;
    }

    /**
     * Makes download link for img file
     *
     * @param $id - backup ID
     *
     * @return PBXApiResult
     */
    public static function download($id):PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;
        $b        = new Backup($id);
        $filename = $b->getResultFile();

        if ( ! file_exists($filename)) {
            $res->messages[]="File '{$filename}' not found";
            return $res;
        }

        $extension    = Util::getExtensionOfFile($filename);
        $uid          = Util::generateRandomString(36);
        $di           = Di::getDefault();
        $downloadLink = $di->getShared('config')->path('www.downloadCacheDir');

        $result_dir = "{$downloadLink}/{$uid}";
        Util::mwMkdir($result_dir);
        Util::createUpdateSymlink($filename, "{$result_dir}/{$id}.{$extension}");
        $downloadLink = "/pbxcore/files/cache/{$uid}/{$id}.{$extension}";

        $res->success = true;
        $res->data[] = $downloadLink;
        return $res;
    }

    /**
     * Возвращает путь к файлу резервной копии.
     *
     * @return string
     */
    public function getResultFile(): string
    {
        if ( ! file_exists($this->result_file)) {
            $BackupRules = BackupRules::find('enabled="1"');
            foreach ($BackupRules as $res) {
                $backup_dir = '/storage/' . $res->ftp_host . '.' . $res->ftp_port;
                $filename   = "{$backup_dir}/{$this->id}/resultfile";
                if (file_exists("{$filename}.zip")) {
                    $this->result_file = "{$filename}.zip";
                }
                if (file_exists("{$filename}.img")) {
                    $this->result_file = "{$filename}.img";
                }
            }
        }

        return $this->result_file;
    }

    /**
     * Проверка хватает ли свободноо места на диске;
     * @return bool
     */
    private function checkDiskSpace():bool
    {
        $estimatedSize = self::getEstimatedSize();
        $needSpace = 0;
        $freeSpace = 0;
        foreach ($this->options as $key => $data){
            if($data !== '1'){
                continue;
            }
            $needSpace += 1 * $estimatedSize->getResult()['data'][$key];
        }

        $storage = new Storage();
        $freeSpaceData = $storage->getAllHdd();

        $mountPoint = '';
        Storage::isStorageDiskMounted('', $mountPoint);
        foreach ($freeSpaceData as $storageData){
            if($storageData['mounted'] === $mountPoint){
                $freeSpace =  1*$storageData['free_space'];
            }
        }

        return ($freeSpace > $needSpace && ($freeSpace - $needSpace) > 500);
    }

    /**
     * Создает файл бекапа.
     *
     * @return array
     */
    public function createArchive(): array
    {
        file_put_contents($this->errorFile, '');
        if (file_exists($this->progress_file)) {
            $file_data      = file_get_contents($this->progress_file);
            $data           = explode('/', $file_data);
            $this->progress = trim($data[0]) * 1;
        }else{
            file_put_contents($this->progress_file, '0');
        }
        if(!$this->checkDiskSpace()){
            $msg = 'There is not enough free disk space.';
            file_put_contents($this->errorFile, $msg);
            Util::sysLogMsg(__CLASS__, $msg);
            return ['result' => 'ERROR', 'message' => $msg];
        }
        if ( ! file_exists("{$this->dirs['backup']}/{$this->id}")) {
            $msg = 'Unable to create directory for the backup.';
            file_put_contents($this->errorFile, $msg);
            Util::sysLogMsg(__CLASS__, $msg);
            return ['result' => 'ERROR', 'message' => $msg];
        }
        $result = $this->createFileList();
        if ( ! $result) {
            $msg = 'Unable to create file list. Failed to create file.';
            file_put_contents($this->errorFile, $msg);
            Util::sysLogMsg(__CLASS__, $msg);
            return ['result' => 'ERROR', 'message' => $msg];
        }

        if ( ! file_exists($this->file_list)) {
            $msg = 'File list not found.';
            file_put_contents($this->errorFile, $msg);
            Util::sysLogMsg(__CLASS__, $msg);
            return ['result' => 'ERROR', 'message' => $msg];
        }
        $lines = file($this->file_list);
        if ($lines === false) {
            $msg = 'File list empty.';
            file_put_contents($this->errorFile, $msg);
            Util::sysLogMsg(__CLASS__, $msg);
            return ['result' => 'ERROR', 'message' => $msg];
        }
        $count_files = count($lines);
        file_put_contents($this->progress_file, "{$this->progress}/{$count_files}");
        while ($this->progress < $count_files) {
            $filename_data = trim($lines[$this->progress]);
            if (strpos($filename_data, ':') === false) {
                $filename = $filename_data;
            } else {
                $filename = (explode(':', $filename_data))[1];
            }
            if (is_dir($filename) === false) {
                $this->addFileToArhive($filename);
            }

            $this->progress++;
            if ($this->progress % 10 === 0) {
                file_put_contents($this->progress_file, "{$this->progress}/{$count_files}");
            }
        }

        file_put_contents($this->progress_file, "{$this->progress}/{$count_files}");
        $this->addFileToArhive($this->progress_file);

        if (Storage::diskIsMounted($this->result_file, '')) {
            $unmountPath = Util::which('umount');
            Processes::mwExec("{$unmountPath} $this->result_file");
        }

        return ['result' => 'Success', 'count_files' => $count_files];
    }

    /**
     * Создает список файлов к бекапу.
     */
    private function createFileList(): bool
    {
        try {
            $result = @file_put_contents($this->file_list, '');
        } catch (Exception $e) {
            Util::sysLogMsg('Backup', $e->getMessage());
            $result = false;
        }
        if ($result === false || ! file_exists($this->file_list)) {
            Util::sysLogMsg('Backup', 'Failed to create file ' . $this->file_list);

            return $result;
        }

        $flist = '';
        if (($this->options['backup-config'] ?? '') === '1') {
            file_put_contents($this->file_list, 'backup-config:' . $this->dirs['settings_db_path'] . "\n", FILE_APPEND);
            Processes::mwExec("find {$this->dirs['custom_modules']}", $out);
            foreach ($out as $filename) {
                $flist .= 'backup-config:' . $filename . "\n";
            }
        }
        if (($this->options['backup-cdr'] ?? '') === '1') {
            file_put_contents($this->file_list, 'backup-cdr:' . $this->dirs['cdr_db_path'] . "\n", FILE_APPEND);
        }

        file_put_contents($this->file_list, $this->file_list . "\n", FILE_APPEND);
        file_put_contents($this->file_list, $this->config_file . "\n", FILE_APPEND);

        $findPath = Util::which('find');
        if (($this->options['backup-sound-files'] ?? '') === '1') {
            Processes::mwExec("{$findPath} {$this->dirs['media']} -type f", $out);
            foreach ($out as $filename) {
                $flist .= 'backup-sound-files:' . $filename . "\n";
            }
        }
        if (($this->options['backup-records'] ?? '') === '1') {
            Processes::mwExec("{$findPath} {$this->dirs['astspooldir']} -type f -name *.mp3", $out);
            foreach ($out as $filename) {
                $flist .= 'backup-records:' . $filename . "\n";
            }
        }
        file_put_contents($this->file_list, $flist, FILE_APPEND);

        return true;
    }

    /**
     * Добавляем файл к архиву.
     *
     * @param $filename
     */
    private function addFileToArhive($filename): void
    {
        if ( ! file_exists($filename)) {
            return;
        }

        $sqlite3Path = Util::which('sqlite3');
        $cpPath      = Util::which('cp');
        $sevenZaPath = Util::which('7za');

        if ($this->type === 'img') {
            $this->createImgFile();
            $res_dir = dirname($this->result_dir . $filename);
            Util::mwMkdir($res_dir);
            if (in_array(basename($filename), ['mikopbx.db', 'cdr.db'])) {
                // Выполняем копирование через dump.
                // Наиболее безопасный вариант.
                Processes::mwExec(
                    "{$sqlite3Path} '{$filename}' .dump | {$sqlite3Path} '{$this->result_dir}{$filename}' ",
                    $out
                );
            } else {
                // Просто копируем файл.
                Processes::mwExec("{$cpPath} '{$filename}' '{$this->result_dir}{$filename}' ", $out);
            }
        } else {
            Processes::mwExec("{$sevenZaPath} a -tzip -spf '{$this->result_file}' '{$filename}'", $out);
        }
    }

    /**
     * Создает файл образа для бекапа. Резервирует место под резервную копию.
     */
    private function createImgFile(): void
    {
        // Создаем директорию монтирования.
        Util::mwMkdir($this->result_dir);
        if ( ! file_exists($this->result_file)) {
            // Оценим размер бекапа.
            $result_size = 0;
            $arr_size    = self::getEstimatedSize()->data;
            foreach ($this->options as $key => $enable) {
                if (trim($enable) === '1') {
                    $result_size += $arr_size[$key];
                }
            }
            // Округляем в большую сторону.
            $result_size = $result_size < 1 ? 1 : round($result_size);
            $tmp_name    = $this->dirs['tmp'] . '/' . Util::generateRandomString();
            // Создаем образ файловой системы.
            $ddPath = Util::which('dd');
            $res    = Processes::mwExec("{$ddPath} if=/dev/zero of={$tmp_name} bs=1 count=0 seek={$result_size}M");
            if ($res !== 0) {
                Util::sysLogMsg('Backup', 'Error creating img file...');
            }

            // Создаем разметку файловой системы.
            $mke2fsPath = Util::which('mke2fs');
            $res        = Processes::mwExec("{$mke2fsPath} -m0 -L backup -F {$tmp_name}");
            if ($res !== 0) {
                Util::sysLogMsg('Backup', 'Error create the layout of the file system... ' . $tmp_name);
                // throw new Exception('Error create the layout of the file system...');
            }
            // Тюним.
            $tune2fsPath = Util::which('tune2fs');
            $cpPath      = Util::which('cp');
            $rmPath      = Util::which('rm');
            Processes::mwExec("{$tune2fsPath} -c0  {$tmp_name}");
            Processes::mwExec("{$cpPath} '{$tmp_name}' '{$this->result_file}' ");
            Processes::mwExec("{$rmPath} -rf  '{$tmp_name}'");
        }
        // Монтируем.
        if ( ! Storage::diskIsMounted($this->result_file, '')) {
            $mountPath = Util::which('mount');
            $res       = Processes::mwExec("{$mountPath} -o loop {$this->result_file} {$this->result_dir}");
            if ($res > 1) {
                Util::sysLogMsg('Backup', 'File system mount error...');
            }
        }
    }

    /**
     * Возвращает предполагаемый размер каталогов для бекапа.
     *
     * @return PBXApiResult
     */
    public static function getEstimatedSize(): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;

        $arr_size                       = [];
        $di                             = Di::getDefault();
        $dirsConfig                     = $di->getShared('config');
        $dirs                           = [
            'backup'           => self::getBackupDir(),
            'custom_modules'   => $dirsConfig->path('core.modulesDir'),
            'media'            => $dirsConfig->path('asterisk.mediadir'),
            'astspooldir'      => $dirsConfig->path('asterisk.astspooldir'),
            'settings_db_path' => $dirsConfig->path('database.dbfile'),
            'cdr_db_path'      => $dirsConfig->path('cdrDatabase.dbfile'),
        ];
        $arr_size['backup-sound-files'] = Util::getSizeOfFile($dirs['media']);
        $arr_size['backup-records']     = Util::getSizeOfFile($dirs['astspooldir']);
        $arr_size['backup-cdr']         = Util::getSizeOfFile($dirs['cdr_db_path']);

        $backup_config             = Util::getSizeOfFile($dirs['settings_db_path']);
        $backup_config             += Util::getSizeOfFile($dirs['custom_modules']);
        $arr_size['backup-config'] = $backup_config;

        foreach ($arr_size as $key => $value) {
            // Есть какие то аномалии с преобразование значение в json
            // Без этого костыля есть проблемы с округлением.
            $arr_size[$key] = trim(1 * $value);
        }

        $res->success = true;
        $res->data = $arr_size;
        return $res;
    }

    /**
     * Восстановление из резервной копиии.
     *
     * @return array
     */
    public function recoverWithProgress(): array
    {
        if ( ! Storage::isStorageDiskMounted()) {
            return ['result' => 'ERROR', 'message' => 'Storage is not mounted.'];
        }
        $options = null;
        if (file_exists($this->options_recover_file)) {
            $options = json_decode(file_get_contents($this->options_recover_file), true);
        }

        if ( ! file_exists($this->file_list)) {
            return ['result' => 'ERROR', 'message' => 'File list not found.'];
        }
        $lines = file($this->file_list);
        if ($lines === false) {
            return ['result' => 'ERROR', 'message' => 'File list not read.'];
        }

        if (file_exists($this->progress_file_recover)) {
            // Получим текущий прогресс.
            $file_data      = file_get_contents($this->progress_file_recover);
            $data           = explode('/', $file_data);
            $this->progress = trim($data[0]) * 1;
        }

        $count_files = count($lines);
        if ($this->progress === $count_files) {
            $this->progress = 0;
        }

        file_put_contents($this->progress_file_recover, "{$this->progress}/{$count_files}");
        while ($this->progress < $count_files) {
            $filename_data = trim($lines[$this->progress]);
            if (strpos($filename_data, ':') === false) {
                $section  = ''; // Этот файл будет восстановленр в любом случае.
                $filename = $filename_data;
            } else {
                $tmp_data = explode(':', $filename_data);
                $section  = $tmp_data[0] ?? '';
                $filename = $tmp_data[1] ?? '';
            }

            $this->progress++;
            if (in_array(basename($filename), ['flist.txt', 'config.json'])) {
                continue;
            }

            if ($section !== '' && is_array($options) && ! isset($options[$section])) {
                // Если секция указана, и она не определена в массиве опций,
                // то не восстанавливаем файл.
                unset($filename);
            } else {
                $this->extractFile($filename);
            }
            if ($this->progress % 10 === 0) {
                file_put_contents($this->progress_file_recover, "{$this->progress}/{$count_files}");
            }
        }
        file_put_contents($this->progress_file_recover, "{$this->progress}/{$count_files}");

        if (Storage::diskIsMounted($this->result_file, '')) {
            $unmountPath = Util::which('umount');
            Processes::mwExec("{$unmountPath} $this->result_file");
        }

        if (isset($options['backup-config']) && $options['backup-config'] === '1') {
            System::rebootSync();
        }

        return ['result' => 'Success', 'count_files' => $count_files];
    }

    /**
     * Извлечь файл из архива.
     *
     * @param string        $filename
     * @param null | string $out
     *
     * @return bool
     */
    public function extractFile($filename = '', &$out = null): bool
    {
        $arr_out     = [];
        $mountPath   = Util::which('mount');
        $sedPath     = Util::which('sed');
        $sqlite3Path = Util::which('sqlite3');
        $rmPath      = Util::which('rm');
        $cpPath      = Util::which('cp');
        $mvPath      = Util::which('mv');
        $sevenZaPath = Util::which('7za');

        $result_file     = $filename;
        $tmp_path        = '/var/asterisk/';
        $mem_monitor_dir = $this->dirs_mem['astspooldir'] . '/mikopbx/voicemailarchive/monitor';
        $monitor_dir     = Storage::getMonitorDir();
        if (strpos($filename, $tmp_path) === 0) {
            $var_search  = [
                $mem_monitor_dir,
                $this->dirs_mem['media'],
                $this->dirs_mem['astlogpath'],
                $this->dirs_mem['backup'],
            ];
            $var_replace = [
                $monitor_dir,
                $this->dirs['media'],
                $this->dirs['astlogpath'],
                $this->dirs['backup'],
            ];
            $result_file = str_replace($var_search, $var_replace, $filename);
        }

        $file_dir = dirname($filename);
        Util::mwMkdir($file_dir);
        $file_dir = dirname($result_file);
        Util::mwMkdir($file_dir);

        if ($this->type === 'img') {
            if ( ! Storage::diskIsMounted($this->result_file, '')) {
                Processes::mwExec("{$mountPath} -o loop {$this->result_file} {$this->result_dir}");
            }
            if (in_array(basename($filename), ['mikopbx.db', 'cdr.db'])) {
                $sed_command = '';
                if ($result_file !== $filename) {
                    $sed_command = ' | ' . $sedPath . ' \'s/' . str_replace(
                            '/',
                            '\/',
                            $mem_monitor_dir
                        ) . '/' . str_replace(
                            '/',
                            '\/',
                            $monitor_dir
                        ) . '/g\'';
                    $sed_command .= ' | ' . $sedPath . ' \'s/' . str_replace(
                            '/',
                            '\/',
                            $this->dirs_mem['media']
                        ) . '/' . str_replace('/', '\/', $this->dirs['media']) . '/g\'';
                }

                if($filename === 'mikopbx.db'){
                    $grepPath    = Util::which('grep');
                    $dmpDbFile   = tempnam('/tmp', 'storage');
                    $grepOptions =" -e '^INSERT INTO m_Storage'  -e '^INSERT INTO \"m_Storage'";
                    system("{$sqlite3Path} {$result_file} .dump | {$grepPath} {$grepOptions} > ". $dmpDbFile);
                }

                // Выполняем копирование через dump.
                // Наиболее безопасный вариант.
                Processes::mwExec("{$rmPath} -rf {$result_file}* ");
                Processes::mwExec(
                    "{$sqlite3Path} '{$this->result_dir}{$filename}' .dump $sed_command | {$sqlite3Path} '{$result_file}' ",
                    $arr_out
                );

                if($filename === 'mikopbx.db'){
                    system("{$sqlite3Path} {$result_file} 'DELETE FROM m_Storage'");
                    // Восстанавливаем настройки из файла бекапа.
                    system("{$sqlite3Path} {$result_file} < {$dmpDbFile}");
                    unlink($dmpDbFile);
                }

                Util::addRegularWWWRights($result_file);
            } else {
                // Просто копируем файл.
                Processes::mwExec("{$cpPath} '{$this->result_dir}{$filename}' '{$result_file}'", $arr_out);
            }
        } else {
            Processes::mwExec("{$sevenZaPath} e -y -r -spf '{$this->result_file}' '{$filename}'", $arr_out);
            if ($filename !== $result_file && file_exists($filename)) {
                Processes::mwExec("{$mvPath} '{$filename}' '{$result_file}'", $arr_out);
            }
            if (in_array(basename($filename), ['mikopbx.db', 'cdr.db'])) {
                Util::addRegularWWWRights($result_file);
            }
        }
        $out = implode(' ', $arr_out);

        return (strpos($out, 'ERROR') === false);
    }


    /**
     * Convert old Askozia Config
     *
     * @param string $config_file
     *
     * @return \MikoPBX\PBXCoreREST\Lib\PBXApiResult
     */
    public static function convertConfig($config_file = ''): PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;
        $res->success = true;
        $di     = Di::getDefault();
        if ($di !== null){
            $tempDir = $di->getConfig()->path('core.tempDir');
        } else {
            $tempDir = '/tmp';
        }
        if (empty($config_file)) {
            $config_file = "{$tempDir}/old_config.xml";
        }

        if (file_exists($config_file)) {
            try {
                $cntr = new OldConfigConverter($config_file);
                $cntr->parse();
                $cntr->makeConfig();
                file_put_contents('/tmp/ejectcd', '');
                $mikopbx_rebootPath = Util::which('mikopbx_reboot');
                Processes::mwExecBg($mikopbx_rebootPath, '/dev/null', 3);
            } catch (Exception $e) {
                $res->success = false;
                $res->messages[] = $e->getMessage();
            }
        } else {
            $res->success = false;
            $res->messages[] = 'XML config not found';
        }

        return $res;
    }

    /**
     * Returns status uploading backup file
     *
     * @return \MikoPBX\PBXCoreREST\Lib\PBXApiResult
     */
    public static function statusUpload($id):PBXApiResult
    {
        $res = new PBXApiResult();
        $res->processor = __METHOD__;
        if (isset($id)) {
            $backup_dir  = Backup::getBackupDir();
            $status_file = "{$backup_dir}/{$id}/upload_status";
        } else {
            $status_file = '';
        }

        if ($status_file === '') {
            $res->data['status_upload']= 'ERROR_EMPTY_ID_BACKUP';
        } elseif (file_exists($status_file)) {
            $res->data['status_upload'] = file_get_contents($status_file);
            $res->success = true;
        } else {
            $res->data['status_upload']='ERROR_FILE_NOT_FOUND';
        }
        return $res;
    }

}