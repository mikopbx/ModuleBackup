# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

ModuleBackup — модуль расширения для MikoPBX (IP-АТС на базе Asterisk). Обеспечивает резервное копирование и восстановление конфигурации, CDR, записей разговоров и звуковых файлов. Поддерживает хранение на локальном диске, FTP, SFTP и WebDAV.

**Стек:** PHP 7.4+/8.x, Phalcon MVC framework, SQLite, Asterisk.

## Commands

```bash
composer install          # установка зависимостей

# Проверка синтаксиса
php -l <file.php>
```

Тестов в репозитории нет. Модуль работает только в среде MikoPBX — локально не запускается.

## Architecture

Namespace: `Modules\ModuleBackup\` (PSR-4, корень = корень репозитория).

### Ключевые слои

| Слой | Расположение | Назначение |
|------|-------------|------------|
| Конфигурация модуля | `Lib/BackupConf.php` | Интеграция с ядром MikoPBX: REST-маршруты, cron, callback'и |
| Бизнес-логика | `Lib/Backup.php` | Создание/восстановление/удаление бекапов, FTP/SFTP/WebDAV |
| Воркеры | `Lib/WorkerBackup.php`, `Lib/WorkerRecover.php` | CLI-процессы (`WorkerBase`), запуск через `nohup php -f` |
| REST API | `Lib/RestApi/Controllers/` | GET/POST контроллеры, проксируют в backend |
| Модель | `Models/BackupRules.php` | Phalcon ORM, таблица `m_ModuleBackup` (SQLite) |
| MVC UI | `App/Controllers/`, `App/Views/`, `App/Forms/` | Веб-интерфейс админки |
| Установка | `Setup/PbxExtensionSetup.php` | Создание таблиц, регистрация в sidebar |
| Frontend | `public/assets/js/src/` → `public/assets/js/` | Исходники JS (ES5), скомпилированные файлы |
| i18n | `Messages/` | Переводы (~30 языков) |

### Поток данных

```
REST API / Cron → BackupConf::moduleRestAPICallback → Backup::start/startRecover
                                                        ↓
                                               WorkerBackup / WorkerRecover (CLI)
                                                        ↓
                                               Backup::createArchive / recoverWithProgress
                                                        ↓
                                               tar/zip/img архив ← FTP/SFTP/WebDAV/локальный диск
```

### Вспомогательные классы

- **`Lib/MikoPBXVersion.php`** — совместимость Phalcon 4/5 (разные версии MikoPBX). Используется для получения DI, Validation, Text, Logger.
- **`Lib/WebAPIClient.php`** — HTTP-клиент (GuzzleHttp + cURL) для вызовов к PBXCore REST API при конвертации старых конфигов.
- **`Lib/OldConfigConverter.php`** — парсинг и конвертация конфигов Askozia (XML/CSV) в формат MikoPBX.

## REST API

Базовый путь: `/pbxcore/api/modules/ModuleBackup/`

GET: `list`, `download`, `remove`, `startScheduled`, `getEstimatedSize`, `recover`, `checkStorageFtp`
POST: `start`, `stop`, `upload`, `recover`

## JavaScript Build

Исходники в `public/assets/js/src/`. После изменения нужно собрать в `public/assets/js/`.

Build через Babel (PHPStorm File Watcher или вручную):
- Документация: https://docs.mikopbx.com/mikopbx-development/prepare-ide-tools/mac#phpstorm-setup-babel
- Babel path: `/Users/apor/Developement/MikoPBX/MikoPBXUtils/node_modules/.bin/babel`

**Редактировать только файлы в `src/`**. Файлы в `public/assets/js/*.js` — сгенерированные.

## PHP Compatibility

Код должен работать на PHP 7.4 и PHP 8.x. Ключевые правила:

- `MikoPBXVersion::isPhalcon5Version()` — определять через `class_exists('\Phalcon\Di\Di')`, а не через `version_compare` с версией PBX из БД.
- Не передавать `null` в строковые функции (`strpos`, `trim`, `explode` и т.д.) — в PHP 8.1 это Deprecation. Приводить к `(string)` или использовать `??`.
- Не сравнивать массивы с числами через `<`/`>` — в PHP 8.0 это TypeError. Использовать `count()`.
- Для приведения к int использовать `intval()` вместо `1 * $value` — неявное float→int даёт Deprecation в PHP 8.1.
- `findFirst()` в Phalcon 3/4 возвращает `false`, не `null` — проверять через `!$record`.
- `curl_exec()` может вернуть `false` — проверять перед `json_decode()`.
- Использовать `===` вместо `==` для сравнений с `null`, `true`, `false`.
- Для ORM-запросов использовать параметризованные условия: `findFirst(['conditions' => 'field=:val:', 'bind' => ['val' => $v]])` вместо строковой интерполяции.

## Conventions

- Для приведения к int предпочитать `intval()` над `(int)` кастом.
- Соседние модули в `/Volumes/DevDisk/apor/Developement/MikoPBX/Extensions/` содержат CLAUDE.md с полезными паттернами (PHP Compatibility, JavaScript Build, архитектура MikoPBX-модулей).
- `module.json` содержит `moduleUniqueID: "ModuleBackup"` — используется повсеместно для путей, маршрутов и кеша.
- Поле `what_backup` в модели — JSON с ключами `backup-config`, `backup-cdr`, `backup-records`, `backup-sound-files`.
- Комментарии в коде на русском языке.
- Переводы в `Messages/*.php` — PHP-массивы.
- Shell-команды выполнять через `Processes::mwExec()` вместо `shell_exec()`/`system()` где возможно.
- Имя конфигурационного класса: `BackupConf` (паттерн `Module{Id}Conf` не используется — исторически `BackupConf`).
