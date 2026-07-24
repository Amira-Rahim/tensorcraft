# Migration conventions

> Established 2026-07-21 (Tier 0 of `docs/audits/scalability-architecture-2026-07-21.md`).
> Before this, migrations were applied by manual SQL-editor paste with no
> record of which had run, 17 were non-idempotent, none were transaction
> wrapped, and rollback SQL existed for 3 of 41. Scaling toward enterprise
> seats and the arena needs many coordinated schema migrations against a live
> 100k-row database; that is unsafe without the rules below.

These rules apply to **every new migration** (042 and up). The 001–041 backlog
is grandfathered — do not rewrite it; migration `042` backfills its applied
state so the ledger starts from a known point.

## The five rules

1. **Wrap the whole file in a transaction.** Begin with `begin;`, end with
   `commit;`. A multi-statement migration that fails halfway must leave the
   schema exactly as it was, not half-applied. (Exception: `CREATE INDEX
CONCURRENTLY` and a few other statements cannot run inside a transaction —
   if you need one, put it in its own migration file with a header comment
   explaining why it is unwrapped, and make it idempotent with `IF NOT
EXISTS`.)

2. **Be idempotent.** Re-running the file must be a no-op, never an error. Use
   `create table if not exists`, `create or replace function`, `drop policy if
exists` before `create policy`, `drop constraint if exists` before `add
constraint`, `alter table ... add column if not exists`. Postgres has no
   `create policy if not exists`, so the drop-then-create pattern is mandatory
   for policies and triggers.

3. **Record the version.** The last statement before `commit;` inserts the
   migration into the ledger:

   ```sql
   insert into public.schema_migrations (version, name)
   values (NNN, 'short_description')
   on conflict (version) do nothing;
   ```

   `on conflict do nothing` keeps rule 2 intact.

4. **Ship a paired down-migration.** For `NNN_name.sql`, create
   `NNN_name.down.sql` that reverses it (also transaction-wrapped and
   idempotent), ending with `delete from public.schema_migrations where version
= NNN;`. If a change is genuinely irreversible (a `drop column`, a data
   overwrite), the `.down.sql` must still exist and its body must be a comment
   explaining precisely why no rollback is possible and what a recovery would
   require. An explicit "cannot roll back, here is why" is a deliverable; a
   missing file is a landmine.

5. **Never edit an applied migration.** Once a numbered file has shipped, it is
   immutable. Corrections are new migrations. Editing history is what made the
   pre-042 applied state unknowable.

## Authoring

Copy `_template.sql` / `_template.down.sql` to the next number. Fill in the
body. Run `node scripts/migration-status.mjs` before and after applying to see
the ledger diff.

## Cross-user reads — the mandatory pattern

> Established with the same audit (Tier 1 F5 / A2). Both enterprise seats
> (a manager reading their team's progress) and the arena (a leaderboard
> reading many users' scores) need to read rows that do NOT belong to the
> caller. This is the one area where getting the mechanism wrong has already
> caused a data breach in this codebase — twice — so the pattern is fixed, not
> a matter of preference.

**Never expose cross-user data through a plain view or materialized view.**
Materialized views cannot carry RLS at all, and normal views default to
`security_invoker = false` (they run as the owner, bypassing RLS). Migration
`040` exists solely to clean up two leaks of exactly this kind
(`dashboard_stats` served every user's progress to `anon`;
`theme_progress_summary` bypassed RLS). Do not re-create the mistake.

**Do use one of these two, both already present as templates:**

1. **A `SECURITY DEFINER` function scoped by a membership check**, returning
   only the columns that are safe to expose. Templates:
   - `public.is_admin()` (`006` / `021`) — the boolean membership check. When
     orgs land, add `public.is_org_admin_of(target_user uuid)` in the same
     shape (a `SECURITY DEFINER` function, so an RLS policy that calls it does
     not re-trip the recursion trap `021` fixed).
   - `public.get_shared_certificate(uuid)` (`019`) — a `SECURITY DEFINER`
     function granted to `anon` that returns public-safe columns while the base
     table stays RLS-locked. This is the exact shape a leaderboard read takes.
   - `public.compute_user_skill_genome` (`014` / `039`) — the aggregate-with-
     `ON CONFLICT`-upsert shape a leaderboard _recompute_ takes.

2. **A `service_role`-only matview served through the API**, where the Hono
   route (running as service role) does the org/season scoping in code. This
   is the shape `apps/api/src/routes/admin.ts` already uses.

Pick one per surface and state which in the migration header. The convention
exists so seats and arena reuse it instead of each re-deriving — and
re-tripping — the leak.

## Authoritative writes (service-role-write-only tables)

When a table's rows must be trustworthy — a score, an audit record, anything a
client must not be able to fabricate — give it RLS with a **self-read policy and
NO insert/update/delete policy at all**. `service_role` bypasses RLS, so the
Hono API (the sole holder of the service key) becomes the only writer; an
authenticated client physically cannot write. Template: `arena_submissions`
(`048`) — a leaderboard is only as honest as its write model, and today's
`exercise_attempts` / `theme_progress` / `skill_events` are client-written and
therefore forgeable. Do not add a client write policy to an authoritative table
"for convenience" later; that is the retrofit the pattern exists to prevent.

## Custom Access Token hook reads

To surface a `profiles` flag as a JWT claim (so middleware/hot paths stop
reading the row per request), use a Supabase **Custom Access Token hook**
function that runs as `supabase_auth_admin`. Grant that role `execute` on the
function and `select` on the one table it reads, plus a **role-scoped** RLS
policy (`to supabase_auth_admin`) — never a broad grant, and revoke `execute`
from `authenticated`/`anon`/`public`. Template: `custom_access_token_hook`
(`046`, surfaces `onboarding_completed`). Always pair it with a read-side
fallback so the app is correct whether or not the operator has enabled the hook
in Auth config.

## The tracking table

`public.schema_migrations (version int primary key, name text, applied_at
timestamptz default now())`, created by migration `042`, which also backfills
001–041 so `migration-status.mjs` reports a truthful picture from day one. The
ledger is the source of truth for "what is live"; the directory is the source
of truth for "what exists". `migration-status.mjs` diffs the two.

## Applying to production (until CI owns it)

1. `node scripts/migration-status.mjs` — see what's unapplied.
2. Apply each pending file **in numeric order** in the Supabase SQL editor.
   Because every file is transaction-wrapped and self-recording, a paste either
   fully applies and records itself, or rolls back cleanly.
3. Re-run `migration-status.mjs` to confirm the ledger matches the directory.
4. To roll one back: apply its `.down.sql`, then re-run the status script.

Full runbook: `docs/migration-runbook.md`.
