import { Hono } from "hono";
import { getSupabaseServerClient } from "@tensorcraft/supabase";
import { authMiddleware } from "../middleware/auth";
import type { AppEnv } from "../types";

const progress = new Hono<AppEnv>();

// All progress routes require auth
progress.use("*", authMiddleware);

/**
 * GET /api/progress?themeId=deep-orbit — Get user's progress for a theme.
 */
progress.get("/", async (c) => {
  const userId = c.get("userId");
  const token = c.get("accessToken");
  const themeId = c.req.query("themeId");

  if (!themeId) {
    return c.json({ error: "themeId query parameter is required" }, 400);
  }

  const supabase = getSupabaseServerClient(token);

  const { data, error } = await supabase
    .from("theme_progress")
    .select("*")
    .eq("user_id", userId)
    .eq("theme_id", themeId)
    .order("module_id")
    .order("lesson_id");

  if (error) {
    return c.json({ error: "Failed to fetch progress" }, 500);
  }

  return c.json({ progress: data });
});

/**
 * POST /api/progress — Create or update lesson progress.
 */
progress.post("/", async (c) => {
  const userId = c.get("userId");
  const token = c.get("accessToken");

  const body = await c.req.json<{
    themeId: string;
    moduleId: string;
    lessonId: string;
    status?: "not_started" | "in_progress" | "completed";
    score?: number;
    hintsUsed?: number;
    attempts?: number;
  }>();

  if (!body.themeId || !body.moduleId || !body.lessonId) {
    return c.json(
      { error: "themeId, moduleId, and lessonId are required" },
      400,
    );
  }

  const supabase = getSupabaseServerClient(token);

  const { data, error } = await supabase
    .from("theme_progress")
    .upsert(
      {
        user_id: userId,
        theme_id: body.themeId,
        module_id: body.moduleId,
        lesson_id: body.lessonId,
        status: body.status ?? "in_progress",
        score: body.score ?? null,
        hints_used: body.hintsUsed ?? 0,
        attempts: body.attempts ?? 0,
        started_at: new Date().toISOString(),
        ...(body.status === "completed"
          ? { completed_at: new Date().toISOString() }
          : {}),
      },
      { onConflict: "user_id,theme_id,lesson_id" },
    )
    .select()
    .single();

  if (error) {
    return c.json({ error: "Failed to update progress" }, 500);
  }

  return c.json({ progress: data });
});

export { progress };
