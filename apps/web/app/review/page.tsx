import { redirect } from "next/navigation";
import { themes } from "@tensorcraft/themes";
import { getLesson, getModule } from "@tensorcraft/content";
import { isValidThemeSlug, isLaunched } from "@tensorcraft/shared";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import { ReviewQueueView, type ReviewCard } from "./review-queue";

export const metadata: Metadata = {
  title: "Review queue | Tensorcraft",
  description:
    "Spaced-recall review queue powered by ε-greedy bandit selection.",
  robots: { index: false, follow: false },
};

export default async function ReviewPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth");

  const { data: purchaseRows } = await supabase
    .from("purchases")
    .select("theme_ids")
    .eq("user_id", user.id)
    .eq("status", "completed");

  const ownedThemes = new Set<string>();
  for (const row of purchaseRows ?? []) {
    if (!Array.isArray(row.theme_ids)) continue;
    for (const slug of row.theme_ids) {
      if (isValidThemeSlug(slug) && isLaunched(slug)) ownedThemes.add(slug);
    }
  }

  const themeList = Array.from(ownedThemes);

  const queues = await Promise.all(
    themeList.map(async (themeId) => {
      const { data } = await supabase.rpc("get_review_queue", {
        p_theme_id: themeId,
        p_limit: 5,
      });
      return { themeId, rows: data ?? [] };
    }),
  );

  const cards: ReviewCard[] = [];
  for (const { themeId, rows } of queues) {
    const theme = themes[themeId as keyof typeof themes];
    if (!theme) continue;
    for (const row of rows) {
      const lesson = getLesson(themeId, row.module_id, row.lesson_id);
      const mod = getModule(themeId, row.module_id);
      cards.push({
        themeId,
        themeName: theme.displayName,
        themePrimary: theme.palette.primary,
        moduleId: row.module_id,
        moduleName: mod?.title ?? row.module_id,
        lessonId: row.lesson_id,
        lessonTitle: lesson?.title ?? row.lesson_id,
        armPulls: row.arm_pulls,
        armSuccesses: row.arm_successes,
        lastReviewedAt: row.last_reviewed_at,
        wasExplored: row.was_explored,
      });
    }
  }

  return (
    <ReviewQueueView cards={cards} hasOwnedThemes={themeList.length > 0} />
  );
}
