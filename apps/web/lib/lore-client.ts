"use client";

import { getSupabaseBrowserClient } from "./supabase/client";
import { LORE_CATALOG, pickRandomArtifact } from "./lore-catalog";

/**
 * Try a drop on lesson completion. Server enforces the 20% chance + daily
 * cap; client picks the candidate artifact from the catalog so adding new
 * artifacts requires no DB migration.
 *
 * Returns the dropped artifact_id when a drop fired, null otherwise.
 * Callers can use the return to surface a toast notification.
 */
export async function tryDropLoreOnCompletion(
  themeId: string,
): Promise<string | null> {
  const supabase = getSupabaseBrowserClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Don't re-drop something the user already has.
  const { data: existing } = await supabase
    .from("lore_drops")
    .select("artifact_id")
    .eq("user_id", user.id);
  const exclude = new Set((existing ?? []).map((r) => r.artifact_id));

  const candidate = pickRandomArtifact({ themeId, excludeIds: exclude });
  if (!candidate) return null;

  const { data, error } = await supabase.rpc("try_drop_lore_artifact", {
    p_artifact_id: candidate.id,
  });
  if (error || !data) return null;
  return data as string;
}

export function getArtifactById(id: string) {
  return LORE_CATALOG.find((a) => a.id === id) ?? null;
}

export async function markLoreRead(artifactId: string): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  await supabase.rpc("mark_lore_read", { p_artifact_id: artifactId });
}
