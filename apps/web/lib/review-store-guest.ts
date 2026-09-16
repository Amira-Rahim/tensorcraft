"use client";

import { nextInterval, selectDue } from "@tensorcraft/shared";
import type { ReviewItem, ReviewOutcome } from "@tensorcraft/shared";
import { reportDataError } from "./report-data-error";

const STORAGE_KEY = "tc_guest_reviews_v1";
type StoredEntry = Pick<
  ReviewItem,
  "pulls" | "successes" | "lastReviewedAt" | "nextReviewAt"
>;
type StoredMap = Record<string, StoredEntry>;

function readMap(): StoredMap {
  try {
    const raw: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
    if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};
    return Object.fromEntries(
      Object.entries(raw).filter(([key, entry]) => {
        const parts = key.split("/");
        return (
          parts.length === 4 &&
          parts.slice(0, 3).every(Boolean) &&
          /^\d+$/.test(parts[3]) &&
          entry &&
          typeof entry === "object" &&
          Number.isInteger(entry.pulls) &&
          entry.pulls >= 0 &&
          Number.isInteger(entry.successes) &&
          entry.successes >= 0 &&
          entry.successes <= entry.pulls &&
          typeof entry.nextReviewAt === "string" &&
          Number.isFinite(Date.parse(entry.nextReviewAt)) &&
          (entry.lastReviewedAt === null ||
            (typeof entry.lastReviewedAt === "string" &&
              Number.isFinite(Date.parse(entry.lastReviewedAt))))
        );
      }),
    );
  } catch {
    return {};
  }
}

function writeMap(map: StoredMap): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
    return true;
  } catch {
    reportDataError("review.guest.write", {
      message: "Could not save the local review queue",
    });
    return false;
  }
}

function keyFor(
  item: Pick<ReviewItem, "worldId" | "moduleId" | "lessonId" | "promptIndex">,
): string {
  return `${item.worldId}/${item.moduleId}/${item.lessonId}/${item.promptIndex}`;
}

export function getGuestReviews(): ReviewItem[] {
  return Object.entries(readMap()).map(([key, entry]) => {
    const [worldId, moduleId, lessonId, index] = key.split("/");
    return {
      ...entry,
      worldId,
      moduleId,
      lessonId,
      promptIndex: Number(index),
    };
  });
}

/** Remove only the snapshot that landed; preserve reviews added during migration. */
export function removeGuestReviews(items: ReviewItem[]): boolean {
  const map = readMap();
  for (const item of items) {
    const key = keyFor(item);
    const current = map[key];
    if (
      current &&
      current.nextReviewAt === item.nextReviewAt &&
      current.pulls === item.pulls
    )
      delete map[key];
  }
  return writeMap(map);
}

export function enqueueGuestReviews(
  worldId: string,
  moduleId: string,
  lessonId: string,
  promptIndices: number[],
  now = new Date(),
): boolean {
  const map = readMap();
  for (const promptIndex of new Set(promptIndices)) {
    const key = keyFor({ worldId, moduleId, lessonId, promptIndex });
    if (!map[key])
      map[key] = {
        pulls: 0,
        successes: 0,
        lastReviewedAt: null,
        nextReviewAt: new Date(now.getTime() + 86_400_000).toISOString(),
      };
  }
  return writeMap(map);
}

export function getGuestDue(
  worldId: string,
  limit: number,
  now: Date,
): ReviewItem[] {
  return selectDue(
    getGuestReviews().filter((item) => item.worldId === worldId),
    now,
    limit,
  );
}

export function recordGuestReview(
  worldId: string,
  moduleId: string,
  lessonId: string,
  promptIndex: number,
  outcome: ReviewOutcome,
  now = new Date(),
): boolean {
  const map = readMap();
  const key = keyFor({ worldId, moduleId, lessonId, promptIndex });
  const current: ReviewItem = {
    worldId,
    moduleId,
    lessonId,
    promptIndex,
    ...(map[key] ?? {
      pulls: 0,
      successes: 0,
      lastReviewedAt: null,
      nextReviewAt: now.toISOString(),
    }),
  };
  // Retrying a saved operation must not count it twice.
  if (
    current.lastReviewedAt &&
    Date.parse(current.lastReviewedAt) >= now.getTime()
  )
    return true;
  map[key] = {
    ...nextInterval(current, outcome, now),
    lastReviewedAt: now.toISOString(),
  };
  return writeMap(map);
}
