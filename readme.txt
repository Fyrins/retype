=== Retype ===
Contributors: fyrins
Tags: typewriter, typing effect, text animation, rich text, block editor
Requires at least: 6.6
Tested up to: 7.1
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPL-2.0-or-later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Select a word in the block editor, list a few others, and on your site the word erases and retypes itself, letter by letter, in a loop.

== Description ==

Retype adds one entry to the formatting toolbar of the block editor, in the "More" dropdown next to Highlight and Inline code. Select a word in a heading or a paragraph, choose Retype, type a few words separated by commas, and apply. The same popover can set, for that word only, the typing speed, the pause on each word and the color of the caret.

On the front end the selected word is shown first. After a pause it is erased letter by letter, the next word of the list is typed in its place, and the cycle goes on. A thin caret blinks at the end of the word while it types.

`We help every <baker, potter, beekeeper> find their customers.`

There is no settings page, no option in your database, no account and no outgoing request.

**How it behaves**

* The word takes its real width as it is typed, so the text that follows it moves along with the writing.
* A word that is entirely bold, italic or a link keeps that formatting while it is retyped. A word formatted only in part is left still.
* Words added to the page after it loads, by a "load more" button for instance, are animated too.
* The animation pauses when the browser tab is hidden or the word is scrolled out of view, and resumes when it comes back.
* Nothing loads on pages that do not use the format. Where it is used, the front end gets a script of about 5 KB, loaded with `defer` in the footer, and a stylesheet under 1 KB.
* The words are inserted as text, never as HTML.
* The saved markup is a plain `<span>` with a class and a data attribute. If you deactivate the plugin, the selected word simply stays in the sentence, and no block is invalidated.

**Accessibility**

No plugin can make a site accessible on its own, and this one does not claim to. What it does, within its scope:

* Screen readers are given the original word, once. The letters being typed are hidden from them, so a screen reader user hears a normal sentence rather than a stream of changes.
* Visitors who ask their system to reduce motion see the original word, with no animation and no blinking caret. If they turn the setting on while reading, the animation stops and the original word comes back.
* Without JavaScript, the original word is shown as plain text.

The animation loops for as long as the word is on screen, and the plugin offers no pause button. Moving content that starts on its own is something to use sparingly: one animated word per page, short words, and not in the middle of text people need to read. Whether it fits your site and its obligations is your call.

**Timing and caret color**

Each word can have its own typing speed, pause and caret color, set in the popover. Words without settings follow the site defaults, which a developer can change with the `retype_delays` filter. See the FAQ.

**Source code and build**

The scripts and stylesheets shipped in `build/` are compiled from the `src/` directory of the public repository, with [@wordpress/scripts](https://www.npmjs.com/package/@wordpress/scripts), the build tool maintained by the WordPress project:

https://github.com/Fyrins/retype

To reproduce the shipped files:

`git clone https://github.com/Fyrins/retype.git
cd retype
npm install
npm run build`

== Installation ==

1. In your admin, go to Plugins, then Add New Plugin, and search for Retype.
2. Install and activate it.
3. Edit a post, select a word in a heading or a paragraph, open the "More" dropdown of the formatting toolbar, and choose Retype.

There is nothing to configure afterwards.

== Frequently Asked Questions ==

= How do I edit the list of words? =

Click inside the word and choose Retype again. The popover opens with the current list. Remove format turns the word back into ordinary text. An empty list does the same.

= Which word is shown first? =

The one you selected in the editor. It is also the word screen readers read and the word shown to visitors who prefer reduced motion, so pick the one that makes the sentence work on its own.

= Can I change the speed? =

For one word, in the popover: "Typing delay per letter" is in milliseconds, lower is faster, and erasing speeds up or slows down in proportion. "Pause on each word" is in seconds. Reset brings a setting back to the site default.

For the whole site, use the `retype_delays` filter, in your theme's `functions.php` or a small plugin of your own. Values are in milliseconds:

`add_filter( 'retype_delays', function ( $delays ) {
	$delays['type']  = 90;   // per letter while typing, default 40
	$delays['erase'] = 30;   // per letter while erasing, default 20
	$delays['hold']  = 2500; // pause on each word, default 1200
	return $delays;
} );`

Missing keys keep their default. `type` and `erase` are kept between 10 and 2000, `hold` between 200 and 60000, and anything that is not a number falls back to the default.

A script of your own can also set `window.retypeDelays` before the plugin's script runs, with the same keys and the same limits. The settings of a word in the popover take precedence over both.

= Can the caret have its own color? =

Yes. The popover offers the colors of your theme's palette. A palette color is saved as a reference to the theme color, so the caret follows it if the theme changes it. Clear the color and the caret takes the color of the text.

= Where are the settings of a word stored? =

In the post content, as data attributes of the word's `<span>`: `data-retype-type` and `data-retype-hold` in milliseconds, `data-retype-caret` for the color. Nothing goes to the database besides your post. Values out of range are confined to the same limits as the filter, and a color that is not a hex, `rgb()`, `hsl()` or theme palette color is ignored.

= Can a retyped word be bold or a link? =

Yes, if the whole word is: the formatting stays and only the letters change. If only part of the word is formatted, the word is shown as it is, without animation, because it could not be retyped letter by letter without rebuilding your markup.

= Does it work in the site editor and in templates? =

The format is registered for every rich text field of the block editor, so the site editor offers it too, in headings and paragraphs of templates and patterns. On the front end, any rendered block that contains it loads the script.

= The word is cut off on small screens. =

The animated word does not wrap, so a word wider than the screen is clipped. Keep the words short, especially in large headings.

= Does it phone home? =

No. There is no telemetry, no external asset, no outgoing request, and nothing is written to your database.

== Screenshots ==

1. Select a word, choose Retype in the formatting toolbar, type the words to cycle through, and set the speed, the pause and the caret color for that word if you like.
2. On the site, the word is erased and retyped letter by letter, with a blinking caret in the chosen color, and the rest of the sentence follows it.

== Changelog ==

= 1.0.0 =
* First release.
* Retype format for the block editor, with a popover to type the list of words and, for each word, its typing speed, pause and caret color.
* Front-end animation that pauses when the tab is hidden or the word is off screen, and stays still under reduced motion.
* Script and stylesheet loaded only on pages that use the format.
* `retype_delays` filter for the default typing, erasing and pause delays.
* Words added to the page after load are animated, and a word removed from the page stops.

== Upgrade Notice ==

= 1.0.0 =
First release.
