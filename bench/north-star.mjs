// North star: how far a phone visitor scrolls before the first button.
// Usage: node bench/north-star.mjs [url]   (needs playwright-core; set PLAYWRIGHT_CORE to its path if not installed)
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pw = require(process.env.PLAYWRIGHT_CORE || "playwright-core");
const url = process.argv[2] || `https://flisk.sh/?x=${Date.now()}`;
const browser = await pw.chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle" });
const m = await page.evaluate(() => {
  const top = (el) => (el ? Math.round(el.getBoundingClientRect().top + scrollY) : null);
  const btn = document.querySelector("main a.aw-btn, .aw-hero a.aw-btn");
  return { button: top(btn), h1: top(document.querySelector("h1")), scrollWidth: document.documentElement.scrollWidth };
});
await browser.close();
const out = { value: m.button, baseline: 1935, unit: "px", measuredAt: new Date().toISOString(), run: url, h1: m.h1, scrollWidth: m.scrollWidth };
writeFileSync(new URL("./north-star.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(JSON.stringify(out));
if (m.scrollWidth > 375 || m.button > 812) process.exit(1);
