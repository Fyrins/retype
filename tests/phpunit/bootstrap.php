<?php
/**
 * PHPUnit bootstrap: loads the plugin into a real WordPress.
 *
 * Expects WP_CORE_DIR to point at a WordPress install and the WP_TESTS_DB_*
 * variables to point at a database the test library may empty. See
 * CONTRIBUTING.md.
 *
 * @package Retype
 */

$retype_root = dirname( __DIR__, 2 );

require $retype_root . '/vendor/autoload.php';

/*
 * wp-phpunit reads the location of the configuration from this environment
 * variable, not from a constant, and so does the subprocess that installs the
 * test tables.
 */
putenv( 'WP_PHPUNIT__TESTS_CONFIG=' . __DIR__ . '/wp-tests-config.php' ); // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.runtime_configuration_putenv -- Read by wp-phpunit; test bootstrap only.

$retype_tests_dir = getenv( 'WP_PHPUNIT__DIR' );

require_once $retype_tests_dir . '/includes/functions.php';

tests_add_filter(
	'muplugins_loaded',
	static function () use ( $retype_root ) {
		require $retype_root . '/retype.php';
	}
);

require $retype_tests_dir . '/includes/bootstrap.php';
