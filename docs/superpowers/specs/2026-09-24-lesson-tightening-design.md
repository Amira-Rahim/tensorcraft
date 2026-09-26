# Lesson page tightening: seven fixes in place

Date: 2026-09-24. Status: draft for owner review. This is direction A of the
2026-09-24 lesson audit; the owner ordered "A then B then C" the same day.
It follows `docs/superpowers/specs/2026-09-23-lesson-layout-design.md`,
which stays in force: the frame, the paired grid, the Briefing story grid,
the spacing scale and the one-H1 rule are unchanged unless a section below
says so.

Steps are numbered 1 to 6 as in that spec: 1 Briefing, 2 Concept, 3 Code,
4 Challenge, 5 Takeaways, 6 Complete. The code's `currentStep` is
zero-based.

## Why

On 2026-09-24 the owner asked whether the lesson page is the best
experience it can be. Every step of lesson 1 was walked on the production
build as a signed-out visitor, at 1,440 by 900 and 390 by 844, dark scheme,
with Playwright; the exercise gate was opened with Show solution. The
2026-09-23 layout holds. Eight defects sit inside it:

1. The Code step re-serves the Concept step's code blocks with 24 new
   words. That is direction B, not this spec.
2. The consent banner is 202 px tall at desktop and 248 px on a phone (29%
   of the screen). For a first visitor it covers the last story beat and the
   divider for the whole 17-second scene, and when the scene ends Continue
   sits under it. Playwright could not click Continue until it dismissed
   the banner.
3. The recall card on Takeaways sits directly above the recap bullet that
   states its answer.
4. On a phone the Challenge step's Instructions view holds 23 words while
   the task itself sits under Editor (459 words). The exercise header row
   breaks inside words at 390 px ("EXERCIS / E", "Beginne / r").
5. Every code block on the Concept step scrolls sideways on a phone, with
   47 to 56% of each line hidden, including the trailing comments that
   carry the explanation.
6. The step bar has six unlabeled segments; only the badge names the
   current step.
7. The Complete step prints the title in the chrome and again under the
   badge, and offers a next-mission card and a Next Lesson button for one
   action. Its "Fade out" marker sits at 1.23:1 and cannot be read.
8. The 4 px offset accent shadow is on every container on the page, so the
   house signature reads as texture.

This spec covers items 2 to 8. Item 1 is direction B (five steps), its own
spec after this ships. Direction C (content of its own for the Code step)
follows B.

## Sequencing with B and C

Nothing here would be undone by B: the step labels read `STEP_NAMES`, so B
shrinks one array; the recall split, the brief split, the consent bar, the
code wrapping and the shadow rule do not depend on the number of steps. C
is a content project; nothing here touches lesson MDX, YAML or exercise
text, so the two do not collide.

## Decisions

| Question | Choice | Alternative |
| --- | --- | --- |
| The consent bar | Fixed to the bottom, one bar on the frame's width, no card, no shadow; the page reserves the bar's height below its content so nothing is ever covered; copy unchanged | An in-flow bar at the top, under the guest notice: it pushes the chrome and the scene down, against the story-first rule. A slimmer card with no reserved space: it still covers whatever ends near the fold |
| The recap after the recall | The recap, the milestone and the next-lesson block render once every recall card on the step has been answered or revealed; remembered per lesson in this browser, and a lesson the server knows is complete counts as settled | Reveal after the first card (24 of 56 lessons carry two or more). Gate Continue on the recall: rejected, the recap is a summary, not new work |
| Where the exercise brief lives | The left column: the chips, title, instructions and the exercise's own hint ladder move beside the editor; the pane keeps the eyebrow, and shows the exercise's title beside it when the lesson has more than one exercise | Move both hint ladders into the pane and leave the left column with the one-line challenge zone: the phone labels stay false |
| Code on phones | Wraps below 1,024 px with a 2 ch hanging indent; the editor wraps its lines at every width | 14 px code on phones: still hides a third of each line. A visible scroll affordance: the comments stay off-screen |
| Step labels | Under each segment from 1,024 px; the badge stays at every width | Labels at every width: six labels do not fit 390 px |
| Step 6's name | "Epilogue" in the bar, the badge and the accessible names; analytics keeps "Consequence" | Keep "Consequence" everywhere: no test or query churn, and a learner reads "Consequence" as a warning |
| The Complete step's title | The closing card is the step's H1 and the chrome title is hidden, as on step 1 | Keep the chrome title and drop the centred one |
| The Complete step's forward control | The nav row's forward slot becomes the next-mission control; the body card goes | Keep the body card and drop the nav link |
| The accent shadow | A container that asks the learner to act keeps it; a container that presents sits on a hairline | Keep the shadow on every container |

Two things this spec leaves as they are, on purpose: the passed-challenge
banner's Continue beside the nav row's Continue (the 2026-07-14 audit put
the way forward where the pass lands, and on a phone the banner is hidden
under the Instructions view, so the nav's control is the only one there),
and the scene's length (owner call, 2026-08-23).

## Goal and success criteria

Measured on lesson 1 (`foundations/introduction-to-tensors`) on a
production build, dark scheme, signed out, scene resolved, at 1,440 by 900
and 390 by 844 unless a line says otherwise:

- Consent: with no consent stored, the bar is at most 64 px tall at 1,440
  and at most 160 px at 390. Scrolled to the page end on the Briefing, the
  nav row's bottom edge is at or above the bar's top edge. `document.body`
  carries a bottom padding equal to the bar's height while the bar is
  shown, and none after a choice.
- Takeaways: on first arrival the step shows the Takeaways chip, the
  recall card, the nav row and nothing else. After the card leaves its prompt state the recap and
  the terms list appear below it. Reopening the step in the same browser
  shows all of it at once, with the card back in prompt state.
- Challenge, desktop: the left column holds the challenge heading, its
  paragraph, the exercise's chips, title and instructions, and the hint
  ladder; the pane holds the eyebrow, the editor, its controls, the results
  and the bridge line, and no `h3`. Phone: the Instructions view holds that
  left column; the Editor view holds the pane; at 390 px the brief's header
  row wraps only between chips, and no chip's box is taller than one line
  of its text.
- Code: at 390 px every `pre` on the Concept and Code steps has
  `scrollWidth <= clientWidth`; a wrapped continuation line starts 2 ch in;
  the editor shows its starter code with no horizontal scrollbar.
- Step bar: at 1,440 six labels are visible, each inside its own segment's
  box, the current one in the accent colour; at 390 no label is visible;
  every segment's hit box is at least 24 px tall at both widths; the badge
  reads "1 / 6 · Briefing" and "6 / 6 · Epilogue".
- Complete: exactly one H1, the centred title; the chrome shows the module
  name only; the nav row's forward control names the next lesson; nothing
  outside the nav row carries `data-testid="next-lesson-card"`; the "Fade
  out" marker measures at least 4.5:1 against the page in both schemes.
- Shadow: on the Concept step no code block, bridge callout, objectives
  box or drawer carries an offset shadow; on the Challenge step
  the exercise pane and the hint ladder do and the results panel does not;
  on Takeaways the recall card does and the recap does not.
- Every existing suite stays green except where the tests section names a
  change, and the accessibility suite (both schemes, every step) stays
  green with no new exemption.

## Non-goals

- No edit to lesson MDX or YAML, exercise text, hints or the consent copy.
- No change to the step machine, its `tc_step_` and `tc_step_max_` keys or
  its analytics events. Section 2 adds one new key beside them. One label
  string changes in the bar; event names do not.
- No change to scene playback, the paired grid, the Briefing story grid or
  the spacing scale.
- No change to marketing, dashboard, settings or onboarding surfaces; the
  shadow stays there.
- No gate on the recall card; Continue stays available on Takeaways.

## Section 1: the consent bar

`apps/web/app/components/cookie-consent.tsx` today: a fixed region with
16 px padding holding a 640 px card (`max-w-160`, `p-5`,
`brutalist-shadow`), a 14 px mono paragraph and a button row. It measures
202 px at 1,440 and 248 px at 390.

The region stays `fixed bottom-0 left-0 right-0 z-50 animate-fade-up` with
its `role="region"` and label, loses its padding, and becomes the bar
itself: `border-t border-border bg-surface-raised rounded-none`, full
width. Inside it,
one frame wrapper on the lesson frame's width and padding (`mx-auto w-full
max-w-7xl px-5 md:px-12 py-2`), laid out `flex flex-col gap-3` below `md`
and `md:flex-row md:items-center md:justify-between md:gap-6` from it. The
paragraph drops to `text-xs` and loses its bottom margin; its words and the
Privacy Policy link are unchanged (privacy audit wording, 2026-08-16). The
buttons keep their classes, lose `brutalist-hover`, and sit in a `flex
flex-wrap gap-3 shrink-0` row. `data-testid="cookie-consent-card"` moves from the inner card to the
region root, which is now the bar, so `cookie-consent.test.tsx` keeps its
hook; that test drops its shadow assertion (see Tests). The shadow goes (section 7).

Expected height: at 1,440 the text runs two lines of 12 px mono beside the
buttons, so the bar is the 44 px button plus 16 px padding, 60 px. At 390
the text runs four lines (72 px), a 12 px gap, the 44 px buttons and 16 px
padding: 144 px.

Reserved space. While the bar is mounted it publishes its height: an
effect reads the region's `getBoundingClientRect().height` on mount and
sets `--tc-consent-h` on `document.documentElement`; a `ResizeObserver` on
the region (guarded, jsdom has none) updates it on wrap changes; the
cleanup removes the property. `globals.css` adds `body { padding-bottom:
var(--tc-consent-h, 0px); }`. The page grows by the bar's height at its
end, so scrolled to the bottom every page shows its last row above the bar,
and no page's layout changes once a choice is made. Accept and decline are
unchanged. In jsdom the height reads 0, so the effect still writes the
property, as `0px`, and the unit test accepts that value.

Four other fixed elements share the bottom edge and `z-50`: the Report
issue button (`report-issue-button.tsx`, rendered after the bar, so it
would paint over the bar's right end where the buttons sit), the session
toast, the GitHub nudge toast, and the lesson drawer's phone sheet. Each
adds `var(--tc-consent-h, 0px)` to its bottom offset, so it sits above the
bar while the bar shows and returns to its place after a choice. Body
padding moves none of them, which is why each needs the offset itself.

Amended 2026-09-25 during the build, from the Task 2 quality review. The
site sets `viewportFit: "cover"`, so the bar's bottom padding is
`max(0.5rem, env(safe-area-inset-bottom))` and clears the iOS home
indicator; the measured height includes it. The Report issue panel's
bottom is `max(16px, env(safe-area-inset-bottom), 16px + the bar's
height)`, so it does not count the inset twice. The lesson drawer's sheet
caps its height at `min(70dvh, 100dvh - 1rem - the bar's height)`, and
2.5rem from `md` where the sheet floats 1.5rem up, so a phone in
landscape keeps its Close control on screen. Two more fixed
layers read the property: the mobile menu ends at the bar's top edge, and
the glossary popover clamps above it. The success criterion's end-of-page
check also covers the footer, whose last row holds "Cookie settings", since
the nav row sits above the footer and held even without the padding.

Amended 2026-09-25, from the final review. The floating Report issue
button this section names was removed on 2026-09-19 (`80a3f029`): its
trigger sits in the site chrome and the footer, and only its panel is
fixed, so the panel's offset above is the one that matters. Body padding
clears the bar only at the page's end, so a focused element inside the
bar's band counted as in view and stayed hidden under it. The root element
gains `scroll-padding-bottom: var(--tc-consent-h, 0px)`, so focus and
anchor scrolling stop above the bar (plan Task 9).

## Section 2: Takeaways, the recall before the recap

Today `StepTakeaways` renders one `LessonContent` instance with
`TAKEAWAYS_COMPONENTS` (`ProjectMilestone`, `LessonRecap`, `RecallPrompt`,
`NextLesson`) in `.lesson-prose max-w-[820px]` (`data-testid=
"takeaways-prose"`), then `LessonTermsList`. All 56 Deep Orbit lessons
carry a `RecallPrompt`; 24 carry two or more; in every lesson the first
`RecallPrompt` precedes `LessonRecap`. The card
(`apps/web/app/components/review-prompt-card.tsx`) has three states:
`prompt`, `revealed` (after Check, awaiting Got it or Needs work) and
`rated` (after a rating, or at once after I couldn't recall it).

The set splits in two, both exported through `STEP_VISIBILITY` so
`content-partition-contract.test.ts` keeps every component reachable:

- `TAKEAWAYS_RECALL = {"RecallPrompt"}`, rendered first in its own
  `.lesson-prose max-w-[820px]` wrapper, `data-testid="takeaways-recall"`.
- `TAKEAWAYS_AFTER = {"ProjectMilestone", "LessonRecap", "NextLesson"}`,
  rendered in the wrapper that keeps `data-testid="takeaways-prose"`,
  followed by the terms list, only once the recall is settled.

Settled means every card on the step has left `prompt`, or this browser
remembers the lesson's recall as done, or the server already reports the
lesson complete (`knownCompleted` in `LessonSteps`; it lands a returning learner on the
Complete step, and this rule covers them when they step back here).

`LessonContent` gains `onRecallPending?: (pending: number) => void`. Its
`RecallPrompt` binding (lesson-content.tsx, the wrapper that already calls
`trackRecallAnswered`) registers each rendered card in a ref set on mount,
removes it on unmount or on the card's first `onAnswer` call (attempted or
bailed; the later rating call changes nothing), and reports the set's size
after every change, including once after the instance's first commit so a
body with no card reports 0. The set is a ref and the callback is read
through a ref updated on every render: neither joins the `components`
memo's dependency list, because a new dependency rebuilds the MDX component
and remounts the tree (the comment above the visibility sets explains the
trap), which would snap every revealed card back to its prompt the moment
the recap appeared.

The state lives in `LessonStepsInner`, not in `StepTakeaways`: the left
column is keyed on the step, so `StepTakeaways` remounts on every visit,
and the restore effect, the storage key, the account owner and
`knownCompleted` are all `LessonStepsInner`'s. It keeps `recallSettled`,
false until the first report and true from the first report of 0; once
true it stays true for the mount, so a later non-zero report (a card
re-registering) never hides the recap again. It passes `recallSettled` and
the report handler to `StepTakeaways` as props. When a report reaches 0
after at least one card was pending, it writes the recall key, and it
reads the key back in the effect that restores the step, so the stored
value settles in the same commit as `mounted`. The key follows
`getStorageKey`:
`tc_recall_${worldSlug}_${lessonSlug}`, with the same `:account:<owner>`
suffix for a signed-in reader and the same guarded storage access, so a
guest's flag never reads as an account's.

Nothing moves focus when the recap appears; the card already moves focus
to its revealed answer and announces "Answer revealed." through its own
live region. The cards stay in the DOM in prompt state on every visit, so
a learner can practise again without losing the recap. Continue is never
disabled by this. The 24 lessons with two or more cards show all of them
first and reveal the recap after the last one; the alternative in the
decisions table reveals after the first.

Amended 2026-09-25, from the final review. `knownCompleted` comes from the
server's `lessons` prop only, so a guest who finished the lesson, returned
to the Complete step and stepped back saw only the card. The restore
effect also settles the gate when this browser holds a guest completion for
the lesson, the same record the completion effect already merges (plan
Task 9).

## Section 3: Challenge, the brief beside the editor

Today the left column is `PhaseChip` plus the `CHALLENGE_LEFT` instance:
the `## Challenge` heading, its paragraph, and the lesson's hint ladder,
which `LessonContent` appends from `lesson.hints` as the instance's last
child (lesson-content.tsx line 625). The pane is the `CHALLENGE_RIGHT`
instance (`Exercise`) and the passed banner. `Exercise`
(`packages/ui/src/mdx/exercise.tsx`) renders its header row (eyebrow,
difficulty chip, ML-content chip, minutes), the `h3` title, the
instructions, the exercise's own hint ladder when it has one (added
2026-09-13; corrected 2026-09-25: most are second exercises, but
`ci-cd-gate`, `verify-deployment` and `browser-ml-tradeoffs` are first or
only ones), then the editor, controls, results, console and
bridge line. 48 lessons have one exercise, 7 have two, 1 has three.
`Exercise` is mounted nowhere else.

Change:

- A new module `packages/ui/src/mdx/exercise-brief.tsx` exports
  `ExerciseBrief({ slug, onHintRevealed })`. It renders: a header row `flex
  flex-wrap items-center gap-x-3 gap-y-1` holding the eyebrow "Exercise",
  the difficulty chip, the ML-content chip and the minutes, every one
  `whitespace-nowrap`; the `h3` title; `InstructionText`; and the
  exercise's own `HintPanel` when it has hints. `ExerciseDataContext` is
  private to exercise.tsx today, and that file imports Sandpack at module
  level, so the context, `ExerciseDataProvider`, the chip configs
  (`difficultyConfig`, `mlContentConfig`) and the not-found card move to a
  shared module, `packages/ui/src/mdx/exercise-data.tsx`, with no Sandpack
  import; exercise.tsx and the mdx index re-export the provider so
  lesson-content.tsx and the root index keep their import path.
  `InstructionText` already lives in its own module and stays there.
  `Exercise` stays behind the `dynamic()` import in lesson-content.tsx
  (round-12 perf fix); the brief is imported statically.
- `Exercise` gains `brief?: "inline" | "external"` (default `"inline"`,
  today's tree) and `titled?: boolean`. With `"external"` it renders the
  pane root, the eyebrow, and everything from the editor down; no chips,
  no minutes, no title, no instructions, no hint ladder. With `titled`,
  set when the lesson has more than one exercise, the eyebrow row also
  carries the exercise's title in `text-xs text-text-muted`, so a learner
  can match each editor to its brief in the other column. A numbered
  "2 of 3" was rejected: the lesson's exercises list comes from velite in
  file order, which differs from body order on `capstone/05-launch`, so a
  number would need a build-time order and a title needs nothing. In both
  modes the header row gains `flex-wrap gap-y-1` and its items
  `whitespace-nowrap`, which is the phone fix for item 4.
- `CHALLENGE_LEFT` gains the pseudo-name `"ExerciseBrief"` (like
  `"challenge"` and `"prose"`, it names no MDX component, so the partition
  contract test is unaffected). Both `Exercise` bindings in
  lesson-content.tsx (with and without the world and lesson ids) render `<ExerciseBrief>` when the instance's set has
  `"ExerciseBrief"`, and the external-brief `Exercise` with `titled` set
  from the exercise count when it has `"Exercise"`, each at the MDX
  element's position. With
  no set, or an empty one, `shouldShow` is true for every name; there the
  binding renders today's `<Exercise brief="inline">` alone, never both.
  Every production call passes a set, but the path exists. The brief's
  `onHintRevealed` is the left instance's existing prop, so both ladders
  count into the same hints-used figure the pane reads at submit.
- The left column therefore reads: challenge heading, its paragraph, the
  brief (chips, title, instructions, its own ladder if any), the lesson's
  ladder. On lesson 1 that is about 700 px beside a 1,050 px pane. The
  `data-show-challenge` reveal is unchanged: it revert-displays the
  heading's following siblings; the brief is a component root, which the
  prose-hide rules never hide.
- Phone: the Instructions and Editor toggle and its labels are unchanged;
  the Instructions view now holds the brief.

## Section 4: code on phones

`.lesson-prose pre` scrolls (`overflow-x: auto`, globals.css line 609).
`CodeBlock` (`packages/ui/src/mdx/code-block.tsx`) wraps Shiki's output,
`<pre class="shiki"><code><span class="line">...</span>` with a newline
text node between lines, in a scrolling div; its unhighlighted fallback is
a plain `pre`. At 390 px the three Concept blocks of lesson 1 measure
scrollWidth 653 to 796 against clientWidth 306 to 348.

Below the one-column breakpoint the code wraps:

```css
@media (max-width: 1023px) {
  .lesson-prose pre {
    white-space: pre-wrap;
    overflow-wrap: anywhere;
    overflow-x: visible;
  }
  .lesson-prose pre .line {
    display: inline-block;
    width: 100%;
    padding-left: 2ch;
    text-indent: -2ch;
  }
}
```

Each line is a full-width inline block, so a wrapped continuation starts
2 ch in and the preserved newline after the block ends its line. The
measurement at the head of the section 4 task: in Chromium at 390 px,
lesson 1's Concept step shows no blank line between code lines and every
`pre` fits its box. If the newline text nodes do add blank lines, the
fallback is a Shiki transformer in `code-block.tsx` that drops those nodes
(`transformers` on `codeToHtml`), with `.line` set to `display: block`.
The Copy button copies the source string, not the DOM, so it is unchanged.
The unhighlighted fallback wraps without the indent, and so do the 14 raw
fenced blocks in six paid lessons, which the content build does not
highlight and which have no `.line` spans; the indent criterion is for
`CodeBlock` output, which is every block in lesson 1. If the transformer
is needed, the local `codeToHtml` type in code-block.tsx, which narrows
the options to `lang` and `theme`, widens to admit it. From 1,024 px
nothing changes; lines fit the 820 and 1,184 px boxes (corrected
2026-09-25: most lines fit, and at 1,440 one of lesson 1's Concept blocks
still scrolls sideways).

The editor: `SandpackCodeEditor` gains `wrapContent`, at every width. At
desktop the starter code never reaches the editor's width, so the change
shows only on phones, where the starter comments are the task's steps.
The keyboard-access contract on the editor (`e2e/exercise-run.spec.ts`) is
unaffected.

Amended 2026-09-25 during the build, from the Task 7 quality review. The
media query is written `(width < 64rem)`, the form the stylesheet already
uses for Tailwind's `lg`. The editor's `wrapContent` shows at desktop too:
59 of 65 starters have a line wider than the 1,440 px editor, so the
sentence above about desktop is wrong, and wrapping stays on at every width
because the step comments were scrolled off there as well. The exercise
instructions' pseudo-code blocks, which Task 6 moved into the narrower brief
column, wrap at every width with the same 2 ch hanging indent, set by their
own classes.

Amended 2026-09-25, from the final review. The lesson's swipe handler
treated any touch inside `pre` or `code` as a sideways content pan. Wrapped
blocks never pan and are taller (lesson 1's two blocks reach 755 and
1,063 px at 390), so most of a phone Concept step ignored swipes. The
handler now suppresses the swipe only when the nearest block's
`scrollWidth` exceeds its `clientWidth`; the editor stays excluded
unconditionally. The pseudo-code blocks in the brief also lose their
`tabIndex`, which existed for axe's scrollable-region rule and has nothing
to scroll now (plan Task 9).

## Section 5: step labels

`ChromeBar` (lesson-steps.tsx) renders six `flex-1 h-6` buttons holding a
6 px bar each, with `aria-label="Step N: Name"`, a `title`, and
`aria-current` on the current one; the badge beside the bar reads
"N / 6 · Name".

Each button becomes a column: the bar on top, the name under it, `hidden
lg:block text-[11px] font-mono uppercase tracking-wider truncate
text-left`. The button gains `min-w-0`, without which `truncate` cannot
act on a `flex-1` item. It is `h-6` below `lg` and `h-8` from it, so the
hit box stays at or above the 24 px minimum. Colours: the current step's label
in `var(--tc-primary)`, a visited step's in `var(--tc-muted)`, a locked
step's the same at the bar's 0.45 opacity. The label is `STEP_NAMES[i]`,
so the accessible name contains the visible text (WCAG 2.5.3). At 1,024
the bar is about 500 to 540 px wide, 80 to 86 px per segment; "TAKEAWAYS"
at 11 px mono with tracking is about 64 px, so `truncate` is a fallback.
Amended 2026-09-25 from the Task 3 quality review: hover dims the bar only,
because dimming the whole button took the label below AA in the light
scheme; a locked step's bar and label are dimmed by class, not inline style. The badge is unchanged at every width.

Step 6 is renamed. `STEP_NAMES[5]` becomes `"Epilogue"`: the bar, the
badge, the button labels and the step group's `aria-label` all read it. A
new `STEP_EVENT_NAMES` array keeps `"Consequence"` for the `stepName`
field of `lesson_step_viewed` and every other event that reads a step
name, so PostHog queries and `scripts/analytics/module1-baseline.mjs` are
untouched. Code comments and the `StepConsequence` identifier stay.

## Section 6: the Complete step

Today the chrome shows the lesson title as the H1 on steps 2 to 6. The
step body prints "Fade out" (9 px, border colour, `data-decorative`), the
epilogue slugline, the epilogue plate where one exists, the "Mission
complete" badge, an `h2` with the lesson title, the italic narrative, the
epilogue content, the guest email capture, a next-lesson card
(`data-testid="next-lesson-card"`), and the nav row with Back and a "Next
Lesson" link.

- `ChromeBar` hides its title on the last step as it does on the first:
  `showTitle = currentStep !== 0 && currentStep !== TOTAL_STEPS - 1`. The
  centred title becomes the `h1`, same classes. The closing card is the
  step's identity, as the opening card is step 1's; the one-H1 rule holds.
- The body card is removed. In `bottomNav`, the `nextLesson` branch renders
  the next-mission control in the forward slot: a `Link` filled in
  `var(--tc-primary)` on `var(--tc-on-primary)`, `min-h-11 px-6 py-3`,
  two lines of text left-aligned, the eyebrow "Next {lesson term}" in 9 px
  mono uppercase and the next lesson's title in 15 px semibold, an arrow at
  the right, `data-testid="next-lesson-card"` carried over. The
  no-next-lesson branch ("Back to {lesson term} Map") is unchanged. The
  guest email capture stays where it is, above the nav.
- "Fade out" (the DOM text is "Fade Out") becomes readable: one size up from the
  Cut to label, `text-[10px]`, in its colour, `var(--tc-muted)`, `data-decorative` removed,
  `aria-hidden` kept. It is atmosphere, so screen readers still skip it;
  sighted readers can now see it. The accessibility suite's decorative
  skip rule stays for anything else that uses it.

## Section 7: the accent shadow

`.brutalist-shadow` (globals.css line 93) is the 4 px offset in the accent
colour. On the lesson page it marks a container the learner acts in, and
nothing else.

Keeps it: the exercise pane (exercise.tsx line 964), `ReviewPromptCard`
(the recall card and the warm-up card), `HintPanel`, the `BossBeat`
decision boxes (three roots), `Quiz`, `InteractiveDemo`.

Loses it, keeping its hairline border: `CodeBlock` (line 83),
`BridgeCallout` (both roots, lines 93 and 156), `LearningObjectives`,
`KeyTakeaways`, `LessonRecap`, `DerivationDrawer`, `Concept` (both roots),
`MathBlock` (both roots), the `NextLesson` MDX card, `DispatchTease`,
`StrategyThread`, the test-results panel, the console panel and the
not-found card in the exercise file (exercise.tsx lines 342, 457 and 932;
the card's class leaves with it when it moves to exercise-data.tsx),
and the consent bar (section 1). Buttons keep `brutalist-hover`; a lift on
hover is a control affordance. The `NextLesson` MDX card is a link, so it
keeps its hover lift and its hover shadow and loses only the resting
shadow.

Marketing, dashboard, onboarding, settings, pricing, the newsletter modal,
the capstone client, the purchase page, the user menu and the trailer panel
are out of scope and unchanged. The light-scheme plate shadows
(`.tc-scene-portrait`, `.tc-art-plate`) are a different rule and stay.

## Section 8: components and files

| File | Change |
| --- | --- |
| `apps/web/app/components/cookie-consent.tsx` | The bar, the frame wrapper, the height property and its observer |
| `apps/web/app/components/report-issue-button.tsx`, `session-toast.tsx`, `github-nudge-toast.tsx`, the lesson `lesson-drawer.tsx` | Bottom offset adds `var(--tc-consent-h, 0px)` |
| `apps/web/app/globals.css` | `body` bottom padding from `--tc-consent-h`; the phone code-wrap block |
| `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx` | `TAKEAWAYS_RECALL` and `TAKEAWAYS_AFTER`, and the comment above the sets that says `RecallPrompt` lives only in `TAKEAWAYS_COMPONENTS`; `recallSettled`, its key and the report handler in `LessonStepsInner`, passed to `StepTakeaways`, which gates on them; `CHALLENGE_LEFT` gains `"ExerciseBrief"`; `ChromeBar` labels, heights and `showTitle`; `STEP_NAMES[5]` and `STEP_EVENT_NAMES`; `StepConsequence` h1, card removed; the nav's next-mission control; "Fade out" |
| `.../lesson-content.tsx` | `onRecallPending` and the card registrar; the `Exercise` binding renders the brief or the external-brief pane by set |
| `packages/ui/src/mdx/exercise.tsx` | `brief` and `titled` props; header row wraps between chips; results, console and not-found panels lose the shadow |
| `packages/ui/src/mdx/exercise-brief.tsx` (new) and `packages/ui/src/mdx/exercise-data.tsx` (new) | The brief; the exercise context, provider, chip configs and not-found card shared without Sandpack, with the provider re-exported from exercise.tsx and the mdx index |
| `packages/ui/src/mdx/code-block.tsx` | Only if the measurement in section 4 calls for the transformer |
| `packages/ui/src/mdx/index.ts` and `packages/ui/src/index.ts` | Both name their exports; both export `ExerciseBrief` beside `Exercise` |
| The shadow files in section 7 (eleven component files plus exercise.tsx) | Class removed |
| `docs/visual-regression.md` | Re-mint record for the Concept baselines and for the key-pages, responsive and worlds baselines (see Tests) |
| `docs/post-launch-backlog.md` | The audit's eight findings are not in the backlog yet. A dated heading, "Lesson audit (2026-09-24)", records them with their measurements; items 2 to 8 are checked with a pointer here, item 1 points to direction B, and the existing "Code step is thin" item gains the same pointer |

## Tests

- Unit, `cookie-consent.test.tsx`: mounting sets `--tc-consent-h` on the
  root element (`0px` in jsdom); a choice removes it; the existing "renders
  a brutalist card" test drops its shadow assertion and keeps `border` and
  `rounded-none`. `cookie-consent.snapshot.test.tsx` re-minted for the
  bar. `layout.test.tsx` mocks the component to null and the accessibility
  unit test runs axe on it; neither changes.
- Unit, `lesson-steps.test.tsx`: the chrome title renders on steps 2 to 5
  only (the existing test's name and steps change); step 6's one H1 is the
  centred title; the badge reads "6 / 6 · Epilogue" and the step group is
  "Step 6 of 6: Epilogue" (the padding test at line 554 pins the old name
  and changes); Takeaways renders the recall wrapper and no
  `takeaways-prose` until the content reports 0 pending, renders both when
  the recall key is set, and both when `lessons` marks the lesson complete;
  the recall key is written when pending drops from 1 to 0 and not when the
  first report is 0; the nav's forward control on step 6 carries
  `next-lesson-card`, the next title and the href; six segment labels
  render with the `lg:block` class. The file's `LessonContent` mock calls
  no callback today, so the existing Takeaways test (the terms list follows
  the prose) would never see `takeaways-prose`: the mock reports 0 pending
  on mount, which is what a body with no card does. Mocked content proves
  the mechanism only (2026-09-04 lesson); the e2e lines below prove the
  page.
- Mock factories: `lesson-content.test.tsx`, `lesson-steps.test.tsx`,
  `lesson-steps.playback.test.tsx` and `scene-clip.test.tsx` each mock
  `@tensorcraft/ui` with a factory. The two that enumerate `Exercise`
  (`lesson-content.test.tsx`, `lesson-steps.playback.test.tsx`) gain
  `ExerciseBrief` and keep `ExerciseDataProvider`, or the suite fails at
  import (the 2026-08-26 and 2026-09-17 trap); the other two are checked
  for the same shape.
- Unit, `lesson-content.test.tsx`: with two recall cards the instance
  reports 2, then 1 after one answers, then 0; with none it reports 0 once;
  a set holding `"ExerciseBrief"` renders the brief and no editor, a set
  holding `"Exercise"` renders the editor with `brief="external"`, and `titled` is set
  only when the lesson has more than one exercise.
- Unit, `packages/ui` exercise tests: `brief="external"` renders no `h3`
  and no instructions; the header row and chips carry `flex-wrap` and
  `whitespace-nowrap`; the brief renders the exercise's own ladder when it
  has hints.
- Contract, `lesson-layout-contract.test.ts` or a sibling: the code-wrap
  block sits under `@media (max-width: 1023px)` with `pre-wrap`, the
  `.line` hanging indent, and no selector deeper than `.lesson-prose pre
  .line`; `body` reads `--tc-consent-h`. Modelled on the paired-grid
  contract test.
- Playwright, `e2e/lesson-layout.spec.ts`: the Complete step's forward
  control sits inside the nav row with its right edge at the frame's edge
  (replaces the 40 px card-to-nav test); at 390 every `pre` on the Concept
  and Code steps fits its box, and each brief header chip is one line tall;
  at 1,440 six labels are visible inside their segments, at 390 none. Its
  `openStep` helper waits on `takeaways-prose` as step 5's settled marker,
  which the gate now withholds on a fresh arrival: the marker becomes
  `takeaways-recall`, and one new test seeds the recall key and expects
  the recap and the terms list at once.
- Playwright, the recall gate elsewhere: `e2e/end-of-lesson.spec.ts` lines
  15 to 39 assert the recap visible and below the card before revealing
  the answer; the test reveals first, then asserts. `e2e/worlds.spec.ts`
  line 250 opens Takeaways by storage and waits for the terms list; it
  answers or bails on the card first.
- Playwright, new `e2e/consent-bar.spec.ts`: a context with no consent key,
  lesson 1, scene resolved, both widths: the bar's height caps, the nav row
  above the bar at the page end, and `body`'s bottom padding equal to the
  bar's height; after Essential only, no padding.
- Playwright, `channel-experiment`, `editor-drafts`, `learning-routes`,
  `normalization-experiment`: "Step 6: Consequence" becomes "Step 6:
  Epilogue". `end-of-lesson.spec.ts` ("Mission Complete") and
  `lesson-layout.spec.ts` line 80 (a `^Step 6 of 6` regex) are unchanged.
- Accessibility: the existing suite covers every step in both schemes. The
  "Fade out" marker is now checked for contrast; it passes at
  `var(--tc-muted)`. No new exemption.
- Visual: the Concept baselines at 1,440 and 390 are re-minted with a
  written reason each in `docs/visual-regression.md`: the shadow leaves
  the code blocks, the callout and the objectives box, and at 390 the code
  wraps; at 1,440 the step labels also appear under the segments
  (section 5). The Briefing baseline at 1,440 is re-minted for the labels
  alone. The Briefing baseline at 390, where the labels are hidden, and the
  warm-up card snapshot are unchanged; the warm-up card keeps its shadow.
  Only the lesson visual spec
  and the review fixture store a declined consent. `key-pages`,
  `responsive` and `worlds` store none, so their committed baselines show
  today's card (the sign-in baseline has it across the bottom). Those three
  specs gain the same declined-consent init script, and their baselines are
  re-minted once with the reason "consent card removed from the frame".
  Before any code change, the plan runs each against the untouched tree
  and records the
  pre-existing pricing and world-page drift (noted 2026-09-15) in
  `docs/visual-regression.md`, so this re-mint does not absorb it
  unrecorded.

## Rollout

One branch, reviewed as one diff, in this order: the visual drift measurement on
the untouched tree (see Tests); the shadow rule (section
7); the consent bar (1); the step labels and the rename (5); the Complete
step (6); Takeaways (2); the brief (3); phone code (4), with its wrap probe at the head of that task;
tests and baselines. The owner commits; nothing is deployed from an
uncommitted tree.

## Open questions

None. The decisions table lists the alternative the owner can still pick
for each choice.
