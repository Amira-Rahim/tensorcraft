# Visual Regression Testing

Scope and conventions for the Playwright screenshot-comparison suite that
covers Phase 8 §8k of `dev-plan.md`.

## What is covered

Three spec files under `e2e/visual/`:

| File                  | Coverage                                                                 |
| --------------------- | ------------------------------------------------------------------------ |
| `key-pages.spec.ts`   | Landing, Pricing, Worlds index, Auth sign-in, Paywall (desktop 1280×800) |
| `worlds.spec.ts`      | All 5 world landing pages - confirms CSS-var palette cascade per world   |
| `responsive.spec.ts`  | Landing + Pricing at 320 / 768 / 1024 / 1440 px widths                   |

All tests use `expect(page).toHaveScreenshot(...)` with
`maxDiffPixelRatio: 0.001` (0.1% tolerance).

Auth-required pages (dashboard, lesson viewer, settings, etc.) are **not**
covered in V0.5 - they would require a mocked auth session. Deferred to
launch polish.

## Current baseline set

Baselines generated **2026-04-21** locally on macOS (darwin, Chromium via
Playwright). 18 PNGs committed:

- `e2e/visual/key-pages.spec.ts-snapshots/` - 5 files (landing, pricing,
  worlds-index, auth-sign-in, paywall).
- `e2e/visual/worlds.spec.ts-snapshots/` - 5 files (one per world slug).
- `e2e/visual/responsive.spec.ts-snapshots/` - 8 files (landing + pricing
  × 320/768/1024/1440 widths).

Note: Playwright writes snapshots to `<spec>.ts-snapshots/` by default
(not the `__screenshots__/` path name used elsewhere in this doc). The
filename suffix `-chromium-darwin` encodes the browser + platform, so
Linux CI will not match these PNGs - see "CI integration" below.

**Platform caveat**: these baselines are darwin-only. Linux CI will need
a separate baseline set because pixel-level font hinting, subpixel
rendering, and even emoji glyphs differ between macOS and Linux.
Regenerate on the target platform (or in a pinned CI container) before
enabling `RUN_VISUAL=1` on CI.

## Why tests are gated on `RUN_VISUAL=1`

Baselines must be generated locally against a running dev server before the
suite can pass. Until baselines exist and are committed, the specs
auto-skip so CI stays green. Set `RUN_VISUAL=1` to execute them.

## Generating baselines (first time or after intentional UI change)

1. Start the web dev server in a separate terminal:

   ```bash
   pnpm --filter @tensorcraft/web dev
   ```

2. In the repo root, generate (or refresh) baselines:

   ```bash
   RUN_VISUAL=1 ./node_modules/.bin/playwright test e2e/visual/ --update-snapshots
   ```

   Playwright writes PNGs to `e2e/visual/__screenshots__/` following its
   standard layout: one folder per spec, one file per `toHaveScreenshot`
   name.

3. Review the generated images by eye. Discard any that look broken
   (missing fonts, overlapping elements, loading-skeleton frames captured
   before content settled) and re-run step 2 after fixing.

4. Commit the `__screenshots__/` folder alongside the code that produced
   it. Baselines are part of the test contract.

5. Verify the suite is green without `--update-snapshots`:

   ```bash
   RUN_VISUAL=1 ./node_modules/.bin/playwright test e2e/visual/
   ```

## When to regenerate baselines

Regenerate (and commit new PNGs) whenever:

- A visual change is **intentional** (e.g. palette tweak, nav redesign,
  copy edit that changes line wrapping).
- Font stack changes (e.g. new `@font-face` weights added).
- A new world is added - add its slug to
  `e2e/visual/worlds.spec.ts::WORLD_SLUGS` then regenerate.
- A new breakpoint or page is added to `responsive.spec.ts` or
  `key-pages.spec.ts`.

Do **not** regenerate to "make the test pass" if the diff is unexpected -
that defeats the purpose. Investigate first.

## Flake mitigation

All visual specs already:

- Call `page.emulateMedia({ reducedMotion: "reduce" })` - `ParticleField`
  and `BridgeTicker` both honor this.
- Await `document.fonts.ready` to avoid FOUT frames.
- Await `networkidle` to let async components (e.g. Sandpack, charts)
  settle.
- Pass `stylePath: e2e/visual/screenshot.css` to `toHaveScreenshot`. The
  suite runs against `next dev`, and the Next.js dev-overlay badge
  ("N · 1 Issue") appears at the bottom-left of the first viewport
  whenever the dev server logs a transient issue; the stylesheet hides
  `nextjs-portal` at capture time (worlds-index-light flaked exactly this
  way, 2026-08-16).

If a test is still flaky, consider:

- Masking a time-sensitive region:
  `toHaveScreenshot("x.png", { mask: [page.locator(".live-ticker")] })`.
- Increasing `maxDiffPixelRatio` **locally** for debugging - do not commit
  a loosened tolerance without discussion.

A mask cannot fix a LAYOUT race: with `fullPage: true` the screenshot's
dimensions are part of the assertion, so a component whose height depends
on load state fails on image size before any mask applies. The landing
hero's Deep Scan demo is the known case (ssr:false, no IO gate; its
"loading" render is one line, its settled render is a row table, a 108px
delta that self-failed the 320px baseline on 2026-08-31). Fix pattern:
expose the component's state machine as a DOM attribute
(`data-status={status}`) and `waitFor()` the terminal state before
capture; both landing visual specs do this. Do not accept the error state
into a baseline - let the wait time out loudly instead.

Note when re-minting landing baselines: they cannot verify hero content
at all. `maskCanvas` masks every canvas and `ParticleField` spans the
hero, so the whole band is a magenta block in every landing baseline. The
DOM assertions in `e2e/landing.spec.ts` are the real gate on hero copy
and structure; eyeball an unmasked capture for anything visual.

## CI integration (deferred)

The suite stays opt-in (`RUN_VISUAL=1`) until baselines land. Once
committed, drop the `test.skip(!shouldRun)` guards (or flip the default)
and add `RUN_VISUAL=1` to the Playwright CI step. The first CI run on a
new platform will still need `--update-snapshots` because pixel-level font
hinting differs between macOS and Linux; plan to either:

- Run baseline generation inside CI on a pinned Linux image (preferred), or
- Maintain two baseline folders (`darwin/` vs `linux/`) via Playwright's
  `snapshotPathTemplate`.

This is a launch-polish task tracked alongside §8l (Lighthouse CI).
