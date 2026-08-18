# Tensorcraft - Architecture

> **⚠ V1 launch-scope revert (2026-05-05):** This document still describes
> the "all 5 worlds simultaneously" model. The actual V1 ships **Deep Orbit
> only**; the other 4 worlds are gated behind a waitlist. The launched-set
> source of truth lives in `packages/shared/src/constants.ts` →
> `LAUNCHED_WORLDS`. Treat any "5 worlds live" assertion below as scoped
> down to the launched subset until the docs are rewritten. See
> [`docs/launch-scope.md`](./launch-scope.md).

## Overview

Tensorcraft is an interactive, story-driven ML education platform for JavaScript engineers. Users learn machine learning through **50+ deep structural mappings** between JavaScript concepts they already know and ML concepts they're learning - not casual analogies, but real architectural parallels.

## Monorepo Structure

```
tensorcraft/
├── apps/
│   ├── web/          Next.js 15 frontend (port 3000)
│   └── api/          Hono backend (port 3001)
├── packages/
│   ├── config/       Shared ESLint, TypeScript, Tailwind configs
│   ├── content/      MDX lessons, exercises, Velite config, content queries
│   ├── shared/       Shared types, utilities, constants
│   ├── worlds/       5 world manifests + CSS custom properties
│   ├── ui/           Shared React component library + MDX components
│   ├── supabase/     Database types, clients, migrations
│   └── github/       GitHub integration utilities
├── docs/             Project documentation
├── e2e/              Playwright E2E tests
├── turbo.json        Turborepo task configuration
└── pnpm-workspace.yaml
```

**Tooling**: pnpm (workspaces) + Turborepo (task orchestration) + TypeScript (strict mode everywhere).

## Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Frontend | Next.js 15 (App Router) | RSC, Turbopack dev, file-based routing |
| Backend | Hono | Lightweight, edge-ready, separate from Next.js for independent deployment |
| Database | Supabase (PostgreSQL) | Auth, RLS, real-time, generous free tier |
| Styling | Tailwind CSS 4 | CSS-native `@world` directive, zero-JS theming |
| Animation | Framer Motion | Declarative, layout animations, gesture support |
| Content | MDX 3 + Velite (Zod schemas) | Type-safe content with build-time validation. 3 collections: lessons, exercises, modules |
| Code Highlighting | Shiki 4.x (via CodeBlock component) | Custom `tensorcraft-dark` + `tensorcraft-light` worlds (picked via `data-scheme`); lazy-loaded singleton; 11 languages. Code Hike deferred to post-V1 |
| Code Exercises | Sandpack (CodeSandbox) | Browser-based code playgrounds with custom async test runner and TF.js mock (295 exercises) |
| Payments | Stripe Checkout + Webhooks | One-time purchases, webhook-driven fulfillment |
| Email | Kit (ConvertKit) | Waitlist, per-world segmented lists, nurture sequences |
| Analytics | PostHog + Plausible | PostHog (product analytics, consent-gated) with user identification on sign-in. Plausible (marketing analytics, consent-gated via `tc-cookie-consent` localStorage key). 8 domain events tracked: lesson_started, lesson_completed, exercise_submitted, paywall_shown, checkout_started, checkout_completed, world_selected, streak_achieved. |
| Fonts | Inter + JetBrains Mono | Clean UI + monospace for code/technical content |

## World System

### Design Philosophy

Brutalist Terminal aesthetic with sharp edges (zero border-radius), offset box shadows (`4px 4px 0`), monospace-first typography (JetBrains Mono), and solid backgrounds. No glow effects, no glassmorphism. Every world has a unique color palette but shares the same structural design tokens. Light and dark color schemes are both supported (added 2026-07-22): dark remains the brand-default aesthetic, light mode follows the OS `prefers-color-scheme` by default with a manual override toggle, and every world palette has a light variant with WCAG AA-verified contrast. OG images and favicons intentionally stay dark. See `docs/audits/light-mode-readiness-2026-07-22.md` for the design rationale. Shipped 2026-07-23; `docs/dev-plan.md` (2026-07-23 entry) has the implementation and verification record.

### 5 Worlds

| World | Specialization | Primary | Accent |
|-------|---------------|---------|--------|
| Deep Orbit | Time-Series & Signals | `#6BAA8A` | `#A89060` |
| Neon Protocol | Computer Vision | `#4A90D9` | `#A07090` |
| Signal Ward | NLP & Text Intelligence | `#65C07D` | `#7096B0` |
| Nova Canvas | Multimodal & GenAI | `#D07070` | `#7868A8` |
| Terra Grid | Edge AI & MLOps | `#C49535` | `#6BAA8A` |

### How Theming Works

1. **CSS Custom Properties** (`packages/worlds/src/css/worlds.css`): Each world defines `--tc-*` variables under a `[data-world="world-slug"]` selector.
2. **Tailwind 4 `@world`** (`apps/web/app/globals.css`): Maps Tailwind utility classes to `--tc-*` variables so `bg-surface`, `text-primary`, `border-border` all resolve dynamically. (`packages/config/tailwind/base.css` was a dead duplicate and was deleted 2026-07-22.)
3. **Runtime Switching**: Set `data-world` attribute on `<html>` to switch narrative worlds, and `data-scheme="light"` for the light color scheme (absent = dark). No JS bundle cost - pure CSS resolution.
4. **Brutalist Utilities** (`apps/web/app/globals.css`): `.brutalist-shadow`, `.brutalist-hover`, `.comment-label` - offset box shadows and monospace section labels. All animations respect `prefers-reduced-motion`.

### World Manifests

Each world (`packages/worlds/src/<world>.ts`) exports a `WorldManifest` with:
- **Palette**: bg, primary, accent, surface, surfaceOverlay, text, muted, border, codeBg colors
- **Characters**: 5 per world (4 human mentors + 1 AI companion)
- **Terminology**: World-specific names for modules/lessons/exercises (e.g., Deep Orbit uses "Mission", "Sector", "Simulation")
- **Career paths** and metadata

## Database Schema (Supabase)

### Tables

- **`profiles`** - Extends `auth.users`. Auto-created via trigger on signup. Fields: display_name, avatar_url, github_username.
- **`world_progress`** - Per-lesson tracking. Fields: world_id, module_id, lesson_id, status (not_started/in_progress/completed), score, hints_used, timestamps. Unique constraint on (user_id, world_id, module_id, lesson_id).
- **`purchases`** - Payment records from Stripe webhooks. Fields: plan_id, world_ids (text[]), amount, currency, stripe_session_id, status.
- **`waitlist`** - General newsletter signups (originally for coming-soon world capture; repurposed since all 5 worlds launch simultaneously). Public insert policy.
- **`streaks`** - Per-world streak tracking. Fields: user_id, world_id, current_streak, longest_streak, last_activity_date, timestamps.
- **`achievements`** - User achievements. Fields: user_id, achievement_type, world_id, metadata (JSONB), earned_at, timestamps.
- **`exercise_attempts`** - Exercise submission history. Fields: user_id, exercise_slug, lesson_id, world_id, score, hints_used, duration_ms, submitted_code, attempted_at, timestamps.
- **`skill_genome`** - Stores computed skill genome scores per user per world. Fields: user_id, world_id, axis scores. Created in migration 010.
- **`skill_events`** - Partitioned table for tracking skill axis events. Fields: worldId, skillAxis, eventType, metadata, timestamp. Created in migration 013.

### Row-Level Security

All tables have RLS enabled:
- `profiles`: Users can only read/update their own profile
- `world_progress`: Users can only CRUD their own progress
- `purchases`: Users can read their own; inserts are server-only (via service role)
- `waitlist`: Anyone can insert (public); only service role can read
- `streaks`: Users can only CRUD their own streaks
- `achievements`: Users can only read their own; inserts are server-only
- `exercise_attempts`: Users can only CRUD their own attempts

### Views

- **`world_progress_summary`** - Aggregated completion stats per user per world. Columns: user_id, world_id, total_lessons, completed_lessons, in_progress_lessons, first_started_at, last_completed_at, completion_percent. Inherits RLS from underlying `world_progress` table.

### Auto-created Resources

- **Trigger**: `on_auth_user_created` → auto-inserts a `profiles` row
- **Indexes**: On user_id + world_id for progress queries, email for waitlist lookups

## Hono API (`apps/api`)

Separate backend service running on port 3001. Communicates with Supabase using the service role key for privileged operations.

### Current Routes

- `GET /api/health` - Health check returning `{ status: "ok", service: "tensorcraft-api", timestamp }`
- `POST /api/waitlist` - Add email to waitlist (no auth required, validates email, handles duplicates)
- `GET /api/progress?worldId=` - Get user's progress for a world (authenticated)
- `POST /api/progress` - Create or update lesson progress (authenticated, upserts on user_id+world_id+lesson_id)
- `POST /api/payments/webhook` - Stripe webhook handler (checkout.session.completed, charge.refunded)
- `POST /api/payments/checkout` - Create Stripe checkout session (authenticated)
- `GET /api/progress/summary` - Aggregated progress across all worlds using `world_progress_summary` view (authenticated)
- `GET /api/admin/stats` - Dashboard stats: waitlist count, user count, purchases, revenue (admin auth required)
- `GET /api/admin/waitlist` - Paginated waitlist entries (admin auth required)

> Admin routes support two auth methods: (1) Supabase role-based auth (user with admin role) - preferred, and (2) API key via `x-admin-key` header - fallback for CI/scripts.
- `GET /api/exercise-attempts` - Get user's exercise attempts (authenticated)
- `POST /api/exercise-attempts` - Submit exercise attempt (authenticated)
- `GET /api/profiles/me` - Get current user profile (authenticated)
- `PUT /api/profiles/me` - Update current user profile (authenticated)

### Middleware

- **Security Headers**: Sets CSP, HSTS, X-Content-Type-Options, X-Frame-Options, and generates a unique `X-Request-ID` per request (`security-headers.ts`)
- **CORS**: Allows `localhost:3000` (dev) and `tensorcraft.app` (prod). Configurable via `CORS_ORIGINS` env var.
- **Auth**: Validates Supabase JWT from Authorization header, sets `userId` and `accessToken` on context
- **Rate Limiting**: `@upstash/ratelimit` fixed window over Upstash Redis (distributed). 60 req/min per subject (bearer-token hash first, IP fallback). Fixed window costs 2 Redis commands/request vs sliding's 4 (Upstash bills commands inside EVAL scripts), and already-blocked subjects are 429'd from an in-process cache at zero Redis cost. Exempt: Stripe/Kit webhook routes and `/api/health` (liveness; Fly + Docker probes were burning the Upstash command quota). `/api/health/ready` is not exempt.

## Next.js Frontend (`apps/web`)

### Configuration

- **Turbopack** for development (via `next dev --turbopack`)
- **Transpile** all workspace packages via `next.config.ts`
- **PostCSS** with `@tailwindcss/postcss` for Tailwind 4

### User Menu Component (`app/components/user-menu.tsx`)

- Auth state detection via Supabase `onAuthStateChange`
- Avatar initial button with dropdown (Dashboard, Settings, Sign Out)
- Falls back to "Start now" link for unauthenticated users
- Click-outside handler to close dropdown

### Checkout Flow (`app/pricing/checkout-button.tsx`)

- Client component that calls `/api/payments/checkout` with auth token
- Redirects to Stripe checkout URL
- Redirects unauthenticated users to sign-in page

### Landing Page (`app/page.tsx`)

Client component with Framer Motion animations:

- ParticleField canvas background
- Letter-by-letter title reveal with stagger
- JS→ML bridge showcase (6 featured bridges with animated connectors)
- World preview cards with brutalist offset shadow hover effects
- Stats section and CTA with brutalist styling
- Scroll-triggered animations throughout

### Animation Patterns

- `fadeUp` variant with custom delay per index
- `staggerContainer` for sequential child reveals
- `letterAnimation` for character-by-character text
- `whileInView` for scroll-triggered entries
- `whileHover` for interactive hover states

### SEO Setup

- **Canonical URLs**: Set on root layout (`https://tensorcraft.app`), all world pages, all lesson pages, and capstone pages via Next.js `alternates.canonical` in `generateMetadata`.
- **Structured Data (JSON-LD)**: Root layout emits an Organization schema and one Course schema per world (5 courses total), each with pricing ($59), educational level, and `teaches` fields. Script tag in `<head>` via `dangerouslySetInnerHTML`. Lesson pages additionally emit `LearningResource` schema (name, description, educationalLevel, timeRequired, isPartOf Course) and `BreadcrumbList` schema (Home > World > Module > Lesson).
- **Dynamic OG Images**: All pages use `/api/og` (Vercel OG) with per-page `title`, `world`, and `subtitle` query params. No static `/og-image.png` fallback.
- **Sitemap** (`app/sitemap.ts`): Static routes + 5 world pages + 275 lesson pages (all worlds) + glossary term pages + bridge concept pages. Lesson routes built from `getWorldLessons` at build time.
- **robots.txt**: Crawl directives configured.
- **AI Discoverability**: `llms.txt` (product description for AI crawlers), `.well-known/ai-plugin.json` (OpenAI plugin metadata), FAQ schema in JSON-LD, `/learn` page for answer engine queries.
- **Internal Linking Strategy**: Landing page links to `/learn` (below hero) and `/glossary` (final CTA). `/learn` page links to all 5 world pages, `/glossary`, and `/pricing`. `/worlds` page includes enriched intro copy and a "Why 5 Worlds?" explainer section for topical depth.

### Accessibility (WCAG 2.1 AA)

- Skip-to-content link on all pages
- Form labels (visible or `sr-only`) on all inputs
- `aria-pressed` on filter toggle buttons
- `aria-label` on OAuth buttons and SVG icons
- Focus trap and focus restore on modals
- `role="progressbar"` with `aria-valuenow/min/max` on progress bars
- Lesson CUT-TO scene divider is decorative (`aria-hidden="true"`)
- Color-only indicators supplemented with text labels

### Error Tracking (`apps/api/src/lib/error-tracking.ts`)

- Structured JSON error logging (Sentry-compatible API shape)
- `captureException(error, context)` and `captureMessage(message, context)` functions
- Ready for Sentry SDK drop-in replacement

## Testing Infrastructure

### Test Framework

| Tool | Purpose | Config |
|------|---------|--------|
| Vitest v4.0.18 | Unit tests (jsdom environment) | `vitest.config.ts` |
| React Testing Library | Component rendering + interaction | `vitest.setup.ts` |
| Playwright v1.58.2 | E2E browser tests (Chromium) | `playwright.config.ts` |
| vitest-axe | Unit-level WCAG accessibility checks | Registered in `vitest.setup.ts` |
| @axe-core/playwright | E2E accessibility audits | Used in `e2e/accessibility.spec.ts` |

## Content Pipeline (`packages/content`)

### How Content Works

1. **MDX files** in `packages/content/content/deep-orbit/{module}/{lesson}.mdx` - YAML frontmatter (5C Loop fields) + MDX body (components)
2. **Exercise YAML** in `packages/content/content/deep-orbit/{module}/exercises/{slug}.yaml` - starterCode, solutionCode, testCode
3. **Module metadata** in `packages/content/content/deep-orbit/{module}/module.yaml` - slug, title, order, description
4. **Velite** (`velite.config.ts`) compiles MDX → `.velite/` output at build time via `pnpm --filter @tensorcraft/content build:content`
5. **Content queries** (`src/queries.ts`) - pure functions over Velite output: `getModules`, `getModuleLessons`, `getLesson`, `getExercise`, `getAdjacentLessons`
6. **Turbo dependency** - `build:content` runs before `build` via `dependsOn: ["^build:content"]`

### MDX Rendering

Velite compiles MDX to function body strings. The `LessonContent` client component (`apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx`) renders them using `new Function()` with `react/jsx-runtime` injection and frontmatter scope.

### MDX Components (`packages/ui/src/mdx/`)

| Component | Type | Purpose |
|-----------|------|---------|
| `Dialogue` | Server | Speaker label + styled blockquote |
| `BridgeCallout` | Server | FE↔ML 3-column grid with tier colors |
| `CodeBlock` | Client | Code with copy button + language badge |
| `HintPanel` | Client | 3-level progressive disclosure |
| `LearningObjectives` | Server | Checklist at lesson top |
| `KeyTakeaways` | Server | Summary card at lesson bottom |
| `Exercise` | Client | Placeholder for Sandpack (V0.5) |
| `Quiz` | Client | Multiple-choice with feedback |

### V0.5 Content Scope

- 11 modules per world, 55 lessons each (275 total across 5 worlds)
- 295 exercises with starter/solution/test code
- Exercises use async test runner with TensorFlow.js mock for in-browser execution

## Learning Routes (`apps/web/app/worlds/`)

| Route | Page | Purpose |
|-------|------|---------|
| `/worlds` | World listing | Grid of 5 worlds, all LIVE |
| `/worlds/[slug]` | World detail | Module map with dossier accordion (shows all modules + expandable lesson lists), layout sets `data-world` |
| `/worlds/[slug]/[module]/[lesson]` | Lesson viewer | 6-step progression (no sidebar); step-based nav with segmented, clickable progress bar; focus mode (global marketing nav hidden); screenplay register for story content (pre-heading story zone styled as stage directions + CUT-TO divider via `:has()` rules in `globals.css`) |

### Lesson Page Architecture (`app/worlds/[slug]/[module]/[lesson]/`)

The lesson page uses a three-component split:

| File | Type | Responsibility |
|------|------|----------------|
| `page.tsx` | Server component | Data fetching (Velite), paywall enforcement, prerequisite gating, passes props to client components |
| `lesson-steps.tsx` | Client component | Manages 6-step progression state, renders segmented step bar (visited steps clickable for direct jumps; furthest step reached persisted in `tc_step_max_*` alongside `tc_step_*`), quiet "Mission Map" exit chip, single meta line (minutes + exercise count; bridge tier not learner-facing), script playback on the Briefing step (beat-by-beat reveal, Skip/Replay, auto-scroll to explanation; reduced-motion safe), forward-only bottom nav (backward nav = segmented bar / swipe) |
| `lesson-content.tsx` | Client component | MDX renderer; accepts a `visibleComponents` prop to filter which 5C sections render for the current step, and a `storyRegister` flag (Briefing only) that surfaces as `data-story-register` for the screenplay CSS |

**Step-to-component mapping:**

1. StepBriefing (Context + Dialogue)
2. StepConcept
3. StepCode
4. StepChallenge
5. StepTakeaways
6. StepConsequence

**Mobile:** swipe gestures for step navigation + bottom drawer for lesson list (`lesson-drawer.tsx`). Drawer hidden on desktop (`md:hidden`).

### Test Categories

- **Unit tests** (211 passing): API routes, middleware, components, MDX components, content queries, Zod schemas, shared constants
- **E2E tests** (7 spec files): Landing page, auth pages, legal pages, learning routes (worlds/modules/lessons), accessibility audits, pricing page, onboarding page
- **Accessibility tests**: axe-core on components (unit) + full page audits (e2e)
- **Content contract tests**: Validate content fixtures against Zod schemas
- **Content completeness tests**: Validates every module has 5 lessons, every exercise references a valid lesson
- **Cross-reference tests**: Referential integrity across lessons/modules/exercises
- **Snapshot tests**: Catch unintended markup regressions in components/pages
- **Link validation**: ROUTES constants map to actual `page.tsx` files
- **SEO metadata tests**: Verify title/description on server-rendered pages
- **World CSS tests**: All 5 worlds define required `--tc-*` custom properties

### Running Tests

```bash
# Run all unit tests
pnpm test

# Watch mode
pnpm test:watch

# Update snapshots
pnpm test -- -u

# Run E2E tests (requires dev server running)
pnpm test:e2e
```

## Development Workflow

```bash
# Install all dependencies
pnpm install

# Start dev servers (web:3000 + api:3001)
pnpm dev

# Build all packages and apps
pnpm build

# Lint everything
pnpm lint

# Clean build artifacts
pnpm clean
```

Pre-commit hooks run `prettier --write` and `eslint --fix` on staged `.ts/.tsx/.mts` files.

Turborepo handles dependency ordering: `packages/*` build first, then `apps/*` consume them.

## JS→ML Bridge System

The core pedagogical innovation. Each ML concept is introduced through a JavaScript concept:

Bridges are classified into three quality tiers:
- **Identity** - JS concept *is* the ML concept (e.g., ReLU = `Math.max(0,x)`, Tensor = TypedArray)
- **Structural** - Same pattern, different domain (e.g., Overfitting = CSS that only works on your screen)
- **Intuition** - Useful starting point, refined in-lesson (e.g., Loss = Lighthouse score)

| JavaScript Concept | ML Concept | Tier |
|-----------------|------------|------|
| `Math.max(0, x)` | ReLU Activation | Identity |
| TypedArray + `.shape` | Tensor | Identity |
| CSS `blur()` + kernel | Convolution | Identity |
| Service Worker + Cache | Model Caching | Identity |
| DOM event bubbling | Backpropagation | Structural |
| Slider UI tuning | Gradient Descent | Structural |
| `Promise.all()` chunks | Batch Processing | Structural |
| CSS that only works on your screen | Overfitting | Structural |
| Flexbox `flex-grow` distribution | Attention / Softmax | Structural |
| CSS `nth-child()` | Positional Encoding | Structural |
| CSS custom property overrides | LoRA Fine-tuning | Structural |
| Lighthouse score | Loss Function | Intuition |

26 shared bridges + 30+ world-specific bridges across 5 worlds. See [product-plan.md](product-plan.md) for the complete catalog.

## Session Error Handling

Session errors: `apiFetch` utility (`apps/web/lib/api-fetch.ts`) auto-includes the Supabase auth header and emits a `tc:session-expired` CustomEvent on 401 responses. The `SessionToast` component (`apps/web/app/components/session-toast.tsx`) listens for this event and shows a dismissable banner with a sign-in link that preserves the current URL as redirect target.

## Key Architectural Decisions

1. **Hono as separate backend** - Not embedded in Next.js API routes. Allows independent scaling, deployment, and technology evolution.
2. **Supabase from day 1** - Full schema with RLS, not deferred. Ensures auth and data patterns are established early.
3. **CSS-native theming** - No JS runtime cost for world switching. Tailwind 4's `@world` directive resolves utilities to CSS custom properties.
4. **Dark + brutalist aesthetic** - All worlds are dark with solid backgrounds. Brutalist Terminal style: zero border-radius, offset box shadows, monospace-first typography. No glow or neon effects.
5. **Framer Motion over CSS animations** - Needed for scroll-triggered reveals, layout animations, and gesture-based interactions that CSS alone can't handle cleanly.
6. **Document as we build** - This file is maintained alongside code, updated with each significant architectural change.

## Performance

PostHog captures Core Web Vitals (LCP, CLS, INP). Sandpack lazy-loaded via React.lazy. Content pages use ISR (revalidate: 3600). Bundle analysis via @next/bundle-analyzer.
