"use client";

import { getSupabaseBrowserClient } from "./supabase/client";
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

    return existing ?? null;
  }

  return null;
}

/** Mark a lesson as completed and update streak */
export async function markLessonCompleted(
  worldId: string,
  moduleId: string,
  lessonId: string,
  score?: number | null,
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
        hints_used: existingProgress?.hints_used ?? 0,
        attempts: existingProgress?.attempts ?? 0,
        started_at: existingProgress?.started_at ?? new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,world_id,lesson_id" },
    )
    .select()
    .single();

  if (error) return null;

  // Streak update + genome recomputation + analytics (all fire-and-forget)
  Promise.resolve(
    supabase.rpc("record_streak_activity", { p_world_id: worldId }),
  )
    .then(() => {
      trackStreakAchieved(1);
    })
    .catch(() => {});

  Promise.resolve(
    supabase.rpc("compute_user_skill_genome", {
      p_user_id: user.id,
      p_world_id: worldId,
    }),
  ).catch(() => {});

  // DISPATCH milestone check (module cleared / world cleared), only on a
  // genuine not-completed → completed transition. The server re-reads
  // progress and dedups, so this is best-effort like the calls above.
  if (existingProgress?.status !== "completed") {
    import("./api-fetch")
      .then(({ apiFetch }) =>
        apiFetch("/api/dispatch/check", {
          method: "POST",
          body: JSON.stringify({ worldId, moduleId }),
        }),
      )
      .catch(() => {});
  }

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

  if (error) return null;
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
