// apps/api/src/lib/dispatch.ts
//
// DISPATCH inbox producer. Migration 029 shipped dispatch_messages plus
// RPCs with "writes come from triggers or scheduled functions", and then
// nothing ever wrote: the inbox route was live but permanently empty, so
// the nav link stayed hidden (2026-07-13 audit). This is the missing
// writer. The progress route calls it fire-and-forget when a lesson
// completes; it sends a milestone message when that completion closes out
// a module, and a second one when it closes out the whole theme.
//
// Module sizes come from getModuleLessonCount() in @tensorcraft/shared
// (the API cannot import the content package); the constant is pinned to
// the real MDX corpus by packages/content/__tests__/module-counts.test.ts.

import { getSupabaseAdminClient } from "@tensorcraft/supabase";
import {
  getModuleLessonCount,
  getThemeTotalLessons,
} from "@tensorcraft/shared";
import { logger } from "./logger";

function titleCase(slug: string): string {
  return slug
    .split("-")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

async function fireOnce(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  userId: string,
  subject: string,
  bodyMdx: string,
  ctaLabel: string,
  ctaHref: string,
): Promise<boolean> {
  // Dedup on (user, subject): re-completing the last lesson of a module
  // must not double-send. Subjects are deterministic per milestone.
  const { data: existing, error: readErr } = await supabase
    .from("dispatch_messages")
    .select("id")
    .eq("user_id", userId)
    .eq("subject", subject)
    .limit(1);
  if (readErr) throw new Error(`dispatch dedup read: ${readErr.message}`);
  if ((existing ?? []).length > 0) return false;

  const { error } = await supabase.rpc("dispatch_milestone", {
    p_user_id: userId,
    p_subject: subject,
    p_body_mdx: bodyMdx,
    p_cta_label: ctaLabel,
    p_cta_href: ctaHref,
  });
  if (error) throw new Error(`dispatch_milestone rpc: ${error.message}`);
  return true;
}

/**
 * Fire milestone inbox messages earned by a lesson completion. Call only
 * on a genuine not-completed → completed transition; the caller owns that
 * check, this function owns idempotence (subject dedup) after it.
 */
export async function fireMilestonesForCompletion(params: {
  userId: string;
  themeId: string;
  moduleId: string;
}): Promise<void> {
  const { userId, themeId, moduleId } = params;
  const supabase = getSupabaseAdminClient();

  const { data: rows, error } = await supabase
    .from("theme_progress")
    .select("module_id")
    .eq("user_id", userId)
    .eq("theme_id", themeId)
    .eq("status", "completed");
  if (error) throw new Error(`dispatch producer read: ${error.message}`);

  const completed = rows ?? [];
  const completedInModule = completed.filter(
    (r) => r.module_id === moduleId,
  ).length;

  if (completedInModule === getModuleLessonCount(themeId, moduleId)) {
    const moduleTitle = titleCase(moduleId);
    const sent = await fireOnce(
      supabase,
      userId,
      `DISPATCH · module cleared: ${moduleTitle}`,
      `Operator. Every lesson in ${moduleTitle} reads complete on my board. I logged the clearance the moment it happened; the next module was already listening.`,
      "Open the mission map",
      `/themes/${themeId}`,
    );
    if (sent) {
      logger.info(
        { source: "dispatch.producer", userId, themeId, moduleId },
        "module milestone sent",
      );
    }
  }

  if (completed.length === getThemeTotalLessons(themeId)) {
    const sent = await fireOnce(
      supabase,
      userId,
      `DISPATCH · board clear: ${titleCase(themeId)}`,
      `All ${getThemeTotalLessons(themeId)} lessons read complete. No open items anywhere on my board. The capstone model is yours to keep, and the certificate desk already knows your name.`,
      "Back to the dashboard",
      "/dashboard",
    );
    if (sent) {
      logger.info(
        { source: "dispatch.producer", userId, themeId },
        "theme milestone sent",
      );
    }
  }
}
