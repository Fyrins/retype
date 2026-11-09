/**
 * Default delays, in milliseconds. Must match Retype\Delays::DEFAULTS in PHP,
 * which only prints a value when it differs from these.
 */
export const DEFAULT_DELAYS = Object.freeze( {
	type: 40,
	erase: 20,
	hold: 1200,
} );

/**
 * Inclusive bounds, in milliseconds. Must match Retype\Delays::BOUNDS.
 */
export const BOUNDS = Object.freeze( {
	type: Object.freeze( [ 10, 2000 ] ),
	erase: Object.freeze( [ 10, 2000 ] ),
	hold: Object.freeze( [ 200, 60000 ] ),
} );

/**
 * Rounds a delay and confines it to the bounds of its key.
 *
 * @param {string} key   `type`, `erase` or `hold`.
 * @param {number} value Finite number of milliseconds.
 * @return {number} Bounded integer.
 */
function confine( key, value ) {
	const [ min, max ] = BOUNDS[ key ];

	return Math.min( Math.max( Math.round( value ), min ), max );
}

/**
 * Reads one delay from an untrusted value.
 *
 * @param {string} key `type`, `erase` or `hold`.
 * @param {*}      raw Candidate value: a number or a numeric string.
 * @return {number|undefined} The bounded delay, or undefined when the value is not a finite number.
 */
export function readDelay( key, raw ) {
	const value =
		typeof raw === 'string' && raw.trim() !== '' ? Number( raw ) : raw;

	return typeof value === 'number' && Number.isFinite( value )
		? confine( key, value )
		: undefined;
}

/**
 * Reads delays from an untrusted object, typically `window.retypeDelays`.
 *
 * The PHP side has already sanitized what it prints, but the global can also
 * be set by a theme script, so the same rules apply again here: anything that
 * is not a finite number falls back, and the rest is rounded and confined to
 * its bounds.
 *
 * @param {*}                                           input    Candidate delays.
 * @param {{type: number, erase: number, hold: number}} fallback Delays used for missing or invalid keys.
 * @return {{type: number, erase: number, hold: number}} Usable delays.
 */
export function readDelays( input, fallback = DEFAULT_DELAYS ) {
	const source = input !== null && typeof input === 'object' ? input : {};
	const delays = {};

	Object.keys( DEFAULT_DELAYS ).forEach( ( key ) => {
		delays[ key ] = readDelay( key, source[ key ] ) ?? fallback[ key ];
	} );

	return delays;
}

/**
 * Reads the delays of one retyped word from its data attributes.
 *
 * `data-retype-type` and `data-retype-hold` hold milliseconds and override the
 * site delays for this word only. There is no attribute for erasing: when the
 * word sets its own typing delay, erasing keeps the site's ratio between the
 * two (half, with the defaults). Missing or invalid values fall back to the
 * site delays.
 *
 * @param {DOMStringMap|Object}                         dataset The element's `dataset`.
 * @param {{type: number, erase: number, hold: number}} base    Site delays, already validated.
 * @return {{type: number, erase: number, hold: number}} Usable delays.
 */
export function readElementDelays( dataset, base ) {
	const source = dataset || {};
	const type = readDelay( 'type', source.retypeType );
	const hold = readDelay( 'hold', source.retypeHold );

	return {
		type: type ?? base.type,
		erase:
			type === undefined
				? base.erase
				: confine( 'erase', ( type * base.erase ) / base.type ),
		hold: hold ?? base.hold,
	};
}
