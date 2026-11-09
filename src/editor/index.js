import { registerFormatType } from '@wordpress/rich-text';
import { FORMAT_NAME, formatSettings } from './format';
import { RetypeEdit } from './edit';
import './editor.scss';

registerFormatType( FORMAT_NAME, {
	...formatSettings,
	edit: RetypeEdit,
} );
