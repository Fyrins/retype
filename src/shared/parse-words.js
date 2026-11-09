/**
 * Splits a hand-typed list of words ("a, b ,, c").
 *
 * Splits on commas, trims each entry, collapses inner whitespace, and drops
 * empty entries and duplicates. Duplicates are compared case-insensitively and
 * the first occurrence wins.
 *
 * @param {string} input Raw text, words separated by commas.
 * @return {string[]} Clean words, in the order they were typed.
 */
export function parseWords( input ) {
	if ( typeof input !== 'string' ) {
		return [];
	}

	const seen = new Set();

	return input
		.split( ',' )
		.map( ( word ) => word.trim().replace( /\s+/g, ' ' ) )
		.filter( ( word ) => {
			const key = word.toLocaleLowerCase();

			if ( word === '' || seen.has( key ) ) {
				return false;
			}

			seen.add( key );
			return true;
		} );
}
