# Learner pilot protocol, draft v1

Freeze dates and the reviewed content before enrollment. Proposed scheduling
is six weeks at five hours per week, plus follow-ups. This is an author
estimate to check with recruits, not a measured course duration. Adjust it
before enrollment if unrealistic, then keep the declared deadline in the
analysis. Recruit 12-20 people; the target is 16. Record refusals and reasons
separately without unnecessary identifying information.

## Consent before observation

The owner fills in contact, compensation, storage location, retention date
and withdrawal contact in the study record, then gives this information to
each participant in plain language:

> We are testing whether Deep Orbit teaches useful ML skills to JavaScript
> engineers. We will observe selected tasks and record your answers, effort,
> help used and places where the material is confusing. Participation is
> voluntary. You can skip questions or stop without affecting course access
> or agreed compensation. Use sample data and keep personal and employer
> information out of submissions. We will ask separately before making an
> audio/video recording or quoting you. Ask the named contact to withdraw
> identifiable records before the stated deletion/aggregation date.

Obtain agreement to the completed terms before enrolling. Recording and
quotation permission are separate, optional choices. Screen sharing should
show the exercise window only. Schedule deletion and carry it out; an
ignored local folder does not provide an access-control policy by itself.

## Sessions and records

| When | Task and observation |
| --- | --- |
| Before the course | Form A, up to 20 minutes. Record prior ML exposure, JS background and assistance. An incorrect answer is useful evidence. |
| First module | Observe normal use, hints, time and interventions. Ask for a paraphrase of the tensor-shape explanation without adding a hint. |
| After the first trained classifier | Independent build-triage assignment. Preserve first submission and any later assisted revision separately. Score with the project rubric adaptation. |
| Dense later module | Observe anomaly reconstruction/threshold reasoning. Ask the learner to explain a sampled passage and a story consequence with a specific before/after event. |
| End of course, within declared window | Room-occupancy project; clean-export review; learner explains an error and makes a fresh cost change. Then Form B, up to 20 minutes. |
| Seven days after course completion, allowed days 6-8 | Form C, up to 20 minutes, with course/report closed. Record any help anyway. Retain late responses but exclude them from the scheduled delayed gate. |
| 30 days after completion, allowed days 27-33 | Ask what they used or adapted, request an optional artifact/demo, ask what worked without reopening the course, and record actual use separately from plans. |

Use the same observation prompts for everyone. Do not teach during the
unassisted attempt. If someone is stuck, record that point before offering
help and retain the attempt. Normal course hints are allowed in course work.
Use `assistance` to name hint/reveal/AI/person/course-reference use; an empty
array means explicitly reported no help. `null` means unknown, not none.
Keep active minutes separate from calendar time. Record abandonment reasons
without converting silence into a reason.

For passage/story observation, record the exact source passage, learner
paraphrase, clarification needed and the event consequence they identify.
Set `passageExplained` and `storyConsequence` only from these observations,
not from a satisfaction rating. Record background-specific confusion even
when the aggregate passes.

The five concept tasks in each form cover training/inference, leakage,
metric choice, confidence and adaptation. The facilitator applies the
one-point anchors in the scoring notes and records each answer. Do not reveal
those notes until the delayed response is captured. These are authored forms;
their equal difficulty has not been validated. Report paired changes as
descriptive results, without a causal learning-gain claim.

## Freeze these diagnostic gates

These are the Q6 thresholds, retained without relaxing them:

- First module: at least 80% of starters complete without live author help.
- Early transfer: at least 80% of submitters score at least 8/10 with no
  blocker or solution reveal. Also report reach and pass among all enrolled.
- Final project: at least 70% of all enrolled finish the course and a runnable
  project scoring at least 8/10 within the declared window. An explanation
  and a fresh adaptation must be observed. Keep non-completers in the denominator.
- Delayed: at least 75% of on-time course completers respond during days 6-8;
  at least 80% of those respondents answer at least four of five tasks correctly.
- Comprehension/story: at least 80% of observed readers both explain the
  passage without clarification and identify a meaningful story consequence.

The summary reports counts, percentages, missing observations and paired
pre/post changes. A zero denominator is `no_evidence`. Open observation
windows are `collecting`; do not claim final gates from an early response.
Mark the study `closed` only after the final follow-up deadline. Even then,
fewer than 12 or more than 20 enrolled learners is a protocol deviation, not
a completed diagnostic cohort. Report withdrawals as attrition without
retaining responses they asked to delete; keep only permitted aggregate counts.

Investigate each failed gate and repeated error, including subgroup patterns.
Record fixes and retest fresh participants on the revised course. Do not
remove inconvenient rows, lower thresholds after results arrive or substitute
liking the story for explaining its consequences.

The 30-day interview asks for a specific task, what changed, time actually
spent/saved, what help was still needed and an optional artifact. Label
self-reported use and artifact-supported use separately. Report non-response.
This evidence informs ROI; it does not by itself establish that the course
is worth $70 or that a market of 150,000 users will buy it.
