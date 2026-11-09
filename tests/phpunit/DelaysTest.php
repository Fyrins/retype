<?php
/**
 * Tests for Retype\Delays.
 *
 * @package Retype
 */

namespace Retype\Tests;

use Retype\Delays;
use stdClass;
use WP_UnitTestCase;

/**
 * The `retype_delays` filter and its sanitization.
 */
class DelaysTest extends WP_UnitTestCase {

	public function test_the_defaults_without_a_filter() {
		$this->assertSame(
			array(
				'type'  => 70,
				'erase' => 40,
				'hold'  => 1800,
			),
			Delays::get()
		);
		$this->assertTrue( Delays::are_defaults( Delays::get() ) );
	}

	public function test_a_partial_filter_keeps_the_other_defaults() {
		add_filter(
			'retype_delays',
			static function ( $delays ) {
				$delays['hold'] = 3000;
				return $delays;
			}
		);

		$this->assertSame(
			array(
				'type'  => 70,
				'erase' => 40,
				'hold'  => 3000,
			),
			Delays::get()
		);
		$this->assertFalse( Delays::are_defaults( Delays::get() ) );
	}

	public function test_numeric_strings_and_floats_are_rounded() {
		$this->assertSame(
			array(
				'type'  => 56,
				'erase' => 41,
				'hold'  => 2500,
			),
			Delays::sanitize(
				array(
					'type'  => ' 55.6 ',
					'erase' => 40.5,
					'hold'  => '2500',
				)
			)
		);
	}

	public function test_values_are_confined_to_their_bounds() {
		$this->assertSame(
			array(
				'type'  => 10,
				'erase' => 2000,
				'hold'  => 200,
			),
			Delays::sanitize(
				array(
					'type'  => 0,
					'erase' => 50000,
					'hold'  => -1,
				)
			)
		);
	}

	/**
	 * Values of the wrong type, not merely the wrong shape: a cast on an
	 * array or an object is what turns a bad filter into a warning or a
	 * fatal error.
	 *
	 * @dataProvider data_forged_values
	 *
	 * @param mixed $value Forged value for every key.
	 */
	public function test_a_forged_value_falls_back_to_the_default( $value ) {
		$this->assertSame(
			Delays::DEFAULTS,
			Delays::sanitize(
				array(
					'type'  => $value,
					'erase' => $value,
					'hold'  => $value,
				)
			)
		);
	}

	/**
	 * Forged values.
	 *
	 * @return array<string, array{0: mixed}>
	 */
	public function data_forged_values() {
		return array(
			'array'        => array( array( 100 ) ),
			'object'       => array( new stdClass() ),
			'null'         => array( null ),
			'true'         => array( true ),
			'empty string' => array( '' ),
			'word'         => array( 'slow' ),
			'css time'     => array( '200ms' ),
			'infinity'     => array( INF ),
			'not a number' => array( NAN ),
			'huge string'  => array( '1e400' ),
		);
	}

	/**
	 * A filter that returns something other than an array.
	 *
	 * @dataProvider data_forged_sets
	 *
	 * @param mixed $delays Forged filter result.
	 */
	public function test_a_forged_filter_result_falls_back_to_the_defaults( $delays ) {
		add_filter(
			'retype_delays',
			static function () use ( $delays ) {
				return $delays;
			}
		);

		$this->assertSame( Delays::DEFAULTS, Delays::get() );
	}

	/**
	 * Forged filter results.
	 *
	 * @return array<string, array{0: mixed}>
	 */
	public function data_forged_sets() {
		return array(
			'null'   => array( null ),
			'false'  => array( false ),
			'string' => array( 'fast' ),
			'number' => array( 100 ),
			'object' => array( (object) array( 'type' => 100 ) ),
		);
	}
}
