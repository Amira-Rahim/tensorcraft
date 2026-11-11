import Link from "next/link";
import { getModule, getModuleLessons } from "@tensorcraft/content";
import { isLaunched } from "@tensorcraft/shared";
import { GUIDES } from "@/lib/guides";

interface Props {
  worldSlug: string;
  moduleSlug: string;
  lessonSlug: string;
}

/** Public references after the lesson reader, available without opening a drawer. */
export function FreeModuleNavigation({
  worldSlug,
  moduleSlug,
  lessonSlug,
}: Props) {
  const module = getModule(worldSlug, moduleSlug);
  if (!isLaunched(worldSlug) || !module || module.order !== 1) return null;

  const lessons = getModuleLessons(worldSlug, moduleSlug);
  const guide =
    worldSlug === "deep-orbit" && lessonSlug === "tensor-shapes"
      ? GUIDES.find(
          (entry) => entry.slug === "tensorflow-js-reshape-vs-transpose",
        )
      : null;
  const headingId = `free-lessons-${worldSlug}-${moduleSlug}`;

  return (
    <footer className="lesson-frame border-t border-border py-8">
      <nav aria-labelledby={headingId}>
        <h2 id={headingId} className="font-mono text-sm font-semibold">
          Free lessons in {module.title}
        </h2>
        <ol className="mt-4 grid list-decimal gap-x-8 gap-y-2 pl-5 sm:grid-cols-2 lg:grid-cols-3">
          {lessons.map((lesson) => (
            <li key={lesson.slug} className="pl-1">
              <Link
                href={`/worlds/${worldSlug}/${moduleSlug}/${lesson.slug}`}
                aria-current={lesson.slug === lessonSlug ? "page" : undefined}
                className={`inline-flex min-h-11 items-center text-sm underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 ${
                  lesson.slug === lessonSlug
                    ? "font-semibold text-text-primary"
                    : "text-text-muted hover:text-text-primary"
                }`}
              >
                {lesson.title}
              </Link>
            </li>
          ))}
        </ol>
      </nav>
      {guide && (
        <p className="mt-6 text-sm leading-relaxed text-text-muted">
          Related guide:{" "}
          <Link
            href={guide.path}
            className="inline-flex min-h-11 items-center text-primary underline underline-offset-4 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
          >
            {guide.title}
          </Link>
        </p>
      )}
    </footer>
  );
}
