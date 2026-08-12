"use client";

import {
  GlossaryProvider,
  useGlossary,
} from "@/app/worlds/[slug]/[module]/[lesson]/glossary-context";
import { GlossaryRail } from "@/app/worlds/[slug]/[module]/[lesson]/glossary-rail";
import { LessonContent } from "@/app/worlds/[slug]/[module]/[lesson]/lesson-content";

type LessonContentProps = Parameters<typeof LessonContent>[0];

interface ExtrasLessonBodyProps {
  lesson: LessonContentProps["lesson"] & {
    glossaryTerms?: Array<{ term: string; definition: string }>;
  };
  exercises: LessonContentProps["exercises"];
  lessonId: string;
}

/* Extras lessons render as one column, so the glossary sits below the prose
   as an appendix instead of the sidebar rail the world reader uses. Clicking
   an underlined term in the prose highlights its entry here via the shared
   glossary context, same as the world path. */
function Body({ lesson, exercises, lessonId }: ExtrasLessonBodyProps) {
  const { activeTerm } = useGlossary();
  return (
    <>
      <LessonContent
        lesson={lesson}
        exercises={exercises}
        worldId="shared"
        lessonId={lessonId}
        glossaryTerms={lesson.glossaryTerms}
      />
      {(lesson.glossaryTerms?.length ?? 0) > 0 && (
        <div className="mt-16 border-t border-border pt-8">
          <GlossaryRail
            terms={lesson.glossaryTerms ?? []}
            activeTerm={activeTerm}
          />
        </div>
      )}
    </>
  );
}

export function ExtrasLessonBody(props: ExtrasLessonBodyProps) {
  return (
    <GlossaryProvider>
      <Body {...props} />
    </GlossaryProvider>
  );
}
