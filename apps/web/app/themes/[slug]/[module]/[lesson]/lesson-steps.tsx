"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { LessonContent } from "./lesson-content";
import { markLessonStarted, markLessonCompleted } from "@/lib/progress-client";
import { trackLessonStarted, trackLessonCompleted } from "@/lib/analytics";
import type { Framework } from "@tensorcraft/shared";
import type { ExerciseData } from "@tensorcraft/ui";
import { SceneHeading } from "@tensorcraft/ui";
import { LessonDrawer } from "./lesson-drawer";

interface LessonStepsProps {
  lesson: {
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
    consequence: { narrative: string; nextLessonTeaser?: string };
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
  userFramework?: Framework;
  lessons?: Array<{
    slug: string;
    title: string;
    order: number;
    locked: boolean;
    completed: boolean;
  }>;
}

const TOTAL_STEPS = 6;

function getLessonSlugFromTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getStorageKey(themeSlug: string, lessonTitle: string): string {
  const lessonSlug = getLessonSlugFromTitle(lessonTitle);
  return `tc_step_${themeSlug}_${lessonSlug}`;
}

export function LessonSteps({
  lesson,
  exercises,
  theme,
  themeSlug,
  moduleSlug,
  moduleName,
  prevLesson,
  nextLesson,
  userFramework,
  lessons,
}: LessonStepsProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [exercisePassed, setExercisePassed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const storageKey = getStorageKey(themeSlug, lesson.title);

  // Read persisted step on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved !== null) {
        const parsed = parseInt(saved, 10);
        if (!isNaN(parsed) && parsed >= 0 && parsed < TOTAL_STEPS) {
          setCurrentStep(parsed);
        }
      }
    } catch {
      // localStorage unavailable
    }
    setMounted(true);
  }, [storageKey]);

  // Persist step changes
  useEffect(() => {
    if (!mounted) return;
    try {
      localStorage.setItem(storageKey, String(currentStep));
    } catch {
      // localStorage unavailable
    }
  }, [currentStep, storageKey, mounted]);

  // Mark lesson as started on mount
  useEffect(() => {
    markLessonStarted(
      themeSlug,
      moduleSlug,
      getLessonSlugFromTitle(lesson.title),
    ).catch(() => {});
    trackLessonStarted(
      themeSlug,
      moduleSlug,
      getLessonSlugFromTitle(lesson.title),
    );
  }, [themeSlug, moduleSlug, lesson.title]);

  // Mark lesson complete when reaching final step (Consequence)
  useEffect(() => {
    if (currentStep === 5) {
      markLessonCompleted(
        themeSlug,
        moduleSlug,
        getLessonSlugFromTitle(lesson.title),
      ).catch(() => {});
      trackLessonCompleted(
        themeSlug,
        moduleSlug,
        getLessonSlugFromTitle(lesson.title),
      );

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
  }, [currentStep, themeSlug, moduleSlug, lesson.title]);

  const handleExerciseComplete = useCallback(() => {
    setExercisePassed(true);
  }, []);

  const canContinue =
    currentStep === 3 // Challenge step
      ? exercises.length === 0 || exercisePassed
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

  const progressPercent = ((currentStep + 1) / TOTAL_STEPS) * 100;

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

  const lessonSlug = getLessonSlugFromTitle(lesson.title);

  const isStoryStep = currentStep === 0 || currentStep === 5;

  return (
    <div
      className="flex-1 overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <div className="w-full max-w-[900px] mx-auto px-6 md:px-12 py-6">
        {/* Top nav: back + progress + counter */}
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
            className="text-sm font-mono flex items-center gap-2 shrink-0 transition-colors px-3 py-2 hover:opacity-80"
            style={{
              color: theme.palette.text,
              background: theme.palette.surface,
              border: `1px solid ${theme.palette.border}`,
            }}
          >
            &larr; {moduleName ?? "Module"}
          </Link>

          <div
            className="flex-1 h-1.5 overflow-hidden"
            style={{ background: theme.palette.border, borderRadius: 2 }}
            role="progressbar"
            aria-valuenow={currentStep + 1}
            aria-valuemin={1}
            aria-valuemax={TOTAL_STEPS}
            aria-label={`Lesson step ${currentStep + 1} of ${TOTAL_STEPS}`}
          >
            <div
              className="h-full transition-all duration-500 ease-out"
              style={{
                width: `${progressPercent}%`,
                background: theme.palette.primary,
                borderRadius: 2,
              }}
            />
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

        {/* Step content - key forces remount for animation */}
        <div
          key={currentStep}
          className={`animate-step-in ${isStoryStep ? "min-h-[50vh] flex flex-col justify-center" : ""}`}
        >
          {currentStep === 0 && (
            <StepBriefing
              lesson={lesson}
              moduleSlug={moduleSlug}
              exercises={exercises}
              theme={theme}
              themeSlug={themeSlug}
              lessonSlug={lessonSlug}
              userFramework={userFramework}
            />
          )}
          {currentStep === 1 && (
            <StepConcept
              lesson={lesson}
              exercises={exercises}
              themeSlug={themeSlug}
              moduleSlug={moduleSlug}
              lessonSlug={lessonSlug}
              userFramework={userFramework}
              theme={theme}
            />
          )}
          {currentStep === 2 && (
            <StepCode
              lesson={lesson}
              exercises={exercises}
              themeSlug={themeSlug}
              moduleSlug={moduleSlug}
              lessonSlug={lessonSlug}
              userFramework={userFramework}
              theme={theme}
            />
          )}
          {currentStep === 3 && (
            <StepChallenge
              lesson={lesson}
              exercises={exercises}
              themeSlug={themeSlug}
              moduleSlug={moduleSlug}
              lessonSlug={lessonSlug}
              userFramework={userFramework}
              theme={theme}
              onExerciseComplete={handleExerciseComplete}
            />
          )}
          {currentStep === 4 && (
            <StepTakeaways
              lesson={lesson}
              exercises={exercises}
              themeSlug={themeSlug}
              moduleSlug={moduleSlug}
              lessonSlug={lessonSlug}
              userFramework={userFramework}
              theme={theme}
            />
          )}
          {currentStep === 5 && (
            <StepConsequence
              lesson={lesson}
              exercises={exercises}
              theme={theme}
              themeSlug={themeSlug}
              moduleSlug={moduleSlug}
              lessonSlug={lessonSlug}
              userFramework={userFramework}
              nextLesson={nextLesson}
            />
          )}
        </div>

        {/* Navigation — inline with content, not a fixed bar */}
        <div
          className="flex items-center justify-between mt-10 pt-6"
          style={{ borderTop: `1px solid ${theme.palette.border}` }}
        >
          <button
            type="button"
            onClick={goBack}
            disabled={currentStep === 0}
            className="text-sm font-mono font-medium px-5 py-3 transition-all"
            style={{
              color:
                currentStep === 0 ? theme.palette.border : theme.palette.text,
              background: theme.palette.surface,
              border: `1px solid ${theme.palette.border}`,
              cursor: currentStep === 0 ? "not-allowed" : "pointer",
              opacity: currentStep === 0 ? 0.3 : 1,
            }}
          >
            &larr; Back
          </button>

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
              style={{
                background: theme.palette.primary,
                color: theme.palette.bg,
              }}
            >
              Next Lesson &rarr;
            </Link>
          ) : (
            <Link
              href={`/themes/${themeSlug}`}
              className="text-sm font-mono font-bold px-8 py-3 transition-all inline-flex items-center"
              style={{
                background: theme.palette.primary,
                color: theme.palette.bg,
              }}
            >
              Module Complete &rarr;
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 0: Briefing
   ────────────────────────────────────────────── */
function StepBriefing({
  lesson,
  moduleSlug,
  exercises,
  theme,
  themeSlug,
  lessonSlug,
  userFramework,
}: {
  lesson: LessonStepsProps["lesson"];
  moduleSlug: string;
  exercises: ExerciseData[];
  theme: LessonStepsProps["theme"];
  themeSlug: string;
  lessonSlug: string;
  userFramework?: Framework;
}) {
  const tierLabel = lesson.concept.bridge?.tier ?? "concept";

  return (
    <div>
      <div
        className="text-xs font-mono uppercase tracking-[3px] mb-6"
        style={{ color: theme.palette.primary }}
      >
        // SECTOR {moduleSlug} &middot; MISSION {lesson.order}
      </div>

      <h1
        className="text-4xl md:text-5xl font-bold mb-5 leading-[1.1] tracking-tight"
        style={{ color: theme.palette.text }}
      >
        {highlightFirstLongWord(lesson.title, theme.palette.primary)}
      </h1>

      <div
        className="flex flex-wrap gap-3 mb-8 pt-5"
        style={{ borderTop: `1px solid ${theme.palette.border}` }}
      >
        <Pill theme={theme}>
          <span style={{ color: theme.palette.primary }}>●</span>{" "}
          {lesson.estimatedMinutes} min
        </Pill>
        <Pill theme={theme}>{tierLabel} bridge</Pill>
        {exercises.length > 0 && (
          <Pill theme={theme}>
            {exercises.length}{" "}
            {exercises.length === 1 ? "exercise" : "exercises"}
          </Pill>
        )}
      </div>

      {/* Scene heading — only if scene frontmatter exists */}
      {lesson.scene && (
        <SceneHeading
          prefix="Int."
          location={lesson.scene.location}
          time={lesson.scene.time}
        />
      )}

      {/* Narrative as stage direction */}
      <p
        className="text-sm italic leading-[1.85] mb-7 max-w-[520px]"
        style={{ color: theme.palette.muted }}
      >
        {lesson.context.narrative}
      </p>

      {/* Dialogue — screenplay beats from MDX */}
      <LessonContent
        lesson={lesson}
        exercises={exercises}
        themeId={themeSlug}
        moduleId={moduleSlug}
        lessonId={lessonSlug}
        userFramework={userFramework}
        visibleComponents={new Set(["Dialogue", "prose"])}
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
  userFramework,
  theme,
}: {
  lesson: LessonStepsProps["lesson"];
  exercises: ExerciseData[];
  themeSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  userFramework?: Framework;
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
          userFramework={userFramework}
          visibleComponents={
            new Set([
              "BridgeCallout",
              "LearningObjectives",
              "Concept",
              "InteractiveDemo",
              "prose",
              "code-tensors",
            ])
          }
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
  userFramework,
  theme,
}: {
  lesson: LessonStepsProps["lesson"];
  exercises: ExerciseData[];
  themeSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  userFramework?: Framework;
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
          userFramework={userFramework}
          visibleComponents={
            new Set([
              "CodeBlock",
              "MathBlock",
              "prose",
              "code-tensors",
              "code-shapes",
            ])
          }
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
  userFramework,
  theme,
  onExerciseComplete,
}: {
  lesson: LessonStepsProps["lesson"];
  exercises: ExerciseData[];
  themeSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  userFramework?: Framework;
  theme: LessonStepsProps["theme"];
  onExerciseComplete: () => void;
}) {
  return (
    <div>
      <PhaseChip theme={theme} label="Challenge" icon={"\u26A1"} />
      <div className="lesson-prose">
        <LessonContent
          lesson={lesson}
          exercises={exercises}
          themeId={themeSlug}
          moduleId={moduleSlug}
          lessonId={lessonSlug}
          userFramework={userFramework}
          visibleComponents={new Set(["Exercise", "challenge"])}
          onExerciseComplete={onExerciseComplete}
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
  userFramework,
  theme,
}: {
  lesson: LessonStepsProps["lesson"];
  exercises: ExerciseData[];
  themeSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  userFramework?: Framework;
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
          userFramework={userFramework}
          visibleComponents={
            new Set([
              "KeyTakeaways",
              "Quiz",
              "HintPanel",
              "RecallPrompt",
              "NextLesson",
            ])
          }
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
  userFramework,
  nextLesson,
}: {
  lesson: LessonStepsProps["lesson"];
  exercises: ExerciseData[];
  theme: LessonStepsProps["theme"];
  themeSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  userFramework?: Framework;
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

      {/* Closing scene from the MDX body (<Epilogue> blocks) — the story
          beat the learner earns by finishing the work. */}
      <div className="max-w-140 mx-auto text-left mb-8">
        <LessonContent
          lesson={lesson}
          exercises={exercises}
          themeId={themeSlug}
          moduleId={moduleSlug}
          lessonId={lessonSlug}
          userFramework={userFramework}
          visibleComponents={new Set(["Epilogue"])}
        />
      </div>

      {/* Next lesson teaser */}
      {lesson.consequence.nextLessonTeaser && (
        <p className="text-[13px] mb-7" style={{ color: theme.palette.border }}>
          {lesson.consequence.nextLessonTeaser}
        </p>
      )}

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

function Pill({
  children,
  theme,
}: {
  children: React.ReactNode;
  theme: LessonStepsProps["theme"];
}) {
  return (
    <span
      className="text-[10px] font-mono uppercase tracking-wider px-3 py-1"
      style={{
        background: theme.palette.surface,
        border: `1px solid ${theme.palette.border}`,
        color: theme.palette.muted,
      }}
    >
      {children}
    </span>
  );
}

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
