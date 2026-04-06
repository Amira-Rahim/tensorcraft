# Tensorcraft

An interactive, story-driven web application that teaches frontend engineers browser-based machine learning — bridging familiar web development concepts to ML through 50+ concept mappings.

## Themes

Tensorcraft is organized into five themed courses, each with its own narrative world:

| Theme             | Setting     | Focus Area              |
| ----------------- | ----------- | ----------------------- |
| **Deep Orbit**    | Space       | Time-Series & Signals   |
| **Neon Protocol** | Cyberpunk   | Computer Vision         |
| **Signal Ward**   | Medical     | NLP & Text              |
| **Nova Canvas**   | Creative AI | Multimodal & Generative |
| **Terra Grid**    | Industrial  | Edge AI & Production ML |

Each theme contains 11 modules × 5 lessons (~22 hours of content) with hands-in-browser exercises.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Turbopack)
- **Monorepo:** Turborepo + pnpm workspaces
- **Content:** MDX v3 + Velite (Zod-validated content pipeline)
- **Exercises:** Sandpack (in-browser code) + Jest (validation)
- **Styling:** Tailwind CSS + CSS Modules, dark mode only
- **Auth & DB:** Supabase (Postgres + Auth)
- **Payments:** Stripe (one-time per-theme purchases)
- **Analytics:** PostHog + Plausible
- **Testing:** Vitest (unit), Playwright (e2e), axe-core (a11y)

## Project Structure

```
tensorcraft/
├── apps/
│   ├── web/          # Next.js frontend
│   └── api/          # API service
├── packages/
│   ├── content/      # MDX lessons, exercises, Velite config
│   ├── ui/           # Shared UI components
│   ├── themes/       # Theme configuration (colors, assets)
│   ├── shared/       # Shared utilities and types
│   ├── config/       # Shared config (ESLint, TypeScript)
│   ├── github/       # GitHub integration (commit builder)
│   └── supabase/     # Supabase client and types
├── supabase/         # Database migrations
├── prototypes/       # HTML design prototypes
├── docs/             # PRD, product plan, scripts
└── e2e/              # Playwright end-to-end tests
```

## Getting Started

### Prerequisites

- Node.js >= 20
- pnpm >= 10

### Setup

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev

# Run the Supabase local stack (requires Supabase CLI)
supabase start
```

### Environment Variables

Copy the example env file and fill in your keys:

```bash
cp apps/web/.env.example apps/web/.env.local
```

You'll need:

- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anon key
- `STRIPE_SECRET_KEY` — Stripe secret key
- `STRIPE_WEBHOOK_SECRET` — Stripe webhook signing secret

## Development

```bash
pnpm dev            # Start all apps in dev mode
pnpm build          # Build all packages and apps
pnpm lint           # Lint all packages
pnpm typecheck      # Type-check all packages
pnpm format         # Format with Prettier
pnpm test           # Run unit tests (Vitest)
pnpm test:e2e       # Run end-to-end tests (Playwright)
```

## Deployment

Both apps deploy to Fly.io from the **monorepo root** using Docker multi-stage builds:

```bash
fly deploy --config apps/api/fly.toml --dockerfile apps/api/Dockerfile
fly deploy --config apps/web/fly.toml --dockerfile apps/web/Dockerfile
```

See [docs/deployment-guide.md](docs/deployment-guide.md) for environment variables and secrets, and [docs/infrastructure.md](docs/infrastructure.md) for the full production architecture.

## Content Authoring

Lessons are written in MDX and live in `packages/content/content/<theme>/<module>/`. Each module contains:

- `01-*.mdx` through `05-*.mdx` — lesson files
- `exercises/*.yaml` — exercise definitions with Sandpack configs

Content is validated at build time through Velite with Zod schemas, ensuring type-safe content throughout the app.

## License

All rights reserved.
