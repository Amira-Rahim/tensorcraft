# P3 story and decision review

Internal source and local integration review, 2026-09-19. No reader study or independent editorial score is claimed. Full revised-course review remains P6.

## Five arcs

| Character | Pressure and action | Consequence and later change |
| --- | --- | --- |
| Demir | Starts with plausible JavaScript assumptions. Predicts the flat packet count before inspecting layout. | Mistakes develop with the system: asynchronous ownership and cross-release evidence joins replace repeated cleanup/key mistakes. Keeps a mismatched artifact pair as a regression fixture; receives verification handover responsibility. |
| Farah | Treats the whole-capture spectrum as evidence for a steady tone; spends 50 minutes without locating the bursts. | Crosses out the claim and changes to timed windows. Later checks timestamps and window boundaries before interpreting attention. A method she chose costs time and changes her next action. |
| Nazari | Carries investigation and maintenance work alongside the model effort. | Choices move specific work between watches. After threshold replay she delegates the log to Demir and returns to the coolant inspection. Her quiet response to the quantized signal remains; approval is earned through work. |
| Mirza | Makes questions and decisions under limited crew time. | His 0800 transmission preparation takes Nazari away from maintenance. The decision has a visible cost; he does not become a second technical lecturer. |
| ARIA | Rules fail to classify the signal, while its archive still supports replay. | Keeps timestamps, recovers the 211 KB watchdog artifact, and remains a limited fallback. Lost capture and relay remain lost. The final mission record and unanswered operator-note row are preserved. |

## Module continuity

Foundations establishes axis meaning and flags 7741 only at normalization. Neural networks receives the actual saved investigation handover. Training separates ambiguous scores from truth. Runtime work advances from synchronous cleanup to asynchronous ownership. Signal processing makes Farah revise a costly hypothesis. Recurrent work preserves the ordered/shuffled failure and missed three-second timing. Advanced time-series uses that timing record to motivate the next prediction. Anomaly work attaches investigation to crew workload without declaring 7741's true label. LLM report release remains evidence-gated. Optimization retains permanent data loss and limited recovery. Capstone joins artifact identity, monitoring and operational ownership before the fixed deploy-night record.

Canon checked: 64 channels; 28,800 archived readings over eleven days; 7741 logged eight days earlier; 256 Hz sampling and 73.4 Hz component; 73.4-second pulse interval, 47-minute macro-cycle, later 30-second intervals. Correlation 0.9987 is not a causal explanation. The 0157 canary, thirty matching verdicts, two-minute fleet interval and 0213 record are unchanged. Later conditional scenes precede `operator_note: none`.

## Six decisions, 24 current outcomes

| Decision | Cooperate | Defect | Random | Dominant |
| --- | --- | --- | --- | --- |
| First flag, v2 | Full review costs the channel check | Unsupported noise label loses the working entry | Scheduled check runs, review lacks an owner | Bounded replay preserves context, instrument review waits |
| Training set, v1 | Invented event label contaminates later filtering | Logged exclusion preserves uncertainty | Inclusion costs an unseen evaluation example | Named diagnostic probe keeps label unknown |
| Report release, v1 | Regeneration and review may miss the window | Disputed section awaits approval | Replacement loses prior approval | Five approved sections leave with an explicit omission |
| Cache boundary, v1 | Disabled reuse costs a longer queue | Rounded keys may hide missed alerts | Watch reset leaves within-watch and version errors | Bounded versioned exact reuse needs timing evidence |
| Drift response, v2 | Instrument check consumes the slot, labels still needed | Unlabeled candidate cannot establish quality | Muted paging creates review and maintenance debt | Bounded shadow run costs instrument review, labels still needed |
| Deploy rehearsal, v1 | Saved checklist for staged work | Saved checklist for broad-risk review | Saved checklist for uncertainty | Saved checklist for canary comparison |

The branch text is the authoritative detail. The table identifies each path's intent, not a score. In particular, `dominant` is a historical storage label, not a learner-facing declaration that an option is universally best. The two revised decisions disclose time, missing evidence and operating limits before selection and have no countdown. Drift shadowing cannot issue alerts and stops if active P95 exceeds 200 ms. All branches change later work; none changes scientific truth. Deploy options remain rehearsals, not alternate histories of the canonical deployment.

## Persistence and compatibility

Migration 063 adds a version to existing first-write choice records. Existing records become version 1. Immutable original text for the two revised decisions lives in `packages/shared/src/story-decisions.ts`. New version 2 writes validate beat, lesson, index and label in the authenticated RPC. Other four beats accept only version 1. Records remain account-scoped and first-write wins.

Current readers display original option and consequence text for historical records. Missing choices receive a neutral continuation. Read errors show neutral context and retry, without inventing a choice. The old getter returns only version 1: an old deployed client cannot reinterpret a version 2 choice with its old wording. Such a client must refresh to see the saved version 2 result. A new write never silently falls back to the old RPC. Rollback retains the versioned data. Production schema deployment remains P9.

## Verification

- Isolated PostgreSQL applies migrations through 063 and exercises all six canonical records, invalid label/version/beat rejection, own-account reads, cross-account isolation, direct-write denial and first-write compatibility.
- Three client/component suites pass 31 tests. Earlier navigation regression suites also pass; counts overlap.
- Production MDX renderer and story client, with an explicitly mocked Supabase transport: 24 current branches, eight historical branches, four combined drift/deploy handovers, neutral/error/retry states, competing tabs and keyboard selection pass.
- All 56 lessons render at 1100 and 375 pixels without page errors or page overflow. Axe checks cover the first-flag, cache and drift controls at both widths. Screenshots and machine-readable outcomes are retained alongside this record.
- This fixture does not establish production authentication, human engagement, measured comprehension or reader preference. Those are separate checks.
