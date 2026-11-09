import { describe, it, expect } from 'vitest';

import { attributesToDraft, draftToAttributes } from './settings';

const palette = [
	{ slug: 'accent-1', color: '#ffee58', name: 'Accent 1' },
	{ slug: 'accent2', color: '#123456', name: 'Accent 2' },
];

describe( 'draftToAttributes', () => {
	it( 'returns null without a word to type', () => {
		expect( draftToAttributes( { words: ' , ' } ) ).toBeNull();
		expect( draftToAttributes( {} ) ).toBeNull();
	} );

	it( 'leaves unset values out of the markup', () => {
		expect( draftToAttributes( { words: 'a,b' } ) ).toEqual( {
			words: 'a, b',
		} );
	} );

	it( 'saves delays in milliseconds, bounded', () => {
		expect(
			draftToAttributes( { words: 'a', type: 65, hold: 2.5 } )
		).toEqual( { words: 'a', type: '65', hold: '2500' } );
		expect(
			draftToAttributes( {
				words: 'a',
				type: 1,
				hold: 0.30000000000000004,
			} )
		).toEqual( { words: 'a', type: '10', hold: '300' } );
	} );

	it( 'saves a palette color as its preset variable', () => {
		expect(
			draftToAttributes( { words: 'a', caret: '#ffee58' }, palette )
		).toEqual( {
			words: 'a',
			caret: 'var(--wp--preset--color--accent-1)',
		} );
	} );

	it( 'saves the value of a palette color whose variable name is not certain', () => {
		expect(
			draftToAttributes( { words: 'a', caret: '#123456' }, palette )
		).toEqual( { words: 'a', caret: '#123456' } );
	} );

	it( 'saves a valid custom color and drops an invalid one', () => {
		expect( draftToAttributes( { words: 'a', caret: '#abcdef' } ) ).toEqual(
			{ words: 'a', caret: '#abcdef' }
		);
		expect( draftToAttributes( { words: 'a', caret: 'red;x' } ) ).toEqual( {
			words: 'a',
		} );
	} );
} );

describe( 'attributesToDraft', () => {
	it( 'reopens the saved values, the pause in seconds', () => {
		expect(
			attributesToDraft(
				{
					words: 'a, b',
					type: '65',
					hold: '2500',
					caret: 'var(--wp--preset--color--accent-1)',
				},
				palette
			)
		).toEqual( { words: 'a, b', type: 65, hold: 2.5, caret: '#ffee58' } );
	} );

	it( 'shows invalid or missing values as unset', () => {
		expect(
			attributesToDraft(
				{
					words: 'a',
					type: 'fast',
					caret: 'var(--wp--preset--color--gone)',
				},
				palette
			)
		).toEqual( {
			words: 'a',
			type: undefined,
			hold: undefined,
			caret: undefined,
		} );
		expect( attributesToDraft() ).toEqual( {
			words: '',
			type: undefined,
			hold: undefined,
			caret: undefined,
		} );
	} );

	it( 'round-trips through draftToAttributes', () => {
		const saved = {
			words: 'potter, weaver',
			type: '80',
			hold: '1500',
			caret: '#abcdef',
		};

		expect(
			draftToAttributes( attributesToDraft( saved, palette ), palette )
		).toEqual( saved );
	} );
} );
