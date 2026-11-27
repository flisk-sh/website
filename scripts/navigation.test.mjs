// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT
//   node --test scripts/navigation.test.mjs
// Header GitHub link: displays verified project version rather than an early-stage star count (Issue #122).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const root = new URL('..', import.meta.url);
const read = (p) => readFileSync(new URL(p, root), 'utf8');

test('flisk.yml declares a verified cli_version', () => {
  const fliskYaml = read('_data/flisk.yml');
  const match = fliskYaml.match(/^cli_version:\s*["']?([^"'\s\n#]+)["']?/m);
  assert.ok(match, 'cli_version must be defined in _data/flisk.yml');
  const version = match[1];
  assert.match(version, /^\d+\.\d+\.\d+$/, `cli_version "${version}" must follow semantic versioning`);
});

test('navigation header displays the CLI version next to GitHub icon', () => {
  const navHtml = read('_includes/navigation.html');
  const fliskYaml = read('_data/flisk.yml');
  const version = fliskYaml.match(/^cli_version:\s*["']?([^"'\s\n#]+)["']?/m)[1];

  // GitHub repository link intact
  assert.match(navHtml, /href="https:\/\/github\.com\/flisk-sh\/flisk-cli"/, 'must link to the flisk-cli repo');
  assert.match(navHtml, /class="[^"]*\baw-nav-star\b[^"]*"/, 'must keep .aw-nav-star button class');
  assert.match(navHtml, /target="_blank"/, 'must open in a new tab');
  assert.match(navHtml, /rel="noopener"/, 'must have rel="noopener"');

  // Renders the version badge from data
  assert.match(navHtml, /class="aw-nav-version"[^>]*>v\{\{\s*site\.data\.flisk\.cli_version\s*\}\}<\/span>/,
    'must render the version span with site.data.flisk.cli_version');

  // Accessible aria-label includes the version
  assert.match(navHtml, /aria-label="[^"]*v\{\{\s*site\.data\.flisk\.cli_version\s*\}\}[^"]*"/,
    'aria-label must include the version');

  // No longer contains data-gh-stars badge
  assert.ok(!navHtml.includes('data-gh-stars'), 'navigation header must not contain data-gh-stars badge');
});

test('assets/js/main.js does not fetch or render GitHub star counts', () => {
  const js = read('assets/js/main.js');
  assert.ok(!js.includes('showGitHubStars'), 'showGitHubStars function must be absent');
  assert.ok(!js.includes('flisk-gh-stars'), 'flisk-gh-stars cache key must be absent');
  assert.ok(!js.includes('stargazers_count'), 'stargazers_count handling must be absent');
  assert.ok(!js.includes('data-gh-stars'), 'data-gh-stars selector must be absent');
});

test('built homepage renders the verified version in the header', () => {
  const builtPath = new URL('_site/index.html', root);
  if (!existsSync(builtPath)) return;

  const html = read('_site/index.html');
  const fliskYaml = read('_data/flisk.yml');
  const version = fliskYaml.match(/^cli_version:\s*["']?([^"'\s\n#]+)["']?/m)[1];

  // Check the built navigation contains the rendered version tag
  assert.match(html, new RegExp(`<span class="aw-nav-version">v${version}</span>`),
    `built header must contain v${version}`);
  assert.ok(!html.includes('data-gh-stars'), 'built header must not contain data-gh-stars');
});
