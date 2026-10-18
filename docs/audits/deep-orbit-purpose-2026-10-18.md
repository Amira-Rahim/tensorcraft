# Deep Orbit mission purpose and visible results audit

Date: 2026-10-18. Local working tree, uncommitted; nothing deployed.

Reviewed all **56 missions, 280 lesson sections, 65 exercises and 11 module
descriptions**. The source review followed each crew problem through the
learner's action, an inspectable result and the next story step. It included
frontmatter, hints, feedback, recall, nested references, secondary exercises
and conditional endings. Source coverage, runtime checks and browser checks
are recorded separately below.

The main change is that every exercise now exposes output from the learner's
graded run. A test verdict is accompanied by a useful table, chart or document.
The opening missions now connect Demir's recording to a working chart, then
let the learner build its grouping steps with Farah. The course does not claim
that plotting numbers requires ML or that a small diagnostic proves the whole
fictional system works.

## Source coverage

Detailed reports contain one row per mission with all five sections reviewed,
plus exercise capture mappings, result consumers, preservation checks and
technical limits. The opening two missions are covered immediately below.

| Module | Missions | Exercises | Five-section review |
| --- | ---: | ---: | --- |
| Foundations | 5 | 5 | [Opening missions](#opening-missions) and [core report](deep-orbit-purpose-core-2026-10-18.md#five-section-review-for-every-lesson) |
| Neural Networks | 5 | 5 | [Core report](deep-orbit-purpose-core-2026-10-18.md#five-section-review-for-every-lesson) |
| Training Loop | 5 | 5 | [Core report](deep-orbit-purpose-core-2026-10-18.md#five-section-review-for-every-lesson) |
| Browser Runtimes | 6 | 7 | [Core report](deep-orbit-purpose-core-2026-10-18.md#five-section-review-for-every-lesson) |
| Signal Processing | 5 | 5 | [Signals and sequences report](deep-orbit-purpose-sequences-2026-10-18.md#five-section-source-coverage) |
| Recurrent Networks | 5 | 5 | [Signals and sequences report](deep-orbit-purpose-sequences-2026-10-18.md#five-section-source-coverage) |
| Anomaly Detection | 5 | 8 | [Signals and sequences report](deep-orbit-purpose-sequences-2026-10-18.md#five-section-source-coverage) |
| Advanced Time Series | 5 | 5 | [Signals and sequences report](deep-orbit-purpose-sequences-2026-10-18.md#five-section-source-coverage) |
| LLM Integration | 5 | 6 | [Applied systems report](deep-orbit-purpose-applied-2026-10-18.md#five-section-source-coverage) |
| Optimization & Edge | 5 | 6 | [Applied systems report](deep-orbit-purpose-applied-2026-10-18.md#five-section-source-coverage) |
| Capstone | 5 | 8 | [Applied systems report](deep-orbit-purpose-applied-2026-10-18.md#five-section-source-coverage) |
| Total | 56 | 65 | 280 sections, with nested material included |

### Opening missions

Both missions use the same 12 selected readings from Demir's fictional
recording: sensors A, B, C and D, in that saved order at each of three moments.
The header establishes this meaning; shape alone cannot supply it. The values
are `[2, 20, 5, 8, 3, 18, 7, 8, 4, 16, 6, 9]`.

| Mission | Briefing | Concept and references | Challenge and visible result | Takeaways | Epilogue and next consumer |
| --- | --- | --- | --- | --- | --- |
| [Introduction to Tensors](../../packages/content/content/deep-orbit/foundations/01-introduction-to-tensors.mdx) | Sensors on the hull supply Demir's screen; his existing viewer expects a TFJS tensor. The selected excerpt and supplied grouping code are explicit. | Create the tensor, inspect `[12]`, and distinguish recorded sensor metadata from shape. Ordinary JavaScript could plot the values too; this connects to the crew's TFJS pipeline. | Create `reading` and save `shape`; the supplied viewer reads that actual tensor and displays four selectable sensor lines. Cleanup occurs after readback. | Creation is not training or discovery. The chart's role and supplied code remain clear. Recall checks shape and whether training occurred. | Demir checks the four lines and sends the same recording/header to Farah to inspect the grouping. |
| [Understanding Tensor Shapes](../../packages/content/content/deep-orbit/foundations/02-tensor-shapes.mdx) | Farah keeps the same excerpt and checks grouping before using the viewer on the full capture. | Reshape to `[3, 4]` by moment; transpose to `[4, 3]` by sensor. Compare values, not only shapes. Prediction/activity feedback and optional image, rank, memory and higher-axis references remain contextualized. | Build `grid`, `step1` and `bySensor` from the supplied tensors. The chart reads the submitted `bySensor` rows; provenance and values are checked. | Transfer uses an explicitly different selection from the same recording: three sensors at two more moments. Correct shape with mixed sensor values is rejected. | Farah separately applies the checked method to the full `[450, 64]` recording. Repeating waves remain unexplained. |

## Implemented result flow and ongoing project rules

Authored `recordResult` calls copy actual returned values, submitted tensors,
observed calls or existing model histories after assertions in the same graded
run. Captures do not trigger additional model runs, fits or network requests.
Supplied examples, synthetic probes, controlled clocks/runtime responses and
fictional mission results retain their labels and limits. Later independent
fixtures are not presented as persisted output from earlier exercises.

The shared renderer supports bounded tables, selectable chart series and text
documents, with keyboard controls and readable data tables. It rejects malformed
or nonfinite artifacts. Tables retain returned numeric precision; chart scaling
handles finite numeric extremes. Edits mark previous output stale. Reset or an
exercise/account change invalidates pending UI completion callbacks; failure
does not present partial output as a complete pass. Saved code and solution
assistance remain scoped to the exercise/account.

These are durable requirements in [CLAUDE.md](../../CLAUDE.md#mission-purpose-and-visible-results-binding-2026-10-18),
alongside the [lesson quality contract](../../CLAUDE.md#lesson-quality-contract-binding-2026-10-16):
story first, consistent full-width layout, clear casual wording for JavaScript
engineers learning ML, verified technical meaning and purposeful interaction.
The [writing rubric](../writing-quality-rubric.md) and
[story bible](../story-style-bible.md) remain binding. No arbitrary sample size
or ML operation is given an invented scientific necessity.

Shared handoffs and concept activities were checked against their authored
tasks too. Corrected RAG's omitted-match count, the prompt's required fields,
partial report assembly and the classifier-to-detector-to-writer chain. The
report displays approved prose and withheld headings separately. The shared
flow tests include 48 controlled states compared with the actual authored
pipeline solution and four exact report-assembly comparisons; their full
105-test result is recorded in the applied systems report.

## Executed runtime evidence

The final shipped-worker corpus run used the authored solutions and the pinned
TensorFlow.js runtime through the real Node worker adapter. All **65 exercises
passed 575 authored solution checks**, all **65 starters were rejected**, and
each exercise returned at least one valid artifact. The run produced
**86 artifacts: 70 tables, 12 series and 4 text documents**. Durable per-exercise
counts and kinds are in [the runtime evidence JSON](deep-orbit-purpose-runtime-2026-10-18.json),
copied from `.superpowers/purpose-worker-corpus-final.json`.

The permanent opt-in gate is
`EXERCISE_CORPUS=1 pnpm exec vitest run packages/ui/src/mdx/exercise-corpus.test.ts`.
It checks grader results, starter rejection, artifact presence and transported
schema. Detailed reports separately record CLI solution/starter/known-cheat
runs and preservation comparisons. The 48 reviewed example groups also passed.

Focused shared-result tests reproduce and cover stale completion after Reset,
exercise/account changes, edits during execution, malformed output, chart
extremes, data access and scoped solution assistance. The final broad
content/component run passed **1,638 tests across 80 files**. Its 65 opt-in
worker tests were skipped in that run and passed separately in the corpus run
above. Web TypeScript checking, the content build, and whitespace checks passed.
Scoped lint reported no errors; the existing unused `TF_MOCK` warning remains
in the runner. Browser checks cover rendering that jsdom cannot perform.

Opening API claims were checked against the primary TFJS 4.22 references:
[tensor creation](https://js.tensorflow.org/api/4.22.0/#tensor),
[reshape](https://js.tensorflow.org/api/4.22.0/#reshape),
[transpose](https://js.tensorflow.org/api/4.22.0/#transpose) and
[synchronous tensor cleanup with tidy](https://js.tensorflow.org/api/4.22.0/#tidy).
These support the API contracts; the authored value/order checks establish
whether a submitted arrangement serves this recording's sensor layout.

## Browser evidence

The parent verified the actual localhost lesson routes and shared output UI:

- Introduction and Tensor Shapes show the sensor chart from submitted output.
- A second reshape used instead of transpose passed 7 of 9 checks and produced
  no chart artifact; the correct transpose passed 9 of 9 and displayed it.
- Editing after a run marks its output stale; a failed retry is visibly labeled
  as incomplete when earlier passing checks supplied output.
- Report Generation passed 8 of 8 checks and showed its returned report text.
  Model Profiling passed 10 of 10 and showed actual captured result tables.
- The multi-model activity stops on an invalid classifier score before calling
  the detector or writer. A valid run traces all three stages with the original
  raw readings and shows the returned alert. Report assembly keeps approved
  sections when another section is withheld, with its heading in an omission
  block.
- Checked 320px and 390px layouts had no page-level horizontal overflow.
  The redundant inner output card was removed to preserve usable chart width.

These checks do not amount to browsing all 280 sections. Source review does not
prove visual behavior, and worker execution does not establish production
hardware timings, hosted service behavior or real scientific findings.
Downloadable labs, optional references and every device/backend combination
were not all executed. Reset/navigation ignores old completion callbacks rather
than cancelling an already bounded worker. No absolute correctness guarantee,
commit or deployment is claimed.
