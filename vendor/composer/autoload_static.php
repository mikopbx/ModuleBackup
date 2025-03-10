<?php

// autoload_static.php @generated by Composer

namespace Composer\Autoload;

class ComposerStaticInitee39bdfc21b0764ecee0b609a8f1a49c
{
    public static $prefixLengthsPsr4 = array (
        'M' => 
        array (
            'Modules\\ModuleBackup\\' => 21,
        ),
    );

    public static $prefixDirsPsr4 = array (
        'Modules\\ModuleBackup\\' => 
        array (
            0 => '/',
        ),
    );

    public static $classMap = array (
        'Composer\\InstalledVersions' => __DIR__ . '/..' . '/composer/InstalledVersions.php',
        'simplehtmldom\\Debug' => __DIR__ . '/..' . '/simplehtmldom/simplehtmldom/Debug.php',
        'simplehtmldom\\HtmlDocument' => __DIR__ . '/..' . '/simplehtmldom/simplehtmldom/HtmlDocument.php',
        'simplehtmldom\\HtmlElement' => __DIR__ . '/..' . '/simplehtmldom/simplehtmldom/HtmlElement.php',
        'simplehtmldom\\HtmlNode' => __DIR__ . '/..' . '/simplehtmldom/simplehtmldom/HtmlNode.php',
        'simplehtmldom\\HtmlWeb' => __DIR__ . '/..' . '/simplehtmldom/simplehtmldom/HtmlWeb.php',
    );

    public static function getInitializer(ClassLoader $loader)
    {
        return \Closure::bind(function () use ($loader) {
            $loader->prefixLengthsPsr4 = ComposerStaticInitee39bdfc21b0764ecee0b609a8f1a49c::$prefixLengthsPsr4;
            $loader->prefixDirsPsr4 = ComposerStaticInitee39bdfc21b0764ecee0b609a8f1a49c::$prefixDirsPsr4;
            $loader->classMap = ComposerStaticInitee39bdfc21b0764ecee0b609a8f1a49c::$classMap;

        }, null, ClassLoader::class);
    }
}
