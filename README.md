# Tensorcraft

An interactive, story-driven web application that teaches JavaScript engineers browser-based machine learning. It bridges familiar JavaScript concepts to ML through 50+ concept mappings.

## Worlds

Tensorcraft is organized into five worlds, each with its own narrative:

| World             | Setting     | Focus Area              |
| ----------------- | ----------- | ----------------------- |
| **Deep Orbit**    | Space       | Time-Series & Signals   |
| **Neon Protocol** | Cyberpunk   | Computer Vision         |
| **Signal Ward**   | Medical     | NLP & Text              |
| **Nova Canvas**   | Creative AI | Multimodal & Generative |
| **Terra Grid**    | Industrial  | Edge AI & Production ML |

Each world contains 11 modules × 5 lessons (~22 hours of content) with hands-on, in-browser exercises.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Turbopack)
- **Monorepo:** Turborepo + pnpm workspaces
- **Content:** MDX v3 + Velite (Zod-validated content pipeline)
- **Exercises:** Sandpack (in-browser code) + Jest (validation)
- **Styling:** Tailwind CSS 4 with `@world` directive (CSS custom properties); no CSS Modules in use. Dark and light schemes: follows the OS, with a manual toggle.
- **Auth & DB:** Supabase (Postgres + Auth)
- **Payments:** Stripe (one-time per-world purchases)
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
│   ├── worlds/       # World configuration (colors, assets)
│   ├── shared/       # Shared utilities and types
│   ├── config/       # Shared config (ESLint, TypeScript)
│   ├── github/       # GitHub integration (commit builder)
│   └── supabase/     # Supabase client, types, and database migrations
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

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key
- `STRIPE_SECRET_KEY`: Stripe secret key
- `STRIPE_WEBHOOK_SECRET`: Stripe webhook signing secret

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

Web: Vercel (auto-deploy from main), API: Fly.io

```bash
# Web deploys to Vercel automatically on git push - no manual deploy needed
# API deploys to Fly.io:
fly deploy --config apps/api/fly.toml --dockerfile apps/api/Dockerfile
```

See [docs/deployment-guide.md](docs/deployment-guide.md) for environment variables and secrets, and [docs/infrastructure.md](docs/infrastructure.md) for the full production architecture.

## Content Authoring

Lessons are written in MDX and live in `packages/content/content/<world>/<module>/`. Each module contains:

- `01-*.mdx` through `05-*.mdx`: lesson files
- `exercises/*.yaml`: exercise definitions with Sandpack configs

Content is validated at build time through Velite with Zod schemas, and the generated types are used throughout the app.

## License

All rights reserved.
