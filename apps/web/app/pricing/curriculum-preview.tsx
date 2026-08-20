import Link from "next/link";
import type { CSSProperties } from "react";
import { worlds } from "@tensorcraft/worlds";
import { LAUNCHED_WORLDS } from "@tensorcraft/shared";
import {
  getModules,
  getModuleLessons,
  getLessonTotalMinutes,
} from "@tensorcraft/content";
import { CurriculumScene } from "./curriculum-scene";

/**
 * Server-rendered module map for every launched world, shown on /pricing.
 *
 * Locked users land here via the lesson-page redirect
 * (`/pricing?locked=<slug>`) and previously saw only tier cards, a blind
 * ask. This section shows exactly what a purchase unlocks: each module's
 * title, scope, lesson count, and estimated time, with Module 1 marked
 * free. Static content, so it prerenders with the page (revalidate 3600).
 */
export function CurriculumPreview() {
  return (
    <section
      id="curriculum"
      className="px-6 pb-20 scroll-mt-24"
      data-testid="curriculum-preview"
    >
      <div className="max-w-4xl mx-auto">
        {LAUNCHED_WORLDS.map((slug) => {
          const world = worlds[slug];
          const modules = getModules(slug);
          if (!world || modules.length === 0) return null;

          return (
            <div key={slug}>
              <CurriculumScene
                primary={world.palette.primary}
                primaryLight={world.paletteLight?.primary}
              >
                <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3 text-text-primary font-mono tracking-tight">
                  What&rsquo;s Inside
                </h2>
                <p className="text-center text-sm text-text-muted font-mono uppercase tracking-wider mb-10">
                  every module in {world.displayName}, lesson by lesson
                </p>
                <ol className="border border-border divide-y divide-border list-none m-0 p-0">
                  {modules.map((mod, i) => {
                    const lessons = getModuleLessons(slug, mod.slug);
                    // Lesson + exercise minutes: the same basis as the world
                    // page's courseWorkload JSON-LD, so the visible module
                    // sums and the SEO total tell one story.
                    const minutes = lessons.reduce(
                      (sum, l) => sum + getLessonTotalMinutes(l),
                      0,
                    );
                    const isFree = i === 0;
                    return (
                      <li
                        key={mod.slug}
                        data-testid={`curriculum-module-${mod.slug}`}
                        className={`tc-curriculum-row group grid grid-cols-[2.75rem_1fr] sm:grid-cols-[4rem_1fr_auto] items-start gap-x-5 gap-y-3 px-5 py-6 transition-colors hover:bg-surface ${
                          isFree ? "bg-primary/4" : ""
                        }`}
                        // Stagger across the 1.6-2.6s window of the 3s boot
                        // (BOOT_DURATION, signal-lock.ts); consumed by the
                        // [data-boot] .tc-curriculum-row rule in globals.css.
                        style={
                          {
                            "--tc-row-delay": `${(
                              1.6 +
                              (modules.length > 1
                                ? i / (modules.length - 1)
                                : 0)
                            ).toFixed(2)}s`,
                          } as CSSProperties
                        }
                      >
                        {/* Big ghost module numeral, lights up on hover */}
                        <span
                          aria-hidden="true"
                          className={`font-mono text-3xl sm:text-4xl font-black leading-none tabular-nums tracking-tighter self-center transition-colors ${
                            isFree
                              ? "text-primary"
                              : "text-text-muted/25 group-hover:text-primary"
                          }`}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>

                        {/* Title + free badge, then description beneath */}
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                            <h3 className="font-mono text-base font-bold text-text-primary leading-snug">
                              <span className="sr-only">Module {i + 1}: </span>
                              {mod.title}
                            </h3>
                            {isFree && (
                              <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-on-primary bg-primary px-2 py-0.5">
                                Free
                              </span>
                            )}
                          </div>
                          <p className="mt-2 font-sans text-sm text-text-muted leading-relaxed">
                            {/* Plain-language summary: this preview is shown
                                before purchase, so it cannot lean on the
                                story (pre-lesson copy audit 2026-08-19). */}
                            {mod.summary}
                          </p>
                        </div>

                        {/* Meta: stacked, right-aligned on desktop; under title on mobile */}
                        <div className="col-start-2 sm:col-start-3 font-mono whitespace-nowrap sm:text-right self-center">
                          <div className="text-sm font-semibold text-text-primary tabular-nums">
                            {lessons.length} lessons
                          </div>
                          <div className="text-xs text-text-muted tabular-nums">
                            ~{minutes} min
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
                <p className="mt-4 text-center text-sm text-text-muted font-sans">
                  Module 1 is free, no account needed.{" "}
                  <Link
                    href={`/worlds/${slug}`}
                    className="text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
                  >
                    Browse the full {world.displayName} syllabus
                  </Link>
                  .
                </p>
              </CurriculumScene>
            </div>
          );
        })}
      </div>
    </section>
  );
}
