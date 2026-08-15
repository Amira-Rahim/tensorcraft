# Copy Humanization Audit - 2026-06-10

Deep audit of all user-facing copy: 297 lesson MDX files (5 themes + extras), bridges/hints/quiz/exercise data, marketing pages, in-app UX, emails. Six parallel auditors; ~120 files read in full plus corpus-wide pattern greps.

## Headline verdict

**Lexical AI tells are already gone.** Prior scrubs (2026-04-21, 2026-04-27 audits) worked: zero "delve", "seamless", "leverage", "In this lesson", "It's worth noting", paragraph-initial "However/Furthermore/Moreover" across 297 files. The website is top-decile human - opinionated, numerate, no fake social proof, no FAQ boilerplate.

**The remaining AI smell is structural, not lexical.** One authoring template stamped 297 times, one analogy stated 3–6× per lesson, one dialogue machine where the student is never wrong, one contraction-free voice shared by every character, and a handful of templated micro-copy strings (hints, bridge openers, teasers) repeated at machine-detectable frequency.

---

## Cross-cutting findings (ranked by severity)

### 1. The validated-guess dialogue machine - CRITICAL
Every theme runs the same three beats: mentor poses problem → student guesses the frontend analogy (often with trailing ellipsis: "Gates... like a cache with TTL?") → mentor confirms ("Exactly." / "Precisely." / "That is a remarkably good analogy, Ensign."). Corpus grep: 38 confirmation openers, **28 of them landing on lines 46–50 of their file** - the same structural slot across themes. The student's analogy is never wrong; no disagreement survives two dialogue turns.

The fix material already exists: the frontmatter `breaks:` fields contain exactly the friction (where each analogy fails) - currently hidden in metadata the characters never voice.

### 2. Analogy stated 3–6× per lesson - HIGH
Each lesson asserts its FE↔ML bridge in: frontmatter `explanation`, frontmatter `bridge`, dialogue, post-dialogue prose, BridgeCallout, code comments, and KeyTakeaway #1. Example: the IoU lesson says "same math as drag-and-drop collision detection" at lines 13, 20, 48, 51, and 207. "same pattern / identical / does the same" family: ~65 hits per theme. KeyTakeaway #1 restates the bridge in 26/55 (nova-canvas) and 30/55 (terra-grid) lessons.

### 3. One lesson skeleton, 297 files, zero deviation - HIGH
Dialogue cold-open → "You already know this" second-person bridge paragraph → LearningObjectives (always exactly 4) → BridgeCallout → CodeBlocks → Challenge → KeyTakeaways (always exactly 4, perfectly parallel). No lesson ever opens mid-incident, with failing code, with a number, or without dialogue. The "You have/You already [FE skill]… [ML thing] is the same pattern" narrator opener appears in ~90 of 110 nova/terra lessons and 24/56 deep-orbit lessons.

### 4. One voice for all characters - HIGH
Contraction-free formal register everywhere (nova-canvas: 93 stilted forms vs 28 contractions; terra-grid 79 vs 22). Erdem ↔ Hassan are the same maxim-dispensing ops lead; Vikram ↔ Zara interchangeable; Khalil/Noor/Demir exist only to volunteer analogies. MUSE speaks in pure ChatGPT-poet koans ("From chaos, structure. From noise, signal. From nothing, everything." - 16 of these).

**Voices that work (models to copy):** NEON's sarcasm ("Congratulations. You can detect drones. Slowly."), GRID's numeric telemetry, MEDI's clinical warnings, Nazari's budget-minded annoyance ("Twelve were cosmic background radiation. I am not doing that again.").

### 5. Templated micro-copy - HIGH (high exposure surfaces)
- **88 of ~150 nudge hints** start "Think about..." (53) or "Think of..." (35) - shown repeatedly to stuck learners.
- **50 of 52 bridge `connection` entries** in `packages/shared/src/bridges.ts` open "Both \<verb\>..." - powers public /glossary and /compare (SEO surface).
- **232 `nextLessonTeaser`s** follow "Next: \<topic\> - \<clause\>".
- **5/5 DispatchTease blocks** use "Different X, same Y" antithesis + "Continue the thread." closer.
- Quiz wrong-answer string `"Not quite - try again"` (packages/ui/src/mdx/quiz.tsx:146) - the canonical AI-tutor phrase, hundreds of exposures per learner.

### 6. Em-dash density + staccato metronome - MEDIUM-HIGH
~2,700 em-dashes across content (~12–14/file). Default rhythm: "short declarative. short declarative. em-dash elaboration." Plus "Same X. Different Y." fragments and rule-of-three escalations throughout.

### 7. Coronation outros + stock drama - MEDIUM
"You think like an ML engineer now" appears in deep-orbit AND signal-ward capstones; "the foundations of ML are yours"; "a path you have walked"; "Farah's hands are shaking"; "The crew holds their breath"; terra-grid capstone repeats its catchphrase 4× in one file.

### 8. Website-specific (small, concentrated) - MEDIUM
~8 bad lines + a credibility problem:
- "Every theme, every specialization. Complete ML mastery across all 5 domains." - pricing-tiers.tsx:421 (the BEST VALUE card)
- "Simple, Fair Pricing" H1 + 5 metadata echoes - pricing/page.tsx:277
- "Continue Your ML Journey" + "Unlock..." - paywall/page.tsx:24–25, 94
- "Start the journey →" - five-worlds-section.tsx:342; "...journey from frontend engineer to ML engineer" - themes/[slug]/page.tsx:284
- **Number contradictions:** about JSON-LD says "297 lessons" (truth: 275); pricing JSON-LD says "~60 lessons" vs 55 shown on the same page. Wrong specifics hurt this brand more than vague copy would.
- **Staleness bombs:** "Deep Orbit launches today" (themes/page.tsx:14, :64), "LIVE TODAY" (five-worlds-section.tsx:323), "Launch cohort open" (landing-hero.tsx:40 - no cohort exists).
- Stray errors bypassing `lib/error-messages.ts`: "Authentication failed. Please try again." (auth-form.tsx:303), "Unexpected error completing onboarding." (onboarding/page.tsx:233), three raw "Not authenticated" (settings-form.tsx).
- Register breaks: "Let's Begin →" in the military-briefing onboarding (onboarding/page.tsx:384), "Stay in the loop" (newsletter-modal.tsx:90), hint-panel emoji 💡🧭✅ in a brutalist mono UI.
- Dead file: components/hero-section.tsx (unused legacy hero).

### 9. Coverage gap
Lifecycle email copy (welcome, first-lesson, capstone, digest) lives in Kit, not the repo - only event tags are in code. Unaudited; review in Kit dashboard with the same checklist.

---

## What already reads human - protect these

- **`breaks:` frontmatter fields** - the best writing in the product. Specific, anti-hype, argues against its own analogies.
- **Quiz explanations** - varied openers, real numbers, rebut each wrong option specifically.
- **Numeric continuity** (73.4 Hz, 340MB→42MB, 673 params, $0.50/MB satellite link, "Forty-three seconds. I timed it.") - a spine generic AI content never has.
- **lib/error-messages.ts** - "what happened + what to do," zero apology theater.
- **unsubscribe page, compare page, pricing anti-sell footer** ("What you don't get: ... fast.ai and Karpathy's Zero-to-Hero are excellent and free."), settings magic-link explainer, purchase-success, inbox empty state.
- **The diegetic UI chrome** (// MISSION BRIEFING, Fade Out, Next Mission) - distinctive, consistent.
- **Hero headline** "ML Speaks JavaScript. / Turns Out You're Fluent." - protected iterated baseline; do not touch.

---

## Prioritized fix plan

### P0 - Website - **DONE 2026-06-10** (all items below shipped; typecheck + vitest green)
1. Rewrite pricing BEST VALUE card line → "All five specializations - time-series, vision, NLP, generative, edge. 275 lessons, 5 capstones, one payment."
2. Replace "Simple, Fair Pricing" → e.g. "Buy a theme. Keep it forever." (carry into OG/twitter metadata).
3. Fix number contradictions - derive lesson counts from constants/THEME_CONTENT everywhere (about JSON-LD 297→275, pricing JSON-LD ~60→55).
4. De-stale launch copy ("launches today", "LIVE TODAY", "Launch cohort open" → time-safe phrasing).
5. Paywall: "Continue Your ML Journey"/"Unlock" → specific in-voice copy; fix lesson-paywall "purchase access to unlock" redundancy.
6. Replace quiz "Not quite - try again"; route stray error strings through error-messages.ts; fix register breaks (Let's Begin, Stay in the loop, hint emoji); kill "journey" CTAs; delete dead hero-section.tsx.

### P1 - Content, structural - **DONE 2026-06-10** (all items below shipped across 5 themes + extras + bridges.ts; velite + typecheck + 749 vitest green; ~200 MDX files touched)
7. **Break the validation loop in ~40 lessons:** make the student's analogy wrong/half-right sometimes; move `breaks:` friction into the mentor's mouth. Delete "That is a remarkably good analogy, Ensign."
8. **Dedupe analogies to ≤2 statements per lesson:** BridgeCallout owns it; ban from KeyTakeaway #1 (replace with a concrete operational detail the lesson earned).
9. **Kill coronation outros + stock drama** (~15 spots across capstones): replace with understatement + shipped numbers.
10. **Rewrite MUSE's 16 koans** (constraint: MUSE only observes its own internals, with numbers); delete GRID's koan slips.
11. **De-template micro-copy:** 88 "Think about/of" hints (reference the learner's actual code/API instead); 50 "Both \<verb\>" bridge openers in bridges.ts (≤10 may keep "Both"); vary 3 of 5 DispatchTeases.

### P2 - Content, rhythm + voice - **DONE 2026-06-10** (items 12–15 shipped: 65 opener rewrites across 6 content areas, em-dashes 3,154→1,546 (−51%, prose-only cuts deeper), register/contraction pass ~100 dialogue blocks, headings/labels/maxims fixed; velite + typecheck + 749 vitest green. Item 16 (Kit lifecycle emails) NOT done - copy lives in the Kit dashboard, not the repo; needs manual review there.)
12. **Vary openers in ~half the offending lessons** (~60 of 114): rotate 5 entry shapes - cold incident, number, failing code, character disagreement, no dialogue.
13. **Em-dash diet:** target ~40% reduction; convert "claim - restatement" appositives to periods/parentheses; break the staccato metronome.
14. **Per-character registers:** allow contractions; differentiate Erdem from Hassan, Vikram from Zara; give sidekicks tics beyond analogy-guessing. SW = clinical/terse, NP = noir/clipped.
15. Kill "The X of Y" headings, "The key insight:" labels, "Here's a secret/fact" hook openers (extras), "You now have..." consequence template (8 extras files).
16. Audit Kit lifecycle emails (outside repo).

## Per-surface detail
Full per-theme findings (worst examples with file:line, before→after rewrites) preserved in the audit transcripts; worst-example lists above are representative. Key files: packages/shared/src/bridges.ts, packages/ui/src/mdx/quiz.tsx, apps/web/app/pricing/, apps/web/app/paywall/, packages/themes/src/*.ts.
