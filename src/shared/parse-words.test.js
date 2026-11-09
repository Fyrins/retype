import { parseWords } from './parse-words';

describe( 'parseWords', () => {
	it( 'splits on commas and trims each word', () => {
		expect( parseWords( ' baker,potter , beekeeper ' ) ).toEqual( [
			'baker',
			'potter',
			'beekeeper',
		] );
	} );

	it( 'drops empty entries', () => {
		expect( parseWords( 'a,, ,b,' ) ).toEqual( [ 'a', 'b' ] );
	} );

	it( 'removes duplicates case-insensitively and keeps the first one', () => {
		expect( parseWords( 'Baker, baker, potter, BAKER' ) ).toEqual( [
			'Baker',
			'potter',
		] );
	} );

	it( 'compares accented words case-insensitively too', () => {
		expect( parseWords( 'Éleveur, éleveur' ) ).toEqual( [ 'Éleveur' ] );
	} );

	it( 'keeps multi-word entries and collapses inner whitespace', () => {
		expect( parseWords( 'cheese   maker\tof  the hills' ) ).toEqual( [
			'cheese maker of the hills',
		] );
	} );

	it( 'returns an empty list for missing or non-string input', () => {
		expect( parseWords( '' ) ).toEqual( [] );
		expect( parseWords( ',,,' ) ).toEqual( [] );
		expect( parseWords( null ) ).toEqual( [] );
		expect( parseWords( undefined ) ).toEqual( [] );
		expect( parseWords( 42 ) ).toEqual( [] );
		expect( parseWords( [ 'a', 'b' ] ) ).toEqual( [] );
	} );

	it( 'leaves markup as plain text, since it is only ever inserted as text', () => {
		expect( parseWords( '<b>bold</b>, x' ) ).toEqual( [
			'<b>bold</b>',
			'x',
		] );
	} );
} );
