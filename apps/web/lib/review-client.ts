"use client";

import { getSupabaseBrowserClient } from "./supabase/client";
import { REVIEW_EPSILON } from "@tensorcraft/shared";

export interface ReviewQueueRow {
  themeId: string;
  moduleId: string;
  lessonId: string;
  armPulls: number;
  armSuccesses: number;
  lastReviewedAt: string | null;
  nextReviewAt: string;
  wasExplored: boolean;
}

export interface BanditStateSummary {
  epsilon: number;
  totalArms: number;
  totalPulls: number;
  totalSuccesses: number;
  dueCount: number;
}

/**
 * Insert a row into review_queue 24h after lesson completion.
 * No-op if user is anonymous. Idempotent server-side.
 */
export async function enqueueReview(
  themeId: string,
  moduleId: string,
  lessonId: string,
): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  await supabase.rpc("enqueue_review", {
    p_theme_id: themeId,
    p_module_id: moduleId,
    p_lesson_id: lessonId,
  });
}

/**
 * Record a recall attempt and reschedule via SM-2-lite.
 * Server emits skill_events.review_recall + updates arm stats.
 * Returns the new next_review_at, or null if not signed in / failed.
 */
export async function recordRecallAttempt(args: {
  themeId: string;
  moduleId: string;
  lessonId: string;
  success: boolean;
  skillAxis: string;
}): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc("record_recall_attempt", {
    p_theme_id: args.themeId,
    p_module_id: args.moduleId,
    p_lesson_id: args.lessonId,
    p_success: args.success,
    p_skill_axis: args.skillAxis,
  });

  if (error) return null;
  return data as string;
}

/** Fetch ε-greedy-selected due lessons for a single theme. */
export async function getReviewQueue(
  themeId: string,
  limit = 5,
): Promise<ReviewQueueRow[]> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase.rpc("get_review_queue", {
    p_theme_id: themeId,
    p_limit: limit,
  });

  if (error || !data) return [];
  return (data as Array<Record<string, unknown>>).map((row) => ({
    themeId: row.theme_id as string,
    moduleId: row.module_id as string,
    lessonId: row.lesson_id as string,
    armPulls: row.arm_pulls as number,
    armSuccesses: row.arm_successes as number,
    lastReviewedAt: (row.last_reviewed_at as string | null) ?? null,
    nextReviewAt: row.next_review_at as string,
    wasExplored: row.was_explored as boolean,
  }));
}

/** Aggregate bandit stats for a theme — powers <BanditState /> on bandit lesson. */
export async function getBanditStateSummary(
  themeId: string,
): Promise<BanditStateSummary> {
  const supabase = getSupabaseBrowserClient();
  const { data, error } = await supabase
    .rpc("get_bandit_state_summary", { p_theme_id: themeId })
    .single();

  if (error || !data) {
    return {
      epsilon: REVIEW_EPSILON,
      totalArms: 0,
      totalPulls: 0,
      totalSuccesses: 0,
      dueCount: 0,
    };
  }

  const row = data as {
    epsilon: number | string;
    total_arms: number;
    total_pulls: number | string;
    total_successes: number | string;
    due_count: number | string;
  };

  return {
    epsilon: Number(row.epsilon),
    totalArms: row.total_arms,
    totalPulls: Number(row.total_pulls),
    totalSuccesses: Number(row.total_successes),
    dueCount: Number(row.due_count),
  };
}
