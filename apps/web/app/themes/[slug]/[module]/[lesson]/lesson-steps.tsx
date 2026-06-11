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

/* Per-step MDX visibility sets, hoisted so their identity is stable across
   renders. Passing a fresh Set each render makes LessonContent rebuild its
   memoized MDX component, which remounts the whole MDX DOM subtree on every
   parent re-render (breaking the script-playback timeline's element refs
   and recompiling the MDX body needlessly). */
const BRIEFING_COMPONENTS = new Set(["Dialogue", "prose"]);
const CONCEPT_COMPONENTS = new Set([
  "BridgeCallout",
  "LearningObjectives",
  "Concept",
  "InteractiveDemo",
  "prose",
  "code-tensors",
]);
const CODE_COMPONENTS = new Set([
  "CodeBlock",
  "MathBlock",
  "prose",
  "code-tensors",
  "code-shapes",
]);
const CHALLENGE_COMPONENTS = new Set(["Exercise", "challenge"]);
const TAKEAWAYS_COMPONENTS = new Set([
  "KeyTakeaways",
  "Quiz",
  "HintPanel",
  "RecallPrompt",
  "NextLesson",
]);
const CONSEQUENCE_COMPONENTS = new Set(["Epilogue"]);

const STEP_NAMES = [
  "Briefing",
  "Concept",
  "Code",
  "Challenge",
  "Takeaways",
  "Consequence",
] as const;

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

function getMaxStorageKey(themeSlug: string, lessonTitle: string): string {
  const lessonSlug = getLessonSlugFromTitle(lessonTitle);
  return `tc_step_max_${themeSlug}_${lessonSlug}`;
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
  const [maxStepReached, setMaxStepReached] = useState(0);
  const [exercisePassed, setExercisePassed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Script playback runs once per visit; returning to the Briefing step
  // shows the scene static with a Replay control instead of re-playing.
  const scriptPlayedRef = useRef(false);
  const handleScriptPlayed = useCallback(() => {
    scriptPlayedRef.current = true;
  }, []);

  const storageKey = getStorageKey(themeSlug, lesson.title);
  const maxStorageKey = getMaxStorageKey(themeSlug, lesson.title);

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
              scriptAutoPlay={!scriptPlayedRef.current}
              onScriptPlayed={handleScriptPlayed}
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

        {/* Navigation, inline with content, not a fixed bar. Backward nav
            lives in the segmented step bar (and swipe on mobile), so the
            bottom row only moves forward. */}
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
              Back to Mission Map &rarr;
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
  userFramework,
  scriptAutoPlay,
  onScriptPlayed,
}: {
  lesson: LessonStepsProps["lesson"];
  moduleSlug: string;
  exercises: ExerciseData[];
  theme: LessonStepsProps["theme"];
  themeSlug: string;
  lessonSlug: string;
  userFramework?: Framework;
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
        {`${lesson.estimatedMinutes} min${exercises.length > 0 ? ` · ${exercises.length} ${exercises.length === 1 ? "exercise" : "exercises"}` : ""}`}
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
        userFramework={userFramework}
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
          visibleComponents={CONCEPT_COMPONENTS}
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
          visibleComponents={CODE_COMPONENTS}
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
          visibleComponents={CHALLENGE_COMPONENTS}
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

      {/* Closing scene from the MDX body (<Epilogue> blocks), the story
          beat the learner earns by finishing the work. */}
      <div className="max-w-140 mx-auto text-left mb-8">
        <LessonContent
          lesson={lesson}
          exercises={exercises}
          themeId={themeSlug}
          moduleId={moduleSlug}
          lessonId={lessonSlug}
          userFramework={userFramework}
          visibleComponents={CONSEQUENCE_COMPONENTS}
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
