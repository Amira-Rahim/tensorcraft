"use client";

import { useMemo } from "react";
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
import type { ExerciseData } from "@tensorcraft/ui";

interface LessonContentProps {
  lesson: {
    body: string;
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
}

/** MDX components available in lesson content */
const mdxComponents = {
  Dialogue,
  BridgeCallout,
  CodeBlock,
  Exercise,
  HintPanel,
  KeyTakeaways,
  LearningObjectives,
  Quiz,
};

/**
 * Renders compiled MDX content from Velite.
 * Velite's s.mdx() compiles MDX to a function body string that receives
 * { Fragment, jsx, jsxs } as arguments[0] and uses components from arguments[0].components.
 */
export function LessonContent({ lesson, exercises = [] }: LessonContentProps) {
  const exerciseMap = useMemo(() => {
    const map = new Map<string, ExerciseData>();
    for (const ex of exercises) {
      map.set(ex.slug, ex);
    }
    return map;
  }, [exercises]);

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
        return MDXDefault({ components: mdxComponents });
      };
    } catch {
      return function Fallback() {
        return (
          <p className="text-text-muted">Error rendering lesson content.</p>
        );
      };
    }
  }, [lesson.body]);

  return (
    <ExerciseDataProvider exercises={exerciseMap}>
      <div className="prose prose-invert max-w-none">
        <Content />
        {lesson.hints && <HintPanel hints={lesson.hints} />}
      </div>
    </ExerciseDataProvider>
  );
}
