# Launch Scope (V1)

**Decided 2026-05-05.** Supersedes the prior "all 5 worlds simultaneously"
plan recorded throughout `docs/prd.md`, `docs/architecture.md`, and
[the earlier development plan](https://github.com/Amira-Rahim/tensorcraft/blob/8550adf771dbb40f1c7cef9af56990caf316bf61/docs/dev-plan.md). Where those documents conflict with this one, this
document is the source of truth.

## What ships at V1

- **Deep Orbit only.** Time-Series & Signals world: 11 modules, 56 lessons
  (incl. the 5-lesson capstone), 65 exercises.
- All marketing surfaces (landing, `/worlds`, `/learn`) render Deep Orbit as
  the live hero. The other 4 worlds (Neon Protocol, Signal Ward, Nova
  Canvas, Terra Grid) appear as **muted "Coming soon" cards** that link to
  per-world stub pages with email-capture waitlist forms.

## What is gated to "coming soon"

- **Lesson + capstone routes** for the 4 unlaunched worlds return 404
  (`/worlds/{slug}/{module}/{lesson}`, `/worlds/{slug}/capstone`).
- **`/worlds/{slug}` for unlaunched worlds** renders a stub: hero with the
  world's signature SceneCanvas scene running full-bleed behind the in-world
  status-board copy (org + status line in the eyebrow row; left scrim keeps
  the copy legible), and a status-board module roster whose row states carry the
  launch scope (module 1 "Online · Free", the rest "Pending", capstone
  "Finale") with curriculum counts in the header line; skills as a
  counted slash-separated line, careers as salary range bars on a shared
  per-world axis, cast as personnel dossier rows with CharacterAvatar
  initial blocks (spec:
  `docs/superpowers/specs/2026-07-19-coming-soon-info-sections-design.md`),
  JSON-LD `availability: PreOrder`, waitlist capture in hero + footer
  (sources `coming-soon-hero` / `coming-soon-footer`), and a
  `{World}: Coming Soon` page title (live worlds keep `Module Map`).
- **Sitemap** lists Deep Orbit at priority 0.9 + lesson/capstone routes;
  unlaunched worlds only appear at the `/worlds/{slug}` stub level
  (priority 0.4). No module/lesson/capstone routes for them.
- **Stripe checkout + webhook** reject any `world_ids` that aren't in
  `LAUNCHED_WORLDS`. The pricing UI is owned by a parallel session - see
  "Out of scope" below.

## Source of truth in code

- **`packages/shared/src/constants.ts`** -
  - `LAUNCHED_WORLDS = ["deep-orbit"] as const`
  - `COMING_SOON_WORLDS` (derived)
  - `isLaunched(slug)`, `isComingSoon(slug)` helpers
- The `worlds` registry in `packages/worlds/src/index.ts` still exports
  all 5 manifests. Coming-soon stub pages use the manifest for palette,
  tagline, characters. Velite excludes coming-soon world `.mdx` from the
  build, so `getWorldLessons("neon-protocol")` returns `[]`.

## What changed in this revert

| Area | Before | After |
|---|---|---|
| Landing five-worlds section | Equal 5-card grid, all LIVE | Hero Deep Orbit + 2x2 muted "Coming soon" grid |
| `/worlds` catalog | Equal 5-card grid | Hero card + 2-col coming-soon grid |
| `/worlds/{slug}` for unlaunched | Module map + paywall | Coming-soon stub w/ waitlist |
| `/worlds/{slug}/{m}/{l}` for unlaunched | Lesson page (paywalled) | 404 |
| `/worlds/{slug}/capstone` for unlaunched | Capstone page | 404 |
| Onboarding wizard | 5 steps incl. World picker | 4 steps; auto-route to Deep Orbit |
| Dashboard world cards | 5 cards w/ owned/locked | Deep Orbit hero + 4 coming-soon cards w/ "Notify me" |
| Settings | World picker tab writing `preferred_world_id` | Tab removed; column kept as tombstone |
| `/bridges` page | Public 50-bridge catalog | Deleted (bridges now embedded in lessons + marketing copy only) |
| Glossary related-lessons | Iterates all 5 worlds | Iterates launched worlds only |
| `/learn` page | Lists all 5 worlds | Deep Orbit primary; 4 coming-soon listed for SEO |
| Sitemap | All world/lesson/capstone routes | Launched-only for lesson/capstone; unlaunched only at `/worlds/{slug}` |
| Layout JSON-LD | All 5 Course offers as InStock | Deep Orbit InStock; other 4 PreOrder |
| Backend payment validators | Accept any valid world slug | Reject anything not in LAUNCHED_WORLDS |
| Velite collections | All 5 world dirs | `deep-orbit` only (was `{deep-orbit,extras}` until extras' removal 2026-08-15) |

## What is NOT in this revert (out of scope)

The following are owned by a parallel pricing session and were
intentionally **not touched** by the launch-scope revert:

- `apps/web/app/pricing/page.tsx`
- `apps/web/app/pricing/pricing-tiers.tsx`
- `PRICING` constant in `packages/shared/src/constants.ts`
- Stripe product / price catalog in the Stripe dashboard
- Supabase CHECK-constraint migration tightening `purchases.world_ids`
  (skipped to avoid migration conflicts; the API layer enforces the same
  invariant via `validateWorldIds` → `isLaunched`)

Coordinate any cross-cutting work with the pricing session before touching
those files.

## Manual cleanup (outside the repo)

- **Kit (ConvertKit)**: disable email sequences tagged
  `capstone_neon-protocol`, `capstone_signal-ward`, `capstone_nova-canvas`,
  `capstone_terra-grid`. Confirm waitlist tags exist per world so the
  stub-page form has somewhere to land subscribers.
- **PostHog / GTM**: archive any "all 5 worlds" dashboards or rebuild them
  scoped to Deep Orbit.

## Reviving an unlaunched world

First complete the content and runtime checks in
[the world launch checklist](world-launch-checklist.md). Then:

1. Add its slug to `LAUNCHED_WORLDS` in `packages/shared/src/constants.ts`.
2. Add its dir to `BUILT_WORLD_DIRS` in
   `packages/content/src/built-worlds.ts`.
3. Re-run `pnpm turbo build:content` and `pnpm build` - sitemap, JSON-LD,
   onboarding flow, dashboard, and `/worlds/{slug}` route all flip
   automatically.
4. Update marketing copy on `/worlds/page.tsx`, `/learn/page.tsx`, and
   the landing-page stat.
5. Email the per-world waitlist via Kit.
