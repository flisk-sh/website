// North star: how far a phone visitor scrolls before the first button they can actually press.
// Usage: node docs/north-star/north-star.mjs [url]   (needs playwright-core; set PLAYWRIGHT_CORE to its path if not installed)
// Counts only a button a person can see and tap: not hidden, not tiny, readable, not off to the side, not under a cookie wall or popup.
// Exit 0 = measured and fine, 1 = measured but the button is below the first screen or the page scrolls sideways,
// 2 = no button a visitor can press (the JSON line then has "value": null and the reason in "problem").
import { writeFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pw = require(process.env.PLAYWRIGHT_CORE || "playwright-core");
const url = process.argv[2] || `https://flisk.sh/?x=${Date.now()}`;
const W = 375, H = 812;

// Runs in the page. Buttons in page order: the hero's .aw-btn first, then anything else styled or marked as a button.
// A button counts when a visitor could see it and tap it: big enough to tap, readable against its background, not hidden,
// not off to the side, and not under a popup. One shown on the first screen (a fixed bar included) scores its place there;
// one further down scores its distance from the top of the page.
export function firstUsableButton() {
  const SEL = "a.aw-btn, a[class*='btn' i], a[class*='button' i], button, [role='button'], input[type='submit']";
  const luminance = (c) => { const [r, g, b] = c.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const rgba = (str) => { const m = /rgba?\(([^)]+)\)/.exec(str); if (!m) return null; const p = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return { c: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }; };
  const backdrop = (el) => { for (let n = el; n; n = n.parentElement) { const c = rgba(getComputedStyle(n).backgroundColor); if (c && c.a > 0.5) return c.c; } return [255, 255, 255]; };
  const readable = (el) => { const t = rgba(getComputedStyle(el).color), bg = backdrop(el); if (!t || !el.textContent.trim()) return true; const [l1, l2] = [luminance(t.c), luminance(bg)].sort((x, y) => y - x); return (l1 + 0.05) / (l2 + 0.05) >= 1.5; };
  const fixed = (el) => { for (let n = el; n && n !== document.body; n = n.parentElement) { const p = getComputedStyle(n).position; if (p === "fixed" || p === "sticky") return true; } return false; };
  const seen = [], skipped = [];
  for (const el of document.body.querySelectorAll(SEL)) {
    if (el.closest("nav, header nav, footer")) continue;
    const s = getComputedStyle(el), r = el.getBoundingClientRect();
    const label = (el.textContent || el.value || "").trim().slice(0, 40);
    if (r.width < 1 || r.height < 1 || s.visibility === "hidden" || s.display === "none" || Number(s.opacity) === 0) { skipped.push(`${label || el.tagName}: hidden`); continue; }
    if (r.right <= 0 || r.left >= innerWidth) { skipped.push(`${label}: off screen to the side`); continue; }
    if (s.pointerEvents === "none") { skipped.push(`${label}: cannot be pressed`); continue; }
    if (r.width < 24 || r.height < 24) { skipped.push(`${label}: too small to tap (${Math.round(r.width)}x${Math.round(r.height)}px)`); continue; }
    if (!readable(el)) { skipped.push(`${label}: text cannot be read against its background`); continue; }
    seen.push(el);
  }
  const hits = (el) => { const r = el.getBoundingClientRect(); const hit = document.elementFromPoint(Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1), Math.min(Math.max(r.top + r.height / 2, 0), innerHeight - 1)); return { ok: hit && (hit === el || el.contains(hit)), hit }; };
  const name = (hit) => hit ? hit.tagName.toLowerCase() + (hit.className ? "." + String(hit.className).split(" ")[0] : "") : "nothing drawn";
  scrollTo(0, 0);
  // A gate or popup over the headline (an age check, a cookie wall with its own button) is a problem even when its button can be pressed.
  let headlineCovered = null;
  const h1 = [...document.querySelectorAll("h1")].find((h) => { const r = h.getBoundingClientRect(), s = getComputedStyle(h); return r.width > 1 && r.height > 1 && s.visibility !== "hidden" && s.display !== "none" && r.top < innerHeight && r.bottom > 0; });
  if (h1) {
    const r = h1.getBoundingClientRect();
    const hit = document.elementFromPoint(Math.min(Math.max(r.left + r.width / 2, 0), innerWidth - 1), Math.min(Math.max(r.top + Math.min(r.height, 40) / 2, 0), innerHeight - 1));
    if (hit && hit !== h1 && !h1.contains(hit) && !hit.contains(h1)) headlineCovered = name(hit);
  }
  for (const el of seen) {
    const label = (el.textContent || el.value || "").trim().slice(0, 40), r = el.getBoundingClientRect();
    const inFirstScreen = r.bottom > 0 && r.top < innerHeight;
    if (!inFirstScreen && fixed(el)) { skipped.push(`${label}: fixed, and not on the first screen`); continue; }
    if (!inFirstScreen) el.scrollIntoView({ block: "center" });
    const h = hits(el);
    if (h.ok) { const top = Math.round(el.getBoundingClientRect().top + (inFirstScreen ? 0 : scrollY)); scrollTo(0, 0); return { button: top, label, skipped, headlineCovered }; }
    skipped.push(`${label}: covered by ${name(h.hit)}`);
    scrollTo(0, 0);
  }
  scrollTo(0, 0);
  return { button: null, label: null, skipped, headlineCovered };
}

const browser = await pw.chromium.launch();
const ctx = await browser.newContext({ viewport: { width: W, height: H }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
const page = await ctx.newPage();
await page.goto(url, { waitUntil: "networkidle" });
await page.waitForTimeout(3000); // a button a script draws within a few seconds counts; a visitor does not wait longer
const m = await page.evaluate(firstUsableButton);
const extra = await page.evaluate(() => ({ h1: document.querySelector("h1") ? Math.round(document.querySelector("h1").getBoundingClientRect().top + scrollY) : null, scrollWidth: document.documentElement.scrollWidth }));
await browser.close();

const problems = [];
if (m.button == null) problems.push(`no button a visitor can press${m.skipped.length ? ` (${m.skipped.join("; ")})` : ""}`);
else if (m.button > H) problems.push(`the first button is ${m.button}px down, below the first screen (${H}px)`);
if (m.headlineCovered) problems.push(`the headline is covered by ${m.headlineCovered} (a popup or gate)`);
if (extra.scrollWidth > W) problems.push(`the page is ${extra.scrollWidth}px wide on a ${W}px phone: it scrolls sideways`);
const out = { value: m.button, baseline: 1935, unit: "px", measuredAt: new Date().toISOString(), run: url, button: m.label, h1: extra.h1, scrollWidth: extra.scrollWidth, ...(m.button == null ? { skipped: m.skipped } : {}),...(problems.length ? { problem: problems.join("; ") } : {}) };
// result.json records the live homepage only: measuring another page (a test page, a preview) must not overwrite it
if (m.button != null && !process.argv[2]) writeFileSync(new URL("./result.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(JSON.stringify(out));
if (m.button == null) process.exit(2);
if (problems.length) process.exit(1);
