// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT
//   node --test scripts/compare-page.test.mjs
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

test("compare/index.html covers Overmind, PM2, Encore, Supabase CLI, and Aspire with dated sources", () => {
  const html = readFileSync(new URL("../compare/index.html", import.meta.url), "utf8");

  // Verify all 5 alternatives are present
  assert.ok(html.includes("Overmind"), "Overmind missing from compare/index.html");
  assert.ok(html.includes("PM2"), "PM2 missing from compare/index.html");
  assert.ok(html.includes("Encore"), "Encore missing from compare/index.html");
  assert.ok(html.includes("Supabase CLI"), "Supabase CLI missing from compare/index.html");
  assert.ok(html.includes(".NET Aspire"), ".NET Aspire missing from compare/index.html");

  // Verify dated source links
  assert.ok(html.includes("https://github.com/DarthSim/overmind"), "Overmind link missing");
  assert.ok(html.includes("https://pm2.keymetrics.io/docs/"), "PM2 link missing");
  assert.ok(html.includes("https://encore.dev/docs"), "Encore link missing");
  assert.ok(html.includes("https://supabase.com/docs/guides/local-development/cli/getting-started"), "Supabase link missing");
  assert.ok(html.includes("https://learn.microsoft.com/en-us/dotnet/aspire/"), "Aspire link missing");

  // Verify Supabase public alpha disclaimer
  assert.match(
    html,
    /per-worktree.*(?:isolation|branching).*native.*public alpha|public alpha.*per-worktree/i,
    "Supabase CLI must state that per-worktree and native modes are public alpha"
  );
});

test("index.html FAQ answers 'Why not Docker Compose Watch?' with factual contrast and agent surface", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");

  assert.ok(
    html.includes("Why not Docker Compose Watch?"),
    "FAQ item 'Why not Docker Compose Watch?' missing from index.html"
  );

  // Verifies Docker Compose Watch capabilities are stated accurately (sync/rebuild/restart on save)
  assert.match(
    html,
    /Compose Watch.*(?:sync|rebuild|restart|save)/i,
    "FAQ answer must describe Compose Watch file sync and container update capabilities"
  );

  // Verifies Flisk agent surface is explained
  assert.match(
    html,
    /flisk connect|MCP|AGENTS\.md/i,
    "FAQ answer must highlight Flisk's AI agent surface"
  );
});

test("compare/index.html and FAQ avoid banned hype verbs", () => {
  const compare = readFileSync(new URL("../compare/index.html", import.meta.url), "utf8");
  const home = readFileSync(new URL("../index.html", import.meta.url), "utf8");

  const hypeVerbs = [/\belevate\b/i, /\bseamless\b/i, /\bunleash\b/i, /\bnext-gen\b/i, /\brevolutionize\b/i];
  for (const regex of hypeVerbs) {
    assert.ok(!regex.test(compare), `compare/index.html contains hype verb matching ${regex}`);
    assert.ok(!regex.test(home), `index.html contains hype verb matching ${regex}`);
  }
});
