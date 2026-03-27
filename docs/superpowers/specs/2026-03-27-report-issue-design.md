# Report Issue Feature — Design Spec

**Date:** 2026-03-27
**Status:** Approved

## Overview

Add a floating "Report Issue" button to Tensorcraft that opens a compact slide-up panel, allowing any user (authenticated or anonymous) to report bugs, feature requests, content issues, and payment problems. Issues are stored in Supabase and trigger an email notification to the support team.

## Decisions

- **Entry point:** Floating neon pill button (bottom-right corner, every page)
- **Modal style:** Compact slide-up panel anchored to bottom-right
- **Architecture:** Client-side modal → Hono API route → Supabase + email notification
- **Auth:** Both authenticated and anonymous users can report; anonymous users provide email manually
- **Screenshot:** Native file input upload (no html2canvas dependency)
- **Email:** Non-blocking transactional email via Resend

## Frontend

### Floating Button (`ReportIssueButton`)

- Rendered in the root layout (`apps/web/app/layout.tsx`) — visible on every page
- Uses Tensorcraft design tokens: `var(--tc-accent)` / `#00D4FF`, `var(--tc-surface)` / `#0F1320`, borders `rgba(255,255,255,0.06)`
- Neon pill style: 999px border-radius, glass-like surface with neon border, matching existing pill button patterns
- Glow effects via `--tc-glow` and `--tc-neon-line` tokens, `.neon-border` utility
- Fixed position: `bottom: 24px`, `right: 24px`
- High z-index (above content, below potential future overlays)
- Toggles the slide-up panel open/closed

### Slide-Up Panel (`ReportIssueModal`)

Anchored bottom-right, slides up from the button position with CSS transition. Uses the same design tokens, input styling, and patterns as the settings form.

**Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| Category | Dropdown | Yes | Bug, Feature Request, Content Issue, Payment Problem, Other |
| Description | Textarea | Yes | 10–2000 characters |
| Severity | Pill toggle group | Yes | Low, Medium, High, Critical (default: Medium) |
| Screenshot | File input | No | `accept="image/*"`, max 5MB, drag-and-drop zone |
| Email | Text input | Conditional | Required for anonymous users; auto-filled and hidden for authenticated users |

**Auto-captured context (sent silently, not shown in form):**

- `window.location.href` — current page URL
- `navigator.userAgent` — browser info
- Viewport dimensions (`window.innerWidth`, `window.innerHeight`)
- User ID (if authenticated, from Supabase session)

**States:**

- **Default** — form with empty fields
- **Loading** — submit button shows spinner, form disabled
- **Success** — "Thanks! We'll look into it." message, auto-closes after 3 seconds
- **Error** — inline error banner with retry option

**Patterns:** No external modal/dialog library. Single client component (`"use client"`). Local state via `useState`. Follows the same form submission pattern as settings: local state → fetch with Bearer token → inline feedback.

## API

### `POST /api/issues`

- **Public endpoint** — no auth required, but auth middleware runs to capture `userId` if available
- **Rate limit:** 5 reports per minute per IP (stricter than default 120/min to prevent spam)
- **Mounted in:** `apps/api/src/index.ts`

**Request body:**

```json
{
  "category": "bug | feature_request | content_issue | payment_problem | other",
  "description": "string (10–2000 chars)",
  "severity": "low | medium | high | critical",
  "email": "string (required if unauthenticated)",
  "screenshot": "base64 string (optional, max 5MB decoded)",
  "context": {
    "url": "string",
    "userAgent": "string",
    "viewport": { "width": "number", "height": "number" }
  }
}
```

**Validation:** Same pattern as other Hono routes — JSON parse with try-catch, field-by-field checks (length, enum membership, email format, base64 size), structured error responses.

**Screenshot handling:** If provided, decode base64, upload to Supabase Storage bucket (`issue-screenshots`), store resulting URL in the DB row.

**Response:** `201 { id: string, message: "Issue reported successfully" }`

**Error responses:**

- `400` — validation errors (missing fields, invalid values, description too short/long)
- `413` — screenshot exceeds 5MB
- `429` — rate limit exceeded

## Database

### Table: `issues`

| Column | Type | Default | Notes |
|--------|------|---------|-------|
| `id` | uuid | `gen_random_uuid()` | Primary key |
| `user_id` | uuid | null | Nullable, FK to `auth.users` |
| `category` | text | — | Check constraint: bug, feature_request, content_issue, payment_problem, other |
| `description` | text | — | 10–2000 chars |
| `severity` | text | — | Check constraint: low, medium, high, critical |
| `email` | text | — | Reporter email (from auth session or form input) |
| `screenshot_url` | text | null | Supabase Storage URL |
| `page_url` | text | — | Where the issue was reported from |
| `user_agent` | text | — | Browser info |
| `viewport` | jsonb | null | `{ width, height }` |
| `status` | text | `'open'` | For future admin use: open, in_progress, resolved, closed |
| `created_at` | timestamptz | `now()` | Timestamp |

**RLS Policies:**

- **Insert:** Allowed for everyone (anon + authenticated roles)
- **Select / Update:** Restricted to service role only (admin use)

### Supabase Storage

- **Bucket:** `issue-screenshots`
- **Access:** Public read (so email links work), authenticated + anon write
- **Max file size:** 5MB

## Email Notification

- Triggered after successful DB insert
- **Non-blocking** — if email fails, the request still succeeds (same pattern as Kit integration)
- **Provider:** Resend SDK (`resend` npm package in `apps/api`)
- **Recipient:** `support@tensorcraft.dev`
- **Content:** Category, severity, description, page URL, reporter email, screenshot link (if present)
- **Template:** Simple HTML + plain-text fallback — no complex rendering

## File Changes

### New Files

| File | Purpose |
|------|---------|
| `apps/web/app/components/report-issue-button.tsx` | Floating button + slide-up modal (single client component) |
| `apps/api/src/routes/issues.ts` | Hono route for POST /api/issues |
| `apps/api/src/routes/issues.test.ts` | Route tests |
| `apps/api/src/lib/email.ts` | Thin Resend email sending utility |

### Modified Files

| File | Change |
|------|--------|
| `apps/web/app/layout.tsx` | Render `<ReportIssueButton />` |
| `apps/api/src/index.ts` | Mount `/api/issues` route |
| `apps/api/.env.example` | Add `RESEND_API_KEY`, `SUPPORT_EMAIL` |

### New Dependencies

| Package | Location | Purpose |
|---------|----------|---------|
| `resend` | `apps/api` | Transactional email sending |

No new frontend dependencies.

## Future Development

These items are explicitly out of scope for V1 but should be built in future iterations:

- **Admin dashboard** — web UI for viewing, filtering, and managing reported issues (status updates, assignment, bulk actions)
- **Screenshot annotation** — allow users to draw, highlight, or annotate screenshots before submitting to better communicate visual issues
- **Real-time status updates** — notify reporters (via email or in-app) when their issue status changes (acknowledged, in progress, resolved)
- **Duplicate detection** — identify and surface potential duplicate issues based on description similarity, page URL, or category to reduce noise
