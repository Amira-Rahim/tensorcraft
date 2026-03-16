"use client";

import { useEffect, useState, useCallback } from "react";
import {
  markLessonStarted,
  markLessonCompleted,
  getLessonStatus,
} from "@/lib/progress-client";
import { trackLessonStarted, trackLessonCompleted } from "@/lib/analytics";

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
      const current = await getLessonStatus(themeId, lessonId);
      if (cancelled) return;

      if (current) {
        setStatus(
          current.status as "not_started" | "in_progress" | "completed",
        );
      } else {
        const result = await markLessonStarted(themeId, moduleId, lessonId);
        if (cancelled) return;
        if (result) {
          trackLessonStarted(themeId, moduleId, lessonId);
          setStatus("in_progress");
        }
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
      trackLessonCompleted(themeId, moduleId, lessonId);
      setStatus("completed");
    }
    setCompleting(false);
  }, [themeId, moduleId, lessonId]);

  // Don't render anything if no auth (guest user)
  if (status === null) return null;

  if (status === "completed") {
    return (
      <div className="flex items-center gap-2 px-4 py-3 my-6 bg-primary/8 border border-primary/20">
        <span className="text-sm text-primary">✓</span>
        <span className="text-sm font-medium text-primary">
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
        className="w-full py-3 text-sm font-semibold font-mono uppercase tracking-wider transition-all brutalist-hover disabled:opacity-50"
        style={{
          background: completing ? "var(--tc-border)" : accentColor,
          color: completing ? "var(--tc-muted)" : "var(--tc-bg)",
        }}
      >
        {completing ? "Saving..." : "Mark as Complete"}
      </button>
    </div>
  );
}
