# Tensorcraft

An interactive, story-driven web application that teaches JavaScript engineers machine learning with TensorFlow.js. It bridges familiar JavaScript concepts to ML through 50+ JavaScript-to-ML bridges.

## Worlds

Tensorcraft is organized into five worlds, each with its own narrative:

| World             | Setting     | Focus Area              |
| ----------------- | ----------- | ----------------------- |
| **Deep Orbit**    | Space       | Time-Series & Signals   |
| **Neon Protocol** | Cyberpunk   | Computer Vision         |
| **Signal Ward**   | Medical     | NLP & Text              |
| **Nova Canvas**   | Creative AI | Multimodal & Generative |
| **Terra Grid**    | Industrial  | Edge AI & Production ML |

Deep Orbit is available: 11 modules, 56 lessons, and 65 in-browser exercises.
Its first module (5 lessons) is free without an account. The other four worlds
have authored content but remain coming soon and cannot be purchased.
See [launch scope](docs/launch-scope.md).

## Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19
- **API:** Hono on Node.js, deployed separately from the web app
- **Monorepo:** Turborepo + pnpm workspaces
- **Content:** MDX v3 + Velite (Zod-validated content pipeline)
- **Exercises:** Sandpack editor + a custom worker test runner using TensorFlow.js 4.22
- **Styling:** Tailwind CSS 4 with `@theme` directive (CSS custom properties); no CSS Modules in use. Dark and light schemes: follows the OS, with a manual toggle.
- **Auth & DB:** Supabase (Postgres + Auth)
- **Payments:** Stripe (one-time per-world purchases)
- **Analytics:** PostHog + Vercel Web Analytics (both consent-gated)
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
│   ├── bridges-public/ # Public JavaScript-to-ML bridge package
│   └── supabase/     # Supabase client, types, and database migrations
├── docs/             # PRD, product plan, scripts
└── e2e/              # Playwright end-to-end tests
```

## Getting Started

### Prerequisites

- Node.js >= 22
- pnpm 10.12.4 (pinned in `package.json`)

### Setup

```bash
pnpm install --frozen-lockfile
cp apps/web/.env.example apps/web/.env.local
cp apps/api/.env.example apps/api/.env
```

Configure both env files before starting the apps:

- Web: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and
  `NEXT_PUBLIC_API_URL` (local API: `http://localhost:3001`).
- API: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `STRIPE_SECRET_KEY`, and
  `STRIPE_WEBHOOK_SECRET`. Use Stripe test credentials locally.
- Set `APP_URL=http://localhost:3000` for local checkout redirects. The example
  files describe optional integrations and additional production requirements.

Keep service-role and Stripe secrets in server-only variables. Do not prefix
those secrets with `NEXT_PUBLIC_`.

```bash
pnpm dev
```

Turborepo builds content before starting the web app on port 3000 and the API
on port 3001. Rebuild content after editing MDX or YAML:

```bash
pnpm turbo build:content
```

For database setup and migration ordering, use the
[migration runbook](docs/migration-runbook.md). An optional local Supabase
stack requires the Supabase CLI and Docker (`supabase start`).

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

Web deploys through Vercel. Deploy the API through the **Deploy API** GitHub
Actions workflow, which checks applied migrations and required Fly secrets
before deploying. A direct `fly deploy` bypasses those checks.

See [docs/deployment-guide.md](docs/deployment-guide.md) for environment variables and secrets, and [docs/infrastructure.md](docs/infrastructure.md) for the full production architecture.

## Content Authoring

Lessons are written in MDX and live in `packages/content/content/<world>/<module>/`. Each module contains:

- Numbered `*.mdx` files: lessons (the module declares its lesson count)
- `exercises/*.yaml`: exercise instructions, starter code, solutions, and tests
- `module.yaml`: module order, summary, lesson count, and prerequisites

Content is validated at build time through Velite with Zod schemas, and the generated types are used throughout the app.

## License

All rights reserved.

Local database policy checks: `pnpm test:rls` creates and removes an isolated
PostgreSQL cluster. Set `PG_BIN` to your PostgreSQL 16+ binary directory if it
is not on PATH. It never reads `DATABASE_URL` or connects to a hosted database.
See [launch verification](docs/launch-verification.md) for scope and remaining
external checks.
