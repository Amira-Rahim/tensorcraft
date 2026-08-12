import { Hono } from "hono";
import { getSupabaseServerClient } from "@tensorcraft/supabase";
import { isValidWorldSlug, isValidSlug, isLaunched } from "@tensorcraft/shared";
import { authMiddleware } from "../middleware/auth";
import type { AppEnv } from "../types";

const exerciseAttempts = new Hono<AppEnv>();

exerciseAttempts.use("*", authMiddleware);

/**
 * POST /api/exercise-attempts, Record an exercise attempt.
 */
exerciseAttempts.post("/", async (c) => {
  const userId = c.get("userId");
  const token = c.get("accessToken");

  let body: {
    exerciseSlug: string;
    lessonId: string;
    worldId: string;
    passed: boolean;
    score?: number;
    hintsUsed?: number;
    solutionViewed?: boolean;
    submittedCode?: string;
    durationMs?: number;
  };

  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  if (!body.exerciseSlug || !body.lessonId || !body.worldId) {
    return c.json(
      { error: "exerciseSlug, lessonId, and worldId are required" },
      400,
    );
  }

  if (!isValidWorldSlug(body.worldId)) {
    return c.json({ error: "Invalid worldId" }, 400);
  }
  if (!isLaunched(body.worldId)) {
    return c.json({ error: "World is not yet launched" }, 400);
  }
  if (!isValidSlug(body.exerciseSlug)) {
    return c.json({ error: "Invalid exerciseSlug" }, 400);
  }
  if (!isValidSlug(body.lessonId)) {
    return c.json({ error: "Invalid lessonId" }, 400);
  }

  const score = body.score ?? 0;
  if (
    typeof score !== "number" ||
    !Number.isFinite(score) ||
    score < 0 ||
    score > 100
  ) {
    return c.json({ error: "Score must be between 0 and 100" }, 400);
  }

  const hintsUsed = body.hintsUsed ?? 0;
  if (!Number.isInteger(hintsUsed) || hintsUsed < 0) {
    return c.json({ error: "hintsUsed must be a non-negative integer" }, 400);
  }

  const durationMs = body.durationMs ?? null;
  if (
    durationMs !== null &&
    (!Number.isInteger(durationMs) || durationMs < 0)
  ) {
    return c.json({ error: "durationMs must be a non-negative integer" }, 400);
  }

  // Limit submitted code size (100KB)
  if (body.submittedCode && body.submittedCode.length > 102_400) {
    return c.json({ error: "submittedCode exceeds maximum size" }, 400);
  }

  const supabase = getSupabaseServerClient(token);

  const { data, error } = await supabase
    .from("exercise_attempts")
    .insert({
      user_id: userId,
      exercise_slug: body.exerciseSlug,
      lesson_id: body.lessonId,
      world_id: body.worldId,
      passed: body.passed ?? false,
      score,
      hints_used: hintsUsed,
      solution_viewed: body.solutionViewed ?? false,
      submitted_code: body.submittedCode ?? null,
      duration_ms: durationMs,
    })
    .select()
    .single();

  if (error) {
    return c.json(
      {
        error: "Failed to record attempt",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  return c.json({ attempt: data }, 201);
});

/**
 * GET /api/exercise-attempts?lessonId=...&worldId=..., Get user's attempts for a lesson.
 */
exerciseAttempts.get("/", async (c) => {
  const userId = c.get("userId");
  const token = c.get("accessToken");
  const lessonId = c.req.query("lessonId");
  const worldId = c.req.query("worldId");

  if (!lessonId) {
    return c.json({ error: "lessonId query parameter is required" }, 400);
  }

  const supabase = getSupabaseServerClient(token);

  let query = supabase
    .from("exercise_attempts")
    .select(
      "id, exercise_slug, lesson_id, world_id, passed, score, hints_used, solution_viewed, duration_ms, attempted_at",
    )
    .eq("user_id", userId)
    .eq("lesson_id", lessonId)
    .order("attempted_at", { ascending: false })
    .limit(100);

  if (worldId) {
    query = query.eq("world_id", worldId);
  }

  const { data, error } = await query;

  if (error) {
    return c.json(
      {
        error: "Failed to fetch attempts",
        requestId: c.res.headers.get("X-Request-Id"),
      },
      500,
    );
  }

  return c.json({ attempts: data });
});

export { exerciseAttempts };
