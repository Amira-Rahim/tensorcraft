# Independent assessment and external project

Date: 2026-09-17. Base: `92cf8f27` plus the local assessment-reliability patch.
Status: implemented locally; learner and independent-review gates remain open.

This patch adds three short decision tasks and the separate final project.
It also narrows objectives and explains test-double limits where the previous
exercise did not actually install a runtime, download a model or deploy an app.
The editorial focus is unsupported claims and overloaded instructions. Policy
comparisons use tables so readers can compare counts directly.

## Decision evidence

| Lesson | Task | Evidence collected |
| --- | --- | --- |
| Foundations: data loading | `future-builds` | Chronological evaluation plan, exclusion of a post-outcome field, rationale, help, reported minutes and attempts. |
| Training loop: evaluating DEEP SCAN | `review-costs` | Baseline/rule/model choice on identical validation rows; FP/FN cost calculation; explanation of the accuracy disagreement and remaining evaluation. |
| Anomaly detection: threshold tuning | `rule-or-model` | Revised error-cost calculation where the simple rule wins; reasoning about retraining and fresh evaluation. |

Feedback appears after submission. The choice and calculation are checked;
the explanation is recorded for a reviewer, not scored by keyword or length.
A correct calculation for a suboptimal policy is distinguished from a wrong
calculation. Earlier attempts survive corrections and reloads in the same tab.
Records are downloadable. The UI identifies tab-only storage, records up to
20 attempts, and does not award XP or certify unaided mastery. This is a local
learning record, not a tamper-resistant examination system or account sync.

These tasks supplement the existing build-triage assignment. They do not
replace a learner's own experiment or make its self-review an assessment pass.
The original evidence categories are retained conservatively. The launch
packaging objective moves from explanation-only to partial evidence, giving
118 guided, 53 partial, 23 recall and 28 explanation-only objectives. New
decision and project evidence is also listed separately in the learning map
and manual assessment record; no count measures learner mastery.

## Final project

The capstone Challenge links `room-occupancy-v1.zip`, its brief and a public
10-point rubric. The learner chooses inputs, chronological periods, baseline,
error costs, model and threshold. The training file intentionally stops until
they implement the experiment; the download contains no fitted weights or
model solution. Export, preprocessing, metric arithmetic and app plumbing
are supplied so decisions and interpretation remain the learner's work.

The data is a documented subset of UCI's
[Occupancy Detection dataset](https://archive.ics.uci.edu/dataset/357/occupancy%2Bdetection),
credited to Luis Candanedo (2016), DOI 10.24432/C5X01N, under CC BY 4.0.
The package sorts the original 20,560 observations and keeps every tenth row,
producing 2,056. Values and labels are unchanged; scaling remains the learner's
responsibility. The source archive hash, transformation and unspecified source
timezone are recorded. The starter's CC0 release excludes the source dataset.

The learner-owned folder includes an exact TFJS dependency and npm lockfile,
setup commands, an editable plan and report, local model/preprocessing files,
recorded evaluation runs, attribution, a model-card/runbook brief and an
adaptation to changed error costs. It can be zipped or placed in the learner's
own GitHub repository. Tensorcraft's exercise-sync integration does not publish
this external project folder; no GitHub account changes were made here.

The local application loads real saved topology and binary weights. Shared
preprocessing preserves feature order and scaling. The Node check compares
reloaded outputs with saved raw-row examples. The browser verifies file hashes,
input/output shapes and input values, then reports predictions, backend and
measured inference/readback time. Missing or mismatched files disable inference.
Checksums detect accidental changes, not authenticity or educational quality.

The evaluator loads the saved model and computes baseline/model results on
the same row IDs. It rejects overlapping or unordered periods and inconsistent
declared scaler-fit IDs. It saves each validation or final evaluation as a
separate run with plan/artifact hashes. It cannot prove that preprocessing was
actually fitted on those IDs or prevent inspection of test labels; the rubric
requires code review and disclosure of test-informed changes.

## Verification

- Clean ZIP extraction and `npm ci` succeeded outside the monorepo.
- The untouched starter refused to claim a trained result. A separate
  maintainer fixture, excluded from the download, performed a real fit and
  exported topology, binary weights and frozen preprocessing.
- A fresh Node process reloaded the model and matched four original scores
  within 1e-5. Chromium matched those raw-row predictions with the real TFJS
  WebGL backend. No external requests occurred during browser inference.
- Validation/final evaluation, ID overlap, declared scaling leakage, invalid
  inputs, missing weights and changed-weight checks passed. Restoring the
  original artifact restored the app.
- Production React/CSS component checks covered hidden feedback, submission,
  attempt retention, reload and downloaded records/project bytes. Desktop
  and 375px layouts were inspected with no horizontal overflow. The local
  Vite check emitted the existing CSS import-order warning; it did not block
  rendering. This is not a full accessibility or authenticated-navigation audit.
- Targeted content, project-contract, decision/transfer UI and lesson-placement
  tests: 852 passed in 33 files. Workspace typechecking: 10 tasks successful.
  Formatting and diff checks passed. The review manifest records current
  hashes for 121 Deep Orbit artifacts and 75 supporting artifacts; all 121
  whole-artifact statuses remain partial.

Reproduce the two integration paths:

```sh
python3 scripts/package-room-project.py
node scripts/check-room-project.mjs
node scripts/check-decisions-browser.mjs
```

The project check uses a new temporary folder, installs from the downloaded
lockfile, and uses the maintainer fixture only in that temporary copy. Its
model score is infrastructure evidence, not a recommended learner solution,
a production benchmark or a course learning outcome.

## Remaining acceptance work

A17 now has bounded baseline/metric choice checks and an external paired
comparison path. Learner-authored confusion-matrix interpretation, error
analysis and defensible model decisions still need human assessment.
A23 has one real TFJS exported-model application; actual ONNX/pretrained
runtime behavior, IndexedDB caching, converter output, hosted deployment and
learner-authored CI/rollback workflows remain separate checks.
A24 has decision prompts, evidence collection, a final project and a rubric.
Independent scoring, observed difficulty, assistance, seven-day transfer and
longer-term use remain uncollected. No 9/10 score or $70 value conclusion is
claimed. The [canonical backlog](../post-launch-backlog.md) retains these gates.
