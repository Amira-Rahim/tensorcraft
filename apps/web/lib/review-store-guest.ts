"use client";

/**
 * Guest review schedule (spaced review stage 1, 2026-09-16).
 *
 * Signed-out learners can complete the free module, but the server never
 * sees a guest, so their review queue lives here instead of
 * `review_queue`. Mirrors `guest-progress.ts`: a flat `tc_*_v1` map keyed
 * by a slash-joined string, and every `localStorage` access wrapped in
 * try/catch that degrades to empty rather than throwing (private browsing
 * and blocked site data both throw on a bare call).
 *
 * All scheduling math comes from `@tensorcraft/shared`, `selectDue` and
 * `nextInterval`, the same functions the Postgres-backed store calls. This
 * file only reads and writes the map; see
 * docs/superpowers/specs/2026-09-15-spaced-review-design.md section A for
 * why the curve must not exist in two languages.
 */

import { nextInterval, selectDue } from "@tensorcraft/shared";
import type { ReviewItem, ReviewOutcome } from "@tensorcraft/shared";

const STORAGE_KEY = "tc_guest_reviews_v1";

const DAY_MS = 24 * 60 * 60 * 1000;

interface StoredEntry {
  pulls: number;
  successes: number;
  lastReviewedAt: string | null;
  nextReviewAt: string;
}

// "world/module/lesson/promptIndex" -> entry
type StoredMap = Record<string, StoredEntry>;

function readMap(): StoredMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as StoredMap) : {};
  } catch {
    return {};
  }
}

function writeMap(map: StoredMap): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // localStorage unavailable
  }
}

function keyFor(
  worldId: string,
  moduleId: string,
  lessonId: string,
  promptIndex: number,
): string {
  return `${worldId}/${moduleId}/${lessonId}/${promptIndex}`;
}

function toReviewItem(key: string, entry: StoredEntry): ReviewItem | null {
  const parts = key.split("/");
  if (parts.length !== 4) return null;
  const [worldId, moduleId, lessonId, promptIndexRaw] = parts;
  const promptIndex = Number(promptIndexRaw);
  if (!worldId || !moduleId || !lessonId || Number.isNaN(promptIndex)) {
    return null;
  }
  return {
    worldId,
    moduleId,
    lessonId,
    promptIndex,
    pulls: entry.pulls,
    successes: entry.successes,
    lastReviewedAt: entry.lastReviewedAt,
    nextReviewAt: entry.nextReviewAt,
  };
}

/**
 * Adds one review item per prompt index, first due one day out (spec
 * section G.1, matching the API route's enqueue). Never touches a key that
 * already exists: the localStorage equivalent of `on conflict do nothing`,
 * so re-completing a lesson can never cancel an existing schedule.
 *
 * Takes the indices themselves, not a count, and matches
 * `POST /api/review/enqueue` deliberately. `parseRecallPrompts` increments
 * its counter for every <RecallPrompt> tag including one it fails to parse
 * and drops, so prompt indices are not guaranteed contiguous. They are today
 * (80 of 80 parse, held by recall-prompt-extraction.test.ts), but a count
 * would synthesize 0..n-1, and a future gap would enqueue a key the read path
 * drops while losing the key that actually exists: the learner quietly loses
 * a prompt. The caller holds `lesson.recallPrompts` either way, so passing
 * `p.index` costs it nothing. Both halves of the feature take the same shape.
 */
export function enqueueGuestReviews(
  worldId: string,
  moduleId: string,
  lessonId: string,
  promptIndices: number[],
): void {
  try {
    const map = readMap();
    const nextReviewAt = new Date(Date.now() + DAY_MS).toISOString();
    let changed = false;
    for (const promptIndex of new Set(promptIndices)) {
      const key = keyFor(worldId, moduleId, lessonId, promptIndex);
      if (map[key]) continue;
      map[key] = {
        pulls: 0,
        successes: 0,
        lastReviewedAt: null,
        nextReviewAt,
      };
      changed = true;
    }
    if (changed) writeMap(map);
  } catch {
    // localStorage unavailable
  }
}

/**
 * Due items for a world, most overdue first. Rehydrates the stored map into
 * `ReviewItem`s and delegates ordering entirely to `selectDue`.
 */
export function getGuestDue(
  worldId: string,
  limit: number,
  now: Date,
): ReviewItem[] {
  const map = readMap();
  const items: ReviewItem[] = [];
  for (const [key, entry] of Object.entries(map)) {
    if (!key.startsWith(`${worldId}/`)) continue;
    const item = toReviewItem(key, entry);
    if (item) items.push(item);
  }
  return selectDue(items, now, limit);
}

/**
 * Records an outcome for one prompt and writes the resulting schedule back.
 * Delegates the interval to `nextInterval`; this file adds no scheduling
 * math of its own. A prompt recorded without ever being enqueued (should
 * not happen in practice) is treated as a fresh item rather than dropped.
 */
export function recordGuestReview(
  worldId: string,
  moduleId: string,
  lessonId: string,
  promptIndex: number,
  outcome: ReviewOutcome,
  now: Date = new Date(),
): void {
  try {
    const map = readMap();
    const key = keyFor(worldId, moduleId, lessonId, promptIndex);
    const existing = map[key];
    const current: ReviewItem = existing
      ? {
          worldId,
          moduleId,
          lessonId,
          promptIndex,
          pulls: existing.pulls,
          successes: existing.successes,
          lastReviewedAt: existing.lastReviewedAt,
          nextReviewAt: existing.nextReviewAt,
        }
      : {
          worldId,
          moduleId,
          lessonId,
          promptIndex,
          pulls: 0,
          successes: 0,
          lastReviewedAt: null,
          nextReviewAt: now.toISOString(),
        };

    const result = nextInterval(current, outcome, now);

    map[key] = {
      pulls: result.pulls,
      successes: result.successes,
      lastReviewedAt: now.toISOString(),
      nextReviewAt: result.nextReviewAt,
    };
    writeMap(map);
  } catch {
    // localStorage unavailable
  }
}
