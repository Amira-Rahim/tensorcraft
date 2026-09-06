# Module-1 Baseline (template)

Step 3 of `docs/audits/lesson-format-audit-2026-09-04.md`: the pre-clip
baseline that the video generation gate reads against. Copy this file to
`module1-baseline-<capture-date>.md`, fill it, and keep the template
untouched.

## Preconditions

- The 2026-09-04 in-lesson instrumentation AND the prose partition are
  deployed. Data from before that deploy is not comparable: the skip
  metric was biased low by construction, step views did not exist, and
  the steps rendered different content.
- Enough subjects. The audit's written threshold: at least 200 consented
  module-1 lesson starts. Below that, capture anyway (dated, labeled
  "underpowered") but do not gate decisions on it.
- One capture window, stated below; do not mix windows across sections.

## How to capture

1. PostHog numbers:
   `POSTHOG_PERSONAL_API_KEY=... POSTHOG_PROJECT_ID=... node scripts/analytics/module1-baseline.mjs --since <deploy-date>`
   and paste the printed markdown into the "PostHog pull" section.
2. Supabase numbers (earned pass and hint dependency; `solution_viewed`
   lives only in the database): run the SQL below against production
   (creds in `apps/api/.env`) and fill the table.
3. Denominator for the consent opt-in rate: unique visitors over the same
   window from the log drain, counted manually.

## Capture

- Window: <start> to <end>
- Deploy commit carrying the instrumentation: <sha>
- Consented module-1 lesson starts in window: <n> (threshold: 200)

### PostHog pull

<paste the script output here>

### Supabase: earned passes and hint dependency

```sql
-- Earned pass = passed without viewing the solution and without the
-- level-3 (verbatim solution) hint. This is the number that may ever be
-- called "demonstrated skill"; raw completions may not.
select
  count(*)                                   as attempts,
  count(*) filter (where passed)             as passes,
  count(*) filter (where passed
    and not solution_viewed
    and hints_used < 3)                      as earned_passes,
  count(*) filter (where solution_viewed)    as solution_viewed_attempts,
  round(avg(duration_ms) / 60000.0, 1)       as avg_minutes_to_attempt
from exercise_attempts
where world_id = 'deep-orbit'
  and lesson_id in (
    'introduction-to-tensors', 'tensor-shapes', 'tensor-operations',
    'data-loading', 'normalization')
  and attempted_at >= '<window-start>';
```

| attempts | passes | earned passes | solution-viewed | avg min to attempt |
| --- | --- | --- | --- | --- |
| | | | | |

```sql
-- Authoritative purchase count for the window. The PostHog
-- payment_completed number is consent-gated on the client side of the
-- funnel and at baseline-sized n one or two non-consenting buyers
-- distort it; purchases is the source of truth.
select count(*) as payments
from purchases
where created_at >= '<window-start>';
```

| payments (authoritative) |
| --- |
| |

## Read against the gates

- **Narrative skip rate** (all vias over skips + auto-finishes):
  the written rule is >40% triggers narrative redesign, and the video
  doc gates clip investment on the same number. Value: ____%
- **Briefing-to-Concept survival** (step 1 first-views over step 0
  first-views): the audit proposed agreeing a floor before generating;
  record the value and set the floor here. Value: ____%
- **Completion** (people_completed over people_started): ____%
- **Paywall conversion** (authoritative payments over people hitting the
  paywall): ____%. Record it, but do NOT gate the clip decision on it:
  at the 200-start threshold this number is single-digit-payments noise
  (re-audit 2026-09-04, all three judges). The clip go/no-go reads skip
  rate, Briefing-to-Concept survival, and completion, which this sample
  can power.

## Caveats that ride with every number

- Consent-gated: all PostHog numbers cover only browsers that accepted
  the banner. State the opt-in rate (consent_granted browsers over
  log-drain uniques) next to any percentage quoted onward.
- Guests write nothing to Supabase, so the SQL tables undercount the
  free tier's activity relative to PostHog events.
- The final step's dwell is unmeasured by design (tab close beats
  unload); lesson time comes from lesson_completed.durationMs and the
  sum of prevStepMs, not from step-5 dwell.
