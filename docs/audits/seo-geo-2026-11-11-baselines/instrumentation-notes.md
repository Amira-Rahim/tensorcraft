# Instrumentation limits for the acquisition baseline

Source review on November 11, 2026. These findings describe the local source.
They do not establish which version produced a historical event or verify
live ingestion. The baseline report records account observations separately.

## Registration counts

The [session listener](../../../apps/web/lib/supabase/session-listener.tsx#L102)
emits `signup_completed` for every `SIGNED_IN` callback with an access token.
The capture has no new-account check, account-creation date condition,
`signup_started` prerequisite or deduplication guard. The nearby browser flag
applies to Kit tagging only.

Repeated callbacks for the same account can therefore produce multiple
`signup_completed` events. The total event count cannot establish new
registrations. The source supports this explanation for inflated counts, but
the exact cause of any observed excess needs event and authentication evidence.
Unique PostHog persons also need identity checks before anyone treats them as
new accounts.

## Traffic and learning populations

The [browser client](../../../apps/web/lib/posthog.ts#L30) captures when the
configured key and host allow initialization. It has no production-hostname
restriction. Inspect actual host values before restricting browser reporting
to `tensorcraft.app`. Server events lack browser host fields, so a global
hostname filter can remove payment evidence.

The [provider](../../../apps/web/app/components/analytics-provider.tsx#L44)
captures browser activity after consent. Its custom `sessionId` identifies a
visible interval. Tab hiding ends an interval and returning starts another.
Use the observed SDK session field for session rates after verifying it in
the project. Browser analytics does not measure visitors who declined consent.

Guide handoffs carry `source=guide`, `guideSlug`, canonical `targetLesson` and
placement in the [CTA contract](../../../apps/web/lib/analytics-events.ts#L279).
The application `source` describes placement. External attribution needs the
SDK's actual referrer and campaign fields. A guide-to-attempt rate needs a
subsequent submission for the target lesson in the same observed session.

The [experiment submission](../../../apps/web/app/components/mdx/learning-experiment.tsx#L93)
records `correct`, `assisted`, `phase` and attempt number. It has no `passed`
field. Feedback sets the assistance state for later attempts. Count submitted
attempts separately from correct answers and correct unassisted answers.

The [lesson completion effect](../../../apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-steps.tsx#L783)
tracks an in-session transition into Consequence. Its
[module check](../../../apps/web/app/worlds/[slug]/[module]/[lesson]/completes-module.ts#L16)
combines server completion flags and local guest records to find the last
remaining lesson. These events establish recorded progression. They do not
establish independent mastery. Live coverage needs a separate check.

## Payment and refund counts

`payment_completed` has three source paths:

- The [settlement handler](../../../apps/api/src/routes/payments.ts#L797)
  emits a server event with checkout `sessionId` and amount in dollars.
  Delayed payments emit after settlement in the corresponding async handler.
- The [success-page helper](../../../apps/web/lib/analytics.ts#L129) emits a
  browser event without a checkout `sessionId`. The
  [receipt page](../../../apps/web/app/dashboard/purchase-success/page.tsx#L74)
  can show the latest completed purchase on a later direct visit, so this
  event can repeat without a new payment.
- The [credit upgrade branch](../../../apps/api/src/routes/payments.ts#L266)
  emits a zero-dollar server event with an `auto_grant_` identifier.

Separate these paths before calculating cash purchases. Inspect actual
`sessionId` coverage, SDK markers, missing IDs, `cs_test_` IDs and auto grants.
Deduplicate valid cash checkout sessions and reconcile them with payment
records. The handler accepts test-session IDs and the event contract carries
no `livemode` field. An absent checkout ID cannot establish an authoritative
server settlement.

[Checkout creation](../../../apps/api/src/routes/payments.ts#L335) specifies
USD, but the analytics event carries no currency. The
[refund capture](../../../apps/api/src/routes/payments.ts#L1008) records
`paymentIntentId` and `isFullRefund`. It carries neither a refund amount nor
the original checkout ID. These event properties alone cannot establish net
revenue or a complete refund-to-checkout join.

The server resolves [guest purchase identity](../../../apps/api/src/routes/payments.ts#L526)
to an account ID. The browser identifies an account only with consent.
Purchase attribution therefore needs demonstrated identity linkage. Report
unmatched purchases separately from consented acquisition cohorts, following
the [reporting contract](../../analytics-verification.md#seo-and-geo-cohort-definitions-2026-11-10).
