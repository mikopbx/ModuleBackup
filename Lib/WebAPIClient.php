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

use MikoPBX\Core\System\MikoPBXConfig;
use Exception;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\RequestException;
use GuzzleHttp\Exception\ConnectException;

class WebAPIClient
{
    private string $host       = '127.0.0.1';
    private string $protocol   = 'http';
    private string $port       = '80';
    private array  $errors     = [];
    private string $baseUrl    = 'http://127.0.0.1:80';
    private array  $extensionTemplate = [];

    /**
     * Авторизация на телефонной станции.
     */
    public function login():bool
    {
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
        $client = new Client(['timeout' => 10]);

        try {
            $response = $client->post($url, [
                'form_params' => $data,
                'headers' => [
                    'X-Requested-With' => 'XMLHttpRequest',
                    'Content-Type' => 'application/x-www-form-urlencoded',
                ]
            ]);

            $raw = $response->getBody()->getContents();
            $result = json_decode($raw, true, 512, JSON_THROW_ON_ERROR);

        } catch (ConnectException $e) {
            $result = [
                'message' => 'Connection error: ' . $e->getMessage(),
            ];

        } catch (RequestException $e) {
            $result = [
                'message' => 'Request error: ' . $e->getMessage(),
                'response' => $e->hasResponse() ? $e->getResponse()->getBody()->getContents() : null,
            ];

        } catch (JsonException $e) {
            $result = [
                'message' => 'JSON decode error: ' . $e->getMessage(),
                'raw' => isset($raw) ? $raw : null,
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
    public function addExtension($data):bool
    {
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