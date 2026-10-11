"use client";

import { useEffect, useRef, useState } from "react";
import type { ResolvedReviewItem } from "@tensorcraft/shared";
import type { FreeRecallPrompt } from "@/lib/free-recall-prompts";
import { isEarlierInCourse, type CoursePosition } from "@/lib/course-position";
import { getGuestDue } from "@/lib/review-store-guest";
import { recordReview } from "@/lib/review-store-api";
import { trackRecallAnswered } from "@/lib/analytics";
import { ReviewPromptCard } from "./review-prompt-card";

/**
 * Up to two due recall prompts, shown after the Briefing scene and before the
 * learner moves on to the Concept step.
 *
 * Placement changed on 2026-09-22. The spec (section F) put this above the
 * scene and held playback until it was answered; the owner's 2026-09-20
 * ruling is that a lesson page opens with its story, and in practice the
 * held-back scene kept its full box in the flow, so a returning learner saw
 * one card, a screen of nothing, and a Continue button. It now lives in the
 * Briefing's post-scene slot, the same one the mid-module catch-up uses.
 *
 * Source rule: only prompts from lessons that come before the one being
 * opened. Signed-in items arrive already filtered by the server; guest items
 * are filtered here against `opening`, because their queue lives in this
 * browser and the server never sees it.
 */
export function LessonWarmup({
  userId,
  worldId,
  opening,
  dueReviews,
  freePrompts,
  onDone,
}: {
  userId: string | null;
  worldId: string;
  /** Course position of the lesson being opened; null when unknown. */
  opening: CoursePosition | null;
  dueReviews: ResolvedReviewItem[];
  freePrompts: FreeRecallPrompt[];
  onDone: (hadReviews: boolean) => void;
}) {
  const [items, setItems] = useState<ResolvedReviewItem[] | null>(() =>
    userId ? dueReviews.slice(0, 2) : null,
  );
  const [index, setIndex] = useState(0);
  const rated = useRef(new Set<number>());
  const finished = useRef(false);
  useEffect(() => {
    if (userId) return;
    // Filter before taking two: malformed keys must not consume valid slots.
    const resolved = getGuestDue(
      worldId,
      Number.MAX_SAFE_INTEGER,
      new Date(),
    ).flatMap((item) => {
      const prompt = freePrompts.find(
        (p) =>
          p.moduleId === item.moduleId &&
          p.lessonId === item.lessonId &&
          p.promptIndex === item.promptIndex,
      );
      if (!prompt) return [];
      if (opening && !isEarlierInCourse(prompt, opening)) return [];
      return [
        {
          ...item,
          question: prompt.question,
          answer: prompt.answer,
          checks: prompt.checks,
        },
      ];
    });
    setItems(resolved.slice(0, 2));
  }, [userId, worldId, freePrompts, opening]);
  useEffect(() => {
    if (items && index >= items.length && !finished.current) {
      finished.current = true;
      onDone(items.length > 0);
    }
  }, [items, index, onDone]);
  const item = items?.[index];
  if (!item) return null;
  return (
    <section
      aria-label={`Warm-up, item ${index + 1} of ${items.length}`}
      className="border-t border-border pt-6"
    >
      <h2 className="font-mono text-sm text-text-primary">
        A quick recall before you continue
      </h2>
      <ReviewPromptCard
        key={`${item.lessonId}/${item.promptIndex}`}
        question={item.question}
        answer={item.answer}
        checks={item.checks}
        onAction={(action) => {
          trackRecallAnswered(action, { worldId, lessonId: item.lessonId });
          if (action !== "attempted" && !rated.current.has(index)) {
            rated.current.add(index);
            void recordReview(userId, item, action);
          }
        }}
        onContinue={() => setIndex((i) => i + 1)}
      />
    </section>
  );
}
