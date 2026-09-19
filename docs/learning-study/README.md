# Deep Orbit independent review and learner pilot

This packet prepares Q5 and Q6 of the [content quality plan](../content-quality-plan.md).
It contains no reviewer scores or learner results. The author-side checks in
the repository cannot establish a 9/10 independent score or a $70 return on investment.

The September 19 [measurement handoff](learning-product-handoff.md) adds
observations for the new experiments, both ML routes and revised story choices.
It distinguishes an optional mixed-background discovery round from this
formal novice pilot. Recruitment remains deferred; these are prepared materials.

The study owner recruits two independent reviewers and 12-20 JavaScript
engineers new to ML. One reviewer needs practical ML evaluation experience;
the other needs technical editing and instructional experience. Both must
disclose any work on this course, payment and relationship to the owner.
They cannot approve material they wrote. Pay for the review work regardless
of the score. Include browser and Node backgrounds and learners outside the
owner's personal network. Do not recruit only enthusiastic existing customers.

## Prepare the study

1. Finish the intended content patch and record a reviewable revision. Run
   `node scripts/learning-study.mjs prepare learning-study-private` from the
   repository root. The command refuses to overwrite existing study files.
   It hashes current source files, including uncommitted edits. Preserve that
   exact source snapshot for reviewers and learners.
   `participant-template.json` and `observation-templates.json` contain blank
   records. Copy them only as participants enroll and observations happen.
2. Read [the independent review instructions](reviewer-guide.md) and
   [the pilot protocol](pilot-protocol.md). Set start/end dates, workload,
   owner contact, consent/retention dates and compensation before enrolling.
   The generated files are drafts until those fields are completed.
3. Give reviewers the frozen course, `review.json`, the project rubrics and
   instructions. Give participants only the relevant [task form](task-forms.md)
   when its session starts. Keep [scoring notes](facilitator-scoring.md) with
   the facilitator until the delayed task is complete. The repository is not
   an exam security boundary; record prior exposure and help.
4. Use pseudonymous IDs. Keep contact details and consent records separately
   from scores. The ignored `learning-study-private/` folder is local storage,
   not encryption or a hosted research service. Do not commit participant
   records, recordings, identities or raw transcripts to this repository.
5. Run `node scripts/learning-study.mjs summarize learning-study-private/pilot.json`
   and the same command for `review.json`. The commands write summaries to
   stdout. They validate records and refuse to treat missing fields as passes.

The generated review sheet covers each lesson/exercise plus supporting
artifacts recorded in the current review manifest. Every artifact needs
subject and editorial evidence. The review guide explains when an editor
can inspect technical plumbing for understandable errors without claiming
to verify its numerical correctness.

## Evidence to retain

Keep the original answers, first attempts, project snapshot links or ZIPs,
clean-run logs, rubric sheets, task observations, help records and changes
made after feedback. A GitHub snapshot is a submission, not an assessment
pass. A maintainer's fixture cannot count as a learner submission.

Publish only de-identified counts, common confusion patterns and permitted
quotations. Record deviations and missing responses. Preserve earlier
results when fixing a task, and test the revision with fresh participants.
The protocol has diagnostic thresholds; a small pilot cannot establish
population-wide effectiveness or predict 150,000 users.

Human review, enrollment, observed sessions, seven-day checks and 30-day
follow-ups remain open until the corresponding evidence exists. The $70
purchase/refund experiment and acquisition study remain separate Q7/Q8 gates.
