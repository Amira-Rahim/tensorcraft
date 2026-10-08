"use client";
import {
  LearningActivityScope,
  useActivityUser,
} from "@/app/components/learning-activity-scope";

import { useState, useEffect, useCallback, useRef } from "react";
import type { ResolvedReviewItem } from "@tensorcraft/shared";
import type { FreeRecallPrompt } from "@/lib/free-recall-prompts";
import { enqueueReviews } from "@/lib/review-store-api";
import { LessonWarmup } from "@/app/components/lesson-warmup";
import { ModuleEntryContext } from "@/app/components/module-entry-context";
import Link from "next/link";
import { ReportIssueTrigger } from "@/app/components/report-issue-button";
import { LessonContent } from "./lesson-content";
import { SceneClip } from "./scene-clip";
import { sceneClipFor } from "@/lib/scene-clips";
import {
  getAssignedBriefingVariant,
  type BriefingVariant,
} from "@/lib/briefing-variant";
import {
  markLessonStarted,
  markLessonCompleted,
  emitSkillEvent,
} from "@/lib/progress-client";
import {
  recordGuestCompletion,
  getGuestCompletions,
} from "@/lib/guest-progress";
import { patchSrc } from "@/lib/patch-art";
import {
  prefersSkippedScript,
  rememberScriptSkipped,
} from "@/lib/script-preference";
import { completesModule } from "./completes-module";
import { PatchAward } from "./patch-award";
import { ChallengePassedBanner } from "./challenge-passed-banner";
import {
  trackLessonStarted,
  trackLessonCompleted,
  trackModuleCompleted,
  track,
  EVENTS,
} from "@/lib/analytics";
import type { ExerciseData } from "@tensorcraft/ui";
import { SceneHeading, ScenePortrait } from "@tensorcraft/ui";
import { worlds } from "@tensorcraft/worlds";
import { LessonDrawer } from "./lesson-drawer";
import { LessonShell } from "./lesson-shell";
import { GuestEmailCapture } from "./guest-email-capture";
import { LessonTermsList } from "./lesson-terms-list";
import {
  PHASE,
  TOTAL_STEPS,
  STEP_NAMES,
  STEP_EVENT_NAMES,
  LESSON_STEPS_VERSION,
  lessonStepKeys,
  restoreLessonSteps,
  parseStepHash,
  stepHash,
  historyStep,
} from "@/lib/lesson-phases";
import {
  LessonMissionScene,
  LessonConceptWorkbench,
} from "@/app/components/lesson-visuals/lesson-workbench";

/**
 * Per-world vocabulary. The reader used to hardcode Deep Orbit's words
 * (MISSION / SECTOR / "Mission Map" / "Mission Complete" / "Next Mission"),
 * so Neon Protocol - whose lesson word is "Protocol" - would still render
 * "MISSION 3", an immersion break on every lesson page of every non-orbit
 * world (scalability audit F1). The map surface already read from
 * world.terminology; the reader now does too. Falls back to neutral words for
 * an unknown slug so nothing ever renders undefined.
 */
function terms(worldSlug: string): {
  lesson: string;
  module: string;
  exercise: string;
} {
  return (
    worlds[worldSlug]?.terminology ?? {
      lesson: "Lesson",
      module: "Module",
      exercise: "Exercise",
    }
  );
}

interface LessonStepsProps {
  /** Explicit route entry; never permits bypassing the exercise completion gate. */
  entryStep?: 0 | 1 | 2;
  reviewUserId?: string | null;
  dueReviews?: ResolvedReviewItem[];
  freeRecallPrompts?: FreeRecallPrompt[];
  lesson: {
    /** Velite frontmatter slug - the canonical lesson id used by every
     *  progress read (world map, dashboard, certificates). All writes MUST
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
        jsTitle: string;
        jsCode: string;
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
    recallPrompts?: Array<{ index: number }>;
    glossaryTerms?: Array<{ term: string; definition: string }>;
  };
  exercises: ExerciseData[];
  passedExerciseSlugs?: string[];
  exerciseHistoryUnavailable?: boolean;
  worldSlug: string;
  moduleSlug: string;
  moduleName?: string;
  /** 1-based module position. Used to detect completion of the free module
   *  (order 1) so Kit can tag the out-of-free-content moment. */
  moduleOrder?: number;
  /** Catch-up for a learner opening a later module cold. The server sets it
   *  only on the first lesson of modules 2 and up; the Briefing renders it
   *  after the scene has played. Null everywhere else. */
  moduleEntry?: {
    moduleSlug: string;
    previousModule?: string;
    previousComplete: boolean;
  } | null;
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

/* Per-step MDX visibility sets, hoisted so their identity is stable across
   renders. Passing a fresh Set each render makes LessonContent rebuild its
   memoized MDX component, which remounts the whole MDX DOM subtree on every
   parent re-render (breaking the script-playback timeline's element refs
   and recompiling the MDX body needlessly). */
/* CodeBlock joined 2026-09-04 (re-audit): two cold-open lessons carry a
   pre-heading CodeBlock the Briefing narrated but nulled; post-heading code
   stays hidden via hideTeaching regardless. */
const BRIEFING_COMPONENTS = new Set([
  "Dialogue",
  "BossBeat",
  "CodeBlock",
  "prose",
]);
const BRIEFING_TAKEAWAY_COMPONENTS = new Set(["BriefingTakeaway"]);

/* The Concept and Challenge steps each render two LessonContent
   instances with disjoint Sets, so no component renders twice: Concept
   splits into the objectives intro (in flow above the read) and the read;
   Challenge splits into a LEFT reading column and a RIGHT work pane. Interactive components with side
   effects live in exactly one partition: Exercise only in CHALLENGE_RIGHT,
   RecallPrompt only in TAKEAWAYS_RECALL. */

/* Each phase owns one content slice. Briefing keeps the opening scene,
   Concept keeps the full teaching read with code and derivations,
   Challenge owns instructions and the editor, Takeaways owns recall and
   recap, and Epilogue keeps the earned ending. */

// Concept: the complete teaching read. Code blocks render INLINE here so
// prose that narrates code has the code beside it on every viewport, and
// Dialogue is included because 9 lessons carry mid-lesson story beats
// AFTER the first heading (re-audit 2026-09-04: those beats rendered on no
// step at all without this). The opening scene does not duplicate here:
// hideStoryZone hides everything before the first heading on this step.
const CONCEPT_LEFT = new Set([
  "ConceptReference",
  "ChannelLayoutExperiment",
  "LearningExperiment",
  "BridgeCallout",
  "Concept",
  "Dialogue",
  "InteractiveDemo",
  "CodeBlock",
  "MathBlock",
  "DerivationDrawer",
  "prose",
  "code-tensors",
]);
const CONCEPT_INTRO = new Set(["LearningObjectives"]);

// Challenge: challenge zone, the exercise brief where the MDX places the
// exercise (a pseudo-name: the left instance renders ExerciseBrief there,
// spec 2026-09-24 section 3), and the hint ladders on the left; the
// Exercise editor in the right pane.
const CHALLENGE_LEFT = new Set([
  "challenge",
  "ExerciseBrief",
  "HintPanel",
  "TransferAssignment",
  "DecisionTask",
  "IndependentProject",
]);
const CHALLENGE_RIGHT = new Set(["Exercise"]);

// Takeaways: the recall card first, alone; the lesson close (LessonRecap,
// ProjectMilestone, NextLesson) once every card has left its prompt, so
// the answer is never on screen while the learner is asked for it (spec
// 2026-09-24, section 2). Then the terms list, an app component.
const TAKEAWAYS_RECALL = new Set(["RecallPrompt"]);
const TAKEAWAYS_AFTER = new Set([
  "ProjectMilestone",
  "LessonRecap",
  "NextLesson",
]);
const CONSEQUENCE_COMPONENTS = new Set(["Epilogue", "DispatchTease"]);

/* Exported for the content-partition contract test only: the test sweeps
   every lesson MDX against these sets so a component that would render on
   no step (the re-audit's silent-deletion class of bug) fails CI instead
   of shipping. */
export const STEP_VISIBILITY = {
  BRIEFING_COMPONENTS,
  BRIEFING_TAKEAWAY_COMPONENTS,
  CONCEPT_LEFT,
  CONCEPT_INTRO,
  CHALLENGE_LEFT,
  CHALLENGE_RIGHT,
  TAKEAWAYS_RECALL,
  TAKEAWAYS_AFTER,
  CONSEQUENCE_COMPONENTS,
} as const;

/* Public entry: wraps the reader in the learning-activity scope, which
   holds the lesson until the signed-in account matches the server's. */
export function LessonSteps(props: LessonStepsProps) {
  return (
    <LearningActivityScope
      userId={props.reviewUserId ?? null}
      requireServerIdentity
    >
      <LessonStepsInner {...props} />
    </LearningActivityScope>
  );
}

function LessonStepsInner({
  entryStep = 0,
  passedExerciseSlugs = [],
  exerciseHistoryUnavailable = false,
  lesson,
  exercises,
  worldSlug,
  moduleSlug,
  moduleName,
  moduleOrder,
  moduleEntry = null,
  prevLesson,
  nextLesson,
  lessons,
  dueReviews = [],
  freeRecallPrompts = [],
}: LessonStepsProps) {
  const reviewUserId = useActivityUser();
  const knownCompleted = !!lessons?.some(
    (item) => item.slug === lesson.slug && item.completed,
  );
  const restoredPasses = exercises
    .filter((ex) => knownCompleted || passedExerciseSlugs.includes(ex.slug))
    .map((ex) => ex.slug);
  const warmupCompletedRef = useRef(false);
  const handleWarmupDone = useCallback(() => {
    warmupCompletedRef.current = true;
  }, []);
  const [currentStep, setCurrentStep] = useState<number>(entryStep);
  const [maxStepReached, setMaxStepReached] = useState<number>(
    knownCompleted ? PHASE.epilogue : entryStep,
  );
  // A lesson with N exercises requires N passes: one green run per embedded
  // exercise, keyed by exercise slug (the incident-pairing lessons have 2).
  const [passedExercises, setPassedExercises] = useState<Set<string>>(
    () => new Set(restoredPasses),
  );
  // Mirror of passedExercises for handleExerciseComplete's first-pass
  // dedupe. A ref, not the state, so the callback identity stays stable
  // (diff review D2). Seeded alongside the state in the mount-restore.
  const passedExercisesRef = useRef<Set<string>>(new Set(restoredPasses));
  const exerciseScoresRef = useRef<Record<string, number>>({});
  const [mounted, setMounted] = useState(false);
  // The left column carries key={currentStep} so the step animation retriggers,
  // which means React unmounts the whole subtree on every step change, bottomNav
  // included. A keyboard user who activates Continue therefore has the element
  // they just activated destroyed under them, and focus falls to <body>: they
  // restart from the top of the document on every phase change (WCAG 2.4.3,
  // level A). Move focus onto the new step instead. Not on first mount, where
  // the user has not navigated anywhere and stealing focus would be the bug.
  const stepRef = useRef<HTMLDivElement>(null);
  const navigationReadyRef = useRef(false);
  const focusedStepRef = useRef(currentStep);
  useEffect(() => {
    if (!mounted) return;
    // Restoring a position, including a StrictMode effect replay, must not
    // steal initial focus or scroll the lesson header out of view.
    if (!navigationReadyRef.current) {
      navigationReadyRef.current = true;
      focusedStepRef.current = currentStep;
      return;
    }
    if (focusedStepRef.current === currentStep) return;
    focusedStepRef.current = currentStep;
    stepRef.current?.focus();
  }, [currentStep, mounted]);
  // Mobile-only: reveal the right work pane (code/exercise) over the prose.
  const [paneOpen, setPaneOpen] = useState(false);

  // Script playback runs once per visit; returning to the Briefing step
  // shows the scene static with a Replay control instead of re-playing.
  const scriptPlayedRef = useRef(false);
  const handleScriptPlayed = useCallback(() => {
    scriptPlayedRef.current = true;
  }, []);

  // ── In-lesson telemetry (2026-09-04 lesson-format audit) ──
  // Everything between lesson_started and lesson_completed used to be
  // invisible: no step views, no durations, and skip intent measurable only
  // on the first-ever manual skip. These refs feed lesson_step_viewed,
  // lesson_completed.durationMs/hintsUsed, script_skipped(via:"continue"),
  // and the world_progress hints/attempts columns that were permanently 0.
  const lessonStartedAtRef = useRef<number>(Date.now());
  const stepEnteredAtRef = useRef<number>(Date.now());
  const prevViewedStepRef = useRef<number | null>(null);
  // Steps this browser has ever seen for this lesson: seeded from the
  // persisted maxStepReached so a restored session reports revisits
  // honestly instead of as first views.
  const visitedStepsRef = useRef<Set<number>>(new Set());
  const hintsRevealedRef = useRef<Set<1 | 2 | 3>>(new Set());
  const exerciseAttemptsRef = useRef(0);
  // Shared with StepBriefing so goNext can tell "paged past a playing
  // scene" (a skip in all but name) from a normal Continue.
  const scriptStatusRef = useRef<{ playing: boolean; startedAt: number }>({
    playing: false,
    startedAt: 0,
  });

  // Which Briefing this browser gets (owner ruling 2026-09-04: launch
  // ships with video). "text" until mount so SSR and the first client
  // render agree; flips to "clip" only when a manifest entry exists AND
  // the sticky holdback assignment says so. Tagged onto the script/step
  // events so the launch window reads as a concurrent experiment.
  const [briefingVariant, setBriefingVariant] =
    useState<BriefingVariant>("text");

  const handleHintLevelRevealed = useCallback((level: 1 | 2 | 3) => {
    hintsRevealedRef.current.add(level);
  }, []);
  const handleExerciseAttempt = useCallback(() => {
    exerciseAttemptsRef.current += 1;
  }, []);
  const getHintsUsed = useCallback(() => hintsRevealedRef.current.size, []);

  const stepKeys = lessonStepKeys(worldSlug, lesson.slug, reviewUserId);
  const {
    current: storageKey,
    max: maxStorageKey,
    passed: passedKey,
    recall: recallKey,
  } = stepKeys;
  // True once every recall card on Takeaways has left its prompt in this
  // mount, or this browser remembers doing so. Sticky: the left column is
  // keyed on the step, so StepTakeaways remounts on every visit and its
  // instance reports afresh; a later non-zero report must not hide the
  // recap that already showed.
  const [recallSettled, setRecallSettled] = useState(false);
  const recallEverPendingRef = useRef(false);
  const handleRecallPending = useCallback(
    (pending: number) => {
      if (pending > 0) {
        recallEverPendingRef.current = true;
        return;
      }
      setRecallSettled(true);
      // A body with no card reports 0 without ever being pending: nothing
      // to remember. A learner who settled a card is remembered.
      if (!recallEverPendingRef.current) return;
      try {
        localStorage.setItem(recallKey, "1");
      } catch {
        // localStorage unavailable
      }
    },
    [recallKey],
  );

  // True when the mount-restore below landed directly on the Epilogue. Consumed
  // (and cleared) by the completion effect so a restored arrival never
  // fires the emit-once completion signals (diff review D1).
  const restoredAtFinalStepRef = useRef(false);

  // URL-addressable steps (2026-09-04 audit step 2): browser Back steps
  // back through the lesson instead of exiting it, and a step is linkable.
  // Hash-based on purpose: a query param would update the app router and
  // fire a $pageview per step; the hash keeps navigation native. One-way
  // flow per gesture: user navigation pushes a hash entry; popstate
  // (Back/Forward) sets the step with the push suppressed.
  const popNavRef = useRef(false);
  const maxStepRef = useRef(0);
  // Mirror for the popstate listener: a pop that clamps to the CURRENT
  // step causes no state change, so the push effect would never consume
  // popNavRef and the next genuine navigation's push would be swallowed
  // (re-audit 2026-09-04).
  const currentStepRef = useRef(0);
  useEffect(() => {
    currentStepRef.current = currentStep;
  }, [currentStep]);
  useEffect(() => {
    maxStepRef.current = maxStepReached;
  }, [maxStepReached]);

  // Read persisted step + furthest step reached on mount
  useEffect(() => {
    let step: number = entryStep;
    let maxStep: number = knownCompleted ? PHASE.epilogue : entryStep;
    // New keys take precedence; old Concept and Code both restore to Concept.
    // Read fields separately so a corrupt list cannot discard valid progress.
    let restored: ReturnType<typeof restoreLessonSteps> = {
      current: null,
      max: null,
      visited: [],
    };
    try {
      restored = restoreLessonSteps(localStorage, stepKeys);
    } catch {
      /* storage denied */
    }
    if (entryStep === PHASE.briefing && restored.current !== null)
      step = restored.current;
    maxStep = Math.max(maxStep, restored.max ?? 0, step);
    visitedStepsRef.current = new Set(restored.visited);
    // Read before the passed-exercises block below: a malformed `-passed`
    // entry throws inside that block's own try, and must not skip this
    // read (Task 5 addendum item 2).
    try {
      if (localStorage.getItem(recallKey) === "1") setRecallSettled(true);
    } catch {
      // localStorage unavailable
    }
    // A guest who finished this lesson is a returning learner too. The
    // server's lessons prop (knownCompleted) never knows a guest, so the
    // local guest record settles the gate, merged the way the completion
    // effect merges it for the award check.
    try {
      if (
        getGuestCompletions().some(
          (c) =>
            c.worldId === worldSlug &&
            c.moduleId === moduleSlug &&
            c.lessonId === lesson.slug,
        )
      ) {
        setRecallSettled(true);
      }
    } catch {
      // localStorage unavailable
    }
    try {
      // Passed exercises persist too: without this, leaving mid-lesson
      // re-locked the Challenge gate the learner had already opened
      // (2026-07-14 UX audit). Only slugs that are really on this lesson
      // count, so stale storage can't unlock a different lesson's gate.
      const savedPassed = localStorage.getItem(passedKey);
      if (savedPassed !== null) {
        const slugs = JSON.parse(savedPassed) as string[];
        const valid = slugs.filter((s) =>
          exercises.some((ex) => ex.slug === s),
        );
        if (valid.length > 0) {
          const combined = new Set([...restoredPasses, ...valid]);
          setPassedExercises(combined);
          passedExercisesRef.current = combined;
        }
      }
    } catch {
      // localStorage unavailable
    }
    // A #step-N deep link wins over the stored position when that ground
    // was already covered; a link into unvisited territory clamps away.
    const fromHash = parseStepHash(window.location.hash);
    if (fromHash !== null && fromHash <= Math.max(step, maxStep)) {
      step = fromHash;
    }
    restoredAtFinalStepRef.current = step === PHASE.epilogue;
    setCurrentStep(step);
    // Normalize the entry so Back from the next step returns here.
    try {
      // Child mount effects can run before Next patches the History API.
      // Preserve its router state so Back does not turn into a page reload.
      window.history.replaceState(
        {
          ...window.history.state,
          tcStep: step,
          tcStepsVersion: LESSON_STEPS_VERSION,
        },
        "",
        stepHash(step),
      );
    } catch {
      // History API unavailable (some embedded contexts): steps still work.
    }
    setMaxStepReached(Math.max(step, maxStep));
    if (
      lesson.scene &&
      sceneClipFor(worldSlug, moduleSlug, lesson.slug) &&
      getAssignedBriefingVariant() === "clip"
    ) {
      setBriefingVariant("clip");
    }
    setMounted(true);
    // exercises identity is stable per lesson page load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey, maxStorageKey, passedKey, recallKey]);

  // Persist passed exercises as they happen
  useEffect(() => {
    if (!mounted || passedExercises.size === 0) return;
    try {
      localStorage.setItem(
        passedKey,
        JSON.stringify(Array.from(passedExercises)),
      );
    } catch {
      // localStorage unavailable
    }
  }, [passedExercises, passedKey, mounted]);

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

  // Push a history entry per user step change (skip pop-driven ones and
  // the already-normalized mount position).
  useEffect(() => {
    if (!mounted) return;
    if (popNavRef.current) {
      popNavRef.current = false;
      return;
    }
    if (parseStepHash(window.location.hash) === currentStep) return;
    try {
      window.history.pushState(
        {
          ...window.history.state,
          tcStep: currentStep,
          tcStepsVersion: LESSON_STEPS_VERSION,
        },
        "",
        stepHash(currentStep),
      );
    } catch {
      // History API unavailable
    }
  }, [currentStep, mounted]);

  // Back/Forward walk the step history. Forward into never-reached ground
  // clamps to the furthest step (the exercise gate is not bypassable by
  // URL), and the hash is re-normalized when the clamp bites.
  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const target = historyStep(e.state, window.location.hash);
      if (target === null) return;
      const clamped = Math.min(Math.max(target, 0), maxStepRef.current);
      if (
        clamped !== target ||
        window.location.hash !== stepHash(clamped) ||
        e.state?.tcStepsVersion !== LESSON_STEPS_VERSION
      ) {
        try {
          window.history.replaceState(
            {
              ...window.history.state,
              tcStep: clamped,
              tcStepsVersion: LESSON_STEPS_VERSION,
            },
            "",
            stepHash(clamped),
          );
        } catch {
          // History API unavailable
        }
      }
      // A clamp landing on the current step changes no state: do not arm
      // the push suppression, there will be no push to suppress.
      if (clamped === currentStepRef.current) return;
      popNavRef.current = true;
      setCurrentStep(clamped);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Mark lesson as started on mount
  useEffect(() => {
    lessonStartedAtRef.current = Date.now();
    markLessonStarted(worldSlug, moduleSlug, lesson.slug).catch(() => {});
    trackLessonStarted(worldSlug, moduleSlug, lesson.slug);
  }, [worldSlug, moduleSlug, lesson.slug]);

  // Per-step funnel. Fires on every step entry once the mount-restore has
  // settled (so a resumed session reports its restored step, not a
  // phantom step 0). prevStepMs is the dwell on the step just left; the
  // final step's dwell is intentionally unmeasured (tab close beats any
  // unload handler often enough that a partial number would mislead).
  useEffect(() => {
    if (!mounted) return;
    const now = Date.now();
    const prevStep = prevViewedStepRef.current;
    const prevStepMs =
      prevStep === null ? undefined : now - stepEnteredAtRef.current;
    stepEnteredAtRef.current = now;
    prevViewedStepRef.current = currentStep;
    const revisit = visitedStepsRef.current.has(currentStep);
    visitedStepsRef.current.add(currentStep);
    // Persist the exact visited set so later sessions stay revisit-honest
    // (jumped-over steps must NOT read as visited; re-audit 2026-09-04).
    try {
      localStorage.setItem(
        `${storageKey}-visited`,
        JSON.stringify(Array.from(visitedStepsRef.current)),
      );
    } catch {
      // localStorage unavailable
    }
    track(EVENTS.LESSON_STEP_VIEWED, {
      worldId: worldSlug,
      moduleId: moduleSlug,
      lessonId: lesson.slug,
      step: currentStep,
      stepName: STEP_EVENT_NAMES[currentStep],
      stepsVersion: LESSON_STEPS_VERSION,
      prevStep: prevStep ?? undefined,
      prevStepMs,
      revisit,
      briefingVariant,
    });
    // briefingVariant settles in the same commit as mounted, so it never
    // changes after the first fire and cannot double-fire a view.
  }, [
    currentStep,
    mounted,
    worldSlug,
    moduleSlug,
    lesson.slug,
    storageKey,
    briefingVariant,
  ]);

  // Tracks the previous step so the completion effect can distinguish an
  // in-session TRANSITION into the Epilogue from a mount that merely restored a
  // persisted Epilogue position. Without this, every page load of a finished
  // lesson re-fired the completion analytics and one skill event per axis -
  // reopening a lesson 10× added +40 proficiency for zero work, and
  // completion metrics inflated from day 1 (R3-7).
  const prevStepRef = useRef<number | null>(null);

  // Armed the session this lesson closes out its module: the Consequence
  // step then reveals the module's mission patch (docs/patch-bible.md,
  // "patch award moment" spec). Never armed on a restored mount.
  const [awardSrc, setAwardSrc] = useState<string | null>(null);

  // Mark lesson complete when reaching final step (Consequence)
  useEffect(() => {
    const prevStep = prevStepRef.current;
    prevStepRef.current = currentStep;
    if (currentStep === PHASE.epilogue) {
      // prevStep alone cannot distinguish a mount-restore onto the Epilogue from a
      // real walk: the effect's first run stamps prev=0 before the restore
      // effect's setCurrentStep(5) lands, so the second run reads 0→5.
      // restoredAtFinalStepRef covers exactly that first restored arrival
      // (diff review D1) and is consumed so later genuine 4→5 transitions
      // in the same session still count.
      const restored = restoredAtFinalStepRef.current;
      restoredAtFinalStepRef.current = false;
      const enteredThisSession =
        !restored && prevStep !== null && prevStep < PHASE.epilogue;
      const scores = Object.values(exerciseScoresRef.current);
      const avgScore =
        scores.length > 0
          ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
          : null;
      // The completion WRITE always runs: it is an idempotent upsert, and the
      // guest fallback below is what GuestProgressBridge replays after
      // signup. Only the emit-once signals live behind the transition guard.
      // Hint/attempt counters ride along ONLY on a genuine walk to the Epilogue:
      // the write re-runs on every reload of a finished lesson, and session
      // counters must not re-accumulate on restores.
      const extras = enteredThisSession
        ? {
            hintsUsed: hintsRevealedRef.current.size,
            attempts: exerciseAttemptsRef.current,
          }
        : undefined;
      // Zero the session attempt counter once it rides along: attempts SUM
      // server-side, and a 4-to-5 oscillation in the same session must not
      // re-add the same runs (re-audit 2026-09-04). Hints keep max
      // semantics, so re-sending the same size is naturally idempotent.
      if (extras) exerciseAttemptsRef.current = 0;
      // Auth comes from the server page, never from a failed progress write.
      void enqueueReviews(
        reviewUserId,
        worldSlug,
        moduleSlug,
        lesson.slug,
        (lesson.recallPrompts ?? []).map((prompt) => prompt.index),
      );
      markLessonCompleted(worldSlug, moduleSlug, lesson.slug, avgScore, extras)
        .then((result) => {
          // Null = no signed-in user (or a failed write): keep local
          // evidence so the map can stage the guest end-of-module moment
          // and GuestProgressBridge can replay it after signup.
          if (result === null) {
            recordGuestCompletion(worldSlug, moduleSlug, lesson.slug);
          }
        })
        .catch(() => {
          recordGuestCompletion(worldSlug, moduleSlug, lesson.slug);
        });

      if (enteredThisSession) {
        // Award check, synchronous and before the completion write settles:
        // "done" merges server truth (the lessons prop) with local guest
        // records, so free-module guests get the moment too. Restored
        // mounts never reach here, so the award cannot re-fire on reload.
        const guestDone = new Set(
          getGuestCompletions()
            .filter((c) => c.worldId === worldSlug && c.moduleId === moduleSlug)
            .map((c) => c.lessonId),
        );
        const completedModule = completesModule(
          lessons,
          lesson.slug,
          guestDone,
        );
        const patch = patchSrc(worldSlug, moduleSlug);
        if (patch && completedModule) {
          setAwardSrc(patch);
        }

        trackLessonCompleted(
          worldSlug,
          moduleSlug,
          lesson.slug,
          Date.now() - lessonStartedAtRef.current,
          hintsRevealedRef.current.size,
        );
        if (completedModule) {
          trackModuleCompleted(worldSlug, moduleSlug, lessons?.length ?? 1);
        }

        // Skill genome. `emitSkillEvent` had ZERO call sites until now: the
        // buffer, the 5s flush, the keepalive batch endpoint and
        // POST /api/skill-events were all built and all dead, so
        // `skill_events` was empty for every user and the dashboard radar
        // chart was structurally always zero - a feature that appeared to
        // exist and did not. (It would also have failed silently even once
        // wired, because migration 013 carried over only a SELECT policy;
        // migration 041 adds the INSERT policy.)
        //
        // One event per axis: compute_user_skill_genome loops
        // `SELECT DISTINCT skill_axis`, so multi-axis lessons are expected.
        // Fire-and-forget by design - a lost skill event must never affect
        // lesson completion. Guarded by enteredThisSession: 014's SUM has no
        // dedupe, so these must fire only when the learner actually walked
        // to the Epilogue this session, never on a restored mount.
        for (const axis of lesson.skillAxes ?? []) {
          emitSkillEvent(worldSlug, "lesson_complete", axis, {
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
    worldSlug,
    moduleSlug,
    lesson.slug,
    lesson.order,
    lesson.recallPrompts,
    lesson.skillAxes,
    reviewUserId,
    moduleOrder,
    lessons,
  ]);

  const handleExerciseComplete = useCallback(
    (exerciseSlug: string, score: number) => {
      // Dedupe via ref, NOT the passedExercises state: putting the Set in
      // this callback's deps gave it a new identity on every pass, which
      // cascaded through the MDX components memo and REMOUNTED the whole
      // subtree - wiping the exercise's just-shown results panel the
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
          emitSkillEvent(worldSlug, "exercise_pass", axis, {
            exerciseSlug,
            score,
            lessonId: lesson.slug,
          });
        }
      }
    },
    [worldSlug, lesson.skillAxes, lesson.slug],
  );

  const canContinue =
    currentStep === PHASE.challenge // Challenge step
      ? exercises.length === 0 || passedExercises.size >= exercises.length
      : currentStep < TOTAL_STEPS - 1;

  // Paging away from a still-playing scene is a skip in all but name; it
  // used to be invisible, biasing the >40% skip-rate rule low. Counted
  // only, deliberately not remembered: an eager Continue is weaker
  // evidence of opt-out than the Skip button, so it must not arm the
  // forever auto-skip preference.
  const markSceneSkippedByNav = useCallback(() => {
    if (!scriptStatusRef.current.playing) return;
    scriptStatusRef.current.playing = false;
    track(EVENTS.SCRIPT_SKIPPED, {
      worldId: worldSlug,
      lessonId: lesson.slug,
      step: 0,
      elapsedMs: scriptStatusRef.current.startedAt
        ? Date.now() - scriptStatusRef.current.startedAt
        : 0,
      via: "continue",
      briefingVariant,
    });
  }, [worldSlug, lesson.slug, briefingVariant]);

  const goNext = useCallback(() => {
    if (canContinue && currentStep < TOTAL_STEPS - 1) {
      if (currentStep === PHASE.briefing) markSceneSkippedByNav();
      setCurrentStep((s) => s + 1);
    }
  }, [canContinue, currentStep, markSceneSkippedByNav]);

  // The skimmer's path (audit step 2): a confident engineer's first visit
  // had no route to the editor except three Continues and two reading
  // steps. Jumping unlocks the step bar back to the skipped ground; the
  // exercise gate itself is untouched.
  const jumpToChallenge = useCallback(() => {
    markSceneSkippedByNav();
    setCurrentStep(PHASE.challenge);
  }, [markSceneSkippedByNav]);

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
    // Horizontal pans inside the editor and inside a code block that
    // scrolls sideways are CONTENT scrolling, not navigation: panning a
    // wide code sample used to page the whole lesson (2026-07-14 UX audit).
    // Code wraps below 1,024 px (spec 2026-09-24 section 4), so most blocks
    // on a phone cannot pan and a swipe over them pages. The block is the
    // nearest pre first: inline code inside a scrolling pre has no scroll
    // box of its own. The two widths round separately, so a 1 px gap at a
    // fractional width is not overflow (the +1 the overflow specs use).
    const target = e.target as HTMLElement | null;
    const block = target?.closest("pre") ?? target?.closest("code");
    touchFromScrollable.current =
      !!target?.closest(".sp-wrapper, .cm-editor, [data-no-swipe]") ||
      (!!block && block.scrollWidth - block.clientWidth > 1);
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

  const sharedContentProps = {
    lesson,
    exercises,
    worldSlug,
    moduleSlug,
    lessonSlug,
  };

  const bottomNav = (
    <div
      data-testid="lesson-nav"
      className="flex flex-wrap items-center justify-between mt-(--l-nav-top) pt-(--l-nav-inner) gap-(--l-nav-inner) pb-(--l-nav-bottom)"
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
      ) : exercises.length > 0 && maxStepReached < PHASE.challenge ? (
        // First-visit fast path to the editor; hidden once the Challenge
        // step is reachable from the step bar anyway.
        <button
          type="button"
          onClick={jumpToChallenge}
          className="text-sm font-mono px-6 py-3 transition-colors hover:opacity-80"
          style={{ color: "var(--tc-muted)" }}
        >
          Skip to the challenge &rarr;
        </button>
      ) : (
        <span aria-hidden="true" />
      )}
      {currentStep < TOTAL_STEPS - 1 ? (
        <button
          type="button"
          data-step-continue=""
          onClick={goNext}
          disabled={!canContinue}
          className="text-sm font-mono font-bold px-8 py-3 transition-all"
          style={{
            background: canContinue ? "var(--tc-primary)" : "var(--tc-border)",
            color: canContinue ? "var(--tc-on-primary)" : "var(--tc-muted)",
            cursor: canContinue ? "pointer" : "not-allowed",
            opacity: 1,
          }}
        >
          {/* The gate must explain itself: a silent disabled button at
              the Challenge step read as a broken page (2026-07-14 UX
              audit). */}
          {!canContinue && currentStep === PHASE.challenge
            ? `Pass ${exercises.length - passedExercises.size} more ${exercises.length - passedExercises.size === 1 ? "exercise" : "exercises"} to continue`
            : "Continue →"}
        </button>
      ) : nextLesson ? (
        <Link
          href={`/worlds/${worldSlug}/${moduleSlug}/${nextLesson.slug}`}
          data-testid="next-lesson-card"
          className="ml-auto inline-flex min-h-11 items-center gap-4 px-6 py-3 text-left transition-opacity hover:opacity-90"
          style={{
            background: "var(--tc-primary)",
            color: "var(--tc-on-primary)",
          }}
        >
          <span className="flex-1">
            <span className="block text-[9px] font-mono uppercase tracking-[1.5px] mb-0.5">
              Next {terms(worldSlug).lesson}
              <span className="sr-only">: </span>
            </span>
            <span className="block text-[15px] font-semibold">
              {nextLesson.title}
            </span>
          </span>
          <span aria-hidden="true" className="text-base shrink-0">
            &rarr;
          </span>
        </Link>
      ) : (
        <Link
          href={`/worlds/${worldSlug}`}
          className="text-sm font-mono font-bold px-8 py-3 transition-all inline-flex items-center"
          style={{
            background: "var(--tc-primary)",
            color: "var(--tc-on-primary)",
          }}
        >
          Back to {terms(worldSlug).lesson} Map &rarr;
        </Link>
      )}
    </div>
  );

  let shellLeft: React.ReactNode;
  let shellRight: React.ReactNode = null;
  let rightKind: React.ComponentProps<typeof LessonShell>["rightKind"];

  if (currentStep === PHASE.briefing) {
    rightKind = "none";
    shellLeft = (
      <StepBriefing
        lesson={lesson}
        moduleSlug={moduleSlug}
        exercises={exercises}
        worldSlug={worldSlug}
        lessonSlug={lessonSlug}
        reviewUserId={reviewUserId}
        moduleOrder={moduleOrder}
        dueReviews={warmupCompletedRef.current ? [] : dueReviews}
        onWarmupDone={handleWarmupDone}
        freeRecallPrompts={freeRecallPrompts}
        scriptAutoPlay={!scriptPlayedRef.current}
        onScriptPlayed={handleScriptPlayed}
        scriptStatusRef={scriptStatusRef}
        briefingVariant={briefingVariant}
        moduleEntry={moduleEntry}
        clipUrl={
          briefingVariant === "clip"
            ? (sceneClipFor(worldSlug, moduleSlug, lesson.slug)?.url ?? null)
            : null
        }
      />
    );
  } else if (currentStep === PHASE.concept) {
    rightKind = "none";
    shellLeft = <StepConcept {...sharedContentProps} />;
  } else if (currentStep === PHASE.challenge) {
    rightKind = "pane";
    shellLeft = (
      <StepChallenge
        {...sharedContentProps}
        onHintRevealed={handleHintLevelRevealed}
      />
    );
    shellRight = (
      <div>
        <LessonContent
          lesson={lesson}
          exercises={exercises}
          worldId={worldSlug}
          moduleId={moduleSlug}
          lessonId={lessonSlug}
          glossaryTerms={lesson.glossaryTerms}
          visibleComponents={CHALLENGE_RIGHT}
          onExerciseComplete={handleExerciseComplete}
          onExerciseAttempt={handleExerciseAttempt}
          getHintsUsed={getHintsUsed}
        />
        <ChallengePassedBanner
          passed={canContinue}
          exerciseCount={exercises.length}
          checkedWork={exercises.map((exercise) => exercise.title)}
          onContinue={goNext}
        />
      </div>
    );
  } else if (currentStep === PHASE.takeaways) {
    rightKind = "none";
    shellLeft = (
      <StepTakeaways
        {...sharedContentProps}
        recallSettled={recallSettled || knownCompleted}
        onRecallPending={handleRecallPending}
      />
    );
  } else {
    rightKind = "none";
    shellLeft = (
      <StepConsequence
        {...sharedContentProps}
        isFreeModule={moduleOrder === 1}
        award={
          awardSrc
            ? {
                src: awardSrc,
                moduleName: moduleName ?? moduleSlug,
                moduleTerm: terms(worldSlug).module,
              }
            : null
        }
      />
    );
  }

  const mobileControls =
    rightKind === "pane" ? (
      <div
        className="lg:hidden mb-6 flex gap-2"
        role="group"
        aria-label="Challenge view"
      >
        <button
          type="button"
          aria-pressed={!paneOpen}
          onClick={() => setPaneOpen(false)}
          className={`min-h-11 flex-1 px-3 text-sm font-mono border border-border ${!paneOpen ? "bg-surface text-primary" : "text-text-muted"}`}
        >
          Instructions
        </button>
        <button
          type="button"
          aria-pressed={paneOpen}
          onClick={() => setPaneOpen(true)}
          className={`min-h-11 flex-1 px-3 text-sm font-mono border border-border ${paneOpen ? "bg-surface text-primary" : "text-text-muted"}`}
        >
          Editor
        </button>
      </div>
    ) : null;

  return (
    <div
      className="lesson-page flex-1 overflow-y-auto"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 16 px on top (the beat gap) and nothing below: the nav's own bottom
          padding (--l-nav-bottom) is the whole gap to the site footer (spec
          section 6). */}
      <div className="pt-4">
        {exerciseHistoryUnavailable && (
          <p
            role="status"
            className="mx-auto mb-4 max-w-7xl px-5 md:px-12 text-sm text-text-muted"
          >
            Saved exercise passes could not be loaded. This browser’s progress
            is still available.{" "}
            <button
              type="button"
              className="min-h-11 underline"
              onClick={() => window.location.reload()}
            >
              Retry saved progress
            </button>
          </p>
        )}
        <LessonShell
          rightKind={rightKind}
          fullWidth={currentStep === PHASE.briefing}
          paneOpenOnMobile={paneOpen}
          controls={mobileControls}
          footer={rightKind === "pane" ? bottomNav : undefined}
          chrome={
            <div className="w-full px-5 md:px-12">
              <ChromeBar
                lessons={lessons}
                lessonSlug={lessonSlug}
                worldSlug={worldSlug}
                moduleSlug={moduleSlug}
                moduleName={moduleName}
                lessonTitle={lesson.title}
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
              className="animate-step-in outline-none"
            >
              {shellLeft}
              {rightKind !== "pane" && (
                <div className="lesson-body-frame">{bottomNav}</div>
              )}
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
  worldSlug,
  moduleSlug,
  moduleName,
  lessonTitle,
  currentStep,
  maxStepReached,
  setCurrentStep,
}: {
  lessons: LessonStepsProps["lessons"];
  lessonSlug: string;
  worldSlug: string;
  moduleSlug: string;
  moduleName?: string;
  lessonTitle: string;
  currentStep: number;
  maxStepReached: number;
  setCurrentStep: (n: number) => void;
}) {
  // The Briefing's title card is that step's H1 and the Complete step's
  // closing card is that step's (spec 2026-09-24, section 6); on steps 2
  // to 5 the chrome title is the page's only H1 and stays.
  const showTitle = currentStep !== 0 && currentStep !== TOTAL_STEPS - 1;
  return (
    // `flex-wrap` plus a full-width basis for the step bar below `sm`.
    //
    // This row previously did not wrap, and every child except the step bar
    // was `shrink-0`. At 320px the fixed children (drawer 44px + "Mission
    // Map" ~146px + counter ~60px + three 16px gaps) total ~298px against a
    // ~272px content box, so the only flexible child - the entire progress
    // indicator - absorbed the whole deficit and rendered at 0.0px wide.
    // Measured 0.0px at 320px and 0.7px at 375px: invisible on every phone,
    // while remaining perfect on desktop, which is why desktop-only checks
    // never caught it. WCAG 1.4.10 (reflow).
    //
    // pb-4 and mb-4: the hairline sits 16 px under the controls and 16 px
    // over the step.
    <div
      data-testid="lesson-chrome"
      className="mb-4 border-b border-border pb-4"
    >
      <div className="lesson-masthead">
        <div className="lesson-masthead-context">
          <p className="lesson-masthead-module">{moduleName ?? moduleSlug}</p>
          <ReportIssueTrigger />
        </div>
        {showTitle && <h1 className="lesson-masthead-title">{lessonTitle}</h1>}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {lessons && (
          <LessonDrawer
            lessons={lessons}
            currentLessonSlug={lessonSlug}
            worldSlug={worldSlug}
            moduleSlug={moduleSlug}
            moduleName={moduleName ?? "Module"}
          />
        )}
        <Link
          href={`/worlds/${worldSlug}`}
          className="text-sm font-mono flex items-center gap-2 shrink-0 px-3 py-2 border border-transparent opacity-70 transition-all hover:opacity-100 hover:border-current"
          style={{ color: "var(--tc-text)" }}
        >
          {/* The label is the widest fixed child; drop the words on the
            narrowest screens so the first row still fits. The arrow plus the
            accessible name below keep it unambiguous. */}
          <span aria-hidden="true">&larr;</span>
          <span className="hidden sm:inline">
            {terms(worldSlug).lesson} Map
          </span>
          <span className="sr-only sm:hidden">
            {terms(worldSlug).lesson} Map
          </span>
        </Link>

        <div
          className="order-last basis-full min-w-0 flex items-center gap-1 sm:order-none sm:basis-auto sm:flex-1"
          role="group"
          aria-label={`Lesson step ${currentStep + 1} of ${TOTAL_STEPS}`}
        >
          {STEP_NAMES.map((name, i) => {
            const visited = i <= maxStepReached;
            const filled = i <= currentStep;
            const current = i === currentStep;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setCurrentStep(i)}
                disabled={!visited}
                aria-label={`Step ${i + 1}: ${name}`}
                aria-current={current ? "step" : undefined}
                title={visited ? name : `${name} (locked)`}
                // h-6 (24px), not h-4: these are documented navigation
                // affordances, so they must meet the WCAG 2.5.8 AA minimum
                // target of 24x24. The visible bar stays 6px. From lg the
                // step name sits under the bar and the button grows to h-8;
                // min-w-0 lets `truncate` on the label act on a flex-1 item.
                // Hover dims the bar only: dimming the whole button took the label below AA.
                className="group flex-1 min-w-0 h-6 lg:h-8 flex flex-col justify-center gap-1 p-0 border-0 bg-transparent"
                style={{ cursor: visited ? "pointer" : "not-allowed" }}
              >
                <span
                  className={
                    visited
                      ? "h-1.5 w-full transition-all duration-300 group-hover:opacity-80"
                      : "h-1.5 w-full transition-all duration-300 opacity-45"
                  }
                  style={{
                    background: filled
                      ? "var(--tc-primary)"
                      : "var(--tc-border)",
                    borderRadius: 2,
                  }}
                />
                <span
                  data-testid="step-label"
                  className={
                    visited
                      ? "hidden lg:block text-[11px] font-mono uppercase tracking-wider truncate text-left"
                      : "hidden lg:block text-[11px] font-mono uppercase tracking-wider truncate text-left opacity-45"
                  }
                  style={{
                    color: current ? "var(--tc-primary)" : "var(--tc-muted)",
                  }}
                >
                  {name}
                </span>
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
          <span>
            {currentStep + 1} / {TOTAL_STEPS}
          </span>{" "}
          · {STEP_NAMES[currentStep]}
        </span>
      </div>
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
  worldSlug,
  lessonSlug,
  scriptAutoPlay,
  onScriptPlayed,
  scriptStatusRef,
  briefingVariant = "text",
  moduleEntry = null,
  clipUrl = null,
  reviewUserId,
  moduleOrder,
  dueReviews,
  freeRecallPrompts,
  onWarmupDone,
}: {
  onWarmupDone: () => void;
  reviewUserId: string | null;
  /** Course order of this lesson's module; with `lesson.order` it tells the
   *  warm-up which prompts count as earlier material. */
  moduleOrder?: number;
  dueReviews: ResolvedReviewItem[];
  freeRecallPrompts: FreeRecallPrompt[];
  lesson: LessonStepsProps["lesson"];
  moduleSlug: string;
  exercises: ExerciseData[];
  worldSlug: string;
  lessonSlug: string;
  scriptAutoPlay: boolean;
  onScriptPlayed: () => void;
  /** Shared with the step machine so Continue-past-a-playing-scene can be
   *  counted as a skip (goNext reads it). Optional for test harnesses. */
  scriptStatusRef?: React.MutableRefObject<{
    playing: boolean;
    startedAt: number;
  }>;
  /** Which Briefing this browser serves; tags the script telemetry. */
  briefingVariant?: BriefingVariant;
  /** Set only on the first lesson of modules 2 and up. */
  moduleEntry?: LessonStepsProps["moduleEntry"];
  /** Approved clip URL, only when the variant is "clip". */
  clipUrl?: string | null;
}) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const timeoutsRef = useRef<Array<ReturnType<typeof setTimeout>>>([]);
  const scrollPendingRef = useRef(false);
  // When the current playback run started; feeds script_skipped's elapsedMs
  // so the ">40% skip triggers narrative redesign" QA rule is computable.
  const playStartedAtRef = useRef<number>(0);
  // Which control launched the current run; script_finished carries it so
  // the skip-rate denominator can exclude replays.
  const runKindRef = useRef<"auto" | "replay">("auto");
  const [scriptState, setScriptState] = useState<"idle" | "playing" | "done">(
    "idle",
  );
  const hasBegunRef = useRef(false);
  // Deliberately NOT reset in the mount effect's cleanup, unlike hasBegunRef.
  // React's development double-invoke tears the effect down and runs it
  // again; playback must restart on that second run (its timers were
  // cleared), but the remembered-skip metric must not be emitted twice. The
  // spaced-review spec kept this honest by deferring the whole effect behind
  // the warm-up; with the warm-up after the scene (2026-09-22) the guard has
  // to be explicit.
  const autoSkipEmittedRef = useRef(false);
  const [warmupDone, setWarmupDone] = useState(false);
  const finishWarmup = useCallback(
    (hadReviews: boolean) => {
      setWarmupDone(true);
      onWarmupDone();
      // The card sits after the scene (2026-09-22), so once it unmounts the
      // next thing to do is Continue. Put focus there instead of letting it
      // fall to body.
      if (hadReviews)
        requestAnimationFrame(() => {
          rootRef.current
            ?.closest('[role="group"]')
            ?.querySelector<HTMLElement>("[data-step-continue]")
            ?.focus();
        });
    },
    [onWarmupDone],
  );
  const [beatsShown, setBeatsShown] = useState(0);

  const clearTimeline = useCallback(() => {
    for (const t of timeoutsRef.current) clearTimeout(t);
    timeoutsRef.current = [];
  }, []);

  /* A beat is one story element revealed on the timeline: the scene
     slugline, the picture, then every pre-heading child
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
      if (scriptStatusRef) scriptStatusRef.current.playing = false;
      scrollPendingRef.current = scrollToExplanation;
      setScriptState("done");
      onScriptPlayed();
    },
    [clearTimeline, onScriptPlayed, scriptStatusRef],
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
    if (scriptStatusRef) {
      scriptStatusRef.current = { playing: true, startedAt: Date.now() };
    }
    setBeatsShown(0);
    setScriptState("playing");
    let at = 350;
    beats.forEach((b, i) => {
      timeoutsRef.current.push(setTimeout(() => setBeatsShown(i + 1), at));
      at += beatHoldMs(b);
    });
    timeoutsRef.current.push(
      setTimeout(() => {
        // The skip-rate denominator (audit 2026-09-04): before this event
        // existed, script_skipped had no "watched it all" counterpart, so
        // the >40% rule had a numerator and nothing to divide by.
        track(EVENTS.SCRIPT_FINISHED, {
          worldId: worldSlug,
          lessonId: lessonSlug,
          step: 0,
          elapsedMs: Date.now() - playStartedAtRef.current,
          run: runKindRef.current,
          briefingVariant,
        });
        // finish(false): since the prose partition the Briefing ends at the
        // story zone, so there is no explanation below to auto-scroll into.
        finish(false);
      }, at + 200),
    );
  }, [
    clearTimeline,
    collectBeats,
    finish,
    scriptStatusRef,
    worldSlug,
    lessonSlug,
  ]);

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
  //
  // A learner who skipped once is not asked again: replaying a ~15.5s scene
  // at someone who already opted out is the complaint, not the scene itself
  // (owner decision 2026-08-23, keep the story, fix the affordance). The
  // "Replay scene" control below stays, so the scene is never unreachable.
  useEffect(() => {
    let active = true;
    const beginAutoPlay = () => {
      if (!active || hasBegunRef.current) return;
      hasBegunRef.current = true;
      if (scriptAutoPlay && !prefersSkippedScript()) {
        runKindRef.current = "auto";
        play();
      } else if (scriptAutoPlay) {
        // The remembered preference suppressed playback. Since 2026-08-23
        // this path was silent, so every skip after the first-ever manual
        // one vanished from the metric and the skip rate was biased low by
        // construction (audit 2026-09-04).
        if (!autoSkipEmittedRef.current) {
          autoSkipEmittedRef.current = true;
          track(EVENTS.SCRIPT_SKIPPED, {
            worldId: worldSlug,
            lessonId: lessonSlug,
            step: 0,
            elapsedMs: 0,
            via: "auto",
            briefingVariant,
          });
        }
        finish(false);
      } else {
        finish(false);
      }
    };
    // Nothing holds the scene back any more: the warm-up moved into the
    // post-scene slot on 2026-09-22, so playback starts on mount as it did
    // before the spaced-review spec deferred it.
    beginAutoPlay();
    return () => {
      active = false;
      hasBegunRef.current = false;
      clearTimeline();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {/* aria-busy: while the scene plays, the instructional content is
    // display:none and absent from the accessibility tree; flag the region
    // as loading so screen readers know more content is coming. */}
      <div
        ref={rootRef}
        style={scriptState === "idle" ? { visibility: "hidden" } : undefined}
        data-script-state={scriptState}
        aria-busy={scriptState === "playing" ? "true" : undefined}
      >
        <header data-testid="lesson-briefing-header">
          <div
            data-testid="lesson-eyebrow"
            className="text-xs font-mono uppercase tracking-[3px] mb-3"
            style={{ color: "var(--tc-primary)" }}
          >
            {terms(worldSlug).module.toUpperCase()} {moduleSlug} &middot;{" "}
            {terms(worldSlug).lesson.toUpperCase()} {lesson.order}
            {lesson.pattern && lesson.pattern !== "standard" && (
              <>
                {" "}
                &middot;{" "}
                <span data-testid="pattern-format-tag">
                  {PATTERN_LABELS[lesson.pattern]}
                </span>
              </>
            )}{" "}
            &middot;{" "}
            {/* Reading + embedded exercises: "14 min · 2 exercises" where the
            exercises alone are 30 min reads as a lie. One basis everywhere
            (module map, JSON-LD, courseWorkload). */}
            {`${lesson.estimatedMinutes + exercises.reduce((s, e) => s + (e.estimatedMinutes ?? 0), 0)} min${exercises.length > 0 ? ` · ${exercises.length} ${exercises.length === 1 ? "exercise" : "exercises"}` : ""}`}
          </div>

          <h1
            className="text-4xl md:text-6xl font-bold mb-3 leading-[1.1] tracking-tight"
            style={{ color: "var(--tc-text)" }}
          >
            {highlightFirstLongWord(lesson.title, "var(--tc-primary)")}
          </h1>

          {worldSlug === "deep-orbit" &&
            lessonSlug === "introduction-to-tensors" && (
              <p
                data-testid="course-orientation"
                className="w-full mb-6 text-base md:text-lg leading-relaxed text-text"
              >
                You’ll learn machine learning in JavaScript by building a system
                that flags unusual sensor readings. At its core is a model: a
                program trained on examples to recognize patterns. You’ll test
                it on new data and run it in the browser.
              </p>
            )}
        </header>

        <div className="lesson-body-frame">
          {/* Slugline row: the scene heading (first beat) and the playback
          control, on one line over one hairline. The control sits outside
          the beat wrapper so it never inherits a beat's hidden state. Both
          controls share a 44 px height and a 160 px minimum width (min-h-11
          min-w-40), so the row keeps its height and its wrapping when Skip
          becomes Replay, and ml-auto keeps the control at the right when the
          row wraps on a phone or there is no scene. The context below stays
          visible while the scene plays, so the learner can understand the
          situation before the picture and dialogue reveal. */}
          <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border pb-2 mb-4">
            {lesson.scene ? (
              <div data-script-beat="" className="min-w-0">
                <SceneHeading
                  prefix="Int."
                  location={lesson.scene.location}
                  time={lesson.scene.time}
                  divider={false}
                />
              </div>
            ) : null}
            {scriptState === "playing" ? (
              <button
                type="button"
                onClick={() => {
                  // The scene only plays on the briefing step (step 0).
                  track(EVENTS.SCRIPT_SKIPPED, {
                    worldId: worldSlug,
                    lessonId: lessonSlug,
                    step: 0,
                    elapsedMs: playStartedAtRef.current
                      ? Date.now() - playStartedAtRef.current
                      : 0,
                    via: "button",
                    briefingVariant,
                  });
                  rememberScriptSkipped();
                  finish(false);
                }}
                // Was text-xs on a decorative border: technically a control,
                // practically invisible, and the only exit from a 15.5s scene at
                // the product's activation moment. Now readable, with a real
                // touch target and an interactive border that clears 3:1.
                className="ml-auto text-xs font-mono uppercase tracking-[2px] px-4 py-2 min-h-11 min-w-40 transition-colors hover:opacity-80"
                style={{
                  color: "var(--tc-text)",
                  border: "1px solid var(--tc-border-interactive)",
                  background: "transparent",
                }}
              >
                Skip intro <span aria-hidden="true">&#9656;</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  runKindRef.current = "replay";
                  play();
                }}
                className="ml-auto text-xs font-mono uppercase tracking-[2px] px-3 py-1.5 min-h-11 min-w-40 transition-colors hover:opacity-80"
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

          <p
            data-testid="scene-context"
            className="mb-6 text-lg md:text-xl leading-relaxed"
            style={{ color: "var(--tc-text)" }}
          >
            {lesson.context.narrative}
          </p>

          {/* Story grid (spec section 2, item 4): the plate column beside the
          beats. LessonContent's root is the second grid item, unchanged, so
          collectBeats and the register rules keep walking a flat list. */}
          <div className="lesson-story-grid">
            <div className="lesson-story-plate">
              {/* Establishing shot: its own playback beat after the slugline.
              The scene context is already readable above both columns.
              With an approved clip
              and the "clip" variant this is the scene VIDEO (owner ruling
              2026-09-04: launch ships with video), poster = the same still;
              otherwise the still exactly as before. The still's src stays
              speculative (art ships incrementally per docs/scene-bible.md);
              on 404 the component removes itself and the timeline matches
              today's. */}
              {lesson.scene &&
              briefingVariant === "clip" &&
              clipUrl &&
              scriptState !== "idle" ? (
                <SceneClip
                  clipUrl={clipUrl}
                  posterSrc={`/scenes/${worldSlug}/${moduleSlug}/${lessonSlug}.webp`}
                  alt={lesson.scene.portraitAlt}
                  autoPlayEligible={
                    scriptAutoPlay &&
                    !prefersSkippedScript() &&
                    !prefersReducedMotion()
                  }
                  worldId={worldSlug}
                  lessonId={lessonSlug}
                />
              ) : lesson.scene ? (
                <ScenePortrait
                  beat
                  src={`/scenes/${worldSlug}/${moduleSlug}/${lessonSlug}.webp`}
                  alt={lesson.scene.portraitAlt}
                />
              ) : null}
            </div>

            {/* Dialogue, screenplay beats from MDX. hideTeaching: the Briefing is
            the story zone only since the 2026-09-04 prose partition; the
            teaching body reads once, on the Concept step. */}
            <LessonContent
              lesson={lesson}
              exercises={exercises}
              worldId={worldSlug}
              moduleId={moduleSlug}
              lessonId={lessonSlug}
              glossaryTerms={lesson.glossaryTerms}
              visibleComponents={BRIEFING_COMPONENTS}
              storyRegister
              hideChallengeOnward
              hideTeaching
            />
          </div>

          {/* Learning notes and review follow the story, outside its timeline.
          The authored takeaway gets its own full-width MDX slice so it never
          stretches the dialogue column or appears twice. The no-JS reveal
          also makes these server-rendered notes readable. */}
          {(lesson.body.includes("BriefingTakeaway") ||
            !warmupDone ||
            moduleEntry) && (
            <div
              data-post-scene=""
              className="mt-(--l-slot) space-y-(--l-slot)"
            >
              {lesson.body.includes("BriefingTakeaway") && (
                <LessonContent
                  lesson={lesson}
                  worldId={worldSlug}
                  moduleId={moduleSlug}
                  lessonId={lessonSlug}
                  glossaryTerms={lesson.glossaryTerms}
                  visibleComponents={BRIEFING_TAKEAWAY_COMPONENTS}
                />
              )}
              {!warmupDone && (
                <LessonWarmup
                  userId={reviewUserId}
                  worldId={worldSlug}
                  opening={
                    moduleOrder === undefined
                      ? null
                      : { moduleOrder, lessonOrder: lesson.order }
                  }
                  dueReviews={dueReviews}
                  freePrompts={freeRecallPrompts}
                  onDone={finishWarmup}
                />
              )}
              {moduleEntry && (
                <details className="border-t border-border pt-4">
                  <summary className="min-h-11 cursor-pointer text-sm text-text-muted focus-visible:outline-2 focus-visible:outline-primary">
                    Where the investigation stands
                  </summary>
                  <ModuleEntryContext
                    moduleSlug={moduleEntry.moduleSlug}
                    previousModule={moduleEntry.previousModule}
                    previousComplete={moduleEntry.previousComplete}
                  />
                </details>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────────
   Step 1: Concept
   ────────────────────────────────────────────── */
function StepConcept({
  lesson,
  exercises,
  worldSlug,
  moduleSlug,
  lessonSlug,
}: {
  lesson: LessonStepsProps["lesson"];
  exercises: ExerciseData[];
  worldSlug: string;
  moduleSlug: string;
  lessonSlug: string;
}) {
  const visualFirst = worldSlug === "deep-orbit";
  const objectives = (
    <div className="lesson-prose" data-testid="concept-intro">
      <LessonContent
        lesson={lesson}
        exercises={exercises}
        worldId={worldSlug}
        moduleId={moduleSlug}
        lessonId={lessonSlug}
        glossaryTerms={lesson.glossaryTerms}
        visibleComponents={CONCEPT_INTRO}
      />
    </div>
  );
  return (
    <div className="lesson-concept">
      <LessonConceptWorkbench
        lesson={lesson}
        worldSlug={worldSlug}
        moduleSlug={moduleSlug}
      />
      <div className="mx-auto max-w-[820px]">
        {!visualFirst && (
          <>
            <PhaseChip label="Concept" icon={"\u25CE"} />
            <p
              className="text-base leading-[1.85] mb-6 max-w-[820px]"
              style={{ color: "var(--tc-muted)" }}
            >
              {lesson.concept.explanation}
            </p>
            {objectives}
          </>
        )}
        <div className="lesson-prose">
          <LessonContent
            lesson={lesson}
            exercises={exercises}
            worldId={worldSlug}
            moduleId={moduleSlug}
            lessonId={lessonSlug}
            glossaryTerms={lesson.glossaryTerms}
            visibleComponents={CONCEPT_LEFT}
            layout="reading"
            hideChallengeOnward
            hideStoryZone
          />
        </div>
        {visualFirst && (
          <details className="lesson-goals">
            <summary>Learning goals for this mission</summary>
            {objectives}
          </details>
        )}
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 3: Challenge
   ────────────────────────────────────────────── */
function StepChallenge({
  lesson,
  exercises,
  worldSlug,
  moduleSlug,
  lessonSlug,
  onHintRevealed,
}: {
  lesson: LessonStepsProps["lesson"];
  exercises: ExerciseData[];
  worldSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  onHintRevealed?: (hintLevel: 1 | 2 | 3) => void;
}) {
  return (
    <div>
      {worldSlug !== "deep-orbit" && (
        <PhaseChip label="Challenge" icon={"\u26A1"} />
      )}
      {worldSlug === "deep-orbit" && (
        <LessonMissionScene
          lesson={lesson}
          worldSlug={worldSlug}
          moduleSlug={moduleSlug}
          compact
        />
      )}
      {/* Left column: brief + hints only. The Exercise editor itself renders
          in the right work pane (CHALLENGE_RIGHT) so its submit handler runs
          exactly once. Hint reveals happen HERE, so this instance carries
          the counter callback; the right pane reads the count at submit. */}
      <div className="lesson-prose max-w-[820px]">
        <LessonContent
          lesson={lesson}
          exercises={exercises}
          worldId={worldSlug}
          moduleId={moduleSlug}
          lessonId={lessonSlug}
          glossaryTerms={lesson.glossaryTerms}
          visibleComponents={CHALLENGE_LEFT}
          onHintRevealed={onHintRevealed}
        />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 4: Takeaways
   ────────────────────────────────────────────── */
function StepTakeaways({
  lesson,
  exercises,
  worldSlug,
  moduleSlug,
  lessonSlug,
  recallSettled,
  onRecallPending,
}: {
  lesson: LessonStepsProps["lesson"];
  exercises: ExerciseData[];
  worldSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  /** Every recall card has left its prompt, or the browser or server says so. */
  recallSettled: boolean;
  onRecallPending: (pending: number) => void;
}) {
  const shared = {
    lesson,
    exercises,
    worldId: worldSlug,
    moduleId: moduleSlug,
    lessonId: lessonSlug,
    glossaryTerms: lesson.glossaryTerms,
  };
  return (
    <div>
      <PhaseChip label="Takeaways" icon={"\u2713"} />
      {/* The recall first, alone (spec 2026-09-24, section 2). */}
      <div
        className="lesson-prose max-w-[820px]"
        data-testid="takeaways-recall"
      >
        <LessonContent
          {...shared}
          visibleComponents={TAKEAWAYS_RECALL}
          onRecallPending={onRecallPending}
        />
      </div>
      {recallSettled && (
        <>
          <div
            className="lesson-prose max-w-[820px]"
            data-testid="takeaways-prose"
          >
            <LessonContent {...shared} visibleComponents={TAKEAWAYS_AFTER} />
          </div>
          <LessonTermsList terms={lesson.glossaryTerms ?? []} />
        </>
      )}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Step 5: Consequence
   ────────────────────────────────────────────── */
function StepConsequence({
  lesson,
  exercises,
  worldSlug,
  moduleSlug,
  lessonSlug,
  isFreeModule,
  award,
}: {
  lesson: LessonStepsProps["lesson"];
  exercises: ExerciseData[];
  worldSlug: string;
  moduleSlug: string;
  lessonSlug: string;
  isFreeModule?: boolean;
  /** Armed by the completion effect the session this lesson closes out
   *  its module; null otherwise (replay, mid-module, no patch art). */
  award?: { src: string; moduleName: string; moduleTerm: string } | null;
}) {
  return (
    <div className="text-center pt-12">
      {/* FADE OUT marker. Screenplay atmosphere, hidden from the tree, and
          now readable by sighted readers: the Cut to label's colour, one
          size up. No contrast exemption. */}
      <div
        aria-hidden="true"
        className="font-mono text-[10px] uppercase tracking-[3px] mb-8"
        style={{ color: "var(--tc-muted)" }}
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
      {lesson.scene && (
        <ScenePortrait
          src={`/scenes/${worldSlug}/${moduleSlug}/${lessonSlug}${lesson.scene.epilogueLocation ? "-epilogue" : ""}.webp`}
          alt={lesson.scene.epiloguePortraitAlt ?? lesson.scene.portraitAlt}
          aspectRatio="21/9"
          className="lesson-ending-scene mb-7 mx-auto max-w-[960px]"
        />
      )}

      {/* Mission complete badge */}
      <div
        className="inline-flex items-center gap-2 text-xs font-mono uppercase tracking-[2px] px-4 py-1.5 mb-6"
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
        {terms(worldSlug).lesson} Complete
      </div>

      {/* The award moment: the module's mission patch, only in the session
          the module's last remaining lesson completed. */}
      {award && (
        <PatchAward
          src={award.src}
          moduleName={award.moduleName}
          moduleTerm={award.moduleTerm}
        />
      )}

      <h1
        className="text-[26px] font-bold mb-5"
        style={{ color: "var(--tc-text)" }}
      >
        {lesson.title}
      </h1>

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
          worldId={worldSlug}
          moduleId={moduleSlug}
          lessonId={lessonSlug}
          glossaryTerms={lesson.glossaryTerms}
          visibleComponents={CONSEQUENCE_COMPONENTS}
          showPostRecap
        />
      </div>

      {/* Guest email capture at the free-trial consumption point
          (T1-13/§9): every free-module lesson end is a potential leave
          point, and a guest who leaves was permanently unreachable. Guests
          only; the component itself checks the session. */}
      {isFreeModule && <GuestEmailCapture worldSlug={worldSlug} />}
    </div>
  );
}

/* ──────────────────────────────────────────────
   Shared UI helpers
   ────────────────────────────────────────────── */

function PhaseChip({ label, icon }: { label: string; icon: string }) {
  return (
    <div
      className="text-xs font-mono uppercase tracking-[2px] mb-6 flex items-center gap-2"
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
