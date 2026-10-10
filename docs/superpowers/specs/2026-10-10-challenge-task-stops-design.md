# Challenge task stops: the lesson 1 brief, rebuilt around the lines to finish

Date: 2026-10-10. Status: design approved by the owner in brainstorming on
2026-10-10; this spec awaits owner review before an implementation plan.

Scope: the challenge workspace on
`/worlds/deep-orbit/foundations/introduction-to-tensors`, the only lesson
where `challengeWorkspace` is true (`lesson-steps.tsx`). The 2026-09-23
lesson layout and the 2026-09-24 tightening spec stay in force everywhere
else, including the brief/pane partition (2026-09-24, section 3) for every
other Challenge step.

Visual reference: `docs/design-previews/challenge-task-stops/mockup.html`
(append `?scheme=light`, `?state=typed` or `?hint=1`) and the captures beside
it.

## Why

On 2026-10-09 the owner called the "Complete two lines" brief "just
horrible". The live page was measured with Playwright at 1,440 by 900 and
390 by 844, signed out, with the Challenge step restored through
localStorage. Eight defects:

1. It floats. `.challenge-task-panel` has no background, so the brief sits on
   the page between a framed mission card and a framed editor.
2. Five bordered inline-code chips (`null`, `reading`, `shape`, `[5]`, `tf`)
   crowd six lines, and they compute to 11.9 px. The system minimum is 12 px.
3. The code to type is the faintest element: 13 px primary text in a `pre`
   whose background equals the page (#181818 on #181818).
4. The two steps sit 550 px apart in a 1,100 px row. Step 2 is taller, so
   step 1 ends above a hole.
5. "Get a nudge" is column 2 of a `1fr 240px` grid with
   `align-items: center`, far from anything it helps with.
6. Step titles and "Your JavaScript" are both 16 px/600, and the 20 px brief
   heading sits under a 34 px mission title. Nothing marks the task.
7. The heading, the intro and editor line 2 all say "replace the two nulls";
   the support line repeats the editor's "Supplied" comments.
8. The steps never say they edit lines 3 and 4.

On a phone the brief is 547 px tall, so the editor starts below the first
screen and every step means scrolling back up. The brief also prints both
answers, the Concept step showed the same two lines a minute earlier, and
every hint rung repeats them.

## How the direction was chosen

Four directions were built from the real content, rendered at 1,440, 1,024
and 390 in both schemes, and scored 1 to 10 by three independent judges: a
first-time learner, the design system and the owner's rules, and engineering
fit. The live brief scored 3.

| Direction | Learner | Design | Engineering |
| --- | --- | --- | --- |
| Tab stops (chosen) | 7 | 7 | 5 |
| Annotated editor | 7.5 | 5 | 4 |
| Patch view | 5 | 5.5 | 7 |
| Side by side | 5.5 | 6 | 6 |

Annotated editor put the instructions inside CodeMirror. That breaks the e2e
that types code read from `innerText`, pushes the editor past its 400 px cap
on phones, lets the autocomplete list cover the answer while the learner
types `tf.`, and makes brass the task's signal (frames, washes and line
numbers) beside the green. Patch view printed each
target line three times and outranked the editor. Side by side moved the
Expected tensor panel and drew code rows that read as input fields.

## Decisions (owner, 2026-10-10)

1. The brief shows the exact code for both lines. Lesson 1 is a guided first
   run.
2. Direction: Tab stops, refined with a tight solid frame on each `null`, a
   quiet typed state, rewritten hints and the full result line.
3. The heading is generated from the real line numbers: "Finish lines 3 and
   4".
4. The help ladder holds a nudge and a guidance rung. The solution rung is
   removed for this lesson; Show Solution stays.
5. Build plan: the brief and the help move into the editor pane for this
   workspace, an editor extension marks the lines by scanning the text, and
   each step names its target variable, validated at build time.

## Goal and success criteria

- A learner sees what to type and where in one row per line: line number,
  purpose, target variable and code.
- Defects 1 to 8 are closed (table in section 7).
- The brief is at most 230 px tall at 1,440 (live: 304) and at most 360 px at
  390 (live: 547). The mockup measures 211 and 337 on macOS; the budgets
  leave room for one extra wrapped line on CI's Linux font rendering.
- At 390 by 844, each step's code sits at most 320 px above its target line,
  so it stays on screen with the keyboard open. The mockup measures 313 and
  238.
- Editor line 3 is on the first screen at 1,440 by 900 with the live chrome.
- Marks and labels stay correct after Reset, Show Solution, Restore my code,
  a restored draft and an inserted line.
- Nothing is inserted into the editor's text: copy, paste, `innerText` and
  screen reader output are exactly what the learner typed.
- No text under 12 px, AA contrast in both schemes, zero axe violations, no
  em dash, no colored left bar.

## Non-goals

- Other lessons' Challenge steps and the non-workspace path of
  `ExerciseBrief`.
- The mission header, the Expected tensor panel, test results and the lesson
  nav. They render as they do today.
- The starter code. Its "Your work" and "Supplied" comments stay.
- Tab-key navigation between stops, and any pass or fail claim in the brief.
  Run Tests remains the only pass signal.
- Highlighting the step whose line holds the caret. Two steps do not need it.

## Section 1: layout

The workspace frame keeps its grid, `minmax(0, 1.65fr) minmax(0, 1fr)`. The
left column becomes one bordered unit: the brief on top, then the editor and
its footer. The Expected tensor panel spans both rows on the right. Below
1,024 px the panel moves under the editor, as it does today.

The brief has the `--tc-surface` background (#232323 dark, #FFFFFF light)
and 20 px 24 px 22 px padding (18 px 16 px on phones). Name the token
directly: Tailwind's `bg-surface` maps to `--tc-bg` (#181818) in this repo
(`globals.css`), and using it would recreate defect 1. A hairline separates
the brief from the code. Its heading is an `h3` at 20 px/650, line-height
1.3, letter-spacing -0.01em (18 px on phones), on the same top edge as
"Expected tensor". A one-line note follows at 15 px muted (14 px on phones).

The brief renders inside the right instance's `.lesson-prose` wrapper
(`lesson-content.tsx` lines 706 to 716), so the prose rules reach it:
`.lesson-prose :not(pre) > code` (`globals.css` lines 708 to 718, the
bordered chip behind defect 2) and the prose `h3` and `ol` rules (lines 197
and 381). The overrides must outrank specificity (0,1,2), as the Expected
tensor override already does (`lesson-visuals.css` lines 1088 to 1094).
Scope them to two roots:

- The whole brief (`.lesson-challenge-workspace .challenge-brief`): the
  note's `tf`, the stops and the result. Scoping only the list would leave
  the note's `tf` as a chip.
- The hint rungs (`.lesson-challenge-workspace .challenge-hint-content`).
  They also render inside `.lesson-prose`, and `InstructionText`'s
  `text-[0.92em]` utility loses to the unlayered prose rule. The new nudge
  and guidance hold five code spans, which would come back as bordered
  chips at 11.9 px on the 14 px rung body.

Otherwise the code to type, and the hints' code, come back as bordered
0.85em chips.

The stops are an `ol` labeled "Lines to finish", one `li` per step. The
brief switches layout by its own width through a container query, so the
editor column's width decides, not the window's:

- 720 px and wider: one row per stop. Key (4.5rem), title (10.5rem),
  instruction (8.5rem), then the code. The result sits under the code.
- 481 to 719 px: row 1 holds key and title, row 2 the instruction and code,
  row 3 the result.
- 480 px and narrower: row 1 key and title, row 2 the instruction, row 3 the
  code, row 4 the result. Every stop reads the same way.

The editor gutter stays at the live 38 px. Nothing hangs in it.

## Section 2: visual design

Existing tokens only. Everything that marks the task is green or neutral.
Brass appears in this workspace for the first time, on help only: the
question icon and the rung titles, which already reference it but render in
the text color today (see Help below). That is deliberate; do not "fix" it
back.

- Code to type: JetBrains Mono 16 px/1.6 (the editor's own size), weight 500,
  text color, on one wash: `color-mix(in srgb, primary 20%, surface)` in dark
  (#313E38) and 12% in light (#E7EDEA). Padding 2 px 10 px; 15 px with 2 px
  8 px under 480 px. No border, so it never reads as an input.
- Line key: JetBrains Mono 13 px/600 in primary, underlined (1 px, offset
  4 px). Its hit area is at least 44 px tall. Hover thickens the underline
  to 2 px over a neutral wash, `color-mix(in srgb, var(--tc-text) 7%,
  var(--tc-surface))`, where the key text measures 4.87:1 (dark) and
  5.77:1 (light). The green code wash is not used here: primary text on it
  measures 4.12:1 in dark, under AA. Focus shows the 2 px primary outline.
  At rest the key measures 5.80:1 (dark) and 6.64:1 (light).
- Step title 15 px/600. Instruction 15 px, with inline code as plain mono
  with no box. Result 14 px muted.
- In the editor, the target `null` gets `box-shadow: inset 0 0 0 1px
  primary` with `padding: 0 3px; margin: 0 -3px`. The frame sits inside the
  glyph box, so it never crosses the semicolon or touches the next line. It
  measures 5.65:1 against the dark editor and 6.64:1 against the light one.
  The line number of each target line turns primary at weight 700. There is
  no line wash: a wash loses to Sandpack's focused active line (#313131) and
  leaves a detached stripe at the gutter edge.
- Typed state: the key turns muted and its underline transparent; title,
  instruction and result turn muted; the code loses its wash and turns
  muted. The line's gutter number returns to normal. Nothing moves, and no
  tick appears. Section 4 lists every state.
- Help: "Get a nudge" (Inter 14 px/500, with the brass question icon) sits
  with Show Solution at the right of the editor's actions row, 44 px tall.
  Brass needs a scope fix: `--iv-brass` is defined only on
  `.lesson-workbench` and `.lesson-mission-scene` (`lesson-visuals.css`
  lines 1 to 12), and the workspace grid sits inside neither. Today the
  help icon and rung titles therefore inherit the text color. Define
  `--iv-brass` (#C1A678 dark, #7C5A23 light) on
  `.lesson-challenge-workspace` so they render brass, as approved.
  Rungs open in the editor footer above the actions row, on
  `color-mix(in srgb, text 6%, surface)`, with the rung title in brass
  14 px/600 and the body at 14 px/1.7. On phones the help pair takes its own
  row under Run Tests and Reset, flush with their left edge.

## Section 3: copy

All strings follow `docs/writing-quality-rubric.md`.

- Heading, generated from the stops' key-label numbers (Section 4: sorted
  ascending, duplicates removed): "Finish line 3" when one number remains,
  "Finish lines 3 and 4" for two, "Finish lines 3, 5 and 8" for three or
  more.
- Note (`taskBrief.support`): "TensorFlow.js is loaded as `tf`. Leave the
  other lines as they are."
- Stops, unchanged from the current YAML: "Create the tensor", "Set
  `reading` to:", `tf.tensor(streamValues)`; "Read its shape", "Set `shape`
  to:", `reading.shape`, "Expect `[5]`: a list of five readings."
- Keys: visible text "Line 3", described by the step title through
  `aria-describedby`, so a screen reader says "Line 3, button, Create the
  tensor". A typed stop appends a visually hidden ", typed" to its title.
- Lesson hints in `01-introduction-to-tensors.mdx`:
  - nudge: "Select Line 3 or Line 4 above the code. It highlights that
    line’s `null`, so you can type the new code over it."
  - guidance: "`shape` is a property, so `reading.shape` takes no
    parentheses. Pass `streamValues` on its own: wrapping it in another pair
    of brackets makes the shape `[1, 5]`."
  - solution: removed. The schema allows two rungs; the Gate B count pin
    moves from 56 to 55 (see Tests).

  Both hints score coverage 0 and `dictates: false` on
  `scripts/lib/hint-dictation.mjs` (run on 2026-10-10). The nudge names the
  keys as they read with the starter, which the owner approved. If lines
  move (Show Solution, inserted lines), the keys can read other numbers;
  the nudge still points at the right controls, and this drift is
  accepted. If the workspace ever goes away, rewrite the nudge.
- `taskBrief.title` and `taskBrief.intro` leave this YAML.
- "Your JavaScript" stays as the editor's visually hidden `h4`. The brief
  heading is the column's visible title.

## Section 4: interaction

Each stop is in exactly one state, recomputed on every document change. The
scanner finds a stop's declaration as the first line matching
`(const|let|var) <target> =`. Its right-hand side is compared with
whitespace removed and one trailing semicolon dropped.

| State | Detected when | Frame | Gutter number | Key label | Key action | Brief row |
| --- | --- | --- | --- | --- | --- | --- |
| Waiting | The right-hand side equals the placeholder (`null`) | On the placeholder | Primary, 700 | Live line | Selects the placeholder | Active |
| Other code | The right-hand side is neither the placeholder nor the step's code | None | Primary, 700 | Live line | Selects the right-hand side | Active |
| Typed | The right-hand side equals the step's code | None | Normal | Live line | Selects the right-hand side | Quiet |
| Missing | No matching declaration | None | None | Build-time line | Caret at the start of the build-time line, clamped to the document | Active |

- The heading lists the stops' key-label numbers, sorted ascending, with
  duplicates removed. With the starter it reads "Finish lines 3 and 4".
  After Show Solution it reads "Finish lines 2 and 3", because the built
  solution has no "Your work" comment line. Both are true of what the
  editor shows.
- A Missing stop keeps its build-time label even when the document is
  shorter. The two-line draft in `challenge-workspace.spec.ts` (line 145)
  reads "Line 4" and "Finish lines 2 and 4". Reset restores the starter.
  This is accepted; the label is not clamped.
- Key activation (click, Enter or Space) focuses the editor before
  selecting. The selection scrolls into view at the nearest edge, without
  smooth scrolling.
- Until Sandpack mounts the editor, keys carry `aria-disabled="true"` and do
  nothing, and labels show the build-time line numbers. `Exercise` loads
  through `dynamic(..., { ssr: false })` (`lesson-content.tsx` lines 42 to
  52), so the brief now appears when the Exercise chunk loads, not with the
  step. The mission header still renders with the step.
- The typed state is a quiet marker, never a pass. Run Tests remains the
  only pass signal.
- "Get a nudge" reveals the nudge above the actions row, moves focus to it
  and announces "Nudge revealed." through the existing live region. The
  button then reads "Get more guidance"; after the guidance it disappears.
  Show Solution keeps today's behavior.
- Reset, Show Solution and Restore my code replace the whole document;
  marks and labels are recomputed from the new text.
- Lines inserted above a stop move its frame, its gutter mark, its key label
  and the heading together.

## Section 5: architecture

1. `scanStops(lines, steps)` in `packages/shared/src/scan-stops.ts` (new):
   a pure function over an array of line strings. The file is
   self-contained, with no imports and only erasable TypeScript.
   - `packages/ui` imports it through `@tensorcraft/shared`.
   - The velite transform must import it by relative path
     (`../../shared/src/scan-stops`). Velite 0.4.0 bundles its config with
     esbuild using `packages: "external"`, so a bare `@tensorcraft/shared`
     import is left to Node, and Node cannot resolve shared's extensionless
     re-exports (reproduced on 2026-10-10: `ERR_MODULE_NOT_FOUND
     .../packages/shared/src/constants`). Vitest resolves it, so only a real
     `build:content` run catches the mistake. A relative import is bundled.
     The repo avoids the bare import for the same reason: `built-worlds.ts`
     mirrors `LAUNCHED_WORLDS` instead of importing it.
   - Two config edits make the relative import safe:
     - Remove `rootDir` from `packages/content/tsconfig.json`. The config is
       `noEmit`, so `rootDir` only adds check TS6059, which a source file
       outside `src` trips in `pnpm typecheck` (CI runs it).
     - Add `"$TURBO_ROOT$/packages/shared/src/scan-stops.ts"` to the
       `build:content` task's `inputs` in `turbo.json`. Today its inputs
       are only content's own files and it has no `dependsOn`, so a scanner
       change would replay the cached `.velite` output and skip the
       build-time validation. Turbo 2.11.4, as installed, supports
       `$TURBO_ROOT$`.
   - One scanner means the build-time lines and the live states cannot
     disagree when the editor attaches.
   - For each step it finds the first line matching
     `^\s*(?:const|let|var)\s+<target>\s*=\s*(.*?)\s*;?\s*$` (target
     escaped) and returns `{ line, state, rhsStart, rhsEnd, matches }`:
     `state` is one of the four in Section 4, the right-hand side is given
     as column offsets, and `matches` counts every matching line, for the
     build's exactly-once rule. A missing declaration returns `line: null`
     and `matches: 0`.
2. `packages/ui/src/mdx/task-stops.ts` (new).
   - `taskStops(steps, store)`, a `StateField` recomputed from the document
     on creation and on every transaction that changes it. It never maps old
     positions, which is why it survives Sandpack's whole-document replace.
     It provides `EditorView.decorations` (a mark with class `cm-task-slot`
     on each placeholder) and `gutterLineClass` (a marker with class
     `cm-task-line`). A `ViewPlugin` attaches the view to the store and
     publishes each new field value.
   - `createTaskStopsStore()`: `subscribe`, `getSnapshot`, `attach(view)`
     and `select(index)`.
3. `packages/ui/src/mdx/exercise.tsx`.
   - In workspace mode with a `taskBrief`, a `useTaskStops(steps)` hook
     creates the store and the extension array once per step list
     (`useMemo` on `taskBrief.steps`, whose identity holds for the page's
     lifetime; `Exercise` itself remounts per slug and draft owner).
     `Exercise` passes
     `[...EXERCISE_EDITOR_EXTENSIONS, taskStops(...)]` to
     `SandpackCodeEditor`. The identity must stay stable: sandpack-react
     2.20.0's `applyExtensions` effect appends the whole array again
     whenever it is not shallow-equal to the previous one.
   - Render the brief at the head of the left column.
   - The draft note and the actions row are one fragment inside
     `ExerciseControls` (lines 750 to 812). Give it two new slots: `rungs`,
     rendered between the draft note and the actions row, and `help`.
   - Wrap Show Solution and Restore My Code in a right-aligned group that
     takes over the `ml-auto` those buttons carry today (lines 796 and
     806). The group renders for every exercise; when `help` is passed it
     sits first inside the group. The other 64 exercises keep today's
     alignment, which no test checks, so the change must not depend on
     `help` being present.
   - Add no second `brutalist-shadow`:
     `apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-layout-contract.test.ts`
     (lines 349 to 356) requires exactly one in `exercise.tsx`, on the pane
     root.
   - The `ExerciseData.taskBrief` type (lines 81 to 92) gains `target`,
     `placeholder` and `line` per step; `title` and `intro` become optional.
4. The brief component (`task-stops-brief.tsx`, new, replacing the workspace
   branch of `exercise-brief.tsx`). Heading, note and stops. It reads the
   store with `useSyncExternalStore` and shows the build-time `step.line`
   until the editor attaches. Its root carries the `challenge-brief` class
   (the CSS scope in Section 1) and keeps `data-testid="exercise-brief"`.
5. `packages/ui/src/mdx/hint-panel.tsx`. Extract the ladder state into
   `useHintLadder(hints, onHintRevealed)`. Two pieces share it: `HintRungs`
   (the revealed rungs, the focus target and the always-mounted live
   region) and `HintButton` (the next-rung button: "Get a nudge", then "Get
   more guidance"). The `ladder` presentation renders exactly as it does
   today. Remove the `inline` presentation: its only caller is
   `lesson-content.tsx` lines 720 to 725, which this spec replaces.
6. `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx`. With
   `exerciseWorkspace`, pass `lesson.hints` and `handleHintRevealed` into
   `Exercise`, and skip the lesson-level `HintPanel`.
7. `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx`. In
   workspace mode, pass `left={null}` to `LessonShell` for the Challenge.
   The right instance receives `onHintRevealed={handleHintLevelRevealed}`.
   Hint analytics keep their meaning: each reveal reports its level, and
   `hintsUsed` is read at submit.
8. `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-shell.tsx`. Render
   the left wrapper only when `left` is not null. Today it always renders
   (lines 77 to 81), and inside `.challenge-workspace-grid` (`gap: 24px`)
   an empty wrapper would still add a row and a gap.
9. `apps/web/app/components/lesson-visuals/lesson-visuals.css`.
   - Replace the `.challenge-task-*` rules and the `.challenge-task-panel`
     grid with the stops styles, the container queries and the editor mark
     classes.
   - The mark rules must outrank Sandpack's scoped active-line and gutter
     styles.
   - Define `--iv-brass` on `.lesson-challenge-workspace` (Section 2).
   - Add the `.lesson-prose` overrides for `.challenge-brief` and
     `.challenge-hint-content` (Section 1).
10. Content.
    - `packages/content/src/schemas.ts` and
      `packages/content/velite.config.ts`: `taskBrief.title` and
      `taskBrief.intro` become optional; `steps[].target` (an identifier)
      is required; `steps[].placeholder` is optional with default `"null"`.
    - The computed `steps[].line` is output only. `velite.config.ts` does
      not accept it as input, because the YAML never carries it; the
      transform adds it. `schemas.ts`, which validates the built output,
      requires it: `packages/content/src/contract.test.ts` (lines 31 to 35)
      deep-compares `exerciseSchema.parse(exercise)` with every built
      exercise, and Zod would strip an undeclared field and fail that test.
    - An object-level transform computes `steps[].line` by running
      `scanStops` over the transpiled starter. `tsToJs` drops blank lines,
      so the YAML's own line numbers differ from the editor's. The build
      fails unless each target has `matches === 1` and the Waiting state:
      the transform throws. It cannot rely on `ctx.addIssue`, because
      velite 0.4's CLI defaults `--strict` to false and that overrides the
      config's `strict: true`, so an issue would only be logged (verified
      2026-10-10; recorded in the backlog).
      The transform lives in `packages/content/src/task-brief-lines.ts`, so
      the tests can call it and turbo's `src/**` input hashes it. It imports
      the scanner by relative path (item 1).
    - `create-a-tensor.yaml` gains `target: reading` and `target: shape`,
      loses `title` and `intro`, and gets the new `support` line.
    - `01-introduction-to-tensors.mdx` gets the new hints.

## Section 6: edge cases

- A declaration deleted or commented out: no frame or gutter mark for that
  stop; its key moves the caret to the build-time line, clamped. Nothing
  throws, including on a one-line document.
- Different code that might still pass (for example `tf.tensor1d(...)`): the
  stop stays active and the tests decide.
- Autocomplete: nothing renders under any line, so the completion list
  covers nothing the learner needs.
- Theme switch: Sandpack's reconfigure keeps the `extensions` array in its
  list, so the marks survive a scheme change.
- Drafts: the starter does not change, so saved drafts load as they do
  today, and the marks are computed from whatever the draft holds.

## Section 7: the eight defects, closed

| Defect | Fix |
| --- | --- |
| 1. Floats on the page | The brief is the head of the editor's frame |
| 2. Chip soup at 11.9 px | Plain mono inline code; nothing under 12 px |
| 3. Faintest code to type | The editor's own 16 px code on the wash |
| 4. Sprawl | One row per line, read left to right |
| 5. Orphaned help | Help sits with Show Solution and opens under the code |
| 6. No hierarchy | A 20 px heading paired with "Expected tensor"; 15 px step titles |
| 7. Repetition | No intro; one note covers `tf` and the supplied lines |
| 8. No link to the code | Generated heading, Line keys, framed nulls, bold line numbers |

## Tests

Unit (Vitest):

- `scanStops` (in `packages/shared/src/scan-stops.ts`):
  - On the built starter it finds lines 3 and 4, both Waiting, each with
    `matches: 1`; a duplicated declaration gives `matches: 2`.
  - Typed detection: exact match, extra whitespace and a missing semicolon
    are Typed; `tf.tensor1d(streamValues)` is Other code.
  - A deleted or commented-out declaration is Missing (`line: null`).
  - One-line and empty inputs do not throw, and an inserted line shifts
    the stops.
- `task-stops.test.ts` (the extension):
  - On an `EditorState`: each state yields the frame and gutter class from
    the Section 4 table, and a transaction that replaces the whole document
    recomputes the stops.
  - On an `EditorView` mounted in jsdom: `select(index)` focuses the view
    and produces the selection the table names, clamped on a short
    document.
- `useTaskStops` (with `renderHook`): the store and the extension array
  keep their identity across re-renders of the same slug and change for a
  new slug.
- `task-stops-brief.test.tsx`:
  - Heading text for one, two and three stops, sorted and de-duplicated.
  - Build-time labels before attach, live labels after a store update.
  - Typed classes and the hidden ", typed" text.
  - A key press calls `select`; `aria-describedby` is wired; keys carry
    `aria-disabled` before attach.
- `hint-panel.test.tsx`: `useHintLadder`, `HintRungs` and `HintButton`
  (focus moves to the revealed rung, "Nudge revealed." is announced, the
  label changes). The `ladder` tests pass unchanged; the `inline` tests are
  replaced.
- `lesson-content.test.tsx`: with `exerciseWorkspace`, `lesson.hints` and
  the reveal callback reach `Exercise` (its `@tensorcraft/ui` mock already
  stubs `Exercise`), and no lesson-level `HintPanel` renders.
- `lesson-steps.test.tsx`: it stubs `LessonContent` and renders with
  `exercises={[]}`, so the workspace cases need a one-exercise fixture.
  With it: the Challenge passes `left={null}`, and the right instance
  receives `onHintRevealed`. Non-workspace lessons render as before.
- `apps/web/app/worlds/[slug]/[module]/[lesson]/__tests__/lesson-shell.test.tsx`:
  no left wrapper when `left` is null.
- Content:
  - Velite validation fails on a missing target declaration, a duplicate
    one, and a missing placeholder.
  - `guidance-hint-dictation.test.ts` covers the new guidance.
  - Gate B in `metadata-consistency.test.ts` skips a lesson with no solution
    rung, but its count pin `EXPECTED_SOLUTION_HINTS` is 56 and would fail.
    Lower it to 55, with a comment naming this lesson and the 2026-10-10
    decision.

E2E (Playwright):

- `e2e/challenge-workspace.spec.ts`, partly rewritten. Two existing
  assertions break:
  - Line 81 measures `editorBox` from the whole `[data-exercise-workspace]`
    (lines 40 and 77), which will now contain the brief. Measure
    `[data-editor-frame]` instead, with `>=`: the frame now starts exactly
    where the brief ends, so the strict `toBeGreaterThan` would fail.
  - Lines 121 to 131 expect the "Get a nudge" button, the focused rung
    (`[tabindex='-1']`) and the "Nudge revealed." status inside one
    `.challenge-hints` element. The button now sits in the actions row and
    the rungs above it; assert each in its new place.

  New assertions:
  - The brief sits inside `[data-exercise-workspace]`, above
    `[data-editor-frame]`.
  - The brief is at most 230 px tall at 1,440 and at most 360 px at 390.
  - Editor line 3 ends inside the first screen at 1,440 by 900, measured
    before the `scrollIntoViewIfNeeded` at line 42.
  - The key labels equal the gutter numbers on `.cm-task-line`.
  - Line 3 focuses the editor with `null` selected; typing replaces it, and
    the stop takes the typed state.
  - Reset restores the frames.
  - Opening help leaves `.cm-content` where it was.
  - At 390, each stop's code sits within 320 px of its line.
  - Axe stays clean at all five widths.
- `e2e/lesson-layout.spec.ts`, lines 711 to 731, rewritten: the test runs on
  this lesson and asserts the brief sits outside the pane with no `h3` in
  it. For the workspace it should assert the brief inside the pane, one
  `h3`, and the brief above the editor frame.
- `e2e/exercise-run.spec.ts`, line 111: its 65 px rule measures the editor
  frame from the top of `[data-exercise-workspace]`, which will now hold the
  brief. Replace it with the check the rule stood for (decided in the plan).
- `e2e/lesson-continuity.spec.ts`, line 169: "five readings" survives in the
  result line.
- `e2e/lesson-characters.spec.ts`, lines 74 to 78: it hovers a character
  mention inside the brief, and the only one ("Farah", in the old support
  line) goes. Retarget it to the mission header's "Demir" on the same step.
- `e2e/editor-drafts.spec.ts`, lines 17 to 21: it clicks an "Editor" toggle
  below 1,024 px that the workspace never renders. That case is red on main
  already; drop the click.
- `e2e/accessibility.spec.ts`, line 127: the Challenge-step axe audits fail
  on main today and pass with this change, because no unhighlighted
  `pre code` is left on the step.
- Visual baselines: `e2e/visual/lesson.spec.ts` covers Briefing and Concept
  only, so no baseline changes.

Build verification: run `pnpm turbo build:content --force` and
`pnpm typecheck`, not only the unit tests. Vitest resolves imports that
`velite build` cannot, and `--force` stops a cache hit from passing the
step without building (Section 5, item 1).

## Docs

- `docs/architecture.md`: the `HintPanel` row (line 252), the
  `ExerciseBrief` row (line 256) and the `lesson-content.tsx` row
  (line 281), plus new rows for the stops brief, the `task-stops`
  extension and `scanStops`.
- `docs/post-launch-backlog.md`: a "Challenge task stops follow-ups"
  section for the two findings this change does not fix (velite's ignored
  `strict: true`, and the flaky `exercise-autocomplete` e2e).
- Memory gets the shipped state once the change lands.

## Rollout

One change, this lesson only, no migration and no flag. Drafts are
unaffected. Hint analytics change in one way: level 3 reveals stop for this
lesson, because the rung is gone. The main risk is the workspace-only move
of the brief and help into the pane; the unit and e2e changes above cover
it.

## Open questions

None blocking. The plan decides what replaces the 65 px rule in
`exercise-run.spec.ts`.
