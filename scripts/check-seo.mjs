import { existsSync, readFileSync } from 'node:fs';
import { join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

function decodeXml(value) {
  return value.replace(/&(?:amp|lt|gt|quot|apos);/g, (entity) => ({
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&apos;': "'",
  })[entity]);
}

function attributes(tag) {
  return Object.fromEntries(
    [...tag.matchAll(/([^\s=<>/]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map(
      ([, name, doubleQuoted, singleQuoted]) => [
        name.toLowerCase(),
        decodeXml(doubleQuoted ?? singleQuoted ?? ''),
      ],
    ),
  );
}

function metaContent(html, key) {
  for (const [tag] of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = attributes(tag);
    if ((attrs.property ?? attrs.name)?.toLowerCase() === key) {
      return attrs.content?.trim() ?? '';
    }
  }
  return '';
}

export function seoMetadataProblems(html, sitemapUrl) {
  const problems = [];
  let canonical = '';
  for (const [tag] of html.matchAll(/<link\b[^>]*>/gi)) {
    const attrs = attributes(tag);
    if (attrs.rel?.toLowerCase().split(/\s+/).includes('canonical')) {
      canonical = attrs.href?.trim() ?? '';
      break;
    }
  }

  if (!canonical) problems.push('missing canonical link');
  else if (canonical !== sitemapUrl) problems.push(`canonical URL is ${canonical}, expected ${sitemapUrl}`);

  for (const property of ['og:title', 'og:description', 'og:image']) {
    if (!metaContent(html, property)) problems.push(`missing ${property}`);
  }
  return problems;
}

export function checkBuiltSite(siteDir) {
  const sitemapPath = join(siteDir, 'sitemap.xml');
  if (!existsSync(sitemapPath)) throw new Error(`Missing ${sitemapPath}; build the site first.`);

  const sitemap = readFileSync(sitemapPath, 'utf8');
  const pageUrls = [...sitemap.matchAll(/<loc>([\s\S]*?)<\/loc>/g)].map(([, url]) => decodeXml(url.trim()));
  if (pageUrls.length === 0) throw new Error(`No page URLs found in ${sitemapPath}.`);

  const root = resolve(siteDir);
  const problems = [];
  for (const pageUrl of pageUrls) {
    let parsedUrl;
    try {
      parsedUrl = new URL(pageUrl);
    } catch {
      problems.push(`${pageUrl}: invalid sitemap URL`);
      continue;
    }

    let pathname;
    try {
      pathname = decodeURIComponent(parsedUrl.pathname);
    } catch {
      problems.push(`${pageUrl}: invalid URL path`);
      continue;
    }

    const target = resolve(root, `.${pathname}`);
    const htmlPath = pathname.endsWith('/') ? join(target, 'index.html') : target;
    const rel = relative(root, htmlPath);
    if (rel === '..' || rel.startsWith(`..${sep}`)) {
      problems.push(`${pageUrl}: path escapes the built site`);
      continue;
    }
    if (!existsSync(htmlPath)) {
      problems.push(`${pageUrl}: built HTML file is missing`);
      continue;
    }

    const html = readFileSync(htmlPath, 'utf8');
    for (const problem of seoMetadataProblems(html, pageUrl)) {
      problems.push(`${pageUrl}: ${problem}`);
    }
  }
  return problems;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const siteDir = resolve(fileURLToPath(new URL('../_site', import.meta.url)));
  const problems = checkBuiltSite(siteDir);
  if (problems.length > 0) {
    console.error(`SEO metadata check failed:\n${problems.map((problem) => `- ${problem}`).join('\n')}`);
    process.exit(1);
  }
  console.log('SEO metadata checks passed for every sitemap page.');
}
