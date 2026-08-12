# Theme → World rename (2026-08-12)

The product concept formerly called a **theme** (the 5 purchasable story courses:
Deep Orbit, Neon Protocol, Signal Ward, Nova Canvas, Terra Grid) is renamed to
**world** everywhere: UI copy, routes, code identifiers, content frontmatter,
database schema, docs. Tensorcraft teaches browser ML to JS engineers via 5
different "Worlds".

## What renames

- All `theme`/`Theme`/`THEME` identifiers, strings, and prose that mean the
  product concept, case-preserved (`themeId` → `worldId`, `THEME_SHAPE` →
  `WORLD_SHAPE`, `theme_progress` → `world_progress`, …).
- Files/dirs named after it: `packages/themes` → `packages/worlds`
  (`@tensorcraft/themes` → `@tensorcraft/worlds`), `apps/web/app/themes/` →
  `worlds/` (public route `/themes/...` → `/worlds/...`), `e2e/themes.spec.ts`,
  `docs/theme-launch-checklist.md`, component files, visual snapshot names.
- Client state keys: localStorage `tc-active-theme` → `tc-active-world`,
  cookie `tc_theme` → `tc_world`, `data-theme` attribute → `data-world`,
  OG query param `theme` → `world`. Pre-launch, no live users to migrate.
- API error codes (`theme_not_purchased` → `world_not_purchased`) and RPC
  argument names (`p_theme_id` → `p_world_id`).
- Database: new migration `058_rename_theme_to_world` renames tables, columns,
  view, indexes, constraints, triggers, and recreates the functions whose
  bodies/parameters reference the old names (param renames require
  drop+recreate; 039's security-definer grants re-applied). `.down.sql`
  mirrors it. **Operator must apply 058 before the next deploy or local run
  against prod data** — same workflow as 037-057.

## What deliberately keeps "theme"

1. **Light/dark mode** — already named "scheme" (`data-scheme`, `setScheme`,
   `prefers-color-scheme`); no overlap, nothing to do.
2. **Shiki syntax-highlighting theme** (`packages/ui/src/mdx/tensorcraft-theme*.ts`,
   `code-block.tsx`): "theme" is the correct upstream term (a VS Code/Shiki
   color theme) and `ThemeRegistration` / option keys are external API.
3. **CSS-theming FE-bridge lessons** where the analogy *is* CSS themes
   (style-transfer, VAE, fine-tuning, disentanglement lessons): prose and
   `feCode` keep "CSS theme"; only their frontmatter/product references rename.
4. **Historical records**: `supabase/migrations/001-057` (immutable, applied to
   prod), `docs/audits/**`, `docs/superpowers/**` dated ledgers/plans/specs.
   They describe past states; rewriting them would falsify the record.

## Compatibility

- `next.config.ts` gains permanent redirects `/themes` → `/worlds` and
  `/themes/:path*` → `/worlds/:path*` (audit blog posts and any shared links
  keep working).
- `packages/supabase/src/types.ts` is hand-renamed to match 058; regenerate
  from the live DB after 058 is applied to confirm parity.
- Analytics/PostHog event property names change with the sweep; pre-launch,
  no dashboard continuity to preserve.
- Visual-regression baselines: pixel content changed wherever visible copy
  said "theme", so RUN_VISUAL baselines were regenerated and verified (28/28) on 2026-08-12.
