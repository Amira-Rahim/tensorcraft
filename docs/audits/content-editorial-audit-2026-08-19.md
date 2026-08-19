# Content editorial audit and fix, 2026-08-19

Word-by-word editorial pass over the entire corpus, run as the third round of
the JavaScript rebrand (owner request: "content is KING and it's my moat").
Every module was read start to finish by a reviewer simulating the target
reader (a working JavaScript engineer, browser or Node, zero ML), then a line
editor applied the verified findings under docs/writing-quality-rubric.md and
docs/story-style-bible.md. Uncommitted at the time of writing; this ledger
records what changed and why.

## Coverage

- All 55 modules across the five worlds (275 lessons), every module.yaml,
  every exercises/*.yaml instruction and hint ladder.
- The funnel as one continuous read: landing composition, /learn, /about,
  /pricing + tiers + /paywall + WhoThisIsFor, /auth, /onboarding.
- packages/content/src/glossary.ts (all 102 definitions).
- 339 files changed, +2,589 / -1,916 lines. Full test battery green
  (1,754 tests), velite build green.

## What the reviewers hunted

logic breaks and train-of-thought drops, edit seams from the rebrand week,
JS-narrative residue (framing that quietly assumes the reader ships UIs),
engagement flatness against the style bible's anti-template rules, canon
contradictions, wrong or non-running code in prose, and rubric category 3
clarity failures. Fixers applied high/medium-confidence findings only,
located by verbatim excerpt, with the reviewer's per-module strengths list
protected from edits.

## Representative fixes (pattern, not inventory)

- Logic repairs: anomaly-detection's 7741 filter now halts for a stated
  reason; the 3-sigma/5% per-channel arithmetic corrected; capstone's cycle
  check, smoke-test target, rollback job, and drift formulas now do what
  their prose claims; sequence-models' opening "opposite meaning" pair now
  actually reorders; ab-testing's coin-flip noise figure no longer transfers
  a 50% baseline to a 91% one.
- Seam repairs: consequence loglines no longer repeat verbatim in their own
  epilogues; dangling referents from the rebrand pass reattached; recaps no
  longer credit lessons with content they do not teach.
- JS-narrative: shared-experience preambles ("you do this in React all the
  time", "your static assets", "every web app you've built") reframed to
  carry the same anchor without assigning the reader a UI-shipper biography;
  browser anchors glossed for Node readers where one clause suffices.
- Engagement: opener variety enforced per module (mid-failure, a number, an
  order, an instrument reading); duplicated teaching beats deduplicated;
  the finale now pays off Nazari's interval-hits-zero question with the
  72.4 s callback.
- Technical: broken `<Exercise slug>` references fixed and their orphaned
  YAML exercises mounted (signal-ward transformers-bert, qa-rag,
  ml-through-text, tokenization-preprocessing); non-compiling or misleading
  code blocks corrected (duplicate class property, benchmark timing the GPU
  queue, RNN weights allocated per step); glossary's quantization entry no
  longer claims an inference speedup TF.js does not deliver.

## Gates added or updated

- NEW packages/content/__tests__/exercise-slug-refs.test.ts: every
  `<Exercise slug>` must resolve in its module and every authored exercise
  must be mounted. It caught two additional shipped-broken references the
  moment it ran.
- interval-canon.test.ts: capstone/01 count updated (dedup) and a
  `historical` concept added so the finale's 72.4 s callback is pinned but
  excluded from the monotonic countdown.
- page.test.tsx and e2e/landing.spec.ts updated for the owner's same-day
  hero cuts (eyebrow, stat line, trust line removed; fold guarantee now
  anchors on the primary CTA).

## Bridge triage (executed same day, closes the last rebrand phase)

Six parallel passes, one per world plus the canonical registry in
`packages/shared/src/bridges.ts`, working the decision table in
docs/audits/bridge-triage-2026-08.md.

Outcome: roughly 30 anchors swapped, 6 dual-framed, the rest kept with a
stated reason. _No tier changed anywhere_, no identity bridge was
downgraded, and every swap carries freshly written `breaks` for its new
analogy. Representative swaps: micro-frontends to `Promise.all` fan-out,
Error Boundary to `process.on('uncaughtException')`, React list keys to
stream chunk order, `useReducer` to event-log replay, IntersectionObserver
to stream framing, virtual scrolling to `StringDecoder` chunk edges,
Service Worker cache to a memoized query cache, `srcset` pooling to a
metric rollup, Lighthouse budgets to per-request latency budgets,
Service Worker updates to atomic release swaps, React `useMemo` to an
exponential moving average.

Kept on purpose, with reasons recorded per row: canvas pixels and
`getImageData` (perceptual and near-universal in the vision world), CSS
color functions and color space (they literally are color spaces),
`getBoundingClientRect` and `requestAnimationFrame` (identity tier),
WebGL (the lesson topic is browser GPU access), Web Audio (audio is
perceptual), DOM events and `querySelectorAll` (universal literacy).

Also landed with it: deep-orbit browser-runtimes lesson 1 now states
honestly that TensorFlow.js runs under Node via `@tensorflow/tfjs-node`
and that the module goes to the browser because that is where DEEP SCAN
deploys; the duplicate statement later in the module was removed. Every
matching JS Bridge cell in docs/scripts/*.md was updated in step.

Cross-agent reconciliations applied afterward: the YOLO bridge's `breaks`
no longer describes a server render pass while its code shows a
`requestAnimationFrame` batch; two dialogue lines that still said
"frontend application" and "in web dev" are now runtime-neutral; the two
em dashes surviving in registry prose via unicode escapes were rewritten
(the escape is sanctioned for detect/strip code, not display text); the
npm package's stale "50 canonical analogies" is now 51.

Deliberately not changed: registry id 31 keeps its SVG clip-path anchor,
which remains the correct companion to segmentation/04-mask-generation
(the lesson that kept SVG); and registry id 50 keeps its p95-latency
anchor while the terra-grid data-drift lesson uses an upstream-payload
baseline. Both are sibling anchors in the same family, they never render
side by side, and each is internally honest.

## Gates added or updated (second pass)

- NEW packages/content/__tests__/audience-vocabulary.test.ts: a repo-wide
  git-grep gate, shaped like the em-dash ban, that fails on retired
  "frontend engineer/developer/dev" phrasing outside an explicit
  allowlist (historical records, the rule text itself, the migration
  comment, and the backfill script's search string).
- vitest.config.ts `setupFiles` is now absolute. It resolved against the
  invoking directory, so running vitest from inside packages/content
  failed to load the setup file and silently blinded the prose gates for
  package-local runs.
- The 28 Playwright visual baselines were deleted and re-minted against a
  warm dev server, then verified with a second non-updating run (28/28).
  Trap worth recording: the first mint captured two light-scheme pages
  mid-load at viewport height (809px versus the real 1500px page), and
  those baselines passed their own mint run while failing verification.
  Always re-run without `--update-snapshots` before trusting a mint.

## Known leftovers

- Operator checklist: migration 059 deploy choreography (059 from the
  branch, Fly from the branch, merge last), @tensorcraft/bridges republish
  at 0.2.0 (npm is not authenticated on this machine), GSC re-index of /,
  /learn and /pricing, OG cache purges, Kit sequences, and the
  learner-repo README backfill (scripts/one-off, dry-run by default, needs
  prod Supabase credentials and should run after the API deploy).
- docs/scripts/signal-ward.md has pre-existing structural drift from the
  shipped lessons (module 4 has no vanishing-gradients row; module 7 row 4
  names a lesson that does not exist). Unrelated to the rebrand, left
  alone.
- Two nova-canvas bridges (multimodal-learning/05, style-transfer/02) have
  no `breaks` field at all; the schema allows it. If breaks coverage
  should be universal, that is a separate item.
