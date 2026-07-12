# P2 Structure-Variety Sprint — 2026-07-12

Executes items 17–21 of the launch-quality plan (dead `pattern`/`scene`
machinery, opener monoculture, ARIA tic, takeaway lockstep), applying every
process lesson from audit rounds 1–6 from the start: render paths verified
before authoring, all distributions measured mechanically, all runtime
claims verified in real TFJS, and a permanent regression gate left standing.

## Method (rounds 1–6 lessons, applied up front)

1. **Render-path verification first** (round-4 class). Findings before any
   authoring: `pattern` had ZERO consumers (schema comment claimed it
   "drives alternate 5C presentations" — false); `scene:` was fully wired
   (SceneCard rail, briefing slugline, epilogue heading) and fed by 0/56
   lessons; mid-body Dialogues are a designed, CSS-styled case
   (globals.css:260), so restructured lessons could safely move dialogue
   below headings.
2. **Mechanical measurement** (round-6 class). New permanent script
   `scripts/audit-structure-variety.mjs` (opener class, pattern, scene,
   takeaway count, recalls, DISPATCH, boss beats, ARIA tic). Its own first
   run had two parser bugs (single-line recaps undercounted; DISPATCH prose
   vs component conflated) — instrument verified before trusting output.
3. **Runtime-true numbers** (rounds 1–3 class). Every new technical value
   verified: the two matMul error texts and the 404 loader text were
   captured from real TFJS 4.22 (node run + installed source); the EMA
   traces in the Kalman discovery open were computed (α=0.2 → 72.61, α=0.8 → 72.34 at round 1; round 3 unified the
   series and the shipped values are 72.66 / 72.09 on the canon log). Story-tier telemetry keeps internal
   consistency (0.6931 = ln 2 canon; 27 s / 673 params ≈ 40 ms/pass ≈
   the 120 ms fwd+bwd claim). Checked and cleared: 0247 (pulse window)
   vs 0249 (dashboard death) is a consistent 2-minute sequence, not a
   continuity bug.

## Measured before → after

| Metric | Before | After |
| --- | --- | --- |
| Dialogue openers | 49/56 | **38/56** (18 prose/cold opens) |
| `pattern` non-standard | 0/56 | **11/56** — one per module |
| `scene:` sluglines | 0/56 | **56/56** (+9 epilogueLocation moves) |
| Takeaway counts | 56× exactly 3 | 1×2 · 47×3 · 8×4 |
| RecallPrompts | exactly 1 × 56 | 60 total (4 lessons carry 2) |
| ARIA tic (`Observation…/I have no rule…`) | 3 | 1 (rn/03 cadence varied; f/01 single instance kept deliberately) |

## The 11 skeleton-breakers (pattern + how it lands)

- `broken_code_first`: foundations/03 (real matMul inner-shapes error opens
  the lesson; mul-vs-matMul is the repair), neural-networks/04 (already
  opened on the batch-dim ValueError — tagged, not forced),
  recurrent-networks/03 (already opened on the 0.693 flatline — tagged),
  browser-runtimes/03 (real loader 404 text; manifest layout is the fix).
- `discovery`: training-loop/03 (learner runs numeric nudge-gradients
  first, counts the 673-forward-pass bill, THEN backprop is named),
  advanced-time-series/04 (fixed-alpha EMA ridden into the drift dilemma;
  Kalman named only after the learner specifies its job).
- `flashback`: signal-processing/01 (archive playback of the module-1
  reshape swell; frequency domain names it), anomaly-detection/05 (sample
  7741 replayed through the finished ensemble before the climax alert).
- `peer_review`: llm-integration/02 (review Farah's prompt v1 before the
  four missing elements are named), optimization-edge/03 (Nazari's
  three-sentence pruning directive hides three assumptions),
  capstone/02 (deploy.yml arrives as MR 47 "review required"; the stale
  cache is the flaw the learner hunts).

Anti-batch-fingerprint: conversions deliberately vary in mechanism (error
log, directive, merge request, archive playback, live dilemma), two are
honest tags of structures that already existed, and per-module opener
distribution is uneven on purpose.

## Renderer wiring shipped

- `PATTERN_LABELS` + FORMAT tag in the Briefing SceneCard
  (`data-testid="pattern-format-tag"`, lesson-steps.tsx); `pattern` typed on
  the lesson prop; schema comments in schemas.ts + velite.config.ts now
  state the real contract (body carries the structure; field tags it).

## Permanent gates left standing

- `packages/content/__tests__/structure-variety.test.ts` — 56-lesson
  corpus floor: every lesson has a slugline; ≥1 skeleton-breaker per
  module; all four patterns in use; dialogue openers ≤44; takeaway counts
  not uniform; ≥2 double-recall lessons.
- Playback suite: `PATTERN_LABELS` must cover the velite enum exactly
  (text-parity, DerivationDrawer bug class), FORMAT tag renders for
  non-standard and not for standard.
- One old gate was itself a lockstep enforcer and had to move:
  `end-of-lesson.test.ts` asserted exactly-one RecallPrompt; now 1–3.

## Verification (exit codes checked)

velite build 0 · typecheck 11/11 0 · vitest 1036 passed 0 (+10 new gate
tests) · grader `--starters` 80/80 0 · runtime corpus 80/80 0 ·
lesson-demo + exercise-run e2e 0 (one first-compile flake on the first
attempt, the documented class; both pass serially).

Out of scope, still open for P3: boss-beat dilemma quality and count (1),
DISPATCH density (component in 1 lesson), module word-count rebalance, RAG
retrieval honesty (llm/03).

## Round 2: adversarial audit of the P2 work itself (same day)

Full reread of all 11 conversions in final form + mechanical sweeps +
canonical module-order check + a new e2e layer. Found and fixed:

1. **f/03 invented a module number** ("will find you again around module
   3" — neural-networks is module 2; original text made no module claim).
   Rewritten module-neutral. Module order pinned from module.yaml:
   foundations 1, nn 2, tl 3, br 4, sp 5, rn 6, ad 7, ats 8, llm 9,
   oe 10, cap 11 — both flashback timelines verified against it.
2. **ad/05 said "twelve times the amplitude"** in the new opener AND the
   new context narrative; canon quantity is twelve times baseline
   *reconstruction error*. Both fixed.
3. **Slugline time-field class bug (6 lessons):** briefing sluglines
   carried times describing epilogue moments or the wrong day (oe/01
   "morning after" a crash that canon dates the same morning; oe/05
   "Rehearsal" which is its epilogue; nn/02 and cap/04 epilogue-times;
   br/04 "First live hour" before the hour happens; llm/03 countdown
   off by an hour vs the llm/02 epilogue clock). Fixed or dropped;
   scene.time renders at the BRIEFING, so it must date the opening scene.
4. **ad/03 epilogueLocation placed the "shared display" on the Bridge** —
   canon never locates it. Now ship-level ("Archimedes, Shared Display").
5. **cap/02 promised "the sign-off decision at the bottom of this
   lesson"** — no such element exists. Rewritten.
6. **The em-dash sweep instrument failed its positive control** (grep
   pattern silently matched nothing). Rebuilt with a verified instrument;
   true result: all P2 content clean, one pre-existing legitimate hit
   (`git diff HEAD -- file.ts` in ad/03's bridge, the git path separator).
7. **New e2e layer `e2e/lesson-variety.spec.ts`:** the FORMAT tag +
   slugline are now proven through velite → page → real Chromium, both
   directions (present on the converted lesson, absent on a standard
   one). This was the one render layer unit tests could not cover.
   Also removed a stale storage-key comment in lesson-demo.spec.ts.

Verified clean, no action: EMA/error-text/ln-2 numbers re-checked against
runtime and canon; in-medias-res coherence of the three pure cold-opens;
peer_review framing vs cap/02's existing stale-cache payoff; ARIA
no-contraction register in the new tl/03 line; zero duplicate scene
blocks; 11 pattern files exactly.

**Round-2 exit battery (exit codes checked, all 0):** velite · typecheck
11/11 · vitest 1036 · grader `--starters` 80/80 · corpus 80/80 · e2e
lesson-demo + exercise-run + lesson-variety 4/4 serial (parallel run
flakes on dev-server first-compile, the documented class; prod-build
suite unaffected).

## Round 3: independent fresh-eyes review (same day)

Method change: three parallel read-only reviewer agents (full-lesson
coherence on the 11 conversions; all-56 slugline-vs-body audit;
cross-corpus continuity + number canon), each finding verified against
the files before any fix; plus shipped-data validation (.velite output,
not the counter's regex view), a tag-preservation diff vs HEAD, and
single-sourcing the counter/gate parser (the P1 split-brain class:
`structure-variety.test.ts` now imports the analyzer from
`scripts/audit-structure-variety.mjs` instead of duplicating it).

**BIGGEST FIND — pre-existing, not P2's:** the network's parameter count
was split canon. nn/03 + nn/04 said **209** (arch 3→16→8→1, introduced by
a 2026-06-10 audit commit) while nn/05's `model.summary()`, training-loop
3/4, sp/04, and br/03's param table all said **673** (arch 3→32→16→1,
original canon). Six audit rounds missed it. Unified to 673 everywhere
(nn/03 prose + code + epilogue margin-arithmetic 128/528/17, nn/04 code +
layer comments); `grep 209` across content is now zero.

**Fixed, introduced by P2 round 1 (my drift):** ad/05 opener said
"tonight" while ad/04's epilogue times the same alert "mid-morning" (now
mid-morning, plus an elapsed-time beat so Nazari's "checked twice" has
room to happen, and "finished ensemble" no longer contradicts the
build-it Challenge); tl/04's log was labeled "RUN 001" with a 44-min ETA
while the body's actual first run is the 500-epoch/40-minute coffee run
(now an unlabeled log at the canon rate, ETA 4 min); sp/04's log claimed
"same training budget" though the enhanced net is bigger (dropped);
oe/01's slugline named the crash 0247 when its own body dates the death
0249 (fixed, narrative too); br/06 slugline said Engineering, epilogue
says Lab (fixed); nn/04 stale narrative said Farah ran the demo (Demir
did) + slugline anchored a past moment; sp/01 narrative overclaimed
"today it gets its name" (the transform runs overnight; today only the
VIEW is named); br/03 opener over-explained (triple exposition trimmed)
and its consequence narrative described a lesson that no longer exists;
llm/02 Farah misquoted the artifact under review; rn/03 forget-gate line
said "reads the current input" while the file's own math reads
`[prevHidden, input]` (dialogue + recap bridge fixed); ats/04's opener
log was a DIFFERENT eight-cycle series than the body/epilogue Kalman run
(unified to the body series; EMA numbers recomputed and verified:
α=0.2 → 72.66, α=0.8 → 72.09); oe/03's ladder already printed the 87.5%
that the epilogue then "discovered" (motivation rewritten: he ships
knowing the number, the replay reveals what the number contains) and the
directive's "remove is not an operation" review target now gets an
explicit payoff; cap/02's dialogues spoke assignment-time after the MR
existed (rewritten to review-time) and — the sharpest catch — **the
deploy.yml under review did not contain the flaw the review finds**
(every job read the model from checkout; a stale cache was impossible).
The workflow now has the actual bug: a `Restore model artifact` cache
step with a static `key: deep-scan-model`, which is exactly what
Nazari's "nothing in this file pins weights" indicts.

**Reviewer findings rejected after verification:** ARIA's "roughly two
forward passes" (the backward sweep alone is 80 ms ≈ 2 forward passes;
120 ms includes the forward pass — consistent); f/03 was fully clean.

**Documented, deliberately not fixed at round 3 (needs a story
decision):** tl/05's 94% vs sp/04's 78% baseline; Mirza's dangling
"What am I looking at?" seam in ad/05 (pre-existing, LOW); the oe/02
85 MB ↔ 673-weight scale wobble (pre-existing).

## Round 4: all-P sweep — the never-run gates (same day)

Angle: run every gate that had NEVER actually executed this session, plus
a fresh-eyes diff review of the entire uncommitted delta. Three
infrastructure holes found, all P0-tier, none content:

1. **The lint gate was fake.** 7 of 9 lintable workspaces had a `lint`
   script but no eslint dependency and no eslint 9 flat config; every
   green "Lint" for them was a stale turbo cache replay (turbo hashes
   inputs, not whether the binary exists). The freshly-installed eslint
   was ALSO corrupted in the pnpm virtual store (`token-store/cursors/`
   missing — reinstalled). Rebuilt for real: per-package
   `eslint.config.mjs` re-exporting `@tensorcraft/config/eslint/base`,
   eslint devDeps, web config gains `eslint-plugin-react-hooks`
   (classic two rules; v7's compiler preset deferred post-V1) + ignores
   for `public/vendor/` and `next-env.d.ts`, two deliberate empty
   catches got explanatory comments. Result: **15/15 REAL lint passes,
   0 errors, rules-of-hooks clean app-wide.**
2. **Prod soft-404s.** `next start` served **200** for unknown lessons,
   unknown modules, coming-soon-theme lessons, and unknown blog posts
   (dev returned 404, which is why every dev e2e run passed). Root
   cause: segment-level `loading.tsx` streams a shell and locks the
   status at 200 before `notFound()` runs (Next.js #45801/#76474 class),
   and `next start` does NOT enforce `dynamicParams=false` at the router
   the way dev does — which also let the module shim's unconditional
   `redirect()` turn invalid modules into 307s. Fixes: removed the three
   segment-level `loading.tsx` boundaries (lesson page keeps its in-page
   Suspense skeleton; SSG pages render instantly on first hit anyway),
   `notFound()` added to blog `generateMetadata`, and the module shim
   now validates params in the body instead of trusting
   `dynamicParams=false`. Full probe matrix now correct: five invalid
   route shapes → 404, valid module → 307 (by design), valid pages →
   200. Also verified: Next injects `noindex` into soft-404s, so the
   SEO exposure predates this fix but was partially mitigated.
3. **First fully-green FULL e2e run against a prod build:** 88 passed /
   19 auth-gated skips / 0 failed across desktop + mobile + tablet
   projects (round 5's prod run was a 38-spec subset — the 404 specs
   had never run against prod). One stale expectation fixed en route:
   script-playback expected 5 beats; P2's slugline is a 6th.

Diff-review agent findings fixed: spelled-out "Two hundred nine"
survived the digit-only 209 sweep (now 673, and the sweep lesson is
recorded: grep numbers in words too); cap/02's new cache comment said
85 MB where artifact canon is 42 MB; two stale number-pairs in this
document. Noted, deliberately left (user-owned surfaces, pre-existing):
dead `BridgeTicker` export after the landing-ticker deletion; a
globals.css hover-overshoot comment that overstates the keyframe match.
Next.js bumped 15.5.12 → 15.5.20 during diagnosis (kept: patch-level,
all suites green on it).

Round-4 exit battery (exit codes checked, all 0): velite · typecheck
11/11 · **lint 15/15 (real)** · vitest 1036 · grader `--starters` 80/80
· corpus 80/80 · **full e2e vs prod 88/88**. Promise-word sweep over the
whole P2 diff: clean. CI status on GitHub could not be checked (gh
credentials expired — re-auth and confirm the pushed commits are green).

## 94-vs-78 resolution (same day, user-directed)

Canon-true reconciliation, no retcon of either anchored number:
**the labels changed, not the model.** tl/05's 94% was real, measured
against the labels the crew had in module 3 — labels blind to
frequency. sp/03 hands the crew spectral ground truth (the anomaly
resolves on the spectrogram); sp/04's evaluation is the archive
re-annotated against it, where the raw-feature classifier's honest
score is 78 before FFT features earn it back to 87. Evidence this fits:
Nazari's pre-existing ledger line (2,600 fewer misclassifications ×
eleven-day archive = the 9-point delta on 28,800 readings) already
framed sp/04 as a full-archive sweep, and both sp/04 runs score against
the SAME new labels, which is the comparison the lesson teaches.
Implemented as: re-annotation provenance in the evaluation log, a
three-sentence bridge paragraph ("better instruments did not make the
model worse; they stopped the scoreboard from flattering it"), and a
fourth recap bullet making label-honesty an explicit takeaway. tl/05
untouched (protected epilogue; true in its moment). Remaining open
story items: ad/05 Mirza seam (LOW), oe/02 scale wobble. Battery after:
velite 0 · vitest 1036 0 · takeaway spread now 1×2 / 46×3 / 9×4.

**Round-3 exit battery (exit codes checked, all 0):** velite · typecheck
11/11 · vitest 1036 · grader `--starters` 80/80 · corpus 80/80 · e2e 4/4
serial. Post-fix distribution unchanged: 38/18 openers, 11 patterns,
56 scenes, takeaways (final: 1×2/46×3/9×4), 60 recalls.
