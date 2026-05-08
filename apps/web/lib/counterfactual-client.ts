"use client";

import { getSupabaseBrowserClient } from "./supabase/client";

export interface CounterfactualRecord {
  themeId: string;
  lessonId: string;
  decisionNode: string;
  originalChoiceIndex: number;
  alternateChoiceIndex: number;
  rewoundAt: string;
}

/** Returns the rewind already used in this theme, or null. */
export async function getCounterfactual(
  themeId: string,
): Promise<CounterfactualRecord | null> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase.rpc("get_counterfactual", {
    p_theme_id: themeId,
  });
  if (error || !data || data.length === 0) return null;
  const row = data[0];
  return {
    themeId: row.theme_id,
    lessonId: row.lesson_id,
    decisionNode: row.decision_node,
    originalChoiceIndex: row.original_choice_index,
    alternateChoiceIndex: row.alternate_choice_index,
    rewoundAt: row.rewound_at,
  };
}

/**
 * Record a rewind. Returns true if recorded, false if a rewind was
 * already used for this theme (one-shot cap enforced server-side).
 */
export async function recordCounterfactual(args: {
  themeId: string;
  lessonId: string;
  decisionNode: string;
  originalChoiceIndex: number;
  alternateChoiceIndex: number;
}): Promise<boolean> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data, error } = await supabase.rpc("record_counterfactual", {
    p_theme_id: args.themeId,
    p_lesson_id: args.lessonId,
    p_decision_node: args.decisionNode,
    p_original_choice_index: args.originalChoiceIndex,
    p_alternate_choice_index: args.alternateChoiceIndex,
  });
  if (error) return false;
  return Boolean(data);
}
