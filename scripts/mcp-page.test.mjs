// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT
//   node --test scripts/mcp-page.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("the /mcp/ card list keeps its column to the screen width", () => {
  // Each card holds a one-line command that does not wrap. With an auto grid column the card grows to that command's
  // width (805px at 375px wide), so the Copy button is cut off on a phone.
  const css = readFileSync(new URL("../assets/css/aw-dark.css", import.meta.url), "utf8");
  const rule = css.match(/\.aw-mcp-list\s*\{([^}]*)\}/);
  assert.ok(rule, ".aw-mcp-list rule is missing");
  assert.match(rule[1], /grid-template-columns:\s*minmax\(0,\s*1fr\)/);
});
