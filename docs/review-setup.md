# Local review setup

This setup runs TensorCraft against an isolated local Supabase database with
fictional learners, progress and purchase records. It creates a source snapshot
under `.review/runtime` and excludes existing environment files. The launcher
passes local credentials directly to the child processes without saving an env
file.

## Requirements

- Node.js 22 or later and pnpm 10.12.4.
- Project dependencies installed with `pnpm install --frozen-lockfile`.
- Supabase CLI 2.117.0 or a later 2.x release.
- A running Docker-compatible engine with `/var/run/docker.sock` available,
  or an explicitly selected local Unix socket as described below.
  The first Supabase start downloads its container images.

The checked-in configuration follows the Supabase CLI 2.117.0 template and
[local configuration reference](https://supabase.com/docs/guides/local-development/cli/config).

For Colima or another local engine with a different socket, set
`TENSORCRAFT_REVIEW_DOCKER_HOST=unix:///absolute/path/to/docker.sock` when
running the review commands. The launcher accepts local Unix sockets only
and ignores inherited `DOCKER_HOST` values. This selection affects the review
launcher and does not change the active Docker context.

## First run

From the repository root:

```bash
pnpm review:check
pnpm review:prepare
pnpm review:dev
```

`review:prepare` starts the dedicated `tensorcraft-local-review` Supabase stack,
applies forward migrations and creates the fictional accounts. Running it again
restores the fixture rows. It preserves other local review activity and does not
reset the database.

`review:dev` takes a fresh source snapshot, builds its course content and starts
the website and API. It excludes `.env` files, machine-specific Supabase state,
private study files and key files. It also replaces the inherited shell
environment with a small allowlist. Installed dependency links point workspace
packages to the snapshot.

Open <http://localhost:3100/auth> and request an email sign-in link for one of the
accounts below. Open the message in the local inbox at
<http://127.0.0.1:56324> and follow its link in the same browser.
Supabase captures these messages locally. It does not deliver them to an email
provider.

Use `localhost` for the website throughout sign-in. Next uses this host for its
local callback. Switching to `127.0.0.1` would give the browser a different
cookie host and return it to the sign-in screen.

| Fictional account     | Review scenario                                                                      |
| --------------------- | ------------------------------------------------------------------------------------ |
| `alex@example.test`   | Completed onboarding, Deep Orbit access, example lesson progress and a mock purchase |
| `jordan@example.test` | Completed onboarding with no paid access or lesson progress                          |
| `sam@example.test`    | New learner who still needs to complete onboarding                                   |

All three accounts have the ordinary learner role. Their names and example.test
addresses identify them as fixtures. Use fictional information for any new
signups or form submissions during review.

## Local addresses

| Service                | Address                  |
| ---------------------- | ------------------------ |
| Website                | <http://localhost:3100>  |
| App API                | <http://127.0.0.1:3101>  |
| Supabase API and auth  | <http://127.0.0.1:56321> |
| Supabase Studio        | <http://127.0.0.1:56323> |
| Captured sign-in email | <http://127.0.0.1:56324> |

The database uses port 56322. The review config reserves 56320 for a shadow
database and 56329 for a disabled pooler. The app servers bind to loopback.
Supabase uses its own local Docker port mappings.

## External features

The launcher supplies no PostHog, Sentry, Resend, Kit, Redis or OAuth credentials.
Google and GitHub sign-in and the GitHub exercise-push feature are unavailable.
Use email sign-in through the local inbox.

Alex's purchase is a database fixture. It does not represent a Stripe payment.
The API receives obvious test-key placeholders so it can start, and a
review-only request guard blocks outbound HTTP, HTTPS and fetch calls outside
the local Supabase endpoint. Checkout cannot create a payment session. Use Alex
to review paid lessons and Jordan to review access restrictions. A successful
payment or webhook flow needs a separate, explicitly configured Stripe test
environment.

The website can still download public fonts, JavaScript runtimes and model
assets from its existing public hosts. This setup does not provide offline
operation. Browser lessons still perform the TensorFlow.js training and
inference described in the course.

## Source and migration behavior

Edit the original source, then restart `pnpm review:dev` to refresh the snapshot.
Changes made only inside `.review/runtime` disappear at the next launch.

`packages/supabase/migrations` remains the canonical migration directory. The
launcher creates relative symlinks for forward migrations under
`.review/supabase/migrations`. It excludes `.down.sql` rollback files and skips
the retired 027 and 028 migrations, matching `scripts/test-rls.mjs`. Migration
027 contains an index predicate PostgreSQL cannot replay, and migration 033
removes both retired features. Existing migration files remain unchanged.

The local seed creates auth identities before profiles and obtains lesson IDs
from the current course sources. It refuses every database URL except
`http://127.0.0.1:56321` and requires `TENSORCRAFT_REVIEW=1`. The launcher supplies
that flag and reads keys from the dedicated local stack's status output. It
never uses the repository's hosted Supabase CLI link.

## Shutdown and troubleshooting

Press Ctrl+C in the `review:dev` terminal to stop the two app servers. Then run:

```bash
pnpm review:stop
```

This stops only the review Supabase stack and preserves its local mock database.
It leaves unrelated containers running. Start it again with
`pnpm review:prepare`.

If Docker is unavailable, start or install a local Docker-compatible engine.
If an app port is occupied, stop the process using 3100 or 3101 before retrying.
If a terminated command left `.review/runner.lock`, remove that file after
confirming no review command is running.

For source preparation without Docker, run:

```bash
node scripts/review.mjs snapshot
```

This creates the env-free snapshot and builds its course content. It does not
start the database or prove that auth and migrations work together. The automated
safety checks use mocked clients and do not replace a complete local Supabase
sign-in and lesson-progress check.
