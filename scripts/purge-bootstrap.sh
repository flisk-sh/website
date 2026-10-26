#!/usr/bin/env bash
# Regenerate assets/css/bootstrap.purged.min.css: Bootstrap 5.3.2 trimmed to the
# classes the built site uses. Run after adding Bootstrap classes to a page.
# Needs Ruby/Bundler (for the Jekyll build), Node (npx) and curl.
set -euo pipefail

root="$(cd "$(dirname "$0")/.." && pwd)"
work="$(mktemp -d)"
trap 'rm -rf "$work"' EXIT

bundle exec jekyll build --source "$root" --destination "$work/site" >/dev/null

curl -fsSL -o "$work/bootstrap.min.css" \
  https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css
expected="sha384-T3c6CoIi6uLrA9TneNEoa7RxnatzjcDSCmG1MXxSR1GAsXEV/Dwwykc2MPK8M2HN"
actual="sha384-$(openssl dgst -sha384 -binary "$work/bootstrap.min.css" | openssl base64 -A)"
[ "$actual" = "$expected" ] || { echo "bootstrap.min.css hash mismatch: $actual" >&2; exit 1; }

cat > "$work/purgecss.config.cjs" <<CONFIG
module.exports = {
  content: ["$work/site/**/*.html", "$work/site/assets/js/**/*.js"],
  css: ["$work/bootstrap.min.css"],
  // State classes that scripts add at runtime.
  safelist: {
    standard: [/^show$/, /^showing$/, /^hiding$/, /^collapsing$/, /^collapse$/, /^fade$/, /^active$/, /^disabled$/, /^was-validated$/, /^is-(in)?valid$/, /^modal/, /^dropdown/, /^navbar/, /^offcanvas/, /^tooltip/, /^bs-tooltip/, /^popover/, /^bs-popover/, /^toast/],
    greedy: [/data-bs-/, /aria-expanded/],
  },
  variables: true,
  keyframes: true,
  fontFace: true,
  output: "$work/out",
};
CONFIG
mkdir -p "$work/out"
npx --yes purgecss@6.0.0 --config "$work/purgecss.config.cjs"
cp "$work/out/bootstrap.min.css" "$root/assets/css/bootstrap.purged.min.css"
echo "Wrote assets/css/bootstrap.purged.min.css ($(wc -c < "$root/assets/css/bootstrap.purged.min.css") bytes)"
