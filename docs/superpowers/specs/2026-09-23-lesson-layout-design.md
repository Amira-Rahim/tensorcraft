# Lesson page layout: one frame, paired columns

Date: 2026-09-23. Status: implemented on 2026-09-24 (plan: `docs/superpowers/plans/2026-09-23-lesson-layout.md`), approved by the owner on 2026-09-23 (v4, after
three three-lens review rounds). The owner decision below is resolved:
unpairable companions span; the format tag moves to the eyebrow; row beats
are the dialogue-density ruling. Supersedes the rail-based lesson layout on every step
of `/worlds/[slug]/[module]/[lesson]`.

Steps are numbered 1 to 6 throughout: 1 Briefing, 2 Concept, 3 Code,
4 Challenge, 5 Takeaways, 6 Complete. The code's `currentStep` is zero-based
and calls step 6 "Consequence" (`StepConsequence`, `CONSEQUENCE_COMPONENTS`);
the plan translates.

## Why

On 2026-09-22 the owner reviewed the first lesson at desktop width and found
the right third of the page spent on a scene card that repeats the slugline
and the cast already shown on every dialogue beat. On the Briefing step that
column holds about 400 px of content beside a 1,600 px column; on a phone it
renders below the Continue button. A 68-character text column and a title
block that names the lesson twice sit on every step. The owner's words: "the
amount of waste in the design is unreal".

The spaced-review warm-up bug that blanked the page (a hidden scene box left
in the flow) was fixed on 2026-09-22 and is not part of this work.

## Decisions recorded during brainstorming (2026-09-22/23)

| Question | Choice | Rejected |
| --- | --- | --- |
| Scope | The whole lesson page frame | Briefing only; every rail step |
| What the width is for | Paired columns: readable prose beside what it is about | Wide measure; art-first with centred prose |
| The second column when nothing pairs | Marginalia aligned to its paragraph; unpaired prose spans | Strict grid with empty cells; sticky companion panel |
| The title block | Keep the two-tone title card, tighten everything around it | Title in the chrome; title printed over the art |
| How to build it | Flat DOM, CSS grid, `:has()` pairing | Build-time pair wrappers; measured margin notes |

Owner note on approval: "keep a good eye for the spacings between elements";
the Continue control must never sit close to neighbouring text. Section 6
turns that into a scale.

Two decisions taken after the reviews, each with the alternative the owner
can still choose:

| Question | Choice in this spec | Alternative |
| --- | --- | --- |
| Companions that follow a heading (44 of 56 Deep Orbit bridge callouts) | Move them at content build to sit after the first pairable block of their section. 32 of the 44 find one; this changes DOM order on those 32 lessons at every width: screen readers, the no-`:has()` fallback and phones all read the bridge after the heading, the worked code and the first paragraph, instead of straight after the heading. The other 12 have no paragraph in their section and stay put, spanning the full width under their heading (see the owner decision below) | Pair them with the heading itself: DOM order untouched, the heading narrows to 600 px and the callout sits beside it, so the first paragraph starts below the callout's bottom. Choosing this drops the plugin and its test, and rule 5's list gains h2 and h3 |
| Briefing beats | An avatar slot beside its line (section 2, item 5). Approving this spec is the ruling the backlog's "Dialogue density" item asked for; the style bible has no sentence about beat layout, so no bible edit | Keep the stacked, centred 440 px beat |
| The lesson format tag ("Field repair" and the like, today printed only in the scene card) | Joins the eyebrow line after the mission number, keeping its `pattern-format-tag` test id | Drop it; the pattern label is also in the frontmatter and the map |
| Frame width | 1,280 px with 48 px padding, the width the chrome bar already uses, so the Challenge editor keeps its 700 px | 1,200 px, which costs the editor about 90 px or the instructions about 60 |

**Owner decision.** By the definitions below, 19 of Deep Orbit's 79
companions have no pairable block after them in their section: 12 bridge
callouts whose section is heading, bridge, code, next heading; 6 derivation
drawers; 1 concept reference. They span the full content width where they
stand, in 17 of the 56 lessons. A full-width bridge under a section heading
is a legitimate section opener, not an empty column, and this spec proceeds
on that basis. The alternative in the row above pairs the bridge with the
heading instead, on every heading-led section, at the cost of a
callout-tall heading row. The spanning geometry is measured in a real browser by injecting a
companion after a heading in a free lesson's grid (the twelve live in paid
lessons the e2e suite cannot open), and the reorder plugin's test prints the
count for review; it does not pin it.

## Goal and success criteria

A learner on a desktop sees the story, the teaching text and its companions
using the width of the page, with no empty column on any step. Measured on
lesson 1 (`foundations/01`, bridge after a paragraph) and on
`foundations/02-tensor-shapes` (bridge after the heading, moved after the
section's first paragraph by the build) at 1,440 by 900, dark scheme, scene
resolved:

- No right rail on any step: `[data-testid="lesson-right"][data-kind="rail"]`
  no longer exists. The test id stays on the Code slot and the Challenge
  pane, which `e2e/worlds.spec.ts` and `e2e/ui-remediation.spec.ts` read.
- The scene plate's top edge at or above 360 px from the top of the page.
  Today it is 492 px. Section 2 lists what gives way.
- A pairable block with a companion beside it is 600 px wide; prose with no
  companion is wider than 600 px and at most 820 px.
- A companion's top edge is within 4 px of the top edge of the block before
  it. No grid row has an empty first cell.
- On a 390 px phone the companion follows its block in reading order, and
  nothing renders after the Continue row except the footer.
- The existing accessibility suite, which already audits every lesson step in
  both colour schemes, stays green, and every step keeps exactly one H1.
- Playback, post-scene and warm-up suites pass, with the two spacing edits in
  section 6 reflected in their snapshots.

## Non-goals

- No edits to lesson MDX or YAML. The build may move a companion within its
  section (section 3); it never changes words.
- No change to scene playback timing, beat order, or the reduced-motion path.
- No change to the Code editor, the Challenge grader, or the Complete step's
  behaviour.
- No data, API or analytics change.

## Definitions used by the CSS, the plugin and the tests

- **Pairable block**: a top-level `p`, `ul`, `ol` or `blockquote` in the
  teaching zone (after the first `h2`). Nothing else pairs: not headings, not
  code, not dialogue, not experiments, not other companions.
- **Companion**: a top-level `BridgeCallout`, `DerivationDrawer` or
  `ConceptReference`, marked `data-aside` on its root. `BridgeCallout` has
  two rendered roots (the generic and the React layouts) and an early
  `return null`; both roots carry the marker.
- **Code block**: a fenced `pre`, or the `CodeBlock` component, whose root is
  a `div`. Neither is a pairable block, so neither narrows; neither is capped
  because rule 2 caps prose and headings only. No marker is needed.
- **Section**: from one `h2` or `h3` to the next.

Deep Orbit today, from the compiled bodies (Deep Orbit is the only built
world; the other four are not in the velite build): 79 companions. Bridge
callouts 44 after a heading, 12 after a paragraph; derivation drawers 14
after a paragraph, 5 after a code block, 1 after a dialogue; concept
references 2 after a paragraph, 1 after an experiment. 22 companions span.
19 have no pairable block after them in their section (12 bridges, 6
drawers, 1 reference). The other 3 find every pairable block after them in
their section already followed by a companion, and the plugin rule below
never stacks two. An earlier draft said one; that scan counted code lines as
prose. The reorder plugin's test prints this count and the list of spanning
companions for review. It does not pin them, so a content edit can move the
number without failing a test.

## Section 1: the frame

One frame for every step, replacing three (900, 1,100 and 1,280 px today).

| Token | Value |
| --- | --- |
| Frame max width | 1,280 px, centred; 48 px side padding at desktop, 20 px on phones; content 1,184 px at 1,440 |
| Text track | `minmax(0, 600px)`, about 60 characters of 18 px body text |
| Companion track | `minmax(280px, 544px)`, 544 px at 1,440 and still 544 px at 1,024, where the text track has given way (see Fallbacks) |
| Column gutter | 40 px |
| Spanning prose max width | 820 px, about 82 characters. Applies to prose and headings only |
| Breakpoint | one column below 1,024 px; two columns from 1,024 px |

Units are px, not `ch`: `ch` in `grid-template-columns` resolves against the
grid container's 16 px font while body text is 18 px, so a `62ch` track would
hold 55 characters.

The chrome bar moves onto the same frame and padding, so its hairline and the
body's edges align. It keeps the module name, the Lessons button, the Mission
Map link, the step bar, the step badge and "Report issue". Its lesson title is
the page's H1 on steps 2 to 6 and stays there. On step 1 it is already a plain
paragraph beside the title card, which is that step's H1, and is no longer
rendered. The bar's bottom margin drops from 32 to 16 px.

**Where the grid lives.** The flat list of MDX blocks is the direct-child
list of `LessonContent`'s root, `div.lesson-prose.lesson-step-content`, in
`lesson-content.tsx`. That element becomes the grid, stamped by a new
`layout="paired"` prop. Every partition and playback rule already selects
its direct children, so nothing else changes shape. Outside the grid, and
spaced by margin: the phase chip and the `lesson.concept.explanation`
paragraph above it (capped at 820 px), the objectives block (section 3), the
nav row (section 6). The step body's `min-h-[50vh] flex flex-col
justify-center` wrapper is removed; it manufactured empty height.

The rules, in one block in `apps/web/app/globals.css`, wrapped in
`@supports selector(:has(+ *))` so a browser without `:has()` gets none of
them. Tokens come from section 6; the block uses `var()`.

```css
@supports selector(:has(+ *)) {
  .lesson-step-content[data-layout="paired"] {
    display: grid;
    grid-template-columns: minmax(0, 600px) minmax(280px, 544px);
    column-gap: var(--l-gutter);
    row-gap: var(--l-row);
  }
  /* 1. every block spans and drops its own vertical margin */
  .lesson-step-content[data-layout="paired"] > * {
    grid-column: 1 / -1;
    margin-block: 0;
  }
  /* 2. prose and headings are capped; everything else keeps its own width */
  .lesson-step-content[data-layout="paired"] > :is(p, ul, ol, blockquote, h2, h3) {
    max-width: 820px;
  }
  /* 3. headings get their extra top space back */
  .lesson-step-content[data-layout="paired"] > :is(h2, h3) {
    margin-top: var(--l-heading);
  }
  /* 4. a companion takes the second column */
  .lesson-step-content[data-layout="paired"] > [data-aside] {
    grid-column: 2;
    align-self: start;
  }
  /* 5. a pairable block followed by a companion narrows to the first column */
  .lesson-step-content[data-layout="paired"] > :is(p, ul, ol, blockquote):has(+ [data-aside]) {
    grid-column: 1;
  }
  /* 6. a companion with nothing pairable before it spans instead */
  .lesson-step-content[data-layout="paired"] > :not(p, ul, ol, blockquote) + [data-aside],
  .lesson-step-content[data-layout="paired"] > [data-aside]:first-child {
    grid-column: 1 / -1;
  }
}
```

Specificity, which is what makes the block work regardless of order: rule 1
is (0,2,0); rules 2 and 3 are (0,2,1); rule 4 is (0,3,0); rule 5 is (0,3,1);
rule 6 is (0,3,1) for its first selector and (0,4,0) for `[data-aside]:first-child`,
so both beat rule 4. The v1 draft had the
narrowing and spanning rules at equal specificity with the wrong one last,
which paired nothing. The contract test asserts the `@supports` guard, the
`:is(p, ul, ol, blockquote)` list in rules 5 and 6, the `:has(+ [data-aside])`
clause, and that no selector in the block reaches deeper than a direct child.

Consequences the rules fix by construction: experiments, code blocks and
tables keep their own width; a dialogue, an experiment or a code block
followed by a companion is never narrowed (rule 5's list). A stacked
dialogue on the Concept step keeps its 440 px width, but rule 1 spans it
across both tracks, where its own `mx-auto` would centre it on the whole
grid: 372 px in at 1,440, while the prose runs from 0 to 820. A rule after
rule 6 centres it on the 820 px text measure instead, 190 px in at 1,440,
and lets it fill the column on a phone, where the measure is narrower than
the beat. The Concept step shows 12 such beats, in 11 paid lessons.
(Amended 2026-09-24 from the final review.) Grid
auto-placement puts a companion on the row of the block before it because
that row's second cell is free when the companion is placed. Hidden blocks
(`display: none` from the partition rules) are not grid items and do not
consume cells.

## Section 2: the Briefing

Order, top to bottom:

1. Eyebrow on one line: sector, mission, the lesson format tag when the
   lesson has one (today printed only in the scene card; keeps its
   `pattern-format-tag` test id), duration and exercise count. The separate
   duration line, its hairline and its 32 px margin are removed.
2. The two-tone title card, unchanged in size. Its bottom margin drops from
   20 to 12 px; the eyebrow's from 24 to 12 px.
3. Slugline row: the scene heading on the left, the Replay control on the
   right, one hairline under the row. Skip intro takes the same slot while
   the scene plays; it is 44 px tall, so the row is at least 44 px during
   playback. The control sits outside the `[data-script-beat]` wrapper so it
   never inherits a beat's hidden state. The slugline stays the first beat
   and the plate the second, exactly as today.
4. The story grid, a two-column grid rendered by `StepBriefing`: the first
   item is a column holding the plate (`ScenePortrait`, or `SceneClip` on the
   clip variant, whose root margin shrinks to the beat gap; its `w-full`
   video is harmless inside the column and stays)
   and the stage direction; the second
   item is `LessonContent`'s root, which holds the beats, the "Cut to"
   divider (still inside the last Dialogue) and the teaser. The teaser is the
   pre-heading paragraph not followed by a Dialogue, which is how the
   story-register stylesheet already identifies it. Nothing gets
   `display: contents`, no beat is placed individually, and `collectBeats`
   still walks `LessonContent`'s children. Tracks are the frame's: plate 600
   px wide, 400 px tall at the portrait's 3:2 default; beats column 544 px
   at 1,440. The plate column is `align-self: start`. The stage direction
   loses its `pl-6` and keeps its `max-w-[52ch]` on the element, because the
   stylesheet's story-paragraph rule reaches only `LessonContent`'s direct
   children and the direction sits in the plate column; that stylesheet rule
   likewise keeps italic, drops its left padding, and keeps its 52ch cap on
   purpose (about 390 px at its 14 px size, narrower than the column).
   Amended 2026-09-23 during the build, from the Task 8 code review, which
   measured each point in a browser: the tracks are written
   `minmax(0, 1fr) minmax(280px, 544px)`, so the split is still 600 and 544
   from 1,280 px up but the picture gives way before the dialogue on narrow
   desktops (about 344 and 544 at 1,024, where a fixed 600 px plate left
   the dialogue about 32 characters a line). Below 1,024 the grid is one
   column capped at 820 px, with the picture capped at 600 px, like other
   unpaired prose. The columns stack with the `--l-row` row gap. With no
   picture in the plate column (no scene, or the still failed to load) the
   grid is one 820 px column at every width, so the dialogue never sits
   beside an empty column. The last story block drops its bottom margin
   inside the grid, where margins no longer collapse, so the post-scene slot
   sits `--l-slot` below the story and the nav `--l-nav-top` below it; the
   first story block drops its top margin for the same reason (a sensor-log
   blockquote opens 12 of the 56 stories and started 24 px below the
   picture), so the story starts level with the picture and `--l-row` under
   the stage direction when the columns stack.
5. Each beat is an avatar slot beside its line: a 44 px slot (the size the
   ARIA waveform is tuned for), a 12 px gap, the speaker name over the line.
   This is a `layout="row"` variant of `Dialogue` in `packages/ui`, bound by
   `LessonContent` when `storyRegister` is set, so the Concept step's
   mid-lesson beats and the Complete step's epilogue keep today's stacked
   layout. The root stays a block element and keeps `data-dialogue`; an
   inner row holds the slot and the text; `.tc-cut-to` stays the root's last
   direct child, because the stylesheet reveals it with a direct-child
   selector. The `mx-auto max-w-[440px]` centring goes with the variant.
6. The post-scene slot, after the story grid, full content width: the
   warm-up when one is due, then the mid-module catch-up when there is one.
7. The nav row: Skip to the challenge on the left, Continue on the right.

The scene card is removed. Setting and time are on the slugline; the cast is
on the beats. `castSpeakers` and `extractSpeakers` go with it if nothing else
imports them. On phones the plate comes first, then direction, beats, cut,
teaser, post-scene, nav.

Plate top edge, from today's 492 px: chrome margin 32 to 16, eyebrow margin
24 to 12, title margin 20 to 12, the duration row (about 70 px) and the lone
Replay row (about 50 px) removed. The playback control moved into the
slugline row, and its 44 px touch target sets that row's height, so the
production build measured 377.5 px. The reader's top padding (24 to 16), the
chrome's bottom padding (20 to 16) and the gap under the slugline row (24 to
16, the beat gap) bring it to about 358, inside the 360 px criterion with the
title card untouched.

## Section 3: Concept and Takeaways

**Companions** are the three components in the definitions. Each root gets
`data-aside` and loses its own vertical margin (`my-8`, `my-8`, `my-6`), which
rule 1 zeroes anyway but the component should not carry a dead utility.
`DerivationDrawer` opens by default when the learner's route preference
expands derivations; an open drawer is the normal tall companion and grows
its row. `ConceptReference` is closed on Concept. Tables and code blocks
always span; a table in a 280 px cell is unreadable. Outside the paired grid (the Code step, which never pairs, and a
browser without `:has()`, which gets no grid) a companion keeps a
`--l-row` margin on both sides, `.lesson-step-content > [data-aside]`,
because nothing else separates two drawers there; rule 4 zeroes that
margin inside the grid.

**The reorder plugin.** A companion whose previous sibling is not a pairable
block has nothing to pair with, and grid auto-placement cannot put a later
block into an earlier row's free cell. `rehype-pair-companions.ts` in
`packages/content`, registered in `velite.config.ts` after `rehypeGlossary`,
runs over every built lesson (Deep Orbit today):

- It considers only nodes after the first `h2`. The story zone is never
  touched.
- Siblings are compared skipping whitespace text nodes, which
  `mdast-util-to-hast` inserts between root children.
- A companion is an `mdxJsxFlowElement` named `BridgeCallout`,
  `DerivationDrawer` or `ConceptReference`. A pairable block is an element
  with tag `p`, `ul`, `ol` or `blockquote`.
- If a companion's previous sibling is a pairable block, it stays.
- Otherwise it moves to sit after the next pairable block in its section
  that does not already have a companion after it. Two companions therefore
  never stack: the second is carried on to the following pairable block.
- If no such block exists after the companion in its section, the companion
  stays where it is and spans by rule 6. That is the case for 19 companions
  in Deep Orbit today, plus the 3 that would otherwise have stacked; the
  plugin test treats it as a first-class outcome, not an exception.
- Nothing else moves and no text node changes.

A unit test compiles every lesson of every built world through the same MDX
pipeline and runs the plugin on the tree, so it can compare before and after.
It asserts: every companion's previous sibling is a pairable block, or no
pairable block without a companion after it exists between the companion and
the next heading; no node before the first `h2` moved; the multiset of text
nodes is unchanged; and it prints the count of spanning companions per lesson
so the number in this spec stays honest. `pnpm run build:content` must run
before any test that reads the build.

**Objectives.** `LearningObjectives` sits before the first heading in every
lesson, where the Concept step's story-zone rule hides it. The second
`LessonContent` instance that today feeds the rail (`CONCEPT_RIGHT`,
objectives only) stays and renders above the main instance in the text flow,
renamed `CONCEPT_INTRO`, so `content-partition-contract.test.ts` keeps every
component reachable. The component's own heading changes from "Learning
Objectives" to "You will be able to" and from `h4` to `h2`, and it lays its
items two across from 1,024 px, one across below.

**Glossary.** The rail is removed. Every term chip already shows its own
definition inline as a note, so Concept loses nothing. The Takeaways step
gains "Terms in this lesson", an `h2` over a spanning list built from the
same `lesson.glossaryTerms`, by reworking `glossary-rail.tsx` and its test.
The glossary context exists only to carry `activeTerm` for the rail, so the
provider, the hook, the chip's `active` and `onActivate` props and the span
binding's hook call are removed together. Four sentences in the bible's
glossary paragraph describe the rail (the scene "renders as the INT. slugline
and the SceneCard rail"; a term is listed "in the lesson's glossary rail";
"Clicking the underlined term highlights its rail entry"; "the build derives
the rail from the rendered underlines"); all four change in the same diff, and
`packages/content/__tests__/glossary-rail-contract.test.ts` keeps its
assertion under a name that says terms list. The backlog item "OWNER: the
glossary rail" closes with a pointer to the terms list, and its unresolved
question (underline-derived term set, or a union with the frontmatter list)
moves to the terms list unchanged. The three backlog items this design
resolves ("Scene rail duplicates the page", "Title said twice, module said
twice", "Dialogue density") close in the same diff, each with a pointer to
this spec.

**Mission progress** leaves the Takeaways rail. The Lessons drawer and the
module map already show it; the Complete step keeps its link to the map.

The Takeaways step renders no prose and no companions, so it does not use
`layout="paired"`; it gets the frame and the 820 px cap as a single column,
and the terms list's `h2` sits 40 px below the last block.

## Section 4: Code, Challenge and Complete

The Code step is single column today: derivations, where a lesson has them,
stack above the worked example, and the example uses the full column. That
stays. On the new frame the example is 1,184 px wide at 1,440, up from about
1,020. 40 of 56 lessons have nothing above the example; a second track there
would be the empty column this work exists to remove. What stacks above the
example (the intro line and any derivation drawers) is capped at 820 px like
other unpaired prose; the example keeps the full content width. The visible
gap between the last block above the example and the example is 24 px, the
`--l-row` value; grid items do not collapse margins, so the shell and the
code slot must not add their own on top of it (measured about 80 px before
the Task 10 spacing pass). (Amended 2026-09-23 during the build, from the
Task 6 and 7 code review.)

The Challenge step keeps instructions left and the editor right, with the
Instructions and Editor toggle on phones. Its tracks become
`minmax(0, 440px) minmax(0, 1fr)` with the 40 px gutter: instructions 440 px,
editor 704 px at 1,440, against about 700 px today.

Amended 2026-09-23 during the build: the instructions track is written
`minmax(0, min(440px, 38%))`. A fixed 440 px track made the editor narrower
than today on windows from 1,024 to about 1,210 px wide (447 px of editor
text area against 522 at 1,024), a range the 1,440 measurement above never
covered. With the clamp, measured in Chromium as text areas (today in
brackets): 353 and 534 at 1,024 (365 and 522), 382 and 582 at 1,100 (395
and 568), 440 and 677 at 1,254 (457 and 660), 440 and 703 at 1,440 (467 and
676). The editor is at least as wide as today at every width from 1,024 up.
Below 1,024 the toggled instructions view is capped at 820 px.

The Complete step stays single column and centred.

## Section 5: components and files

| File | Change |
| --- | --- |
| `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx` | `layout` prop stamps `data-layout="paired"` on the root; binds `Dialogue` with `layout="row"` when `storyRegister` is set |
| `.../lesson-shell.tsx` | One frame, `rightKind` loses `"rail"`; Challenge tracks per section 4 |
| `.../lesson-steps.tsx` | Chrome on the frame, title hidden on step 1, margins per sections 2 and 6; eyebrow carries the format tag; Briefing story grid, slugline row with the control outside the beat, scene card removed; step 2 passes `layout="paired"`, steps 2 and 5 lose `shellRight`, `CONCEPT_RIGHT` renamed `CONCEPT_INTRO` and rendered in flow; Takeaways terms list; nav row spacing; post-scene slot owns its top spacing; step body wrapper simplified |
| `.../glossary-rail.tsx` and `__tests__/glossary-rail.test.tsx` | Becomes the Takeaways terms list |
| `.../glossary-context.tsx`, `packages/ui/src/mdx/glossary-term.tsx`, the span binding in `lesson-content.tsx` | Provider, hook and the `active` and `onActivate` props removed together |
| `.../scene-clip.tsx` | Margin and width inside the story grid |
| `packages/ui/src/mdx/dialogue.tsx` and `dialogue.test.tsx` | `layout="row"` variant |
| `packages/ui/src/mdx/learning-objectives.tsx` and test | Heading text and level, two-across layout |
| `packages/ui/src/mdx/bridge-callout.tsx` (both rendered roots), `derivation-drawer.tsx`; `apps/web/app/components/mdx/concept-reference.tsx` | `data-aside` on the root; root margin removed; concept reference padding 16 to 20 px so all three read `--l-aside-pad` |
| `packages/content/src/rehype-pair-companions.ts`, its test, `velite.config.ts` | The reorder plugin |
| `apps/web/app/components/lesson-warmup.tsx`, `apps/web/app/components/review-prompt-card.tsx` | Warm-up drops its own `mt-10` (the slot owns it); the card's Continue gap 12 to 24 px |
| `.../challenge-passed-banner.tsx` | Gap 16 to 24 px; 24 px above the banner |
| `apps/web/app/globals.css` | The paired-grid block; story-grid and row-beat rules; spacing tokens; stage-direction rule adjusted |
| `docs/story-style-bible.md`, `docs/post-launch-backlog.md`, `docs/visual-regression.md` | Bible wording; glossary-rail item closed; coverage statement and baseline record |
| Deleted if unused after the change | `SceneCard`, `MissionProgress`, `castSpeakers`, `extractSpeakers` |

Tests that assert the old layout and change with it: `lesson-steps.test.tsx`
(rail assertions and the SceneCard cast block), `__tests__/lesson-shell.test.tsx`,
`__tests__/glossary-rail.test.tsx`, `__tests__/content-partition-contract.test.ts`
(no edit needed, it iterates the set values), `e2e/worlds.spec.ts` (rail and
glossary-entry assertions; the `data-kind="code"` assertion stays),
`e2e/lesson-variety.spec.ts` and `lesson-steps.playback.test.tsx` (the format
tag moves to the eyebrow; the slugline assertion stays), `e2e/visual/review-warmup.spec.ts`
(the card snapshot widens).

## Section 6: spacing scale

An 8 px scale as CSS custom properties on the lesson page root, referenced by
the grid block and by every spacing rule below:

| Name | Value | Where |
| --- | --- | --- |
| `--l-gutter` | 40 px | between the two tracks, on every two-track step |
| `--l-row` | 24 px | grid row gap; between a paired row and the next block; between the editor and the passed-challenge banner |
| `--l-heading` | 16 px | extra above h2 and h3 inside the grid, 40 px with the gap |
| `--l-beat` | 16 px | between dialogue beats |
| `--l-aside-pad` | 20 px | inside a companion box; the two `packages/ui` companions already use it, the concept reference moves from 16 |
| `--l-slot` | 24 px | above the post-scene slot, and between its children when both render (a module opener with a due warm-up). The slot wrapper owns both; the warm-up section and the catch-up details lose their own `mt-10` and keep their hairline and inner padding |
| `--l-nav-top` | 40 px | between the last content block and the nav hairline, on every step, including the shell footer on Code and Challenge. Today's value; the v1 draft's 32 px moved the wrong way |
| `--l-nav-inner` | 24 px | between the hairline and the controls; between any two controls in a control row, including when the row wraps on a phone (Skip above Continue); between the passed-challenge banner's text and its Continue; above the warm-up card's own Continue (12 px today) |
| `--l-nav-bottom` | 40 px | at least 40 px between the nav row and the footer (more on a step shorter than the viewport, where the page's minimum height adds space) |
| `--l-heading` again | 40 px in total | above the Takeaways "Terms in this lesson" heading, which lives outside any grid |

The nav row lives outside the grid and is not capped: it spans the content
width, so Continue sits at the frame's right edge on every step. No block may
touch the frame edge; the frame padding is the floor. On the Complete step
the next-lesson link takes Continue's slot and the same rule.

## Fallbacks

- A browser without `:has()`: the `@supports` guard withholds the whole
  block, so the step renders as one column in DOM order with companions
  after their block, which is the order the reorder plugin guarantees. The
  dialogue divider already degrades the same way.
- No JavaScript: the noscript reveal covers the idle Briefing and shows the
  whole teaching body there. That body would read in the 544 px beats column
  beside the picture, so the reveal also sets the story grid to one column
  capped at 820 px, with the picture above the text (`noscript-reveal.tsx`,
  pinned by its test). (Amended 2026-09-24 from the final review.)
- Reduced motion: unchanged; the scene resolves at once and the grid does
  not animate.
- Narrow desktop (1,024 to 1,279 px): both Concept tracks are capped
  (`minmax(0, 600px) minmax(280px, 544px)`), so the text track gives way
  first. Measured in Chromium: text track 344 px and companion 544 px at
  1,024, 420 and 544 at 1,100, 600 and 544 from 1,280 up. With the earlier
  `minmax(280px, 1fr)` companion track, the text track kept its 600 px and
  the companion shrank to 288 px at 1,024. On the Briefing the picture gives
  way first in the same way (section 2, item 4). (Amended 2026-09-24 from
  the final review.)
- No scene picture (no scene frontmatter, a missing asset, or a still that
  fails to load): the Briefing story grid is a single 820 px column, the
  stage direction above the beats.

## Tests

- **Stylesheet contract test** (`lesson-layout-contract.test.ts`, vitest):
  the companion roots (both `BridgeCallout` roots, the drawer, the reference)
  stamp `data-aside`; the paired block
  in `globals.css` sits inside `@supports selector(:has(+ *))`, contains the
  six rules with the pairable list and the `:has(+ [data-aside])` clause, uses
  the section 6 token names, and no selector in it reaches deeper than a
  direct child. Modelled on `post-scene-contract.test.ts`.
- **Reorder plugin test** (`rehype-pair-companions.test.ts`): the four
  assertions in section 3, over every lesson of every built world, compiled
  from source through the MDX pipeline so the test holds the tree before and
  after.
- **Playwright layout test** (`e2e/lesson-layout.spec.ts`): lesson 1 and
  the free heading-led lesson `foundations/02-tensor-shapes`, at 1,440 and
  390. Paid lessons redirect a signed-out visitor to the paywall and the
  suite has no purchased fixture. Of the 22 companions that span, one is in
  a free lesson: the concept reference in `foundations/normalization`
  (`05-normalization.mdx#11` in the plugin test's output), which the suite
  checks at full content width on that lesson's Concept step. The twelve
  heading-led bridges that span are all in paid lessons, so that shape is
  asserted by injecting a companion after a heading in lesson 1's real grid;
  the corpus count of spanning companions is the reorder plugin test's job.
  Asserts every success criterion by bounding box, including "no grid row
  with an empty first cell", both spanning companions at full content
  width, and the plate beside the first Dialogue on desktop. Runs in CI
  with the suite.
- **Accessibility**: the existing suite already audits every lesson step in
  both schemes; it stays green.
- **Visual**: four new baselines, Briefing and Concept of lesson 1 at 1,440
  and 390, added after the change with a written reason each in
  `docs/visual-regression.md`, whose coverage statement changes to include
  lesson routes and to list `review-warmup.spec.ts`, which it omits today.
  The one existing lesson-route snapshot, the warm-up card in
  `review-warmup.spec.ts`, is an element screenshot in the card's prompt
  state (no Continue button visible) in the 1,280 by 720 visual project; it
  is re-minted with its reason and expected delta: width from the
  68-character column to 1,184 px, plus whatever reflow the wider card
  causes. Nothing else is re-minted.
- **Unchanged and must stay green**: `lesson-steps.playback.test.tsx`,
  `post-scene-contract.test.ts`, `lesson-warmup.test.tsx`,
  `e2e/review-warmup.spec.ts`, `e2e/script-playback.spec.ts`.

## Rollout

One change, reviewed as one diff, in this order: reorder plugin and content
rebuild; markers and stylesheet block; Briefing story grid and row beats;
Concept and Takeaways; Challenge tracks and chrome; spacing; tests and
baselines. The owner commits; nothing is deployed from an uncommitted tree.

## Open questions

None. The one measurement the plan makes before its first task is whether an
open derivation drawer beside a two-line paragraph looks worse paired than
spanning, which would argue for a height threshold in the plugin; the 16
lessons with drawers are the sample.
