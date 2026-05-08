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
- 3+ recall attempts with mixed success/explore signals
- 1 boss-beat choice on `deep-orbit-launch-deploy-call`
- 7+ day streak (for on-fire treatment regression)

## /log (operator log meta-screen — Slice #11)

- [ ] Lighthouse run: Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 90, SEO not applicable (noindex)
- [ ] axe via Playwright: zero violations on `/log` w/ seeded user
- [ ] Visual regression vs design system: theme palette per-section, `<LossCurve />` matches dashboard styling
- [ ] Empty state: new user signs in → `/log` shows "No telemetry yet" empty state w/ CTA → `/themes`
- [ ] Auth gate: signed-out → `/auth?redirectTo=/log` (already covered by `e2e/operator-log.spec.ts`)
- [ ] Mobile: timeline collapses cleanly at 360px, mentor blurbs wrap, stat grid switches to 2-col
- [ ] Strategy class transitions: cross-theme strategy class flips correctly when ratio crosses 0.10 / 0.20 thresholds
- [ ] Mentor blurb reads correctly per theme × class (15 combinations: 5 themes × 3 classes)

## /review (Slice C surface, regression)

- [ ] Confirm new ε-explore badge `aria-label` reads "Selected by the explore branch (probability ε equals 0.15)" via screen reader
- [ ] After clicking a card with `?explored=1`, recall attempt POST should include `was_explored: true` (verify in network panel)
- [ ] Recall attempt without `?explored=1` should record `was_explored: false`

## /inbox (DISPATCH inbox — Slice #13)

- [ ] Lighthouse: Performance ≥ 90, Accessibility ≥ 95
- [ ] axe: zero violations
- [ ] Click message → marks as read in DB → unread badge decrements → reload preserves state
- [ ] Empty state: new user → "No intel yet" w/ CTA → `/themes`
- [ ] Auth gate: signed-out → `/auth?redirectTo=/inbox`
- [ ] Open behavior: click row twice (open then close) — toggles in place, doesn't double-mark
- [ ] CTA buttons inside open message navigate correctly to `/log`, `/review`, etc.
- [ ] Real-time: when a milestone fires server-side (e.g. via `dispatch_milestone` RPC manually), reload reveals new unread message
- [ ] Mobile: list scrolls, expanded message body wraps, CTA button stays tappable

## DispatchTease (Slice #1)

- [ ] Visit `/themes/deep-orbit/capstone/launch` → tease renders below KeyTakeaways
- [ ] CTA "Continue this thread in Neon Protocol →" navigates to `/themes/neon-protocol`
- [ ] Reveal is unconditional (free-tier users completing Module 1 still see the tease — verify w/ a free-only test user)
- [ ] axe: tease has correct heading hierarchy + landmark (`<aside>`)
- [ ] Mobile: tease wraps cleanly, CTA button reachable

## BossBeat (Slice #6)

- [ ] Visit `/themes/deep-orbit/capstone/launch` (after the BridgeCallout) → beat renders w/ 30s countdown
- [ ] Click each of 4 options → consequence beat renders inline → reload preserves choice w/ "Your call: X"
- [ ] Timeout: walk away 30s → auto-submits `random` stance w/ `reaction_ms ≈ 30000`
- [ ] Idempotency: try clicking twice fast → only one row inserted (server-side ON CONFLICT)
- [ ] axe: progressbar has `aria-valuenow` updating each second
- [ ] Mobile: 4-option grid collapses to 1-col below 640px, buttons tap-friendly
- [ ] Disabled state: while submitting, all 4 buttons show disabled cursor + opacity 50

## /log/rewind (Counterfactual playthrough — Slice #3)

- [ ] Visit `/log/rewind?theme=deep-orbit` after completing the boss beat → 3 alternate timelines render (one per choice not picked)
- [ ] Click an alternate → `recordCounterfactual` fires → revealed view replaces candidate list
- [ ] Reload `/log/rewind?theme=deep-orbit` → revealed view persists (priorRewind hydrated)
- [ ] Try a second rewind on same theme → server returns false, view stays on first reveal
- [ ] No boss-beat choice yet → `candidates` empty → "No rewindable decisions yet" empty state
- [ ] Theme not launched in `searchParams` → redirect to `/log`
- [ ] Auth gate: signed-out → `/auth?redirectTo=/log/rewind`
- [ ] axe: button list has accessible labels, revealed `<article>` has heading

## /library/lore (Slice #19)

- [ ] Visit `/library/lore` → 15 collectible cards render; uncollected show "Encrypted" w/ opacity 0.45
- [ ] Complete a lesson w/ probability dice on your side → toast fires `tc:lore-drop` event → consumer can show notification (note: in-app toast surface for `tc:lore-drop` is a v2 polish item — the event is dispatched but no listener wires to the existing session-toast yet)
- [ ] Daily cap: complete 2 lessons in same day → second never triggers a drop (confirm via DB row count)
- [ ] Already-collected: drop attempt for already-owned artifact → DB unique constraint short-circuits (returns null)
- [ ] Mobile: card list scrolls, body text wraps cleanly
- [ ] axe: collected/uncollected state communicated via more than just opacity (data-collected attr — confirm SR reads "Encrypted" text)

## Cross-cutting

- [ ] Run `pnpm vitest run` from repo root → 772/772 pass
- [ ] Run `cd apps/web && npx tsc --noEmit -p tsconfig.json` → no new errors (filter pre-existing test-file errors)
- [ ] Run `pnpm turbo run build --filter=@tensorcraft/content --force` → Velite passes
- [ ] Apply migrations 028–032 to staging Supabase project (manual, w/ Studio or CLI) before E2E auth flows can run
- [ ] Verify RLS by attempting cross-user reads via a second seeded account: confirm zero rows leak across `dispatch_messages`, `boss_beat_choices`, `counterfactual_choices`, `lore_drops`

## Open follow-ups (not blockers)

- Toast listener for `tc:lore-drop` → wire into `apps/web/app/components/session-toast.tsx`-style surface so drops produce a visible notification (currently event-only)
- Cron for `weekly_intel` dispatch messages: pick Supabase pg_cron OR Vercel Scheduled Function; out of scope for the in-session implementation
- Email mirror for `dispatch_messages` via existing Resend config: deferred to email-marketing slice
- Per-theme launch content (4 themes × finale tease + boss beat + counterfactuals + cameos) — separate writing-only sprint, see `docs/v2-polish-backlog.md`
