import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TrainingDemo } from "./training-demo";
import type {
  TrainingEpochs,
  TrainingMessage,
  TrainingResult,
} from "./training-types";

class TestWorker {
  static instances: TestWorker[] = [];
  onmessage: ((event: MessageEvent<TrainingMessage>) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessageerror: (() => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  constructor(readonly url: string) {
    TestWorker.instances.push(this);
  }
  emit(data: TrainingMessage) {
    this.onmessage?.({ data } as MessageEvent<TrainingMessage>);
  }
}

function result(epochs: TrainingEpochs = 5): TrainingResult {
  return {
    runtimeVersion: "4.22.0",
    backend: "cpu",
    epochs,
    losses: Array.from({ length: epochs }, (_, index) => 0.8 - index * 0.02),
    counts: { train: 1200, validation: 400, reserved: 456 },
    periods: {
      train: { from: "2015-02-01", to: "2015-02-05" },
      validation: { from: "2015-02-06", to: "2015-02-08" },
      reserved: { from: "2015-02-09", to: "2015-02-10" },
    },
    preprocessing: {
      features: ["temperature", "light", "co2"],
      mean: [22, 100, 600],
      std: [2, 50, 100],
    },
    modelMetrics: {
      tp: 60,
      fp: 3,
      tn: 333,
      fn: 4,
      count: 400,
      accuracy: 393 / 400,
      precision: 60 / 63,
      recall: 60 / 64,
      totalErrorCost: 19,
    },
    baselineMetrics: {
      tp: 62,
      fp: 9,
      tn: 327,
      fn: 2,
      count: 400,
      accuracy: 389 / 400,
      precision: 62 / 71,
      recall: 62 / 64,
      totalErrorCost: 17,
    },
    mistakes: [
      {
        id: "reading-1",
        recordedAt: "2015-02-06 12:00",
        temperature: 23.7,
        light: 271,
        co2: 814.3,
        occupied: 0,
        score: 0.656,
        model: 1,
        baseline: 1,
      },
      {
        id: "reading-2",
        recordedAt: "2015-02-06 13:00",
        temperature: 22,
        light: 200,
        co2: 700,
        occupied: 1,
        score: 0.2,
        model: 0,
        baseline: 1,
      },
    ],
  };
}

const runButton = () =>
  screen.getByRole("button", { name: "Train and compare" });
const worker = () => TestWorker.instances.at(-1)!;
async function complete(value = result()) {
  await act(async () => {
    worker().emit({ type: "result", result: value });
  });
}

describe("supplied browser training demonstration", () => {
  beforeEach(() => {
    TestWorker.instances = [];
    vi.stubGlobal("Worker", TestWorker);
  });
  afterEach(() => vi.unstubAllGlobals());

  it("keeps the initial page useful without starting a worker or inventing results", () => {
    render(<TrainingDemo />);
    expect(
      screen.getByRole("combobox", { name: "Training epochs" }),
    ).toHaveValue("5");
    expect(screen.getByRole("status")).toHaveTextContent("Ready to train");
    expect(screen.getByText(/maintainer-supplied example/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "training and evaluation code" }),
    ).toHaveAttribute("href", "/demos/room-training.mjs");
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(TestWorker.instances).toHaveLength(0);
  });

  it("keeps keyboard focus on Run, prevents duplicate runs and announces real progress", async () => {
    render(<TrainingDemo />);
    const run = runButton();
    run.focus();
    fireEvent.click(run);
    fireEvent.click(run);
    expect(run).toHaveFocus();
    expect(run).toHaveAttribute("aria-disabled", "true");
    expect(run).not.toBeDisabled();
    expect(TestWorker.instances).toHaveLength(1);
    expect(worker().url).toBe("/demos/room-training.worker.js");
    expect(worker().postMessage).toHaveBeenCalledWith({ epochs: 5 });
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    act(() => {
      worker().emit({ type: "loading", stage: "training" });
      worker().emit({ type: "progress", epoch: 1, epochs: 5, loss: 0.8 });
    });
    expect(
      screen.getByRole("progressbar", { name: "Completed training epochs" }),
    ).toHaveAttribute("value", "1");
    expect(screen.getByRole("status")).toHaveTextContent(
      "Finished epoch 1 of 5",
    );
    await complete();
    expect(run).toHaveFocus();
    expect(run).toHaveAttribute("aria-disabled", "false");
  });

  it("shows actual losses, paired costs and selectable mistakes from the completed run", async () => {
    render(<TrainingDemo />);
    fireEvent.click(runButton());
    await complete();
    expect(screen.getByRole("status")).toHaveTextContent(
      "456 final-test readings remain unused",
    );
    expect(
      screen.getByRole("img", { name: /Training loss by epoch/ }),
    ).toBeInTheDocument();
    const comparison = screen.getByRole("region", {
      name: "Validation policy comparison",
    });
    const cost = within(comparison).getByRole("row", {
      name: "Illustrative error cost 17 19",
    });
    expect(cost).toBeInTheDocument();
    expect(
      screen.getByRole("row", { name: "Model score from this run 0.656" }),
    ).toBeInTheDocument();
    const readings = screen.getByRole("combobox", {
      name: "Validation reading to inspect",
    });
    readings.focus();
    fireEvent.change(readings, { target: { value: "1" } });
    expect(readings).toHaveFocus();
    expect(
      screen.getByRole("row", { name: "Model score from this run 0.2" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /Reading reading-2:.*model is incorrect and the rule is correct/,
      ),
    ).toBeInTheDocument();
  });

  it("clears old output when epochs change and sends the new choice", async () => {
    render(<TrainingDemo />);
    fireEvent.click(runButton());
    await complete();
    fireEvent.change(
      screen.getByRole("combobox", { name: "Training epochs" }),
      { target: { value: "1" } },
    );
    expect(screen.queryByText("This browser run")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Settings changed");
    fireEvent.click(runButton());
    expect(worker().postMessage).toHaveBeenCalledWith({ epochs: 1 });
    await complete(result(1));
    expect(screen.getByText(/1 epoch with TensorFlow/)).toBeInTheDocument();
  });

  it("cancels without losing focus and rejects an old reply during a new run", async () => {
    render(<TrainingDemo />);
    fireEvent.click(runButton());
    const previous = worker();
    const staleReply = previous.onmessage!;
    const cancel = screen.getByRole("button", { name: "Cancel run" });
    cancel.focus();
    await act(async () => fireEvent.click(cancel));
    expect(cancel).toHaveFocus();
    expect(previous.terminate).toHaveBeenCalledOnce();
    expect(screen.getByRole("status")).toHaveTextContent("Training cancelled");
    fireEvent.click(runButton());
    await act(async () =>
      staleReply({
        data: { type: "result", result: result() },
      } as MessageEvent<TrainingMessage>),
    );
    expect(screen.queryByText("This browser run")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Loading");
    await complete();
    expect(screen.getByText("This browser run")).toBeInTheDocument();
  });

  it("announces errors and supports a fresh retry", async () => {
    render(<TrainingDemo />);
    fireEvent.click(runButton());
    await act(async () =>
      worker().emit({
        type: "error",
        message: "The room data changed. Reload the page before trying again.",
      }),
    );
    expect(screen.getByRole("alert")).toHaveTextContent(
      "The room data changed",
    );
    expect(screen.queryByText("This browser run")).not.toBeInTheDocument();
    fireEvent.click(runButton());
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    await complete();
  });

  it("terminates an active worker when the reader leaves the guide", async () => {
    const view = render(<TrainingDemo />);
    fireEvent.click(runButton());
    const active = worker();
    await act(async () => view.unmount());
    expect(active.terminate).toHaveBeenCalledOnce();
  });
});
