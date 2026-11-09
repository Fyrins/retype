import { readDelay } from '../shared/delays';
import { readCaretColor } from '../shared/caret';
import { parseWords } from '../shared/parse-words';

const PRESET = /^var\(\s*--wp--preset--color--([a-z0-9-]+)\s*\)$/i;

/**
 * The CSS variable WordPress prints for a palette color, when it can be
 * derived without guessing.
 *
 * WordPress names the variable after the kebab-cased slug
 * (`_wp_to_kebab_case()`), which also splits letters from digits: `accent1`
 * becomes `accent-1`. Rather than ship a copy of that function, a slug is
 * used only when it is already in that form; any other palette color is saved
 * as its plain value.
 *
 * @param {string} slug Palette slug.
 * @return {string|null} `var(--wp--preset--color--slug)`, or null.
 */
function presetVariable( slug ) {
	return typeof slug === 'string' &&
		/^[a-z]+(?:-(?:[a-z]+|[0-9]+))*$/.test( slug )
		? `var(--wp--preset--color--${ slug })`
		: null;
}

/**
 * Turns the attributes of a formatted word into the values of the popover.
 *
 * Invalid values are dropped, so the popover shows the site default for them,
 * which is also what the front end does with them.
 *
 * @param {Object} attributes Attributes of the active format.
 * @param {Array}  palette    Theme palette, `{ slug, color }` objects.
 * @return {{words: string, type: (number|undefined), hold: (number|undefined), caret: (string|undefined)}} Draft values; `hold` in seconds.
 */
export function attributesToDraft( attributes = {}, palette = [] ) {
	const hold = readDelay( 'hold', attributes.hold );
	const caret = readCaretColor( attributes.caret );
	const preset = PRESET.exec( caret );
	const swatch = preset
		? ( palette || [] ).find( ( color ) => color.slug === preset[ 1 ] )
		: undefined;

	return {
		words: typeof attributes.words === 'string' ? attributes.words : '',
		type: readDelay( 'type', attributes.type ),
		hold: hold === undefined ? undefined : hold / 1000,
		// A preset is shown as the palette color it points to. A preset the
		// theme no longer has is dropped.
		caret: preset ? swatch?.color : caret || undefined,
	};
}

/**
 * Turns the values of the popover into format attributes.
 *
 * Empty values are left out of the markup entirely, so the word follows the
 * site delays and the text color. A palette color is saved as its preset
 * variable, so the caret follows the theme if the color changes there.
 *
 * @param {Object} draft   Values of the popover; `hold` in seconds.
 * @param {Array}  palette Theme palette, `{ slug, color }` objects.
 * @return {Object|null} Format attributes, or null when there is no word to type.
 */
export function draftToAttributes( draft, palette = [] ) {
	const words = parseWords( draft.words );

	if ( words.length === 0 ) {
		return null;
	}

	const attributes = { words: words.join( ', ' ) };
	const type = readDelay( 'type', draft.type );
	const hold =
		draft.hold === undefined || draft.hold === ''
			? undefined
			: readDelay( 'hold', Number( draft.hold ) * 1000 );
	const swatch = ( palette || [] ).find(
		( color ) => color.color === draft.caret
	);
	const caret =
		( swatch && presetVariable( swatch.slug ) ) ||
		readCaretColor( draft.caret );

	if ( type !== undefined ) {
		attributes.type = String( type );
	}
	if ( hold !== undefined ) {
		attributes.hold = String( hold );
	}
	if ( caret ) {
		attributes.caret = caret;
	}

	return attributes;
}
