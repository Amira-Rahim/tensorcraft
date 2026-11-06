# Result inspection within Deep Orbit missions

Date: November 6, 2026. Design study, before product implementation.

This document specifies the proposed experience at the moment a learner runs,
inspects, revises, and revisits their work. It develops the
[main design](../../superpowers/specs/2026-11-06-story-driven-result-inspection.md)
and the [lesson map](deep-orbit-result-map.md). The
[exercise contract matrix](result-contract-matrix.json) distinguishes available
fields from proposed capture. Mock layouts describe behavior. They are not
screenshots of a new implementation or records of learner testing.

## Shared composition

The lesson keeps its five sections. Each section opens with its existing
scene and dialogue before its work. Within Challenge, a run produces one
primary explanation of the task's output. Saving follows that explanation.
Recall and the earned epilogue retain their own place and requirements.

```text
Challenge

Existing artwork, scene, and character dialogue
The crew's task and the named recording or practice data

Your JavaScript
Editor
Run code     Reset code     Help

Check verdict and a useful next correction, when needed
Inspect result

Task-specific result heading
Source sentence and run state
One main visual with its selection controls
Selected values and a short explanation
Return to code

Save this run     Download this run
Earlier saved runs [closed]
Captured details [closed]

Existing decisions and transfer activities
Recall
Existing epilogue
```

This establishes reading order, not a rigid component count. A complete short
report or two-column table can be the useful result. Adding a second visual
must help answer a specific question. Keep the existing check announcement
and add a concise visible verdict near the result. Detailed checks may expand
under that verdict. Required correction guidance stays visible.

The current `Exercise` places generic output before the full check panel.
Moving that content requires a complete editor review. Do not duplicate the
existing live region or automatically move focus after a run. The authored
expected tensor in the opening challenge remains a supplied target with its
own label. It cannot become the learner's captured result.

### Visual language

Use the existing Deep Orbit tokens, Inter text, JetBrains Mono code, original
artwork, square controls, and shared responsive type scale. The
[main design's token table](../../superpowers/specs/2026-11-06-story-driven-result-inspection.md#layout-alternatives-and-visual-decisions)
records the existing dark/light palette. Prose and controls align left.
Centered artwork captions remain consistent with the lesson layout.

Spend visual emphasis on the object the learner is investigating: the selected
reading, one weight update, or a missed case. Surround it with quiet controls.
Use color with shape, text, and visible focus. No cockpit decoration, metric
card grid, new font family, colored left bars, or automatic celebratory motion.

Desktop may place a short formula's operands beside each other inside the
full-width activity. Phone layouts stack those operands in reading order.
Neither layout divides the lesson into permanent editor and result columns.
Selection responds immediately by highlighting captured values. Reduced
motion removes transitions without removing the changed state.

### Current and earlier output

The current attempt owns the prominent result region. At the next run, retain
at most one prior inspectable result in a closed `Previous run` disclosure.
If the new attempt fails before useful capture, show its failure beside that
disclosure. A new valid report replaces the prior one even when a separate
diagnosis check is incorrect. Reset and owner/exercise changes clear transient
results. This behavior never saves a run automatically.

Saved history remains below current work. Open at most one saved detail at a
time. If it has the current run's ID, show its saved status and actions without
rendering the same chart again. Compare IDs, not code hashes: identical code
can train a different model. A distinct earlier run has a visible run date,
source, and historical/stale status. Do not silently replace the current
result with it.

Use `Run from ...` for the existing captured timestamp. A sole record is
`Saved run`. With two records, use `Earlier saved run` and `Latest saved run`.
The internal first/latest slots follow save order and can change after deletion.
The current schema has no save-time field. `Saved in this browser` describes
storage. A disclosure must expose its
expanded state and support keyboard activation, following the
[WAI disclosure pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/).

## Normalization: following a reading into the preview

The crew needs compatible feature scales and reusable training statistics.
The learner works on four two-feature readings and a supplied fixed neuron.
The current exercise captures input readings, fitted statistics, scaled
readings with preview scores, and the same batch with min-max scaling.

| Section | Experience and purpose |
| --- | --- |
| Briefing | Keep Mirza's instruction and Farah's explanation of scale. Preserve the existing watch-sheet choice and its unresolved event label. |
| Concept | Keep the feature-scaling investigations and the zero-divisor explanation. Supplied calculations remain identified. |
| Challenge | The learner runs their scaling code, selects a reading and feature, and follows the captured input, fitted statistic, and scaled output. |
| Recall | Preserve graded questions and answer reveals. The inspector remains available, without filling in answers or recording inspection as mastery. |
| Epilogue | Keep the archive preview and sample 7741 unresolved. The learner's four-row preview does not replace the separate fictional archive result. |

```text
The reading entering Farah's preview
Your run. Four supplied readings, with temperature and signal strength.

Reading [1 of 4]     Feature [Temperature]

Input value     Training mean     Standard deviation
[captured]      [captured]        [captured]

Subtract the mean, then divide by the standard deviation.
Scaled value [captured]

Preview score [captured]
This score uses both scaled features in the supplied fixed neuron.

Min-max values for this batch [closed]
```

The operation is a connected calculation, not four unrelated statistic cards.
Selecting signal strength changes its operands and highlight. The preview
score remains the selected row's complete two-feature score. The interface
must not suggest that the selected feature alone caused that score.

Use the captured scaled value as the result. An independently recomputed
expected value belongs in grading feedback with that label. Keep zero standard
deviation distinct from the divisor of one used by the guarded operation.
Do not invent degrees or a physical unit absent from the fixture.

The optional min-max disclosure compares captured transformations of the same
batch. It cannot compare their model performance because the grader does not
capture a second matching prediction set for that alternate transformation.
The next meaningful action is to inspect another feature or correct the code,
not tune a displayed score by moving a simulated slider.

## Network: comparing actual starting and trained scores

The learner builds and compiles a network, then observes what fitting changes.
Its synthetic fixture has eight features, 120 training rows, and a captured
16-row excerpt. It differs from the later three-feature evaluation model.

| Section | Experience and purpose |
| --- | --- |
| Briefing | Retain Mirza's assembly order and the task to compare predictions. |
| Concept | Keep architecture, parameter-count, and compilation investigations. Explain which operations change weights. |
| Challenge | Select a captured input row. Compare the first model before fitting, that model after fitting, and a second untrained initialization on a shared score scale. |
| Recall | Retain the questions about initialization, compilation, and training. A confident score does not establish learning. |
| Epilogue | Preserve the archived initial states and Farah's decision to keep the reading flagged. The fictional archive remains distinct from the synthetic exercise. |

```text
Scores before and after fitting
Your run. A 16-row excerpt from the supplied 120-row training set.

Reading [1 of 16]

First model before fitting      [score bar on 0 to 1]
First model after fitting       [score bar on 0 to 1]
Second model, still untrained   [score bar on 0 to 1]

Supplied label [label]
Input features [closed]
Training loss [compact plot]
Model and training settings [closed]
```

Keep all three bars on the same scale and name their states directly. They
show scores, not accuracies. Keep the supplied label visible beside the
comparison. The first before/after pair supports a within-run comparison.
The second initialization illustrates variation, without establishing a
controlled estimate of training's effect across seeds.

The loss chart's values come from the captured training log. Do not turn the
training excerpt into a held-out test or infer missing intermediate weights.
Put the extensive settings list in one disclosure, with the input count and
excerpt scope visible above. The learner should reach the comparison without
passing a dashboard of configuration cards.

## Evaluation: investigating a decision before a prototype test

Mirza asks for evidence on separate readings before a supervised prototype
test. The learner's run uses 100 training rows and 43 evaluation cases: 40
generated cases and three authored edge cases. This is separate from the
Concept experiment, transfer exercises, and crew's fictional evaluation.

| Section | Experience and purpose |
| --- | --- |
| Briefing | Keep Mirza's decision context, original artwork, and the limits of prototype approval. |
| Concept | Keep the supplied threshold experiment. It explains tradeoffs on its own data. |
| Challenge | Run the learner's model, inspect the measured case decisions, and correct or defend the gap diagnosis. Keep the existing cost decision and transfer task. |
| Recall | Check reasoning about held-out data, error types, and limits. The visual provides evidence without revealing graded answers. |
| Epilogue | Retain the crew's 94%, sample 7741's 0.518, and Farah's unresolved question. A learner's score cannot change those facts. |

The existing [desktop](../evaluation-inspector/screenshots/inspector-1440-light.png)
and [phone](../evaluation-inspector/screenshots/inspector-390-dark.png)
captures supply a composition reference. They use a labeled maintainer run.
They do not prove integration with the complete editor or new capture contract.

```text
Decisions on the evaluation readings
Your run. [Verified or limited source statement from captured context]

[actual correct count] of [actual available count] classified correctly
[actual missed anomalies]     [actual false alarms]

All cases     Missed anomalies     False alarms

Supplied calm label      [points at exact captured scores]
Supplied flagged label   [points at exact captured scores]
                         fixed decision boundary at 0.5

Case [stable selector]     Previous case     Next case

Supplied label [value]     Score [value]     Prediction [value]
Three recorded input features
This score [does/does not] exceed 0.5, so the model predicts [class].
```

Horizontal position encodes score exactly. Vertical stacking separates
overlapping points and has no second measured meaning. Point shapes identify
generated and authored cases only when the decoder validates that row's source.
Changed-source rows use an unknown-source marker and their observed input
position. Error states also use labels and outlines. All available points stay
visible while a category narrows navigation. A complete result has 43 points.
Selecting a point outside that category returns navigation to All cases.

The mock layout above assumes validated fixture meaning. If source meaning is
uncertain, use `Supplied label 0` and `Supplied label 1` for the lanes, neutral
input-position IDs, and `Input 1` through `Input 3` for the features. Unknown
rows cannot inherit calm/flagged story identities from the assigned fixture.

Use stable case identity. A category change keeps the selected case if it
still matches, otherwise selects the first matching case. A zero-match
category shows its count and disables navigation without inventing an error.
The initial proposal starts at case 0 and All cases. The discovery study
compares that with an explicit first-error action. Engineering does not need
the research answer to preserve correct scores and identities.

The captured rule is strict `score > 0.5`. Exactly 0.5 predicts class 0.
Selection never recomputes predictions or changes the saved rule. Selected
feature values describe the input, without claiming feature importance.

If the learner has valid measured output and an incorrect diagnosis, copy can
say: `Your result is available. The diagnosis check is incorrect.` Show the
specific correction beside the verdict. Model mistakes remain visible as
missed cases or false alarms. They are different from a JavaScript error or a
wrong answer to the diagnosis question.

Complete rows with unverified training observations may support counts of
recorded classifications. They do not support an unqualified claim that the
model never saw those rows. Partial case coverage withholds whole-run accuracy.
The [evaluation contract](evaluation-result-contract.md) specifies those states.

## Opening tensors: tracing the recording onto a chart

Demir has twelve readings from sensors A through D at three selected moments.
The recording header supplies the order. Creating the tensor connects those
values to the supplied chart code. It does not train a model.

The smallest useful improvement selects a sensor and a plotted moment in the
currently captured four-series chart. Show its exact captured value and the
named selected moment. The current artifact does not include the raw tensor
shape and flat values, so an inspectable tensor grid requires additional
capture. The supplied expected tensor cannot fill that gap.

```text
Demir's readings on the chart
Your run. Sensors A, B, C, and D at three selected moments.

Sensor [B]     Selected moment [2]
[four-line chart with the selection highlighted]
Sensor B at selected moment 2: [captured value]
```

Briefing explains the data source. Concept keeps the array/tensor connection.
Challenge shows the actual chart. Recall retains the shape and ordering task.
The epilogue hands the same recording to Farah to check grouping. A later
tensor-grid view should make that grouping inspectable using actual flat
values, shape, and authored axis metadata. It must never infer sensor meaning
from shape alone.

## Gradient descent: following one implemented update

The scalar exercise captures the first update's learning rate, stored gradient,
and new weight. A subsequent check captures the weights after the first three
steps. Source inspection shows these two artifacts continue the same state.
Later checks change the loss and reset the weight, so their final values do not
describe that first trace.

The initial view can select one of three captured weights and connect the
first point to its captured gradient and learning rate. It cannot show actual
intermediate gradients or losses that were never captured. Label the authored
initial weight separately if shown. Additional per-step operand capture would
support a complete before/gradient/rate/after explanation later.

Keep the existing Concept learning-rate experiment separately identified.
It uses its own supplied function. The result viewer inspects executed steps.
Recall still asks about the update and rate. The epilogue broadens the crew's
problem from one weight to the remaining network parameters. Do not claim
that inspecting this scalar trace trained DEEP SCAN.

## Later lessons and appropriate restraint

The contract matrix names the needed fields per exercise. Families share
selection mechanics only when the underlying data meanings also agree.

| Family | Useful action | Required boundary |
| --- | --- | --- |
| Signal and spectrum | Select a captured sample, bin, or window and coordinate its views. | Sample rate, transform length, ordering, and units must be present. No frequency inferred from bin position alone. |
| Sequence and forecast | Select a time step and compare captured input, forecast, or state. | Show available windows and prediction horizon. Never invent hidden-state history. |
| Attention | Select a query and inspect its captured weights and weighted contributions when available. | Weights show a calculation. They alone do not establish causal importance for the final decision. |
| Runtime | Select a measured operation or timing interval. | Separate browser measurement, mocked runtime, warmup, and supplied estimates. A summary average cannot recreate individual events. |
| Retrieval and generated reports | Inspect retrieved material, the resulting report, and supported references. | Preserve source IDs and complete text. Do not infer token attribution or success metrics from prose. |
| Release gates | Inspect a specific rehearsal, its checks, and its release decision. | Different grader probes can use different models and inputs. Explicit group identity controls any comparison. |

The attention limit reflects the competing tests and definitions discussed by
[Jain and Wallace](https://aclanthology.org/N19-1357/) and
[Wiegreffe and Pinter](https://aclanthology.org/D19-1002/). The safe product claim
is about the displayed computation. A stronger explanation needs its own
model-specific evidence.

Keep the complete existing table or text for report, model-card, deployment,
and loading exercises when it already answers the task. A custom dashboard
would add navigation without adding evidence. Counts embedded in summary prose
remain readable text until the grader emits typed fields.

## Mobile, keyboard, and explanation checks

At 320px and 390px, stack controls before the visual and selected evidence
immediately after it. Wrap category labels. Keep exact score positions when
resizing the plot. A responsive view must not move values to avoid overlap.
Use the selector and Previous/Next controls as the full keyboard path, so the
learner does not need to tab through 43 points. Avoid hover-only values.

Keep the result heading an explicit anchor target. `Inspect result` and
`Return to code` provide travel without losing draft or selection. Do not add
a fixed footer that covers the chart, story, or editor on a short viewport.
Provide summary text and a structured full-values disclosure. Announce changed
selection concisely without reading the complete chart again.

Selection and coordinated detail follow the interaction categories in
[Heer and Shneiderman](https://idl.cs.washington.edu/files/2012-InteractiveDynamics-CACM.pdf).
That taxonomy informs this proposal. It does not establish learning benefit
for Tensorcraft. Participant observation must test whether the selected
evidence actually helps someone explain the task and choose a next action.

## Design critique and unresolved observations

The first composition repeated settings cards and rich output inside history.
This revision gives current evidence priority, connects arithmetic operands,
and avoids duplicate charts for the same run. It also retains one clearly
labeled previous result when a rerun fails before capture.

The existing phone screenshot still separates the opening controls from case
details with several explanatory lines and the plot. Keep one source sentence
and one outcome summary. Fold repeated availability counts into the control
status, and put selection controls directly beside the plot's reading order.
Test whether learners can connect a selected mark to its details without
losing their place. Preserve the score axis and full case set during that
layout refinement.

Several current fixtures remain synthetic rehearsals. These storyboards
preserve their honest labels. Before release, review whether each rehearsal
serves the crew's actual question under the lesson quality contract. If the
source/task connection fails, repair the fixture, examples, hints, grading,
recall, and scene together. A new source label alone cannot repair it. The
eight-feature network must not quietly acquire the later three-feature
model's identity or claim to represent the archived reading.

The remaining empirical choices are the first selected evaluation case, the
amount of inline explanation, phone travel distance, and which later results
learners want to revisit. Run those tasks in the complete five-section lesson.
Record confusion about the story, source, arithmetic, controls, and storage
separately. Revise the affected cause before expanding coverage.
