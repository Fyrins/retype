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
const BOUNDS = Object.freeze( {
	type: [ 10, 2000 ],
	erase: [ 10, 2000 ],
	hold: [ 200, 60000 ],
} );

/**
 * Reads delays from an untrusted object, typically `window.retypeDelays`.
 *
 * The PHP side has already sanitized what it prints, but the global can also
 * be set by a theme script, so the same rules apply again here: anything that
 * is not a finite number falls back to the default, and the rest is rounded
 * and confined to its bounds.
 *
 * @param {*} input Candidate delays.
 * @return {{type: number, erase: number, hold: number}} Usable delays.
 */
export function readDelays( input ) {
	const source = input !== null && typeof input === 'object' ? input : {};
	const delays = {};

	Object.keys( DEFAULT_DELAYS ).forEach( ( key ) => {
		const raw = source[ key ];
		const value =
			typeof raw === 'string' && raw.trim() !== '' ? Number( raw ) : raw;
		const [ min, max ] = BOUNDS[ key ];

		delays[ key ] =
			typeof value === 'number' && Number.isFinite( value )
				? Math.min( Math.max( Math.round( value ), min ), max )
				: DEFAULT_DELAYS[ key ];
	} );

	return delays;
}
