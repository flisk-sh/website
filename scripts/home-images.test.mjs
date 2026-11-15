import assert from 'node:assert/strict';
import { readFileSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const ROOT = join(import.meta.dirname, '..');
const HOME_HTML_PATH = join(ROOT, 'index.html');

/**
 * Helper to extract an HTML attribute value, handling matching " or ' quotes.
 */
export function getAttr(tagStr, attrName) {
  const match = tagStr.match(new RegExp(`${attrName}=(?:"([^"]*)"|'([^']*)')`, 'i'));
  return match ? (match[1] !== undefined ? match[1] : match[2]) : null;
}

/**
 * Reads dimensions from WebP binary buffer (VP8, VP8L, VP8X).
 */
export function getWebPDimensions(buf) {
  if (buf.length < 30 || buf.toString('ascii', 0, 4) !== 'RIFF' || buf.toString('ascii', 8, 12) !== 'WEBP') {
    throw new Error('Not a valid WebP file');
  }
  const chunkType = buf.toString('ascii', 12, 16);
  if (chunkType === 'VP8 ') {
    const width = buf.readUInt16LE(26) & 0x3fff;
    const height = buf.readUInt16LE(28) & 0x3fff;
    return { width, height };
  } else if (chunkType === 'VP8X') {
    const width = 1 + buf.readUIntLE(24, 3);
    const height = 1 + buf.readUIntLE(27, 3);
    return { width, height };
  } else if (chunkType === 'VP8L') {
    const b0 = buf[21], b1 = buf[22], b2 = buf[23], b3 = buf[24];
    const width = 1 + (((b1 & 0x3f) << 8) | b0);
    const height = 1 + (((b3 & 0x0f) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
    return { width, height };
  }
  throw new Error(`Unsupported WebP chunk type: ${chunkType}`);
}

/**
 * Parses srcset descriptor string into an array of { url, descriptor, width }.
 */
export function parseSrcset(srcsetString) {
  return srcsetString
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((candidate) => {
      const match = candidate.match(/(?:\{\{\s*['"]([^'"]+)['"]\s*\|\s*relative_url\s*\}\}|(\S+))\s+(\d+w)/);
      if (match) {
        const url = match[1] || match[2];
        const descriptor = match[3];
        const width = parseInt(descriptor.replace('w', ''), 10);
        return { url, descriptor, width };
      }
      return { url: candidate, descriptor: '', width: null };
    });
}

/**
 * Resolves target slot width in CSS pixels from sizes attribute and viewport width.
 */
export function resolveSlotWidth(sizesString, viewportWidth) {
  const entries = sizesString.split(',').map((s) => s.trim()).filter(Boolean);
  for (const entry of entries) {
    const mediaMatch = entry.match(/^\((max-width|min-width):\s*(\d+)(px|rem)\)\s+(.+)$/);
    if (mediaMatch) {
      const [, queryType, valStr, unit, sizePart] = mediaMatch;
      let queryPx = parseFloat(valStr);
      if (unit === 'rem') queryPx *= 16;

      const matches = queryType === 'max-width' ? viewportWidth <= queryPx : viewportWidth >= queryPx;
      if (matches) {
        return parseCssLength(sizePart.trim(), viewportWidth);
      }
    } else {
      // Default / fallback entry
      return parseCssLength(entry, viewportWidth);
    }
  }
  return viewportWidth;
}

function parseCssLength(lengthStr, viewportWidth) {
  if (lengthStr.endsWith('vw')) {
    const factor = parseFloat(lengthStr) / 100;
    return viewportWidth * factor;
  }
  if (lengthStr.endsWith('rem')) {
    return parseFloat(lengthStr) * 16;
  }
  if (lengthStr.endsWith('px')) {
    return parseFloat(lengthStr);
  }
  const numeric = parseFloat(lengthStr);
  return Number.isNaN(numeric) ? viewportWidth : numeric;
}

/**
 * Selects candidate matching the target slot width and device pixel ratio.
 */
export function selectCandidate(candidates, slotWidth, dpr = 1) {
  const targetPx = slotWidth * dpr;
  const sorted = [...candidates].sort((a, b) => (a.width || 0) - (b.width || 0));
  return sorted.find((c) => (c.width || 0) >= targetPx) || sorted[sorted.length - 1];
}

// -----------------------------------------------------------------------------
// Test Suite
// -----------------------------------------------------------------------------

test('Test A: Homepage image size check - modern browser candidates meet budget (< 120 KB)', () => {
  const html = readFileSync(HOME_HTML_PATH, 'utf8');

  // Find demo screenshot markup in homepage
  const demoSectionMatch = html.match(/<figure[^>]*data-try-shot[^>]*>([\s\S]*?)<\/figure>/);
  assert.ok(demoSectionMatch, 'Could not find <figure data-try-shot> in homepage HTML');
  const figureInner = demoSectionMatch[1];

  // Must use <picture> so modern browsers do not download the 337 KB JPEG
  assert.ok(
    figureInner.includes('<picture>'),
    'Demo screenshot must use <picture> so modern browsers do not download the 337 KB JPEG'
  );

  const sourceTag = figureInner.match(/<source\b[^>]*>/i)?.[0];
  assert.ok(sourceTag, 'Expected <source> inside demo screenshot <picture>');
  const srcsetValue = getAttr(sourceTag, 'srcset');
  assert.ok(srcsetValue, 'Expected srcset attribute on <source>');

  const candidates = parseSrcset(srcsetValue);
  assert.equal(candidates.length, 4, `Expected 4 WebP candidates, got ${candidates.length}`);

  for (const candidate of candidates) {
    const cleanUrl = candidate.url.replace(/^\//, '');
    const localPath = join(ROOT, cleanUrl);
    assert.ok(existsSync(localPath), `WebP candidate file does not exist: ${cleanUrl}`);

    const stat = statSync(localPath);
    assert.ok(
      stat.size <= 120_000,
      `WebP variant ${cleanUrl} (${stat.size} bytes) exceeds maximum budget of 120,000 bytes`
    );
  }

  // Verify the original JPEG fallback exists
  const imgTag = figureInner.match(/<img\b[^>]*>/i)?.[0];
  assert.ok(imgTag, 'Expected fallback <img> inside <picture>');
  const srcValue = getAttr(imgTag, 'src');
  assert.ok(srcValue, 'Expected src attribute on fallback <img>');
  const fallbackUrl = srcValue.replace(/\{\{\s*['"]([^'"]+)['"]\s*\|\s*relative_url\s*\}\}/, '$1').replace(/^\//, '');
  assert.ok(existsSync(join(ROOT, fallbackUrl)), `Fallback image does not exist: ${fallbackUrl}`);
});

test('Test B: Responsive markup check - attributes, dimensions, and lazy loading preserved', () => {
  const html = readFileSync(HOME_HTML_PATH, 'utf8');

  const demoSectionMatch = html.match(/<figure[^>]*data-try-shot[^>]*>([\s\S]*?)<\/figure>/);
  assert.ok(demoSectionMatch, 'Could not find <figure data-try-shot> in homepage HTML');
  const figureInner = demoSectionMatch[1];

  // Picture element
  assert.match(figureInner, /<picture>/, '<picture> opening tag must be present');
  assert.match(figureInner, /<\/picture>/, '</picture> closing tag must be present');

  // WebP Source with srcset and sizes
  const sourceTag = figureInner.match(/<source\b[^>]*>/i)?.[0];
  assert.ok(sourceTag, '<source> tag must be present inside <picture>');
  assert.equal(getAttr(sourceTag, 'type'), 'image/webp', 'WebP source type must be image/webp');
  assert.ok(getAttr(sourceTag, 'srcset'), 'srcset attribute must be non-empty');
  assert.ok(getAttr(sourceTag, 'sizes'), 'sizes attribute must be non-empty');

  // JPEG fallback <img>
  const imgTag = figureInner.match(/<img\b[^>]*>/i)?.[0];
  assert.ok(imgTag, '<img> fallback tag must be present inside <picture>');
  const src = getAttr(imgTag, 'src');
  assert.ok(src && src.includes('demo-menu-page.jpg'), 'JPEG fallback must point to demo-menu-page.jpg');
  assert.equal(getAttr(imgTag, 'width'), '2000', 'width="2000" must be preserved');
  assert.equal(getAttr(imgTag, 'height'), '1250', 'height="1250" must be preserved');
  assert.equal(getAttr(imgTag, 'loading'), 'lazy', 'loading="lazy" must be preserved');
  assert.equal(getAttr(imgTag, 'decoding'), 'async', 'decoding="async" must be preserved');
  assert.equal(
    getAttr(imgTag, 'alt'),
    'The page the demo opens: a restaurant menu served by two services Flisk started as local processes',
    'Descriptive alt text must be preserved'
  );
});

test('Test C: Mobile image budget - candidate selected for 390px viewport is under 50,000 bytes', () => {
  const html = readFileSync(HOME_HTML_PATH, 'utf8');
  const demoSectionMatch = html.match(/<figure[^>]*data-try-shot[^>]*>([\s\S]*?)<\/figure>/);
  assert.ok(demoSectionMatch, 'Could not find <figure data-try-shot>');
  const figureInner = demoSectionMatch[1];

  const sourceTag = figureInner.match(/<source[^>]*type=["']image\/webp["'][^>]*>/i)?.[0];
  assert.ok(sourceTag, 'Expected WebP <source> tag');
  const srcsetValue = getAttr(sourceTag, 'srcset');
  const sizesValue = getAttr(sourceTag, 'sizes');
  assert.ok(srcsetValue, 'srcset attribute must be present');
  assert.ok(sizesValue, 'sizes attribute must be present');

  const candidates = parseSrcset(srcsetValue);
  // Viewport 390px at 1x DPR
  const slotWidth1x = resolveSlotWidth(sizesValue, 390);
  const selected1x = selectCandidate(candidates, slotWidth1x, 1);
  assert.ok(selected1x, 'A candidate must be selected for 390px viewport (1x)');

  const path1x = join(ROOT, selected1x.url.replace(/^\//, ''));
  assert.ok(existsSync(path1x), `File does not exist: ${selected1x.url}`);
  const stat1x = statSync(path1x);
  assert.ok(
    stat1x.size < 50_000,
    `Mobile 1x candidate ${selected1x.url} is ${stat1x.size} bytes (must be under 50,000 bytes)`
  );

  // Viewport 390px at 2x DPR (high-density mobile)
  const selected2x = selectCandidate(candidates, slotWidth1x, 2);
  const path2x = join(ROOT, selected2x.url.replace(/^\//, ''));
  assert.ok(existsSync(path2x), `File does not exist: ${selected2x.url}`);
  const stat2x = statSync(path2x);
  assert.ok(
    stat2x.size < 50_000,
    `Mobile 2x candidate ${selected2x.url} is ${stat2x.size} bytes (must be under 50,000 bytes)`
  );

  // Viewport 390px at 3x DPR (super high-density mobile)
  const selected3x = selectCandidate(candidates, slotWidth1x, 3);
  assert.ok(selected3x, 'A candidate must be selected for 390px viewport (3x)');
  assert.equal(selected3x.width, 1200, `Expected 1200w candidate for 390px @ 3x DPR, got ${selected3x.descriptor}`);
  const path3x = join(ROOT, selected3x.url.replace(/^\//, ''));
  assert.ok(existsSync(path3x), `File does not exist: ${selected3x.url}`);
  const stat3x = statSync(path3x);
  assert.ok(
    stat3x.size < 50_000,
    `Mobile 3x candidate ${selected3x.url} is ${stat3x.size} bytes (must be under 50,000 bytes)`
  );
});

test('Test D: Desktop image budget - candidate selected for 1440px viewport is under 120,000 bytes', () => {
  const html = readFileSync(HOME_HTML_PATH, 'utf8');
  const demoSectionMatch = html.match(/<figure[^>]*data-try-shot[^>]*>([\s\S]*?)<\/figure>/);
  assert.ok(demoSectionMatch, 'Could not find <figure data-try-shot>');
  const figureInner = demoSectionMatch[1];

  const sourceTag = figureInner.match(/<source[^>]*type=["']image\/webp["'][^>]*>/i)?.[0];
  assert.ok(sourceTag, 'Expected WebP <source> tag');
  const srcsetValue = getAttr(sourceTag, 'srcset');
  const sizesValue = getAttr(sourceTag, 'sizes');

  const candidates = parseSrcset(srcsetValue);
  const slotWidth = resolveSlotWidth(sizesValue, 1440);
  const selected = selectCandidate(candidates, slotWidth, 1);
  assert.ok(selected, 'A candidate must be selected for 1440px desktop viewport');

  const filePath = join(ROOT, selected.url.replace(/^\//, ''));
  assert.ok(existsSync(filePath), `Desktop candidate file does not exist: ${selected.url}`);
  const stat = statSync(filePath);
  assert.ok(
    stat.size < 120_000,
    `Desktop candidate ${selected.url} is ${stat.size} bytes (must be under 120,000 bytes)`
  );
});

test('Test E: Aspect ratio - all generated image variants retain original 16:10 aspect ratio', () => {
  const variants = [
    { name: 'demo-menu-page-640.webp', expectedW: 640, expectedH: 400 },
    { name: 'demo-menu-page-1000.webp', expectedW: 1000, expectedH: 625 },
    { name: 'demo-menu-page-1200.webp', expectedW: 1200, expectedH: 750 },
    { name: 'demo-menu-page-2000.webp', expectedW: 2000, expectedH: 1250 },
  ];

  for (const { name, expectedW, expectedH } of variants) {
    const file = join(ROOT, 'assets/images', name);
    assert.ok(existsSync(file), `Expected variant asset to exist: ${file}`);
    const buf = readFileSync(file);
    const { width, height } = getWebPDimensions(buf);

    assert.equal(width, expectedW, `${name} width is ${width}, expected ${expectedW}`);
    assert.equal(height, expectedH, `${name} height is ${height}, expected ${expectedH}`);

    const ratio = width / height;
    assert.ok(
      Math.abs(ratio - 16 / 10) < 0.001,
      `${name} aspect ratio (${ratio}) does not match 16:10 (1.6)`
    );
  }
});
