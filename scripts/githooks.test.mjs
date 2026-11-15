// Copyright (c) 2026 Flisk Landscape contributors
// SPDX-License-Identifier: MIT
//   node --test scripts/githooks.test.mjs
// The opt-in hooks in .githooks/ run a subset of scripts/check.sh. This keeps them runnable and stops them from
// drifting into checks that CI does not run.
import assert from "node:assert/strict";
import { readFileSync, statSync } from "node:fs";
import { test } from "node:test";

const root = new URL("..", import.meta.url);
const check = readFileSync(new URL("scripts/check.sh", root), "utf8");

for (const hook of ["pre-commit", "pre-push"]) {
  test(`${hook} is executable and runs only checks that scripts/check.sh runs`, () => {
    const file = new URL(`.githooks/${hook}`, root);
    assert.ok(statSync(file).mode & 0o100, `${hook} must be executable`);
    const text = readFileSync(file, "utf8");
    const commands = text.split("\n").filter((line) => /^(node|bundle exec) /.test(line));
    assert.ok(commands.length > 0, `${hook} runs no checks`);
    for (const command of commands) {
      const base = command.replace(/ --test-reporter=\S+| --quiet/g, "");
      assert.ok(check.includes(base), `${hook}: "${base}" is not in scripts/check.sh`);
    }
  });
}
