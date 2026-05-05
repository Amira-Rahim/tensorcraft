# Launch Scope (V1)

**Decided 2026-05-05.** Supersedes the prior "all 5 themes simultaneously"
plan recorded throughout `docs/prd.md`, `docs/architecture.md`, and
`docs/dev-plan.md`. Where those documents conflict with this one, this
document is the source of truth.

## What ships at V1

- **Deep Orbit only.** Time-Series & Signals theme: 11 modules, 55 lessons,
  1 capstone, ~65 exercises.
- All marketing surfaces (landing, `/themes`, `/learn`) render Deep Orbit as
  the live hero. The other 4 themes (Neon Protocol, Signal Ward, Nova
  Canvas, Terra Grid) appear as **muted "Coming soon" cards** that link to
  per-theme stub pages with email-capture waitlist forms.

## What is gated to "coming soon"

- **Lesson + capstone routes** for the 4 unlaunched themes return 404
  (`/themes/{slug}/{module}/{lesson}`, `/themes/{slug}/capstone`).
- **`/themes/{slug}` for unlaunched themes** renders a stub: theme tagline,
  hero art, character preview, JSON-LD `availability: PreOrder`, inline
  waitlist signup that writes to the `waitlist` table with `theme_id`.
- **Sitemap** lists Deep Orbit at priority 0.9 + lesson/capstone routes;
  unlaunched themes only appear at the `/themes/{slug}` stub level
  (priority 0.4). No module/lesson/capstone routes for them.
- **Stripe checkout + webhook** reject any `theme_ids` that aren't in
  `LAUNCHED_THEMES`. The pricing UI is owned by a parallel session — see
  "Out of scope" below.

## Source of truth in code

- **`packages/shared/src/constants.ts`** —
  - `LAUNCHED_THEMES = ["deep-orbit"] as const`
  - `COMING_SOON_THEMES` (derived)
  - `isLaunched(slug)`, `isComingSoon(slug)` helpers
- The `themes` registry in `packages/themes/src/index.ts` still exports
  all 5 manifests. Coming-soon stub pages use the manifest for palette,
  tagline, characters. Velite excludes coming-soon theme `.mdx` from the
  build, so `getThemeLessons("neon-protocol")` returns `[]`.

## What changed in this revert

| Area | Before | After |
|---|---|---|
| Landing five-worlds section | Equal 5-card grid, all LIVE | Hero Deep Orbit + 2x2 muted "Coming soon" grid |
| `/themes` catalog | Equal 5-card grid | Hero card + 2-col coming-soon grid |
| `/themes/{slug}` for unlaunched | Module map + paywall | Coming-soon stub w/ waitlist |
| `/themes/{slug}/{m}/{l}` for unlaunched | Lesson page (paywalled) | 404 |
| `/themes/{slug}/capstone` for unlaunched | Capstone page | 404 |
| Onboarding wizard | 5 steps incl. Theme picker | 4 steps; auto-route to Deep Orbit |
| Dashboard theme cards | 5 cards w/ owned/locked | Deep Orbit hero + 4 coming-soon cards w/ "Notify me" |
| Settings | Theme picker tab writing `preferred_theme_id` | Tab removed; column kept as tombstone |
| `/bridges` page | Public 50-bridge catalog | Deleted (bridges now embedded in lessons + marketing copy only) |
| Glossary related-lessons | Iterates all 5 themes | Iterates launched themes only |
| `/learn` page | Lists all 5 themes | Deep Orbit primary; 4 coming-soon listed for SEO |
| Sitemap | All theme/lesson/capstone routes | Launched-only for lesson/capstone; unlaunched only at `/themes/{slug}` |
| Layout JSON-LD | All 5 Course offers as InStock | Deep Orbit InStock; other 4 PreOrder |
| Backend payment validators | Accept any valid theme slug | Reject anything not in LAUNCHED_THEMES |
| Velite collections | All 5 theme dirs | `{deep-orbit,extras}` only |

## What is NOT in this revert (out of scope)

The following are owned by a parallel pricing session and were
intentionally **not touched** by the launch-scope revert:

- `apps/web/app/pricing/page.tsx`
- `apps/web/app/pricing/pricing-tiers.tsx`
- `PRICING` constant in `packages/shared/src/constants.ts`
- Stripe product / price catalog in the Stripe dashboard
- Supabase CHECK-constraint migration tightening `purchases.theme_ids`
  (skipped to avoid migration conflicts; the API layer enforces the same
  invariant via `validateThemeIds` → `isLaunched`)

Coordinate any cross-cutting work with the pricing session before touching
those files.

## Manual cleanup (outside the repo)

- **Kit (ConvertKit)**: disable email sequences tagged
  `capstone_neon-protocol`, `capstone_signal-ward`, `capstone_nova-canvas`,
  `capstone_terra-grid`. Confirm waitlist tags exist per theme so the
  stub-page form has somewhere to land subscribers.
- **PostHog / GTM**: archive any "all 5 themes" dashboards or rebuild them
  scoped to Deep Orbit.

## Reviving an unlaunched theme

When a coming-soon theme is ready to ship:

1. Add its slug to `LAUNCHED_THEMES` in `packages/shared/src/constants.ts`.
2. Add its dir to `LAUNCHED_THEME_DIRS` in
   `packages/content/velite.config.ts`.
3. Re-run `pnpm build:content` and `pnpm build` — sitemap, JSON-LD,
   onboarding flow, dashboard, and `/themes/{slug}` route all flip
   automatically.
4. Update marketing copy on `/themes/page.tsx`, `/learn/page.tsx`, and
   the landing-page stat.
5. Email the per-theme waitlist via Kit.
