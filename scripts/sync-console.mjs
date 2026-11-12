// Copies the FliskOS frontend (flisk-sh/fliskos, MIT) into console/ for the homepage demo.
// Usage: node scripts/sync-console.mjs <path to a fliskos checkout>
// app.js, os.js and inspect.js are copied as they are, under a one-line header that names the source; index.html loads every script with ?v=<fliskos commit> so a
// cached copy never outlives a sync. index.html gets four changes: the token placeholder, relative script
// paths, the dark colours on every system (the homepage is dark), and the two sample scripts that answer the /api/ calls.
import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const source = process.argv[2];
if (!source) {
  console.error('Usage: node scripts/sync-console.mjs <path to a fliskos checkout>');
  process.exit(2);
}

const target = join(fileURLToPath(new URL('..', import.meta.url)), 'console');
mkdirSync(target, { recursive: true });
const commit = execFileSync('git', ['-C', source, 'rev-parse', '--short', 'HEAD'], { encoding: 'utf8' }).trim();
// Each copied script starts with one line naming its source, so nobody edits the copy (the next sync overwrites it).
for (const file of ['app.js', 'os.js', 'inspect.js']) {
  const header = `// Copied from flisk-sh/fliskos public/${file} by scripts/sync-console.mjs. Do not edit here: change it in fliskos, then run the script.\n`;
  writeFileSync(join(target, file), header + readFileSync(join(source, 'public', file), 'utf8'));
}
const replaceOnce = (text, from, to) => {
  if (!text.includes(from)) throw new Error(`index.html no longer contains: ${from}`);
  return text.replace(from, to);
};

let html = readFileSync(join(source, 'public', 'index.html'), 'utf8');
html = replaceOnce(html, '__FLISK_CENTER_TOKEN__', 'demo');
html = replaceOnce(html, '<script src="/inspect.js" defer></script>', `<script src="sample-data.js?v=${commit}"></script>\n    <script src="sample.js?v=${commit}"></script>\n    <script src="inspect.js?v=${commit}" defer></script>`);
html = replaceOnce(html, '<script src="/app.js" defer></script>', `<script src="app.js?v=${commit}" defer></script>`);
html = replaceOnce(html, '<script src="/os.js" defer></script>', `<script src="os.js?v=${commit}" defer></script>`);
html = html.replaceAll('@media (prefers-color-scheme: dark)', '@media all');
html = html.replaceAll('color-scheme: light dark;', 'color-scheme: dark;');
html = replaceOnce(html, '<head>', `<head>\n    <!-- FliskOS frontend from flisk-sh/fliskos@${commit}, copied by scripts/sync-console.mjs. Do not edit here. -->\n    <meta name="robots" content="noindex" />`);
writeFileSync(join(target, 'index.html'), html);
console.log(`console/ synced from fliskos@${commit}`);
