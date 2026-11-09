#!/usr/bin/env bash
#
# Checks that the version number agrees everywhere it is written.
#
# It lives in five places: the plugin header, the RETYPE_VERSION constant, the
# readme.txt Stable tag, package.json, and the Git tag. A release where they
# disagree ships a package the plugin directory reads one way and the update
# checker another, and that can only be fixed with another release. Hence a
# blocking check that runs BEFORE anything touches the SVN repository.
#
# Usage: scripts/check-versions.sh [plugin-dir] [git-tag]
# Without a tag, the other four are compared with the plugin header.

set -euo pipefail

SRC="$(cd "${1:-$PWD}" && pwd)"
TAG="${2:-}"
cd "$SRC"

MAIN="retype.php"
[ -f "$MAIN" ] || { echo "No $MAIN in $SRC." >&2; exit 1; }

HEADER="$(sed -n 's/^[[:space:]]*\*[[:space:]]*Version:[[:space:]]*\(.*\)$/\1/p' "$MAIN" | head -n1 | tr -d '[:space:]')"
CONSTANT="$(sed -n "s/^define( 'RETYPE_VERSION', '\([^']*\)' );$/\1/p" "$MAIN" | head -n1)"
STABLE="$(sed -n 's/^Stable tag:[[:space:]]*\(.*\)$/\1/p' readme.txt | head -n1 | tr -d '[:space:]')"
PACKAGE="$(node -p 'require("./package.json").version || ""' 2>/dev/null || true)"

if [ -n "$TAG" ] && [[ ! "$TAG" =~ ^v[0-9]+\.[0-9]+\.[0-9]+([-.][0-9A-Za-z.]+)?$ ]]; then
	echo "Tag '$TAG' is not of the form vX.Y.Z." >&2
	exit 1
fi

REF="${TAG#v}"
[ -n "$REF" ] || REF="$HEADER"

printf 'Reference ................ %s\n' "$REF"
printf 'Plugin header ............ %s\n' "${HEADER:-(missing)}"
printf 'RETYPE_VERSION ........... %s\n' "${CONSTANT:-(missing)}"
printf 'readme.txt Stable tag .... %s\n' "${STABLE:-(missing)}"
printf 'package.json ............. %s\n' "${PACKAGE:-(missing)}"

STATUS=0
for pair in "plugin header:$HEADER" "RETYPE_VERSION:$CONSTANT" "readme.txt Stable tag:$STABLE" "package.json version:$PACKAGE"; do
	label="${pair%%:*}"
	value="${pair#*:}"
	if [ -z "$value" ]; then
		echo "Could not read the version from the $label." >&2
		STATUS=1
	elif [ "$value" != "$REF" ]; then
		echo "The $label says '$value', expected '$REF'." >&2
		STATUS=1
	fi
done

# 'trunk' is refused for a new plugin, and it would make the directory serve
# whatever is in trunk instead of this release.
if [ "$STABLE" = "trunk" ]; then
	echo "readme.txt Stable tag is 'trunk'." >&2
	STATUS=1
fi

# Checked here rather than when the GitHub release is created: once the package
# is on wordpress.org, a missing changelog section can only be fixed by shipping
# another version.
if ! grep -qF "## [$REF]" CHANGELOG.md; then
	echo "CHANGELOG.md has no '## [$REF]' section." >&2
	STATUS=1
fi

if ! grep -qF "= $REF =" readme.txt; then
	echo "readme.txt has no '= $REF =' changelog entry." >&2
	STATUS=1
fi

[ "$STATUS" -eq 0 ] || exit 1
echo "Every version agrees on $REF."
