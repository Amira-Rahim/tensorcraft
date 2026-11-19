# Light Mode Readiness Audit - 2026-07-22

Investigation only; no implementation. Scope: what it takes for the app to support a light
color scheme alongside dark, across all 5 narrative themes.

## Verdict

Feasible. The token architecture is in good shape (one CSS file defines every color), but
light mode is a **full second palette design project, not a neutrals flip**: every accent
color in the system fails WCAG AA on white, the canvas scene art is built on additive
light-on-dark rendering, and both code-highlighting themes are dark-only. It also reverses
a documented product decision.

## 1. Prior decisions (must be amended if we proceed)

- `docs/product-plan.md:1243` - "Dark mode only at launch. Light mode is not planned for
  V1.0–V5.0." Also listed under non-goals (`:1289`).
- `docs/ui-ux-notes.md:275` - "Tensorcraft is dark-mode only. There is no light mode. The
  dark aesthetic is a core brand element."
- `docs/architecture.md:59`, `docs/prd.md:364` - "Dark mode only."
- Not present on [v2-polish-backlog.md](https://github.com/Amira-Rahim/tensorcraft/blob/8550adf771dbb40f1c7cef9af56990caf316bf61/docs/v2-polish-backlog.md) or `docs/post-launch-backlog.md`.
- Episodic search: no recorded debate - dark-only was the founding aesthetic, never a
  contested decision. Standing user feedback (2026-07-19): ask before big recolors.

## 2. Current architecture (what we build on)

- **Single source of truth**: `packages/themes/src/css/themes.css` defines all `--tc-*`
  vars per narrative theme via `data-theme="<slug>"` on `<html>`; deep-orbit doubles as
  `:root` default. All 5 themes share identical dark neutrals (`#181818` bg, `#e0e0e0`
  text, …) and differ only in primary/accent/tier colors.
- **Tailwind v4** `@theme` block in `apps/web/app/globals.css` maps `--tc-*` →
  utilities (`bg-page`, `text-text-primary`, `border-border`, …). No `tailwind.config`.
- **Narrative-theme switching already exists**: `ThemeProvider`
  (`apps/web/app/components/theme-provider.tsx`, localStorage `tc-active-theme`,
  `useSyncExternalStore`), FOUC bootstrap script in `layout.tsx:109-113`, cookie
  `tc_theme` set by `middleware.ts` (consumed by favicon routes only).
- **Scheme axis does not exist**: `html { color-scheme: dark }` (`globals.css:65`); zero
  `prefers-color-scheme` in code; `next-themes` not installed; no `theme-color` meta; no
  web manifest. Light/dark would be a third dimension orthogonal to narrative theme
  (5 themes × 2 schemes = 10 palettes) that no current type models -
  `ThemePalette` (`packages/themes/src/types.ts`) is documented "No light mode."

## 3. Contrast: every accent fails on white (measured)

WCAG ratios vs `#ffffff` (AA text needs 4.5:1, large-text/UI 3:1):

| Color | Ratio | | Color | Ratio |
|---|---|---|---|---|
| deep-orbit `#6BAA8A` | 2.71 | | accent `#A89060` | 3.08 |
| neon `#3FC4DC` | 2.07 | | success `#10B981` | 2.54 |
| signal `#65C07D` | 2.24 | | warning `#F59E0B` | 2.15 |
| nova `#E08058` | 2.84 | | error `#EF4444` | 3.76 |
| terra `#C49535` | 2.73 | | tier-structural `#78A2BD` | 2.73 |
| dashboard "on fire" `#FF8A2A` | 2.35 | | axis-eval `#D07070` | 3.37 |

Consequence: light mode needs **5 new darkened primaries + accents + tier/axis/semantic
sets**, designed and axe-verified - the existing hues can seed them but cannot be reused
as-is anywhere text-sized. (Same class of problem as the 2026-07-19 coming-soon retune,
but across the whole system.)

## 4. Canvas / animated components (from full sweep)

- **Token-clean, zero work**: LossCurve, SkillGenome radar, DeepScanDemo, BridgeTicker,
  ParticleField (reads `--tc-primary` via `getComputedStyle` **per frame** - the model
  pattern for everything else).
- **Mechanical fixes**: `ticker.tsx` TickerCanvas (streak alpha 0.06–0.18 invisible on
  white; re-reads vars only on `data-theme` mutation - stale if scheme toggles via another
  attribute), `dashboard-view.tsx` (`rgba(255,255,255,0.02)` hover at :218, `#A0A0A0`
  at :252, `#FF8A2A` ×4), AmbientBackground (hardcoded 3-color `PALETTES`, ignores tokens
  and theme entirely).
- **Need art direction, not just retint**: `orbit-canvas.tsx` + all 4 scenes in
  `theme-scenes.ts` - 6 `globalCompositeOperation = "lighter"` sites (orbit-canvas:72;
  theme-scenes:74,215,336,437), white-alpha starfield, `rgba(0,0,0,0)`-fading nebula
  washes, white-lift highlight helpers. Additive rendering washes out or blows out on
  light backgrounds; starfield/night-skyline/EKG-glow metaphors are dark-native.
- **Structural**: every canvas gets color from the dark-only TS `ThemeManifest.palette`
  (`hexToRgb(palette.primary)` computed at module scope in `five-worlds-section.tsx`,
  `auth/page.tsx:34`, `coming-soon-scene.tsx`, `theme-scene-backdrop.tsx`), bypassing CSS
  vars. `--tc-primary-rgb` exists "for canvas usage" but only `ticker.tsx` uses it.

## 5. TS-palette leakage into DOM styling

`ThemeManifest.palette` also feeds inline styles in server/client components:
`lesson-steps.tsx` (~40 uses - the whole lesson UI), `lesson-drawer.tsx`,
`lesson-content.tsx`, lesson/capstone/themes/dashboard pages. These render dark palette
values regardless of any CSS scheme. Either migrate them to `var(--tc-*)` (preferred;
CSS cascade then handles scheme) or make the TS palette scheme-aware.

## 6. Hardcoded color census (runtime code, tests excluded)

130 hex occurrences in 20 files. Breakdown:

- **4 contained dark blobs (~81 of 130)**: Shiki theme `tensorcraft-theme.ts` (29),
  Sandpack inline theme in `exercise.tsx` (29), OG route (11), `globals.css` (12).
- **Fallback-only** (`var(--tc-x, #hex)` wrappers): dialogue, scene-heading,
  interactive-demo, lesson page, layout skip-link, bridge-ticker - harmless while vars
  exist; fallbacks are dark-assuming.
- **Genuine offenders**: `global-error.tsx` (`#E0E0E0`/`#A0A0A0` unwrapped text colors),
  `concept.tsx` ×2 copies (tier hexes duplicating `--tc-tier-*`), `coming-soon-stub.tsx`
  (brand-green literals), `dashboard-view.tsx` (above), `certificates/[id]` `border-black`,
  admin digest page (raw `neutral-*`/`bg-white`/`bg-black` - admin-only).
- **Functional / keep as-is**: Google logo brand colors (`auth-form.tsx`), capstone print
  CSS (print is intentionally light-paper), `bg-black/50`–`70` modal scrims (standard on
  both schemes), `rgba(0,0,0,0.4)` drop shadow.
- **`grid-bg`** (`globals.css:367-383`): white-alpha grid lines - invisible on white;
  needs a black-alpha light variant.

## 7. Code highlighting - both stacks dark-only

- **Shiki**: single custom theme `tensorcraft-dark` (`packages/ui/src/mdx/
  tensorcraft-theme.ts`, bg `#161616`), loaded in `code-block.tsx`; comment color
  contrast-tuned specifically against the dark bg and locked by
  `tensorcraft-theme.test.ts`. Needs a designed `tensorcraft-light` sibling + dual-theme
  render or re-highlight on toggle.
- **Sandpack**: hardcoded inline dark object in `exercise.tsx:659-691`. The
  `ThemeManifest.sandpackTheme: "nightOwl"` field is **dead config - never read**
  (cleanup candidate regardless of this project).

## 8. Baked-dark assets & chrome

- OG images `/api/og` (`#181818`, 24h CDN cache), favicon `icon.tsx` / `apple-icon.tsx`
  (dark glyph on primary). Recommendation: leave OG/social permanently dark (brand
  surface, no scheme context at render time); favicon optional.
- No `<meta name="theme-color">` - should be added per-scheme when light ships.
- Emails: external (Kit) and deliberately non-branching
  (`docs/email-templates.md:174-177` bans `prefers-color-scheme` there); internal
  issue-report email dark, weekly digest already light. No app coupling.

## 9. Test / gate surface

- **e2e axe suite** (`e2e/accessibility.spec.ts`) is the real contrast gate: WCAG AA incl.
  color-contrast on 8 pages + all 6 lesson steps. Must run **per scheme** (matrix or
  duplicated project) or light regressions go unseen.
- **Unit axe** tests (multiple `*.a11y.test.tsx`) render dark-only today.
- **`theme-properties.test.ts`** structurally locks the 9-key single-palette shape and
  CSS↔TS hex equality - must be extended to cover scheme variants or it will fail/lie.
- **Visual baselines** (`RUN_VISUAL=1`, `e2e/visual/*`): all invalidated; light needs its
  own baseline set.

## 10. Recommended architecture (when approved)

1. **Axis**: `data-scheme="light"` on `<html>` alongside `data-theme` (attribute, not
   class, matching existing convention). CSS: for each theme block add a
   `[data-theme="X"][data-scheme="light"]` override of the *same* `--tc-*` names - every
   token-driven component then works untouched. Set `color-scheme` via
   `html { color-scheme: dark }` / `[data-scheme="light"] { color-scheme: light }`.
2. **Preference**: default to `prefers-color-scheme`, manual override persisted in
   localStorage (`tc-scheme`) + extend the existing FOUC bootstrap script; extend
   `tc_theme`-style cookie only if SSR needs it (favicons). Extend ThemeProvider rather
   than adding next-themes.
3. **Palette**: design 1 light neutral set (shared, like dark) + 5 darkened
   primary/accent/tier sets + semantic/axis light values; validate all with the axe gates.
4. **Canvas strategy** - decide: (a) redesign scenes for light (expensive art work), or
   (b) **"dark island" pattern**: scene canvases keep their dark art inside framed panels
   in light mode (cheap, common, preserves the brand's dark identity). Recommend (b) for
   V1 of light mode; AmbientBackground gets tokenized + light-tuned either way.
5. **Highlighting**: author `tensorcraft-light` Shiki theme + light Sandpack object; key
   both off `data-scheme`.
6. **Sequence**: tokens/axis → neutrals → accent sets → TS-palette-leak migration
   (lesson UI) → highlighting → canvas decision → chrome (theme-color meta, favicon) →
   test matrix → docs amendments (product-plan, ui-ux-notes, prd, architecture).

## 11. Effort estimate

- Infra (axis, provider, FOUC, meta): small - 1 session.
- Light palettes designed + AA-verified (10 palette combinations): medium - the actual
  design work; user sign-off required (standing ask-before-recolor rule).
- TS-palette leak migration (lesson UI ~40 sites + pages): medium, mechanical but wide.
- Shiki/Sandpack light themes: small–medium.
- Canvas: small if "dark island", large if full light art direction.
- Test matrix + visual baselines + doc amendments: small–medium.

## 12. Open decisions (user)

1. Proceed at all? Reverses documented non-goal; dark is called a core brand element.
2. Canvas art: dark islands vs full light redesign.
3. Light accent derivation: darken existing hues (keeps identity) vs fresh palette
   (recolor - requires explicit approval per standing feedback).
4. Default scheme: follow OS vs default-dark with opt-in light toggle.
5. OG/favicon: keep permanently dark (recommended) or scheme-follow.
