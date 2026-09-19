# Deep Orbit: first experiment specification

Proposal accompanying the [final learning-product audit](final-learning-product-audit-2026-09-19.md). No production implementation is included in this audit. Start with this small slice before changing the whole lesson player.

## Intended result

A learner can explain why two tensors with shape `[4, 3]` can represent different channel data, select the correct transformation, and identify a channel's values in a new example. The scene has a purpose the learner can accomplish: give the plotter one sensor's readings in order.

Primary placement: Foundations, Understanding Tensor Shapes, beside “The Wrong Kind of Sixty-Four.” Reuse the existing plotter mistake, exercise, epilogue and visual identity. This experiment illustrates the mechanism on a small teaching packet; it does not replace the canonical `[450, 64]` archive or discover a new fact about the signal.

This single patch is not the whole first-session redesign. Once it works in context, an optional public “Try the channel experiment” entry can open the same lesson without enrollment. Do not advertise a 15-minute course start as achieved until the complete entry route has been observed and timed.

## The interaction

1. **Set the task.** “The plotter needs one row per sensor. Which operation keeps each sensor's readings together?” Show the input as three time steps and four channels. The values 0 through 11 are position markers, not measured signal amplitudes.
2. **Ask for a prediction.** With channel 0 selected, ask which values should appear in its trace. Offer a small numeric response or selectable values. A wrong prediction stays private and costs no progress.
3. **Compare two operations.** Reshape and Transpose buttons produce the same target dimensions, `[4, 3]`. Keep the chosen channel highlighted in the input grid and show exactly where its values land in each result. Controls update the numeric table and a small trace together.
4. **Explain the difference.** The learner can reveal a short explanation after running either operation. Show the two corresponding TFJS expressions. Keep the original shape visible, so the transpose is not mistaken for an arbitrary permutation.
5. **Check transfer.** Change to two time steps and three channels with different values. Ask for channel 1's ordered values and the operation. Hide the previous answer; offer help. Record help use separately from a correct answer.
6. **Return to the course.** Continue to the existing challenge, with the main lesson progress untouched until its normal requirements are met. The existing epilogue remains the story payoff.

Do not lock the reference behind a correct guess, require an essay, impose a timer or make the learner repeat a known answer to advance. “Show me” is a legitimate assisted route.

## Numerical contract

Worked packet, shape `[time, channels] = [3, 4]`:

```text
             channel 0   channel 1   channel 2   channel 3
time 0           0           1           2           3
time 1           4           5           6           7
time 2           8           9          10          11
```

`reshape([4, 3])` keeps flat order:

```text
[[0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11]]
```

`transpose()` on this rank-2 tensor swaps its axes:

```text
[[0, 4, 8], [1, 5, 9], [2, 6, 10], [3, 7, 11]]
```

Channel 2 is `[2, 6, 10]`. The shape alone cannot determine channel membership. Transposition preserves each channel's ordered values when changing from time-major to channel-major layout.

Transfer packet: `[[10, 20, 30], [11, 21, 31]]`, input shape `[2, 3]`. Correct channel 1 is `[20, 21]`; transposition yields shape `[3, 2]`. A reshape yields `[[10, 20], [30, 11], [21, 31]]`, also `[3, 2]`. The follow-up must test values as well as dimensions.

These examples are deterministic indexing demonstrations. Do not describe their trace as real telemetry or imply that drawing it runs a trained model.

## Layout and visual behavior

Desktop: one experiment card inside the current reading column, expanding across the available lesson width only if the grids would otherwise be cramped. The task and controls stay above the input/output comparison. Put the code underneath the corresponding operation. Keep the glossary secondary.

Mobile: task, source grid, operation controls, selected result and explanation in that order. A compact row of coordinate values must remain readable without dragging the page. The trace supports the table; it never contains information absent from the table. Do not introduce another Instructions/Editor switch for this small experiment.

Keep square corners and existing colors. Use a neutral container, current accent color for the selected channel, and labels or symbols as well as color for state. One experiment should not become a stack of equally prominent bordered callouts. Keep source and destination highlights synchronized. Avoid decorative particles, fake terminal typing and character animation during the task.

The operation buttons work with keyboard and touch, have visible focus and expose selection state. Coordinate selection has named controls. Announce a short result change once, not every highlighted cell. With reduced motion, the final arrangement appears immediately. A reader who cannot see the diagram can answer using the labeled table.

## Implementation boundaries

Suggested component: `apps/web/app/components/mdx/channel-layout-experiment.tsx`, registered once in the MDX map and shown only in the Concept phase. The name is a proposal, not an existing API.

Use one small pure data transform for the table, trace and numeric feedback. Cross-check its outputs against TFJS in the focused verification. Avoid a new TensorFlow download solely to animate twelve cells; label the displayed code as the implementation being explained. The existing challenge remains the place where the learner runs TFJS.

Lazy-load only if the component or chart code justifies it; basic HTML/SVG and arrays should be sufficient. Do not add a charting package for this experiment. Handle malformed configuration explicitly rather than rendering plausible empty results.

Do not render a side-effectful copy in both lesson panes or again in Code. Existing visibility tests should verify the new component has one intended placement. Preserve the lesson's URLs, phase anchors, completion checks, editor instance and saved draft.

Persist only the bounded experiment state if persistence is included: schema version, lesson/experiment ID, selected operation, prediction, whether explanation/help was revealed, and follow-up outcome. A changed content version can reset an incompatible experiment draft without deleting lesson or editor progress. Do not infer module completion from this state.

Use existing consent-aware analytics for a small event payload: experiment ID/version, mode, first-attempt outcome and help level. Do not capture typed answer text. Whether a user attempted this optional activity can remain local if it is not needed server-side.

## Feedback examples

Correct operation, wrong channel values:

> The axes are in the right order. Your trace includes channel 0's middle reading. Follow channel 1 down the original grid, then compare those values with the result.

Wrong operation:

> Both results have four rows and three columns. This row mixes sensor channels because reshape preserves the flat value order. Select one input channel and follow its three values.

After an assisted answer:

> The example is complete. Try a different packet to check the same idea.

These examples are instructional UI copy, not new cast dialogue. They do not change character registers or add direct cast address to the learner.

## Acceptance checks

- Both output arrays match the worked values above and a real TFJS calculation. Include a rectangular follow-up so reshape and transpose cannot accidentally coincide.
- Correct dimensions with wrong channel values fail the follow-up. An assisted correct result is distinguishable from an unassisted one. Neither grants a lesson pass.
- The complete activity can be used by keyboard at 1440px and at 390px/320px layouts. Test text enlargement, focus visibility, light/dark schemes and reduced motion. Inspect the real render, not only a component snapshot.
- Returning to a phase, resizing or opening a glossary term preserves the intended activity/editor state. Refresh behaves according to the documented experiment persistence policy.
- A failed lazy load, if one is used, leaves the teaching explanation and existing challenge available. No additional model download or external service is needed.
- Content explains axis meaning, flat order and value membership without suggesting that shape reveals a physical signal source.
- Existing lesson-navigation and exercise checks still pass. Add only focused numeric and interaction coverage for the new behavior.

After those checks, read the surrounding lesson in sequence. Remove prose made redundant by the experiment; keep the precise reshape/transpose distinction and the full reference. A shorter page is useful only if the learner has less to hold in memory, not if necessary explanation disappeared.

When actual learners are involved later, observe whether they can answer the changed-packet question without the example visible and explain their choice in their own words. Record timing and help. This is the outcome to investigate; clicks and animation completion are not learning evidence.
