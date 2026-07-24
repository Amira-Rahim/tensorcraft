-- Tensorcraft: <one-line description>.
--
-- <Why this migration exists. Reference the audit/finding if relevant.>
--
-- Follows packages/supabase/migrations/CONVENTIONS.md:
--   transaction wrapped · idempotent · records its version · paired .down.sql.

begin;

-- ============================================================
-- <section>
-- ============================================================
-- Idempotent DDL only. Examples:
--   create table if not exists public.<t> ( ... );
--   alter table public.<t> add column if not exists <c> <type>;
--   create or replace function public.<f>() ...;
--   drop policy if exists "<p>" on public.<t>;
--   create policy "<p>" on public.<t> for select using ( ... );



-- ---- record this migration (keep last, before commit) ----
insert into public.schema_migrations (version, name)
values (NNN, '<short_description>')
on conflict (version) do nothing;

commit;
