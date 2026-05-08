import { describe, it, expect } from "vitest";
import {
  aggregateOperatorLog,
  classifyStrategy,
  STRATEGY_THRESHOLDS,
} from "../operator-log";

const NOW = new Date("2026-05-08T12:00:00Z");
const DAY_MS = 24 * 60 * 60 * 1000;

describe("classifyStrategy", () => {
  it("returns 'explorer' at and above the explorer threshold", () => {
    expect(classifyStrategy(STRATEGY_THRESHOLDS.explorer)).toBe("explorer");
    expect(classifyStrategy(0.5)).toBe("explorer");
  });

  it("returns 'exploiter' at and below the exploiter threshold", () => {
    expect(classifyStrategy(STRATEGY_THRESHOLDS.exploiter)).toBe("exploiter");
    expect(classifyStrategy(0)).toBe("exploiter");
  });

  it("returns 'balanced' between thresholds", () => {
    expect(classifyStrategy(0.15)).toBe("balanced");
  });
});

describe("aggregateOperatorLog", () => {
  it("returns zeroed stats when there is no data", () => {
    const out = aggregateOperatorLog({
      ownedThemeIds: ["deep-orbit"],
      recallEvents: [],
      progressRows: [],
      streakRows: [],
      exerciseAttempts: [],
      totalLessonsByTheme: { "deep-orbit": 55 },
      now: NOW,
    });

    expect(out.perTheme).toHaveLength(1);
    const t = out.perTheme[0];
    expect(t.totalRecalls).toBe(0);
    expect(t.recallSuccessRate).toBe(0);
    expect(t.explorationRatio).toBe(0);
    expect(t.lessonsCompleted).toBe(0);
    expect(t.weeklyCompletionVelocity).toBe(0);
    expect(t.capstonePassed).toBe(false);
    expect(t.capstoneBestScore).toBeNull();
    expect(t.bestStreak).toBe(0);
    expect(t.strategyClass).toBe("exploiter"); // 0 ratio → exploiter
    expect(out.crossTheme.totalRecalls).toBe(0);
    expect(out.crossTheme.activeThemesCount).toBe(0);
  });

  it("computes per-theme recall success rate + exploration ratio", () => {
    const out = aggregateOperatorLog({
      ownedThemeIds: ["deep-orbit"],
      recallEvents: [
        {
          theme_id: "deep-orbit",
          metadata: { success: true, was_explored: false },
        },
        {
          theme_id: "deep-orbit",
          metadata: { success: true, was_explored: true },
        },
        {
          theme_id: "deep-orbit",
          metadata: { success: false, was_explored: true },
        },
        {
          theme_id: "deep-orbit",
          metadata: { success: false, was_explored: false },
        },
      ],
      progressRows: [],
      streakRows: [],
      exerciseAttempts: [],
      totalLessonsByTheme: { "deep-orbit": 55 },
      now: NOW,
    });

    const t = out.perTheme[0];
    expect(t.totalRecalls).toBe(4);
    expect(t.recallSuccessRate).toBe(0.5);
    expect(t.explorationRatio).toBe(0.5);
    expect(t.strategyClass).toBe("explorer");
  });

  it("classifies explorer / exploiter / balanced correctly per-theme", () => {
    const events = (n: number, explored: number) =>
      Array.from({ length: n }, (_, i) => ({
        theme_id: "deep-orbit",
        metadata: { success: true, was_explored: i < explored },
      }));

    const explorer = aggregateOperatorLog({
      ownedThemeIds: ["deep-orbit"],
      recallEvents: events(10, 3),
      progressRows: [],
      streakRows: [],
      exerciseAttempts: [],
      totalLessonsByTheme: { "deep-orbit": 55 },
      now: NOW,
    }).perTheme[0];
    expect(explorer.explorationRatio).toBeCloseTo(0.3);
    expect(explorer.strategyClass).toBe("explorer");

    const exploiter = aggregateOperatorLog({
      ownedThemeIds: ["deep-orbit"],
      recallEvents: events(10, 1),
      progressRows: [],
      streakRows: [],
      exerciseAttempts: [],
      totalLessonsByTheme: { "deep-orbit": 55 },
      now: NOW,
    }).perTheme[0];
    expect(exploiter.explorationRatio).toBeCloseTo(0.1);
    expect(exploiter.strategyClass).toBe("exploiter");

    const balanced = aggregateOperatorLog({
      ownedThemeIds: ["deep-orbit"],
      recallEvents: events(10, 2),
      progressRows: [],
      streakRows: [],
      exerciseAttempts: [],
      totalLessonsByTheme: { "deep-orbit": 55 },
      now: NOW,
    }).perTheme[0];
    expect(balanced.explorationRatio).toBeCloseTo(0.2);
    expect(balanced.strategyClass).toBe("explorer"); // 0.2 hits explorer threshold
  });

  it("counts only completed lessons within last 28 days for velocity", () => {
    const out = aggregateOperatorLog({
      ownedThemeIds: ["deep-orbit"],
      recallEvents: [],
      progressRows: [
        // 4 completions inside window (last 28 days) — velocity = 4/4 = 1/wk
        {
          theme_id: "deep-orbit",
          status: "completed",
          updated_at: new Date(NOW.getTime() - 1 * DAY_MS).toISOString(),
        },
        {
          theme_id: "deep-orbit",
          status: "completed",
          updated_at: new Date(NOW.getTime() - 7 * DAY_MS).toISOString(),
        },
        {
          theme_id: "deep-orbit",
          status: "completed",
          updated_at: new Date(NOW.getTime() - 14 * DAY_MS).toISOString(),
        },
        {
          theme_id: "deep-orbit",
          status: "completed",
          updated_at: new Date(NOW.getTime() - 27 * DAY_MS).toISOString(),
        },
        // 1 completion older than window — counted in lessonsCompleted but NOT velocity
        {
          theme_id: "deep-orbit",
          status: "completed",
          updated_at: new Date(NOW.getTime() - 60 * DAY_MS).toISOString(),
        },
        // 1 in_progress — counted in neither
        {
          theme_id: "deep-orbit",
          status: "in_progress",
          updated_at: new Date(NOW.getTime() - 1 * DAY_MS).toISOString(),
        },
      ],
      streakRows: [],
      exerciseAttempts: [],
      totalLessonsByTheme: { "deep-orbit": 55 },
      now: NOW,
    });

    const t = out.perTheme[0];
    expect(t.lessonsCompleted).toBe(5);
    expect(t.weeklyCompletionVelocity).toBe(1);
  });

  it("detects capstone pass + best score across attempts", () => {
    const out = aggregateOperatorLog({
      ownedThemeIds: ["terra-grid"],
      recallEvents: [],
      progressRows: [],
      streakRows: [],
      exerciseAttempts: [
        {
          theme_id: "terra-grid",
          exercise_slug: "capstone-edge-deploy",
          passed: false,
          score: 65,
        },
        {
          theme_id: "terra-grid",
          exercise_slug: "capstone-edge-deploy",
          passed: true,
          score: 88,
        },
        {
          theme_id: "terra-grid",
          exercise_slug: "regular-exercise",
          passed: true,
          score: 100,
        },
      ],
      totalLessonsByTheme: { "terra-grid": 55 },
      now: NOW,
    });

    const t = out.perTheme[0];
    expect(t.capstonePassed).toBe(true);
    expect(t.capstoneBestScore).toBe(88);
  });

  it("scopes streak best to the matching theme", () => {
    const out = aggregateOperatorLog({
      ownedThemeIds: ["deep-orbit", "terra-grid"],
      recallEvents: [],
      progressRows: [],
      streakRows: [
        { theme_id: "deep-orbit", longest_streak: 12 },
        { theme_id: "terra-grid", longest_streak: 3 },
        { theme_id: "neon-protocol", longest_streak: 99 },
      ],
      exerciseAttempts: [],
      totalLessonsByTheme: { "deep-orbit": 55, "terra-grid": 55 },
      now: NOW,
    });

    expect(
      out.perTheme.find((t) => t.themeId === "deep-orbit")?.bestStreak,
    ).toBe(12);
    expect(
      out.perTheme.find((t) => t.themeId === "terra-grid")?.bestStreak,
    ).toBe(3);
  });

  it("computes cross-theme aggregates and counts active themes", () => {
    const out = aggregateOperatorLog({
      ownedThemeIds: ["deep-orbit", "terra-grid"],
      recallEvents: [
        {
          theme_id: "deep-orbit",
          metadata: { success: true, was_explored: false },
        },
        {
          theme_id: "deep-orbit",
          metadata: { success: false, was_explored: true },
        },
        {
          theme_id: "terra-grid",
          metadata: { success: true, was_explored: true },
        },
        // Out-of-cohort theme: should be ignored in cross-theme totals
        {
          theme_id: "nova-canvas",
          metadata: { success: true, was_explored: true },
        },
      ],
      progressRows: [
        {
          theme_id: "deep-orbit",
          status: "completed",
          updated_at: new Date(NOW.getTime() - 1 * DAY_MS).toISOString(),
        },
      ],
      streakRows: [],
      exerciseAttempts: [],
      totalLessonsByTheme: { "deep-orbit": 55, "terra-grid": 55 },
      now: NOW,
    });

    expect(out.crossTheme.totalRecalls).toBe(3);
    expect(out.crossTheme.overallRecallSuccessRate).toBeCloseTo(2 / 3);
    expect(out.crossTheme.overallExplorationRatio).toBeCloseTo(2 / 3);
    expect(out.crossTheme.strategyClass).toBe("explorer");
    expect(out.crossTheme.activeThemesCount).toBe(2);
  });

  it("handles missing/null metadata gracefully", () => {
    const out = aggregateOperatorLog({
      ownedThemeIds: ["deep-orbit"],
      recallEvents: [
        { theme_id: "deep-orbit", metadata: null },
        { theme_id: "deep-orbit", metadata: {} },
      ],
      progressRows: [],
      streakRows: [],
      exerciseAttempts: [],
      totalLessonsByTheme: { "deep-orbit": 55 },
      now: NOW,
    });

    const t = out.perTheme[0];
    expect(t.totalRecalls).toBe(2);
    expect(t.recallSuccessRate).toBe(0);
    expect(t.explorationRatio).toBe(0);
  });
});
