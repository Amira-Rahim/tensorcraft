"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { LessonContent } from "./lesson-content";
import { markLessonStarted, markLessonCompleted } from "@/lib/progress-client";
import { trackLessonStarted, trackLessonCompleted } from "@/lib/analytics";
import type { ExerciseData } from "@tensorcraft/ui";
import { SceneHeading, CharacterAvatar } from "@tensorcraft/ui";
import { themes } from "@tensorcraft/themes";
import { LessonDrawer } from "./lesson-drawer";
import { LessonShell } from "./lesson-shell";
import { GlossaryProvider, useGlossary } from "./glossary-context";
import { GlossaryRail } from "./glossary-rail";

interface LessonStepsProps {
  lesson: {
    /** Velite frontmatter slug — the canonical lesson id used by every
     *  progress read (theme map, dashboard, certificates). All writes MUST
     *  use this, never a slugified title (11 of 56 titles differ). */
    slug: string;
    title: string;
    order: number;
    estimatedMinutes: number;
    body: string;
    context: { narrative: string; speaker?: string };
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
    consequence: { narrative: string };
    pattern?:
      | "standard"
      | "broken_code_first"
      | "discovery"
      | "flashback"
      | "peer_review";
    scene?: {
      location: string;
      time?: string;
      epilogueLocation?: string;
    };
    hints?: Array<{
      level: "nudge" | "guidance" | "solution";
      content: string;
    }>;
    skillAxes?: string[];
    glossaryTerms?: Array<{ term: string; definition: string }>;
  };
  exercises: ExerciseData[];
  theme: {
    displayName: string;
    palette: {
      primary: string;
      accent: string;
      text: string;
      muted: string;
      surface: string;
      bg: string;
      border: string;
      codeBg: string;
    };
    terminology: { lesson: string; module: string; exercise: string };
  };
  themeSlug: string;
  moduleSlug: string;
  moduleName?: string;
  prevLesson: { slug: string; title: string } | null;
  nextLesson: { slug: string; title: string } | null;
  lessons?: Array<{
    slug: string;
    title: string;
    order: number;
    locked: boolean;
    completed: boolean;
  }>;
}

const TOTAL_STEPS = 6;

/* Per-step MDX visibility sets, hoisted so their identity is stable across
   renders. Passing a fresh Set each render makes LessonContent rebuild its
   memoized MDX component, which remounts the whole MDX DOM subtree on every
   parent re-render (breaking the script-playback timeline's element refs
   and recompiling the MDX body needlessly). */
const BRIEFING_COMPONENTS = new Set(["Dialogue", "BossBeat", "prose"]);

/* Each non-story step splits into a LEFT (reading column) and RIGHT (rail or
   work pane) partition. The two LessonContent instances per step receive
   complementary Sets so no component renders in both columns. Interactive
   components with side effects live in exactly one partition: Exercise only
   in CHALLENGE_RIGHT, RecallPrompt only in TAKEAWAYS_COMPONENTS. */

// Concept: prose + concept visuals on the left; objectives on the right rail
// (the glossary rail itself is an app component rendered directly, not MDX).
const CONCEPT_LEFT = new Set([
  "BridgeCallout",
  "Concept",
  "InteractiveDemo",
  "prose",
  "code-tensors",
]);
const CONCEPT_RIGHT = new Set(["LearningObjectives"]);

// Code: walkthrough prose + math/inline tensors on the left; runnable code
// and demos in the right work pane.
const CODE_LEFT = new Set([
  "MathBlock",
  "DerivationDrawer",
  "prose",
  "code-tensors",
  "code-shapes",
]);
const CODE_RIGHT = new Set(["CodeBlock", "InteractiveDemo"]);

// Challenge: brief/hints on the left; the Exercise editor in the right pane.
const CHALLENGE_LEFT = new Set(["challenge", "prose", "HintPanel"]);
const CHALLENGE_RIGHT = new Set(["Exercise"]);

// Takeaways: the lesson close on the left (RecallPrompt + LessonRecap +
// NextLesson); the right rail is the glossary recap + mission progress (app
// components, not MDX).
const TAKEAWAYS_COMPONENTS = new Set([
  "LessonRecap",
  "RecallPrompt",
  "NextLesson",
]);
const CONSEQUENCE_COMPONENTS = new Set(["Epilogue", "DispatchTease"]);

const STEP_NAMES = [
  "Briefing",
  "Concept",
  "Code",
  "Challenge",
  "Takeaways",
  "Consequence",
] as const;

function getStorageKey(themeSlug: string, lessonSlug: string): string {
  return `tc_step_${themeSlug}_${lessonSlug}`;
}

function getMaxStorageKey(themeSlug: string, lessonSlug: string): string {
  return `tc_step_max_${themeSlug}_${lessonSlug}`;
}

/* Public entry: a single GlossaryProvider wraps the whole reader so the
   in-prose GlossaryTerm chips (via LessonContent's span override) and the
   GlossaryRail in the sidebar share one activeTerm instance. */
export function LessonSteps(props: LessonStepsProps) {
  return (
    <GlossaryProvider>
      <LessonStepsInner {...props} />
    </GlossaryProvider>
  );
}

function LessonStepsInner({
  lesson,
  exercises,
  theme,
  themeSlug,
  moduleSlug,
  moduleName,
  prevLesson,
  nextLesson,
  lessons,
}: LessonStepsProps) {
  const { activeTerm } = useGlossary();
  const [currentStep, setCurrentStep] = useState(0);
  const [maxStepReached, setMaxStepReached] = useState(0);
  // A lesson with N exercises requires N passes: one green run per embedded
  // exercise, keyed by exercise slug (the incident-pairing lessons have 2).
  const [passedExercises, setPassedExercises] = useState<Set<string>>(
    () => new Set(),
  );
  const exerciseScoresRef = useRef<Record<string, number>>({});
  const [mounted, setMounted] = useState(false);
  // Mobile-only: reveal the right work pane (code/exercise) over the prose.
  const [paneOpen, setPaneOpen] = useState(false);

  // Script playback runs once per visit; returning to the Briefing step
  // shows the scene static with a Replay control instead of re-playing.
  const scriptPlayedRef = useRef(false);
  const handleScriptPlayed = useCallback(() => {
    scriptPlayedRef.current = true;
  }, []);

  const storageKey = getStorageKey(themeSlug, lesson.slug);
  const maxStorageKey = getMaxStorageKey(themeSlug, lesson.slug);

  // Read persisted step + furthest step reached on mount
  useEffect(() => {
    let step = 0;
    let maxStep = 0;
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < TOTAL_STEPS) {
          step = parsed;
          setCurrentStep(parsed);
        }
      }
      const savedMax = localStorage.getItem(maxStorageKey);
      if (savedMax !== null) {
        const parsed = parseInt(savedMax, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < TOTAL_STEPS) {
          maxStep = parsed;
        }
      }
    } catch {
      // localStorage unavailable
    }
    setMaxStepReached(Math.max(step, maxStep));
    setMounted(true);
  }, [storageKey, maxStorageKey]);

  // Track the furthest step reached so going back never locks steps again
  useEffect(() => {
    setMaxStepReached((m) => Math.max(m, currentStep));
  }, [currentStep]);

  // Collapse the mobile work-pane whenever the step changes.
  useEffect(() => {
    setPaneOpen(false);
  }, [currentStep]);

  // Persist step changes
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(storageKey, String(currentStep));
      localStorage.setItem(maxStorageKey, String(maxStepReached));
    } catch {
      // localStorage unavailable
    }
  }, [currentStep, maxStepReached, storageKey, maxStorageKey, mounted]);

  // Mark lesson as started on mount
  useEffect(() => {
    markLessonStarted(themeSlug, moduleSlug, lesson.slug).catch(() => {});
    trackLessonStarted(themeSlug, moduleSlug, lesson.slug);
  }, [themeSlug, moduleSlug, lesson.slug]);

  // Mark lesson complete when reaching final step (Consequence)
  useEffect(() => {
    if (currentStep === 5) {
      const scores = Object.values(exerciseScoresRef.current);
      const avgScore =
        scores.length > 0
          ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
          : null;
      markLessonCompleted(themeSlug, moduleSlug, lesson.slug, avgScore).catch(
        () => {},
      );
      trackLessonCompleted(themeSlug, moduleSlug, lesson.slug);

      // Tag first lesson complete in Kit (fire once)
      try {
        if (!localStorage.getItem("tc_first_lesson_tagged")) {
          localStorage.setItem("tc_first_lesson_tagged", "1");
          import("@/lib/api-url").then(({ getApiUrl }) => {
            import("@/lib/supabase/client").then(
              ({ getSupabaseBrowserClient }) => {
                const supabase = getSupabaseBrowserClient();
                supabase.auth.getSession().then(({ data: { session } }) => {
                  if (session?.access_token) {
                    fetch(`${getApiUrl()}/api/email`, {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${session.access_token}`,
                      },
                      body: JSON.stringify({ event: "first_lesson" }),
                    }).catch(() => {});
                  }
                });
              },
            );
          });
        }
      } catch {
        // localStorage unavailable
      }
    }
  }, [currentStep, themeSlug, moduleSlug, lesson.slug]);

  const handleExerciseComplete = useCallback(
    (exerciseSlug: string, score: number) => {
      exerciseScoresRef.current[exerciseSlug] = score;
      setPassedExercises((prev) => {
        const next = new Set(prev);
        next.add(exerciseSlug);
        return next;
      });
    },
    [],
  );

  const canContinue =
    currentStep === 3 // Challenge step
      ? exercises.length === 0 || passedExercises.size >= exercises.length
      : currentStep < TOTAL_STEPS - 1;

  const goNext = useCallback(() => {
    if (canContinue && currentStep < TOTAL_STEPS - 1) {
      setCurrentStep((s) => s + 1);
    }
  }, [canContinue, currentStep]);

  const goBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((s) => s - 1);
    }
  }, [currentStep]);

  // Swipe gesture handling for mobile navigation
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      const deltaX = e.changedTouches[0].clientX - touchStartX.current;
      const deltaY = e.changedTouches[0].clientY - touchStartY.current;
      // Only horizontal swipes (ignore vertical scrolling)
      if (Math.abs(deltaX) < 50 || Math.abs(deltaY) > Math.abs(deltaX)) return;
      if (deltaX < 0)
        goNext(); // swipe left = next
      else goBack(); // swipe right = back
    },
    [goNext, goBack],
  );

  // Highlight the first word that's > 3 chars with primary color
  const highlightTitle = (title: string) => {
    const words = title.split(" ");
    const idx = words.findIndex((w) => w.length > 3);
    if (idx === -1) return <>{title}</>;
    return (
      <>
        {words.map((word, i) => (
          <span key={i}>
            {i > 0 ? " " : ""}
            {i === idx ? (
              <span style={{ color: theme.palette.primary }}>{word}</span>
            ) : (
              word
            )}
          </span>
        ))}
      </>
    );
  };

  const lessonSlug = lesson.slug;

  const isStoryStep = currentStep === 0 || currentStep === 5;

  const sharedContentProps = {
    lesson,
    exercises,
    themeSlug,
    moduleSlug,
    lessonSlug,
    theme,
  };

  // Distinct speakers across the lesson dialogue, for the briefing cast chips.
  const castSpeakers = extractSpeakers(lesson.body, lesson.context.speaker);

  const bottomNav = (
    <div
      className="flex items-center justify-end mt-10 pt-6"
      style={{ borderTop: `1px solid ${theme.palette.border}` }}
    >
      {currentStep < TOTAL_STEPS - 1 ? (
        <button
          type="button"
          onClick={goNext}
          disabled={!canContinue}
          className="text-sm font-mono font-bold px-8 py-3 transition-all"
          style={{
            background: canContinue
              ? theme.palette.primary
              : theme.palette.border,
            color: canContinue ? theme.palette.bg : theme.palette.muted,
            cursor: canContinue ? "pointer" : "not-allowed",
            opacity: canContinue ? 1 : 0.3,
          }}
        >
          Continue &rarr;
        </button>
      ) : nextLesson ? (
        <Link
          href={`/themes/${themeSlug}/${moduleSlug}/${nextLesson.slug}`}
          className="text-sm font-mono font-bold px-8 py-3 transition-all inline-flex items-center"
          style={{ background: theme.palette.primary, color: theme.palette.bg }}
        >
          Next Lesson &rarr;
        </Link>
      ) : (
        <Link
          href={`/themes/${themeSlug}`}
          className="text-sm font-mono font-bold px-8 py-3 transition-all inline-flex items-center"
          style={{ background: theme.palette.primary, color: theme.palette.bg }}
        >
          Back to Mission Map &rarr;
        </Link>
      )}
    </div>
  );

  let shellLeft: React.ReactNode = null;
  let shellRight: React.ReactNode = null;
  let rightKind: "rail" | "pane" | "none" = "none";

  if (currentStep === 0) {
    rightKind = "rail";
    shellLeft = (
      <StepBriefing
        lesson={lesson}
        moduleSlug={moduleSlug}
        exercises={exercises}
        theme={theme}
        themeSlug={themeSlug}
        lessonSlug={lessonSlug}
        scriptAutoPlay={!scriptPlayedRef.current}
        onScriptPlayed={handleScriptPlayed}
      />
    );
    shellRight = (
      <SceneCard
        theme={theme}
        themeSlug={themeSlug}
        scene={lesson.scene}
        pattern={lesson.pattern}
        speakers={castSpeakers}
      />
    );
  } else if (currentStep === 1) {
    rightKind = "rail";
    shellLeft = <StepConcept {...sharedContentProps} />;
    shellRight = (
      <div className="flex flex-col gap-8">
        <GlossaryRail
          terms={lesson.glossaryTerms ?? []}
          activeTerm={activeTerm}
        />
        <LessonContent
          lesson={lesson}
          exercises={exercises}
          themeId={themeSlug}
          moduleId={moduleSlug}
          lessonId={lessonSlug}
          glossaryTerms={lesson.glossaryTerms}
          visibleComponents={CONCEPT_RIGHT}
        />
      </div>
    );
  } else if (currentStep === 2) {
    rightKind = "pane";
    shellLeft = <StepCode {...sharedContentProps} />;
    shellRight = (
      <LessonContent
        lesson={lesson}
        exercises={exercises}
        themeId={themeSlug}
        moduleId={moduleSlug}
        lessonId={lessonSlug}
        glossaryTerms={lesson.glossaryTerms}
        visibleComponents={CODE_RIGHT}
      />
    );
  } else if (currentStep === 3) {
    rightKind = "pane";
    shellLeft = <StepChallenge {...sharedContentProps} />;
    shellRight = (
      <LessonContent
        lesson={lesson}
        exercises={exercises}
        themeId={themeSlug}
        moduleId={moduleSlug}
        lessonId={lessonSlug}
        glossaryTerms={lesson.glossaryTerms}
        visibleComponents={CHALLENGE_RIGHT}
        onExerciseComplete={handleExerciseComplete}
      />
    );
  } else if (currentStep === 4) {
    rightKind = "rail";
    shellLeft = <StepTakeaways {...sharedContentProps} />;
    shellRight = (
      <div className="flex flex-col gap-8">
        <GlossaryRail
          terms={lesson.glossaryTerms ?? []}
          activeTerm={activeTerm}
        />
        <MissionProgress
          theme={theme}
          lessons={lessons}
          lessonSlug={lessonSlug}
        />
      </div>
    );
  } else {
    rightKind = "none";
    shellLeft = (
      <StepConsequence {...sharedContentProps} nextLesson={nextLesson} />
    );
  }

  // On mobile, pane steps show a toggle button that swaps prose for the work
  // pane; on lg+ the shell renders both columns and the toggle is hidden.
  const mobileToggle =
    rightKind === "pane" ? (
      <button
        type="button"
        onClick={() => setPaneOpen((o) => !o)}
        className="lg:hidden mb-4 text-xs font-mono uppercase tracking-[2px] px-4 py-2 transition-colors"
        style={{
          color: theme.palette.primary,
          border: `1px solid ${theme.palette.primary}40`,
          background: `${theme.palette.primary}10`,
        }}
      >
        {paneOpen
          ? "Show explanation"
          : currentStep === 3
            ? "Show task"
            : "Show code"}
      </button>
    ) : null;

  // For pane steps on mobile we render a single column whose body is either
  // the prose or the pane (toggled). lg+ always uses the two-column shell.
  const shellLeftWithToggle =
    rightKind === "pane" ? (
      <>
        {mobileToggle}
        <div className={paneOpen ? "hidden lg:block" : "block"}>
          {shellLeft}
        </div>
        <div className={paneOpen ? "block lg:hidden" : "hidden"}>
          {shellRight}
        </div>
      </>
    ) : (
      shellLeft
    );

  return (
    <div
      className="flex-1 overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="py-6">
        <LessonShell
          rightKind={rightKind}
          chrome={
            <div className="mx-auto w-full max-w-[1200px] px-6 md:px-12">
              <ChromeBar
                lessons={lessons}
                lessonSlug={lessonSlug}
                themeSlug={themeSlug}
                moduleSlug={moduleSlug}
                moduleName={moduleName}
                theme={theme}
                currentStep={currentStep}
                maxStepReached={maxStepReached}
                setCurrentStep={setCurrentStep}
              />
            </div>
          }
          left={
            <div
              key={currentStep}
              className={`animate-step-in ${isStoryStep ? "min-h-[50vh] flex flex-col justify-center" : ""}`}
            >
              {shellLeftWithToggle}
              {bottomNav}
            </div>
          }
          right={shellRight}
        />
      </div>
    </div>
  );
}

/* Top chrome: lesson drawer, exit link, segmented progress bar, counter. */
function ChromeBar({
  lessons,
  lessonSlug,
  themeSlug,
  moduleSlug,
  moduleName,
  theme,
  currentStep,
  maxStepReached,
  setCurrentStep,
}: {
  lessons: LessonStepsProps["lessons"];
  lessonSlug: string;
  themeSlug: string;
  moduleSlug: string;
  moduleName?: string;
  theme: LessonStepsProps["theme"];
  currentStep: number;
  maxStepReached: number;
  setCurrentStep: (n: number) => void;
}) {
  return (
    <div className="flex items-center gap-4 mb-6">
      {lessons && (
        <LessonDrawer
          lessons={lessons}
          currentLessonSlug={lessonSlug}
          themeSlug={themeSlug}
          moduleSlug={moduleSlug}
          moduleName={moduleName ?? "Module"}
          theme={theme}
        />
      )}
      <Link
        href={`/themes/${themeSlug}`}
        className="text-sm font-mono flex items-center gap-2 shrink-0 px-3 py-2 border border-transparent opacity-70 transition-all hover:opacity-100 hover:border-current"
        style={{ color: theme.palette.text }}
      >
        &larr; Mission Map
      </Link>

      <div
        className="flex-1 flex items-center gap-1"
        role="group"
        aria-label={`Lesson step ${currentStep + 1} of ${TOTAL_STEPS}`}
      >
        {STEP_NAMES.map((name, i) => {
          const visited = i <= maxStepReached;
          const filled = i <= currentStep;
          return (
            <button
              key={name}
              type="button"
              onClick={() => setCurrentStep(i)}
              disabled={!visited}
              aria-label={`Step ${i + 1}: ${name}`}
              aria-current={i === currentStep ? "step" : undefined}
              title={visited ? name : `${name} (locked)`}
              className="flex-1 h-4 flex items-center p-0 border-0 bg-transparent transition-opacity hover:opacity-80 disabled:hover:opacity-100"
              style={{ cursor: visited ? "pointer" : "not-allowed" }}
            >
              <span
                className="h-1.5 w-full transition-all duration-300"
                style={{
                  background: filled
                    ? theme.palette.primary
                    : theme.palette.border,
                  opacity: !visited ? 0.45 : 1,
                  borderRadius: 2,
                }}
              />
            </button>
          );
        })}
      </div>

      <span
        className="text-xs font-mono shrink-0 tracking-wider px-3 py-1"
        style={{
          color: theme.palette.primary,
          background: `${theme.palette.primary}12`,
          border: `1px solid ${theme.palette.primary}25`,
        }}
      >
        {currentStep + 1} / {TOTAL_STEPS}
      </span>
    </div>
  );
}

/* Learner-facing labels for the non-standard pedagogical patterns. Keyed by
   the full schema enum minus "standard" (which renders nothing); the variety
   regression test asserts this map covers every enum value, so adding a
   pattern to the content schema without a label here fails CI rather than
   silently rendering nothing. */
export const PATTERN_LABELS: Record<
  Exclude<NonNullable<LessonStepsProps["lesson"]["pattern"]>, "standard">,
  string
> = {
  broken_code_first: "Field repair: broken code first",
  discovery: "Open exploration: concept named last",
  flashback: "Archive playback: an earlier scene, reopened",
  peer_review: "Code review: critique before you write",
};

/* Right-rail card for the Briefing: scene slugline + cast avatars. */
function SceneCard({
  theme,
  themeSlug,
  scene,
  pattern,
  speakers,
}: {
  theme: LessonStepsProps["theme"];
  themeSlug: string;
  scene?: { location: string; time?: string };
  pattern?: LessonStepsProps["lesson"]["pattern"];
  speakers: string[];
}) {
  const chars = themes[themeSlug]?.characters ?? [];
  const patternLabel =
    pattern && pattern !== "standard" ? PATTERN_LABELS[pattern] : undefined;
  return (
    <div className="flex flex-col gap-5">
      <span
        className="font-mono text-xs uppercase tracking-[0.2em]"
        style={{ color: theme.palette.primary }}
      >
        Scene
      </span>
      {scene && (
        <div className="flex flex-col gap-1">
          <span
            className="font-mono text-sm"
            style={{ color: theme.palette.text }}
          >
            {scene.location}
          </span>
          {scene.time && (
            <span
              className="font-mono text-xs uppercase tracking-wider"
              style={{ color: theme.palette.muted }}
            >
              {scene.time}
            </span>
          )}
        </div>
      )}
      {patternLabel && (
        <div
          data-testid="pattern-format-tag"
          className="flex flex-col gap-1 border-l-2 pl-3"
          style={{ borderColor: theme.palette.primary }}
        >
          <span
            className="font-mono text-[10px] uppercase tracking-[2px]"
            style={{ color: theme.palette.muted }}
          >
            Format
          </span>
          <span
            className="font-mono text-xs"
            style={{ color: theme.palette.text }}
          >
            {patternLabel}
          </span>
        </div>
      )}
      {speakers.length > 0 && (
        <div className="flex flex-col gap-2">
          <span
            className="font-mono text-[10px] uppercase tracking-[2px]"
            style={{ color: theme.palette.muted }}
          >
            Cast
          </span>
          <div className="flex flex-col gap-3">
            {speakers.map((s) => {
              const ch = chars.find(
                (c) => c.name === s || c.aliases?.includes(s),
              );
              return (
                <div key={s} className="flex items-center gap-2">
                  <CharacterAvatar
                    name={s}
                    src={
                      ch?.slug
                        ? `/characters/${themeSlug}/${ch.slug}.webp`
                        : undefined
                    }
                    accentColor={theme.palette.primary}
                    isAI={ch?.isAI}
                    size={30}
                  />
                  <div className="flex flex-col">
                    <span
                      className="font-mono text-xs"
                      style={{ color: theme.palette.text }}
                    >
                      {s}
                    </span>
                    {ch?.role && (
                      <span
                        className="font-mono text-[10px]"
                        style={{ color: theme.palette.muted }}
                      >
                        {ch.role}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

/* Right-rail mission progress for the Takeaways step. */
function MissionProgress({
  theme,
  lessons,
  lessonSlug,
}: {
  theme: LessonStepsProps["theme"];
  lessons: LessonStepsProps["lessons"];
  lessonSlug: string;
}) {
  if (!lessons || lessons.length === 0) return null;
  const done = lessons.filter((l) => l.completed).length;
  return (
    <div className="flex flex-col gap-3">
      <span
        className="font-mono text-xs uppercase tracking-[0.2em]"
        style={{ color: theme.palette.primary }}
      >
        Mission Progress
      </span>
      <span className="text-sm" style={{ color: theme.palette.muted }}>
        {done} / {lessons.length} complete
      </span>
      <ul className="flex flex-col gap-1.5">
        {lessons.map((l) => {
          const isCurrent = l.slug === lessonSlug;
          return (
            <li
              key={l.slug}
              className="text-sm flex items-center gap-2"
              style={{
                color: isCurrent ? theme.palette.text : theme.palette.muted,
              }}
            >
              <span
                className="w-1.5 h-1.5 inline-block shrink-0"
                style={{
                  background:
                    l.completed || isCurrent
                      ? theme.palette.primary
                      : theme.palette.border,
                }}
              />
              {l.title}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/* Pull the distinct dialogue speakers out of the compiled MDX body. The body
   is a JS function string from Velite; speakers appear as `speaker: "Name"`
   literals on each Dialogue call. Falls back to the frontmatter speaker. */
function extractSpeakers(body: string, fallback?: string): string[] {
  const seen = new Set<string>();
  const re = /speaker\s*:\s*"((?:[^"\\]|\\.)*)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body)) !== null) {
    const name = m[1].replace(/\\"/g, '"');
    if (name) seen.add(name);
  }
  if (seen.size === 0 && fallback) seen.add(fallback);
  return [...seen];
}

/* ──────────────────────────────────────────────
   Step 0: Briefing
   ────────────────────────────────────────────── */

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true
  );
}

/* Hold time per beat scales with reading length. */
function beatHoldMs(el: HTMLElement): number {
  const words = (el.textContent ?? "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.min(3200, Math.max(800, words * 170));
}

function StepBriefing({
  lesson,
  moduleSlug,
  exercises,
  theme,
  themeSlug,
  lessonSlug,
  scriptAutoPlay,
  onScriptPlayed,
}: {
  lesson: LessonStepsProps["lesson"];
  moduleSlug: string;
  exercises: ExerciseData[];
  theme: LessonStepsProps["theme"];
  themeSlug: string;
  lessonSlug: string;
  scriptAutoPlay: boolean;
  onScriptPlayed: () => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const timeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const scrollPendingRef = useRef(false);
  const [scriptState, setScriptState] = useState<"playing" | "done">(
    scriptAutoPlay ? "playing" : "done",
  );
  const [beatsShown, setBeatsShown] = useState(0);

  const clearTimeline = useCallback(() => {
    for (const t of timeoutsRef.current) clearTimeout(t);
    timeoutsRef.current = [];
  }, []);

  /* A beat is one story element revealed on the timeline: the scene
     slugline, the narrative stage direction, then every pre-heading child
     of the MDX container (the same story-zone boundary the screenplay CSS
     uses). */
  const collectBeats = useCallback((): HTMLElement[] => {
    const root = rootRef.current;
    if (!root) return [];
    const beats = Array.from(
      root.querySelectorAll<HTMLElement>("[data-script-beat]"),
    );
    const content = root.querySelector(".lesson-step-content");
    if (content) {
      for (const child of Array.from(content.children)) {
        if (/^H[23]$/.test(child.tagName)) break;
        beats.push(child as HTMLElement);
      }
    }
    return beats;
  }, []);

  const finish = useCallback(
    (scrollToExplanation: boolean) => {
      clearTimeline();
      scrollPendingRef.current = scrollToExplanation;
      setScriptState("done");
      onScriptPlayed();
    },
    [clearTimeline, onScriptPlayed],
  );

  const play = useCallback(() => {
    clearTimeline();
    if (prefersReducedMotion()) {
      finish(false);
      return;
    }
    const beats = collectBeats();
    if (beats.length === 0) {
      finish(false);
      return;
    }
    setBeatsShown(0);
    setScriptState("playing");
    let at = 350;
    beats.forEach((b, i) => {
      timeoutsRef.current.push(setTimeout(() => setBeatsShown(i + 1), at));
      at += beatHoldMs(b);
    });
    timeoutsRef.current.push(setTimeout(() => finish(true), at + 200));
  }, [clearTimeline, collectBeats, finish]);

  // Re-assert beat attributes after every commit. The beat list is driven
  // by state (beatsShown) instead of one-shot imperative setAttribute calls
  // because the MDX subtree can be remounted by a parent re-render (dev
  // renderer especially), which silently discards attributes set on the
  // old nodes.
  useEffect(() => {
    const beats = collectBeats();
    beats.forEach((b, i) => {
      if (i < beatsShown) b.setAttribute("data-beat-shown", "");
      else b.removeAttribute("data-beat-shown");
    });
  });

  // Scroll to the explanation only after the "done" state has committed:
  // until then the explanation is display:none and a hidden element never
  // scrolls. Double rAF lets layout settle after the reveal.
  useEffect(() => {
    if (scriptState !== "done" || !scrollPendingRef.current) return;
    scrollPendingRef.current = false;
    const scroll = () => {
      const root = rootRef.current;
      const target =
        root?.querySelector(
          ".lesson-step-content h2, .lesson-step-content h3",
        ) ?? root?.querySelector(".tc-cut-to");
      if (target && typeof target.scrollIntoView === "function") {
        target.scrollIntoView({
          behavior: prefersReducedMotion() ? "auto" : "smooth",
          block: "start",
        });
      }
    };
    if (typeof requestAnimationFrame === "function") {
      requestAnimationFrame(() => requestAnimationFrame(scroll));
    } else {
      scroll();
    }
  }, [scriptState]);

  // Kick the timeline once on mount when auto-playing.
  useEffect(() => {
    if (scriptAutoPlay) play();
    return clearTimeline;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // aria-busy: while the scene plays, the instructional content is
    // display:none and absent from the accessibility tree; flag the region
    // as loading so screen readers know more content is coming.
    <div
      ref={rootRef}
      data-script-state={scriptState}
      aria-busy={scriptState === "playing" ? "true" : undefined}
    >
      <div
        className="text-xs font-mono uppercase tracking-[3px] mb-6"
        style={{ color: theme.palette.primary }}
      >
        SECTOR {moduleSlug} &middot; MISSION {lesson.order}
      </div>

      <h1
        className="text-4xl md:text-5xl font-bold mb-5 leading-[1.1] tracking-tight"
        style={{ color: theme.palette.text }}
      >
        {highlightFirstLongWord(lesson.title, theme.palette.primary)}
      </h1>

      <div
        className="font-mono text-xs uppercase tracking-wider mb-8 pt-5"
        style={{
          color: theme.palette.muted,
          borderTop: `1px solid ${theme.palette.border}`,
        }}
      >
        {/* Reading + embedded exercises: "14 min · 2 exercises" where the
            exercises alone are 30 min reads as a lie. One basis everywhere
            (module map, JSON-LD, courseWorkload). */}
        {`${lesson.estimatedMinutes + exercises.reduce((s, e) => s + (e.estimatedMinutes ?? 0), 0)} min${exercises.length > 0 ? ` · ${exercises.length} ${exercises.length === 1 ? "exercise" : "exercises"}` : ""}`}
      </div>

      {/* Playback controls for the scene */}
      <div className="flex justify-end mb-3">
        {scriptState === "playing" ? (
          <button
            type="button"
            onClick={() => finish(false)}
            className="text-[10px] font-mono uppercase tracking-[2px] px-3 py-1.5 transition-colors hover:opacity-80"
            style={{
              color: theme.palette.muted,
              border: `1px solid ${theme.palette.border}`,
              background: "transparent",
            }}
          >
            Skip <span aria-hidden="true">&#9656;</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={play}
            className="text-[10px] font-mono uppercase tracking-[2px] px-3 py-1.5 transition-colors hover:opacity-80"
            style={{
              color: theme.palette.muted,
              border: `1px solid ${theme.palette.border}`,
              background: "transparent",
            }}
          >
            <span aria-hidden="true">&#8635;</span> Replay scene
          </button>
        )}
      </div>

      {/* Scene heading, only if scene frontmatter exists */}
      {lesson.scene && (
        <div data-script-beat="">
          <SceneHeading
            prefix="Int."
            location={lesson.scene.location}
            time={lesson.scene.time}
          />
        </div>
      )}

      {/* Narrative as stage direction */}
      <p
        data-script-beat=""
        className="text-sm italic leading-[1.85] mb-7 pl-6 max-w-[52ch]"
        style={{ color: theme.palette.muted }}
      >
        {lesson.context.narrative}
      </p>

      {/* Dialogue, screenplay beats from MDX */}
      <LessonContent
        lesson={lesson}
        exercises={exercises}
        themeId={themeSlug}
        moduleId={moduleSlug}
        lessonId={lessonSlug}
        glossaryTerms={lesson.glossaryTerms}
        visibleComponents={BRIEFING_COMPONENTS}
        storyRegister
      />
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 1: Concept
   ────────────────────────────────────────────── */
function StepConcept({
  lesson,
  exercises,
  themeSlug,
  moduleSlug,
  lessonSlug,
  theme,
}: {
  lesson: LessonStepsProps["lesson"];
  exercises: ExerciseData[];
  themeSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  theme: LessonStepsProps["theme"];
}) {
  return (
    <div>
      <PhaseChip theme={theme} label="Concept" icon={"\u25CE"} />
      <p
        className="text-base leading-[1.85] mb-6"
        style={{ color: theme.palette.muted }}
      >
        {lesson.concept.explanation}
      </p>
      <div className="lesson-prose">
        <LessonContent
          lesson={lesson}
          exercises={exercises}
          themeId={themeSlug}
          moduleId={moduleSlug}
          lessonId={lessonSlug}
          glossaryTerms={lesson.glossaryTerms}
          visibleComponents={CONCEPT_LEFT}
        />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 3: Code
   ────────────────────────────────────────────── */
function StepCode({
  lesson,
  exercises,
  themeSlug,
  moduleSlug,
  lessonSlug,
  theme,
}: {
  lesson: LessonStepsProps["lesson"];
  exercises: ExerciseData[];
  themeSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  theme: LessonStepsProps["theme"];
}) {
  return (
    <div>
      <PhaseChip theme={theme} label="Code" icon={"\u2318"} />
      <div className="lesson-prose">
        <LessonContent
          lesson={lesson}
          exercises={exercises}
          themeId={themeSlug}
          moduleId={moduleSlug}
          lessonId={lessonSlug}
          glossaryTerms={lesson.glossaryTerms}
          visibleComponents={CODE_LEFT}
        />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 4: Challenge
   ────────────────────────────────────────────── */
function StepChallenge({
  lesson,
  exercises,
  themeSlug,
  moduleSlug,
  lessonSlug,
  theme,
}: {
  lesson: LessonStepsProps["lesson"];
  exercises: ExerciseData[];
  themeSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  theme: LessonStepsProps["theme"];
}) {
  return (
    <div>
      <PhaseChip theme={theme} label="Challenge" icon={"\u26A1"} />
      {/* Left column: brief + hints only. The Exercise editor itself renders
          in the right work pane (CHALLENGE_RIGHT) so its submit handler runs
          exactly once. */}
      <div className="lesson-prose">
        <LessonContent
          lesson={lesson}
          exercises={exercises}
          themeId={themeSlug}
          moduleId={moduleSlug}
          lessonId={lessonSlug}
          glossaryTerms={lesson.glossaryTerms}
          visibleComponents={CHALLENGE_LEFT}
        />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 5: Takeaways
   ────────────────────────────────────────────── */
function StepTakeaways({
  lesson,
  exercises,
  themeSlug,
  moduleSlug,
  lessonSlug,
  theme,
}: {
  lesson: LessonStepsProps["lesson"];
  exercises: ExerciseData[];
  themeSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  theme: LessonStepsProps["theme"];
}) {
  return (
    <div>
      <PhaseChip theme={theme} label="Takeaways" icon={"\u2713"} />
      <div className="lesson-prose">
        <LessonContent
          lesson={lesson}
          exercises={exercises}
          themeId={themeSlug}
          moduleId={moduleSlug}
          lessonId={lessonSlug}
          glossaryTerms={lesson.glossaryTerms}
          visibleComponents={TAKEAWAYS_COMPONENTS}
        />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 6: Consequence
   ────────────────────────────────────────────── */
function StepConsequence({
  lesson,
  exercises,
  theme,
  themeSlug,
  moduleSlug,
  lessonSlug,
  nextLesson,
}: {
  lesson: LessonStepsProps["lesson"];
  exercises: ExerciseData[];
  theme: LessonStepsProps["theme"];
  themeSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  nextLesson: { slug: string; title: string } | null;
}) {
  return (
    <div className="text-center py-12">
      {/* FADE OUT marker */}
      <div
        className="font-mono text-[9px] uppercase tracking-[3px] mb-8"
        style={{ color: theme.palette.border }}
      >
        Fade Out
      </div>

      {/* Epilogue scene heading */}
      {lesson.scene && (
        <SceneHeading
          prefix="Epilogue"
          location={lesson.scene.epilogueLocation ?? lesson.scene.location}
        />
      )}

      {/* Mission complete badge */}
      <div
        className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[2px] px-4 py-1.5 mb-6"
        style={{
          color: theme.palette.primary,
          border: `1px solid ${theme.palette.primary}25`,
          background: `${theme.palette.primary}0F`,
        }}
      >
        <span
          className="w-1.5 h-1.5 inline-block"
          style={{ background: theme.palette.primary }}
        />
        Mission Complete
      </div>

      <h2
        className="text-[26px] font-bold mb-5"
        style={{ color: theme.palette.text }}
      >
        {lesson.title}
      </h2>

      {/* Narrative as italic cinematic narration */}
      <p
        className="text-[15px] italic leading-[1.9] max-w-[520px] mx-auto mb-8"
        style={{ color: theme.palette.muted }}
      >
        {lesson.consequence.narrative}
      </p>

      {/* Closing scene from the MDX body (<Epilogue> blocks), the story
          beat the learner earns by finishing the work. */}
      <div className="max-w-140 mx-auto text-left mb-8">
        <LessonContent
          lesson={lesson}
          exercises={exercises}
          themeId={themeSlug}
          moduleId={moduleSlug}
          lessonId={lessonSlug}
          glossaryTerms={lesson.glossaryTerms}
          visibleComponents={CONSEQUENCE_COMPONENTS}
        />
      </div>

      {/* Next lesson card */}
      {nextLesson && (
        <Link
          href={`/themes/${themeSlug}/${moduleSlug}/${nextLesson.slug}`}
          className="inline-flex items-center gap-4 text-left px-6 py-5 max-w-[420px] mx-auto transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]"
          style={{
            background: theme.palette.surface,
            border: `1px solid ${theme.palette.border}`,
          }}
        >
          <div className="flex-1">
            <div
              className="text-[9px] font-mono uppercase tracking-[1.5px] mb-1"
              style={{ color: theme.palette.muted }}
            >
              Next Mission
            </div>
            <div
              className="text-[15px] font-semibold"
              style={{ color: theme.palette.text }}
            >
              {nextLesson.title}
            </div>
          </div>
          <span
            className="text-base shrink-0"
            style={{ color: theme.palette.primary }}
          >
            &rarr;
          </span>
        </Link>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Shared UI helpers
   ────────────────────────────────────────────── */

function PhaseChip({
  theme,
  label,
  icon,
}: {
  theme: LessonStepsProps["theme"];
  label: string;
  icon: string;
}) {
  return (
    <div
      className="text-[10px] font-mono uppercase tracking-[2px] mb-6 flex items-center gap-2"
      style={{ color: theme.palette.primary }}
    >
      <span>{icon}</span> {label}
    </div>
  );
}

function highlightFirstLongWord(title: string, color: string) {
  const words = title.split(" ");
  const idx = words.findIndex((w) => w.replace(/[^a-zA-Z]/g, "").length > 3);
  if (idx === -1) return title;
  return (
    <>
      {words.map((word, i) => (
        <span key={i}>
          {i > 0 ? " " : ""}
          {i === idx ? <span style={{ color }}>{word}</span> : word}
        </span>
      ))}
    </>
  );
}
