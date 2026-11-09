import { parseWords } from '../shared/parse-words';
import { readDelays } from '../shared/delays';
import '../style.scss';

/**
 * Replaces the content of a `.retype` span with the animated markup and starts
 * the loop.
 *
 * Every piece of text is inserted through `textContent`. Nothing read from
 * `data-retype-words` is ever parsed as HTML.
 *
 * @param {HTMLElement}                                 el     The `.retype` span.
 * @param {{type: number, erase: number, hold: number}} delays Delays in milliseconds.
 * @return {Function|undefined} A function that stops the animation and restores the word, or nothing if the span cannot be animated.
 */
function animate( el, delays ) {
	const original = el.textContent.trim();
	const others = parseWords( el.dataset.retypeWords ).filter(
		( word ) => word.toLocaleLowerCase() !== original.toLocaleLowerCase()
	);

	if ( original === '' || others.length === 0 ) {
		return;
	}

	// Array.from splits on code points, so an emoji or an accented letter
	// typed as two code units is never cut in half.
	const words = [ original, ...others ].map( ( word ) => Array.from( word ) );
	const longest = [ original, ...others ].reduce( ( a, b ) =>
		b.length > a.length ? b : a
	);

	// Screen readers read the original word, once. The word being typed is
	// hidden from them, otherwise every letter would be a change to announce.
	const sr = document.createElement( 'span' );
	sr.className = 'retype__sr';
	sr.textContent = original;

	// The longest word, invisible, reserves the width so the line does not
	// move while the visible word grows and shrinks.
	const sizer = document.createElement( 'span' );
	sizer.className = 'retype__sizer';
	sizer.setAttribute( 'aria-hidden', 'true' );
	sizer.textContent = longest;

	const word = document.createElement( 'span' );
	word.className = 'retype__word';
	word.setAttribute( 'aria-hidden', 'true' );
	word.textContent = original;

	el.replaceChildren( sr, sizer, word );
	el.classList.add( 'is-animated' );

	let index = 0;
	let length = words[ 0 ].length;
	let phase = 'hold';
	let timer = 0;
	let inView = true;

	const render = () => {
		word.textContent = words[ index ].slice( 0, length ).join( '' );
	};

	const step = () => {
		let delay;

		if ( phase === 'hold' ) {
			phase = 'erase';
			delay = delays.erase;
		} else if ( phase === 'erase' ) {
			if ( length > 0 ) {
				length -= 1;
				render();
				delay = delays.erase;
			} else {
				index = ( index + 1 ) % words.length;
				phase = 'type';
				delay = delays.type;
			}
		} else if ( length < words[ index ].length ) {
			length += 1;
			render();
			phase = length === words[ index ].length ? 'hold' : 'type';
			delay = phase === 'hold' ? delays.hold : delays.type;
		}

		timer = window.setTimeout( step, delay );
	};

	const start = () => {
		if ( ! timer && inView && ! document.hidden ) {
			timer = window.setTimeout( step, delays.hold );
		}
	};

	const stop = () => {
		window.clearTimeout( timer );
		timer = 0;
	};

	// No work while the tab is hidden or the word is off screen.
	const onVisibility = () => ( document.hidden ? stop() : start() );
	document.addEventListener( 'visibilitychange', onVisibility );

	let observer;
	if ( 'IntersectionObserver' in window ) {
		observer = new window.IntersectionObserver( ( [ entry ] ) => {
			inView = entry.isIntersecting;
			return inView ? start() : stop();
		} );
		observer.observe( el );
	}

	start();

	return () => {
		stop();
		document.removeEventListener( 'visibilitychange', onVisibility );
		observer?.disconnect();
		el.classList.remove( 'is-animated' );
		el.textContent = original;
	};
}

function init() {
	const reduced = window.matchMedia( '(prefers-reduced-motion: reduce)' );
	const delays = readDelays( window.retypeDelays );
	const stops = new Map();

	const run = () => {
		if ( reduced.matches ) {
			return;
		}

		document
			.querySelectorAll( '.retype[data-retype-words]' )
			.forEach( ( el ) => {
				if ( ! stops.has( el ) ) {
					const stop = animate( el, delays );
					if ( stop ) {
						stops.set( el, stop );
					}
				}
			} );
	};

	// A visitor who turns on reduced motion while reading gets the original
	// word back straight away.
	reduced.addEventListener( 'change', () => {
		if ( reduced.matches ) {
			stops.forEach( ( stop ) => stop() );
			stops.clear();
		} else {
			run();
		}
	} );

	run();
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', init );
} else {
	init();
}
