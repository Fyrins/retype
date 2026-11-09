import { describe, it, expect } from 'vitest';

import { readCaretColor } from './caret';

describe( 'readCaretColor', () => {
	it( 'accepts hex colors', () => {
		[ '#f00', '#f00a', '#FF0000', '#ff000080' ].forEach( ( color ) =>
			expect( readCaretColor( color ) ).toBe( color )
		);
	} );

	it( 'accepts rgb and hsl colors with numeric components', () => {
		[
			'rgb(255, 0, 0)',
			'rgba(255,0,0,0.5)',
			'rgb(255 0 0 / 50%)',
			'hsl(120deg 50% 40%)',
			'hsla(120, 50%, 40%, .3)',
			'HSL(0.5turn none 40%)',
		].forEach( ( color ) =>
			expect( readCaretColor( color ) ).toBe( color )
		);
	} );

	it( 'accepts a color preset of the theme', () => {
		expect( readCaretColor( 'var(--wp--preset--color--accent-1)' ) ).toBe(
			'var(--wp--preset--color--accent-1)'
		);
	} );

	it( 'trims the value', () => {
		expect( readCaretColor( '  #abc ' ) ).toBe( '#abc' );
	} );

	it( 'ignores everything else', () => {
		[
			undefined,
			null,
			42,
			'',
			'red',
			'#ff0000f',
			'#ggg',
			'var(--anything)',
			'var(--wp--preset--color--x, red)',
			'var(--wp--preset--font-size--large)',
			'rgb(var(--x))',
			'rgb(1,2,3); background: red',
			'rgb(1,2,3)) url(x',
			'url(https://example.com/x.png)',
			'expression(alert(1))',
			'hsl(1 2 3)'.padEnd( 70, ' ' ),
			'rgb(1, 2)',
			'rgb(1, 2, 3, 4, 5)',
			'rgb(1 2 3x)',
			'rgb(1..2 3 4)',
		].forEach( ( color ) => expect( readCaretColor( color ) ).toBe( '' ) );
	} );

	it( 'rejects a pathological value quickly', () => {
		const start = Date.now();

		[
			'rgb(' + '1'.repeat( 58 ) + 'x)',
			'rgb(' + '1.1'.repeat( 19 ) + 'x)',
			'hsl(' + '1e1'.repeat( 19 ) + '%x)',
		].forEach( ( color ) => expect( readCaretColor( color ) ).toBe( '' ) );

		expect( Date.now() - start ).toBeLessThan( 50 );
	} );

	it( 'accepts three or four components with any of the separators', () => {
		[
			'rgb(0 0 0)',
			'rgb(0,0,0)',
			'rgb(0 0 0/0.5)',
			'rgba( 10 , 20 , 30 , .5 )',
			'hsl(-120deg +50% 1e1%)',
			'hsl(none 0% 50% / 1)',
		].forEach( ( color ) =>
			expect( readCaretColor( color ) ).toBe( color )
		);
	} );
} );
