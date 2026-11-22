// North star: how far a phone visitor scrolls before the first button they can actually press.
// Usage: node docs/north-star/north-star.mjs [url]   (needs playwright-core; set PLAYWRIGHT_CORE to its path if not installed)
// Counts only a button a person can see and tap: not hidden, not off to the side, not under a cookie wall or popup.
// Exit 0 = measured and fine, 1 = measured but the button is below the first screen or the page scrolls sideways,
// 2 = no button a visitor can press (the JSON line then has "value": null and the reason in "problem").
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pw = require(process.env.PLAYWRIGHT_CORE || "playwright-core");
const url = process.argv[2] || `https://flisk.sh/?x=${Date.now()}`;
const W = 375, H = 812;

// Runs in the page. Buttons in page order: the hero's .aw-btn first, then anything else styled or marked as a button.
export function firstUsableButton() {
  const SEL = "a.aw-btn, a[class*='btn' i], a[class*='button' i], button, [role='button'], input[type='submit']";
  const scope = document.querySelector("main") ?? document.body;
  const seen = [];
  const skipped = [];
  for (const el of scope.querySelectorAll(SEL)) {
    if (el.closest("nav, header nav, footer")) continue;
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    const label = (el.textContent || el.value || "").trim().slice(0, 40);
    if (r.width < 1 || r.height < 1 || s.visibility === "hidden" || s.display === "none" || Number(s.opacity) === 0) { skipped.push(`${label || el.tagName}: hidden`); continue; }
    if (r.right <= 0 || r.left >= innerWidth) { skipped.push(`${label}: off screen to the side`); continue; }
    seen.push(el);
  }
  for (const el of seen) {
    el.scrollIntoView({ block: "center" });
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1), Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1));
    const label = (el.textContent || el.value || "").trim().slice(0, 40);
    if (hit && (hit === el || el.contains(hit))) {
      const top = Math.round(r.top + scrollY);
      scrollTo(0, 0);
      return { button: top, label, skipped };
    }
    skipped.push(`${label}: covered by ${hit ? hit.tagName.toLowerCase() + (hit.className ? "." + String(hit.className).split(" ")[0] : "") : "nothing drawn"}`);
  }
  scrollTo(0, 0);
  return { button: null, label: null, skipped };
}

const browser = await pw.chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle" });
const m = await page.evaluate(firstUsableButton);
const extra = await page.evaluate(() => ({ h1: document.querySelector("h1") ? Math.round(document.querySelector("h1").getBoundingClientRect().top + scrollY) : null, scrollWidth: document.documentElement.scrollWidth }));
await browser.close();

const problems = [];
if (m.button == null) problems.push(`no button a visitor can press${m.skipped.length ? ` (${m.skipped.join("; ")})` : ""}`);
else if (m.button > H) problems.push(`the first button is ${m.button}px down, below the first screen (${H}px)`);
if (extra.scrollWidth > W) problems.push(`the page is ${extra.scrollWidth}px wide on a ${W}px phone: it scrolls sideways`);
const out = { value: m.button, baseline: 1935, unit: "px", measuredAt: new Date().toISOString(), run: url, button: m.label, h1: extra.h1, scrollWidth: extra.scrollWidth, ...(m.button == null ? { skipped: m.skipped } : {}),...(problems.length ? { problem: problems.join("; ") } : {}) };
// result.json records the live homepage only: measuring another page (a test page, a preview) must not overwrite it
if (m.button != null && !process.argv[2]) writeFileSync(new URL("./result.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(JSON.stringify(out));
if (m.button == null) process.exit(2);
if (problems.length) process.exit(1);
