# Visual Regression Testing

Scope and conventions for the Playwright screenshot-comparison suite that
covers Phase 8 §8k of `dev-plan.md`.

## What is covered

Five spec files under `e2e/visual/`:

| File | Coverage | Tests |
| --- | --- | --- |
| `key-pages.spec.ts` | Landing, Pricing, Worlds index, Auth sign-in, Paywall, Learn (desktop 1280×800), in dark and light | 12 |
| `worlds.spec.ts` | All 5 world landing pages, in dark and light. Confirms the CSS-var palette cascade per world | 10 |
| `responsive.spec.ts` | Landing + Pricing at 320 / 768 / 1024 / 1440 px widths | 8 |
| `review-warmup.spec.ts` | The spaced-review warm-up card on lesson 2, as an element screenshot, in dark and light | 2 |
| `lesson.spec.ts` | Lesson 1, the Briefing and Concept steps at 1440 / 390 px widths, in dark | 4 |

36 tests total, one screenshot each. Verified 2026-09-24 with
`npx playwright test e2e/visual --project=chromium --list`, which prints
`Total: 36 tests in 5 files`.

The page captures use `expect(page).toHaveScreenshot(...)` with
`maxDiffPixelRatio: 0.001` (0.1% tolerance). The warm-up card uses
Playwright's default comparison, which fails on any pixel past the default
color threshold.

Two lesson steps are covered, lesson 1's Briefing and Concept steps, plus
the warm-up card on lesson 2. Both lessons are in the free module, which
opens without an account. Authenticated pages (dashboard, settings) are not
covered, because they would need a mocked auth session. Paid lessons would
also need a purchase fixture.

## Current baseline set

36 PNGs, all minted on macOS through Playwright's `chromium` project.
Counted 2026-09-24 with `find e2e/visual -name '*.png' | wc -l`, and every
name carries the `-chromium-darwin` suffix:

| Directory | Files |
| --- | --- |
| `e2e/visual/key-pages.spec.ts-snapshots/` | 12 |
| `e2e/visual/worlds.spec.ts-snapshots/` | 10 |
| `e2e/visual/responsive.spec.ts-snapshots/` | 8 |
| `e2e/visual/review-warmup.spec.ts-snapshots/` | 2 |
| `e2e/visual/lesson.spec.ts-snapshots/` | 4 |

Playwright writes snapshots next to the spec that owns them, in
`<spec>.ts-snapshots/`. Older revisions of this doc called that folder
`__screenshots__/`, and so does the header comment in `key-pages.spec.ts`.
No such folder has ever existed in this repo.

**The baselines are darwin-only, and the filename is why.** Playwright puts
the platform in the snapshot name: `testInfo.snapshotSuffix =
process.platform` (`playwright/lib/index.js:345`) feeds the default path
template
`{snapshotDir}/{testFileDir}/{testFileName}-snapshots/{arg}{-projectName}{-snapshotSuffix}{ext}`.
A Linux runner therefore resolves `*-chromium-linux.png`, of which there are
zero. The pixels would differ anyway: font hinting, subpixel rendering and
fallback glyphs are not the same on the two platforms, which is what the
suffix exists for. Each platform that enforces the suite needs its own set,
produced on that platform. See "CI" below.

## Why the specs are gated on `RUN_VISUAL=1`

All five specs skip unless `process.env.RUN_VISUAL === "1"`
(`key-pages.spec.ts:23` and `:71`, `responsive.spec.ts:13` and `:36`,
`worlds.spec.ts:15` and `:34`, `lesson.spec.ts:11` and `:24`,
`review-warmup.spec.ts:10`). The gate was added while the baselines were
still being produced, and it is still what keeps a run that has no baselines
for its platform from failing. Verified 2026-09-24:
`playwright test e2e/visual` with `RUN_VISUAL` unset reports `36 skipped`.

The gate is not a substitute for a baseline check. A skip and a pass look
alike in a CI summary, which is why the CI job below treats a missing
baseline as a failure rather than leaning on the skip.

## Running the suite locally

Compare with the root script. Mint or re-mint one spec at a time by naming
it. Both commands set `RUN_VISUAL=1` and run only the `chromium` project,
which is the only project the visual specs belong to:

```bash
# compare every spec against the committed baselines
PW_PORT=3111 pnpm test:visual
# mint or re-mint the baselines of one spec
RUN_VISUAL=1 PW_PORT=3111 npx playwright test <spec> --project=chromium --update-snapshots=all
```

`pnpm test:visual` passes `--update-snapshots=none`, so a baseline that is
missing or renamed fails the test instead of being quietly written. That is
the difference between a comparison and a rubber stamp.

`pnpm test:visual:update` re-mints every baseline in the suite, including
any that drifted for an unrelated reason, so it is for deliberate
whole-suite changes only.

Playwright starts the server for you (the `webServer` block in
`playwright.config.ts`), which locally means `next dev`. Two hazards, both
real on this machine:

- `reuseExistingServer` is true locally, so the suite captures whatever is
  already listening on port 3000. On 2026-09-08 that was an unrelated
  service from another project, answering 200 on `/`. Move the suite to a
  port you own: `PW_PORT=3111 pnpm test:visual`.
- A `next dev` server over an existing production `.next` serves unstyled
  pages that pass both axe and a freshly minted baseline (2026-08-24). If
  `apps/web/.next/BUILD_ID` exists, delete `apps/web/.next` before minting.

### After a re-mint, look at the images

A baseline written during the run that compares against it always passes.
Green after `--update-snapshots` says only that a PNG now exists; it says
nothing about what is in the PNG, and a broken render is exactly as green as
a correct one (2026-08-15: a regenerated baseline certified a broken page).
So open every changed image, confirm the diff is the change you intended,
and only then commit the PNGs with the code that produced them. Baselines
are part of the test contract.

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

Every one of these needs BOTH platforms once Linux baselines exist: a local
mint of the affected specs for the darwin set (see "Running the suite
locally"), and the `mint` job in CI for the Linux set. A darwin-only
re-mint leaves the Linux gate comparing against pre-change images, so it
fails on the next push with a diff nobody introduced.

## Baseline record

Every mint or re-mint names its reason and the expected change, per the
owner's 2026-09-15 rule.

| Date | Snapshot | Reason | Expected change |
| --- | --- | --- | --- |
| 2026-09-24 | `review-warmup-{dark,light}.png` | The warm-up card now spans the lesson content width instead of the old 68-character column (lesson layout spec, section 2 item 6). Element screenshot in the prompt state, so the Continue gap change is not visible here. The spec now opens lesson 2: since 2026-09-22 a warm-up only recalls earlier lessons, so on lesson 1 the spec could no longer find the card. The old images (2026-09-16) predate the 2026-09-22 warm-up rework | Width from the old text column (687 px) to the frame's content width (1,184 px) at the visual project's 1,280 px viewport. Height from 359 to 361 px. The question text fits on one line in both, so nothing reflows. The 2026-09-22 rework changed the label from "Before this lesson: a quick recall" to "A quick recall before you continue" and put a hairline and 24 px of padding above it. The card's 24 px bottom margin now collapses out of the warm-up section (in the old flex-column story step it stayed inside), so the new image ends at the card's border and shows one row of its offset shadow. That is why the added hairline and padding net only 2 px |
| 2026-09-24 | `lesson-briefing-{desktop,phone}.png`, `lesson-concept-{desktop,phone}.png` | New coverage for the lesson route after the layout change | New baselines, no prior image. On the Briefing, the "Cut to" divider ends 16 px above the teaser paragraph (the last beat's `--l-beat` margin) and sits 32 px below the dialogue line before it. The 16 px gap is accepted as is |

## Flake mitigation

Every visual spec:

- Calls `page.emulateMedia({ reducedMotion: "reduce" })`. `ParticleField`
  and `BridgeTicker` both honor it.
- Awaits `document.fonts.ready` to avoid FOUT frames.
- Passes `stylePath: e2e/visual/screenshot.css` to `toHaveScreenshot`. Local
  runs serve the app with `next dev`, and the Next.js dev-overlay badge
  ("N · 1 Issue") appears at the bottom-left of the first viewport
  whenever the dev server logs a transient issue; the stylesheet hides
  `nextjs-portal` at capture time (worlds-index-light flaked exactly this
  way, 2026-08-16).

What each spec waits for before it captures:

- `key-pages.spec.ts`, `worlds.spec.ts` and `responsive.spec.ts` await
  `networkidle` so async components (e.g. Sandpack, charts) settle. The
  /pricing captures in `key-pages.spec.ts` and `responsive.spec.ts` also
  wait for the curriculum scene, described below.
- `lesson.spec.ts` loads with `domcontentloaded`, then waits for the
  step's settled marker: `[data-script-state='done']` on the Briefing and
  the paired grid on the Concept step. The step is restored in a client
  effect after load, so no load state shows which step is on screen. On
  the Briefing it also waits until the scene picture has loaded, because
  the image is lazy and removes itself on error. It pins the text Briefing
  (`tc-briefing-variant`), so a future scene clip cannot change the image.
  Last, it blurs the focused element: the step container takes script
  focus, and its ring is transient state, not layout.
- `review-warmup.spec.ts` waits for the warm-up region to be visible and
  captures that element only.

If a test is still flaky, consider:

- Masking a time-sensitive region:
  `toHaveScreenshot("x.png", { mask: [page.locator(".live-ticker")] })`.
- Increasing `maxDiffPixelRatio` **locally** for debugging - do not commit
  a loosened tolerance without discussion.

A mask cannot fix a LAYOUT race: with `fullPage: true` the screenshot's
dimensions are part of the assertion, so a component whose height depends
on load state fails on image size before any mask applies. The known case
was the Deep Scan demo while it lived in the landing hero (ssr:false, no
IO gate; its "loading" render is one line, its settled render is a row
table, a 108px delta that self-failed the 320px baseline on 2026-08-31;
the panel was removed from the hero later that day). Fix pattern, should
a captured page mount such a component again: expose its state machine as
a DOM attribute (`data-status={status}`, which `DeepScanDemo` still does)
and `waitFor()` the terminal state before capture. Do not accept the
error state into a baseline - let the wait time out loudly instead.

The same family includes PAINT races with stable dimensions: /pricing's
curriculum scene resolves its mode client-side after mount and only then
draws the orbit backdrop, so a fullPage capture can land before or after
the first draw (self-failed pricing@768 on 2026-08-31 as a rosette-shaped
12k-pixel diff with identical image dimensions). The settle-wait alone
turned out to be INSUFFICIENT (re-failed 2026-09-01): the backdrop canvas
draws only when its IntersectionObserver fires, and a fullPage capture
expands the viewport INSIDE toHaveScreenshot, firing below-fold observers
mid-capture, after any wait you wrote has already passed. Both visual
specs therefore wait for
`[data-testid="curriculum-scene"][data-mode="settled"]`, then
scrollIntoViewIfNeeded (firing the IO deliberately), double
requestAnimationFrame (the static frame commits; the canvas keeps its
pixels), then scroll back to the top before capturing /pricing. The
general recipe: expose the component's draw decision as a DOM attribute,
wait for the terminal value, and fire any IO gate yourself by scrolling
the element into view before a fullPage capture.

Note when re-minting landing baselines: they cannot verify hero content
at all. `maskCanvas` masks every canvas and `ParticleField` spans the
hero, so the whole band is a magenta block in every landing baseline. The
DOM assertions in `e2e/landing.spec.ts` are the real gate on hero copy
and structure; eyeball an unmasked capture for anything visual.

## CI

[`.github/workflows/visual-regression.yml`](../.github/workflows/visual-regression.yml)
holds three jobs. `ci.yml` is deliberately untouched: this suite needs a
manual trigger and its own on/off switch, and a `workflow_dispatch` on
`ci.yml` would put a "Run workflow" button on the whole pipeline.

### Why "set RUN_VISUAL=1 in the e2e job" could never work

Measured 2026-09-08 on Playwright 1.62.1, using a scratch spec whose
resolver was pointed at a `-linux` name while a `-darwin` file sat next to
it, which is exactly what an ubuntu runner sees today:

| Invocation | Result |
| --- | --- |
| no snapshot flag | 1 failed. The missing PNG is written into the runner's workspace and thrown away with the runner. |
| `-u` or `--update-snapshots` | 1 passed. Green against a baseline invented seconds earlier in the same run. |
| `--update-snapshots=none` | 1 failed, and nothing is written. |

So on Linux the old plan is red on every push, or it is a gate that approves
itself. The runner that enforces the baselines has to be the runner that
produced them, which is what the `mint` job is for. `docker` is not
installed on the owner's machine, so minting locally through the official
Playwright image is not available either.

### `mint`, manual

`workflow_dispatch` only. Installs chromium, builds the web app with the
same placeholder env the `e2e` job uses, serves it with `next start`, and
runs `pnpm test:visual:update`. It then refuses to publish a bad mint: the
PNG count must equal the discovered test count, and `git status` under
`e2e/visual` must show nothing but new `-linux` files. On success it uploads
`visual-baselines-linux`, kept 14 days.

### `enforce`, off until armed

Runs on push and PR, and mirrors the `e2e` job in `ci.yml`: placeholder env,
`pnpm turbo build --filter @tensorcraft/web`, then `next start` through
`playwright.config.ts`. Never `next dev` here, for the reason in "Running
the suite locally" above. The comparison step is `pnpm test:visual`, which
carries `--update-snapshots=none`.

The switch is `VISUAL_ENFORCE_DEFAULT` at the top of the workflow, `"0"`
today. A repository variable `VISUAL_ENFORCE` overrides it in both
directions, so the gate can be armed or disarmed without a commit
(`gh variable set VISUAL_ENFORCE --body 1`).

The switch decides whether the job runs. It does not look for baselines
first, on purpose. An armed gate with no Linux PNGs, or with PNGs for only
some of the tests, fails on its first step, before the build:

| State | Outcome |
| --- | --- |
| switch off | The job does not run and CI stays green. This is today. |
| switch on, no Linux baselines | Fails in about a minute, with the minting instructions in the error. |
| switch on, an incomplete set | Fails, naming the count found and the count expected. |
| switch on, a full set | Builds, serves, compares all 36 screenshots. |

A final step re-reads `git status -- e2e/visual` whether the suite passed or
failed, and fails the job if anything was written. A stray update flag in
the script or the job cannot quietly turn the gate back into one that
approves itself.

Branch protection is off in this repo (see `ci-cd.md`), so a red `enforce`
job blocks nothing by itself. It is a signal on the run, like every other
job here.

### `guard`, a state report

Runs on every push and PR and cannot fail. It prints how many Linux and
darwin baselines are committed and whether the gate is armed, and raises a
warning annotation when Linux baselines are committed while the switch is
still off, so the switch cannot be forgotten silently.

### The one manual step left

The mechanism is in place. The gate is not enforcing yet, and it cannot be
until a human does this once:

1. Actions, "Visual regression", Run workflow. That runs `mint`.
2. Download `visual-baselines-linux` and look at all 36 images. A mint is
   always green, so nothing but your eyes can reject a bad one. Check that
   text is rendered in Inter rather than a fallback, that no page is a
   loading skeleton, and that no page is unstyled.
3. Unzip at the repo root so the PNGs land beside the darwin files, then
   commit them.
4. In that same commit, set `VISUAL_ENFORCE_DEFAULT` to `"1"`.

Until step 4 lands, a visual regression can still reach main unnoticed:
36 tests skip on every CI run today. What changed is that minting the Linux
set is now a button rather than an unsolved problem, and that arming the
gate can no longer produce a green run with nothing behind it.
