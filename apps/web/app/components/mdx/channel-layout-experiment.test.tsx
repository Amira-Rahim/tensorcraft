import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ChannelLayoutExperiment } from "./channel-layout-experiment";
import { CHANNEL_STORAGE_KEY, parseChannelDraft } from "./channel-layout-data";
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
const record = () =>
  parseChannelDraft(sessionStorage.getItem(CHANNEL_STORAGE_KEY)!);

it("compares two same-shape layouts, retains state on remount, and does not emit answer text", () => {
  const view = render(<ChannelLayoutExperiment />);
  expect(screen.queryByTestId("channel-result")).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/Predict channel/), {
    target: { value: "0, 1, 2" },
  });
  click("Check prediction");
  expect(record().firstPrediction).toEqual({ correct: false, assisted: false });
  click("Run reshape");
  expect(
    within(screen.getByTestId("channel-result")).getByRole("status"),
  ).toHaveTextContent("[0, 1, 2]");
  click("Run transpose");
  expect(
    within(screen.getByTestId("channel-result")).getByRole("status"),
  ).toHaveTextContent("[0, 4, 8]");
  fireEvent.change(screen.getByLabelText("Inspect channel"), {
    target: { value: "2" },
  });
  view.unmount();
  render(<ChannelLayoutExperiment />);
  expect(screen.getByLabelText("Inspect channel")).toHaveValue("2");
  expect(screen.getByRole("button", { name: "Run transpose" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  expect(record().firstPrediction).toEqual({ correct: false, assisted: false });
  expect(
    vi
      .mocked(track)
      .mock.calls.filter(([name]) => name === "experiment_started"),
  ).toHaveLength(1);
  const submitted = vi
    .mocked(track)
    .mock.calls.find(([name]) => name === "experiment_submitted")![1];
  expect(submitted).toEqual({
    worldId: "deep-orbit",
    lessonId: "tensor-shapes",
    experimentId: "deep-orbit-channel-layout",
    contentVersion: 1,
    phase: "prediction",
    attempt: 1,
    correct: false,
    assisted: false,
  });
});

it("tests both operation and values on the changed packet, preserving the first attempt and help through reset", () => {
  render(<ChannelLayoutExperiment />);
  click("Try a different packet");
  expect(
    screen.queryByRole("button", { name: "Run transpose" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByLabelText("Reshape to [3, 2]"));
  fireEvent.change(screen.getByLabelText("Channel 1 values, in time order"), {
    target: { value: "20, 21" },
  });
  click("Check new packet");
  expect(record().firstCheck).toEqual({ correct: false, assisted: false });
  click("Show this check's answer");
  click("Reset controls");
  expect(record().latestCheck).toEqual({ correct: false, assisted: false });
  fireEvent.click(screen.getByLabelText("Transpose the axes"));
  fireEvent.change(screen.getByLabelText("Channel 1 values, in time order"), {
    target: { value: "20, 21" },
  });
  click("Check new packet");
  expect(record().checkResult).toEqual({ correct: true, assisted: true });
  expect(record().firstCheck).toEqual({ correct: false, assisted: false });
  expect(record().checkAttempts).toBe(2);
  expect(screen.getByText(/Changed case passed with help/)).toBeInTheDocument();
});

it("does not erase observed help by resetting operations or looking back at the worked packet", () => {
  render(<ChannelLayoutExperiment />);
  click("Run transpose");
  click("Reset controls");
  fireEvent.change(screen.getByLabelText(/Predict channel/), {
    target: { value: "0,4,8" },
  });
  click("Check prediction");
  expect(record().firstPrediction?.assisted).toBe(true);
  click("Try a different packet");
  click("Return to worked packet");
  click("Try a different packet");
  expect(record().checkHelp).toBe(true);
  expect(record().checkAnswer).toBe(false);
  expect(screen.queryByText(/Transpose gives \[\[/)).not.toBeInTheDocument();
});

it("keeps the activity usable if storage is corrupt or unavailable", () => {
  sessionStorage.setItem(CHANNEL_STORAGE_KEY, "{broken");
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw Error("blocked");
  });
  render(<ChannelLayoutExperiment />);
  expect(
    screen.getByText(/previous experiment draft could not be read/),
  ).toBeInTheDocument();
  expect(screen.getByText(/Tab storage is unavailable/)).toBeInTheDocument();
  click("Run transpose");
  expect(screen.getByTestId("channel-result")).toBeInTheDocument();
});
