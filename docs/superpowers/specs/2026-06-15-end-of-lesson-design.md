# End-of-Lesson Redesign (structured recap + active-recall self-check)

**Date:** 2026-06-15
**Status:** Approved design, pending implementation plan
**Scope:** The lesson close (Takeaways step). Stream B of the lesson-overhaul effort. Builds on the reading-experience stream (the Takeaways step already renders a left column + a right rail with the glossary recap + progress).

> **2026-08-15:** the extras dir (then 21, later 23 lessons) was removed with
> /extras (owner decision). "Built lessons" is deep-orbit's 56 only; the
> 77-lesson figures below are historical.

## Problem

The lesson close has two weaknesses:

1. **The summary is not a great refresher.** Every deep-orbit lesson (56/56) ends with `<KeyTakeaways>`, a flat 4-5 bullet list. The bullets mix transferable concepts with story-specific facts (e.g. "The DEEP SCAN attention reveals focus on the amplitude spike"), so the recap is not a clean, scannable "here is what you learned." There is no structure, no link to what the learner set out to do, and it does not use the new glossary.
2. **The knowledge check is weak and inconsistent.** `<Quiz>` (single multiple-choice) appears on only 20/56 lessons. Recognition MC is one of the weakest retention tools, the inconsistent presence feels random, and it adds clutter with no stakes or follow-through.

## Goals

- Replace the flat takeaways with a **structured recap** that is a genuinely useful refresher: transferable concepts (story stripped), the one FE->ML bridge, and a capability statement tied to the lesson's objective.
- Replace recognition MC with **active-recall self-check** on every lesson (retrieval practice beats recognition), placed before the recap (retrieve, then review).
- Keep the close uncluttered and consistent across all lessons.
- Reuse what exists: the glossary rail (key terms already live there), the `RecallPrompt` component (built, unused), bridge frontmatter (`feTitle`/`mlTitle`).

## Non-goals

- No change to step gating/scoring, exercise flow, JSON-LD, routes, or pricing.
- No new assessment that blocks progress or persists a grade. The self-check is non-blocking and self-rated.
- Other 4 themes' lesson content is excluded from the Velite build; content migration targets the **built** lessons now: **deep-orbit (56, incl. the 5 capstone lessons) + extras (21) = 77 lessons**, matching velite's `LAUNCHED_THEME_DIRS = {deep-orbit,extras}`. Coming-soon themes are migrated when they launch (tracked in dev-plan).

## Design

### A. Structured recap: `LessonRecap`

New MDX component `LessonRecap` replaces the flat `KeyTakeaways` at the lesson close. Three fixed parts:

```tsx
interface LessonRecapProps {
  whatYouLearned: string[];   // 2-3 transferable concepts, story stripped
  bridge: string;             // one FE->ML mapping sentence
  youCanNow: string;          // capability statement tied to the lesson objective
}
```

- **What you learned**: 2-3 plain, transferable points (no story/character/DEEP-SCAN specifics).
- **The bridge**: one sentence mapping a frontend idea to the ML idea. Seed from the existing `concept.bridge.feTitle`/`mlTitle`; author a clean sentence.
- **You can now...**: one capability line, seeded from the lesson's learning objective.
- **Key terms are NOT in the recap** (the right rail already shows the lesson glossary with definitions; no duplication).
- Brutalist styling consistent with `KeyTakeaways` (left primary accent border, mono kicker "Lesson recap", section sub-labels). Inline code in the bridge uses the chip style from the reading-experience stream.

Authoring: each lesson's MDX gets a `<LessonRecap whatYouLearned={[...]} bridge="..." youCanNow="..." />` block. Content migration converts the existing `KeyTakeaways` bullets into `whatYouLearned` (filtered to transferable points, rewritten), and adds the bridge + capability lines. No em dashes (style bible rule 6).

### B. Active-recall self-check: `RecallPrompt`

**Component reconciliation (important):** there are two `RecallPrompt` files. The one lessons actually use is the app-level `apps/web/app/components/mdx/recall-prompt.tsx` (registered in `lesson-content.tsx`), which today has only a Reveal/Hide-answer flow and **no self-rate buttons**. The unused `packages/ui/src/mdx/recall-prompt.tsx` copy has got-it/review but is not wired anywhere. **This stream enhances the live app-level component**; the `packages/ui` copy is left alone (note it as unused; deleting it is out of scope).

Enhance the live `RecallPrompt` (`{ question, answer }`): after the answer is revealed, show two self-rate buttons "Got it" / "Review again" (matching the approved mockup). Render it on **every** built lesson, **first** in the Takeaways-step column (before `LessonRecap`).

- Authoring: each lesson gets one `<RecallPrompt question="..." answer="..." />` targeting the lesson's core idea. For the 20 lessons with a `<Quiz>`, convert the question into a recall prompt (the MC stem becomes the recall question; the correct option + explanation become the answer). The remaining built lessons get a new prompt.
- **Analytics**: `RECALL_ANSWERED` already exists and `trackRecallAnswered(action, context)` already exists with payload `action: "revealed" | "hidden"`. To capture the self-rate without a new event: **widen the `action` union to `"revealed" | "hidden" | "got-it" | "review"`** in both `analytics-events.ts` and `analytics.ts`. Add an optional `onAnswer?(result: "got-it" | "review")` prop to the live `RecallPrompt`; wire it in `lesson-content.tsx` (mirroring the existing `Quiz` -> `trackCheckpointSubmitted` wrapper) to call `trackRecallAnswered(result, { themeId, lessonId })`. Reveal/hide may also fire the existing actions. Non-blocking, best-effort.

### C. Remove the MC quiz from the close

- Remove the `<Quiz>` blocks from the built lessons (20 in deep-orbit; plus any in extras).
- Update the Takeaways-step visibility set. Note: this step uses a **single** `TAKEAWAYS_COMPONENTS` set (there is no LEFT/RIGHT MDX split here, unlike Concept/Code/Challenge; the right rail is app components rendered directly). Drop `Quiz` and `KeyTakeaways` from `TAKEAWAYS_COMPONENTS`, add `LessonRecap`; `RecallPrompt` and `NextLesson` stay. Also update the **two** stale in-code comments in `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-steps.tsx` (~line 89 referencing a non-existent `TAKEAWAYS_LEFT`, and ~line 111 "Quiz lives here only") that reference Quiz in the Takeaways set.
- **Order** (self-check before recap) is enforced by MDX authoring order: the `RecallPrompt` block precedes the `LessonRecap` block in each lesson body. The step renders one MDX stream in authoring order (no fixed slots), so the content guard test asserts both presence AND ordering rather than introducing a slot split.
- **Do not delete** the `Quiz` and `KeyTakeaways` components or their MDX registration: coming-soon theme MDX (excluded from the build) still references them and would fail to compile when those themes launch. Mark both components deprecated in a comment and stop using them in deep-orbit. Track migrating the other themes off them in dev-plan. The `checkpoint_submitted` analytics event stays defined (no longer fired by deep-orbit).

## Components

**New:** `LessonRecap` (`packages/ui/src/mdx/lesson-recap.tsx`) + export + MDX registration in `lesson-content.tsx`.

**Modified:** live `RecallPrompt` (`apps/web/app/components/mdx/recall-prompt.tsx`: add Got it/Review buttons + `onAnswer` callback), `analytics-events.ts` + `analytics.ts` (widen `RECALL_ANSWERED.action` union), `lesson-content.tsx` (register `LessonRecap`; wrap `RecallPrompt` to wire `onAnswer` -> `trackRecallAnswered`, like the existing `Quiz` wrapper), `lesson-steps.tsx` (`TAKEAWAYS_COMPONENTS`: add `LessonRecap`, drop `Quiz`/`KeyTakeaways`; fix stale comment).

**Deprecated (kept):** `Quiz`, `KeyTakeaways` (still referenced by unbuilt coming-soon theme MDX). The unused `packages/ui/src/mdx/recall-prompt.tsx` is left as-is.

**Content:** 77 built lessons migrated (deep-orbit 56 incl. capstones + extras 21): add `RecallPrompt` + `LessonRecap`, remove `Quiz`/`KeyTakeaways`.

## Phasing (informs the plan)

1. `LessonRecap` component + tests; `RecallPrompt` `onAnswer` + `trackRecallAnswered` + tests.
2. Wire into `lesson-content.tsx` + `lesson-steps.tsx` (Takeaways left set + order); update existing lesson tests.
3. Content migration of the built lessons (deep-orbit + extras), in per-module batches, with a quality bar (transferable points only, story stripped, accurate bridge + capability, one solid recall Q/A). Remove `Quiz`/`KeyTakeaways` usage as each lesson is migrated. Include the 5 capstone lessons (same Takeaways step).
4. e2e + docs + full verification.

## Testing

- **vitest:** `LessonRecap` (renders the 3 sections, code chip in bridge, no crash on empty arrays); `RecallPrompt` (reveal flow + Got it/Review buttons appear after reveal + `onAnswer` fires with the chosen result); a content guard test that scans the **built** lesson dirs (deep-orbit + extras, matching `LAUNCHED_THEME_DIRS`) asserting every built lesson has exactly one `RecallPrompt` and one `LessonRecap`, the `RecallPrompt` appears before the `LessonRecap`, and zero `Quiz`/`KeyTakeaways` remain. This enforces migration completeness + ordering.
- **Update** existing `lesson-steps`/`lesson-content` tests for the new Takeaways left set + order; keep step-state assertions green.
- **e2e:** on the Takeaways step, the self-check appears above the recap; revealing the answer works; the recap shows the 3 sections; no `<Quiz>` MC renders.
- All suites green before done (repo rule).

## Documentation

- `docs/story-style-bible.md`: authoring note for the lesson close (RecallPrompt first, then LessonRecap; what belongs in each recap part; story stays in the Epilogue, not the recap).
- [the product roadmap](../../../ROADMAP.md): record deferred migration of the other 4 themes off `Quiz`/`KeyTakeaways` onto `RecallPrompt`/`LessonRecap` (gated on launch); note `Quiz`/`KeyTakeaways` are deprecated-but-retained.

## Risks / open questions

- **Content scale:** 56 lessons is real writing. Phase by module; enforce completeness with the content guard test. The bridge/objective frontmatter and existing takeaways seed the work, but each needs a human-quality pass.
- **Order enforcement (decided):** the Takeaways step renders one MDX stream in authoring order via a single `LessonContent` instance; there are no cheap "fixed slots." So order is enforced by authoring (RecallPrompt block before LessonRecap block) AND asserted by the content guard test. No slot split.
- **Deprecated components retained:** `Quiz`/`KeyTakeaways` stay to avoid breaking unbuilt theme MDX; this is intentional debt tracked in dev-plan, not dead code to delete now.
- **Self-rated, no verification:** the self-check has no external grading; retrieval + self-explanation still carries the retention benefit, and it removes MC wrong-answer anxiety. Accepted.
