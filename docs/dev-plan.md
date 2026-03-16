# Tensorcraft — Development Plan

> Last updated: 2026-03-16 (all 11 Deep Orbit modules authored, Bridge Explorer replaced with dashboard bridge collectibles, prototype count corrected, PRD aligned with implementation)

This document is the single source of truth for all development work needed to ship Tensorcraft. It covers every phase from repo initialization to post-launch operations, sourced from the PRD, tech-spec, product-plan, theme scripts, and two rounds of DeepSeek reviews.

**Status key:** `[ ]` not started · `[~]` in progress · `[x]` done

---

## Phase 0: Prototyping & Documentation (COMPLETE)

- [x] 15 HTML prototypes covering full user journey (landing, auth, onboarding, dashboard, theme-selection, module-overview, lesson-viewer, exercise, pricing, settings, paywall, bridge-explorer, capstone, purchase-confirmation, index)
- [x] PRD, tech-spec, product-plan, ui-ux-notes, marketing-plan
- [x] 5 theme scripts (Deep Orbit complete, 4 outlines)
- [x] Pricing model aligned across all docs (per-model $79, bundles $129/$169)
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
| 1 | **V0.5 module scope** | Modules 1–3 (15 lessons) | Matches PRD. Buildable in 4 months solo. |
| 2 | **Database** | Supabase (PostgreSQL + Auth + RLS) | Already implemented in architecture. Auth + RLS from day one. |
| 3 | **Bundle pricing** | $79 single / $129 two / $169 three | Simpler. No 4-theme or 5-theme bundles until themes exist. |
| 4 | **Payment processor** | Stripe Checkout + Webhooks | One-time purchases. No subscriptions. Webhook-driven fulfillment. |
| 5 | **Code execution** | TensorFlow.js in Sandpack | Client-side only. No server sandbox. |
| 6 | **Narrative branching** | Convergent (single path) | Simpler content pipeline. All 5C variations are structural, not branching. |
| 7 | **AI-powered hints** | Manual 3-level progressive disclosure | No LLM cost/latency. Hints authored per exercise. |
| 8 | **WCAG level** | WCAG 2.1 AA | Standard compliance. AAA deferred. |
| 9 | **Content pipeline** | MDX 3 + Velite (Zod schemas) | Build-time validation. Missing fields = build error. |
| 10 | **Code highlighting** | Code Hike (Shiki-based) | Scrollytelling for FE Bridge side-by-side code comparisons. |
| 11 | **Email provider** | Kit (ConvertKit) | Waitlist, per-theme segments, 11-email nurture sequence. |
| 12 | **Team pricing** | Deferred to post-V1.0 | No team tiers at launch. Added to product plan as future phase. |
| 13 | **Early Access tier** | Removed | V0.5 uses Free (M1) + $79 (full theme). No intermediate tier. |
| 14 | **Ship name** | Archimedes | Consistent across all docs and prototypes. |
| 15 | **Nova Canvas model** | Nova Canvas (not "Nova Canvas AI" or "Nova Gen Engine") | Simplified. |

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
- [x] Create database tables per tech-spec schema:
  - `profiles` (id, email, display_name, avatar_url, github_username, github_connected, onboarding_completed, timestamps)
  - `purchases` (id, user_id, plan_id, theme_ids[], amount, currency, stripe_session_id, status, created_at)
  - `theme_progress` (id, user_id, theme_id, module_id, lesson_id, status, score, hints_used, attempts, timestamps)
  - `waitlist` (id, email, theme_id, source, created_at)
- [x] Row-Level Security (RLS) policies on all tables (user can only read/write own data)
- [x] Indexing strategy: user_id on all tables, compound index on (user_id, theme_id) for theme_progress
- [x] Auto-create profile trigger on auth.users insert
- [x] Connection pooling via Supabase built-in pgBouncer (Supabase manages this automatically)
- [x] Automated daily backups (Supabase managed — included on all plans)

### 1d. Security Foundations (COMPLETE)

- [x] CORS configuration for API endpoints
- [x] Rate limiting on API routes — Upstash Redis adapter with in-memory fallback, 60 req/min per IP. Stripe webhook exempt.

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

- [x] 3-step post-signup flow (`/onboarding`) — from `prototypes/onboarding.html`:
  1. Welcome screen — headline "You Already Think Like an ML Engineer" + 3 feature cards
  2. Theme selection — Deep Orbit pre-selected, 4 others disabled (Coming Soon)
  3. Confirmation — theme summary, module/lesson counts, "Start your first lesson" CTA
- [x] Onboarding completion persistence — sets `onboarding_completed` flag in `profiles` table
- [x] Stepper indicator showing progress through 3 steps (dot + line UI)

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
- [x] Stats section (50+ bridges, 275 lessons, 5 worlds, $79/theme)
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
  - `<Quiz>` — multiple-choice with correct/wrong feedback and retry (client component)
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

- [x] Build module overview page (`apps/web/app/themes/[slug]/[module]/page.tsx`)
- [x] Lesson cards with order, title, time estimate, difficulty badges
- [x] Breadcrumb navigation (theme → module)
- [x] V0.5: Show Modules 1–3 for Deep Orbit

### 3e. Lesson Viewer (COMPLETE)

- [x] Build lesson viewer (`apps/web/app/themes/[slug]/[module]/[lesson]/page.tsx`)
- [x] Sidebar navigation with lesson list and active state highlighting
- [x] Real MDX content rendering via `LessonContent` client component
- [x] 5C Loop structure: Context (narrative dialogue) → Concept (bridge callout) → Code → Challenge → Consequence
- [x] Prev/next lesson navigation
- [x] Breadcrumb navigation (theme → module → lesson)
- [x] Responsive sidebar — hidden on mobile (`hidden lg:flex`), visible on desktop

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
- [x] `github-dark-default` theme (dark, matches Zensman DeFi aesthetic)
- [x] Graceful fallback — renders plain code while Shiki loads, no layout shift
- [x] Copy button preserved

### 3i. Deep Orbit Content (V0.5 — Modules 1–3) (COMPLETE)

- [x] Module 1 (Foundations): Introduction to Tensors, Tensor Shapes, Tensor Operations, Data Loading, Normalization (5 lessons + 4 exercises)
- [x] Module 2 (Neural Networks): First Neuron, Activation Functions, Layers & Architecture, Forward Pass, Building a Network (5 lessons + 5 exercises)
- [x] Module 3 (Training Loop): Loss Functions, Gradient Descent, Backpropagation, Training Loop, Evaluating DEEP SCAN (5 lessons + 5 exercises)
- [x] All 15 lessons follow 5C Loop structure with YAML frontmatter
- [x] FE-to-ML bridges present across all 3 tiers (identity, structural, intuition)
- [x] Character voices: Commander Okafor, Dr. Sato, ARIA (AI), Chief Torres, Ensign Park
- [x] 3 module.yaml metadata files
- [x] 14 exercise YAML files with starterCode, solutionCode, testCode
- [x] Velite compiles all 15 lessons without errors

---

## Phase 4: Payments & Access Control

### 4a. Pricing Page

- [x] Build from `prototypes/pricing.html`
- [x] 4 individual tiers: Free Preview ($0), Single Theme ($79), Two Themes ($129), Three Themes ($169)
- [ ] Team pricing: Deferred to post-V1.0. Design based on enterprise demand data.
- [x] FAQ accordion (interactive)
- [x] Feature comparison table

### 4b. Stripe Integration

> **SECURITY CRITICAL:** The current webhook at `apps/api/src/routes/payments.ts` parses raw JSON without Stripe signature verification. Anyone can fake a `checkout.session.completed` event. This MUST be fixed before any real payments.

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
- [x] Payment failure error modal on pricing page (PRD 4.6)
- [ ] Upgrade path: credit amount already paid toward higher tier
- [ ] Track `purchase_completed` and `refund_requested` events

### 4c. Paywall & Access Control

- [x] Route guard middleware — check `purchases` table for theme access
- [x] Paywall modal when free-tier user attempts Module 2+ (from `prototypes/paywall.html`)
- [x] Upgrade path from paywall → pricing page
- [ ] Track `paywall_hit` and `upgrade_modal_shown` events

### 4d. Post-Purchase Confirmation

- [x] Build from `prototypes/purchase-confirmation.html`
- [x] Show unlocked modules list, next steps, Discord invite
- [x] Redirect here after successful Stripe checkout

### 4e. Email System

- [ ] Kit integration for transactional + marketing emails
- [ ] Email flows:
  - Welcome series (post-signup, 3-email sequence)
  - Purchase confirmation (immediate, includes receipt)
  - Capstone achievement (congratulations + certificate link)
  - Waitlist nurture (monthly free content tease, early-bird 10% off for 48h after theme launch)
- [ ] Email templates matching Zensman DeFi design system
- [ ] Unsubscribe / preference management
- [ ] Email deliverability monitoring

### 4f. PPP Discounts (Post-V0.5)

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

> **GAP:** Dashboard page doesn't exist — `/dashboard` route is referenced in ROUTES constants but not implemented. Users have no way to see progress or resume learning.

- [x] Dashboard page (`apps/web/app/dashboard/page.tsx`) — server component with auth guard
- [x] "Resume learning" — Continue Learning card links to last in-progress lesson
- [x] Real progress stats from `theme_progress` table per theme (completed/total lessons, progress bar)
- [x] Per-theme progress cards with percentage and lesson counts
- [x] Coming Soon themes section (shows non-launched themes)
- [x] Streak calculation from `completed_at` timestamps
- [x] Add `streaks` table (user_id, theme_id, current_streak, longest_streak, last_activity_date) — denormalized for fast reads
- [ ] Activity feed (recent lesson completions, achievements)
- [x] Add `achievements` table (user_id, achievement_type, theme_id, unlocked_at) — milestones and badges
- [ ] Track `streak_achieved` event (3-day, 7-day, 30-day milestones)
- [ ] Skill radar: radar chart showing proficiency across 6 axes (PRD 3.4)
- [ ] Progress ring: circular SVG indicator (from dashboard.html prototype)
- [ ] Share snapshot: html2canvas 2x PNG with watermark, share modal with Clipboard API + Web Share API fallback (ui-ux-notes 2.5)
- [ ] Activity heatmap (post-V0.5 — query `theme_progress` by `completed_at` date, render SVG)

### 5c. Settings

> **GAP:** Settings page doesn't exist — `/settings` route is referenced but not implemented.

- [x] Build from `prototypes/settings.html`
- [x] `PATCH /api/profiles/:userId` endpoint — update profile fields
- [x] Profile editing (display name, avatar)
- [ ] GitHub connection toggle with retroactive push
- [x] Theme preference switching ("Theme applies to your learning content and code editor")
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
- [x] Supabase types updated for streaks, achievements, exercise_attempts tables
- [x] Write migration file for all schema changes

### 5e. Theme Selection

- [x] Build from `prototypes/theme-selection.html`
- [x] Deep Orbit as available, 4 themes as "Coming Soon"
- [x] "Notify Me" email capture → `waitlist_signups` table with theme_id, confirmation toast
- [x] Coming-soon modal with theme preview + email input
- [ ] Track `theme_selected` event

### 5f. GitHub Integration

- [ ] GitHub App setup (tech-spec 5.1–5.2):
  - Fine-grained, per-repository permissions
  - Short-lived installation tokens (1-hour auto-refresh)
  - Rate limit: 5,000 req/hr per installation (separate quota per user)
- [ ] Commit lesson artifacts on completion
- [ ] Repo naming: `tensorcraft-{theme-slug}`, internal project folder = theme-specific name
- [ ] Retroactive push (tech-spec 5.3): when user connects GitHub after completing modules, background job queues all completed artifacts for push in chronological order with progress indicator
- [ ] Opt-out and disconnect flow: token revocation on disconnect
- [ ] Graceful degradation if repo access is revoked (PRD risk #6)
- [ ] Retry logic on GitHub API failures (exponential backoff, max 3 retries, queue commits)
- [ ] Repo creation flow: if no repo connected, prompt to create new `tensorcraft-{theme-slug}` repo from within Tensorcraft
- [ ] Auto-generated README.md template: badge, module list, course description, Tensorcraft link (tech-spec 5.4)

---

## Phase 6: Polish & Launch Prep

### 6a. Accessibility

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
- [ ] Color contrast audit (4.5:1 minimum for text, 3:1 for UI components)
- [ ] Image alt-text on all images

### 6b. Mobile Responsiveness

> **GAP:** Lesson sidebar is `hidden lg:flex` — mobile users see content but can't navigate between lessons without going back to the module overview.

- [x] Mobile lesson navigation drawer (`MobileLessonNav`) — floating accent-colored menu button, slide-in drawer with full lesson list
- [x] Hamburger menu button (fixed bottom-right, `lg:hidden`) + overlay + close button
- [ ] Responsive at breakpoints: 320px, 768px, 1024px, 1440px
- [ ] Touch-friendly interactions (swipe, tap targets)
- [ ] Testing devices per PRD 5.5: iPhone SE, iPhone 15 Pro, iPad Air, Pixel 7, Samsung Galaxy S23
- [ ] Browser compatibility: Chrome, Firefox, Safari, Edge (latest 2 versions)

### 6c. Performance Optimization

- [ ] Bundle size budgets — monitor with @next/bundle-analyzer
- [ ] Code splitting: per-page chunks, per-theme CSS, dynamic imports for Sandpack
- [ ] Sandpack lazy loading: dynamic import (ssr: false), Intersection Observer (200px threshold), preload hint
- [ ] Image optimization: next/image with automatic format selection, CDN delivery
- [ ] Max 3 simultaneous animations per viewport
- [ ] Core Web Vitals targets: LCP < 2.5s, CLS < 0.1, INP < 200ms
- [ ] Lighthouse CI in GitHub Actions (fail build if score drops below threshold)

### 6d. SEO & Marketing Infrastructure

- [x] Structured data: Course schema, Organization schema (JSON-LD)
- [x] Dynamic OG images via Vercel OG (per-page, per-lesson)
- [x] Sitemap generation (next-sitemap)
- [x] robots.txt with crawl directives
- [x] Canonical URLs on all pages
- [ ] Blog infrastructure (MDX-based, target: 2 posts/week)
- [ ] Google Search Console setup
- [ ] Target keywords: "learn machine learning JavaScript", "TensorFlow.js tutorial", "ML for front-end developers"

### 6e. Error Handling

> **GAP:** No session error handling UI — expired tokens show nothing useful. API errors return generic 500s.

- [x] Global error boundary component (React)
- [x] Custom 404 page (themed, with navigation back to dashboard)
- [x] Custom 500 page (error logged to Sentry, user-friendly message)
- [x] Session expiry handling — middleware detects auth errors, redirects to `/auth/sign-in?error=session_expired`
- [x] Sign-in page shows "Your session has expired" message when `error=session_expired` param present
- [x] Token refresh flow — graceful session renewal without page reload
- [ ] User-friendly error messages for:
  - Payment failures (retry + support link)
  - Auth failures (provider-specific guidance)
  - GitHub integration failures (retry + disconnect option)
  - Exercise execution errors (separate from platform errors in Sentry)
  - API errors (structured error responses with user-facing messages)

### 6f. CI/CD Pipeline

- [x] GitHub Actions: lint, typecheck, test on every PR
- [x] E2E tests (Playwright) added to CI workflow
- [ ] Vercel deployment configuration (preview + production)
- [ ] Branch protection rules (require PR reviews, passing CI)
- [ ] Broken link checking in CI
- [ ] Exercise validation in CI (starter compiles, solution passes tests, 10s timeout)

### 6g. Monitoring & Error Tracking

- [x] Error tracking utility stub (structured JSON logging, Sentry-compatible API)
- [ ] Sentry integration for error tracking (separate projects for web + API)
- [ ] Vercel Analytics for Core Web Vitals
- [ ] PostHog setup (EU instance) for product analytics
- [ ] Data processing agreements (GDPR compliance for analytics)

### 6h. Security Hardening

> **23 security findings identified in audit (5 CRITICAL, 4 HIGH, 7 MEDIUM, 7 LOW).** CRITICAL and HIGH items are tracked in their respective phases (4b, 5a). This section covers remaining hardening.

- [x] Content Security Policy (CSP) headers
- [ ] XSS prevention in MDX rendering pipeline
- [ ] API versioning headers
- [ ] Fix rate limiter IP spoofing — use trusted proxy header or Cloudflare `CF-Connecting-IP` instead of `X-Forwarded-For`
- [x] Add TTL-based cleanup to in-memory rate limiter (or replace with Redis — see 6j)
- [x] Move hardcoded CORS origins to environment variable
- [x] Add `X-Request-ID` middleware for request tracing
- [ ] Add structured error logging (Pino or Winston with request context)
- [x] Add graceful shutdown handler (`process.on('SIGTERM')`)
- [x] Health check endpoint: add `SELECT 1` DB probe (currently doesn't verify DB connection)
- [ ] Purchase-to-theme referential integrity — validate `theme_ids[]` against known themes

### 6i. Analytics Event Tracking

- [ ] Implement analytics events: lesson_started, lesson_completed, scroll depth
- [ ] Track onboarding_completed event
- [ ] PostHog event verification (test each event → appears in dashboard)

### 6j. API Deployment

- [ ] Deploy Hono API to Fly.io or Railway (separate from Vercel)
- [ ] ISR/caching strategy for content pages
- [ ] Redis for production rate limiting (replace in-memory store)

### 6k. Community & External Links

- [ ] Create Discord server with channels: #general, #deep-orbit, #help, #feedback, #beta-testers
- [ ] Replace all Community placeholder `href="#"` links with Discord invite URL
- [ ] Purchase confirmation Discord CTA with invite link
- [ ] Create Twitter/X account
- [ ] Replace all Twitter placeholder `href="#"` links across 9 pages
- [ ] Set up social media OG meta tags

---

## Phase 7: Post-V0.5 Features

### 7a. Bridge Explorer — REMOVED (replaced with dashboard bridge collectibles)

> **Refactored:** The standalone `/bridges` route and `bridge-explorer.tsx` page were intentionally removed. Bridge discovery is now integrated into the dashboard as collectible bridge cards via the `bridge-collection.tsx` component on the dashboard page. This surfaces bridges in context of the learner's progress rather than as a separate reference page.

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

- [ ] V2.0: Neon Protocol (Cyberpunk — Computer Vision) — Q4 2026
- [ ] V3.0: Signal Ward (Medical — NLP & Text) — Q1 2027
- [ ] V3.0: Nova Canvas (Creative AI — Multimodal & Generative) — Q2 2027
- [ ] V4.0: Terra Grid (Industrial — Edge AI & Production ML) — Q3 2027

### 7g. Bundle & Team Pricing

- [ ] Bundle purchase flow ($129 two themes, $169 three themes)
- [ ] Team license management (admin dashboard, seat assignment, progress reports)
- [ ] Upgrade credit logic (pay difference when moving to higher tier)

### 7h. Module Count Dynamic Updates

- [x] Drive all module/lesson counts from content source (THEME_CONTENT constant in shared package)
- [x] Never hardcode — pricing page derives counts from THEME_CONTENT constant

### 7i. Arena (V1.0+)

- [ ] Arena: weekly ML challenges with community leaderboard
- [ ] ELO-style scoring system
- [ ] $29/year subscription (separate from theme purchases)
- [ ] Community solution viewing after submission deadline
- [ ] Challenge authoring pipeline and scheduling

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

### 8c. E2E Tests (5 spec files)

> **NOTE:** Some E2E tests in `landing.spec.ts`, `auth.spec.ts`, and `legal.spec.ts` have selector precision issues (`getByText()` resolving to multiple elements in Playwright strict mode). These are test bugs, not app bugs, but they'll block CI.

- [x] Landing page: hero, nav, themes, footer, CTA navigation
- [x] Auth pages: sign-in/sign-up rendering, OAuth buttons, magic link, guest link
- [x] Legal pages: terms/privacy content, back links, cookie consent banner
- [x] Learning routes (14 tests): themes listing, theme detail with modules, module overview with lesson cards, lesson viewer with dialogue/sidebar/navigation, 404 handling
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
- [x] E2E axe audits on 9 routes: /, /auth/sign-in, /auth/sign-up, /terms, /privacy, /themes, /themes/deep-orbit, /themes/deep-orbit/foundations, /themes/deep-orbit/foundations/introduction-to-tensors
- [ ] Color contrast audit (4.5:1 minimum for text, 3:1 for UI components) _(manual audit pre-launch)_

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

- [ ] Supabase integration: CRUD on all 4 tables, RLS policy enforcement
- [ ] Stripe webhook flow: checkout → purchase record → access grant
- [ ] GitHub integration: token acquisition → commit → push
- [ ] Content pipeline: MDX → rendered lesson with all components

### 8k. Visual Regression

- [ ] Playwright screenshot comparison for key pages
- [ ] Theme switching visual tests (all 5 themes render correctly)
- [ ] Responsive layout tests at each breakpoint

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
  - ≥ 80% would pay $79
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

- [ ] Lesson completion rate targets: beginner ≥75%, intermediate ≥60%, advanced ≥45%
- [ ] Exercise pass rate: ≥70% within 3 attempts (trigger content review if <50%)
- [ ] Hint dependency: ≤40% of completions use hints (>60% triggers exercise redesign)
- [ ] Scroll depth: ≥75% completion depth (validates engagement)
- [ ] Monthly review: identify 2-3 lessons for optimization
- [ ] Quarterly: character consistency audit, narrative arc review
- [ ] Biannually: full curriculum audit for technical accuracy, bridge consistency

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
- [ ] Sentry error tracking verified (test error → appears in dashboard)
- [ ] PostHog events verified (test each of 10 events → appears in dashboard)
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
- [ ] Risk #3 (pricing resistance): Validate willingness-to-pay during beta exit survey. If <70% would pay $79, evaluate $59 launch price.

### 10d. Success Metrics Dashboard

- [ ] Build internal PostHog dashboard tracking key metrics:
  - Lesson completion rate (target: ≥60%)
  - Paid conversion rate (target: 3%)
  - NPS score (target: ≥40)
  - 7-day retention (target: ≥30%)
  - 30-day retention (target: ≥15%)
  - Average time per lesson
  - Hint dependency ratio
  - Paywall conversion rate
- [ ] Set up PostHog alerts for metrics falling below thresholds

### 10e. Post-Launch Operations

- [ ] Weekly metrics review: completion rates, hint dependency, time-on-page, conversion
- [ ] Cohort analysis: performance by difficulty, theme, learner background
- [ ] Content maintenance cycle:
  - Monthly: review analytics, optimize 2-3 lessons
  - Quarterly: character/narrative consistency audit
  - Biannually: full curriculum technical accuracy audit
- [ ] Respond to beta feedback, community Discord questions
- [ ] Plan V1.0 scope (Deep Orbit Modules 6–11)

---

## Phase 11: Brutalist Terminal Redesign

Full design system overhaul from "Zensman DeFi Neon" to "Brutalist Terminal" aesthetic. Driven by 15 new JSX prototypes.

### 11a. Design System Foundation

- [~] Update `ThemePalette` interface in `packages/themes/src/types.ts`: remove `glow`/`neonLine`, add `surfaceOverlay`/`border`/`codeBg`
- [ ] Update `packages/themes/src/css/themes.css` with new brutalist shell tokens and remove `--tc-glow`/`--tc-neon-line`
- [ ] Update all 5 theme manifest files (deep-orbit, neon-protocol, signal-ward, nova-canvas, terra-grid) to match new `ThemePalette` interface
- [ ] Update `packages/config/tailwind/base.css` `@theme` block: remove glow/neon-line tokens, set all radius to `0`, add code-bg token
- [ ] Replace neon utilities in `apps/web/app/globals.css` with brutalist utilities (`.brutalist-shadow`, `.brutalist-hover`, `.comment-label`)
- [ ] Update `packages/themes/src/theme-properties.test.ts` for new palette shape

### 11b. New Shared Components

- [ ] Build `ParticleField` canvas component (`packages/ui/src/particle-field.tsx`)
- [ ] Build `BridgeTicker` scrolling ticker (`packages/ui/src/bridge-ticker.tsx`)
- [ ] Build `ARIANarrator` dual robot companion system (`packages/ui/src/narrator/`)
- [ ] Build visualization components: `LossLandscape`, `SkillRadar`, `ActivityHeatmap`, `LossCurve` (`packages/ui/src/visualizations/`)

### 11c. Shell Component Updates

- [ ] Update Nav: solid bg, square edges, `T_` logo badge, JetBrains Mono, 60px height
- [ ] Update Footer: brutalist typography, remove neon effects
- [ ] Update AuthForm: square inputs/buttons, zero border-radius
- [ ] Update CookieConsent, UserMenu: brutalist card styling
- [ ] Update layout.tsx: body class, font priority

### 11d. Page Component Updates (15 pages)

- [ ] Landing page: ParticleField bg, BridgeTicker, bridge table with tiers, 5C loop section, brutalist buttons
- [ ] Auth pages: split layout, LossLandscape left, form right, "You already think like an ML engineer"
- [ ] Dashboard: module sidebar, LossCurve, SkillRadar, ActivityHeatmap, activity log
- [ ] LessonViewer: 5C nav indicators, timer, side-by-side bridge panel, checkpoint quiz w/ confetti, ARIANarrator
- [ ] Exercise: line numbers, test results panel, bridge hint, console output
- [ ] BridgeExplorer: category filter (Identity/Structural/Intuition), search, expandable cards
- [ ] Pricing: 4-tier grid, comparison table, "Simple, Fair Pricing"
- [ ] ThemeSelection: Featured Deep Orbit hero, 2x2 coming-soon grid, waitlist modal
- [ ] Onboarding: expand to 5 steps (Welcome, Background, Goal, Theme, Ready)
- [ ] ModuleOverview: expandable modules, lesson lists, node indicators, formulas
- [ ] Settings: 5-tab sidebar, toggle components, theme previews
- [ ] Paywall (NEW): free vs paid comparison, social proof, "Continue Your ML Journey"
- [ ] Capstone (NEW): timeline, certificate card, stats, next theme teaser
- [ ] PurchaseConfirmation: access card, receipt, "You're In"

### 11e. Backend & Database

- [ ] Migration: add `experience_level`, `learning_goal` to `profiles` (expanded onboarding)
- [ ] Migration: new `certificates` table
- [ ] API: certificate endpoints (`POST /certificates`, `GET /certificates/:id`)
- [ ] API: daily activity aggregation for heatmap
- [ ] API: onboarding update (accept `experience_level`, `learning_goal`)

### 11f. Test Updates

- [ ] Update theme-properties test for new palette shape (9 keys, no glow/neonLine)
- [ ] Update snapshot tests for all redesigned components
- [ ] Update E2E tests for new page structure
- [ ] Add tests for new components (ParticleField, BridgeTicker, Narrator, visualizations)

### 11g. Documentation Updates

- [x] Update `docs/architecture.md` — brutalist aesthetic, palette keys, utilities
- [x] Update `docs/ui-ux-notes.md` — replace Zensman DeFi section with Brutalist Terminal
- [x] Update `docs/prd.md` — design system section with new tokens and typography
- [~] Update `docs/dev-plan.md` — add Phase 11 for brutalist redesign
- [ ] Update `docs/tech-spec.md` — theme manifest spec, component architecture
- [ ] Update `docs/product-plan.md` — UI/UX section, narrator characters
- [ ] Update `docs/marketing-plan.md` — brand guidelines for brutalist aesthetic

---

## Appendix A: Placeholder Links Reference

All `href="#"` links in prototypes that need real routes:

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
| 3 | Pricing resistance — $79 feels too high | Medium | High | Validate willingness-to-pay in beta. Consider $59 launch price |
| 4 | Scope creep on V0.5 | High | Medium | Strict scope doc. Weekly review. Addition = removal of equal effort |
| 5 | Interactive animation complexity | Medium | Medium | Prototype 3 most complex first. If >2x time, simplify or pre-render |
| 6 | GitHub integration reliability | Medium | Low | Robust retry logic. GitHub integration optional. Queue commits + retry on failure |
| 7 | Content quality at scale | Medium | High | Style guide + templates. First 10 lessons set bar. Hire narrative writer |
| 8 | Low Coming Soon conversion | Medium | Medium | Nurture email: monthly free content. Early-bird 10% off for 48h |
| 9 | Platform performance under load | Low | High | Load test before launch. Client-side WASM (Pyodide). CSS/Canvas animations GPU-accelerated. CDN for static assets |

---

## V0.5 Critical Path (Priority Order)

Based on comprehensive audit of codebase, user journeys, database, and security:

### Tier 1: Learning Loop Must Work

1. **Sandpack exercises** (Phase 3f) — #1 gap, 14 exercises authored but none interactive
2. **Syntax highlighting** (Phase 3h) — code platform needs colored code
3. ~~**Wire progress tracking** (Phase 5a) — lesson viewer must write to `/api/progress`~~ RESOLVED — wired via `lesson-progress.tsx`
4. ~~**Mark Complete button** (Phase 5a) — explicit completion action in lesson viewer~~ RESOLVED

### Tier 2: Security & Payments

5. **Fix CRITICAL security issues** — Stripe webhook verification, input validation, race conditions
6. **Stripe checkout flow** (Phase 4b) — create session endpoint + checkout page
7. **Paywall enforcement** (Phase 4c) — Module 1 free, Module 2+ requires purchase
8. **Purchase verification endpoint** (Phase 4b) — frontend needs to check access

### Tier 3: User Experience

9. **Dashboard page** (Phase 5b) — progress overview, resume learning
10. **Mobile lesson navigation** (Phase 6b) — drawer for lesson-to-lesson on mobile
11. **Fix E2E tests** (Phase 8c) — unblock CI pipeline
12. **Session error handling** (Phase 6e) — graceful token refresh, error UI

### Tier 4: Post-V0.5

- Settings page, GitHub integration, email sequences
- Streaks, achievements, badges
- PPP discounts, team plans
- Advanced content components (MathBlock, InteractiveDemo)
- Deep Orbit Modules 4-5

---

## Version Roadmap

| Version | Content | Target |
| --- | --- | --- |
| V0.5 | Deep Orbit Modules 1–3 (15 lessons, MVP) | Q2 2026 |
| V1.0 | Deep Orbit Modules 1–11 (55 lessons, full) | Q3 2026 |
| V2.0 | + Neon Protocol (55 lessons) | Q4 2026 |
| V3.0 | + Signal Ward + Nova Canvas (110 lessons) | Q1–Q2 2027 |
| V4.0 | + Terra Grid (55 lessons) | Q3 2027 |

---

## Related Documents

This dev plan covers engineering implementation. For detailed specs in other domains, refer to:

| Domain | Document | Key Sections |
| --- | --- | --- |
| UI interaction specs, animations, responsive layouts | `docs/ui-ux-notes.md` | Parts 1–6 (screen specs, progress diagram, lesson layout, mobile, design tokens, new screens) |
| Marketing strategy, SEO, launch sequence, paid ads | `docs/marketing-plan.md` | Parts 1–6 (SEO, launch, paid, organic, waitlist, content calendar) |
| Revenue projections, growth targets, pricing strategy | `docs/product-plan.md` | Part 2 (pricing), Part 5 (revenue), Appendix (founder decisions) |
| Theme scripts, character arcs, narrative details | `docs/scripts/` | 5 theme scripts (Deep Orbit, Neon Protocol, Signal Ward, Nova Canvas, Terra Grid) |
| Technical architecture, MDX schemas, analytics config | `docs/tech-spec.md` | Sections 1–7 (stack, content, exercises, analytics, GitHub, calendar, i18n) |
| Product requirements, feature tables, design system | `docs/prd.md` | Sections 3–6 (requirements, features, architecture, design system) |
