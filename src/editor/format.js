import { __ } from '@wordpress/i18n';

export const FORMAT_NAME = 'retype/retype';

/**
 * Format settings without the edit component, shared with `useAnchor`.
 *
 * The words live in a data attribute of the saved span. `class` and `data-*`
 * are global attributes for KSES, so the markup survives for authors without
 * `unfiltered_html`.
 */
export const formatSettings = {
	title: __( 'Retype', 'retype' ),
	tagName: 'span',
	className: 'retype',
	attributes: {
		words: 'data-retype-words',
	},
};
