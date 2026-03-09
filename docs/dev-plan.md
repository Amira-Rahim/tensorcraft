# Tensorcraft — Development Plan

> Last updated: 2026-03-09

This document is the single source of truth for all development work needed to ship Tensorcraft. It covers every phase from repo initialization to post-launch operations, sourced from the PRD, tech-spec, product-plan, theme scripts, and two rounds of DeepSeek reviews.

**Status key:** `[ ]` not started · `[~]` in progress · `[x]` done

---

## Phase 0: Prototyping & Documentation (COMPLETE)

- [x] 14 HTML prototypes covering full user journey
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

## Unresolved Decisions (Blocking)

These discrepancies and open questions must be resolved before development begins. Each impacts technical scope.

| # | Decision | Options | Currently Assumed | Impact |
| --- | --- | --- | --- | --- |
| 1 | **V0.5 module scope** | PRD 7 says Modules 1–3 (15 lessons) vs product-plan says Modules 1–5 (25 lessons) | Modules 1–5 (product-plan) | Content authoring timeline, beta scope |
| 2 | **Database** | PRD 5.1 says PlanetScale + Prisma vs tech-spec says Supabase + Postgres | Supabase (tech-spec) | ORM choice, auth integration, RLS approach |
| 3 | **Bundle pricing** | Product-plan says $149/$209/$269/$319 vs PRD/prototypes say $129/$169 | $129/$169 (PRD/prototypes) | Stripe config, pricing page, revenue projections |
| 4 | **Code execution** | Pyodide (client-side, free, limited libs) vs server-side sandbox (full Python, adds cost/latency) | TensorFlow.js in Sandpack | Exercise architecture, infra cost |
| 5 | **Narrative branching** | Convergent (simpler, single path) vs divergent (complex, player choices matter) | Convergent | Content pipeline complexity, authoring effort |
| 6 | **AI-powered hints** | Manual progressive disclosure (3-level) vs LLM-powered hint generation | Manual (3-level) | Phase 3e scope, API cost, latency |
| 7 | **Content licensing** | Learners own capstone projects? Commercial use allowed? | Undefined | Terms of Service, legal pages |
| 8 | **WCAG level** | AA (current plan) vs AAA (higher bar for contrast/animation) | WCAG 2.1 AA | Animation design, color palette, contrast ratios |

---

## Phase 1: Project Setup & Infrastructure

### 1a. Monorepo & Tooling

- [ ] Initialize Turborepo + pnpm monorepo
- [ ] Configure workspace packages:
  - `apps/web` — Next.js 15 (App Router) frontend
  - `apps/api` — Hono API service
  - `packages/content` — MDX lessons, exercises, theme content
  - `packages/supabase` — Migrations, seed data, RLS policies
  - `packages/themes` — Theme CSS, assets, manifests
  - `packages/shared` — Shared types, utilities, constants
- [ ] TypeScript 5.x strict mode — no `any` in production code
- [ ] ESLint + Prettier configuration (shared config package)
- [ ] Pre-commit hooks: husky + lint-staged (lint, typecheck, format)
- [ ] Configure Tailwind CSS 4 with `@theme` directive + CSS custom properties for theming
- [ ] Font delivery: self-host Inter + JetBrains Mono (not Google Fonts CDN)
  - Font subsetting for performance
  - `font-display: swap` to prevent FOIT
  - Preload critical font files

### 1b. Hono API Backend

- [ ] Set up Hono API service (`apps/api`)
- [ ] Configure middleware (CORS, auth validation, rate limiting)
- [ ] Deploy independently to Fly.io / Railway
- [ ] API versioning strategy (e.g., `/api/v1/`)

### 1c. Database Setup

- [ ] Set up Supabase project (Postgres + Auth)
- [ ] Create database tables per tech-spec schema:
  - `profiles` (id, email, display_name, avatar_url, preferred_theme, github_connected, onboarding_completed, created_at)
  - `purchases` (id, user_id, theme_ids text[], amount, currency, stripe_session_id, created_at)
  - `theme_progress` (id, user_id, theme_id, module_id, lesson_id, status, score, hints_used, completed_at)
  - `waitlist_signups` (id, email, theme_id, created_at)
- [ ] Row-Level Security (RLS) policies on all tables (user can only read/write own data)
- [ ] Indexing strategy: user_id on all tables, compound index on (user_id, theme_id, module_id) for theme_progress
- [ ] Migration strategy using Supabase CLI (`supabase db diff`, `supabase db push`)
- [ ] Seed script for demo/test data (sample user, sample progress, sample purchase)
- [ ] Connection pooling via Supabase built-in pgBouncer
- [ ] Automated daily backups (Supabase managed)

### 1d. CI/CD Pipeline

- [ ] GitHub Actions workflow:
  - **On PR:** Lint → Typecheck → Unit tests → Integration tests → Content validation → Vercel preview deploy
  - **On merge to main:** All above + E2E tests → Vercel production deploy
- [ ] Vercel configuration:
  - Staging environment (preview branches)
  - Production environment (main branch)
  - Environment variables per environment (Supabase keys, Stripe keys, PostHog key, Sentry DSN)
  - Edge Functions for PPP geo-lookup
- [ ] Fly.io / Railway for Hono API backend (independent deployment)
- [ ] Branch protection rules: require PR review, require CI pass, no force push to main
- [ ] Rollback strategy: Vercel instant rollback to previous deployment
- [ ] ISR / caching strategy per page type (PRD 5.4):
  - Theme selection: ISR 60s revalidation
  - Lesson pages: ISR 300s revalidation
  - Dashboard: CSR (no caching, real-time data)
  - Landing / pricing: SSG (static generation)
- [ ] Cache invalidation on content updates (redeploy trigger)

### 1e. Monitoring & Error Tracking

- [ ] Sentry integration with source maps
  - Tag errors by lessonId, themeId, userId (hashed)
  - Separate Sandpack errors from platform errors
  - Alert on error rate spikes
- [ ] Vercel Analytics for Core Web Vitals (zero-config)
  - Targets: LCP < 2.5s, CLS < 0.1, INP < 200ms
- [ ] PostHog setup (EU region for GDPR):
  - Session replay enabled at 10% sampling
  - Auto-tag replays with lessonId and themeId
  - Feature flags (server-side via Next.js middleware)
  - PII policy: no name/email sent, users identified by hashed userId
  - Data retention: raw events 12 months, aggregated metrics indefinitely

### 1f. Security Foundations

- [ ] CORS configuration for API endpoints
- [ ] CSP headers for Next.js (allow Sandpack iframe, Google Fonts, PostHog, Sentry)
- [ ] Secrets management via Vercel env vars (frontend) + Supabase vault (backend)
- [ ] Rate limiting on API routes (general limits + 5,000 req/hr for GitHub App per installation)
- [ ] OAuth scope validation: minimal scopes at signup, `repo` scope requested only on GitHub connect
- [ ] XSS prevention in MDX rendering pipeline (sanitize custom components)

---

## Phase 2: Core Pages & Auth

### 2a. Auth System

- [ ] Supabase Auth integration:
  - GitHub OAuth (via NextAuth.js v5, PKCE flow) — request minimal scopes at signup
  - Google OAuth
  - Email magic link (15-minute expiry)
- [ ] Sign up / login page (from `prototypes/auth.html`)
- [ ] Guest browsing mode (view Module 1 content without account)
- [ ] Session management and protected routes (Next.js middleware)
- [ ] OAuth error handling (failed auth, revoked tokens, scope denied)

### 2b. Onboarding Flow

- [ ] 3-step post-signup flow (from `prototypes/onboarding.html`):
  1. Welcome screen — headline "You Already Think Like an ML Engineer"
  2. Theme selection — Deep Orbit pre-highlighted as recommended
  3. Confirmation + "Begin Module 1" CTA
- [ ] Dynamic module/lesson counts — show "5 Modules, 25 Lessons" for V0.5 (driven by content source, not hardcoded)
- [ ] Onboarding completion persistence — store `onboarding_completed` flag in `profiles`, skip on future logins
- [ ] Stepper indicator showing progress through 3 steps
- [ ] Track `onboarding_completed` analytics event

### 2c. Legal & Compliance

- [ ] Terms of Service page (`/terms`)
- [ ] Privacy Policy page (`/privacy`)
- [ ] Cookie consent banner (GDPR/CCPA)
- [ ] Wire all footer placeholder links (`auth.html` line 344, all site footers)
- [ ] PostHog EU region for GDPR compliance
- [ ] Data processing agreements with third-party services (Supabase, Stripe, PostHog, Sentry)
- [ ] Must be live before payment processing is enabled

### 2d. Landing Page

- [ ] Build from `prototypes/landing.html`
- [ ] Hero with breathing color washes + dot grid animation
- [ ] Headline: "The Bridge from Frontend to ML Is Shorter Than You Think"
- [ ] Theme showcase: Deep Orbit hero card (2-col + code mockup) + 4 coming-soon cards in 2x2 grid
- [ ] FE-to-ML bridge examples section
- [ ] Respect `prefers-reduced-motion` for all animations

---

## Phase 3: Learning Experience & Content Pipeline

### 3a. MDX Content Pipeline

- [ ] Configure Velite with Zod schemas for MDX content:
  - 15 required frontmatter fields: id, title, slug, module, moduleTitle, order, estimatedMinutes, difficulty, objectives, keywords, hasExercise, hasQuiz, publishedAt, updatedAt, authors
  - Conditional validation: exerciseId required if hasExercise = true
  - Enum enforcement: difficulty ∈ {beginner, intermediate, advanced}
  - Format validation: ISO 8601 dates, kebab-case slugs
- [ ] Code Hike (Shiki) syntax highlighting for code blocks (runnable vs editable flags)
- [ ] MDX component library:
  - `<LearningObjectives>` — 2-5 items, displayed as checklist
  - `<Concept>` — title + explanation callout
  - `<MathBlock>` — KaTeX rendering (unblocks Module 2+)
  - `<CodeBlock>` — syntax highlighting, copy button, language spec
  - `<Exercise>` — Sandpack integration (exerciseId → JSON definition)
  - `<Quiz>` — question array with answer key validation
  - `<KeyTakeaways>` — 3-5 key points
  - `<RecallPrompt>` — spaced repetition prompts
  - `<BridgeCallout>` — FE-to-ML bridge with tier color coding (Identity=#00D4FF, Structural=#7B68EE, Intuition=#F0C75E)
  - `<InteractiveDemo>` — interactive ML visualizations (unblocks Module 3+)
  - `<Dialogue>` — speaker label + styled speech bubble (from lesson-viewer.html prototype)
- [ ] Generate `lesson-manifest.json` from content at build time
- [ ] Content preview/staging server for authors

### 3b. Content Authoring Workflow

- [ ] Style guide and content templates (required before content production at scale)
- [ ] Editorial review process: author → technical reviewer (ML accuracy) → narrative reviewer (voice/tone)
- [ ] First 10 lessons set the quality bar; all subsequent reviewed against these
- [ ] Platform component build order (from tech-spec Section 6 — components must ship before content that depends on them):
  - **Week 1–2:** MDX rendering, `<CodeBlock>`, `<LearningObjectives>`, `<Concept>`, `<KeyTakeaways>`
  - **Week 2:** `<MathBlock>` (KaTeX) — unblocks Module 2
  - **Week 2–3:** Sandpack `<Exercise>` — unblocks Module 1 Lesson 3+
  - **Week 2–3:** Theme system, Progress tracking API
  - **Week 3:** `<Quiz>` — unblocks Module 4
  - **Week 3–4:** `<InteractiveDemo>` — unblocks Module 3 Lesson 7+
  - **Week 4:** `<RecallPrompt>`, GitHub commit flow — unblocks Module 4 Lesson 15

### 3c. Content Validation (CI-Time)

- [ ] Frontmatter schema validation (Zod — fail build on invalid)
- [ ] Broken internal link checking (cross-file lesson references, prerequisites)
- [ ] Exercise validation: starter code compiles/runs, solution passes all tests
- [ ] Image asset validation: paths exist, alt-text present
- [ ] Bridge validation: all 26 shared + 6 Deep Orbit-specific bridges present and tagged with tier
- [ ] 5C Loop structure enforcement per lesson:
  1. **Context** — narrative scene set
  2. **Concept** — ML concept with FE bridge
  3. **Code** — hands-on exercise
  4. **Challenge** — stretch problem
  5. **Consequence** — story progression
- [ ] Difficulty progression validation within modules (beginner → intermediate → advanced)

### 3d. Module Overview

- [ ] Build from `prototypes/module-overview.html`
- [ ] Dynamic progress nodes — query `theme_progress`, render locked/in-progress/completed states
- [ ] Story panel with theme narrative (character + mission context)
- [ ] Module prerequisite enforcement: complete Module N to unlock Module N+1
- [ ] Visual locked state for unstarted modules (lock icon, reduced opacity, "Complete Module X to unlock" tooltip)
- [ ] V0.5: Show Modules 1–5 only for Deep Orbit

### 3e. Lesson Viewer

- [ ] Build from `prototypes/lesson-viewer.html`
- [ ] 3-column layout: narrative sidebar, main content, bridge/quiz sidebar
- [ ] Real MDX content rendering (replace hardcoded HTML)
- [ ] In-lesson checks: 2-3 lightweight knowledge checks per lesson (not graded, immediate feedback)
- [ ] Mobile responsive sidebar with slide-in animation (pattern from prototype)
- [ ] Track `lesson_started` and `lesson_completed` analytics events
- [ ] Track scroll depth for engagement validation (target: 75%+ completion depth)

### 3f. Exercise Editor

- [ ] Build from `prototypes/exercise.html`
- [ ] Sandpack integration for live code execution:
  - Dynamic import with `ssr: false` to prevent SSR inclusion
  - Styled skeleton placeholder to prevent layout shift (CLS = 0)
  - Intersection Observer to delay hydration until scrolled into viewport (within 200px)
  - Preload hint (`<link rel="preload">`) when `hasExercise: true`
- [ ] Custom lightweight test runner: `describe`, `it`, `expect`, `assertClose` (for floating-point ML outputs)
- [ ] 10-second execution timeout per test suite
- [ ] Partial credit system: individual assertions pass independently
- [ ] Test output: checklist of passing/failing, console.log/console.error captured separately
- [ ] Hint system with progressive reveal (track `hint_requested` event)
- [ ] Friendly error messages (Sandpack errors tagged separately in Sentry)
- [ ] Track `checkpoint_passed` and `capstone_submitted` events

### 3g. Deep Orbit Content (V0.5 — Modules 1–5)

- [ ] Module 1: Tensors, Shapes, Operations, Data Loading, Normalization (5 lessons)
- [ ] Module 2: Layers, Activations, Forward Pass, Loss Functions, Gradient Descent (5 lessons)
- [ ] Module 3: CNN Basics, Kernels, Pooling, Feature Maps, Image Classification Capstone (5 lessons)
- [ ] Module 4: Training Loop, Overfitting, Regularization, Metrics, Hyperparameters (5 lessons)
- [ ] Module 5: Time-Series Intro, Signal Processing, FFT, Sliding Windows, Signal Classification Capstone (5 lessons)
- [ ] All 25 lessons follow 5C Loop structure
- [ ] All FE-to-ML bridges present (20 shared + 6 Deep Orbit-specific)
- [ ] Character voices consistent: Commander Adaeza, Dr. Hana Sato, Chief Maria Torres, Echo (AI)
- [ ] Narrative arc: setup (M1-2) → rising action (M3-4) → midpoint (M5 capstone)

---

## Phase 4: Payments & Access Control

### 4a. Pricing Page

- [ ] Build from `prototypes/pricing.html`
- [ ] 4 individual tiers: Free Preview ($0), Single Theme ($79), Two Themes ($129), Three Themes ($169)
- [ ] Team pricing: Team 5 ($599), Team 10 ($999), Site License ($2,999)
- [ ] FAQ accordion (interactive)
- [ ] Feature comparison table

### 4b. Stripe Integration

- [ ] Stripe Checkout sessions for one-time payments
- [ ] Support credit card, Google Pay, Apple Pay
- [ ] Webhook handling with signature validation:
  - `checkout.session.completed` → write purchase to `purchases` table, send confirmation email
  - `charge.refunded` → update purchase record, revoke access
  - `charge.failed` → display error modal with retry + support link
- [ ] Webhook retry logic / dead-letter queue for failed deliveries
- [ ] Payment failure error modal on pricing page (PRD 4.6)
- [ ] Upgrade path: credit amount already paid toward higher tier
- [ ] Track `purchase_completed` and `refund_requested` events

### 4c. Paywall & Access Control

- [ ] Route guard middleware — check `purchases` table for theme access
- [ ] Paywall modal when free-tier user attempts Module 2+ (from `prototypes/paywall.html`)
- [ ] Upgrade path from paywall → pricing page
- [ ] Track `paywall_hit` and `upgrade_modal_shown` events

### 4d. Post-Purchase Confirmation

- [ ] Build from `prototypes/purchase-confirmation.html`
- [ ] Show unlocked modules list, next steps, Discord invite
- [ ] Redirect here after successful Stripe checkout

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

### 5a. Dashboard

- [ ] Build from `prototypes/dashboard.html`
- [ ] Real progress stats from `theme_progress` table (modules completed, lessons done, current streak)
- [ ] Streak calculation from `completed_at` timestamps
- [ ] Activity feed (recent lesson completions, achievements)
- [ ] Track `streak_achieved` event (3-day, 7-day, 30-day milestones)
- [ ] Skill radar: radar chart showing proficiency across 6 axes (PRD 3.4)
- [ ] Progress ring: circular SVG indicator (from dashboard.html prototype)
- [ ] Share snapshot: html2canvas 2x PNG with watermark, share modal with Clipboard API + Web Share API fallback (ui-ux-notes 2.5)
- [ ] Activity heatmap (post-V0.5 — query `theme_progress` by `completed_at` date, render SVG)

### 5b. Settings

- [ ] Build from `prototypes/settings.html`
- [ ] Profile editing (display name, avatar)
- [ ] GitHub connection toggle with retroactive push
- [ ] Theme preference switching ("Theme applies to your learning content and code editor")
- [ ] Notification preferences
- [ ] Account management (danger zone: delete account, export data)

### 5c. Theme Selection

- [ ] Build from `prototypes/theme-selection.html`
- [ ] Deep Orbit as available, 4 themes as "Coming Soon"
- [ ] "Notify Me" email capture → `waitlist_signups` table with theme_id, confirmation toast
- [ ] Coming-soon modal with theme preview + email input
- [ ] Track `theme_selected` event

### 5d. GitHub Integration

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
- [ ] `@media (prefers-reduced-motion: reduce)` — disable/simplify all animations globally
- [ ] Screen reader testing (VoiceOver on macOS, NVDA on Windows)
- [ ] Automated accessibility testing: jest-axe (unit), axe-playwright (E2E)
- [ ] Color contrast audit (4.5:1 minimum for text, 3:1 for UI components)
- [ ] Image alt-text on all images

### 6b. Mobile Responsiveness

- [ ] Hamburger menu component with slide-in drawer (reuse `lesson-viewer.html` sidebar pattern)
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

- [ ] Structured data: Course schema, Organization schema (JSON-LD)
- [ ] Dynamic OG images via Vercel OG (per-page, per-lesson)
- [ ] Sitemap generation (next-sitemap)
- [ ] robots.txt with crawl directives
- [ ] Canonical URLs on all pages
- [ ] Blog infrastructure (MDX-based, target: 2 posts/week)
- [ ] Google Search Console setup
- [ ] Target keywords: "learn machine learning JavaScript", "TensorFlow.js tutorial", "ML for front-end developers"

### 6e. Error Handling

- [ ] Global error boundary component (React)
- [ ] Custom 404 page (themed, with navigation back to dashboard)
- [ ] Custom 500 page (error logged to Sentry, user-friendly message)
- [ ] User-friendly error messages for:
  - Payment failures (retry + support link)
  - Auth failures (provider-specific guidance)
  - GitHub integration failures (retry + disconnect option)
  - Exercise execution errors (separate from platform errors in Sentry)

### 6f. Community & External Links

- [ ] Create Discord server with channels: #general, #deep-orbit, #help, #feedback, #beta-testers
- [ ] Replace all Community placeholder `href="#"` links with Discord invite URL
- [ ] Purchase confirmation Discord CTA with invite link
- [ ] Create Twitter/X account
- [ ] Replace all Twitter placeholder `href="#"` links across 9 pages
- [ ] Set up social media OG meta tags

---

## Phase 7: Post-V0.5 Features

### 7a. Bridge Explorer (V1.0)

- [ ] Build from `prototypes/bridge-explorer.html`
- [ ] Browse all 56+ FE-to-ML bridges with filters and search
- [ ] Bridge quality tier color coding (Identity=#00D4FF, Structural=#7B68EE, Intuition=#F0C75E)
- [ ] Gate behind PostHog feature flag, or ship as read-only reference page in V0.5

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

### 7c. Deep Orbit Modules 6–11 (V1.0)

- [ ] Module 6–11 content authoring (30 additional lessons)
- [ ] Full narrative arc completion (rising action → climax → resolution)
- [ ] 2-3 "AI-wrong moments" where the system fails (teaching resilience)
- [ ] Character arc completion for all 4 characters

### 7d. Additional Themes

- [ ] V2.0: Neon Protocol (Cyberpunk — Computer Vision) — Q4 2026
- [ ] V3.0: Signal Ward (Medical — NLP & Text) — Q1 2027
- [ ] V3.0: Nova Canvas (Creative AI — Multimodal & Generative) — Q2 2027
- [ ] V4.0: Terra Grid (Industrial — Edge AI & Production ML) — Q3 2027

### 7e. Bundle & Team Pricing

- [ ] Bundle purchase flow ($129 two themes, $169 three themes)
- [ ] Team license management (admin dashboard, seat assignment, progress reports)
- [ ] Upgrade credit logic (pay difference when moving to higher tier)

### 7f. Module Count Dynamic Updates

- [ ] Drive all module/lesson counts from content source (MDX file count via Velite)
- [ ] Never hardcode — automatically updates when new modules ship

### 7g. Arena (V1.0+)

- [ ] Arena: weekly ML challenges with community leaderboard
- [ ] ELO-style scoring system
- [ ] $29/year subscription (separate from theme purchases)
- [ ] Community solution viewing after submission deadline
- [ ] Challenge authoring pipeline and scheduling

### 7h. Internationalization (V3.0+)

- [ ] next-intl framework integration
- [ ] Machine translation pipeline (DeepL API with custom glossaries)
- [ ] Expert review workflow (native-speaking ML practitioners)
- [ ] Shared ML glossary (`packages/content/glossary.json`)
- [ ] Publishing matrix config (`packages/content/publishing-matrix.json`)
- [ ] Phase 1: Spanish, Portuguese (triggered by ≥500 MAU from LATAM)
- [ ] Phase 2: Japanese, Korean, Chinese (triggered by ≥1,000 MAU from APAC)
- [ ] Phase 3: French, German, Arabic (triggered by ≥2,000 MAU)

---

## Phase 8: Testing & Quality Assurance

### 8a. Unit Tests

- [ ] Jest + React Testing Library for components and hooks
- [ ] Test coverage for:
  - Auth flows (login, signup, logout, session refresh)
  - Progress calculation logic (streak, completion %)
  - Payment webhook handlers
  - MDX component rendering
  - Bridge callout rendering with correct tier colors
- [ ] Accessibility: jest-axe on all component tests

### 8b. Integration Tests

- [ ] Supabase integration: CRUD on all 4 tables, RLS policy enforcement
- [ ] Stripe webhook flow: checkout → purchase record → access grant
- [ ] GitHub integration: token acquisition → commit → push
- [ ] Content pipeline: MDX → rendered lesson with all components

### 8c. E2E Tests (Playwright)

- [ ] Full user journeys:
  - New user: landing → signup → onboarding → Module 1 lesson → complete exercise
  - Payment: pricing → checkout → confirmation → Module 2 unlocked
  - GitHub: settings → connect → verify repo created → verify commit pushed
  - Capstone: complete all modules → capstone screen → certificate download
- [ ] Mobile viewport tests (iPhone SE, iPad Air)
- [ ] Accessibility: axe-playwright on all page routes

### 8d. Visual Regression

- [ ] Playwright screenshot comparison for key pages
- [ ] Theme switching visual tests (all 5 themes render correctly)
- [ ] Responsive layout tests at each breakpoint

### 8e. Performance Testing

- [ ] Lighthouse CI in GitHub Actions:
  - Performance score ≥ 90
  - Accessibility score ≥ 95
  - Best Practices score ≥ 90
  - SEO score ≥ 95
- [ ] Bundle size regression checks (fail if main bundle grows >10% without explanation)
- [ ] Sandpack load time benchmarks (< 3s to interactive on 3G)

### 8f. Exercise Validation

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

### 9b. Content Quality Audits

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

### 9c. Analytics-Driven Content QA (Post-Launch)

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
- [ ] All 25 lessons pass content validation CI checks
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

## Version Roadmap

| Version | Content | Target |
| --- | --- | --- |
| V0.5 | Deep Orbit Modules 1–5 (25 lessons, MVP) | Q2 2026 |
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
