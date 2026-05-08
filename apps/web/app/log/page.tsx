import { redirect } from "next/navigation";
import { themes } from "@tensorcraft/themes";
import { getThemeLessons } from "@tensorcraft/content";
import {
  isValidThemeSlug,
  isLaunched,
  LAUNCHED_THEMES,
} from "@tensorcraft/shared";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { fetchOperatorLog } from "@/lib/operator-log";
import type { Metadata } from "next";
import { LogView } from "./log-view";

export const metadata: Metadata = {
  title: "Operator log | Tensorcraft",
  description:
    "Cross-theme regret summary, exploration ratio, and strategic-decision retrospective.",
  robots: { index: false, follow: false },
};

export default async function LogPage() {
  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth?redirectTo=/log");

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

  // Free tier: include any launched theme even without purchase, so the
  // log surface always renders something for authenticated users (Module 1
  // is free across all themes).
  const includedThemeIds = Array.from(
    new Set<string>([...ownedThemes, ...LAUNCHED_THEMES]),
  );

  const totalLessonsByTheme: Record<string, number> = {};
  for (const themeId of includedThemeIds) {
    totalLessonsByTheme[themeId] = getThemeLessons(themeId).length;
  }

  const summary = await fetchOperatorLog(supabase, {
    userId: user.id,
    ownedThemeIds: includedThemeIds,
    totalLessonsByTheme,
  });

  const themeMeta = includedThemeIds.map((id) => ({
    id,
    displayName: themes[id as keyof typeof themes]?.displayName ?? id,
    primary: themes[id as keyof typeof themes]?.palette.primary ?? "#7B68EE",
    owned: ownedThemes.has(id),
    totalLessons: totalLessonsByTheme[id],
  }));

  return <LogView summary={summary} themes={themeMeta} />;
}
