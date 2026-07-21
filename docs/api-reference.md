# Tensorcraft API Reference

**Base URL:** `http://localhost:3001` (dev) / `https://api.tensorcraft.app` (prod)

**Authentication:** Most endpoints require a Supabase JWT in the `Authorization: Bearer <token>` header. Admin endpoints require an `x-admin-key` header.

---

## Health

### `GET /api/health`

Health check endpoint. No authentication required.

**Response:**
```json
{
  "status": "ok",
  "service": "tensorcraft-api",
  "timestamp": "2026-03-13T12:00:00.000Z"
}
```

---

## Waitlist

### `POST /api/waitlist`

Add an email to the waitlist. No authentication required.

> **Note:** Originally designed for "coming soon" theme interest capture. Now used for general newsletter signups. All themes are available.

**Request Body:**
```json
{
  "email": "user@example.com",
  "themeId": "neon-protocol",
  "source": "newsletter"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email address |
| `themeId` | string | No | Theme slug the user is interested in |
| `source` | string | No | Where the signup originated |

**Responses:**
- `201` — `{ "message": "Added to waitlist" }`
- `200` — `{ "message": "Already on the waitlist" }` (duplicate email)
- `400` — `{ "error": "Valid email is required" }`

---

## Progress

### `GET /api/progress?themeId=<theme>`

Get user's lesson progress for a theme. **Authenticated.**

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `themeId` | string | Yes | Theme slug (e.g., `deep-orbit`) |

**Response:**
```json
[
  {
    "id": "uuid",
    "theme_id": "deep-orbit",
    "module_id": "foundations",
    "lesson_id": "what-is-a-tensor",
    "status": "completed",
    "score": 100,
    "hints_used": 0,
    "started_at": "2026-03-13T10:00:00Z",
    "completed_at": "2026-03-13T10:30:00Z"
  }
]
```

### `POST /api/progress`

Create or update lesson progress. **Authenticated.** Upserts on `(user_id, theme_id, module_id, lesson_id)`.

**Request Body:**
```json
{
  "themeId": "deep-orbit",
  "moduleId": "foundations",
  "lessonId": "what-is-a-tensor",
  "status": "completed",
  "score": 100,
  "hintsUsed": 0
}
```

### `GET /api/progress/summary`

Get aggregated progress across all themes. **Authenticated.** Uses the `theme_progress_summary` database view.

**Response:**
```json
[
  {
    "user_id": "uuid",
    "theme_id": "deep-orbit",
    "total_lessons": 15,
    "completed_lessons": 8,
    "in_progress_lessons": 2,
    "first_started_at": "2026-03-01T10:00:00Z",
    "last_completed_at": "2026-03-13T10:30:00Z",
    "completion_percent": 53.3
  }
]
```

---

## Payments

### `POST /api/payments/checkout`

Create a Stripe Checkout session. **Authenticated.**

**Request Body:**
```json
{
  "planId": "single",
  "themeIds": ["deep-orbit"]
}
```

**Supported plan IDs:**

| `planId` | `themeIds` | Price |
|----------|-----------|-------|
| `single` | Any one theme | $59 |
| `two` | Any two themes | $99 |
| `three` | Any three themes | $129 |
| `allFive` | `["deep-orbit", "neon-protocol", "signal-ward", "nova-canvas", "terra-grid"]` | $159 |

**Example — All 5 Themes:**
```json
{
  "planId": "allFive",
  "themeIds": ["deep-orbit", "neon-protocol", "signal-ward", "nova-canvas", "terra-grid"]
}
```

**Upgrade credit behavior:** If the user already owns themes that overlap with the requested bundle, the amount paid for those themes is credited toward the new plan price. The adjusted price is charged via Stripe. If the total credit covers the full plan price, no Stripe session is created — themes are granted immediately.

**Abandoned-cart recovery:** the session carries `customer_email` (read from `profiles`) and `after_expiration.recovery`, so Stripe can mail a buyer who drops out. `customer_email` is omitted rather than sent empty when the profile has no address, since Stripe rejects a blank string.

### `POST /api/payments/guest-checkout`

Create a Stripe Checkout session **without an account**. **Unauthenticated.**

Same request body and plan IDs as `/checkout`. Exists because the authenticated flow forced a cold buyer to sign up before paying, and with magic-link auth that meant leaving the browser for an inbox mid-purchase.

Differences from `/checkout`:

- **No `client_reference_id`** — there is no user yet. The session is marked `metadata.guest = "true"` and Stripe collects the email.
- **No upgrade credit and no auto-grant** — a guest has no prior purchases by definition, so the credit machinery is absent rather than returning zero.
- **Tighter rate limit** — 10 req/min per IP on its own Redis key prefix, on top of the global 60/min limiter, because the route is unauthenticated.

**Identity resolution (webhook):** on `checkout.session.completed` with no `client_reference_id` and `metadata.guest === "true"`, the webhook reads `customer_details.email` and resolves it via `profiles.email` — attaching the purchase to an existing account, or provisioning a new Supabase user with `email_confirm: true` (payment already proves control of the address). It then emails a magic link. If resolution fails the webhook returns **500 so Stripe retries**: the money has already moved, and a silent 200 would mean a paid purchase that grants nothing.

**Response (normal checkout):**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_..."
}
```

**Response (auto-grant when credit covers full price):**
```json
{
  "granted": true,
  "themes": ["deep-orbit", "neon-protocol"]
}
```

**Stripe session metadata (when checkout session is created):**

| Field | Description |
|-------|-------------|
| `planId` | The plan ID (e.g. `twoBundle`) |
| `themeIds` | Comma-separated theme slugs |
| `creditApplied` | Credit amount applied (in dollars) |
| `originalPrice` | Original plan price before credit (in dollars) |

### `GET /api/payments/purchases`

Get the authenticated user's purchase history. **Authenticated.**

**Response:**
```json
[
  {
    "id": "uuid",
    "plan_id": "allFive",
    "theme_ids": ["deep-orbit", "neon-protocol", "signal-ward", "nova-canvas", "terra-grid"],
    "amount": 12900,
    "currency": "usd",
    "stripe_session_id": "cs_...",
    "status": "completed",
    "created_at": "2026-03-13T12:00:00Z"
  }
]
```

### `POST /api/payments/webhook`

Stripe webhook handler. **Not authenticated** (uses Stripe signature verification). Exempt from rate limiting.

**Events handled:**
- `checkout.session.completed` — Creates purchase record, grants theme access
- `charge.refunded` — Updates purchase status, revokes access

---

## Email

### `POST /api/email`

Tag a user for Kit email automation.

**Auth:** Required (Bearer token)

**Body:**
```json
{ "event": "signed_up" | "onboarded" | "first_lesson" | "capstone" }
```

**Response:**

```json
{ "ok": true, "event": "signed_up" }
```

or `{ "ok": true, "skipped": true }` when the corresponding tag env var is not configured.

---

## Profiles

### `GET /api/profiles/me`

Get current user's profile. **Authenticated.**

### `PUT /api/profiles/me`

Update current user's profile. **Authenticated.**

**Request Body (all fields optional):**
```json
{
  "displayName": "Jane Doe",
  "avatarUrl": "https://...",
  "preferredThemeId": "deep-orbit"
}
```

---

## Exercise Attempts

### `POST /api/github/token`

Persist a GitHub OAuth provider token for the authenticated user. **Authenticated.**

**Request Body:**
```json
{
  "token": "gho_..."
}
```

**Responses:**

- `200` — `{ "message": "Token saved" }`
- `401` — Unauthorized

---

### `POST /api/skill-events/batch`

Batch-submit skill tracking events. **Authenticated.**

**Request Body:**
```json
{
  "events": [
    {
      "skillId": "tensor-operations",
      "themeId": "deep-orbit",
      "eventType": "practiced",
      "metadata": {}
    }
  ]
}
```

**Responses:**

- `200` — `{ "processed": 3 }`
- `400` — Bad request (invalid event shape)

---

### `POST /api/issues`

Submit an issue report. No authentication required.

**Request Body:**
```json
{
  "type": "bug",
  "description": "The code editor fails to run on Firefox.",
  "url": "https://tensorcraft.app/themes/deep-orbit/foundations/what-is-a-tensor",
  "email": "user@example.com"
}
```

**Responses:**

- `201` — `{ "message": "Issue submitted" }`
- `400` — Bad request (missing required fields)

---

## Exercise Attempts (User)

### `GET /api/exercise-attempts?themeId=<theme>`

Get user's exercise attempt history. **Authenticated.**

### `POST /api/exercise-attempts`

Submit an exercise attempt. **Authenticated.**

**Request Body:**
```json
{
  "exerciseSlug": "tensor-operations",
  "lessonId": "tensor-ops",
  "themeId": "deep-orbit",
  "score": 85,
  "hintsUsed": 1,
  "durationMs": 45000,
  "submittedCode": "const tensor = tf.tensor([1, 2, 3]);"
}
```

---

## Admin

All admin endpoints require the `x-admin-key` header matching the `ADMIN_API_KEY` environment variable.

### `GET /api/admin/stats`

Dashboard statistics.

**Response:**
```json
{
  "waitlistCount": 2400,
  "userCount": 150,
  "purchaseCount": 42,
  "revenue": 3318
}
```

### `GET /api/admin/waitlist`

Paginated waitlist entries.

**Query Parameters:**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page (max 100) |

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "theme_id": "neon-protocol",
      "source": "newsletter",
      "created_at": "2026-03-13T12:00:00Z"
    }
  ],
  "total": 2400,
  "page": 1,
  "limit": 50
}
```

---

## Middleware

All requests (except `/api/payments/webhook`) pass through:

1. **Security Headers** — CSP, X-Frame-Options, etc.
2. **CORS** — Allows `localhost:3000` (dev) and `tensorcraft.app` (prod)
3. **Rate Limiting** — 120 req/min per IP (increased from 60 to support multi-tab usage). Uses Upstash Redis (mandatory). Stripe webhook exempt.

---

## Error Format

All error responses follow this shape:
```json
{
  "error": "Human-readable error message"
}
```

For `500` errors, a `requestId` is included to aid debugging (matches the `X-Request-ID` response header):
```json
{
  "error": "Failed to update progress",
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```

Common status codes:

- `400` — Bad request (missing/invalid fields)
- `401` — Unauthorized (missing or invalid auth token)
- `429` — Rate limited (includes `Retry-After` header)
- `500` — Internal server error (includes `requestId`)

---

## Rate Limiting

All endpoints (except `/api/payments/webhook`) are rate limited to **120 requests per minute per IP**.

- **Primary store:** Upstash Redis (mandatory) for distributed limiting across multiple API instances.
- **Fallback store:** In-memory Map when Redis is not configured. Suitable for single-instance deployments and local development.
- Rate-limited responses return `429 Too Many Requests` with a `Retry-After` header.

---

## Webhook Behavior

The Stripe webhook endpoint (`POST /api/payments/webhook`) uses Stripe's built-in signature verification via `STRIPE_WEBHOOK_SECRET`. It is exempt from rate limiting.

**Note:** Stripe automatically retries failed webhook deliveries (non-2xx responses) for up to 3 days with exponential backoff. Ensure the webhook handler is idempotent -- duplicate `checkout.session.completed` events for the same `stripe_session_id` are handled gracefully via the unique constraint on the `purchases` table.
