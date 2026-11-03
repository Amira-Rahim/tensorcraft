# Tensorcraft

Tensorcraft teaches machine learning to JavaScript engineers through a
story-driven web course. Learners inspect fictional sensor data, write
JavaScript, train small TensorFlow.js models, and compare the results. The
course connects ML concepts to familiar JavaScript concepts and explains
where each analogy stops being useful.

## Local review

Start with the [review setup guide](docs/review-setup.md). It prepares an
isolated local Supabase stack and fictional learner fixtures without
production credentials. It requires Node.js 22 or later, pnpm 10.12.4, the
Supabase CLI, and a running Docker engine.

```bash
pnpm install --frozen-lockfile
pnpm review:prepare
pnpm review:dev
```

The guide covers the local sign-in inbox, fixture course access, checks, and
cleanup. Review access uses fixture purchases, so reviewers can inspect the
paid lesson routes without making a payment. Keep the review environment
separate from hosted services and real learner data.

The [product roadmap](ROADMAP.md) covers the remaining platform work,
expansion to all five worlds, and later growth plans. It links each workstream
to the existing backlog and identifies release dependencies.

## Course scope

Deep Orbit is the launched course. Its 11 modules contain 56 lessons and 65
in-browser exercises. The first module has five free lessons and works
without an account. Later modules cover neural networks, training and
evaluation, browser runtimes, signal processing, sequence models, anomaly
detection, and model deployment.

Four other worlds have authored source content and remain coming soon:

- Neon Protocol covers computer vision.
- Signal Ward covers text and natural language processing.
- Nova Canvas covers multimodal and generative models.
- Terra Grid covers edge deployment and production ML.

The application excludes their lesson routes and purchases from the current
launch. Authored source files do not establish release readiness. See the
[launch scope](docs/launch-scope.md) and
[world launch checklist](docs/world-launch-checklist.md).

## Machine learning behavior

The project includes real model training, inference, and runtime comparisons:

- The [exercise runner](packages/ui/src/mdx/exercise-runner.ts) executes
  TensorFlow.js 4.22.0 in a worker. Exercises such as
  [simple-network](packages/content/content/deep-orbit/neural-networks/exercises/simple-network.yaml)
  and
  [training-loop-exercise](packages/content/content/deep-orbit/training-loop/exercises/training-loop-exercise.yaml)
  require actual `model.fit()` calls and inspect the resulting model or
  training history.
- Some exercise checks supply controlled model loaders or pipeline outputs.
  Passing those checks establishes the exercise contract. It does not verify
  external model downloads, browser caching, or real model accuracy.
- [Training scripts](scripts/train-deep-scan-model.mjs) create course model
  artifacts. Other scripts
  [rebuild the capstone classifier](scripts/build-deep-scan-v1.mjs) and
  [fine-tune the landing preview](scripts/finetune-deep-scan-preview.mjs).
  The [public model directory](apps/web/public/models) contains trained
  artifacts and aliases. The [model contracts](docs/capstone-models.md)
  explain their synthetic data, architectures, uses, and limitations.
- The optional [browser runtime lab](scripts/fixtures/runtime-lab-package/README.md)
  runs a frozen classifier with TensorFlow.js and ONNX Runtime, compares
  outputs, and checks caching and deployment failures. Its full mode also
  downloads pinned pretrained DistilBERT sentiment models, about 335 MB plus
  tokenizer and configuration files. Those third-party weights are not
  included in the lab archive. The lab reports runtime observations rather
  than a general model-quality ranking.

The story uses fictional sensor records, and the shipped model contracts
describe synthetic training data. Some standalone assignments use licensed
public datasets, including the Room Occupancy dataset identified in the
[licensing notes](LICENSING.md). These examples do not establish performance
on new operational or medical data.

## Application stack

- Next.js 16 and React 19 provide the web application.
- Hono runs the separate Node.js API.
- pnpm workspaces and Turborepo manage two apps and seven shared packages.
- MDX, Velite, and Zod validate lesson and exercise content.
- Sandpack provides the editor, and the custom worker runs exercise checks.
- Tailwind CSS 4 provides shared styles and light and dark themes.
- Supabase provides PostgreSQL and authentication.
- Stripe handles one-time course purchases in the deployed application.
- PostHog and Vercel Web Analytics provide optional analytics integrations.
  The local review setup omits their production configuration.
- Vitest, Playwright, and axe-core support unit, browser, and accessibility
  checks.

## Repository structure

```text
apps/web/                  Next.js web application
apps/api/                  Hono API
packages/content/          MDX lessons, exercises, content validation
packages/ui/               Shared components and exercise runner
packages/worlds/           World manifests and assets
packages/shared/           Types, utilities, curriculum and bridge data
packages/config/           Shared lint and TypeScript configuration
packages/bridges-public/   JavaScript-to-ML bridge package
packages/supabase/         Database clients, types and migrations
scripts/                   Verification, packaging and model tooling
docs/                      Architecture, plans and review records
e2e/                       Browser checks
```

## Development checks

The root package pins pnpm 10.12.4 and requires Node.js 22 or later. After the
review setup, use the checks that match the changed area:

```bash
pnpm test             # Unit tests
pnpm test:exercises   # Solutions, untouched starters and cheating fixtures
pnpm typecheck        # TypeScript checks
pnpm lint             # Lint checks
pnpm test:e2e         # Browser checks
pnpm build            # Application and package builds
```

The [review setup guide](docs/review-setup.md) identifies which checks need
the local services. `pnpm test:rls` creates and removes its own isolated
PostgreSQL cluster. It needs PostgreSQL 16 or later and never reads
`DATABASE_URL` or connects to a hosted database. Set `PG_BIN` when those
binaries are outside `PATH`.

Rebuild generated content after changing MDX or YAML:

```bash
pnpm turbo build:content
```

## Content authoring

Lessons live in `packages/content/content/<world>/<module>/`. Numbered MDX
files contain lessons, `exercises/*.yaml` contains instructions and executable
checks, and `module.yaml` declares module order and prerequisites. Velite
validates the content through Zod schemas and generates application types.

Read [the project instructions](CLAUDE.md) and
[writing quality rubric](docs/writing-quality-rubric.md) before editing
course material. Preserve the story, exercise requirements, technical
meaning, and accessible feedback across each lesson.

## Deployment references

The web application deploys through Vercel. The API deployment workflow
checks migrations and required Fly configuration before deploying. See the
[deployment guide](docs/deployment-guide.md),
[infrastructure overview](docs/infrastructure.md), and
[migration runbook](docs/migration-runbook.md) for that separate operational
setup. Local review does not require production access or a deployment.

## License

Tensorcraft-owned code and course content use the
[Mozilla Public License 2.0](LICENSE). The [licensing notes](LICENSING.md)
describe scope and earlier grants. Third-party dependencies, models, fonts,
and other material retain their own licenses and notices. Existing MIT and
CC0 grants remain in effect as described there.
