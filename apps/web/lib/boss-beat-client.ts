"use client";

import { getSupabaseBrowserClient } from "./supabase/client";

export type BossBeatChoiceLabel =
  "cooperate" | "defect" | "random" | "dominant";

export const BOSS_BEAT_CHANGED = "tensorcraft:story-choice-saved";

export interface BossBeatChoice {
  beatId: string;
  choiceIndex: number;
  choiceLabel: BossBeatChoiceLabel;
  reactionMs: number | null;
  chosenAt: string;
  /** Missing only for legacy callers; interpreted as version 1. */
  contentVersion?: number;
}

/** Fetch the player's prior choice for a beat, null if not yet chosen. */
export async function getBossBeatChoice(
  beatId: string,
): Promise<BossBeatChoice | null> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  // Supabase reports an absent guest session as an auth error. It is a
  // known signed-out state, unlike a network failure while checking a user.
  if (authError && authError.name !== "AuthSessionMissingError")
    throw new Error("Could not verify your session");
  if (!user) return null;

  let { data, error } = await supabase.rpc("get_boss_beat_choice_versioned", {
    p_beat_id: beatId,
  });
  // Read-only compatibility while the schema rolls out. Never retry a
  // version-2 write through the unversioned RPC.
  if (error && (error.code === "PGRST202" || error.code === "42883")) {
    const legacy = await supabase.rpc("get_boss_beat_choice", {
      p_beat_id: beatId,
    });
    data = legacy.data?.map((row) => ({ ...row, content_version: 1 })) ?? null;
    error = legacy.error;
  }
  if (error) throw new Error("Could not load your story choice");
  if (!data || data.length === 0) return null;
  const row = data[0];
  const contentVersion = row.content_version ?? 1;
  const labels: BossBeatChoiceLabel[] = [
    "cooperate",
    "defect",
    "random",
    "dominant",
  ];
  if (
    row.beat_id !== beatId ||
    !Number.isInteger(row.choice_index) ||
    labels[row.choice_index] !== row.choice_label ||
    !Number.isInteger(contentVersion) ||
    contentVersion < 1 ||
    contentVersion > 2
  ) {
    throw new Error("Invalid saved story choice");
  }
  return {
    beatId: row.beat_id,
    choiceIndex: row.choice_index,
    choiceLabel: row.choice_label as BossBeatChoiceLabel,
    reactionMs: row.reaction_ms,
    chosenAt: row.chosen_at,
    contentVersion,
  };
}

/**
 * Idempotent recorder. Returns true if the choice was inserted, false if
 * the player had already chosen for this beat (server protects against
 * replay; client uses the return to surface "your call: X" rather than
 * silently doing nothing).
 */
export async function recordBossBeatChoice(args: {
  worldId: string;
  lessonId: string;
  beatId: string;
  choiceIndex: number;
  choiceLabel: BossBeatChoiceLabel;
  reactionMs?: number | null;
  contentVersion?: number;
}): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();
  if (authError) throw new Error("Could not verify your session");
  if (!user) throw new Error("Sign in to save your choice");

  const { data, error } = await supabase.rpc(
    "record_boss_beat_choice_versioned",
    {
      p_world_id: args.worldId,
      p_lesson_id: args.lessonId,
      p_beat_id: args.beatId,
      p_choice_index: args.choiceIndex,
      p_choice_label: args.choiceLabel,
      p_content_version: args.contentVersion ?? 1,
      // Omitting the arg (undefined) hits the SQL "default null" in migration
      // 030, so this is behavior-identical to passing null, which the generated
      // RPC arg type no longer accepts.
      p_reaction_ms:
        args.reactionMs == null
          ? undefined
          : Math.min(2_147_483_647, args.reactionMs),
    },
  );
  if (error || typeof data !== "boolean")
    throw new Error("Could not save your story choice");
  return data;
}
