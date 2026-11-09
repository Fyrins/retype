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
  on a word that already carries the format.
- Front-end animation: the selected word is shown first, then erased and
  retyped letter by letter with each word of the list, in a loop, with a
  blinking caret.
- Width of the longest word reserved, so the surrounding text does not move.
- Animation paused while the tab is hidden or the word is off screen.
- Original word given to screen readers once, the typed letters hidden from
  them, and no animation under `prefers-reduced-motion: reduce`, including when
  the preference changes while the page is open.
- Front-end script and stylesheet enqueued from `render_block`, only on pages
  that contain the format. The script is deferred and printed in the footer.
- `retype_delays` filter, and a `window.retypeDelays` global, for the typing,
  erasing and pause delays. Values are validated and bounded on both sides.

### Notes

- The saved markup is `<span class="retype" data-retype-words="…">word</span>`.
  Both attributes are global attributes for KSES, so authors without
  `unfiltered_html` can use the format, and deactivating the plugin leaves a
  plain word in the sentence.
- Words are only ever inserted with `textContent`.
- No option in the database, no settings page, no outgoing request and no
  runtime Composer dependency.
- The scripts and styles are built from `src/` with `@wordpress/scripts`.
  Sources and build instructions are in the repository, linked from
  `readme.txt`.

[Unreleased]: https://github.com/Fyrins/retype/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/Fyrins/retype/releases/tag/v1.0.0
