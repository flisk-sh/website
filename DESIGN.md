# Design System: Flisk CLI Website

> Single source of truth for every tab of the Flisk marketing site
> (home, features, compare, why, waiting, docs). Dark devtool aesthetic:
> honest terminal proof over stock decoration. Brand accent is violet
> (explicit brand override: violet is the Flisk identity since inception,
> used with restraint, never as neon glow).

## 1. Visual Theme & Atmosphere

A confident, quiet, dark laboratory for a serious engineering tool. Density is
balanced Daily-App (4): generous cinematic section gaps, no cockpit packing.
Variance is high (7): asymmetric splits, pinned storytelling, sticky stacking.
Motion is fluid-to-cinematic (6): GSAP scroll reveals, scrubbed text, one live
terminal typing demo. The atmosphere is a well-lit server room at night:
near-black calm, one violet signal light, monospace evidence everywhere.

## 2. Color Palette & Roles

- **Void Canvas** (#0A0A0E) — Primary page background (off-black, never pure #000000)
- **Raised Surface** (#121218) — Cards, bands, calculator shells
- **Deep Terminal** (#0D0D13) — Code windows, terminal, docs codeblocks
- **Signal Text** (#ECECF1) — Primary text, off-white
- **Muted Steel** (rgba(236,236,241,0.55)) — Secondary text, descriptions
- **Faint Steel** (rgba(236,236,241,0.4)) — Captions, footnotes, math printouts
- **Hairline** (rgba(255,255,255,0.07)) — Card borders, table row dividers
- **Brand Violet** (#7C4DFF) — Single brand accent: CTAs focus, active states, key numbers
- **Signal Lavender** (#B79AFF) — Violet at readable lightness: headlines accents, links, outputs
- **Success Mint** (#6EE7B7) — Semantic only: healthy states, savings, "with Flisk" column
- **Cost Orchid** (#F0ABFC) — Semantic only: prices being replaced, money burned
- **Info Ice** (#4DD0FF) — Sparing: terminal highlights, gradient endpoint
- No neon outer glows. Depth via layered radial washes and 1px inner borders.

## 3. Typography Rules

- **Display:** Satoshi (700/800, letter-spacing -0.02em to -0.04em). Hero
  `clamp(3rem, 5.5vw, 5.75rem)`, section heads `clamp(2rem, 4vw, 3.75rem)`.
  Hierarchy through weight and color, never raw scale alone.
- **Body:** Satoshi (300/400), relaxed leading 1.6-1.7, muted steel.
- **Mono:** JetBrains Mono — code, terminal, calculator outputs, cost figures,
  file names. All money and metric numerals set in mono.
- **Banned:** Inter, generic system stacks, generic serifs. No serif anywhere
  on this property (software UI, not editorial).
- **Emphasis:** bold or color of the SAME family. Never mixed-family emphasis.
- **Hero discipline:** headline max 2 lines, subtext max 20 words, CTAs visible
  without scroll. Plain words first: a non-technical buyer must understand
  the hero with zero jargon.

## 4. Component Stylings

- **Buttons:** Full-pill radius. Primary: white fill, near-black text.
  Secondary: transparent with 1px white/25 border, white text. Hover lifts
  2px. Active presses to scale 0.98. No outer glow. One label per intent
  across the whole site ("Join waitlist" everywhere).
- **Cards:** 24px radius, hairline border, lift 4px + violet-tinted border on
  hover. Used only where elevation carries hierarchy.
- **Grids:** Asymmetric only. Never 3 equal columns of uniform cards. Varied
  spans with dense flow, mathematically gapless. Two-column pairs for
  verdict-style content.
- **Code windows:** 16-20px radius, traffic-light bar with filename in mono,
  syntax tint (green keys, blue strings, sky numbers, grey comments).
- **Terminal demo:** real mini-version of the product CLI, typed live on
  scroll into view, instant static render under prefers-reduced-motion.
- **Inputs:** Dark fill, label above, violet focus ring with soft halo,
  placeholder at readable contrast. No floating labels.
- **Carousel:** Arrow buttons (round, hairline) plus dot indicators. Never
  numeric "1 / 5" pagination.
- **Nav:** Floating glass pill, fixed, blur 20px, collapses to burger.

## 5. Layout Principles

- Grid-first, max-width 80rem centered. Sections breathe:
  `clamp(8rem, 12vw, 12rem)` vertical padding on home, slightly tighter inside.
- Heroes are asymmetric or left-aligned. No centered hero walls of text.
- Sticky storytelling: pinned titles with scrolling evidence columns.
- Strict single-column collapse below 768px. No horizontal scroll, ever
  (`overflow-x: hidden` on themed wrappers).
- One theme for the whole property: dark, locked. No mid-page inversions.
- One corner-radius doctrine: pills for interactive, 24px for cards,
  16px for code, circles for icon buttons.

## 6. Motion & Interaction

- GSAP + ScrollTrigger for scrolltelling (reveals, scrubs, pins, stacks).
  Transform and opacity only. Marquee pauses on hover.
- Every animation answers: hierarchy, storytelling, feedback, or state
  transition. Maximum one marquee per page.
- Full `prefers-reduced-motion` support: marquee, typing, pins and reveals
  collapse to instant static. Tested, not claimed.
- Anchor targets clear the fixed nav (`scroll-padding-top`, scroll margins).

## 7. Content & Numbers Discipline

- Copy register: plain, confident, zero hype verbs (no elevate/seamless/
  unleash/next-gen/revolutionize). Non-technical readers first, proof below.
- Every marketing number lives in `_data/tdk.yml` (single source of truth)
  with a comment stating its verification source. No hardcoded claims in HTML.
- Money and metric numerals always in mono. Formulas printed next to results.

## 8. Anti-Patterns (Banned)

No emojis. No Inter. No pure black. No neon/outer glows. No centered heroes.
No 3-column equal card rows. No em-dashes or en-dash separators (hyphens and
restructured sentences only). No middle-dot separators. No numeric "1 / 5"
pagination. No pills or tags overlaid on images. No photo-credit decoration.
No version footers or version labels. No scroll cues. No locale/time strips.
No duplicate CTA intents. No generic step labels. No hairlines on every row.
No div-based fake screenshots (the terminal is a real working mini-UI).
No generic names, no fake-precise invented specs, no stock-photo pretending.
