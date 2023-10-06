<?php
/**
 * Copyright © MIKO LLC - All Rights Reserved
 * Unauthorized copying of this file, via any medium is strictly prohibited
 * Proprietary and confidential
 * Written by Alexey Portnov, 2 2020
 */

namespace Modules\ModuleBackup\Lib;

use MikoPBX\Core\System\MikoPBXConfig;
use Exception;

class WebAPIClient
{
    private string $host       = '127.0.0.1';
    private string $protocol   = 'http';
    private string $port       = '80';
    private string $ckFile     = '/tmp/pbx_web_cookie.txt';
    private array  $errors     = [];
    private string $baseUrl    = 'http://127.0.0.1:80';
    private array  $extensionTemplate = [];

    /**
     * Авторизация на телефонной станции.
     */
    public function login():bool
    {
        if (file_exists($this->ckFile)) {
            unlink($this->ckFile);
        }
        $config       = new MikoPBXConfig();
        $res_login    = $config->getGeneralSettings("WebAdminLogin");
        $res_password = $config->getGeneralSettings("WebAdminPassword");
        $WEBPort      = $config->getGeneralSettings("WEBPort");
        if ( ! empty($WEBPort)) {
            $this->port = $WEBPort;
        }
        $data          = [
            'login'    => $res_login,
            'password' => $res_password,
        ];
        $this->baseUrl = "$this->protocol://$this->host:$this->port";
        $url           = "$this->baseUrl/admin-cabinet/session/start";
        $resultRequest = $this->postData($url, $data, true);

        $result = $resultRequest['success']??false;
        if (!$result) {
            $this->errors['login'][] = [
                'data'    => $data,
                'message' => $resultRequest['message'],
            ];
        }

        return $result;
    }

    /**
     * Отправляет POST запрос по http. Возвращает ответ в виде массива.
     *
     * @param string $url
     * @param array  $data
     * @param bool   $is_login
     *
     * @return string
     */
    private function postData(string $url, array $data, bool$is_login = false)
    {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_POST, 1);
        curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 1);
        if ($is_login) {
            curl_setopt($ch, CURLOPT_COOKIEJAR, $this->ckFile);
        } else {
            curl_setopt($ch, CURLOPT_COOKIEFILE, $this->ckFile);
        }
        $headers = [
            'X-Requested-With: XMLHttpRequest',
            'Content-Type: application/x-www-form-urlencoded',
        ];
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        try {
            $result = json_decode(curl_exec($ch), true, 512, JSON_THROW_ON_ERROR);
            curl_close($ch);
        }catch ( Exception $e){
            $result = ['message' => $e->getMessage()];
        }

        return $result;
    }

    /**
     * Добавляет нового сотрудника на АТС.
     *
     * @param $data
     *
     * @return bool
     */
    public function addExtension($data):bool
    {
        if (!file_exists($this->ckFile)) {
            return false;
        }
        if(empty($this->extensionTemplate)){
            $this->extensionTemplate = $this->getData("$this->baseUrl/pbxcore/api/extensions/getRecord?id=")['data']??[];
        }
        $params = $this->extensionTemplate;
        foreach ($data as $key => $value){
            if(isset($params[$key]) && $value !== null){
                $params[$key] = $value;
            }
        }
        $result = false;
        $url           = "$this->baseUrl/pbxcore/api/extensions/saveRecord";
        $response = $this->postData($url, $params);
        if ($response && $response['success'] === true) {
            $result = true;
        } else {
            $this->errors['extensions'][] = [
                'data'    => $params,
                'message' => $response['message'],
            ];
        }

        return $result;
    }

    /**
     * Возвращает список мест хранения.
     *
     * @return bool|array
     */
    public function storage_list()
    {
        if ( ! file_exists($this->ckFile)) {
            return false;
        }
        $url           = "$this->baseUrl/pbxcore/api/storage/list";

        return $this->getData($url);
    }

    /**
     * Отправляет GET запрос по http. Возвращает ответ в виде массива.
     *
     * @param $url
     *
     * @return mixed
     */
    private function getData($url)
    {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 3);
        curl_setopt($ch, CURLOPT_COOKIEFILE, $this->ckFile);
        try {
            $result = json_decode(curl_exec($ch), true, 512, JSON_THROW_ON_ERROR);
            curl_close($ch);
        }catch ( Exception $e){
            $result = ['message' => $e->getMessage()];
        }
        return $result;
    }

    /**
     * Добавляет нового сотрудника на АТС.
     *
     * @param $data
     *
     * @return bool
     */
    public function addProviderSip($data)
    {
        $result = false;
        if ( ! file_exists($this->ckFile)) {
            return $result;
        }
        $url           = "$this->baseUrl/admin-cabinet/providers/save/sip";
        $resultrequest = $this->postData($url, $data);
        if ($resultrequest['success'] == true) {
            $result = true;
        } else {
            $this->errors['provider_sip'][] = [
                'data'    => $data,
                'message' => $resultrequest['message'],
            ];
        }

        return $result;
    }

    /**
     * Добавляет нового сотрудника на АТС.
     *
     * @param $data
     *
     * @return bool
     */
    public function addProviderIax($data)
    {
        $result = false;
        if ( ! file_exists($this->ckFile)) {
            return $result;
        }
        $url           = "{$this->protocol}://{$this->host}:{$this->port}/admin-cabinet/providers/save/iax";
        $resultrequest = $this->postData($url, $data);
        if ($resultrequest['success'] == true) {
            $result = true;
        } else {
            $this->errors['provider_sip'][] = [
                'data'    => $data,
                'message' => $resultrequest['message'],
            ];
        }

        return $result;
    }

    /**
     * Добавляет нового manager asterisk.
     *
     * @param $data
     *
     * @return bool
     */
    public function addManager($data)
    {
        $result = false;
        if ( ! file_exists($this->ckFile)) {
            return false;
        }
        $url           = "{$this->protocol}://{$this->host}:{$this->port}/admin-cabinet/asterisk-managers/save";
        $resultrequest = $this->postData($url, $data);

        if ($resultrequest['success'] == true) {
            $result = true;
        } else {
            $this->errors['manager'][] = [
                'data'    => $data,
                'message' => $resultrequest['message'],
            ];
        }

        return $result;
    }

    /**
     * Добавляет нового manager asterisk.
     *
     * @param $data
     *
     * @return bool
     */
    public function addNetFilter($data)
    {
        $result = false;
        if ( ! file_exists($this->ckFile)) {
            return false;
        }
        $url           = "{$this->protocol}://{$this->host}:{$this->port}/admin-cabinet/firewall/save";
        $resultrequest = $this->postData($url, $data);

        if ($resultrequest['success'] == true) {
            $result = true;
        } else {
            $this->errors['manager'][] = [
                'data'    => $data,
                'message' => $resultrequest['message'],
            ];
        }

        return $result;
    }

    /**
     * Добавление новой очереди.
     *
     * @param $data
     *
     * @return bool
     */
    public function addQueue($data)
    {
        $result = false;
        if ( ! file_exists($this->ckFile)) {
            return false;
        }
        $url           = "{$this->protocol}://{$this->host}:{$this->port}/admin-cabinet/call-queues/save";
        $resultrequest = $this->postData($url, $data);

        if ($resultrequest['success'] == true) {
            $result = true;
        } else {
            $this->errors['manager'][] = [
                'data'    => $data,
                'message' => $resultrequest['message'],
            ];
        }

        return $result;
    }

    /**
     * Добавление новой очереди.
     *
     * @param $data
     *
     * @return bool
     */
    public function addIvrMenu($data)
    {
        $result = false;
        if ( ! file_exists($this->ckFile)) {
            return false;
        }
        $url           = "{$this->protocol}://{$this->host}:{$this->port}/admin-cabinet/ivr-menu/save";
        $resultrequest = $this->postData($url, $data);

        if ($resultrequest['success'] == true) {
            $result = true;
        } else {
            $this->errors['manager'][] = [
                'data'    => $data,
                'message' => $resultrequest['message'],
            ];
        }

        return $result;
    }

    /**
     * Сохранение настроек SMARTIVR.
     *
     * @param $data
     *
     * @return bool
     */
    public function addSmartIvr($data)
    {
        $result = false;
        if ( ! file_exists($this->ckFile)) {
            return false;
        }
        $url           = "{$this->protocol}://{$this->host}:{$this->port}/admin-cabinet/module-smart-i-v-r/save";
        $resultrequest = $this->postData($url, $data);

        if ($resultrequest['success'] == true) {
            $result = true;
        } else {
            $this->errors['manager'][] = [
                'data'    => $data,
                'message' => $resultrequest['message'],
            ];
        }

        return $result;
    }

    /**
     * Добавление приложения.
     *
     * @param $data
     *
     * @return bool
     */
    public function add_dialplan_applications($data)
    {
        $result = false;
        if ( ! file_exists($this->ckFile)) {
            return false;
        }
        $url           = "{$this->protocol}://{$this->host}:{$this->port}/admin-cabinet/dialplan-applications/save";
        $resultrequest = $this->postData($url, $data);

        if ($resultrequest['success'] == true) {
            $result = true;
        } else {
            $this->errors['manager'][] = [
                'data'    => $data,
                'message' => $resultrequest['message'],
            ];
        }

        return $result;
    }
}