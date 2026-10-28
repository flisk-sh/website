import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkPages, demoLinkProblems, findForbiddenClaims } from './check-claims.mjs';

test('allows the registry wording, including its "Not a cold boot." negation', () => {
  const html = '<p>14 tiny services healthy in 4.6s on a 16 GB M1 after images existed. Not a cold boot.</p>';
  assert.deepEqual(findForbiddenClaims(html), []);
  assert.deepEqual(findForbiddenClaims('<p>after images existed (not a cold boot) the 14 tiny services</p>'), []);
});

test('flags "under 5 seconds" in any form', () => {
  assert.equal(findForbiddenClaims('<div>our 14-service stack is healthy in under 5 seconds once images are built</div>').length, 1);
  assert.equal(findForbiddenClaims('<p>$0 and under <b>5</b> seconds of startup</p>').length, 1);
  assert.equal(findForbiddenClaims('<p>Under five seconds to boot.</p>').length, 1);
});

test('flags "cold boot" and "from zero" next to the 14-service number', () => {
  assert.equal(findForbiddenClaims('<p>A full cold boot of 14 services in 4.6s.</p>').length, 1);
  assert.equal(findForbiddenClaims('<h2>Watch a cold boot</h2><p>4.6s</p><span>from zero to a healthy 14-service demo stack</span>').length, 2);
});

test('allows "cold boot" and "from zero" away from the 14-service number', () => {
  assert.deepEqual(findForbiddenClaims('<p>From zero to a running stack in under five minutes.</p>'), []);
  assert.deepEqual(findForbiddenClaims('<p>The 100-stub cold boot builds images from scratch.</p>'), []);
});

test('flags the other registry-forbidden phrases', () => {
  assert.equal(findForbiddenClaims('<p>It looks like weeks of integration.</p>').length, 1);
  assert.equal(findForbiddenClaims('<p>Our ERP system with 100 services.</p>').length, 1);
  assert.equal(findForbiddenClaims('<p>Companies lose weeks of salary.</p>').length, 1);
});

test('checkPages scans every page under a directory and names the file', () => {
  const dir = mkdtempSync(join(tmpdir(), 'claims-'));
  mkdirSync(join(dir, 'why'));
  writeFileSync(join(dir, 'index.html'), '<p>Not a cold boot. 14 tiny services healthy in 4.6s.</p>');
  writeFileSync(join(dir, 'why', 'index.html'), '<p>A full cold boot in under 5 seconds for 14 services.</p>');
  const failures = checkPages(dir);
  assert.equal(failures.length, 2);
  assert.ok(failures.every((failure) => failure.includes('why/index.html')));
});

// Grok answered "@grok make bubbles" with a made-up demo.flisk.sh/d/ link (a 404), and llms.txt offered a bare
// demo.flisk.sh/<x-handle>, which builds nothing for a person without a demo.
const demo = (body) => `## Personal Demos (demo.flisk.sh)\n\nNever write a \`/d/...\` link yourself.\n\n## Bubbles: "@grok bubbles"\n\n${body}\n\n## Agent Skills\n`;

test('demo links an agent is told to write carry words', () => {
  assert.deepEqual(demoLinkProblems(demo('  https://demo.flisk.sh/<x-handle>/<what-they-build-in-dashes>\n- If none, use `postgres`: https://demo.flisk.sh/<x-handle>/postgres. A bare https://demo.flisk.sh/<x-handle> only opens a demo that person already has and is a 404 otherwise.\n- The diagram from https://demo.flisk.sh/v1/demo/<id> as written.')), []);
  assert.equal(demoLinkProblems(demo('- If none, use the handle alone: https://demo.flisk.sh/<x-handle>')).length, 1);
  assert.equal(demoLinkProblems(demo('Reply with https://demo.flisk.sh/d/<id>.')).length, 1);
});

test('the demo section must say to never write a /d/ link', () => {
  assert.deepEqual(demoLinkProblems('## Personal Demos\n\n## Bubbles\n\nx\n\n## Next\n'), ['does not say to never write a /d/ link']);
  assert.deepEqual(demoLinkProblems('no demo section'), ['has no Personal Demos and Bubbles sections']);
});
