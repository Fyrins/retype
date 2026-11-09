import { parseWords } from '../shared/parse-words';
import { readDelays, readElementDelays } from '../shared/delays';
import { readCaretColor } from '../shared/caret';
import { splitGraphemes } from '../shared/graphemes';
import '../style.scss';

const SELECTOR = '.retype[data-retype-words]';

/**
 * Finds the node whose text can be animated.
 *
 * The word is animated only when its text sits in a single text node: either
 * directly in the span, or at the bottom of a chain of single elements, such
 * as a word that is also bold or a link (`<strong><a>word</a></strong>`).
 * Those elements stay where they are and only their text changes. Any other
 * content, such as a word that is half bold, is left alone: there is no safe
 * way to retype it letter by letter without rebuilding markup the author made.
 *
 * @param {HTMLElement} el The `.retype` span.
 * @return {Element|null} The element holding the text node, or null.
 */
function findTextHost( el ) {
	let host = el;

	while (
		host.childNodes.length === 1 &&
		host.firstChild.nodeType === host.ELEMENT_NODE
	) {
		host = host.firstChild;
	}

	return host.childNodes.length === 1 &&
		host.firstChild.nodeType === host.TEXT_NODE
		? host
		: null;
}

/**
 * Builds the animated markup inside a `.retype` span and starts the loop.
 *
 * Every piece of text is inserted through text nodes. Nothing read from the
 * data attributes is ever parsed as HTML, and the caret color is applied with
 * `style.setProperty()` once validated.
 *
 * @param {HTMLElement}                                 el        The `.retype` span.
 * @param {{type: number, erase: number, hold: number}} base      Site delays.
 * @param {Function}                                    onDispose Called when the span leaves the document.
 * @return {Function|undefined} A function that stops the animation and restores the original content, or nothing if the span cannot be animated.
 */
function animate( el, base, onDispose ) {
	const host = findTextHost( el );

	if ( ! host ) {
		return;
	}

	// Spaces at the edges of the selection stay where they are, outside the
	// animation, so the words around the span keep their spacing.
	const edges = /^(\s*)([\s\S]*?)(\s*)$/.exec( host.textContent );
	const original = edges[ 2 ];
	const others = parseWords( el.dataset.retypeWords ).filter(
		( word ) => word.toLocaleLowerCase() !== original.toLocaleLowerCase()
	);

	if ( original === '' || others.length === 0 ) {
		return;
	}

	const delays = readElementDelays( el.dataset, base );
	const caret = readCaretColor( el.dataset.retypeCaret );
	const words = [ original, ...others ].map( splitGraphemes );

	// Exact copies of what was there, put back when the animation stops.
	const backup = Array.from( el.childNodes, ( node ) =>
		node.cloneNode( true )
	);
	const style = el.getAttribute( 'style' );

	// Screen readers read the original word, once. The word being typed is
	// hidden from them, otherwise every letter would be a change to announce.
	const sr = document.createElement( 'span' );
	sr.className = 'retype__sr';
	sr.textContent = original;

	const text = document.createTextNode( original );
	const word = document.createElement( 'span' );
	word.className = 'retype__word';
	word.setAttribute( 'aria-hidden', 'true' );
	word.append( text );

	host.replaceChildren(
		...[ edges[ 1 ], sr, word, edges[ 3 ] ].filter(
			( part ) => part !== ''
		)
	);
	el.classList.add( 'is-animated' );

	if ( caret ) {
		el.style.setProperty( '--retype-caret', caret );
		el.classList.add( 'has-retype-caret' );
	}

	let index = 0;
	let length = words[ 0 ].length;
	let phase = 'hold';
	let timer = 0;
	let inView = true;
	let observer;

	// Changing the data of the text node, rather than the children of the
	// span, keeps the mutation observer of init() out of the loop.
	const render = () => {
		text.data = words[ index ].slice( 0, length ).join( '' );
	};

	const stop = () => {
		window.clearTimeout( timer );
		timer = 0;
	};

	const onVisibility = () => ( document.hidden ? stop() : start() );

	const release = () => {
		stop();
		document.removeEventListener( 'visibilitychange', onVisibility );
		observer?.disconnect();
	};

	// A span removed from the page, by a script that replaced the content
	// for instance, stops for good and is forgotten.
	const dispose = () => {
		release();
		onDispose( el );
	};

	const step = () => {
		if ( ! el.isConnected ) {
			dispose();
			return;
		}

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

	function start() {
		if ( ! timer && inView && ! document.hidden ) {
			timer = window.setTimeout( step, delays.hold );
		}
	}

	// No work while the tab is hidden or the word is off screen.
	document.addEventListener( 'visibilitychange', onVisibility );

	if ( 'IntersectionObserver' in window ) {
		observer = new window.IntersectionObserver( ( entries ) => {
			if ( ! el.isConnected ) {
				dispose();
				return;
			}

			// Several entries can be queued for the same span; the last one is
			// the current state.
			inView = entries[ entries.length - 1 ].isIntersecting;
			return inView ? start() : stop();
		} );
		observer.observe( el );
	}

	start();

	return () => {
		release();
		el.classList.remove( 'is-animated', 'has-retype-caret' );

		if ( style === null ) {
			el.removeAttribute( 'style' );
		} else {
			el.setAttribute( 'style', style );
		}

		el.replaceChildren( ...backup );
	};
}

/**
 * Whether a node added to the page is, or contains, a retyped word.
 *
 * @param {Node} node Added node.
 * @return {boolean} True when there is something to animate.
 */
function holdsFormat( node ) {
	return (
		node.nodeType === node.ELEMENT_NODE &&
		( node.matches( SELECTOR ) || node.querySelector( SELECTOR ) !== null )
	);
}

function init() {
	const reduced = window.matchMedia( '(prefers-reduced-motion: reduce)' );
	const base = readDelays( window.retypeDelays );
	const stops = new Map();
	const forget = ( el ) => stops.delete( el );

	const run = () => {
		if ( reduced.matches ) {
			return;
		}

		document.querySelectorAll( SELECTOR ).forEach( ( el ) => {
			if ( ! stops.has( el ) ) {
				const stop = animate( el, base, forget );
				if ( stop ) {
					stops.set( el, stop );
				}
			}
		} );
	};

	// A visitor who turns on reduced motion while reading gets the original
	// content back straight away, exactly as it was.
	reduced.addEventListener( 'change', () => {
		if ( reduced.matches ) {
			stops.forEach( ( stop ) => stop() );
			stops.clear();
		} else {
			run();
		}
	} );

	run();

	// Content added after load, by infinite scroll or a "load more" button,
	// is animated too. Only additions that contain the format trigger a scan.
	if ( 'MutationObserver' in window ) {
		new window.MutationObserver( ( records ) => {
			if (
				records.some( ( record ) =>
					Array.prototype.some.call( record.addedNodes, holdsFormat )
				)
			) {
				run();
			}
		} ).observe( document.body, { childList: true, subtree: true } );
	}
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', init );
} else {
	init();
}
