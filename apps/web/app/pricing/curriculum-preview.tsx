import Link from "next/link";
import { themes } from "@tensorcraft/themes";
import { LAUNCHED_THEMES } from "@tensorcraft/shared";
import { getModules, getModuleLessons } from "@tensorcraft/content";

/**
 * Server-rendered module map for every launched theme, shown on /pricing.
 *
 * Locked users land here via the lesson-page redirect
 * (`/pricing?locked=<slug>`) and previously saw only tier cards — a blind
 * ask. This section shows exactly what a purchase unlocks: each module's
 * title, scope, lesson count, and estimated time, with Module 1 marked
 * free. Static content, so it prerenders with the page (revalidate 3600).
 */
export function CurriculumPreview() {
  return (
    <section className="px-6 pb-20" data-testid="curriculum-preview">
      <div className="max-w-4xl mx-auto">
        {LAUNCHED_THEMES.map((slug) => {
          const theme = themes[slug];
          const modules = getModules(slug);
          if (!theme || modules.length === 0) return null;

          return (
            <div key={slug}>
              <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 text-text-primary font-mono tracking-tight">
                What You&rsquo;re Unlocking
              </h2>
              <p className="text-center text-sm text-text-muted font-mono uppercase tracking-wider mb-10">
                // every module in {theme.displayName}, lesson by lesson
              </p>
              <ol className="border border-border divide-y divide-border list-none m-0 p-0">
                {modules.map((mod, i) => {
                  const lessons = getModuleLessons(slug, mod.slug);
                  const minutes = lessons.reduce(
                    (sum, l) => sum + (l.estimatedMinutes ?? 18),
                    0,
                  );
                  const isFree = i === 0;
                  return (
                    <li
                      key={mod.slug}
                      data-testid={`curriculum-module-${mod.slug}`}
                      className={`flex flex-wrap items-baseline gap-x-4 gap-y-1 px-5 py-4 ${
                        i % 2 === 0 ? "bg-transparent" : "bg-surface/60"
                      }`}
                    >
                      <span className="font-mono text-xs text-text-muted w-9 shrink-0">
                        M{String(i + 1).padStart(2, "0")}
                      </span>
                      <span className="font-mono text-sm font-semibold text-text-primary">
                        {mod.title}
                      </span>
                      {isFree && (
                        <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-page bg-primary px-2 py-0.5">
                          Free
                        </span>
                      )}
                      <span className="font-sans text-sm text-text-muted min-w-0 flex-1 basis-48">
                        {mod.description}
                      </span>
                      <span className="font-mono text-xs text-text-muted whitespace-nowrap ml-auto">
                        {lessons.length} lessons &middot; ~{minutes} min
                      </span>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-4 text-center text-sm text-text-muted font-sans">
                Module 1 is free &mdash; no account needed.{" "}
                <Link
                  href={`/themes/${slug}`}
                  className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
                >
                  Browse the full {theme.displayName} syllabus
                </Link>
                .
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
