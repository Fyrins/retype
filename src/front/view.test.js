/**
 * Behaviour of the front-end script in jsdom: what it builds, what it leaves
 * alone, and what it restores.
 */

let mediaListeners;
let media;

function load( html ) {
	document.body.innerHTML = html;
	jest.isolateModules( () => {
		require( './view' );
	} );
}

function reduceMotion( matches ) {
	media.matches = matches;
	mediaListeners.forEach( ( listener ) => listener() );
}

const typed = ( el ) =>
	el.querySelector( '.retype__word' )?.textContent ?? null;

beforeEach( () => {
	jest.useFakeTimers();
	mediaListeners = [];
	media = {
		matches: false,
		addEventListener: ( type, listener ) => mediaListeners.push( listener ),
	};
	window.matchMedia = jest.fn( () => media );
	delete window.IntersectionObserver;
	delete window.retypeDelays;
} );

afterEach( () => {
	jest.useRealTimers();
	document.body.innerHTML = '';
} );

describe( 'view', () => {
	it( 'keeps the spaces at the edges out of the animation', () => {
		load(
			'<p>A<span class="retype" data-retype-words="potter"> baker </span>here</p>'
		);
		const el = document.querySelector( '.retype' );

		expect( el.classList.contains( 'is-animated' ) ).toBe( true );
		expect( el.firstChild.textContent ).toBe( ' ' );
		expect( el.lastChild.textContent ).toBe( ' ' );
		expect( el.querySelector( '.retype__sr' ).textContent ).toBe( 'baker' );
		expect( typed( el ) ).toBe( 'baker' );
	} );

	it( 'restores the original content exactly under reduced motion', () => {
		const html =
			'<p>A<span class="retype" data-retype-words="potter" data-retype-caret="#f00" style="color: blue"><strong><a href="#x"> baker </a></strong></span>here</p>';
		load( html );
		const el = document.querySelector( '.retype' );

		expect( el.classList.contains( 'is-animated' ) ).toBe( true );
		jest.advanceTimersByTime( 1500 );
		expect( typed( el ) ).toBe( 'pott' );

		reduceMotion( true );

		expect( document.body.innerHTML ).toBe( html );
	} );

	it( 'animates the text of a word that is also bold or a link, in place', () => {
		load(
			'<span class="retype" data-retype-words="potter"><strong><a href="#x">baker</a></strong></span>'
		);
		const link = document.querySelector( '.retype a' );

		expect( link.closest( 'strong' ) ).not.toBeNull();
		expect( link.querySelector( '.retype__sr' ).textContent ).toBe(
			'baker'
		);
		expect( link.querySelector( '.retype__word' ) ).not.toBeNull();
	} );

	it( 'leaves mixed content alone', () => {
		const html =
			'<span class="retype" data-retype-words="potter">ba<em>ker</em></span>';
		load( html );

		expect( document.body.innerHTML ).toBe( html );
	} );

	it( 'uses the delays of the word, then erases in proportion', () => {
		load(
			'<span class="retype" data-retype-words="ab" data-retype-type="100" data-retype-hold="500">xyz</span>'
		);
		const el = document.querySelector( '.retype' );

		jest.advanceTimersByTime( 499 );
		expect( typed( el ) ).toBe( 'xyz' );
		// Pause, then one erase step of 50 ms per letter.
		jest.advanceTimersByTime( 1 + 50 );
		expect( typed( el ) ).toBe( 'xy' );
		jest.advanceTimersByTime( 50 * 2 );
		expect( typed( el ) ).toBe( '' );
		// Switch to the next word, then 100 ms per typed letter.
		jest.advanceTimersByTime( 50 + 100 );
		expect( typed( el ) ).toBe( 'a' );
	} );

	it( 'types composed characters whole', () => {
		const flag = '\u{1F1EB}\u{1F1F7}';
		load(
			`<span class="retype" data-retype-words="${ flag }${ flag }" data-retype-type="10" data-retype-hold="200">x</span>`
		);
		const el = document.querySelector( '.retype' );

		// Pause, erase one letter, switch word, type one character. Erasing
		// would be 5 ms, half of the typing delay, but stops at the 10 ms bound.
		jest.advanceTimersByTime( 200 + 10 + 10 + 10 );
		expect( typed( el ) ).toBe( flag );
	} );

	it( 'applies a valid caret color as a custom property only', () => {
		load(
			'<span class="retype" data-retype-words="a" data-retype-caret="var(--wp--preset--color--accent-1)">b</span>' +
				'<span class="retype" data-retype-words="a" data-retype-caret="red;background:url(x)">b</span>'
		);
		const [ valid, invalid ] = document.querySelectorAll( '.retype' );

		expect( valid.style.getPropertyValue( '--retype-caret' ) ).toBe(
			'var(--wp--preset--color--accent-1)'
		);
		expect( valid.classList.contains( 'has-retype-caret' ) ).toBe( true );
		expect( invalid.getAttribute( 'style' ) ).toBeNull();
		expect( invalid.classList.contains( 'has-retype-caret' ) ).toBe(
			false
		);
	} );

	it( 'stops a word removed from the page', () => {
		load( '<span class="retype" data-retype-words="a">b</span>' );
		const el = document.querySelector( '.retype' );

		el.remove();
		jest.advanceTimersByTime( 5000 );

		expect( jest.getTimerCount() ).toBe( 0 );
	} );

	it( 'animates a word added after load', async () => {
		load( '<div id="feed"></div>' );

		const added = document.createElement( 'p' );
		added.innerHTML =
			'<span class="retype" data-retype-words="potter">baker</span>';
		document.getElementById( 'feed' ).append( added );
		await Promise.resolve();

		expect(
			added.querySelector( '.retype' ).classList.contains( 'is-animated' )
		).toBe( true );
	} );

	it( 'follows the last intersection entry of a batch', () => {
		let notify;
		window.IntersectionObserver = class {
			constructor( callback ) {
				notify = callback;
			}
			observe() {}
			disconnect() {}
		};

		load( '<span class="retype" data-retype-words="a">b</span>' );
		notify( [ { isIntersecting: true }, { isIntersecting: false } ] );

		expect( jest.getTimerCount() ).toBe( 0 );

		notify( [ { isIntersecting: false }, { isIntersecting: true } ] );

		expect( jest.getTimerCount() ).toBe( 1 );
	} );
} );
