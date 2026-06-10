import { Hono } from "hono";
import { getSupabaseServerClient } from "@tensorcraft/supabase";
import { isValidThemeSlug, isLaunched } from "@tensorcraft/shared";
import { authMiddleware } from "../middleware/auth";
import { logger } from "../lib/logger";
import type { AppEnv } from "../types";

const profiles = new Hono<AppEnv>();

// All profile routes require auth
profiles.use("*", authMiddleware);

/** Allowed fields for profile updates */
const ALLOWED_FIELDS = [
  "display_name",
  "avatar_url",
  "preferred_theme_id",
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

    case "preferred_theme_id":
      if (typeof value !== "string" || !isValidThemeSlug(value)) {
        return "preferred_theme_id must be a valid theme slug";
      }
      if (!isLaunched(value)) {
        return "preferred_theme_id must be a launched theme";
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

  // Filter to only allowed fields
  const updates: Record<string, unknown> = {};
  for (const field of ALLOWED_FIELDS) {
    if (field in body) {
      const error = validateField(field, body[field]);
      if (error) {
        return c.json({ error }, 400);
      }
      updates[field] = body[field];
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

  const { data, error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", targetUserId)
    .select()
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

export { profiles };
