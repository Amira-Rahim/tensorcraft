-- Tensorcraft: Issue reports table
--
-- Backing store for the in-app issue reporter (see
-- apps/api/src/routes/issues.ts). The POST /api/issues endpoint accepts a
-- multipart submission, uploads any attached screenshot to the
-- `issue-screenshots` storage bucket, and inserts a row here via the
-- service-role client. Notification email is best-effort and does not
-- affect the row lifecycle.
--
-- Identity model:
--   - `user_id` is nullable - anonymous reports are allowed. The API
--     populates it when a valid Bearer token is present and null
--     otherwise. `email` carries the anonymous contact address in that
--     case (validated at the edge, not at the DB layer).
--   - The admin dashboard reads this table via the service role only.
--     There is no user-facing SELECT policy by design - RLS is enabled
--     with zero policies so `anon` / `authenticated` cannot read anything,
--     while the service role bypasses RLS to INSERT + SELECT.
--
-- Shape mirrors `Database["public"]["Tables"]["issues"]` in
-- packages/supabase/src/types.ts (Row + Insert).

-- ============================================================
-- Table
-- ============================================================
create table if not exists public.issues (
  id uuid primary key default gen_random_uuid(),

  -- Nullable so anonymous reports are supported. We do NOT foreign-key
  -- to auth.users on delete cascade - a deleted user's reports remain
  -- useful as admin artefacts. The application layer validates that a
  -- user_id, when present, corresponds to a real account (via the
  -- Bearer token path in issues.ts).
  user_id uuid,

  category text not null,
  description text not null,
  severity text not null,

  -- At least one of (user_id, email) must be present. Enforced at the
  -- API layer; we mirror the intent here with a CHECK so any direct
  -- service-role writes stay honest.
  email text,

  screenshot_url text,

  -- Context captured at submission time. `page_url` is required; the
  -- user-agent / viewport are best-effort and may be empty.
  page_url text not null default '',
  user_agent text not null default '',
  viewport jsonb,

  created_at timestamptz not null default now(),

  constraint chk_issues_category
    check (category in (
      'bug',
      'feature_request',
      'content_issue',
      'payment_problem',
      'other'
    )),

  constraint chk_issues_severity
    check (severity in ('low', 'medium', 'high', 'critical')),

  constraint chk_issues_identity
    check (user_id is not null or email is not null),

  constraint chk_issues_description_length
    check (char_length(description) between 10 and 2000)
);

-- Admin list queries sort by created_at DESC, and filter by category +
-- severity. A single DESC index on created_at covers the common case;
-- the category/severity filters are low-cardinality and scan cheaply
-- within the created_at range.
create index if not exists idx_issues_created_at
  on public.issues (created_at desc);

create index if not exists idx_issues_user_id
  on public.issues (user_id)
  where user_id is not null;

-- ============================================================
-- RLS
--
-- Enable RLS with no user-facing policies. The service role bypasses
-- RLS, so the API (which uses the service-role client for both inserts
-- and the admin list endpoint) continues to work. Anon + authenticated
-- clients cannot read or write directly.
-- ============================================================
alter table public.issues enable row level security;

-- Defensive: drop any policies that may exist from prior dev attempts
-- so a re-run of this migration reliably re-locks the table.
drop policy if exists "Users can view own issues" on public.issues;
drop policy if exists "Users can insert own issues" on public.issues;
drop policy if exists "Anyone can insert issues" on public.issues;
