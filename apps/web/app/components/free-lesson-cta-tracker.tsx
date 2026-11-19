"use client";

import { EVENTS, track } from "@/lib/analytics-events";
import type { EventProperties } from "@/lib/analytics-events";

type FreeLessonCtaProperties =
  EventProperties[typeof EVENTS.FREE_LESSON_CTA_CLICKED];

/**
 * Fires `free_lesson_cta_clicked` when the user clicks a free-lesson link.
 * Attached as a wrapper of the server-rendered `<Link>` so the anchor stays
 * server JSX (same shape as PaywallCtaTracker in paywall-analytics.tsx).
 *
 * Uses `onClickCapture` to log before navigation kicks in.
 */
export function FreeLessonCtaTracker({
  source,
  guideSlug,
  targetLesson,
  placement,
  children,
}: FreeLessonCtaProperties & {
  children: React.ReactNode;
}) {
  return (
    <span
      onClickCapture={() => {
        track(EVENTS.FREE_LESSON_CTA_CLICKED, {
          source,
          ...(guideSlug ? { guideSlug } : {}),
          ...(targetLesson ? { targetLesson } : {}),
          ...(placement ? { placement } : {}),
        });
      }}
      className="contents"
    >
      {children}
    </span>
  );
}
