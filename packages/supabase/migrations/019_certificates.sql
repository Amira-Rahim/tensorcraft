-- Tensorcraft: Completion certificates
--
-- Phase 11 §11e - issues a certificate when a user completes all lessons
-- of a theme. One certificate per user per theme. The `cert_hash` is a
-- deterministic SHA-256 computed by the API so that a share URL can be
-- verified without exposing the user's UUID.
--
-- Sharing model:
--   - Authenticated users SELECT their own rows (RLS: auth.uid() = user_id)
--   - INSERTs happen only via the service role (the /api/certificates
--     POST endpoint - clients never INSERT directly)
--   - Public share pages fetch via a SECURITY DEFINER function
--     `public.get_shared_certificate(p_id uuid)` which returns the minimal
--     set of columns needed for rendering. This keeps RLS simple (no anon
--     SELECT policy on the table itself) while still allowing anon share
--     access by id only.

-- ============================================================
-- Table
-- ============================================================
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  theme_id text not null,
  issued_at timestamptz not null default now(),
  cert_hash text not null,
  pdf_url text,

  -- One certificate per user per theme - the POST endpoint is idempotent
  -- and re-issues the same row instead of inserting a duplicate.
  constraint uq_certificates_user_theme unique (user_id, theme_id),

  -- Theme slug must be one of the canonical five.
  constraint chk_certificates_theme_id
    check (
      theme_id in (
        'deep-orbit',
        'neon-protocol',
        'signal-ward',
        'nova-canvas',
        'terra-grid'
      )
    )
);

create index if not exists idx_certificates_user on public.certificates(user_id);
create index if not exists idx_certificates_hash on public.certificates(cert_hash);

-- ============================================================
-- RLS
-- ============================================================
alter table public.certificates enable row level security;

-- Authenticated users can read their own certificates.
drop policy if exists "Users can view own certificates" on public.certificates;
create policy "Users can view own certificates"
  on public.certificates for select
  using (auth.uid() = user_id);

-- No INSERT / UPDATE / DELETE policies for anon or authenticated - only
-- the service role (the API) may write. The service role bypasses RLS.

-- ============================================================
-- Public share accessor
--
-- A SECURITY DEFINER function exposes exactly the columns a share page
-- needs (id, theme_id, issued_at, cert_hash + display_name, avatar_url
-- via join on profiles). Anyone with a certificate `id` - which is
-- effectively the share URL - can read it; but the underlying table
-- remains locked down under RLS.
-- ============================================================
create or replace function public.get_shared_certificate(p_id uuid)
returns table (
  id uuid,
  theme_id text,
  issued_at timestamptz,
  cert_hash text,
  user_display_name text,
  user_avatar_url text
)
language sql
security definer
set search_path = public
as $$
  select
    c.id,
    c.theme_id,
    c.issued_at,
    c.cert_hash,
    p.display_name as user_display_name,
    p.avatar_url as user_avatar_url
  from public.certificates c
  left join public.profiles p on p.id = c.user_id
  where c.id = p_id;
$$;

-- Allow anon + authenticated to call the function. Arguments are scalar
-- so there's no injection surface beyond the function body itself.
grant execute on function public.get_shared_certificate(uuid) to anon, authenticated;
