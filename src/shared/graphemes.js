let segmenter;

/**
 * Splits a text into user-perceived characters (grapheme clusters).
 *
 * `Intl.Segmenter` keeps a composed emoji, a flag, or a letter followed by a
 * combining accent in one piece, so typing never shows half of one. Browsers
 * without it fall back to code points with `Array.from`, which at least never
 * splits a surrogate pair.
 *
 * @param {string} text Text to split.
 * @return {string[]} The characters, in order.
 */
export function splitGraphemes( text ) {
	if ( typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function' ) {
		segmenter =
			segmenter ||
			new Intl.Segmenter( undefined, { granularity: 'grapheme' } );

		return Array.from(
			segmenter.segment( text ),
			( part ) => part.segment
		);
	}

	return Array.from( text );
}
