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

> **Note:** Originally designed for "coming soon" world interest capture. Now used for general newsletter signups. All worlds are available.

**Request Body:**
```json
{
  "email": "user@example.com",
  "worldId": "neon-protocol",
  "source": "newsletter"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `email` | string | Yes | Valid email address |
| `worldId` | string | No | World slug the user is interested in |
| `source` | string | No | Where the signup originated |

**Responses:**
- `201` - `{ "message": "Added to waitlist" }`
- `200` - `{ "message": "Already on the waitlist" }` (duplicate email)
- `400` - `{ "error": "Valid email is required" }`

---

## Progress

### `GET /api/progress?worldId=<world>`

Get user's lesson progress for a world. **Authenticated.**

**Query Parameters:**
| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `worldId` | string | Yes | World slug (e.g., `deep-orbit`) |

**Response:**
```json
[
  {
    "id": "uuid",
    "world_id": "deep-orbit",
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

Create or update lesson progress. **Authenticated.** Upserts on `(user_id, world_id, module_id, lesson_id)`.

**Request Body:**
```json
{
  "worldId": "deep-orbit",
  "moduleId": "foundations",
  "lessonId": "what-is-a-tensor",
  "status": "completed",
  "score": 100,
  "hintsUsed": 0
}
```

### `GET /api/progress/summary`

Get aggregated progress across all worlds. **Authenticated.** Uses the `world_progress_summary` database view.

**Response:**
```json
[
  {
    "user_id": "uuid",
    "world_id": "deep-orbit",
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
  "worldIds": ["deep-orbit"]
}
```

**Plan IDs:** Prices come from `packages/shared/src/constants.ts`.
Only launched worlds can be selected, and each world must appear once.
Currently only `single` with `["deep-orbit"]` is purchasable.

| `planId` | Distinct worlds | Price |
|----------|-----------------|-------|
| `single` | 1 | $79 introductory, $99 regular |
| `twoBundle` | 2 (unavailable at launch) | $90 |
| `threeBundle` | 3 (unavailable at launch) | $135 |
| `allFive` | 5 (unavailable at launch) | $225 |

The introductory price is the current charge. The regular price describes the later offer and does not schedule an automatic increase. Bundle amounts remain unavailable at launch and require a separate pricing decision before sale.

Checkout returns **503** without creating a session if the purchase-history or
billing-profile lookup fails. This prevents charging an existing owner again
or losing their upgrade credit during a database outage.

**Upgrade credit behavior:** If the user already owns worlds that overlap with the requested bundle, the amount paid for those worlds is credited toward the new plan price. The adjusted price is charged via Stripe. If the total credit covers the full plan price, no Stripe session is created - worlds are granted immediately.

**Abandoned-cart recovery:** the session carries `customer_email` (read from `profiles`) and `after_expiration.recovery`, so Stripe can mail a buyer who drops out. `customer_email` is omitted rather than sent empty when the profile has no address, since Stripe rejects a blank string.

**Acquisition source:** when `ACQUISITION_SOURCES` in `apps/api/src/lib/acquisition-source.ts` has entries, the session carries one optional `custom_fields` dropdown (`key: "source"`, label "How did you find Tensorcraft?"). Stripe stores the buyer's answer on the Checkout Session. `acquisitionSourceFields()` leaves the field out while the list is empty or breaks one of Stripe's rules: unique values of 1 to 100 letters or digits, unique labels of 1 to 100 characters, and at most 200 options. Stripe test mode enforced all of them on 2026-11-02, including the unique-label rule that its documentation leaves out. When the API drops the field, checkout opens without the question and the API logs a warning that lists the problems. The API does not copy the answer into the database.

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
  "worlds": ["deep-orbit", "neon-protocol"]
}
```

**Stripe session metadata (when checkout session is created):**

| Field | Description |
|-------|-------------|
| `planId` | The plan ID (e.g. `twoBundle`) |
| `worldIds` | Comma-separated world slugs |
| `creditApplied` | Credit amount applied (in dollars) |
| `originalPrice` | Original plan price before credit (in dollars) |

### `POST /api/payments/guest-checkout`

Disabled. Every request returns **403** without creating a Stripe session:

```json
{
  "error": "Sign in before purchasing a world.",
  "code": "guest_checkout_disabled"
}
```

Sign in and use `/api/payments/checkout`. Signed webhooks for previously
created guest sessions are still processed so disabling new checkout sessions
does not strand buyers who already paid.

### `GET /api/payments/purchases`

Get the authenticated user's purchase history. **Authenticated.**

**Response:**
```json
[
  {
    "id": "uuid",
    "plan_id": "allFive",
    "world_ids": ["deep-orbit", "neon-protocol", "signal-ward", "nova-canvas", "terra-grid"],
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
- `checkout.session.completed` - Creates purchase record, grants world access
- `charge.refunded` - Updates purchase status, revokes access

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
  "preferredWorldId": "deep-orbit"
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

- `200` - `{ "message": "Token saved" }`
- `401` - Unauthorized

---

### `POST /api/skill-events/batch`

Batch-submit skill tracking events. **Authenticated.**

**Request Body:**
```json
{
  "events": [
    {
      "skillId": "tensor-operations",
      "worldId": "deep-orbit",
      "eventType": "practiced",
      "metadata": {}
    }
  ]
}
```

**Responses:**

- `200` - `{ "processed": 3 }`
- `400` - Bad request (invalid event shape)

---

### `POST /api/issues`

Submit an issue report. No authentication required.

**Request Body:**
```json
{
  "type": "bug",
  "description": "The code editor fails to run on Firefox.",
  "url": "https://tensorcraft.app/worlds/deep-orbit/foundations/what-is-a-tensor",
  "email": "user@example.com"
}
```

**Responses:**

- `201` - `{ "message": "Issue submitted" }`
- `400` - Bad request (missing required fields)

---

## Exercise Attempts (User)

### `GET /api/exercise-attempts?worldId=<world>`

Get user's exercise attempt history. **Authenticated.**

### `POST /api/exercise-attempts`

Submit an exercise attempt. **Authenticated.**

**Request Body:**
```json
{
  "exerciseSlug": "tensor-operations",
  "lessonId": "tensor-ops",
  "worldId": "deep-orbit",
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
      "world_id": "neon-protocol",
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

1. **Security Headers** - CSP, X-Frame-Options, etc.
2. **CORS** - Allows `localhost:3000` (dev) and `tensorcraft.app` (prod)
3. **Rate Limiting** - 60 req/min per subject (code truth; docs previously claimed 120 - reconciled 2026-07-25). Uses `@upstash/ratelimit` fixed window (2 Redis commands/request; a subject straddling a window boundary can briefly reach 2x the limit); blocked subjects are rejected from an in-process cache without touching Redis. Degrades open (limiter disabled) when Redis is unavailable. Exempt: Stripe/Kit webhooks and `/api/health` (liveness probes hit it every 10-15s per machine; routing them through the limiter burned the Upstash free-tier command quota, found 2026-08-17). `/api/health/ready` stays limited.

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

- `400` - Bad request (missing/invalid fields)
- `401` - Unauthorized (missing or invalid auth token)
- `429` - Rate limited (includes `Retry-After` header)
- `500` - Internal server error (includes `requestId`)

---

## Review (spaced recall)

Both endpoints require authentication and write only the caller's own rows.
Scheduling intervals come from `nextInterval` in `@tensorcraft/shared`, the
single implementation shared with the signed-out `localStorage` path.

Reads are NOT here: a signed-in learner's due queue is read server-side during
the lesson page render (`apps/web/lib/review-store-server.ts`), where
entitlement is already computed. See
`docs/superpowers/specs/2026-09-15-spaced-review-design.md`.

### `POST /api/review/enqueue`

Adds review items for a lesson's recall prompts, first due one day out.

```json
{ "worldId": "deep-orbit", "moduleId": "foundations", "lessonId": "normalization", "promptIndices": [0, 1] }
```

Takes the indices themselves rather than a count: prompt indices are not
guaranteed contiguous, because `parseRecallPrompts` advances its counter for a
tag it drops. Idempotent, and it never resets an existing `next_review_at`, so
re-completing a lesson cannot cancel a schedule.

- `201` - `{ "ok": true }`
- `400` - invalid `worldId`, empty or malformed `promptIndices`

### `POST /api/review`

Records one outcome and reschedules that prompt.

```json
{ "worldId": "deep-orbit", "lessonId": "normalization", "promptIndex": 0, "outcome": "got-it" }
```

`outcome` is `"got-it"`, `"review"` (attempted, missed) or `"bailed"` (no
attempt). Takes no `moduleId`: the key is the four primary-key columns.

The client sends `expectedLastReviewedAt` (the timestamp on the displayed
item, or `null` for a fresh item). A retry after a successful write returns
`alreadyRecorded: true` without incrementing the counters again. Concurrent
writes compare the previous pull count so only one update lands.

- `200` - `{ "review": { "nextReviewAt": "<ISO 8601>", "pulls": 1, "successes": 1 } }`, or `{ "ok": true, "alreadyRecorded": true }` for a stale retry
- `400` - invalid `worldId` or `outcome`
- `404` - no such row for this user. Enqueue is the only way into the queue,
  so a missing row means the key did not come from it. Distinguishable from a
  `5xx` on purpose, so a retrying client drops a permanently failing write
  instead of retrying it forever.

---

## Rate Limiting

All endpoints (except `/api/payments/webhook`) are rate limited to **60 requests per minute per IP**.

- **Primary store:** Upstash Redis for distributed limiting across multiple API instances (unset env = limiter silently disabled, see above - not a boot failure).
- **Fallback store:** In-memory Map when Redis is not configured. Suitable for single-instance deployments and local development.
- Rate-limited responses return `429 Too Many Requests` with a `Retry-After` header.

---

## Webhook Behavior

The Stripe webhook endpoint (`POST /api/payments/webhook`) uses Stripe's built-in signature verification via `STRIPE_WEBHOOK_SECRET`. It is exempt from rate limiting.

**Note:** Stripe automatically retries failed webhook deliveries (non-2xx responses) for up to 3 days with exponential backoff. Ensure the webhook handler is idempotent -- duplicate `checkout.session.completed` events for the same `stripe_session_id` are handled gracefully via the unique constraint on the `purchases` table.
