# World Launch Checklist (measured, not aspirational)

**Why this exists (2026-07-25):** `built-worlds.ts` used to say launching a
world is "one line with no per-test edits." The one line is real, but it only
turns the QA gates loose on a corpus that has never passed them. The
fresh-eyes rerun (`docs/audits/fresh-eyes-rerun-2026-07-25.md` §8) measured
what actually stands between an authored world and a sellable one. **Estimate
12-20 focused weeks per world, and treat that as a floor.**

The unbuilt corpus: 219 lessons + ~214 exercises across neon-protocol,
signal-ward, nova-canvas, terra-grid.

## The measured punch list (counts at 2026-07-25 HEAD)

| # | Work item | Scale | Nature |
|---|---|---|---|
| 1 | Lesson-close conversion | **219/219 lessons** | Every unbuilt lesson closes on `<KeyTakeaways>` (and 51 carry `<Quiz>`) - neither is in any step visibility set, so **step 5 renders literally empty** in every one. Convert to `<LessonRecap>` / `<RecallPrompt>` / `<Epilogue>` closes. Net-new authoring, not mechanical. |
| 2 | Hint ladders | **195/195 fail Gate B** | Hints are prose, not solution-code excerpts. One verified example teaches `input * Wq` (elementwise in TFJS; throws). Every ladder needs the excerpt-convention rewrite Deep Orbit got in run #7. |
| 3 | Hard-walled lessons | **16** | The Challenge continue-gate counts an exercise the page never embeds → learner sees "Exercise not found" and can never leave the step. |
| 4 | First-ever fact-check | **all 219** | A 12-lesson sample produced 5 defects. Deep Orbit needed FOUR adversarial rounds to reach its first zero-error pass. Single-pass budgets are fantasy. |
| 5 | Character registry | **520 of 626 speakers absent** | Only deep-orbit has avatar slugs in the manifest; every other world's Dialogue speakers render unresolved. |
| 6 | Missing breaks panels | **28 bridges** | Falsifies the unqualified absolutes on `/learn` and `/compare` the day world 2 ships (the bridge-breaks gate now extends automatically and will catch these - red until fixed). |
| 7 | Word density | **26-41% below Deep Orbit** | The prose is thinner than the shipped bar; parity is a writing pass, not a copyedit. |
| 8 | Consequence-number sync (Gate A) | **~14 known lessons** | consequence.narrative numbers that never appear in the lesson body pass today only because Gate A scopes to launched worlds; they fire the day the dir joins `BUILT_WORLD_DIRS`. Known list in `docs/audits/ai-slop-audit-2026-08-12.md` §Report-only #4 (terra-grid scale-reliability/01-05 + monitoring-drift/02, nova-canvas clip-alignment/01+03 + capstone/03+05 + creative-deployment/04 + vae/03, signal-ward tc/05 + pp/04 + qa/04), plus whatever the gate finds beyond it. Also fix the two known consequence/body numeral contradictions: neon feature-extraction/04 (48ms vs 45ms) and nova vae/03 (epoch 50 vs 40-42). |

## Mechanical steps (the cheap part, do LAST)

1. Fix items 1-7 above for the world.
2. Add the dir to `BUILT_WORLD_DIRS` (`packages/content/src/built-worlds.ts`).
3. Add the slug to `LAUNCHED_WORLDS` (`packages/shared/src/constants.ts`).
4. Run the full battery: velite build, `packages/content` gates (bridge-breaks,
   structure-variety, Gate B, interval-canon, world-shape-disk all extend to
   the new dir automatically), `validate-exercises.mjs`, `EXERCISE_CORPUS=1`
   runtime pass, e2e incl. axe.
5. Pricing surfaces update themselves (`LAUNCHED_WORLDS`-derived), but
   re-verify the bundle availability flips and the JSON-LD.

## Gates that will catch you (by design)

- `world-shape-disk.test.ts` - WORLD_SHAPE vs disk for ALL worlds, built or
  not, plus `LAUNCHED ⊆ BUILT`.
- `bridge-breaks.test.ts` - per built story world, every bridge must resolve
  a breaks label.
- `structure-variety.test.ts` - per built story world, the anti-lockstep
  floors apply independently.
- Gate B (`metadata-consistency.test.ts`) - hint excerpts must be parseable
  subsets of solutionCode.

If the plan is to sell bundles before world 2 meets this bar, re-price the
bundles instead (fresh-eyes rerun T3-31): the checkout for 2/3/5-world tiers
is already `disabled` in source until enough worlds launch.

## Prose-partition reconciliation (added 2026-09-04, do before ANY world-2 launch)

The lesson renderer now partitions steps via visibility sets plus
CSS zone rules (see `docs/audits/lesson-format-audit-2026-09-04.md`).
Deep Orbit's content satisfies the partition's contract and
`apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/content-partition-contract.test.ts`
enforces it in CI, but ONLY for deep-orbit. Before launching another
world: extend that contract test to the new world's directory and fix
what it finds. Known today for neon-protocol: `<Quiz>` blocks appear in
no visibility set (they would render on no step), and the world was
authored before the partition existed.
