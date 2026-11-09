import { describe, it, expect } from 'vitest';

import { splitGraphemes } from './graphemes';

describe( 'splitGraphemes', () => {
	it( 'splits plain words into letters', () => {
		expect( splitGraphemes( 'potter' ) ).toEqual( [
			'p',
			'o',
			't',
			't',
			'e',
			'r',
		] );
	} );

	it( 'keeps composed emoji, flags and decomposed accents whole', () => {
		const family = '\u{1F468}‍\u{1F469}‍\u{1F467}';
		const flag = '\u{1F1EB}\u{1F1F7}';
		const decomposed = 'é';

		expect(
			splitGraphemes( `a${ family }${ flag }${ decomposed }` )
		).toEqual( [ 'a', family, flag, decomposed ] );
	} );

	it( 'falls back to code points without Intl.Segmenter', () => {
		const { Segmenter } = Intl;
		delete Intl.Segmenter;

		try {
			expect( splitGraphemes( 'a\u{1F600}é' ) ).toEqual( [
				'a',
				'\u{1F600}',
				'e',
				'́',
			] );
		} finally {
			Intl.Segmenter = Segmenter;
		}
	} );
} );
