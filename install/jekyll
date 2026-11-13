#!/bin/sh
# Adds Flisk Analytics to a Jekyll site: writes _includes/flisk-analytics.html and puts the include in the layout's head.
# Usage: curl -fsSL https://flisk.sh/install/jekyll | sh -s -- example.com
# Safe to run twice. Changes only those two files. Prints what it did.
set -eu
DOMAIN="${1:-}"
[ -n "$DOMAIN" ] || { echo "usage: sh -s -- example.com" >&2; exit 2; }
case "$DOMAIN" in *[!a-zA-Z0-9.-]*|.*|*.) echo "not a domain: $DOMAIN" >&2; exit 2;; esac
[ -f _config.yml ] || { echo "run this in the root of a Jekyll site (no _config.yml here)" >&2; exit 1; }

mkdir -p _includes
cat > _includes/flisk-analytics.html <<INC
<script defer data-domain="$DOMAIN" src="https://flisk.sh/a.js"></script>
INC
echo "wrote _includes/flisk-analytics.html"

LAYOUT=""
for f in _layouts/default.html _layouts/base.html _layouts/compress.html; do [ -f "$f" ] && { LAYOUT="$f"; break; }; done
[ -n "$LAYOUT" ] || { echo "no layout found. Add {% include flisk-analytics.html %} inside <head> yourself." ; exit 0; }
if grep -q "flisk-analytics.html" "$LAYOUT"; then echo "$LAYOUT already has it"; exit 0; fi
if ! grep -q "</head>" "$LAYOUT"; then echo "no </head> in $LAYOUT. Add {% include flisk-analytics.html %} inside <head> yourself."; exit 0; fi
TMP="$(mktemp)"
awk '/<\/head>/ && !done { print "  {% include flisk-analytics.html %}"; done=1 } { print }' "$LAYOUT" > "$TMP" && cat "$TMP" > "$LAYOUT" && rm -f "$TMP"
echo "added the include to $LAYOUT"
echo "Done. Push the site, then open it once and check the dashboard."
