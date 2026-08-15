# Session Error Handling - Design Spec

**Date:** 2026-04-14
**Status:** Draft

## Problem

1. **Critical bug:** Exercise attempt POSTs have no `Authorization` header - always fail with 401
2. **Silent failures:** API errors are swallowed with `.catch(() => {})` - users lose progress without knowing
3. **No mid-lesson feedback:** When a session expires during a long lesson, the user gets no notification until they try to navigate to a protected page

## Solution

Three targeted fixes: add auth headers, add a session-expired toast, and add error feedback on critical API paths.

## Changes

### 1. Fix exercise attempt auth header

**File:** `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-content.tsx`

The `handleExerciseSubmit` function (line 95-114) POSTs to `/api/exercise-attempts` without an `Authorization` header. Fix: get the session token from Supabase and include it.

```typescript
const supabase = getSupabaseBrowserClient();
const { data: { session } } = await supabase.auth.getSession();
if (!session) return; // not logged in - skip silently (free module users)

fetch("/api/exercise-attempts", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  },
  body: JSON.stringify({ ... }),
}).catch(() => {});
```

Note: The `getApiUrl()` import is needed to use the correct API URL, not a relative path.

### 2. Session-expired toast component

**Create:** `apps/web/app/components/session-toast.tsx`

A client component that listens for 401 errors and shows a dismissable banner:

- Renders a fixed-bottom banner: "Your session has expired. [Sign in again →]"
- Triggered by a global event or React context
- Auto-hides after 10 seconds or on click
- Links to `/auth?redirectTo={currentPath}`
- Styled with the brutalist aesthetic (border, monospace, primary accent)

### 3. Create a fetch wrapper for authenticated API calls

**Create:** `apps/web/lib/api-fetch.ts`

A small utility that wraps `fetch` for authenticated API calls:

```typescript
export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const { getApiUrl } = await import("./api-url");
  const supabase = (await import("./supabase/client")).getSupabaseBrowserClient();
  const { data: { session } } = await supabase.auth.getSession();

  const url = `${getApiUrl()}${path}`;
  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(session ? { Authorization: `Bearer ${session.access_token}` } : {}),
      ...options.headers,
    },
  });

  // Emit session-expired event on 401
  if (response.status === 401 && typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("tc:session-expired"));
  }

  return response;
}
```

### 4. Use apiFetch on critical paths

Replace raw `fetch` calls with `apiFetch` on these critical paths:

- `lesson-content.tsx` - exercise attempt POST
- `lesson-steps.tsx` - email tag POSTs (already fire-and-forget, but use apiFetch for auth header)

Keep fire-and-forget `.catch(() => {})` for non-critical paths (analytics, email tags) - they should not block the UI.

### 5. Mount SessionToast in layout

**Modify:** `apps/web/app/layout.tsx`

Add `<SessionToast />` component alongside existing `<SessionListener />`. It listens for the `tc:session-expired` custom event and shows the banner.

## What Doesn't Change

- Middleware session handling - already works
- Auth form error display - already shows session_expired
- Error boundary pages - already exist
- API auth middleware - already returns 401

## Verification

1. `pnpm build` passes
2. Exercise submission includes auth header (check Network tab)
3. When session expires mid-lesson → toast appears with "Sign in again" link
4. Dismissing toast → it goes away
5. Non-critical API calls (email tags, analytics) still fire-and-forget
6. Tests cover: apiFetch utility, SessionToast visibility
7. Docs updated: dev-plan, architecture
