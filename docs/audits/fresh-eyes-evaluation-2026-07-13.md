# Fresh-Eyes Full Evaluation — 2026-07-13

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
| Clarity | STRONG. One HIGH defect: tl/05's random-tensor "test set" with fabricated printed outputs — in the honesty lesson. |
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

### Tier 1 — trust and purchase-moment fixes — ✅ ALL EXECUTED 2026-07-13

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
   `globalAveragePooling1d()` commented "simple attention" — uniform fixed
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
6. **br/04 RecallPrompt** quizzes `data()` vs `dataSync()` — never taught in
   body. Teach the tradeoff in one paragraph or swap the prompt.
7. **"60fps via WebGL"** (`page.tsx:65`): benchmark or soften to
   "real-time".
8. Wording nits: ad/05 "ratios" → sequence (line 174); capstone BossBeat
   "dominant strategy" mislabel; oe/02 "255 levels"; `Math.min(...weights)`
   stack-overflow footgun.

### Tier 2 — the highest-leverage content upgrades — ✅ ALL EXECUTED 2026-07-13

All seven items below shipped same day. What changed:

- **340 MB origin + on-page crash (item 9):** llm/05's epilogue now ends on
  the bundle audit (crew models under a megabyte; the pretrained language
  component and its tables are the 340; "filed under later" / dashboard has
  512) — Chekhov's gun lit one lesson before it fires. oe/01 now opens with
  ARIA's reboot-watchdog replay of the crash at quarter speed
  (00:02:47.0 window flag → 00:02:47.4 load begins → 00:02:49.1 memory
  touches zero, render loop dies mid-frame), tagged `flashback`, and the
  profiling section opens on the audit as exhibit one. The 673-vs-85M seam
  is now explained BY the story instead of felt through it.
- **Finale reveals (item 10):** the final classification output adds an
  Interval Extrapolation block — the three curves that "disagree on the
  date" in ats/05 converge on deployment data: zero-crossing eleven days —
  answering Nazari's ats/03 question; plus a full-pipeline archive
  re-score: sample 7741, 51.8% at module 3, 99.9% tonight. A closing prose
  paragraph names both debts paid. cap/05's protected epilogue untouched.
- **M7→M8 hinge (item 11):** ats/01 now cold-opens on the first early
  arrival (predicted 0134:55, observed 0131:27, 208 s early; precursor
  ripple at window position 5 diluted to nothing by step 80) — attention
  becomes the tool the miss forces, not a lecture. Farah's rewritten line
  keeps the step-5-and-72 promise the lesson pays off later.
- **BossBeats (item 12):** two promoted from prose with full
  4-option (cooperate/defect/random/dominant) structures — ad/01's
  "train on 7741 or pull it" (dominant = exclude AND promote to a named
  eval case, which is what makes the ad/05 replay mean something) and
  llm/04's standing-order "cut / ship flagged / regenerate / self-assess"
  (dominant = Farah's canon call). Boss-beat lessons: 1 → 3, and the
  cap/05 beat is now a payoff, not a debut.
- **Exercise rigor (items 13–14):** implement-neuron is now a function
  graded on three input sets (hardcoded 0.4 dies); build-layer asserts
  units/activations/countParams 225; simple-network asserts config, loss,
  and 833 params (relabeled advanced→intermediate); the two transcription
  exercises are gone — sp gets dominantFrequency() (real rfft, four
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
value — the gate caught it before anything shipped.)

9. **Give the 340 MB model an on-page origin + put the crash on-page.** The
   course's one irreversible event is caused by an object the story never
   built (673 params → "85 million weights" with zero on-page growth). One
   scene at llm/05's end (ensemble + pretrained components balloon the
   bundle) + restructure oe/01's open as a LIVED broken_code_first, not a
   recap. Fixes the biggest narrative seam AND the known scale wobble.
10. **Make the finale reveal something module 7 didn't.** The final
    classification re-prints M7's findings. Latent in canon: Nazari's
    unanswered "when does the interval hit zero?" (ats/03) — let the final
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
    implement-neuron — currently passable hardcoded) and replace one
    trivial llm exercise with the numeric-claim checker the module's own
    epilogue describes (compare every number in a generated answer against
    retrieved rows).
14. **Replace the two transcription exercises** (sp time-vs-frequency, rn
    create-sequences: the solution appears verbatim in the lesson body).
15. **Capstone expectation gap**: add a ship-it scaffold (GitHub Pages
    template repo wired to the learner's exercise commits) OR reword
    landing/compare to "assemble and deploy-drill every component."
    Auditor rated this the largest refund-risk expectation gap.

### Tier 3 — polish and conversion — ✅ ALL EXECUTED 2026-07-13

What changed: the 21 ungated extras lessons are now a FEATURE — advertised
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
long-tail noise, nothing pulse-adjacent — the trade stands), and Nazari
reads her ledger out loud and wipes the board in cap/05 (9 h + 3 h +
40 min, one credit line). rn/05 gains the units-honesty paragraph in the
BODY (47 demo steps vs the bridge's interval-series forecast: 47 min ≈ 38
steps at 73-second spacing — the protected epilogue untouched). Inbox nav
links commented out (desktop + mobile) until DISPATCH has a server-side
producer; route stays live, comments say exactly when to restore.
Post-Tier-3 distribution: 35 dialogue / 21 prose openers. Battery all 0:
velite · typecheck 11/11 · vitest 1036 · lint 15/15 · grader 80/80 ·
e2e 5/5 serial.

16. Extras gating decision: 21 lessons / ~26k words ungated — if
    intentional, advertise on the free tier card (conversion win); if not,
    it's paid-grade content leaking.
17. Sell harder what's true: real in-tab neural net, real TFJS grading with
    anti-cheat, 55 bridges (marketed as "50+"/stale "51"), GitHub push,
    honest pricing. Update the 51 count.
18. Weak cold opens: nn/01 (no scene, definition in first breath) and
    cap/01 (monorepo simile; the 38.4s ticker belongs in the open).
19. neural-networks module is thinnest (~586 words/lesson vs 914 course
    median) exactly where beginners need generosity — expand nn/01-02.
20. Thread closures, one paragraph each: ARIA's self-audit request (ad/03,
    "waits forever") pays off in M8-M10; Nazari's ledger gets a final
    read-out in cap/05; Farah's oe/03 overnight-run result reported.
21. DISPATCH inbox: no server-side writer calls `dispatch_milestone` — the
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
plainly" — midpoint, crash flashback, ledger close, zero-hour receipt
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

## P4 round 3 (2026-07-13) — first independent P4 reviewer + execution-level attacks

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
the grader — `action` is now a graded enum (cause → remedy mapping in the
instructions), `rate` asserted to 1 decimal. `incident-missed-anomaly` now
asserts `requiresRetrain: false` (a `true` constant used to pass), and its
premise ("memorized anomaly patterns during training") contradicted module
canon (training set built "minus every flagged window") — reworded to
memorized-sensor-quirks overfitting. `incident-false-alarm-storm`'s
"~10/hour baseline" contradicted the lesson's fourteen-alerts-a-week alert
economy, and the host lesson's framing ("clearly noise, not a real
outbreak") prejudged the exact input its own default branch escalates —
both rewritten. The incident set's two batch fingerprints harmonized: the
anomaly trio's `## On-Call Scenario` headings became inline pager-register
paragraphs (distinct times/voices), full-dummy-object starters became
`return null` (no more return-shape leak), difficulty labels re-assessed
individually (baseline-drift + missed-anomaly → intermediate), "Build"
verb monoculture varied. **GET /unsubscribe wrote on render** — corporate
scanner prefetch = silent unsubscribes; now a confirm-button server action
(GET never writes), the false "already used" copy dropped, and the dead
third `unsubscribeByToken` in the api lib deleted (3 drifted impls → 2
identical). **"each labeled where it breaks" was false for 7/55 bridges** —
wrote the 7 missing `breaks:` (ats/01, ad/05, br/02, nn/02, nn/03, oe/02,
tl/04) and added `packages/content/__tests__/bridge-breaks.test.ts`, a gate
that replays bridge-callout's own resolution logic over all 55. **Minute
labels understated 2-3x** on the six incident lessons ("14 min · 2
exercises" where exercises alone are 30 min), and lesson JSON-LD
`timeRequired` disagreed with theme `courseWorkload` on accounting basis —
new `getLessonTotalMinutes()` in packages/content is now the single basis
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
Found and fixed: **the hours ledger moved again** — the three incident
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

## P4 CLOSED (2026-07-13) — the last two items of the original plan

**#30 Kit lifecycle email audit (the never-audited surface).** In-repo
side audited end-to-end: all four lifecycle tags (signed_up, onboarded,
first_lesson, capstone) have live web callers and a graceful
env-unset skip path; the weekly digest sender carries proper
List-Unsubscribe/One-Click headers and per-recipient tokens. Two real
findings, both fixed: (1) **cross-stream opt-out miss** — the Settings
weekly-digest toggle writes profiles + Kit, but the Resend digest reads
the WAITLIST table, so a waitlist-joiner who signed up and toggled off
kept receiving it; the sender now excludes any waitlist email whose
profile has weekly_digest=false (profiles.email verified present:
migrations 001 + 022). (2) **HTML injection into the support inbox** —
issue-notification emails interpolated reporter-controlled
description/pageUrl raw into HTML; now entity-escaped.
**Kit-dashboard copy is external and needs a human pass — operator
checklist:** for each automation tied to the four tags: sender name
matches "Tensorcraft"; no lesson/hour/price counts contradicting the
site (56 lessons · 59 exercises · $59 · ~29h); links point at
tensorcraft.app routes that exist post-launch-scope (NO /bridges, no
theme pages other than deep-orbit); unsubscribe present; the capstone
email doesn't promise a hosted deployment.

**#26 Incident enrichment.** Deep Orbit had 3 incident exercises, all
parked in anomaly-detection. Added 3 more where operators actually get
paged, each wired after its lesson's main exercise with a pager beat:
`incident-tensor-leak` (br/04 — numTensors climbing since the deploy;
endpoint-trend triage, hours-to-budget), `incident-stale-verdict`
(oe/04 — a deploy must invalidate every cached verdict; version +
TTL audit), `incident-checker-down` (llm/05 — "no unverified number
leaves the ship"; queue triage under a dead checker). Incident coverage:
6 exercises across 4 modules. Grader + shipped-runtime corpus now
**83/83** with the starter-must-fail invariant.

Battery: velite 0 · typecheck 11/11 · vitest 1046 · lint 15/15 ·
grader 83/83 · corpus 83/83 · e2e serial 4/4.

**With this, every item of the original P0–P4 plan is closed.**

## All-P round (2026-07-13, final) — cumulative diff review + never-run gates

Method: one adversarial reviewer over the ENTIRE uncommitted delta (it
independently re-ran velite, tsc, and both vitest workspaces, recomputed
every canon number, and attempted cheapest-pass attacks on all six
rewritten graders — none folded), plus first-time verification of two
never-traced paths (BossBeat persistence: migration 030's RPCs use
auth.uid() internally, the safe pattern, NOT the dispatch_milestone
class, and survive 033's drops; commit-on-pass got a contract test),
plus the closing gold-standard gate: fresh prod build + FULL e2e —
**89 passed / 0 failed / 19 auth-gated skips across 108**.

**Zero HIGH findings — the first all-layers round where nothing was
mechanically broken.** Three MED claim-drifts, fixed: the learn page's
analogy count (the saga ends: TWO populations exist — 54 registry
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
so module-1 pushes work free — the row had drifted below reality); the
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

## P3 round 3 (2026-07-13) — audited the round-2 fixes themselves

The standing rule (every round's own edits get the next round's
knife) earned its keep at the highest severity yet:

- **The round-2 shuffle was itself a movable answer key.** The LCG's
  short low-bit cycles parked "dominant" at position 2 for ALL FOUR
  shipped beats — verified by executing the hash, not by reading it.
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
  page with no stance leak — the gate now runs against built output.
- **Cast order-of-appearance bugs from the round-2 renames:** Lin's
  "vision cell again" appeared three modules BEFORE her first incident
  (callback removed; the recurrence reads organically now); Jin held
  two different cells (edge M2 + speech M6) — edge returned to Hassan,
  whose #16-C "detour from the edge cell" now has its M2 introduction;
  and Yara, canonically image-latents (#02-T), had been handed the
  audio phantom — reassigned to Jin's speech cell, giving him a tight
  M5/M6 double. Final coherent map: Yara image (M1) · Hassan edge×3 +
  multimodal detour (M2/M8/M10/M11) · Amara language×2 (M3/M9) · Lin
  vision×2 (M4/M7) · Jin speech×2 (M5/M6) · Kira CV tease (finale).

Battery: velite 0 · typecheck 11/11 · vitest 1041 (+4 BossBeat gates) ·
lint 15/15 · grader 80/80 · e2e 4/4 serial incl. the new beat check.

## P3 adversarial audit round (2026-07-13, post-closure) — found real holes, all fixed

A fresh-eyes devices auditor graded P3 a B: "prose A-grade, technical
claims survive adversarial checking essentially without a scratch,"
capped by delivery mechanics. Findings and fixes:

- **H1 (component, the big one): BossBeat printed its own answer key** —
  the stance enum rendered on every button ("Option 4 · dominant") in
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
  Yara the audio phantom (#09-F), Hassan a multimodal detour (#16-C —
  also renumbered from #14-C to clear the serial collision, L1).
- **M5: two 5+-lesson device dead zones.** Both broken with the
  course's mathiest missing pieces: a Kalman-gain DerivationDrawer in
  ats/04 (minimize posterior variance → K = P/(P+R), endpoint sanity
  checks, "the EMA is this formula frozen") and a magnitude-pruning
  drawer in oe/03 (Taylor expansion, gᵢ≈0 at a minimum, the equal-
  curvature assumption — and why the proxy lied about exactly the 80%
  build's rare signals). Drawers now in 3 modules, 10 lessons; both
  zones under the 5-lesson threshold. The 26-lesson beat dormancy
  (5→32) is accepted: beats are story-anchored, and the free-tier seed
  plus M7/M9/M11 cadence is the arc, not a gap.
- **M6/L3/L4: llm/04 beat leaks + mappings.** The dominant consequence
  no longer pre-tells Farah's epilogue call; the prompt addresses
  "operator" like its siblings; `random` is now genuine indecision —
  and inherits the fluency-not-truth teaching honestly ("stall long
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

**ALL re-run findings are now EXECUTED (HIGHs, 6 MEDs, 8 LOWs —
2026-07-13).** The MED/LOW closure batch: rn/03's 72-hour claim restated
as recurrence-recognition ("recognition is cheaper than memory" — no
cross-window cell-state myth); oe/02 gained the two-ledgers paragraph
(85M = the whole bundle dominated by the language component; the
accuracy row tracks the classifier, whose 94.2 is five modules of
features past the re-annotation's 87); FAQ #1 + #5 rescoped to
today-vs-in-development (fixes the FAQPage JSON-LD too); the finale
paradox got its witness — one additive ARIA beat ("It cannot have heard
us first… I have no third."), every protected line untouched; sp/01's
exercise is now the pre-FFT "Two Views, One Verdict" (compareViews on
provided magnitude arrays — no rfft before it's taught, no compute-fft
duplication); ad/05's detector-3 compares the LSTM's 3-value forecast
against the raw slice (shape-honest); f/05 gained the free-tier BossBeat
(keep-or-delete 7741, dominant = "a question mark is an instrument" —
the mechanic now seeds in module 1 and rhymes through M7 and the
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
GitHub push is now real — `apps/web/lib/github-commit.ts` fires on every
passed exercise from lesson-content's submit handler (best-effort, same
contract as attempt recording), and Settings gained a "Push solved
exercises" button hitting `/api/github/retroactive-push` per launched
theme with a pushed/skipped/failed summary (test: settings suite 19/19,
asserts URL, auth header, body, and summary render). sp/02's block was
rebuilt on machine-verified numbers — `analyzeSignal(anomalousSignal,
256)` with N=512 → 0.5 Hz bins, magnitudes A×N/2 (204.8/153.6/102.4/
51.2), the intruder honestly reads **73.5 / 12.0** with a sub-threshold
shoulder at 73.0 (bin 146: 3.0), leakage named with a pointer to sp/05;
the epilogue now reads 73.5-on-this-grid and pins the true 73.4 via the
overnight four-times-longer window. The 0.998 thread is closed in
tl/05's body right where 51.8 prints: the untrained 0.998/0.997 scores
(canon-checked against nn/05's exact text) stand unexplained, but the
inversion is now witnessed — "training bought honesty about the one
reading the crew cannot label." Battery after: velite 0 · typecheck
11/11 · vitest 1037 · lint 15/15 · grader 80/80 · corpus 80/80 ·
e2e 4/4 serial.

New findings this round (each verified in-file before recording):

- **HIGH — GitHub push is a dead feature.** Sold on pricing, paywall,
  landing, compare, and Settings; backend routes complete
  (`/commit`, `/retroactive-push`, `/push`); **zero frontend call
  sites** — a buyer who connects GitHub gets no commits, ever. Top
  refund risk. Fix: wire commit-on-pass + retroactive button, or strip
  the claim from all five surfaces until it ships.
- **HIGH — sp/02 `deep-scan-fft` expected block is internally
  impossible.** Printed magnitudes need N=128, the framing paragraph
  pins 256 Hz (making 5/23/47 off-bin and `has(freq)` unmatchable), and
  73.4 Hz cannot yield a clean single row under any config; the
  epilogue bakes "magnitude 3.2" into canon. Fix: N=512 @ 256 Hz,
  magnitudes A×256, show the 73/73.5 split honestly (sp/05 already
  teaches why), update the epilogue number.
- **HIGH (narrative) — nn/05's untrained-0.998 mystery is the season's
  only dropped thread**, and it silently inverts (untrained: certain;
  trained: can't decide) without anyone noticing. One line in tl/05 or
  ad/01 converts it into a thesis beat.
- MED — rn/03's 72-hour memory claim vs a stateless [50,3] LSTM;
  restate in interval-series steps (the rn/05 move) or show stateful.
- MED — oe module: "85 million weights" + quantization costing
  classifier accuracy sits badly beside oe/01's (round-3) "crew models
  under a megabyte" origin line, and 94.2% is never reconciled with
  sp/04's 87 ledger. Needs one deliberate paragraph deciding what the
  340 MB artifact is and where 94.2 was measured.
- MED — FAQ #1 (and its FAQPage JSON-LD) claims the curriculum "covers
  … CNNs, and transformers" in present tense; no CNN content is
  buyable. Rescope to today-vs-coming.
- MED — finale's causality paradox ("left its source before this ship
  was built") gets no witnessed reaction; one line of light-delay
  arithmetic makes it the season's screenshot moment.
- MED — sp/01's exercise now requires rfft one lesson before the FFT
  is taught and near-duplicates sp/02's compute-fft; ad/05's detector-3
  snippet indexes `predicted[i]` past the LSTM's 3 outputs.
- Bridge-count truth: **54 entries, 49 with `breaks`** (yesterday's 55
  and today's 51 agent counts were both wrong; learn page corrected to
  54 — measure counts yourself before writing them). compare's "every
  analogy labeled" is 49/54.
- Assorted LOW: BossBeat runway empty modules 1–6 (seed one in f/05's
  keep-or-delete beat); DISPATCH silent M2–M6 (relocate one intercept);
  interval-shrink second derivative flexes with the calendar;
  engineering-chair Chekhov gun; drift-score scale mixing in cap/03;
  curriculum-preview 17.7h basis vs JSON-LD 29h; bundle math 112 vs
  stubs' 55; "Same ML syllabus" vs "separate specializations" copy.

## Bottom line

P0/P1/P2 are rock solid — independently confirmed by evaluators who did not
know what had been fixed. The product over-delivers on its marketing and is
worth its price today. What separates it from top-tier is no longer
correctness; it is Tier 1's eight small trust dents (one afternoon), and
Tier 2's seven structural investments in the story's spine and the two
weakest exercise pockets (the real P3). Content grades by module say the
ceiling is already visible: anomaly-detection is what every module should
feel like.
