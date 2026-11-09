# Changelog

All notable changes to this plugin are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

The user-facing version of this list lives in `readme.txt`, which is what the
plugin directory reads.

## [Unreleased]

## [1.0.0] - 2026-11-09

First release.

### Added

- `retype/retype` rich text format, with a toolbar button and a popover where
  the list of words is typed, comma separated. The button reopens the popover
  on a word that already carries the format, with its current values.
- Settings per word in the popover: delay per typed letter, pause on each word
  and caret color from the theme palette. They are saved as
  `data-retype-type`, `data-retype-hold` (milliseconds) and
  `data-retype-caret` on the span, only when set. Erasing follows the typing
  delay at the site's ratio. Unset values fall back to the `retype_delays`
  filter or `window.retypeDelays`, then to the defaults.
- Front-end animation: the selected word is shown first, then erased and
  retyped letter by letter with each word of the list, in a loop, with a
  blinking caret. Defaults: 40 ms per typed letter, 20 ms per erased letter,
  1.2 s pause.
- The animated word takes its real width, so the text that follows moves along
  with the writing.
- Letters are grapheme clusters (`Intl.Segmenter`, `Array.from` as the
  fallback), so composed emoji, flags and combining accents stay whole.
- Spaces at the edges of the span stay outside the animation. A word that is
  entirely bold, italic or a link is animated inside that markup; a word with
  any other content is not animated.
- Animation paused while the tab is hidden or the word is off screen, using the
  last entry of each `IntersectionObserver` batch. A word removed from the page
  stops; a word added after load, detected by a `MutationObserver` limited to
  added nodes that contain the format, is animated.
- Original word given to screen readers once, the typed letters hidden from
  them, and no animation under `prefers-reduced-motion: reduce`. When the
  preference changes while the page is open, the original content and `style`
  attribute of each span are restored exactly, from a copy taken at start.
- Front-end script and stylesheet enqueued from `render_block`, only on pages
  that contain the format, detected with `WP_HTML_Tag_Processor` as a `span`
  with the `retype` class and the words attribute. The script is deferred and
  printed in the footer.
- `retype_delays` filter, and a `window.retypeDelays` global, for the default
  typing, erasing and pause delays. Values are validated and bounded on both
  sides, per word too. The filtered delays also reach the editor, where the
  popover shows them as defaults.

### Notes

- The saved markup is `<span class="retype" data-retype-words="…">word</span>`,
  plus the optional settings attributes. All of them are global attributes for
  KSES, so authors without `unfiltered_html` can use the format, and
  deactivating the plugin leaves a plain word in the sentence.
- The caret color is validated by the script (hex, `rgb()`, `hsl()` or a theme
  color preset) and applied with `style.setProperty()`.
- Words are only ever inserted as text nodes.
- No option in the database, no settings page, no outgoing request and no
  runtime Composer dependency.
- The scripts and styles are built from `src/` with `@wordpress/scripts`.
  Sources and build instructions are in the repository, linked from
  `readme.txt`.

[Unreleased]: https://github.com/Fyrins/retype/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Fyrins/retype/releases/tag/v1.0.0
