# North star: first button on a phone

Metric: pixels a phone visitor scrolls before the first button on the flisk.sh homepage.

Method: `node docs/north-star/north-star.mjs` opens the live page in headless Chromium at 375x812 (a phone), finds the first button a visitor can actually press and records its distance from the top. It fails if the button is below the first screen (812px) or the page scrolls sideways.

"Can actually press" means: any link or button styled or marked as a button (not only `.aw-btn`, so renaming the class does not break the measure), outside the nav and footer, big enough to tap (24px), readable against its background, not hidden, not off to the side, and not covered by a cookie wall or popup (the browser hit-tests its centre). When there is no such button the measure prints `"value": null` with the reason in `"problem"` and exits 2, so the run goes red instead of recording a number nobody can use.

Checked on 2026-11-22 against nine test pages (bad, middle, good and best, plus a hidden button, a renamed button class, a cookie wall, a page wider than the phone and a hidden headline): the old measure scored the hidden-button page 0px (best ever), measured nothing for the renamed class and passed the cookie wall; this one ranks all nine as a person would.

A button that is fixed to the screen (a sticky bar) counts at its place on the first screen. A button a script draws within 3 seconds of load counts; one drawn later does not. A popup or gate over the headline fails the run even when its own button can be pressed. Known limit: a call to action that is a plain text link, not styled or marked as a button, is not found, so the measure says "no button" (exit 2) rather than guess.

A second round of 14 pages built to fool the measure (a tiny button, invisible text, a sticky bar, a late button, an age gate and others) found five wrong verdicts in the first version; this one gets all 14 right, and the live page still measures 453px.

Baseline: 1935px (before 2026-11-17, the button sat far below the fold). Target: 3 times lower. Result is in `result.json`.
