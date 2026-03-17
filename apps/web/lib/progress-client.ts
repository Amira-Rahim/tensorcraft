"use client";

import { getSupabaseBrowserClient } from "./supabase/client";

interface ProgressUpdate {
  themeId: string;
  moduleId: string;
  lessonId: string;
  status: "not_started" | "in_progress" | "completed";
  score?: number;
  hintsUsed?: number;
  attempts?: number;
}

/** Mark a lesson as started (in_progress) — only if not already started or completed */
export async function markLessonStarted(
  themeId: string,
  moduleId: string,
  lessonId: string,
) {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Use upsert with ignoreDuplicates to avoid SELECT→INSERT race condition
  const { data, error } = await supabase
    .from("theme_progress")
    .upsert(
      {
        user_id: user.id,
        theme_id: themeId,
        module_id: moduleId,
        lesson_id: lessonId,
        status: "in_progress",
        score: null,
        hints_used: 0,
        attempts: 0,
        started_at: new Date().toISOString(),
      },
      { onConflict: "user_id,theme_id,lesson_id", ignoreDuplicates: true },
    )
    .select()
    .single();

  if (error) return null;
  return data;
}

/** Mark a lesson as completed and update streak */
export async function markLessonCompleted(
  themeId: string,
  moduleId: string,
  lessonId: string,
) {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Preserve original started_at if the record already exists
  const { data: existingProgress } = await supabase
    .from("theme_progress")
    .select("started_at, hints_used, attempts")
    .eq("user_id", user.id)
    .eq("theme_id", themeId)
    .eq("lesson_id", lessonId)
    .single();

  const { data, error } = await supabase
    .from("theme_progress")
    .upsert(
      {
        user_id: user.id,
        theme_id: themeId,
        module_id: moduleId,
        lesson_id: lessonId,
        status: "completed" as const,
        hints_used: existingProgress?.hints_used ?? 0,
        attempts: existingProgress?.attempts ?? 0,
        started_at: existingProgress?.started_at ?? new Date().toISOString(),
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,theme_id,lesson_id" },
    )
    .select()
    .single();

  if (error) return null;

  // Update streak (fire-and-forget)
  updateStreak(user.id, themeId).catch(() => {});

  return data;
}

/** Get a YYYY-MM-DD string in the user's local timezone */
function getLocalDateStr(date: Date = new Date()): string {
  return date.toLocaleDateString("en-CA"); // returns YYYY-MM-DD
}

/** Parse a YYYY-MM-DD string to a UTC-midnight Date, or null if malformed */
function parseDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return null;
  const parsed = new Date(dateStr + "T00:00:00Z");
  if (isNaN(parsed.getTime())) return null;
  return parsed;
}

/** Get the difference in calendar days between two YYYY-MM-DD strings (local tz) */
function daysBetween(dateStrA: string, dateStrB: string): number | null {
  const a = parseDate(dateStrA);
  const b = parseDate(dateStrB);
  if (!a || !b) return null;
  const msPerDay = 86_400_000;
  return Math.round((b.getTime() - a.getTime()) / msPerDay);
}

/** Update streak for a theme after lesson completion */
async function updateStreak(userId: string, themeId: string) {
  const supabase = getSupabaseBrowserClient();
  const today = getLocalDateStr();

  const { data: existing } = await supabase
    .from("streaks")
    .select("current_streak, longest_streak, last_activity_date")
    .eq("user_id", userId)
    .eq("theme_id", themeId)
    .single();

  if (!existing) {
    await supabase.from("streaks").insert({
      user_id: userId,
      theme_id: themeId,
      current_streak: 1,
      longest_streak: 1,
      last_activity_date: today,
    });
    return;
  }

  const lastDate = existing.last_activity_date;

  // If last_activity_date is null or malformed, treat as a new streak starting today
  if (!lastDate || !parseDate(lastDate)) {
    await supabase
      .from("streaks")
      .update({
        current_streak: 1,
        longest_streak: Math.max(existing.longest_streak ?? 0, 1),
        last_activity_date: today,
      })
      .eq("user_id", userId)
      .eq("theme_id", themeId);
    return;
  }

  // Already logged activity today — nothing to update
  if (lastDate === today) return;

  const diff = daysBetween(lastDate, today);
  const currentStreak = existing.current_streak ?? 0;
  const bestStreak = existing.longest_streak ?? 0;

  // diff === 1 means consecutive day; anything else resets
  const newStreak = diff === 1 ? currentStreak + 1 : 1;
  const newLongest = Math.max(bestStreak, newStreak);

  await supabase
    .from("streaks")
    .update({
      current_streak: newStreak,
      longest_streak: newLongest,
      last_activity_date: today,
    })
    .eq("user_id", userId)
    .eq("theme_id", themeId);
}

/** Update progress with exercise results */
export async function updateExerciseProgress(update: ProgressUpdate) {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from("theme_progress")
    .upsert(
      {
        user_id: user.id,
        theme_id: update.themeId,
        module_id: update.moduleId,
        lesson_id: update.lessonId,
        status: update.status,
        score: update.score ?? null,
        hints_used: update.hintsUsed ?? 0,
        attempts: update.attempts ?? 0,
        started_at: new Date().toISOString(),
        ...(update.status === "completed"
          ? { completed_at: new Date().toISOString() }
          : {}),
      },
      { onConflict: "user_id,theme_id,lesson_id" },
    )
    .select()
    .single();

  if (error) return null;
  return data;
}

/** Get lesson completion status (client-side) */
export async function getLessonStatus(themeId: string, lessonId: string) {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from("theme_progress")
    .select("status, completed_at")
    .eq("user_id", user.id)
    .eq("theme_id", themeId)
    .eq("lesson_id", lessonId)
    .single();

  return data;
}
