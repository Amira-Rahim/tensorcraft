# Migration runbook

How to evolve the Tensorcraft database safely. This is the process half of
Tier 0 in `docs/audits/scalability-architecture-2026-07-21.md` — the half that
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
2. **If production is actually behind** — i.e. some of 001–041 were never
   applied — delete the ledger rows for the versions you have NOT applied:
   ```sql
   delete from public.schema_migrations where version in (NN, NN);
   ```
   then apply those files. Migrations 037, 038, 039, 040, 041 are the ones most
   likely to be unapplied per prior audits; verify each against the live schema
   (check for the constraint/trigger/policy it adds) before trusting the
   backfill for those.
3. Re-run `migration-status.mjs`. It should read IN SYNC.

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

Until CI owns this, application is manual through the Supabase SQL editor —
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
  skill_events_old` is commented out — production may still hold a duplicate.
  Any future partition work must confirm the state first
  (`full-audit-2026-07-21.md §3`).
- **The old incident runbook** (`pre-launch-checklist.md:670`) suggested a bulk
  `update purchases set status='refunded'` that revokes access from legitimate
  buyers and, since migration 038's trigger, is silently ignored on the
  corrective path. Do not use it; handle refunds per Stripe event, not bulk SQL.
- **17 pre-042 migrations are non-idempotent.** Never re-run 001–041 blind;
  trust the ledger, not a re-paste.
