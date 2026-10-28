import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

// Wording the claims registry (flisk-sh/flisk docs/claims.md) forbids anywhere on the site.
export const FORBIDDEN_PHRASES = [
  [/under\s+(?:5|five)\s*(?:seconds?|secs?|s)\b/i, 'under 5 seconds (derived from the 4.6s warm-start number)'],
  [/stacks?\s+in\s+(?:3|three)\s+seconds/i, 'stack in 3 seconds'],
  [/weeks of integration/i, 'weeks of integration'],
  [/\bERP system/i, 'ERP system'],
  [/weeks of salary/i, 'weeks of salary'],
];

// "cold boot" and "from zero" are wrong only next to the 14-service / 4.6s number.
// The registry's own negation ("Not a cold boot.") stays allowed.
const DEMO_NUMBER = /\b14\b[\s-]*(?:tiny\s+)?services?|\b14-service|4\.6\s?s\b/i;
const COLD_WORDS = /cold[\s-]boot|from zero/gi;
const NEAR = 200;

export function pageText(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ');
}

export function findForbiddenClaims(html) {
  const text = pageText(html);
  const found = [];
  for (const [pattern, label] of FORBIDDEN_PHRASES) {
    const match = text.match(pattern);
    if (match) found.push(`${label}: "${match[0]}"`);
  }
  for (const match of text.matchAll(COLD_WORDS)) {
    const before = text.slice(Math.max(0, match.index - 8), match.index);
    if (/\bnot an?\s*$/i.test(before)) continue;
    const around = text.slice(Math.max(0, match.index - NEAR), match.index + match[0].length + NEAR);
    if (DEMO_NUMBER.test(around)) found.push(`"${match[0]}" next to the 14-service / 4.6s number`);
  }
  return found;
}

// The "@grok bubbles" instructions in llms.txt and llms-full.txt, from "## Personal Demos" to the heading
// after "## Bubbles". demo.flisk.sh builds only from /<handle>/<words>: a bare /<handle> opens a demo the
// person already has (a 404 otherwise), and /d/<id> ids are made by the server.
export function demoSection(text) {
  const start = text.indexOf('## Personal Demos');
  const end = text.indexOf('\n## ', text.indexOf('## Bubbles'));
  return start >= 0 && end > start ? text.slice(start, end) : '';
}

export function demoLinkProblems(text) {
  const section = demoSection(text);
  if (!section) return ['has no Personal Demos and Bubbles sections'];
  const problems = [];
  for (const sentence of section.split(/\n|(?<=\.)\s/)) {
    for (const [link] of sentence.matchAll(/https:\/\/demo\.flisk\.sh\/[^\s`"]*/g)) {
      if (link.includes('/v1/demo/')) continue; // the JSON API, read and never posted
      if (link.startsWith('https://demo.flisk.sh/d/')) {
        problems.push(`offers a /d/ link, whose ids only the server makes: ${link}`);
      } else if (/^https:\/\/demo\.flisk\.sh\/<x-handle>$/.test(link)) {
        if (!sentence.includes('404')) problems.push(`offers a bare-handle demo link, which builds nothing: "${sentence.trim()}"`);
      } else if (!/^https:\/\/demo\.flisk\.sh\/[^/]+\/[^/]+$/.test(link)) {
        problems.push(`offers a demo link without words: ${link}`);
      }
    }
  }
  if (!section.includes('Never write a `/d/...` link yourself')) problems.push('does not say to never write a /d/ link');
  return problems;
}

const PAGE_EXT = /\.(?:html?|md|markdown|ya?ml|txt)$/i;
const SKIP_DIRS = new Set(['.git', '.github', '.claude', '.jekyll-cache', '.sass-cache', 'node_modules', 'vendor', 'assets', 'scripts', 'test', '_site']);

export function listPages(dir, { skip = SKIP_DIRS } = {}) {
  const pages = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) {
      if (!skip.has(name)) pages.push(...listPages(full, { skip }));
    } else if (PAGE_EXT.test(name) && name !== '_config.yml') {
      pages.push(full);
    }
  }
  return pages;
}

export function checkPages(dir, options) {
  const failures = [];
  for (const file of listPages(dir, options)) {
    for (const problem of findForbiddenClaims(readFileSync(file, 'utf8'))) {
      failures.push(`${relative(rootPath, file)} uses wording the claims registry forbids: ${problem}`);
    }
  }
  return failures;
}

const root = new URL('../', import.meta.url);
const rootPath = fileURLToPath(root);

function main() {
  const index = readFileSync(new URL('index.html', root), 'utf8');
  const compare = readFileSync(new URL('compare/index.html', root), 'utf8');
  const quickstart = readFileSync(new URL('docs/quickstart/index.html', root), 'utf8');
  const claims = readFileSync(new URL('docs/claims/index.md', root), 'utf8');

  const failures = [];
  const required = [
    '14 tiny services healthy in 4.6s on a 16 GB M1 after images existed. Not a cold boot.',
    '100 generated',
    '/health',
    'healthy through Traefik in 472s on a clean Ubuntu runner',
    'Not an ERP.',
  ];

  for (const line of required) {
    if (!claims.includes(line)) failures.push(`claims registry is missing required wording: ${line}`);
  }

  for (const [label, source] of [['homepage hero', index.match(/<p class="aw-hero-proof">([\s\S]*?)<\/p>/)?.[1] ?? ''], ['comparison page', compare]]) {
    const numbers = [...source.matchAll(/\b\d+(?:\.\d+)?\s*(?:s|services?)\b/gi)].map((match) => match[0]);
    if (numbers.length && !source.includes("'/docs/claims/' | relative_url") && !source.includes('/docs/claims/')) {
      failures.push(`${label} has a numeric claim without a link to the claims registry`);
    }
    if (label === 'homepage hero' && /from zero|under 5 seconds/i.test(source.replace(/<[^>]*>/g, ' '))) {
      failures.push('homepage hero uses forbidden or over-broad performance wording');
    }
  }

  const benchPanel = index.match(/<aside class="aw-bench"[\s\S]*?<\/aside>/)?.[0] ?? '';
  if (benchPanel) {
    if (!benchPanel.includes("'/docs/claims/' | relative_url")) {
      failures.push('homepage benchmark panel has numbers without a link to the claims registry');
    }
    if (!claims.includes('id="benchmark-panel"') || !claims.includes('site.data.benchmarks')) {
      failures.push('claims registry is missing the homepage benchmark panel section');
    }
    if (/\bERP\b/.test(readFileSync(new URL('_data/benchmarks.yml', root), 'utf8').replace(/^#.*$/gm, ''))) {
      failures.push('benchmark panel uses ERP wording');
    }
  }

  const forbidden = [
    [/Free during beta\. When we launch/i, 'obsolete beta pricing copy'],
    [/Windows supported(?!\s+through WSL2)/i, 'unqualified Windows support claim'],
    [/from zero.{0,120}4\.6s|4\.6s.{0,120}from zero/i, 'from-zero 4.6s claim'],
  ];
  const siteSources = [index, compare, quickstart];
  for (const [pattern, label] of forbidden) {
    if (siteSources.some((source) => pattern.test(source))) failures.push(`site contains ${label}`);
  }

  if (siteSources.some((source) => /Windows supported(?!\s+through WSL2)/i.test(source))) {
    failures.push('site contains an unqualified Windows support claim');
  }
  if (!index.includes('Stability: 1.x local dev. Generated files are a contract; verify with flisk config verify. Core CLI is MIT and needs no key. Premium is optional.')) {
    failures.push('homepage is missing the shared product stability and license status line');
  }

  // A fullwidth at-sign (U+FF20) in llms files breaks copy-paste commands and the "@grok" trigger.
  for (const name of ['llms.txt', 'llms-full.txt']) {
    if (readFileSync(new URL(name, root), 'utf8').includes('\uFF20')) {
      failures.push(`${name} contains a fullwidth at-sign (U+FF20); use the ASCII at-sign`);
    }
  }
  const [llms, llmsFull] = ['llms.txt', 'llms-full.txt'].map((name) => readFileSync(new URL(name, root), 'utf8'));
  for (const problem of demoLinkProblems(llms)) failures.push(`llms.txt ${problem}`);
  if (demoSection(llms) !== demoSection(llmsFull)) {
    failures.push('llms-full.txt has different Personal Demos and Bubbles sections from llms.txt; keep them identical');
  }

  // Every source page, include, layout and data file. With --built, every built page in _site/
  // instead (CI runs this before `jekyll build` and again with --built after it).
  if (process.argv.includes('--built')) {
    const site = join(rootPath, '_site');
    if (existsSync(site)) failures.push(...checkPages(site, { skip: new Set(['assets', 'vendor']) }));
    else failures.push('_site/ does not exist; run bundle exec jekyll build first');
  } else {
    failures.push(...checkPages(rootPath));
  }

  if (failures.length) {
    console.error(failures.map((failure) => `FAIL: ${failure}`).join('\n'));
    process.exit(1);
  }
  console.log('Public claims checks passed.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
