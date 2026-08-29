import { describe, it, expect } from "vitest";
import { resolveWorldStats } from "../world-stats";

/**
 * The three-figure strip under the world page header.
 *
 * Extracted from `page.tsx` on 2026-08-29, same pattern as continue-cta:
 * the strip used to show "0 Completed / 1 Active Now / 0 Avg Score" to
 * every prospect. "Active Now" read as a live-presence count when it meant
 * "module 1 is your current module", and a visitor's first data on the
 * page was three zeros describing nothing they had done.
 */
describe("resolveWorldStats", () => {
  it("shows course facts to a visitor with no progress", () => {
    const stats = resolveWorldStats({
      hasProgress: false,
      moduleCount: 11,
      lessonCount: 55,
      totalMinutes: 1100,
      completedModuleCount: 0,
      currentModuleOrder: 1,
      avgScore: null,
    });

    expect(stats).toEqual([
      { value: "11", label: "Modules" },
      { value: "55", label: "Lessons" },
      { value: "18", label: "Hours" },
    ]);
  });

  it("never rounds course hours down to zero", () => {
    const stats = resolveWorldStats({
      hasProgress: false,
      moduleCount: 1,
      lessonCount: 1,
      totalMinutes: 12,
      completedModuleCount: 0,
      currentModuleOrder: 1,
      avgScore: null,
    });

    expect(stats[2]).toEqual({ value: "1", label: "Hours" });
  });

  it("shows progress figures once any lesson progress exists", () => {
    const stats = resolveWorldStats({
      hasProgress: true,
      moduleCount: 11,
      lessonCount: 55,
      totalMinutes: 1100,
      completedModuleCount: 2,
      currentModuleOrder: 3,
      avgScore: 91.5,
    });

    expect(stats).toEqual([
      { value: "2", label: "Completed" },
      { value: "3", label: "Current Module" },
      { value: "91.5", label: "Avg Score" },
    ]);
  });

  it("marks missing progress figures with a dash, not a zero", () => {
    // In progress but nothing scored yet, and (world complete) no current
    // module: neither figure is a zero, both are simply absent.
    const stats = resolveWorldStats({
      hasProgress: true,
      moduleCount: 11,
      lessonCount: 55,
      totalMinutes: 1100,
      completedModuleCount: 11,
      currentModuleOrder: null,
      avgScore: null,
    });

    expect(stats[1]).toEqual({ value: "–", label: "Current Module" });
    expect(stats[2]).toEqual({ value: "–", label: "Avg Score" });
  });
});
