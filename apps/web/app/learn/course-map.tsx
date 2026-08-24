import Link from "next/link";
import { worlds } from "@tensorcraft/worlds";
import { WORLD_CONTENT } from "@tensorcraft/shared";
import {
  getModules,
  getModuleLessons,
  getLessonTotalMinutes,
} from "@tensorcraft/content";
import { ModulePatch } from "@tensorcraft/ui/module-patch";
import { patchSrc } from "@/lib/patch-art";
import { FreeLessonCtaTracker } from "@/app/components/free-lesson-cta-tracker";

/**
 * The road: Deep Orbit's real module map on /learn. Server component.
 *
 * A gateway page has to show where the door leads, so this renders the
 * actual curriculum (same @tensorcraft/content source as /pricing's
 * curriculum-preview, so the two can never drift) with each module's
 * mission patch as the emblem of the road. Module 1 is the marked door:
 * the one row that links, straight into the free first lesson.
 */
const WORLD = "deep-orbit";

// The canonical free-lesson destination, hardcoded like every call site.
const FREE_LESSON = "/worlds/deep-orbit/foundations/introduction-to-tensors";

export function CourseMap() {
  const world = worlds[WORLD];
  const modules = getModules(WORLD);
  if (!world || modules.length === 0) return null;

  return (
    <div data-testid="learn-course-map">
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-2 mb-2">
        <Link
          href={`/worlds/${WORLD}`}
          className="font-mono text-2xl md:text-3xl font-black tracking-tight text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
        >
          {world.displayName}
        </Link>
        <span className="text-base md:text-lg text-text-muted font-sans">
          {world.specialization}
        </span>
      </div>
      <p className="font-mono text-xs text-text-muted tracking-wide mb-8">
        {WORLD_CONTENT.modulesPerWorld} modules ·{" "}
        {WORLD_CONTENT.totalLessonsPerWorld} lessons · one continuous story ·
        ends with a capstone model running live in the browser
      </p>

      <ol className="border border-border divide-y divide-border list-none m-0 p-0">
        {modules.map((mod, i) => {
          const lessons = getModuleLessons(WORLD, mod.slug);
          const minutes = lessons.reduce(
            (sum, lesson) => sum + getLessonTotalMinutes(lesson),
            0,
          );
          const isFree = i === 0;
          const num = String(i + 1).padStart(2, "0");
          const patch = patchSrc(WORLD, mod.slug);
          const numeral = (
            <span className="font-mono text-2xl font-black text-text-muted/25 group-hover:text-primary transition-colors tabular-nums">
              {num}
            </span>
          );
          return (
            <li
              key={mod.slug}
              data-testid={`learn-map-module-${mod.slug}`}
              className={`group grid grid-cols-[2.75rem_1fr] sm:grid-cols-[3.5rem_1fr_auto] items-start gap-x-5 gap-y-3 px-5 py-5 transition-colors hover:bg-surface ${
                isFree ? "bg-primary/4" : ""
              }`}
            >
              {/* The module's mission patch; the numeral is the fallback for
                  a world whose patches have not shipped. */}
              <span className="self-center" aria-hidden="true">
                {patch ? (
                  <ModulePatch src={patch} size={44} fallback={numeral} />
                ) : (
                  numeral
                )}
              </span>

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
                <p className="mt-1.5 font-sans text-sm text-text-muted leading-relaxed">
                  {/* Plain-language summary: shown before purchase, so it
                      cannot lean on the story (pre-lesson copy audit). */}
                  {mod.summary}
                </p>
                {isFree && (
                  <FreeLessonCtaTracker source="learn_start_free">
                    <Link
                      href={FREE_LESSON}
                      className="inline-block mt-2 font-mono text-sm text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
                    >
                      Start here, free, no account →
                    </Link>
                  </FreeLessonCtaTracker>
                )}
              </div>

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
    </div>
  );
}
