# Visual Regression Testing

Scope and conventions for the Playwright screenshot-comparison suite that
covers Phase 8 §8k of `dev-plan.md`.

## What is covered

Three spec files under `e2e/visual/`:

| File                  | Coverage                                                                 |
| --------------------- | ------------------------------------------------------------------------ |
| `key-pages.spec.ts`   | Landing, Pricing, Themes index, Auth sign-in, Paywall (desktop 1280×800) |
| `themes.spec.ts`      | All 5 theme landing pages — confirms CSS-var palette cascade per theme   |
| `responsive.spec.ts`  | Landing + Pricing at 320 / 768 / 1024 / 1440 px widths                   |

All tests use `expect(page).toHaveScreenshot(...)` with
`maxDiffPixelRatio: 0.001` (0.1% tolerance).

Auth-required pages (dashboard, lesson viewer, settings, etc.) are **not**
covered in V0.5 — they would require a mocked auth session. Deferred to
launch polish.

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
- A new theme is added — add its slug to
  `e2e/visual/themes.spec.ts::THEME_SLUGS` then regenerate.
- A new breakpoint or page is added to `responsive.spec.ts` or
  `key-pages.spec.ts`.

Do **not** regenerate to "make the test pass" if the diff is unexpected —
that defeats the purpose. Investigate first.

## Flake mitigation

All visual specs already:

- Call `page.emulateMedia({ reducedMotion: "reduce" })` — `ParticleField`
  and `BridgeTicker` both honor this.
- Await `document.fonts.ready` to avoid FOUT frames.
- Await `networkidle` to let async components (e.g. Sandpack, charts)
  settle.

If a test is still flaky, consider:

- Masking a time-sensitive region:
  `toHaveScreenshot("x.png", { mask: [page.locator(".live-ticker")] })`.
- Increasing `maxDiffPixelRatio` **locally** for debugging — do not commit
  a loosened tolerance without discussion.

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
