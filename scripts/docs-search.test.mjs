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
  assert.ok(page.includes('data-docs-ask-q'), 'question chips');
  assert.ok(page.includes('list="aw-docs-ask-list"'), 'questions suggested while typing');
  const data = readFileSync(new URL('../_data/docs_questions.yml', import.meta.url), 'utf8');
  const start = data.split('compare:')[0].match(/^ {2}- /gm) || [];
  const compare = data.split('compare:')[1].match(/^ {2}- /gm) || [];
  assert.ok(start.length >= 6, 'at least six starter questions');
  assert.ok(compare.length >= 10, 'look-alike commands compared');
});

test('docs pages skip reveal animations when the reader asks for reduced motion', () => {
  for (const page of ['index.html', 'quickstart/index.html', 'configuration/index.html', 'scripts/index.html', 'examples/index.html']) {
    const source = readFileSync(new URL(`../docs/${page}`, import.meta.url), 'utf8');
    if (!source.includes('gsap.from(')) continue;
    assert.ok(source.includes('prefers-reduced-motion: reduce'), `${page} animates without checking reduced motion`);
  }
});

test('searchRequest takes a smaller limit for the wake-up search', () => {
  assert.equal(searchRequest('flisk', 0, 1).params.arguments.limit, 1);
  assert.equal(searchRequest('flisk').params.arguments.limit, 12);
});

test('the script wakes Helpdock from docs pages and docs links', () => {
  const source = readFileSync(new URL('../assets/js/aw-docs-search.js', import.meta.url), 'utf8');
  for (const type of ['pointerover', 'focusin', 'touchstart']) assert.ok(source.includes(`'${type}'`));
  assert.ok(source.includes("doc.querySelector('.aw-docs-body')) prewarm()"));
});

test('parseHits opens the page in Helpdock and keeps the GitHub file for the AI prompt', () => {
  const [hit] = parseHits(
    answer({
      hits: [
        {
          section: 'Leaving',
          url: 'https://github.com/flisk-sh/flisk/blob/abc/docs/leaving-flisk.md#leaving',
          page: 'https://helpdock.flisk.si/flisk-sh/flisk/tree/main/docs/#page=docs%2Fleaving-flisk.md',
        },
      ],
    }),
  );
  assert.match(hit.url, /^https:\/\/helpdock\.flisk\.si\//);
  assert.match(hit.github, /^https:\/\/github\.com\//);
  assert.ok(aiPrompt('q', [hit]).includes('(https://github.com/'));
});

test('parseHits keeps at most two sections of one page', () => {
  const hits = parseHits(answer({ hits: ['a', 'a', 'a', 'b', 'a', 'c'].map((source, i) => ({ source, section: `s${i}` })) }));
  assert.deepEqual(hits.map((h) => h.source), ['a', 'a', 'b', 'c']);
});

// The AI answer (beta) under the results: Helpdock's /answer, see services/agents/agent/src/ai-answer.ts in flisk-sh/helpdock.
const { parseAnswer, inlineParts, answerBlocks, handoffLinks, ANSWER_URL } = require('../assets/js/aw-docs-search.js');

test('ANSWER_URL is the help center answer route next to the MCP endpoint', () => {
  assert.equal(ANSWER_URL, HELPDOCK + 'answer');
});

test('parseAnswer reads an answer with its sources', () => {
  const r = parseAnswer(200, {
    available: true,
    answer: 'Use `flisk down --purge` [1].',
    sources: [{ n: 1, source: 'docs/cheat-sheet.md', section: 'flisk down', page: 'https://helpdock.flisk.si/flisk-sh/flisk/tree/main/docs/#page=x' }],
  });
  assert.equal(r.kind, 'answer');
  assert.equal(r.text, 'Use `flisk down --purge` [1].');
  assert.deepEqual(r.sources, [{ n: 1, label: 'flisk down', url: 'https://helpdock.flisk.si/flisk-sh/flisk/tree/main/docs/#page=x' }]);
});

test('parseAnswer maps every other outcome', () => {
  assert.equal(parseAnswer(200, { available: true, answer: null, notCovered: true, sources: [] }).kind, 'not-covered');
  assert.equal(parseAnswer(429, null).kind, 'rate');
  assert.equal(parseAnswer(404, { available: false }).kind, 'off');
  assert.equal(parseAnswer(503, { available: false }).kind, 'down');
  assert.equal(parseAnswer(502, null).kind, 'down');
  assert.equal(parseAnswer(200, null).kind, 'down');
});

test('parseAnswer never links a source outside https', () => {
  const r = parseAnswer(200, { answer: 'x [1]', sources: [{ section: 's', page: 'javascript:alert(1)', url: 'http://evil' }] });
  assert.equal(r.sources[0].url, HELPDOCK);
});

test('inlineParts splits code, citations and text, and drops bold markers', () => {
  assert.deepEqual(inlineParts('Run `flisk up` [1, 3] then **check** it.'), [
    { type: 'text', value: 'Run ' },
    { type: 'code', value: 'flisk up' },
    { type: 'text', value: ' ' },
    { type: 'cite', value: 1 },
    { type: 'cite', value: 3 },
    { type: 'text', value: ' then check it.' },
  ]);
});

test('answerBlocks builds paragraphs, lists and code blocks, never HTML', () => {
  const blocks = answerBlocks('First <b>line</b> [1].\n- one\n- two\n1. step\n```bash\nflisk up\n```');
  assert.deepEqual(
    blocks.map((b) => b.type),
    ['p', 'ul', 'ol', 'pre'],
  );
  assert.deepEqual(blocks[0].parts[0], { type: 'text', value: 'First <b>line</b> ' });
  assert.equal(blocks[1].items.length, 2);
  assert.equal(blocks[3].code, 'flisk up');
});

test('handoffLinks fills in the question for an issue', () => {
  const links = handoffLinks('How do I add a Python worker?');
  assert.equal(links.discord, 'https://discord.gg/qMu5Xn8Kaq');
  const url = new URL(links.issue);
  assert.equal(url.origin + url.pathname, 'https://github.com/flisk-sh/flisk/issues/new');
  assert.equal(url.searchParams.get('title'), 'Docs question: How do I add a Python worker?');
  assert.match(url.searchParams.get('body'), /> How do I add a Python worker\?/);
});
