// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT
//   node --test scripts/sync-docs.test.mjs
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";
import { PAGES, headingId, jumpList, renderPage, resolveLink, sourceProblems, sync, toSiteMarkdown } from "./sync-docs.mjs";

const filler = "Example text that makes the page long enough to look like the real one. ".repeat(40);
const SOURCE = `# ⚡ Flisk mega cheat sheet

> Every command. Taken from \`flisk --help\` for **v1.3.125**.

**Jump to:** [🚀 Start](#-first-five-minutes) · [🔥 Top 10](#-top-10)

Want the short version? See the [10-row cheat sheet](../cli/README.md#cheat-sheet).

> [!NOTE]
> Needs Docker ([setup](wsl2.md)).

## 🚀 First five minutes

\`\`\`mermaid
flowchart LR
  A --> B
\`\`\`

See [troubleshooting](troubleshooting.md#ports), [recipes](recipes/) and [Tilt](https://docs.tilt.dev/).

${filler}
`;

test("links into the Flisk repository become absolute, and our own pages stay on the site", () => {
  assert.equal(resolveLink("wsl2.md"), "https://github.com/flisk-sh/flisk/blob/main/docs/wsl2.md");
  assert.equal(resolveLink("../cli/src/commands/up.ts"), "https://github.com/flisk-sh/flisk/blob/main/cli/src/commands/up.ts");
  assert.equal(resolveLink("recipes/"), "https://github.com/flisk-sh/flisk/tree/main/docs/recipes/");
  assert.equal(resolveLink("byo.md#one-shot-jobs"), "https://github.com/flisk-sh/flisk/blob/main/docs/byo.md#one-shot-jobs");
  assert.equal(resolveLink("troubleshooting.md#ports"), "/docs/troubleshooting/#ports");
  assert.equal(resolveLink("cheat-sheet.md"), "/docs/cli/");
  assert.equal(resolveLink("#ports"), "#ports");
  assert.equal(resolveLink("https://docs.tilt.dev/"), "https://docs.tilt.dev/");
});

test("the site copy has no title, jump list, version label, emoji, mermaid or GitHub alert", () => {
  const out = toSiteMarkdown(SOURCE);
  assert.ok(out.startsWith("> **Note:** Needs Docker ([setup](https://github.com/flisk-sh/flisk/blob/main/docs/wsl2.md))."));
  assert.ok(out.includes("\n## First five minutes\n"));
  assert.ok(out.includes("[troubleshooting](/docs/troubleshooting/#ports)"));
  for (const gone of ["# ⚡", "v1.3.125", "Jump to", "short version", "mermaid", "[!NOTE]", "🚀", "·"]) {
    assert.ok(!out.includes(gone), gone);
  }
});

test("a long page gets a jump list with the ids kramdown gives its headings", () => {
  const md = "## First five minutes\n\n## Top 10\n\n```bash\n## not a heading\n```\n\n## `flisk up` <flags>\n\n## JSON output & exit codes\n\n## Top 10\n";
  const nav = jumpList(md);
  assert.ok(nav.includes('aria-label="On this page"'));
  assert.deepEqual([...nav.matchAll(/href="#([^"]+)"/g)].map((m) => m[1]), ["first-five-minutes", "top-10", "flisk-up-flags", "json-output--exit-codes", "top-10-1"]);
  assert.ok(nav.includes(">flisk up &lt;flags></a>"));
  assert.ok(nav.includes(">JSON output &amp; exit codes</a>"));
  assert.ok(!nav.includes("not a heading"));
  assert.equal(headingId("100-service test"), "service-test");
  const nested = jumpList("## Configuration\n\n### Environment variables\n\n## Stacks\n\n## Lifecycle\n\n## Environment variables\n");
  assert.ok(nested.includes('href="#environment-variables-1"'));
  assert.ok(!nested.includes('href="#environment-variables"'));
  assert.equal(jumpList("## One\n\n## Two\n"), "");
});

test("a broken source is refused", () => {
  assert.deepEqual(sourceProblems(SOURCE), []);
  assert.ok(sourceProblems("<!doctype html><html>Not found</html>").length);
  assert.ok(sourceProblems(`${SOURCE}{% endraw %}`).includes("contains a Liquid endraw tag"));
});

test("sync writes one page per source and keeps Liquid in the text from running", async () => {
  const root = mkdtempSync(join(tmpdir(), "sync-docs-"));
  const from = mkdtempSync(join(tmpdir(), "sync-docs-src-"));
  for (const page of PAGES) writeFileSync(join(from, page.source), `${SOURCE}\nUse {{ value }} here.\n`);
  const written = await sync({ root, from });
  assert.deepEqual(written, PAGES.map((p) => p.out));
  const page = readFileSync(join(root, PAGES[0].out), "utf8");
  assert.ok(page.includes("{% include docs-sidebar.html %}"));
  assert.ok(page.indexOf("{% raw %}") < page.indexOf("{{ value }}") && page.indexOf("{{ value }}") < page.indexOf("{% endraw %}"));
  assert.equal(page, renderPage(PAGES[0], `${SOURCE}\nUse {{ value }} here.\n`));
  await assert.rejects(sync({ root, fetchText: async () => "<html>404</html>" }), /looks like an HTML page/);
});

test("sync leaves the existing pages unchanged when a later source is invalid", async (t) => {
  const root = mkdtempSync(join(tmpdir(), "sync-docs-"));
  t.after(() => rmSync(root, { recursive: true, force: true }));
  for (const page of PAGES) {
    const file = join(root, page.out);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, `previous ${page.source}`);
  }

  await assert.rejects(sync({
    root,
    fetchText: async (url) => url.endsWith(PAGES[0].source) ? SOURCE : "<html>404</html>",
  }), /troubleshooting\.md looks like an HTML page/);

  for (const page of PAGES) {
    assert.equal(readFileSync(join(root, page.out), "utf8"), `previous ${page.source}`);
  }
});
