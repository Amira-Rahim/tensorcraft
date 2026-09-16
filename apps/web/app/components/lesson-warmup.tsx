"use client";

import { useEffect, useRef, useState } from "react";
import type { ResolvedReviewItem } from "@tensorcraft/shared";
import type { FreeRecallPrompt } from "@/lib/free-recall-prompts";
import { getGuestDue } from "@/lib/review-store-guest";
import { recordReview } from "@/lib/review-store-api";
import { trackRecallAnswered } from "@/lib/analytics";
import { ReviewPromptCard } from "./review-prompt-card";

export function LessonWarmup({
  userId,
  worldId,
  dueReviews,
  freePrompts,
  onDone,
}: {
  userId: string | null;
  worldId: string;
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
      return prompt
        ? [{ ...item, question: prompt.question, answer: prompt.answer }]
        : [];
    });
    setItems(resolved.slice(0, 2));
  }, [userId, worldId, freePrompts]);
  useEffect(() => {
    if (items && index >= items.length && !finished.current) {
      finished.current = true;
      onDone(items.length > 0);
    }
  }, [items, index, onDone]);
  const item = items?.[index];
  if (!item) return null;
  return (
    <section aria-label={`Warm-up, item ${index + 1} of ${items.length}`}>
      <h2 className="font-mono text-sm text-text-primary">
        Before this lesson: a quick recall
      </h2>
      <ReviewPromptCard
        key={`${item.lessonId}/${item.promptIndex}`}
        question={item.question}
        answer={item.answer}
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
