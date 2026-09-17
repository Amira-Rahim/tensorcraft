# My occupancy project

## Decision and data

What happens after a prediction? Define positive, false positive and false
negative. Explain your assumed costs and why the data supports this limited
experiment. Cite the dataset and describe the sampling changes.

## Experiment and evaluation

Link plan.json and the validation/final run files. Record Node/TFJS versions,
commands, initialization seed (if used), features, training-only scaling,
architecture, optimizer, batch size, epoch count and chosen threshold.
Report both confusion matrices and costs on the same final rows. Recommend
the baseline or model and explain whether the difference warrants complexity.
Disclose every time final-period results influenced a change.

## Mistakes and limitations

Inspect three mistakes by row ID, or all if fewer. Explain what the available
measurements can and cannot establish. Discuss dependence between nearby
readings, one-room scope, missing inputs and uncalibrated scores.

## External app and operating notes

Record npm ci, training, check and start results from a clean folder. Compare
three raw-row scores in the browser against the exported parity examples.
Record browser/backend, warmup, repeat count and measured timing distribution.
Describe the missing/corrupt artifact response. Write a short runbook: when to
withhold predictions, what to monitor, and how to restore the previous artifact.

## Adaptation

After the first report, suppose a false negative now costs twice as much.
Reconsider the rule/model choice and threshold using validation data only.
Keep the first artifact and report, document the change and explain why the
already inspected final period cannot provide a new independent score.
Describe what new evaluation data you need.

## Assistance and effort

Record active minutes and sessions (estimates are fine). List course hints,
examples, AI, other people and any reference code used. Explain one mistake
you made and how you found it. Assistance is evidence, not an automatic failure.

## Reviewer and delayed attempt

Leave this blank for a reviewer: criterion scores, blockers, evidence paths,
review date and feedback. Seven days later, attempt the changed-cost decision
on a new held-out period without reopening this report first. Record time,
help and corrections; no delayed result exists until someone does the task.
