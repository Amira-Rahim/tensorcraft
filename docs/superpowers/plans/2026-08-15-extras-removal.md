# /extras Full Removal Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the /extras surface and its content entirely: routes, 23 lessons across 4 modules, 23 exercises, every inbound link, every count pin, and every doc claim that depends on them.

**Architecture:** Owner decision 2026-08-15 (this session): full removal, matching repo precedent (blog posts, /bridges catalog, prototypes). Work proceeds outside-in: first strip the 13 companion links so nothing points at extras, then delete the web routes and their inbound links, then delete the content and flip the single source `BUILT_WORLD_DIRS`, then true up docs. Restore pointer: everything removed exists at commit `0b5ec6d` (HEAD at time of removal).

**Tech Stack:** Next.js app router (apps/web), Velite content pipeline (packages/content), Vitest, Playwright visual baselines.

**Hard rules for the executor:**
- **NO git commits.** CLAUDE.md forbids committing on the user's behalf. This overrides this plan template's usual commit steps. Leave everything uncommitted.
- **Do not touch** `docs/superpowers/plans/2026-08-15-pricing-curriculum-signal-lock.md`, `docs/superpowers/specs/2026-08-15-pricing-curriculum-signal-lock-design.md`, `packages/ui/src/effects/*` - dirty in the working tree from a parallel session.
- **Do not edit anything under `docs/audits/`** - those are historical ledgers.
- **docs/writing-quality-rubric.md** governs any user-visible sentence you *reword* (pure deletions exempt). Read it before rewording copy.
- **Visual baselines:** verify the rendered page is actually correct BEFORE regenerating any baseline (2026-08-15 Tailwind incident: baselines regenerated against a broken page certified the breakage).
- No 404 redirects for removed URLs: repo precedent (blog post deletion 2026-08-14) is sitemap removal + natural 404, no `next.config` redirects.

**Decision log (already made, do not relitigate):**
- `DerivationDrawer` loses both `companionSlug` and `companionHref` props (zero users after the sweep; YAGNI). Drawers keep their inline derivation content.
- The unregistered-speaker fallback (avatar-less "Instructor") in lesson rendering STAYS - it is defensive behavior, only its extras-flavored comments change.
- `apps/api/src/__tests__/deploy-preflight.test.ts:74` "extras beyond the required set" is about surplus migrations, not /extras. Verify by reading, then leave it alone.

---

### Task 1: Strip companion links from content and DerivationDrawer

The 13 companion attributes are the only content-side references to extras. Removing them first means no later task can leave a dead link.

**Files:**
- Modify: 13 MDX files (exact list from the grep in Step 1)
- Modify: `packages/ui/src/mdx/derivation-drawer.tsx`
- Modify: `packages/ui/src/mdx/derivation-drawer.test.tsx`
- Delete: `packages/content/__tests__/companion-links.test.ts`

- [x] **Step 1: Enumerate the attributes**

Run: `grep -rn 'companionSlug="[^"]*"\|companionHref="[^"]*"' packages/content/content --include="*.mdx"`
Expected: 13 matches (12 `companionSlug`, 1 `companionHref`) across these files: `deep-orbit/neural-networks/02-activation-functions.mdx`, `deep-orbit/optimization-edge/03-pruning.mdx`, `deep-orbit/training-loop/01..05`, `deep-orbit/anomaly-detection/01`, `deep-orbit/foundations/03`, `deep-orbit/advanced-time-series/04,05`, `deep-orbit/signal-processing/02,03`.

- [x] **Step 2: Remove the attributes only**

In each file, edit e.g. `<DerivationDrawer summary="..." companionSlug="statistics-of-signals">` to `<DerivationDrawer summary="...">`. Touch nothing else in the MDX - drawer bodies keep their inline derivations.

- [x] **Step 2b (discovered during execution): Fix dangling prose references**

The attribute grep missed prose. Six lessons referenced extras in sentences: four "the companion lesson builds/covers ..." clauses (activation-functions drawer, tensor-operations drawer trailer paragraph, anomaly-detection Binomial clause, ensemble-methods parenthetical) plus two direct mentions ("Dataset Bias lesson in the Ethics & Responsible AI extras" in evaluating-deep-scan, "math extras' Calculus of Neurons" in training-loop/04). All six fixed as clause/paragraph deletions under docs/writing-quality-rubric.md; "Binomial" dropped with its clause (sole mention, no glossary entry - rubric rule 3).

- [x] **Step 3: Remove the props from the component**

In `packages/ui/src/mdx/derivation-drawer.tsx`: delete the `companionSlug`/`companionHref` props (interface lines ~14-23, destructure ~42-43), the `href` derivation (~51-52), and the companion-link anchor it feeds. The component becomes a pure disclosure widget.

- [x] **Step 4: Update the drawer test, delete the gate**

In `derivation-drawer.test.tsx`, delete cases exercising companion props; keep open/close/summary cases. Delete `packages/content/__tests__/companion-links.test.ts` outright (its entire purpose was validating slug → extras-lesson resolution).

- [x] **Step 5: Verify**

Run: `pnpm test derivation-drawer` (unit tests run from the ROOT vitest config; package-level `test` scripts do not exist) then `grep -rn "companionSlug\|companionHref" packages apps --include="*.tsx" --include="*.ts" --include="*.mdx" | grep -v node_modules`
Expected: drawer tests PASS; grep returns zero matches.

### Task 2: Remove the web surface

**Files:**
- Delete: `apps/web/app/extras/` (3 files: `page.tsx`, `[module]/[lesson]/page.tsx`, `[module]/[lesson]/extras-lesson-body.tsx`)
- Modify: `apps/web/app/sitemap.ts:74` (static entry), `apps/web/app/sitemap.ts:158-172` (`extrasRoutes` block + spread)
- Modify: `apps/web/app/components/site-footer.tsx:36` + regenerate `__snapshots__/site-footer.snapshot.test.tsx.snap`
- Modify: `apps/web/app/pricing/pricing-tiers.tsx` (~259-272 bullet + `extrasLessons` prop), `apps/web/app/pricing/page.tsx:5,149` (import + prop)
- Modify: `apps/web/app/pricing/__tests__/pricing-tiers.test.tsx`, `apps/web/app/pricing/__tests__/page.test.tsx`
- Modify: `apps/web/app/robots.ts:13` (comment lists extras among OG consumers)

- [x] **Step 1: Tests first (pricing)**

Rewrite the extras expectations in both pricing tests to assert the free-tier card does NOT render a `/extras` link or a "bonus deep-dive lessons" bullet. In `page.test.tsx` also remove the `EXTRAS_LESSON_COUNT: 23` key from the `vi.mock` factory (~line 51).

- [x] **Step 2: Run to verify they fail**

Run: `pnpm test pricing`
Expected: FAIL. `pricing-tiers.test.tsx` fails because the bullet still renders; `page.test.tsx` likely fails earlier with vitest's "No 'EXTRAS_LESSON_COUNT' export is defined on the mock" (page.tsx still imports it until Step 3). Both shapes count as the red step.

- [x] **Step 3: Remove the surface**

Delete the `app/extras/` directory. In `sitemap.ts` remove the static `/extras` entry, the `extrasRoutes` mapping, and its spread; drop the `getWorldLessons` import if now unused. In `site-footer.tsx` remove the Link. In `pricing-tiers.tsx` remove the bullet `<li>` (including the 2026-07-14 audit comment above it) and the `extrasLessons` prop end-to-end; in `pricing/page.tsx` remove the `EXTRAS_LESSON_COUNT` import and prop. Update the `robots.ts` comment list to drop "extras".

- [x] **Step 4: Verify**

Run: `pnpm test pricing site-footer sitemap` (snapshot update flag for the footer if needed: `pnpm test site-footer -u`)
Expected: PASS; footer snapshot diff shows only the removed link.

### Task 3: Delete content and flip the single source

**Files:**
- Delete: `packages/content/content/extras/` (23 `.mdx`, 4 `module.yaml`, 23 `exercises/*.yaml`)
- Modify: `packages/content/src/built-worlds.ts`
- Modify: `packages/content/src/index.ts:12`
- Modify: `packages/shared/src/constants.ts:171-181` (`EXERCISE_CONTENT`)
- Modify: `packages/content/src/end-of-lesson.test.ts:5,33-39`
- Modify: `packages/content/src/expressions.test.ts:50,80-84`
- Modify: `packages/content/__tests__/blog-links.test.ts:30`
- Modify: `packages/content/__tests__/slop-lexicon.test.ts:35-37`
- Modify: `packages/content/__tests__/metadata-consistency.test.ts:40` (comment claims velite ships `{deep-orbit,extras}`)
- Modify: `packages/content/velite.config.ts:64` (comment)
- Modify: `packages/content/__tests__/exercise-counts.test.ts` (it-string wording only; logic derives from BUILT_WORLD_DIRS)

- [x] **Step 1: Delete the content directory**

Run: `rm -rf packages/content/content/extras && find packages/content/content -maxdepth 1 -type d`
Expected: only `deep-orbit` plus coming-soon world dirs remain.

- [x] **Step 2: Flip built-worlds.ts - with the single-dir glob guard**

Keep the existing export names exactly: `BUILT_WORLD_DIRS`, `BUILT_WORLD_GLOB` (consumed by `velite.config.ts:60` and re-exported at `index.ts:10`), `BUILT_STORY_WORLDS` (consumed by 5 test files + `index.ts:11`). Do not rename anything.

```ts
export const BUILT_WORLD_DIRS = ["deep-orbit"] as const;

/** Velite glob form. Brace groups need 2+ members to expand in minimatch,
 * so a single dir is emitted bare. */
export const BUILT_WORLD_GLOB =
  BUILT_WORLD_DIRS.length > 1
    ? `{${BUILT_WORLD_DIRS.join(",")}}`
    : BUILT_WORLD_DIRS[0];
```

`{deep-orbit}` alone would be matched as a LITERAL path by minimatch (no comma → no brace expansion) and velite would silently build zero lessons - the guard is mandatory. Keep `BUILT_STORY_WORLDS` exported (now equal to `BUILT_WORLD_DIRS`; simplify its `!== "extras"` filter, keep the name - consumers import it). Delete `EXTRAS_LESSON_COUNT` and the extras commentary (lines ~27-29, 43-51); note the removal date in the header comment.

- [x] **Step 3: Sweep the dependents**

`index.ts`: drop the `EXTRAS_LESSON_COUNT` re-export. `end-of-lesson.test.ts`: remove the import and the `+ EXTRAS_LESSON_COUNT` term. `expressions.test.ts`: delete the extras describe block and `extrasTags`. `blog-links.test.ts`: remove `"/extras"` from the route allowlist. `slop-lexicon.test.ts`: remove the `extras/math-deep-dive/module.yaml` allowlist entry. `exercise-counts.test.ts`: no logic change (it derives from `BUILT_WORLD_DIRS` + filesystem), but reword the it-string "liveExercises equals the shipped (deep-orbit + extras) YAML count" to drop extras. Fix the two stale comments (metadata-consistency, velite.config).

- [x] **Step 4: True up the exercise count pin**

In `packages/shared/src/constants.ts`: `liveExercises: 88` → `65`, with a dated comment line (`// 88 -> 65 (2026-08-15): /extras removed (23 exercises went with it).`). `authoredFiveWorlds: 300` is extras-exclusive of extras already - unchanged.

- [x] **Step 4b (discovered during execution): Gate B hint-count pin**

`metadata-consistency.test.ts:335` pins the discovered solution-hint ladder count (`EXPECTED_SOLUTION_HINTS = 79`). The 23 extras exercises each shipped a ladder; pin updated 79 → 56 with the file's dated-comment convention.

- [x] **Step 5: Verify the whole content layer**

Run: `pnpm --filter @tensorcraft/content build:content && pnpm test packages/content packages/shared`
(`build:content` is the velite build - the plain `build` script is only `tsc` and proves nothing about the glob.)
Expected: velite builds deep-orbit lessons only (56); all suites PASS including exercise-counts (65) and end-of-lesson. If velite reports 0 lessons, the glob guard from Step 2 is wrong - stop and fix.

### Task 4: Reword extras-flavored comments (behavior unchanged)

**Files:**
- Modify: `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx:283-286`
- Modify: `apps/web/lib/character-art.test.ts:13`
- Modify: `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.test.tsx:432`

- [x] **Step 1: Reword**

Each references "extras' Instructor" as the example of an unregistered speaker. Keep the unknown-speaker fallback and its tests; reword to "unregistered speakers stay avatar-less" without naming extras.

- [x] **Step 2: Verify**

Run: `pnpm test character-art lesson-steps`
Expected: PASS.

### Task 5: Docs sweep

**Files:**
- Modify: `docs/roadmap.md:21` - free tier becomes "Module 1 (5 lessons)"
- Modify: `docs/marketing-plan.md:443-462` and any other extras rows - retract "Verified complete on 2026-07-27"; add a dated note that /extras was removed 2026-08-15 and mark each row whose destination was an extras lesson as a reopened gap
- Modify: `docs/product-plan.md:1157+` (§4.7 Curriculum Gap Modules) - dated note: built, then removed 2026-08-15 by owner decision
- Modify: `docs/launch-scope.md:70` - velite collections row `{deep-orbit,extras}` → `deep-orbit`
- Modify: `docs/superpowers/specs/2026-08-09-pricing-reevaluation-design.md` - the extras count-pin checklist: dated obsolescence note, don't rewrite history
- Modify: `docs/superpowers/specs/2026-06-15-end-of-lesson-design.md`, `docs/superpowers/specs/2026-06-15-reading-experience-design.md` - both state "the only live, testable lesson surface today is deep-orbit + extras (77 lessons)" as current fact; same dated-obsolescence-note treatment
- Modify: `docs/pre-launch-checklist.md`, `docs/launch-blockers.md`, `docs/v2-polish-backlog.md` - grep for extras, fix stale claims (v2-polish-backlog is superseded; a one-line note suffices)
- Modify: `docs/post-launch-backlog.md` - remove/annotate the "public route for extras/*" item (~199-200) AND add the removal entry

- [x] **Step 1: Fix stale claims** (list above; grep `-i extras` each file to catch stragglers)

- [x] **Step 2: Write the removal entry in post-launch-backlog.md**

Must include: what was removed (routes, 23 lessons / 4 modules / 23 exercises, footer + pricing links, sitemap entries, companion-drawer links, `EXTRAS_LESSON_COUNT`), why (owner decision 2026-08-15), the restore pointer (`git show 0b5ec6d -- packages/content/content/extras` etc.), and the consequences accepted (free tier = module 1 only; marketing topic-map rows reopened; 24 indexed URLs now 404).

- [x] **Step 3: Verify no forward-looking doc still sells extras**

Run: `grep -rn -i "extras" docs --include="*.md" -l | grep -v audits | grep -v superpowers/plans`
Expected: every remaining hit is a dated historical/removal note, not a live claim.

### Task 6: Full battery + visual baselines

- [x] **Step 1: Static + unit**

Run: `pnpm typecheck && pnpm test` (root scripts; root `test` is already `vitest run` - do NOT append `-- run`, it would be read as a filename filter)
Expected: all green. Content suite drops from ~485 (extras-dependent cases removed).

- [x] **Step 2: Build**

Run: `pnpm --filter @tensorcraft/web build` (the package is `@tensorcraft/web`; a bare `--filter web` matches nothing and pnpm exits 0 silently)
Expected: succeeds; page count drops by 24 (119 → ~95); zero references to `/extras` in build output.

- [x] **Step 3: Visual baselines - verify THEN regenerate**

Footer (all pages) and the pricing free-tier card changed. Start the dev server, load `/` and `/pricing`, confirm both render correctly (colors present, footer intact minus the link, free card shows remaining bullets). Only then: `RUN_VISUAL=1 pnpm test:e2e` (root script) and review each changed baseline diff individually - every diff must be explainable by the removed link/bullet alone.

- [x] **Step 4: e2e**

Run: `pnpm test:e2e`
Expected: green; no spec references /extras (verified in discovery - zero e2e hits).

- [x] **Step 5: Leave uncommitted**

Report results to the owner. Do not commit.
