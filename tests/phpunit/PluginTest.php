<?php
/**
 * Tests for Retype\Plugin, against a real WordPress.
 *
 * @package Retype
 */

namespace Retype\Tests;

use Retype\Plugin;
use WP_Scripts;
use WP_Styles;
use WP_UnitTestCase;

/**
 * Asset registration, conditional loading and the saved markup.
 */
class PluginTest extends WP_UnitTestCase {

	/**
	 * Markup the format saves.
	 *
	 * @var string
	 */
	const SPAN = '<span class="retype" data-retype-words="baker, potter">cheesemaker</span>';

	/**
	 * Starts every test from fresh script and style registries, with the
	 * plugin's assets registered the way `init` registers them.
	 */
	public function set_up() {
		parent::set_up();

		$GLOBALS['wp_scripts'] = new WP_Scripts();
		$GLOBALS['wp_styles']  = new WP_Styles();

		( new Plugin() )->register_assets();
	}

	/**
	 * Leaves the admin context and the registries clean for the next test.
	 */
	public function tear_down() {
		set_current_screen( 'front' );
		$GLOBALS['wp_scripts'] = null;
		$GLOBALS['wp_styles']  = null;

		parent::tear_down();
	}

	/**
	 * Renders block markup the way the front end does.
	 *
	 * @param string $inner Inner HTML of a paragraph block.
	 * @return string
	 */
	private function render_paragraph( $inner ) {
		return do_blocks( "<!-- wp:paragraph -->\n<p>" . $inner . "</p>\n<!-- /wp:paragraph -->" );
	}

	/**
	 * Whether a hook holds a callback bound to an instance of Plugin.
	 *
	 * @param string $hook   Hook name.
	 * @param string $method Method name.
	 * @return bool
	 */
	private function hooked( $hook, $method ) {
		global $wp_filter;

		if ( ! isset( $wp_filter[ $hook ] ) ) {
			return false;
		}

		foreach ( $wp_filter[ $hook ]->callbacks as $callbacks ) {
			foreach ( $callbacks as $callback ) {
				if (
					is_array( $callback['function'] )
					&& $callback['function'][0] instanceof Plugin
					&& $method === $callback['function'][1]
				) {
					return true;
				}
			}
		}

		return false;
	}

	public function test_the_plugin_hooks_itself_in() {
		$this->assertTrue( $this->hooked( 'init', 'register_assets' ) );
		$this->assertTrue( $this->hooked( 'enqueue_block_editor_assets', 'enqueue_editor_script' ) );
		$this->assertTrue( $this->hooked( 'enqueue_block_assets', 'enqueue_editor_style' ) );
		$this->assertTrue( $this->hooked( 'render_block', 'maybe_enqueue_front' ) );
	}

	public function test_the_editor_script_uses_the_built_dependency_list() {
		$script = wp_scripts()->query( Plugin::EDITOR_HANDLE );

		$this->assertNotFalse( $script, 'Run npm run build before the PHP tests.' );
		$this->assertStringEndsWith( '/build/editor.js', $script->src );
		$this->assertContains( 'wp-rich-text', $script->deps );
		$this->assertSame( 'retype', $script->textdomain );
		$this->assertSame( 1, wp_scripts()->get_data( Plugin::EDITOR_HANDLE, 'group' ) );
	}

	/**
	 * WordPress silently drops a script whose dependency is not registered.
	 * This is what ties the "Requires at least" header to the bundle.
	 */
	public function test_every_editor_dependency_is_registered_by_this_wordpress() {
		$script = wp_scripts()->query( Plugin::EDITOR_HANDLE );

		foreach ( $script->deps as $dependency ) {
			$this->assertTrue( wp_script_is( $dependency, 'registered' ), "$dependency is not registered." );
		}
	}

	public function test_the_front_end_script_is_deferred_in_the_footer() {
		$this->assertSame( 'defer', wp_scripts()->get_data( Plugin::VIEW_HANDLE, 'strategy' ) );
		$this->assertSame( 1, wp_scripts()->get_data( Plugin::VIEW_HANDLE, 'group' ) );
		$this->assertSame( array(), wp_scripts()->query( Plugin::VIEW_HANDLE )->deps );
		$this->assertStringEndsWith( '/build/style-view.css', wp_styles()->query( Plugin::VIEW_HANDLE )->src );
	}

	public function test_nothing_is_enqueued_before_a_block_uses_the_format() {
		$this->assertFalse( wp_script_is( Plugin::VIEW_HANDLE, 'enqueued' ) );
		$this->assertFalse( wp_style_is( Plugin::VIEW_HANDLE, 'enqueued' ) );
	}

	public function test_a_block_with_the_format_enqueues_the_front_end_assets() {
		$this->render_paragraph( 'Ask the ' . self::SPAN . '.' );

		$this->assertTrue( wp_script_is( Plugin::VIEW_HANDLE, 'enqueued' ) );
		$this->assertTrue( wp_style_is( Plugin::VIEW_HANDLE, 'enqueued' ) );
	}

	public function test_a_block_without_the_format_enqueues_nothing() {
		$this->render_paragraph( 'A plain paragraph about how to retype a word.' );
		$this->render_paragraph( '<span class="retype">A class name alone is not the format.</span>' );

		$this->assertFalse( wp_script_is( Plugin::VIEW_HANDLE, 'enqueued' ) );
		$this->assertFalse( wp_style_is( Plugin::VIEW_HANDLE, 'enqueued' ) );
	}

	public function test_nothing_is_enqueued_in_the_admin() {
		set_current_screen( 'edit-post' );

		$this->render_paragraph( self::SPAN );

		$this->assertFalse( wp_script_is( Plugin::VIEW_HANDLE, 'enqueued' ) );
	}

	public function test_the_block_content_is_returned_untouched() {
		$html = '<p>Ask the ' . self::SPAN . '.</p>';

		$this->assertSame( $html, ( new Plugin() )->maybe_enqueue_front( $html ) );
		$this->assertStringContainsString( self::SPAN, $this->render_paragraph( 'Ask the ' . self::SPAN . '.' ) );
		$this->assertNull( ( new Plugin() )->maybe_enqueue_front( null ) );
		$this->assertSame( array( 'not', 'a', 'string' ), ( new Plugin() )->maybe_enqueue_front( array( 'not', 'a', 'string' ) ) );
	}

	public function test_the_editor_script_is_enqueued_for_the_block_editor() {
		do_action( 'enqueue_block_editor_assets' );

		$this->assertTrue( wp_script_is( Plugin::EDITOR_HANDLE, 'enqueued' ) );
	}

	public function test_the_editor_style_stays_out_of_the_front_end() {
		do_action( 'enqueue_block_assets' );

		$this->assertFalse( wp_style_is( Plugin::EDITOR_HANDLE, 'enqueued' ) );
	}

	public function test_the_editor_style_reaches_the_editor() {
		set_current_screen( 'edit-post' );

		do_action( 'enqueue_block_assets' );

		$this->assertTrue( wp_style_is( Plugin::EDITOR_HANDLE, 'enqueued' ) );
	}

	public function test_default_delays_print_no_inline_script() {
		$this->render_paragraph( self::SPAN );

		$this->assertFalse( wp_scripts()->get_data( Plugin::VIEW_HANDLE, 'before' ) );
	}

	public function test_filtered_delays_are_printed_before_a_still_deferred_script() {
		add_filter(
			'retype_delays',
			static function () {
				return array(
					'type' => '100',
					'hold' => 999999,
				);
			}
		);

		$this->render_paragraph( self::SPAN );

		$printed = get_echo( 'wp_print_scripts', array( array( Plugin::VIEW_HANDLE ) ) );

		$this->assertStringContainsString( 'window.retypeDelays = {"type":100,"erase":40,"hold":60000};', $printed );
		$this->assertMatchesRegularExpression( '#<script(?=[^>]*\sdefer[\s>=])[^>]*build/view\.js[^>]*>#', $printed );
		$this->assertLessThan(
			strpos( $printed, 'build/view.js' ),
			strpos( $printed, 'window.retypeDelays' ),
			'The delays must be defined before the script runs.'
		);
	}

	public function test_the_inline_script_is_added_once_for_several_blocks() {
		add_filter(
			'retype_delays',
			static function () {
				return array( 'type' => 120 );
			}
		);

		$this->render_paragraph( self::SPAN );
		$this->render_paragraph( self::SPAN );

		$before = array_filter( (array) wp_scripts()->get_data( Plugin::VIEW_HANDLE, 'before' ) );

		$this->assertSame( 1, substr_count( implode( "\n", $before ), 'window.retypeDelays' ) );
	}

	/**
	 * Authors without unfiltered_html go through KSES. The format has to
	 * survive it without the plugin touching the allow list.
	 */
	public function test_the_saved_markup_survives_kses() {
		$this->assertSame( self::SPAN, wp_kses_post( self::SPAN ) );
	}
}
