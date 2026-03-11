import { notFound } from "next/navigation";
import Link from "next/link";
import { themes } from "@tensorcraft/themes";
import {
  getLesson,
  getAdjacentLessons,
  getModuleLessons,
} from "@tensorcraft/content";
import { LessonContent } from "./lesson-content";
import type { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string; module: string; lesson: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, module: moduleSlug, lesson: lessonSlug } = await params;
  const lesson = getLesson(slug, moduleSlug, lessonSlug);
  const theme = themes[slug];
  if (!lesson || !theme) return {};
  return {
    title: `${lesson.title} — ${theme.displayName} | Tensorcraft`,
    description: lesson.concept.explanation,
  };
}

export default async function LessonPage({ params }: Props) {
  const { slug, module: moduleSlug, lesson: lessonSlug } = await params;
  const theme = themes[slug];
  const lesson = getLesson(slug, moduleSlug, lessonSlug);
  if (!theme || !lesson) notFound();

  const { prev, next } = getAdjacentLessons(lesson);
  const moduleLessons = getModuleLessons(slug, moduleSlug);

  return (
    <main
      className="min-h-screen"
      style={{ background: "var(--tc-bg, #080B16)" }}
    >
      <div className="flex">
        {/* Sidebar — lesson navigation */}
        <aside
          className="hidden lg:flex flex-col w-64 min-h-screen p-5 sticky top-0 overflow-y-auto"
          style={{
            background: theme.palette.surface,
            borderRight: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <Link
            href={`/themes/${slug}/${moduleSlug}`}
            className="text-xs mb-6 inline-flex items-center gap-1"
            style={{ color: "var(--tc-muted, #8B92A5)" }}
          >
            ← Back to module
          </Link>

          <nav className="flex flex-col gap-1">
            {moduleLessons.map((l) => {
              const isActive = l.slug === lessonSlug;
              return (
                <Link
                  key={l.slug}
                  href={`/themes/${slug}/${moduleSlug}/${l.slug}`}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors"
                  style={{
                    background: isActive
                      ? "rgba(255,255,255,0.06)"
                      : "transparent",
                    color: isActive ? theme.palette.text : theme.palette.muted,
                  }}
                >
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-medium flex-shrink-0"
                    style={{
                      background: isActive
                        ? theme.palette.accent
                        : "rgba(255,255,255,0.06)",
                      color: isActive ? "#000" : theme.palette.muted,
                    }}
                  >
                    {l.order}
                  </span>
                  <span className="truncate">{l.title}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        {/* Main content */}
        <div className="flex-1 max-w-3xl mx-auto px-6 py-12">
          {/* Breadcrumb */}
          <div
            className="flex items-center gap-2 text-xs mb-8"
            style={{ color: "var(--tc-muted, #8B92A5)" }}
          >
            <Link href={`/themes/${slug}`} className="hover:underline">
              {theme.displayName}
            </Link>
            <span>/</span>
            <Link
              href={`/themes/${slug}/${moduleSlug}`}
              className="hover:underline"
            >
              {moduleSlug}
            </Link>
            <span>/</span>
            <span style={{ color: theme.palette.text }}>{lesson.title}</span>
          </div>

          {/* Lesson header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-xs" style={{ color: theme.palette.accent }}>
                {theme.terminology.lesson} {lesson.order}
              </span>
              <span
                className="text-xs"
                style={{ color: "var(--tc-muted, #8B92A5)" }}
              >
                {lesson.estimatedMinutes} min
              </span>
            </div>
            <h1
              className="text-3xl font-bold mb-4"
              style={{ color: theme.palette.text }}
            >
              {lesson.title}
            </h1>
          </div>

          {/* 5C Loop: Context */}
          <section className="mb-8">
            <LessonContent lesson={lesson} />
          </section>

          {/* 5C Loop: Consequence */}
          <section
            className="rounded-xl p-5 my-8"
            style={{
              background: theme.palette.surface,
              borderLeft: `3px solid ${theme.palette.accent}`,
            }}
          >
            <h3
              className="text-xs uppercase tracking-widest mb-2"
              style={{ color: theme.palette.accent }}
            >
              Consequence
            </h3>
            <p
              className="text-sm leading-relaxed"
              style={{ color: "rgba(255,255,255,0.8)" }}
            >
              {lesson.consequence.narrative}
            </p>
            {lesson.consequence.nextLessonTeaser && (
              <p
                className="text-xs mt-2 italic"
                style={{ color: "var(--tc-muted, #8B92A5)" }}
              >
                {lesson.consequence.nextLessonTeaser}
              </p>
            )}
          </section>

          {/* Navigation */}
          <nav
            className="flex items-center justify-between mt-12 pt-6"
            style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
          >
            {prev ? (
              <Link
                href={`/themes/${slug}/${moduleSlug}/${prev.slug}`}
                className="text-sm"
                style={{ color: "var(--tc-muted, #8B92A5)" }}
              >
                ← {prev.title}
              </Link>
            ) : (
              <span />
            )}
            {next ? (
              <Link
                href={`/themes/${slug}/${moduleSlug}/${next.slug}`}
                className="text-sm font-medium px-4 py-2 rounded-full"
                style={{ background: theme.palette.accent, color: "#000" }}
              >
                Next: {next.title} →
              </Link>
            ) : (
              <Link
                href={`/themes/${slug}/${moduleSlug}`}
                className="text-sm font-medium px-4 py-2 rounded-full"
                style={{ background: theme.palette.accent, color: "#000" }}
              >
                Module Complete ✓
              </Link>
            )}
          </nav>
        </div>
      </div>
    </main>
  );
}
