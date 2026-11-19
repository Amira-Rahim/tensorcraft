# Two-lesson learner test

> Superseded rollout gate, October 6: the owner directed completion across all 56 lessons without a five-person test. The [production rollout](../deep-orbit-rollout.md) is the current implementation record. This file preserves the earlier pilot work; participant recruitment is not an active task or a prerequisite.


Prepared October 6, 2026. Status: archived proposal, superseded as a rollout requirement by the owner. **No participant sessions or learning results are recorded yet.** This is a formative check of a design, not an estimate of market demand or a claim of improved learning.

## Decision this test supports

Can the visual/story pattern used in Foundations also support training and evaluation, without confusing illustrative story results with a learner's own results? The implementation now covers the full course; this question can inform optional future research.

The former proposal used at least four of five eligible participants completing each central task independently. This is no longer a release gate. Report the counts and what happened. Do not call this statistical proof. Any observed misconception would guide a correction, independently of that former numerical threshold.

## Participants and readiness

If this study is separately commissioned later, recruit five JavaScript engineers who are new to ML and can work with arrays, functions, and async/await. Prefer people who completed the preceding Deep Orbit material, including neural networks, loss, gradients, and backpropagation. Do not use experienced ML practitioners as substitutes for this audience.

For outside participants, provide the same prerequisite material before the test. Check that they can explain predictions, labels, loss, and a weight update in their own words. Record missing prerequisites and provide instruction before scheduling the measured lesson attempt. Do not count a prerequisite failure as a visual-design failure or silently coach it during the test.

Use anonymous participant IDs P01–P05. Note JavaScript experience, prior ML learning, completed prerequisites, and primary device. Obtain consent before recording or taking identifiable notes. This kit does not authorize sending invitations or contacting people.

## Materials and setup

The original proposal used two local prototype lessons. The full-course rollout
replaced those prototypes, and their runtime was retired on November 6, 2026.
The [retained review](review.md) and screenshots document the original interface.
Any future study needs the current application and a separately commissioned
protocol. The [learning-study kit](../../learning-study/README.md) records the
current research setup.

- Each participant starts in a fresh browser tab/session, with no draft or answer reveals from QA.
- Use the participant's normal device. Include phone users if mobile learning is part of the intended rollout. Run a dedicated keyboard/assistive-technology session with a person who uses those tools before claiming accessibility beyond automated checks.
- Confirm fonts, scenes, controls, and local TensorFlow.js runtime load before the session. Do not count runtime setup problems against the participant.
- Allow roughly 45–60 minutes for the two lessons and discussion, plus any prerequisite work beforehand. This is a planning allowance, not a measured completion time. Offer a break; split sessions if needed.
- Keep the facilitator-only answers below out of the participant's view. The preview's in-lesson answer reveals are legitimate learner actions, but must be logged as assistance for recall.

## Opening script

“We are testing these lesson pages. Work as you normally would, and tell me what you expect when something is unclear. You can use the lesson's references and hints. I may stay quiet for a while so we can see where the page itself helps or gets in the way.”

Ask what the participant hopes to learn from ML. Record their words. Do not sell the style or tell them that it is supposed to be delightful.

## Session tasks

| Task | Participant prompt | Observe without teaching |
| --- | --- | --- |
| Training opening | “Start this lesson. Tell me what the crew needs you to find out.” | Can they connect the assignment to Demir's run and the compute question? Do they know what to do next? |
| Training mechanism | “Explore this trace. Explain what changes and when this stopping rule would stop.” | Do they inspect both curves, understand the shared scale and distinguish validation from weight updates? |
| Training JavaScript | “Complete the Challenge using the material on the page. Interpret the feedback.” | Can they locate the supplied setup, attach the callback, await fit, and separate stopping from the window summary? Record references, hints, errors, recovery and code changes. |
| Training transfer | Use the fresh case below, before opening its answer. | Can they explain a new curve pattern without equating a gap with a proven cause? |
| Evaluation opening | “Continue into the next lesson. What evidence is being requested?” | Do they connect held-out evaluation to the unresolved training result? |
| Evaluation mechanism | “Inspect this score. Explain what the classifier got wrong.” | Can they account for all 50 cases, distinguish precision and recall, and identify what 94% hides? |
| Evaluation JavaScript | “Complete this Challenge and explain the values your code reports.” | Are all 43 evaluation rows kept out of training? Do they read real metrics and understand that a pass is procedural? |
| Evaluation transfer | Use the fresh case below, before opening its answer. | Do they compare error types, baseline and representativeness rather than choosing the larger accuracy automatically? |
| Story handoff | “What question is still open at the end?” | Do they understand that sample 7741 remains unresolved and that the fictional score is not their exercise score? |

Let references remain available for normal lesson work. Mark answer reveals and solution help separately. For the fresh transfer questions, start with the lesson hidden to test retrieval; reopen it if requested and record that assistance. Do not reject a learner simply for using documentation during code work.

If the person stalls, first ask “What are you trying to do?” After a sustained stall, offer help and log the specific intervention. Do not let a difficult diagnosis implementation consume the entire session: record it as incomplete/assisted and continue to the remaining learning questions. Separate algorithm difficulty, prerequisite gaps, unclear instructions, and interface problems.

## Fresh transfer cases

These cases are different from the on-page Takeaways. Read the case aloud or show it as a small table. Do not reveal the facilitator notes until the participant has explained their reasoning.

### Training case

| Mean loss | Previous ten epochs | Latest ten epochs |
| --- | ---: | ---: |
| Training | 0.40 | 0.30 |
| Validation | 0.30 | 0.39 |

Ask: “What happened? What label would your trend function return? What would you investigate? Can these two means tell you that early stopping must have fired?”

Facilitator notes: training improved 25%, validation worsened 30%; the exercise label is `train-down-validation-up`. Overfitting is one possibility, along with data differences, labels, and preprocessing. Two means cannot establish five consecutive individual non-improvements. A useful response need not recite every alternative, but should avoid presenting overfitting or a stop as proved.

### Evaluation case

There are 200 untouched cases: 190 calm and 10 anomalous. The baseline was selected using the training set's most common class.

| Outcome | Always calm | Model |
| --- | ---: | ---: |
| Anomalies caught | 0 | 8 |
| Anomalies missed | 10 | 2 |
| False alarms | 0 | 12 |
| Calm signals correctly ignored | 190 | 178 |

Ask: “Which method has higher accuracy? What does it miss? What information would you need before recommending one? Which data would you use if you wanted to adjust a threshold?”

Facilitator notes: the baseline has 95% accuracy and zero recall; the model has 93% accuracy and 80% recall, with 40% precision. Do not require calculating every metric to count the central interpretation as correct. The participant should identify the error tradeoff, ask about costs and representative data, and use validation rather than the final test for threshold selection. Neither recommendation is automatically correct without those conditions.

## Closing questions

Ask these after the tasks so they do not prime the behavior:

1. “What helped you understand something you couldn't explain before?”
2. “Where did you have to work out how the page worked?”
3. “Did any scene or dialogue help you decide what to do? Which one?”
4. “What felt unnecessary or interrupted you?”
5. “What would you expect to learn next?”

Record exact phrases where useful. Distinguish spontaneous interest in continuing from a polite response to a facilitator prompt. Visual appeal, enjoyment, task success, and willingness to pay are separate observations.

## Scoring and decision

For each central task, mark **independent**, **assisted**, **incorrect**, or **not attempted**, with the observed evidence. An independent code task may use the lesson's reference material; receiving a solution or facilitator explanation makes it assisted. A passed exercise alone does not make the transfer explanation correct.

Central tasks: interpreting the two curves and stopping condition; implementing/reading the training run; accounting for evaluation errors; keeping evaluation held out and reading the code's scores; transferring both concepts to fresh cases.

Log time to first meaningful action and task completion, but do not use speed alone as quality. Record the first confusing term, dead end, retry, reference opening, hint, answer reveal, and any mistaken provenance attribution.

Expand only when:

- At least four of five eligible participants complete each central task independently in the current iteration.
- No recurring critical misconception remains: training loss alone proves readiness; evaluation data may be trained on; small gap means deploy; illustration equals measured output; two means prove a patience stop.
- The frontend-design review passes for desktop and phone, including the original header, clear visual hierarchy, story/action connection, and restrained controls.
- Technical checks pass, and keyboard/assistive-technology findings are resolved for the intended access paths.

If the gate fails, revise the smallest responsible element and test with fresh participants. Repeating the same task with the same person measures familiarity too. Keep the original pages as a reference. A claim that the new design outperforms them needs a separate comparison with matched content and counterbalanced/fresh groups; five formative sessions do not establish that comparison.

## Recording template

Use one copy per participant. Leave unobserved cells blank.

```text
Participant ID:
Date / prototype revision:
JS background / ML exposure:
Prerequisites checked:
Device / input method:
Consent / recording preference:

Task | outcome | time | assistance | observed behavior / exact words
Training story:
Training mechanism:
Training JavaScript:
Training fresh case:
Evaluation story:
Evaluation mechanism:
Evaluation JavaScript:
Evaluation fresh case:
Epilogue handoff:

First meaningful action:
Confusing terms / wrong turns:
Hints / references / answer reveals:
Illustration versus measured-output understanding:
Enjoyment / friction observations:
Suggested change and supporting observation:
```

Summarize across participants in `learner-findings.md` only after sessions occur. Include the denominator, incomplete tasks, who needed assistance, version changes, and competing explanations. Keep the paying-audience hypothesis in the existing product research plan; this study does not validate 200,000 paying customers.
