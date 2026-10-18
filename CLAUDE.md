# Tensorcraft: Claude Code Instructions

## Mission purpose and visible results (binding, 2026-10-18)

- Every Deep Orbit mission must connect a concrete crew problem, the learner's
  contribution, an inspectable result, and the next story action. Audit all five
  sections, references, activities, hints, feedback, and secondary exercises.
- A passing test or decorative success state alone is not the task's payoff.
  Show the learner's actual calculated output, artifact, comparison, or useful
  failure. Identify supplied examples separately. Mark old results stale when
  code changes; never present a reference output as the learner's result.
- Keep setup proportional to its purpose. Do not invent scientific necessity
  for arbitrary sample sizes or claim a task requires ML when ordinary code
  suffices. Explain the honest role of tensors, models, and supplied tooling.
- Keep one continuous recording or explicitly identify a change of source.
  Excerpts name their selected sensors/times and preserve ordering and units.
  Any changed exercise fixture must update its examples, hints, solutions,
  grading, recall, and story together while retaining the required skill.
- The shared layout, verified technical meaning, logical storytelling, clear
  casual wording, and purposeful visual interaction remain mandatory. Build
  for frontend engineers learning ML through a fun, approachable story.

## Lesson quality contract (binding, 2026-10-16)

- Build for frontend developers learning ML through JavaScript. Lessons should
  feel fun, entertaining, and easy to follow. Use clear, casual, concise wording
  and familiar arrays, charts, and UI examples without weakening the technical
  meaning or removing exercise requirements.
- Keep the shared lesson layout consistent across every lesson and section:
  full-width sections flowing from top to bottom, the same header structure,
  readable typography, recognizable dialogue, centered image captions, and
  consistent navigation. Improve shared components rather than introducing
  isolated lesson templates or squeezed columns.
- Give each lesson one clear practical task. Connect its briefing, concept,
  challenge, recall, and epilogue to that task. Explain what the learner can do
  afterward and why it helps the crew. Keep supporting topics optional when
  they distract from that purpose.
- Teach with the ongoing story's task and data. If the full recording is too
  large, use a clearly identified small excerpt and explain what it contains.
  Preserve the relevant values, order, axis meanings, and data provenance.
  Do not replace the crew's work with an unrelated synthetic practice detour.
  Separate toy examples need a clear teaching purpose, an explicit label, and
  an optional place in the lesson. Keep fictional or illustrative data
  identified as such; never turn it into a claim of a real scientific finding.
- Technical correctness is mandatory throughout. Verify API behavior, examples,
  calculations, axis meanings, units, and exercise checks against the pinned
  runtime and primary documentation. Test plausible wrong answers, including
  correct shapes with wrong values. Do not claim certainty beyond the evidence.
- Continue the story logically in storytelling form. Establish where metadata
  such as sensor order and timestamps comes from. Shape alone cannot reveal
  what an axis means. Preserve the canon, unknowns, and earned discoveries.
- Give third-person story passages a shared visual voice distinct from
  dialogue and teaching prose. Keep them full width and readable; never add a
  visible narrator or narration label, speaker name, or avatar to those passages.
- Make information as visual, interactive, and dynamic as the teaching allows
  without losing context. Let learners predict, change inputs, run code, and
  inspect meaningful feedback. Explain both the result and its cause. Keep
  keyboard access, reduced-motion support, and story visibility intact.
- Every graded answer must clearly say whether it is correct or incorrect,
  using a visible feedback state and useful guidance. Announce the verdict to
  assistive technology, and clear stale input errors when the answer changes.
  Keep self-reflection and open-ended story decisions explicitly ungraded.
- Shared prose styles are defaults. Keep them in the appropriate CSS cascade
  layer so they do not erase a component's authored paragraph spacing or type
  choices. Preserve intentional compact layouts and explicit grid gaps.
- Course audits must cover every lesson's briefing, concept, challenge,
  takeaways, and epilogue, including nested references and secondary exercises.
  Record source review, executed examples, and browser checks separately.
  Passing tests alone does not establish teaching value or story quality.

## Story and Interaction (binding, 2026-10-15)

- **Story comes first.** This is a hard rule across every world's learning
  experience. Scenes, character dialogue, stakes, and narrative handoffs are
  core lesson content. Keep them visible by default when their section is
  reached, before the related technical work. Section headings and navigation
  can come first to orient the reader.
- Layout changes must support the story. Never remove it, replace it with
  generic exercise instructions, or hide it behind an optional disclosure to
  make a page shorter or bring the editor forward. Keep scene artwork visible
  and give it room alongside readable narrative and consistent dialogue styles.
- **Make every lesson and section as visual, interactive, and dynamic as
  possible.** Use explorable diagrams, simulations, predictions, code exercises,
  and choices where they help learners understand the concept or advance the
  story. Learner actions should produce immediate, meaningful visual feedback
  that explains what changed and why. Apply this quality bar across the course.
- Interactions must use accurate data and outcomes. Do not invent scientific
  results or change them to reward a choice. Preserve earned endings and reveal
  recall answers after the learner's attempt. Optional references and help may
  still use deliberate reveals.
- Dynamic behavior should respond to the learner and explain the lesson.
  Maintain keyboard access and reduced-motion support. Avoid decorative motion
  and extra clicks that do not serve the story or learning.

## Em Dash Ban (repo-wide, no exceptions)

- **NEVER use the em dash character (U+2014), anywhere** (owner
  directive, 2026-08-15). This is broader than the prose rubric: it
  covers every file and surface in the project. Prose, code, comments,
  tests, internal docs, commit messages, config, generated output, and
  Claude's own responses. Rewrite around it with a comma, colon, period,
  or parentheses. Code that must detect or strip the character (lint
  gates, text normalization) references it via the escape `\u2014`,
  never the literal glyph. The zero-hit state is CI-enforced repo-wide by
  `packages/content/__tests__/em-dash-ban.test.ts` (swept 2026-08-15,
  3,692 removed).

## Left Accent Bar Ban (UI, repo-wide)

- **Never put a colored left accent bar on any UI element** (owner
  directive, 2026-08-16). The pattern (border-left / border-l-\* in an
  accent color on callouts, blockquotes, stat lines, hint panels, or
  active states) is a signature of AI-generated design. Banned on every
  surface: components, MDX callouts, prose CSS, emails. Mark emphasis or
  state with a background wash, text color, or weight instead. Neutral
  full-height hairline dividers between layout panes (border-border) are
  structure, not accent bars, and stay. Swept to zero 2026-08-16.

## Writing Rules

- **All prose is held to `docs/writing-quality-rubric.md`** (owner
  directive, 2026-08-12). Before writing or editing ANY user-visible text
  (lessons, exercise instructions, module descriptions, glossary, UI copy,
  emails, blog, marketing), read that rubric and follow it. No AI-slop
  vocabulary, no inflated contrast or slogan cadence, no overloaded
  sentences, no em dashes. Character dialogue additionally follows
  `docs/story-style-bible.md`. The lexicon tier is CI-enforced by
  `packages/content/__tests__/slop-lexicon.test.ts`.

## Git Rules

- **Never commit on behalf of the user.** Do not run `git add`, `git commit`, or `git push` unless explicitly asked. After writing or editing code, stop and let the user decide when to commit.
