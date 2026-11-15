import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkBuiltSite, seoMetadataProblems } from './check-seo.mjs';

const pageUrl = 'https://flisk.sh/console/';
const completePage = `<!doctype html><html><head>
  <link rel="canonical" href="${pageUrl}" />
  <meta property="og:title" content="FliskOS | Flisk CLI" />
  <meta property="og:description" content="A local window for Flisk apps" />
  <meta property="og:image" content="https://flisk.sh/assets/images/flisk-social-card.png?v=2" />
</head><body></body></html>`;

test('sitemap page passes when canonical and Open Graph tags are present', () => {
  assert.deepEqual(seoMetadataProblems(completePage, pageUrl), []);
});

test('sitemap page fails when canonical URL or Open Graph tags are missing', () => {
  const problems = seoMetadataProblems('<html><head></head></html>', pageUrl);
  assert.deepEqual(problems, [
    'missing canonical link',
    'missing og:title',
    'missing og:description',
    'missing og:image',
  ]);
});

test('sitemap page fails when its canonical URL differs from the sitemap URL', () => {
  const wrongUrl = 'https://flisk.sh/wrong/';
  const html = completePage.replace(pageUrl, wrongUrl);
  assert.deepEqual(seoMetadataProblems(html, pageUrl), [
    `canonical URL is ${wrongUrl}, expected ${pageUrl}`,
  ]);
});

test('built-site check checks each URL in the sitemap and catches a missing page tag', () => {
  const siteDir = mkdtempSync(join(tmpdir(), 'flisk-seo-'));
  mkdirSync(join(siteDir, 'console'), { recursive: true });
  writeFileSync(join(siteDir, 'sitemap.xml'), `<urlset><url><loc>${pageUrl}</loc></url></urlset>`);
  writeFileSync(join(siteDir, 'console', 'index.html'), completePage);
  assert.deepEqual(checkBuiltSite(siteDir), []);

  const missingImage = completePage.replace(/<meta property="og:image"[^>]+>/, '');
  writeFileSync(join(siteDir, 'console', 'index.html'), missingImage);
  assert.deepEqual(checkBuiltSite(siteDir), [`${pageUrl}: missing og:image`]);
});

test('built-site check reports when a sitemap URL has no corresponding HTML file', () => {
  const siteDir = mkdtempSync(join(tmpdir(), 'flisk-seo-missing-'));
  writeFileSync(join(siteDir, 'sitemap.xml'), `<urlset><url><loc>${pageUrl}</loc></url></urlset>`);
  assert.deepEqual(checkBuiltSite(siteDir), [`${pageUrl}: built HTML file is missing`]);
});
