/**
 * The three-figure strip under the world page header.
 *
 * Extracted from `page.tsx` on 2026-08-29 so it could be tested, the same
 * pattern as `continue-cta.ts`. The strip used to render
 * "0 Completed / 1 Active Now / 0 Avg Score" to every visitor:
 *
 * - "Active Now" read as a live-presence count ("1 person here now") when
 *   it meant "module 1 is your current module", for members and prospects
 *   alike.
 * - A prospect's first data on the page was three zeros describing nothing
 *   they had done, with "0 Avg Score" reading as a failing grade.
 *
 * So: course facts until any lesson progress exists, progress figures
 * after, and a figure with no value renders as a dash rather than a zero.
 */

export interface WorldStat {
  value: string;
  label: string;
}

export function resolveWorldStats({
  hasProgress,
  moduleCount,
  lessonCount,
  totalMinutes,
  completedModuleCount,
  currentModuleOrder,
  avgScore,
}: {
  hasProgress: boolean;
  moduleCount: number;
  lessonCount: number;
  /** Summed lesson estimates, same basis as the per-lesson "NN min" meta. */
  totalMinutes: number;
  completedModuleCount: number;
  /** Module the learner is on, or null (world complete, nothing active). */
  currentModuleOrder: number | null;
  /** Mean completed-lesson score, or null when nothing is scored yet. */
  avgScore: number | null;
}): [WorldStat, WorldStat, WorldStat] {
  if (!hasProgress) {
    return [
      { value: String(moduleCount), label: "Modules" },
      { value: String(lessonCount), label: "Lessons" },
      // A course under an hour still reads "1", never a zero-hour claim.
      {
        value: String(Math.max(1, Math.round(totalMinutes / 60))),
        label: "Hours",
      },
    ];
  }

  return [
    { value: String(completedModuleCount), label: "Completed" },
    {
      value: currentModuleOrder != null ? String(currentModuleOrder) : "–",
      label: "Current Module",
    },
    { value: avgScore != null ? String(avgScore) : "–", label: "Avg Score" },
  ];
}
