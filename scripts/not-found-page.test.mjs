// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT
//   node --test scripts/not-found-page.test.mjs
// GitHub Pages serves /404.html for any missing address. Without it, readers get GitHub's own page, which is not
// sized for a phone and has no way back to the site.
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { test } from "node:test";

const root = new URL("..", import.meta.url);

test("the site has a 404 page in its own layout with links back", () => {
  const page = readFileSync(new URL("404.html", root), "utf8");
  assert.match(page, /^---\nlayout: default\n/);
  assert.match(page, /^permalink: \/404\.html$/m);
  assert.match(page, /^sitemap: false$/m);
  const links = [...page.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(links.includes("/docs/") && links.includes("/"), "links to the docs and the home page");
  for (const href of links) {
    // The page is served at any depth, so every link must start at the site root.
    assert.ok(href.startsWith("/"), `${href} must start with /`);
    const file = href === "/" ? "index.html" : `${href.slice(1)}index.html`;
    assert.ok(existsSync(new URL(file, root)), `${href} has no page`);
  }
});
