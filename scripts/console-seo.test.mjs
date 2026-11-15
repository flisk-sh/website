import assert from 'node:assert/strict';
import { test } from 'node:test';
import { addConsoleSeoMetadata } from './console-seo.mjs';
import { seoMetadataProblems } from './check-seo.mjs';

const pageUrl = 'https://flisk.sh/console/';

test('console sync adds canonical, Open Graph, and Twitter metadata', () => {
  const html = addConsoleSeoMetadata('<head><meta name="robots" content="noindex" /></head>');
  assert.deepEqual(seoMetadataProblems(html, pageUrl), []);
  assert.match(html, /<meta name="twitter:card" content="summary_large_image" \/>/);
  assert.match(html, /<meta name="twitter:title" content="FliskOS \| Flisk CLI" \/>/);
  assert.match(html, /<meta name="twitter:description" content="FliskOS: Flisk projects, coding agents and Flisk apps in one local window" \/>/);
  assert.match(html, /<meta name="twitter:image" content="https:\/\/flisk\.sh\/assets\/images\/flisk-social-card\.png\?v=2" \/>/);
});

test('console sync refuses a source template that no longer has its robots marker', () => {
  assert.throws(() => addConsoleSeoMetadata('<head></head>'), /noindex/);
});
