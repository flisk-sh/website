// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT
//   node --test scripts/sync-llms-demos.test.mjs
import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { test } from "node:test";
import { demoSection, replaceDemoSection, sectionProblems, sync } from "./sync-llms-demos.mjs";

const filler = "Example text that makes the section long enough to look like the real instructions. ".repeat(24);
const SOURCE = `## Personal Demos (demo.flisk.sh)\n\n${filler}\n\nNever write a \`/d/...\` link yourself.\n\n## Bubbles: "@grok bubbles"\n\n- Words: postgres\n- Install command, only if asked.`;
const page = (middle) => `# Flisk\n\nIntro.\n\n${middle}\n\n## Docs\n\nMore.\n`;

test("the section runs from Personal Demos to the heading after Bubbles", () => {
  const text = page(`## Personal Demos (demo.flisk.sh)\nold\n\n## Bubbles: "@grok bubbles"\nold bubbles`);
  assert.equal(demoSection(text), `## Personal Demos (demo.flisk.sh)\nold\n\n## Bubbles: "@grok bubbles"\nold bubbles\n`);
  assert.equal(demoSection("# nothing here"), "");
});

test("replacing keeps everything outside the section and is idempotent", () => {
  const text = page(`## Personal Demos (demo.flisk.sh)\nold\n\n## Bubbles: "@grok bubbles"\nold bubbles`);
  const once = replaceDemoSection(text, SOURCE);
  assert.ok(once.startsWith("# Flisk\n\nIntro.\n\n## Personal Demos"));
  assert.ok(once.endsWith("\n\n## Docs\n\nMore.\n"));
  assert.equal(demoSection(once), `${SOURCE}\n`);
  assert.equal(replaceDemoSection(once, SOURCE), once);
  assert.throws(() => replaceDemoSection("# nothing here", SOURCE), /no "## Personal Demos"/);
});

test("a source that would damage the llms files is refused", () => {
  assert.deepEqual(sectionProblems(SOURCE), []);
  assert.match(sectionProblems("<html>404</html>").join(), /does not start/);
  assert.match(sectionProblems(`${SOURCE}\n\n## Extra`).join(), /heading after Bubbles/);
  assert.match(sectionProblems(`${SOURCE} {{ site.url }}`).join(), /Liquid/);
  assert.match(sectionProblems(SOURCE.replace("Never write a `/d/...` link yourself.", "")).join(), /\/d\/ link/);
  assert.match(sectionProblems("## Personal Demos\n## Bubbles\nshort").join(), /odd length/);
});

test("sync writes every llms file that exists, then --check passes; a stale copy fails --check without writing", async () => {
  const dir = mkdtempSync(join(tmpdir(), "llms-"));
  mkdirSync(join(dir, "docs", "agents"), { recursive: true });
  const root = pathToFileURL(`${dir}/`);
  const stale = page(`## Personal Demos (demo.flisk.sh)\nold\n\n## Bubbles: "@grok bubbles"\nold bubbles`);
  writeFileSync(join(dir, "docs", "agents", "llms.txt"), stale);
  writeFileSync(join(dir, "docs", "agents", "llms-full.txt"), stale);
  assert.deepEqual(await sync({ root, source: SOURCE, check: true }), ["docs/agents/llms.txt", "docs/agents/llms-full.txt"]);
  assert.equal(readFileSync(join(dir, "docs", "agents", "llms.txt"), "utf8"), stale, "--check writes nothing");
  assert.deepEqual(await sync({ root, source: SOURCE }), ["docs/agents/llms.txt", "docs/agents/llms-full.txt"]);
  assert.deepEqual(await sync({ root, source: `${SOURCE}\n`, check: true }), [], "in step now; a trailing newline in the source does not matter");
  await assert.rejects(sync({ root, source: "<html>oops</html>" }), /the source does not start/);
});
