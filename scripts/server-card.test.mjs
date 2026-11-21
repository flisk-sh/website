// MCP Server Cards must fit the schema: description 1-100 characters, title at most 100.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL(`../${p}`, import.meta.url), 'utf8');

const cards = [];
for (const p of ['.well-known/mcp-server-card.json', '.well-known/mcp/server-card.json']) {
  cards.push([p, JSON.parse(read(p))]);
}
for (const e of JSON.parse(read('.well-known/ai-catalog.json')).entries) {
  if (e.data) cards.push([`ai-catalog ${e.identifier}`, e.data]);
}

for (const [label, card] of cards) {
  test(`${label}: description 1-100 chars, title at most 100`, () => {
    assert.ok(card.description.length >= 1 && card.description.length <= 100, `description is ${card.description.length}`);
    assert.ok(card.title.length >= 1 && card.title.length <= 100, `title is ${card.title.length}`);
  });
}

test('the two well-known main cards are byte-identical', () => {
  assert.equal(read('.well-known/mcp-server-card.json'), read('.well-known/mcp/server-card.json'));
});
