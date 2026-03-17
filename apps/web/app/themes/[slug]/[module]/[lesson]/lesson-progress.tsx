"use client";

import { useEffect, useState, useCallback } from "react";
import {
  markLessonStarted,
  markLessonCompleted,
  getLessonStatus,
} from "@/lib/progress-client";

interface LessonProgressProps {
  themeId: string;
  moduleId: string;
  lessonId: string;
  accentColor: string;
}

export function LessonProgressTracker({
  themeId,
  moduleId,
  lessonId,
  accentColor,
}: LessonProgressProps) {
  const [status, setStatus] = useState<
    "not_started" | "in_progress" | "completed" | null
  >(null);
  const [completing, setCompleting] = useState(false);

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
        if (cancelled) return;
        if (result) setStatus("in_progress");
      }
    }

    trackStart();
    return () => {
      cancelled = true;
    };
  }, [themeId, moduleId, lessonId]);

  const handleComplete = useCallback(async () => {
    setCompleting(true);
    const result = await markLessonCompleted(themeId, moduleId, lessonId);
    if (result) {
      setStatus("completed");
    }
    setCompleting(false);
  }, [themeId, moduleId, lessonId]);

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

  return (
    <div className="my-6">
      <button
        type="button"
        onClick={handleComplete}
        disabled={completing}
        className="w-full py-3 text-sm font-semibold uppercase tracking-wider transition-all font-mono"
        style={{
          background: completing
            ? "var(--tc-border, rgba(255,255,255,0.06))"
            : accentColor,
          color: completing
            ? "var(--tc-muted, #8A8A8A)"
            : "var(--tc-bg, #1C1C1C)",
        }}
      >
        {completing ? "Saving..." : "Mark Lesson as Complete"}
      </button>
      <p
        className="text-xs mt-2 text-center"
        style={{ color: "var(--tc-muted, #8A8A8A)" }}
      >
        Complete all exercises before marking this lesson as done.
      </p>
    </div>
  );
}
