# Auth Flow UX Overhaul — Design Spec

**Date:** 2026-04-11
**Status:** Draft

## Problem

The current sign-in/sign-up experience has five compounding issues:

1. **Sign-in and sign-up are functionally identical.** Both modes offer the same OAuth + magic link buttons. Supabase auto-creates accounts, so the "Create Account" tab does nothing different from "Sign In."
2. **Two routes serve the same page.** `/auth/sign-in` and `/auth/sign-up` render the same `AuthForm` component with a toggle. The distinction is artificial.
3. **Post-auth redirect causes a flash.** The default `redirectTo` is `/onboarding`. Returning users briefly load onboarding before middleware redirects them to `/dashboard`.
4. **Copy doesn't differentiate users.** "// MODULE 1 · FREE · NO CARD" appears for both new and returning users. Returning users don't need this pitch.
5. **Magic link confirmation is vague.** "Check your email" doesn't explain what happens after clicking the link.

## Solution

Merge the two auth routes into a single `/auth` page with context-aware copy that adapts based on whether the visitor is new or returning.

## Design

### Route Structure

| Route | Behavior |
|-------|----------|
| `/auth` | New unified auth page |
| `/auth/sign-in` | Redirects to `/auth` (preserving query params) |
| `/auth/sign-up` | Redirects to `/auth` (preserving query params) |
| `/auth/callback` | Unchanged |
| `/auth/sign-out` | Unchanged |

### Context Detection

On first successful auth, set `tc_visited` in localStorage. When the auth page loads:

- **No `tc_visited`** → New visitor state
- **Has `tc_visited`** → Returning user state
- **URL has `?redirectTo=/pricing...`** → Checkout context state (deferred to post-launch; for now, uses returning-user copy)

**Known limitation:** `tc_visited` is per-browser. Users on a new device or after clearing storage see "new visitor" copy even if they have an account. This is acceptable because the form behavior is identical — only the copy differs.

The bottom-of-form link ("Already have an account?" / "New here?") toggles the copy context locally without navigation. The form controls remain identical in all states.

### Copy by Context

| Element | New Visitor | Returning User |
|---------|-------------|----------------|
| Heading | Start Learning | Welcome Back |
| Subtitle | Create an account to begin your ML journey | Sign in to continue learning |
| Callout | // MODULE 1 · FREE · NO CARD | // PICK UP WHERE YOU LEFT OFF |
| Bottom link | Already have an account? **Sign in** | New here? **Learn more** |

Bottom link behavior:
- "Sign in" swaps to returning-user copy (no navigation)
- "Learn more" links to the landing page `/`

### Auth Methods

Unchanged — GitHub OAuth, Google OAuth, magic link (email). No email/password.

### Redirect Logic

Change the default `redirectTo` from `/onboarding` to `/dashboard`.

The middleware already enforces the onboarding gate:
- **New user (onboarding incomplete):** Auth → callback → `/dashboard` → middleware redirects to `/onboarding` (server-side, no flash)
- **Returning user (onboarding complete):** Auth → callback → `/dashboard` → middleware allows through

### Magic Link Confirmation

After sending a magic link, replace the current "Check your email" screen with:

- **Heading:** "Check your inbox"
- **Body:** "We sent a magic link to **{email}**. Click the link and you'll be taken to your dashboard automatically."
- **Help text:** "Didn't receive it? Check your spam folder or [resend the link]."
- **Link:** "Use a different email" (resets to form state)

The "resend" action calls `signInWithOtp` again with the same email.

## Files to Modify

### New Files
- `apps/web/app/auth/page.tsx` — New unified auth page, renders `AuthForm` without mode prop

### Modified Files
- `apps/web/app/auth/sign-in/page.tsx` — Replace with redirect to `/auth`
- `apps/web/app/auth/sign-up/page.tsx` — Replace with redirect to `/auth`
- `apps/web/app/components/auth-form.tsx` — Core rewrite:
  - Remove `mode` prop and toggle tabs
  - Add `tc_visited` localStorage detection
  - Context-aware heading/subtitle/callout/bottom-link
  - Default `redirectTo` → `/dashboard`
  - Improved magic link confirmation with resend
- `apps/web/lib/supabase/middleware.ts` — Two changes:
  1. Add `/auth` to auth route checks alongside existing routes
  2. Change unauthenticated redirect target from `/auth/sign-in` to `/auth`
- `apps/web/app/auth/callback/route.ts` — Change fallback `next` from `/onboarding` to `/dashboard` (aligns with auth form default; prevents flash if `next` param is missing)
- `apps/web/app/components/nav.tsx` — "Start now" link → `/auth`
- `apps/web/app/components/mobile-nav.tsx` — Same CTA change

### Existing Utilities to Reuse
- `getSupabaseBrowserClient()` from `apps/web/lib/supabase/client.ts`
- `AmbientBackground` component (keep the gradient descent visualization)
- `supabase.auth.signInWithOAuth()` and `supabase.auth.signInWithOtp()` — same API calls
- Callback route logic — only the fallback `next` default changes (see Modified Files)

## Verification

1. **New visitor flow:** Clear localStorage, visit `/auth` → should see "Start Learning" heading and "MODULE 1 · FREE" callout
2. **Returning visitor flow:** Set `tc_visited` in localStorage, visit `/auth` → should see "Welcome Back" heading and "PICK UP WHERE YOU LEFT OFF" callout
3. **Old route redirects:** Visit `/auth/sign-in` and `/auth/sign-up` → both redirect to `/auth` preserving query params
4. **Post-auth redirect (new user):** Complete auth → lands on `/onboarding` (middleware gate), not a flash through dashboard
5. **Post-auth redirect (returning user):** Complete auth → lands on `/dashboard` directly
6. **Magic link flow:** Enter email → see improved confirmation with resend option → click resend → another OTP sent
7. **Nav CTAs:** "Start now" in header links to `/auth`
8. **Middleware:** Authenticated users visiting `/auth` get redirected to dashboard
9. **Build:** `pnpm build` passes with no errors
