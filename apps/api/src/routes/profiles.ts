import { Hono } from "hono";
import {
  getSupabaseServerClient,
  getSupabaseAdminClient,
  type TablesUpdate,
} from "@tensorcraft/supabase";
import { isValidWorldSlug, isLaunched } from "@tensorcraft/shared";
import { authMiddleware } from "../middleware/auth";
import { createRateLimiter } from "../middleware/rate-limit";
import { unsubscribeFromAll } from "../lib/kit";
import { logger } from "../lib/logger";
import type { AppEnv } from "../types";

const profiles = new Hono<AppEnv>();

// All profile routes require auth
profiles.use("*", authMiddleware);

/** Allowed fields for profile updates */
const ALLOWED_FIELDS = [
  "display_name",
  "avatar_url",
  "preferred_world_id",
  "github_username",
  "email_alerts",
  "weekly_digest",
] as const;

type AllowedField = (typeof ALLOWED_FIELDS)[number];

/** Basic validation for each field */
function validateField(field: AllowedField, value: unknown): string | null {
  if (value === null) return null; // allow nulling out fields

  switch (field) {
    case "display_name":
      if (
        typeof value !== "string" ||
        value.length === 0 ||
        value.length > 100
      ) {
        return "display_name must be a string between 1 and 100 characters";
      }
      return null;

    case "avatar_url":
      if (typeof value !== "string" || value.length > 2048) {
        return "avatar_url must be a string of at most 2048 characters";
      }
      // URL validation, reject dangerous protocols
      try {
        const parsed = new URL(value);
        if (!["https:", "http:"].includes(parsed.protocol)) {
          return "avatar_url must use https or http protocol";
        }
      } catch {
        return "avatar_url must be a valid URL";
      }
      return null;

    case "preferred_world_id":
      if (typeof value !== "string" || !isValidWorldSlug(value)) {
        return "preferred_world_id must be a valid world slug";
      }
      if (!isLaunched(value)) {
        return "preferred_world_id must be a launched world";
      }
      return null;

    case "github_username":
      if (
        typeof value !== "string" ||
        !/^[a-zA-Z0-9]([a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/.test(value)
      ) {
        return "github_username must be a valid GitHub username (alphanumeric and hyphens, max 39 chars)";
      }
      return null;

    case "email_alerts":
    case "weekly_digest":
      if (typeof value !== "boolean") {
        return `${field} must be a boolean`;
      }
      return null;

    default:
      return `Unknown field: ${field}`;
  }
}

// ──────────────────────────────────────────────
// PATCH /api/profiles/:userId, Update user profile
// ──────────────────────────────────────────────

profiles.patch("/:userId", async (c) => {
  const authenticatedUserId = c.get("userId");
  const targetUserId = c.req.param("userId");

  // Users can only update their own profile
  if (authenticatedUserId !== targetUserId) {
    return c.json(
      { error: "Forbidden: cannot update another user's profile" },
      403,
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  // Filter to only allowed fields. Typing the accumulator as the profiles
  // Update row makes the compiler reject any ALLOWED_FIELDS entry that is not
  // a real column; the value cast is safe because validateField has already
  // checked the runtime shape (a union-keyed index write otherwise demands
  // the intersection of all column types).
  const updates: TablesUpdate<"profiles"> = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in body) {
      const error = validateField(field, body[field]);
      if (error) {
        return c.json({ error }, 400);
      }
      updates[field] = body[field] as never;
    }
  }

  if (Object.keys(updates).length === 0) {
    return c.json(
      {
        error:
          "No valid fields to update. Allowed: " + ALLOWED_FIELDS.join(", "),
      },
      400,
    );
  }

  const token = c.get("accessToken");
  const supabase = getSupabaseServerClient(token);

  // Explicit column list, never a bare .select(). A bare select is
  // `select("*")`, which includes profiles.github_token - the plaintext
  // GitHub OAuth token. This endpoint returns its result straight to the
  // caller, so `PATCH /api/profiles/{self}` with a harmless
  // {"display_name":"x"} was answering with the caller's GitHub token in the
  // response body: into devtools, HAR exports, and any frontend error
  // reporter that captures response payloads.
  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", targetUserId)
    .select(
      "id, email, display_name, avatar_url, github_username, github_connected, onboarding_completed, experience_level, learning_goal, created_at, updated_at",
    )
    .single();

  if (error) {
    logger.error(
      { err: error, route: "profiles.update" },
      "Profile update failed",
    );
    return c.json(
      {
        error: "Failed to update profile",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  return c.json({ profile: data });
});

// ──────────────────────────────────────────────
// GET /api/profiles/export - GDPR Art. 15/20 data export
// ──────────────────────────────────────────────
// The privacy page has promised "Access and export your personal data"
// since April; the endpoint never existed (Tier 1-LEGAL). Reads run with
// the USER-scoped client so RLS is the authority on every row returned -
// the admin client appears only for waitlist rows, which are keyed by
// email and carry no user-readable policy.

const USER_DATA_TABLES = [
  "world_progress",
  "purchases",
  "certificates",
  "exercise_attempts",
  "streaks",
  "achievements",
  "skill_genome",
  "skill_events",
  // Inbox feature removed 2026-08-14 but the table survives in production
  // with pre-removal rows; erasure and export must still cover it.
  "dispatch_messages",
  "boss_beat_choices",
  "journey_enrollment",
  // Feature deleted 2026-07-24 but production may hold pre-deletion rows;
  // an export that omits data we still store is incomplete by definition.
  "counterfactual_choices",
  // Holds submitted_code - the learner's own writing. Self-read RLS
  // policy exists (048), so the user-scoped client can fetch it.
  "arena_submissions",
  // Recall schedules and ratings are learner data (migration 061).
  "review_queue",
] as const;

// Bug reports are service-role-only (020: no user SELECT policy) and
// deliberately un-FK'd from auth.users, so the RLS-driven loop above
// cannot see them. Guests can file reports with only an email, so rows
// are matched on user_id AND email, deduped by id.
const ISSUE_EXPORT_COLUMNS =
  "id, category, description, severity, email, page_url, user_agent, viewport, screenshot_url, created_at";

async function fetchIssueRows(
  userId: string,
  email: string | null,
  columns: string,
) {
  const admin = getSupabaseAdminClient();
  const byUser = await admin
    .from("issues")
    .select(columns)
    .eq("user_id", userId)
    .limit(1000);
  if (byUser.error) throw byUser.error;
  let byEmail: unknown[] = [];
  if (email) {
    const res = await admin
      .from("issues")
      .select(columns)
      .eq("email", email)
      .limit(1000);
    if (res.error) throw res.error;
    byEmail = res.data ?? [];
  }
  const seen = new Set<string>();
  return [...(byUser.data ?? []), ...byEmail].filter((row) => {
    const id = String((row as { id: unknown }).id);
    if (seen.has(id)) return false;
    seen.add(id);
    return true;
  }) as Array<Record<string, unknown>>;
}

/** Object path inside the issue-screenshots bucket, from its public URL. */
function screenshotStoragePath(url: unknown): string | null {
  if (typeof url !== "string" || url.length === 0) return null;
  const marker = "/issue-screenshots/";
  const i = url.indexOf(marker);
  return i === -1 ? null : decodeURIComponent(url.slice(i + marker.length));
}

profiles.get(
  "/export",
  createRateLimiter({ max: 3, keyPrefix: "rl:profile-export" }),
  async (c) => {
    const userId = c.get("userId");
    const token = c.get("accessToken");
    const supabase = getSupabaseServerClient(token);

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select(
        "id, email, display_name, avatar_url, github_username, github_connected, onboarding_completed, experience_level, learning_goal, js_background, js_experience_years, email_alerts, weekly_digest, stripe_customer_id, created_at, updated_at",
      )
      .eq("id", userId)
      .single();

    if (profileError || !profile) {
      logger.error(
        { err: profileError, route: "profiles.export", userId },
        "Export: profile read failed",
      );
      return c.json({ error: "Failed to assemble export" }, 500);
    }

    const tables: Record<string, unknown[]> = {};
    for (const table of USER_DATA_TABLES) {
      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("user_id", userId)
        .limit(5000);
      if (error) {
        // Fail loud: a partial export presented as complete is an Art. 15
        // violation in miniature.
        logger.error(
          { err: error, route: "profiles.export", userId, table },
          "Export: table read failed",
        );
        return c.json({ error: "Failed to assemble export" }, 500);
      }
      tables[table] = data ?? [];
    }

    // Waitlist rows are keyed by email, not user_id, and have no user
    // SELECT policy - admin client, scoped hard to the account's email.
    const { data: waitlistRows } = await getSupabaseAdminClient()
      .from("waitlist")
      .select("email, world_id, source, subscribed, created_at")
      .eq("email", profile.email);

    let issueRows: Array<Record<string, unknown>>;
    try {
      issueRows = await fetchIssueRows(
        userId,
        profile.email ?? null,
        ISSUE_EXPORT_COLUMNS,
      );
    } catch (err) {
      // Same fail-loud rule as the table loop: a partial export
      // presented as complete is an Art. 15 violation in miniature.
      logger.error(
        { err, route: "profiles.export", userId, table: "issues" },
        "Export: issues read failed",
      );
      return c.json({ error: "Failed to assemble export" }, 500);
    }

    const exportPayload = {
      exportVersion: 1,
      generatedAt: new Date().toISOString(),
      account: {
        ...profile,
        // The GitHub OAuth token is the user's data but also a LIVE
        // credential; exporting it into a downloadable file is a security
        // harm, not transparency. Its existence is disclosed instead.
        github_token: profile.github_connected
          ? "[stored - revoke via GitHub settings or Disconnect in Settings]"
          : null,
      },
      tables,
      waitlist: waitlistRows ?? [],
      issues: issueRows,
    };

    c.header("Content-Type", "application/json");
    c.header(
      "Content-Disposition",
      `attachment; filename="tensorcraft-export-${new Date().toISOString().slice(0, 10)}.json"`,
    );
    return c.body(JSON.stringify(exportPayload, null, 2));
  },
);

// ──────────────────────────────────────────────
// POST /api/profiles/delete - GDPR Art. 17 self-serve erasure
// ──────────────────────────────────────────────
// The Settings "Delete Account" control was a contact-support stub
// (Tier 1-LEGAL). Flow: best-effort ESP cleanup, waitlist rows removed by
// email, then auth.admin.deleteUser - which cascades profiles and every
// user table. Purchases survive UNLINKED (user_id → NULL, migration 056:
// VAT/OSS retention, Art. 17(3)(b)) - 056 MUST be applied before this
// endpoint ships or the cascade erases required tax records.

profiles.post(
  "/delete",
  createRateLimiter({ max: 3, keyPrefix: "rl:profile-delete" }),
  async (c) => {
    const userId = c.get("userId");

    let body: { confirm?: string };
    try {
      body = await c.req.json();
    } catch {
      return c.json({ error: "Invalid JSON body" }, 400);
    }
    // Deliberate friction: deletion is irreversible; the client sends the
    // literal the user typed.
    if (body.confirm !== "DELETE") {
      return c.json(
        { error: 'Confirmation required: send {"confirm":"DELETE"}' },
        400,
      );
    }

    const admin = getSupabaseAdminClient();

    const { data: profile } = await admin
      .from("profiles")
      .select("email")
      .eq("id", userId)
      .single();

    if (profile?.email) {
      // Best-effort, never blocking: the account deletion must not hinge on
      // a third-party ESP being reachable.
      await unsubscribeFromAll(profile.email);
      const { error: waitlistError } = await admin
        .from("waitlist")
        .delete()
        .eq("email", profile.email);
      if (waitlistError) {
        logger.warn(
          { err: waitlistError, route: "profiles.delete", userId },
          "Delete: waitlist cleanup failed (non-fatal)",
        );
      }
    }

    // Bug reports survive as operational records (020: deliberately
    // un-FK'd so the cascade misses them), but the link to a person must
    // not: clear identity columns and delete the screenshot, which shows
    // the user's screen. Best-effort like the waitlist cleanup; a storage
    // hiccup must not strand someone unable to delete their account.
    try {
      const rows = await fetchIssueRows(
        userId,
        profile?.email ?? null,
        "id, screenshot_url",
      );
      if (rows.length > 0) {
        const paths = rows
          .map((r) => screenshotStoragePath(r.screenshot_url))
          .filter((p): p is string => Boolean(p));
        if (paths.length > 0) {
          await admin.storage.from("issue-screenshots").remove(paths);
        }
        const { error: issuesError } = await admin
          .from("issues")
          .update({ user_id: null, email: null, screenshot_url: null })
          .in(
            "id",
            rows.map((r) => String(r.id)),
          );
        if (issuesError) throw issuesError;
      }
    } catch (err) {
      logger.warn(
        { err, route: "profiles.delete", userId },
        "Delete: issue anonymization failed (non-fatal)",
      );
    }

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      logger.error(
        { err: deleteError, route: "profiles.delete", userId },
        "Delete: auth.admin.deleteUser failed",
      );
      return c.json({ error: "Failed to delete account" }, 500);
    }

    logger.info(
      { route: "profiles.delete", userId },
      "Account deleted (purchases retained unlinked per migration 056)",
    );
    return c.json({ deleted: true });
  },
);

export { profiles };
