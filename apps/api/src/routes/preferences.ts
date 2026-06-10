import { Hono } from "hono";
import { getSupabaseAdminClient } from "@tensorcraft/supabase";
import { authMiddleware } from "../middleware/auth";
import { logger } from "../lib/logger";
import {
  addSubscriber,
  removeTagFromSubscriber,
  tagSubscriber,
} from "../lib/kit";
import type { AppEnv } from "../types";

/**
 * Email preference management.
 *
 * PATCH /api/preferences, authenticated. Persists `email_alerts` and
 * `weekly_digest` to `profiles`, then reconciles Kit tag membership so
 * the dashboard sequences stop/resume without a full unsubscribe.
 *
 * Kit dashboard owns the actual email templates + sending; this endpoint
 * is purely the source-of-truth → provider sync. Tag env vars:
 *   KIT_TAG_EMAIL_ALERTS   → toggles "lesson complete" notifications
 *   KIT_TAG_WEEKLY_DIGEST  → toggles Sunday progress digest
 *
 * If either env var is unset we persist the DB write but skip the Kit
 * call, identical to the lifecycle-event endpoint's behaviour so Fly.io
 * secret rotations / staging envs degrade gracefully.
 */
const preferences = new Hono<AppEnv>();

preferences.use("*", authMiddleware);

interface PreferenceUpdate {
  email_alerts?: boolean;
  weekly_digest?: boolean;
}

preferences.patch("/", async (c) => {
  const userId = c.get("userId");

  let body: Record<string, unknown>;
  try {
    body = (await c.req.json()) as Record<string, unknown>;
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const updates: PreferenceUpdate = {};

  if ("email_alerts" in body) {
    if (typeof body.email_alerts !== "boolean") {
      return c.json({ error: "email_alerts must be a boolean" }, 400);
    }
    updates.email_alerts = body.email_alerts;
  }

  if ("weekly_digest" in body) {
    if (typeof body.weekly_digest !== "boolean") {
      return c.json({ error: "weekly_digest must be a boolean" }, 400);
    }
    updates.weekly_digest = body.weekly_digest;
  }

  if (Object.keys(updates).length === 0) {
    return c.json(
      { error: "Provide at least one of: email_alerts, weekly_digest" },
      400,
    );
  }

  const admin = getSupabaseAdminClient();
  const { data, error } = await admin
    .from("profiles")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select("email, email_alerts, weekly_digest")
    .single();

  if (error || !data) {
    logger.error(
      { err: error, route: "preferences.patch" },
      "Preferences PATCH failed",
    );
    return c.json(
      {
        error: "Failed to update preferences",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  // Fire-and-forget Kit reconciliation. We intentionally do NOT await
  // these, the DB write is authoritative and we never want a Kit
  // outage to fail the settings save.
  const email = data.email as string | null;
  if (email) {
    if (updates.email_alerts !== undefined) {
      const tagId = process.env.KIT_TAG_EMAIL_ALERTS;
      if (tagId) {
        if (updates.email_alerts) {
          addSubscriber(email).catch(() => {});
          tagSubscriber(email, tagId).catch(() => {});
        } else {
          removeTagFromSubscriber(email, tagId).catch(() => {});
        }
      }
    }
    if (updates.weekly_digest !== undefined) {
      const tagId = process.env.KIT_TAG_WEEKLY_DIGEST;
      if (tagId) {
        if (updates.weekly_digest) {
          addSubscriber(email).catch(() => {});
          tagSubscriber(email, tagId).catch(() => {});
        } else {
          removeTagFromSubscriber(email, tagId).catch(() => {});
        }
      }
    }
  }

  return c.json({
    email_alerts: data.email_alerts,
    weekly_digest: data.weekly_digest,
  });
});

export { preferences };
