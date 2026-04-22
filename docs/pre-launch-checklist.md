# Tensorcraft V0.5 — Pre-Launch Checklist

> **Last updated: 2026-04-21**
> **Audience: solo dev preparing to flip V0.5 live before executing marketing plan.**

This is the definitive gate-list. Work it top to bottom. When every **BLOCKING** item is ✓, you are cleared to execute [`marketing-plan.md`](./marketing-plan.md).

---

## State at a glance

| Area | Status |
|---|---|
| Engineering code | ✅ complete (Phase 11 §11a–§11g, §6a–§6k, §8j–§8l) |
| Content validator | ✅ 295/295 exercises pass, 0 allowlisted |
| Tests | ✅ unit + integration + e2e + mobile + visual regression green |
| DB migrations (local SQL files) | ✅ 001–020 exist; 007/009–017 applied; **018/019/020 pending** |
| Copy + legal | ✅ cleaned; 1 small paywall fix pending (§B8 below) |
| External services | ⚠ setup pending — Sentry / PostHog / Plausible / Kit / Stripe live mode |
| Launch comms | ⚠ discretionary — depends on strategy |
| Discord + Twitter | 📌 deferred to V1 per 2026-04-20 decision |

Total time for a solo dev to clear the blocking set: **~3–6 hours** (mostly external dashboard clicks + one live-money Stripe test).

---

## A. BLOCKING — must complete before any production traffic

### A1. Commit the working tree

Current tree: ~80 uncommitted files from 3 sessions of engineering + content work. Suggested split:

```bash
# Commit 1 — content cleanup (exercises + schema + copy)
git add packages/content/ packages/shared/src/bridges.ts \
        packages/supabase/seed.ts scripts/validate-exercises.mjs \
        scripts/validate-exercises.allowlist.json \
        apps/web/app/components/auth-form.tsx \
        apps/web/app/dashboard/dashboard-view.tsx \
        apps/web/app/onboarding/page.tsx \
        apps/web/app/paywall/ apps/web/app/pricing/ \
        apps/web/app/terms/page.tsx

# Commit 2 — backend + schema additions
git add apps/api/src/routes/onboarding.ts apps/api/src/routes/__tests__/ \
        apps/api/src/lib/ apps/api/.env.example \
        packages/supabase/src/types.ts \
        packages/supabase/migrations/020_issues_table.sql

# Commit 3 — Phase 11 viz + a11y + effects + Quiz
git add packages/ui/src/ packages/ui/package.json

# Commit 4 — tests + baselines + CI
git add .github/ .husky/pre-push .lychee.toml scripts/validate-exercises.mjs \
        playwright.config.ts e2e/ \
        apps/web/test-types.d.ts apps/web/app/components/__snapshots__/

# Commit 5 — docs + memory index
git add docs/ README.md CLAUDE.md
```

Not prescriptive — just coherent groups. Squash if you prefer.

### A2. Apply pending Supabase migrations

Three migrations exist as SQL but haven't been run against production DB:

| Migration | Adds | Why needed |
|---|---|---|
| `018_onboarding_fields.sql` | `profiles.experience_level`, `profiles.learning_goal` (enum CHECKs) | `PATCH /api/onboarding` fails without these |
| `019_certificates.sql` | `certificates` table + `get_shared_certificate` RPC | `POST /api/certificates` + `/c/<id>` share pages fail |
| `020_issues_table.sql` (NEW — created 2026-04-21) | `issues` table | `POST /api/issues` (ReportIssueButton widget) fails at runtime today |

Paste each into [Supabase SQL editor](https://supabase.com/dashboard/project/tlhewfwvrnafekvnsqjb/sql/new) in order. Verify with the combined check query in [`docs/ci-cd.md`](./ci-cd.md) or:

```sql
select count(*)::int as tables from information_schema.tables
where table_schema='public' and table_name in (
  'profiles','purchases','theme_progress','waitlist','streaks',
  'achievements','exercise_attempts','skill_genome','skill_events',
  'certificates','issues'
);
-- Expect: 11 (was 10; 020 adds `issues`)
```

### A3. Fly.io API secrets — production

`fly secrets set -a tensorcraft-api` every var below. Verify with `fly secrets list -a tensorcraft-api`.

**Auth + DB:**
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

**Stripe (live mode — not test):**
- `STRIPE_SECRET_KEY` (`sk_live_...`)
- `STRIPE_WEBHOOK_SECRET` (from live-mode webhook endpoint)
- (No `STRIPE_PRICE_*` vars — checkout uses inline `price_data` with amounts from `packages/shared/src/constants.ts` `PRICING`. If we migrate to Stripe-hosted Products/Prices later, add them here.)

**Monitoring:**
- `SENTRY_DSN` (API project)
- `POSTHOG_KEY` + `POSTHOG_HOST=https://eu.posthog.com` (required — EU residency)

**Email (Kit):**
- `KIT_API_KEY`
- `KIT_WEBHOOK_SECRET`
- `KIT_TAG_SIGNED_UP`, `KIT_TAG_ONBOARDED`, `KIT_TAG_FIRST_LESSON`, `KIT_TAG_CAPSTONE`, `KIT_TAG_PURCHASED`, `KIT_TAG_EMAIL_ALERTS`, `KIT_TAG_WEEKLY_DIGEST`

**GitHub integration:**
- `GITHUB_APP_ID`
- `GITHUB_PRIVATE_KEY` (PEM contents)
- `GITHUB_CLIENT_ID`
- `GITHUB_CLIENT_SECRET`
- `GITHUB_CALLBACK_URL` (e.g., `https://api.tensorcraft.app/api/github/callback`)

**Other:**
- `CERT_SIGNING_SECRET` (rotate periodically)
- `CORS_ALLOWED_ORIGINS=https://tensorcraft.app`
- `SUPPORT_EMAIL` (for issue notifications)

### A4. Vercel web env vars — production

In Vercel dashboard → project → Settings → Environment Variables → Production scope:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SENTRY_DSN` (web project)
- `NEXT_PUBLIC_POSTHOG_KEY`
- `NEXT_PUBLIC_POSTHOG_HOST=https://eu.posthog.com`
- `NEXT_PUBLIC_PLAUSIBLE_DOMAIN=tensorcraft.app`
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (`pk_live_...`)
- `NEXT_PUBLIC_API_URL=https://api.tensorcraft.app`

Redeploy after setting. Verify Sentry captures a test error via `throw new Error("launch smoke")` in a dev page.

### A5. Create external accounts + projects

Five services need projects created + DSN/keys captured:

1. **Sentry** (2 projects: `tensorcraft-web` + `tensorcraft-api`). Copy DSNs to §A3/§A4.
2. **PostHog EU** (`eu.posthog.com`) — one project. Copy key.
3. **Plausible** — register `tensorcraft.app` domain. €9/mo.
4. **Kit (ConvertKit)** — follow [`docs/email-templates.md`](./email-templates.md):
   - Create 7 Tags (names in §A3 above)
   - Build 3 Sequences (welcome / purchase confirmation / capstone achievement)
   - Configure bounce/complaint Automation → webhook to `https://api.tensorcraft.app/api/webhooks/kit-bounce` with `KIT_WEBHOOK_SECRET` header
5. **Stripe** — flip to live mode. (No Products/Prices needed in the dashboard — checkout uses inline `price_data` with amounts from `packages/shared/src/constants.ts` `PRICING`: $79/$129/$169/$219. Stripe still records each charge as a line item for receipts + refunds.) Configure webhook endpoint pointing at `https://api.tensorcraft.app/api/payments/webhook` with event filter: `checkout.session.completed`, `charge.refunded`, `checkout.session.async_payment_failed`.

### A6. Real-money Stripe smoke test

After §A2–§A5 complete:

1. Use a personal card to buy the $79 Single Theme tier on production.
2. Verify: redirect to `/dashboard/purchase-success?session_id=...` renders correct receipt.
3. Query DB: new row in `purchases` with `status='completed'` + `theme_ids: ['<chosen-theme>']`.
4. Check PostHog dashboard: `payment_completed` event fired with user_id.
5. Check Kit: subscriber tagged with `purchased`.
6. Check email inbox: purchase-confirmation email arrives with unsubscribe link + receipt.
7. Refund the charge via Stripe dashboard.
8. Verify: `purchases.status='refunded'` in DB within 30s (webhook fire).
9. Load paid module → paywall reappears (access revoked).

If any step fails, **stop and fix before inviting any user**.

### A7. Cookie consent verification

Load incognito → verify:
- Cookie banner shows before any analytics fires
- Decline → PostHog + Plausible network tab shows zero requests
- Accept → analytics initializes, pageview event captured

### A8. Fix paywall "Discord community access" copy

`apps/web/app/paywall/page.tsx:46` lists "Discord community access" as a paid feature. Discord is deferred to V1 per 2026-04-20 decision. Before launch, either:

- Remove the line entirely from paid features list.
- Replace with `"Email priority support"` or similar that ships at V0.5.

Corresponding paywall test asserts the exact string — update both in one edit. ~5 min fix.

---

## B. STRONG RECOMMEND — complete unless accepting specific risk

### B1. Lighthouse CI gate

`./node_modules/.bin/lhci autorun` (if wired) or run Lighthouse manually on `tensorcraft.app/` + `/pricing` + `/themes`. Confirm:

- Performance ≥ 90
- Accessibility ≥ 95
- Best Practices ≥ 90
- SEO ≥ 90

If any score drops below threshold, investigate before inviting traffic.

### B2. Cross-browser + device smoke

Per [`docs/browser-support.md`](./browser-support.md):

- Chrome 128+ (latest 2)
- Firefox 127+
- Safari 17+
- Edge 128+

Run `./node_modules/.bin/playwright test --project=mobile-iphone-se --project=mobile-pixel-7 --project=tablet-ipad` locally — expect 20/21 pass + 1 skip (iPad doesn't render mobile nav, intentional).

### B3. GitHub integration end-to-end

- Sign in with GitHub OAuth
- Enable GitHub connect in Settings
- Complete a lesson → verify `tensorcraft-deep-orbit` repo auto-created on your GitHub
- Verify commit contains lesson artifact + README
- Revoke access from GitHub's "Installed Apps" page
- Return to Tensorcraft → trigger another commit → verify graceful error message (`github_repo_access_revoked`)

### B4. Email flows — staging send

With Kit automations live (§A5):

- Sign up new test user → verify welcome email delivered within 60s, has working unsubscribe link, has plain-text alternative (`View this email in a web browser` — toggle in Kit)
- Complete Module 1 Lesson 1 → verify `first_lesson` automation fires
- Purchase a theme → verify purchase-confirmation email
- Reach capstone → verify capstone-achievement email with certificate share link

Failure modes to verify don't occur:
- Double-send (tag fires twice on retry)
- Wrong person tagged (off-by-one in email field)
- Broken certificate link (404 on share page)

### B5. Sign DPAs

Legal compliance per `docs/privacy-compliance.md`:

- Sentry — self-serve DPA in org settings
- PostHog — self-serve DPA
- Kit (ConvertKit) — request via support
- Supabase — in dashboard
- Vercel — in dashboard
- Fly.io — in dashboard
- Stripe — in dashboard
- Plausible — in dashboard

All support GDPR standard contractual clauses. File copies somewhere retrievable.

### B6. Privacy policy re-review

[`/privacy`](../apps/web/app/privacy/page.tsx) page currently dated 2026-03-10. Verify:

- Sentry mentioned in third-party processors (added Session 8b)
- PostHog EU residency noted
- Kit as email processor
- GitHub App permissions disclosed
- Bump `lastUpdated` to 2026-04-21 after review

### B7. Replace paywall testimonials

`apps/web/app/paywall/page.tsx` currently shows `"// SOCIAL PROOF PENDING — real beta quotes arrive post-launch"` placeholder. Before paywall actually converts traffic:

Option a: skip beta → remove the entire testimonial `<section>` before launch.
Option b: run informal beta with 5–10 FE devs for 1 week → collect 3 real quotes → paste into `apps/web/app/paywall/page.tsx`.

Option (a) ships faster. Option (b) improves conversion 10–30% per industry benchmarks — decide based on marketing strategy.

### B8. Run full test suite one more time

```bash
cd /Users/amira.salah/Desktop/tensorcraft
./node_modules/.bin/vitest run                               # unit + integration
./node_modules/.bin/playwright test --project=chromium       # e2e desktop
node scripts/validate-exercises.mjs                          # exercise validator
cd apps/web && ../../node_modules/.bin/next build            # production build
```

All should exit 0. Any new failures since last clean state → fix before launch.

---

## C. DISCRETIONARY — launch strategy calls

### C1. Beta program

Plan §F1 prescribes 50–100 FE devs for 4-week beta cycle. Solo dev alternative: skip beta, soft-launch direct to waitlist, adjust pricing if conversion <70% willingness at $79.

**Recommend skip formal beta** — solo dev, small batch size beta adds 4 weeks for marginal signal vs launching + monitoring live analytics.

### C2. Launch comms prep

Only if doing a formal launch event (Product Hunt, waitlist blast, guest posts):

- Blog post: `/blog/launching-tensorcraft` — but blog infra deferred per §6d. Skip, or quick MDX page at `/launched` as one-off.
- Guest post pitches: Smashing, CSS-Tricks, Dev.to — requires drafts.
- Product Hunt upcoming page — schedule 7 days before launch.
- 500 waitlist invite — email blast via Kit.

If strategy = "quiet ship, monitor, iterate" → all of C2 is optional.

### C3. Social proof infrastructure

Once real users sign up:

- Landing page — add user-count widget once ≥100 users.
- Swap paywall placeholder for real testimonials (§B7 option b).
- Post-Module-1 NPS prompt for early converters.

---

## D. EXPLICITLY DEFERRED — not launch gates

Per 2026-04-20/21 decisions + plan Part II:

- Discord server + Twitter/X @tensorcraft → V1.0
- Theme script expansion (4 themes outline-only) → post-launch writing cadence
- "AI-wrong moments" (2–3 per theme) → post-launch content sprint
- Account deletion flow (GDPR) → post-V0.5 (current workaround: Supabase dashboard `auth.admin.deleteUser` cascades all data per schema)
- Background job queue for GitHub retroactive-push → post-V0.5 scalability work
- Sandpack graceful-degradation fallback → UX polish
- Admin UI (dashboard access via Supabase UI only) → post-V0.5
- Session dedup across tabs → post-V0.5 analytics cleanup
- Blog infrastructure → Q2 2026 or later
- PPP discounts via ParityDeals → post-launch
- Payment plans (Klarna/Afterpay) → post-launch
- Product Hunt launch day → launch strategy call

Acceptable for V0.5 because: each has a workaround OR is pure polish.

---

## E. DB rollback & incident runbook

If migration 018/019/020 needs rollback:

```sql
-- 020 rollback
drop table if exists public.issues cascade;

-- 019 rollback
drop function if exists public.get_shared_certificate(text) cascade;
drop table if exists public.certificates cascade;

-- 018 rollback
alter table public.profiles drop column if exists experience_level;
alter table public.profiles drop column if exists learning_goal cascade;
```

If the Stripe webhook mis-fires bulk access grants: roll back via

```sql
update public.purchases set status='refunded' where created_at > '<incident-timestamp>';
```

Vercel rollback: dashboard → Deployments → prior green deploy → "Promote to Production".
Fly.io rollback: `fly releases -a tensorcraft-api` → note prior release → `fly deploy --image <prior-image>`.

---

## F. Final "ship it" checklist

Run these in order the day of launch:

- [ ] Every item in §A is ✓
- [ ] §B1 Lighthouse scores pass
- [ ] §B2 cross-browser smoke done
- [ ] §B3 GitHub e2e done
- [ ] §B4 email flow e2e done
- [ ] §B5 DPAs signed
- [ ] §B8 test suite green on `main`
- [ ] One-time real-money test charge refunded and DB state clean (no lingering test purchases)
- [ ] Monitoring: Sentry + PostHog dashboards open in a tab during first 48 hrs
- [ ] On-call for support email — check twice daily first week

When all ticked, execute [`marketing-plan.md`](./marketing-plan.md) Part 5 "Launch Sequence."

---

## G. Known gaps you are shipping with

These are explicitly accepted. Documented so future-you (or a contributor) doesn't confuse them for bugs:

1. **`pattern` field on lessons is always `'standard'`** — schema landed, tagging variants is post-launch authoring.
2. **Theme scripts for 4/5 themes are outline-only** — internal author docs, not user-facing. Expand as content scales.
3. **0 Quiz components rendered in lessons** — Quiz component exists + wired, but lessons don't invoke it yet. Add 1 per ~10 lessons over time.
4. **No account self-deletion** — users who want delete email support (uses Supabase dashboard admin delete, cascades correctly).
5. **162 exercises had solution bugs as of 2026-04-20; all fixed 2026-04-21** — if a learner reports an exercise failing, reproduce in Sandpack first (runtime ≠ validator environment).
6. **Solo dev = no branch protection on `main`** — intentional per [`docs/ci-cd.md`](./ci-cd.md). Pre-commit + pre-push hooks are the guardrail.

---

## Related documents

- [`dev-plan.md`](./dev-plan.md) — primary engineering roadmap, Session log
- [`ci-cd.md`](./ci-cd.md) — solo workflow, pre-push hook, branch-protection-off rationale
- [`deployment-guide.md`](./deployment-guide.md) — Vercel + Fly + Supabase env setup
- [`email-templates.md`](./email-templates.md) — Kit dashboard automation spec
- [`privacy-compliance.md`](./privacy-compliance.md) — GDPR + DPA checklist
- [`browser-support.md`](./browser-support.md) — device + browser matrix
- [`analytics-verification.md`](./analytics-verification.md) — 20-event taxonomy + verification protocol
- [`visual-regression.md`](./visual-regression.md) — Playwright baselines + Darwin caveat
- [`marketing-plan.md`](./marketing-plan.md) — execute AFTER this checklist clears

Last update: 2026-04-21.
