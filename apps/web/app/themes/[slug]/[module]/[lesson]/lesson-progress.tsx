"use client";

import { useEffect, useState, useCallback } from "react";
import {
  markLessonStarted,
  markLessonCompleted,
  getLessonStatus,
  getLessonExerciseStatus,
} from "@/lib/progress-client";
import { trackLessonStarted, trackLessonCompleted } from "@/lib/analytics";

interface LessonProgressProps {
  themeId: string;
  moduleId: string;
  lessonId: string;
  accentColor: string;
  exerciseCount: number;
}

export function LessonProgressTracker({
  themeId,
  moduleId,
  lessonId,
  accentColor,
  exerciseCount,
}: LessonProgressProps) {
  const [status, setStatus] = useState<
    "not_started" | "in_progress" | "completed" | null
  >(null);
  const [completing, setCompleting] = useState(false);
  const [exercisesComplete, setExercisesComplete] = useState(
    exerciseCount === 0,
  );
  const [completedExercises, setCompletedExercises] = useState(0);

  // Auto-mark as started when lesson loads
  useEffect(() => {
    let cancelled = false;

    async function trackStart() {
      // First check current status
      const current = await getLessonStatus(themeId, lessonId);
      if (cancelled) return;

      if (current) {
        setStatus(
          current.status as "not_started" | "in_progress" | "completed",
        );
      } else {
        // Mark as started
        const result = await markLessonStarted(themeId, moduleId, lessonId);
        trackLessonStarted(themeId, moduleId, lessonId);
        if (cancelled) return;
        if (result) setStatus("in_progress");
      }

      // Check exercise completion status
      if (exerciseCount > 0) {
        const exerciseStatus = await getLessonExerciseStatus(
          themeId,
          lessonId,
          exerciseCount,
        );
        if (cancelled) return;
        setExercisesComplete(exerciseStatus.allComplete);
        setCompletedExercises(exerciseStatus.completedCount);
      }
    }

    trackStart();
    return () => {
      cancelled = true;
    };
  }, [themeId, moduleId, lessonId, exerciseCount]);

  const handleComplete = useCallback(async () => {
    // Re-check exercise status right before completing to prevent race conditions
    if (exerciseCount > 0) {
      const exerciseStatus = await getLessonExerciseStatus(
        themeId,
        lessonId,
        exerciseCount,
      );
      if (!exerciseStatus.allComplete) {
        setExercisesComplete(false);
        setCompletedExercises(exerciseStatus.completedCount);
        return;
      }
    }

    setCompleting(true);
    const result = await markLessonCompleted(themeId, moduleId, lessonId);
    if (result) {
      trackLessonCompleted(themeId, moduleId, lessonId);
      setStatus("completed");
    }
    setCompleting(false);
  }, [themeId, moduleId, lessonId, exerciseCount]);

  // Don't render anything if no auth (guest user)
  if (status === null) return null;

  if (status === "completed") {
    return (
      <div
        className="flex items-center gap-2 px-4 py-3 my-6"
        style={{
          background: "rgba(107, 170, 138, 0.08)",
          border: "1px solid rgba(107, 170, 138, 0.2)",
        }}
      >
        <span className="text-sm">✓</span>
        <span
          className="text-sm font-medium"
          style={{ color: "var(--tc-primary, #6BAA8A)" }}
        >
          Lesson completed
        </span>
      </div>
    );
  }

  const buttonDisabled = completing || !exercisesComplete;

  return (
    <div className="my-6">
      <button
        type="button"
        onClick={handleComplete}
        disabled={buttonDisabled}
        className="w-full py-3 text-sm font-semibold uppercase tracking-wider transition-all font-mono"
        style={{
          background: buttonDisabled
            ? "var(--tc-border, rgba(255,255,255,0.06))"
            : accentColor,
          color: buttonDisabled
            ? "var(--tc-muted, #A0A0A0)"
            : "var(--tc-bg, #1C1C1C)",
          cursor: buttonDisabled ? "not-allowed" : "pointer",
        }}
      >
        {completing
          ? "Saving..."
          : exercisesComplete
            ? "Mark Lesson as Complete"
            : `Complete all exercises first (${completedExercises}/${exerciseCount})`}
      </button>
      {!exercisesComplete && (
        <p
          className="text-xs mt-2 text-center"
          style={{ color: "var(--tc-muted, #A0A0A0)" }}
        >
          Pass all exercises before marking this lesson as done.
        </p>
      )}
    </div>
  );
}
