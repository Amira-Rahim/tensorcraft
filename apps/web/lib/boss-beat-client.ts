"use client";

import { getSupabaseBrowserClient } from "./supabase/client";

export type BossBeatChoiceLabel =
  | "cooperate"
  | "defect"
  | "random"
  | "dominant";

export interface BossBeatChoice {
  beatId: string;
  choiceIndex: number;
  choiceLabel: BossBeatChoiceLabel;
  reactionMs: number | null;
  chosenAt: string;
}

/** Fetch the player's prior choice for a beat, null if not yet chosen. */
export async function getBossBeatChoice(
  beatId: string,
): Promise<BossBeatChoice | null> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc("get_boss_beat_choice", {
    p_beat_id: beatId,
  });
  if (error || !data || data.length === 0) return null;
  const row = data[0];
  return {
    beatId: row.beat_id,
    choiceIndex: row.choice_index,
    choiceLabel: row.choice_label,
    reactionMs: row.reaction_ms,
    chosenAt: row.chosen_at,
  };
}

/**
 * Idempotent recorder. Returns true if the choice was inserted, false if
 * the player had already chosen for this beat (server protects against
 * replay; client uses the return to surface "your call: X" rather than
 * silently doing nothing).
 */
export async function recordBossBeatChoice(args: {
  themeId: string;
  lessonId: string;
  beatId: string;
  choiceIndex: number;
  choiceLabel: BossBeatChoiceLabel;
  reactionMs?: number | null;
}): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc("record_boss_beat_choice", {
    p_theme_id: args.themeId,
    p_lesson_id: args.lessonId,
    p_beat_id: args.beatId,
    p_choice_index: args.choiceIndex,
    p_choice_label: args.choiceLabel,
    p_reaction_ms: args.reactionMs ?? null,
  });
  if (error) return false;
  return Boolean(data);
}
