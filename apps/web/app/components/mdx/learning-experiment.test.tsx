import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { LearningExperiment } from "./learning-experiment";
import {
  experimentDraft,
  parseExperimentDraft,
  type ExperimentId,
} from "./learning-experiment-data";
import { track } from "@/lib/analytics-events";
vi.mock("@/lib/analytics-events", () => ({
  EVENTS: {
    EXPERIMENT_STARTED: "experiment_started",
    EXPERIMENT_SUBMITTED: "experiment_submitted",
  },
  track: vi.fn(),
}));
beforeEach(() => {
  sessionStorage.clear();
  vi.clearAllMocks();
});
afterEach(() => vi.restoreAllMocks());
const click = (name: string) =>
  fireEvent.click(screen.getByRole("button", { name }));
const submit = (answer: string) => {
  fireEvent.change(screen.getByRole("textbox"), { target: { value: answer } });
  click("Check prediction");
};
const key = (id: ExperimentId) => `tensorcraft:experiment:deep-orbit-${id}:v1`;
const record = (id: ExperimentId) =>
  parseExperimentDraft(sessionStorage.getItem(key(id))!, id);
it("keeps first and latest outcomes through feedback, reset, changed case and remount", () => {
  const view = render(<LearningExperiment id="normalization" />);
  submit("24,2");
  expect(record("normalization").prediction.first).toEqual({
    correct: false,
    assisted: false,
  });
  click("Reset controls");
  submit("1,1");
  expect(record("normalization").prediction.latest).toEqual({
    correct: true,
    assisted: true,
  });
  click("Try a changed case");
  submit("1,0");
  expect(record("normalization").changed_case.first).toEqual({
    correct: false,
    assisted: false,
  });
  submit("2,2");
  expect(record("normalization").changed_case.latest).toEqual({
    correct: true,
    assisted: true,
  });
  view.unmount();
  render(<LearningExperiment id="normalization" />);
  expect(screen.getByRole("textbox")).toHaveValue("2,2");
  expect(record("normalization").prediction.first?.correct).toBe(false);
  const events = vi
    .mocked(track)
    .mock.calls.filter(([name]) => name === "experiment_submitted");
  expect(events).toHaveLength(4);
  expect(Object.keys(events[0][1]!)).toEqual([
    "worldId",
    "lessonId",
    "experimentId",
    "contentVersion",
    "phase",
    "attempt",
    "correct",
    "assisted",
  ]);
});
it("never unlocks a threshold after the held-out slice is exposed, including after reset and remount", () => {
  const view = render(<LearningExperiment id="threshold" />);
  expect(screen.queryByText(/Final test: 10/)).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText("Alert threshold"), {
    target: { value: "0.7" },
  });
  submit("3");
  click("Freeze policy and open final test");
  expect(record("threshold").frozen).toEqual([0.7, 1, 1]);
  expect(screen.getByText(/Final test: 10/)).toBeInTheDocument();
  submit("3");
  expect(record("threshold").changed_case.first).toEqual({
    correct: true,
    assisted: false,
  });
  click("Return to worked case (records reference use)");
  expect(screen.getByLabelText("Alert threshold")).toBeDisabled();
  click("Reset controls");
  expect(screen.getByLabelText("Alert threshold")).toHaveValue("0.7");
  view.unmount();
  render(<LearningExperiment id="threshold" />);
  expect(screen.getByLabelText("Alert threshold")).toBeDisabled();
  click("Return to final test");
  expect(record("threshold").changed_case.help).toBe(true);
});
it.each([
  ["learning-rate", "2", "-1"],
  ["fft", "4", "1,2"],
  ["attention", "1", "2.975,7.025"],
  ["cache", "2", "3"],
] as const)(
  "%s offers a distinct changed case and preserves reference assistance",
  (id, first, second) => {
    render(<LearningExperiment id={id} />);
    submit(first);
    expect(record(id).prediction.first?.correct).toBe(true);
    click("Try a changed case");
    click("Return to worked case (records reference use)");
    click("Try a changed case");
    submit(second);
    expect(record(id).changed_case.latest).toEqual({
      correct: true,
      assisted: true,
    });
  },
);
it("recovers corrupt drafts and blocked storage while preserving the in-memory activity", () => {
  sessionStorage.setItem(key("cache"), "{broken");
  render(<LearningExperiment id="cache" />);
  expect(screen.getByText(/draft could not be read/)).toBeInTheDocument();
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("blocked");
  });
  submit("2");
  expect(screen.getByText(/Draft is in memory only/)).toBeInTheDocument();
  expect(screen.getByText(/Your prediction matches/)).toBeInTheDocument();
});
it("bounds attempts without resetting the stored first outcome", () => {
  const d = experimentDraft("cache");
  d.prediction = {
    count: 20,
    first: { correct: false, assisted: false },
    latest: { correct: true, assisted: true },
    help: true,
  };
  sessionStorage.setItem(key("cache"), JSON.stringify(d));
  render(<LearningExperiment id="cache" />);
  fireEvent.change(screen.getByRole("textbox"), { target: { value: "2" } });
  expect(
    screen.getByRole("button", { name: "Check prediction" }),
  ).toBeDisabled();
  click("Reset controls");
  expect(record("cache").prediction.count).toBe(20);
});
