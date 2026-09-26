"use client";

import { createContext, useCallback, useContext, useMemo } from "react";
import dynamic from "next/dynamic";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import {
  AnimatedAvatar,
  Dialogue,
  BridgeCallout,
  CodeBlock,
  DerivationDrawer,
  ExerciseDataProvider,
  GlossaryTerm,
  HintPanel,
  KeyTakeaways,
  LearningObjectives,
  LessonRecap,
  Quiz,
} from "@tensorcraft/ui";
import { portraitSources, resolveCharacter } from "@/lib/character-art";
import { useActivityUser } from "@/app/components/learning-activity-scope";

// Round-12 perf fix: the `Exercise` component pulls in the full Sandpack
// runtime + editor (~300 KB gzipped). Loading it dynamically with
// `ssr: false` keeps it out of the lesson's initial chunk and defers the
// fetch until the learner reaches the Challenge step.
const Exercise = dynamic(
  () => import("@tensorcraft/ui").then((m) => ({ default: m.Exercise })),
  {
    ssr: false,
    loading: () => (
      <div className="my-8 border border-border bg-surface rounded-none p-6 text-xs font-mono text-text-muted uppercase tracking-wider">
        Loading editor…
      </div>
    ),
  },
);
import {
  BossBeat,
  StoryConsequence,
  Concept,
  ConceptReference,
  DeepScanDemo,
  DispatchTease,
  InteractiveDemo,
  ChannelLayoutExperiment,
  LearningExperiment,
  MathBlock,
  NextLesson,
  RecallPrompt,
  StrategyThread,
  TransferAssignment,
  DecisionTask,
  IndependentProject,
  ProjectMilestone,
} from "@/app/components/mdx";
import type { ExerciseData, ExerciseSubmitResult } from "@tensorcraft/ui";

import {
  trackCheckpointSubmitted,
  trackExerciseSubmitted,
  trackHintRequested,
  trackRecallAnswered,
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
        jsTitle: string;
        jsCode: string;
        mlTitle: string;
        mlCode: string;
        tier: "identity" | "structural" | "intuition";
      };
    };
  };
  exercises?: ExerciseData[];
  worldId?: string;
  moduleId?: string;
  lessonId?: string;
  visibleComponents?: Set<string>;
  storyRegister?: boolean;
  /**
   * "reading" keeps prose and companion cards in one reading column.
   * Only the Concept step passes it.
   */
  layout?: "reading";
  onExerciseComplete?: (exerciseSlug: string, score: number) => void;
  /**
   * Fires on EVERY graded run (pass, fail, crash, timeout), unlike
   * onExerciseComplete which fires only on a pass. The step machine
   * counts these into world_progress.attempts.
   */
  onExerciseAttempt?: (result: ExerciseSubmitResult) => void;
  /** Mirrors hint reveals up to the step machine's per-lesson counter. */
  onHintRevealed?: (hintLevel: 1 | 2 | 3) => void;
  /**
   * Reads the step machine's distinct-hint-levels count at submit time,
   * so the attempts POST can carry it. A callback, not a number: hints
   * reveal in the LEFT column instance while the exercise submits from
   * the RIGHT pane instance, and a prop value would be stale.
   */
  getHintsUsed?: () => number;
  glossaryTerms?: Array<{ term: string; definition: string }>;
  /**
   * XS renderer slice (fresh-eyes rerun §4/T1-16): prose visibility is a
   * single boolean, so all 56 lessons rendered the task brief ("## Challenge"
   * onward - "Now it's your turn…") on Briefing/Concept/Code, BEFORE the
   * teaching. When true, a CSS rule hides the Challenge heading and every
   * following sibling. CSS-only by design: the full prose partition is
   * deliberately deferred until real completion data exists (ledger §4
   * counter-argument; the last structural renderer change was reverted).
   */
  hideChallengeOnward?: boolean;
  /**
   * Prose partition (2026-09-04 audit step 2): hides the teaching body
   * (first top-level heading onward) so the Briefing renders the story
   * zone only. CSS-anchored like hideChallengeOnward.
   */
  hideTeaching?: boolean;
  /**
   * The Concept-step mirror of hideTeaching: hides the story zone
   * (everything before the first top-level heading) so the opening scene
   * does not double-render on the read step, while mid-lesson story
   * beats after headings stay (re-audit 2026-09-04).
   */
  hideStoryZone?: boolean;
  /**
   * Consequence only: re-reveals the post-recap story zone (the
   * paragraphs and DISPATCH blockquotes after LessonRecap), anchored on
   * the marker the hidden LessonRecap leaves behind. Without it those
   * beats rendered mid-Challenge or nowhere (re-audit 2026-09-04).
   */
  showPostRecap?: boolean;
}

/**
 * True while rendering inside an <Epilogue> block. Components nested in an
 * epilogue bypass the per-name visibility filter, the Epilogue wrapper
 * itself is the gate. This is what lets a closing scene (prose + Dialogue)
 * live in the MDX body but render only on the Consequence step, instead of
 * leaking into Briefing (which shows Dialogue) and Concept (which shows
 * prose).
 */
const EpilogueContext = createContext(false);

/** MDX components available in lesson content */
const mdxComponents = {
  DecisionTask,
  IndependentProject,
  ProjectMilestone,
  BossBeat,
  StoryConsequence,
  Concept,
  ConceptReference,
  Dialogue,
  BridgeCallout,
  CodeBlock,
  DerivationDrawer,
  DispatchTease,
  Exercise,
  HintPanel,
  InteractiveDemo,
  ChannelLayoutExperiment,
  LearningExperiment,
  KeyTakeaways,
  LearningObjectives,
  MathBlock,
  NextLesson,
  Quiz,
  RecallPrompt,
  StrategyThread,
  TransferAssignment,
};

/**
 * Renders compiled MDX content from Velite.
 * Velite's s.mdx() compiles MDX to a function body string that receives
 * { Fragment, jsx, jsxs } as arguments[0] and uses components from arguments[0].components.
 */
export function LessonContent({
  lesson,
  exercises = [],
  worldId,
  moduleId,
  lessonId,
  visibleComponents,
  storyRegister,
  layout,
  onExerciseComplete,
  onExerciseAttempt,
  onHintRevealed,
  getHintsUsed,
  glossaryTerms,
  hideChallengeOnward,
  hideTeaching,
  hideStoryZone,
  showPostRecap,
}: LessonContentProps) {
  const draftOwner = useActivityUser();
  // Map canonical term -> entry, for the span override to look up definitions.
  // Memoized on the (stable) glossaryTerms array so the components map below
  // does not rebuild (and remount the MDX subtree) every render.
  const glossaryByTerm = useMemo(() => {
    const map = new Map<string, { term: string; definition: string }>();
    for (const g of glossaryTerms ?? []) map.set(g.term, g);
    return map;
  }, [glossaryTerms]);

  const exerciseMap = useMemo(() => {
    const map = new Map<string, ExerciseData>();
    for (const ex of exercises) {
      map.set(ex.slug, ex);
    }
    return map;
  }, [exercises]);

  const handleExerciseSubmit = useCallback(
    (result: ExerciseSubmitResult) => {
      if (!worldId || !lessonId) return;

      onExerciseAttempt?.(result);
      const hintsUsed = getHintsUsed?.();

      // Fire-and-forget, don't block the UI on persistence
      // Dynamic import to avoid making this callback async
      import("@/lib/api-fetch").then(({ apiFetch }) => {
        apiFetch("/api/exercise-attempts", {
          method: "POST",
          body: JSON.stringify({
            worldId,
            lessonId,
            exerciseSlug: result.exerciseSlug,
            submittedCode: result.code,
            passed: result.passed,
            score: result.score,
            solutionViewed: result.solutionViewed,
            hintsUsed,
            durationMs: result.durationMs,
          }),
        }).catch(() => {
          // Silently ignore, attempt recording is best-effort.
          // The user can still use the exercise without auth.
        });
      });

      // Passed exercises also commit to the learner's tensorcraft-<world>
      // repo. Best-effort like the attempt record: the server answers with
      // a structured error when GitHub is not connected, and Settings'
      // retroactive push backfills anything missed here.
      if (result.passed) {
        import("@/lib/github-commit")
          .then(({ commitExerciseArtifact }) => {
            commitExerciseArtifact({
              worldId,
              lessonId,
              moduleId,
              // Filename key: two-exercise lessons must not overwrite each
              // other's artifact.
              exerciseSlug: result.exerciseSlug,
              code: result.code,
            });
          })
          .catch(() => {
            // Chunk-load failure: same best-effort contract as the call.
          });
      }

      trackExerciseSubmitted(
        worldId,
        lessonId,
        result.passed,
        result.score,
        result.exerciseSlug,
        hintsUsed,
        result.durationMs,
        result.errored,
      );
    },
    [worldId, lessonId, moduleId, onExerciseAttempt, getHintsUsed],
  );

  const handleHintRevealed = useCallback(
    (hintLevel: 1 | 2 | 3) => {
      onHintRevealed?.(hintLevel);
      trackHintRequested(hintLevel, { worldId, lessonId });
    },
    [worldId, lessonId, onHintRevealed],
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
  // "challenge" re-reveals the challenge zone when prose is hidden (the
  // Challenge step's left column: brief + hints without the re-read).
  const showChallenge =
    !showProse && (visibleComponents?.has("challenge") ?? false);

  // Build MDX components with the onSubmit handler and framework wired in
  const components = useMemo(() => {
    const wrapVisibility = <P extends object>(
      name: string,
      Component: React.ComponentType<P>,
    ) => {
      const Wrapped = (props: P) => {
        // Inside an <Epilogue>, the epilogue wrapper is the visibility gate;
        // nested components render unconditionally.
        const insideEpilogue = useContext(EpilogueContext);
        return insideEpilogue || shouldShow(name) ? (
          <Component {...props} />
        ) : null;
      };
      Wrapped.displayName = `Visible(${name})`;
      return Wrapped;
    };

    const base: Record<
      string,
      React.ComponentType</* eslint-disable-line @typescript-eslint/no-explicit-any */ any>
    > = {
      // Stamps the one heading the hideChallengeOnward CSS rule anchors on
      // (globals.css). All 56 lessons carry exactly one "## Challenge";
      // MDX has no rehype-slug, so headings have no ids to target.
      h2: ({ children, ...rest }: React.HTMLAttributes<HTMLHeadingElement>) => (
        <h2
          {...rest}
          data-heading={
            typeof children === "string" && children.trim() === "Challenge"
              ? "challenge"
              : undefined
          }
        >
          {children}
        </h2>
      ),
      pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
        <pre {...props} tabIndex={0} role="region" aria-label="Code example" />
      ),
      Concept: wrapVisibility("Concept", Concept),
      ConceptReference: wrapVisibility(
        "ConceptReference",
        (props: React.ComponentProps<typeof ConceptReference>) => (
          <ConceptReference {...props} open={!showProse} />
        ),
      ),
      Dialogue: (props: React.ComponentProps<typeof Dialogue>) => {
        // Mirror wrapVisibility's epilogue bypass: inside an <Epilogue>, the
        // epilogue wrapper is the gate, so render unconditionally; elsewhere
        // gate on shouldShow("Dialogue"). Then resolve the speaker to a world
        // character to build the avatar slot: ARIA renders as her live
        // procedural waveform (never raster art, per the bible), humans as
        // the expression-crossfading portrait. Unknown speakers stay
        // avatar-less, exactly as before.
        const insideEpilogue = useContext(EpilogueContext);
        if (!insideEpilogue && !shouldShow("Dialogue")) return null;
        const ch = worldId
          ? resolveCharacter(worldId, props.speaker)
          : undefined;
        let avatarSlot: React.ReactNode;
        if (worldId && ch?.slug) {
          // ARIA takes the same path as the human cast: her art is an
          // abstract voice-orb glyph whose four states are waveform shapes,
          // so it crossfades exactly like a face would (docs/character-bible.md).
          avatarSlot = (
            <AnimatedAvatar
              name={ch.name}
              {...portraitSources(worldId, ch, props.expression)}
            />
          );
        }
        // The Briefing lays each beat out as an avatar slot beside its line
        // (spec 2026-09-23, section 2). Mid-lesson beats on Concept and the
        // epilogue keep the stacked layout.
        return (
          <Dialogue
            {...props}
            avatarSlot={avatarSlot}
            layout={storyRegister ? "row" : "stack"}
          />
        );
      },
      CodeBlock: wrapVisibility("CodeBlock", CodeBlock),
      HintPanel: (props: { hints: unknown }) =>
        shouldShow("HintPanel") ? (
          <HintPanel
            {...(props as { hints: undefined })}
            onHintRevealed={handleHintRevealed}
          />
        ) : null,
      InteractiveDemo: wrapVisibility("InteractiveDemo", InteractiveDemo),
      LearningExperiment: wrapVisibility(
        "LearningExperiment",
        LearningExperiment,
      ),
      ChannelLayoutExperiment: wrapVisibility(
        "ChannelLayoutExperiment",
        ChannelLayoutExperiment,
      ),
      DeepScanDemo: wrapVisibility("DeepScanDemo", DeepScanDemo),
      DecisionTask: wrapVisibility("DecisionTask", DecisionTask),
      ProjectMilestone: wrapVisibility("ProjectMilestone", ProjectMilestone),
      IndependentProject: wrapVisibility(
        "IndependentProject",
        IndependentProject,
      ),
      TransferAssignment: wrapVisibility(
        "TransferAssignment",
        TransferAssignment,
      ),
      DerivationDrawer: wrapVisibility("DerivationDrawer", DerivationDrawer),
      KeyTakeaways: wrapVisibility("KeyTakeaways", KeyTakeaways),
      // LessonRecap leaves a marker when hidden: it is the structural
      // boundary between the challenge zone and the post-recap story
      // (DISPATCH blockquotes, closing codas), and the CSS that scopes
      // the Challenge reveal and the Consequence post-recap reveal
      // anchors on it. Every built lesson carries exactly one LessonRecap
      // (style bible, lesson close).
      LessonRecap: (props: React.ComponentProps<typeof LessonRecap>) => {
        const insideEpilogue = useContext(EpilogueContext);
        return insideEpilogue || shouldShow("LessonRecap") ? (
          <LessonRecap {...props} />
        ) : (
          <span data-post-recap-marker hidden />
        );
      },
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
                worldId,
                lessonId,
              });
              props.onSubmit?.(result);
            }}
          />
        ) : null,
      DispatchTease: wrapVisibility("DispatchTease", DispatchTease),
      StrategyThread: wrapVisibility("StrategyThread", StrategyThread),
      StoryConsequence: wrapVisibility("StoryConsequence", StoryConsequence),
      BossBeat: (
        props: Omit<
          React.ComponentProps<typeof BossBeat>,
          "worldId" | "lessonId"
        >,
      ) => {
        if (!shouldShow("BossBeat")) return null;
        if (!worldId || !lessonId) return null;
        return (
          <BossBeat
            {...props}
            worldId={worldId as string}
            lessonId={lessonId as string}
          />
        );
      },
      RecallPrompt: (props: React.ComponentProps<typeof RecallPrompt>) =>
        shouldShow("RecallPrompt") ? (
          <RecallPrompt
            {...props}
            onAnswer={(result) => {
              trackRecallAnswered(result, { worldId, lessonId });
              props.onAnswer?.(result);
            }}
          />
        ) : null,
      BridgeCallout: (props: { bridge: unknown }) =>
        shouldShow("BridgeCallout") ? (
          <BridgeCallout {...(props as { bridge: undefined })} />
        ) : null,
    };

    // Derive the optional bridge-hint payload from lesson.concept.bridge
    // so the Exercise can surface the JS-to-ML reminder without reading
    // frontmatter itself.
    const bridgeHint = lesson.concept.bridge
      ? {
          jsTitle: lesson.concept.bridge.jsTitle,
          mlTitle: lesson.concept.bridge.mlTitle,
          tier: lesson.concept.bridge.tier,
        }
      : undefined;

    if (worldId && lessonId) {
      base.Exercise = (props: { slug: string }) =>
        shouldShow("Exercise") ? (
          <Exercise
            {...props}
            key={`${props.slug}:${draftOwner ?? "guest"}`}
            draftOwner={draftOwner}
            bridge={bridgeHint}
            onHintRevealed={handleHintRevealed}
            onSubmit={(result: ExerciseSubmitResult) => {
              handleExerciseSubmit(result);
              if (result.passed) {
                onExerciseComplete?.(result.exerciseSlug, result.score);
              }
            }}
          />
        ) : null;
    } else {
      base.Exercise = (props: { slug: string }) =>
        shouldShow("Exercise") ? (
          <Exercise
            {...props}
            key={`${props.slug}:${draftOwner ?? "guest"}`}
            draftOwner={draftOwner}
            bridge={bridgeHint}
            onHintRevealed={handleHintRevealed}
          />
        ) : null;
    }

    base.Section = (props: { name: string; children: React.ReactNode }) =>
      shouldShow(props.name) ? <div>{props.children}</div> : null;

    // Upgrade glossary spans (emitted by rehype-glossary as
    // <span data-glossary-term="...">) into interactive GlossaryTerm chips
    // that open their own definition. Plain spans pass through untouched.
    base.span = function GlossarySpan(
      props: React.HTMLAttributes<HTMLSpanElement> & {
        "data-glossary-term"?: string;
      },
    ) {
      const term = props["data-glossary-term"];
      if (!term) return <span {...props} />;
      const entry = glossaryByTerm.get(term);
      return (
        <GlossaryTerm term={term} definition={entry?.definition}>
          {props.children}
        </GlossaryTerm>
      );
    };

    // Closing scene block, renders only on the Consequence step.
    base.Epilogue = (props: { children: React.ReactNode }) =>
      shouldShow("Epilogue") ? (
        <EpilogueContext.Provider value={true}>
          <div className="lesson-epilogue text-left" data-testid="epilogue">
            {props.children}
          </div>
        </EpilogueContext.Provider>
      ) : null;

    return base;
  }, [
    draftOwner,
    worldId,
    moduleId,
    lessonId,
    handleExerciseSubmit,
    handleHintRevealed,
    shouldShow,
    showProse,
    storyRegister,
    onExerciseComplete,
    lesson.concept.bridge,
    glossaryByTerm,
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
        data-show-challenge={showChallenge ? "true" : undefined}
        data-show-postrecap={showPostRecap ? "true" : undefined}
        data-story-register={storyRegister ? "true" : undefined}
        data-layout={layout}
        data-hide-challenge-onward={hideChallengeOnward ? "true" : undefined}
        data-hide-teaching={hideTeaching ? "true" : undefined}
        data-hide-story-zone={hideStoryZone ? "true" : undefined}
      >
        <Content />
        {shouldShow("HintPanel") && lesson.hints && (
          <HintPanel hints={lesson.hints} onHintRevealed={handleHintRevealed} />
        )}
      </div>
    </ExerciseDataProvider>
  );
}
