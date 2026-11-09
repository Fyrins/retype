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
 * The format itself is saved as plain markup:
 *
 *     <span class="retype" data-retype-words="baker, beekeeper">cheesemaker</span>
 *
 * Both attributes survive `wp_kses_post()` without any filter, because `class`
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
			wp_set_script_translations( self::EDITOR_HANDLE, 'retype' );

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
		if ( wp_script_is( self::EDITOR_HANDLE, 'registered' ) ) {
			wp_enqueue_script( self::EDITOR_HANDLE );
		}
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
		if (
			! is_admin()
			&& is_string( $block_content )
			&& false !== strpos( $block_content, self::WORDS_ATTRIBUTE )
		) {
			$this->enqueue_front();
		}

		return $block_content;
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

		$delays = Delays::get();

		if ( Delays::are_defaults( $delays ) ) {
			return;
		}

		/*
		 * Every value is an integer by now, so the JSON holds nothing that
		 * could close the script element.
		 */
		wp_add_inline_script(
			self::VIEW_HANDLE,
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
