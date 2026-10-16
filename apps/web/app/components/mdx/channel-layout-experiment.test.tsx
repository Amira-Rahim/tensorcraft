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

it("shows which readings Farah selected from Demir's recording before asking for a prediction", () => {
  render(<ChannelLayoutExperiment />);
  const notes = screen.getByRole("complementary", {
    name: "Recording notes for this excerpt",
  });
  expect(notes).toHaveTextContent("4 of 64 sensors");
  expect(notes).toHaveTextContent("3, from earliest to latest");
  expect(notes).toHaveTextContent("The other 60 sensors are left out");
  expect(screen.queryByTestId("time-grid")).not.toBeInTheDocument();
  click("Try a new example");
  expect(notes).toHaveTextContent("3 of 64 sensors");
  expect(notes).toHaveTextContent("2, from earliest to latest");
  expect(notes).toHaveTextContent("The other 61 sensors are left out");
  expect(
    screen.getByText(/Farah moves to another part of Demir’s recording/),
  ).toBeVisible();
});

it("clearly marks a wrong prediction, clears the verdict on edit, and confirms a corrected answer", () => {
  render(<ChannelLayoutExperiment />);
  const prediction = screen.getByLabelText(
    "Which four readings go in the second row?",
  );
  fireEvent.change(prediction, { target: { value: "2, 20, 5, 8" } });
  click("Check prediction");
  const feedback = screen
    .getByText("Not quite. That’s not the second row.")
    .closest('[role="status"]')!;
  expect(feedback).toHaveTextContent("then try again");
  expect(prediction).toHaveAttribute("aria-invalid", "true");
  expect(prediction).toHaveAccessibleDescription(
    /^Not quite\. That’s not the second row\..*then try again\.$/,
  );

  fireEvent.change(prediction, { target: { value: "3, 18, 7, 8" } });
  expect(prediction).not.toHaveAttribute("aria-invalid");
  expect(screen.queryByText(/Not quite/)).not.toBeInTheDocument();
  click("Check prediction");
  expect(feedback).toHaveTextContent("Correct!");
  expect(prediction).toHaveAttribute("aria-invalid", "false");
  expect(record().firstPrediction?.correct).toBe(false);
  expect(record().latestPrediction?.correct).toBe(true);
});

it("compares two same-shape layouts, retains state on remount, and does not emit answer text", () => {
  const view = render(<ChannelLayoutExperiment />);
  expect(screen.queryByTestId("channel-result")).not.toBeInTheDocument();
  fireEvent.change(
    screen.getByLabelText(/Which four readings go in the second row/),
    {
      target: { value: "2, 20, 5, 8" },
    },
  );
  click("Check prediction");
  expect(record().firstPrediction).toEqual({ correct: false, assisted: false });
  click("Run reshape");
  expect(
    within(screen.getByTestId("channel-result")).getByRole("status"),
  ).toHaveTextContent("[2, 20, 5]");
  click("Run transpose");
  expect(
    within(screen.getByTestId("channel-result")).getByRole("status"),
  ).toHaveTextContent("[2, 3, 4]");
  fireEvent.change(screen.getByLabelText("Follow a sensor"), {
    target: { value: "2" },
  });
  view.unmount();
  render(<ChannelLayoutExperiment />);
  expect(screen.getByLabelText("Follow a sensor")).toHaveValue("2");
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
    contentVersion: 2,
    phase: "prediction",
    attempt: 1,
    correct: false,
    assisted: false,
  });
});

it("tests both operation and values on the changed packet, preserving the first attempt and help through reset", () => {
  render(<ChannelLayoutExperiment />);
  click("Try a new example");
  expect(
    screen.queryByRole("button", { name: "Run transpose" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByLabelText("Reshape to [3, 2]"));
  fireEvent.change(
    screen.getByLabelText("Sensor B’s two readings, from earliest to latest"),
    {
      target: { value: "20, 21" },
    },
  );
  click("Check my answer");
  expect(record().firstCheck).toEqual({ correct: false, assisted: false });
  expect(
    screen.getByText("Not quite. The operation is incorrect."),
  ).toBeVisible();
  expect(
    screen.getByRole("group", {
      name: "Which operation keeps each sensor’s readings together?",
    }),
  ).toHaveAttribute("aria-invalid", "true");
  expect(
    screen.getByLabelText("Sensor B’s two readings, from earliest to latest"),
  ).toHaveAttribute("aria-invalid", "false");
  click("Show the answer");
  click("Reset the controls");
  expect(record().latestCheck).toEqual({ correct: false, assisted: false });
  fireEvent.click(screen.getByLabelText("Transpose: turn columns into rows"));
  fireEvent.change(
    screen.getByLabelText("Sensor B’s two readings, from earliest to latest"),
    {
      target: { value: "20, 21" },
    },
  );
  click("Check my answer");
  expect(record().checkResult).toEqual({ correct: true, assisted: true });
  expect(screen.getByText("Both answers are correct!")).toBeVisible();
  expect(record().firstCheck).toEqual({ correct: false, assisted: false });
  expect(record().checkAttempts).toBe(2);
  expect(
    screen.getByText(/Both answers are correct. You answered with help/),
  ).toBeInTheDocument();
});

it("identifies incorrect sensor values even when the operation is correct", () => {
  render(<ChannelLayoutExperiment />);
  click("Try a new example");
  fireEvent.click(screen.getByLabelText("Transpose: turn columns into rows"));
  const readings = screen.getByLabelText(
    "Sensor B’s two readings, from earliest to latest",
  );
  fireEvent.change(readings, { target: { value: "10, 11" } });
  click("Check my answer");
  expect(
    screen.getByText("Not quite. Your sensor readings are incorrect."),
  ).toBeVisible();
  expect(readings).toHaveAttribute("aria-invalid", "true");
  expect(
    screen.getByRole("group", {
      name: "Which operation keeps each sensor’s readings together?",
    }),
  ).toHaveAttribute("aria-invalid", "false");
  fireEvent.change(readings, { target: { value: "20, 21" } });
  expect(readings).not.toHaveAttribute("aria-invalid");
  expect(screen.queryByText(/Not quite/)).not.toBeInTheDocument();
  click("Check my answer");
  expect(screen.getByText("Both answers are correct!")).toBeVisible();
});

it("does not erase observed help by resetting operations or looking back at the worked packet", () => {
  render(<ChannelLayoutExperiment />);
  click("Build the table");
  click("Run transpose");
  click("Reset the controls");
  fireEvent.change(
    screen.getByLabelText(/Which four readings go in the second row/),
    {
      target: { value: "3,18,7,8" },
    },
  );
  click("Check prediction");
  expect(record().firstPrediction?.assisted).toBe(true);
  click("Try a new example");
  click("Back to the first example");
  click("Try a new example");
  expect(record().checkHelp).toBe(true);
  expect(record().checkAnswer).toBe(false);
  expect(screen.queryByText(/Transpose makes \[\[/)).not.toBeInTheDocument();
});

it("keeps the activity usable if storage is corrupt or unavailable", () => {
  sessionStorage.setItem(CHANNEL_STORAGE_KEY, "{broken");
  vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw Error("blocked");
  });
  render(<ChannelLayoutExperiment />);
  expect(
    screen.getByText(/couldn't load your saved work for this activity/),
  ).toBeInTheDocument();
  expect(
    screen.getByText(/can’t save your work in this tab/),
  ).toBeInTheDocument();
  click("Build the table");
  click("Run transpose");
  expect(screen.getByTestId("channel-result")).toBeInTheDocument();
});

it("lets learners predict before revealing the table and keeps first evidence independent of feedback", () => {
  render(<ChannelLayoutExperiment />);
  expect(screen.queryByTestId("time-grid")).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Run transpose" }),
  ).not.toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/Which four readings/), {
    target: { value: "3,18,7,8" },
  });
  click("Check prediction");
  expect(record().firstPrediction).toEqual({ correct: true, assisted: false });
  expect(screen.getByTestId("time-grid")).toBeInTheDocument();
  expect(record().predictionHelp).toBe(true);
  click("Check prediction");
  expect(record().latestPrediction).toEqual({ correct: true, assisted: true });
  expect(record().firstPrediction).toEqual({ correct: true, assisted: false });
});

it("preserves source sensor identity for duplicate readings through both layouts and keeps the plot in bounds", () => {
  render(<ChannelLayoutExperiment />);
  click("Build the table");
  click("Run reshape");
  let table = within(screen.getByTestId("channel-result")).getByRole("table");
  expect(
    [...table.querySelectorAll('[data-sensor="D"]')].map((cell) =>
      cell.textContent?.trim(),
    ),
  ).toEqual(["8D", "8D", "9D"]);
  fireEvent.change(screen.getByLabelText("Follow a sensor"), {
    target: { value: "1" },
  });
  const svg = screen.getByRole("img");
  expect(svg).toHaveAccessibleName(/20, 18, 16/);
  for (const point of svg.querySelectorAll("polyline")) {
    for (const pair of point.getAttribute("points")!.split(" ")) {
      const [x, y] = pair.split(",").map(Number);
      expect(x).toBeGreaterThanOrEqual(70);
      expect(x).toBeLessThanOrEqual(530);
      expect(y).toBeGreaterThanOrEqual(35);
      expect(y).toBeLessThanOrEqual(175);
    }
  }
  click("Run transpose");
  table = within(screen.getByTestId("channel-result")).getByRole("table");
  const sensorD = within(table)
    .getByRole("rowheader", { name: "D" })
    .closest("tr")!;
  expect(
    [...sensorD.querySelectorAll("td")].every(
      (cell) => cell.dataset.sensor === "D",
    ),
  ).toBe(true);
  expect(
    [...sensorD.querySelectorAll("td")].map((cell) => cell.textContent?.trim()),
  ).toEqual(["8D", "8D", "9D"]);
});

it("does not treat older activity work as a prediction on the revised task", () => {
  sessionStorage.setItem(
    CHANNEL_STORAGE_KEY.replace(":v2", ":v1"),
    JSON.stringify({
      version: 1,
      prediction: "0,4,8",
      firstPrediction: { correct: true, assisted: false },
    }),
  );
  render(<ChannelLayoutExperiment />);
  expect(screen.getByLabelText(/Which four readings/)).toHaveValue("");
  expect(record().firstPrediction).toBeNull();
  expect(screen.queryByTestId("time-grid")).not.toBeInTheDocument();
});
