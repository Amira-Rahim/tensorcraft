import { notFound } from "next/navigation";
import {
  getWorldLessons,
  getModule,
  getLessonExercises,
} from "@tensorcraft/content";
import { LessonDesignPreview } from "@/app/worlds/[slug]/[module]/[lesson]/lesson-steps";
import { ResponsiveLessonPreview } from "./responsive-preview";

const phases = [
  "briefing",
  "concept",
  "challenge",
  "takeaways",
  "epilogue",
] as const;

export default async function DeepOrbitDesignPreview({
  searchParams,
}: {
  searchParams: Promise<{
    lesson?: string;
    phase?: string;
    viewport?: string;
    embedded?: string;
  }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();
  const query = await searchParams;
  const lessons = getWorldLessons("deep-orbit");
  const lesson =
    lessons.find((item) => item.slug === query.lesson) ?? lessons[0]!;
  const phase = phases.find((item) => item === query.phase) ?? "briefing";
  const module = getModule("deep-orbit", lesson.moduleId);
  const width = [320, 768].find((size) => String(size) === query.viewport);
  const embedded = query.embedded === "1";
  const frameUrl = new URLSearchParams({
    lesson: lesson.slug,
    phase,
    embedded: "1",
  });
  return (
    <>
      {!embedded && (
        <form
          className="lesson-frame flex flex-wrap items-end gap-4 py-6 border-b border-border mb-6"
          action="/design/deep-orbit"
        >
          <label className="grid min-w-0 max-w-full gap-2 text-sm text-text-muted">
            Deep Orbit lesson
            <select
              name="lesson"
              defaultValue={lesson.slug}
              className="max-w-full min-h-11 p-2 bg-surface border border-border text-text-primary"
            >
              {lessons.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.title}
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-2 text-sm text-text-muted">
            Viewport
            <select
              name="viewport"
              defaultValue={width ? String(width) : "full"}
              className="min-h-11 p-2 bg-surface border border-border text-text-primary"
            >
              <option value="full">Full width</option>
              <option value="320">Phone: 320px</option>
              <option value="768">Tablet: 768px</option>
            </select>
          </label>
          <label className="grid gap-2 text-sm text-text-muted">
            Section
            <select
              name="phase"
              defaultValue={phase}
              className="min-h-11 p-2 bg-surface border border-border text-text-primary"
            >
              {phases.map((item) => (
                <option key={item} value={item}>
                  {item[0]!.toUpperCase() + item.slice(1)}
                </option>
              ))}
            </select>
          </label>
          <button
            className="min-h-11 px-6 bg-primary text-on-primary"
            type="submit"
          >
            Preview lesson
          </button>
        </form>
      )}
      {width && !embedded ? (
        <ResponsiveLessonPreview
          key={`${lesson.slug}:${phase}:${width}`}
          src={`/design/deep-orbit?${frameUrl}`}
          width={width}
        />
      ) : (
        <LessonDesignPreview
          key={`${lesson.slug}:${phase}`}
          lesson={lesson}
          exercises={getLessonExercises(lesson.slug)}
          moduleName={module?.title ?? lesson.moduleId}
          moduleSlug={lesson.moduleId}
          phase={phase}
        />
      )}
    </>
  );
}
