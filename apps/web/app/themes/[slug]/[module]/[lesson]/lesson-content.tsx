"use client";

import { useCallback, useMemo } from "react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import {
  Dialogue,
  BridgeCallout,
  CodeBlock,
  DerivationDrawer,
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
import {
  trackCheckpointSubmitted,
  trackExerciseSubmitted,
  trackHintRequested,
} from "@/lib/analytics";

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
  visibleComponents?: Set<string>;
  onExerciseComplete?: () => void;
}

/** MDX components available in lesson content */
const mdxComponents = {
  Concept,
  Dialogue,
  BridgeCallout,
  CodeBlock,
  DerivationDrawer,
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
  visibleComponents,
  onExerciseComplete,
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
      // Dynamic import to avoid making this callback async
      import("@/lib/api-fetch").then(({ apiFetch }) => {
        apiFetch("/api/exercise-attempts", {
          method: "POST",
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
      });

      trackExerciseSubmitted(
        themeId,
        lessonId,
        result.passed,
        result.score,
        result.exerciseSlug,
      );
    },
    [themeId, lessonId],
  );

  const handleHintRevealed = useCallback(
    (hintLevel: 1 | 2 | 3) => {
      trackHintRequested(hintLevel, { themeId, lessonId });
    },
    [themeId, lessonId],
  );

  // Visibility helpers for step-based rendering
  const shouldShow = useCallback(
    (name: string) =>
      !visibleComponents ||
      visibleComponents.size === 0 ||
      visibleComponents.has(name),
    [visibleComponents],
  );
  const showProse =
    !visibleComponents ||
    visibleComponents.size === 0 ||
    visibleComponents.has("prose");

  // Build MDX components with the onSubmit handler and framework wired in
  const components = useMemo(() => {
    const wrapVisibility = <P extends object>(
      name: string,
      Component: React.ComponentType<P>,
    ) => {
      const Wrapped = (props: P) =>
        shouldShow(name) ? <Component {...props} /> : null;
      Wrapped.displayName = `Visible(${name})`;
      return Wrapped;
    };

    const base: Record<
      string,
      React.ComponentType</* eslint-disable-line @typescript-eslint/no-explicit-any */ any>
    > = {
      Concept: wrapVisibility("Concept", Concept),
      Dialogue: wrapVisibility("Dialogue", Dialogue),
      CodeBlock: wrapVisibility("CodeBlock", CodeBlock),
      HintPanel: (props: { hints: unknown }) =>
        shouldShow("HintPanel") ? (
          <HintPanel
            {...(props as { hints: undefined })}
            onHintRevealed={handleHintRevealed}
          />
        ) : null,
      InteractiveDemo: wrapVisibility("InteractiveDemo", InteractiveDemo),
      KeyTakeaways: wrapVisibility("KeyTakeaways", KeyTakeaways),
      LearningObjectives: wrapVisibility(
        "LearningObjectives",
        LearningObjectives,
      ),
      MathBlock: wrapVisibility("MathBlock", MathBlock),
      NextLesson: wrapVisibility("NextLesson", NextLesson),
      Quiz: (props: React.ComponentProps<typeof Quiz>) =>
        shouldShow("Quiz") ? (
          <Quiz
            {...props}
            onSubmit={(result) => {
              trackCheckpointSubmitted(result.passed, result.attempts, {
                themeId,
                lessonId,
              });
              props.onSubmit?.(result);
            }}
          />
        ) : null,
      RecallPrompt: wrapVisibility("RecallPrompt", RecallPrompt),
      BridgeCallout: (props: { bridge: unknown }) =>
        shouldShow("BridgeCallout") ? (
          <BridgeCallout
            {...(props as { bridge: undefined })}
            userFramework={userFramework}
          />
        ) : null,
    };

    // Derive the optional bridge-hint payload from lesson.concept.bridge
    // so the Exercise can surface the FE↔ML reminder without reading
    // frontmatter itself.
    const bridgeHint = lesson.concept.bridge
      ? {
          feTitle: lesson.concept.bridge.feTitle,
          mlTitle: lesson.concept.bridge.mlTitle,
          tier: lesson.concept.bridge.tier,
        }
      : undefined;

    if (themeId && lessonId) {
      base.Exercise = (props: { slug: string }) =>
        shouldShow("Exercise") ? (
          <Exercise
            {...props}
            bridge={bridgeHint}
            onSubmit={(result: ExerciseSubmitResult) => {
              handleExerciseSubmit(result);
              if (result.passed) {
                onExerciseComplete?.();
              }
            }}
          />
        ) : null;
    } else {
      base.Exercise = (props: { slug: string }) =>
        shouldShow("Exercise") ? (
          <Exercise {...props} bridge={bridgeHint} />
        ) : null;
    }

    base.Section = (props: { name: string; children: React.ReactNode }) =>
      shouldShow(props.name) ? <div>{props.children}</div> : null;

    return base;
  }, [
    themeId,
    lessonId,
    handleExerciseSubmit,
    handleHintRevealed,
    userFramework,
    shouldShow,
    onExerciseComplete,
    lesson.concept.bridge,
  ]);

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
      <div
        className="max-w-none lesson-prose lesson-step-content"
        data-show-prose={showProse ? "true" : "false"}
      >
        <Content />
        {shouldShow("HintPanel") && lesson.hints && (
          <HintPanel hints={lesson.hints} onHintRevealed={handleHintRevealed} />
        )}
      </div>
    </ExerciseDataProvider>
  );
}
