<?php
/**
 * Hooks and assets.
 *
 * @package Retype
 */

namespace Retype;

defined( 'ABSPATH' ) || exit;

/**
 * Registers the editor and front-end assets, and loads the front-end ones only
 * on pages that contain the format.
 *
 * The format itself is saved as plain markup, the last three attributes being
 * optional settings of the word (delays in milliseconds, caret color):
 *
 *     <span class="retype" data-retype-words="baker, beekeeper"
 *         data-retype-type="60" data-retype-hold="2500"
 *         data-retype-caret="var(--wp--preset--color--accent-1)">cheesemaker</span>
 *
 * Every attribute survives `wp_kses_post()` without any filter, because `class`
 * and `data-*` are global attributes in WordPress (`_wp_add_global_attributes()`).
 * Authors without `unfiltered_html` can therefore use the format, and the
 * plugin never touches the KSES allow list.
 */
final class Plugin {

	/**
	 * Attribute carrying the list of words, and the marker looked for at render
	 * time. More specific than the class name, which a theme could plausibly use
	 * for something else.
	 *
	 * @var string
	 */
	const WORDS_ATTRIBUTE = 'data-retype-words';

	/**
	 * Handle of the editor script and of the editor stylesheet.
	 *
	 * @var string
	 */
	const EDITOR_HANDLE = 'retype-editor';

	/**
	 * Handle of the front-end script and of the front-end stylesheet.
	 *
	 * @var string
	 */
	const VIEW_HANDLE = 'retype-view';

	/**
	 * Global the front-end script reads non-default delays from.
	 *
	 * @var string
	 */
	const DELAYS_GLOBAL = 'retypeDelays';

	/**
	 * Registers the hooks.
	 *
	 * @return void
	 */
	public function register_hooks(): void {
		add_action( 'init', array( $this, 'register_assets' ) );
		add_action( 'enqueue_block_editor_assets', array( $this, 'enqueue_editor_script' ) );
		add_action( 'enqueue_block_assets', array( $this, 'enqueue_editor_style' ) );
		add_filter( 'render_block', array( $this, 'maybe_enqueue_front' ) );
	}

	/**
	 * Registers every asset without enqueuing any of them.
	 *
	 * Dependencies and versions come from the `.asset.php` files webpack writes
	 * next to each bundle. `build/` is not in the repository, so a fresh clone
	 * has none: the assets are then left unregistered, quietly, and the plugin
	 * does nothing rather than print a broken script tag.
	 *
	 * @return void
	 */
	public function register_assets(): void {
		$editor = self::read_asset( 'editor' );

		if ( null !== $editor ) {
			wp_register_script(
				self::EDITOR_HANDLE,
				plugins_url( 'build/editor.js', RETYPE_FILE ),
				$editor['dependencies'],
				$editor['version'],
				true
			);

			// No path argument: translations come from the language packs that
			// translate.wordpress.org publishes to wp-content/languages/plugins/.
			wp_set_script_translations( self::EDITOR_HANDLE, 'fyrins-retype' );

			wp_register_style(
				self::EDITOR_HANDLE,
				plugins_url( 'build/editor.css', RETYPE_FILE ),
				array(),
				$editor['version']
			);
			wp_style_add_data( self::EDITOR_HANDLE, 'rtl', 'replace' );
		}

		$view = self::read_asset( 'view' );

		if ( null !== $view ) {
			wp_register_script(
				self::VIEW_HANDLE,
				plugins_url( 'build/view.js', RETYPE_FILE ),
				$view['dependencies'],
				$view['version'],
				array(
					'in_footer' => true,
					'strategy'  => 'defer',
				)
			);

			wp_register_style(
				self::VIEW_HANDLE,
				plugins_url( 'build/style-view.css', RETYPE_FILE ),
				array(),
				$view['version']
			);
			wp_style_add_data( self::VIEW_HANDLE, 'rtl', 'replace' );
		}
	}

	/**
	 * Enqueues the script that registers the format in the editor.
	 *
	 * @return void
	 */
	public function enqueue_editor_script(): void {
		if ( ! wp_script_is( self::EDITOR_HANDLE, 'registered' ) || wp_script_is( self::EDITOR_HANDLE, 'enqueued' ) ) {
			return;
		}

		wp_enqueue_script( self::EDITOR_HANDLE );

		// The popover shows the site delays as the defaults of each word.
		self::add_delays_before( self::EDITOR_HANDLE );
	}

	/**
	 * Enqueues the editor preview style.
	 *
	 * `enqueue_block_assets` is the hook that reaches the iframed editor canvas,
	 * but it also fires on the front end, hence the `is_admin()` guard: the
	 * front end gets its own stylesheet, and only where the format is used.
	 *
	 * @return void
	 */
	public function enqueue_editor_style(): void {
		if ( is_admin() && wp_style_is( self::EDITOR_HANDLE, 'registered' ) ) {
			wp_enqueue_style( self::EDITOR_HANDLE );
		}
	}

	/**
	 * Enqueues the front-end assets as soon as a rendered block contains the
	 * format. The block content is returned untouched.
	 *
	 * @param mixed $block_content Rendered block markup.
	 * @return mixed
	 */
	public function maybe_enqueue_front( $block_content ) {
		if ( ! is_admin() && is_string( $block_content ) && self::contains_format( $block_content ) ) {
			$this->enqueue_front();
		}

		return $block_content;
	}

	/**
	 * Whether markup contains the format: a `span` element with the `retype`
	 * class and the words attribute.
	 *
	 * The markup is read with the HTML API rather than searched as text, so the
	 * same characters in a code block, where they are escaped, in a comment or
	 * in an attribute value do not count. The text search first is only a fast
	 * way out for the vast majority of blocks.
	 *
	 * @param string $html Rendered markup.
	 * @return bool
	 */
	public static function contains_format( string $html ): bool {
		if ( false === stripos( $html, self::WORDS_ATTRIBUTE ) ) {
			return false;
		}

		$tags = new \WP_HTML_Tag_Processor( $html );

		while ( $tags->next_tag(
			array(
				'tag_name'   => 'span',
				'class_name' => 'retype',
			)
		) ) {
			if ( null !== $tags->get_attribute( self::WORDS_ATTRIBUTE ) ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Enqueues the front-end script and stylesheet, once.
	 *
	 * Non-default delays are handed to the script as a global printed before
	 * it. An inline script added `before` a deferred script leaves its loading
	 * strategy alone, which is not the case of one added `after`.
	 *
	 * @return void
	 */
	private function enqueue_front(): void {
		if ( ! wp_script_is( self::VIEW_HANDLE, 'registered' ) || wp_script_is( self::VIEW_HANDLE, 'enqueued' ) ) {
			return;
		}

		wp_enqueue_script( self::VIEW_HANDLE );
		wp_enqueue_style( self::VIEW_HANDLE );

		self::add_delays_before( self::VIEW_HANDLE );
	}

	/**
	 * Prints the filtered delays before a script, as a global, when they
	 * differ from the defaults the script already knows.
	 *
	 * @param string $handle Script handle.
	 * @return void
	 */
	private static function add_delays_before( string $handle ): void {
		$delays = Delays::get();

		if ( Delays::are_defaults( $delays ) ) {
			return;
		}

		/*
		 * Every value is an integer by now, so the JSON holds nothing that
		 * could close the script element.
		 */
		wp_add_inline_script(
			$handle,
			'window.' . self::DELAYS_GLOBAL . ' = ' . wp_json_encode( $delays ) . ';',
			'before'
		);
	}

	/**
	 * Reads the asset file webpack writes next to a bundle.
	 *
	 * @param string $name Entry name, `editor` or `view`.
	 * @return array{dependencies: string[], version: string}|null Null when the bundle has not been built.
	 */
	private static function read_asset( string $name ): ?array {
		$file = RETYPE_PATH . 'build/' . $name . '.asset.php';

		if ( ! is_readable( $file ) ) {
			return null;
		}

		$asset = require $file;

		return array(
			'dependencies' => ( is_array( $asset ) && isset( $asset['dependencies'] ) && is_array( $asset['dependencies'] ) )
				? $asset['dependencies']
				: array(),
			'version'      => ( is_array( $asset ) && isset( $asset['version'] ) && is_string( $asset['version'] ) )
				? $asset['version']
				: RETYPE_VERSION,
		);
	}
}
