import type {
  PolicyMetrics,
  TrainingEpochs,
  TrainingMessage,
  TrainingResult,
} from "./training-types";

const LOAD_TIMEOUT = 60_000;
const EXECUTION_TIMEOUT = 30_000;

export class TrainingCancelledError extends Error {
  constructor() {
    super("Training cancelled.");
    this.name = "TrainingCancelledError";
  }
}

interface Callbacks {
  onTraining: () => void;
  onProgress: (epoch: number, loss: number) => void;
}

export interface TrainingRun {
  result: Promise<TrainingResult>;
  cancel: () => void;
}

function validMetrics(value: PolicyMetrics | undefined) {
  if (!value) return false;
  const counts = [value.tp, value.fp, value.tn, value.fn];
  return (
    value.count === 400 &&
    counts.every((n) => Number.isInteger(n) && n >= 0) &&
    counts.reduce((sum, n) => sum + n, 0) === value.count &&
    Number.isFinite(value.accuracy) &&
    value.accuracy >= 0 &&
    value.accuracy <= 1 &&
    value.totalErrorCost === value.fp + 4 * value.fn
  );
}

function validResult(
  value: unknown,
  epochs: TrainingEpochs,
): value is TrainingResult {
  const result = value as TrainingResult | null;
  return !!(
    result &&
    result.runtimeVersion === "4.22.0" &&
    result.backend === "cpu" &&
    result.epochs === epochs &&
    Array.isArray(result.losses) &&
    result.losses.length === epochs &&
    result.losses.every((loss) => Number.isFinite(loss) && loss >= 0) &&
    result.counts?.train === 1200 &&
    result.counts?.validation === 400 &&
    result.counts?.reserved === 456 &&
    ["train", "validation", "reserved"].every((name) => {
      const period = result.periods?.[name as keyof TrainingResult["periods"]];
      return typeof period?.from === "string" && typeof period?.to === "string";
    }) &&
    Array.isArray(result.preprocessing?.features) &&
    result.preprocessing.features.length === 3 &&
    result.preprocessing.features.every((name) => typeof name === "string") &&
    Array.isArray(result.preprocessing.mean) &&
    result.preprocessing.mean.length === 3 &&
    result.preprocessing.mean.every(Number.isFinite) &&
    Array.isArray(result.preprocessing.std) &&
    result.preprocessing.std.length === 3 &&
    result.preprocessing.std.every((n) => Number.isFinite(n) && n > 0) &&
    validMetrics(result.modelMetrics) &&
    validMetrics(result.baselineMetrics) &&
    Array.isArray(result.mistakes) &&
    result.mistakes.length <= 8 &&
    result.mistakes.every(
      (row) =>
        row &&
        typeof row.id === "string" &&
        typeof row.recordedAt === "string" &&
        [row.temperature, row.light, row.co2, row.score].every(
          Number.isFinite,
        ) &&
        row.score >= 0 &&
        row.score <= 1 &&
        [row.occupied, row.model, row.baseline].every(
          (n) => n === 0 || n === 1,
        ) &&
        (row.model !== row.occupied || row.baseline !== row.occupied),
    )
  );
}

/** Each run owns its worker, timers and callbacks. Nothing starts at import. */
export function startTrainingRun(
  epochs: TrainingEpochs,
  callbacks: Callbacks,
  createWorker: () => Worker = () =>
    new Worker("/demos/room-training.worker.js"),
): TrainingRun {
  let worker: Worker | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let settled = false;
  let training = false;
  let resolve!: (result: TrainingResult) => void;
  let reject!: (error: Error) => void;
  const result = new Promise<TrainingResult>((yes, no) => {
    resolve = yes;
    reject = no;
  });
  function finish(value: TrainingResult | Error) {
    if (settled) return;
    settled = true;
    clearTimeout(timer);
    if (worker) {
      worker.onmessage = null;
      worker.onerror = null;
      worker.onmessageerror = null;
      worker.terminate();
    }
    if (value instanceof Error) reject(value);
    else resolve(value);
  }
  function beginTraining() {
    if (training) return;
    training = true;
    clearTimeout(timer);
    timer = setTimeout(
      () =>
        finish(
          new Error("Training took longer than 30 seconds. Try fewer epochs."),
        ),
      EXECUTION_TIMEOUT,
    );
    callbacks.onTraining();
  }
  try {
    if (![1, 5, 15].includes(epochs))
      throw new Error("Choose 1, 5 or 15 epochs.");
    worker = createWorker();
    timer = setTimeout(
      () =>
        finish(
          new Error(
            "The runtime or data did not load within 60 seconds. Check your connection and try again.",
          ),
        ),
      LOAD_TIMEOUT,
    );
    worker.onmessage = ({ data }: MessageEvent<TrainingMessage>) => {
      if (settled) return;
      if (!data || typeof data !== "object") {
        finish(
          new Error(
            "The training worker returned an unreadable message. Try again.",
          ),
        );
        return;
      }
      switch (data.type) {
        case "loading":
          if (data.stage === "training") beginTraining();
          break;
        case "progress":
          if (
            !training ||
            data.epochs !== epochs ||
            !Number.isInteger(data.epoch) ||
            data.epoch < 1 ||
            data.epoch > epochs ||
            !Number.isFinite(data.loss) ||
            data.loss < 0
          ) {
            finish(
              new Error(
                "The training worker returned invalid progress. Try again.",
              ),
            );
            return;
          }
          callbacks.onProgress(data.epoch, data.loss);
          break;
        case "result":
          finish(
            validResult(data.result, epochs)
              ? data.result
              : new Error(
                  "The training result did not match this demonstration. Try again.",
                ),
          );
          break;
        case "error":
          finish(
            new Error(
              typeof data.message === "string"
                ? data.message
                : "The training run failed. Try again.",
            ),
          );
          break;
        default:
          finish(
            new Error(
              "The training worker returned an unknown message. Try again.",
            ),
          );
      }
    };
    worker.onerror = () =>
      finish(
        new Error(
          "The training worker could not run. Try again in a browser that supports Web Workers.",
        ),
      );
    worker.onmessageerror = () =>
      finish(new Error("The training result could not be read. Try again."));
    worker.postMessage({ epochs });
  } catch (error) {
    finish(
      error instanceof Error
        ? error
        : new Error("This browser could not start the training worker."),
    );
  }
  return { result, cancel: () => finish(new TrainingCancelledError()) };
}
