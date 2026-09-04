# Privacy & GDPR Compliance

Tensorcraft serves users globally, including the EU/EEA/UK, so we treat
GDPR as the baseline and comply with stricter regional rules (e.g., UK
GDPR, Swiss DPA) where they apply. This document lists the third-party
processors we use, the data residency choices we made, and the Data
Processing Agreements (DPAs) required before production launch.

## Third-party processors (data sub-processors)

| Processor | Purpose | Data residency | DPA required |
|-----------|---------|----------------|--------------|
| Supabase | Auth + Postgres database | EU (region of user's choosing; production uses EU-West) | Yes - standard Supabase DPA |
| Stripe | Payments | US (SCCs in place) | Yes - standard Stripe DPA |
| Vercel | Web hosting | Global edge | Yes - standard Vercel DPA |
| Fly.io | API hosting | EU region (`fra`) | Yes - standard Fly.io DPA |
| Upstash Redis | Rate limiting + JWT cache | EU region | Yes - standard Upstash DPA |
| Resend | Transactional email | US (SCCs in place) | Yes - standard Resend DPA |
| Kit (ConvertKit) | Marketing email | US (SCCs in place) | Yes - standard Kit DPA |
| **PostHog** | Product analytics | **EU (`eu.posthog.com`)** | **Yes - standard PostHog DPA** |
| **Sentry** | Error tracking | EU (DSN pointed at EU region project) | **Yes - standard Sentry DPA** |

## Monitoring & analytics choices (Phase 6 §6g)

### PostHog - EU instance

We use PostHog on the EU cloud (`https://eu.posthog.com`) so product
analytics data stays in the EU. The host is configured via
`NEXT_PUBLIC_POSTHOG_HOST` and defaults to the EU endpoint in
`apps/web/lib/posthog.ts`. **Do not override this to a US host in
production** - doing so would require renegotiating transfer
safeguards (SCCs + transfer impact assessment).

Server-side conversion events (Stripe webhook `purchase_completed`,
etc.) are sent via `posthog-node` from the API, also to the EU
endpoint (`POSTHOG_HOST`).

Consent gating: PostHog only initializes after the user accepts
analytics cookies (see `app/components/cookie-consent.tsx` + the
`tc-cookie-consent` localStorage key consumed in `posthog-provider.tsx`).
Without consent, no events are captured.

Vercel Web Analytics and Vercel Speed Insights sit behind the same
gate (`consent-gated-vercel-analytics.tsx` and
`consent-gated-speed-insights.tsx`): each renders nothing before
consent and drops queued events via `beforeSend` if consent is
withdrawn while the script is already loaded.

### Sentry - EU project

Separate Sentry projects are used for the web and API apps. Each DSN
is scoped to an EU-region Sentry project so error payloads never
cross the Atlantic.

Configuration:

- Web client, server, and edge runtimes: `NEXT_PUBLIC_SENTRY_DSN`
  (configured in `sentry.{client,server,edge}.config.ts`).
- API: `SENTRY_DSN` (configured in `apps/api/src/lib/sentry.ts`,
  initialized at the top of `apps/api/src/index.ts`).

Sample rates (cost control):

- `tracesSampleRate: 0.1` - 10% of requests get performance traces.
- `replaysSessionSampleRate: 0` - no session replays during normal
  traffic.
- `replaysOnErrorSampleRate: 1.0` - full replay on errors only.

### PII scrubbing (pseudonymization)

Every Sentry event runs through a `beforeSend` hook that strips the
following fields before the event leaves the runtime:

- `event.user.email`
- `event.user.username`
- `event.user.id`
- `event.user.ip_address`
- `event.request.headers.cookie`
- `event.request.headers.authorization`
- `event.extra.email`, `event.extra.user_id` (server)

This keeps error reports pseudonymous: we can still correlate via the
`requestId` tag (a random per-request UUID) and the `route` tag
without identifying the user.

## DPA execution checklist (pre-launch, user action)

Before the first production deploy:

- [ ] Sign PostHog DPA (available in PostHog dashboard → Settings →
      Data processing).
- [ ] Sign Sentry DPA (Sentry Organization → Legal & Compliance →
      Data Processing Agreement).
- [ ] File executed DPAs in the Legal folder.
- [ ] Add PostHog + Sentry to the privacy policy "Sub-processors"
      section with the EU residency note above.
- [ ] Verify the Sentry project region is set to EU at project
      creation - it cannot be changed afterwards.
- [ ] Verify the PostHog project host is `https://eu.posthog.com` in
      all deployed environments (not `us.i.posthog.com`).

## Data subject rights

Covered by the existing Supabase `profiles` + `purchases` schema:

- **Right to access / portability** - user requests export via
  `/api/profiles/export` (planned §6h).
- **Right to erasure** - `/api/profiles/delete` (planned §6h).
- **Right to rectification** - `/settings` profile editor.

Analytics data in PostHog is keyed by the user's Supabase UUID. When a
user requests deletion, we also purge their PostHog events via the
PostHog delete-person API (operational runbook TBD).

## Guest checkout: NOT ACTIVE (disabled 2026-07-21)

`POST /api/payments/guest-checkout` exists on the API but **nothing routes to
it**; `checkout-button.tsx` sends signed-out buyers through `/auth` as before.
It was disabled the same day it was written, after an adversarial review found
three defects that only surface post-charge. **No user data has been processed
through this path.**

This section is retained because the design must clear the corrections below
before it is re-enabled.

**Corrections to the original justification (it was wrong):**

- ~~"The address is verified by the payment itself."~~ **False.** Stripe
  Checkout verifies the *card*, not the email - the address is a free-text
  field the payer types. Any re-enabled design must therefore NOT set
  `email_confirm: true` on the strength of payment alone, and must not treat
  a payer-supplied address as proven. As written it would also have let a
  payer cause Tensorcraft to send a sign-in link to an address they do not
  control.
- ~~"Existing accounts are attached to, never duplicated."~~ **Not
  guaranteed.** The lookup is `profiles.email`, which has no unique
  constraint, no index, and no `lower()` normalization anywhere in the schema
  (`001_initial_schema.sql:13`, `022_backfill_profiles.sql:17`). Duplicate or
  mixed-case rows produce a failed lookup, not an attach.

**Requirements before re-enabling:**

1. Email must be verified independently of payment, or the account must be
   created unconfirmed.
2. `profiles.email` needs a unique index on `lower(email)` before it can be
   used as an identity key.
3. Lawful basis (performance of a contract) is sound in principle; the factual
   claims supporting it were not. Re-state them accurately.
