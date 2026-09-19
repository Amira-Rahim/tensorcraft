import { expect, it } from "vitest";
import {
  canOpenLearningModule,
  isMLLearningRoute,
  ML_READINESS_QUESTIONS,
  readinessGaps,
} from "./learning-route";

it("keeps module access independent of chosen route, readiness, and completion", () => {
  expect(canOpenLearningModule(1, false)).toBe(true);
  for (let order = 2; order <= 11; order++) {
    expect(canOpenLearningModule(order, false)).toBe(false);
    expect(canOpenLearningModule(order, true)).toBe(true);
  }
  for (const order of [0, -1, 1.1, NaN])
    expect(canOpenLearningModule(order, true)).toBe(false);
});
it("accepts only explicit ML routes and gives review suggestions for wrong or missing answers", () => {
  expect(isMLLearningRoute("advanced")).toBe(false);
  expect(isMLLearningRoute("challenge")).toBe(true);
  expect(readinessGaps([])).toHaveLength(4);
  expect(readinessGaps(ML_READINESS_QUESTIONS.map((q) => q.correct))).toEqual(
    [],
  );
});
