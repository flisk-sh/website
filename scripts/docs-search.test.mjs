// The docs search (assets/js/aw-docs-search.js) reads Helpdock's MCP answers.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const { aiPrompt, excerpt, searchRequest, parseHits, MCP_URL, HELPDOCK } = require('../assets/js/aw-docs-search.js');

const answer = (payload) => ({ jsonrpc: '2.0', id: 1, result: { content: [{ type: 'text', text: JSON.stringify(payload) }] } });

test('searchRequest calls the search_docs tool', () => {
  const body = searchRequest('port in use', 7);
  assert.equal(body.method, 'tools/call');
  assert.equal(body.id, 7);
  assert.equal(body.params.name, 'search_docs');
  assert.equal(body.params.arguments.query, 'port in use');
});

test('parseHits maps Helpdock hits to rows', () => {
  const hits = parseHits(
    answer({
      hits: [
        {
          title: 'Troubleshooting',
          section: 'Port is already in use',
          source: 'docs/troubleshooting.md',
          text: '```text\n$ flisk up\n```\n\n- **Cause:** see [`up.ts`](../cli/up.ts).',
          url: 'https://github.com/flisk-sh/flisk/blob/abc/docs/troubleshooting.md#port',
        },
      ],
    }),
  );
  assert.equal(hits.length, 1);
  assert.equal(hits[0].section, 'Port is already in use');
  assert.equal(hits[0].source, 'docs/troubleshooting.md');
  assert.equal(hits[0].text, '$ flisk up - Cause: see up.ts.');
  assert.match(hits[0].url, /^https:\/\/github\.com\//);
});

test('parseHits never links to a non-https address', () => {
  const [hit] = parseHits(answer({ hits: [{ section: 'x', url: 'javascript:alert(1)' }] }));
  assert.equal(hit.url, HELPDOCK);
});

test('parseHits returns no rows for no hits and throws on an error', () => {
  assert.deepEqual(parseHits(answer({ hits: [] })), []);
  assert.throws(() => parseHits({ jsonrpc: '2.0', id: 1, error: { code: -32000, message: 'boom' } }), /boom/);
  assert.throws(() => parseHits({ result: { isError: true, content: [{ type: 'text', text: 'bad query' }] } }), /bad query/);
  assert.throws(() => parseHits(null));
});

test('excerpt keeps underscores in names', () => {
  assert.equal(excerpt('Set `FLISK_HTTP_PORT` to a **free** port'), 'Set FLISK_HTTP_PORT to a free port');
});

test('excerpt drops table rules', () => {
  assert.equal(excerpt('| Variable | Default |\n| :--- | :--- |\n| TILT_PORT | 10350 |'), 'Variable Default TILT_PORT 10350');
});

test('excerpt cuts long text at a word', () => {
  const out = excerpt('word '.repeat(100), 50);
  assert.ok(out.length <= 53);
  assert.ok(out.endsWith('...'));
  assert.ok(!out.includes('  '));
});

test('the sidebar link and the script point at the same Helpdock docs', () => {
  const sidebar = readFileSync(new URL('../_includes/docs-sidebar.html', import.meta.url), 'utf8');
  assert.ok(sidebar.includes(`data-docs-search href="${HELPDOCK}"`));
  assert.equal(MCP_URL, `${HELPDOCK}mcp`);
});

test('aiPrompt hands over the question and at most four numbered passages', () => {
  const hits = [1, 2, 3, 4, 5].map((n) => ({ section: `Section ${n}`, url: `https://github.com/x#${n}`, passage: `Passage ${n}` }));
  const prompt = aiPrompt('Do we need Kubernetes?', hits);
  assert.ok(prompt.includes('Question: Do we need Kubernetes?'));
  assert.ok(prompt.includes('[1] Section 1 (https://github.com/x#1)\nPassage 1'));
  assert.ok(prompt.includes('[4] Section 4'));
  assert.ok(!prompt.includes('Section 5'));
});

test('the Ask bar on the docs overview offers ready-made questions', () => {
  const page = readFileSync(new URL('../docs/index.html', import.meta.url), 'utf8');
  assert.ok(page.includes(`data-docs-ask action="${HELPDOCK}"`));
  const chips = page.match(/data-docs-ask-q/g) || [];
  assert.ok(chips.length >= 6, 'at least six questions');
});
