"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { flushReviewOutbox, mergeGuestReviews } from "@/lib/review-store-api";
import { getGuestReviews } from "@/lib/review-store-guest";
import { markLessonCompleted } from "@/lib/progress-client";
import {
  getGuestCompletions,
  clearGuestCompletions,
} from "@/lib/guest-progress";

/**
 * Replays guest-recorded lesson completions into world_progress once the
 * visitor signs in (2026-07-19 UX audit: a buyer who did module 1 as a
 * guest hit the module-2 prerequisite gate and was told to re-walk five
 * lessons). Mounted globally; exits immediately when there is nothing
 * to migrate. Uses markLessonCompleted so streaks, skill genome, and
 * DISPATCH milestones fire exactly as they would have live.
 */
export function GuestProgressBridge() {
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      await flushReviewOutbox();
      if (cancelled) return;
      const pending = getGuestCompletions();
      if (pending.length === 0 && getGuestReviews().length === 0) return;
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      const reviewsMigrated = await mergeGuestReviews(user.id);
      let migrated = 0;
      // Chronological replay so streak/milestone logic sees the real order.
      const ordered = [...pending].sort((a, b) =>
        a.completedAt.localeCompare(b.completedAt),
      );
      for (const c of ordered) {
        const result = await markLessonCompleted(
          c.worldId,
          c.moduleId,
          c.lessonId,
        );
        if (result) migrated += 1;
      }

      // Only clear when every row landed; a partial failure retries on the
      // next mount (markLessonCompleted upserts, so replays are idempotent).
      if (migrated === ordered.length) {
        clearGuestCompletions();
      }
      if ((migrated > 0 || reviewsMigrated) && !cancelled) {
        // Server components gate on DB progress; refresh so the
        // prerequisite check sees the migrated rows.
        router.refresh();
      }
      // Preserve local records after a failed replay so the next load retries.
    })().catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
