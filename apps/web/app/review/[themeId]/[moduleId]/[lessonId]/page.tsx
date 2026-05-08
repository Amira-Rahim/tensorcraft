import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { themes } from "@tensorcraft/themes";
import { isLaunched, isValidThemeSlug } from "@tensorcraft/shared";
import { getLesson, getModule } from "@tensorcraft/content";
import { getSupabaseServerClient } from "@/lib/supabase/server";
import { hasThemePurchase } from "@/lib/progress";
import { LessonContent } from "@/app/themes/[slug]/[module]/[lesson]/lesson-content";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ themeId: string; moduleId: string; lessonId: string }>;
  searchParams: Promise<{ explored?: string }>;
}

export const metadata: Metadata = {
  title: "Review · Tensorcraft",
  robots: { index: false, follow: false },
};

export default async function ReviewLessonPage({
  params,
  searchParams,
}: Props) {
  const { themeId, moduleId, lessonId } = await params;
  const { explored } = await searchParams;
  const wasExplored = explored === "1";

  if (!isValidThemeSlug(themeId) || !isLaunched(themeId)) notFound();
  const theme = themes[themeId];
  const lesson = getLesson(themeId, moduleId, lessonId);
  const mod = getModule(themeId, moduleId);
  if (!theme || !lesson) notFound();

  const supabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect(
      `/auth?redirectTo=${encodeURIComponent(`/review/${themeId}/${moduleId}/${lessonId}`)}`,
    );
  }

  const purchased = await hasThemePurchase(user.id, themeId);
  if (!purchased) {
    redirect(`/pricing?locked=${encodeURIComponent(themeId)}`);
  }

  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--tc-bg, #181818)" }}
    >
      <div className="max-w-3xl mx-auto px-6 md:px-12 py-12">
        <header className="mb-8 pb-6 border-b border-border">
          <p className="text-[10px] font-mono uppercase tracking-[3px] text-text-muted mb-2">
            Review mode · {theme.displayName} · {mod?.title ?? moduleId}
          </p>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: theme.palette.text }}
          >
            {lesson.title}
          </h1>
          <p className="text-sm text-text-muted">
            Recall prompts, key takeaways, and the bridge — full lesson prose
            hidden. Your responses update the bandit&apos;s arm stats.
          </p>
        </header>

        <div className="lesson-prose">
          <LessonContent
            lesson={lesson}
            themeId={themeId}
            moduleId={moduleId}
            lessonId={lessonId}
            wasExplored={wasExplored}
            visibleComponents={
              new Set(["RecallPrompt", "KeyTakeaways", "BridgeCallout"])
            }
          />
        </div>

        <footer className="mt-12 flex items-center justify-between gap-4 pt-6 border-t border-border">
          <Link
            href="/review"
            className="text-xs font-mono uppercase tracking-wider text-text-muted hover:text-text-primary"
          >
            ← Back to queue
          </Link>
          <Link
            href={`/themes/${themeId}/${moduleId}/${lessonId}`}
            className="text-xs font-mono uppercase tracking-wider text-primary hover:underline"
          >
            Open full lesson →
          </Link>
        </footer>
      </div>
    </main>
  );
}
