import { Hono } from "hono";
import { getSupabaseServerClient } from "@tensorcraft/supabase";
import { isValidThemeSlug, isValidSlug } from "@tensorcraft/shared";
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

  if (!isValidThemeSlug(themeId)) {
    return c.json({ error: "Invalid themeId" }, 400);
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
    return c.json(
      {
        error: "Failed to fetch progress",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  return c.json({ progress: data });
});

/**
 * POST /api/progress — Create or update lesson progress.
 */
progress.post("/", async (c) => {
  const userId = c.get("userId");
  const token = c.get("accessToken");

  let body: {
    themeId: string;
    moduleId: string;
    lessonId: string;
    status?: "not_started" | "in_progress" | "completed";
    score?: number;
    hintsUsed?: number;
    attempts?: number;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  // Required fields
  if (!body.themeId || !body.moduleId || !body.lessonId) {
    return c.json(
      { error: "themeId, moduleId, and lessonId are required" },
      400,
    );
  }

  // CRITICAL #2: Validate theme/module/lesson IDs
  if (!isValidThemeSlug(body.themeId)) {
    return c.json({ error: "Invalid themeId" }, 400);
  }
  if (!isValidSlug(body.moduleId)) {
    return c.json({ error: "Invalid moduleId" }, 400);
  }
  if (!isValidSlug(body.lessonId)) {
    return c.json({ error: "Invalid lessonId" }, 400);
  }

  // Validate status enum
  const validStatuses = ["not_started", "in_progress", "completed"] as const;
  const status = body.status ?? "in_progress";
  if (!validStatuses.includes(status)) {
    return c.json({ error: "Invalid status" }, 400);
  }

  // CRITICAL #3: Score range validation
  const score = body.score ?? null;
  if (score !== null) {
    if (typeof score !== "number" || !Number.isFinite(score)) {
      return c.json({ error: "Score must be a finite number" }, 400);
    }
    if (score < 0 || score > 100) {
      return c.json({ error: "Score must be between 0 and 100" }, 400);
    }
  }

  // Validate non-negative integers
  const hintsUsed = body.hintsUsed ?? 0;
  const attempts = body.attempts ?? 0;
  if (!Number.isInteger(hintsUsed) || hintsUsed < 0) {
    return c.json({ error: "hintsUsed must be a non-negative integer" }, 400);
  }
  if (!Number.isInteger(attempts) || attempts < 0) {
    return c.json({ error: "attempts must be a non-negative integer" }, 400);
  }

  const supabase = getSupabaseServerClient(token);
  const now = new Date().toISOString();

  // CRITICAL #4: Fix started_at overwrite — check if record exists first
  const { data: existing } = await supabase
    .from("theme_progress")
    .select("started_at")
    .eq("user_id", userId)
    .eq("theme_id", body.themeId)
    .eq("lesson_id", body.lessonId)
    .single();

  const { data, error } = await supabase
    .from("theme_progress")
    .upsert(
      {
        user_id: userId,
        theme_id: body.themeId,
        module_id: body.moduleId,
        lesson_id: body.lessonId,
        status,
        score,
        hints_used: hintsUsed,
        attempts,
        // Only set started_at on first insert, preserve on update
        started_at: existing?.started_at ?? now,
        ...(status === "completed" ? { completed_at: now } : {}),
      },
      { onConflict: "user_id,theme_id,lesson_id" },
    )
    .select()
    .single();

  if (error) {
    return c.json(
      {
        error: "Failed to update progress",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  return c.json({ progress: data });
});

/**
 * GET /api/progress/summary — Aggregated progress across all themes.
 * Returns per-theme counts of completed/total lessons and current streak.
 */
progress.get("/summary", async (c) => {
  const userId = c.get("userId");
  const token = c.get("accessToken");
  const supabase = getSupabaseServerClient(token);

  // Fetch all progress records for this user
  const { data: records, error } = await supabase
    .from("theme_progress")
    .select("theme_id, module_id, lesson_id, status")
    .eq("user_id", userId);

  if (error) {
    return c.json(
      {
        error: "Failed to fetch progress summary",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  // Group by theme
  const byTheme: Record<
    string,
    { total: number; completed: number; inProgress: number }
  > = {};
  for (const r of records ?? []) {
    if (!byTheme[r.theme_id]) {
      byTheme[r.theme_id] = { total: 0, completed: 0, inProgress: 0 };
    }
    byTheme[r.theme_id].total++;
    if (r.status === "completed") byTheme[r.theme_id].completed++;
    if (r.status === "in_progress") byTheme[r.theme_id].inProgress++;
  }

  // Fetch streaks
  const { data: streaksRaw } = await supabase
    .from("streaks")
    .select("theme_id, current_streak, longest_streak")
    .eq("user_id", userId);

  const streaks = streaksRaw ?? [];
  const streakMap: Record<string, { current: number; longest: number }> = {};
  for (const s of streaks) {
    streakMap[s.theme_id] = {
      current: s.current_streak,
      longest: s.longest_streak,
    };
  }

  // Build summary
  const themes = Object.entries(byTheme).map(([themeId, counts]) => ({
    themeId,
    ...counts,
    streak: streakMap[themeId] ?? { current: 0, longest: 0 },
  }));

  const totalCompleted = themes.reduce((sum, t) => sum + t.completed, 0);
  const totalLessons = themes.reduce((sum, t) => sum + t.total, 0);
  const bestStreak = streaks.reduce(
    (max, s) => Math.max(max, s.longest_streak ?? 0),
    0,
  );

  return c.json({
    summary: {
      totalLessons,
      totalCompleted,
      bestStreak,
      themes,
    },
  });
});

export { progress };
