"use client";

/**
 * Guest completion evidence (2026-07-19 UX audit).
 *
 * Signed-out learners can finish all of free module 1, but every
 * progress-client write is a no-op without a user, so the map showed
 * them zero progress and looped back to lesson 1 — the funnel's climax
 * didn't exist for the exact no-account audience the landing recruits.
 * This records completions locally so (a) the map can stage the
 * end-of-module moment for guests, and (b) GuestProgressBridge can
 * replay them into world_progress after signup.
 */

const STORAGE_KEY = "tc_guest_completed_v1";

export interface GuestCompletion {
  worldId: string;
  moduleId: string;
  lessonId: string;
  completedAt: string;
}

type StoredMap = Record<string, string>; // "world/module/lesson" -> ISO date

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

export function recordGuestCompletion(
  worldId: string,
  moduleId: string,
  lessonId: string,
): void {
  try {
    const map = readMap();
    const key = `${worldId}/${moduleId}/${lessonId}`;
    if (map[key]) return;
    map[key] = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    // localStorage unavailable
  }
}

export function getGuestCompletions(): GuestCompletion[] {
  return Object.entries(readMap()).flatMap(([key, completedAt]) => {
    const [worldId, moduleId, lessonId] = key.split("/");
    if (!worldId || !moduleId || !lessonId) return [];
    return [{ worldId, moduleId, lessonId, completedAt }];
  });
}

export function countGuestCompletedInModule(
  worldId: string,
  moduleId: string,
): number {
  return getGuestCompletions().filter(
    (c) => c.worldId === worldId && c.moduleId === moduleId,
  ).length;
}

export function clearGuestCompletions(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // localStorage unavailable
  }
}
