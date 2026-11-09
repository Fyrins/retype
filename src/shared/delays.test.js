import { describe, it, expect } from 'vitest';

import {
	DEFAULT_DELAYS,
	readDelay,
	readDelays,
	readElementDelays,
} from './delays';

describe( 'readDelays', () => {
	it( 'returns the defaults when nothing is given', () => {
		expect( readDelays( undefined ) ).toEqual( DEFAULT_DELAYS );
		expect( readDelays( null ) ).toEqual( DEFAULT_DELAYS );
		expect( readDelays( {} ) ).toEqual( DEFAULT_DELAYS );
		expect( readDelays( 'fast' ) ).toEqual( DEFAULT_DELAYS );
	} );

	it( 'keeps valid values and fills in missing keys', () => {
		expect( readDelays( { type: 120 } ) ).toEqual( {
			type: 120,
			erase: 20,
			hold: 1200,
		} );
	} );

	it( 'accepts numeric strings and rounds', () => {
		expect( readDelays( { erase: ' 55.6 ', hold: '2500' } ) ).toEqual( {
			type: 40,
			erase: 56,
			hold: 2500,
		} );
	} );

	it( 'confines values to their bounds', () => {
		expect( readDelays( { type: 0, erase: -5, hold: 1e9 } ) ).toEqual( {
			type: 10,
			erase: 10,
			hold: 60000,
		} );
	} );

	it( 'falls back to the default on anything that is not a finite number', () => {
		expect(
			readDelays( {
				type: Infinity,
				erase: NaN,
				hold: [ 3000 ],
			} )
		).toEqual( DEFAULT_DELAYS );
		expect( readDelays( { type: '', erase: 'slow', hold: true } ) ).toEqual(
			DEFAULT_DELAYS
		);
	} );
} );

describe( 'readDelays with a fallback', () => {
	it( 'fills missing or invalid keys from the fallback', () => {
		const site = { type: 90, erase: 30, hold: 2500 };

		expect( readDelays( { type: 'x', hold: 400 }, site ) ).toEqual( {
			type: 90,
			erase: 30,
			hold: 400,
		} );
	} );
} );

describe( 'readDelay', () => {
	it( 'returns undefined for anything that is not a finite number', () => {
		[
			undefined,
			null,
			'',
			' ',
			'abc',
			'60ms',
			NaN,
			Infinity,
			{},
			[],
		].forEach( ( value ) =>
			expect( readDelay( 'type', value ) ).toBeUndefined()
		);
	} );

	it( 'bounds and rounds like readDelays', () => {
		expect( readDelay( 'type', '5' ) ).toBe( 10 );
		expect( readDelay( 'hold', 99999 ) ).toBe( 60000 );
		expect( readDelay( 'erase', 33.4 ) ).toBe( 33 );
	} );
} );

describe( 'readElementDelays', () => {
	const site = { type: 40, erase: 20, hold: 1200 };

	it( 'uses the site delays when the word sets nothing', () => {
		expect( readElementDelays( {}, site ) ).toEqual( site );
		expect( readElementDelays( undefined, site ) ).toEqual( site );
	} );

	it( 'reads the typing delay and the pause from the data attributes', () => {
		expect(
			readElementDelays( { retypeType: '100', retypeHold: '3000' }, site )
		).toEqual( { type: 100, erase: 50, hold: 3000 } );
	} );

	it( 'keeps the site ratio between typing and erasing', () => {
		expect(
			readElementDelays(
				{ retypeType: '90' },
				{ type: 60, erase: 60, hold: 1200 }
			)
		).toEqual( { type: 90, erase: 90, hold: 1200 } );
	} );

	it( 'applies the same bounds as readDelays', () => {
		expect(
			readElementDelays( { retypeType: '1', retypeHold: '1e9' }, site )
		).toEqual( { type: 10, erase: 10, hold: 60000 } );
		expect( readElementDelays( { retypeType: '5000' }, site ) ).toEqual( {
			type: 2000,
			erase: 1000,
			hold: 1200,
		} );
	} );

	it( 'ignores invalid values', () => {
		expect(
			readElementDelays(
				{ retypeType: 'fast', retypeHold: '' },
				{ type: 70, erase: 35, hold: 900 }
			)
		).toEqual( { type: 70, erase: 35, hold: 900 } );
	} );
} );
