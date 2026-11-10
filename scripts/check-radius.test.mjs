import { test } from 'node:test';
import assert from 'node:assert/strict';
import { findRadiusProblems } from './check-radius.mjs';

test('allows the token, zero, circles and mixed zero corners', () => {
  const css = `.a{border-radius: var(--radius)} .b{border-radius:0} .c{border-radius: 50%}
    .d{border-radius: var(--radius) var(--radius) 0 0} .e{border-top-left-radius: inherit}`;
  assert.deepEqual(findRadiusProblems(css, 'x.css'), []);
});

test('flags pixel, rem and pill values', () => {
  const css = `.a{border-radius: 8px}\n.b{border-radius: 1.5rem}\n.c{border-radius: 999px}`;
  const problems = findRadiusProblems(css, 'x.css');
  assert.equal(problems.length, 3);
  assert.match(problems[0], /x\.css:1 border-radius: 8px/);
  assert.match(problems[2], /x\.css:3 .*999px/);
});

test('flags longhands, mixed values and inline JS styles', () => {
  const src = `.a{border-bottom-right-radius: 12px} .b{border-radius: var(--radius) 6px}
    el.style.borderRadius = '10px';`;
  assert.equal(findRadiusProblems(src, 'x.html').length, 3);
});

test('flags extra radius tokens outside style.css', () => {
  assert.equal(findRadiusProblems(':root{--radius-lg: 24px}', 'page.html').length, 1);
  assert.equal(findRadiusProblems(':root{--radius: 8px}', 'page.html').length, 1);
  assert.deepEqual(findRadiusProblems(':root{--radius: 4px; --bs-border-radius: var(--radius)}', 'assets/css/style.css'), []);
});
