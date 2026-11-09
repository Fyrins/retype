import { __, sprintf } from '@wordpress/i18n';
import { useState } from '@wordpress/element';
import { RichTextToolbarButton, useSettings } from '@wordpress/block-editor';
import {
	applyFormat,
	removeFormat,
	isCollapsed,
	useAnchor,
} from '@wordpress/rich-text';
import {
	BaseControl,
	Button,
	ColorPalette,
	Popover,
	RangeControl,
	TextControl,
} from '@wordpress/components';
import { readDelays } from '../shared/delays';
import { FORMAT_NAME, formatSettings } from './format';
import { attributesToDraft, draftToAttributes } from './settings';

/**
 * Toolbar button and the popover where the list of words and the settings of
 * this occurrence are typed.
 *
 * On a word that already carries the format, the button reopens the popover
 * with the current values.
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
	const [ draft, setDraft ] = useState( {} );
	// Only the theme palette is offered: a color the theme defines is one
	// that suits it, and the popover stays compact.
	const [ palette ] = useSettings( 'color.palette' );

	const popoverAnchor = useAnchor( {
		editableContentElement: contentRef.current,
		settings: { ...formatSettings, isActive },
	} );

	// The site delays, from the `retype_delays` filter when it changes them.
	const site = readDelays( window.retypeDelays );

	const update = ( key ) => ( next ) =>
		setDraft( ( current ) => ( { ...current, [ key ]: next } ) );

	const open = () => {
		setDraft(
			attributesToDraft( isActive ? activeAttributes : {}, palette )
		);
		setIsOpen( true );
	};

	const close = () => setIsOpen( false );

	const apply = ( event ) => {
		event.preventDefault();

		const attributes = draftToAttributes( draft, palette );

		onChange(
			attributes
				? applyFormat( value, { type: FORMAT_NAME, attributes } )
				: removeFormat( value, FORMAT_NAME )
		);

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
						style={ {
							display: 'grid',
							gap: '16px',
							padding: '16px',
							width: '320px',
						} }
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
							value={ draft.words ?? '' }
							onChange={ update( 'words' ) }
						/>
						<RangeControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __(
								'Typing delay per letter (ms)',
								'retype'
							) }
							help={ sprintf(
								/* translators: %d: default delay per typed letter, in milliseconds. */
								__(
									'Lower is faster, and erasing follows in proportion. Default: %d ms.',
									'retype'
								),
								site.type
							) }
							value={ draft.type }
							onChange={ update( 'type' ) }
							min={ 10 }
							max={ 300 }
							step={ 5 }
							initialPosition={ site.type }
							allowReset
						/>
						<RangeControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Pause on each word (s)', 'retype' ) }
							help={ sprintf(
								/* translators: %s: default pause on each word, in seconds. */
								__( 'Default: %s s.', 'retype' ),
								new Intl.NumberFormat(
									document.documentElement.lang || undefined
								).format( site.hold / 1000 )
							) }
							value={ draft.hold }
							onChange={ update( 'hold' ) }
							min={ 0.2 }
							max={ 10 }
							step={ 0.1 }
							initialPosition={ site.hold / 1000 }
							allowReset
						/>
						<div>
							<BaseControl.VisualLabel id="retype-caret-label">
								{ __( 'Caret color', 'retype' ) }
							</BaseControl.VisualLabel>
							<ColorPalette
								aria-labelledby="retype-caret-label"
								colors={ palette ?? [] }
								disableCustomColors
								value={ draft.caret }
								onChange={ update( 'caret' ) }
								clearable
							/>
							<p
								className="components-base-control__help"
								style={ { marginBlockEnd: 0 } }
							>
								{ __(
									'Without a color, the caret takes the color of the text.',
									'retype'
								) }
							</p>
						</div>
						<div style={ { display: 'flex', gap: '8px' } }>
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
