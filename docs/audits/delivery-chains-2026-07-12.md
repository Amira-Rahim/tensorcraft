# Delivery-Chain Audit (round 5): 2026-07-12

Follow-up to `content-trust-fixes-2026-07-12.md` and
`exercise-rigor-p1-2026-07-12.md`. Rationale: rounds 1-4 kept finding bugs in
UNAUDITED LAYERS between verified content and the learner (renderer, stripper,
CSP), so this round audited the last three never-audited layers: the
production build, the progress-persistence chain, and the purchase chain.

## Production build + prod-server e2e: CLEAN

`pnpm build` 10/10 tasks; `next start` serves the full CSP header; 38/38 e2e
green against the production server, including the exercise worker under
enforced CSP and live DeepScanDemo inference. First prod-mode verification of
the session.

## LAUNCH BLOCKER #3 (money path): the Buy button could not sell anything

`checkout-button.tsx` POSTed to a RELATIVE `/api/payments/checkout`, which
resolves to the Vercel web origin where no such route or rewrite exists; the
real endpoint lives on the separate API host (`api.tensorcraft.app`). Every
purchase attempt would 404 into a generic error toast: zero Stripe sessions,
zero revenue. The whole webhook/entitlement backend is well-built and tested
but was unreachable. Present since the file's first commit; invisible to CI
because no test exercised the button's network call. FIXED: routed through
`getApiUrl()` like every other API call, plus a regression test
(`__tests__/checkout-button.test.tsx`) asserting the checkout URL is absolute
to the API host.

Also fixed on the money path:
- **Partial-refund revocation bug**: code comments promised partial refunds
  preserve access, but every entitlement read filtered `status="completed"`
  only. All TEN purchase reads now accept `partially_refunded`: the gating
  reads (progress.ts hasThemePurchase, purchases.ts /access, payments.ts
  upgrade-credit + /purchases, checkout-button already-owned) and the display
  reads found via the test suite's unhandled-rejection sweep (pricing-tiers
  upgrade preview, settings purchase history, dashboard owned-themes, themes
  index lock badges, capstone owned check). Deliberately still
  completed-only: purchase-success (post-checkout display) and admin revenue
  metrics.
- **Amount validation implemented** (was a dead comment): webhook now logs
  loudly when `amount_total` mismatches plan price minus credit (fulfills
  anyway; the charge already happened).
- **Migration 035**: the `stripe_session_id` unique index was PARTIAL, which
  Postgres may refuse as an `ON CONFLICT` arbiter (42P10 → every webhook
  500s: charged, no access). Replaced with a full unique index (NULLs remain
  distinct). MUST BE APPLIED before launch.
- **Pre-launch checklist corrected**: Stripe event filter must include
  `checkout.session.async_payment_succeeded` and `charge.dispute.created`
  (handler processes five event types; the doc listed three).
- Success page no longer claims "You're In" before the purchase row exists
  ("Almost There" + refresh guidance during webhook lag); stray
  `STRIPE_WEBHOOK_SECRET` removed from the web .env.example; Stripe
  apiVersion pinning behavior documented at the constructor.

## Progress chain: 5 defects, worst fixed

- **Write/read lesson-id mismatch (fixed)**: completion writes used
  `slugify(title)` while every read keys the Velite frontmatter slug; the
  two differ for 11 of 56 lessons, so those could never display as
  completed (theme map, lesson drawer, dashboard module map, capstone
  bridges, mission rail) while count-based gates (module unlock, cert 56)
  still passed: self-contradicting dashboards. All writes now use
  `lesson.slug` (interface documents the invariant); localStorage step keys
  too (same value for the free-tier lesson, so e2e keys unchanged).
- **Multi-exercise lessons now require every exercise (fixed)**: the
  Challenge gate tracked a single boolean, so the three incident-paired
  lessons completed after 1 of 2 exercises. Now a per-slug passed set;
  gate requires `passedExercises.size >= exercises.length`.
- **Guest progress loss now disclosed (fixed)**: unauthenticated free-tier
  readers see a persistent notice ("Reading as a guest: your progress is
  not saved") with an auth CTA: previously writes silently no-opped.
- **Score chain wired (fixed)**: exercise passes now carry
  (slug, score) up to the completion write; `markLessonCompleted` persists
  the average, so theme/capstone score readouts stop rendering blanks.
- **Deferred, documented**: completion still attests an in-session pass
  (the attempt POST is best-effort and never re-verified server-side; the
  orphaned `LessonProgressTracker` remains dead code). Server-verified
  competence is a post-launch hardening item. Certificate remains a
  count-based gate (rename-resilience noted).

## Verification

vitest 1026 green (incl. new checkout regression test; API mocks taught
`.in()`); typecheck 9/9; grader 80/80 (+ starter invariant); prod build
10/10; e2e 38/38 vs prod server + 31/31 vs dev on all touched surfaces.

## Round 6: all-layers sweep (same day)

Design lesson from the round-5 undercount (found by the test runner, not the
audit): mechanical whole-repo sweeps of bug CLASSES beat agent judgment
traces. Executed: three class sweeps + a never-audited-surface hunt + a full
cumulative-diff review + the complete e2e suite.

**Mechanical class sweeps: clean.** Zero remaining relative `/api` fetches
(the checkout-killer class), zero remaining title-slugify call sites (the
progress-mismatch class); all 8 swallowed `.catch(() => {})` sites inventoried
and confirmed telemetry-tier (streak/genome RPCs, analytics beacons; the
completion-write error path remains the documented deferred item).

**SECURITY (HIGH, fixed): `dispatch_milestone` stored-phishing hole.** The
never-audited-surface hunt found migration 029's SECURITY DEFINER
`dispatch_milestone(p_user_id, ...)` had no auth.uid() guard AND no REVOKE:
Postgres default EXECUTE-to-PUBLIC meant PostgREST exposed it to anon +
authenticated, letting any client insert arbitrary "operator messages" with
attacker-controlled `cta_href` into ANY user's DISPATCH inbox (stored
phishing; javascript: href = XSS click vector). Proven reachable by the same
grant path the legitimate sibling RPCs use. FIXED: **migration 036** revokes
execute from public/anon/authenticated (service_role only) — MUST BE APPLIED
WITH 035; plus render-boundary defense: the inbox CTA now renders only
internal (`/`-prefixed) hrefs.

**Also found + fixed:** waitlist POST returned 500 on malformed JSON (now
400); e2e lesson-demo spec seeded the old title-derived localStorage key for
foundations/05 (`data-normalization` → `normalization`, a knock-on from the
progress-slug fix that the full-suite run caught).

**Authz sweep result:** every other apps/api route verified to derive
identity from the verified token; no cross-user access path found. Noted
launch decisions (not defects): progress/attempts are self-attested
(client-trust model → certificates attest completion, not proctored skill);
GitHub OAuth `GITHUB_CALLBACK_URL` must point at the API host in prod
(fails closed if not); anonymous issue-screenshot upload is rate-limited
but public.

**Full e2e suite: 80 passed / 19 skipped (auth-seeding gated) / 6
first-compile flakes that pass serially.** Vitest 1026 exit 0.

**PIPELINE GAP (found by cumulative-diff review, fixed): apps were never
typechecked.** `pnpm typecheck` fanned out via turbo to the 9 packages that
had a `typecheck` script — apps/web and apps/api had none, so no CI or local
gate ever ran `tsc --noEmit` over ~200 app source files (Next.js `build`
type-checks, but only when someone builds; vitest transpiles without
checking). Added `"typecheck": "tsc --noEmit"` to both apps. First-ever run
surfaced 1 real fixture bug (playback test missing required `lesson.slug`)
plus 9 latent type errors in 3 test files (untyped `vi.fn().mock.calls`
tuple indexing) — all fixed. Typecheck now 11/11 tasks.

**Residue closed:** CI now runs the grader with `--starters` (the
starter-must-fail invariant existed locally but CI omitted the flag);
`nextLessonTeaser` fully removed from the velite schema + content fixtures
(was orphaned after the renderer dropped it).

**Round-6 exit battery (all exit 0):** typecheck 11/11 · vitest 1026 ·
grader 80/80 `--starters` · runtime corpus 80/80 · lesson-demo +
exercise-run e2e.

## Operator actions required at launch

1. Apply `supabase/migrations/035_purchases_unique_session_full.sql` AND
   `036_lock_dispatch_milestone.sql`.
2. Configure the Stripe webhook with ALL FIVE event types (see checklist).
3. Set `NEXT_PUBLIC_API_URL` on Vercel (checkout now depends on it;
   `getApiUrl()` throws in production if unset, which is the safe failure).
