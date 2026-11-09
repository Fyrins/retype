<?php
/**
 * Plugin Name:       Retype
 * Plugin URI:        https://github.com/Fyrins/retype
 * Description:       A rich text format for the block editor. Select a word, list a few alternatives, and on the front end the word is erased and typed again, letter by letter, cycling through the list.
 * Version:           1.0.0
 * Requires at least: 6.6
 * Requires PHP:      7.4
 * Author:            Alexandre Revire
 * Author URI:        https://alexandre-revire.fr
 * License:           GPL-2.0-or-later
 * License URI:       https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain:       retype
 * Domain Path:       /languages
 *
 * @package Retype
 */

/*
Copyright (C) 2026 Alexandre Revire

This program is free software; you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation; either version 2 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, write to the Free Software
Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA 02110-1301 USA
*/

defined( 'ABSPATH' ) || exit;

/**
 * Plugin version. Kept in step with the plugin header, the readme Stable tag
 * and the Git tag; the deploy workflow refuses to publish when they diverge.
 */
define( 'RETYPE_VERSION', '1.0.0' );

/**
 * Absolute path to this file, used to resolve asset URLs.
 */
define( 'RETYPE_FILE', __FILE__ );

/**
 * Absolute path to the plugin directory, with a trailing slash.
 */
define( 'RETYPE_PATH', plugin_dir_path( __FILE__ ) );

require_once RETYPE_PATH . 'includes/class-delays.php';
require_once RETYPE_PATH . 'includes/class-plugin.php';

/*
 * No container, no autoloader and no runtime Composer dependency: the plugin
 * works from the files shipped in the package, or it does not ship.
 */
( new Retype\Plugin() )->register_hooks();
