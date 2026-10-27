import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { checkPages, findForbiddenClaims } from './check-claims.mjs';

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
