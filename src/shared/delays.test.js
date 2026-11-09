import { DEFAULT_DELAYS, readDelays } from './delays';

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
			erase: 40,
			hold: 1800,
		} );
	} );

	it( 'accepts numeric strings and rounds', () => {
		expect( readDelays( { erase: ' 55.6 ', hold: '2500' } ) ).toEqual( {
			type: 70,
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
