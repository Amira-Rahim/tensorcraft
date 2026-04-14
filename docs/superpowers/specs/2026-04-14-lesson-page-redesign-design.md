# Lesson Page Redesign — Design Spec

**Date:** 2026-04-14
**Status:** Draft

## Problem

The lesson page renders all content as a single vertical scroll — dialogue, concepts, code, exercises, and takeaways all run together with no structural rhythm. The 5C storytelling loop (Context → Concept → Code → Challenge → Consequence) is invisible. Frontmatter data (`context.narrative`, `context.speaker`) is loaded but never displayed on the page. (`consequence.narrative` is displayed but as a plain text box with no dramatic weight.) The page feels like a reference document, not a learning experience.

## Solution

Replace the scrollable lesson page with a **step-based progression** inspired by Duolingo. Each lesson becomes 7 focused steps that the learner advances through one at a time. Story moments get full-screen focus. Technical content scrolls within the step viewport.

## Design

### The 7-Step Structure

Every lesson follows this structure:

| Step | Type | Content Source | Scrollable? |
|------|------|---------------|-------------|
| 1 | **Briefing** (story) | `context.narrative`, `context.speaker`, lesson title, metadata | No — single focused screen |
| 2 | **Dialogue** (story) | MDX `<Dialogue>` components extracted from body | No — stacked dialogue cards |
| 3 | **Concept** (learn) | `concept.explanation`, `<BridgeCallout>`, prose from MDX body | Yes — scrolls within viewport |
| 4 | **Code** (learn) | `<CodeBlock>` components from MDX body | Yes |
| 5 | **Challenge** (exercise) | `<Exercise>` components from MDX body | Yes |
| 6 | **Takeaways** (check) | `<KeyTakeaways>`, `<Quiz>` from MDX body | No — focused |
| 7 | **Consequence** (story) | `consequence.narrative`, `consequence.nextLessonTeaser`, next lesson link | No — single focused screen |

### Page Layout

The page is a fixed viewport with three zones:

```
┌──────────────────────────────────────┐
│ ← Module   ████████░░░░░░░   3 / 7  │ ← Top bar (52px): back link + progress bar + step counter
├──────────────────────────────────────┤
│                                      │
│          ● ● ◉ ○ ○ ○ ○              │ ← Step dots
│                                      │
│     [Current step content here]      │ ← Step viewport (scrollable if learn/exercise step)
│                                      │
│     max-width: 680px, centered       │
│                                      │
├──────────────────────────────────────┤
│                    ← Back  Continue →│ ← Bottom bar (fixed): navigation buttons
└──────────────────────────────────────┘
```

- **Top bar**: Fixed. Progress bar fills left-to-right as steps complete. Shows `N / 7`.
- **Step dots**: Shows done (filled, dim) / active (filled, wide) / upcoming (empty). Centers the learner.
- **Step viewport**: `height: calc(100vh - top - bottom)`. Scrollable only for learn/exercise steps.
- **Bottom bar**: Fixed. "← Back" (ghost button) and "Continue →" (primary button). Continue advances to next step.

### Step Content Details

**Step 1: Briefing**
- Phase label: `// SECTOR {N} · {MODULE_NAME} · MISSION {LESSON_ORDER} OF 5`
- Title: lesson title with theme primary color on key word
- Narrative: `context.narrative` from frontmatter — the scene-setter
- Meta: estimated time, bridge tier, exercise count

**Step 2: Dialogue**
- Extracts all `<Dialogue>` components from the MDX body
- Renders them as cards with speaker avatar (initials), name, role, accent border
- Characters: Commander = accent color, ARIA/AI = primary color, others = muted
- Ends with a transitional narrator paragraph bridging to the concept

**Step 3: Concept**
- Phase chip label (`◎ Concept`)
- `concept.explanation` from frontmatter as intro paragraph
- BridgeCallout component from MDX
- Prose paragraphs that precede the first CodeBlock in the MDX body
- Scrollable within viewport

**Step 4: Code**
- Phase chip label (`⌘ Code`)
- CodeBlock components from MDX body
- Any prose paragraphs between code blocks
- Scrollable within viewport

Note: Every lesson always has exactly 7 steps. If a lesson has no code blocks, Step 4 renders the remaining prose content. The step count is fixed to keep the progress bar and step dots consistent across all lessons.

**Step 5: Challenge**
- Phase chip label (`⚡ Challenge`)
- Exercise component with Sandpack editor, tests, hints
- Full viewport focus — no distracting content around the editor

**Step 6: Takeaways**
- Phase chip label (`✓ Takeaways`)
- KeyTakeaways rendered as cards with checkmarks
- Quiz component if present
- HintPanel if available

**Step 7: Consequence**
- "MISSION COMPLETE" badge
- `consequence.narrative` as centered resolution text
- Next lesson card with title, teaser, and arrow

### Content Splitting Strategy

The MDX body currently contains everything — dialogues, prose, code blocks, exercises, takeaways. To split into steps:

1. **Dialogues** → Step 2 (all `<Dialogue>` components)
2. **Prose + BridgeCallout + LearningObjectives** → Step 3 (Concept)
3. **CodeBlock + remaining prose** → Step 4 (Code)
4. **Exercise** → Step 5
5. **KeyTakeaways + Quiz + HintPanel + RecallPrompt** → Step 6
6. **InteractiveDemo** → include in Step 3 or 4 depending on context (default: Step 3)

### MDX Splitting Mechanism

The compiled MDX body is a single function evaluated via `new Function()`. It renders all components in sequence. To split it into steps, **use the components map as an interception layer**:

1. The `LessonContent` component receives a `visibleComponents` prop — a set of component names to render (e.g., `["Dialogue"]` for Step 2, `["BridgeCallout", "CodeBlock"]` for Step 3-4).
2. In the `useMemo` components map, wrap each component with a visibility gate:

```tsx
const base = {
  Dialogue: (props) => visibleComponents.has("Dialogue") ? <Dialogue {...props} /> : null,
  Exercise: (props) => visibleComponents.has("Exercise") ? <Exercise {...props} /> : null,
  // ... same for all components
};
```

3. The MDX function always runs in full — but components outside the current step render as `null`. This is simple, doesn't require DOM manipulation, and preserves React's rendering model.
4. For plain prose (`<p>`, `<h2>`, etc.), use a similar pattern: a wrapper component checks if we're in the prose step (Steps 3-4). If not, it hides the content.

This approach keeps the MDX body intact, requires no content file changes, and the visibility decision is made by the step shell via props.

### State Management

- `currentStep: number` (0-6) — tracked in component state
- **Step persistence:** Store in localStorage (`tc_step_{themeSlug}_{lessonSlug}`). On mount, read and resume at the stored step. Simple, no DB schema changes, works for unauthenticated users on free modules too.
- **Lesson completion:** When the learner reaches Step 7 (Consequence), automatically call the existing progress API to mark the lesson complete. This replaces the current "Mark Complete" button.
- `canContinue: boolean` — for the Exercise step (Step 5), disabled until the Exercise component fires its `onSubmit` callback with `passed: true`. The `lesson-steps.tsx` shell passes an `onExerciseComplete` callback to the Exercise component via React context or props. For all other steps, Continue is always enabled.
- Progress bar width: `(currentStep / 7) * 100%`
- URL doesn't change per step — the lesson URL stays the same. Step state is internal.

### What Changes

**Rewrite:** `apps/web/app/themes/[slug]/[module]/[lesson]/page.tsx` — the main lesson page. Replace the current linear layout with the step-based shell.

**New component:** `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-steps.tsx` — client component managing step state, rendering the correct content for each step, handling navigation.

**Modify:** `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-content.tsx` — instead of rendering all MDX at once, accept a `renderMode` prop that filters which component types to render.

**Keep as-is:** All MDX components (Dialogue, BridgeCallout, CodeBlock, Exercise, Quiz, etc.) — their rendering stays the same, just placed in different steps.

**Remove:** The sidebar lesson navigation (`<aside>` element, lines 143-216 of current `page.tsx`). The step-based design eliminates the need for a sidebar — lesson navigation happens via the module page, and within-lesson navigation uses the step dots + Continue/Back buttons.

**Remove:** `apps/web/app/themes/[slug]/[module]/[lesson]/mobile-lesson-nav.tsx` — replaced by the step-based bottom bar which works on all screen sizes.

**Integrate into step shell:**
- `LessonPaywall` — paywall check stays in the server component (`page.tsx`). If the lesson requires payment, the paywall renders instead of the step shell. No change to paywall logic.
- `LessonProgressTracker` — "Mark Complete" functionality moves into Step 7 (Consequence). When the learner reaches the final step, the lesson is automatically marked complete via the existing progress API.
- Prerequisite check — stays in the server component. If prerequisites aren't met, the lock screen renders instead of the step shell.

### What Doesn't Change

- MDX content files — no changes to any `.mdx` files
- Velite schema — no changes to `velite.config.ts`
- MDX component implementations — Dialogue, BridgeCallout, Exercise, etc. stay the same
- Backend/API — no server changes
- Mobile layout — the step-based design is inherently mobile-friendly (no sidebar, no multi-column)

## Verification

1. `pnpm build` passes
2. Navigate to any lesson — see the step-based layout with progress bar, step dots, and Continue button
3. Step 1 (Briefing) shows `context.narrative` from frontmatter — text that was previously invisible
4. Step 2 (Dialogue) shows character dialogues extracted from MDX, not inline blockquotes
5. Steps 3-4 (Concept/Code) show the prose content scrollable within the viewport
6. Step 5 (Challenge) shows the exercise in focused mode
7. Step 7 (Consequence) shows `consequence.narrative` and next lesson link
8. "Continue →" advances through all 7 steps
9. "← Back" goes to previous step
10. Progress bar fills from 0% to 100% across the 7 steps
11. Refreshing the page resumes at the last step
