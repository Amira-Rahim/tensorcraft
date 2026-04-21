# Email Setup — Deliverability, Auth, Bounce Monitoring

> **Scope.** Wiring `tensorcraft.app` so transactional + lifecycle emails sent
> through Kit land in the inbox, plus the bounce-handling feedback loop that
> keeps our sender reputation healthy. Templates and content live in
> `email-templates.md`.

## 1. DNS — SPF / DKIM / DMARC

Kit sends from a subdomain we delegate to them (`mail.tensorcraft.app` by
default, or the apex if you skip subdomain isolation — we use the subdomain so
a compromise of our marketing ESP can't impersonate `@tensorcraft.app`
login / receipt email).

### 1a. SPF

Add exactly one SPF TXT record at the sending subdomain. **Do not** append Kit
to an existing SPF record on the apex if you send from multiple providers —
SPF flattening / the 10-lookup limit hits fast.

```
Name:  mail.tensorcraft.app
Type:  TXT
TTL:   3600
Value: "v=spf1 include:_spf.convertkit.com ~all"
```

`~all` (softfail) not `-all` (hardfail) while we ramp volume — prevents
false-positive rejections during the first 30 days. Flip to `-all` once we pass
1,000 sends/day without complaints.

### 1b. DKIM

Kit generates the public key in its dashboard (Settings → Sending →
Authenticate Domain). Add the two CNAMEs it gives you:

```
Name:  k1._domainkey.mail.tensorcraft.app   → k1.domainkey.<kit>.ck.is
Name:  k2._domainkey.mail.tensorcraft.app   → k2.domainkey.<kit>.ck.is
```

DKIM **must** verify in the Kit dashboard before first send. Unauthenticated
email from a new domain goes straight to spam at Gmail + Outlook.

### 1c. DMARC

Put the DMARC record at the **apex**, not the subdomain — DMARC inherits.

```
Name:  _dmarc.tensorcraft.app
Type:  TXT
TTL:   3600
Value: "v=DMARC1; p=none; rua=mailto:dmarc@tensorcraft.app; fo=1; adkim=r; aspf=r"
```

- `p=none` during ramp — Kit reports alignment pass/fail but mailboxes don't
  reject yet.
- After 30 days of clean `rua` reports (no mis-aligned senders), tighten to
  `p=quarantine`. Only go `p=reject` once you've verified every outbound
  sender (Kit, Resend for issues, Supabase magic links) aligns.
- `rua` mailbox must exist. Route it into a group alias, not a personal inbox
  — DMARC aggregate reports come daily from every major provider.

### 1d. Verification checklist

Before first send, from a terminal:

```
dig +short TXT mail.tensorcraft.app                  # SPF present
dig +short CNAME k1._domainkey.mail.tensorcraft.app  # DKIM #1
dig +short CNAME k2._domainkey.mail.tensorcraft.app  # DKIM #2
dig +short TXT _dmarc.tensorcraft.app                # DMARC present
```

Then send one test email to `check-auth@verifier.port25.com` and inspect the
auto-reply — SPF, DKIM, and DMARC must all say `pass`.

## 2. Kit Dashboard Configuration

1. **Sending address**: `no-reply@mail.tensorcraft.app` for lifecycle; a
   monitored address (e.g. `hello@tensorcraft.app`) only for emails that
   genuinely expect replies.
2. **Tags** (create exactly these, then copy their numeric IDs into Fly.io
   secrets):

   | Kit tag name | Env var in `apps/api` |
   |--------------|------------------------|
   | `signed_up` | `KIT_TAG_SIGNED_UP` |
   | `onboarded` | `KIT_TAG_ONBOARDED` |
   | `first_lesson` | `KIT_TAG_FIRST_LESSON` |
   | `capstone` | `KIT_TAG_CAPSTONE` |
   | `purchased` | `KIT_TAG_PURCHASED` |
   | `email_alerts` | `KIT_TAG_EMAIL_ALERTS` |
   | `weekly_digest` | `KIT_TAG_WEEKLY_DIGEST` |

3. **Sequences**: one Kit "Sequence" per tag, triggered on tag-added. Kit's
   dashboard owns the schedule + email bodies (see
   [email-templates.md](./email-templates.md)).

## 3. Bounce / Complaint Webhook

Kit → **Automations** → **+ New** → trigger *Subscriber bounces* (and again
for *Subscriber complains*) → action *Webhook*:

- URL: `https://api.tensorcraft.app/api/webhooks/kit-bounce`
- Headers: `x-kit-webhook-secret: <same value as KIT_WEBHOOK_SECRET Fly.io
  secret>`
- Method: `POST`, Content-Type: `application/json`.

### Server-side contract

`apps/api/src/routes/webhooks.ts` handles `POST /api/webhooks/kit-bounce`:

- **Auth**: `x-kit-webhook-secret` compared to `KIT_WEBHOOK_SECRET` via
  `timingSafeEqual`. Mismatch → `401`. Env unset → `503`
  (fail-closed so we don't accept poison events during a misconfigured
  deploy).
- **Rate limiting**: excluded in `index.ts` alongside the Stripe webhook —
  Kit retries on non-2xx and we do not want to drop a retry because of our
  sliding-window cap.
- **Action**: logs the bounce via Pino (structured `logger.warn` with
  `route: "webhooks.kit-bounce"` + `event` + `email` + `reason`). Fly log
  aggregation + Sentry breadcrumbs capture it.
- **Deferred**: marking `profiles.email_invalid = true` requires a new
  migration + re-validation UX; tracked in `dev-plan.md` §4e.

## 4. Monitoring Cadence

- **Weekly**: Kit dashboard → Deliverability. Watch bounce rate (> 2% = stop
  sending + investigate) and complaint rate (> 0.1% = Gmail will throttle).
- **Daily**: DMARC aggregate reports via `dmarc@tensorcraft.app`. An unknown
  source in `rua` means someone is spoofing us — rotate DKIM immediately and
  tighten DMARC to `p=reject`.
- **Per-deploy**: send a smoke email to a seed list of 3 addresses covering
  Gmail + Outlook + iCloud after any change to Kit templates or DNS.

## 5. Related Env Vars

See [deployment-guide.md](./deployment-guide.md#kit-convertkit-email) for the
canonical list. New vars introduced by §4e:

| Variable | Required | Description |
|----------|----------|-------------|
| `KIT_TAG_EMAIL_ALERTS` | No | Tag ID for the lesson-complete notification sequence |
| `KIT_TAG_WEEKLY_DIGEST` | No | Tag ID for the Sunday progress digest sequence |
| `KIT_WEBHOOK_SECRET` | No | Shared secret for `/api/webhooks/kit-bounce` — required for bounce monitoring to be trustworthy |

## 6. Deferred

- Automated re-validation UX for bounced addresses (migration +
  `/settings` banner).
- Provider-level feedback loops (FBL) beyond Kit's webhook — e.g. Gmail
  Postmaster Tools enrolment. Worth doing post-V1 once volume > 5k/day.
- Per-theme palette in email templates (currently forced-monochrome for
  deliverability; see `email-templates.md`).
