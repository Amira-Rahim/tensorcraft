"use client";

import { getSupabaseBrowserClient } from "./supabase/client";
import { reportDataError } from "./report-data-error";
import { trackStreakAchieved } from "@/lib/analytics";

interface ProgressUpdate {
  worldId: string;
  moduleId: string;
  lessonId: string;
  status: "not_started" | "in_progress" | "completed";
  score?: number;
  hintsUsed?: number;
  attempts?: number;
}

/** Mark a lesson as started (in_progress), only if not already started or completed */
export async function markLessonStarted(
  worldId: string,
  moduleId: string,
  lessonId: string,
) {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Use upsert with ignoreDuplicates to avoid SELECT→INSERT race condition.
  // When ignoreDuplicates is true and the record already exists, the upsert
  // is a no-op and .select().single() returns null. In that case, fall back
  // to a SELECT to fetch the existing record.
  const { data, error } = await supabase
    .from("world_progress")
    .upsert(
      {
        user_id: user.id,
        world_id: worldId,
        module_id: moduleId,
        lesson_id: lessonId,
        status: "in_progress",
        score: null,
        hints_used: 0,
        attempts: 0,
        started_at: new Date().toISOString(),
      },
      { onConflict: "user_id,world_id,lesson_id", ignoreDuplicates: true },
    )
    .select()
    .single();

  if (data) return data;

  // Record already existed (ignoreDuplicates skipped the insert), fetch it
  if (error) {
    const { data: existing } = await supabase
      .from("world_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("world_id", worldId)
      .eq("lesson_id", lessonId)
      .single();

    if (!existing) {
      // An upsert error is EXPECTED here when the row already exists, because
      // ignoreDuplicates makes it a no-op. Only report when the fallback SELECT
      // also comes back empty: at that point the write genuinely failed and the
      // learner's progress was silently dropped.
      reportDataError("progress.markLessonStarted", error, {
        worldId,
        moduleId,
        lessonId,
      });
    }

    return existing ?? null;
  }

  return null;
}

/**
 * Mark a lesson as completed and update streak.
 *
 * `extras` carries the session's hint/attempt counters (audit 2026-09-04:
 * world_progress.hints_used and .attempts were permanently zero because
 * their only writer had no callers). Pass it ONLY on a genuine walk to the
 * final step, never on a restored mount: the write re-runs on every reload
 * of a finished lesson and session counters must not re-accumulate.
 */
export async function markLessonCompleted(
  worldId: string,
  moduleId: string,
  lessonId: string,
  score?: number | null,
  extras?: { hintsUsed?: number; attempts?: number },
) {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Preserve original started_at if the record already exists; status
  // tells us below whether this call is a genuine completion transition.
  const { data: existingProgress } = await supabase
    .from("world_progress")
    .select("started_at, hints_used, attempts, score, status")
    .eq("user_id", user.id)
    .eq("world_id", worldId)
    .eq("lesson_id", lessonId)
    .single();

  const { data, error } = await supabase
    .from("world_progress")
    .upsert(
      {
        user_id: user.id,
        world_id: worldId,
        module_id: moduleId,
        lesson_id: lessonId,
        status: "completed" as const,
        score: score ?? existingProgress?.score ?? null,
        // Hints: distinct levels revealed, so max across sessions is the
        // honest aggregate. Attempts: every graded run counts, so sessions
        // sum.
        hints_used: Math.max(
          existingProgress?.hints_used ?? 0,
          extras?.hintsUsed ?? 0,
        ),
        attempts: (existingProgress?.attempts ?? 0) + (extras?.attempts ?? 0),
        started_at: existingProgress?.started_at ?? new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,world_id,lesson_id" },
    )
    .select()
    .single();

  if (error) {
    // Losing this write means the learner finished a lesson and the product
    // forgot. Previously it returned null and told nobody.
    reportDataError("progress.markLessonCompleted", error, {
      worldId,
      moduleId,
      lessonId,
    });
    return null;
  }

  // Streak update + genome recomputation + analytics (all fire-and-forget)
  Promise.resolve(
    supabase.rpc("record_streak_activity", { p_world_id: worldId }),
  )
    .then(async () => {
      // The event fires only on a genuine completion walk (extras
      // present): the write re-runs on every reload of a finished lesson
      // and the event was refiring with it (re-audit 2026-09-04). The rpc
      // itself stays unconditional; it is same-day idempotent.
      if (!extras) return;
      // The rpc RETURNS void, so read the streak back rather than emit a
      // hardcoded 1 (audit 2026-09-04: streak_achieved reported
      // streakDays:1 on every completion since it shipped).
      const { data: streak } = await supabase
        .from("streaks")
        .select("current_streak")
        .eq("user_id", user.id)
        .eq("world_id", worldId)
        .single();
      trackStreakAchieved(streak?.current_streak ?? 1);
    })
    .catch(() => {});

  Promise.resolve(
    supabase.rpc("compute_user_skill_genome", {
      p_user_id: user.id,
      p_world_id: worldId,
    }),
  ).catch(() => {});

  return data;
}

/** Update progress with exercise results */
export async function updateExerciseProgress(update: ProgressUpdate) {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Preserve original started_at if the record already exists
  const { data: existingProgress } = await supabase
    .from("world_progress")
    .select("started_at")
    .eq("user_id", user.id)
    .eq("world_id", update.worldId)
    .eq("lesson_id", update.lessonId)
    .single();

  const { data, error } = await supabase
    .from("world_progress")
    .upsert(
      {
        user_id: user.id,
        world_id: update.worldId,
        module_id: update.moduleId,
        lesson_id: update.lessonId,
        status: update.status,
        score: update.score ?? null,
        hints_used: update.hintsUsed ?? 0,
        attempts: update.attempts ?? 0,
        started_at: existingProgress?.started_at ?? new Date().toISOString(),
        ...(update.status === "completed"
          ? { completed_at: new Date().toISOString() }
          : {}),
      },
      { onConflict: "user_id,world_id,lesson_id" },
    )
    .select()
    .single();

  if (error) {
    reportDataError("progress.updateExerciseProgress", error);
    return null;
  }
  return data;
}

/** Get lesson completion status (client-side) */
export async function getLessonStatus(worldId: string, lessonId: string) {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("world_progress")
    .select("status, completed_at")
    .eq("user_id", user.id)
    .eq("world_id", worldId)
    .eq("lesson_id", lessonId)
    .single();

  return data;
}

/** ── Skill Event Buffer ────────────────────────────── */

interface BufferedEvent {
  worldId: string;
  eventType: string;
  skillAxis: string;
  metadata: Record<string, unknown>;
}

let eventBuffer: BufferedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
const FLUSH_INTERVAL_MS = 5_000;
const MAX_BUFFER_SIZE = 50;

async function flushEventBuffer() {
  if (eventBuffer.length === 0) return;

  const events = [...eventBuffer];
  eventBuffer = [];

  const supabase = getSupabaseBrowserClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) return;

  const { getApiUrl } = await import("./api-url");
  const apiBase = getApiUrl();

  // keepalive: true ensures the request survives page navigation/unload
  fetch(`${apiBase}/api/skill-events/batch`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ events }),
    keepalive: true,
  }).catch(() => {
    // Silently fail, skill events are non-critical
  });
}

// Flush on page visibility change (user navigating away)
if (typeof document !== "undefined") {
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      flushEventBuffer();
    }
  });
}

/** Emit a skill event, buffered, flushed every 5s or on page leave */
export function emitSkillEvent(
  worldId: string,
  eventType: string,
  skillAxis: string | undefined,
  metadata: Record<string, unknown> = {},
) {
  if (!skillAxis) return;

  eventBuffer.push({ worldId, eventType, skillAxis, metadata });

  // Flush immediately if buffer is full
  if (eventBuffer.length >= MAX_BUFFER_SIZE) {
    if (flushTimer) {
      clearTimeout(flushTimer);
      flushTimer = null;
    }
    flushEventBuffer();
    return;
  }

  // Schedule flush
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flushEventBuffer();
    }, FLUSH_INTERVAL_MS);
  }
}

/** Check how many exercises in a lesson have a passing attempt */
export async function getLessonExerciseStatus(
  worldId: string,
  lessonId: string,
  exerciseCount: number,
): Promise<{ allComplete: boolean; completedCount: number }> {
  if (exerciseCount === 0) {
    return { allComplete: true, completedCount: 0 };
  }

  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { allComplete: false, completedCount: 0 };

  // Get distinct exercise slugs with at least one passing attempt for this lesson
  const { data, error } = await supabase
    .from("exercise_attempts")
    .select("exercise_slug")
    .eq("user_id", user.id)
    .eq("world_id", worldId)
    .eq("lesson_id", lessonId)
    .eq("passed", true);

  if (error || !data) return { allComplete: false, completedCount: 0 };

  // Count unique exercise slugs that passed
  const passedSlugs = new Set(data.map((row) => row.exercise_slug));
  const completedCount = passedSlugs.size;

  return {
    allComplete: completedCount >= exerciseCount,
    completedCount,
  };
}
