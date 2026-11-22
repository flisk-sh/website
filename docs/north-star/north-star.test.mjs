// Runs the real north star measure (headless Chromium, phone size) over pages a person would rank, plus pages built to
// fool it. Each must come out as a person would see it. Run: node --test docs/north-star/north-star.test.mjs   (needs playwright-core)
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

const SCRIPT = fileURLToPath(new URL("./north-star.mjs", import.meta.url));
const dir = mkdtempSync(join(tmpdir(), "north-star-"));
after(() => rmSync(dir, { recursive: true, force: true }));

const css = `body{margin:0;font:16px/1.5 system-ui}main{padding:20px}h1{font-size:32px;line-height:1.15;margin:0 0 12px}
.aw-btn,.btn{display:inline-block;background:#111;color:#fff;padding:14px 20px;text-decoration:none}.img{background:#ccd}`;
const page = (body) => `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>${css}</style></head><body>${body}</body></html>`;
const words = (n) => "teams ship faster with one command ".repeat(n);
const BAD = `<nav style="height:120px">Menu</nav><h1>The orchestration control plane for serverless pods</h1><p>${words(15)}</p><div class="img" style="height:1300px"></div><p>${words(10)}</p><a class="aw-btn" href="#s">Request a demo</a>`;

function measure(name, body) {
  const file = join(dir, `${name}.html`);
  writeFileSync(file, page(body));
  try {
    const out = execFileSync(process.execPath, [SCRIPT, pathToFileURL(file).href], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    return { exit: 0, ...JSON.parse(out.trim().split("\n").pop()) };
  } catch (e) {
    return { exit: e.status, ...JSON.parse(String(e.stdout).trim().split("\n").pop()) };
  }
}

test("bad, middle, good and best pages rank in that order", { timeout: 120000 }, () => {
  const bad = measure("bad", `<main>${BAD}</main>`);
  const middle = measure("middle", `<main><nav style="height:60px">Menu</nav><h1>Run your app on your laptop</h1><p>${words(8)}</p><div class="img" style="height:520px"></div><a class="aw-btn" href="#s">Get started</a></main>`);
  const good = measure("good", `<main><h1>Run your app on your laptop</h1><p>One command starts every service.</p><div class="img" style="height:200px"></div><a class="aw-btn" href="#s">Get started</a></main>`);
  const best = measure("best", `<main><h1>Run your app on your laptop</h1><p>One command. Free.</p><a class="aw-btn" href="#s">Get started</a><div class="img" style="height:400px"></div></main>`);
  assert.ok(bad.value > middle.value && middle.value > good.value && good.value > best.value, JSON.stringify([bad.value, middle.value, good.value, best.value]));
  assert.equal(bad.exit, 1, "a button below the first screen fails");
  assert.equal(middle.exit, 1);
  assert.equal(good.exit, 0);
  assert.equal(best.exit, 0);
});

test("a hidden button does not count: the bad page stays bad", { timeout: 120000 }, () => {
  const r = measure("hidden", `<main><a class="aw-btn" href="#x" style="display:none">Start</a>${BAD}</main>`);
  assert.ok(r.value > 812, `hidden button scored ${r.value}`);
  assert.equal(r.button, "Request a demo");
});

test("a button with another class name is still found", { timeout: 120000 }, () => {
  const r = measure("renamed", `<main><h1>Run your app on your laptop</h1><p>One command. Free.</p><a class="btn" href="#s">Get started</a></main>`);
  assert.equal(typeof r.value, "number");
  assert.ok(r.value < 400);
  assert.equal(r.exit, 0);
});

test("a button under a cookie wall cannot be pressed: no number, exit 2, says why", { timeout: 120000 }, () => {
  const r = measure("wall", `<div style="position:fixed;inset:0;background:#fff;z-index:9">We value your privacy</div><main><h1>Run your app</h1><p>One command.</p><a class="aw-btn" href="#s">Get started</a></main>`);
  assert.equal(r.value, null);
  assert.equal(r.exit, 2);
  assert.match(r.problem, /covered/);
});

test("a page wider than the phone fails even with the button on the first screen", { timeout: 120000 }, () => {
  const r = measure("wide", `<main><h1>Run your app</h1><p>One command.</p><a class="aw-btn" href="#s">Get started</a><div class="img" style="width:1200px;height:100px"></div></main>`);
  assert.ok(r.value < 812);
  assert.equal(r.exit, 1);
  assert.match(r.problem, /scrolls sideways/);
});

test("a nav link styled as a button is not the hero button", { timeout: 120000 }, () => {
  const r = measure("nav", `<nav><a class="btn" href="#login">Log in</a></nav><main><h1>Run your app</h1><p>One command.</p><a class="aw-btn" href="#s">Get started</a></main>`);
  assert.equal(r.button, "Get started");
});
