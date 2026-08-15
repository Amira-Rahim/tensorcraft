# Fresh-Eyes Re-Run - 2026-07-25

> **EXECUTED 2026-07-25 (same day, remediation wave 3).** Every item in this
> ledger that does not require the owner (operator dashboards, purchases,
> the real name on /about, manual phone/light-mode pass, business decisions)
> is FIXED in the working tree. Highlights: all §3 content wrongs including
> the four unbuilt-theme items; T0 4-12; T1 13-21 (13: guest capture on
> every free-module lesson end; 14: foundations/05 now builds + runs a real
> preview model; 16: XS renderer slice only, per this ledger's own §4
> warning); T2 23-30 (30 found NINE defeatable exercises, not 7 - root
> cause was a toBeCloseTo NaN hole in BOTH harnesses, now fixed with a
> regression test); T3 32-34 (32: free-module lessons joined the sitemap
> core; 33 done as a gate, not a fallback deletion - bridge-breaks now
> extends per built theme; 34: export-model-artifact ships, corpus 86/86).
> §5's Gate-B delimiter blindness: gate rebuilt on AST statements with
> parse/artifact/count layers + red-path proofs; the 15 flattened hints (4
> hard syntax errors) restored; the capstone finale hint completed. §6's
> gate gaps all closed (EXERCISE_CORPUS in CI, describe-throw fails closed,
> theme-shape-disk pins all five themes, LAUNCHED ⊆ BUILT asserted,
> structure-variety un-anchored). §7 irreversible list: 052 (provenance
> columns), 053 (webhook idempotency), rate-limit keyed on identity,
> arena-starts-at-zero made binding; deploy-api.yml makes the §7
> break-first migration ordering mechanical. Owner-only remainder is listed
> in docs/launch-blockers.md (Tier 1-OPS / Tier 1-LEGAL / T0 items 1-3).
> Verdict unchanged: stop auditing, go transact - distribution is the
> constraint no code change moves.

**Method:** 16 independent evaluators + 16 adversarial verifiers + 3 synthesizers (37 agents, 782 tool calls). Every numeric claim re-executed rather than re-read. Findings with no verbatim file:line quote were discarded. Verifiers were rewarded for killing findings, not confirming them.

**Result:** 188 confirmed findings. **Zero CRITICAL survived verification.** 23 HIGH. Every CRITICAL raised was downgraded when a verifier opened the file.

**Ground truth executed this session (not doc claims):**
- `node scripts/validate-exercises.mjs --starters` → **85 passed, 0 failed, 0 allowlisted**
- `vitest run packages/content/__tests__` → **9 files, 218 tests, all green**
- Every `tf.*` symbol in built content (100 distinct) checked against real TFJS 4.22 → **0 invented APIs**

---

## 1. The verdict, in one paragraph

The content is done. Deep Orbit is a genuinely good product: the numbers are executable-true, the story is load-bearing rather than decorative, and the exercise corpus is honestly graded. Nothing in the shipped theme teaches a falsehood that a customer will act on and be harmed by; the ~22 real defects are copy-sized. **The two things that actually limit this business are not content quality.** They are (a) a renderer that serves the same prose on four of six steps, so the writing never reaches the reader in the shape it was written, and (b) the fact that 4 of 5 themes, seats, subscriptions, and the arena - i.e. ~90% of the revenue plan - do not exist. Another content audit round has negative expected value. Stop auditing; go transact.

---

## 2. Answers to the twelve questions

| # | Question | Answer |
|---|---|---|
| 1 | Anything taught wrong? | **Yes, ~22 items, none catastrophic.** All XS/S. Detail in §3. |
| 2 | Script quality per lesson/theme | Deep Orbit **A−** · extras **C+** (21/21 template lockstep) · 4 unbuilt themes **D+** |
| 3 | Does the script architecture make sense to a reading user? | **No - and it is a renderer bug, not a writing bug.** §4 |
| 4 | Value per lesson - worth the money? | **Yes at $59, and undersold.** ~29h, 85 graded exercises, ~$1.05/lesson |
| 5 | Clarity / attention | Clarity **high** (no term used before defined across 25 terms). Attention leaks in 4 measurable places |
| 6 | Message delivered without ambiguity? | **Yes, structurally** - thesis stored as data in `concept.explanation`; 20/20 recoverable |
| 7 | Are the themes worth the money? | Deep Orbit yes. **The other four are not sellable** and the roadmap that prices them is mispriced |
| 8 | Progression follows the storytelling? | **Yes within modules**, canon holds under grep. Scatter comes from the renderer + a 12-lesson flat stretch |
| 9 | Lesson/theme connectivity | Narratively **strong**; structurally **mostly dead metadata** (4 authored fields have zero consumers) |
| 10 | Storytelling effectiveness | **A− - the strongest thing in the product.** 19 of 22 lessons collapse pedagogically without the fiction |
| 11 | Dramatic arc enough to hook? | **Yes.** Both prior structural complaints are closed; the countdown reaches zero on-page |
| 12 | Correct/accurate material as promised? | Teaching **yes**. **Three published claims are false** - §3 |

### The single best thing in the product
`training-loop/01-loss-functions.mdx:88-97` explicitly refutes the folk "MSE's gradient goes flat" answer and derives the real one, with six numbers I verified. Better than most textbooks. Alongside it: `recurrent-networks/04-sliding-windows.mdx:53-93` (the leakage demo - deterministic, learner-verifiable, byte-exact) and `capstone/05-launch.mdx:316-320` (`interval_s: 0.0 … No operator note was ever filed`).

---

## 3. What actually teaches something wrong (shipped theme)

**Highest-cost four:**

1. **`neural-networks/01-first-neuron.mdx`** - the *first lesson behind the paywall* - ships no inline `breaks:`, so `bridge-callout.tsx:43` falls back to registry entry #35 and prints an **RNN cell / gates / hidden state** clause under the heading "Neuron", four modules before RNNs exist. Its `mlCode` at `:21` also calls `activation(...)`, which is not a TFJS export and which `:16` of the same frontmatter says is "deliberately absent here." **XS fix, worst placement in the product.**
2. **`browser-runtimes/03-model-loading.mdx:64-73`** loads a real, same-origin, fetchable URL and prints a `model.summary()` of **673 params**. Every `model.json` under `apps/web/public/models/` is **209** (3→16→8→1). Ten seconds in devtools contradicts a paid lesson.
3. **Four broken/removed JS APIs on the bridge cards** - the audience most likely to notice: `ReactDOM.render` (removed in React 19; the repo runs 19, and it never returned HTML); `caches.match(request) || fetch(...)` (returns a Promise, always truthy, fetch branch unreachable); `.then` on the synchronous `model.predict()`; a `GPUAdapter` assigned to a variable named `device`.
4. **Three published claims the corpus does not satisfy**, all on or cited by the honesty page: `/about:100-101` "if a test fails, the model behavior is actually wrong" (47 of 85 solutions contain zero `tf.`); `/about:99-100` 299 exercises "held to the same bar" (235 live in dirs Velite never compiles); `blog/audit-exercise-mlcontent.mdx:5,29` "Zero mismatches remain" / "We do not" (four `advanced`+`arithmetic` entries exist today).

**The rest (all verified verbatim, all XS):** sp/05:23 fabricated overlap-vs-resolution tradeoff (contradicted by sp/03:181 in the same module) · oe/02:66 "65,535 levels" (65,536) · br/06:72 attributes ~80MB to fp32 (~268MB; **this was made worse by its own repair** - commit `2304e33` turned a vague-but-right comment into a precise falsehood) · llm/01:73 "every provider speaks MESSAGES" while naming Anthropic, which does not · oe/05:151 credits 9× to a stack the same module proves changes no FLOPs · f/01:140 calls NCHW "the same shape contract" as the course's NHWC, in the free module · tl/03:66,164 "overnight becomes next month" against its own numbers (30 hours) · br/04:67 min-max normalizes phase, a circular variable · rn/01:20 shows a rank-2 tensor in the lesson whose thesis is the third dimension · br/01 vetoes >50MB, br/06 recommends a 50-500MB runtime · extras "Explainable **Boosted** Machine" (Boosting).

**Not reachable by any customer, but wrong** (unbuilt themes): `nova-canvas/…/04-kl-divergence.mdx:68` returns a **negative** KL · `signal-ward/…/02-reading-comprehension.mdx:104` calls `tf.layers.attention()`, which does not exist · `terra-grid/quantization/01` mixes integer and float units in one formula · `neon-protocol/…/03-intersection-over-union.mdx` prints outputs its own function does not produce.

**What is NOT wrong, despite three rounds of suspicion:** every derivable number in the shipped corpus recomputes exactly - z-scores, MSE 0.268 / BCE 0.718, the 20-step descent trace, FFT magnitudes, the COLA ripple 0.975–0.999, the Kalman gain 0.2724, the tl/05 confusion matrix reproduced over 25 fresh training runs. **This is the product's actual moat.**

---

## 4. The renderer is the gap between the writing and the reader

`lesson-steps.tsx` puts the bare string `"prose"` in **four** of the six visibility sets (`:114`, `:128`, `:138`, `:145`), and `lesson-content.tsx:224` makes prose visibility a single boolean. Consequences:

- **The 6-step loop partitions nothing.** Briefing, Concept, Code and Challenge render the identical body with a different sidebar. This is also *why three separate "everything feels the same" audit rounds could not localise the sameness in the prose - the sameness is in the renderer.*
- **Story payoffs land on the wrong screen.** The Fibonacci reveal is on-screen during the *Briefing* of the lesson named after it. `capstone/05-launch.mdx:250`, the paragraph answering the season's oldest mystery, renders on Briefing and is **absent** from Consequence.
- **The task brief precedes the teaching in all 56 lessons** - "Now it's your turn. Create your first tensor" renders on Briefing, before the word tensor is defined.
- 30 headings across 27 lessons are followed by nothing on the Concept step; 14 sentences point at code that is not on screen.

**Important counter-argument, and I agree with it:** this appeared as HIGH in five lenses, all reading the same four lines - one finding corroborated with itself. It is XL, it touches the renderer whose last structural change had to be reverted, and three live mechanisms are direct-child selectors a `<Section>` wrapper breaks. **Ship only the XS slice (hide `## Challenge` onward from steps 1–3) and stop until real completion data exists.**

---

## 5. Are the prior P0/P1/P2 and Tier fixes rock solid? - your primary question

**Yes, with three exceptions. Confidence HIGH for code and content at HEAD, MEDIUM for operator/dashboard state, LOW for the unbuilt corpus.**

**Held, verified at byte level:** 27 of 27 numeric checkpoints re-executed · `tf.quantize`/`tf.linalg.svd` gone (the surviving mention *teaches that the API does not exist* - correct) · 673 canon with zero surviving 209s · em dashes 0 · `nextLessonTeaser` gone · the renderer P0 that crashed 8 lessons closed with a self-catching test · money path sound (`purchaseStatusForSession`, terminal `failed`, certificates gate on a real purchases row) · migrations 040/049/051 do what their headers claim, and **051 makes the hard call correctly** (transaction-local GUC escape hatch, not a blanket service-role exemption) · Dockerfile R3-1 genuinely dead · all six of R3-4 a–f real in the bytes · every Run #3–#8 teaches-wrong item holds · the entire protect list intact and the guns fired.

**Three regressions - every one introduced by a fix wave, not by drift:**

1. **Run #7's headline claim is false.** "All 77 hint ladders now produce passing code" rests on Gate B, which is one-directional (hint ⊆ solutionCode) and cannot see an *incomplete* ladder. The Run #8 remediation's own capstone retarget shipped a solution hint missing four declarations its excerpt depends on. **Gate B is green.** This is the last-resort hint on the final lesson of the only purchasable theme.
2. **br/06's ~80MB was made worse by its repair** (`2304e33`) - vague-but-right became precisely wrong.
3. **llm/01's currency fix overshot into a false universal.**

Plus two recorded owner *conditions* never converted into checks and therefore violated: the certificate page labels the decorative hash "Verification hash" (accepted **on the condition** it never be described publicly as one), and neon-protocol's 55-vs-54 count has survived three audits as "stale."

**Independently found this session (not in any prior ledger):** 15 of 77 solution hints carry newline→`; ` flattening artifacts; 2 are hard syntax errors if copied (`,;` inside an object literal). **Gate B cannot see them because its fragment delimiter is `;` - the exact character the corruption introduced.**

**Unverifiable from the repo (blind spots, not clean bills):** whether migrations 037–051 are applied · whether the 046 JWT hook is enabled · Stripe dashboard state (receipts, SEPA/bank-transfer, default `tax_behavior`) · the shipped runtime in a real browser (85/85 was proven under Node `worker_threads`; exactly 1 exercise proves the browser path) · the 219 unbuilt lessons.

---

## 6. Gates that are green while measuring something narrower than they claim

| Gate | Claims | Actually asserts |
|---|---|---|
| `bridge-breaks.test.ts` | every bridge resolves a breaks label | that *some* label resolves - never the right concept. **nn/01, the first paid lesson, renders RNN text.** Also hardcoded to deep-orbit + literal `55` |
| Gate B `metadata-consistency.test.ts:212` | "a wrong solution hint is unrepresentable" | hint ⊆ solutionCode. No completeness check, no parse check, and **splits on the character that corrupts hints** |
| `exercise-corpus.test.ts:33` | full corpus through the shipped runtime | `describe.runIf(process.env.EXERCISE_CORPUS === "1")` - **zero hits for that var in `.github/`.** The shipped runtime has no CI coverage |
| `lesson-shell.test.tsx:47` | pane hidden so it cannot mount twice | `className` contains "hidden". Two Sandpack editors mount at every viewport |
| `audit-structure-variety.mjs:33` | per-module variety | `CONTENT_DIR` hardcoded to deep-orbit; `moduleOf` returns `".."` for every other theme |
| `interval-canon.test.ts:88` | every interval mention matches canon | regex misses `73.4 s`, `73.4-second`, spelled-out. A **live** 30.0-vs-29.7 split sits in capstone/05 under a green gate |
| `module-counts.test.ts:60` | shape matches disk | iterates built themes only; four `THEME_SHAPE` rows pinned by nothing |
| both exercise harnesses | individual `it`s handle errors | a throw in a `describe` body **silently drops every later `it`**, and `exercise.tsx:512` then reports "All tests passed!" |
| the mlContent taxonomy | "when we change an exercise, the gates rerun" | **no such gate exists** |

**Unguarded entirely:** 219 lessons + 235 exercises · the paid product in a browser (no auth fixture; 52 of 56 paid lessons never loaded by a browser gate) · light mode beyond axe (`colorScheme: "dark"` pinned globally) · axe at any mobile viewport · `checkout.session.async_payment_succeeded` (zero test hits) · metrics and alerting (zero) · scheduled work (`skill_events` partitions end **2027-04-01**, `ensure_skill_events_partitions()` has zero callers) · `LAUNCHED_THEMES ⊆ BUILT_THEME_DIRS` asserted nowhere.

---

## 7. Can this skeleton reach 100,000 paying users?

**No. Architecture ceiling ~30–50k paying / ~5k DAU. Commercial ceiling 5–10k. The binding constraint is 5–10k, and it is not the servers.**

**Why the architecture is better than 5k:** one entitlement funnel (`entitlements.ts:26`, whose docblock already anticipates the seat swap) · indexes pre-built while tables are empty (migration 045 dodges `CREATE INDEX CONCURRENTLY` later) · egress closed (1.4MB TFJS + models `immutable`, middleware matcher excludes them). These are correct instincts at the correct time.

**Why it caps at 30–50k** - bounded, known, already-triaged in `post-launch-backlog.md` §9: lesson route is full SSR (0 of 56 prerendered; the `page.tsx:29-32` "edge cache" comment is false) · 60 unwrapped `auth.uid()` RLS predicates · the dashboard issues the **same `streaks` query twice** (`page.tsx:64` and `:93`, the second blocking) and the same `purchases` query twice, and rebuilds a module→lesson map ~4,400 times · `exercise_attempts.submitted_code` unbounded · health check gates Fly liveness on a `count: "exact"` over `profiles` every 10s · rate limiting per-IP, in-memory, per-machine.

**Why the real ceiling is 5–10k:** there is exactly one purchasable product. `LAUNCHED_THEMES = ["deep-orbit"]`; the $99/$129/$159 tiers are `disabled` until `launchedThemeCount >= 5`. **Seats: zero lines** (verified - every `org`/`team`/`seat` hit is schema.org JSON-LD or a CSS comment). **Arena: one table** (migration 048) and no application code. Your own `roadmap.md:57` does the arithmetic correctly: 100k × ~$200 CAC vs ~$100 one-time LTV = *insolvent by construction*. That is right and I am not softening it.

### The irreversible list - do these now, they are exponentially more expensive later

| # | Decision | Retrofit cost | Cost now |
|---|---|---|---|
| 1 | **Who paid for whom.** Every row is stamped only `user_id`. Add nullable `granted_by_org_id` + `entitlement_id` to `purchases`/`certificates` | **UNRECOVERABLE** for all prior periods | XS |
| 2 | **Entitlement cannot express time or grantor.** `grep valid_until\|granted_by migrations/*.sql` → **zero hits**. Add the nullable columns now; defer the table | HIGH | S |
| 3 | **JWT revocation semantics.** Decide now, at zero customers: entitlements in the claim for read paths, always re-check DB for money/certificates. Also **enable the 046 hook** - it is written, tested, inert, and unenabled | MEDIUM | XS |
| 4 | **Arena must never seed from historical scores.** All current scoring is client-reported and forgeable. Write "arena starts at zero" into the contract | one item unrecoverable | XS |
| 5 | Rate-limit key → identity, not IP (naive fix is a no-op: the middleware runs before auth) | MEDIUM | S |
| 6 | Webhook idempotency key (`payment_events(stripe_event_id unique)`) | MEDIUM | S |

**Migration 048 got the one genuinely irreversible arena thing right** - `arena_submissions` has no insert/update/delete policy at all, so service_role is the sole writer. That trap is closed. Good work.

### Where it breaks FIRST
**User #1, deploy day - migration ordering.** `payments.ts:731-733` and `:1090-1096` write tax columns **unconditionally** (only `taxSessionParams()` is flag-gated); those columns exist only in 047. `:998` calls `restore_purchase_after_dispute`, which exists only in 051. Deploy the API before applying 037–051 and **every checkout webhook 500s** - charged customers, no purchase row. The only guard is a human remembering a runbook step during a manual `fly deploy`, with no deploy workflow in `.github/workflows/`.

---

## 8. The cost of themes 2–5 - the number your business plan rests on

`packages/content/src/built-themes.ts:13` says launching a theme is one line with "no per-test edits." **This is false at HEAD and it is mispricing your roadmap.**

Verified counts across the 219 unbuilt lessons:

| Item | Scale | Why it is not mechanical |
|---|---|---|
| Lesson-close conversion | **219/219** | All close on `<KeyTakeaways>` (219) and 51 carry `<Quiz>` - **neither is in any step visibility set.** 0 `<LessonRecap>`, 0 `<Epilogue>`, 1 `<RecallPrompt>`, 2 `scene:` sluglines, 0 `pattern:`. **Step 5 renders literally empty in every one.** Net-new authoring |
| Hint ladders | **195/195 fail Gate B** | Prose, not excerpts. One verified example teaches `input * Wq`, which is elementwise multiply in TFJS and throws |
| Hard-walled lessons | **16** | Continue gate counts an exercise the page never embeds → learner sees "Exercise not found" and **can never leave the Challenge step** |
| First-ever fact-check | **all 219** | A 12-lesson sample produced 5 defects. Deep Orbit needed **four** adversarial rounds to reach its first zero-error pass |
| Character registry | 520 of 626 speakers absent from the manifest | only deep-orbit has avatar slugs |
| Missing breaks panels | 28 | falsifies the unqualified absolutes on `/learn:82` and `/compare:148` the day theme 2 ships |

Word density is 26–41% below Deep Orbit. **Estimate: 12–20 focused weeks per theme, and treat that as a floor** - the single-pass fact-check line is the least defensible part of it.

---

## 9. What no lens looked at - and what it means

The completeness critic's strongest point: **the audit keeps examining the part that is working.**

- **Kit lifecycle emails** - authored in Kit's dashboard, never read by anyone. Highest ratio of customer-facing words to reviewed words in the product. **30-minute read.**
- **Email capture exists only on pages nobody can buy from.** None on `/`, none in the 5-lesson free module, none where it ends, none on the blog.
- **`sitemap.ts:15` is `"core"`** - zero lesson pages indexed, deliberately. Total indexed surface: ~22 URLs + 4 blog posts, 3 of which are self-audits.
- Three of five onboarding survey fields are **write-only** (`learning_goal`, `fe_background`, `fe_experience_years` have no consumer).
- No purchase-confirmation email exists in code; Stripe's own receipt is an unverified dashboard toggle.
- No named human on the honesty page.

**At a generous 2% conversion, 100,000 paying users requires ~5 million qualified visits. There is no mechanism in this repository that produces 5,000.** The binding constraint is distribution, and distribution is not a code change.

---

## 10. The plan

### T0 - before you take a single real payment
| # | Action | Effort |
|---|---|---|
| 1 | **Apply migrations 037–051, then make the ordering mechanical.** Add `SUPABASE_URL`+`SUPABASE_SERVICE_ROLE_KEY` to GitHub secrets; create `.github/workflows/deploy-api.yml` with `pnpm migrate:status` as a fail-closed prerequisite | M |
| 2 | **Read the Kit lifecycle emails. Confirm the Stripe receipt toggle.** Then check whether SEPA/bank-transfer is enabled - if off, the async-settlement hole is dead code | S |
| 3 | **Buy your own product, twice** - real card, real browser; then again on a real phone in light mode. Read every email that arrives | S |
| 4 | Fix `nn/01`'s bridge: `mlCode` → `tf.dot(inputs, weights).add(bias)`, add an inline `breaks:`. **Do not edit `:16`** | XS |
| 5 | Point `browser-runtimes/03` at `/models/deep-scan-preview/model.json` and print the real 16/8/1 summary (64/136/9 = 209). **Do not renumber 673** - it is load-bearing in 16 story sites | XS |
| 6 | Log `asyncUpsertError` and return non-2xx (`payments.ts:1080`) so Stripe retries instead of a silent permanent lockout | XS |
| 7 | Fix the three false claims on `/about` + the audit blog post | S |
| 8 | Drop the unmeasurable "20% used" refund condition from all three surfaces; add a `support@` route for refunds | XS |
| 9 | Complete the capstone finale solution hint (4 missing declarations); fix the 4 unparseable extras hints | XS |
| 10 | Put a real name on `/about`; rename the certificate "Verification hash" | XS |
| 11 | Disclose that solution repos are created **public** at the consent moment | XS |
| 12 | One content sweep: the ~12 verified wrong statements in §3 | S |

### T1 - before any ad spend
13. **Email capture where the free trial actually ends** (currently a grey "Back to Mission Map" link) - M
14. **One real ML exercise in the free module.** All five free exercises are `mlContent: data`; the $59 decision is made after a tensor-API tutorial - M
15. Render solution hints as code, not a wrapped sans-serif paragraph (74 of 77 are code-shaped; longest is 1,031 unbroken chars) - S
16. XS renderer slice only: hide `## Challenge` onward from steps 1–3 - S
17. Add nullable `valid_until`, `granted_by_org_id`, `entitlement_id` (migration 052); enable the 046 JWT hook - S
18. Run the shipped exercise runtime in CI (`EXERCISE_CORPUS=1`) - S
19. Harden Gate B: parse check + completeness; assert it still produces 77 cases after any hint edit - S
20. **Correct `built-themes.ts:13`** and write `docs/theme-launch-checklist.md` with the measured counts from §8 - S
21. Normalize the skill genome (`039:111` multiplies a raw sum by 2 and clamps - five of six axes pin at 1.00 for every customer) - M
22. Manual light-mode + 375px pass on the eight core routes - S

### T2 - before scale
23. Un-anchor `audit-structure-variety.mjs` and `bridge-breaks.test.ts` from deep-orbit · 24. Seeded-auth e2e + light/dark project split · 25. Split readiness from liveness; stop the `profiles` count scan · 26. Merge the duplicate dashboard queries; add `React.cache` · 27. Add a scheduled job runner before the 2027-04 partition cliff · 28. Key rate limiting on identity · 29. Webhook idempotency key · 30. Harden the 7 exercises defeated by constant returns

### T3 - competitive edge
31. **Decide theme 2: build it or re-price without it.** The $159 bundle is 12–20 focused weeks away and its checkout is already `disabled` in source · 32. Treat the blog and sitemap as the acquisition product · 33. Delete the bridge registry fallback; require inline `breaks` · 34. Ship a model-export exercise so "walk out with a deployable model" is true (zero of 85 exercises touch `.save()`) · 35. Full prose partition - **only after ~100 real lesson completions prove it costs conversion**

---

## 11. Protect - do not touch in a fix wave

Executable-true numbers (the moat) · `training-loop/01:88-97` · `recurrent-networks/04:53-93` · `neural-networks/05:102` (the 673→833 reconciliation - this is the house pattern for every shape seam; apply it, do not reinvent it) · the five epilogues (rn/05, ad/05, br/05, nn/05, cap/05) · ARIA's entire line inventory · the interval ticker spine · voice separation (zero verbatim line reuse across 174 blocks) · the no-fabricated-testimonials posture · Gate B and the empty exercise allowlist.

## 12. Fix-wave discipline

This project's documented rule - *"fix waves introduce defects at roughly the rate they remove them"* - was visible **inside this audit**: verifiers killed three proposed fixes that would have broken production (the Dockerfile `dist/` switch → boot failure; a naive `useMediaQuery` → SSR flash on the graded step; widening the `interval-canon` regex → ~30 false positives).

**Sequencing:** content edits (XS, no gate coupling) → SQL migrations (isolated, paired `.down.sql`) → API/webhook (tested) → renderer (last, smallest slice, manual pass).

**Never mix a renderer change and a content change in one commit.** Commit `2304e33` is the cautionary case in this repo: a broad content sweep turned a vague-but-roughly-right `~80MB` comment into a precise-and-wrong one. Large mechanical passes over files nobody re-reads are how this project generates its own next audit.
