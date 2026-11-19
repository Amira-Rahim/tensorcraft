import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { startTrainingRun, TrainingCancelledError } from "./training-runner";
import type { TrainingMessage, TrainingResult } from "./training-types";

class TestWorker {
  onmessage: ((event: MessageEvent<TrainingMessage>) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessageerror: (() => void) | null = null;
  postMessage = vi.fn();
  terminate = vi.fn();
  emit(data: TrainingMessage) {
    this.onmessage?.({ data } as MessageEvent<TrainingMessage>);
  }
}

const metrics = {
  tp: 60,
  fp: 3,
  tn: 333,
  fn: 4,
  count: 400,
  accuracy: 393 / 400,
  precision: 60 / 63,
  recall: 60 / 64,
  totalErrorCost: 19,
};
const completed: TrainingResult = {
  runtimeVersion: "4.22.0",
  backend: "cpu",
  epochs: 5,
  losses: [0.8, 0.7, 0.6, 0.5, 0.4],
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
  modelMetrics: metrics,
  baselineMetrics: metrics,
  mistakes: [],
};

function setup() {
  const worker = new TestWorker();
  const callbacks = { onTraining: vi.fn(), onProgress: vi.fn() };
  const factory = vi.fn(() => worker as unknown as Worker);
  return {
    worker,
    callbacks,
    factory,
    run: startTrainingRun(5, callbacks, factory),
  };
}

describe("browser training worker lifecycle", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("sends the requested epochs and releases the worker after a valid result", async () => {
    const { worker, callbacks, factory, run } = setup();
    expect(factory).toHaveBeenCalledOnce();
    expect(worker.postMessage).toHaveBeenCalledExactlyOnceWith({ epochs: 5 });
    worker.emit({ type: "loading", stage: "training" });
    worker.emit({ type: "progress", epoch: 1, epochs: 5, loss: 0.8 });
    worker.emit({ type: "result", result: completed });
    await expect(run.result).resolves.toEqual(completed);
    expect(callbacks.onTraining).toHaveBeenCalledOnce();
    expect(callbacks.onProgress).toHaveBeenCalledExactlyOnceWith(1, 0.8);
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(worker.onmessage).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("cancels immediately and ignores already queued replies", async () => {
    const { worker, callbacks, run } = setup();
    const reply = worker.onmessage!;
    const outcome = run.result.catch((error: unknown) => error);
    run.cancel();
    reply({
      data: { type: "loading", stage: "training" },
    } as MessageEvent<TrainingMessage>);
    reply({
      data: { type: "result", result: completed },
    } as MessageEvent<TrainingMessage>);
    run.cancel();
    expect(await outcome).toBeInstanceOf(TrainingCancelledError);
    expect(callbacks.onTraining).not.toHaveBeenCalled();
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("allows 60 seconds for resources and then terminates a stalled load", async () => {
    const { worker, run } = setup();
    const outcome = run.result.catch((error: Error) => error);
    vi.advanceTimersByTime(59_999);
    expect(worker.terminate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(await outcome).toEqual(
      expect.objectContaining({
        message: expect.stringContaining("60 seconds"),
      }),
    );
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it("starts a separate 30-second execution budget without extending it on progress", async () => {
    const { worker, run } = setup();
    const outcome = run.result.catch((error: Error) => error);
    vi.advanceTimersByTime(59_000);
    worker.emit({ type: "loading", stage: "training" });
    vi.advanceTimersByTime(20_000);
    worker.emit({ type: "loading", stage: "training" });
    worker.emit({ type: "progress", epoch: 1, epochs: 5, loss: 0.8 });
    vi.advanceTimersByTime(9_999);
    expect(worker.terminate).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(await outcome).toEqual(
      expect.objectContaining({
        message: expect.stringContaining("30 seconds"),
      }),
    );
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it.each(["onerror", "onmessageerror"] as const)(
    "cleans up after %s",
    async (handler) => {
      const { worker, run } = setup();
      const outcome = run.result.catch((error: Error) => error);
      worker[handler]!();
      expect(await outcome).toBeInstanceOf(Error);
      expect(worker.terminate).toHaveBeenCalledOnce();
      expect(vi.getTimerCount()).toBe(0);
    },
  );

  it.each([
    { ...completed, runtimeVersion: "4.21.0" },
    { ...completed, losses: [0.8, 0.7, NaN, 0.5, 0.4] },
    { ...completed, counts: { ...completed.counts, validation: 456 } },
  ])("rejects a mismatched or nonfinite result", async (result) => {
    const { worker, run } = setup();
    worker.emit({ type: "result", result });
    await expect(run.result).rejects.toThrow(
      "did not match this demonstration",
    );
    expect(worker.terminate).toHaveBeenCalledOnce();
  });

  it("surfaces an unavailable worker without leaving a timer", async () => {
    const run = startTrainingRun(
      5,
      { onTraining: vi.fn(), onProgress: vi.fn() },
      () => {
        throw new Error("Worker unavailable");
      },
    );
    await expect(run.result).rejects.toThrow("Worker unavailable");
    expect(vi.getTimerCount()).toBe(0);
  });
});
