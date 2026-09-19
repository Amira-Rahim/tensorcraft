# Learning-product measurement handoff

Prepared 2026-09-19 for the [approved development plan](../learning-product-development-plan.md). No participant has been enrolled and no reviewer has been contacted for this release. The [release record](../audits/learning-product-release-2026-09-19.md) contains internal evidence. Actual screen-reader verification remains open.

## Use the current materials

Freeze the deployed source and content versions before enrollment. Preserve the product source inventory and content review manifest with the study packet. Keep Forms A, B and C and their existing scoring anchors unchanged. The additional observation prompts in [task forms](task-forms.md) assess the new interactions and story continuity separately; they do not add points to the existing five-task score.

The formal [pilot protocol](pilot-protocol.md) still requires 12-20 novice participants and retains all its original gates. The newer plan also proposes a smaller discovery round with 6-8 JS engineers new to ML and 4-6 people with ML foundations. If used, record this as a separate discovery round. Do not feed its mixed population into the formal novice cohort's completion gates or change the formal protocol after seeing results. The experienced group tests the challenge route, prerequisite recaps and harder engineering tasks.

Before either round, the owner supplies dates, compensation, contact, consent and retention terms. Use a fresh output directory with `node scripts/learning-study.mjs prepare DIRECTORY`; do not overwrite existing private study records. The CLI prepares and summarizes the formal protocol. Keep discovery and additional observation records in a separate private file until an explicit protocol revision supports them. An ignored JSON file is not an access-control system.

## Record the new experience

For each observation retain a pseudonymous participant ID, background group, selected ML route, exact lesson/activity and version, timestamp, active minutes, first response, later responses, help used, interruption or setup failure, and the observer's reason for each assessment. Keep raw answers private. A missing help record means unknown. A successful retry does not erase a failed first attempt.

Observe the opening from the world page to the first changed packet. Record elapsed and active time separately, where the learner first sees a useful result, and whether they can explain why reshape and transpose differ. The maintainer's 75.452-second run is not the expected human time. Check the proposed 10-15 minute target with these observations before publishing a timing claim.

Sample normalization, threshold selection and one later mechanism using the prompts in the task forms. Retain the policy selected on validation data before a held-out result is revealed. If the learner uses a reference or gets help, keep that result and mark the assistance. A repeat on a remembered public example does not establish unfamiliar transfer.

In the story observation, record the choice ID and version, what the learner thought each option cost, and the specific later scene they identify. Ask for the motives and changed behavior of Mara, Elias, Kira, Nazari and ARIA. Keep skipped choices as skipped. At the ending, ask what was resolved, what remained uncertain, and whether the later Neon sample offers a different skill. Do not count a waitlist click as a satisfying ending or an intention as a purchase.

For independent application, retain the first external project, split/scaler explanation, baseline comparison, failed-case diagnosis and clean run. Ask for a fresh cost or input change after the initial submission. Browser summaries and the optional run form describe reported work; an observer must inspect the artifact and explanation to score independent application.

## Measurement definitions

| Product question | Available record | Denominator and interpretation |
| --- | --- | --- |
| Where do learners first engage? | Consented `experiment_started`, `experiment_submitted` and lesson phase events | Distinct eligible starters with consent, grouped by activity/version. A remount can emit another start; count people or scoped browser identities, not events. Consent refusal is missing analytics, not abandonment. |
| Did a changed case succeed? | Submission phase, attempt, correctness and assistance; bounded account activity summaries | Preserve first and latest outcomes separately. Browser-reported checks are not authoritative mastery. Do not merge versions or treat local answers as synchronized across devices. |
| Which route is used? | `learning_route_selected` and current profile preference | The preference can change. Attribute subsequent events only when the selected route is known; the experiment payload does not itself include a route. JS seniority is a separate field. |
| Does progress represent useful work? | Lesson completion, exercise checks, experiment records, self-rated recall and optional project run record | Keep each source separate. Account summaries can be truncated to recent history. Project explanations stay local/downloaded and need an explicitly supplied artifact for review. |
| Do learners return and remember? | Consented session events plus the scheduled Form C | Include only cohorts old enough to qualify. A return visit is not retained understanding. Report non-response and assistance alongside delayed scores. |
| Does the offer work? | Authoritative payment/webhook records, refunds and support observations | Exclude QA grants and test accounts. Keep actual purchases separate from client checkout events; no price increase is triggered by this release. |
| Is the next theme wanted? | Public preview use and explicit interest; later actual purchases | Interest is supporting evidence. Unique people are counted once across all five themes; purchases and users are different quantities. |

The new event payloads are bounded identifiers and outcomes. Do not add code, answers, project files, emails or free-text reasoning to product analytics. Consent-gated analytics and operational account records have different purposes. A project record is currently operational evidence, not a newly added analytics event.

## Decisions after evidence exists

Keep the $50 launch offer. Report counts, missing observations, group differences, observed effort and reasons for refunds or non-completion. A repeated consequential misunderstanding or a broken external run returns to development. Retest the changed material with fresh participants before making a stronger claim.

Independent ML/editorial review and the formal learning gates remain E1. The owner's actual $70 offer, purchase/refund evidence and later artifact use remain E2. Channel economics and repeat-theme purchases remain E3. This handoff prepares those stages; it supplies no reviewer grade, learner outcome or acquisition forecast.
