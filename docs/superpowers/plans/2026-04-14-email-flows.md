# Email Flows — Event-Triggered Kit Tags Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Kit tag triggers at 4 lifecycle events (signup, onboarding, first lesson, capstone) so Kit automations can send welcome series and achievement emails.

**Architecture:** New `/api/email/tag` route receives event names, maps to Kit tag IDs from env vars, fires `addSubscriber` + `tagSubscriber` fire-and-forget. Frontend calls this route at each lifecycle moment with localStorage guards to prevent re-firing.

**Tech Stack:** Hono API, Kit (ConvertKit) REST API v3, React

**Spec:** `docs/superpowers/specs/2026-04-14-email-flows-design.md`

---

### Task 1: Create email-tags API route

**Files:**
- Create: `apps/api/src/routes/email-tags.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Create the route**

Create `apps/api/src/routes/email-tags.ts`:

```typescript
import { Hono } from "hono";
import { getSupabaseServerClient } from "@tensorcraft/supabase";
import { addSubscriber, tagSubscriber } from "../lib/kit";

const EMAIL_TAG_MAP: Record<string, string | undefined> = {
  signed_up: process.env.KIT_TAG_SIGNED_UP,
  onboarded: process.env.KIT_TAG_ONBOARDED,
  first_lesson: process.env.KIT_TAG_FIRST_LESSON,
  capstone: process.env.KIT_TAG_CAPSTONE,
};

const VALID_EVENTS = Object.keys(EMAIL_TAG_MAP);

export const emailTags = new Hono();

emailTags.post("/", async (c) => {
  // Parse body
  let body: { event: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON" }, 400);
  }

  if (!body.event || !VALID_EVENTS.includes(body.event)) {
    return c.json({ error: `Invalid event. Valid: ${VALID_EVENTS.join(", ")}` }, 400);
  }

  const tagId = EMAIL_TAG_MAP[body.event];
  if (!tagId) {
    // Tag not configured — silently succeed (dev environment)
    return c.json({ ok: true, skipped: true });
  }

  // Get user email from auth
  const authHeader = c.req.header("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  try {
    const supabase = getSupabaseServerClient(authHeader.replace("Bearer ", ""));
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user?.email) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    // Fire-and-forget: add subscriber + tag
    addSubscriber(user.email).catch(() => {});
    tagSubscriber(user.email, tagId).catch(() => {});

    return c.json({ ok: true, event: body.event });
  } catch {
    // Non-blocking — email tagging should never break the app
    return c.json({ ok: true, skipped: true });
  }
});
```

- [ ] **Step 2: Mount the route**

In `apps/api/src/index.ts`, add import and route:

```typescript
import { emailTags } from "./routes/email-tags";
// ...
app.route("/api/email", emailTags);
```

Add after the `issues` route (line 66).

- [ ] **Step 3: Add env vars**

In `apps/api/.env`, add:
```
KIT_TAG_SIGNED_UP=
KIT_TAG_ONBOARDED=
KIT_TAG_FIRST_LESSON=
KIT_TAG_CAPSTONE=
```

In `apps/api/.env.example`, add:
```
# Kit lifecycle tags (numeric IDs from Kit dashboard — trigger automated email sequences)
KIT_TAG_SIGNED_UP=
KIT_TAG_ONBOARDED=
KIT_TAG_FIRST_LESSON=
KIT_TAG_CAPSTONE=
```

- [ ] **Step 4: Verify build**

Run: `pnpm build 2>&1 | tail -5`

---

### Task 2: Fire signup tag on first auth

**Files:**
- Modify: `apps/web/lib/supabase/session-listener.tsx`

- [ ] **Step 1: Add signup tag trigger**

In the `SIGNED_IN` event handler, after the existing GitHub token persistence logic, add:

```typescript
// Tag new signups in Kit (fire once per browser)
try {
  if (!localStorage.getItem("tc_signup_tagged")) {
    localStorage.setItem("tc_signup_tagged", "1");
    fetch("/api/email/tag", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ event: "signed_up" }),
    }).catch(() => {});
  }
} catch {
  // localStorage unavailable
}
```

- [ ] **Step 2: Verify build**

Run: `pnpm build 2>&1 | tail -5`

---

### Task 3: Fire onboarding and first-lesson tags

**Files:**
- Modify: `apps/web/app/onboarding/page.tsx`
- Modify: `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-steps.tsx`

- [ ] **Step 1: Fire onboarding tag**

In `onboarding/page.tsx`, inside the `completeOnboarding()` callback, after the profile update and before the router.push, add:

```typescript
// Tag onboarding complete in Kit
const { data: { session: authSession } } = await supabase.auth.getSession();
if (authSession) {
  fetch("/api/email/tag", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${authSession.access_token}`,
    },
    body: JSON.stringify({ event: "onboarded" }),
  }).catch(() => {});
}
```

- [ ] **Step 2: Fire first-lesson tag**

In `lesson-steps.tsx`, in the useEffect that fires when `currentStep === 5` (Consequence), after `markLessonCompleted()`, add:

```typescript
// Tag first lesson complete in Kit (fire once per user)
try {
  if (!localStorage.getItem("tc_first_lesson_tagged")) {
    localStorage.setItem("tc_first_lesson_tagged", "1");
    fetch("/api/email/tag", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event: "first_lesson" }),
    }).catch(() => {});
  }
} catch {
  // localStorage unavailable
}
```

Note: This doesn't need an Authorization header if the user is not authenticated (free module). The API will return 401 silently — which is fine for fire-and-forget.

- [ ] **Step 3: Verify build**

Run: `pnpm build 2>&1 | tail -5`

---

### Task 4: Fire capstone tag

**Files:**
- Create: `apps/web/app/themes/[slug]/capstone/capstone-email-tag.tsx`
- Modify: `apps/web/app/themes/[slug]/capstone/page.tsx`

- [ ] **Step 1: Create client component for capstone tag**

Create `capstone-email-tag.tsx`:

```typescript
"use client";

import { useEffect } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function CapstoneEmailTag({ themeSlug }: { themeSlug: string }) {
  useEffect(() => {
    const key = `tc_capstone_tagged_${themeSlug}`;
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, "1");
    } catch {
      return;
    }

    const supabase = getSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) return;
      fetch("/api/email/tag", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ event: "capstone" }),
      }).catch(() => {});
    });
  }, [themeSlug]);

  return null;
}
```

- [ ] **Step 2: Render in capstone page**

In `apps/web/app/themes/[slug]/capstone/page.tsx`, import and render `<CapstoneEmailTag themeSlug={slug} />` inside the JSX (after the capstone content, before closing tags).

- [ ] **Step 3: Verify build**

Run: `pnpm build 2>&1 | tail -5`

---

### Task 5: Tests and docs

**Files:**
- Create: `apps/api/src/routes/__tests__/email-tags.test.ts`
- Modify: `docs/dev-plan.md`, `docs/api-reference.md`, `docs/deployment-guide.md`

- [ ] **Step 1: Write API tests**

Test the `/api/email/tag` route:
1. Returns 400 for missing/invalid event
2. Returns 200 with `skipped: true` when tag ID not configured
3. Returns 401 without auth header
4. Returns 200 with `ok: true` for valid event + auth

- [ ] **Step 2: Update docs**

`docs/dev-plan.md`: Mark email flows task completed.
`docs/api-reference.md`: Add `POST /api/email/tag` endpoint documentation.
`docs/deployment-guide.md`: Add the 4 new Kit tag env vars to the optional integrations section.

- [ ] **Step 3: Final build verification**

Run: `pnpm build 2>&1 | tail -5`

---

## Critical Files

| File | Action |
|------|--------|
| `apps/api/src/routes/email-tags.ts` | Create — new route |
| `apps/api/src/index.ts` | Modify — mount route |
| `apps/web/lib/supabase/session-listener.tsx` | Modify — signup tag |
| `apps/web/app/onboarding/page.tsx` | Modify — onboarding tag |
| `apps/web/app/themes/[slug]/[module]/[lesson]/lesson-steps.tsx` | Modify — first-lesson tag |
| `apps/web/app/themes/[slug]/capstone/capstone-email-tag.tsx` | Create — capstone tag client component |
| `apps/web/app/themes/[slug]/capstone/page.tsx` | Modify — render CapstoneEmailTag |
| `apps/api/.env` + `.env.example` | Modify — add tag env vars |
| `apps/api/src/routes/__tests__/email-tags.test.ts` | Create — tests |
| `docs/dev-plan.md`, `docs/api-reference.md`, `docs/deployment-guide.md` | Update |
