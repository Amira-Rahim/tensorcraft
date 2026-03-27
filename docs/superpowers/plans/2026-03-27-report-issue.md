# Report Issue Feature — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a floating "Report Issue" button with slide-up panel to every page, backed by a Hono API route that stores issues in Supabase and sends email notifications via Resend.

**Architecture:** Client-side React component (floating pill button + slide-up modal) submits multipart/form-data to `POST /api/issues`. The Hono route validates input, uploads optional screenshots to Supabase Storage, inserts a row into the `issues` table, and fires a non-blocking email notification via Resend.

**Tech Stack:** Next.js 15 (React 19), Hono 4.7, Supabase (Postgres + Storage + Auth), Resend (email), Upstash Redis (rate limiting), Vitest (tests)

**Spec:** `docs/superpowers/specs/2026-03-27-report-issue-design.md`

---

## File Structure

| File | Responsibility |
|------|---------------|
| `apps/api/src/lib/email.ts` | Thin Resend wrapper — `sendIssueNotification()` |
| `apps/api/src/routes/issues.ts` | `POST /api/issues` — validation, storage upload, DB insert, email |
| `apps/api/src/routes/issues.test.ts` | Vitest tests for the issues route |
| `apps/web/app/components/report-issue-button.tsx` | Floating button + slide-up panel (single `"use client"` component) |
| `apps/api/src/index.ts` | **Modify:** mount issues route |
| `apps/web/app/layout.tsx` | **Modify:** render `<ReportIssueButton />` |
| `apps/api/.env.example` | **Modify:** add `RESEND_API_KEY`, `SUPPORT_EMAIL` |

---

## Task 1: Install Resend dependency

**Files:**
- Modify: `apps/api/package.json`

- [ ] **Step 1: Install resend in the API package**

```bash
cd apps/api && pnpm add resend
```

- [ ] **Step 2: Add env vars to .env.example**

Append to `apps/api/.env.example`:

```
# Resend (issue report email notifications)
RESEND_API_KEY=re_...
SUPPORT_EMAIL=support@tensorcraft.dev
```

- [ ] **Step 3: Commit**

```bash
git add apps/api/package.json apps/api/.env.example pnpm-lock.yaml
git commit -m "chore: add resend dependency for issue email notifications"
```

---

## Task 2: Email utility

**Files:**
- Create: `apps/api/src/lib/email.ts`

- [ ] **Step 1: Create the email utility**

```typescript
// apps/api/src/lib/email.ts
import { Resend } from "resend";
import { captureException } from "./error-tracking";

let resend: Resend | null = null;

function getResend(): Resend | null {
  if (resend) return resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  resend = new Resend(key);
  return resend;
}

interface IssueEmailParams {
  id: string;
  category: string;
  severity: string;
  description: string;
  email: string;
  pageUrl: string;
  screenshotUrl?: string | null;
}

export async function sendIssueNotification(
  params: IssueEmailParams,
): Promise<void> {
  const client = getResend();
  const to = process.env.SUPPORT_EMAIL || "support@tensorcraft.dev";
  if (!client) {
    console.warn("Resend not configured — skipping issue notification email");
    return;
  }

  const { id, category, severity, description, email, pageUrl, screenshotUrl } =
    params;

  const subject = `[${severity.toUpperCase()}] ${category.replace(/_/g, " ")} — Issue #${id.slice(0, 8)}`;

  const text = [
    `Category: ${category.replace(/_/g, " ")}`,
    `Severity: ${severity}`,
    `Reporter: ${email}`,
    `Page: ${pageUrl}`,
    screenshotUrl ? `Screenshot: ${screenshotUrl}` : null,
    "",
    "Description:",
    description,
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family: monospace; background: #080B16; color: #FFFFFF; padding: 24px;">
      <h2 style="color: #00D4FF; margin: 0 0 16px;">Issue Report</h2>
      <table style="border-collapse: collapse; width: 100%;">
        <tr><td style="padding: 4px 12px 4px 0; color: #8B92A5;">Category</td><td>${category.replace(/_/g, " ")}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #8B92A5;">Severity</td><td>${severity}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #8B92A5;">Reporter</td><td>${email}</td></tr>
        <tr><td style="padding: 4px 12px 4px 0; color: #8B92A5;">Page</td><td><a href="${pageUrl}" style="color: #00D4FF;">${pageUrl}</a></td></tr>
        ${screenshotUrl ? `<tr><td style="padding: 4px 12px 4px 0; color: #8B92A5;">Screenshot</td><td><a href="${screenshotUrl}" style="color: #00D4FF;">View</a></td></tr>` : ""}
      </table>
      <hr style="border: 1px solid rgba(255,255,255,0.06); margin: 16px 0;" />
      <p style="white-space: pre-wrap;">${description}</p>
    </div>
  `;

  try {
    await client.emails.send({
      from: "Tensorcraft <noreply@tensorcraft.dev>",
      to,
      subject,
      text,
      html,
    });
  } catch (err) {
    captureException(err, { source: "issues.email" });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add apps/api/src/lib/email.ts
git commit -m "feat: add Resend email utility for issue notifications"
```

---

## Task 3: Issues API route — tests first

**Files:**
- Create: `apps/api/src/routes/issues.test.ts`

- [ ] **Step 1: Write the test file**

```typescript
// apps/api/src/routes/issues.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Hono } from "hono";

const mockInsert = vi.fn();
const mockUpload = vi.fn();
const mockGetPublicUrl = vi.fn();
const mockGetUser = vi.fn();
const mockSendEmail = vi.fn();

vi.mock("@tensorcraft/supabase", () => ({
  getSupabaseAdminClient: () => ({
    from: (table: string) => {
      if (table === "issues") {
        return {
          insert: (data: unknown) => {
            mockInsert(data);
            return {
              select: () => ({
                single: () =>
                  Promise.resolve({
                    data: { id: "test-uuid-1234", ...data },
                    error: null,
                  }),
              }),
            };
          },
        };
      }
      return {};
    },
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => {
          mockUpload(...args);
          return Promise.resolve({ data: { path: "test.png" }, error: null });
        },
        getPublicUrl: (path: string) => {
          mockGetPublicUrl(path);
          return {
            data: { publicUrl: `https://storage.test/issue-screenshots/${path}` },
          };
        },
      }),
    },
  }),
  getSupabaseServerClient: (token: string) => ({
    auth: {
      getUser: () => mockGetUser(token),
    },
  }),
}));

vi.mock("../lib/email", () => ({
  sendIssueNotification: (...args: unknown[]) => {
    mockSendEmail(...args);
    return Promise.resolve();
  },
}));

// Import after mocks
const { issues } = await import("./issues");

const app = new Hono();
app.route("/api/issues", issues);

function createFormData(fields: Record<string, string | Blob>) {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }
  return form;
}

const validFields = {
  category: "bug",
  description: "The exercise editor crashes when I paste code",
  severity: "high",
  email: "user@example.com",
  context: JSON.stringify({
    url: "https://tensorcraft.dev/themes/deep-orbit/1/1",
    userAgent: "Mozilla/5.0",
    viewport: JSON.stringify({ width: 1920, height: 1080 }),
  }),
};

describe("POST /api/issues", () => {
  beforeEach(() => {
    mockInsert.mockClear();
    mockUpload.mockClear();
    mockGetPublicUrl.mockClear();
    mockGetUser.mockClear();
    mockSendEmail.mockClear();
  });

  it("returns 201 for valid anonymous submission", async () => {
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData(validFields),
    });
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.id).toBe("test-uuid-1234");
    expect(json.message).toBe("Issue reported successfully");
    expect(mockInsert).toHaveBeenCalledOnce();
    expect(mockSendEmail).toHaveBeenCalledOnce();
  });

  it("returns 400 when category is missing", async () => {
    const { category, ...rest } = validFields;
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData(rest),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid category value", async () => {
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData({ ...validFields, category: "spam" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when description is too short", async () => {
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData({ ...validFields, description: "short" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when description exceeds 2000 chars", async () => {
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData({
        ...validFields,
        description: "x".repeat(2001),
      }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid severity", async () => {
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData({ ...validFields, severity: "urgent" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when anonymous and email is missing", async () => {
    const { email, ...rest } = validFields;
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData(rest),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email format", async () => {
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData({ ...validFields, email: "not-an-email" }),
    });
    expect(res.status).toBe(400);
  });

  it("uses authenticated user email when no email field provided", async () => {
    mockGetUser.mockResolvedValueOnce({
      data: { user: { id: "user-123", email: "authed@example.com" } },
      error: null,
    });

    const { email, ...rest } = validFields;
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData(rest),
      headers: { Authorization: "Bearer valid-token" },
    });
    expect(res.status).toBe(201);
    const insertArg = mockInsert.mock.calls[0][0];
    expect(insertArg.email).toBe("authed@example.com");
    expect(insertArg.user_id).toBe("user-123");
  });

  it("uploads screenshot to storage when provided", async () => {
    const file = new File(["fake-image-data"], "screenshot.png", {
      type: "image/png",
    });
    const form = createFormData(validFields);
    form.set("screenshot", file);

    const res = await app.request("/api/issues", {
      method: "POST",
      body: form,
    });
    expect(res.status).toBe(201);
    expect(mockUpload).toHaveBeenCalledOnce();
    const insertArg = mockInsert.mock.calls[0][0];
    expect(insertArg.screenshot_url).toContain("issue-screenshots");
  });

  it("returns 400 when context is missing", async () => {
    const { context, ...rest } = validFields;
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData(rest),
    });
    expect(res.status).toBe(400);
  });

  it("returns 400 when description is exactly 9 chars (boundary)", async () => {
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData({ ...validFields, description: "123456789" }),
    });
    expect(res.status).toBe(400);
  });

  it("returns 201 when description is exactly 10 chars (boundary)", async () => {
    const res = await app.request("/api/issues", {
      method: "POST",
      body: createFormData({ ...validFields, description: "1234567890" }),
    });
    expect(res.status).toBe(201);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd apps/api && pnpm vitest run src/routes/issues.test.ts
```

Expected: FAIL — `./issues` module does not exist yet.

- [ ] **Step 3: Commit failing tests**

```bash
git add apps/api/src/routes/issues.test.ts
git commit -m "test: add failing tests for POST /api/issues route"
```

---

## Task 4: Issues API route — implementation

**Files:**
- Create: `apps/api/src/routes/issues.ts`
- Modify: `apps/api/src/index.ts`

- [ ] **Step 1: Create the issues route**

```typescript
// apps/api/src/routes/issues.ts
import { Hono } from "hono";
import { bodyLimit } from "hono/body-limit";
import {
  getSupabaseAdminClient,
  getSupabaseServerClient,
} from "@tensorcraft/supabase";
import { getRedis } from "../lib/redis";
import { sendIssueNotification } from "../lib/email";
import { captureException } from "../lib/error-tracking";
import type { AppEnv } from "../types";

const VALID_CATEGORIES = [
  "bug",
  "feature_request",
  "content_issue",
  "payment_problem",
  "other",
] as const;
const VALID_SEVERITIES = ["low", "medium", "high", "critical"] as const;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SCREENSHOT_SIZE = 5 * 1024 * 1024; // 5 MB

export const issues = new Hono<AppEnv>();

// Route-specific body limit: 8MB to allow 5MB screenshots + form overhead
issues.use("*", bodyLimit({ maxSize: 8 * 1024 * 1024 }));

// Route-specific rate limit: 5 per minute per IP (stricter than global 120/min)
const ISSUE_RATE_LIMIT = 5;
const ISSUE_RATE_WINDOW = 60_000;

issues.use("*", async (c, next) => {
  const ip =
    c.req.header("cf-connecting-ip") ||
    (c.req.header("x-forwarded-for") || "").split(",").pop()?.trim() ||
    "unknown";

  try {
    const redis = getRedis();
    const key = `rl:issues:${ip}`;
    const now = Date.now();

    const pipeline = redis.pipeline();
    pipeline.zremrangebyscore(key, 0, now - ISSUE_RATE_WINDOW);
    pipeline.zadd(key, { score: now, member: `${now}:${Math.random()}` });
    pipeline.zcard(key);
    pipeline.expire(key, 120);

    const results = await pipeline.exec();
    const count = results[2] as number;

    if (count > ISSUE_RATE_LIMIT) {
      c.header("Retry-After", "60");
      return c.json({ error: "Too many reports. Please try again later." }, 429);
    }
  } catch {
    // Graceful degradation — allow request if Redis is unavailable
  }

  return next();
});

issues.post("/", async (c) => {
  // --- Parse multipart form ---
  let formData: FormData;
  try {
    formData = await c.req.formData();
  } catch {
    return c.json({ error: "Invalid form data" }, 400);
  }

  const category = formData.get("category") as string | null;
  const description = formData.get("description") as string | null;
  const severity = formData.get("severity") as string | null;
  const emailField = formData.get("email") as string | null;
  const contextRaw = formData.get("context") as string | null;
  const screenshot = formData.get("screenshot") as File | null;

  // --- Resolve user identity (optional auth) ---
  let userId: string | null = null;
  let userEmail: string | null = null;

  const authHeader = c.req.header("Authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    if (token) {
      try {
        const supabase = getSupabaseServerClient(token);
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          userId = user.id;
          userEmail = user.email ?? null;
        }
      } catch {
        // Non-fatal — treat as anonymous
      }
    }
  }

  const email = userEmail || emailField;

  // --- Validate fields ---
  if (
    !category ||
    !VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])
  ) {
    return c.json({ error: "Invalid or missing category" }, 400);
  }

  if (!description || description.length < 10 || description.length > 2000) {
    return c.json(
      { error: "Description must be between 10 and 2000 characters" },
      400,
    );
  }

  if (
    !severity ||
    !VALID_SEVERITIES.includes(severity as (typeof VALID_SEVERITIES)[number])
  ) {
    return c.json({ error: "Invalid or missing severity" }, 400);
  }

  if (!email || !EMAIL_REGEX.test(email)) {
    return c.json({ error: "Valid email is required" }, 400);
  }

  if (!contextRaw) {
    return c.json({ error: "Context is required" }, 400);
  }

  let context: { url?: string; userAgent?: string; viewport?: unknown };
  try {
    context = JSON.parse(contextRaw);
  } catch {
    return c.json({ error: "Invalid context JSON" }, 400);
  }

  // --- Screenshot upload ---
  let screenshotUrl: string | null = null;

  if (screenshot && screenshot.size > 0) {
    if (screenshot.size > MAX_SCREENSHOT_SIZE) {
      return c.json({ error: "Screenshot exceeds 5MB limit" }, 413);
    }

    if (!screenshot.type.startsWith("image/")) {
      return c.json({ error: "Screenshot must be an image" }, 400);
    }

    const supabase = getSupabaseAdminClient();
    const ext = screenshot.name.split(".").pop() || "png";
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
    const buffer = await screenshot.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from("issue-screenshots")
      .upload(path, buffer, { contentType: screenshot.type });

    if (uploadError) {
      captureException(uploadError, { source: "issues.screenshot-upload" });
      // Continue without screenshot — non-fatal
    } else {
      const {
        data: { publicUrl },
      } = supabase.storage.from("issue-screenshots").getPublicUrl(path);
      screenshotUrl = publicUrl;
    }
  }

  // --- Insert into database ---
  const supabase = getSupabaseAdminClient();

  const { data, error: dbError } = await supabase
    .from("issues")
    .insert({
      user_id: userId,
      category,
      description,
      severity,
      email,
      screenshot_url: screenshotUrl,
      page_url: context.url ?? "",
      user_agent: context.userAgent ?? "",
      viewport: context.viewport ?? null,
    })
    .select()
    .single();

  if (dbError) {
    captureException(dbError, { source: "issues.insert" });
    return c.json(
      {
        error: "Failed to submit issue",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  // --- Non-blocking email notification ---
  sendIssueNotification({
    id: data.id,
    category,
    severity,
    description,
    email,
    pageUrl: context.url ?? "",
    screenshotUrl,
  }).catch((err) => {
    captureException(err, { source: "issues.email" });
  });

  return c.json(
    { id: data.id, message: "Issue reported successfully" },
    201,
  );
});
```

- [ ] **Step 2: Mount the route in index.ts**

In `apps/api/src/index.ts`, add the import and route mounting:

Import (add with the other route imports near the top):
```typescript
import { issues } from "./routes/issues";
```

Mount (add after the other `app.route()` calls, around line 61):
```typescript
app.route("/api/issues", issues);
```

**Important:**
1. The issues route does NOT use the global `authMiddleware` — it handles auth optionally inside the handler.
2. **Body limit exemption:** The global body limit (1MB, line 25) runs BEFORE route-level middleware, so it would block 5MB screenshot uploads. Exempt `/api/issues` from the global body limit the same way the Stripe webhook is exempted from rate limiting. The route's own `bodyLimit(8MB)` handles enforcement.
3. The route includes its own rate limiter (5 req/min per IP) using a separate Redis key prefix `rl:issues:`.

Change the global body limit line in `apps/api/src/index.ts` from:

```typescript
app.use("*", bodyLimit({ maxSize: 1024 * 1024 })); // 1 MB global limit
```

To:

```typescript
// Body limit all routes EXCEPT /api/issues (needs 8MB for screenshot uploads)
app.use("*", async (c, next) => {
  if (c.req.path.startsWith("/api/issues")) {
    return next();
  }
  return bodyLimit({ maxSize: 1024 * 1024 })(c, next);
});
```

- [ ] **Step 3: Run tests to verify they pass**

```bash
cd apps/api && pnpm vitest run src/routes/issues.test.ts
```

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/api/src/routes/issues.ts apps/api/src/index.ts
git commit -m "feat: add POST /api/issues route with validation, storage, and email"
```

---

## Task 5: Frontend — Report Issue Button & Modal

**Files:**
- Create: `apps/web/app/components/report-issue-button.tsx`
- Modify: `apps/web/app/layout.tsx`

This is a meaningful UI component with design choices. The implementer should build the complete component following these patterns from the existing codebase.

- [ ] **Step 1: Create the report issue button component**

Create `apps/web/app/components/report-issue-button.tsx` as a `"use client"` component.

**Requirements:**
- Floating pill button: `position: fixed`, `bottom: 24px`, `right: 24px`, `z-index: 50`
- Button styling matches existing patterns from `settings-form.tsx`:
  - Use `var(--tc-primary)` for accent, `var(--tc-bg)` for background, `var(--tc-border)` for borders
  - `border-radius: 999px` (pill shape)
  - Neon glow: `box-shadow: 0 0 12px var(--tc-glow, rgba(0,212,255,0.15))`
  - `font-family: monospace`, `font-size: 12px`
- Slide-up panel anchored bottom-right, appearing above the button with CSS transition (`transform: translateY`, `opacity`)
- Panel width: `340px`, `background: var(--tc-surface)`, `border: 2px solid var(--tc-border)`
- All form inputs styled exactly like settings form inputs:
  - `background: var(--tc-surface-overlay)`, `border: 2px solid var(--tc-border)`, `color: var(--tc-text)`, `font-size: 12px`, `padding: 10px 14px`, `font-family: monospace`
- Labels: `font-size: 10px`, `color: var(--tc-muted)`, `letter-spacing: 0.12em`, `text-transform: uppercase`
- Category dropdown: `<select>` with same input styling
- Severity pills: row of clickable pills, selected one uses `var(--tc-primary)` border/text
- Screenshot drop zone: dashed border `var(--tc-border)`, `font-size: 11px`
- Submit button: same pattern as settings save button (`var(--tc-primary)` bg, `var(--tc-bg)` text, hover lift)
- Email field: hidden when user is authenticated (check via `getSupabaseBrowserClient().auth.getUser()`)
- Auto-capture context on submit: `window.location.href`, `navigator.userAgent`, `window.innerWidth/innerHeight`
- Submit via `fetch("/api/issues", { method: "POST", body: formData })` — include Bearer token if authenticated
- States: default, loading (spinner + disabled), success (auto-close 3s), error (inline banner)
- Click outside panel or press Escape to close

- [ ] **Step 2: Add to root layout**

In `apps/web/app/layout.tsx`, import and render the component inside the `<body>` tag, after the existing components (around where `<CookieConsent />` is rendered):

```typescript
import { ReportIssueButton } from "./components/report-issue-button";
```

Add `<ReportIssueButton />` after `<CookieConsent />` (around line 141).

- [ ] **Step 3: Verify locally**

```bash
cd apps/web && pnpm dev
```

Open `http://localhost:3000` and verify:
- Floating pill button visible bottom-right on every page
- Clicking opens the slide-up panel with all fields
- Form validates required fields
- Panel closes on Escape or clicking outside
- Styling matches the Tensorcraft design system

- [ ] **Step 4: Commit**

```bash
git add apps/web/app/components/report-issue-button.tsx apps/web/app/layout.tsx
git commit -m "feat: add floating report issue button with slide-up modal"
```

---

## Task 6: Supabase setup (manual)

These steps are performed in the Supabase dashboard or via SQL migration.

- [ ] **Step 1: Create the `issues` table**

Run this SQL in the Supabase SQL editor:

```sql
CREATE TABLE issues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  category text NOT NULL CHECK (category IN ('bug', 'feature_request', 'content_issue', 'payment_problem', 'other')),
  description text NOT NULL CHECK (char_length(description) BETWEEN 10 AND 2000),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  email text NOT NULL,
  screenshot_url text,
  page_url text NOT NULL DEFAULT '',
  user_agent text NOT NULL DEFAULT '',
  viewport jsonb,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS: everyone can insert, only service role can read/update
ALTER TABLE issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert issues"
  ON issues FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Service role can read issues"
  ON issues FOR SELECT
  TO service_role
  USING (true);

CREATE POLICY "Service role can update issues"
  ON issues FOR UPDATE
  TO service_role
  USING (true);
```

- [ ] **Step 2: Create the Storage bucket**

In Supabase dashboard → Storage:
1. Create bucket `issue-screenshots`
2. Set as **public** bucket (for email link access)
3. Max file size: 5MB
4. Allowed MIME types: `image/*`

Or via SQL:

```sql
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('issue-screenshots', 'issue-screenshots', true, 5242880, ARRAY['image/*']);
```

- [ ] **Step 3: Verify setup**

Run a test insert via Supabase SQL editor:

```sql
INSERT INTO issues (category, description, severity, email, page_url, user_agent)
VALUES ('bug', 'Test issue from setup verification', 'low', 'test@example.com', 'https://test.com', 'manual');

SELECT * FROM issues;

-- Clean up
DELETE FROM issues WHERE email = 'test@example.com';
```

---

## Task 7: End-to-end verification

- [ ] **Step 1: Run all API tests**

```bash
cd apps/api && pnpm vitest run
```

Expected: All tests pass, including the new issues tests.

- [ ] **Step 2: Test the full flow locally**

1. Start API: `cd apps/api && pnpm dev`
2. Start web: `cd apps/web && pnpm dev`
3. Open `http://localhost:3000`
4. Click the "Report Issue" pill button
5. Fill in category, description, severity
6. Submit without being logged in → should require email
7. Submit with valid data → should see success message
8. Check Supabase `issues` table for the new row
9. Check email (if `RESEND_API_KEY` is configured)

- [ ] **Step 3: Test authenticated flow**

1. Log in to the app
2. Click "Report Issue"
3. Verify email field is hidden
4. Submit → should succeed with user_id populated in DB

- [ ] **Step 4: Final commit (if any fixes needed)**

```bash
git add apps/api/ apps/web/ && git commit -m "fix: address issues from e2e verification"
```
