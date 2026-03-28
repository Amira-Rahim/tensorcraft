"use client";

import { useCallback, useMemo } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import {
  Dialogue,
  BridgeCallout,
  CodeBlock,
  Exercise,
  ExerciseDataProvider,
  HintPanel,
  KeyTakeaways,
  LearningObjectives,
  Quiz,
} from "@tensorcraft/ui";
import {
  Concept,
  InteractiveDemo,
  MathBlock,
  NextLesson,
  RecallPrompt,
} from "@/app/components/mdx";
import type { ExerciseData, ExerciseSubmitResult } from "@tensorcraft/ui";

import type { Framework } from "@tensorcraft/shared";
import { trackExerciseSubmitted } from "@/lib/analytics";

interface LessonContentProps {
  lesson: {
    body: string;
    skillAxes?: string[];
    hints?: Array<{
      level: "nudge" | "guidance" | "solution";
      content: string;
    }>;
    concept: {
      explanation: string;
      bridge?: {
        feTitle: string;
        feCode: string;
        mlTitle: string;
        mlCode: string;
        tier: "identity" | "structural" | "intuition";
      };
    };
  };
  exercises?: ExerciseData[];
  themeId?: string;
  lessonId?: string;
  userFramework?: Framework;
}

/** MDX components available in lesson content */
const mdxComponents = {
  Concept,
  Dialogue,
  BridgeCallout,
  CodeBlock,
  Exercise,
  HintPanel,
  InteractiveDemo,
  KeyTakeaways,
  LearningObjectives,
  MathBlock,
  NextLesson,
  Quiz,
  RecallPrompt,
};

/**
 * Renders compiled MDX content from Velite.
 * Velite's s.mdx() compiles MDX to a function body string that receives
 * { Fragment, jsx, jsxs } as arguments[0] and uses components from arguments[0].components.
 */
export function LessonContent({
  lesson,
  exercises = [],
  themeId,
  lessonId,
  userFramework,
}: LessonContentProps) {
  const exerciseMap = useMemo(() => {
    const map = new Map<string, ExerciseData>();
    for (const ex of exercises) {
      map.set(ex.slug, ex);
    }
    return map;
  }, [exercises]);

  const handleExerciseSubmit = useCallback(
    (result: ExerciseSubmitResult) => {
      if (!themeId || !lessonId) return;

      // Fire-and-forget — don't block the UI on persistence
      fetch("/api/exercise-attempts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          themeId,
          lessonId,
          exerciseSlug: result.exerciseSlug,
          submittedCode: result.code,
          passed: result.passed,
          score: result.score,
          solutionViewed: result.solutionViewed,
        }),
      }).catch(() => {
        // Silently ignore — attempt recording is best-effort.
        // The user can still use the exercise without auth.
      });

      trackExerciseSubmitted(themeId, lessonId, result.passed, result.score);
    },
    [themeId, lessonId],
  );

  // Build MDX components with the onSubmit handler and framework wired in
  const components = useMemo(() => {
    const base = {
      ...mdxComponents,
      BridgeCallout: (props: { bridge: unknown }) => (
        <BridgeCallout
          {...(props as { bridge: undefined })}
          userFramework={userFramework}
        />
      ),
    };
    if (!themeId || !lessonId) return base;
    return {
      ...base,
      Exercise: (props: { slug: string }) => (
        <Exercise {...props} onSubmit={handleExerciseSubmit} />
      ),
    };
  }, [themeId, lessonId, handleExerciseSubmit, userFramework]);

  const Content = useMemo(() => {
    try {
      // Velite compiles MDX to: `const{Fragment,jsx,jsxs}=arguments[0]; ... return{default:fn}`
      // MDX body may reference `frontmatter` for data like bridge props.
      // We inject it as a variable via a wrapper function.
      const fnBody = `var frontmatter = arguments[1];\n${lesson.body}`;
      const fn = new Function(fnBody);
      const frontmatter = { concept: lesson.concept, hints: lesson.hints };
      const mod = fn({ Fragment, jsx, jsxs }, frontmatter) as {
        default: (props: {
          components?: Record<string, unknown>;
        }) => React.ReactNode;
      };
      const MDXDefault = mod.default;
      return function MDXContent() {
        return MDXDefault({ components });
      };
    } catch {
      return function Fallback() {
        return (
          <p className="text-text-muted">Error rendering lesson content.</p>
        );
      };
    }
  }, [lesson.body, lesson.concept, lesson.hints, components]);

  return (
    <ExerciseDataProvider exercises={exerciseMap}>
      <div className="max-w-none">
        <Content />
        {lesson.hints && <HintPanel hints={lesson.hints} />}
      </div>
    </ExerciseDataProvider>
  );
}
