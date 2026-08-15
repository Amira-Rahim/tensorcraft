# Email Flows - Event-Triggered Kit Tags - Design Spec

**Date:** 2026-04-14
**Status:** Draft

## Problem

Only one email trigger exists: purchase confirmation (Kit tag on Stripe webhook). No emails are sent for signup, onboarding, lesson completion, or capstone achievement. The product plan promises a welcome series and capstone celebration.

## Solution

Add Kit tag triggers at 4 new lifecycle events. Kit's automation builder handles email content, timing, and sequencing. Our code just fires `tagSubscriber(email, tagId)` at each event.

## New Event Tags

| Event | Env Var | Trigger Location | When |
|-------|---------|-----------------|------|
| Signup | `KIT_TAG_SIGNED_UP` | Session listener (first SIGNED_IN) | User's first authentication |
| Onboarding complete | `KIT_TAG_ONBOARDED` | Onboarding page (after profile save) | User finishes 6-step onboarding |
| First lesson complete | `KIT_TAG_FIRST_LESSON` | Lesson steps (consequence step) | First time any lesson is marked complete |
| Capstone complete | `KIT_TAG_CAPSTONE` | Capstone page (after all modules done) | User completes all 11 modules of a theme |

The existing `KIT_TAG_PURCHASED` (purchase confirmation) remains unchanged.

## Changes

### 1. New API route: `/api/email/tag`

**Create:** `apps/api/src/routes/email-tags.ts`

A simple authenticated endpoint that accepts an event name and fires the corresponding Kit tag:

```
POST /api/email/tag
Authorization: Bearer <jwt>
Body: { "event": "signed_up" | "onboarded" | "first_lesson" | "capstone" }
```

Implementation:
1. Validate JWT → get user ID
2. Look up user email from profiles table
3. Map event to env var: `KIT_TAG_${event.toUpperCase()}`
4. Call `addSubscriber(email)` (ensure subscribed) + `tagSubscriber(email, tagId)`
5. Fire-and-forget - return 200 immediately, don't block on Kit API
6. If Kit env vars aren't configured, return 200 silently (don't fail in dev)

Mount in `apps/api/src/index.ts`.

### 2. Fire signup tag on first auth

**Modify:** `apps/web/lib/supabase/session-listener.tsx`

In the `SIGNED_IN` event handler (which already persists GitHub tokens), add a check: if `tc_visited` was just set (first visit), fire the signup tag:

```typescript
// After setting tc_visited in localStorage
fetch("/api/email/tag", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
  body: JSON.stringify({ event: "signed_up" }),
}).catch(() => {}); // fire-and-forget
```

Use a localStorage flag `tc_signup_tagged` to ensure this only fires once per browser (not on every sign-in).

### 3. Fire onboarding tag on completion

**Modify:** `apps/web/app/onboarding/page.tsx`

In the `completeOnboarding()` callback, after the profile update succeeds, fire:

```typescript
fetch("/api/email/tag", {
  method: "POST",
  headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
  body: JSON.stringify({ event: "onboarded" }),
}).catch(() => {});
```

### 4. Fire first-lesson tag on first completion

**Modify:** `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-steps.tsx`

In the `currentStep === 5` (Consequence) useEffect that calls `markLessonCompleted()`, add a localStorage check:

```typescript
if (!localStorage.getItem("tc_first_lesson_tagged")) {
  localStorage.setItem("tc_first_lesson_tagged", "1");
  fetch("/api/email/tag", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event: "first_lesson" }),
  }).catch(() => {});
}
```

### 5. Fire capstone tag on theme completion

**Modify:** `apps/web/app/themes/[slug]/capstone/page.tsx`

The capstone page already checks if all modules are complete. When the page renders (meaning the user qualified for capstone), fire:

```typescript
// Server-side: after confirming all modules complete
// Call Kit via the API route from a client component, or directly from the server
```

Since the capstone page is a server component, create a small client component `CapstoneEmailTag` that fires once:

```typescript
// In capstone page, render: <CapstoneEmailTag />
// Client component that fires the tag on mount (once per theme, tracked in localStorage)
```

### 6. Environment variables

**Modify:** `apps/api/.env` and `apps/api/.env.example`

Add:
```
# Kit lifecycle tags (numeric IDs from Kit dashboard)
KIT_TAG_SIGNED_UP=
KIT_TAG_ONBOARDED=
KIT_TAG_FIRST_LESSON=
KIT_TAG_CAPSTONE=
```

## What Doesn't Change

- Kit API client (`apps/api/src/lib/kit.ts`) - already has `addSubscriber` and `tagSubscriber`
- Purchase confirmation flow - stays in webhook handler
- Resend integration - unchanged (issue reports only)
- Email preference fields (`email_alerts`, `weekly_digest`) - unchanged (future use)

## Verification

1. `pnpm build` passes
2. Sign up → `signed_up` tag fires in Kit (visible in Kit dashboard)
3. Complete onboarding → `onboarded` tag fires
4. Complete first lesson → `first_lesson` tag fires (only once, not on subsequent lessons)
5. Complete capstone → `capstone` tag fires
6. Tags don't fire in dev when Kit env vars aren't set (no errors)
7. Tags don't re-fire on page refresh (localStorage guards)
8. Tests cover: API route validation, event-to-tag mapping, fire-and-forget behavior
9. Docs updated: dev-plan, api-reference, deployment-guide
