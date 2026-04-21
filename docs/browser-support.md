# Tensorcraft Browser & Device Support Matrix

> Last updated: 2026-04-21 (Phase 6 §6b mobile responsive sweep)

This document records the browsers, browser versions, and physical device
reference set that Tensorcraft officially supports at V1 launch. It is the
reference the Phase 6 §6b responsive sweep, the Playwright mobile test
config, and manual QA runs are built against.

---

## Supported browsers

We target **the latest two stable releases** of every engine. Anything
older than that is best-effort and not blocking for release. The versions
below are the floors at the time of this writing — CI uses whatever
Playwright ships, and manual QA uses whatever Chrome / Firefox /
Safari / Edge autoupdate to on the test machines.

| Browser | Minimum version | Engine |
| --- | --- | --- |
| Google Chrome | 128+ | Blink |
| Mozilla Firefox | 127+ | Gecko |
| Safari (macOS + iOS) | 17+ | WebKit |
| Microsoft Edge | 128+ | Blink (Chromium) |

Out-of-scope:

- Internet Explorer (any version) — not supported.
- Opera Mini and other proxy browsers — not tested.
- Chrome / Firefox / Edge versions older than N-1 — not tested.

## Device reference set

Per PRD 5.5 and dev-plan §6b, responsive work is validated against this
reference set. The Playwright mobile smoke run
(`e2e/mobile.spec.ts`, projects `mobile-iphone-se`, `mobile-pixel-7`,
`tablet-ipad`) emulates the narrowest device widths from the set. Other
devices are exercised in manual QA.

| Device | Viewport (CSS px) | Test layer |
| --- | --- | --- |
| iPhone SE | 375 × 667 | Playwright emulation (`mobile-iphone-se`) |
| iPhone 15 Pro | 393 × 852 | Manual (physical or BrowserStack) |
| Pixel 7 | 412 × 915 | Playwright emulation (`mobile-pixel-7`) |
| Samsung Galaxy S23 | 360 × 780 | Manual (physical or BrowserStack) |
| iPad Air | 820 × 1180 | Playwright emulation (`tablet-ipad`, iPad gen 7 proxy) |

## Breakpoint reference

Tensorcraft uses Tailwind's default breakpoints. Layout verification is
required at each of these widths:

| Breakpoint | Min width | Typical device |
| --- | --- | --- |
| (default) | 320 px | Very narrow phones |
| `sm` | 640 px | Large phones, small tablets portrait |
| `md` | 768 px | iPad portrait |
| `lg` | 1024 px | iPad landscape / small laptops |
| `xl` | 1280 px | Desktop |
| `2xl` | 1536 px | Wide desktop |

Primary acceptance widths per dev-plan §6b: **320, 768, 1024, 1440**.

## Touch target policy

All interactive elements (buttons, links styled as buttons, form inputs,
toggles, tab indicators, close buttons, CTAs, navigation items) must
have a hit area of at least **44 × 44 CSS pixels** on mobile widths,
matching WCAG 2.1 AA (Target Size — Minimum) and Apple HIG.

In Tailwind this is `min-h-11 min-w-11` (2.75 rem). Elements that need to
render smaller visually (e.g. dense filter chips) are allowed, but must
keep a 44 px hit area via padding or a transparent tap expansion. See
Phase 6 §6b sweep (2026-04-21) for the list of components that were
adjusted.

## Testing strategy

1. **Automated emulation (CI).** Playwright runs `e2e/mobile.spec.ts`
   against iPhone SE, Pixel 7, and iPad gen 7. Tests assert no horizontal
   scroll and that primary CTAs meet the 44 px touch-target floor.
2. **Manual desktop-browser pass.** Before each release, a human opens
   the current Chrome, Firefox, Safari, Edge stable build and walks the
   landing / auth / pricing / dashboard / lesson-viewer flows at 1440,
   1024, 768 widths.
3. **Manual device pass.** Before each release, a human validates the
   same flows on at least one iPhone (Safari), one Android (Chrome), and
   one iPad. When internal devices are not available, BrowserStack or
   LambdaTest is used as the source of truth.

CI run command: `pnpm test:e2e` (covers all Playwright projects,
including the mobile ones).
