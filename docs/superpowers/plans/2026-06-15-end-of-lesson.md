# End-of-Lesson Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the lesson close with an active-recall self-check (RecallPrompt, retrieve first) followed by a 3-part structured recap (new LessonRecap), and remove the inconsistent MC quiz.

**Architecture:** Enhance the live `RecallPrompt` with self-rate + analytics; add a `LessonRecap` MDX component; register both and swap the Takeaways visibility set; migrate the 77 built lessons (deep-orbit + extras) to the new close; lock completeness with a content guard test. Ordering keeps the test suite green throughout: components + registration land first (deprecated Quiz/KeyTakeaways stay renderable), content migrates, then deprecated entries + guard test land last.

**Tech Stack:** Next.js App Router, TypeScript, MDX (Velite), vitest + @testing-library/react, Playwright. Spec: `docs/superpowers/specs/2026-06-15-end-of-lesson-design.md`.

> **COMMIT POLICY:** Repo CLAUDE.md forbids agent commits. Do NOT `git add/commit/push`. Each task ends "leave uncommitted; report files." User commits.
>
> **COPY RULE:** No em dashes anywhere (style bible rule 6).
>
> **BUILT SURFACE:** Only `deep-orbit` + `extras` are in the Velite build (`LAUNCHED_THEME_DIRS`). 77 lessons total (deep-orbit 56 incl. 5 capstones + extras 21). Migration + guard target these.
>
> **PATHS:** lesson page files live in `apps/web/app/themes/[slug]/[module]/[lesson]/`. Live RecallPrompt is `apps/web/app/components/mdx/recall-prompt.tsx` (NOT the unused `packages/ui/src/mdx/recall-prompt.tsx`).
>
> **TEST CMDS:** unit `npx vitest run <path>` (root); full `npx vitest run`; typecheck `npm run typecheck` + `npx tsc --noEmit` in apps/web (ignore the 3 known pre-existing failing test files: onboarding/page.test.tsx, pricing/__tests__/pricing-tiers.test.tsx, settings/settings-form.test.tsx); content build `pnpm --filter @tensorcraft/content build:content`; e2e `npx playwright test <spec>`.

---

### Task 1: RecallPrompt self-rate + `onAnswer`

**Files:**
- Modify: `apps/web/app/components/mdx/recall-prompt.tsx`
- Test: `apps/web/app/components/mdx/recall-prompt.test.tsx` (new)

Add Got it / Review again buttons that appear AFTER the answer is revealed, and an optional `onAnswer` callback. Preserve the existing reveal/hide flow and the dual `children`/`answer` answer API.

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { RecallPrompt } from "./recall-prompt";

describe("RecallPrompt", () => {
  it("hides the answer and self-rate buttons until revealed", () => {
    render(<RecallPrompt question="Q?" answer="A." />);
    expect(screen.queryByText("A.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /got it/i })).not.toBeInTheDocument();
  });

  it("reveals the answer and shows self-rate buttons", () => {
    render(<RecallPrompt question="Q?" answer="A." />);
    fireEvent.click(screen.getByRole("button", { name: /reveal answer/i }));
    expect(screen.getByText("A.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /got it/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /review again/i })).toBeInTheDocument();
  });

  it("fires onAnswer with the chosen result", () => {
    const onAnswer = vi.fn();
    render(<RecallPrompt question="Q?" answer="A." onAnswer={onAnswer} />);
    fireEvent.click(screen.getByRole("button", { name: /reveal answer/i }));
    fireEvent.click(screen.getByRole("button", { name: /got it/i }));
    expect(onAnswer).toHaveBeenCalledWith("got-it");
  });
});
```

- [ ] **Step 2: Run to verify FAIL** (`npx vitest run apps/web/app/components/mdx/recall-prompt.test.tsx`).

- [ ] **Step 3: Implement.** Add `onAnswer?: (result: "got-it" | "review") => void` to `RecallPromptProps`. In the revealed block, after the answer box, render two buttons:

```tsx
<div className="mt-3 flex gap-2">
  <button
    type="button"
    onClick={() => onAnswer?.("got-it")}
    className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors brutalist-hover bg-primary/10 text-primary border border-primary/20"
  >
    Got it
  </button>
  <button
    type="button"
    onClick={() => { onAnswer?.("review"); setRevealed(false); }}
    className="px-4 py-2 text-xs font-mono font-semibold uppercase tracking-wider transition-colors brutalist-hover bg-yellow-400/10 text-yellow-400 border border-yellow-400/20"
  >
    Review again
  </button>
</div>
```

Keep the existing "Hide Answer" button or replace it with these two (Review again re-hides, so "Hide Answer" is redundant; remove it to avoid three buttons). Keep `children ?? answer` answer rendering.

- [ ] **Step 4: Run to verify PASS** + `npm run typecheck`.

- [ ] **Step 5: Leave uncommitted; report files.**

---

### Task 2: Analytics wiring (widen `RECALL_ANSWERED`, fire on self-rate)

**Files:**
- Modify: `apps/web/lib/analytics-events.ts` (widen `RECALL_ANSWERED.action` union)
- Modify: `apps/web/lib/analytics.ts` (`trackRecallAnswered` param type)
- Modify: `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-content.tsx` (RecallPrompt wrapper fires it)
- Test: extend `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-content.test.tsx` if it asserts the wrapper; otherwise rely on Task 1 + typecheck.

- [ ] **Step 1: Widen the event + helper**

In `analytics-events.ts`, change the `RECALL_ANSWERED` payload `action` union to `"revealed" | "hidden" | "got-it" | "review"`. In `analytics.ts`, change `trackRecallAnswered(action: "revealed" | "hidden", ...)` to accept the widened union.

- [ ] **Step 2: Wire the wrapper**

In `lesson-content.tsx`, replace the current `RecallPrompt` registration:

```tsx
RecallPrompt: (props: React.ComponentProps<typeof RecallPrompt>) =>
  shouldShow("RecallPrompt") ? <RecallPrompt {...props} /> : null,
```

with one that fires analytics (mirror the `Quiz` wrapper above it):

```tsx
RecallPrompt: (props: React.ComponentProps<typeof RecallPrompt>) =>
  shouldShow("RecallPrompt") ? (
    <RecallPrompt
      {...props}
      onAnswer={(result) => {
        trackRecallAnswered(result, { themeId, lessonId });
        props.onAnswer?.(result);
      }}
    />
  ) : null,
```

Import `trackRecallAnswered` (it already exists in `@/lib/analytics`; add it to the import list in `lesson-content.tsx` alongside `trackCheckpointSubmitted`).

- [ ] **Step 2b: Update the test mock.** `lesson-content.test.tsx` mocks `@/lib/analytics`; that mock currently lacks `trackRecallAnswered`. Since the wiring lands here (Task 2), add `trackRecallAnswered: vi.fn()` to that mock now, or the test file will throw on the new call path.

- [ ] **Step 3: Run** `npx vitest run "apps/web/app/themes/[slug]/[module]/[lesson]/"` + typecheck. PASS.

- [ ] **Step 4: Leave uncommitted; report files.**

---

### Task 3: `LessonRecap` component

**Files:**
- Create: `packages/ui/src/mdx/lesson-recap.tsx`
- Create: `packages/ui/src/mdx/lesson-recap.test.tsx`
- Modify: `packages/ui/src/mdx/index.ts` (export)

- [ ] **Step 1: Write the failing test**

```tsx
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LessonRecap } from "./lesson-recap";

describe("LessonRecap", () => {
  it("renders the three sections", () => {
    render(
      <LessonRecap
        whatYouLearned={["A tensor tracks shape.", "Rank is dimension count."]}
        bridge="dispose() is to tensors what cleanup is to useEffect."
        youCanNow="Create a tensor and manage its memory."
      />,
    );
    expect(screen.getByText(/what you learned/i)).toBeInTheDocument();
    expect(screen.getByText("A tensor tracks shape.")).toBeInTheDocument();
    expect(screen.getByText(/the bridge/i)).toBeInTheDocument();
    expect(screen.getByText(/dispose\(\) is to tensors/)).toBeInTheDocument();
    expect(screen.getByText(/you can now/i)).toBeInTheDocument();
    expect(screen.getByText(/create a tensor and manage/i)).toBeInTheDocument();
  });

  it("renders without crashing on empty whatYouLearned", () => {
    const { container } = render(
      <LessonRecap whatYouLearned={[]} bridge="b" youCanNow="c" />,
    );
    expect(container).toBeTruthy();
  });
});
```

- [ ] **Step 2: Run to verify FAIL.**

- [ ] **Step 3: Implement** `packages/ui/src/mdx/lesson-recap.tsx`. Match `KeyTakeaways` brutalist styling (left primary accent border, mono kicker). Props: `{ whatYouLearned: string[]; bridge: string; youCanNow: string }`. Structure: kicker "Lesson recap"; sub-label "What you learned" + checklist of points; sub-label "The bridge" + the sentence (it may contain inline `code`, which the global lesson-prose chip CSS styles when rendered inside lesson prose); sub-label "You can now" + the capability line. Use the same token classes as `key-takeaways.tsx` (`bg-surface-raised`, `border-l-[3px] border-l-primary`, `text-primary` kicker, `text-text-primary/80`). No em dashes.

- [ ] **Step 4: Export** from `packages/ui/src/mdx/index.ts` (alphabetical, matching style). 

- [ ] **Step 5: Run PASS** + typecheck. Leave uncommitted; report files.

---

### Task 4: Register `LessonRecap` + add to Takeaways set (keep deprecated entries for now)

**Files:**
- Modify: `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-content.tsx` (import + register `LessonRecap`)
- Modify: `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-steps.tsx` (`TAKEAWAYS_COMPONENTS`: add `LessonRecap` + `RecallPrompt` already there; KEEP `KeyTakeaways`/`Quiz` for now)
- Test: extend `lesson-content.test.tsx` to assert `LessonRecap` renders when visible

This task makes `<LessonRecap>` renderable so migration (Task 5) can add it. Do NOT remove KeyTakeaways/Quiz yet (lessons still use them until migrated; removing now would blank the close mid-migration).

- [ ] **Step 1: Register** `LessonRecap` in the `mdxComponents`/wrapped map in `lesson-content.tsx` via `wrapVisibility("LessonRecap", LessonRecap)` (follow the `KeyTakeaways` registration exactly). Import from `@tensorcraft/ui`.

- [ ] **Step 2: Add to the set.** In `lesson-steps.tsx`, add `"LessonRecap"` to `TAKEAWAYS_COMPONENTS` (keep `KeyTakeaways`, `Quiz`, `RecallPrompt`, `NextLesson`).

- [ ] **Step 3: Test.** Add a case to `lesson-content.test.tsx`: when `visibleComponents` includes `LessonRecap`, an MDX body with `<LessonRecap .../>` renders its "Lesson recap" kicker. (Match how existing visibility tests are written; mock `@tensorcraft/ui` if that file mocks it, adding a `LessonRecap` stub to the mock.)

- [ ] **Step 4: Run** `npx vitest run "apps/web/app/themes/[slug]/[module]/[lesson]/"` + content build (`pnpm --filter @tensorcraft/content build:content`, to confirm `<LessonRecap>` compiles once a lesson uses it later) + typecheck. PASS.

- [ ] **Step 5: Leave uncommitted; report files.**

---

### Task 5: Content migration (77 built lessons) - run as per-module batches

**Files:** lesson MDX under `packages/content/content/deep-orbit/**/*.mdx` (56, incl. capstone) and `packages/content/content/extras/**/*.mdx` (21). Exercises dirs are NOT lessons; skip `**/exercises/*`.

This is the bulk. The controller runs this task once per module batch (deep-orbit has 11 module dirs + capstone + extras). Each batch migrates ~5 lessons. Per-lesson transformation:

**For each lesson MDX:**
1. **Add a RecallPrompt** as the FIRST close element (before the recap), targeting the lesson's single most important idea:
   `<RecallPrompt question="..." answer="..." />`
   - If the lesson already has a `<Quiz>`: convert it. The MC question stem becomes `question`; the correct option + the `explanation` become a tight `answer`. Then DELETE the `<Quiz>` block.
   - Else: author a new question + answer from the lesson's concept. One prompt only.
2. **Replace `<KeyTakeaways takeaways={[...]} />` with `<LessonRecap .../>`** placed AFTER the RecallPrompt:
   - `whatYouLearned`: 2-3 transferable points. Reuse the existing takeaways but STRIP story/character/DEEP-SCAN specifics and keep only portable ML/FE knowledge. Rewrite for clarity.
   - `bridge`: one sentence mapping the frontend idea to the ML idea. Seed from `concept.bridge.feTitle`/`mlTitle` in the lesson frontmatter; write a clean sentence (inline `code` allowed).
   - `youCanNow`: one capability line, derived from the lesson's learning objective / what the learner can now do.
   - Delete the old `<KeyTakeaways>` block.
3. Ensure **order in the MDX body: RecallPrompt before LessonRecap.** Both should sit in the same close region the KeyTakeaways/Quiz occupied (the Takeaways step). Keep the `<Epilogue>` and any DISPATCH/story content where it was (story stays out of the recap).
4. No em dashes. Keep frontmatter untouched.

**Per-batch procedure:**
- [ ] Pick one module dir (e.g. `deep-orbit/foundations`). List its lesson MDX (exclude `exercises/`).
- [ ] Migrate each lesson per the recipe above.
- [ ] Rebuild content: `pnpm --filter @tensorcraft/content build:content` - must succeed (proves all `<LessonRecap>`/`<RecallPrompt>` usages compile).
- [ ] Quick grep check for the batch: each migrated file has exactly one `<RecallPrompt`, one `<LessonRecap`, zero `<Quiz`, zero `<KeyTakeaways`, and RecallPrompt appears before LessonRecap.
- [ ] Leave uncommitted; report which lessons migrated.

Repeat until all 77 built lessons are migrated. (Controller: dispatch one subagent per module batch; review each batch's content quality before the next.)

---

### Task 6: Cleanup + content guard test + e2e + docs + full verification

Only after ALL 77 built lessons are migrated.

**Files:**
- Modify: `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-steps.tsx` (remove `KeyTakeaways`/`Quiz` from `TAKEAWAYS_COMPONENTS`; fix the two stale comments ~line 89 and ~line 111)
- Create: `packages/content/src/end-of-lesson.test.ts` (content guard, new)
- Modify: an e2e spec (lesson/themes) + `docs/story-style-bible.md` + `docs/dev-plan.md`
- Mark deprecated: add a one-line deprecation comment atop `packages/ui/src/mdx/quiz.tsx` and `key-takeaways.tsx`

- [ ] **Step 1: Drop deprecated set entries + fix comments.** Remove `"KeyTakeaways"` and `"Quiz"` from `TAKEAWAYS_COMPONENTS`. Update the two stale comments referencing Quiz-in-Takeaways. Keep the `Quiz`/`KeyTakeaways` component registrations in `lesson-content.tsx` (unbuilt themes still reference them) and add deprecation comments to the component files.

- [ ] **Step 2: Write the content guard test** `packages/content/src/end-of-lesson.test.ts`:

```ts
import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

// NOTE: glob/fast-glob are NOT resolvable from packages/content (deps are only
// @types/hast, velite, zod). Use fs.readdirSync recursion - no new dependency.
const ROOT = path.resolve(__dirname, "../content");

function lessonMdx(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "exercises") continue; // not lessons
      out.push(...lessonMdx(full));
    } else if (e.name.endsWith(".mdx")) {
      out.push(full);
    }
  }
  return out;
}

// Built dirs only (LAUNCHED_THEME_DIRS = {deep-orbit,extras}).
const files = ["deep-orbit", "extras"].flatMap((d) =>
  lessonMdx(path.join(ROOT, d)),
);

describe("end-of-lesson migration completeness (built lessons)", () => {
  it("found the built lessons", () => {
    expect(files.length).toBe(77);
  });

  it.each(files)("%s has the new close and none of the old", (file) => {
    const src = fs.readFileSync(file, "utf-8");
    const recall = (src.match(/<RecallPrompt/g) ?? []).length;
    const recap = (src.match(/<LessonRecap/g) ?? []).length;
    expect(recall, "exactly one RecallPrompt").toBe(1);
    expect(recap, "exactly one LessonRecap").toBe(1);
    expect(src.includes("<Quiz"), "no Quiz").toBe(false);
    expect(src.includes("<KeyTakeaways"), "no KeyTakeaways").toBe(false);
    // order: RecallPrompt before LessonRecap
    expect(src.indexOf("<RecallPrompt")).toBeLessThan(src.indexOf("<LessonRecap"));
  });
});
```

Confirm the glob library available to `packages/content` (it depends on velite; `glob` may not be a direct dep - if missing, use `fs.readdirSync` recursion or add the dep used elsewhere in the repo). Verify the count 77 matches reality; if extras/deep-orbit counts differ, fix the expected number and note it.

- [ ] **Step 3: Run the guard test** (`npx vitest run packages/content/src/end-of-lesson.test.ts`) - PASS (proves migration complete). If it fails, a lesson was missed; fix the lesson, not the test.

- [ ] **Step 4: e2e.** In the lesson e2e spec, on the Takeaways step assert: a "Recall prompt" appears above the "Lesson recap"; clicking Reveal Answer shows the answer + the Got it / Review again buttons; the recap shows the three sub-labels (What you learned / The bridge / You can now); no MC quiz options render. Verify selectors live before finalizing.

- [ ] **Step 5: Docs.** `docs/story-style-bible.md`: add a "Lesson close" authoring note (RecallPrompt first, then LessonRecap; what each recap part holds; story stays in the Epilogue). `docs/dev-plan.md`: record deferred migration of the 4 coming-soon themes off `Quiz`/`KeyTakeaways` onto `RecallPrompt`/`LessonRecap` (gated on launch); note both components are deprecated-but-retained.

- [ ] **Step 6: Full verification** (report exact numbers): `npm run typecheck` + `npx tsc --noEmit` in apps/web (ignore the 3 known pre-existing failures); full `npx vitest run`; content build; the e2e spec.

- [ ] **Step 7: Leave uncommitted; report all files changed across the stream for the user to review and commit.**

---

## File structure summary

| File | Responsibility |
|---|---|
| `apps/web/app/components/mdx/recall-prompt.tsx` | self-rate buttons + onAnswer (Task 1) |
| `apps/web/lib/analytics-events.ts`, `analytics.ts` | widen RECALL_ANSWERED (Task 2) |
| `packages/ui/src/mdx/lesson-recap.tsx` | 3-part structured recap (Task 3) |
| `.../[lesson]/lesson-content.tsx` | register LessonRecap, wire RecallPrompt analytics (Tasks 2,4) |
| `.../[lesson]/lesson-steps.tsx` | TAKEAWAYS_COMPONENTS swap + comment fixes (Tasks 4,6) |
| `packages/content/content/{deep-orbit,extras}/**/*.mdx` | 77-lesson migration (Task 5) |
| `packages/content/src/end-of-lesson.test.ts` | migration completeness guard (Task 6) |
| e2e spec, docs | verification + authoring notes (Task 6) |
