# Story and result inspection UX investigation

Date: November 6, 2026. Scope: source review and visual review of existing
preview screenshots. This note proposes product behavior. It makes no claim
of a new browser check, production deployment, or learner observation.

## Recommended experience

Keep a lesson's scene, dialogue, and crew problem at the start of its existing
section. After the learner acts, show one result that helps answer that
problem. Put the explanation beside the actual evidence in reading order.
Keep saving and recovery after the current result. Use the project page as a
way back to that work.

The feature should share source labels, selection behavior, recovery, and
accessibility across lessons. Each lesson needs a representation that fits
its task. A sensor-layout exercise needs an inspectable arrangement. A
normalization exercise needs a selected value and its calculation. A model
evaluation needs its cases and errors. An ungraded crew choice needs the
authored consequence and its limits. Repeating an accuracy dashboard across
these tasks would obscure what the learner actually did.

This direction follows the binding mission contract in [CLAUDE.md](../../../CLAUDE.md)
and the [story style bible](../../story-style-bible.md). It extends an existing
design rather than introducing a second visual language.

## Existing foundations and gaps

| Finding | Source | Consequence for the design |
| --- | --- | --- |
| Deep Orbit already stacks its Challenge in one column. | `apps/web/app/worlds/[slug]/[module]/[lesson]/deep-orbit-lessons.css:345` | Keep a full-width result below the work. A narrower persistent side inspector would reverse the shared layout decision. |
| A mission scene already owns the authored artwork, location, narrative, and crew context. | `apps/web/app/components/lesson-visuals/lesson-workbench.tsx:66` | Reuse that scene placement. Avoid inventing a new character assistant around each result. |
| Concept investigations already distinguish the active investigation from an optional reference example. | `apps/web/app/components/lesson-visuals/lesson-workbench.tsx:179` | Preserve this distinction when adding results from executed learner code. Supplied examples cannot become the learner's output. |
| Exercise controls expose a saved-runs hook inside the editor controls. Generic live output renders later. | `packages/ui/src/mdx/exercise.tsx:1087`, `packages/ui/src/mdx/exercise.tsx:1414`, `packages/ui/src/mdx/exercise.tsx:1443` | Introduce an intentional current-result presentation slot. The learner should understand the run before the save/history interface takes attention. |
| Rich normalization/network explanations currently render inside saved-run disclosures. | `apps/web/app/components/learning-evidence.tsx:301`, `apps/web/app/components/learning-evidence.tsx:344` | Reuse their parsers and explanations for the current run. Saving should preserve a result, rather than reveal its useful explanation. |
| Saved runs already distinguish current code, historical exercise content, help, and browser-local ownership. | `apps/web/app/components/learning-evidence.tsx:210`, `apps/web/app/components/learning-evidence.tsx:290` | Preserve these protections while reducing repeated technical detail in the primary reading flow. |
| Existing project evidence already includes Data and Model milestones. | `apps/web/app/components/learning-evidence-project.tsx:16` | Consolidate each milestone's existing history and local work into one discoverable stage entry. Avoid a second gallery with duplicate entries. |
| The November plan already specifies and prototypes evaluation inspection. | `docs/superpowers/plans/2026-11-02-learning-evidence-pilot.md:179`, `docs/design-previews/evaluation-inspector/README.md:1` | Use the prototype as the evaluation baseline. Production capture and full paid-route integration still require work. |

## Layout alternatives

### Inline mission result, recommended

The result remains part of the existing Challenge and uses the same reading
width as the learner's work. Scene and instructions lead. The result's main
interaction follows the run. Checks remain visible as a separate verdict.
Saving/history sit below the result.

```text
Existing section heading
Existing scene, artwork and authored dialogue
Crew problem and named data source
Learner work and Run controls
Run status and exercise verdict

Result from this run
Task-specific visual and exact selected values
Selected item, case navigation and explanation
Useful next action or optional investigation question
Save this run   Download this run
Earlier saved runs

Existing recall, transfer work and earned epilogue
```

This placement maintains the connection between code and output and works in
the existing vertical flow. Its cost is page length, especially when an
editor, a plot, and multiple saved reports all expand together. Keep only the
current result open by default. Keep earlier reports in labeled disclosures.
Do not collapse story or current output to solve that length problem.

### Paired editor and inspector, limited later experiment

```text
Full-width scene and crew task

Editor                 Result
Run controls           Selection and exact values
                       Short interpretation

Shared history and continuation
```

This can shorten the distance between an edit and its effect on a wide
screen. It also squeezes code and explanations, complicates reading order,
and conflicts with the current full-width Deep Orbit contract. Do not select
it for the first implementation. A later within-activity comparison could
use columns only where the shared contract and actual content justify them.
The whole lesson must not become a persistent dashboard.

### Project record as the main inspector, secondary only

```text
Building DEEP SCAN
Data stage      Latest browser-local result   Open exercise
Model stage     Latest browser-local result   Inspect run
Evaluation      Saved summary                Inspect run
```

This helps a returning learner recover context across milestones. It creates
an unnecessary detour for a learner who just ran code and needs immediate
feedback. Keep it as a return surface with links into the same result
presentation. Guest saves stay accessible inside the lesson because the
current project dashboard requires sign-in.

## Evaluation inspector critique

The reviewed baseline uses score lanes because this lesson asks which
classifications failed. A point's horizontal position shows its captured
score. The two lanes show the supplied class. The fixed strict threshold
explains the predicted class. Selected-case details link input, label,
prediction, and source.

I visually inspected the existing `inspector-1440-dark.png`,
`inspector-390-light.png`, `challenge-1440-dark.png`,
`challenge-320-light.png`, and `partial-390-dark.png` files in
[the preview screenshots](../evaluation-inspector/screenshots/). These files
show previous browser captures. I did not rerun their verification script.

Keep these choices:

- The original bridge scene and Mirza's question precede the inspector.
- One full-width plot carries the lesson's comparison. Counts appear in a
  sentence and category controls rather than repeated statistic cards.
- Case details remain below the plot on desktop and phone. They retain
  exact source labels and the three feature values.
- Dense points retain their exact score position. Vertical packing separates
  overlap and explicitly carries no extra data meaning.
- The incomplete state withholds whole-run accuracy and explains missing
  rows. Available cases remain inspectable.

Issues to test in the complete lesson:

- The phone plot still occupies substantial vertical space. Its controls and
  selected-case explanation must remain easy to locate after a run. Test a
  plain `Inspect selected case` anchor near the category controls before
  changing the plot or making any controls sticky.
- The prototype starts at generated case 0, a correct calm prediction in its
  recorded example. Observe whether learners notice the missed-anomaly
  category without a facilitator. Compare that entry with an explicit
  `Choose a case to inspect` prompt. A default case must not imply a causal
  diagnosis or guarantee an error exists.
- Preview copy and runtime caveats take space that production should reserve
  for source and interpretation. Preserve the source distinction with a
  short primary label and put hashes/runtime metadata in captured details.
- Review the full editor/result/check sequence. The current prototype omits
  the real editor, cost decision, transfer assignment, and complete lesson.
  A clean preview screenshot cannot settle that longer flow.

The existing plan explicitly limits the claim to explaining the decision
rule. Three displayed feature values do not explain why a network assigned a
score. Never label the bars as feature importance. Never draw a waveform from
three unrelated features. The actual evaluated result and the authored 94%
crew result remain separate. Sample 7741's 0.518 and unknown true label keep
their canon meaning.

## Compact visual system

The distinctiveness should come from the crew's task and the inspectable
result. Retain the established Deep Orbit palette and typography. The
frontend-design skill's caution against defaults does not justify replacing
a deliberate existing identity.

| Role | Token | Dark | Light |
| --- | --- | --- | --- |
| Page | `--tc-bg` | `#181818` | `#f5f5f2` |
| Result surface | `--tc-surface` | `#232323` | `#ffffff` |
| Text and axis labels | `--tc-text` | `#e0e0e0` | `#1f1f1f` |
| Selection and focus | `--tc-primary` | `#6baa8a` | `#3b6550` |
| Existing world accent | `--tc-accent` | `#a89060` | `#6b5a3b` |
| Incorrect prediction | `--tc-error` | `#fca5a5` | `#b00f0f` |

Values come from `packages/worlds/src/css/worlds.css:12`, `:257`, and
`:300`. Implement with variables and existing light overrides. Controls use
`--tc-border-interactive`, not the decorative divider token. Incorrect
predictions also need text and marker shape.

Inter remains the typeface for headings, explanations, numeric labels, and
controls. JetBrains Mono remains for executable code. Use tabular numbers
where columns benefit. The existing lesson scale uses 32px section titles,
28px subsection/activity titles, 22px desktop body text, and a 24px content
gap (`deep-orbit-lessons.css:1`). Respect its responsive rules. Left-align
prose and controls. Keep plot captions centered where the shared caption
style applies. Keep paragraphs readable without narrowing the whole story
or cutting the full-width visual.

The memorable element is the interaction that explains the learner's work.
Avoid new cockpit frames, invented telemetry, decorative animations, accent
bars, all-caps labels, and a new card for every number. Keep square/quiet
surfaces consistent with the existing application.

## State and interaction contract

| State | Main response | Available action |
| --- | --- | --- |
| Before a first run | Explain the result the exercise will produce. Show supplied examples under their own source label. | Run code or continue the authored non-code activity. |
| Loading runtime | Describe actual loading separately from code execution. Keep the task and editor visible. | Use existing runner controls. Do not simulate result points. |
| Running | Show real bounded progress where available. | Preserve current cancellation/timeout policy and expose failure clearly. |
| Valid output, failed diagnosis | Show the run's evidence and the incorrect verdict together. | Inspect the result and revise the diagnosis. |
| Partial capture | Name what is missing and which summaries cannot be verified. | Inspect valid available values and rerun. |
| Zero errors | Show zero in error categories and a useful empty explanation. | Inspect correct cases. Explain that the supplied set cannot establish all future behavior. |
| Code edited | Keep the prior result visibly tied to the code that produced it. | Run current code. Saving retains the captured source. |
| Failed rerun | Keep the new failure distinct from earlier saved work. | Inspect available failed-run output or open an earlier saved run. |
| Saving | Keep the result usable and prevent duplicate writes. | Preserve download where available. |
| Storage blocked | Explain that the run is in memory only. | Download or copy work before leaving. |
| Content changed | Show the old result as historical. | Inspect old source or explicitly restore it while preserving the newer draft. |
| Account changed | Clear visible previous-owner state before loading the new scope. | Load only the current owner's saved records. |

The live run, a saved record, a supplied reference, and a fictional crew
outcome each need a visible source label. Save success is a storage state.
Exercise correctness is a graded verdict. Learning mastery requires separate
evidence. Keep their meanings independent in text, color, and behavior.

### Keyboard, mobile and motion

Use a labeled native case selector and Previous case / Next case controls.
The plot can support direct pointer selection, while the selector supplies
equivalent precision and avoids 43 tab stops. Filters use buttons with
`aria-pressed`, visible counts, and a group label. Empty categories retain
their zero count and provide a useful empty state. Decide explicitly whether
navigation operates over the selected category or all cases and describe
that scope in the selector label.

Keep the result status region mounted before asynchronous updates. Announce
the short verdict and selected-case summary without repeatedly reading the
entire plot. Do not move focus when data arrives. An explicit `Inspect
result` control may move focus to the result heading. Returning to code
should preserve the editor and selected case.

Use text equivalents and an accessible full-data table for every meaningful
graph. Keep table scrolling inside a labeled region, as the existing output
component does (`packages/ui/src/mdx/exercise-output.tsx:22`). Phone layouts
stack fields and maintain at least 44px interactive targets. Avoid global
horizontal overflow. Confirm readable numbers at 320px and browser zoom.

Selection changes may briefly emphasize the selected item. They must not
animate a score into a different value or resemble another training run.
Respect reduced motion for new behavior. Preserve the shared story waveform
and its existing static reduced-motion form rather than adding a second
ambient effect.

## Review before implementation

The chosen design needs five kinds of evidence:

1. Source review confirms that every displayed value and story statement has
   an identified origin.
2. Runtime checks establish that current, partial, wrong-verdict, zero-error,
   and failed-run output remain truthful.
3. Full-lesson screenshots cover desktop and phone, both themes, and all five
   sections. The inspection checks story continuity and the actual editor.
4. Keyboard and assistive-technology observation checks focus, verdicts,
   selected-case understanding, and complete text access.
5. Learner observation checks whether someone can find a relevant case,
   explain the label/score/decision, name a useful next investigation, and
   distinguish this result from unseen-data performance and crew fiction.

Prototype success establishes a usable candidate. The existing study needs
to test the teaching claim before this pattern expands throughout the course.
