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

  // Check if already exists
  const { data: existing } = await supabase
    .from("theme_progress")
    .select("status")
    .eq("user_id", user.id)
    .eq("theme_id", themeId)
    .eq("lesson_id", lessonId)
    .single();

  // Don't overwrite existing progress
  if (existing) return existing;

  const { data, error } = await supabase
    .from("theme_progress")
    .insert({
      user_id: user.id,
      theme_id: themeId,
      module_id: moduleId,
      lesson_id: lessonId,
      status: "in_progress",
      score: null,
      hints_used: 0,
      attempts: 0,
      started_at: new Date().toISOString(),
    })
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

  const { data, error } = await supabase
    .from("theme_progress")
    .upsert(
      {
        user_id: user.id,
        theme_id: themeId,
        module_id: moduleId,
        lesson_id: lessonId,
        status: "completed" as const,
        hints_used: 0,
        attempts: 0,
        started_at: new Date().toISOString(),
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

/** Update streak for a theme after lesson completion */
async function updateStreak(userId: string, themeId: string) {
  // streaks table added in migration 003 — not in generated Supabase types yet
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseBrowserClient() as any;
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

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

  const lastDate = existing.last_activity_date as string | null;
  if (lastDate === today) return;

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const currentStreak = (existing.current_streak as number) ?? 0;
  const bestStreak = (existing.longest_streak as number) ?? 0;
  const newStreak = lastDate === yesterdayStr ? currentStreak + 1 : 1;
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
