# GT + narrative polish checklist (post-implementation, 2026-05-08)

Day 11–12 polish items deferred from each slice during in-session implementation because they require a running dev server, browser instance, or seeded auth fixtures. Run these before declaring the NOW cohort production-ready.

## Setup

```bash
pnpm dev                    # web on http://localhost:3000
pnpm test:e2e -- --headed   # Playwright headed mode for manual checks
```

Have a seeded test user with at least:
- Deep Orbit purchased (or use Module 1 free path)
- 5+ completed lessons spanning multiple modules
- 1 boss-beat choice on `deep-orbit-launch-deploy-call`
- 7+ day streak (for on-fire treatment regression)

> **Removed 2026-06-01:** the operator log (`/log`), counterfactual rewind UI (`/log/rewind`), review queue (`/review`), and lore library (`/library/lore`) were cut. Their checklist sections are gone; the counterfactual data layer (table + RPCs, migration 031) is retained but has no UI surface. DB objects for review (027/028) and lore (032) dropped via migration `033_drop_review_and_lore.sql`.

## /inbox (DISPATCH inbox — Slice #13)

- [ ] Lighthouse: Performance ≥ 90, Accessibility ≥ 95
- [ ] axe: zero violations
- [ ] Click message → marks as read in DB → unread badge decrements → reload preserves state
- [ ] Empty state: new user → "No intel yet" w/ CTA → `/worlds`
- [ ] Auth gate: signed-out → `/auth?redirectTo=/inbox`
- [ ] Open behavior: click row twice (open then close) — toggles in place, doesn't double-mark
- [ ] CTA buttons inside open message navigate correctly to `/worlds`, `/inbox`, etc.
- [ ] Real-time: when a milestone fires server-side (e.g. via `dispatch_milestone` RPC manually), reload reveals new unread message
- [ ] Mobile: list scrolls, expanded message body wraps, CTA button stays tappable

## DispatchTease (Slice #1)

- [ ] Visit `/worlds/deep-orbit/capstone/launch` → tease renders below KeyTakeaways
- [ ] CTA "Continue this thread in Neon Protocol →" navigates to `/worlds/neon-protocol`
- [ ] Reveal is unconditional (free-tier users completing Module 1 still see the tease — verify w/ a free-only test user)
- [ ] axe: tease has correct heading hierarchy + landmark (`<aside>`)
- [ ] Mobile: tease wraps cleanly, CTA button reachable

## BossBeat (Slice #6)

- [ ] Visit `/worlds/deep-orbit/capstone/launch` (after the BridgeCallout) → beat renders w/ 30s countdown
- [ ] Click each of 4 options → consequence beat renders inline → reload preserves choice w/ "Your call: X"
- [ ] Timeout: walk away 30s → auto-submits `random` stance w/ `reaction_ms ≈ 30000`
- [ ] Idempotency: try clicking twice fast → only one row inserted (server-side ON CONFLICT)
- [ ] axe: progressbar has `aria-valuenow` updating each second
- [ ] Mobile: 4-option grid collapses to 1-col below 640px, buttons tap-friendly
- [ ] Disabled state: while submitting, all 4 buttons show disabled cursor + opacity 50

## Cross-cutting

- [ ] Run `pnpm vitest run` from repo root → 772/772 pass
- [ ] Run `cd apps/web && npx tsc --noEmit -p tsconfig.json` → no new errors (filter pre-existing test-file errors)
- [ ] Run `pnpm turbo run build --filter=@tensorcraft/content --force` → Velite passes
- [ ] Apply migrations 029–031 + 033 to staging Supabase project (manual, w/ Studio or CLI) before E2E auth flows can run
- [ ] Verify RLS by attempting cross-user reads via a second seeded account: confirm zero rows leak across `dispatch_messages`, `boss_beat_choices`, `counterfactual_choices`

## Open follow-ups (not blockers)

- Cron for `weekly_intel` dispatch messages: pick Supabase pg_cron OR Vercel Scheduled Function; out of scope for the in-session implementation
- Email mirror for `dispatch_messages` via existing Resend config: deferred to email-marketing slice
- Per-world launch content (4 worlds × finale tease + boss beat + counterfactuals + cameos) — separate writing-only sprint, see `docs/post-launch-backlog.md` §5
