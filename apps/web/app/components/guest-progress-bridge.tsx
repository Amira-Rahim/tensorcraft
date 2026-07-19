"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import { markLessonCompleted } from "@/lib/progress-client";
import {
  getGuestCompletions,
  clearGuestCompletions,
} from "@/lib/guest-progress";

/**
 * Replays guest-recorded lesson completions into theme_progress once the
 * visitor signs in (2026-07-19 UX audit: a buyer who did module 1 as a
 * guest hit the module-2 prerequisite gate and was told to re-walk five
 * lessons). Mounted globally; exits immediately when there is nothing
 * to migrate. Uses markLessonCompleted so streaks, skill genome, and
 * DISPATCH milestones fire exactly as they would have live.
 */
export function GuestProgressBridge() {
  const router = useRouter();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const pending = getGuestCompletions();
    if (pending.length === 0) return;

    let cancelled = false;

    (async () => {
      const supabase = getSupabaseBrowserClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user || cancelled) return;

      let migrated = 0;
      // Chronological replay so streak/milestone logic sees the real order.
      const ordered = [...pending].sort((a, b) =>
        a.completedAt.localeCompare(b.completedAt),
      );
      for (const c of ordered) {
        const result = await markLessonCompleted(
          c.themeId,
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
      if (migrated > 0 && !cancelled) {
        // Server components gate on DB progress; refresh so the
        // prerequisite check sees the migrated rows.
        router.refresh();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  return null;
}
