"use client";

import { EVENTS, track } from "@/lib/analytics-events";
import type { EventProperties } from "@/lib/analytics-events";

type FreeLessonCtaSource =
  EventProperties[typeof EVENTS.FREE_LESSON_CTA_CLICKED]["source"];

/**
 * Fires `free_lesson_cta_clicked` when the user clicks a free-lesson link.
 * Attached as a wrapper of the server-rendered `<Link>` so the anchor stays
 * server JSX (same shape as PaywallCtaTracker in paywall-analytics.tsx).
 *
 * Uses `onClickCapture` to log before navigation kicks in.
 */
export function FreeLessonCtaTracker({
  source,
  children,
}: {
  source: FreeLessonCtaSource;
  children: React.ReactNode;
}) {
  return (
    <span
      onClickCapture={() => {
        track(EVENTS.FREE_LESSON_CTA_CLICKED, { source });
      }}
      className="contents"
    >
      {children}
    </span>
  );
}
