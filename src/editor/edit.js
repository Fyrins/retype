import { __ } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { RichTextToolbarButton } from '@wordpress/block-editor';
import {
	applyFormat,
	removeFormat,
	isCollapsed,
	useAnchor,
} from '@wordpress/rich-text';
import { Button, Popover, TextControl } from '@wordpress/components';
import { parseWords } from '../shared/parse-words';
import { FORMAT_NAME, formatSettings } from './format';

/**
 * Toolbar button and the popover where the list of words is typed.
 *
 * On a word that already carries the format, the button reopens the popover
 * with the current list.
 *
 * @param {Object}   props
 * @param {boolean}  props.isActive         The caret is inside a retyped word.
 * @param {Object}   props.value            RichText value (text, formats, selection).
 * @param {Function} props.onChange         Replaces the RichText value.
 * @param {Object}   props.contentRef       Editable element, the popover anchor.
 * @param {Object}   props.activeAttributes Attributes of the active format.
 */
export function RetypeEdit( {
	isActive,
	value,
	onChange,
	contentRef,
	activeAttributes,
} ) {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ draft, setDraft ] = useState( '' );

	const popoverAnchor = useAnchor( {
		editableContentElement: contentRef.current,
		settings: { ...formatSettings, isActive },
	} );

	const open = () => {
		setDraft( activeAttributes?.words ?? '' );
		setIsOpen( true );
	};

	const close = () => setIsOpen( false );

	const apply = ( event ) => {
		event.preventDefault();

		const words = parseWords( draft );

		if ( words.length === 0 ) {
			onChange( removeFormat( value, FORMAT_NAME ) );
		} else {
			onChange(
				applyFormat( value, {
					type: FORMAT_NAME,
					attributes: { words: words.join( ', ' ) },
				} )
			);
		}

		close();
	};

	const remove = () => {
		onChange( removeFormat( value, FORMAT_NAME ) );
		close();
	};

	return (
		<>
			<RichTextToolbarButton
				icon="controls-repeat"
				title={ formatSettings.title }
				onClick={ open }
				isActive={ isActive }
				isDisabled={ ! isActive && isCollapsed( value ) }
				role="menuitemcheckbox"
			/>
			{ isOpen && (
				<Popover
					anchor={ popoverAnchor }
					placement="bottom"
					focusOnMount="firstElement"
					onClose={ close }
				>
					<form
						onSubmit={ apply }
						style={ { padding: '16px', width: '320px' } }
					>
						<TextControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __(
								'Words to type, separated by commas',
								'retype'
							) }
							help={ __(
								'The selected word shows first, then each word of the list, in a loop.',
								'retype'
							) }
							value={ draft }
							onChange={ setDraft }
						/>
						<div
							style={ {
								display: 'flex',
								gap: '8px',
								marginTop: '12px',
							} }
						>
							<Button variant="primary" type="submit">
								{ __( 'Apply', 'retype' ) }
							</Button>
							{ isActive && (
								<Button
									variant="tertiary"
									isDestructive
									onClick={ remove }
								>
									{ __( 'Remove format', 'retype' ) }
								</Button>
							) }
						</div>
					</form>
				</Popover>
			) }
		</>
	);
}
