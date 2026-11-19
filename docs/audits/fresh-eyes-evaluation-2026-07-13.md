# Fresh-Eyes Full Evaluation: 2026-07-13

## RUN #5 (2026-07-14): re-verify Tier 1 + Tier 2; found REGRESSIONS FROM OUR OWN FIXES

Four blind agents launched (Tier-1 fix verifier, Tier-2 fix verifier,
completionist metadata reader, prose line editor). Three died mid-run on
a Fable credit exhaustion; session continued on Opus 4.8, harvesting their
partial transcripts. The prose editor completed fully.

**Meta-finding (why reruns keep paying off): several HIGH items were
regressions introduced BY the run-#4 fixes themselves.** Fixed this round:

- **SECURITY, open-redirect in the run-#4 onboarding redirectTo fix.**
  The guard `startsWith("/") && !startsWith("//")` let `/\evil.com`
  through (browsers normalize `\`→`/` → protocol-relative offsite). Worse,
  the first patch this round used a broken char-range regex `[ -\\]` that
  rejected EVERY valid path (fail-safe but feature-dead). Final guard
  (startsWith checks + control-char `[-]` reject) verified by
  execution: all valid same-origin paths pass, `//evil`, `/\evil`,
  `https://`, and newline-injection all rejected.
- **7 em dashes reintroduced** by run-#4 edits, undoing the prior
  em-dash-sweep session: sp/02 (complex-coefficient), kalman drawer
  (honesty clause), cap/03 (fft_5 line), f/04 (function* comment), f/05
  (colMeans comment), simple-attention.yaml (rank trap), faq-data.ts
  (RNNs/LSTMs). User-facing em-dash count back to 0 (6 residual are
  internal source comments, never rendered).
- **LessonRecap contradicted its own fixed body**: foundations/04's
  recap still recommended `.shuffle().take()/.skip()` after the run-#4 fix
  made the body teach that pattern as the leak-trap. Recap rewritten to
  the deal-the-deck-once index split.
- **oe/02 five-class paragraph unreadable** (the run-#4 continuity repair):
  a 40-word sentence nesting three prior accuracy events with no landmark.
  Split into a clean chronology (78 → 87 → 94.2, then the head widened).
- **In-lesson phrase doublings introduced by run-#4**: ats/01 "budget,
  not a spotlight" (Farah's line + my added code comment) → comment
  reworded; oe/05 "stays paid" (frontmatter + body) → frontmatter varied;
  cap/03 dangling coordination fixed with the em-dash edit.
- **Decorative `//` in UI copy** (pre-existing, style-bible violation):
  pricing-tiers credit line + paywall hero → slashes dropped.

Tier-1 verifier confirmed before dying: `quantizationBytes` gone
corpus-wide, pytorch fix compiled into exercises.json + graded, all 7
touched exercises grade green.

Battery: velite · typecheck 11/11 · vitest 1066/0 · lint 0 errors ·
grader 84/84 · prod build clean · open-redirect guard execution-verified.

**STILL OPEN (prose editor, not yet actioned, style-thinning judgment
call for the owner):** the "X, not Y" corrective cadence fires 50× across
56 lessons; "honest/honesty" 18×; the cost/ledger economy metaphor
saturates narration beyond Nazari's voice; signature sentences ("…is the
whole lesson", "…is the point") recur verbatim in different characters'
mouths (breaks the voice-separation the style bible demands). Plus MED
prose (M5 dialogue that doesn't scan: ats/03 Mirza parenthetical, rn/03
Farah essay-syntax; M6 grammar: ats/01:185 garbled comparative,
cap/04:49 him→you POV slip; M9 app-copy drift: 3 different first-lesson
CTAs on one landing page, Two/Three-Themes vs All-5 numeral mix, learn
page hardcodes "50+" vs the 55 constant). Recommendation: thin each top
tic ~half (leave Nazari her ledger), unify the landing CTA + numerals.



## RUN #4 TIER 2 EXECUTED (2026-07-14): all ~30 MEDs closed

Expert: oe/01 profiler reads results back inside the timed region (third
site of the enqueue-timing class); Kalman lesson gained the honesty
clause (steady-state gain ≈0.27 hand-verified, constant-state filter
converges to an EMA; trend-tracking needs a velocity state); KNN's false
"Manhattan fixes scales" claim replaced with standardize-first; the
ethics extra renames occlusion correctly and warns about OOD-zero probes.
Learner (hint-vs-test class closed): reshape-tensor, create-sequences,
fft-features, and load-pretrained-pipeline hint ladders all rewritten to
solve their ACTUAL exercises with code-bearing solution hints; function*
explained at first use; "complex coefficient" defused in one sentence;
weighted-ensemble's untaught-tf mandate softened; nn/02's gradient
foreshadowing carries an explicit Preview note.
UX: single launched theme preselected (CTA enabled immediately; test
updated to assert the new rule); the Challenge gate explains itself
("Pass N more exercises to continue"); a pass now surfaces a Continue
banner in the same pane as the green results; Show Solution stashes the
learner's code behind a Restore My Code button; onboarding preserves the
intercepted destination (middleware passes redirectTo, wizard returns
there, same-origin-only); dashboard says "Unlock Module N →" instead of
promising a lesson the paywall intercepts; /compare + /extras linked from
the footer and the free tier's "21 bonus lessons" bullet links /extras;
inbox unread badge on the nav (count_unread_dispatch, refetch per route)
and the Link-in-button invalid HTML restructured; mobile swipes ignore
touches from code blocks/editor; first exercise run says "Downloading
TFJS runtime" instead of 30s of silence.
Continuity F-4..F-15: tl/04 consequence tells the early-stop truth; ats/01
unified to the 4/77 canon (log, prose, dialogue, both code comments);
Kalman log restarted at 73.1 with ALL numbers recomputed by execution
(EMA 72.57/72.08, KF final 72.44, drift ~0.16/cycle; epilogue and
consequence updated); "macro-cycle" fixed to the bible's referent (47-min
macro-cycle, 72-h super-cycle); rn/03 consequence now says
recognition-not-memory; 7741 aged correctly ("logged eight days ago" +
bible updated with the ID arithmetic); signal ontology closed ("12,000
catalogued signal events, distilled out of millions of raw dashboard
readings"); Nazari's sample rate now exact (983 thousand/min, "call it a
million if you must round, I won't"); oe module.yaml says 2.4% and owns
it; llm/04's 47-days line tied to relay windows; ats/02's capture beat
runs on the 47-minute clock (seven captures/six hours); cap/03
drift-checks the real 11-dim feature vector and the epilogue names fft_5.
Battery: velite · typecheck 11/11 · vitest 1066/0 (footer snapshot +
2 pricing tests updated to intended behavior) · lint 0 errors · grader
84/84 · e2e 41/41 exit 0 · prod build clean.

## RUN #4 TIER 1 EXECUTED (2026-07-14): all 15 HIGHs closed

A: oe/02 quantization rebuilt on the real converter-flag export path
(code block, hint, AND the LessonRecap that also carried the fabricated
option); MC-dropout → `model.apply` with the why-comment; pytorch-bridge
lesson + exercise teach THE logits/softmax porting bug explicitly, the
solution adds softmax, and TWO new grader tests pin it (activation
config + a real `model.fit` objective test: loss < 4 vs the bug's ~7.9);
f/04 split rebuilt on deal-the-deck-once index splitting, my first fix
(`reshuffleEachIteration:false`) was EXECUTED and proven still-broken in
TFJS before shipping the verified pattern (disjoint + stable, run-checked).
B: normalize-data hints + lesson teach axis-0 moments (worked colMeans
example [24.8, 0.52]); simple-attention names the rank-1 trap in
instructions/starter/hints with the reshape→squeeze route, and ats/01
gains a 3-number worked softmax example; apply-window drops the untaught
tf.range mandate (plain JS or tensors, tf.range explained as an option),
sp/05's mismatched hint ladder rewritten to fit the two-function starter.
C: the map's Continue CTA routes paywall-blocked learners to /paywall
("Unlock Module N") and locked rows carry a clickable Unlock link for
signed-in non-purchasers (two inbound /paywall links where there were
zero); Challenge pass-state persists per lesson (slug-validated against
the lesson's real exercises) and editor code persists per exercise slug
(saved on run, restored once on mount, cleared on Reset); Share
Certificate copies the public /certificates/{id} URL (theme page
pre-claim), never the auth-gated capstone URL; the BEST VALUE ribbon +
data-recommended render on All-Five only when it is buyable
(launchedThemeCount >= 5) and the Single tier carries an "Available Now"
recommendation until then (pricing test updated to assert the new rule).
D: frozen epithets re-aged ("recorded before first contact" /
"pre-contact archive", + the filed-under-equipment-error clause);
the five-class widening now happens AT the module-10 retrain ("finished
this week... in the same run") so llm/05's earlier binary code is
consistent; the capstone interval ticker renumbered to a genuinely
accelerating series 47.9 → 47.0 → 44.0 → 37.0 → 31.6 → 30.0/29.7
(rates 0.9 → 1.6 s/day, monotonic), matching the protected finale's
"accelerating" and the style bible's 30-by-capstone.
Battery: typecheck 11/11 · vitest 1066/0 (pricing test updated to the
intended recommendation rule; module-map test green) · lint 0 errors ·
grader 84/84 --starters (incl. 2 new pytorch gates) · e2e
themes+pricing+landing 40/40 exit 0 · prod build clean.

## RUN #4 (2026-07-14): four NEW lenses; findings ledger (Tier 1 above now FIXED)

Lenses rotated: hostile senior-ML expert (endorse or not?), struggling-
learner simulator (math-anxious junior, hint-ladder walkthrough),
full-journey UX walker (landing→finale as one experience), continuity
auditor (course calendar + numeric spine, blind to edit history).
Verdicts: expert "yes-with-caveats, most technically honest ML course
for FE devs I've reviewed"; UX "strong product with a broken handshake
at the cash register"; learner names modules 1/8/5 as churn points;
continuity "fix 3 HIGHs + F-4..8 and the ledger-reading reader finds
nothing left."

### Tier 1 (verified HIGHs)

Teaches-wrong (expert, all execution-proven):
1. `oe/02` quantization save API is FABRICATED, `model.save(path,
   {quantizationBytes})` is not in TFJS SaveConfig; runtime-verified
   byte-identical output. Also propagated in the frontmatter hint
   (line 29) and printed results (115). Real path: converter-side
   quantization flags; TFJS dequantizes at load.
2. `extras/math-deep-dive/06` MC-dropout uses `predict(x,{training:
   true})`, option ignored; 5 runs returned identical outputs → the
   taught uncertainty estimator always reports zero. Fix: `model.apply`.
3. `extras/python-bridge/03` + `exercises/pytorch-to-tfjs.yaml` GRADED
   SOLUTION ships raw-logits model + 'categoricalCrossentropy' (probs
   loss), trained at loss ~7.9 vs correct ~2.3; the exact porting bug
   the lesson exists to prevent. Fix: softmax on final layer + say why.
4. `f/04` train/val split `shuffle().take()/skip()`, reshuffles per
   iteration → non-disjoint, non-deterministic split (verified
   overlapping). Fix: reshuffleEachIteration=false or index split.

Quit-risk walls (learner; Challenge gate makes each a hard stop):
5. `f/05` + normalize-data: instructions demand axis-0 moments; lesson
   body AND all three hints show axis-less `tf.moments(tensor)`, max-hint verbatim FAILS the tests, at the end of the free module.
6. `ats/01` + simple-attention: rank-1 query makes naive matMul throw;
   no hint names the reshape; softmax never taught anywhere prior.
7. `sp/05` + apply-window: instructions require `tf.range` (taught
   nowhere in the course); solution hint is plain-JS that doesn't fit
   the two-function starter.

Conversion corridor (UX):
8. Finishing free module 1 DEAD-ENDS: locked module 2 → activeModule
   undefined → CTA "Start Learning" self-loops to the same map; locked
   rows = lock emoji, pointer-events-none, no purchase CTA
   (`themes/[slug]/page.tsx:204-223`, module-map-client:172,232-240).
9. `/paywall` page has ZERO inbound links (grep-verified); DISPATCH
   module-cleared CTA also routes into the dead-end map.
10. Challenge state (`passedExercises`) is unpersisted useState + editor
    always re-inits from starterCode: leave mid-lesson → work erased,
    step re-locked (lesson-steps:180-183; exercise.tsx:583).
11. Capstone hero "Share Certificate" copies the AUTH-GATED page URL,
    not the public /certificates/{id} (capstone-client:48-57).
12. Pricing highlights "BEST VALUE" on a permanently-disabled tier; 3
    of 5 columns unbuyable while launchedThemeCount===1.

Story physics (continuity):
13. F-1 frozen epithet: archive called "eleven days ago/old" in sp/02:247
    + ats/01:170, weeks after module 1 (calendar reconstructed: Day 47
    at module 9).
14. F-2 five-class retcon: oe/02's "the week Farah's labels landed"
    (added in the Tier-2 repair) contradicts llm/05's binary
    `output>0.5` code that is LATER in story time. Interacts with the
    expert's biggest curriculum hole (multi-class never taught).
15. F-3 interval lurch: 47.9s (R−15) → 38.4s (R−14) = 9.5s in one day
    vs ~3s/day before and ~0.5s/day after, while cap/05 claims "the
    shrink itself accelerates." Ticker derivative impossible.

### Tier 2 (verified/cited MEDs)

Expert: oe/01 profiling loop times GPU ENQUEUE (no readback), contradicts the course's own br/02+br/05 discipline (the Tier-2 fix
missed this third site); Kalman lesson oversells (1-state random-walk
filter converges to fixed-alpha EMA ≈0.27, needs a velocity state or
an honesty clause); classical-ml KNN "Manhattan better for different
scales" is false + scaling prerequisite never stated; ethics extra
mislabels occlusion as "permutation importance" + probes with OOD
zeros. Learner (the hint-vs-test CLASS, 8 exercises): reshape-tensor
hints solve reading not reshaping; create-sequences demands stride/
labels lesson 1 never taught w/ codeless solution hint; batch-data
`function*` never explained; sp/02 "complex coefficient" one-sentence
gap; fft-features hints solve the fixed-bin task not the top-K task;
load-pretrained-pipeline hint calls pipeline('sentiment-analysis'), ReferenceError vs pipelineFactory; weighted-ensemble instructions
mandate untaught tf ops the tests don't require; nn/02 gradient
foreshadow needs a "Preview" label. UX: preselect the single theme
(disabled buy button behind 1-chip picker); explain the Challenge gate
("Pass N remaining"); pass-feedback and Continue in opposite columns;
Show Solution destroys learner code (no restore); onboarding hijacks
destination + exits to /themes not the requested page; dashboard shows
locked module as "Resume Lesson"; /compare + /extras orphaned while
pricing advertises "21 bonus lessons"; inbox has no unread badge (+
Link-in-button invalid HTML); mobile swipe fires from code blocks;
first exercise run needs staged status (1.4MB CDN pull). Continuity
F-4..F-15: tl/04 three endings disagree (frontmatter 0.69→0.08 vs real
run vs epilogue); ats/01 still says steps 5/72 (canon now 4/77); Kalman
log restarts drift at 73.4 (should open 73.1); "macro-cycle" flips
referents (rn/05 vs ats/03+bible); rn/03 frontmatter consequence
contradicts its epilogue's recognition-not-memory point; 7741 ID ↔
"eleven days ago" arithmetic mismatch (ID 7741 ≈ day 3 of archive);
signal ontology never closes (86,400/day vs 12,001 total vs 1,180
pulses/day, one distillation clause fixes); "two million samples/min"
vs 983,040 canonical (2×); oe module.yaml "2%" vs lessons' insisted
2.4%; comm-physics 47-days-not-knowing vs years-to-Earth; ats/02
"three captures, six hours" fits no clock; cap/03 drift-checks
features the 11-dim vector doesn't have (snr/bandwidth/inter-pulse).

### Run #4 Tier 3 EXECUTED (2026-07-14, on Opus 4.8)

Content LOWs fixed (numbers execution-verified): nn/04 error text
`[3]`→`[3,1]` (ran the real TFJS 4.22 error); bayes intermediates
corrected to the exact non-rounded values [0.0232, 0.9768] and
[0.1841, 0.8159] (recomputed); ats/02 readout middle feature 73.4→37
(zero-crossing count, post-rename); finale DispatchTease drops the stale
"73.4-second pulse" for "the same pulse train"; the 0.9987 canary metric
(a copy-paste of the Fibonacci-harmonics correlation) → "all thirty
verdicts match the shadow model"; tl/04 "twenty-minute version"→
"four-minute" (the only run on the ledger); ORT br/05 bundle-size row now
notes the multi-MB `ort-wasm*.wasm` runtime fetch + the WebGL-EP comment
points at webgpu; conv-vs-correlation caveat added (tf.conv1d is
cross-correlation, no kernel flip); logreg "calibrated probability"
softened to "probability-shaped score" with a reliability-curve caveat
(breaks label + recall); WebGPU "Chromium today" updated (FF/Safari ship
it now); Mirza tl/05 trimmed to a 2-sentence non-explaining order; f/03
ripple "every few minutes"→"every minute or two"; br/05 ARIA 2.1ms
labeled "on the bench"; NEW: tl/04 gained a real
`tf.callbacks.earlyStopping` code block (the epilogue's "stops itself at
epoch 64" now has a taught mechanism).
App LOWs fixed: paywall-notice "all 11 modules and 56 lessons" →
"modules 2-11: the remaining 51 lessons" (was overcounting the free
module); GitHub error toast recolored from brand-success green to error
red; landing "any paid theme" → "starting free in Module 1"; NEW Back
button in the lesson step nav (was forward-only); purchase-success
"refresh this page shortly" → a bounded auto-poller (PendingPoller) that
flips the page on webhook confirmation.
Deferred (accepted-v1, cosmetic/design, noted not fixed): dashboard dead
code (unimported BridgeCollection, null score fields, "pts"=percent,
href="#" locks); hero demo animation plays below the mobile fold;
LessonPaywall component unreachable (route redirects first), left as
harmless dead code; late-module estimatedMinutes uniformity (those
modules are genuinely the heaviest); the capitalized-NOT comment tic and
prose-repetition tics (owner's editorial-thinning call from run #5).
Battery: velite · typecheck 11/11 · vitest 1066/0 · grader 84/84 · lint 0
errors · e2e 40/40 · prod build clean · content em dashes 0 (2 residual
are legitimate text-cleaning DATA in signal-ward).

### Tier 3 (LOWs) + systemic [original list, now executed above]

LOWs: nn/04 error text says [3] vs real [3,1]; bayes printed posterior
from rounded input (0.1834 vs 0.1841); ort bundle-size omits wasm
artifacts + wasm/webgl EP comment stale; conv-vs-correlation sentence
owed in convolution extra; early-stopping shown but tf.callbacks.
earlyStopping never taught; ats/02 readout shows 73.4 as raw middle
feature (it's a zero-crossing count now); logreg "calibrated" claim;
WebGPU "Chromium today" stale (FF/Safari ship it); paywall-notice "all
11 modules/56 lessons" overcounts purchase by the free module; landing
"any paid theme" vs module-1-free push; dashboard dead code (Bridge
Collection unimported, null scores, "pts"=percent, href="#" locks);
GitHub error toast in success green; step-bar segments anonymous + no
Back button; hero demo animation plays below fold on mobile;
purchase-pending "refresh shortly" (no poll); LessonPaywall component
unreachable (redirect wins), delete or wire; sp/02 "filed under
equipment error the whole time" vs on-page flagging; Mirza 3-sentence
explaining lines (tl/05); f/03 ripple "every few minutes"; finale tease
"73.4-second pulse" on a 30s night; 0247-vs-0249 frontmatter; 0.9987
reused as canary metric; tl/04 "twenty-minute version" never on ledger;
2.1ms vs 3.4ms unlabeled bench-vs-pipeline; three-vs-four feeds;
estimatedMinutes uniform 20/25/30 in late modules = edit-wave
fingerprint; capitalized-NOT comment tic clusters in repaired lessons.

Systemic (the real lesson of run #4): (a) build an executable
HINT-VS-TEST GATE, run every exercise's solution-level hint against
its own tests in the grader; the class had 8 members and every prior
round sampled instead of gating; (b) frozen-epithet sweeps after any
timeline edit ("eleven days", "the 0249 crash"); (c) the conversion
corridor is one project, not five fixes; (d) V2 curriculum: a real
multi-class lesson (fixes F-2 properly), regularization-in-practice,
calibration sentence, class weights.

## Run #3 Tier 1 EXECUTED (2026-07-14)

Five blind evaluators (three learner bands, story editor, value auditor)
re-ran the original evaluation; grades: modules A−/A band, story B+, value
honesty A−, unanimous would-pay-$59. Five verified Tier-1 findings, all
fixed same day:

1. **Mirza pronouns**: 4 he/him → she/her (ats/04:175, llm/05:189,
   oe/05:154, cap/05:298, the course's closing image among them); sweep
   confirmed no fifth site.
2. **tl/04 trained on noise while printing a learnable curve**: demo now
   builds two seeded feature clusters (calm 0.35/flagged 0.72, σ 0.12),
   shuffles before validationSplit (the split takes the LAST rows), and
   prints a curve captured from a REAL run on the vendored TFJS 4.22
   (0.6863/0.4875 → 0.4672/0.9375 at epoch 40) with an
   init-varies caveat and an accuracy-jumps-before-loss note. The epilogue
   stands: it narrates the 28,800-reading archive run, not this demo.
3. **rn/04 hints taught label-inside-window**, failing the exercise for
   anyone who used them: guidance + solution hints rewritten to the
   label-after-window convention the lesson body and both exercises use.
4. **Onboarding's false calibration promise → made TRUE**: new
   `LessonPrefs` context in packages/ui; lesson page reads
   `profiles.experience_level` and advanced/expert learners get
   DerivationDrawers opened by default (toggle still wins). The
   goal-question copy rewritten to what it actually does (roadmap input).
   Gate: drawer test asserts provider-opened default + toggle override.
5. **Three irreconcilable data rates unified by units**: f/03 = "two
   million raw samples a minute before integration boils them down to
   readings" (suite-wide), br/01 = "86,400 dashboard readings per day,
   one integrated snapshot a second", f/04 archive = "one reading per
   33-second integration window" (33 × 28,800 = 950,400 s = 11 days
   exactly). Rejected during verification: value auditor's "5/55 bridges
   unlabeled" (those five resolve via the registry fallback the
   bridge-breaks gate replays).

Battery: velite clean · typecheck 11/11 · vitest 1063/132 files (0 failed;
+1 drawer gate) · lint 15/15 · e2e themes+onboarding 26/26.

**Tier-1 verification round (2026-07-14, deep re-audit of the fixes):**
(1) corpus-wide pronoun sweep: zero remaining Mirza misgenders, every
surviving he/him is Demir; oe/05 "behind her" sharpened to "behind the
Commander" (Nazari shared the paragraph). (2) shipped tl/04 block executed
3× on vendored TFJS: loss column stable, accuracy bounces 0.71–0.94 at
epoch 40 → caveat comment now states the measured range instead of
"differ a little"; the in-story 0.6931 training log is the archive run,
consistent. (3) hint-derived rn/04 code executed against the exercise
convention: exact match; same-class sweep of sibling rn hints caught
rn/05's off-by-one ("label = signal[n+1]" → signal[n]), fixed. (4) wiring
chain proven end-to-end: ui exports resolve to src (single module
instance, no context split), migration 018 column confirmed, null-profile
safe, and the previously-unverified PRODUCTION build passes. (5) rate
mentions swept corpus-wide: every survivor coheres under the three named
units. Environmental note: the prod build clobbered `.next` under the
long-running :3131 dev server → 3 e2e failures that vanished on a fresh
server (the known dev-chunk-poisoning class, not a code bug). Battery
after: velite · tc 11/11 · vitest 1063/0 · lint · grader 83/83 · prod
build · e2e 26/26, all green.

### Run #3 Tier 2 EXECUTED (2026-07-14): all items below closed

**Graders:** llm-client gained the missing-field validation test (bare
`JSON.parse` no longer passes); prompt-template gained the second-input
anti-memorization test; build-rnn/build-lstm/predict-next assert
`model.loss` + `model.optimizer` (uncompiled models no longer pass); NEW
**launch-rehearsal** capstone synthesis exercise (25 min, advanced):
normalize → batch-predict in tidy → drift check → launch gate, tested
against a weight-injected probe with hand-checkable confidences and a
leak assertion. Grader corpus now **84/84** with --starters. Workload:
1,800 min = exactly 30.00 h; courseWorkload comment updated.

**Canon:** cap/04 model card rebuilt on canon (Sector 7-G / 28,800 /
33-second windows / real 11-dim features; write-model-card fixture
matched); oe/03 pruning comment corrected to the executed 4/4 output;
tl/05 spoilers stripped from code comments + epilogue retuned to
dread-confirmation; ARIA rule counts reconciled (14,202 classification vs
4,096 parsing, one clause); the 5-class retrain dramatized in oe/02;
"four months" → "ten weeks"; the three clocks (73 s / 47 min / 72 h)
named in rn/05; sp/04 features moved to 8 FIXED bins (bins 13-20 at 4 Hz
resolution, sixth bin holds 73.4 Hz, ad/03's fft_5 labeling now
possible; fft-features exercise reframed as peak-finding); ad/05
detector-1 z-scores `signal[0]` with baseline semantics stated; br/04
soak replay lights the labeled windows on schedule before the one
unlabeled flag; br/01 notebook retcon → engineering-rig framing; rn/03
moved to the RNN's own 80-step window everywhere (lesson, hints, GRU,
build-lstm exercise) AND its noise-demo convergence lie replaced with an
honest shape-drill framing (same class as tl/04's HIGH, caught during the
fix); oe/02 accuracy ledger corrected (78 → 87 attribution).

**Currency:** WebGPU added to br/02 backends (registration + feature-gated
setBackend) and br/05's comparison table; both br benchmarks now read
results back inside the timed region with the enqueue-vs-execution
explanation; `@xenova/transformers` → `@huggingface/transformers` with a
rename note; llm/01 client rewritten to the messages API (system + user
roles), consistent with its own solution hint.

**Story:** nn/02 opens on Nazari demanding a yes/no (was ARIA reciting
syllabus); ad/01 opens on the three-alerts-this-shift beat (was the
finish-each-other's-sentences trailer); tl/04 Demir now has a want
(learning to trust automation); the untrained-0.998 miracle is finally
acknowledged on-page in cap/05's body ("Some instruments point before
anyone builds them") without touching the protected epilogue; the finale
DispatchTease moved AFTER the epilogue and cites the 73.4-second pulse
(right unit).

**Funnel:** fast.ai row corrected (free HF Spaces/Gradio, no "paid
fast.ai"); bridge count single-sourced as `THEME_CONTENT.lessonBridges`
(=55, corpus-pinned by the bridge-breaks gate) across FAQ, /learn, and
onboarding; /compare dateModified bumped + visible "prices checked
2026-07-14" line; "Priority support" removed from the All-5 tier (no
mechanism exists); paywall Free column tells the truth ("5 of 56",
"Module 1's 5"); GitHub connect nudge shipped: `github_not_connected`
on commit-on-pass now dispatches a once-per-browser toast
(GithubNudgeToast in layout, localStorage-guarded at the dispatch site,
gated by a new github-commit test).

Battery: velite clean · typecheck 11/11 · vitest 1065/0 failed (133
files) · lint 0 errors · grader 84/84 --starters · e2e
themes+pricing+landing 40/40.

**Tier-2 verification round (2026-07-14, deep re-audit of the fixes):**
Seven lazy-solution attacks EXECUTED against the hardened graders, all
killed: llm-client bare `JSON.parse` (dies on the missing-field test),
prompt-template hardcoded string (dies on the second-input test),
build-lstm without `compile()` (dies on the loss/optimizer assert), and
launch-rehearsal's hardcoded-verdict / drift-ignored / tidy-less variants
(die on confidences / drift-gate / leak tests respectively; positive
control = the real grader's 84/84). Canon sweeps: rn/02's failed RNN run
confirmed to be 80-step windows, so rn/03's LSTM comparison is now
genuinely apples-to-apples; zero leftover 50-step canon (rn/04's "50" is
a hypothetical quiz); sp/04's bin arithmetic verified exactly (bins as
[4k, 4k+4): bin 18 = [72,76) holds 73.4 Hz and is the sixth of the eight
= ad/03's fft_5, the two lessons now agree to the bin); the 11-feature
vector (3 raw + 8 fixed bins) coheres across ad/02/03/05; months sweep
clean; tl/05's spoilers gone and the epilogue's dread-confirmation in.
One sharpening applied: nn/02's ARIA clause (parsing rules "hand it over
and hold no opinion", they do see the reading during parse). One real
find: the e2e expect ceiling, a cold dev-server compile of the lesson
route MEASURED at 14.96s vs the 15s ceiling, making fresh-server runs a
coin flip; raised to 30s with the measurement in the comment, landing
spec then 10/10 on a cold server. Battery after: velite · tc 11/11 ·
vitest 1065/0 · grader 84/84 · e2e 41/41 (exit 0) · PROD BUILD (119
static pages). One residual: a single cold-start e2e flake appeared once
on a fresh server even post-fix and vanished warm, environmental
dev-mode class, tracked, not a content/code regression.

Original Tier-2 finding list preserved below for the record:

### Run #3 open items (Tier 2, verified findings): ALL CLOSED 2026-07-14

Graders: llm-client passes `JSON.parse(await apiCall(prompt))` (validation
untested); prompt-template passes a hardcoded string (no second-input
probe); rn build-rnn/build-lstm/predict-next never assert model.compile
(copy build-autoencoder's `model.loss`/`model.optimizer` asserts); capstone
needs one multi-stage synthesis exercise.
Canon: cap/04 model card (Kepler-442 (2024)/50,000/USS vs Sector 7-G/
28,800); oe/03 "5 of 8 remain" comment (real output: 4/4); tl/05 comment
names 7741 pre-reveal; ARIA rule count 4,096 vs 14,202; binary→5-class
off-page; mission clock 47d vs "four months"; rn timescales (73s/72h/47min)
unreconciled; sp/04 top-K-sorted features vs ad/03 "fft_5 = 73.4 Hz bin";
ad/05 detector-1 z-scores max over 11-dim vector; br/04 one-amber-flag
soak; br/01 "trained in a notebook" retcon; rn LSTM 50-step vs RNN 80-step
comparison; oe/02 "87 the re-annotation left it at" (canon: 78→87).
Currency: WebGPU missing from br/02 backends + br/05 table (oe/05 has it, backport); `@xenova/transformers` → `@huggingface/transformers`; llm/01
legacy completions API; br/02+br/05 benchmarks time enqueue not execution
(`await result.data()` in the timed region).
Story: nn/02 ARIA-as-syllabus opener; ad/01 trailer beat; tl/04 Demir
recitation; untrained-0.998 needs one ARIA finale acknowledgment; finale
DispatchTease before the Epilogue with wrong unit.
Funnel: /compare "deploy via paid fast.ai" (wrong, free HF Spaces);
bridge-count drift (50+/51/55); stale dateModified + frozen competitor
prices; "Priority support" has no mechanism; GitHub connect nudge missing
in-lesson; paywall Free column says ✗ where free tier includes 5 lessons.

### Run #3 Tier 3 + strategic moves EXECUTED (2026-07-14): all closed

Polish: ats/02 hotspots moved in-range at the 73-step spacing (4/77,
including the interpret block the first pass would have missed) and its
attention scorer hoisted to module state (a fresh dense per call scored
with random weights, same can't-produce-its-output class as tl/04,
found while editing); ats/01 gained the hybrid-keeps-sequential-cost
sentence; cap/03 scene time → "Relay minus five days"; foundations/04
crash now credible (raw capture blocks: 256 Hz × 64 ch × 33 s ≈ 2 MB per
reading, ~40 GB before the crash); br/01's 180 ms round-trips explicitly
interdeck fiber; `avgFreq` renamed `zeroCrossings` with a
what-it-actually-is comment; spectrogram |X|² vs |X| convention noted in
the drawer; module 8's copy-pasted 30-minute labels re-measured to
honest per-lesson values (16/12/13/16/14), workload drops to 1,721 min
and courseWorkload is now **PT29H** (honesty over the round number);
oe/04's LRU set() refreshes recency and no longer evicts a stranger on
re-set; llm/05 confidence reports confidence in the verdict (1 − p for
noise); bits→nats base-switch sentence added before the entropy
exercise; deep-scan-eval relabeled beginner; the Demir-corrected
skeleton broken in llm/03 (the checker catches a number Nazari signed
off by hand; she initials the correction without comment). Graders:
relu-activation, add-tensors, mse-loss rewritten as functions with
second-input probes (hardcoded outputs die); grader 84/84 --starters.

Strategic: **CommitTrail** component ships on the landing "What You'll
Build" cell and the paywall, a git-log panel generated from the REAL
module-1 exercise corpus in the EXACT commit format the push pipeline
writes, with an on-panel honesty line (no fabricated activity). The
paywall's social-proof TODO replaced by an **artifact-proof section**
that says outright there are no testimonials yet and shows the
verifiable evidence instead (commit trail + public certificate route);
the restore-when-3-real-quotes note kept.

Battery: velite · typecheck 11/11 · vitest 1065/0 (133 files) · lint 0
errors · grader 84/84 · e2e landing+themes+pricing 40/40 exit 0 · prod
build 119 pages. **Every item from run #3 (Tiers 1-3 + strategic) is now
closed.**

**Tier-3 verification round (2026-07-14, deep re-audit of the fixes):**
Everything executable was executed. The hoisted attention scorer proven
consistent across calls on the vendored TFJS, and the old
fresh-dense-per-call pattern proven inconsistent (the bug was real). The
LRU set() semantics executed: re-setting an existing key keeps the other
entries and refreshes recency; overflow evicts the true LRU. The f/04
crash arithmetic executed: 2.16 MB/reading, 41.5 GB at reading 19,204 =
exactly two-thirds through, matching the prose. Three hardcoded-output
attacks run against the rewritten graders (relu fixed tensor, add-tensors
fixed pair, mse scalar 0.15): all killed by the second-input probes;
grader control 84/84. Coupling check: oe/04's inference-cache exercise is
a quantized-hash cache with no eviction contract, no drift with the
lesson's LRU fix. Sweeps clean: zero leftover step-85/12 references,
avgFreq gone corpus-wide, capstone scene times ordered coherently
("Merge request 47" → "Relay minus five days" → "Deployment"),
CommitTrail counts verified against the corpus (63 exercises, 5
foundations, compact caption +60), no stale ~30h/62-exercise lines on any
live surface, PT29H in place. New permanent gate: page.test.tsx asserts
CommitTrail renders real module-1 commits in the pipeline's exact format
(format drift on either side surfaces there). Battery: typecheck 11/11 ·
vitest 1066/0 (133 files) · grader 84/84 · prod build 119 pages (prior
step) · e2e 40/40 exit 0 (prior step, unchanged surfaces).

### Run #3 open items (Tier 3): ALL CLOSED 2026-07-14

Attention hotspots 12/85 out of 80-step range (ats/01+02); capstone/03
stale scene time; foundations/04 crash math (~7 MB can't RangeError);
br/01 light-minutes vs 180 ms; hardcodable fixed-input exercises
(relu-activation, add-tensors, mse-loss); deep-scan-eval `advanced` label;
`avgFreq` = zero-crossings; spectrogram |X|² vs |X|; module-8 uniform
30-min labels; oe/04 LRU set() no recency refresh; llm/05 noise-class
confidence; entropy bits-vs-nats friction; Demir-corrected skeleton ×5
(make one correction wrong). Strategic: GitHub commit trail on landing +
in-lesson connect nudge; verifiable social proof (beta quotes + public
certificate links; paywall social-proof block is still a TODO).

Rerun of the original launch-quality analysis after P0 (trust), P1 (exercise
rigor), P2 (structure variety) and seven adversarial audit rounds. Method:
three independent read-only evaluators (learner simulation over 34 full
lessons + 32 exercise YAMLs; dramatic audit of all 56 openings/epilogues;
consumer-protection audit of every marketing claim vs code), plus mechanical
re-measurement. Full agent reports in the session transcript; this file is
the synthesis and the ranked plan.

## Where the ten original dimensions stand

| Dimension | Verdict |
| --- | --- |
| Script sense | STRONG. Analogy-repair habit, no character knows ML early, all checked numbers correct. Two localized breaks (rn/05 forecast precision, sp/05 epilogue bins). |
| Lesson construction | STRONG. tl/03 cited as model scaffolding; recaps match bodies. |
| Value per lesson | STRONG with two soft pockets: nn graders too loose, llm-integration exercises trivial for module 9. |
| Clarity | STRONG. One HIGH defect: tl/05's random-tensor "test set" with fabricated printed outputs, in the honesty lesson. |
| Message delivery | STRONG except tl/05 (vehicle undercuts message). |
| Worth the money | YES (auditor verdict): every load-bearing claim verifiably true in code; ~15–25 honest hours at $59 vs $200+ competitors. Edge-copy staleness only. |
| Progression / story causality | GOOD not great: 340 MB model appears with no on-page origin; the crash (dark moment) happens off-page; M7→M8 hinge is pure syllabus. |
| Lesson/theme connection | STRONG threads (7741, ticker, ARIA, 73.4 Hz) with named drop points (7741 absent from final 20 lessons; ticker's zero-hour question never answered; ARIA's self-audit request never runs). |
| Storytelling effectiveness | A-grade scene craft and epilogue engine; B+ macro-arc. |
| Dramatic arc | Real midpoint (rn/05) and dark moment, but climax re-announces module 7's discovery; sags at M4 and M8. |
| Promise vs delivery | Over-delivers overall. Two purchase-moment staleness bugs on /paywall; hours numbers inconsistent (22h JSON-LD vs 28.8h frontmatter sum vs ~15–25h honest); "60fps" unbenchmarked; capstone "app you ship" ~80% true. |

Per-module learner grades: anomaly-detection A+ · foundations, capstone A ·
training-loop, browser-runtimes, signal-processing, recurrent-networks,
optimization-edge A- · neural-networks, advanced-time-series,
llm-integration B+.

Fresh-eyes cross-check of prior rounds: every previously-fixed P0 finding
(first-neuron 0.26, tf.quantize falsehood, Nyquist conflict, gameable
compute-fft, quiz promises) was independently confirmed ABSENT. The
countdown motif was verified monotonic across five modules by an evaluator
who did not know it had ever been audited. P0/P1/P2 are holding.

## The ranked list

### Tier 1: trust and purchase-moment fixes, ✅ ALL EXECUTED 2026-07-13

All eight items below shipped same day. Details of what changed: tl/05 got
a labeled 8-row held-out fixture (random tensors replaced; outputs
attributed to the crew's run, 94.0% canon, learner told theirs will
differ); ats/01 now wires the taught `simpleAttention` over an LSTM
encoder via ops (honest note that tf.layers has no attention layer;
average-pooling mislabel deleted); /paywall dropped the untrue "Priority
email support" row (test updated to assert its absence) and the hero now
says signal processing, not transfer learning; JSON-LD workload PT22H →
PT29H derived from the 1,730-min frontmatter sum; sp/05 epilogue dropped
its fabricated bin digits; br/04 teaches the data()/dataSync() tradeoff
(incl. the tidy-can't-be-async split) before the recall quizzes it;
landing "60fps" → "real-time"; ad/05 sequence-not-ratios, cap/05
dominant-strategy sentence rewritten, oe/02 256-levels + spread-footgun
comment. Battery after: velite 0 · typecheck 11/11 · vitest 1036 ·
lint 15/15 · grader 80/80 · e2e 4/4 serial.

1. **tl/05 evaluation code block** (`training-loop/05:58-81`): "test data"
   is `tf.randomNormal`/`randomUniform` with fabricated printed outputs
   (87.3/12.1/51.8) in the lesson that defines honesty for the course.
   Replace with a small deterministic held-out fixture; make outputs
   reproducible or explicitly illustrative. Wire sample 7741's 51.8% to the
   real fixture. [HIGH, verified in file]
2. **ats/01 fake attention** (`advanced-time-series/01:113-125`):
   `globalAveragePooling1d()` commented "simple attention", uniform fixed
   weighting, the thing attention is defined against. Wire the taught
   `simpleAttention` in, or relabel honestly + say why (tf.layers has no
   built-in attention). [HIGH, verified in file]
3. **/paywall page, shown at the moment of purchase**: "Priority email
   support" contradicts pricing tiers (All-5 only, unpurchasable); "transfer
   learning" is Neon Protocol's topic, not Deep Orbit's.
   (`paywall/page.tsx:43-47,98`) [MED-HIGH]
4. **Hours reconciliation**: JSON-LD `PT22H` vs 1,730 min frontmatter sum
   (lessons 1,061 + exercise YAMLs ≈ 670) vs ~15–25 h honest. Derive ONE
   number from the frontmatter sums and use it everywhere.
5. **sp/05 epilogue numbers** contradict its own body (bins 9/11 "drop to
   0.3" vs body's ≈5.6/27.0). Recompute one side.
6. **br/04 RecallPrompt** quizzes `data()` vs `dataSync()`, never taught in
   body. Teach the tradeoff in one paragraph or swap the prompt.
7. **"60fps via WebGL"** (`page.tsx:65`): benchmark or soften to
   "real-time".
8. Wording nits: ad/05 "ratios" → sequence (line 174); capstone BossBeat
   "dominant strategy" mislabel; oe/02 "255 levels"; `Math.min(...weights)`
   stack-overflow footgun.

### Tier 2: the highest-leverage content upgrades, ✅ ALL EXECUTED 2026-07-13

All seven items below shipped same day. What changed:

- **340 MB origin + on-page crash (item 9):** llm/05's epilogue now ends on
  the bundle audit (crew models under a megabyte; the pretrained language
  component and its tables are the 340; "filed under later" / dashboard has
  512), Chekhov's gun lit one lesson before it fires. oe/01 now opens with
  ARIA's reboot-watchdog replay of the crash at quarter speed
  (00:02:47.0 window flag → 00:02:47.4 load begins → 00:02:49.1 memory
  touches zero, render loop dies mid-frame), tagged `flashback`, and the
  profiling section opens on the audit as exhibit one. The 673-vs-85M seam
  is now explained BY the story instead of felt through it.
- **Finale reveals (item 10):** the final classification output adds an
  Interval Extrapolation block, the three curves that "disagree on the
  date" in ats/05 converge on deployment data: zero-crossing eleven days, answering Nazari's ats/03 question; plus a full-pipeline archive
  re-score: sample 7741, 51.8% at module 3, 99.9% tonight. A closing prose
  paragraph names both debts paid. cap/05's protected epilogue untouched.
- **M7→M8 hinge (item 11):** ats/01 now cold-opens on the first early
  arrival (predicted 0134:55, observed 0131:27, 208 s early; precursor
  ripple at window position 5 diluted to nothing by step 80), attention
  becomes the tool the miss forces, not a lecture. Farah's rewritten line
  keeps the step-5-and-72 promise the lesson pays off later.
- **BossBeats (item 12):** two promoted from prose with full
  4-option (cooperate/defect/random/dominant) structures, ad/01's
  "train on 7741 or pull it" (dominant = exclude AND promote to a named
  eval case, which is what makes the ad/05 replay mean something) and
  llm/04's standing-order "cut / ship flagged / regenerate / self-assess"
  (dominant = Farah's canon call). Boss-beat lessons: 1 → 3, and the
  cap/05 beat is now a payoff, not a debut.
- **Exercise rigor (items 13–14):** implement-neuron is now a function
  graded on three input sets (hardcoded 0.4 dies); build-layer asserts
  units/activations/countParams 225; simple-network asserts config, loss,
  and 833 params (relabeled advanced→intermediate); the two transcription
  exercises are gone, sp gets dominantFrequency() (real rfft, four
  signals across three sample rates, all machine-verified: 5/12/5/10 Hz),
  rn gets makeWindows() with stride + prediction labels + drop-the-last
  edge case; llm's trivial retriever became the Claim Checker from the
  module's own epilogue (verifyClaims: extraction + 0.05 tolerance +
  the canonical fabricated-17 case). All 80 pass the grader with the
  starter-must-fail invariant AND the shipped-runtime corpus.
- **Capstone framing (item 15):** landing now says "assembled and
  deploy-drilled every component… with your solutions committed to your
  GitHub"; compare row reworded to match. The expectation now matches the
  artifact the buyer actually walks away with.

Post-Tier-2 distribution: patterns 12 non-standard (bcf 4 / flashback 3 /
peer_review 3 / discovery 2), openers 37 dialogue / 19 prose, boss-beat
lessons 3. Battery all exit 0: velite · typecheck 11/11 · vitest 1036 ·
lint 15/15 · grader `--starters` 80/80 · corpus 80/80 · e2e 5/5 serial.
(One velite enum catch during the work: `mlContent: tf` is not a legal
value, the gate caught it before anything shipped.)

9. **Give the 340 MB model an on-page origin + put the crash on-page.** The
   course's one irreversible event is caused by an object the story never
   built (673 params → "85 million weights" with zero on-page growth). One
   scene at llm/05's end (ensemble + pretrained components balloon the
   bundle) + restructure oe/01's open as a LIVED broken_code_first, not a
   recap. Fixes the biggest narrative seam AND the known scale wobble.
10. **Make the finale reveal something module 7 didn't.** The final
    classification re-prints M7's findings. Latent in canon: Nazari's
    unanswered "when does the interval hit zero?" (ats/03), let the final
    run date the arrival, and give sample 7741 one callback in the last 20
    lessons ("the first reading it ever flagged, now 0.999").
11. **Rebuild the M7→M8 hinge** (worst cold open in the course, right after
    the season's biggest cliffhanger): open ats/01 on a pulse arriving
    early on an instrument log; attention becomes the tool the early
    arrival forces.
12. **Two more BossBeats from scenes already written as prose**: ad/01
    (pull 7741 from the training set or leave it) and llm/04 (cut the
    Hypotheses section with 22 minutes to the window). Costs already
    dramatized; makes cap/05's beat a payoff instead of a debut.
13. **Close the exercise-rigor gap at both ends**: harden the three
    neural-networks graders (assert units/activations/loss; parameterize
    implement-neuron, currently passable hardcoded) and replace one
    trivial llm exercise with the numeric-claim checker the module's own
    epilogue describes (compare every number in a generated answer against
    retrieved rows).
14. **Replace the two transcription exercises** (sp time-vs-frequency, rn
    create-sequences: the solution appears verbatim in the lesson body).
15. **Capstone expectation gap**: add a ship-it scaffold (GitHub Pages
    template repo wired to the learner's exercise commits) OR reword
    landing/compare to "assemble and deploy-drill every component."
    Auditor rated this the largest refund-risk expectation gap.

### Tier 3: polish and conversion, ✅ ALL EXECUTED 2026-07-13

What changed: the 21 ungated extras lessons are now a FEATURE, advertised
on the pricing free-tier card ("21 bonus deep-dive lessons"); stale counts
fixed (learn page 51→55 analogies; launch-scope doc 55/~65→56/59). nn/01
cold-opens on the calibration bench (rules name the tones perfectly; the
stream is neither) and gains a "Reading the Weights" section (sign =
direction, magnitude = vote loudness, honest "hand-picked, training will
overwrite" framing); nn/02 gains "When Activations Die" (dead ReLU +
sigmoid saturation with hand-verified 0.9933/0.0066 values, foreshadowing
the module-6 flatline). cap/01 opens on the 38.4-second ticker before
Mirza speaks. Three threads closed: ARIA's priority-three self-audit
finally runs in oe/04's epilogue ("I wanted to know. Now I know."),
Farah's 2.4-points sweep reports back in the same beat (edge cases and
long-tail noise, nothing pulse-adjacent, the trade stands), and Nazari
reads her ledger out loud and wipes the board in cap/05 (9 h + 3 h +
40 min, one credit line). rn/05 gains the units-honesty paragraph in the
BODY (47 demo steps vs the bridge's interval-series forecast: 47 min ≈ 38
steps at 73-second spacing, the protected epilogue untouched). Inbox nav
links commented out (desktop + mobile) until DISPATCH has a server-side
producer; route stays live, comments say exactly when to restore.
Post-Tier-3 distribution: 35 dialogue / 21 prose openers. Battery all 0:
velite · typecheck 11/11 · vitest 1036 · lint 15/15 · grader 80/80 ·
e2e 5/5 serial.

16. Extras gating decision: 21 lessons / ~26k words ungated, if
    intentional, advertise on the free tier card (conversion win); if not,
    it's paid-grade content leaking.
17. Sell harder what's true: real in-tab neural net, real TFJS grading with
    anti-cheat, 55 bridges (marketed as "50+"/stale "51"), GitHub push,
    honest pricing. Update the 51 count.
18. Weak cold opens: nn/01 (no scene, definition in first breath) and
    cap/01 (monorepo simile; the 38.4s ticker belongs in the open).
19. neural-networks module is thinnest (~586 words/lesson vs 914 course
    median) exactly where beginners need generosity, expand nn/01-02.
20. Thread closures, one paragraph each: ARIA's self-audit request (ad/03,
    "waits forever") pays off in M8-M10; Nazari's ledger gets a final
    read-out in cap/05; Farah's oe/03 overnight-run result reported.
21. DISPATCH inbox: no server-side writer calls `dispatch_milestone`, the
    inbox ships empty. Wire milestone writes post-launch or hide the inbox
    nav until it has a producer.
22. rn/05 forecast overreach: story asserts 3-second precision at 47
    minutes right after the lesson teaches error compounding ("47 steps" ≠
    47 minutes at 1 Hz). One-sentence hedge in the epilogue or fix units.

### Protect list (do not touch in any future pass)

The five epilogues: rn/05 (47:03 "ours or theirs"), ad/05 (0.9987 overlay),
br/05 (ARIA's honesty benchmark), nn/05 (untrained 0.998 twice), cap/05
(ARIA's final note + viewport). Plus: the analogy-repair habit, the
94→78→87 re-annotation bridge, the ln(2) glass wall, the ticker spine, the
incident exercises, ARIA's entire line inventory.

## Independent re-run (same day, after Tiers 1–3)

Three NEW evaluators, blind to all history, same lenses. Movement:
learner grades rose across the board (nn B+→A, ats B+→A+, tl A-→A,
llm B+→A-; ad stays A+); dramatic arc **B+→A-** ("the arc holds,
plainly", midpoint, crash flashback, ledger close, zero-hour receipt
all independently verified as paid); money verdict: fair at $59 for the
learning. Every Tier-1/2/3 change they encountered read as native.

## Accepted-v1 quirks cleared (2026-07-13, post-round-3 sweep)

Every "documented as accepted v1" item from the All-P round, plus the
known-unfixed leftovers from other sessions, was worked to closure:

- **GitHub artifact overwrite → per-exercise paths.** `commitLessonArtifact`
  takes `exerciseSlug` (unique across the 62-exercise corpus); commit-on-pass
  sends the exercise's slug, and retroactive push now groups the latest
  passing attempt PER EXERCISE (`exercise_attempts.exercise_slug` was always
  there) instead of per lesson. Gate: route test proving a two-exercise
  lesson lands two files.
- **Guest 401 toast.** `apiFetch` only dispatches `tc:session-expired` when
  a session was actually attached; guests' fire-and-forget 401s stay silent.
  New `api-fetch.test.ts` gates both directions.
- **Bundle-total simplification.** The two independent `55` literals
  (pricing math, coming-soon stubs) collapsed into
  `THEME_CONTENT.comingSoonLessonsPerTheme`; the Deep-Orbit-in-every-bundle
  assumption is documented at the constant.
- **DISPATCH inbox producer built; nav link restored.** The missing writer
  from migration 029's design: `apps/api/src/lib/dispatch.ts` fires
  module-cleared / board-clear milestones (subject-dedup idempotent),
  reached via auth-gated `POST /api/dispatch/check` which
  `markLessonCompleted` calls fire-and-forget on genuine completion
  transitions (the web writes progress straight to Supabase, so no API
  route ever saw completions). Module sizes come from shared
  `getModuleLessonCount()`, pinned to the real MDX corpus by a new
  content gate (`module-counts.test.ts`); producer behavior gated by 5
  unit tests (exact-count fire, browser-runtimes=6 override, dedup, theme
  clear). Migration 036's lockdown is exactly the right boundary for it
  (service-role only); its stale "zero callers" note updated.
- **AmbientBackground reduced-motion rAF leak.** Worse than reported: the
  "static frame" path called the self-scheduling draw, so the full loop ran
  under `prefers-reduced-motion` AND leaked on unmount; resize in static
  mode also blanked the canvas. Split render-one-frame from the scheduling
  wrapper, repaint on resize, react to preference changes, cancel in every
  cleanup path.
- **Retention emails** drafted end-to-end: `docs/email-retention-sequences.md`
  (3 Kit automations, full copy, purchased-tag gap named). Kit dashboard
  setup remains operator work.
- **Beat dormancy** gets a real plan instead of 32 blind beats:
  `docs/v2-beat-expansion-plan.md` (6 ranked candidates, one per dormant
  module with a genuine decision, P3-earned quality gates, post-launch
  data gate). Video scenes / audio / team tier deferrals re-verified as
  already documented in dev-plan; new docs linked from Related Documents.

Battery: typecheck 11/11 · vitest 1064 (133 files; +dispatch, +api-fetch,
+module-counts gates) · lint 15/15 · e2e themes+pricing+landing+
end-of-lesson 41/41 serial on :3131. No content YAML touched, so grader
83/83 stands from round 3.

## P4 round 3 (2026-07-13): first independent P4 reviewer + execution-level attacks

Round 3 gave P4 what it never had: a fresh-eyes agent auditing the domain
end-to-end (incident-exercise set as a set, email stack by EXECUTION, every
value-framing claim recomputed), plus main-line checks on the surfaces the
agent wasn't covering. Every finding was verified in-file before acceptance.

**Two HIGHs, both real, both fixed:**

1. **Every digest "Teaches:" lesson link 404'd.** `newsletter.ts` built
   `/learn/{theme}/{module}/{slug}`; lessons live at `/themes/...` and
   /learn is a single marketing page (no rewrites, no redirects). The core
   value proposition of the email was a dead link for every recipient.
   Fixed both renderers + regression test asserting the /themes URL in text
   and HTML and banning `/learn/` (`__tests__/newsletter.test.ts`).
2. **`incident-baseline-drift` graded `Math.max` as a 95th percentile.**
   Executed: max-instead-of-p95 passed all 3 tests (every fixture's max sat
   at/near the true p95); `driftMagnitude` and the `no-action` branch were
   never asserted. Added a 99-small+one-spike discriminator fixture (max
   attack now fails all three asserted fields, execution-verified) and a
   dead-band test pinning driftMagnitude 0.7 → no-action.

**MEDs fixed:** `diagnoseStorm`'s `rate`/`action` were pure decoration to
the grader, `action` is now a graded enum (cause → remedy mapping in the
instructions), `rate` asserted to 1 decimal. `incident-missed-anomaly` now
asserts `requiresRetrain: false` (a `true` constant used to pass), and its
premise ("memorized anomaly patterns during training") contradicted module
canon (training set built "minus every flagged window"), reworded to
memorized-sensor-quirks overfitting. `incident-false-alarm-storm`'s
"~10/hour baseline" contradicted the lesson's fourteen-alerts-a-week alert
economy, and the host lesson's framing ("clearly noise, not a real
outbreak") prejudged the exact input its own default branch escalates, both rewritten. The incident set's two batch fingerprints harmonized: the
anomaly trio's `## On-Call Scenario` headings became inline pager-register
paragraphs (distinct times/voices), full-dummy-object starters became
`return null` (no more return-shape leak), difficulty labels re-assessed
individually (baseline-drift + missed-anomaly → intermediate), "Build"
verb monoculture varied. **GET /unsubscribe wrote on render**: corporate
scanner prefetch = silent unsubscribes; now a confirm-button server action
(GET never writes), the false "already used" copy dropped, and the dead
third `unsubscribeByToken` in the api lib deleted (3 drifted impls → 2
identical). **"each labeled where it breaks" was false for 7/55 bridges**: wrote the 7 missing `breaks:` (ats/01, ad/05, br/02, nn/02, nn/03, oe/02,
tl/04) and added `packages/content/__tests__/bridge-breaks.test.ts`, a gate
that replays bridge-callout's own resolution logic over all 55. **Minute
labels understated 2-3x** on the six incident lessons ("14 min · 2
exercises" where exercises alone are 30 min), and lesson JSON-LD
`timeRequired` disagreed with theme `courseWorkload` on accounting basis, new `getLessonTotalMinutes()` in packages/content is now the single basis
for the lesson header, module map, dashboard resume card, lesson JSON-LD,
and /pricing preview (which was refactored onto it).

**LOWs fixed:** issue-email `screenshotUrl` escaped (its own comment said
"escape reporter-controlled fields" while leaving one raw), `escapeHtml`
copies un-drifted (`'` rule), `javascript:` pageUrl no longer earns an
`<a>`, "Read on the web" targets the week's actual blog post when drafted,
dead `summary` select dropped. Verified clean, no action: RFC 8058
one-click plumbing (built this round after the header/405 find), opt-out
join null-safety, digest escaping (fixture-executed), PT30H vs recomputed
1,775 min, pricing/bundle/free-tier/extras/capstone claims, /api/email
mount vs all four web callers.

Battery: velite 0 errors · typecheck 11/11 · vitest 1051 (129 files, +3
new: bridge-breaks gate, newsletter link test, minute-basis tests) · lint
15/15 · grader 83/83 with --starters · e2e themes+pricing+exercise-run
31/31 serial on :3131.

## P4 adversarial round (2026-07-13, post-closure)

Knifed the P4 work itself plus never-probed corners of the domain.
Found and fixed: **the hours ledger moved again**: the three incident
exercises added 36 minutes, so the frontmatter sum is now 1,775 min =
29.6 h and PT29H under-claimed; JSON-LD is now PT30H with a
recompute-me note in the comment. **The opt-out join got its
regression test** (`apps/api/src/lib/__tests__/newsletter.test.ts`,
first test coverage the newsletter has ever had): case-insensitive
exclusion + the nobody-opted-out path, with a thenable per-table mock.
Verified clean: /unsubscribe page exists and flips the token row (the
digest's List-Unsubscribe links resolve); email_alerts is persisted +
Kit-reconciled (checklist gains one line: confirm a Kit automation
actually consumes that tag, else hide the toggle); newsletter's digest
renderer already HTML-escapes (the issue email was the outlier);
incident pager numbers re-checked against canon (base 47 tensors from
br/04, the 30-second TTL is oe/04's own epilogue number, 02:40 fits the
overnight-alert timeline); subject lines are plain-text context so the
escaping boundary is correct. Battery: velite 0 · typecheck 11/11 ·
vitest 1048 (129 files) · lint 15/15 · grader 83/83 · e2e 4/4.

## P4 CLOSED (2026-07-13): the last two items of the original plan

**#30 Kit lifecycle email audit (the never-audited surface).** In-repo
side audited end-to-end: all four lifecycle tags (signed_up, onboarded,
first_lesson, capstone) have live web callers and a graceful
env-unset skip path; the weekly digest sender carries proper
List-Unsubscribe/One-Click headers and per-recipient tokens. Two real
findings, both fixed: (1) **cross-stream opt-out miss**: the Settings
weekly-digest toggle writes profiles + Kit, but the Resend digest reads
the WAITLIST table, so a waitlist-joiner who signed up and toggled off
kept receiving it; the sender now excludes any waitlist email whose
profile has weekly_digest=false (profiles.email verified present:
migrations 001 + 022). (2) **HTML injection into the support inbox**: issue-notification emails interpolated reporter-controlled
description/pageUrl raw into HTML; now entity-escaped.
**Kit-dashboard copy is external and needs a human pass, operator
checklist:** for each automation tied to the four tags: sender name
matches "Tensorcraft"; no lesson/hour/price counts contradicting the
site (56 lessons · 59 exercises · $59 · ~29h); links point at
tensorcraft.app routes that exist post-launch-scope (NO /bridges, no
theme pages other than deep-orbit); unsubscribe present; the capstone
email doesn't promise a hosted deployment.

**#26 Incident enrichment.** Deep Orbit had 3 incident exercises, all
parked in anomaly-detection. Added 3 more where operators actually get
paged, each wired after its lesson's main exercise with a pager beat:
`incident-tensor-leak` (br/04, numTensors climbing since the deploy;
endpoint-trend triage, hours-to-budget), `incident-stale-verdict`
(oe/04, a deploy must invalidate every cached verdict; version +
TTL audit), `incident-checker-down` (llm/05, "no unverified number
leaves the ship"; queue triage under a dead checker). Incident coverage:
6 exercises across 4 modules. Grader + shipped-runtime corpus now
**83/83** with the starter-must-fail invariant.

Battery: velite 0 · typecheck 11/11 · vitest 1046 · lint 15/15 ·
grader 83/83 · corpus 83/83 · e2e serial 4/4.

**With this, every item of the original P0–P4 plan is closed.**

## All-P round (2026-07-13, final): cumulative diff review + never-run gates

Method: one adversarial reviewer over the ENTIRE uncommitted delta (it
independently re-ran velite, tsc, and both vitest workspaces, recomputed
every canon number, and attempted cheapest-pass attacks on all six
rewritten graders, none folded), plus first-time verification of two
never-traced paths (BossBeat persistence: migration 030's RPCs use
auth.uid() internally, the safe pattern, NOT the dispatch_milestone
class, and survive 033's drops; commit-on-pass got a contract test),
plus the closing gold-standard gate: fresh prod build + FULL e2e, **89 passed / 0 failed / 19 auth-gated skips across 108**.

**Zero HIGH findings, the first all-layers round where nothing was
mechanically broken.** Three MED claim-drifts, fixed: the learn page's
analogy count (the saga ends: TWO populations exist, 54 registry
entries in bridges.ts vs 55 lessons rendering BridgeCallouts; the learn
page speaks of lessons → 55); ats/01's consequence narrative still sold
"ten times faster… in parallel" about a model the Tier-1 rewrite turned
into an honest hybrid (now: "two weight hotspots, exactly where the
evidence lived"); rn/03's ARIA said "remembers three days" three lines
after the retcon established recognition-not-memory (now "recognizes a
pattern across three days"). LOW polish, all applied: boss-beat comment
no longer overclaims its shuffle verification (two of four beats share
a position; the unit test pins >1 distinct, which is the actual
property); PT29H comment total 1,730→1,739; the dynamic import of
github-commit gained its own .catch; push summary got role="status";
the e2e stance loop covers all four stances; the paywall's GitHub row
now says free tier = "Module 1" (the endpoint is deliberately ungated,
so module-1 pushes work free, the row had drifted below reality); the
vacuous unhandled-rejection test was rewritten to assert what it can
actually observe; one trailing space.

Documented as accepted v1 behavior (not fixed): two-exercise lessons
overwrite the lesson artifact with the last passed exercise (server
path design; 3 lessons affected; post-launch item); the guest
session-toast on fire-and-forget 401s (pre-existing UX class); bundle
lesson totals assume Deep Orbit is in every bundle (true for every
purchasable combination today).

Closing battery, all exit 0: velite · typecheck 11/11 · vitest **1043**
(128 files; +BossBeat, +github-commit contract) · lint 15/15 · grader
`--starters` 80/80 · full prod e2e 89/89 · targeted serial 5/5.

## P3 round 3 (2026-07-13): audited the round-2 fixes themselves

The standing rule (every round's own edits get the next round's
knife) earned its keep at the highest severity yet:

- **The round-2 shuffle was itself a movable answer key.** The LCG's
  short low-bit cycles parked "dominant" at position 2 for ALL FOUR
  shipped beats, verified by executing the hash, not by reading it.
  Replaced with FNV-1a + xorshift mixing (high-bit modulo): the four
  beats now land the strong option at positions 3/1/1/2, and the
  distribution is ~uniform (25/25/25/25%) over 4,000 synthetic ids.
  Lesson recorded: a randomizer is a claim; execute it before shipping.
- **BossBeat now has its first unit tests ever** (4): no stance enum
  text on any button; deterministic per-beat order; the strong option
  provably NOT at one position across the shipped beats (the exact
  regression class that just happened, twice); click records the right
  stance and reveals the right consequence. Plus a new e2e in
  lesson-variety.spec.ts: the free-tier f/05 beat renders on the real
  page with no stance leak, the gate now runs against built output.
- **Cast order-of-appearance bugs from the round-2 renames:** Lin's
  "vision cell again" appeared three modules BEFORE her first incident
  (callback removed; the recurrence reads organically now); Jin held
  two different cells (edge M2 + speech M6), edge returned to Hassan,
  whose #16-C "detour from the edge cell" now has its M2 introduction;
  and Yara, canonically image-latents (#02-T), had been handed the
  audio phantom, reassigned to Jin's speech cell, giving him a tight
  M5/M6 double. Final coherent map: Yara image (M1) · Hassan edge×3 +
  multimodal detour (M2/M8/M10/M11) · Amara language×2 (M3/M9) · Lin
  vision×2 (M4/M7) · Jin speech×2 (M5/M6) · Kira CV tease (finale).

Battery: velite 0 · typecheck 11/11 · vitest 1041 (+4 BossBeat gates) ·
lint 15/15 · grader 80/80 · e2e 4/4 serial incl. the new beat check.

## P3 adversarial audit round (2026-07-13, post-closure): found real holes, all fixed

A fresh-eyes devices auditor graded P3 a B: "prose A-grade, technical
claims survive adversarial checking essentially without a scratch,"
capped by delivery mechanics. Findings and fixes:

- **H1 (component, the big one): BossBeat printed its own answer key**: the stance enum rendered on every button ("Option 4 · dominant") in
  fixed authored order, so one observant learner could game all four
  beats forever. Fixed in boss-beat.tsx: the stance label is no longer
  rendered, and display order is a stable per-beat permutation (hash of
  beatId), so the strong option moves per beat but never between
  visits; recording stays label-based, so nothing downstream changes.
- **M1: `dominant` was costless in 3 of 4 beats.** Each now pays
  on-page: f/05 ("the tag just sits there for ten modules… nobody says
  it is a comfortable one"), ad/01 (smaller training set + a standing
  admission the baselines can't fully be trusted), cap/05 (the canary
  spent thirty seconds of a window that had none to spare; "a third
  door is still a bet; this one was priced right").
- **M2: the finale beat spoke meta game-theory and rewarded an untaught
  technique.** Cooperate/random consequences re-registered in-world
  ("A held door costs exactly what it saves"; "A flipped coin spends
  trust and buys nothing a decision would not have"); the canary
  self-defines in its display AND is now taught in the Deploy-and-
  Verify body (canary vs suite, blast radius vs certainty).
- **M3: eleven DISPATCH intercepts, one curator's voice.** Three
  closers de-templated (Lin's unread retraction memo; Jin's one-line
  postmortem in quotation; Hassan's "the fix was not a fourth model");
  imperative-moral closers now 3 of 11, and two intercepts carry
  quoted/ironic endings instead.
- **M4: six senders violated the style bible's fixed DISPATCH cast.**
  All renamed into canon with deliberate recurrence: Lin's vision cell
  gets a second incident (#07-D, rhyming with #08-A), Jin claims edge
  (#04-B) and speech (#12-A), Dr. Amara the language recall (#05-C),
  Yara the audio phantom (#09-F), Hassan a multimodal detour (#16-C, also renumbered from #14-C to clear the serial collision, L1).
- **M5: two 5+-lesson device dead zones.** Both broken with the
  course's mathiest missing pieces: a Kalman-gain DerivationDrawer in
  ats/04 (minimize posterior variance → K = P/(P+R), endpoint sanity
  checks, "the EMA is this formula frozen") and a magnitude-pruning
  drawer in oe/03 (Taylor expansion, gᵢ≈0 at a minimum, the equal-
  curvature assumption, and why the proxy lied about exactly the 80%
  build's rare signals). Drawers now in 3 modules, 10 lessons; both
  zones under the 5-lesson threshold. The 26-lesson beat dormancy
  (5→32) is accepted: beats are story-anchored, and the free-tier seed
  plus M7/M9/M11 cadence is the arc, not a gap.
- **M6/L3/L4: llm/04 beat leaks + mappings.** The dominant consequence
  no longer pre-tells Farah's epilogue call; the prompt addresses
  "operator" like its siblings; `random` is now genuine indecision, and inherits the fluency-not-truth teaching honestly ("stall long
  enough and the pipeline's default takes over… 0.97 from the author of
  the guess is a statement about fluency, not truth"), which also makes
  the timeout→random mapping fair.
- **L6/L7/L8:** llm/05's bundle audit no longer attributes embeddings
  to the numeric claim checker; the finale DispatchTease timeline reads
  "tonight" instead of sitting an hour ahead of the epilogue it
  precedes; rn/05's demo comment names its one-second-step horizon
  instead of re-teaching the conflation the unit-check paragraph undoes.
- Self-caught during the round's mechanical sweep: one em dash in my
  own ats/01 code comment (banned; fixed), and three of my five new
  intercepts used anonymous "cells" where canon names operators (fixed
  via the M4 renames).
- **Verified clean by the auditor, no action:** all eleven intercept
  mechanisms technically true; RAG honesty note "done right"; 4 of 5
  protected moments intact and the fifth's issue was the beat leak
  (M6), now fixed; no lesson over 2 devices.

Battery after: velite 0 · typecheck 11/11 · vitest 1037 · lint 15/15 ·
grader 80/80 · e2e 4/4 serial. Auditor's own math: these fixes take the
family from B to A-.

**P3 CLOSED (2026-07-13, after the re-run closure).** The three items
still open from the original P0–P4 plan's P3 phase:

- **23 DISPATCH density → DONE.** Five new field intercepts (#04-B
  parameter budgets, #07-D benchmark-where-you-deploy, #09-F the
  phantom-tone window, #12-A split-before-you-window leakage, #14-C
  correlated-ensemble agreement), each lesson-exact, each a different
  failure story from a different cross-theme cell. Coverage is now
  **11/11 modules**, at deliberately uneven lesson positions. The
  DISPATCH *inbox* product surface stays hidden until the milestone
  producer exists (unchanged decision).
- **25 RAG's missing R → DONE.** llm/03's retrieval function now labels
  itself keyword-and-metadata retrieval and names the production
  mechanism: embeddings + cosine top-k, "different machinery, identical
  contract: retrieve → ground → verify."
- **24 signal-processing trim → CLOSED, NO ACTION, by evidence.** The
  original plan proposed trimming/splitting the windowing lesson
  (module avg 1,356 words vs 826–961 typical). Three independent blind
  evaluators later, none flagged sp length; the module's B grade came
  from the (now fixed) FFT block and (now fixed) exercise duplication,
  while sp/05's leakage treatment drew explicit praise. Cutting
  praised material to fix an unobserved problem fails the
  cost/benefit test. Revisit only if learner analytics show sp
  drop-off post-launch.

**ALL re-run findings are now EXECUTED (HIGHs, 6 MEDs, 8 LOWs, 2026-07-13).** The MED/LOW closure batch: rn/03's 72-hour claim restated
as recurrence-recognition ("recognition is cheaper than memory", no
cross-window cell-state myth); oe/02 gained the two-ledgers paragraph
(85M = the whole bundle dominated by the language component; the
accuracy row tracks the classifier, whose 94.2 is five modules of
features past the re-annotation's 87); FAQ #1 + #5 rescoped to
today-vs-in-development (fixes the FAQPage JSON-LD too); the finale
paradox got its witness, one additive ARIA beat ("It cannot have heard
us first… I have no third."), every protected line untouched; sp/01's
exercise is now the pre-FFT "Two Views, One Verdict" (compareViews on
provided magnitude arrays, no rfft before it's taught, no compute-fft
duplication); ad/05's detector-3 compares the LSTM's 3-value forecast
against the raw slice (shape-honest); f/05 gained the free-tier BossBeat
(keep-or-delete 7741, dominant = "a question mark is an instrument", the mechanic now seeds in module 1 and rhymes through M7 and the
finale); a DISPATCH intercept (#05-C, Operator Voss's unread validation
curve) breaks the M2–M6 silence at tl/04; the finale's extrapolation
output declares its nonlinear rate model; Nazari closes the
engineering-chair ledger line during the oe/05 rehearsal; cap/03's
drift code states its z-scored-features assumption; curriculum-preview
minutes now include exercise time (same basis as the PT29H JSON-LD);
bundle lesson totals honor the stubs' 55/theme (111/166/276);
"Same ML syllabus" → "Same ML foundations track". Two of my own test
bugs caught by the battery before shipping: an IEEE-754 boundary case
in the new sp/01 grader and a missing mock export in the pricing test.
Battery: velite 0 · typecheck 11/11 · vitest 1037 · lint 15/15 ·
grader `--starters` 80/80 · corpus 80/80 · e2e 5/5 serial.

**The three HIGHs below were EXECUTED 2026-07-13 (same day):**
GitHub push is now real, `apps/web/lib/github-commit.ts` fires on every
passed exercise from lesson-content's submit handler (best-effort, same
contract as attempt recording), and Settings gained a "Push solved
exercises" button hitting `/api/github/retroactive-push` per launched
theme with a pushed/skipped/failed summary (test: settings suite 19/19,
asserts URL, auth header, body, and summary render). sp/02's block was
rebuilt on machine-verified numbers, `analyzeSignal(anomalousSignal,
256)` with N=512 → 0.5 Hz bins, magnitudes A×N/2 (204.8/153.6/102.4/
51.2), the intruder honestly reads **73.5 / 12.0** with a sub-threshold
shoulder at 73.0 (bin 146: 3.0), leakage named with a pointer to sp/05;
the epilogue now reads 73.5-on-this-grid and pins the true 73.4 via the
overnight four-times-longer window. The 0.998 thread is closed in
tl/05's body right where 51.8 prints: the untrained 0.998/0.997 scores
(canon-checked against nn/05's exact text) stand unexplained, but the
inversion is now witnessed, "training bought honesty about the one
reading the crew cannot label." Battery after: velite 0 · typecheck
11/11 · vitest 1037 · lint 15/15 · grader 80/80 · corpus 80/80 ·
e2e 4/4 serial.

New findings this round (each verified in-file before recording):

- **HIGH, GitHub push is a dead feature.** Sold on pricing, paywall,
  landing, compare, and Settings; backend routes complete
  (`/commit`, `/retroactive-push`, `/push`); **zero frontend call
  sites**: a buyer who connects GitHub gets no commits, ever. Top
  refund risk. Fix: wire commit-on-pass + retroactive button, or strip
  the claim from all five surfaces until it ships.
- **HIGH, sp/02 `deep-scan-fft` expected block is internally
  impossible.** Printed magnitudes need N=128, the framing paragraph
  pins 256 Hz (making 5/23/47 off-bin and `has(freq)` unmatchable), and
  73.4 Hz cannot yield a clean single row under any config; the
  epilogue bakes "magnitude 3.2" into canon. Fix: N=512 @ 256 Hz,
  magnitudes A×256, show the 73/73.5 split honestly (sp/05 already
  teaches why), update the epilogue number.
- **HIGH (narrative), nn/05's untrained-0.998 mystery is the season's
  only dropped thread**, and it silently inverts (untrained: certain;
  trained: can't decide) without anyone noticing. One line in tl/05 or
  ad/01 converts it into a thesis beat.
- MED, rn/03's 72-hour memory claim vs a stateless [50,3] LSTM;
  restate in interval-series steps (the rn/05 move) or show stateful.
- MED, oe module: "85 million weights" + quantization costing
  classifier accuracy sits badly beside oe/01's (round-3) "crew models
  under a megabyte" origin line, and 94.2% is never reconciled with
  sp/04's 87 ledger. Needs one deliberate paragraph deciding what the
  340 MB artifact is and where 94.2 was measured.
- MED, FAQ #1 (and its FAQPage JSON-LD) claims the curriculum "covers
  … CNNs, and transformers" in present tense; no CNN content is
  buyable. Rescope to today-vs-coming.
- MED, finale's causality paradox ("left its source before this ship
  was built") gets no witnessed reaction; one line of light-delay
  arithmetic makes it the season's screenshot moment.
- MED, sp/01's exercise now requires rfft one lesson before the FFT
  is taught and near-duplicates sp/02's compute-fft; ad/05's detector-3
  snippet indexes `predicted[i]` past the LSTM's 3 outputs.
- Bridge-count truth: **54 entries, 49 with `breaks`** (yesterday's 55
  and today's 51 agent counts were both wrong; learn page corrected to
  54, measure counts yourself before writing them). compare's "every
  analogy labeled" is 49/54.
- Assorted LOW: BossBeat runway empty modules 1–6 (seed one in f/05's
  keep-or-delete beat); DISPATCH silent M2–M6 (relocate one intercept);
  interval-shrink second derivative flexes with the calendar;
  engineering-chair Chekhov gun; drift-score scale mixing in cap/03;
  curriculum-preview 17.7h basis vs JSON-LD 29h; bundle math 112 vs
  stubs' 55; "Same ML syllabus" vs "separate specializations" copy.

## Bottom line

P0/P1/P2 are rock solid, independently confirmed by evaluators who did not
know what had been fixed. The product over-delivers on its marketing and is
worth its price today. What separates it from top-tier is no longer
correctness; it is Tier 1's eight small trust dents (one afternoon), and
Tier 2's seven structural investments in the story's spine and the two
weakest exercise pockets (the real P3). Content grades by module say the
ceiling is already visible: anomaly-detection is what every module should
feel like.

---

# Run #6 (2026-07-15): the metadata layer, and gates instead of rounds

Three fresh evaluators on ground no previous round had touched: the
**metadata/summary layer** (frontmatter loglines, RecallPrompts,
LessonRecaps, module.yaml, hint ladders), an **a11y/mobile** pass, and a
**verifier of run #5's Tier-3 fixes**.

## The finding that mattered

Six rounds read lesson *bodies*. Nobody had read the layer that *summarises*
them against them. ~11 defects lived there, and they share one root cause:
**a field was rewritten and its siblings were not.** Epilogues gained failure
per the style bible's stakes rule while the loglines above them still
described an earlier draft's tidy successes; exercises were rewritten while
their hint ladders were not.

The verifier also confirmed the standing meta-finding: of 8 Tier-3 fixes from
run #5, **1 was broken, 4 partial, 2 collateral**. At this polish tier, fix
waves introduce defects at roughly the rate they remove them. That is why
this round shipped gates first.

## Gates shipped (the durable part)

`packages/content/__tests__/metadata-consistency.test.ts` (140 tests):

- **Gate A** - unit-bearing numbers in `consequence.narrative` must appear in
  the body. Caught 45 ms and 80% (phantom baselines that
  `optimization-edge/05` then computed "9x faster" against) and ad/02's 12x.
- **Gate B** - a code-shaped `solution` hint must share vocabulary with its
  exercise's accepted solution. Caught ats/05 and **llm/03, which all three
  agents missed**.
- **Gate C** - module.yaml (description AND per-lesson summaries) may only
  advertise topics the module teaches. Caught the phantom TCN, plus saliency
  maps and frequentist statistics, independently confirming two findings an
  agent had reported unverified.

`packages/ui/src/mdx/tensorcraft-theme.test.ts` (22 tests) and the extended
`e2e/accessibility.spec.ts` (14 tests):

- **Gate D** - axe now audits **all 6 lesson steps**, not just step 0. The old
  suite loaded a fresh URL with empty localStorage, so it only ever saw step
  0, which has no code block. Six rounds read that as "the lesson viewer is
  AA-clean."

### Calibration notes (do not skip if you widen these)

Every gate was tuned against the full 77-lesson corpus to zero false
positives. Three of my own gate drafts were wrong and were caught by testing,
not reading:

1. Gate B v1 flagged 10 lessons, 9 false (generic API hints like
   `const t = tf.tensor([1,2,3])` are legitimate). Fixed by checking only
   code-shaped hints, with word-boundary matching and a JS-builtin stop list.
2. Gate A missed the real "80%" because bare `\b80\b` matched an input shape
   `[80, 11]`. Percentages now require `N%` or `N percent`.
3. Gate A flagged br/06's "12 lines" though the epilogue says "**twelve**
   lines", and `\b1\.4\b` could never match "1.4x" (no boundary between `4`
   and `x`). Fixed with a number-word map and a not-a-longer-number lookahead.

**A gate that fires on correct lessons gets muted within a week.** Re-calibrate
the same way or do not widen them.

### Blindness found in the EXISTING gates

`CONTENT_DIR` in `scripts/audit-structure-variety.mjs` is hardcoded to
`deep-orbit`, so `structure-variety` and `bridge-breaks` have **never covered
`extras/`**. That is why 3 em dashes survived the app-wide sweep there, and
why run #6 was the first to notice extras/math-deep-dive defining
cross-entropy as KL divergence. The new gates walk `{deep-orbit,extras}`,
matching velite's `LAUNCHED_THEME_DIRS`.

## Tier 1 fixed (all verified by execution)

Through the gates:

- `anomaly-detection/02` logline promised 12x; the epilogue's run **fails** at
  1.4x. Rewritten to the scene.
- `optimization-edge/01`: 45 ms and 80% existed nowhere. The body now prints a
  real profile (340.0 MB, 45.0 ms mean, 112.0 ms P95, layer shares), and
  `memorySizeMB` divides by 1e6 rather than 1024^2 (it was printing MiB under
  an MB label: 324.2, not 340). The "80% of the **time**" claim became "80% of
  the **parameters**", which is what `layerBreakdown` actually returns; recap
  and objectives corrected to match.
- `advanced-time-series/05` + `llm-integration/03` hint ladders rewritten. Both
  were stale at all three levels; ats/05's guidance said "simple averaging
  works well" when the grader requires confidence weighting (mean gives 15,
  grader demands 11), and llm/03's ladder described a RAG pipeline when the
  exercise verifies numeric claims.
- `advanced-time-series/module.yaml` no longer sells temporal convolutional
  networks (zero hits theme-wide). ethics/math summaries no longer promise
  saliency maps / frequentist statistics.

Ungated:

- `recurrent-networks/01` RecallPrompt answered "Identically" for two
  differently-ordered readings. **False**: measured 0.509405 vs 0.493912, a
  dense layer holds a weight per input position. Rewritten to distinguish
  order-within-a-vector (matters) from order-within-a-sequence (invisible).
- `training-loop/01` (3 sites): MSE's gradient w.r.t. the prediction at
  ŷ=0.01 is **-1.98, its largest**, not "near zero"; the vanishing is the
  sigmoid's σ'=0.0099. Verified by finite difference. BCE's advantage is
  **2.0x at the decision boundary and 50.5x when confidently wrong**, the
  opposite of what the recap claimed. The drawer's `companionSlug` put the
  correct statement one click from the wrong one.
- `extras/python-bridge/03` body ended in `dense({units: 10})` with no softmax
  under `categoricalCrossentropy`, committing the bug it warns about 20 lines
  later. Measured: loss 7.97 and rows summing to -1.89, vs 2.51 and 1.0000.
- `extras/math-deep-dive/05` recap defined cross-entropy as KL and inverted
  gzip twice. Verified on the lesson's own numbers: H=1.1568, CE=1.6540,
  KL=0.4972, `CE - H == KL` exactly.
- `capstone/01` recap claimed compile-time contract validation; enforcement is
  a runtime `validate()` throw and the stage list is `PipelineStage<any, any>[]`.
- `foundations/03:149` still said "Every few minutes" after run #5 fixed only
  frontmatter line 26 (**a self-inflicted contradiction**).
- `signal-processing/04` frontmatter asserted the two claims the lesson exists
  to refute, in a "Farah smiles" validation beat the style bible kills.
- `llm-integration/04` logline promised Farah approving after correcting three
  claims; she **refuses** and cuts a whole section.

## Contrast bugs Gate D found (never seen in 6 rounds)

- Shiki comment token `#6A7A6A` on `#161616` = **3.96:1**. Every code comment
  in all 77 lessons failed AA. Now `#788878` (4.82:1); all other tokens
  already passed.
- `text-primary/70` on LessonRecap headings = 3.54:1 → `/90` (5.00:1).
- Locked hint placeholder `opacity-40` = 2.31:1 → `opacity-75` (4.67:1).
- FADE OUT marker (1.23:1) is **deliberate** and stays: marked
  `data-decorative`, exempt under WCAG 1.4.3 "pure decoration", and the axe
  gate skips it by attribute rather than muting `color-contrast` globally.

## Battery

content build ✓ · typecheck 11/11 ✓ · vitest 134 files ✓ · lint 0 errors ✓ ·
grader **84/84** on real TFJS ✓ · e2e **95/95** ✓ · prod build 119/119 ✓ ·
0 em dashes across all 15 touched files.

## Still open

- Tier 2 (17 MED metadata mismatches) and Tier 3 (~15 LOW) from this run.
- a11y HIGHs that are not contrast: focus destroyed on every step transition
  (`lesson-steps.tsx` `key={currentStep}`), ~8 invisible tab stops from the
  report-issue panel, mobile nav lacking a focus trap, **two Sandpack editors
  mounting on mobile** racing `localStorage["tc-code-<slug>"]`, live region
  conditionally mounted, pass/fail colour-only.
- Collateral: `--tc-error` is defined nowhere (`settings-form.tsx:751`; real
  token is `--color-error` at `globals.css:42`); `lesson-steps.test.tsx:275`
  asserts the reversed Back-button design and passes only because
  `renderSteps()` defaults to step 0; paywall-notice hardcodes "51" beside a
  dynamic `displayName`.

## Run #6 follow-up (2026-07-15): the still-open list

Verified every remaining claim in-file before acting. **Two of the a11y
report's HIGHs did not survive verification**, which is the same lesson as
every prior round: agent findings are leads, not facts.

### Rejected (claims that were wrong)

- **"Two Sandpack editors mount on mobile, racing localStorage['tc-code-<slug>']".**
  False on both halves. `tc-code-` exists nowhere in the app. And `Exercise`
  appears in exactly one visibility set (`CHALLENGE_RIGHT`); `CHALLENGE_LEFT`
  is `["challenge", "prose", "HintPanel"]`. The 9 `LessonContent` mounts are
  mutually-exclusive branches of an if/else chain, not simultaneous mounts.

### Confirmed and fixed

- **Focus destroyed on every step transition.** `key={currentStep}` on the left
  column remounts the subtree, `bottomNav` included, so the button a keyboard
  user just activated is destroyed and focus falls to `<body>`: they restart
  from the top of the document six times per lesson (WCAG 2.4.3, level A). The
  step container is now `tabIndex={-1}` + `role="group"` with a
  "Step N of 6: Name" label, focused on change but never on first mount.
  Guarded by 3 new tests in `lesson-steps.test.tsx`.
- **~8 invisible tab stops in the report-issue panel.** This one I initially
  rejected and was wrong: the `{open && ...}` gate spans only 20 lines and
  wraps a decorative overlay. The form itself (select, textarea, 2 inputs, 4
  buttons) is mounted at all times, hidden by `opacity:0` + `pointerEvents:none`,
  neither of which removes an element from the tab order. Fixed with
  `inert={!open}` (React 19). Note `aria-hidden` alone is NOT the fix and was
  my first, wrong attempt: aria-hidden over focusable content is its own
  violation, and the new axe gate caught it immediately (`aria-hidden-focus`,
  6/6 steps). **The gate caught my bad fix within one run.**
- **Live region conditionally mounted.** `aria-live` sat on the results panel,
  which mounts only once results exist; a region created in the same commit as
  its content is not reliably announced. Now an always-mounted `sr-only`
  region carries a spoken summary ("All 3 tests passed." / "1 of 3 tests
  passed. Failed: ..."), and the panel is pure presentation.
- **Pass/fail was colour-only** (WCAG 1.4.1): the ✓/✗ glyph is `aria-hidden`,
  so the distinction existed only in colour. Added an `sr-only` "Passed:" /
  "Failed:" word per row; visual design untouched.
- **`--tc-error` is defined nowhere.** One usage in `settings-form.tsx:751`,
  rendering red only via its fallback, in a file that uses the real
  `--color-error` token five times. Pointed at the real token.
- **Stale Back-button test.** `lesson-steps.test.tsx` asserted "has no bottom
  Back button" after a Back button was added in the 2026-07-14 UX audit. It
  passed only because `renderSteps()` defaults to step 0, the one step that
  renders no Back button by design. Replaced with three real assertions.
- **Paywall "51" hardcoded twice.** The number is correct for Deep Orbit
  (56 - 5), so the reported bug was mis-stated; the real defect is that
  `paywall-notice` validated `locked` against ALL theme slugs, so
  `/pricing?locked=nova-canvas` rendered a purchase banner quoting Deep
  Orbit's count for a theme that ships no lessons and cannot be bought. Now
  gated on `isLaunched()`, and both surfaces call the new
  `getPaidLessonCount()` (pinned by 4 tests in `constants.test.ts`).

### One more gate hole found and closed

The per-step axe audit flaked once under full-suite load on the Code step and
passed 3/3 in isolation. Cause: shiki paints token colours asynchronously, so
axe sampled UNSTYLED tokens and reported contrast failures that do not exist
in the shipped page. `settle()` now waits for `pre code .line span` rather
than widening the timeout, which would only move the race.

### Battery

typecheck 11/11 ✓ · vitest 134 files ✓ · lint 0 errors ✓ · grader 84/84 ✓ ·
e2e **95/95** ✓ · prod build 119/119 ✓ · 0 em dashes introduced.

### Still open after this pass

- Tier 2 (17 MED metadata mismatches) and Tier 3 (~15 LOW).
- Mobile nav overlay has no focus trap / Escape handler, while a correct
  `FocusTrap` exists and is used elsewhere.
- Dashboard cannot reflow to 320px; bridge tier "identity"/"intuition" both
  render "I".

## Run #6 close-out (2026-07-15): remaining a11y + Tier 2

### Dead code found

`apps/web/app/dashboard/bridge-collection.tsx` is **defined, exported, and
imported nowhere**. The reported "identity/intuition both render I" bug is
real (`bridge.tier[0].toUpperCase()` collides two of the three tiers, leaving
colour as the only distinguisher) but it lives in a component that never
renders. Fixed anyway (2-letter `TIER_ABBR` + an `sr-only` tier name and
locked state) because it is a landmine if the component is ever wired up.
**Not deleted: surfacing it instead, since it may be staged for a feature.**

### Fixed

- **Mobile nav had no focus trap and no Escape.** The overlay is `fixed
  inset-0` and visually owns the viewport, but the page behind it stays
  mounted, so Tab walked straight out into links the user could not see.
  Wrapped in the existing `FocusTrap` (which `lesson-drawer` already used) with
  `role="dialog"`, `aria-modal`, and `onEscape`. 5 new tests in
  `mobile-nav.test.tsx`.
- **Reflow gate added** (`e2e/reflow.spec.ts`, WCAG 1.4.10): 7 public routes
  measured at 320px, all pass, none scroll horizontally.
- **M3** `neural-networks/04` cold open said `ValueError:`. Captured from the
  real runtime: `Error: Error when checking : expected dense_Dense1_input to
  have shape [null,3] but got array with shape [3,1].` `e.name` is `"Error"`.
  The doubled "Error" and orphaned colon are TFJS's own; the lesson now says so.
- **M5** `neural-networks/01` concept promised an activation function the
  lesson withholds until lesson 2. Now names the omission as deliberate.
- **M7** `training-loop/05` recap said high train+test accuracy means "ready to
  deploy", contradicting its own `breaks` and bullet 3.
- **M8** `llm-integration/04`: temperature reduces VARIABILITY, not
  hallucination. A greedy decode invents just as confidently, only
  reproducibly, and the lesson's own epilogue fabricates a Band-3 cluster at
  temperature 0.3.
- **M9** `foundations/05` `breaks` claimed "the document can't get longer
  mid-scroll". It can (infinite scroll, lazy images), and `foundations/04` runs
  its whole analogy on infinite scroll. Reframed: you can re-read
  `scrollHeight`; sensor data gives you no such read.
- **M11** `advanced-time-series/02` `breaks` called attention "quadratic in
  sequence length". Measured: the lesson's additive scorer (`dense({units:1})`)
  emits one score per step, so 80→320 steps grows 4x (linear); true T-by-T
  self-attention grows 16x (6,400→102,400). Neither the body nor the exercise
  builds the T-by-T form. Now distinguishes the two.
- **ats/02 hint ladder was also stale** (found while fixing M11, NOT caught by
  Gate B): the solution hint computed self-attention scores
  (`matMul(hidden, transpose(hidden))`) while the exercise hands you the
  weights and asks for `temporalSummary`. Gate B passed it because `matMul`
  overlapped. **Gate B is a vocabulary check: it catches total mismatches
  (ats/05, llm/03), not subtle ones.** Do not read a Gate B pass as "the hint
  is correct".
- **M14** `advanced-time-series/05` projected "from 72.5 seconds"; lesson 04
  ends at a smoothed 72.4429 and the module's premise is monotonic
  acceleration, so 05 must start at or below 72.4.
- **M16** `browser-runtimes/04` said tf.tidy "is the one concept with no
  frontend parallel", contradicting `foundations/01` ("Same contract" as
  useEffect cleanup). The parallel holds; what has no parallel is the stakes.
- **M17** `optimization-edge/02` bridge rounded to "~2% accuracy loss" in a
  module whose thesis is refusing to round. The measured figure is 1.2%, stated
  three lines below.
- **M1 remainder**: `recurrent-networks/02` (promised the RNN "notices the
  signal rises"; the epilogue is 200 epochs pinned at 0.693, learning nothing),
  `capstone/01` (quoted Mirza saying "Build it"; his silence is the beat),
  `browser-runtimes/02` (promised WebGL activating; the beat is the sixth
  console returning wasm at 3.1 ms vs 0.5), `browser-runtimes/06` (quoted two
  Nazari lines nobody speaks, in a Farah scene, plus a "Nazari smiles"
  validation beat the style bible kills).

### Battery

content build ✓ · typecheck 11/11 ✓ · vitest 135 files ✓ · metadata gates
140/140 ✓ · lint 0 errors ✓ · grader 84/84 ✓ · e2e **102/102** ✓ · prod build
119/119 ✓ · 0 em dashes introduced.

### Still open

- **Dashboard reflow at 320px is UNVERIFIED, not refuted.** `/dashboard` 307s
  to `/auth` without a session, so the reflow suite would silently measure the
  auth page and pass while proving nothing. Marked `test.fixme` in
  `e2e/reflow.spec.ts`; needs an authenticated e2e session.
- Tier 3 (~15 LOW): COLA vs symmetric Hann, Hamming main-lobe claim, WebGPU
  epithet split four ways, `anomaly-detection/01` IQR promise, assorted
  `youCanNow` overclaims.
- Delegated-but-unverified extras findings (pandas ddof=1, KNN O(n log n),
  ethics deploy-rule) from the metadata audit.

## Bridge collectibles: shipped, not deleted (2026-07-15)

Asked to delete `bridge-collection.tsx` as dead code. Checked the target first
and **it contradicted its description**, so this was surfaced instead of
executed:

- `docs/prd.md:207`, [marketing-plan.md:419](https://github.com/Amira-Rahim/tensorcraft/blob/8550adf771dbb40f1c7cef9af56990caf316bf61/docs/marketing-plan.md#L419), and [dev-plan.md:682](https://github.com/Amira-Rahim/tensorcraft/blob/8550adf771dbb40f1c7cef9af56990caf316bf61/docs/dev-plan.md#L682)
  all describe dashboard bridge collectibles as **shipped**, and dev-plan
  records that the standalone `/bridges` route was removed *in favour of* it.
- The data pipeline was fully built and connected: `page.tsx` calls
  `getLessonsWithBridges` per launched theme, computes a `collected` flag from
  real `theme_progress` rows, and passes `bridges: DashboardBridge[]` into
  `DashboardView`, which destructures it at line 101 and **never uses it**.
- So the query ran on every dashboard load and the result was discarded, while
  three documents told customers the feature existed.

Deleting it would have made "bridges have no discovery surface" permanent
while the marketing plan still promised one. **Owner chose to wire it up**, so
the docs are now true rather than edited down. One import plus one render; the
pipeline needed nothing.

### Fixed while shipping it

- **Tier badge collision**: `bridge.tier[0].toUpperCase()` rendered "I" for
  BOTH identity and intuition, leaving colour as the only distinguisher on a
  grid whose entire job is showing your tier mix. Now an explicit
  `TIER_ABBR` map (ID / ST / IN).
- **Sub-12px type**: the badge was `text-[10px]` and the detail caption
  `text-[8px]`, against a design system that claims a 12px floor. The
  2026-04-20 a11y audit flagged the `text-[8px]` caption; the fix never landed
  because the component never shipped. Both now `text-xs` (12px).
- **A 320px reflow hazard, pre-empted**: the detail was a `w-48` popover
  absolutely positioned inside each tile. At 320px the grid is 4 columns of
  ~72px, so opening the right-hand column's popover pushed 192px of content
  past the viewport and scrolled the document sideways (WCAG 1.4.10). Now a
  full-width panel below the grid: cannot overflow at any width, and a 192px
  card hanging off a 72px tile was poor on mobile anyway.
- **Screen-reader naming**: tiles carried tier only as colour + abbreviation.
  Added an `sr-only` tier name, `aria-expanded`, and `aria-controls`.
- **Mystery placeholders**: uncollected bridges render a dimmed "?" by design
  (no title, no tier, until you earn it). They encode nothing a screen reader
  can use, and 50+ tiles announcing "question mark" is noise, so they are
  `aria-hidden`; the collected count above carries the progress.

**Note the design detail I got wrong first**: only COLLECTED bridges are
buttons. My initial tests assumed one tile per bridge and failed. The component
was right; the tests were.

11 new tests in `bridge-collection.test.tsx` (it had none, which is how the
tier collision survived).

### Battery

typecheck 11/11 ✓ · vitest 136 files ✓ · lint 0 errors (9 warnings -> 8: the
dangling `bridges` variable is gone) ✓ · grader 84/84 ✓ · e2e 102/102 ✓ ·
prod build 119/119 ✓ · 0 em dashes.

---

# Run #7 (2026-07-16, Fable): six-evaluator maximum-depth sweep

Six parallel evaluators on ground no prior run had covered end-to-end, plus
owner-side probes. All headline findings independently re-verified in-file
before acceptance.

**Coverage that is new:** all 118 deep-orbit code blocks executed as a class
(82 executed, 36 by analysis, 0 skipped); all 21 extras lessons executed with
real numpy 2.0.2 / pandas 2.3.3 / torch 2.8.0 installed for the audit; all 81
RecallPrompts audited (15 by execution); **all 77 hint ladders run against
their graders using the product's own harness**; continuous read of all 56
deep-orbit lessons as a paying customer (two readers, front/back half);
marketing-truth sweep of every factual claim (all TRUE except two on /about);
Stripe/webhook/certificate path read; glossary 88/88 correct; PT29H verified
exact; step-completeness clean.

**Headline numbers:** 84/84 shipped exercise solutions pass. 39/77 hint
ladders produce passing code; **38 fail as revealed** (9 actively wrong, 27
prose-only vs code graders incl. the entire capstone, plus repairables).
7 incident exercises have no hint path at all. 2 impossible epoch lines in
claimed training traces. 3 extras HIGHs (QR/NaN, Toeplitz hint throws, pandas
ddof falsehood). Money path: `payment_status` never checked (0 refs),
`async_payment_failed` never revokes, certificates issueable without purchase,
purchase-success page freezes without recourse after 60s. Story: archive
cadence 33s-vs-1Hz unreconciled, Kalman drift rate ~60-150x the season
ticker, module 9/10 chronology knot, Kepler-442 placed at 4.2 ly, finale
narrates its climax in console.log instead of an exercise.

Full evaluator reports preserved in the run outputs; scratch harnesses at
scratchpad/run7-*/ (incl. a working hint-vs-grader harness worth promoting to
a permanent gate). Tiered fix list delivered to owner 2026-07-16.

---

# Run #7 remediation (2026-07-16/17): every gap fixed, gated where mechanical

Executed as five waves: money path (solo), gates (solo), three parallel
content agents, five module-scoped hint agents, two polish agents. Every
numeric edit execution-verified; every failed agent resumed from transcript
with no lost work.

## Assessment layer (the big one)
All 77 hint ladders regenerated to the new EXCERPT CONVENTION: a solution
hint is verbatim lines from its exercise's own solutionCode, enforced by the
rewritten Gate B in metadata-consistency.test.ts (hint ⊂ solution ∧ solution
passes grader ⇒ hint is correct code; wrong hints are now unrepresentable).
Every ladder ALSO behaviorally verified: candidate = starter + hint code run
against real testCode on real TFJS, ALL-PASS across all 77. All 7 unladdered
incident exercises + launch-rehearsal got complete self-sufficient starter
recipes, each proven by a recipe-only candidate passing the grader.

## Money path
payment_status now gates access ("unpaid" -> pending; async_payment_succeeded
promotes + fires the deferred revenue event/email; async_payment_failed
settles failed); certificates require an entitling purchase; refund matching
zero rows returns non-2xx so Stripe retries; auto-grant uses the admin client
(migration 037 relaxes chk_amount_positive to >= 0); migration 038 adds a DB
trigger making terminal-status regression impossible regardless of webhook
ordering; purchase-success no longer shows the previous purchase's receipt
when a session_id is pending, and the poller shows a visible timeout state
with retry + support mailto carrying the session ref; pricing credit preview
now uses the server's overlap rule per plan; checkout auth roundtrip
preserves plan+themes and PricingTiers restores them. Tests: 16 payments,
certificates incl. new theme_not_purchased case, integration flow, 5 poller.
OPERATOR: apply migrations 037 + 038.

## Content correctness
tl/05 rebuilt properly: the training-data feature inversion fixed at the
root, evaluation on a 50-row slice where 94.0% = 47/50 is exact, and a
400-run sweep shows 94.0% printing in 393/400 with the canonical run yielding
88.0/11.7/51.8 (canon preserved as measured); tl/04 early-stopping now halts
at a reproduced epoch 102/0.081 on honestly noisy labels with the
small-split caveat; both impossible epoch traces fixed and gated
(epoch-traces.test.ts); QR/NaN, pandas ddof (both sites), transformers.js
Cache Storage, br/01+br/05 MiB, confidence naming, summary() format, mean()
helper, saddle wording, all extras LOWs, six objective overclaims delivered
rather than deleted (schedules section, deploy.yml rollback step, stacking
sketch, confusion matrix render), three RecallPrompt corrections.

## Story
Cadence reconciled on-page (archive 33s integrations vs live 1 Hz feed;
rn/03 replays 950,400 raw samples); 47-minute cycle planted in sp/04 and
rn/05's patch paragraph halved; br/04 ranges hardware-justified and the
frequency feature fixed to zero-crossing bounds 0-63 (both exercise yamls
updated, grader green); Kalman lesson reframed to one reading per day (same
numbers) killing the 100x drift-rate break; capstone's "shrink accelerates"
now matches the printed wandering rate; Kepler-442 -> anomaly-prx-cen-001
with localization seeded in capstone/03; untrained-network miracle defused by
an ARIA line that keeps the mystery and kills the misconception; module 9
carries the countdown (63.1 -> 62.0) and the crash night is explicitly two
nights after the report; ARIA's withheld reconstruction number disclosed;
DISPATCH inducted at first contact; all three BossBeat "flip a coin" options
replaced with tempting-wrong choices that teach; the finale now ENDS: Mirza's
closing log dates the zero-crossing and closes the record by choice, a scene
break + "next story" framing separates the season-two tease, and the learner
RUNS the final classification (new classify-anomaly exercise: three-detector
vote, Fibonacci interval decomposition, the 51.8 -> 99.9 delta; grader 85/85,
starter fails, recipe-only candidate passes 7/7).

## Voice + weakest lessons (both halves)
", not X" halved in both halves; ledger metaphor scoped to Nazari (0 narrator
instances in M1-6; OE cluster 5/5 -> 3/5 lessons; she gets one non-ledger
scene); "checked it twice" retired outside the finale escalation + one
plot-load-bearing use; "the whole X" capped; ", Ensign" is Nazari's alone;
0.693 deduplicated; 22 weaker epilogues re-ended, all protected closers
untouched; the analogy-audit skeleton broken in five lessons by letting the
code's output do the correcting first. Weakest-lesson fixes landed with
executed numbers: f/02 broken-reshape stakes beat, nn/02 rebuilt around the
worked sigmoid demo (estimatedMinutes 20 -> 13), tl/02 opens on the lerp
identity, br/05 second benchmark collapsed to a diff, sp/01 prints real FFT
magnitudes instead of asserting, rn/04's mirror promoted to a
broken-code-first beat with an executed 97.4%-vs-60.6% leakage demo, ats/02
applied ring-buffer section, oe/05 measure-the-claim beat, ad/04 cost-
asymmetry section, capstone/03 intercept sharpened.

## New/changed gates
Gate B rewritten (hint-excerpt subset); epoch-traces gate; interval-canon
gate (pins the full 73.4 -> 29.7 ticker per file, monotonic by module);
exercise-counts gate pinning EXERCISE_CONTENT (85 live / 299 five-theme,
rendered by /about); payments/certificates/poller unit tests as behavior
gates. One regression caught and reverted during verification: moving f/05's
BossBeat later in source broke script-playback reveal timing (the move had
zero rendered benefit; the reader's real fix needs an engine-level step
change, deferred).

## Battery (final)
typecheck 11/11 · vitest 141 files (incl. 207 content-gate tests, 32 api
files) · lint 0 errors · grader 85/85 (+ --starters) · e2e 102/102 in 3.0m
(the 2 extra failures in the 41-minute loaded run were confirmed flakes) ·
prod build 119/119 · em dashes: 0 across deep-orbit and extras · PT29H
recomputed exact (1,729 min). Everything uncommitted.

# RUN #8 (2026-07-19, on Fable): post-remediation fresh-eyes rerun

Six blind evaluators in parallel (prior-fix regression verifier with a
26-item checklist; hostile senior-ML expert executing code blocks on real
TFJS 4.22; math-anxious-learner simulator executing hint ladders through
the product's own harness; fiction editor reading all 56 lessons in story
order; consumer-protection/value auditor recomputing every marketing
number; full-journey UX walker through route code). Battery at start:
typecheck 11/11 · vitest 1309 passed/141 files · grader 85/85.

## Regression verdict: ALL 26 PRIOR-FIX CHECKPOINTS HOLD, zero regressions

Every P0→Run-7 fix independently re-verified at HEAD 86c4609 with fresh
file/grep/execution evidence: quantizationBytes gone, MC-dropout
model.apply, pytorch softmax + both grader gates, f/04 index split,
axis-0 moments, rank-1 reshape route, no tf.range mandate, Gate B
hint-excerpt convention (permanent test, >60 ladders), money path
(payment_status pending, cert purchase gate, migrations 037/038, poller
recourse), tl/05 fixture + 400-run attribution, learner-executed finale,
interval-canon gate 2/2, Kepler-442 resolved by removal, epoch-traces
gate, em dashes 0, Mirza she/her clean, open-redirect guard, 4/77 canon,
983k data-rate canon, /about constants test-pinned, repetition rations
(", not " 33 prose hits, was 63; stinger 4/56, was ~44), 33s-vs-1Hz
reconciled, module 9/10 chronology, PT29H exact, all four run-6 gates
green (content gates 207/207, per-step axe 14/14).

## Expert verdict: ENDORSE. Zero wrong-teaching findings in ~14k lines

All 56 lessons + 16/21 extras read in full; ~35 exercise YAMLs; 15+
numeric blocks executed and reproduced EXACTLY (FFT tables, COLA ripple,
94.0% flagship run missing rows 47-49 in 3/3 runs, Kalman gain 0.272,
matMul error strings byte-identical). Two MED internal-consistency
defects, no falsehoods:
- MED-1: tl/01:95 cites "sigmoid slope 0.0066 from nn/02", nn/02
  contains no such number (its values are 0.0000167/1; 0.0066 ≈ σ′(±5)).
- MED-2: oe/01:83-86 lectures "divide by 1e6, NOT 1024², that's MiB
  wearing an MB label (324.2 vs 340.0)" while its own graded exercise
  profile-model.yaml requires 1024² under the field `memorySizeMB`, follow the lesson, fail the test.
LOWs: sp/04 "bins 13-20 cover 52-84 Hz" (centers 52-80); extras bayes
"you used L2 regularization" (never applied, only a RecallPrompt answer);
br/06 "~80MB" sentiment model (v3 defaults quantized, smaller);
sliding-window.yaml mlContent tag.

## Learner verdict: A-, zero quit-risk walls

15 hint-ladder executions through a replica of the grader harness: 15/15
pass, including launch-rehearsal written from starter recipe alone.
Zero taught-before-used violations verified programmatically across all
85 solutions. Friction (not walls): (1) three solution hints jam two
insertion points into one string, f/05:32, sp/05:32, oe/02:31, pasted
whole they are syntax errors; (2) multi-exercise gates carry ONE hint
ladder, always for the primary, capstone/05 gates on 3 exercises and
its ladder covers verify-deployment, the easiest, while classify-anomaly
(hardest in the course) has only its recipe; (3) llm module = mocked
plumbing thinness (3 of 6 exercises string/JSON assembly). NIT: story
narrates the DEEP SCAN net at 673 params, the exercise builds 833.

## Editor verdict: arc B+ (thread discipline A-, payoff discipline C+)

7741 touched in 11/56 lessons across all acts; ticker arithmetically
consistent. Act grades: A- / B- (browser-runtimes sag) / A (sp→rn→ad,
best stretch) / A-/B+ / B (capstone). Defects:
1. CONTINUITY (top): Fibonacci intervals vs uniform 73.4s gap never
   reconciled in PROSE, sp/03:205 measures uniform 73.4s; ad/05:152,182
   declares Fibonacci ratios; the reconciliation ("pulse SUB-intervals")
   exists only in classify-anomaly.yaml:5. Also ad/05 "reruns the
   interval decomposition", instrument never planted.
2. ARC-BREAK: untrained-0.998 gun (nn/05:123-131) re-invoked twice,
   never fired; undercuts Act 1's own "untrained nets know nothing".
3. ARC-BREAK (by design): countdown never reaches zero; loudest question
   exported to unpurchasable sequel; DispatchTease sentence explicitly
   tells the reader zero won't be answered.
4. CONTINUITY: cap/03:225 "THE triangulation job, third in a row", never planted, and its 4.2 ly is load-bearing in ARIA's climax
   refutation (cap/05:291).
5. CONTINUITY: f/05 DeepScanDemo "preview build of the classifier" has
   no in-world provenance (no learnable model exists yet in-story).
6. CONTINUITY: silent ~3-week/9-second skip between modules 8→9
   (72.0-72.4s + 8-day log → "47 days" + 63.1s, unmarked).
7. TIC: Demir's guess-then-corrected skeleton in ≥12 lessons; he speaks
   in 36 and the shape covers most of them, device, not character.
8. TIC: Nazari punishment-invoice formula 5×; ", Ensign" 14×.
9. TIC: repeated narration constructions ("which for her is a long
   time"/"which for ARIA is staring"; "longer than she would admit
   to"/"longer than he means to"; Farah/narrator epigram cadence blur).
10. NIT: reading 22146 (nn/02:115) planted with a full ARIA speech,
    never mentioned again. 11. NIT: ARIA's 4.1× self-anomaly arc ends
    one beat short (no capstone echo). 12. NIT: DISPATCH intercept IDs
    non-monotonic (#12→#08→#16→#11). 13. NIT: rn/05 flat-trace vs 73s
    cadence ambiguity (same root as defect 1). 14. NIT: external copy
    listing Khalil is stale, zero occurrences in lessons.

## Value verdict: honest product; borderline-yes at $59, obvious-yes $29-39

All prices/counts/capability claims verified TRUE against corpus (counts
recomputed from filesystem; grader run live 85/85; hero "4 KB net" is
4,150 bytes). Failures:
- FALSE: /about:130-143 claims three audits are published on the blog, blog corpus is exactly ONE post (WebGPU news); audits live only in
  docs/audits/. Fabricated transparency claim on the honesty page.
- FALSE (broken link): the one blog post links
  /learn/deep-orbit/optimization-edge/webgpu-acceleration, routes are
  /themes/...; 404, no redirect, no link gate for blog MDX.
- UNVERIFIABLE: /about:142 "source is on GitHub", no public repo URL
  anywhere; Organization sameAs: [].
- STALE: /learn:36 "50+ analogies" hardcoded while line 68 renders 55
  from the constant; FAQ "bundles available up to $159" without the
  "once all five launch" qualifier /compare carries; JSON-LD comment
  1,721 min vs corpus 1,729 (PT29H unaffected); PreOrder schema with no
  pre-order mechanism (waitlist only); neon-protocol corpus 54 vs
  promised 55.
- OPERATIONAL: cert/refund integrity depends on migrations 037/038
  being APPLIED in prod (operator step still pending).
Value: moat is real but narrow (only graded JS-native ML path +
integrity engineering); weaknesses: 1/5 themes, TFJS aging, zero social
proof, story premium = engagement glue not transferable value.

## UX verdict: buyer path SMOOTH, guest funnel BROKEN

CONVERSION-BLOCKERS: (1) guest who finishes free module 1 gets NO
paywall moment, completions never persist (progress-client.ts:26
no-ops), paywallBlocked needs DB progress, map loops to M1L1; the
funnel's climax doesn't exist for the no-account audience the landing
recruits. (2) Signed-out paid-lesson hit → forced signup BEFORE any
price (lesson/page.tsx:113-116 then :148-150). (3) No guest→account
progress migration: buyer who did module 1 as guest re-hits the
module-2 prerequisite gate. TRUST: bare 🔒 for guests, no price/why
(module-map-client.tsx:255); middleware /auth prefix bug, signed-in
magic-link loses destination, and redirectTo with a query string gets
?-percent-encoded into pathname → 404 on checkout roundtrip
(middleware.ts:70-86); purchase-success redirect("/auth") loses
session_id. FRICTION: 3/5 pricing tiers permanently disabled; onboarding
skipped by lesson-first signups then plays "first mission" copy late;
module ends dump to map (no cross-module Next Mission); mobile lacks
inbox badge + sign-out. POLISH: dead LessonPaywall + never-firing
trackPaywallShown; footer renders in focus mode. Best moments: editor
code-respect (stash/restore), pending-purchase poller, Challenge gate
legibility. A11y posture strong (per-step axe, focus mgmt, aria-live).

## Run #8 ranked plan

Tier 1, trust (hours): publish the three audits to the blog or cut the
/about paragraph; fix the blog 404 + add a blog link-target gate; oe/01
MiB exercise contradiction (grade the 1e6 path or rename the field and
teach the difference); tl/01 0.0066 false cross-ref; make "source on
GitHub" true or remove (+ sameAs); /learn 50+ → constant; FAQ bundle
qualifier; 1,721-min comment.
Tier 2, guest conversion corridor (one project): end-of-module-1
interstitial from localStorage evidence; price-before-account for
signed-out paid-lesson hits; guest progress migration at signup; locked
rows say "From $59 · Module 1 free"; middleware /auth exact-match +
redirectTo carries pathname+search (fixes checkout 404, magic-link,
session_id in one change).
Tier 3, story payoff (payoff discipline C+ → A-): reconcile Fibonacci
sub-intervals vs 73.4s carrier in prose (one Farah line sp/03 or ad/05
+ stage the interval decomposition on-page); fire the 0.998 gun in a
cap/05 epilogue paragraph (tie to calibration-harmonics resonance);
plant triangulation with one line in module 8/9; give zero-hour one
telemetry beat under Mirza's final entry; merge/delete reading 22146;
ARIA 4.1× echo in her farewell; mark the modules 8→9 time skip; DISPATCH
IDs monotonic; 673 vs 833 params.
Tier 4, learning UX: hint ladder for classify-anomaly (+ per-exercise
"Need a hint?" on multi-exercise gates); split the three two-insertion-
point solution hints with placement labels; one real in-browser
Transformers.js exercise in the llm module to replace one string-
plumbing exercise; break Demir's skeleton in 2-3 more scenes (he's
right sometimes, or corrects someone else); ration Nazari's invoice
formula.
Tier 5, market: social proof program (publish audits AS marketing,
author's completed run + cert on /pricing, collect the 3 beta quotes
the paywall placeholder awaits); consider $49 intro anchor vs $59;
LOW nits (sp/04 bin span, extras L2 claim, br/06 ~80MB hedge, mlContent
tag); apply migrations 037/038 in prod (operator).

Battery at close of run: typecheck 11/11 · vitest 1309/141 files ·
grader 85/85 · content gates 207/207 · per-step axe 14/14. No code
changed this run; evaluation only.

## Run #8 remediation EXECUTED (2026-07-19)

Tiers 1-5 of the Run #8 plan applied same day. What changed:

**Tier 1 (trust):** three audit blog posts authored and published
(`audit-bridge-tiers`, `audit-fastai-comparison`, `audit-exercise-
mlcontent` in packages/content/content/blog/), each carrying explicit
as-of dates, real numbers, and honest where-they-win framing; /about's
audit-trail paragraph is now TRUE and its unverifiable "source is on
GitHub" line replaced with a support@ correction promise + note that
counts are test-pinned. Blog 404 fixed twice: the WebGPU post's body
link AND the LessonLink component both built /learn/<nested> hrefs
(routes are /themes/...); new permanent gate `blog-links.test.ts`
resolves every internal blog href + matchedLessons entry against the
real corpus and bans the /learn/<nested> shape. oe/01 exercise
de-contradicted: profile-model.yaml now grades the lesson's own 1e6
rule (memorySizeMB = 340.0 for 85M params, test renamed to say true-MB),
instructions/starter/hints all state MB-not-MiB; corpus grep confirms
no live 1024*1024 computation remains in content. tl/01's fabricated
"0.0066 from nn/02" cross-ref replaced with the saturation concept
nn/02 actually teaches. /learn "50+" hardcode now renders the constant;
FAQ bundle line gains "once all five have launched"; JSON-LD comment
recomputed to 1,729 min.

**Tier 2 (guest conversion corridor, one project):**
- middleware.ts rebuilt: auth-page redirect is exact-match (["/auth",
  "/auth/sign-in", "/auth/sign-up"]) so /auth/callback and /auth/sign-out
  are never swallowed; redirectTo now carries pathname+search both
  directions; destination redirect goes through new URL() so a
  query-bearing redirectTo stays a query (was percent-encoded into the
  pathname → 404 on checkout roundtrips); guard hardened to the
  onboarding wizard's rule (//, /\, control chars) and gated by 9 new
  unit tests incl. the hyphen-path regression case (the run-5 broken
  char-class bug nearly recurred in this fix and the test now pins it).
- Signed-out hits on paid lessons route to /pricing?locked=<theme>
  (price before account; CheckoutButton already handles the signed-out
  roundtrip) instead of forcing signup first.
- Guest completions now recorded locally (lib/guest-progress.ts,
  tc_guest_completed_v1) whenever markLessonCompleted has no user to
  write for; GuestModuleBanner on the theme map stages the
  end-of-free-module moment for guests (congrats + "Save my progress,
  free" + "Unlock the rest · $59"); GuestProgressBridge (mounted in the
  root layout) replays the evidence through markLessonCompleted after
  signup, chronologically so streaks/DISPATCH fire correctly, clears
  only on full success, and router.refresh()es so the server-side
  module-2 prerequisite gate sees the migrated rows.
- Guest locked module rows: bare 🔒 replaced by a "From $59 · Module 1
  free" link to /pricing?locked (lockedTeaser prop; signed-in
  non-purchasers keep their "Unlock →" /paywall link). Gates: 4
  guest-progress unit tests, 2 module-map teaser tests.

**Tier 3 (story payoff):** ad/05 stages the interval decomposition
ON-PAGE before the protected epilogue (Farah discovers each pulse is a
train of sub-pulses in Fibonacci ratios while the 73.4 s carrier gap
holds steady), the code comment now says SUB-intervals, and rn/05
explains the flat trace between episodes; interval-canon gate extended
(ad/05: 73.4, deliberate-edit rule followed). The 0.998 gun is FIRED in
cap/05's body: the harmonics overlay explains it (the ship's sensor
chain pre-shapes Sector 7-G readings into extreme outliers any
arbitrary projection throws to the far end; only a trained model
learned to hesitate, which keeps tl/05's 51.8% consistent; nn/05's
protected epilogue untouched). Reading 22146 merged into the 7741
thread (nn/02's hand-wired neuron scores 7741 at 0.91 - the first
pre-echo). Triangulation planted in llm/01's new act-break paragraph,
which also marks the ~3-week module 8→9 time skip on the page (long-
baseline job "refusing to commit to a bearing" → cap/03's "third in a
row to agree" now has an antecedent). Zero-hour gets its beat: one
automated telemetry row appended beneath Mirza's final entry eleven
days later (`interval_s: 0.0 · classification: SIGNAL · confidence:
1.00 · operator_note: none`), and the DispatchTease's explicit
"no channel carries what zero brought" refusal replaced with the
concrete fact that Kira's capture began transmitting the day the
interval hit zero. ARIA's 4.1× self-anomaly arc gets its capstone echo
as a new dialogue BEFORE her protected final note ("I note the
correlation. I do not resolve it."). DISPATCH intercept IDs renumbered
monotonic in story order (ad/03 #08→#13, llm/03 #11→#17, oe/02
#14→#18; grep confirmed no external references). 673-vs-833 params
reconciled in nn/05's Challenge intro (3-channel bridge demo vs
Farah's 8-value spec, "same architecture, wider front door").

**Tier 4 (assessment):** capstone/05's hint ladder now covers
classify-anomaly (the hardest of its three gated exercises) instead of
verify-deployment (the easiest); the nudge level tells learners where
the other two exercises' recipes live. Gate B updated on purpose: the
ladder must be a verbatim excerpt of ONE of its lesson's exercises
(closest-match error reporting kept), not blindly the first. The three
two-insertion-point solution hints (f/05, sp/05, oe/02) rewritten to
include their function-boundary lines so paste placement is
unambiguous - still verbatim excerpts; normalize-data.yaml's
solutionCode converted from \n-escaped scalar to block scalar so the
gate can match across line breaks.

**Tier 5 (LOWs):** sp/04 bin span corrected (centers 52-80 Hz, coverage
50-82); extras bayes no longer claims the learner "used" L2 (names it
as the standard answer beside the crew's actual early-stop fix); br/06
model-size comment states the v3 quantized default with ~80MB as the
force-fp32 case; sliding-window.yaml mlContent arithmetic→data.

**Deferred with docs** (dev-plan "Run #8 deferrals"): llm real-model
exercise (CI harness strategy first), Demir skeleton variation +
Nazari invoice ration (batched editorial pass), per-exercise hint
panels (schema+UI, V2).

Battery: typecheck 11/11 · vitest 1345/0 (142 files; +middleware,
+guest-progress, +blog-links gates, +2 map teaser tests) · lint 0
errors · grader 85/85 with --starters (incl. re-graded profile-model)
· content em dashes 0 in all touched files · e2e + prod build recorded
below when complete.

Run #8 remediation battery (final): typecheck 11/11 · vitest 1345/0 ·
lint 0 errors · grader 85/85 --starters · targeted e2e
themes+pricing+landing+accessibility+onboarding 55/55 (each of the 5
cold-compile failures re-ran green on a warm server, the known dev-mode
class; the ONE real failure was axe nested-interactive on the new
locked-row links inside <summary>, fixed by moving both the Unlock and
teaser links outside the summary as absolutely-positioned siblings,
which also cured the latent violation in the pre-existing signed-in
Unlock link) · prod build 122 static pages (119 + the 3 new audit blog
posts). Working tree also carries a PARALLEL session's uncommitted work
(SceneCanvas/theme-scenes five-worlds landing animations,
five-worlds-section.tsx, tech-spec rows), not part of this run,
untouched, battery green with it in tree. Everything uncommitted.
