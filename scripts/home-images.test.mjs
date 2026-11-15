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
 * Reads dimensions from JPEG binary buffer by parsing SOF markers.
 */
export function getJpegDimensions(buf) {
  if (buf[0] !== 0xff || buf[1] !== 0xd8) {
    throw new Error('Not a valid JPEG file');
  }
  let offset = 2;
  while (offset < buf.length) {
    if (buf[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buf[offset + 1];
    const isSOF = (marker >= 0xc0 && marker <= 0xc3) || (marker >= 0xc5 && marker <= 0xc7) ||
                  (marker >= 0xc9 && marker <= 0xcb) || (marker >= 0xcd && marker <= 0xcf);
    if (isSOF) {
      const height = buf.readUInt16BE(offset + 5);
      const width = buf.readUInt16BE(offset + 7);
      return { width, height };
    }
    const len = buf.readUInt16BE(offset + 2);
    offset += 2 + len;
  }
  throw new Error('No SOF marker found in JPEG file');
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

  // Validate WebP sources
  const webpSourceTag = figureInner.match(/<source[^>]*type=["']image\/webp["'][^>]*>/i)?.[0];
  assert.ok(webpSourceTag, 'Expected <source type="image/webp"> inside demo screenshot <picture>');
  const webpSrcsetValue = getAttr(webpSourceTag, 'srcset');
  assert.ok(webpSrcsetValue, 'Expected srcset attribute on WebP <source>');

  const webpCandidates = parseSrcset(webpSrcsetValue);
  assert.equal(webpCandidates.length, 4, `Expected 4 WebP candidates, got ${webpCandidates.length}`);

  for (const candidate of webpCandidates) {
    const cleanUrl = candidate.url.replace(/^\//, '');
    const localPath = join(ROOT, cleanUrl);
    assert.ok(existsSync(localPath), `WebP candidate file does not exist: ${cleanUrl}`);

    const stat = statSync(localPath);
    assert.ok(
      stat.size <= 120_000,
      `WebP variant ${cleanUrl} (${stat.size} bytes) exceeds maximum budget of 120,000 bytes`
    );
  }

  // Validate JPEG fallback sources
  const jpegSourceTag = figureInner.match(/<source[^>]*type=["']image\/jpeg["'][^>]*>/i)?.[0];
  assert.ok(jpegSourceTag, 'Expected <source type="image/jpeg"> inside demo screenshot <picture>');
  const jpegSrcsetValue = getAttr(jpegSourceTag, 'srcset');
  assert.ok(jpegSrcsetValue, 'Expected srcset attribute on JPEG <source>');

  const jpegCandidates = parseSrcset(jpegSrcsetValue);
  assert.equal(jpegCandidates.length, 4, `Expected 4 JPEG candidates, got ${jpegCandidates.length}`);

  for (const candidate of jpegCandidates) {
    const cleanUrl = candidate.url.replace(/^\//, '');
    const localPath = join(ROOT, cleanUrl);
    assert.ok(existsSync(localPath), `JPEG candidate file does not exist: ${cleanUrl}`);

    const stat = statSync(localPath);
    assert.ok(
      stat.size <= 120_000,
      `JPEG variant ${cleanUrl} (${stat.size} bytes) exceeds maximum budget of 120,000 bytes`
    );
  }

  // Verify the final fallback <img> exists
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
  const webpSource = figureInner.match(/<source[^>]*type=["']image\/webp["'][^>]*>/i)?.[0];
  assert.ok(webpSource, 'WebP <source> tag must be present inside <picture>');
  assert.ok(getAttr(webpSource, 'srcset'), 'WebP srcset attribute must be non-empty');
  assert.ok(getAttr(webpSource, 'sizes'), 'WebP sizes attribute must be non-empty');

  // JPEG Source with srcset and sizes
  const jpegSource = figureInner.match(/<source[^>]*type=["']image\/jpeg["'][^>]*>/i)?.[0];
  assert.ok(jpegSource, 'JPEG <source> tag must be present inside <picture>');
  assert.ok(getAttr(jpegSource, 'srcset'), 'JPEG srcset attribute must be non-empty');
  assert.ok(getAttr(jpegSource, 'sizes'), 'JPEG sizes attribute must be non-empty');

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

  // 1. WebP candidate checks
  const webpSource = figureInner.match(/<source[^>]*type=["']image\/webp["'][^>]*>/i)?.[0];
  assert.ok(webpSource, 'Expected WebP <source> tag');
  const webpSrcset = getAttr(webpSource, 'srcset');
  const webpSizes = getAttr(webpSource, 'sizes');

  const webpCandidates = parseSrcset(webpSrcset);
  const slotWidth1x = resolveSlotWidth(webpSizes, 390);

  const selectedWebp1x = selectCandidate(webpCandidates, slotWidth1x, 1);
  const pathWebp1x = join(ROOT, selectedWebp1x.url.replace(/^\//, ''));
  assert.ok(existsSync(pathWebp1x), `File does not exist: ${selectedWebp1x.url}`);
  assert.ok(statSync(pathWebp1x).size < 50_000, `Mobile 1x WebP candidate is >= 50,000 bytes`);

  const selectedWebp2x = selectCandidate(webpCandidates, slotWidth1x, 2);
  const pathWebp2x = join(ROOT, selectedWebp2x.url.replace(/^\//, ''));
  assert.ok(existsSync(pathWebp2x), `File does not exist: ${selectedWebp2x.url}`);
  assert.ok(statSync(pathWebp2x).size < 50_000, `Mobile 2x WebP candidate is >= 50,000 bytes`);

  const selectedWebp3x = selectCandidate(webpCandidates, slotWidth1x, 3);
  assert.equal(selectedWebp3x.width, 1200, `Expected 1200w WebP candidate for 390px @ 3x DPR`);
  const pathWebp3x = join(ROOT, selectedWebp3x.url.replace(/^\//, ''));
  assert.ok(existsSync(pathWebp3x), `File does not exist: ${selectedWebp3x.url}`);
  assert.ok(statSync(pathWebp3x).size < 50_000, `Mobile 3x WebP candidate is >= 50,000 bytes`);

  // 2. JPEG candidate checks
  const jpegSource = figureInner.match(/<source[^>]*type=["']image\/jpeg["'][^>]*>/i)?.[0];
  assert.ok(jpegSource, 'Expected JPEG <source> tag');
  const jpegSrcset = getAttr(jpegSource, 'srcset');
  const jpegSizes = getAttr(jpegSource, 'sizes');

  const jpegCandidates = parseSrcset(jpegSrcset);
  const jpegSlotWidth1x = resolveSlotWidth(jpegSizes, 390);

  const selectedJpeg1x = selectCandidate(jpegCandidates, jpegSlotWidth1x, 1);
  assert.equal(selectedJpeg1x.width, 640, `Expected 640w JPEG candidate for 390px @ 1x DPR`);
  const pathJpeg1x = join(ROOT, selectedJpeg1x.url.replace(/^\//, ''));
  assert.ok(existsSync(pathJpeg1x), `File does not exist: ${selectedJpeg1x.url}`);
  const statJpeg1x = statSync(pathJpeg1x);
  assert.ok(
    statJpeg1x.size < 50_000,
    `Mobile 1x JPEG candidate ${selectedJpeg1x.url} is ${statJpeg1x.size} bytes (must be under 50,000 bytes)`
  );

  const selectedJpeg2x = selectCandidate(jpegCandidates, jpegSlotWidth1x, 2);
  assert.equal(selectedJpeg2x.width, 1000, `Expected 1000w JPEG candidate for 390px @ 2x DPR`);
  const pathJpeg2x = join(ROOT, selectedJpeg2x.url.replace(/^\//, ''));
  assert.ok(existsSync(pathJpeg2x), `File does not exist: ${selectedJpeg2x.url}`);
  const statJpeg2x = statSync(pathJpeg2x);
  assert.ok(
    statJpeg2x.size < 50_000,
    `Mobile 2x JPEG candidate ${selectedJpeg2x.url} is ${statJpeg2x.size} bytes (must be under 50,000 bytes)`
  );

  const selectedJpeg3x = selectCandidate(jpegCandidates, jpegSlotWidth1x, 3);
  assert.equal(selectedJpeg3x.width, 1200, `Expected 1200w JPEG candidate for 390px @ 3x DPR`);
  const pathJpeg3x = join(ROOT, selectedJpeg3x.url.replace(/^\//, ''));
  assert.ok(existsSync(pathJpeg3x), `File does not exist: ${selectedJpeg3x.url}`);
  const statJpeg3x = statSync(pathJpeg3x);
  assert.ok(
    statJpeg3x.size < 50_000,
    `Mobile 3x JPEG candidate ${selectedJpeg3x.url} is ${statJpeg3x.size} bytes (must be under 50,000 bytes)`
  );
});

test('Test D: Desktop image budget - candidate selected for 1440px viewport is under 120,000 bytes', () => {
  const html = readFileSync(HOME_HTML_PATH, 'utf8');
  const demoSectionMatch = html.match(/<figure[^>]*data-try-shot[^>]*>([\s\S]*?)<\/figure>/);
  assert.ok(demoSectionMatch, 'Could not find <figure data-try-shot>');
  const figureInner = demoSectionMatch[1];

  // 1. WebP Desktop candidate
  const webpSource = figureInner.match(/<source[^>]*type=["']image\/webp["'][^>]*>/i)?.[0];
  assert.ok(webpSource, 'Expected WebP <source> tag');
  const webpCandidates = parseSrcset(getAttr(webpSource, 'srcset'));
  const webpSlotWidth = resolveSlotWidth(getAttr(webpSource, 'sizes'), 1440);
  const selectedWebp = selectCandidate(webpCandidates, webpSlotWidth, 1);
  assert.ok(selectedWebp, 'A WebP candidate must be selected for 1440px desktop viewport');
  const pathWebp = join(ROOT, selectedWebp.url.replace(/^\//, ''));
  assert.ok(existsSync(pathWebp), `Desktop WebP file does not exist: ${selectedWebp.url}`);
  assert.ok(statSync(pathWebp).size < 120_000, `Desktop WebP candidate is >= 120,000 bytes`);

  // 2. JPEG Desktop candidate
  const jpegSource = figureInner.match(/<source[^>]*type=["']image\/jpeg["'][^>]*>/i)?.[0];
  assert.ok(jpegSource, 'Expected JPEG <source> tag');
  const jpegCandidates = parseSrcset(getAttr(jpegSource, 'srcset'));
  const jpegSlotWidth = resolveSlotWidth(getAttr(jpegSource, 'sizes'), 1440);
  const selectedJpeg = selectCandidate(jpegCandidates, jpegSlotWidth, 1);
  assert.ok(selectedJpeg, 'A JPEG candidate must be selected for 1440px desktop viewport');
  assert.equal(selectedJpeg.width, 2000, `Expected 2000w JPEG candidate for 1440px desktop`);
  const pathJpeg = join(ROOT, selectedJpeg.url.replace(/^\//, ''));
  assert.ok(existsSync(pathJpeg), `Desktop JPEG file does not exist: ${selectedJpeg.url}`);
  const statJpeg = statSync(pathJpeg);
  assert.ok(
    statJpeg.size < 120_000,
    `Desktop JPEG candidate ${selectedJpeg.url} is ${statJpeg.size} bytes (must be under 120,000 bytes)`
  );
});

test('Test E: Aspect ratio - all generated image variants retain original 16:10 aspect ratio', () => {
  const webpVariants = [
    { name: 'demo-menu-page-640.webp', expectedW: 640, expectedH: 400 },
    { name: 'demo-menu-page-1000.webp', expectedW: 1000, expectedH: 625 },
    { name: 'demo-menu-page-1200.webp', expectedW: 1200, expectedH: 750 },
    { name: 'demo-menu-page-2000.webp', expectedW: 2000, expectedH: 1250 },
  ];

  for (const { name, expectedW, expectedH } of webpVariants) {
    const file = join(ROOT, 'assets/images', name);
    assert.ok(existsSync(file), `Expected WebP variant asset to exist: ${file}`);
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

  const jpegVariants = [
    { name: 'demo-menu-page-640.jpg', expectedW: 640, expectedH: 400 },
    { name: 'demo-menu-page-1000.jpg', expectedW: 1000, expectedH: 625 },
    { name: 'demo-menu-page-1200.jpg', expectedW: 1200, expectedH: 750 },
    { name: 'demo-menu-page-2000.jpg', expectedW: 2000, expectedH: 1250 },
  ];

  for (const { name, expectedW, expectedH } of jpegVariants) {
    const file = join(ROOT, 'assets/images', name);
    assert.ok(existsSync(file), `Expected JPEG variant asset to exist: ${file}`);
    const buf = readFileSync(file);
    const { width, height } = getJpegDimensions(buf);

    assert.equal(width, expectedW, `${name} width is ${width}, expected ${expectedW}`);
    assert.equal(height, expectedH, `${name} height is ${height}, expected ${expectedH}`);

    const ratio = width / height;
    assert.ok(
      Math.abs(ratio - 16 / 10) < 0.001,
      `${name} aspect ratio (${ratio}) does not match 16:10 (1.6)`
    );
  }
});
