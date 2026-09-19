"use client";
import {
  validActivitySnapshot,
  type ActivitySnapshot,
  type ActivitySummary,
  type LearningActivityId,
} from "@tensorcraft/shared";
import { getSupabaseBrowserClient } from "./supabase/client";

export async function saveActivity(userId: string, record: ActivitySnapshot) {
  if (!validActivitySnapshot(record))
    throw new Error("Incompatible practice record");
  const { error } = await getSupabaseBrowserClient().rpc(
    "record_learning_activity",
    {
      p_expected_user_id: userId,
      p_activity_id: record.activityId,
      p_content_version: record.version,
      p_phase: record.phase,
      p_stream_id: record.streamId,
      p_attempt_count: record.count,
      p_first_correct: record.first?.correct ?? undefined,
      p_first_assisted: record.first?.assisted ?? undefined,
      p_latest_correct: record.latest?.correct ?? undefined,
      p_latest_assisted: record.latest?.assisted ?? undefined,
      p_assistance_observed: record.assistance,
      p_completed_at: record.completedAt ?? undefined,
    },
  );
  if (error)
    throw new Error(
      "Practice summary could not be saved. The local draft is still available.",
    );
}
export async function readActivities(
  userId: string,
  activityId?: LearningActivityId,
): Promise<ActivitySummary[]> {
  let query = getSupabaseBrowserClient()
    .from("learning_activity_progress")
    .select(
      "activity_id,content_version,phase,first_correct,first_assisted,latest_correct,latest_assisted,attempt_count,assistance_observed,completed_at,source,updated_at",
    )
    .eq("user_id", userId)
    .limit(64);
  if (activityId) query = query.eq("activity_id", activityId);
  const { data, error } = await query;
  if (error)
    throw new Error(
      "Practice summaries are unavailable. Retry to load the account record.",
    );
  return data ?? [];
}
