# Migration runbook

How to evolve the Tensorcraft database safely. This is the process half of
Tier 0 in `docs/audits/scalability-architecture-2026-07-21.md` - the half that
gates every schema change the scale roadmap (seats, arena, the cross-world
journey) depends on.

Authoring rules live in `packages/supabase/migrations/CONVENTIONS.md`. This
document is the operational procedure.

## Before you touch the schema

```bash
node scripts/migration-status.mjs
```

With `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` set, this diffs the files on
disk against the `schema_migrations` ledger and prints PENDING / UNKNOWN /
IN SYNC. **Run this first, every time.** Before migration 042 is applied it will
tell you to apply 042; that is the bootstrap step.

## Bootstrapping the ledger (one time)

The ledger did not exist before migration 042. To start it truthfully:

1. Apply `042_schema_migrations_tracking.sql`. It creates the ledger and
   backfills 001–041 as applied.
2. **If production is actually behind** - i.e. some of 001–041 were never
   applied - delete the ledger rows for the versions you have NOT applied:
   ```sql
   delete from public.schema_migrations where version in (NN, NN);
   ```
   then apply those files. Migrations 037, 038, 039, 040, 041 are the ones most
   likely to be unapplied per prior audits; verify each against the live schema
   (check for the constraint/trigger/policy it adds) before trusting the
   backfill for those.
3. Re-run `migration-status.mjs`. It should read IN SYNC.

## Regenerating database types (after every applied migration)

`packages/supabase/src/types.ts` is generated from the live schema and both
apps typecheck against it. Since supabase-js 2.99 the client rejects insert
and update properties the generated types do not know, so a stale file turns
into `never`-type build errors (this bit us when the file had drifted 49
migrations behind, see the 2026-08-24 Dependabot group PR). After migrations
reach IN SYNC:

```bash
DATABASE_URL="$(grep -m1 '^DATABASE_URL=' apps/api/.env | cut -d= -f2-)" pnpm gen:types
```

The script (`scripts/gen-supabase-types.mjs`) introspects over the wire with
@supabase/postgres-meta, so it needs no Docker, unlike the current supabase
CLI. Commit the regenerated file together with the migration.

## Authoring a new migration

1. Copy the template to the next number:
   ```bash
   cp packages/supabase/migrations/_template.sql \
      packages/supabase/migrations/043_your_change.sql
   cp packages/supabase/migrations/_template.down.sql \
      packages/supabase/migrations/043_your_change.down.sql
   ```
2. Write the forward body (idempotent DDL, inside the `begin;`/`commit;`).
3. Set the `version`/`name` in the ledger insert at the bottom.
4. Write the down body, or replace it with a comment explaining why the change
   is irreversible.

## Applying to production

Until CI owns this, application is manual through the Supabase SQL editor -
but every file is now transaction-wrapped and self-recording, so a paste is
all-or-nothing:

1. `node scripts/migration-status.mjs` → note the PENDING list.
2. Paste each pending file **in numeric order**. Each either fully applies and
   records its own version, or rolls back cleanly on any error.
3. Re-run `migration-status.mjs` → confirm IN SYNC.

## Rolling back

1. Apply the migration's `.down.sql` in the SQL editor.
2. `migration-status.mjs` will now report it PENDING again (the down-migration
   removed its ledger row), which is correct.

## Incident notes (do not repeat past mistakes)

- **Migration 013** (the `skill_events` partition swap) can silently lose rows
  written during its unlocked `INSERT…SELECT`, and its `DROP TABLE
  skill_events_old` is commented out - production may still hold a duplicate.
  Any future partition work must confirm the state first
  (`full-audit-2026-07-21.md §3`).
- **The old incident runbook** (`pre-launch-checklist.md:670`) suggested a bulk
  `update purchases set status='refunded'` that revokes access from legitimate
  buyers and, since migration 038's trigger, is silently ignored on the
  corrective path. Do not use it; handle refunds per Stripe event, not bulk SQL.
- **17 pre-042 migrations are non-idempotent.** Never re-run 001–041 blind;
  trust the ledger, not a re-paste.

## Deploy gating (added 2026-08-20, Vercel side reworked 2026-09-19)

Two gates stand between a pending migration and production: the CI job and
the Vercel build. Both call `scripts/migration-status.mjs` with `CI=1`, and
since 2026-09-19 both fail closed.

**GitHub Actions** (`.github/workflows/ci.yml`, job "Migration ledger drift
check") fails the build on drift and fails CLOSED when the secrets are
missing (exit 2), so a blind gate can never read as green. The one
exception is Dependabot-triggered runs, where the job is skipped: those
runs read the Dependabot secrets store (never the Actions secrets), a
dependency bump cannot add a migration, and mirroring the service-role
key into Dependabot secrets would expose it to install scripts of the
very packages being bumped.

**Vercel** (`apps/web/vercel.json`, `buildCommand`) runs the same check
before the Turbo build:

```sh
cd ../.. && CI=1 node scripts/migration-status.mjs && pnpm turbo build --filter=@tensorcraft/web
```

The Vercel project's Root Directory is `apps/web`, so Vercel reads that
directory's `vercel.json` and starts the command there. The `cd ../..` moves
to the repo root, which is why the script path carries no `../../` prefix.
The `&&` chain is the gate: any non-zero exit from the script stops the
build before Turbo starts.

| migrate:status | meaning              | Vercel does        |
|----------------|----------------------|--------------------|
| 0              | in sync              | builds and deploys |
| 1              | drift, schema behind | build fails        |
| 2              | no creds / no conn   | build fails        |

Exit 2 fails CLOSED here since 2026-09-19, the same as CI. The cost is that
a Vercel environment that loses `SUPABASE_URL` or `SUPABASE_SERVICE_ROLE_KEY`
cannot deploy anything, including a code fix, until the variables are
restored in the dashboard (Production and Preview; both verified present
2026-08-23). A failed gate shows as a failed build in the deployment list,
not as a Canceled row, so the default dashboard filter does not hide it.

Verified live: the 2026-09-19 production build log echoes the command above
and prints `applied (ledger): 65` and `IN SYNC`. The file location, the
`CI=1`, the `&&` chaining, the script path, and the exit-2 behavior without
credentials are pinned by
`packages/content/__tests__/vercel-migration-gate.test.ts`; if the Root
Directory setting ever changes, update that test's constant and the `cd` in
the command together.

History (2026-08-20 to 2026-09-19): the Vercel gate was an `ignoreCommand`
in a repo-root `vercel.json`. For an `ignoreCommand`, exit 0 means skip the
deploy and non-zero means build, so a wrapper inverted the script's exit
codes, and exit 2 deliberately failed OPEN. Two problems came with that
form. Vercel executed the command with `apps/web` as the working directory,
and a repo-root-relative script path failed as module-not-found, which Node
reports with exit 1, the code the wrapper read as drift: from 2026-08-22 to
2026-08-23 that path bug canceled every production deploy while the
dashboard's status filter hid the Canceled rows. And the 2026-09-19 release
record reports that the project did not apply the repo-root file at all
(`docs/audits/learning-product-release-2026-09-19.md`). The `buildCommand`
form has no exit-code inversion and lives in the directory Vercel reads.

Why this exists: on 2026-08-18 migration 059 was committed with the app code
that depended on it. CI went red on exactly this check and stayed red, while
Vercel deployed the web app anyway. Production ran new code against an old
schema for two days, silently discarding onboarding fields. The check was
never missing; nothing consumed its verdict.
