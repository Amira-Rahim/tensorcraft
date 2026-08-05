"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { LessonContent } from "./lesson-content";
import {
  markLessonStarted,
  markLessonCompleted,
  emitSkillEvent,
} from "@/lib/progress-client";
import { recordGuestCompletion } from "@/lib/guest-progress";
import {
  trackLessonStarted,
  trackLessonCompleted,
  track,
  EVENTS,
} from "@/lib/analytics";
import type { ExerciseData } from "@tensorcraft/ui";
import { SceneHeading, AnimatedAvatar, ScenePortrait } from "@tensorcraft/ui";
import { AriaWaveformAvatar } from "@tensorcraft/ui/effects";
import { themes } from "@tensorcraft/themes";
import {
  hexToRgb,
  portraitSources,
  resolveCharacter,
} from "@/lib/character-art";
import { LessonDrawer } from "./lesson-drawer";
import { LessonShell } from "./lesson-shell";
import { GuestEmailCapture } from "./guest-email-capture";
import { GlossaryProvider, useGlossary } from "./glossary-context";
import { GlossaryRail } from "./glossary-rail";

/**
 * Per-theme vocabulary. The reader used to hardcode Deep Orbit's words
 * (MISSION / SECTOR / "Mission Map" / "Mission Complete" / "Next Mission"),
 * so Neon Protocol — whose lesson word is "Protocol" — would still render
 * "MISSION 3", an immersion break on every lesson page of every non-orbit
 * theme (scalability audit F1). The map surface already read from
 * theme.terminology; the reader now does too. Falls back to neutral words for
 * an unknown slug so nothing ever renders undefined.
 */
function terms(themeSlug: string): {
  lesson: string;
  module: string;
  exercise: string;
} {
  return (
    themes[themeSlug]?.terminology ?? {
      lesson: "Lesson",
      module: "Module",
      exercise: "Exercise",
    }
  );
}

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
      portraitAlt?: string;
      epiloguePortraitAlt?: string;
    };
    hints?: Array<{
      level: "nudge" | "guidance" | "solution";
      content: string;
    }>;
    skillAxes?: string[];
    glossaryTerms?: Array<{ term: string; definition: string }>;
  };
  exercises: ExerciseData[];
  themeSlug: string;
  moduleSlug: string;
  moduleName?: string;
  /** 1-based module position. Used to detect completion of the free module
   *  (order 1) so Kit can tag the out-of-free-content moment. */
  moduleOrder?: number;
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
  themeSlug,
  moduleSlug,
  moduleName,
  moduleOrder,
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
  // Mirror of passedExercises for handleExerciseComplete's first-pass
  // dedupe. A ref, not the state, so the callback identity stays stable
  // (diff review D2). Seeded alongside the state in the mount-restore.
  const passedExercisesRef = useRef<Set<string>>(new Set());
  const exerciseScoresRef = useRef<Record<string, number>>({});
  const [mounted, setMounted] = useState(false);
  // The left column carries key={currentStep} so the step animation retriggers,
  // which means React unmounts the whole subtree on every step change, bottomNav
  // included. A keyboard user who activates Continue therefore has the element
  // they just activated destroyed under them, and focus falls to <body>: they
  // restart from the top of the document six times per lesson (WCAG 2.4.3,
  // level A). Move focus onto the new step instead. Not on first mount, where
  // the user has not navigated anywhere and stealing focus would be the bug.
  const stepRef = useRef<HTMLDivElement>(null);
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (!hasNavigated.current) {
      hasNavigated.current = true;
      return;
    }
    stepRef.current?.focus();
  }, [currentStep]);
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

  // True when the mount-restore below landed directly on step 5. Consumed
  // (and cleared) by the completion effect so a restored arrival never
  // fires the emit-once completion signals (diff review D1).
  const restoredAtFinalStepRef = useRef(false);

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
          // A restore ONTO step 5 is not an in-session transition. The
          // prevStepRef stamp alone cannot express this: the completion
          // effect's first run (currentStep still 0) stamps prev=0 before
          // this setCurrentStep lands, so its second run would read 0→5 and
          // fire the emit-once signals on every reload of a finished lesson
          // — the exact refire the guard exists to stop (diff review D1;
          // verified empirically). The flag suppresses exactly that first
          // restored arrival and is cleared once consumed.
          if (parsed === 5) restoredAtFinalStepRef.current = true;
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
      // Passed exercises persist too: without this, leaving mid-lesson
      // re-locked the Challenge gate the learner had already opened
      // (2026-07-14 UX audit). Only slugs that are really on this lesson
      // count, so stale storage can't unlock a different lesson's gate.
      const savedPassed = localStorage.getItem(`${storageKey}-passed`);
      if (savedPassed !== null) {
        const slugs = JSON.parse(savedPassed) as string[];
        const valid = slugs.filter((s) =>
          exercises.some((ex) => ex.slug === s),
        );
        if (valid.length > 0) {
          setPassedExercises(new Set(valid));
          passedExercisesRef.current = new Set(valid);
        }
      }
    } catch {
      // localStorage unavailable
    }
    setMaxStepReached(Math.max(step, maxStep));
    setMounted(true);
    // exercises identity is stable per lesson page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, maxStorageKey]);

  // Persist passed exercises as they happen
  useEffect(() => {
    if (!mounted || passedExercises.size === 0) return;
    try {
      localStorage.setItem(
        `${storageKey}-passed`,
        JSON.stringify(Array.from(passedExercises)),
      );
    } catch {
      // localStorage unavailable
    }
  }, [passedExercises, storageKey, mounted]);

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

  // Tracks the previous step so the completion effect can distinguish an
  // in-session TRANSITION into step 5 from a mount that merely restored a
  // persisted step-5 position. Without this, every page load of a finished
  // lesson re-fired the completion analytics and one skill event per axis —
  // reopening a lesson 10× added +40 proficiency for zero work, and
  // completion metrics inflated from day 1 (R3-7).
  const prevStepRef = useRef<number | null>(null);

  // Mark lesson complete when reaching final step (Consequence)
  useEffect(() => {
    const prevStep = prevStepRef.current;
    prevStepRef.current = currentStep;
    if (currentStep === 5) {
      // prevStep alone cannot distinguish a mount-restore onto 5 from a
      // real walk: the effect's first run stamps prev=0 before the restore
      // effect's setCurrentStep(5) lands, so the second run reads 0→5.
      // restoredAtFinalStepRef covers exactly that first restored arrival
      // (diff review D1) and is consumed so later genuine 4→5 transitions
      // in the same session still count.
      const restored = restoredAtFinalStepRef.current;
      restoredAtFinalStepRef.current = false;
      const enteredThisSession = !restored && prevStep !== null && prevStep < 5;
      const scores = Object.values(exerciseScoresRef.current);
      const avgScore =
        scores.length > 0
          ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
          : null;
      // The completion WRITE always runs: it is an idempotent upsert, and the
      // guest fallback below is what GuestProgressBridge replays after
      // signup. Only the emit-once signals live behind the transition guard.
      markLessonCompleted(themeSlug, moduleSlug, lesson.slug, avgScore)
        .then((result) => {
          // Null = no signed-in user (or a failed write): keep local
          // evidence so the map can stage the guest end-of-module moment
          // and GuestProgressBridge can replay it after signup.
          if (result === null) {
            recordGuestCompletion(themeSlug, moduleSlug, lesson.slug);
          }
        })
        .catch(() => {
          recordGuestCompletion(themeSlug, moduleSlug, lesson.slug);
        });

      if (enteredThisSession) {
        trackLessonCompleted(themeSlug, moduleSlug, lesson.slug);

        // Skill genome. `emitSkillEvent` had ZERO call sites until now: the
        // buffer, the 5s flush, the keepalive batch endpoint and
        // POST /api/skill-events were all built and all dead, so
        // `skill_events` was empty for every user and the dashboard radar
        // chart was structurally always zero — a feature that appeared to
        // exist and did not. (It would also have failed silently even once
        // wired, because migration 013 carried over only a SELECT policy;
        // migration 041 adds the INSERT policy.)
        //
        // One event per axis: compute_user_skill_genome loops
        // `SELECT DISTINCT skill_axis`, so multi-axis lessons are expected.
        // Fire-and-forget by design — a lost skill event must never affect
        // lesson completion. Guarded by enteredThisSession: 014's SUM has no
        // dedupe, so these must fire only when the learner actually walked
        // to step 5 this session, never on a restored mount.
        for (const axis of lesson.skillAxes ?? []) {
          emitSkillEvent(themeSlug, "lesson_complete", axis, {
            lessonId: lesson.slug,
            moduleId: moduleSlug,
          });
        }
      }

      // Kit lifecycle tags stay OUTSIDE the transition guard on purpose:
      // tagKitEventOnce records its dedupe flag only when Kit actually
      // tagged someone, so re-attempting on a restored mount is exactly the
      // retry path that recovers users who first finished while the tag env
      // vars were unconfigured.
      // Dedupe correctness lives in tagKitEventOnce: the
      // "already tagged" flag is recorded only when Kit actually tagged
      // someone. Both of these previously burned the flag on a pass that
      // tagged nobody (no session, or an unconfigured tag id answering
      // 200 {skipped:true}), which discarded the user permanently.
      void import("@/lib/kit-tag").then(({ tagKitEventOnce }) => {
        tagKitEventOnce("first_lesson", "tc_first_lesson_tagged").catch(
          () => {},
        );

        // End of the free module: the last beat before the paywall, and the
        // signal retention sequence B keys off to reach someone who finished
        // everything free and then stopped.
        const lastOrder = lessons?.length
          ? Math.max(...lessons.map((l) => l.order))
          : lesson.order;
        if (moduleOrder === 1 && lesson.order === lastOrder) {
          tagKitEventOnce(
            "module_1_complete",
            "tc_module_1_complete_tagged",
          ).catch(() => {});
        }
      });
    }
  }, [
    currentStep,
    themeSlug,
    moduleSlug,
    lesson.slug,
    lesson.order,
    moduleOrder,
    lessons,
  ]);

  const handleExerciseComplete = useCallback(
    (exerciseSlug: string, score: number) => {
      // Dedupe via ref, NOT the passedExercises state: putting the Set in
      // this callback's deps gave it a new identity on every pass, which
      // cascaded through the MDX components memo and REMOUNTED the whole
      // subtree — wiping the exercise's just-shown results panel the
      // instant it appeared (diff review D2). The ref keeps the callback
      // identity stable; the state updater below also returns `prev`
      // unchanged for repeat passes so no render churn occurs.
      const alreadyPassed = passedExercisesRef.current.has(exerciseSlug);
      passedExercisesRef.current.add(exerciseSlug);
      exerciseScoresRef.current[exerciseSlug] = score;
      setPassedExercises((prev) => {
        if (prev.has(exerciseSlug)) return prev;
        const next = new Set(prev);
        next.add(exerciseSlug);
        return next;
      });
      // `exercise_pass` is the heaviest-weighted signal in the genome
      // computation (+3 vs +2 for a lesson, migration 014:26-37), so without
      // it the radar would be dominated by mere completion rather than
      // demonstrated skill. Emit only on the FIRST pass of this exercise:
      // 014's SUM has no dedupe, so re-running an already-green exercise
      // must not add +3/axis per click (R3-7).
      if (!alreadyPassed) {
        for (const axis of lesson.skillAxes ?? []) {
          emitSkillEvent(themeSlug, "exercise_pass", axis, {
            exerciseSlug,
            score,
            lessonId: lesson.slug,
          });
        }
      }
    },
    [themeSlug, lesson.skillAxes, lesson.slug],
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
  const touchFromScrollable = useRef(false);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    // Horizontal pans inside code blocks and the editor are CONTENT
    // scrolling, not navigation: panning a wide code sample used to page
    // the whole lesson (2026-07-14 UX audit).
    const target = e.target as HTMLElement | null;
    touchFromScrollable.current = !!target?.closest(
      "pre, code, .sp-wrapper, .cm-editor, [data-no-swipe]",
    );
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (touchFromScrollable.current) return;
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
              <span style={{ color: "var(--tc-primary)" }}>{word}</span>
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
  };

  // Distinct speakers across the lesson dialogue, for the briefing cast chips.
  const castSpeakers = extractSpeakers(lesson.body, lesson.context.speaker);

  const bottomNav = (
    <div
      className="flex items-center justify-between mt-10 pt-6"
      style={{ borderTop: "1px solid var(--tc-border)" }}
    >
      {/* Back button: the nav was forward-only, leaving the thin 6px step
          segments as the only way back (2026-07-14 UX audit). */}
      {currentStep > 0 ? (
        <button
          type="button"
          onClick={goBack}
          className="text-sm font-mono px-6 py-3 transition-colors"
          style={{ color: "var(--tc-muted)" }}
        >
          &larr; Back
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
      {currentStep < TOTAL_STEPS - 1 ? (
        <button
          type="button"
          onClick={goNext}
          disabled={!canContinue}
          className="text-sm font-mono font-bold px-8 py-3 transition-all"
          style={{
            background: canContinue ? "var(--tc-primary)" : "var(--tc-border)",
            color: canContinue ? "var(--tc-on-primary)" : "var(--tc-muted)",
            cursor: canContinue ? "pointer" : "not-allowed",
            opacity: canContinue ? 1 : 0.3,
          }}
        >
          {/* The gate must explain itself: a silent disabled button at
              the Challenge step read as a broken page (2026-07-14 UX
              audit). */}
          {!canContinue && currentStep === 3
            ? `Pass ${exercises.length - passedExercises.size} more ${exercises.length - passedExercises.size === 1 ? "exercise" : "exercises"} to continue`
            : "Continue →"}
        </button>
      ) : nextLesson ? (
        <Link
          href={`/themes/${themeSlug}/${moduleSlug}/${nextLesson.slug}`}
          className="text-sm font-mono font-bold px-8 py-3 transition-all inline-flex items-center"
          style={{
            background: "var(--tc-primary)",
            color: "var(--tc-on-primary)",
          }}
        >
          Next Lesson &rarr;
        </Link>
      ) : (
        <Link
          href={`/themes/${themeSlug}`}
          className="text-sm font-mono font-bold px-8 py-3 transition-all inline-flex items-center"
          style={{
            background: "var(--tc-primary)",
            color: "var(--tc-on-primary)",
          }}
        >
          Back to {terms(themeSlug).lesson} Map &rarr;
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
        themeSlug={themeSlug}
        lessonSlug={lessonSlug}
        scriptAutoPlay={!scriptPlayedRef.current}
        onScriptPlayed={handleScriptPlayed}
      />
    );
    shellRight = (
      <SceneCard
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
      <div>
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
        {/* The green "tests passed" moment and the unlocked Continue used
            to live in opposite columns (2026-07-14 UX audit): surface the
            way forward right where the pass landed. */}
        {canContinue && (
          <div
            data-testid="challenge-passed-banner"
            className="mt-4 flex items-center justify-between gap-4 border px-5 py-4"
            style={{
              borderColor: "var(--tc-primary)",
              background:
                "color-mix(in srgb, var(--tc-primary) 8%, transparent)",
            }}
            role="status"
          >
            <p
              className="font-mono text-xs uppercase tracking-widest"
              style={{ color: "var(--tc-primary)" }}
            >
              {exercises.length > 1
                ? "All exercises passed"
                : "Exercise passed"}
            </p>
            <button
              type="button"
              onClick={goNext}
              className="text-sm font-mono font-bold px-6 py-2.5"
              style={{
                background: "var(--tc-primary)",
                color: "var(--tc-on-primary)",
              }}
            >
              Continue &rarr;
            </button>
          </div>
        )}
      </div>
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
          lessons={lessons}
          lessonSlug={lessonSlug}
          themeSlug={themeSlug}
        />
      </div>
    );
  } else {
    rightKind = "none";
    shellLeft = (
      <StepConsequence
        {...sharedContentProps}
        nextLesson={nextLesson}
        isFreeModule={moduleOrder === 1}
      />
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
          color: "var(--tc-primary)",
          border:
            "1px solid color-mix(in srgb, var(--tc-primary) 25%, transparent)",
          background: "color-mix(in srgb, var(--tc-primary) 6%, transparent)",
        }}
      >
        {paneOpen
          ? "Show explanation"
          : currentStep === 3
            ? "Show task"
            : "Show code"}
      </button>
    ) : null;

  // For pane steps on mobile the toggle swaps which column is VISIBLE; the
  // pane itself renders exactly once, in the shell's right slot, and
  // LessonShell shows/hides that single instance via paneOpenOnMobile.
  // The old version mounted a SECOND copy of shellRight here behind the
  // toggle — two live Sandpack editors at every width, racing one
  // tc-code-{slug} key and showing a stale buffer after a rotate across lg
  // (fresh-eyes rerun §6 / R3-7; single-mount is now the shell's contract).
  const shellLeftWithToggle =
    rightKind === "pane" ? (
      <>
        {mobileToggle}
        <div className={paneOpen ? "hidden lg:block" : "block"}>
          {shellLeft}
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
          paneOpenOnMobile={paneOpen}
          chrome={
            <div className="mx-auto w-full max-w-[1200px] px-6 md:px-12">
              <ChromeBar
                lessons={lessons}
                lessonSlug={lessonSlug}
                themeSlug={themeSlug}
                moduleSlug={moduleSlug}
                moduleName={moduleName}
                currentStep={currentStep}
                maxStepReached={maxStepReached}
                setCurrentStep={setCurrentStep}
              />
            </div>
          }
          left={
            <div
              key={currentStep}
              ref={stepRef}
              // -1 keeps it out of the tab sequence while still being
              // programmatically focusable, so the step is where a keyboard
              // user lands rather than <body>. The label is what a screen
              // reader announces on arrival, which doubles as the step change
              // announcement.
              tabIndex={-1}
              role="group"
              aria-label={`Step ${currentStep + 1} of ${TOTAL_STEPS}: ${STEP_NAMES[currentStep]}`}
              className={`animate-step-in outline-none ${isStoryStep ? "min-h-[50vh] flex flex-col justify-center" : ""}`}
            >
              {/*
                Only step 0 (Briefing) renders a visible <h1>; steps 1-5
                started at h2/h4 from the MDX, so five of six steps had NO
                level-one heading and an outline that began mid-hierarchy.
                Screen-reader users navigating by heading had nothing to
                orient on. WCAG 1.3.1 and 2.4.6.

                Rendered sr-only and only off step 0, so there is always
                exactly one h1 per step and the visible design is unchanged.
              */}
              {currentStep !== 0 && (
                <h1 className="sr-only">
                  {lesson.title} — {STEP_NAMES[currentStep]}
                </h1>
              )}
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
  currentStep,
  maxStepReached,
  setCurrentStep,
}: {
  lessons: LessonStepsProps["lessons"];
  lessonSlug: string;
  themeSlug: string;
  moduleSlug: string;
  moduleName?: string;
  currentStep: number;
  maxStepReached: number;
  setCurrentStep: (n: number) => void;
}) {
  return (
    // `flex-wrap` plus a full-width basis for the step bar below `sm`.
    //
    // This row previously did not wrap, and every child except the step bar
    // was `shrink-0`. At 320px the fixed children (drawer 44px + "Mission
    // Map" ~146px + counter ~60px + three 16px gaps) total ~298px against a
    // ~272px content box, so the only flexible child — the entire progress
    // indicator — absorbed the whole deficit and rendered at 0.0px wide.
    // Measured 0.0px at 320px and 0.7px at 375px: invisible on every phone,
    // while remaining perfect on desktop, which is why desktop-only checks
    // never caught it. WCAG 1.4.10 (reflow).
    <div className="flex flex-wrap items-center gap-4 mb-6">
      {lessons && (
        <LessonDrawer
          lessons={lessons}
          currentLessonSlug={lessonSlug}
          themeSlug={themeSlug}
          moduleSlug={moduleSlug}
          moduleName={moduleName ?? "Module"}
        />
      )}
      <Link
        href={`/themes/${themeSlug}`}
        className="text-sm font-mono flex items-center gap-2 shrink-0 px-3 py-2 border border-transparent opacity-70 transition-all hover:opacity-100 hover:border-current"
        style={{ color: "var(--tc-text)" }}
      >
        {/* The label is the widest fixed child; drop the words on the
            narrowest screens so the first row still fits. The arrow plus the
            accessible name below keep it unambiguous. */}
        <span aria-hidden="true">&larr;</span>
        <span className="hidden sm:inline">{terms(themeSlug).lesson} Map</span>
        <span className="sr-only sm:hidden">{terms(themeSlug).lesson} Map</span>
      </Link>

      <div
        className="order-last basis-full min-w-0 flex items-center gap-1 sm:order-none sm:basis-auto sm:flex-1"
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
              // h-6 (24px), not h-4: these are documented navigation
              // affordances, so they must meet the WCAG 2.5.8 AA minimum
              // target of 24x24. The visible bar stays 6px — only the hit
              // area grows, centred by `flex items-center`.
              className="flex-1 h-6 flex items-center p-0 border-0 bg-transparent transition-opacity hover:opacity-80 disabled:hover:opacity-100"
              style={{ cursor: visited ? "pointer" : "not-allowed" }}
            >
              <span
                className="h-1.5 w-full transition-all duration-300"
                style={{
                  background: filled ? "var(--tc-primary)" : "var(--tc-border)",
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
          color: "var(--tc-primary)",
          background: "color-mix(in srgb, var(--tc-primary) 7%, transparent)",
          border:
            "1px solid color-mix(in srgb, var(--tc-primary) 15%, transparent)",
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
  themeSlug,
  scene,
  pattern,
  speakers,
}: {
  themeSlug: string;
  scene?: { location: string; time?: string };
  pattern?: LessonStepsProps["lesson"]["pattern"];
  speakers: string[];
}) {
  const patternLabel =
    pattern && pattern !== "standard" ? PATTERN_LABELS[pattern] : undefined;
  return (
    <div className="flex flex-col gap-5">
      <span
        className="font-mono text-xs uppercase tracking-[0.2em]"
        style={{ color: "var(--tc-primary)" }}
      >
        Scene
      </span>
      {scene && (
        <div className="flex flex-col gap-1">
          <span
            className="font-mono text-sm"
            style={{ color: "var(--tc-text)" }}
          >
            {scene.location}
          </span>
          {scene.time && (
            <span
              className="font-mono text-xs uppercase tracking-wider"
              style={{ color: "var(--tc-muted)" }}
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
          style={{ borderColor: "var(--tc-primary)" }}
        >
          <span
            className="font-mono text-[10px] uppercase tracking-[2px]"
            style={{ color: "var(--tc-muted)" }}
          >
            Format
          </span>
          <span
            className="font-mono text-xs"
            style={{ color: "var(--tc-text)" }}
          >
            {patternLabel}
          </span>
        </div>
      )}
      {speakers.length > 0 && (
        <div className="flex flex-col gap-2">
          <span
            className="font-mono text-[10px] uppercase tracking-[2px]"
            style={{ color: "var(--tc-muted)" }}
          >
            Cast
          </span>
          <div className="flex flex-col gap-3">
            {speakers.map((s) => {
              // Dossier roster: always the neutral portrait (a cast card is
              // not a performance). ARIA renders her live waveform glyph;
              // unknown speakers keep the monogram via the no-src fallback.
              const ch = resolveCharacter(themeSlug, s);
              const theme = themes[themeSlug];
              return (
                <div key={s} className="flex items-center gap-2">
                  {ch?.isAI && theme ? (
                    <AriaWaveformAvatar
                      name={s}
                      size={30}
                      rgb={hexToRgb(theme.palette.primary)}
                      rgbLight={hexToRgb(theme.paletteLight.primary)}
                    />
                  ) : (
                    <AnimatedAvatar
                      name={s}
                      src={portraitSources(themeSlug, ch).src}
                      size={30}
                    />
                  )}
                  <div className="flex flex-col">
                    <span
                      className="font-mono text-xs"
                      style={{ color: "var(--tc-text)" }}
                    >
                      {s}
                    </span>
                    {ch?.role && (
                      <span
                        className="font-mono text-[10px]"
                        style={{ color: "var(--tc-muted)" }}
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
  lessons,
  lessonSlug,
  themeSlug,
}: {
  lessons: LessonStepsProps["lessons"];
  lessonSlug: string;
  themeSlug: string;
}) {
  if (!lessons || lessons.length === 0) return null;
  const done = lessons.filter((l) => l.completed).length;
  return (
    <div className="flex flex-col gap-3">
      <span
        className="font-mono text-xs uppercase tracking-[0.2em]"
        style={{ color: "var(--tc-primary)" }}
      >
        {terms(themeSlug).lesson} Progress
      </span>
      <span className="text-sm" style={{ color: "var(--tc-muted)" }}>
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
                color: isCurrent ? "var(--tc-text)" : "var(--tc-muted)",
              }}
            >
              <span
                className="w-1.5 h-1.5 inline-block shrink-0"
                style={{
                  background:
                    l.completed || isCurrent
                      ? "var(--tc-primary)"
                      : "var(--tc-border)",
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
  themeSlug,
  lessonSlug,
  scriptAutoPlay,
  onScriptPlayed,
}: {
  lesson: LessonStepsProps["lesson"];
  moduleSlug: string;
  exercises: ExerciseData[];
  themeSlug: string;
  lessonSlug: string;
  scriptAutoPlay: boolean;
  onScriptPlayed: () => void;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const timeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const scrollPendingRef = useRef(false);
  // When the current playback run started; feeds script_skipped's elapsedMs
  // so the ">40% skip triggers narrative redesign" QA rule is computable.
  const playStartedAtRef = useRef<number>(0);
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
    playStartedAtRef.current = Date.now();
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
        style={{ color: "var(--tc-primary)" }}
      >
        {terms(themeSlug).module.toUpperCase()} {moduleSlug} &middot;{" "}
        {terms(themeSlug).lesson.toUpperCase()} {lesson.order}
      </div>

      <h1
        className="text-4xl md:text-5xl font-bold mb-5 leading-[1.1] tracking-tight"
        style={{ color: "var(--tc-text)" }}
      >
        {highlightFirstLongWord(lesson.title, "var(--tc-primary)")}
      </h1>

      <div
        className="font-mono text-xs uppercase tracking-wider mb-8 pt-5"
        style={{
          color: "var(--tc-muted)",
          borderTop: "1px solid var(--tc-border)",
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
            onClick={() => {
              // The scene only plays on the briefing step (step 0).
              track(EVENTS.SCRIPT_SKIPPED, {
                themeId: themeSlug,
                lessonId: lessonSlug,
                step: 0,
                elapsedMs: playStartedAtRef.current
                  ? Date.now() - playStartedAtRef.current
                  : 0,
              });
              finish(false);
            }}
            className="text-[10px] font-mono uppercase tracking-[2px] px-3 py-1.5 transition-colors hover:opacity-80"
            style={{
              color: "var(--tc-muted)",
              border: "1px solid var(--tc-border)",
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
              color: "var(--tc-muted)",
              border: "1px solid var(--tc-border)",
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

      {/* Establishing shot: its own playback beat, slugline then picture
          then stage direction, screenplay order. The src is speculative
          (art ships incrementally per docs/scene-bible.md); on 404 the
          component removes itself and the timeline matches today's. */}
      {lesson.scene && (
        <ScenePortrait
          beat
          src={`/scenes/${themeSlug}/${moduleSlug}/${lessonSlug}.webp`}
          alt={lesson.scene.portraitAlt}
        />
      )}

      {/* Narrative as stage direction */}
      <p
        data-script-beat=""
        className="text-sm italic leading-[1.85] mb-7 pl-6 max-w-[52ch]"
        style={{ color: "var(--tc-muted)" }}
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
        hideChallengeOnward
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
}: {
  lesson: LessonStepsProps["lesson"];
  exercises: ExerciseData[];
  themeSlug: string;
  moduleSlug: string;
  lessonSlug: string;
}) {
  return (
    <div>
      <PhaseChip label="Concept" icon={"\u25CE"} />
      <p
        className="text-base leading-[1.85] mb-6"
        style={{ color: "var(--tc-muted)" }}
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
          hideChallengeOnward
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
}: {
  lesson: LessonStepsProps["lesson"];
  exercises: ExerciseData[];
  themeSlug: string;
  moduleSlug: string;
  lessonSlug: string;
}) {
  return (
    <div>
      <PhaseChip label="Code" icon={"\u2318"} />
      <div className="lesson-prose">
        <LessonContent
          lesson={lesson}
          exercises={exercises}
          themeId={themeSlug}
          moduleId={moduleSlug}
          lessonId={lessonSlug}
          glossaryTerms={lesson.glossaryTerms}
          visibleComponents={CODE_LEFT}
          hideChallengeOnward
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
}: {
  lesson: LessonStepsProps["lesson"];
  exercises: ExerciseData[];
  themeSlug: string;
  moduleSlug: string;
  lessonSlug: string;
}) {
  return (
    <div>
      <PhaseChip label="Challenge" icon={"\u26A1"} />
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
}: {
  lesson: LessonStepsProps["lesson"];
  exercises: ExerciseData[];
  themeSlug: string;
  moduleSlug: string;
  lessonSlug: string;
}) {
  return (
    <div>
      <PhaseChip label="Takeaways" icon={"\u2713"} />
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
  themeSlug,
  moduleSlug,
  lessonSlug,
  nextLesson,
  isFreeModule,
}: {
  lesson: LessonStepsProps["lesson"];
  exercises: ExerciseData[];
  themeSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  nextLesson: { slug: string; title: string } | null;
  isFreeModule?: boolean;
}) {
  return (
    <div className="text-center py-12">
      {/*
        FADE OUT marker. Screenplay atmosphere, not information: it reads at
        1.23:1 by design (border colour on surface), which WCAG 1.4.3 exempts
        as pure decoration. Marked decorative rather than brightened so the
        beat survives, and so the axe gate can skip it by attribute instead of
        having the whole rule muted. See e2e/accessibility.spec.ts.
      */}
      <div
        aria-hidden="true"
        data-decorative="true"
        className="font-mono text-[9px] uppercase tracking-[3px] mb-8"
        style={{ color: "var(--tc-border)" }}
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

      {/* Epilogue shot, only for the lessons with a distinct epilogue
          location (the -epilogue asset variant). No beat: this step has no
          playback. Missing art removes itself, as on the Briefing. */}
      {lesson.scene?.epilogueLocation && (
        <ScenePortrait
          src={`/scenes/${themeSlug}/${moduleSlug}/${lessonSlug}-epilogue.webp`}
          alt={lesson.scene.epiloguePortraitAlt}
          className="mb-7 mx-auto max-w-[440px]"
        />
      )}

      {/* Mission complete badge */}
      <div
        className="inline-flex items-center gap-2 text-[10px] font-mono uppercase tracking-[2px] px-4 py-1.5 mb-6"
        style={{
          color: "var(--tc-primary)",
          border:
            "1px solid color-mix(in srgb, var(--tc-primary) 15%, transparent)",
          background: "color-mix(in srgb, var(--tc-primary) 6%, transparent)",
        }}
      >
        <span
          className="w-1.5 h-1.5 inline-block"
          style={{ background: "var(--tc-primary)" }}
        />
        {terms(themeSlug).lesson} Complete
      </div>

      <h2
        className="text-[26px] font-bold mb-5"
        style={{ color: "var(--tc-text)" }}
      >
        {lesson.title}
      </h2>

      {/* Narrative as italic cinematic narration */}
      <p
        className="text-[15px] italic leading-[1.9] max-w-[520px] mx-auto mb-8"
        style={{ color: "var(--tc-muted)" }}
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

      {/* Guest email capture at the free-trial consumption point
          (T1-13/§9): every free-module lesson end is a potential leave
          point, and a guest who leaves was permanently unreachable. Guests
          only; the component itself checks the session. */}
      {isFreeModule && <GuestEmailCapture themeSlug={themeSlug} />}

      {/* Next lesson card */}
      {nextLesson && (
        <Link
          href={`/themes/${themeSlug}/${moduleSlug}/${nextLesson.slug}`}
          className="inline-flex items-center gap-4 text-left px-6 py-5 max-w-[420px] mx-auto transition-all hover:translate-x-[-2px] hover:translate-y-[-2px]"
          style={{
            background: "var(--tc-surface)",
            border: "1px solid var(--tc-border)",
          }}
        >
          <div className="flex-1">
            <div
              className="text-[9px] font-mono uppercase tracking-[1.5px] mb-1"
              style={{ color: "var(--tc-muted)" }}
            >
              Next {terms(themeSlug).lesson}
            </div>
            <div
              className="text-[15px] font-semibold"
              style={{ color: "var(--tc-text)" }}
            >
              {nextLesson.title}
            </div>
          </div>
          <span
            className="text-base shrink-0"
            style={{ color: "var(--tc-primary)" }}
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

function PhaseChip({ label, icon }: { label: string; icon: string }) {
  return (
    <div
      className="text-[10px] font-mono uppercase tracking-[2px] mb-6 flex items-center gap-2"
      style={{ color: "var(--tc-primary)" }}
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
