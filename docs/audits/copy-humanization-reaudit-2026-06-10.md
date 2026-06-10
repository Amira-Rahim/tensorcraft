# Copy Humanization Re-Audit — 2026-06-10 (post-fix-passes)

Second full audit, run after: the P0–P2 humanization passes (this session's earlier work), the parallel content-overhaul session (story surgery, Epilogue architecture, style bible), and assorted website honesty edits. Six fresh-eyes auditors: one per theme group, one for extras/bridges/micro-copy, one for the website, one quantitative corpus analyst. Owner's added emphasis this round: **readability — easy to follow, no complicated words that break the reader's train of thought.**

## Headline verdict

**The lexical layer is laundered.** AI-tell vocabulary: 15 hits across 297 files, most literal uses ("loss landscape", "test harness"). Sentences are disciplined (1.3% over 30 words). Exact-phrase duplication: zero outside one deliberate disclaimer. Several scenes are genuinely good now (ARIA's arc, the acceleration ladder, alert-fatigue scene, DeepScanDemo).

**What screams "generated" now is positional and structural convergence — and two new tics the fix passes themselves installed.** A reader of three consecutive lessons still feels the machine; it just disagrees with them now instead of agreeing (the "Exactly." loop became the "Almost./Close./Half right" loop, in the same line-47 slot). And the batch nature of the edits left fingerprints: one theme has 116 em-dashes, three others have ≤2; one theme retired `nextLessonTeaser`, four others kept all 183.

## The five loudest signals (quant-confirmed)

### 1. The 4/4/3 lockstep — loudest of all
219 of 240 main-theme lessons have **exactly 4 objectives + exactly 4 takeaways**; three themes sit at 100%; 108/109 SW+NP lessons have exactly 3 hints; deep-orbit is 56/56 at 4/4/3 even though its own style bible (rule 3) declares 3–5 legal. A human corpus cannot produce this. Single highest-leverage fix in the codebase.

### 2. The correction-opener tic — new machine tell, installed by the fix passes
18 dialogue hits ("Almost." / "Close." / "Mostly." / "Half right" / "Half of it." / "Careful with that one."), 11 in the correct-the-analogy slot, **17 of 18 landing at lines 46–52** across themes. "Careful with that one." appears verbatim in two different themes. Plus the narrator-level variant — the "yes-but verdict" paragraph ("Priya is half right, and the missing half is where the money goes") — ~13 more sites in nova/terra, ~10 equivalent beats in deep-orbit. The corrections teach better than the blesses did; their *shape and placement* are the problem. Companion micro-tic: scare-closers ("bites you" ×3, "quietly/silently degrade" ×7).

### 3. Opener monoculture, functionally ~60%
Surface shapes vary now, but merged functionally, the "FE-concept maps to ML-concept" definitional opener runs ~60%+ in every theme. Terra-grid: 38% literally start "You…" (the P2 rewrite recreated the move in new tense: "You have shipped/built/seen…"). The number-first cold open became its own template (~30 terra lessons; "Twelve percent. That is the gap." appears near-verbatim twice in one SW module; "47" appears 35× in terra-grid). Deep-orbit: 55/56 lessons open with a Dialogue block; 22/56 epilogues open on a clock-stamp ("at 0140…"). Signal-ward: the legal Disclaimer blockquote is the literal first body line in ~20 lessons, burying every opener rewrite beneath it.

### 4. Batch-edit provenance fingerprints
- Em-dash cliff: deep-orbit 116 prose dashes vs signal-ward 1, terra-grid 2, extras 0. Inter-theme inconsistency reads as pipeline, not voice.
- `nextLessonTeaser`: deep-orbit 0 (retired by bible), **183 survivors** in the other four themes + extras.
- Epilogues: deep-orbit 56/56, all other themes 0 (planned, but visible).
- Seam lessons: one brilliant rewritten paragraph at line ~46 atop an untouched templated body (worst: nova style-transfer/01, where the body **re-asserts the exact analogy the new dialogue just corrected**; terra quantization/05 has two prose sentences total + a duplicated "## Knowledge check" heading).

### 5. Frontmatter and bridges.ts still templated (never touched / retemplated)
- `concept.explanation`: 45% contain a simile; 40 use the exact "[ML thing] — like [FE thing]" coda.
- `consequence.narrative`: 44% begin "The …" — status-report monotone.
- module.yaml: 37/59 "You'll learn/master/build X, Y, and Z"; "using concepts you already know from frontend development" verbatim ×3.
- bridges.ts: the P1 rewrite traded "Both <verb>" for a new master shape — **36/51 open "FE clause; ML clause." and 35/51 close with a sameness punch** ("same X, different Y" ×6 near-verbatim). The `breaks` fields are growing the same coda ("The X matches; the Y does not" ×4).
- Signal-ward context.narrative: 9 validated-guess beats survive in frontmatter ("'It is just REST'" → expert blesses).

## Readability findings (owner's emphasis)

Good news: complicated words and long sentences are NOT the problem (21 of 28 flagged words at zero; 1.3% long sentences). The real readability failures are **jargon before introduction** and **density**:

1. **KL divergence** is terra-grid monitoring-drift/02's central metric and is never explained in prose; learner reads `kl += pi * Math.log(pi/qi)` cold. **PSI** first appears inside a quiz, then becomes load-bearing in the capstone BossBeat. **p95/p99** used in both themes, never defined. **logits** used in neon (challenge + quiz) with no definition anywhere in the theme. **L2 distance** dropped unintroduced in deep-orbit. "Canary" leaned on two lessons before the lesson that defines it.
2. **Out-of-scope quizzes:** deep-orbit rn/02 (seq2seq/teacher forcing/exposure bias in a simpleRNN lesson), rn/05 ("spectral radius" never taught), nova latent-interpolation quiz ("on-manifold", "great circle").
3. **Forward-referenced concepts:** foundations/05 explains normalization via "gradients"/"optimizer" — module-3 concepts in a module-1 lesson (its quiz doubles down).
4. **Mega-hints:** SW production-privacy/05 solution hint = 246-char single sentence chaining six steps ("inverse-frequency sample weights" harder than the code it hints). Hint register whiplash: kindergarten in foundations, grad school in production-privacy.
5. **Dense pass-2 paragraphs:** the rewritten line-46 paragraphs stack 5–6 ideas (SW bias-auditing/03:49 is the type specimen — brilliant on the third read, lost on the first).
6. ~8 genuinely overlong sentences worth splitting (worst: oe/02:42 48-worder).

## Trust/factual bugs found (P0 — these break the brand's checkable-specifics promise)

| Bug | Where |
|---|---|
| `tf.quantize()` does not exist in TFJS — in BOTH hints; stuck learner copies it → runtime error | deep-orbit/optimization-edge/02:26,28 |
| `tf.linalg.svd()` does not exist; row/column comment error (rows labeled as basis images; matMul makes them columns) | extras/math-deep-dive/01:82-84,122 |
| softmaxed probabilities passed to `softmaxCrossEntropy` (expects logits) — printed value won't match hand-derivation | extras/math-deep-dive/05:124-128 |
| `tf.grads` call as written throws (array param vs spread) | extras/math-deep-dive/02:171-183 |
| Bridge #51 references the review queue, removed 2026-06-01 — ships on public /glossary | packages/shared/src/bridges.ts:1072,1074 |
| Pruning numbers contradict: 5MB/40× (dialogue+bridge) vs 2.5MB/80× (code+hint) | terra-grid/pruning-distillation/05 |
| Cosine comment "~0.05" — actual value of printed vectors ≈ −0.11 | signal-ward/word-embeddings/02:139 |
| "cardioectomy" — invented medical term (real: cardiectomy), in the clinical theme | signal-ward/tokenization-preprocessing/02:116 |
| Takeaway claims "no more [UNK]" while the lesson's code emits [UNK] | signal-ward/tokenization-preprocessing/02:131 |
| U-Net skip connections taught as "CSS inheritance" — wrong, and it's the one analogy nobody corrects | neon-protocol/segmentation/03:44-47 |
| "ten modules" line in module 4 + Neon/Signal-Ward content bleed in a Deep Orbit lesson | deep-orbit/browser-runtimes/06:40,72 |
| Duplicate β-VAE quiz in consecutive lessons; duplicate Tariq line in 2 lessons; "Petrov" cameo (character never introduced) | nova vae/04+05; terra ab-testing/01+04; nova capstone/05:235 |
| Wasserstein-loss hint for a lesson that never teaches it | nova gan/05:30 |
| docs/voice-guide.md is stale: places Rohan in Terra Grid (he's now nova-canvas audio artist); Erdem/Samir/Tariq/Priya/Elif have no cards | docs/voice-guide.md |

## Website (10 contradictions + tics)

1. **False structured data:** pricing JSON-LD free offer says "across all five themes" (pricing/page.tsx:207); layout FAQ JSON-LD says "Module 1 of every theme is free" (layout.tsx:291). Both false under Deep-Orbit-only launch; both machine-quoted by search engines.
2. **GitHub overclaim:** landing "Every exercise you solve auto-commits to your GitHub" (page.tsx:147) vs paid-gated "push flow" everywhere else.
3. **Capstone honesty seam:** about softened ("assembled piece by piece") but paywall still sells "a capstone you run in production" (paywall/page.tsx:98-99) and landing "Ship a production-ready model" (page.tsx:143).
4. **Compare sells what can't be bought:** "Five deployable browser-side ML apps", "$129 all five themes" while the All-5 button is disabled "Available when all 5 themes launch". Credential doublethink on the same page (sells certificate at :74, disclaims credential at :217).
5. **Newsletter cadence:** modal says monthly, blog metadata says weekly.
6. **journey/unlock survivors:** capstone "// YOUR JOURNEY", curriculum-preview "What You're Unlocking", dashboard "Unlock →", purchase-success "fully unlocked" ×2.
7. **Punch-pattern tic:** "Buy a theme. Keep it forever." / "Module 1 is done. The model isn't." / "Pick a plan. Own it forever." — same shape, two on the same page. Triple-no triad ×4 on the landing funnel.
8. **Bugs:** /about renders literal backticks (about/page.tsx:48); DeepScanDemo says "into your GPU" on CPU fallback + hardcodes "that 51% is real" next to a live number that may print 50.8%.
9. **Staleness:** hardcoded "4 themes in the pipeline", "1/5 themes live", "55"/"11" tiles (pricing derives them; landing doesn't), © 2026, "295+", "50 bridges", "Weekly".
10. **Dev vocab leaks:** "stub page" (learn/page.tsx:117), "Bridge-tier honesty" as a cold-visitor row label.

## What's excellent now (protect — do not re-fix)

Deep-orbit: acceleration ladder (10 files, zero contradictions), ARIA's arc (every line screenshot-worthy), sample-7741 thread, Nazari's costed grievances, Demir's failures with bodies attached, epilogue closers ("Both numbers are getting smaller, and only one of them is on purpose."). Cross-theme: bridge `breaks` content (the course's credibility backbone), quiz explanations (distractor-by-distractor), NEON's sneers, GRID's telemetry, MEDI's alerts, "Music generation is setTimeout with taste.", terra's alert-fatigue scene, Atacama line. Website: error-messages.ts, pricing anti-sell footer, /compare intro, unsubscribe page, DeepScanDemo concept, lesson chrome ("Fade Out" / "Next Mission").

## Fix plan (ranked by impact/effort)

> **STATUS — all R levels executed 2026-06-10** (7 parallel agents + spot fixes). Verified: velite green, typecheck 9/9, grader 80/80, vitest 105 files / 762 tests, out-of-band YAML+MDX validation of all 498 unlaunched-theme files (velite only parses launched dirs — caveat below). Post-fix metrics: nextLessonTeaser 183→0; correction-opener tic 18→2; objectives lockstep broken (231×4 / 54×3 / 11×5), takeaways (261×4 / 16×3 / 19×5); terra "47" 35→21 (canonical only); bridges "FE; ML." openers 36→19, sameness punches 8→2; skeleton-break lesson shipped in ~1 lesson/module across all themes. Notes: `velite.config.ts` hints constraint relaxed `.length(3)`→`.min(2).max(3)` (bible rule 3); voice-guide.md refreshed (Rohan corrected to nova-canvas, cards added for Erdem/Samir/Tariq/Priya/Elif); NEON cnn/03 weights contradiction (34,826 vs 1.6M) fixed post-agent. Remaining: Kit emails (external), takeaway-count variance lighter than objective variance (261/296 still at 4 — optional further pass).

### R0 — Trust + website falsehoods (1 day)
All table items above + website items 1–4, 8: the two JSON-LD falsehoods, tf.quantize/svd/logits/grads code bugs, bridges #51, pruning/cosine/cardioectomy/[UNK]/U-Net corrections, br/06 continuity, GitHub + capstone + compare overclaims, /about backticks, DeepScanDemo GPU line + hardcoded 51%.

### R1 — Break the structural lockstep (the unfinished half; 3–5 days)
1. **4/4/3 → 3–5 variance:** retune ~15 lessons per theme to 3 or 5 objectives/takeaways where content honestly supports it; ship 2 hints where the exercise is one call.
2. **Kill the line-47 correction beat as a fixed slot** (~31 sites): vary outcome (sometimes the analogy is plainly right; sometimes wrong with on-page cost; sometimes a third character objects; sometimes no analogy beat at all), vary placement (mid-lesson, in code, in epilogue). Cap scare-closers at 1/theme.
3. **One skeleton-breaking lesson per module** (style-bible rule 4): quiz-first, mid-crisis open, dialogue-argument, unresolved ending. 10 deep-orbit modules + 22 other-theme modules.
4. **Delete all 183 `nextLessonTeaser`s**; move the SW disclaimer out of body position (layout component) so 20 lessons get their openers back.
5. **Opener diversity quotas:** "FE-concept→ML" functional opener ≤40% per theme; number-first cold-open ≤20%; ration terra's "47".

### R2 — Frontmatter + bridges de-templating (2 days)
concept.explanation: kill the 40 "— like X" codas, thin similes to ~1 in 3. consequence.narrative: break the 44% "The …" monotone. module.yaml: rewrite the 37 "You'll…" blurbs toward the story-first ones. bridges.ts: restructure ~15 of the 36 "FE; ML. Punch." entries; cap "same X, different Y" at 3.

### R3 — Readability (1 day)
Gloss at first use: KL (2-3 plain sentences), PSI (teach before quiz), p95/p99 (one line), logits, L2; move "gradients" out of foundations/05 or gloss it. Replace the 3 out-of-scope quizzes. Split the 6 mega-hints; adopt hint register rule (nudge ≤120 chars one idea / guidance 2-3 short sentences / solution runnable code). Split the 8 worst sentences. Unpack the 3 densest pass-2 paragraphs.

### R4 — Voice + reconcile (1-2 days)
Finish MUSE (3 stranded lecture blocks; rotate the I-verb-N skeleton). NEON exposition blocks → restore sneer or move to narration. Fix naming strays (Dr. Zahra Karimi, Imran Malik full-name slips). Update voice-guide.md (Rohan's theme, add Erdem/Samir/Tariq/Priya/Elif cards). Deep-orbit em-dash pass to bring 116 closer to other themes' levels; epilogue trims (12 over-length) + clock-stamp variety (22); Mirza's capstone speech → 2 sentences; deep-orbit foundations needs one Demir-wrong-at-cost.

### Out of repo
Kit lifecycle emails — still unaudited, dashboard-only.
