import { __ } from '@wordpress/i18n';

export const FORMAT_NAME = 'retype/retype';

/**
 * Format settings without the edit component, shared with `useAnchor`.
 *
 * Everything lives in data attributes of the saved span: the words, and the
 * optional settings of this occurrence (typing delay and pause in
 * milliseconds, caret color). `class` and `data-*` are global attributes for
 * KSES, so the markup survives for authors without `unfiltered_html`, and it
 * changes nothing on the page once the plugin is gone.
 */
export const formatSettings = {
	title: __( 'Retype', 'fyrins-retype' ),
	tagName: 'span',
	className: 'retype',
	attributes: {
		words: 'data-retype-words',
		type: 'data-retype-type',
		hold: 'data-retype-hold',
		caret: 'data-retype-caret',
	},
};
