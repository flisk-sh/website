// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT
// Copies the "Personal Demos" and "Bubbles" instructions into the llms files from their one source, the demo worker
// (https://demo.flisk.sh/llms-demos.txt, flisk-sh/flisk-demo-worker src/llms.js). The same text was kept by hand in
// flisk (docs/agents) and website (llms) and drifted. Edit it at the source; this script, and a weekly job that opens
// the pull request, bring the copies in line.
//   node scripts/sync-llms-demos.mjs               write the copies
//   node scripts/sync-llms-demos.mjs --check       exit 1 if a copy differs from the source (writes nothing)
//   node scripts/sync-llms-demos.mjs --from <file> use a local copy of the source instead of the URL
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export const SOURCE_URL = "https://demo.flisk.sh/llms-demos.txt";
// The llms files of whichever repository this is: flisk keeps them in docs/agents, website at its root.
export const CANDIDATES = ["docs/agents/llms.txt", "docs/agents/llms-full.txt", "llms.txt", "llms-full.txt"];

// From "## Personal Demos" to the heading after "## Bubbles": the same boundary both repositories already test.
export function demoBounds(text) {
  const start = text.indexOf("## Personal Demos");
  const bubbles = text.indexOf("## Bubbles");
  if (start < 0 || bubbles < 0) return null;
  const next = text.indexOf("\n## ", bubbles);
  return { start, end: next < 0 ? text.length : next };
}

export function demoSection(text) {
  const b = demoBounds(text);
  return b ? text.slice(b.start, b.end) : "";
}

// Refuses a source that would damage the llms files: the wrong text (an error page), a stray heading that would
// move the boundary, a Liquid tag Jekyll would run, or a /d/ link an agent could copy.
export function sectionProblems(section) {
  const problems = [];
  if (!section.startsWith("## Personal Demos")) problems.push('does not start with "## Personal Demos"');
  if (!section.includes("## Bubbles")) problems.push('has no "## Bubbles" heading');
  if (/\n## /.test(section.slice(section.indexOf("## Bubbles") + 1))) problems.push("has a heading after Bubbles");
  if (/\{\{|\{%/.test(section)) problems.push("contains a Liquid tag");
  if (/<html|<!doctype/i.test(section)) problems.push("looks like an HTML page");
  if (section.length < 1500 || section.length > 20000) problems.push(`has an odd length (${section.length})`);
  if (!/Never write a `\/d\/\.\.\.` link yourself/.test(section)) problems.push("lost the rule that agents never write a /d/ link");
  return problems;
}

export function replaceDemoSection(text, section) {
  const b = demoBounds(text);
  if (!b) throw new Error('no "## Personal Demos" and "## Bubbles" sections to replace');
  // The section keeps its last newline (the next heading starts at the newline after it), as demoSection reads it.
  return `${text.slice(0, b.start)}${section.trimEnd()}\n${text.slice(b.end)}`;
}

export async function sync({ root, source, check = false }) {
  const section = source.trimEnd();
  const problems = sectionProblems(section);
  if (problems.length) throw new Error(`the source ${problems.join("; ")}`);
  const drifted = [];
  for (const rel of CANDIDATES) {
    const path = new URL(rel, root);
    if (!existsSync(path)) continue;
    const text = readFileSync(path, "utf8");
    const next = replaceDemoSection(text, section);
    if (next === text) continue;
    drifted.push(rel);
    if (!check) writeFileSync(path, next);
  }
  return drifted;
}

async function main() {
  const args = process.argv.slice(2);
  const from = args.includes("--from") ? args[args.indexOf("--from") + 1] : null;
  const check = args.includes("--check");
  const root = new URL("../", import.meta.url);
  let source;
  if (from) {
    source = readFileSync(from, "utf8");
  } else {
    const res = await fetch(process.env.LLMS_DEMOS_URL ?? SOURCE_URL);
    if (!res.ok) throw new Error(`${SOURCE_URL} answered ${res.status}`);
    source = await res.text();
  }
  const drifted = await sync({ root, source, check });
  if (!drifted.length) return console.log("llms demo instructions are in step with the source");
  console.log(`${check ? "out of step with the source" : "updated from the source"}: ${drifted.join(", ")}`);
  if (check) process.exitCode = 1;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(`sync-llms-demos: ${err.message}`);
    process.exitCode = 2;
  });
}
