#!/usr/bin/env bash
# Regenerates the directory banners and icons from the HTML sources in this
# directory. macOS: needs Google Chrome and sips.
#
# The screenshots are not rendered from here: they are captures of a disposable
# WordPress (Twenty Twenty-Five, site renamed "Hillside Studio", no URL on
# screen) taken with Playwright. screenshot-1.png: the editor at 1280x960 with
# the popover reopened on a formatted word. screenshot-2.png: the front end at
# 1280x720, logged out, with page.clock driving the timers to stop on "pot" and
# the caret blink paused so the caret is visible.
set -euo pipefail
cd "$(dirname "$0")"
CHROME="${CHROME:-/Applications/Google Chrome.app/Contents/MacOS/Google Chrome}"
shot() { "$CHROME" --headless=new --hide-scrollbars --force-device-scale-factor=1 \
	--window-size="$2" --screenshot="$3" "file://$PWD/$1" >/dev/null 2>&1; }
shot banner.html 1544,500 ../banner-1544x500.png
sips -z 250 772 ../banner-1544x500.png --out ../banner-772x250.png >/dev/null
shot icon.html 256,256 ../icon-256x256.png
sips -z 128 128 ../icon-256x256.png --out ../icon-128x128.png >/dev/null
sips -g pixelWidth -g pixelHeight ../banner-*.png ../icon-*.png
