const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

// One component of rgb() or hsl(): a number with an optional unit, or `none`.
// Anchored and unambiguous, and only ever run on one short token, so it
// cannot backtrack.
const COMPONENT =
	/^[-+]?(?:\d+(?:\.\d+)?|\.\d+)(?:e[-+]?\d+)?(?:%|deg|grad|rad|turn)?$|^none$/i;

const FUNCTION = /^(?:rgba?|hsla?)\(([^()]*)\)$/i;

/**
 * Whether the inside of rgb() or hsl() is three or four valid components,
 * separated by spaces, commas or a slash.
 *
 * @param {string} inner Text between the parentheses.
 * @return {boolean} True when every component is valid.
 */
function validComponents( inner ) {
	const parts = inner.split( /[\s,/]+/ ).filter( ( part ) => part !== '' );

	return (
		parts.length >= 3 &&
		parts.length <= 4 &&
		parts.every( ( part ) => COMPONENT.test( part ) )
	);
}

const PRESET = /^var\(\s*--wp--preset--color--[a-z0-9-]+\s*\)$/i;

/**
 * Validates a caret color read from `data-retype-caret`.
 *
 * Only a hex color, an `rgb()`, `rgba()`, `hsl()` or `hsla()` color with
 * numeric components, or a color preset of the theme
 * (`var(--wp--preset--color--slug)`) is accepted. Anything else is ignored, and
 * the caret keeps the text color.
 *
 * The value is applied with `style.setProperty()`, never written into markup,
 * so this is about keeping nonsense out rather than about escaping.
 *
 * @param {unknown} value Candidate color.
 * @return {string} The trimmed color, or an empty string when it is not accepted.
 */
export function readCaretColor( value ) {
	if ( typeof value !== 'string' || value.length > 64 ) {
		return '';
	}

	const color = value.trim();
	const fn = FUNCTION.exec( color );

	if (
		HEX.test( color ) ||
		PRESET.test( color ) ||
		( fn && validComponents( fn[ 1 ] ) )
	) {
		return color;
	}

	return '';
}
