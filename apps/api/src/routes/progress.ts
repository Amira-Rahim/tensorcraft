import { Hono } from "hono";
import { getSupabaseServerClient } from "@tensorcraft/supabase";
import { isValidThemeSlug, isValidSlug } from "@tensorcraft/shared";
import { authMiddleware } from "../middleware/auth";
import { fireMilestonesForCompletion } from "../lib/dispatch";
import type { AppEnv } from "../types";

const progress = new Hono<AppEnv>();

// All progress routes require auth
progress.use("*", authMiddleware);

/**
 * GET /api/progress?themeId=deep-orbit, Get user's progress for a theme.
 *
 * NOTE: As of V0.5, the Next.js frontend queries Supabase directly via
 * lib/progress-client.ts rather than using this endpoint. This route is
 * retained for future mobile/external API consumers and admin tooling.
 * It provides server-side validation that the direct client calls do not.
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
 * POST /api/progress, Create or update lesson progress.
 *
 * NOTE: As of V0.5, the Next.js frontend writes progress directly via
 * Supabase client in lib/progress-client.ts. This endpoint is retained
 * for future mobile/external API consumers. It includes server-side
 * validation and the started_at preservation fix (CRITICAL #4).
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

  // CRITICAL #4: Fix started_at overwrite, check if record exists first
  const { data: existing } = await supabase
    .from("theme_progress")
    .select("started_at, status")
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

  // DISPATCH milestone check on a genuine completion transition. The web
  // frontend writes progress directly to Supabase and calls
  // /api/dispatch/check itself; this covers future API consumers.
  if (
    status === "completed" &&
    existing?.status !== "completed" &&
    body.moduleId
  ) {
    fireMilestonesForCompletion({
      userId,
      themeId: body.themeId,
      moduleId: body.moduleId,
    }).catch(() => {
      // Best-effort: the dedup-by-subject producer can be retried by any
      // later completion in the same module.
    });
  }

  return c.json({ progress: data });
});

/**
 * GET /api/progress/summary, Aggregated progress across all themes.
 * Returns per-theme counts of completed/total lessons and current streak.
 *
 * NOTE: As of V0.5, the dashboard queries Supabase directly (server
 * component in dashboard/page.tsx). This endpoint aggregates the same
 * data and is retained for future mobile/external API consumers.
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

/**
 * GET /api/progress/activity/daily?days=30&themeId=?
 *
 * Returns one row per UTC date covering the last N days (default 30,
 * max 365). Each row contains:
 *   - date: YYYY-MM-DD (UTC)
 *   - lessonsCompleted: lessons marked `completed` on that date
 *   - exercisesAttempted: rows in exercise_attempts with that
 *     `attempted_at` date (passed or failed, any attempt counts)
 *
 * Missing days are included with zero counts so consumers can render
 * a heat-map / sparkline without client-side bucketing.
 *
 * If `themeId` is provided, only that theme's activity is counted.
 */
progress.get("/activity/daily", async (c) => {
  const userId = c.get("userId");
  const token = c.get("accessToken");

  const daysRaw = c.req.query("days");
  const themeId = c.req.query("themeId");

  const days = daysRaw === undefined ? 30 : Number(daysRaw);
  if (!Number.isInteger(days) || days < 1 || days > 365) {
    return c.json({ error: "days must be an integer between 1 and 365" }, 400);
  }

  if (themeId !== undefined && !isValidThemeSlug(themeId)) {
    return c.json({ error: "Invalid themeId" }, 400);
  }

  // Compute the inclusive UTC window [startDate, today].
  const today = new Date();
  const todayUtc = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  );
  const startUtc = new Date(todayUtc);
  startUtc.setUTCDate(startUtc.getUTCDate() - (days - 1));
  const startIso = startUtc.toISOString();

  const supabase = getSupabaseServerClient(token);

  // Fetch completions
  let completionsQuery = supabase
    .from("theme_progress")
    .select("completed_at, theme_id")
    .eq("user_id", userId)
    .eq("status", "completed")
    .not("completed_at", "is", null)
    .gte("completed_at", startIso);
  if (themeId) completionsQuery = completionsQuery.eq("theme_id", themeId);

  const { data: completions, error: completionsErr } = await completionsQuery;
  if (completionsErr) {
    return c.json(
      {
        error: "Failed to fetch lesson completions",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  // Fetch attempts
  let attemptsQuery = supabase
    .from("exercise_attempts")
    .select("attempted_at, theme_id")
    .eq("user_id", userId)
    .gte("attempted_at", startIso);
  if (themeId) attemptsQuery = attemptsQuery.eq("theme_id", themeId);

  const { data: attempts, error: attemptsErr } = await attemptsQuery;
  if (attemptsErr) {
    return c.json(
      {
        error: "Failed to fetch exercise attempts",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  // Bucket into { date: {lessons, exercises} }
  const bucket: Record<
    string,
    { lessonsCompleted: number; exercisesAttempted: number }
  > = {};

  // Seed zeros for every day in the window.
  for (let i = 0; i < days; i++) {
    const d = new Date(startUtc);
    d.setUTCDate(d.getUTCDate() + i);
    const key = d.toISOString().slice(0, 10);
    bucket[key] = { lessonsCompleted: 0, exercisesAttempted: 0 };
  }

  for (const row of (completions ?? []) as Array<{
    completed_at: string | null;
  }>) {
    if (!row.completed_at) continue;
    const key = row.completed_at.slice(0, 10); // UTC date bucket
    if (bucket[key]) bucket[key].lessonsCompleted++;
  }

  for (const row of (attempts ?? []) as Array<{
    attempted_at: string | null;
  }>) {
    if (!row.attempted_at) continue;
    const key = row.attempted_at.slice(0, 10);
    if (bucket[key]) bucket[key].exercisesAttempted++;
  }

  const result = Object.entries(bucket)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));

  return c.json({ activity: result });
});

export { progress };
