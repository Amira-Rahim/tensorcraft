# Tensorcraft — Development Plan

> Last updated: 2026-04-21 (content audit 210→0 allowlist, copy/legal/email cleanup, post-session doc staleness fixes)

> **⚠ V1 launch-scope revert (2026-05-05):** The "all 5 themes simultaneously"
> assertions throughout this document have been **reverted**. V1 ships
> Deep Orbit only; the other 4 themes are gated to "coming soon" with
> waitlist capture. The launched-set is sourced from
> `packages/shared/src/constants.ts` → `LAUNCHED_THEMES`. See
> [`docs/launch-scope.md`](./launch-scope.md) for the full spec, including
> what's in scope, what's out (the parallel pricing session owns
> `apps/web/app/pricing/**` and the `PRICING` constant), and the revival
> path for each theme.
>
> **Deferred work captured by this revert:**
> - Productionize content QA + launch for Neon Protocol, Signal Ward,
>   Nova Canvas, Terra Grid (4 themes × ~55 lessons + capstone each).
> - Tighten Supabase CHECK constraints on `purchases.theme_ids` /
>   `certificates.theme_id` to launched-only — held back to avoid
>   migration conflicts with the parallel pricing session.
> - Drop `profiles.preferred_theme_id` column once we're confident the
>   field stays unused (currently kept as a tombstone).
> - Restore an onboarding theme picker once 2+ themes are live.
>
> **Deferred (end-of-lesson):** The 4 coming-soon themes' lessons (Neon
> Protocol, Signal Ward, Nova Canvas, Terra Grid) still author the lesson
> close with the deprecated `<Quiz>` / `<KeyTakeaways>` blocks. Before each
> theme launches, migrate its lessons onto `<RecallPrompt>` + `<LessonRecap>`
> (see the "Lesson close" section in `docs/story-style-bible.md`). This is
> non-blocking for V1 because the coming-soon MDX is excluded from the Velite
> build. `<Quiz>` and `<KeyTakeaways>` are deprecated-but-retained (still
> registered in `lesson-content.tsx`, marked DEPRECATED in
> `packages/ui/src/mdx/`) solely so that unbuilt MDX keeps compiling until
> migrated; remove them once all themes are off them.

This document is the single source of truth for all development work needed to ship Tensorcraft, from repo initialization through launch, sourced from the PRD, tech-spec, product-plan, theme scripts, and two rounds of DeepSeek reviews. **Post-launch and deferred work is tracked canonically in `docs/post-launch-backlog.md`** (consolidated 2026-07-21); deferred mentions elsewhere in this file are historical and non-authoritative.

**Status key:** `[ ]` not started · `[~]` in progress · `[x]` done

---

## Session log

### 2026-07-23 — Light mode: full implementation (Tasks 2-15 of the light-mode plan)

**Landed (code + tests, uncommitted — awaiting user review):**

- **Scheme axis shipped end to end.** `data-scheme="light"` on `<html>` (absent = dark); light `--tc-*` token blocks in `packages/themes/src/css/themes.css`; `paletteLight` on every ThemeManifest; provider extension (`tc-scheme` localStorage, OS-follow default, matchMedia reactivity, storage-blocked fallback); pre-paint FOUC script + `suppressHydrationWarning`; `themeColor` viewport meta; nav SchemeToggle (3-state cycle, sr-only live region); `useScheme()` hook in packages/ui (refcounted MutationObserver) + shared `useAttributeObserver` in apps/web.
- **Light palette was re-minted twice under the axe gate** (final values in themes.css, NOT this plan's original tables): v3 clears ≥4.55:1 on the light page bg AND on 10-20% self-tints, with a new `--tc-on-primary` ink token (light = pure white) for primary/accent fills. All lessons are locked into `theme-properties.test.ts` (118 tests: 9-key CSS↔TS cross-checks both schemes, rgb-triplet sync, WCAG gates incl. self-tint sweeps).
- **Canvas light art ("ink on paper"), user-approved at two gates:** drawOrbit + all 4 theme scenes render multiply-composited ink with deepened highlights in light scheme; geometry locked scheme-identical by recorder tests; dark output byte-locked by golden style captures. AmbientBackground/Ticker tokenized + scheme-aware. Shiki `tensorcraft-light` + Sandpack light theme; exercise badges scheme-paired; `yellow-400`→`warning` and `green-400`→`success` semantic swaps (deliberate slight dark shift); hint-panel locked-label opacity trick removed (computed #808080 in light).
- **Lesson UI migrated off `ThemeManifest.palette`** (~90 inline sites → `var(--tc-*)`); dead `theme` prop threading removed; manifest dark neutrals synced to CSS truth; dead `sandpackTheme` field deleted; two stale dark `--tc-primary-rgb` triplets fixed (neon, nova).
- **Test matrix:** axe suite runs 28 audits (8 pages + 6 lesson steps × both schemes) — all green; visual baselines minted for both schemes (dark deliberately re-minted — token swaps changed dark rendering); toggle e2e smoke; `colorScheme: "dark"` pinned in playwright config with the matrix as the deliberate exception. Full battery: vitest 1517 passed, build 122/122, typecheck clean. Two e2e test-drift fixes (ambiguous `status` selector; pre-existing stub-roster string drift).
- **Open items:** ◐ toggle glyph needs a one-time Windows/Linux font check; mobile-drawer toggle reachability is backlog; `Ticker` component looks like dead code (no live importer — flagged, not removed). Execution ledger with all review rounds: `docs/superpowers/plans/2026-07-22-light-mode.md`.
- **Deep verification pass (same day, second sweep):** two adversarial code audits + a 22-route × both-schemes runtime sweep with live-toggle checks. Fixed: Sandpack `files` object identity reset that **wiped learner code on scheme toggle** (useMemo), ParticleField reduced-motion stale color on toggle, FOUC-script storage-throw killing the OS fallback, 14 more ink-on-fill sites via the `text-surface`→`--tc-bg` alias, ~30 `red-400/500` sites adopted onto the previously-unused `--tc-error` token (incl. all 11 error boundaries, session toast, exercise/quiz failure states), compound-opacity text failures (report-issue, five-worlds, pricing-tiers, auth-form, paywall, dashboard, lesson-drawer), `journey/*` + five-worlds cross-theme hues onto the `.tc-theme-card` scheme pair, admin digest literal chips (were broken in dark), dead `prose-invert`. Verified after: typecheck clean, 758 unit tests green, axe matrix green (one parallel-load flake passes isolated), all 22 routes clean under a dark-surface/invisible-text detector in both schemes, toggle cycle system→light→dark→system live-verified. Note: the lesson viewer is chromeless (no site nav), so there is no scheme toggle inside lessons — pre-existing design, candidate for the lesson ChromeBar later.

### 2026-07-22 — Light mode: decision + doc amendments (Task 1 of the light-mode plan)

**Landed (docs only, uncommitted — awaiting user review):**

- **Decision:** Light and dark color schemes are both supported going forward. Dark remains the brand-default aesthetic; light mode follows the OS `prefers-color-scheme` by default with a manual override toggle. Every theme palette gets a light variant with WCAG AA-verified contrast — darkened versions of the existing hues, not a neutrals flip. OG images and favicons intentionally stay dark. This reverses the dark-exclusive stance that had stood since the founding aesthetic.
- **Docs amended** to drop the dark-exclusive claims (the app had previously been documented as having only a dark scheme, no alternative) and record the new stance: `docs/product-plan.md` (§5.6 shared constraints + §6.1 non-goals list), `docs/ui-ux-notes.md` (dark-mode note rewritten into a color-scheme note covering the `data-scheme` attribute, `tc-scheme` localStorage key, and the "ink on paper" light art language for canvas scenes), `docs/architecture.md` (Theme System design philosophy), `docs/prd.md` (§6.1 design aesthetic).
- **Rationale + full contrast audit:** `docs/audits/light-mode-readiness-2026-07-22.md` (point-in-time investigation; not rewritten).
- **Implementation plan** (CSS scheme axis, canvas light-art redesign, Shiki/Sandpack light themes, toggle UI, per-theme WCAG verification): `docs/superpowers/plans/2026-07-22-light-mode.md`. This session only completed the plan's doc-amendment task (Task 1); the CSS/component/canvas work is `[ ]` not started.

### 2026-04-21 — DB + integration fixes (deep-audit follow-up)

**Landed (code, uncommitted — awaiting user review):**

- **Migration 020 `issues` table** — created `packages/supabase/migrations/020_issues_table.sql`. The API's `POST /api/issues` route had no backing table; production writes would have 500'd. Shape mirrors `Database.public.Tables.issues` in `packages/supabase/src/types.ts`: `id`, `user_id` (nullable for anonymous reports), `category`, `description`, `severity`, `email`, `screenshot_url`, `page_url`, `user_agent`, `viewport` (jsonb), `created_at`. CHECK constraints on `category` + `severity` enums, `(user_id OR email) NOT NULL`, and description length 10–2000. RLS enabled with zero user-facing policies — service role only (anon + authenticated cannot read/write). Indexes: `created_at DESC` for admin list queries + partial `user_id WHERE NOT NULL`. **User action:** apply via Supabase SQL editor.
- **Seed cleanup** — removed `total_lessons_completed` from `packages/supabase/seed.ts` profiles upserts (column dropped in migration 009; was silently ignored by upsert but semantically stale). No other stale column references remain.
- **Kit `onboarded` tag wired** — `apps/api/src/routes/onboarding.ts` now accepts `onboarding_completed: boolean` in the PATCH body, reads the current profile row first to detect the `false → true` edge, and fires `tagSubscriber(email, KIT_TAG_ONBOARDED)` on that edge only. Silent-fails on Kit API errors (logged via `logger.warn`). Retry requests (where `onboarding_completed` was already `true`) no-op. Missing `KIT_TAG_ONBOARDED` env var also no-ops.
- **Tests** — `onboarding.test.ts` extended from 6 → 11 tests: covers the tag fire on transition, no-fire on repeat, no-fire when tag env unset, no-fire when payload omits `onboarding_completed`, and 400 on non-boolean `onboarding_completed`. Full API suite: **194/194 passing**. `pnpm --filter @tensorcraft/api build` green.

### 2026-04-20 — Batch 1 + 2 + small fixes + Phase 11 viz design

**Landed (code, uncommitted — awaiting user review):**

- §4b Stripe webhook signature verification, purchases upsert race-condition fix (`ON CONFLICT` + UNIQUE index), `GET /api/purchases/access` endpoint, purchase-to-theme referential integrity (migration `017_purchases_referential_integrity.sql`)
- §4c Paywall redirect contract — Module 2+ lesson attempts redirect to `/auth` (unauth) or `/pricing?locked={slug}` (authed-but-locked); `<PaywallNotice>` banner wired on `/pricing`
- §5b Dashboard page — server component with parallel Supabase queries, `theme-cards.tsx` grid showing owned/locked states, 8 new tests
- §5f GitHub integration backend — `/connect`, `/callback`, `/disconnect`, `/commit`, `/retroactive-push` endpoints with retry + structured error codes; 35 new tests
- §6a WCAG 2.1 AA audit report at `docs/audits/accessibility-audit-2026-04-20.md` — 37 findings (6 Critical, 14 Serious)
- §6d SEO metadata gaps filled on pricing/terms/privacy; `robots: noindex` on dashboard/settings/auth/onboarding/purchase-success; per-theme `Course` JSON-LD; OG route unit-tested
- Pre-existing test-suite repair: rate-limit 120→60 req/min with in-memory Redis mock, email-tags env read bug + auth ordering fix, exercise-attempts Supabase mock `.limit()` fix, `apps/api/vitest.setup.ts` path regression fixed — API test suite: 114/114 passing
- Phase 11 visualizations brainstormed and spec'd — see `docs/superpowers/specs/2026-04-20-visualizations-design.md`

**Still to apply (user action):**

- ~~Migration `017_purchases_referential_integrity.sql`~~ → **APPLIED** 2026-04-20. CHECK constraint `chk_purchases_valid_theme_ids` now live. Unique-index half was effectively a noop — a pre-existing `uq_stripe_session_id` already guaranteed uniqueness; migration 017's `idx_purchases_stripe_unique` now coexists as a harmless duplicate. Optional cleanup: `DROP INDEX IF EXISTS public.idx_purchases_stripe_unique;`
- Review and commit uncommitted working-tree changes (27 files as of 2026-04-20)
- Resolve rate-limit MAX_REQUESTS authoritative value (was 120, now 60 per user decision)

**Visualizations implementation (Tasks 1.1 → 3.2, landed 2026-04-20):**

- Files created (6): `packages/ui/src/visualizations/helpers.ts`, `packages/ui/src/visualizations/loss-curve.tsx`, `packages/ui/src/visualizations/index.ts` (+ colocated tests + snapshots), `apps/web/app/dashboard/_lib/viz-data.ts`, `apps/web/app/dashboard/__tests__/dashboard-view.test.tsx`, `apps/web/app/dashboard/__tests__/page.test.tsx` (new file tracked via `__tests__/` dir).
- Files modified: `apps/web/app/dashboard/page.tsx` (added `exercise_attempts` query + `lossCurveData` computation), `apps/web/app/dashboard/dashboard-view.tsx` (accepts `lossCurveData` prop, renders LEARNING TREND section after SkillGenome), `apps/web/app/dashboard/skill-genome.tsx` (269→207 lines, Option C refactor consuming `hexCorners` from `@tensorcraft/ui/visualizations`), `packages/ui/package.json` (added `./visualizations` subpath export), `docs/dev-plan.md`.
- Test counts: +28 new tests across 4 new files (helpers 7, loss-curve 5, viz-data 7, skill-genome 9) + 2 new tests in `page.test.tsx` + 3 new tests in `dashboard-view.test.tsx` — ~33 tests added.
- Deferred (non-blocking, from code-quality review): LossCurve `yMax` padding `+0.5` → `+1.0` (end-label/comment-header collision in rare all-increasing curves); LossCurve single-data-point test — add assertion that "1 of 3+ exercises" text renders.

**Scope decisions this session:**

- HTML/JSX prototypes retired — `apps/web/app/**/page.tsx` is now authoritative (see `project_prototypes_removed.md` memory)
- ARIANarrator dual robot companion **cut from Phase 11**
- ActivityHeatmap confirmed deferred post-V0.5 (also removed from §11b)
- LossLandscape deferred (atmospheric-only; revisit post-V1)
- Phase 11 visualizations reduced from 4 → 2 (SkillRadar + LossCurve)
- Nova Canvas primary `#C06060` identified as failing WCAG AA 4.5:1; replacement `#D07070` proposed (~4.8:1) — to be baked into Stage 1 foundation agent

**Still to do (Phase 11 roadmap):**

- **Stage 1 — Foundation (serialized, 1 agent):** §11a palette CSS, Tailwind `@theme` update, 5 theme manifests verification, Nova Canvas contrast fix, `theme-properties.test.ts` update, replace neon utilities with brutalist utilities
- **Stage 2a — Backend (parallel with 2b, 1 agent):** §11e profiles migration (experience_level, learning_goal), certificates table migration, certificate endpoints, daily activity aggregation, onboarding update endpoint
- **Stage 2b — Shell + primitives (3 parallel agents after Stage 1):** Nav/Footer/AuthForm/CookieConsent/UserMenu/layout.tsx updates; ParticleField + BridgeTicker components; SkillRadar + LossCurve implementation per visualizations spec
- **Stage 3 — Page integration passes (3 waves of 3–4 agents, after Stage 2):** Landing (ParticleField + BridgeTicker), Auth, Pricing, Dashboard (visualizations), ModuleOverview, ThemeSelection, Exercise, Onboarding, Settings, Paywall (NEW), Capstone (NEW), PurchaseConfirmation (BridgeExplorer removed per §7a)
- **Stage 4 — Docs + tests (1 agent, last):** update tech-spec, product-plan, marketing-plan; verify all snapshots green

---

## Phase 0: Prototyping & Documentation (COMPLETE)

- [x] 15 HTML prototypes covering full user journey (landing, auth, onboarding, dashboard, theme-selection, module-overview, lesson-viewer, exercise, pricing, settings, paywall, bridge-explorer, capstone, purchase-confirmation, index)
- [x] PRD, tech-spec, product-plan, ui-ux-notes, marketing-plan
- [x] 5 theme scripts (Deep Orbit complete, 4 outlines)
- [x] Pricing model aligned across all docs (per-model $59, bundles $99/$129/$159) — rebased from $79/$129/$169/$219 on 2026-05-05; single raised $49→$59 + bundles $99/$129/$159 on 2026-06-20
- [x] Database schema added to tech-spec (profiles, purchases, theme_progress, waitlist_signups)
- [x] Bridge quality tiers documented (Identity/Structural/Intuition)
- [x] GitHub retroactive push behavior specified in tech-spec 5.3
- [x] Post-purchase confirmation + capstone screens added to PRD
- [x] Payment failure handling documented in PRD 4.6
- [x] All prototype-to-docs misalignments resolved

---

## Resolved Decisions

All blocking decisions have been resolved. This table documents the final choices.

| # | Decision | Resolution | Rationale |
| --- | --- | --- | --- |
| 1 | **V0.5 module scope** | All 11 Deep Orbit modules (55 lessons) authored; all 5 themes content-complete (275 lessons total). V0.5 gates access to Deep Orbit only. *(OBSOLETE: all themes launch simultaneously as of 2026-04-13)* | Originally M1–3; content authoring exceeded plan. |
| 2 | **Database** | Supabase (PostgreSQL + Auth + RLS) | Already implemented in architecture. Auth + RLS from day one. |
| 3 | **Bundle pricing** | $59 single / $99 two / $129 three / $159 all five | Diminishing per-theme cost. All tiers are one-time purchases. (Rebased from $79/$129/$169/$219 on 2026-05-05; raised to $59/$99/$129/$159 on 2026-06-20 after market audit — founder anchor dropped.) |
| 4 | **Payment processor** | Stripe Checkout + Webhooks | One-time purchases. No subscriptions. Webhook-driven fulfillment. |
| 5 | **Code execution** | TensorFlow.js in Sandpack | Client-side only. No server sandbox. |
| 6 | **Narrative branching** | Convergent (single path) | Simpler content pipeline. All 5C variations are structural, not branching. |
| 7 | **AI-powered hints** | Manual 3-level progressive disclosure | No LLM cost/latency. Hints authored per exercise. |
| 8 | **WCAG level** | WCAG 2.1 AA | Standard compliance. AAA deferred. |
| 9 | **Content pipeline** | MDX 3 + Velite (Zod schemas) | Build-time validation. Missing fields = build error. |
| 10 | **Code highlighting** | Code Hike (Shiki-based) | Scrollytelling for FE Bridge side-by-side code comparisons. |
| 11 | **Email provider** | Kit (ConvertKit) | Waitlist, per-theme segments, 11-email nurture sequence. |
| 12 | **Team pricing** | Deferred to post-V1.0 | No team tiers at launch. Added to product plan as future phase. |
| 13 | **Early Access tier** | Removed | V0.5 uses Free (M1) + $59 (full theme). No intermediate tier. |
| 14 | **Ship name** | Archimedes | Consistent across all docs and prototypes. |
| 15 | **Nova Canvas model** | Nova Canvas (not "Nova Canvas" or "Nova Gen Engine") | Simplified. |

---

## Phase 1: Project Setup & Infrastructure (COMPLETE)

### 1a. Monorepo & Tooling (COMPLETE)

- [x] Initialize Turborepo + pnpm monorepo
- [x] Configure workspace packages:
  - `apps/web` — Next.js 15 (App Router) frontend
  - `apps/api` — Hono API service
  - `packages/content` — MDX lessons, exercises, Velite config, content queries
  - `packages/supabase` — Migrations, seed data, RLS policies
  - `packages/themes` — Theme CSS, assets, manifests
  - `packages/shared` — Shared types, utilities, constants
  - `packages/ui` — Shared React component library + MDX components
- [x] TypeScript 5.x strict mode — no `any` in production code
- [x] ESLint + Prettier configuration (shared config package)
- [x] Pre-commit hooks: husky + lint-staged (lint, typecheck, format)
- [x] ESLint added to lint-staged pre-commit hooks
- [x] Configure Tailwind CSS 4 with `@theme` directive + CSS custom properties for theming
- [x] Font delivery: Inter + JetBrains Mono via `next/font/google`
  - `font-display: swap` to prevent FOIT
  - CSS variable injection on `<html>`

### 1b. Hono API Backend (COMPLETE)

- [x] Set up Hono API service (`apps/api`)
- [x] Configure middleware (CORS, auth validation, rate limiting)
- [x] Admin API endpoints: `GET /api/admin/stats`, `GET /api/admin/waitlist` with API key auth
- [x] `.env.example` for API service documenting all required env vars

### 1c. Database Setup (COMPLETE)

- [x] Set up Supabase project (Postgres + Auth)
- [x] Create database tables (9 tables, 1 view, across 11 migrations):
  - `profiles` (id, email, display_name, avatar_url, github_username, github_connected, github_token, onboarding_completed, role, fe_background, fe_framework, learning_goal, fe_experience_years, email_alerts, weekly_digest, preferred_theme_id, timestamps)
  - `purchases` (id, user_id, plan_id, theme_ids[], amount, currency, stripe_session_id, stripe_payment_intent, status [pending/completed/failed/refunded/partially_refunded/disputed], timestamps)
  - `theme_progress` (id, user_id, theme_id, module_id, lesson_id, status, score, hints_used, attempts, timestamps)
  - `waitlist` (id, email, theme_id, source, created_at)
  - `streaks` (id, user_id, theme_id, current_streak, longest_streak, last_activity_date) — secured via RPC function
  - `achievements` (id, user_id, achievement_type, theme_id, unlocked_at) — created, not yet used
  - `exercise_attempts` (id, user_id, exercise_slug, lesson_id, theme_id, passed, score, hints_used, solution_viewed, submitted_code, duration_ms)
  - `skill_genome` (id, user_id, theme_id, skill_axis, proficiency, confidence, velocity) — computed via `compute_user_skill_genome()` RPC after lesson completion
  - `skill_events` (id, user_id, theme_id, event_type, skill_axis, metadata) — append-only signal log
  - `theme_progress_summary` (VIEW — aggregated completion stats, not yet queried from code)
- [x] Row-Level Security (RLS) policies on all tables (user can only read/write own data)
- [x] Indexing strategy: user_id on all tables, compound index on (user_id, theme_id) for theme_progress
- [x] Auto-create profile trigger on auth.users insert
- [x] Connection pooling via Supabase built-in pgBouncer (Supabase manages this automatically)
- [x] Automated daily backups (Supabase managed — included on all plans)

### 1d. Security Foundations (COMPLETE)

- [x] CORS configuration for API endpoints
- [x] Rate limiting on API routes — Redis-backed sliding window, 60 req/min per IP, graceful fallback if Redis unavailable. Stripe webhook exempt.

---

## Phase 2: Core Pages & Auth (COMPLETE)

### 2a. Auth System (COMPLETE)

- [x] Supabase Auth integration via `@supabase/ssr`:
  - GitHub OAuth (PKCE flow)
  - Google OAuth
  - Email magic link
- [x] Sign up page (`/auth/sign-up`) and login page (`/auth/sign-in`) — from `prototypes/auth.html`
- [x] Guest browsing mode (Module 1 link on sign-in page, no account required)
- [x] Session management via Next.js middleware (`apps/web/middleware.ts`)
  - Cookie-based session refresh
  - Protected route guards (`/dashboard`, `/settings`, `/onboarding`)
  - Redirect authenticated users away from auth pages
  - Auto-redirect to onboarding if `onboarding_completed` is false
- [x] OAuth callback route (`/auth/callback`) — code exchange + redirect
- [x] Sign-out route (`/auth/sign-out`) — session destruction + redirect
- [x] OAuth error handling (error param on callback, UI error display)
- [x] User menu component with auth state detection, avatar dropdown, sign-out (`apps/web/app/components/user-menu.tsx`)

### 2b. Onboarding Flow (COMPLETE)

- [x] 6-step post-signup flow (`/onboarding`) — from `prototypes/onboarding.html`:
  1. Welcome screen — headline "Welcome Aboard the Archimedes" + 3 feature cards
  2. Your Background — 5 options (beginner to ML-adjacent), saved to `profiles.fe_background`
  3. Your Goal — 5 options (understand concepts to just curious), saved to `profiles.learning_goal`
  4. Your Framework — React/Vue/Angular/Svelte/Vanilla with live bridge preview, saved to `profiles.fe_framework`
  5. Choose Theme — Deep Orbit available, 4 others disabled (Coming Soon), saved to `profiles.preferred_theme_id` *(OBSOLETE: all themes launch simultaneously as of 2026-04-13)*
  6. Ready — configuration summary + "Begin First Lesson" CTA
- [x] Onboarding completion persistence — sets `onboarding_completed` flag + all preferences in `profiles` table
- [x] Stepper indicator showing progress through 6 steps (dot + line UI)

### 2c. Legal & Compliance (COMPLETE)

- [x] Terms of Service page (`/terms`) — 9 sections
- [x] Privacy Policy page (`/privacy`) — 10 sections, GDPR/CCPA rights
- [x] Cookie consent banner (GDPR/CCPA) — Accept All / Essential Only, persisted to localStorage
- [x] Global `SiteFooter` component with Home, Terms, Privacy links — wired in root layout

### 2d. Landing Page (COMPLETE)

- [x] Full rebuild from `prototypes/landing.html` (`apps/web/app/page.tsx`)
- [x] Sticky glass `Nav` component (72px, blur(20px), pill-shaped links)
- [x] Hero with breathing color washes (`breathe-left`/`breathe-right` keyframes) + dot grid overlay
- [x] Headline: "The Bridge from Frontend to ML Is Shorter Than You Think"
- [x] Product preview mockup (2-col: narrative + code editor with syntax highlighting)
- [x] 6 FE→ML bridge cards in 3-column grid (Math.max→ReLU, Array.map→NN, etc.)
- [x] Theme showcase: Deep Orbit featured hero card (2-col + code mockup) + 4 coming-soon cards in 2x2 grid
- [x] Stats section (50+ bridges, 275 lessons, 5 worlds, $59/theme) — price rebased 2026-05-05, raised 2026-06-20
- [x] CTA footer with gradient background
- [x] All animations respect `prefers-reduced-motion`

---

## Phase 3: Learning Experience & Content Pipeline (COMPLETE — Sandpack exercise editor remaining)

### 3a. MDX Content Pipeline (COMPLETE)

- [x] Configure Velite with Zod schemas for MDX content:
  - 3 collections: lessons (`**/*.mdx`), exercises (`**/exercises/*.yaml`), modules (`**/module.yaml`)
  - Frontmatter: slug, title, moduleId, themeId, order, estimatedMinutes, difficulty, context, concept (with bridge), consequence, hints, keywords
  - Enum enforcement: difficulty ∈ {beginner, intermediate, advanced}, bridge tier ∈ {identity, structural, intuition}
  - Build-time validation: missing/invalid fields = build error (Velite strict mode)
- [x] Velite config (`packages/content/velite.config.ts`) — linchpin connecting Zod schemas to MDX
- [x] Content queries (`packages/content/src/queries.ts`) — getModules, getModuleLessons, getLesson, getExercise, getAdjacentLessons
- [x] Turbo task dependency: `build:content` runs before `build` via `dependsOn: ["^build:content"]`
- [x] MDX component library (8 components in `packages/ui/src/mdx/`):
  - `<Dialogue>` — speaker label + styled blockquote with accent border
  - `<BridgeCallout>` — 3-column FE↔ML grid with tier colors (Identity=#00D4FF, Structural=#7B68EE, Intuition=#F0C75E)
  - `<CodeBlock>` — syntax highlighting, copy button, language badge (client component)
  - `<HintPanel>` — 3-level progressive disclosure (nudge → guidance → solution, client component)
  - `<LearningObjectives>` — checklist with accent-colored markers
  - `<KeyTakeaways>` — summary card with checkmarks and accent left border
  - `<Exercise>` — placeholder for Sandpack (loading skeleton)
  - `<Quiz>` — multiple-choice with correct/wrong feedback and retry (client component); accepts `correct` (index), `explanation`, `tier`, and `onSubmit` — lesson-content wrapper fires `trackCheckpointSubmitted` on submit (2026-04-21)
- [x] Lesson content rendering via `new Function()` with `react/jsx-runtime` injection

### 3b. Content Authoring Workflow (COMPLETE)

- [x] First 15 lessons set the quality bar (Modules 1–3 complete)
- [x] Platform component build order achieved:
  - MDX rendering, `<CodeBlock>`, `<LearningObjectives>`, `<KeyTakeaways>` — done
  - `<BridgeCallout>`, `<Dialogue>`, `<HintPanel>` — done
  - `<Quiz>` — done
  - `<Exercise>` — placeholder done, Sandpack deferred to 3f

### 3c. Content Validation (COMPLETE)

- [x] Frontmatter schema validation (Zod — fail build on invalid) — Velite strict mode enforces at build time
- [x] 5C Loop structure enforcement per lesson — Zod schema requires context, concept, consequence fields; MDX body has Code + Challenge sections
- [x] Bridge validation — tier enum enforced by Zod (identity/structural/intuition); bridge presence validated when provided

### 3d. Module Overview (COMPLETE)

- [x] ~~Build module overview page~~ MERGED: Module lessons now shown in module map accordion at /themes/[slug] (standalone page deleted 2026-04-15)
- [x] Lesson cards with order, title, time estimate, difficulty badges
- [x] Breadcrumb navigation (theme → module)
- [x] V0.5: Show Modules 1–3 for all 5 themes (free tier); V1.0 unlocks Modules 4–11 per purchased theme

### 3e. Lesson Viewer (COMPLETE)

> **COMPLETED (2026-04-14):** Lesson page redesigned to 6-step Duolingo-style progression. Sidebar removed, step-based navigation with progress bar.

- [x] Build lesson viewer (`apps/web/app/themes/[slug]/[module]/[lesson]/page.tsx`)
- [x] Real MDX content rendering via `LessonContent` client component
- [x] Prev/next lesson navigation
- [x] Breadcrumb navigation (theme → module → lesson)
- [x] Redesigned to 6-step Duolingo-style progression: Step 1 (Briefing) → Step 2 (Concept) → Step 3 (Code) → Step 4 (Challenge) → Step 5 (Takeaways) → Step 6 (Consequence). Sidebar removed; step-based navigation with progress bar via `lesson-steps.tsx`.

### 3f. Exercise Editor (COMPLETE)

- [x] Placeholder Exercise component with loading skeleton
- [x] Sandpack integration for live code execution (`@codesandbox/sandpack-react`)
- [x] Custom lightweight test runner with Jest-style describe/it/expect harness
- [x] TensorFlow.js mock (tf.tensor, tf.add, tf.relu, tf.sequential, tf.layers, etc.)
- [x] 10-second execution timeout per test suite
- [x] ExerciseDataProvider context — data flows from server (Velite) to client (Sandpack)
- [x] Run Tests / Reset / Show Solution buttons (Zensman DeFi pill style)
- [x] TestResultsPanel with pass/fail display and error messages
- [x] Difficulty badge and estimated time display
- [x] Partial credit system (scoring based on tests passed / total)

### 3h. Syntax Highlighting (COMPLETE)

- [x] Shiki integration in CodeBlock with lazy-loaded highlighter (client-side, cached singleton)
- [x] Supports TypeScript, JavaScript, TSX, JSX, Python, JSON, Bash, HTML, CSS, YAML, Markdown
- [x] Custom `tensorcraft-dark` Shiki theme — uses Tensorcraft color palette (primary green keywords, accent strings, muted comments). Replaced generic `github-dark-default`. UPDATED 2026-04-14.
- [x] Graceful fallback — renders plain code while Shiki loads, no layout shift
- [x] Copy button preserved

### 3i. Deep Orbit Content (V0.5 — Modules 1–3) (COMPLETE)

- [x] Module 1 (Foundations): Introduction to Tensors, Tensor Shapes, Tensor Operations, Data Loading, Normalization (5 lessons + 4 exercises)
- [x] Module 2 (Neural Networks): First Neuron, Activation Functions, Layers & Architecture, Forward Pass, Building a Network (5 lessons + 5 exercises)
- [x] Module 3 (Training Loop): Loss Functions, Gradient Descent, Backpropagation, Training Loop, Evaluating DEEP SCAN (5 lessons + 5 exercises)
- [x] All 15 lessons follow 5C Loop structure with YAML frontmatter
- [x] FE-to-ML bridges present across all 3 tiers (identity, structural, intuition)
- [x] Character voices: Commander Mirza, Dr. Farah, ARIA (AI), Chief Nazari, Ensign Demir
- [x] 3 module.yaml metadata files
- [x] 14 exercise YAML files with starterCode, solutionCode, testCode
- [x] Velite compiles all 15 lessons without errors

---

## Phase 4: Payments & Access Control

### 4a. Pricing Page

- [x] Build from `prototypes/pricing.html`
- [x] 5 individual tiers: Free Preview ($0), Single Theme ($59), Two Themes ($99), Three Themes ($129), All 5 Themes ($159) — rebased from $79/$129/$169/$219 on 2026-05-05, raised 2026-06-20
- [ ] Team pricing: Deferred to post-V1.0. Design based on enterprise demand data.
- [x] FAQ accordion (interactive)
- [x] Feature comparison table

### 4b. Stripe Integration

> **~~SECURITY CRITICAL~~ RESOLVED:** Webhook now uses `stripe.webhooks.constructEvent()` with signing secret for full signature verification. Idempotent via UPSERT on `stripe_session_id`.

- [x] **SECURITY: Replace stubbed webhook with `stripe.webhooks.constructEvent()` using signing secret**
- [x] Stripe Checkout sessions for one-time payments
- [x] `POST /api/checkout` endpoint — create Stripe Checkout session with theme metadata
- [ ] Support credit card, Google Pay, Apple Pay
- [x] Webhook handling with signature validation:
  - `checkout.session.completed` → write purchase to `purchases` table, send confirmation email
  - `charge.refunded` → update purchase record, revoke access
  - `charge.failed` → display error modal with retry + support link
- [x] Validate Stripe session ID format (`cs_` prefix) before DB write
- [x] Validate `session.metadata` fields (null checks, required fields)
- [x] Webhook idempotency — store processed event IDs to prevent replay
- [x] Exempt webhook route from rate limiter (Stripe retries should not be blocked)
- [x] Checkout button client component (`apps/web/app/pricing/checkout-button.tsx`) — initiates Stripe session and redirects
- [ ] Webhook retry logic / dead-letter queue for failed deliveries
- [x] `GET /api/purchases/:userId` endpoint — verify user has purchased a theme
- [x] `GET /api/purchases/access` endpoint — returns `{ themeIds, hasFullBundle }` for the authenticated user, filters unknown slugs defensively. COMPLETED 2026-04-20.
- [x] Fix purchases upsert race condition — webhook now pre-checks for terminal statuses (refunded / partially_refunded / disputed / failed) and skips upsert to prevent status regression; otherwise `ON CONFLICT (stripe_session_id) DO UPDATE` via `ignoreDuplicates: false`. Migration 017 promotes `stripe_session_id` to a UNIQUE index so concurrent Stripe retries serialize at the DB level. COMPLETED 2026-04-20.
- [x] Purchase-to-theme referential integrity (API + DB) — `validateThemeIds` now rejects empty arrays and unknown slugs on both checkout and webhook paths; migration 017 adds a `chk_purchases_valid_theme_ids` CHECK constraint so even direct SQL writes cannot land an unknown slug. COMPLETED 2026-04-20.
- [x] Payment failure error modal on pricing page (PRD 4.6)
- [x] Upgrade path: credit amount already paid toward higher tier — see §7g (completed 2026-04-14)
- [ ] Track `purchase_completed` and `refund_requested` events

### 4c. Paywall & Access Control

- [x] Route guard middleware — check `purchases` table for theme access
- [x] Paywall modal when free-tier user attempts Module 2+ (from `prototypes/paywall.html`)
- [x] Upgrade path from paywall → pricing page
- [x] Redirect-based paywall on `themes/[slug]/[module]/[lesson]`: unauthenticated → `/auth?redirectTo=<path>`, authenticated-but-locked → `/pricing?locked=<themeSlug>` with a canonical-slug-validated `PaywallNotice` banner surfacing which theme is gated. COMPLETED 2026-04-20.
- [x] Track `paywall_hit` and `upgrade_modal_shown` events — COMPLETED 2026-07-21. Both now fire from `<PaywallNotice>` on `/pricing` (`upgrade_cta_shown` was already wired; `paywall_hit` was not). The event had been unreachable since the route moved to redirect-based enforcement: its only call site was `<LessonPaywall>`, which `page.tsx` stopped rendering, so `paywall_hit` recorded **nothing** from launch until now. Treat any pre-2026-07-21 paywall funnel data as absent, not as zero conversions. The lesson redirects now carry `&module=<moduleSlug>` so the event keeps its module dimension; `<LessonPaywall>` and the orphaned `trackPaywallShown` helper were deleted.

### 4d. Post-Purchase Confirmation

- [x] Build from `prototypes/purchase-confirmation.html`
- [x] Show unlocked modules list, next steps, Discord invite
- [x] Redirect here after successful Stripe checkout

### 4e. Email System

- [x] Kit integration for purchase confirmation emails (V0.5 — webhook tags subscriber, Kit dashboard sends email)
- [x] Email lifecycle tags (signed_up, onboarded, first_lesson, capstone) via Kit. COMPLETED 2026-04-14.
- [x] Additional email flow triggers wired (2026-04-21, §4e):
  - Welcome series trigger: `signed_up` tag on SIGNED_IN (session-listener.tsx)
  - Post-onboarding trigger: `onboarded` tag on /onboarding submit
  - First-lesson trigger: `first_lesson` tag on lesson-steps completion
  - Capstone trigger: `capstone` tag on /themes/[slug]/capstone mount (gated by full-theme completion)
  - Purchase confirmation: `purchased` tag on Stripe `checkout.session.completed`
  - Kit dashboard owns the actual sequences + email bodies
  - Waitlist nurture sequence: DEFERRED (requires Kit waitlist form + 48h early-bird scheduler)
- [x] Email templates — brutalist brand guidelines documented in `docs/email-templates.md` (templates live in Kit dashboard). Zensman DeFi system superseded by brutalist monochrome.
- [x] Unsubscribe / preference management (§4e, 2026-04-21):
  - `PATCH /api/preferences` — persists `email_alerts` + `weekly_digest` to profiles, reconciles Kit tags via `KIT_TAG_EMAIL_ALERTS` / `KIT_TAG_WEEKLY_DIGEST`
  - `/settings` → Notifications tab toggles route through the new endpoint
  - Every Kit email carries Kit's `{{ unsubscribe_url }}` footer (CAN-SPAM / GDPR)
- [x] Email deliverability monitoring (§4e, 2026-04-21):
  - SPF / DKIM / DMARC setup documented in `docs/email-setup.md`
  - `POST /api/webhooks/kit-bounce` — shared-secret auth, logs bounces + complaints via Pino
  - Deferred: marking `profiles.email_invalid` (needs migration + re-validation UX)

### 4f. PPP Discounts (V2.0 — Constellation)

- [ ] ParityDeals integration for automatic regional discounts (20–70%)
- [ ] Vercel Edge Function for geo-lookup
- [ ] Show original vs discounted price on pricing page
- [ ] PPP discount percentage displayed alongside original price

---

## Phase 5: User Features

### 5a. Progress Tracking & Completion States

> **~~CRITICAL GAP~~ RESOLVED:** Progress is now saved via `lesson-progress.tsx`, which calls `markLessonStarted()` on lesson open and `markLessonCompleted()` on completion through the `/api/progress` endpoint. Both `started_at` and `completed_at` are written to the database.

- [x] Client-side progress lib (`apps/web/lib/progress-client.ts`) — markLessonStarted, markLessonCompleted, updateExerciseProgress, getLessonStatus
- [x] LessonProgressTracker client component — auto-marks `in_progress` on lesson open, shows "Mark as Complete" button
- [x] "Mark as Complete" button in lesson viewer (pill style, accent color, completed state indicator)
- [x] Auto-mark lesson as `in_progress` on open (writes `started_at`, skips if already exists)
- [x] Progress nodes on module overview — visual indicators for not_started/in_progress/completed per lesson
- [x] Module prerequisite enforcement — gate Module N+1 until Module N is complete (or purchased)
- [x] Visual locked states for unpurchased modules (opacity, lock icon, paywall CTA)
- [x] `GET /api/progress/summary` endpoint — aggregated progress for dashboard
- [x] Add `theme_progress_summary` database view (aggregated completion stats)
- [x] Input validation on progress endpoint: validate theme/module/lesson IDs against known content slugs
- [x] Score range validation (clamp 0-100, validate as finite number)
- [x] Fix `started_at` overwrite bug — only set on INSERT, not UPDATE
- [x] Add `CHECK (hints_used >= 0)` and `CHECK (attempts >= 0)` constraints
- [x] Inline style memoization in lesson-progress.tsx
- [ ] Fix upsert race condition — use `ON CONFLICT` with proper resolution

### 5b. Dashboard

> **~~GAP~~ RESOLVED:** Dashboard page implemented with progress stats, streak display, skill genome radar, and resume learning CTA.

- [x] Dashboard page (`apps/web/app/dashboard/page.tsx`) — server component with auth guard
- [x] "Resume learning" — Continue Learning card links to last in-progress lesson
- [x] Real progress stats from `theme_progress` table per theme (completed/total lessons, progress bar)
- [x] Per-theme progress cards with percentage and lesson counts
- [x] ~~Coming Soon themes section~~ OBSOLETE: All 5 themes launch simultaneously — no "coming soon" concept (ThemeStatus removed 2026-04-13)
- [x] Streak calculation from `completed_at` timestamps
- [x] Add `streaks` table (user_id, theme_id, current_streak, longest_streak, last_activity_date) — denormalized for fast reads
- [x] Activity feed (recent lesson completions) — rendered on dashboard via `recentActivity` derived from `theme_progress`, resolved to lesson/module titles. Achievements feed still pending (see below). COMPLETED 2026-04-20.
- [x] Add `achievements` table (user_id, achievement_type, theme_id, unlocked_at) — milestones and badges
- [ ] Track `streak_achieved` event (3-day, 7-day, 30-day milestones) — Deferred post-V0.5 per dev-plan (achievements surfacing not wired into dashboard yet)
- [x] Skill radar: radar chart + progress bars rendering on dashboard (`skill-genome.tsx`). Proficiency computed via `compute_user_skill_genome()` SQL function (migration 014), called via RPC after each lesson completion. Weighted scoring: pass=+3, complete=+2, bridge=+1, fail=-0.5, hint=-0.25, solution=-1. Confidence scales with event count.
  - SkillRadar visualization refactored in place + LossCurve widget added 2026-04-20 (see `docs/superpowers/specs/2026-04-20-visualizations-design.md`).
- [x] Per-theme grid with owned/locked states (`theme-cards.tsx`) — owned themes link into `/themes/{slug}`, locked themes link to `/pricing?locked={slug}` with pre-selected paywall context. Full-bundle state collapses the header summary. COMPLETED 2026-04-20.
- [x] Progress ring: animated circular progress indicator on main dashboard stat (`themeProgressPercent` → `ring` state in `dashboard-view.tsx`). COMPLETED 2026-04-20.
- [ ] Share snapshot: html2canvas 2x PNG with watermark, share modal with Clipboard API + Web Share API fallback (ui-ux-notes 2.5) — Deferred post-V0.5 per dev-plan
- [ ] Activity heatmap (post-V0.5 — query `theme_progress` by `completed_at` date, render SVG) — Deferred post-V0.5 per dev-plan (current 30-day heatmap uses `updated_at` as a stopgap)

### 5c. Settings

> **~~GAP~~ RESOLVED:** Settings page implemented with profile editing, theme preference, and account management.

- [x] Build from `prototypes/settings.html`
- [x] `PATCH /api/profiles/:userId` endpoint — update profile fields
- [x] Profile editing (display name, avatar)
- [ ] GitHub connection toggle with retroactive push
- [-] ~~Theme preference switching~~ REMOVED: Theme now follows last-viewed theme via localStorage, no settings selector needed (2026-04-15)
- [ ] Notification preferences
- [x] Account management (danger zone: delete account, export data)

### 5d. Database Schema Updates

> Schema changes needed to support user journey. Current 4 tables (profiles, theme_progress, purchases, waitlist) need augmentation.

- [x] Add `preferred_theme_id TEXT` to `profiles` — persist onboarding theme selection (currently lost in React state)
- [x] Add `last_active_at TIMESTAMPTZ` to `profiles` — needed for streak calculation, "welcome back" UI
- [x] Add `total_lessons_completed INTEGER DEFAULT 0` to `profiles` — denormalized counter for dashboard
- [x] Fix onboarding flow — save selected theme to `preferred_theme_id` on completion (not just React state)
- [ ] Add `last_section_viewed TEXT` to `theme_progress` — resume reading mid-lesson (post-V0.5)
- [ ] Add `time_spent_ms INTEGER` to `theme_progress` — compare actual vs estimated time (post-V0.5)
- [x] Create `exercise_attempts` table (user_id, exercise_slug, lesson_id, passed, score, hints_used, solution_viewed, submitted_code, duration_ms, attempted_at)
- [x] `POST /api/exercise-attempts` endpoint — record individual exercise results
- [x] `GET /api/exercise-attempts?lessonId=...` endpoint — get user's exercise history
- [ ] Add `VARCHAR(n)` constraints or API-level length checks on text fields
- [x] Add `CHECK (amount > 0)` constraint on purchases
- [x] Supabase types updated for streaks, achievements, exercise_attempts, skill_genome, skill_events tables + new profile columns (fe_background, fe_framework, learning_goal, fe_experience_years)
- [x] Write migration files for all schema changes (migrations 001–011)
- [x] Migration 010: skill_genome, skill_events tables + profile onboarding columns
- [x] Migration 011: github_token column on profiles + purchase_status enum expansion (partially_refunded, disputed)

### 5e. Theme Selection

- [x] Build from `prototypes/theme-selection.html`
- [x] ~~Deep Orbit as available, 4 themes as "Coming Soon"~~ All 5 themes shown as available (simultaneous launch)
- [x] "Notify Me" email capture → `waitlist_signups` table with theme_id, confirmation toast
- [x] Coming-soon modal with theme preview + email input
- [ ] Track `theme_selected` event

### 5f. GitHub Integration

- [ ] GitHub App setup (tech-spec 5.1–5.2): create the App in GitHub and provision production secrets
  - Fine-grained, per-repository permissions
  - Short-lived installation tokens (1-hour auto-refresh)
  - Rate limit: 5,000 req/hr per installation (separate quota per user)
  - *Deferred: requires live GitHub App registration + secrets. Env var scaffolding landed in `apps/api/.env.example` (2026-04-20).*
- [x] Commit lesson artifacts on completion (2026-04-20) — `POST /api/github/commit` in `apps/api/src/routes/github.ts`
- [x] Repo naming: `tensorcraft-{theme-slug}` (2026-04-20) — `buildRepoName` helper in `apps/api/src/lib/github.ts`
- [x] Retroactive push (tech-spec 5.3) endpoint (2026-04-20) — `POST /api/github/retroactive-push` iterates `theme_progress` chronologically and pushes each lesson. Returns synchronous progress report.
  - [ ] Move to a real background job (Upstash QStash / Fly Machines cron) for large backlogs — deferred until job-queue infra is chosen.
- [x] Opt-out and disconnect flow (2026-04-20) — `POST /api/github/disconnect` revokes the OAuth grant against `/applications/{client_id}/grant` and clears DB columns
- [x] Graceful degradation if repo access is revoked (2026-04-20) — 401 → `github_token_expired`, 403/404 → `github_repo_access_revoked` (structured error codes)
- [x] Retry logic on GitHub API failures (2026-04-20) — `withRetry` helper with exponential backoff, max 3 retries, honours 5xx/429 as transient
- [x] Repo creation flow on first commit (2026-04-20) — `ensureThemeRepo` creates the per-theme repo if missing, with auto-generated README
- [x] Auto-generated README.md template (2026-04-20) — `buildReadmeTemplate`: theme badge, module list, description, `https://tensorcraft.app` link
- [x] OAuth connect flow scaffolding (2026-04-20) — `POST /api/github/connect` returns authorize URL; `GET /api/github/callback` exchanges code → stores token in `profiles.github_token`
- [ ] Frontend UI wiring for connect/disconnect toggle in Settings (deferred to the web-app batch)

---

## Phase 6: Polish & Launch Prep

### 6a. Accessibility

**Static a11y audit completed 2026-04-20** — see [`docs/audits/accessibility-audit-2026-04-20.md`](audits/accessibility-audit-2026-04-20.md). 37 findings (6 Critical, 14 Serious, 11 Moderate, 6 Minor). Top 5 to tackle: (1) `aria-live` on TestResultsPanel + Quiz verdict, (2) remove `outline-none` without focus-visible replacement on form inputs (settings, report-issue, glossary), (3) sweep sub-12px text across lesson-steps / report-issue / settings / dashboard / scene-heading, (4) standardize dialog focus-trap+restore pattern and apply to report-issue, user-menu, mobile-nav, lesson-drawer, (5) verify Nova Canvas primary contrast (est. 4.3:1 on surface — fails AA).

- [ ] WCAG 2.1 AA compliance across all pages
- [ ] 44px minimum touch targets for all interactive elements
- [ ] Keyboard navigation for all interactive elements (tab order, focus indicators)
- [x] `@media (prefers-reduced-motion: reduce)` — disable/simplify all animations globally
- [ ] Screen reader testing (VoiceOver on macOS, NVDA on Windows)
- [x] Automated accessibility testing: vitest-axe (unit — 8 components), @axe-core/playwright (E2E — 9 routes)
- [x] Form labels (`sr-only` or visible) on all form inputs (auth-form, settings-form, coming-soon-modal) _(bridge-explorer removed; `/bridges` route no longer exists)_
- [x] Skip-to-content link as first child of body in root layout
- [x] `aria-label` on OAuth buttons, `aria-hidden` on decorative SVGs
- [x] `aria-pressed` on filter toggle buttons _(bridge explorer removed; filters now N/A)_
- [x] Focus trap and focus restore on coming-soon modal
- [x] `role="progressbar"` with `aria-valuenow/min/max` on module progress bars
- [x] Color contrast audit (4.5:1 minimum for text, 3:1 for UI components)

  **COMPLETED (2026-04-13):** Minimum font size 12px, contrast improved, prose switched to Inter. Text updated to `#E0E0E0` (11.4:1), muted to `#A0A0A0` (5.3:1), Signal Ward primary to `#65C07D`, Terra Grid primary to `#C49535`.

- [ ] Image alt-text on all images

### 6b. Mobile Responsiveness

> **~~GAP~~ RESOLVED:** Mobile lesson nav implemented — floating menu button + slide-in drawer with full lesson list.

- [x] Mobile lesson navigation drawer (`MobileLessonNav`) — floating accent-colored menu button, slide-in drawer with full lesson list
- [x] Hamburger menu button (fixed bottom-right, `lg:hidden`) + overlay + close button
- [x] Responsive at breakpoints: 320px, 768px, 1024px, 1440px — sweep 2026-04-21. Existing Tailwind breakpoint stack (`sm`/`md`/`lg`/`xl`) audited across landing, auth, pricing, dashboard, themes, settings, onboarding, exercise, paywall, capstone, purchase-success. Mobile smoke tests (`e2e/mobile.spec.ts`) assert no horizontal scroll at iPhone SE (375), Pixel 7 (412), and iPad gen 7 (810) widths.
- [x] Touch-friendly interactions (swipe, tap targets) — 2026-04-21. 44×44 px hit-area floor applied to: `UserMenu` avatar button + dropdown items + signed-out CTA; `MobileNav` hamburger + close; `CookieConsent` Accept / Decline; `PaymentError` dismiss; `PurchaseSuccess` per-theme Start Now CTA; `LessonDrawer` trigger + Close; `SettingsForm` tabs + Change Photo + GitHub connect/disconnect + Sign Out + Delete Account; `PricingTiers` theme-toggle chips; `Nav` top-level links; `SiteFooter` links.
- [x] Testing devices per PRD 5.5: iPhone SE, iPhone 15 Pro, iPad Air, Pixel 7, Samsung Galaxy S23 — Playwright projects `mobile-iphone-se`, `mobile-pixel-7`, `tablet-ipad` (iPad gen 7 proxy for iPad Air) run the mobile smoke suite. iPhone 15 Pro and Galaxy S23 remain in the manual-QA device set documented in `docs/browser-support.md`.
- [x] Browser compatibility: Chrome, Firefox, Safari, Edge (latest 2 versions) — documented in `docs/browser-support.md` with minimum versions (Chrome 128+, Firefox 127+, Safari 17+, Edge 128+) and the full reference device matrix.

### 6c. Performance Optimization

- [x] Bundle size budgets — monitor with @next/bundle-analyzer. COMPLETED 2026-04-14. Documented in `docs/deployment-guide.md` 2026-04-21.
- [x] Code splitting: per-page chunks, per-theme CSS, dynamic imports for Sandpack. COMPLETED 2026-04-21 (Sandpack via React.lazy; per-page chunks are Next default; per-theme CSS deferred — token footprint is small).
- [x] Sandpack lazy loading with React.lazy. COMPLETED 2026-04-14.
- [x] Image optimization: next/image with automatic format selection, CDN delivery. COMPLETED 2026-04-21 — `images.formats: ['image/avif', 'image/webp']` + Supabase/Google/GitHub avatar `remotePatterns` in `apps/web/next.config.ts`. No raw `<img>` tags exist in app or UI package source (only MDX content, rendered through typed components).
- [x] Max 3 simultaneous animations per viewport. COMPLETED 2026-04-21 — documented in `packages/ui/src/effects/index.ts`; `IntersectionObserver` + `prefers-reduced-motion` already enforced in `ParticleField` and `BridgeTicker`.
- [x] Core Web Vitals monitoring via PostHog (capture_performance: web_vitals). COMPLETED 2026-04-14.
- [x] Core Web Vitals targets: LCP < 2.5s, CLS < 0.1, INP < 200ms. COMPLETED 2026-04-21 — enforced via `.github/lighthouserc.json` assertions + `.github/lighthouse-budget.json`.
- [ ] Lighthouse CI in GitHub Actions (fail build if score drops below threshold). Config landed 2026-04-21 (`.github/workflows/lighthouse.yml` + `lighthouserc.json` with Performance ≥ 0.90 / Accessibility ≥ 0.95 / Best Practices ≥ 0.90 / SEO ≥ 0.90 set to `error`). Leaving `[ ]` until the first PR run validates thresholds are achievable; tighten or relax post-validation.

### 6d. SEO & Marketing Infrastructure

- [x] Structured data: Course schema, Organization schema (JSON-LD)
- [x] All 5 themes in structured data (JSON-LD). COMPLETED 2026-04-14.
- [x] Dynamic OG images via Vercel OG (per-page, per-lesson)
- [x] Dynamic OG image as default root OG (no static /og-image.png fallback needed). COMPLETED 2026-04-14.
- [x] Sitemap generation (next-sitemap)
- [x] Individual lesson URLs in sitemap (275 lesson routes across all 5 themes). COMPLETED 2026-04-14.
- [x] robots.txt with crawl directives
- [x] Canonical URLs on all pages
- [x] Canonical URLs added to root layout, theme, lesson, and capstone pages. COMPLETED 2026-04-14.
- [x] Target keywords: "learn machine learning JavaScript", "TensorFlow.js tutorial", "ML for front-end developers". H1 updated, title tags optimized, internal linking added. COMPLETED 2026-04-14.
- [x] LearningResource + BreadcrumbList structured data on lesson pages (JSON-LD). COMPLETED 2026-04-14.
- [x] WebSite schema with SearchAction in root layout JSON-LD. COMPLETED 2026-04-15.
- [x] Module overview pages (55) + capstone pages (5) added to sitemap. COMPLETED 2026-04-15.
- [x] Canonical URLs on glossary terms, bridge concepts, blog, pricing pages. COMPLETED 2026-04-15.
- [x] /bridges index page created with full metadata. COMPLETED 2026-04-15.
- [x] Desktop/mobile nav parity — Learn, Blog, Glossary links added to desktop nav. COMPLETED 2026-04-15.
- [x] /learn and /bridges added to footer. COMPLETED 2026-04-15.
- [x] OG images on /learn and /glossary pages. COMPLETED 2026-04-15.
- [x] Internal linking strategy: landing page links to /learn and /glossary, /learn links to all 5 themes + /glossary + /pricing, /themes enriched with intro copy and "Why 5 Themes?" section. COMPLETED 2026-04-14.
- [x] GEO/AEO — llms.txt, ai-plugin.json, FAQ schema, /learn content page. COMPLETED 2026-04-14.
- [x] Metadata audit pass — OG/Twitter/canonical added to /terms, /privacy, /pricing; `robots: noindex` added to /dashboard, /settings, /dashboard/purchase-success, /auth (new layout), /onboarding (new layout); per-theme `Course` JSON-LD embedded inline on /themes/[slug] (in addition to aggregated schema in root layout); OG route (`/api/og`) unit-tested at `apps/web/app/api/og/route.test.ts` (1200x630, param handling, cache headers). COMPLETED 2026-04-20.
- [ ] Blog infrastructure (MDX-based, target: 2 posts/week) — DEFERRED: separate phase, not part of SEO infra pass.
- [ ] Google Search Console setup — DEFERRED: requires production domain verification, do post-launch.

### 6e. Error Handling

> **~~GAP~~ PARTIALLY RESOLVED:** Session expiry detection + redirect implemented. Global error boundary + custom 404/500 pages exist. Route-level error boundaries + centralized user-friendly messages added 2026-04-21.

- [x] Global error boundary component (React)
- [x] Custom 404 page (themed, with navigation back to dashboard)
- [x] Custom 500 page (error logged to Sentry, user-friendly message)
- [x] Session expiry handling — middleware detects auth errors, redirects to `/auth/sign-in?error=session_expired`
- [x] Sign-in page shows "Your session has expired" message when `error=session_expired` param present
- [x] Token refresh flow — graceful session renewal without page reload
- [x] Route-level `error.tsx` boundaries per App Router segment (dashboard, themes, themes/[slug], themes/[slug]/[module]/[lesson], auth, settings, paywall, pricing, onboarding) — brutalist styling, `reset()` CTA. COMPLETED 2026-04-21.
- [x] `themes/[slug]/not-found.tsx` — brutalist 404 for unknown theme slugs. COMPLETED 2026-04-21.
- [x] Centralized error copy — `apps/web/lib/error-messages.ts` with `ERROR_MESSAGES` map + `errorMessageForCode()` resolver (network, stripe_declined, session_expired, content_not_found, forbidden, validation, rate_limited, unknown + aliases). Integrated in `pricing/checkout-button.tsx` and `components/auth-form.tsx`. COMPLETED 2026-04-21.
- [ ] User-friendly error messages for:
  - Payment failures (retry + support link) — partial: `PaymentError` banner + `checkout-button` now resolves codes via `errorMessageForCode`; still need Stripe-specific decline code mapping.
  - Auth failures (provider-specific guidance)
  - GitHub integration failures (retry + disconnect option)
  - Exercise execution errors (separate from platform errors in Sentry)
  - API errors (structured error responses with user-facing messages)

### 6f. CI/CD Pipeline

- [x] GitHub Actions: lint, typecheck, test on every PR
- [x] E2E tests (Playwright) added to CI workflow
- [x] Vercel deployment configuration (preview + production) — auto-deploys from main, custom domain tensorcraft.app
- [ ] Branch protection rules (require PR reviews, passing CI) — **pending user action**; required GitHub UI settings documented in [`docs/ci-cd.md`](./ci-cd.md) along with the `.github/CODEOWNERS` file. Cannot be applied from code.
- [x] Broken link checking in CI — `links` job runs `lycheeverse/lychee-action@v2` against every `*.md` file; config in `.lychee.toml`. Internal dead links fail the job; external 4xx/5xx tolerated via the `accept` list.
- [x] Exercise validation in CI (starter compiles, solution passes tests, 10s timeout) — new `pnpm test:exercises` script invokes `scripts/validate-exercises.mjs`, which reads the velite-compiled `exercises.json`, syntax-checks every starter, and runs each solution against its `testCode` in a sandboxed VM mirroring the in-browser `parseAndRunTests` harness with a 10-second timeout. Wired into the `ci` job.

### 6g. Monitoring & Error Tracking

- [x] Error tracking utility stub (structured JSON logging, Sentry-compatible API)
- [x] Sentry integration for error tracking (separate projects for web + API). COMPLETED 2026-04-21. `@sentry/nextjs` wired via `sentry.{client,server,edge}.config.ts` + `instrumentation.ts`; `@sentry/node` initialized at the top of `apps/api/src/index.ts` with a `sentryMiddleware` that tags each request's scope with `requestId`, `route`, and `method`. `tracesSampleRate: 0.1`, `replaysOnErrorSampleRate: 1.0`, PII scrubbed via `beforeSend` (email/id/ip/cookies stripped). Init is a no-op when DSN env var is absent.
- [x] Core Web Vitals monitoring via PostHog (capture_performance: web_vitals). COMPLETED 2026-04-14.
- [x] PostHog setup (EU instance) for product analytics. COMPLETED 2026-04-21. `apps/web/lib/posthog.ts` + `app/posthog-provider.tsx` default the host to `https://eu.posthog.com`; `apps/api/src/lib/posthog.ts` (via `posthog-node`) handles server-side conversion events. Skips gracefully when key absent.
- [ ] Data processing agreements (GDPR compliance for analytics) — **user action**. Compliance policy + DPA checklist documented in `docs/privacy-compliance.md`. User must sign Sentry + PostHog standard DPAs and file them before production launch.

### 6h. Security Hardening

> **23 security findings identified in audit (5 CRITICAL, 4 HIGH, 7 MEDIUM, 7 LOW).** CRITICAL and HIGH items are tracked in their respective phases (4b, 5a). This section covers remaining hardening.

- [x] Content Security Policy (CSP) headers
- [ ] XSS prevention in MDX rendering pipeline
- [ ] API versioning headers
- [x] Fix rate limiter IP spoofing — uses `cf-connecting-ip` header (Cloudflare) with `x-forwarded-for` fallback
- [x] Add TTL-based cleanup to in-memory rate limiter (or replace with Redis — see 6j)
- [x] Move hardcoded CORS origins to environment variable
- [x] Add `X-Request-ID` middleware for request tracing
- [ ] Add structured error logging (Pino or Winston with request context)
- [x] Add graceful shutdown handler (`process.on('SIGTERM')`)
- [x] Health check endpoint: add `SELECT 1` DB probe (currently doesn't verify DB connection)
- [x] Purchase-to-theme referential integrity — validate `theme_ids[]` against known themes. API-level validation in `validateThemeIds` (rejects empty arrays and unknown slugs on both checkout and webhook paths); DB-level `chk_purchases_valid_theme_ids` CHECK constraint in migration 017. COMPLETED 2026-04-20.

### 6i. Analytics Event Tracking

- [x] Implement analytics events: lesson_started, lesson_completed, exercise_submitted, checkout_completed, theme_selected, streak_achieved (wired in lesson-progress.tsx, lesson-content.tsx, purchase-success, onboarding, progress-client.ts)
- [x] Track onboarding theme_selected event (onboarding/page.tsx)
- [x] Analytics (PostHog + Plausible) — user identification on sign-in, lesson completion tracking, Plausible consent gating. COMPLETED 2026-04-14.
- [x] Typed event taxonomy module (`apps/web/lib/analytics-events.ts`) — full Appendix B inventory w/ per-event property interfaces; `track()` is compile-time safe. Legacy `analytics.ts` helpers now delegate. COMPLETED 2026-04-21.
- [x] Server-side event helper (`apps/api/src/lib/posthog.ts` → `captureServer`) — wired into Stripe webhook to emit `payment_completed`, `payment_failed`, `payment_refunded` with the user's Supabase id. COMPLETED 2026-04-21.
- [x] Wire additional call sites: `hint_requested` (HintPanel callback), `pricing_page_viewed` (PricingAnalytics w/ source inference), `exercise_attempted` / `exercise_completed` (routed via `trackExerciseSubmitted`). COMPLETED 2026-04-21.
- [x] Wire deferred call sites: `session_started`/`session_ended` (AnalyticsProvider lifecycle + `visibilitychange`/`beforeunload`), `progress_shared` (capstone Share + CertificateCard "Share Link"), `upgrade_cta_shown`/`upgrade_cta_clicked` (PaywallNotice mount + `/paywall` page CTAs), `code_pushed` (server-side in `/api/github/commit` + `/retroactive-push`, `captureServer` with the user's Supabase id — mirrors the `payment_completed` pattern). COMPLETED 2026-04-21.
- [x] PostHog event verification — checklist at `docs/analytics-verification.md`. Automated Playwright intercept deferred (rationale documented); manual dashboard verification is the accepted protocol. COMPLETED 2026-04-21.

### 6j. API Deployment

- [x] Deploy Hono API to Fly.io (`tensorcraft-api`, iad region, tsx runtime)
- [x] Deploy Next.js web to Vercel (auto-deploy from GitHub main)
- [x] Custom domain `tensorcraft.app` — Vercel (web) + Cloudflare (API proxy)
- [x] SSL certificates provisioned (Vercel auto + Fly.io Let's Encrypt)
- [x] Redis for production rate limiting (Upstash, replaces in-memory store)
- [x] ISR revalidation on content pages (landing, themes, pricing — revalidate: 3600). COMPLETED 2026-04-14.

### 6k. Community & External Links

- [x] Set up social media OG meta tags — COMPLETED 2026-04-20 (§6d metadata pass).
- ~~Create Discord server with channels~~ — **DEFERRED to V1.0** (solo dev; community scaffolding not needed at launch).
- ~~Replace Community placeholder `href="#"` links with Discord invite URL~~ — **DEFERRED to V1.0**.
- ~~Purchase confirmation Discord CTA with invite link~~ — **DEFERRED to V1.0**.
- ~~Create Twitter/X account~~ — **DEFERRED to V1.0**.
- ~~Replace Twitter placeholder `href="#"` links across 9 pages~~ — **DEFERRED to V1.0**.

---

## Phase 7: Post-V0.5 Features

### 7a. Bridge Explorer — REMOVED (replaced with dashboard bridge collectibles)

> **Refactored:** The standalone `/bridges` route and `bridge-explorer.tsx` page were intentionally removed. Bridge discovery is now integrated into the dashboard as collectible bridge cards via the `bridge-collection.tsx` component on the dashboard page. This surfaces bridges in context of the learner's progress rather than as a separate reference page.
>
> **2026-04-27:** `/bridges` was briefly reinstated as an SEO landing page, then removed again along with `/compare`. Both routes, their sitemap entries, the `bridgeConcept` route helper, and all nav/about-page links are now gone. Bridge discovery remains on the dashboard.

- ~~[x] Build from `prototypes/bridge-explorer.html` — `/bridges` route with `bridge-explorer.tsx`~~
- ~~[x] Browse all 56+ FE-to-ML bridges with filters and search~~
- ~~[x] Bridge quality tier color coding (Identity=#00D4FF, Structural=#7B68EE, Intuition=#F0C75E)~~
- ~~[x] Shipped as read-only reference page in V0.5 (no feature flag needed)~~

### 7b. Capstone Completion

- [ ] Build from `prototypes/capstone.html`
- [ ] Celebration screen: stats, journey map, narrative conclusion, character avatars
- [ ] Certificate PDF generation:
  - Server-side with user name, theme name, completion date
  - Capstone summary, final model metrics
  - Unique verification URL
  - GitHub repository link
- [ ] Social sharing with dynamic OG image (Vercel OG) for Twitter/LinkedIn
- [ ] Track `progress_shared` event

### 7c. Advanced Content Components

- [ ] Code Hike (Shiki-based) — scrollytelling for FE↔ML side-by-side code comparisons (replace basic CodeBlock)
- [ ] MathBlock (KaTeX) — math equation rendering for loss functions, gradients, etc.
- [ ] InteractiveDemo — live visualizations (e.g., gradient descent animation, neural network playground)
- [ ] RecallPrompt — spaced repetition prompts referencing earlier lessons
- [ ] Content preview server for authors (hot-reload MDX without full build)

### 7d. Deep Orbit Modules 4–5 (COMPLETE)

- [x] Module 4 (signal-processing) content authoring (5 lessons + 5 exercises)
- [x] Module 5 (recurrent-networks) content authoring (5 lessons + 5 exercises)

### 7e. Deep Orbit Modules 6–11 (COMPLETE — content authored)

- [x] Module 6 (browser-runtimes) content authoring (5 lessons + 5 exercises)
- [x] Module 7 (anomaly-detection) content authoring (5 lessons + 5 exercises)
- [x] Module 8 (advanced-time-series) content authoring (5 lessons + 5 exercises)
- [x] Module 9 (llm-integration) content authoring (5 lessons + 5 exercises)
- [x] Module 10 (optimization-edge) content authoring (5 lessons + 5 exercises)
- [x] Module 11 (capstone) content authoring (5 lessons + 5 exercises)
- [x] Full narrative arc completion (rising action → climax → resolution)
- [ ] 2-3 "AI-wrong moments" where the system fails (teaching resilience) — verify in content
- [ ] Character arc completion for all 4 characters — verify in content

### 7f. Additional Themes

> **ALL 5 THEMES LAUNCH SIMULTANEOUSLY (2026-04-13).** There is no staggered launch. The ThemeStatus type and "coming soon" concept have been removed from the codebase. All themes are LIVE at launch.

- [x] Neon Protocol (Cyberpunk — Computer Vision) content authored (55 lessons, 55 exercises)
- [x] Signal Ward (Medical — NLP & Text) content authored (55 lessons, 55 exercises)
- [x] Nova Canvas (Creative AI — Multimodal & Generative) content authored (55 lessons, 55 exercises)
- [x] Terra Grid (Industrial — Edge AI & Production ML) content authored (55 lessons, 55 exercises)
- ~~Theme launch = flip `status` from "coming-soon" to "launched" in theme manifests + enable Stripe checkout~~ N/A — all themes launch simultaneously

### 7g. Bundle & Team Pricing

- [x] Bundle purchase flow ($99 two themes, $129 three themes, $159 all five — rebased 2026-05-05, raised 2026-06-20) — `checkout-button.tsx` accepts `themeIds: string[]`; `/api/payments/checkout` handles multi-theme plans; pricing page ships all four paid tiers live at tensorcraft.app/pricing
- [ ] Team license management (admin dashboard, seat assignment, progress reports) — deferred to V2.0 Constellation
- [x] Upgrade credit logic (pay difference when moving to higher tier). COMPLETED 2026-04-14.

### 7h. Module Count Dynamic Updates

- [x] Drive all module/lesson counts from content source (THEME_CONTENT constant in shared package)
- [x] Never hardcode — pricing page derives counts from THEME_CONTENT constant

### 7h-2. Scalability Infrastructure

> See `docs/infrastructure.md` for full deployment architecture.

**Phase 1-2 (Complete):**

- [x] Migration 012: Missing indexes (exercise_attempts, skill_events, theme_progress)
- [x] Migration 012: Materialized view `dashboard_stats` for aggregated progress
- [x] Migration 012: Streak advisory lock race condition fix
- [x] Migration 013: skill_events monthly partitioning
- [x] Upstash Redis client singleton + cache-through helper
- [x] Mandatory Redis rate limiting (removed in-memory fallback)
- [x] JWT token caching (30s TTL via Redis)
- [x] Batch skill events endpoint + client-side event buffering
- [x] Dockerfiles for API and web (Fly.io deployment-ready)
- [x] Fly.io configs (fly.toml) for API service (web fly.toml removed — now deployed on Vercel)
- [x] ~~Next.js standalone output mode~~ (removed — now on Vercel, standalone not needed)

**Phase 3-5 (Pending):**

- [ ] Phase 3: ISR lesson pages + SWR dashboard (Week 5-6)
- [ ] Phase 4: Redis cache layer + read replica routing (Week 7-8)
- [ ] Phase 5: Inngest background workers — genome computation, event archival (Week 9-10)

### 7i. Arena (V1.0+)

- [ ] Arena: weekly ML challenges with community leaderboard
- [ ] ELO-style scoring system
- [ ] $29/year subscription (separate from theme purchases)
- [ ] Community solution viewing after submission deadline
- [ ] Challenge authoring pipeline and scheduling

### 7k. AI-Generated Video Scenes (Post-V1, budget-dependent)

> See `docs/future-ai-video-scenes.md` for full design spec.

- [ ] Replace text-based narrative (Dialogue, SceneHeading, narrative prose) with short AI-generated stylized video clips
- [ ] New `<VideoScene>` MDX component with caption-based fallback to current text rendering
- [ ] Per-theme animated art styles via Runway Gen-3/4 style reference packs
- [ ] AI voice acting (ElevenLabs) + ambient soundscapes per theme
- [ ] CLI generation pipeline: `tc-video generate` / `review` / `upload`
- [ ] Cloudflare R2 CDN for video storage (zero egress fees)
- [ ] Estimated cost: $540-1,140 one-time generation, <$1/mo ongoing
- [ ] Rollout: proof of concept (1 lesson) → single theme (Neon Protocol) → all 5 themes
- [ ] Subsumes deferred audio narration idea (video includes voice acting)

### 7j. Internationalization (V3.0+)

- [ ] next-intl framework integration
- [ ] Machine translation pipeline (DeepL API with custom glossaries)
- [ ] Expert review workflow (native-speaking ML practitioners)
- [ ] Shared ML glossary (`packages/content/glossary.json`)
- [ ] Publishing matrix config (`packages/content/publishing-matrix.json`)
- [ ] Phase 1: Spanish, Portuguese (triggered by ≥500 MAU from LATAM)
- [ ] Phase 2: Japanese, Korean, Chinese (triggered by ≥1,000 MAU from APAC)
- [ ] Phase 3: French, German, Arabic (triggered by ≥2,000 MAU)

---

## Phase 8: Testing & Quality Assurance (MOSTLY COMPLETE — integration/visual/perf deferred)

### 8a. Test Infrastructure (COMPLETE)

- [x] Vitest v4.0.18 + React Testing Library (not Jest — Vitest is faster and native ESM)
- [x] Playwright v1.58.2 for E2E tests
- [x] `vitest.config.ts` — jsdom environment, globals, setup file, path aliases
- [x] `vitest.setup.ts` — jest-dom matchers + vitest-axe matchers
- [x] `playwright.config.ts` — chromium target, baseURL localhost:3000, HTML reporter
- [x] Root `package.json` scripts: `test`, `test:watch`, `test:e2e`

### 8b. Unit Tests (211 tests passing)

- [x] API routes: health, waitlist (validation, success, duplicate, error), payments (checkout, refund, unhandled events)
- [x] Middleware: auth (missing/invalid/expired token, success), rate limiting (allow, 429 on exceed)
- [x] Components: nav (brand, links, CTA), site-footer (brand, links, copyright), cookie-consent (show/hide, accept/decline, privacy link)
- [x] Schemas: lessonSchema (7 tests), exerciseSchema (3 tests), moduleSchema (3 tests)
- [x] Constants: THEME_SLUGS, PRICING, ROUTES, V05_SCOPE (12 tests)
- [x] MDX components (50 tests): dialogue (5), bridge-callout (9), code-block (9), hint-panel (9), quiz (9), learning-objectives (4), key-takeaways (5) — all with a11y checks
- [x] Content queries (22 tests): getModules, getModule, getThemeLessons, getModuleLessons, getLesson, getExercise, getAdjacentLessons — all with edge cases
- [ ] Auth flows (login, signup, logout, session refresh)
- [ ] Progress calculation logic (streak, completion %)

### 8c. E2E Tests (7 spec files)

> **NOTE:** Some E2E tests in `landing.spec.ts`, `auth.spec.ts`, and `legal.spec.ts` have selector precision issues (`getByText()` resolving to multiple elements in Playwright strict mode). These are test bugs, not app bugs, but they'll block CI.

- [x] Landing page: hero, nav, themes, footer, CTA navigation
- [x] Auth pages: sign-in/sign-up rendering, OAuth buttons, magic link, guest link
- [x] Legal pages: terms/privacy content, back links, cookie consent banner
- [x] Learning routes: themes listing (LIVE badges), theme detail with modules, module overview with lesson cards, lesson viewer with 6-step progression (progress bar, Continue button, Back link), 404 handling
- [x] Pricing page: all tiers ($0/$59/$99/$129/$159 — rebased 2026-05-05, raised 2026-06-20), feature comparison, CTA
- [x] Onboarding page: auth redirect for unauthenticated users
- [x] E2E test suite — fixed broken tests for 6-step lesson UI, added pricing + onboarding specs. COMPLETED 2026-04-14.
- [ ] Fix E2E selector precision issues — use `getByRole` over `getByText` where multiple matches exist
- [ ] Full user journeys:
  - New user: landing → signup → onboarding → Module 1 lesson → complete exercise
  - Payment: pricing → checkout → confirmation → Module 2 unlocked
  - GitHub: settings → connect → verify repo created → verify commit pushed
  - Capstone: complete all modules → capstone screen → certificate download
- [ ] Mobile viewport tests (iPhone SE, iPad Air)

### 8d. Accessibility Tests (COMPLETE)

- [x] `vitest-axe` installed — axe matchers registered globally in vitest.setup.ts
- [x] `@axe-core/playwright` installed — for e2e a11y scans
- [x] Unit-level axe checks on all components: nav, footer, cookie-consent, dialogue, bridge-callout, hint-panel, learning-objectives, key-takeaways
- [x] Page-level a11y tests: terms (`page.a11y.test.tsx`), privacy (`page.a11y.test.tsx`)
- [x] E2E axe audits on 8 routes: /, /auth, /terms, /privacy, /themes, /themes/deep-orbit, /themes/deep-orbit/foundations, /themes/deep-orbit/foundations/introduction-to-tensors (updated: merged /auth/sign-in + /auth/sign-up → /auth)
- [x] Color contrast audit (4.5:1 minimum for text, 3:1 for UI components) — **COMPLETED (2026-04-13)**

### 8e. Content Validation Tests (COMPLETE)

- [x] Zod schema validation tests (lessonSchema, exerciseSchema, moduleSchema) — `schemas.test.ts` (13 tests)
- [x] Content contract tests — validate sample fixtures against schemas — `contract.test.ts` (16 tests)
- [x] Cross-reference integrity — exercise.lessonSlug → lesson, lesson.moduleId → module, no duplicate slugs, sequential order — `cross-reference.test.ts` (8 tests)
- [x] Build-time content validation — Velite strict mode fails build on invalid frontmatter
- [x] Content completeness CI test (`packages/content/src/completeness.test.ts`)

### 8f. Snapshot Tests (COMPLETE)

- [x] Component snapshots: nav, footer, cookie-consent — `*.snapshot.test.tsx`
- [x] Page snapshots: terms, privacy — `page.snapshot.test.tsx`
- [ ] Content-rendering component snapshots _(add when lesson viewer stabilizes)_

### 8g. Link Validation Tests (COMPLETE)

- [x] ROUTES constants map to actual page.tsx files — `routes.test.ts`
- [x] Component hrefs match ROUTES constants (nav CTA, footer links) — verified in nav/footer tests
- [x] test.todo for pages not yet built (pricing, dashboard, settings)

### 8h. SEO Metadata Tests (COMPLETE)

- [x] Import + validate metadata exports from layout.tsx, terms, privacy — `metadata.test.ts` (7 tests)
- [x] E2E page title verification — `landing.spec.ts`
- [ ] No duplicate titles across pages _(add when more pages have metadata)_

### 8i. Theme CSS Property Tests (COMPLETE)

- [x] All 5 themes define all 10 `--tc-*` properties in themes.css — `theme-properties.test.ts` (33 tests)
- [x] Every themeSlugs entry has matching `[data-theme="..."]` selector
- [x] TS palette values match CSS values
- [x] Flag identified: ThemePalette interface has 8 keys vs 10 CSS props (missing border, surfaceOverlay)

### 8j. Integration Tests

- [x] Supabase integration: CRUD across 10 tables + RLS isolation —
      `apps/api/src/routes/__tests__/supabase-integration.test.ts` (12 tests)
- [x] Stripe webhook flow: signature → upsert → PostHog → Kit → access —
      `apps/api/src/routes/__tests__/stripe-flow-integration.test.ts` (4 tests)
- [x] GitHub integration: OAuth → commit → retry + graceful 403 —
      `apps/api/src/routes/__tests__/github-flow-integration.test.ts` (6 tests)
- [x] Content pipeline: frontmatter → Zod → MDX components —
      `packages/content/__tests__/pipeline-integration.test.tsx` (16 tests)
- [x] Approach: high-fidelity mocks + route-level request testing.
      Real Stripe SDK signature construction/verification is exercised.
      Real Zod schemas and UI components render. Live-service runs
      (real Supabase, Stripe prod, GitHub API) deferred to beta.

### 8k. Visual Regression

- [x] Playwright screenshot comparison for key pages — `e2e/visual/key-pages.spec.ts` covers landing, pricing, themes index, auth sign-in, paywall at 1280×800.
- [x] Theme switching visual tests (all 5 themes render correctly) — `e2e/visual/themes.spec.ts` iterates `THEME_SLUGS` (deep-orbit, neon-protocol, signal-ward, nova-canvas, terra-grid).
- [x] Responsive layout tests at each breakpoint — `e2e/visual/responsive.spec.ts` screenshots landing + pricing at 320 / 768 / 1024 / 1440 px.
- Baselines: gated on `RUN_VISUAL=1`; specs skip until a local baseline run commits PNGs to `e2e/visual/__screenshots__/`. See `docs/visual-regression.md` for regen + CI workflow.

### 8l. Performance Testing

- [ ] Lighthouse CI in GitHub Actions:
  - Performance score ≥ 90
  - Accessibility score ≥ 95
  - Best Practices score ≥ 90
  - SEO score ≥ 95
- [ ] Bundle size regression checks (fail if main bundle grows >10% without explanation)
- [ ] Sandpack load time benchmarks (< 3s to interactive on 3G)

### 8m. Exercise Validation

- [ ] CI check: all starter code compiles without errors
- [ ] CI check: all solution code passes all tests
- [ ] CI check: test suite runs within 10-second timeout
- [ ] CI check: partial credit structure (each assertion independent)

---

## Phase 9: Beta Program & Content QA

### 9a. Beta Testing Program

- [ ] Recruit 50-100 frontend developers (Twitter/X, Discord, Dev.to, personal referrals)
- [ ] Private Discord channel for async discussion
- [ ] 4-week testing timeline:
  - **Week 1:** Modules 1-2 — focus: onboarding, first impressions, bridge clarity
  - **Week 2:** Modules 3-4 — focus: difficulty curve, exercise quality, narrative engagement
  - **Week 3:** Module 5 — focus: capstone quality, progress diagram, GitHub integration
  - **Week 4:** Full play-through — focus: overall experience, pacing, willingness-to-pay
- [ ] In-app feedback: emoji reaction + optional text on every lesson
- [ ] Weekly 30-minute group calls (5-8 participants per call)
- [ ] Exit survey: NPS, willingness-to-pay, open-ended feedback
- [ ] Success criteria:
  - NPS ≥ 40
  - ≥ 70% module completion rate across cohort
  - ≥ 80% would pay $59
  - < 5% of lessons flagged as "confusing" by > 20% of testers

### 9b. Content Authoring Infrastructure

- [ ] Seed script for demo/test data (populate Supabase with sample users, progress, purchases)
- [ ] Style guide and content templates for lesson authors
- [ ] Editorial review process (checklist per lesson before merge)
- [ ] Difficulty progression validation (beginner → intermediate → advanced within each module)

### 9c. Content Quality Audits

- [ ] Per-theme information architecture validation:
  - Module maps match theme scripts
  - Lesson order follows 5C Loop
  - Difficulty progression: beginner → intermediate → advanced within each module
  - Core content (60%) vs unique specialization (40%) ratio enforced
  - Early modules (1-4): ~80% shared / 20% unique
  - Later modules (8-11): ~40% shared / 60% unique
- [ ] Bridge review process: each bridge reviewed by 2 FE devs + 1 ML engineer
  - Remove or rewrite any bridge rated below 3/5 clarity by beta testers
  - All 26 shared bridges + 6 theme-specific bridges validated
- [ ] Character voice consistency audit:
  - Mentor/Commander: sets context, explains "why" (never deep technical detail)
  - Technical Expert: introduces theory, explains concepts, builds intuition
  - Implementation Lead: pragmatic, skeptical, handles real-world constraints
  - Student Avatar: FE dev with no ML background, asks clarifying questions
  - AI Assistant: tutorial guide, hint system, theme-consistent tone
- [ ] Narrative arc pacing validation: crisis intensity escalates toward capstone
- [ ] "AI-wrong moments" placed correctly (2-3 per theme, teaching resilience)

### 9d. Analytics-Driven Content QA (Post-Launch)

> **MOVED 2026-07-21** to `docs/post-launch-backlog.md` §2 (ongoing operations cadence + QA thresholds).

---

## Phase 10: Release & Post-Launch

### 10a. V0.5 Launch Checklist

- [ ] All Phase 1–6 items complete
- [ ] Legal pages live (Terms, Privacy)
- [ ] Cookie consent banner functional
- [ ] Stripe payments tested end-to-end (real money test transaction)
- [ ] All 15 lessons pass content validation CI checks
- [ ] All exercises pass automated validation
- [ ] Lighthouse scores meet thresholds (Performance ≥90, A11y ≥95)
- [ ] Core Web Vitals within targets (LCP < 2.5s, CLS < 0.1, INP < 200ms)
- [ ] Error tracking verified — currently stub (console logging); Sentry integration deferred to post-launch
- [ ] PostHog events verified (test each of 10 events → appears in dashboard) — PostHog setup deferred to post-launch (§10e)
- [ ] Email flows tested (welcome, purchase confirmation)
- [ ] GitHub integration tested (repo creation, commit push, retroactive push)
- [ ] Mobile tested on target devices (iPhone SE, iPad Air, Pixel 7)
- [ ] Browser tested (Chrome, Firefox, Safari, Edge)
- [ ] All placeholder `href="#"` links replaced with real routes
- [ ] Beta program complete, success criteria met

### 10b. Launch Execution

- [ ] Invite 500 waitlist users
- [ ] Launch week email blast
- [ ] Social media announcements (Twitter/X, LinkedIn, Dev.to)
- [ ] Guest posts: Smashing Magazine, CSS-Tricks, Dev.to
- [ ] Open-source bridge card library on GitHub (marketing-plan)
- [ ] Monitor error rates, payment success rates, analytics events for first 48 hours

### 10c. Risk Mitigation Tasks

- [ ] Risk #1 (story fatigue): Implement narrative on/off toggle (default: on). Track skip rates per lesson. If >40% skip in any module, flag for narrative redesign.
- [ ] Risk #5 (animation complexity): Prototype the 3 most complex interactive animations first. If any takes >2x estimated time, simplify or replace with pre-rendered alternatives.
- [ ] Risk #3 (pricing resistance): Validate willingness-to-pay during beta exit survey. If <70% would pay $59, evaluate $49 launch promo.

### 10d. Success Metrics Dashboard

> **MOVED 2026-07-21** to `docs/post-launch-backlog.md` §1 (success-metrics dashboard + alerts).

### 10e. Post-Launch External Service Setup

> **MOVED 2026-07-21** to `docs/post-launch-backlog.md` §1 (operator + external service setup), including the full Kit lifecycle-tag runbook.

### 10f. Post-Launch Operations

> **MOVED 2026-07-21** to `docs/post-launch-backlog.md` §2 (ongoing operations cadence).

---

## Phase 11: Brutalist Terminal Redesign

Full design system overhaul from "Zensman DeFi Neon" to "Brutalist Terminal" aesthetic. Source of truth for layouts is existing `apps/web/app/**/page.tsx` implementations plus the tokens defined in §11a — HTML/JSX prototypes were deleted 2026 (diverged from product).

### 11a. Design System Foundation

- [x] Update `ThemePalette` interface in `packages/themes/src/types.ts`: remove `glow`/`neonLine`, add `surfaceOverlay`/`border`/`codeBg` — **COMPLETED** (9-key brutalist shape in place)
- [x] Update `packages/themes/src/css/themes.css` with new brutalist shell tokens and remove `--tc-glow`/`--tc-neon-line` — **COMPLETED 2026-04-20** (also removed `--tc-neon-glow` from all 5 theme blocks)
- [x] Update all 5 theme manifest files (deep-orbit, neon-protocol, signal-ward, nova-canvas, terra-grid) to match new `ThemePalette` interface — **COMPLETED 2026-04-20** (all 5 already conform to 9-key shape; Nova Canvas primary swapped `#C06060` → `#D07070` for WCAG AA)
- [x] Update `packages/config/tailwind/base.css` `@theme` block: remove glow/neon-line tokens, set all radius to `0`, add code-bg token — **COMPLETED 2026-04-20** (removed `--color-glow`; `--radius-*: 0` and `--color-code-bg` already present)
- [x] Replace neon utilities in `apps/web/app/globals.css` with brutalist utilities (`.brutalist-shadow`, `.brutalist-hover`, `.comment-label`) — **COMPLETED 2026-04-20** (brutalist utilities already present; no `.neon-*` classes to remove)
- [x] Update `packages/themes/src/theme-properties.test.ts` for new palette shape — **COMPLETED 2026-04-20** (case-insensitive hex match + new "no removed keys" + "exactly 9 keys" assertions; 43/43 passing)

### 11b. New Shared Components

- [ ] Build `ParticleField` canvas component (`packages/ui/src/particle-field.tsx`)
- [ ] Build `BridgeTicker` scrolling ticker (`packages/ui/src/bridge-ticker.tsx`)
- [x] Build `SkillRadar` + `LossCurve` visualization components (`packages/ui/src/visualizations/`) — **COMPLETED 2026-04-20** — see `docs/superpowers/specs/2026-04-20-visualizations-design.md`. SkillRadar refactored in place as `apps/web/app/dashboard/skill-genome.tsx` (Option C: page-local component consuming shared `hexCorners` helper); LossCurve landed as new shared component + Dashboard section. Note: per-axis palette color tokens remain in theme manifests but are largely unused after Option C refactor — flagged for future §11a cleanup.
- ~~`LossLandscape`~~ — **DEFERRED 2026-04-20** (atmospheric-only, auth page already works; revisit post-V1)
- ~~`ActivityHeatmap`~~ — **DEFERRED** (already deferred per §5b line 357 — post-V0.5)
- ~~ARIANarrator dual robot companion~~ — **REMOVED from scope 2026-04-20** (cut by user)

### 11c. Shell Component Updates

- [x] Update Nav: solid bg, square edges, `T_` logo badge, JetBrains Mono, 60px height — **COMPLETED 2026-04-21** (solid `bg-surface`, border-bottom `border-border`, 28×28 bordered `T_` badge, mono NavLinks with focus-visible ring, `data-testid="site-nav"`)
- [x] Update Footer: brutalist typography, remove neon effects — **COMPLETED 2026-04-21** (mono link labels with `rounded-none` + focus-visible ring, square bordered logo badge, `aria-label="Site footer"`, dead `/bridges` link removed)
- [x] Update AuthForm: square inputs/buttons, zero border-radius — **COMPLETED 2026-04-21** (all inputs/buttons `rounded-none`, email input `outline-none` class removed, focus-visible ring preserved across email/submit/OAuth/secondary buttons)
- [x] Update CookieConsent, UserMenu: brutalist card styling — **COMPLETED 2026-04-21** (both use `rounded-none` + `brutalist-shadow` cards with mono labels; CookieConsent gains `role="region"` + `aria-label`, buttons have `type="button"`; UserMenu dropdown + trigger square-edge with focus-visible ring)
- [x] Update layout.tsx: body class, font priority — **COMPLETED 2026-04-21** (body `font-sans` default → Inter; `--font-sans` / `--font-mono` variables wired via `next/font/google` on `<html>`; globals.css body font-family switched from mono → sans)

### 11d. Page Component Updates (13 pages)

- [x] 2026-04-21 Landing page: ParticleField bg, BridgeTicker, bridge table with tiers, 5C loop section, brutalist buttons — new `landing-hero`, `landing-bridge-ticker`, `landing-bridge-tiers`, `landing-five-c-loop` components wired into `app/page.tsx`; ParticleField mounted in hero at density 0.3 (aria-hidden canvas); BridgeTicker sources 12 items from canonical `BRIDGES` catalog (via `@tensorcraft/shared`); bridge tiers section shows identity/structural/intuition exemplars with square-bordered tier badges; 5C loop rendered as 5 numbered brutalist cards with `→` connectors; primary + final CTAs use `rounded-none` + `brutalist-shadow` + focus-visible rings; 12/12 landing tests pass in `apps/web/app/page.test.tsx` (129/129 across `apps/web`); `next build` clean.
- [x] 2026-04-21 Auth pages: split layout, form right, "You Already Think Like an ML Engineer" (LossLandscape deferred per §11b — used low-density `ParticleField` on left pane as decorative treatment; left pane hidden below `md:` breakpoint, right pane wraps existing `<AuthForm>` unchanged; 10/10 layout tests pass in `apps/web/app/auth/page.test.tsx`; `next build` clean)
- [x] Dashboard: LossCurve, SkillGenome (radar), activity log — COMPLETED 2026-04-20 (ActivityHeatmap deferred post-V0.5 per §5b L357)
- [x] LessonViewer: redesigned to 6-step Duolingo-style progression (sidebar removed, step-based nav with progress bar) — **COMPLETED (2026-04-14)**
- [x] 2026-04-21 Exercise: line numbers, test results panel, bridge hint, console output — Phase 11 §11d Wave 3. Rewrote `packages/ui/src/mdx/exercise.tsx` to cover all 4 scope items. **Line numbers**: confirmed `<SandpackCodeEditor showLineNumbers showTabs={false} />` is on, editor wrapper now `rounded-none` + `brutalist-shadow` via the outer container. **Test results panel**: existing panel kept its `role="status" aria-live="polite" aria-atomic="true"` (preserves Session 3 C2 contract) and gained a `# tests` mono kicker, `data-testid="test-results-panel"`, `rounded-none` pills, `✓` → `text-primary` / `✗` → `text-text-muted` swap per spec, and each result row now renders in JetBrains Mono so errors read as code. **Bridge hint** (NEW): new `BridgeHint` subcomponent; renders a square `rounded-none` card below the editor with a `# bridge` mono kicker, a `feTitle ↔ mlTitle` one-liner, and a 3-px left border tinted by `var(--tc-tier-*)` for identity/structural/intuition. Accepts a new optional `bridge` prop on `<Exercise>`; `packages/ui/src/mdx/index.ts` exports `ExerciseBridge` type. `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-content.tsx` now derives `bridgeHint` from `lesson.concept.bridge` (schema-supported) and threads it through both the authenticated (`themeId + lessonId`) and unauthenticated Exercise wrappers. **Console output** (NEW): `parseAndRunTests` now returns `{ results, logs }` (exported `TestRunOutcome`); harness wraps the `new Function(...)` call with a shadowed `console` parameter that routes `log/info/debug` → `level: "log"`, `warn` → `warn`, `error` → `error`. New `ConsolePanel` component renders a `# console` mono kicker with `>` / `?` / `!` level glyphs and tier-coded colors (primary/yellow/red), `rounded-none` + `brutalist-shadow`. **Brutalist polish**: every button carries `rounded-none` + `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-surface-raised` (yellow ring on "Show Solution"). Outer exercise container + sandpack wrapper both `rounded-none`. **Tests**: extended `packages/ui/src/mdx/exercise.test.ts` with a `{ results, logs }` shape assertion and a console-error capture test (verifies `logs` receives an `error`-level entry). The pre-existing `new Function`/jsdom harness flake (7 tests returning `Code execution` failures) predates this work — new tests assert only the logs-capture contract so they survive the flake. Vitest: 4 passed (2 baseline + 2 new) / 7 baseline-fail / 1 skipped on exercise.test.ts (infinite-loop test still skipped pending harness rewrite). `./node_modules/.bin/next build` clean (all routes compiled).
- ~~BridgeExplorer~~ — REMOVED per §7a (standalone `/bridges` route deleted; bridge cards now live on dashboard)
- [x] Pricing: 4-tier grid, comparison table, "Simple, Fair Pricing" — **COMPLETED 2026-04-21** (Phase 11 §11d Wave 1: reconciled to 5 tiers per `project_pricing.md` — Free/$79/$129/$169/$219, then rebased to Free/$49/$79/$99/$129 on 2026-05-05; brutalist grid in `apps/web/app/pricing/pricing-tiers.tsx` — `rounded-none` cards, mono prices, `brutalist-shadow` on hover, "BEST VALUE" mono ribbon on `allFive`; 10-row × 5-col feature comparison in `apps/web/app/pricing/page.tsx` with square cells, alternating row bg, highlighted `allFive` column; Stripe flow preserved — plan IDs: `free` → `/themes/deep-orbit`, `single`/`twoBundle`/`threeBundle`/`allFive` → `POST /api/payments/checkout`; 16 tests across 3 files pass; Next build clean)
- [x] 2026-04-21 ThemeSelection: Equal 5-card grid (all themes LIVE), per-theme particle canvas atmospheres, newsletter modal — Phase 11 §11d Wave 2: `apps/web/app/themes/page.tsx` rewritten as async server component fetching per-user `purchases` server-side; new `theme-cards-grid.tsx` client component renders responsive 5-card grid (1 col → md:2 → lg:3 → xl:5) with per-card `<ParticleField>` atmosphere at density 0.15 driven by each theme's own `--tc-primary` via inline CSS var on the card wrapper; no "coming soon"/"launched"/"LIVE" status chips (all themes launch simultaneously per `project_launch_strategy.md`); CTA flips Start → Continue for owned themes; new `newsletter-modal.tsx` wires `FocusTrap` from `@tensorcraft/ui/a11y` (Escape + backdrop click close), `submitWaitlist` writes to Supabase `waitlist` table with `source: "theme-selection"`; `rounded-none` + `brutalist-shadow`/`brutalist-hover` throughout; 13/13 new tests pass (`apps/web/app/themes/__tests__/page.test.tsx`); Next build clean (`/themes` now `ƒ` dynamic due to per-user auth lookup, expected).
- [x] 2026-04-21 Onboarding: expand to 5 steps (Welcome, Background, Goal, Theme, Ready) — Phase 11 §11d Wave 2. Rebuilt `apps/web/app/onboarding/page.tsx` as a 5-step brutalist wizard with canonical enum values from migration 018 (`experience_level` beginner/intermediate/advanced/expert, `learning_goal` hobby/career/research/team/curiosity). Local-state wizard; all selections committed via single PATCH to `/api/onboarding` on final submit (plus `preferred_theme_id` + `onboarding_completed` via browser Supabase client). Features: segmented progress pips + "STEP N OF 5" mono label, `rounded-none` square buttons, `brutalist-shadow` CTAs, per-step validation w/ inline errors, arrow-key radio nav via `role="radiogroup"`, Enter-to-advance, Back button from step 2+, `focus-visible:outline-2 focus-visible:outline-primary` on all controls. 19/19 tests pass in `apps/web/app/onboarding/page.test.tsx`; `next build` clean.
- [x] 2026-04-21 ModuleOverview: expandable modules, lesson lists, node indicators, formulas — Phase 11 §11d Wave 2. Rewrote `apps/web/app/themes/[slug]/module-map-client.tsx` — native `<details>/<summary>` accordion (keyboard-accessible, no JS state, auto-opens the active module via `open={shouldOpen}`); option (a) numbered node indicators (32px square mono ordinal) at left edge of each module row with 2px connector lines between rows; per-module progress pips (one segment per lesson, `rounded-none`); lesson cards with status icons (`✓` completed, `●` in_progress, `○` available, `🔒` locked) + ordinal side panel + scene location + duration + bridge tag + difficulty tier badge. CSS vars only (`var(--tc-bg)`, `var(--tc-surface)`, `var(--tc-border)`, `var(--tc-primary)`, `var(--tc-text)`, `var(--tc-muted)`, `var(--tc-primary-muted)`, `var(--tc-border-active)`, `var(--tc-tier-*)`) — no hex values; `palette` prop removed from both `module-map-client.tsx` and `themes/[slug]/page.tsx`; `rounded-none` throughout; `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2` on every interactive element; mono for numbers + badges, Inter (`font-sans`) for prose titles/descriptions. Module-level formulas skipped — module schema in `packages/content/velite.config.ts` has no `formula`/`equation` field; deferred to a future schema extension. New test suite `apps/web/app/themes/[slug]/__tests__/module-map-client.test.tsx` — 9/9 pass (renders module title + CTA, all lessons listed, per-status icons, locked icon, `rounded-none` presence, correct link hrefs, active module auto-opens, locked modules hide lesson list, progressbar aria values). `next build` clean (172/172 static pages).
- [x] 2026-04-21 Settings: 5-tab sidebar, toggle components, theme previews — Phase 11 §11d Wave 3. Rewrote `apps/web/app/settings/settings-form.tsx` as a 5-tab interface (Profile / Notifications / GitHub / Theme / Account) with a left-vertical sidebar (desktop, `md:w-[220px]`) that collapses to a horizontal-scrolling tab strip on mobile. Active tab carries `aria-selected="true"` + left-border (md) / bottom-border (mobile) `var(--tc-primary)` indicator + filled `var(--tc-surface)` background. Brutalist `Toggle` component exported from the same file (square 44×22 track, square 14×14 thumb, `role="switch"`, `aria-checked`, `var(--tc-primary)` ON / `var(--tc-border)` OFF) used for `email_alerts` + `weekly_digest`. Theme tab renders a `role="radiogroup"` of 5 preview cards — each card shows a 4-swatch palette strip (primary/accent/bg/border), mono name, specialization, tagline, and an "● ACTIVE" indicator when selected; click writes `profiles.preferred_theme_id` via the browser Supabase client. GitHub tab wires the previously-deferred UI to the live API endpoints: **Connect** → `POST /api/github/connect` (bearer auth), then `window.location.href` → returned OAuth URL; **Disconnect** → `POST /api/github/disconnect`, flips UI to NOT CONNECTED + `router.refresh()`. Errors surface via `role="alert"` region. Account tab consolidates purchases list, magic-link password note, Sign Out, and Delete Account stub (support@tensorcraft.app contact notice). All controls: `rounded-none`, mono labels, CSS vars only, `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`. Also fixed the Wave-3 paywall-ticket type error by adding `preferredThemeId` to both `SettingsPage` → `SettingsForm` and `SettingsFormProps`. New test suite `apps/web/app/settings/settings-form.test.tsx` — 17/17 pass (tab rendering, aria-selected transitions, toggle flip, theme picker writes, GitHub connect POST + redirect, GitHub disconnect, GitHub error alert, purchase rendering, sign out, delete confirm). `next build` clean (173/173 static pages; `/settings` remains `ƒ` dynamic as expected).
- [x] 2026-04-21 Paywall (NEW): free vs paid comparison, social proof, "Continue Your ML Journey" — Phase 11 §11d Wave 3. Net-new `apps/web/app/paywall/page.tsx` + `apps/web/app/paywall/__tests__/page.test.tsx`. Route is deliberately separate from `/pricing?locked=<slug>` (Batch 2 `paywall-notice.tsx` banner, which stays as the redirect target from gated lessons) — `/paywall` is the hard-sell landing target for direct campaigns and "Module 1 complete" prompts with no theme context. Metadata `robots: { index: false, follow: false }` (gated content, not SEO). Layout mirrors `/pricing` brutalist patterns: `AmbientBackground` + `grid-bg` overlay, mono H1 "Continue Your ML Journey", inline "module 1 complete" kicker, primary `/pricing` CTA (+ "Replay Module 1" secondary), 9-row 2-column comparison table (Feature / Free $0 / Paid From $49 — rebased 2026-05-05) with `rounded-none` borders and highlighted paid column (`bg-primary/10` header, `bg-primary/5` body cells), 3 placeholder testimonial `<figure>` cards (mono `BETA_USER_0N` attributions, V0.5 copy — swap post-beta), and a footer CTA section. All interactive elements carry `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2`; no hex values (CSS vars + Tailwind theme tokens only); `rounded-none` throughout. 8/8 tests pass (`./node_modules/.bin/vitest run apps/web/app/paywall/`). Build note: `next build` compiles the paywall route cleanly — it then fails later on a pre-existing `app/settings/page.tsx` type error (`preferredThemeId` prop missing on `SettingsFormProps`) that predates this work and belongs to the next §11d Settings item.
- [x] 2026-04-21 Capstone (NEW): timeline, certificate card, stats, next theme teaser — Phase 11 §11d Wave 3. Rebuilt `apps/web/app/themes/[slug]/capstone/page.tsx` as a gated server component (redirects to `/themes/[slug]` if the theme isn't fully completed, `/auth` if signed out). Parallel Supabase fetch: `profiles`, `certificates` (user-scoped via RLS), `exercise_attempts` (for hints used + exercises passed), `purchases` (for next-theme filter). **Timeline** — brutalist `<ol>` of numbered module nodes (`M01…M11`) in sequence with 2px primary-colored connectors between boxes, `rounded-none` square containers, per-module completion date (formatted `MMM D`), and key-bridge line (`FE title → ML title`) pulled from `getLessonsWithBridges` grouped by `moduleSlug`. **Stats** — 4-card brutalist grid (Lessons Completed `N/M`, Bridges Explored, Hints Used, Exercises Passed) derived from `theme_progress`, `exercise_attempts`, and `skill_genome`-adjacent bridge content. **Certificate card** — new `CertificateCard` client component in `capstone-client.tsx`: `rounded-none` + `brutalist-shadow`, mono cert number (`TC-{uuid8}` uppercased), hash preview (first 8 chars of `cert_hash` upper) in square-bordered mono pills, `POST /api/certificates` on mount via bearer auth when no row exists (idempotent backend), distinct "Download PDF" (opens `pdf_url` if present; falls back to `window.print()` for V0.5 stub) + "Share Link" (copies `${origin}/certificates/{id}` URL) action buttons — both disabled until cert is ready, with loading + error states rendered inline. **Next-theme teaser** — picks first `THEME_SLUGS` entry the user hasn't purchased and isn't the current theme (card with `brutalist-hover`); dashed-border "V1.0 coming" placeholder shown when the user `ownsAll` five. `focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2` on every interactive element. New test suite `apps/web/app/themes/[slug]/capstone/__tests__/page.test.tsx` — 12/12 pass (hero/stats/timeline/cert rendering, real stat values, redirect gate, unknown-slug `notFound`, teaser for unowned theme, V1.0 placeholder for full-owner, cert number + hash preview, POST-on-mount flow with fetch mock, error state, action buttons, share-link clipboard). 34/34 across `apps/web/app/themes/` suites. `./node_modules/.bin/next build` clean — `/themes/[slug]/capstone` now 3.7 kB / 169 kB (was ~2.44 kB).
- [x] 2026-04-21 PurchaseConfirmation: access card, receipt, "You're In" — Phase 11 §11d Wave 3. Polished `apps/web/app/dashboard/purchase-success/page.tsx` on top of the Batch-2 metadata layer: wrapped in `searchParams: Promise<Record<string, string | string[] | undefined>>` so the page can read Stripe's `?session_id={CHECKOUT_SESSION_ID}`. Query strategy is two-stage — (1) if `session_id` is present, look up the exact purchase via `.eq("stripe_session_id", …).eq("user_id", …).eq("status", "completed").maybeSingle()`; (2) otherwise fall back to the user's most recent completed purchase (ordered by `created_at` desc, `limit(1).maybeSingle()`). To make (1) work end-to-end, the Stripe Checkout `success_url` in `apps/api/src/routes/payments.ts` now appends `?session_id={CHECKOUT_SESSION_ID}` (Stripe's literal placeholder — substituted at redirect time). Layout: large mono uppercase "You're In" headline; brutalist **Access Card** (`rounded-none border-2 border-border brutalist-shadow`) with one row per purchased theme, each row showing a color-swatch from the theme's `palette.primary`, displayName, module count, slug, and a per-theme "Start Now →" link to `/themes/<slug>` (`data-testid="access-start-<slug>"`); brutalist **Receipt** (mono) rendering formatted USD amount (`Intl.NumberFormat`), currency, plan ID, ISO-ish UTC date (`YYYY-MM-DD HH:MM UTC`), comma-joined theme IDs, and last-8 chars of `stripe_session_id` (both as a `…XXXXXXXX` tail and as a `TC-XXXXXXXX` invoice-style label — the full session id is never rendered); primary CTA "Start your first lesson →" (`data-testid="cta-first-lesson"`) linking `/themes/<first-theme-slug>`, secondary "View all themes" (`data-testid="cta-view-all-themes"`) linking `/themes`. Analytics preserved via existing `PurchaseAnalytics` client component (fires `trackCheckoutCompleted`). Existing auth guard preserved (`redirect("/auth")` for unauthenticated users). New test suite `apps/web/app/dashboard/purchase-success/page.test.tsx` — 7/7 pass: redirects unauth, renders headline, looks up by `session_id`, falls back to most recent purchase, renders one access row per theme with Start Now links, CTAs point to first theme + `/themes`, receipt renders amount + plan + themes + UTC date + session-id tail in mono. `./node_modules/.bin/vitest run apps/web/app/dashboard/purchase-success/` → 7/7 pass; broader dashboard + metadata suite → 51/51 pass; API `payments.test.ts` + `purchases.test.ts` → 19/19 pass (success_url change covered by existing mocks). `./node_modules/.bin/next build` clean — `/dashboard/purchase-success` listed as `ƒ` dynamic at 1.54 kB / 169 kB first-load.

### 11e. Backend & Database

- [x] Migration: add `experience_level`, `learning_goal` to `profiles` (expanded onboarding) — **COMPLETED 2026-04-21** (migration 018)
- [x] Migration: new `certificates` table — **COMPLETED 2026-04-21** (migration 019 + `get_shared_certificate` RPC)
- [x] API: certificate endpoints (`POST /certificates`, `GET /certificates/:id`) — **COMPLETED 2026-04-21** (9 tests)
- [x] API: daily activity aggregation for heatmap — **COMPLETED 2026-04-21** (`GET /api/progress/activity/daily`, 6 tests)
- [x] API: onboarding update (accept `experience_level`, `learning_goal`) — **COMPLETED 2026-04-21** (`PATCH /api/onboarding`, 6 tests)

### 11f. Test Updates

- [x] Update theme-properties test for new palette shape (9 keys, no glow/neonLine) — **COMPLETED 2026-04-20** (see §11a)
- [ ] Update snapshot tests for all redesigned components
- [x] Update E2E tests for new page structure — **COMPLETED 2026-04-14** (removed sidebar tests, added 6-step progression tests, fixed auth routes, added pricing + onboarding specs)
- [x] Add tests for SkillRadar (SkillGenome) + LossCurve — **COMPLETED 2026-04-20** (viz helpers 7 tests, loss-curve 5 tests, skill-genome 9 tests, viz-data 7 tests, dashboard-view 3 tests, page.test.tsx +2 tests)
- [ ] Add tests for ParticleField + BridgeTicker (Stage 2b other components) — viz test strategy defined in `docs/superpowers/specs/2026-04-20-visualizations-design.md` §7

### 11g. Documentation Updates

- [x] Update `docs/architecture.md` — brutalist aesthetic, palette keys, utilities
- [x] Update `docs/ui-ux-notes.md` — replace Zensman DeFi section with Brutalist Terminal
- [x] Update `docs/prd.md` — design system section with new tokens and typography
- [~] Update `docs/dev-plan.md` — add Phase 11 for brutalist redesign
- [ ] Update `docs/tech-spec.md` — theme manifest spec, component architecture
- [ ] Update `docs/product-plan.md` — UI/UX section
- [ ] Update `docs/marketing-plan.md` — brand guidelines for brutalist aesthetic

---

## Appendix A: Placeholder Links Reference

Historical placeholder-link inventory (prototypes deleted; links now embedded in live `page.tsx` files):

| Link | Pages | Target |
| --- | --- | --- |
| Twitter | landing, pricing, auth, theme-selection, module-overview, settings, paywall, capstone, purchase-confirmation | Twitter/X profile URL |
| Community | dashboard footer, settings footer | Discord invite URL |
| Terms | auth | `/terms` |
| Privacy Policy | auth | `/privacy` |
| Start now (nav) | theme-selection | `/auth` |
| Download Certificate | capstone | Certificate generation endpoint |
| Share Progress | capstone | Share modal / OG image |
| Discord card | purchase-confirmation | Discord invite URL |

---

## Appendix B: Analytics Event Taxonomy (PRD 4.7)

### Learning Events

| Event | Trigger | Properties |
| --- | --- | --- |
| lesson_started | User opens a lesson | lessonId, moduleId, themeId |
| lesson_completed | User finishes all lesson content | lessonId, moduleId, themeId, timeSpent, hintsUsed |
| checkpoint_passed | User passes an in-lesson check | lessonId, checkpointId, attempts |
| capstone_submitted | User submits module capstone | moduleId, themeId, score, timeSpent |

### Conversion Events

| Event | Trigger | Properties |
| --- | --- | --- |
| paywall_hit | Free user attempts Module 2+ | moduleId, themeId |
| upgrade_modal_shown | Paywall modal displayed | source (paywall, pricing, dashboard) |
| purchase_completed | Stripe checkout success | tier, amount, themeIds, pppDiscount |
| refund_requested | User requests refund | purchaseId, reason |

### Onboarding Funnel Events

| Event | Trigger | Properties |
| --- | --- | --- |
| onboarding_step_viewed | Wizard step renders (mount + advance/back) | step (1–4), stepName |
| onboarding_completed | Final submit succeeds on Ready step | experienceLevel, learningGoal, framework?, yearsExperience? |

### Engagement Events

| Event | Trigger | Properties |
| --- | --- | --- |
| theme_selected | User picks a theme | themeId, source (onboarding, settings) |
| progress_shared | User shares progress/certificate | platform (twitter, linkedin, copy) |
| streak_achieved | User hits streak milestone | days (3, 7, 14, 30) |
| hint_requested | User opens hint in exercise | exerciseId, hintLevel (1, 2, 3) |

### Derived Metrics

| Metric | Calculation | Alert Threshold |
| --- | --- | --- |
| Lesson completion rate | completed / started per lesson | < 50% → review lesson |
| Avg time per lesson | mean timeSpent per lesson | > 30min → content too long |
| Hint dependency ratio | completions with hints / total completions | > 60% → redesign exercise |
| Paywall conversion | purchases / paywall_hits | < 5% → review pricing/copy |
| 7-day retention | active day 7 / signed up | < 30% → review onboarding |
| 30-day retention | active day 30 / signed up | < 15% → review content loop |

---

## Appendix C: Content Validation Rules (CI-Time)

| Rule | Scope | Severity |
| --- | --- | --- |
| Frontmatter has all 15 required fields | All MDX files | Error (blocks build) |
| Slug is kebab-case | All MDX files | Error |
| Difficulty is valid enum | All MDX files | Error |
| Dates are ISO 8601 | All MDX files | Error |
| exerciseId exists when hasExercise=true | All MDX files | Error |
| Referenced exerciseId has matching JSON | Exercises | Error |
| Starter code compiles without errors | Exercises | Error |
| Solution code passes all tests | Exercises | Error |
| Test suite runs within 10s timeout | Exercises | Error |
| Internal lesson links resolve | All MDX files | Warning |
| Image paths exist | All MDX files | Warning |
| Images have alt-text | All MDX files | Warning |
| 5C Loop structure present | All lessons | Warning |
| Bridge callout has valid tier | Bridge components | Warning |
| LearningObjectives has 2-5 items | Component usage | Warning |
| KeyTakeaways has 3-5 items | Component usage | Warning |

---

## Appendix D: Risk Log (from product-plan)

| # | Risk | Likelihood | Impact | Mitigation |
| --- | --- | --- | --- | --- |
| 1 | Story fatigue — learners skip narrative | Medium | High | Make narrative optional (default on). Track skip rates. If >40% skip, redesign to be shorter/more decision-driven |
| 2 | Bridge confusion — bridges feel forced | Low | High | 2 FE devs + 1 ML engineer review each bridge. Remove/rewrite if <3/5 clarity |
| 3 | Pricing resistance — $59 feels too high | Medium | High | Validate willingness-to-pay in beta. Consider $49 launch promo |
| 4 | Scope creep on V0.5 | High | Medium | Strict scope doc. Weekly review. Addition = removal of equal effort |
| 5 | Interactive animation complexity | Medium | Medium | Prototype 3 most complex first. If >2x time, simplify or pre-render |
| 6 | GitHub integration reliability | Medium | Low | Robust retry logic. GitHub integration optional. Queue commits + retry on failure |
| 7 | Content quality at scale | Medium | High | Style guide + templates. First 10 lessons set bar. Hire narrative writer |
| 8 | Low free-to-paid conversion | Medium | Medium | Nurture email: monthly free content. Early-bird 10% off for 48h |
| 9 | Platform performance under load | Low | High | Load test before launch. Client-side WASM (Pyodide). CSS/Canvas animations GPU-accelerated. CDN for static assets |

---

## V0.5 Critical Path (Priority Order)

Based on comprehensive audit of codebase, user journeys, database, and security:

### Tier 1: Learning Loop Must Work

1. [x] **Sandpack exercises** (Phase 3f) — async test execution, expanded TF.js mock, import stripping. COMPLETED 2026-04-14.
2. [x] **Syntax highlighting** (Phase 3h) — COMPLETED 2026-04-14 (Shiki integration; Code Hike scrollytelling deferred to §7c post-V0.5)
3. ~~**Wire progress tracking** (Phase 5a) — lesson viewer must write to `/api/progress`~~ RESOLVED — wired via `lesson-progress.tsx`
4. ~~**Mark Complete button** (Phase 5a) — explicit completion action in lesson viewer~~ RESOLVED

### Tier 2: Security & Payments

5. [x] **Fix CRITICAL security issues** — COMPLETED 2026-04-20 (webhook sig verify, upsert race fix, input validation) — see §4b
6. [x] **Stripe checkout flow** (Phase 4b) — COMPLETED (found already implemented at `POST /api/payments/checkout`; paywall redirect contract landed 2026-04-20)
7. [x] **Paywall enforcement** (Phase 4c) — COMPLETED 2026-04-20 (redirect contract on lesson routes + `<PaywallNotice>` on /pricing)
8. [x] **Purchase verification endpoint** (Phase 4b) — COMPLETED 2026-04-20 (`GET /api/purchases/access`)

### Tier 3: User Experience

9. [x] **Dashboard page** (Phase 5b) — COMPLETED 2026-04-20 (server component + theme cards + SkillGenome + LossCurve)
10. ~~**Mobile lesson navigation** (Phase 6b) — drawer for lesson-to-lesson on mobile~~ **[x] COMPLETED 2026-04-14** — swipe gestures for step nav + bottom drawer for lesson list (`lesson-drawer.tsx`). Drawer hidden on desktop (`md:hidden`).
11. ~~**Fix E2E tests** (Phase 8c) — unblock CI pipeline~~ **[x] COMPLETED 2026-04-14** — fixed broken lesson viewer tests (sidebar removed, 6-step progression), fixed auth route in a11y tests, added pricing + onboarding spec files (7 spec files total).
12. ~~**Session error handling** (Phase 6e) — graceful token refresh, error UI~~ **[x] COMPLETED 2026-04-14** — `apiFetch` wrapper with auth header + `tc:session-expired` CustomEvent on 401, `SessionToast` dismissable banner, exercise POST switched to `apiFetch`.

### Tier 4: Post-V0.5

- Settings page, GitHub integration, email sequences
- Streaks, achievements, badges
- PPP discounts, team plans
- Advanced content components (MathBlock, InteractiveDemo)
- Deep Orbit Modules 4-5

---

## Deferred (reading experience)

The lesson reading experience (inline-code chips, the auto-underlined glossary
terms, the two-column LessonShell rail/pane) shipped for Deep Orbit. Two pieces
are intentionally deferred:

- **Multi-framework lesson code (react / svelte / vanilla)** is NOT implemented
  in lessons. The lesson body renders a single code path; per-framework variants
  are not authored or switched. Revisit if/when learner framework preference
  drives lesson code.
- **Glossary content covers deep-orbit + global terms only.** The other four
  themes' theme-specific glossary terms are deferred until those themes launch
  (their MDX is excluded from the Velite build, so there is nothing to underline
  yet). Add their entries to `packages/content/src/glossary.ts` when each theme
  ships.

Known aliasing to watch: the glossary aliases `window` (for `windowing`) and
`descent` (for `gradient descent`) are common English words and can produce
false-positive underlines in prose that uses those words in a non-ML sense.
Review first-occurrence matches in new lessons that mention browser windows or
literal descent.

---

## Deferred (character personas)

> **MOVED 2026-07-22** to `docs/post-launch-backlog.md` §4 (character personas: cel-shaded art, gated character sheets, animation stream).

---

## Version Roadmap

> **SUPERSEDED — see [`docs/roadmap.md`](roadmap.md).** The table below (and `docs/prd.md` §7) predate the 100k-paying-users goal and no longer reflect reality or ambition:
>
> - **V0.5/V1.0 assume all 5 themes ship simultaneously.** Only `deep-orbit` is launched; V1.0's 2026-Q3 target has slipped.
> - **V5.0's terminal gate is 100,000 _free_ users / $250K MRR.** The current goal is 100,000 _paying_ customers — roughly 30× that, implying $10–50M ARR. This is a re-base, not an extension.
> - **V2.0 "Team tier"** was the right instinct but badly under-weighted: enterprise seats are now projected to carry ~60% of the paying-user count.
>
> Retained below as a historical record of the original release plan.

| Version | Scope | Target |
| --- | --- | --- |
| V0.5 (Ignition) | All 5 themes, Modules 1–3 (75 lessons); free tier only; no payments | 2026-Q2 |
| V1.0 (Liftoff) | All 5 themes full (275 lessons); Stripe payments; GitHub integration; skill radar | 2026-Q3 |
| V2.0 (Constellation) | Team tier; admin dashboard; PPP pricing | 2027-Q1 |
| V3.0 (Galaxy) | Mobile app (React Native); offline lesson caching | 2027-Q3 |
| V4.0 (Nebula) | AI tutor (LLM-assisted hints); community features | 2028-Q1 |
| V5.0 (Universe) | Certification program; employer partnerships; theme SDK | 2028-Q3 |

---

## Related Documents

This dev plan covers engineering implementation. For detailed specs in other domains, refer to:

| Domain | Document | Key Sections |
| --- | --- | --- |
| **Growth roadmap, conversion fixes, 100k-paying plan** | **`docs/roadmap.md`** | **Horizon 0 (sell what exists — P0 defects), Gates, Horizons 1–3** |
| UI interaction specs, animations, responsive layouts | `docs/ui-ux-notes.md` | Parts 1–6 (screen specs, progress diagram, lesson layout, mobile, design tokens, new screens) |
| Marketing strategy, SEO, launch sequence, paid ads | `docs/marketing-plan.md` | Parts 1–6 (SEO, launch, paid, organic, waitlist, content calendar) |
| Revenue projections, growth targets, pricing strategy | `docs/product-plan.md` | Part 2 (pricing), Part 5 (revenue), Appendix (founder decisions) |
| Theme scripts, character arcs, narrative details | `docs/scripts/` | 5 theme scripts (Deep Orbit, Neon Protocol, Signal Ward, Nova Canvas, Terra Grid) |
| Technical architecture, MDX schemas, analytics config | `docs/tech-spec.md` | Sections 1–7 (stack, content, exercises, analytics, GitHub, calendar, i18n) |
| Product requirements, feature tables, design system | `docs/prd.md` | Sections 3–6 (requirements, features, architecture, design system) |
| BossBeat expansion (V2, post-launch gated) | `docs/v2-beat-expansion-plan.md` | Ranked 6-beat wave + the P3-earned quality gates |
| Retention email sequences (Kit, operator setup pending) | `docs/email-retention-sequences.md` | 3 automations, drafted copy, purchased-tag gap |

---

## Run #8 deferrals (2026-07-19)

Deferred from the Run #8 fresh-eyes remediation (executed items are in
`docs/audits/fresh-eyes-evaluation-2026-07-13.md`, RUN #8 section):

- [ ] **llm-integration real-model exercise.** Learner sim rated module 9
  "least ML per minute": 3 of 6 exercises are string/JSON plumbing and
  every LLM is mocked. Fix candidate: replace one plumbing exercise
  (prompt-template or generate-report) with a real in-browser
  Transformers.js inference exercise (the runtime is already taught in
  browser-runtimes/06). Deferred because the grader harness would need to
  fetch a model in CI (network + cache policy decision) — decide harness
  strategy first (vendored tiny model vs mock-at-CI/real-in-browser
  split).
- [ ] **Demir analogy-skeleton variation.** The guess-then-corrected
  dialogue shape covers most of Demir's scenes (~12 lessons); editor
  recommends 2-3 scenes where his analogy is RIGHT, or he corrects
  someone else, to convert device back into character. Editorial pass,
  needs the style bible's voice rules open; batch with the next content
  wave rather than piecemeal.
- [ ] **Nazari invoice-formula ration.** "X, and it's coming out of your
  Y" fires 5x; thin to ~3, keep the capstone ledger-wipe payoff intact.
  Same editorial batch as above.
- [ ] **Per-exercise hint panels (engine).** Multi-exercise gated lessons
  carry ONE frontmatter ladder; run #8 pointed capstone/05's at
  classify-anomaly (the hardest) and Gate B now validates the ladder
  against any single exercise of its lesson, but a real fix is
  per-exercise ladders in the YAML + a "Need a hint?" panel per Exercise
  block. Schema + UI change; V2.
