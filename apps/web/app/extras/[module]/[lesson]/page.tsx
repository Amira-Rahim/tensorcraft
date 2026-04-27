import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import {
  getLesson,
  getLessonExercises,
  getThemeLessons,
} from "@tensorcraft/content";
import { LessonContent } from "@/app/themes/[slug]/[module]/[lesson]/lesson-content";

interface Props {
  params: Promise<{ module: string; lesson: string }>;
}

/**
 * Pre-render all extras lesson routes at build time so they ship with
 * full HTML for SEO + zero TTFB.
 */
export function generateStaticParams() {
  return getThemeLessons("shared").map((l) => ({
    module: l.moduleId,
    lesson: l.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { module: moduleSlug, lesson: lessonSlug } = await params;
  const lesson = getLesson("shared", moduleSlug, lessonSlug);
  if (!lesson) return {};
  return {
    title: `${lesson.title} — Extras | Tensorcraft`,
    description: lesson.concept.explanation,
    alternates: {
      canonical: `https://tensorcraft.app/extras/${moduleSlug}/${lessonSlug}`,
    },
    openGraph: {
      images: [
        `/api/og?title=${encodeURIComponent(lesson.title)}&theme=deep-orbit&subtitle=${encodeURIComponent("Extras — " + moduleSlug)}`,
      ],
    },
  };
}

export const revalidate = 3600;

export default async function ExtrasLessonPage({ params }: Props) {
  const { module: moduleSlug, lesson: lessonSlug } = await params;
  const lesson = getLesson("shared", moduleSlug, lessonSlug);
  if (!lesson) notFound();

  const exercises = getLessonExercises(lesson.slug);

  return (
    <main className="min-h-screen bg-page px-6 md:px-10 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "LearningResource",
              name: lesson.title,
              description: lesson.concept.explanation,
              educationalLevel: lesson.difficulty || "intermediate",
              learningResourceType: "lesson",
              timeRequired: `PT${lesson.estimatedMinutes}M`,
              isPartOf: {
                "@type": "Course",
                name: `Tensorcraft Extras — ${moduleSlug}`,
                url: `https://tensorcraft.app/extras`,
              },
              provider: { "@type": "Organization", name: "Tensorcraft" },
              url: `https://tensorcraft.app/extras/${moduleSlug}/${lessonSlug}`,
            },
            {
              "@context": "https://schema.org",
              "@type": "BreadcrumbList",
              itemListElement: [
                {
                  "@type": "ListItem",
                  position: 1,
                  name: "Home",
                  item: "https://tensorcraft.app",
                },
                {
                  "@type": "ListItem",
                  position: 2,
                  name: "Extras",
                  item: "https://tensorcraft.app/extras",
                },
                {
                  "@type": "ListItem",
                  position: 3,
                  name: moduleSlug,
                  item: `https://tensorcraft.app/extras/${moduleSlug}`,
                },
                { "@type": "ListItem", position: 4, name: lesson.title },
              ],
            },
          ]),
        }}
      />
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <div className="font-mono text-xs text-text-muted tracking-wider mb-8 flex items-center gap-2">
          <Link href="/extras" className="hover:text-primary transition-colors">
            Extras
          </Link>
          <span>/</span>
          <span>{moduleSlug}</span>
          <span>/</span>
          <span className="text-text-primary">{lesson.slug}</span>
        </div>

        {/* Companion banner */}
        <div className="font-mono text-[11px] text-primary uppercase tracking-[0.2em] mb-3">
          // companion content · math depth
        </div>

        <h1 className="text-3xl md:text-4xl font-mono font-black tracking-tight text-text-primary mb-4">
          {lesson.title}
        </h1>
        <p className="text-base text-text-muted font-sans leading-relaxed mb-10">
          {lesson.concept.explanation}
        </p>

        {/* Reuse the same MDX renderer the main lesson path uses. */}
        <LessonContent
          lesson={lesson as Parameters<typeof LessonContent>[0]["lesson"]}
          exercises={exercises}
          themeId="shared"
          lessonId={lesson.slug}
        />

        <div className="mt-16">
          <Link
            href="/extras"
            className="rounded-none inline-flex items-center px-7 py-3 border-2 border-border text-text-primary font-mono font-bold text-xs tracking-wider uppercase hover:text-primary hover:border-primary/30 transition-all"
          >
            &larr; All Extras
          </Link>
        </div>
      </div>
    </main>
  );
}
