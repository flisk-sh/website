# North star: first button on a phone

Metric: pixels a phone visitor scrolls before the first button on the flisk.sh homepage.

Method: `node docs/north-star/north-star.mjs` opens the live page in headless Chromium at 375x812 (a phone), finds the first hero button and records its distance from the top. It fails if the button is below the first screen (812px) or the page scrolls sideways.

Baseline: 1935px (before 2026-11-17, the button sat far below the fold). Target: 3 times lower. Result is in `result.json`.
