/**
 * Data transform helpers for dashboard visualizations.
 */

export interface WeeklyHints {
  weekStart: string; // "YYYY-MM-DD" (Monday, UTC)
  avgHints: number | null;
}

/**
 * Returns the UTC Monday (00:00:00) of the ISO week containing `d`.
 */
function utcMonday(d: Date): Date {
  const copy = new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()),
  );
  const dow = copy.getUTCDay(); // 0 (Sun) .. 6 (Sat)
  const offset = dow === 0 ? -6 : 1 - dow;
  copy.setUTCDate(copy.getUTCDate() + offset);
  return copy;
}

const MS_PER_WEEK = 7 * 24 * 60 * 60 * 1000;

/**
 * Buckets exercise attempts into N Monday-aligned UTC weeks ending at `now`'s week,
 * computing avg `hints_used` per bucket. Empty weeks → avgHints=null. Oldest first.
 */
export function computeWeeklyHints(
  attempts: ReadonlyArray<{ attempted_at: string; hints_used: number }>,
  weekCount: number,
  now: Date = new Date(),
): WeeklyHints[] {
  const currentWeekStart = utcMonday(now);
  const buckets: Array<{ weekStart: Date; total: number; count: number }> = [];
  for (let i = weekCount - 1; i >= 0; i--) {
    buckets.push({
      weekStart: new Date(currentWeekStart.getTime() - i * MS_PER_WEEK),
      total: 0,
      count: 0,
    });
  }
  for (const a of attempts) {
    const wkStart = utcMonday(new Date(a.attempted_at)).getTime();
    const bucket = buckets.find((b) => b.weekStart.getTime() === wkStart);
    if (bucket) {
      bucket.total += a.hints_used;
      bucket.count += 1;
    }
  }
  return buckets.map((b) => ({
    weekStart: b.weekStart.toISOString().slice(0, 10),
    avgHints: b.count === 0 ? null : b.total / b.count,
  }));
}
