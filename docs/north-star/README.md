# North star: first button on a phone

Metric: pixels a phone visitor scrolls before the first button on the flisk.sh homepage.

Method: `node docs/north-star/north-star.mjs` opens the live page in headless Chromium at 375x812 (a phone), finds the first button a visitor can actually press and records its distance from the top. It fails if the button is below the first screen (812px) or the page scrolls sideways.

"Can actually press" means: any link or button styled or marked as a button (not only `.aw-btn`, so renaming the class does not break the measure), outside the nav and footer, not hidden, not off to the side, and not covered by a cookie wall or popup (the browser hit-tests its centre). When there is no such button the measure prints `"value": null` with the reason in `"problem"` and exits 2, so the run goes red instead of recording a number nobody can use.

Checked on 2026-11-22 against nine test pages (bad, middle, good and best, plus a hidden button, a renamed button class, a cookie wall, a page wider than the phone and a hidden headline): the old measure scored the hidden-button page 0px (best ever), measured nothing for the renamed class and passed the cookie wall; this one ranks all nine as a person would.

Baseline: 1935px (before 2026-11-17, the button sat far below the fold). Target: 3 times lower. Result is in `result.json`.
