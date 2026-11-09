<?php
/**
 * Animation delays, configurable through a filter.
 *
 * @package Retype
 */

namespace Retype;

defined( 'ABSPATH' ) || exit;

/**
 * Reads the animation delays from the `retype_delays` filter and makes them
 * safe to print.
 *
 * Nothing is stored. The values exist for the length of a request and come
 * from code, which is why there is no settings page to go with them.
 */
final class Delays {

	/**
	 * Default delays, in milliseconds. Must match the defaults in
	 * src/shared/delays.js, which the front-end script falls back to when
	 * nothing is printed.
	 *
	 * - `type`: per letter while a word is typed.
	 * - `erase`: per letter while a word is erased.
	 * - `hold`: pause on each complete word.
	 *
	 * @var array<string, int>
	 */
	const DEFAULTS = array(
		'type'  => 40,
		'erase' => 20,
		'hold'  => 1200,
	);

	/**
	 * Inclusive bounds for each delay, in milliseconds.
	 *
	 * The lower bounds keep the loop from spinning: a timer at 0 ms would
	 * repaint as fast as the browser lets it, for no visible gain.
	 *
	 * @var array<string, array{0: int, 1: int}>
	 */
	const BOUNDS = array(
		'type'  => array( 10, 2000 ),
		'erase' => array( 10, 2000 ),
		'hold'  => array( 200, 60000 ),
	);

	/**
	 * Returns the filtered delays, sanitized.
	 *
	 * @return array<string, int>
	 */
	public static function get(): array {
		/**
		 * Filters the delays of the typing animation.
		 *
		 * Missing keys keep their default. Each value is a number of
		 * milliseconds and is rounded, then confined to its bounds:
		 * 10 to 2000 for `type` and `erase`, 200 to 60000 for `hold`.
		 * Anything that is not a finite number falls back to the default.
		 *
		 * @since 1.0.0
		 *
		 * @param array<string, int> $delays {
		 *     @type int $type  Delay per letter while typing. Default 40.
		 *     @type int $erase Delay per letter while erasing. Default 20.
		 *     @type int $hold  Pause on each complete word. Default 1200.
		 * }
		 */
		$delays = apply_filters( 'retype_delays', self::DEFAULTS );

		return self::sanitize( $delays );
	}

	/**
	 * Sanitizes a set of delays.
	 *
	 * A filter is code someone else wrote, so the value can be of any type.
	 * The type is checked before any cast: a cast on an array or an object
	 * emits a warning or throws.
	 *
	 * @param mixed $delays Raw delays.
	 * @return array<string, int>
	 */
	public static function sanitize( $delays ): array {
		$delays    = is_array( $delays ) ? $delays : array();
		$sanitized = array();

		foreach ( self::DEFAULTS as $key => $default ) {
			$sanitized[ $key ] = self::sanitize_one(
				array_key_exists( $key, $delays ) ? $delays[ $key ] : null,
				$default,
				self::BOUNDS[ $key ][0],
				self::BOUNDS[ $key ][1]
			);
		}

		return $sanitized;
	}

	/**
	 * Whether the delays are the defaults, in which case the front-end script
	 * already knows them and nothing needs printing.
	 *
	 * @param array<string, int> $delays Sanitized delays.
	 * @return bool
	 */
	public static function are_defaults( array $delays ): bool {
		return self::DEFAULTS === $delays;
	}

	/**
	 * Sanitizes a single delay.
	 *
	 * @param mixed $value   Raw value.
	 * @param int   $fallback Value used when the raw value is not a number.
	 * @param int   $min     Lower bound, inclusive.
	 * @param int   $max     Upper bound, inclusive.
	 * @return int
	 */
	private static function sanitize_one( $value, int $fallback, int $min, int $max ): int {
		if ( is_string( $value ) ) {
			$value = trim( $value );

			if ( ! is_numeric( $value ) ) {
				return $fallback;
			}

			$value = (float) $value;
		}

		if ( ! is_int( $value ) && ! is_float( $value ) ) {
			return $fallback;
		}

		if ( ! is_finite( (float) $value ) ) {
			return $fallback;
		}

		return (int) min( max( round( $value ), $min ), $max );
	}
}
