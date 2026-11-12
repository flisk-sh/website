#!/usr/bin/env bash
# The one check command: CI (.github/workflows/site.yml) runs exactly this, and so should you before a pull request.
#   scripts/check.sh
# Needs Ruby 3.3 with `bundle install` done, and Node 22. Set SKIP_SYNC_CHECK=1 to skip the one step that needs the
# network (the synced llms text is compared with https://demo.flisk.si/llms-demos.txt).
set -euo pipefail
cd "$(dirname "$0")/.."

step() { printf '\n==> %s\n' "$*"; }

step "Node tests (every scripts/*.test.mjs)"
node --test scripts/*.test.mjs

step "Check every corner radius is the sharp token"
node scripts/check-radius.mjs

step "Check registered public claims"
node scripts/check-claims.mjs

step "Ruby tests that read source files"
ruby test/nav_data_test.rb

if [ "${SKIP_SYNC_CHECK:-}" = "1" ]; then
  step "Synced llms text (skipped: SKIP_SYNC_CHECK=1)"
else
  step "Synced llms text matches demo.flisk.si"
  node scripts/sync-llms-demos.mjs --check
fi

step "Build site"
bundle exec jekyll build

step "Check every built page for forbidden claims"
node scripts/check-claims.mjs --built

step "Ruby tests that read _site/"
ruby test/licensing_copy_test.rb

printf '\nAll checks passed.\n'
