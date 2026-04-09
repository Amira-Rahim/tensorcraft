# Tensorcraft — Architecture

## Overview

Tensorcraft is an interactive, story-driven ML education platform for frontend engineers. Users learn machine learning through **50+ deep structural mappings** between frontend concepts they already know and ML concepts they're learning — not casual analogies, but real architectural parallels.

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
│   ├── themes/       5 themed course manifests + CSS custom properties
│   ├── ui/           Shared React component library + MDX components
│   └── supabase/     Database types, clients, migrations
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
| Styling | Tailwind CSS 4 | CSS-native `@theme` directive, zero-JS theming |
| Animation | Framer Motion | Declarative, layout animations, gesture support |
| Content | MDX 3 + Velite (Zod schemas) | Type-safe content with build-time validation. 3 collections: lessons, exercises, modules |
| Code Highlighting | Shiki (via CodeBlock component) | V0.5 uses basic syntax highlighting; Code Hike deferred |
| Code Exercises | Sandpack (CodeSandbox) | Browser-based code playgrounds with Jest |
| Payments | Stripe Checkout + Webhooks | One-time purchases, webhook-driven fulfillment |
| Email | Kit (ConvertKit) | Waitlist, per-theme segmented lists, nurture sequences |
| Analytics | PostHog + Plausible | Product analytics + privacy-friendly marketing analytics |
| Fonts | Inter + JetBrains Mono | Clean UI + monospace for code/technical content |

## Theme System

### Design Philosophy

Dark mode only. Brutalist Terminal aesthetic with sharp edges (zero border-radius), offset box shadows (`4px 4px 0`), monospace-first typography (JetBrains Mono), and solid backgrounds. No glow effects, no glassmorphism. Every theme has a unique color palette but shares the same structural design tokens.

### 5 Themed Courses

| Theme | Specialization | Primary | Accent | Status |
|-------|---------------|---------|--------|--------|
| Deep Orbit | Time-Series & Signals | `#6BAA8A` | `#A89060` | Launched |
| Neon Protocol | Computer Vision | `#4A90D9` | `#A07090` | Coming Soon |
| Signal Ward | NLP & Text Intelligence | `#5BAA70` | `#7096B0` | Coming Soon |
| Nova Canvas | Multimodal & GenAI | `#C06060` | `#7868A8` | Coming Soon |
| Terra Grid | Edge AI & MLOps | `#B08030` | `#6BAA8A` | Coming Soon |

### How Theming Works

1. **CSS Custom Properties** (`packages/themes/src/css/themes.css`): Each theme defines `--tc-*` variables under a `[data-theme="theme-slug"]` selector.
2. **Tailwind 4 `@theme`** (`packages/config/tailwind/base.css`): Maps Tailwind utility classes to `--tc-*` variables so `bg-surface`, `text-primary`, `border-border` all resolve dynamically.
3. **Runtime Switching**: Set `data-theme` attribute on `<html>` to switch themes. No JS bundle cost — pure CSS resolution.
4. **Brutalist Utilities** (`apps/web/app/globals.css`): `.brutalist-shadow`, `.brutalist-hover`, `.comment-label` — offset box shadows and monospace section labels. All animations respect `prefers-reduced-motion`.

### Theme Manifests

Each theme (`packages/themes/src/<theme>.ts`) exports a `ThemeManifest` with:
- **Palette**: bg, primary, accent, surface, surfaceOverlay, text, muted, border, codeBg colors
- **Characters**: 5 per theme (4 human mentors + 1 AI companion)
- **Terminology**: Theme-specific names for modules/lessons/exercises (e.g., Deep Orbit uses "Mission", "Sector", "Simulation")
- **Career paths** and **coming soon** metadata

## Database Schema (Supabase)

### Tables

- **`profiles`** — Extends `auth.users`. Auto-created via trigger on signup. Fields: display_name, avatar_url, github_username.
- **`theme_progress`** — Per-lesson tracking. Fields: theme_id, module_id, lesson_id, status (not_started/in_progress/completed), score, hints_used, timestamps. Unique constraint on (user_id, theme_id, module_id, lesson_id).
- **`purchases`** — Payment records from Stripe webhooks. Fields: plan_id, theme_ids (text[]), amount, currency, stripe_session_id, status.
- **`waitlist`** — Email capture for coming-soon themes. Public insert policy.
- **`streaks`** — Per-theme streak tracking. Fields: user_id, theme_id, current_streak, longest_streak, last_activity_date, timestamps.
- **`achievements`** — User achievements. Fields: user_id, achievement_type, theme_id, metadata (JSONB), earned_at, timestamps.
- **`exercise_attempts`** — Exercise submission history. Fields: user_id, exercise_slug, lesson_id, theme_id, score, hints_used, duration_ms, submitted_code, attempted_at, timestamps.

### Row-Level Security

All tables have RLS enabled:
- `profiles`: Users can only read/update their own profile
- `theme_progress`: Users can only CRUD their own progress
- `purchases`: Users can read their own; inserts are server-only (via service role)
- `waitlist`: Anyone can insert (public); only service role can read
- `streaks`: Users can only CRUD their own streaks
- `achievements`: Users can only read their own; inserts are server-only
- `exercise_attempts`: Users can only CRUD their own attempts

### Views

- **`theme_progress_summary`** — Aggregated completion stats per user per theme. Columns: user_id, theme_id, total_lessons, completed_lessons, in_progress_lessons, first_started_at, last_completed_at, completion_percent. Inherits RLS from underlying `theme_progress` table.

### Auto-created Resources

- **Trigger**: `on_auth_user_created` → auto-inserts a `profiles` row
- **Indexes**: On user_id + theme_id for progress queries, email for waitlist lookups

## Hono API (`apps/api`)

Separate backend service running on port 3001. Communicates with Supabase using the service role key for privileged operations.

### Current Routes

- `GET /api/health` — Health check returning `{ status: "ok", service: "tensorcraft-api", timestamp }`
- `POST /api/waitlist` — Add email to waitlist (no auth required, validates email, handles duplicates)
- `GET /api/progress?themeId=` — Get user's progress for a theme (authenticated)
- `POST /api/progress` — Create or update lesson progress (authenticated, upserts on user_id+theme_id+lesson_id)
- `POST /api/payments/webhook` — Stripe webhook handler (checkout.session.completed, charge.refunded)
- `POST /api/payments/checkout` — Create Stripe checkout session (authenticated)
- `GET /api/progress/summary` — Aggregated progress across all themes using `theme_progress_summary` view (authenticated)
- `GET /api/admin/stats` — Dashboard stats: waitlist count, user count, purchases, revenue (admin auth required)
- `GET /api/admin/waitlist` — Paginated waitlist entries (admin auth required)

> Admin routes support two auth methods: (1) Supabase role-based auth (user with admin role) — preferred, and (2) API key via `x-admin-key` header — fallback for CI/scripts.
- `GET /api/exercise-attempts` — Get user's exercise attempts (authenticated)
- `POST /api/exercise-attempts` — Submit exercise attempt (authenticated)
- `GET /api/profiles/me` — Get current user profile (authenticated)
- `PUT /api/profiles/me` — Update current user profile (authenticated)

### Middleware

- **Security Headers**: Sets CSP, HSTS, X-Content-Type-Options, X-Frame-Options, and generates a unique `X-Request-ID` per request (`security-headers.ts`)
- **CORS**: Allows `localhost:3000` (dev) and `tensorcraft.app` (prod). Configurable via `CORS_ORIGINS` env var.
- **Auth**: Validates Supabase JWT from Authorization header, sets `userId` and `accessToken` on context
- **Rate Limiting**: Upstash Redis (mandatory, distributed). 120 req/min per IP. Stripe webhook route exempt.

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
- FE→ML bridge showcase (6 featured bridges with animated connectors)
- Theme preview cards with brutalist offset shadow hover effects
- Stats section and CTA with brutalist styling
- Scroll-triggered animations throughout

### Animation Patterns

- `fadeUp` variant with custom delay per index
- `staggerContainer` for sequential child reveals
- `letterAnimation` for character-by-character text
- `whileInView` for scroll-triggered entries
- `whileHover` for interactive hover states

### Accessibility (WCAG 2.1 AA)

- Skip-to-content link on all pages
- Form labels (visible or `sr-only`) on all inputs
- `aria-pressed` on filter toggle buttons
- `aria-label` on OAuth buttons and SVG icons
- Focus trap and focus restore on modals
- `role="progressbar"` with `aria-valuenow/min/max` on progress bars
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

1. **MDX files** in `packages/content/content/deep-orbit/{module}/{lesson}.mdx` — YAML frontmatter (5C Loop fields) + MDX body (components)
2. **Exercise YAML** in `packages/content/content/deep-orbit/{module}/exercises/{slug}.yaml` — starterCode, solutionCode, testCode
3. **Module metadata** in `packages/content/content/deep-orbit/{module}/module.yaml` — slug, title, order, description
4. **Velite** (`velite.config.ts`) compiles MDX → `.velite/` output at build time via `pnpm --filter @tensorcraft/content build:content`
5. **Content queries** (`src/queries.ts`) — pure functions over Velite output: `getModules`, `getModuleLessons`, `getLesson`, `getExercise`, `getAdjacentLessons`
6. **Turbo dependency** — `build:content` runs before `build` via `dependsOn: ["^build:content"]`

### MDX Rendering

Velite compiles MDX to function body strings. The `LessonContent` client component (`apps/web/app/themes/[slug]/[module]/[lesson]/lesson-content.tsx`) renders them using `new Function()` with `react/jsx-runtime` injection and frontmatter scope.

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

- 3 modules (Foundations, Neural Networks, Training Loop)
- 15 lessons following 5C Loop structure
- 14 exercises with starter/solution/test code

## Learning Routes (`apps/web/app/themes/`)

| Route | Page | Purpose |
|-------|------|---------|
| `/themes` | Theme listing | Grid of 5 themes, Deep Orbit active, 4 "Coming Soon" |
| `/themes/[slug]` | Theme detail | Module list with characters, layout sets `data-theme` |
| `/themes/[slug]/[module]` | Module overview | Lesson cards with order, title, time, difficulty |
| `/themes/[slug]/[module]/[lesson]` | Lesson viewer | Sidebar nav + MDX content + 5C Loop sections + prev/next nav |

### Test Categories

- **Unit tests** (211 passing): API routes, middleware, components, MDX components, content queries, Zod schemas, shared constants
- **E2E tests** (4 spec files): Landing page, auth pages, legal pages, learning routes (themes/modules/lessons)
- **Accessibility tests**: axe-core on components (unit) + full page audits (e2e)
- **Content contract tests**: Validate content fixtures against Zod schemas
- **Content completeness tests**: Validates every module has 5 lessons, every exercise references a valid lesson
- **Cross-reference tests**: Referential integrity across lessons/modules/exercises
- **Snapshot tests**: Catch unintended markup regressions in components/pages
- **Link validation**: ROUTES constants map to actual `page.tsx` files
- **SEO metadata tests**: Verify title/description on server-rendered pages
- **Theme CSS tests**: All 5 themes define required `--tc-*` custom properties

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

## FE→ML Bridge System

The core pedagogical innovation. Each ML concept is introduced through a frontend concept:

Bridges are classified into three quality tiers:
- **Identity** — FE concept *is* the ML concept (e.g., ReLU = `Math.max(0,x)`, Tensor = TypedArray)
- **Structural** — Same pattern, different domain (e.g., Overfitting = CSS that only works on your screen)
- **Intuition** — Useful starting point, refined in-lesson (e.g., Loss = Lighthouse score)

| Frontend Concept | ML Concept | Tier |
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

26 shared bridges + 30+ theme-specific bridges across 5 themes. See [product-plan.md](product-plan.md) for the complete catalog.

## Key Architectural Decisions

1. **Hono as separate backend** — Not embedded in Next.js API routes. Allows independent scaling, deployment, and technology evolution.
2. **Supabase from day 1** — Full schema with RLS, not deferred. Ensures auth and data patterns are established early.
3. **CSS-native theming** — No JS runtime cost for theme switching. Tailwind 4's `@theme` directive resolves utilities to CSS custom properties.
4. **Dark + brutalist aesthetic** — All themes are dark with solid backgrounds. Brutalist Terminal style: zero border-radius, offset box shadows, monospace-first typography. No glow or neon effects.
5. **Framer Motion over CSS animations** — Needed for scroll-triggered reveals, layout animations, and gesture-based interactions that CSS alone can't handle cleanly.
6. **Document as we build** — This file is maintained alongside code, updated with each significant architectural change.
