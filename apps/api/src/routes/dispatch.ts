import { Hono } from "hono";
import { isValidThemeSlug, isValidSlug, isLaunched } from "@tensorcraft/shared";
import { authMiddleware } from "../middleware/auth";
import { fireMilestonesForCompletion } from "../lib/dispatch";
import { logger } from "../lib/logger";
import type { AppEnv } from "../types";

const dispatch = new Hono<AppEnv>();

dispatch.use("*", authMiddleware);

/**
 * POST /api/dispatch/check, { themeId, moduleId }
 *
 * Milestone check, called fire-and-forget by the web client right after
 * markLessonCompleted's upsert (the frontend writes progress directly to
 * Supabase, so no API route sees completions happen). userId comes from
 * auth and the milestone math re-reads theme_progress server-side, so a
 * forged body can at worst request a re-check of the caller's own real
 * data; dedup in the producer makes that a no-op.
 */
dispatch.post("/check", async (c) => {
  const userId = c.get("userId");

  let body: { themeId?: string; moduleId?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { themeId, moduleId } = body;
  if (!themeId || !isValidThemeSlug(themeId) || !isLaunched(themeId)) {
    return c.json({ error: "Invalid themeId" }, 400);
  }
  if (!moduleId || !isValidSlug(moduleId)) {
    return c.json({ error: "Invalid moduleId" }, 400);
  }

  try {
    await fireMilestonesForCompletion({ userId, themeId, moduleId });
  } catch (err) {
    logger.error(
      { err, route: "dispatch.check", userId, themeId, moduleId },
      "milestone check failed",
    );
    return c.json({ ok: false }, 500);
  }

  return c.json({ ok: true });
});

export { dispatch };
