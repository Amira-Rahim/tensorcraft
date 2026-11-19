export type FitCheckpointReason =
  | "model-unavailable"
  | "over-limit"
  | "unsupported-dtype"
  | "nonfinite-weight"
  | "unreadable-weights";

export interface FitTensorSnapshot {
  readonly shape: readonly number[];
  readonly dtype: string;
  readonly values: readonly number[] | null;
  readonly complete: boolean;
}

export interface FitWeightTensor {
  readonly shape: readonly number[];
  readonly dtype: "float32";
  readonly values: readonly number[];
}

export type FitCheckpoint =
  | {
      readonly complete: true;
      readonly reason: null;
      readonly parameters: number;
      readonly tensors: readonly FitWeightTensor[];
    }
  | {
      readonly complete: false;
      readonly reason: FitCheckpointReason;
      readonly parameters: number | null;
      readonly tensors: null;
    };

export interface FitRecorderStatus {
  readonly recordedFits: number;
  readonly attemptedFits: number;
  readonly pendingFits: number;
  readonly failedFits: number;
  readonly overflow: boolean;
  /** A retained fit lacked usable inputs, settings, history, or weights. */
  readonly unsupported: boolean;
}

type FitScalar = string | number | boolean | null;

export interface FitSettings {
  readonly epochs: FitScalar;
  readonly batchSize: FitScalar;
  readonly shuffle: FitScalar;
  readonly initialEpoch: FitScalar;
  readonly validationSplit: FitScalar;
  readonly parameters: FitScalar;
  readonly units: readonly FitScalar[];
  readonly activations: readonly FitScalar[];
  readonly optimizer: FitScalar;
  readonly learningRate: FitScalar;
  readonly loss: FitScalar;
  readonly metrics: readonly FitScalar[];
}

export interface FitCompletedHistory {
  readonly completedEpochs: number;
  readonly finiteEpochs: number;
  readonly sampled: boolean;
  readonly points: readonly { readonly epoch: number; readonly loss: number }[];
  readonly finalLoss: number | null;
  readonly finalAccuracy: number | null;
  readonly metricKey: "acc" | "accuracy" | "binaryAccuracy" | null;
  /** Both final metrics are usable and no supplied callback could alter logs. */
  readonly logAvailable: boolean;
}

export interface RecordedFit {
  /** Live identity only. Never persist this object or the returned History. */
  readonly model: unknown;
  readonly modelOrdinal: number | null;
  /** Live layer identities preserve observed weight lineage across recompile. */
  readonly weightLayers: readonly unknown[] | null;
  readonly history: unknown;
  readonly x: FitTensorSnapshot | null;
  readonly y: FitTensorSnapshot | null;
  readonly settings: FitSettings | null;
  readonly completed: FitCompletedHistory | null;
  readonly failed: boolean;
  readonly pending: false;
  readonly callbacksPresent: boolean;
  readonly validationDataPresent: boolean;
  readonly weights: FitCheckpoint;
  readonly callbacks: readonly {
    readonly monitor: FitScalar;
    readonly patience: FitScalar;
    readonly minDelta: FitScalar;
  }[];
}

export interface FitRecorder {
  reset(): void;
  read(): readonly (RecordedFit | null)[];
  status(): FitRecorderStatus;
  checkpoint(model: unknown): FitCheckpoint;
  wrap<TArgs extends unknown[], TResult>(
    fit: (this: unknown, ...args: TArgs) => TResult,
  ): (this: unknown, ...args: TArgs) => Promise<Awaited<TResult>>;
}

export declare const FIT_RECORDING_SOURCE: string;
