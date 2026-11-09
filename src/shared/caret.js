const HEX = /^#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

// One number with an optional unit, `none`, or a separator, repeated. No
// parenthesis, quote, colon or semicolon can get through.
const COMPONENTS =
	/^(?:\s*(?:[-+]?(?:\d+\.?\d*|\.\d+)(?:e[-+]?\d+)?(?:%|deg|grad|rad|turn)?|none|,|\/))+\s*$/i;

const FUNCTION = /^(rgba?|hsla?)\((.*)\)$/i;

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
 * @param {*} value Candidate color.
 * @return {string} The trimmed color, or an empty string when it is not accepted.
 */
export function readCaretColor( value ) {
	if ( typeof value !== 'string' || value.length > 100 ) {
		return '';
	}

	const color = value.trim();
	const fn = FUNCTION.exec( color );

	if (
		HEX.test( color ) ||
		PRESET.test( color ) ||
		( fn && COMPONENTS.test( fn[ 2 ] ) )
	) {
		return color;
	}

	return '';
}
