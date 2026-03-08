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
│   ├── themes/       5 themed course manifests + CSS custom properties
│   ├── ui/           Shared React component library (Framer Motion)
│   └── supabase/     Database types, clients, migrations
├── docs/             Project documentation
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
| Fonts | Inter + JetBrains Mono | Clean UI + monospace for code/technical content |

## Theme System

### Design Philosophy

Dark mode only. Neon aesthetic with glowing borders, text shadows, animated gradients, and glassmorphism. Every theme has a unique color palette but shares the same structural design tokens.

### 5 Themed Courses

| Theme | Specialization | Primary | Accent | Status |
|-------|---------------|---------|--------|--------|
| Deep Orbit | Time-Series & Signals | `#7B68EE` | `#F0C75E` | Launched |
| Neon Protocol | Computer Vision | `#00D4FF` | `#FF2D7B` | Coming Soon |
| Signal Ward | NLP & Text Intelligence | `#2ECC71` | `#5B8DEF` | Coming Soon |
| Nova Canvas | Multimodal & GenAI | `#FF6B6B` | `#A78BFA` | Coming Soon |
| Terra Grid | Edge AI & MLOps | `#F59E0B` | `#10B981` | Coming Soon |

### How Theming Works

1. **CSS Custom Properties** (`packages/themes/src/css/themes.css`): Each theme defines `--tc-*` variables under a `[data-theme="theme-slug"]` selector.
2. **Tailwind 4 `@theme`** (`packages/config/tailwind/base.css`): Maps Tailwind utility classes to `--tc-*` variables so `bg-surface`, `text-primary`, `border-border` all resolve dynamically.
3. **Runtime Switching**: Set `data-theme` attribute on `<html>` to switch themes. No JS bundle cost — pure CSS resolution.
4. **Neon Utilities** (`apps/web/app/globals.css`): `.neon-text`, `.neon-box`, `.neon-border`, `.glass`, `.grid-pattern` — all using theme-aware `--tc-glow` and `--tc-neon-line` tokens. All animations respect `prefers-reduced-motion`.

### Theme Manifests

Each theme (`packages/themes/src/<theme>.ts`) exports a `ThemeManifest` with:
- **Palette**: bg, primary, accent, surface, text, glow, neonLine colors
- **Characters**: 5 per theme (4 human mentors + 1 AI companion)
- **Terminology**: Theme-specific names for modules/lessons/exercises (e.g., Deep Orbit uses "Mission", "Sector", "Simulation")
- **Career paths** and **coming soon** metadata

## Database Schema (Supabase)

### Tables

- **`profiles`** — Extends `auth.users`. Auto-created via trigger on signup. Fields: display_name, avatar_url, github_username.
- **`theme_progress`** — Per-lesson tracking. Fields: theme_id, module_id, lesson_id, status (not_started/in_progress/completed), score, hints_used, timestamps. Unique constraint on (user_id, theme_id, module_id, lesson_id).
- **`purchases`** — Payment records from LemonSqueezy webhooks. Fields: plan_id, theme_ids (text[]), amount, currency, lemon_squeezy_id, status.
- **`waitlist`** — Email capture for coming-soon themes. Public insert policy.

### Row-Level Security

All tables have RLS enabled:
- `profiles`: Users can only read/update their own profile
- `theme_progress`: Users can only CRUD their own progress
- `purchases`: Users can read their own; inserts are server-only (via service role)
- `waitlist`: Anyone can insert (public); only service role can read

### Auto-created Resources

- **Trigger**: `on_auth_user_created` → auto-inserts a `profiles` row
- **Indexes**: On user_id + theme_id for progress queries, email for waitlist lookups

## Hono API (`apps/api`)

Separate backend service running on port 3001. Communicates with Supabase using the service role key for privileged operations.

### Current Routes

- `GET /api/health` — Health check returning `{ status: "ok", service: "tensorcraft-api", timestamp }`

### Planned Route Groups

- `/api/auth/*` — Auth callback handling, session management
- `/api/progress/*` — Theme progress CRUD (authenticated)
- `/api/payments/*` — LemonSqueezy webhook receiver, purchase verification

### Middleware

- **CORS**: Allows `localhost:3000` (dev) and `tensorcraft.dev` (prod)

## Next.js Frontend (`apps/web`)

### Configuration

- **Turbopack** for development (via `next dev --turbopack`)
- **Transpile** all workspace packages via `next.config.ts`
- **PostCSS** with `@tailwindcss/postcss` for Tailwind 4

### Landing Page (`app/page.tsx`)

Client component with Framer Motion animations:
- Animated grid background + gradient orbs
- Letter-by-letter title reveal with stagger
- FE→ML bridge showcase (6 featured bridges with animated connectors)
- Theme preview cards with neon glow hover effects
- Stats section and CTA with glow effects
- Scroll-triggered animations throughout

### Animation Patterns

- `fadeUp` variant with custom delay per index
- `staggerContainer` for sequential child reveals
- `letterAnimation` for character-by-character text
- `whileInView` for scroll-triggered entries
- `whileHover` for interactive hover states

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

Turborepo handles dependency ordering: `packages/*` build first, then `apps/*` consume them.

## FE→ML Bridge System

The core pedagogical innovation. Each ML concept is introduced through a frontend concept:

| Frontend Concept | ML Concept |
|-----------------|------------|
| `Array.map()` chain | Neural Network |
| CSS custom properties | Weights & Biases |
| Lighthouse score | Loss Function |
| `git bisect` | Backpropagation |
| CSS `blur()` + kernel | Convolution |
| `Promise.all()` | Batch Processing |

50+ bridges total across 5 themes, organized by module.

## Key Architectural Decisions

1. **Hono as separate backend** — Not embedded in Next.js API routes. Allows independent scaling, deployment, and technology evolution.
2. **Supabase from day 1** — Full schema with RLS, not deferred. Ensures auth and data patterns are established early.
3. **CSS-native theming** — No JS runtime cost for theme switching. Tailwind 4's `@theme` directive resolves utilities to CSS custom properties.
4. **Dark + neon aesthetic** — All themes are dark with neon accents. Glow effects use `--tc-glow` token for consistent intensity.
5. **Framer Motion over CSS animations** — Needed for scroll-triggered reveals, layout animations, and gesture-based interactions that CSS alone can't handle cleanly.
6. **Document as we build** — This file is maintained alongside code, updated with each significant architectural change.
