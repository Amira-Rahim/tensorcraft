import { Hono } from "hono";
import { getSupabaseServerClient } from "@tensorcraft/supabase";
import { THEME_SLUGS, isValidThemeSlug } from "@tensorcraft/shared";
import { authMiddleware } from "../middleware/auth";
import type { AppEnv } from "../types";

/**
 * Purchase verification endpoints.
 *
 * These endpoints are the canonical way for server components, mobile
 * clients, and external API consumers to ask "what has this user
 * purchased?". RLS ensures a user can only see their own rows —
 * we additionally filter by status = 'completed' so refunded /
 * disputed / pending purchases never grant access.
 */
const purchases = new Hono<AppEnv>();

purchases.use("*", authMiddleware);

/**
 * GET /api/purchases/access
 *
 * Returns the set of theme IDs the authenticated user has purchased
 * (and whose purchase is still active), plus whether they hold the
 * full five-theme bundle. This is the endpoint the web app calls to
 * gate paywalled content.
 *
 * Response shape (intentionally minimal):
 *   { themeIds: string[]; hasFullBundle: boolean }
 *
 * Theme IDs are deduplicated and filtered against the canonical
 * `THEME_SLUGS` list — a stray value in the database (should be
 * impossible once the CHECK constraint lands) will never leak to the
 * client.
 */
purchases.get("/access", async (c) => {
  const userId = c.get("userId");
  const token = c.get("accessToken");

  const supabase = getSupabaseServerClient(token);

  const { data, error } = await supabase
    .from("purchases")
    .select("theme_ids")
    .eq("user_id", userId)
    .eq("status", "completed");

  if (error) {
    return c.json(
      {
        error: "Failed to fetch purchases",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  const rows = (data ?? []) as { theme_ids: string[] | null }[];
  const owned = new Set<string>();
  for (const row of rows) {
    if (!Array.isArray(row.theme_ids)) continue;
    for (const slug of row.theme_ids) {
      // Defensive: filter unknown slugs so a DB-level anomaly can't
      // grant access to an unknown theme. See dev-plan §6h.
      if (isValidThemeSlug(slug)) {
        owned.add(slug);
      }
    }
  }

  const themeIds = Array.from(owned).sort();
  const hasFullBundle = THEME_SLUGS.every((slug) => owned.has(slug));

  return c.json({ themeIds, hasFullBundle });
});

export { purchases };
