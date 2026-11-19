import type * as TensorFlow from "@tensorflow/tfjs";

export const ROOM_DATA_SHA256: string;
export const ALLOWED_EPOCHS: readonly [1, 5, 15];

export interface RoomRow {
  id: string;
  recordedAt: string;
  temperature: number;
  humidity: number;
  light: number;
  co2: number;
  humidityRatio: number;
  occupied: 0 | 1;
}

export interface RoomData {
  version: string;
  source: string;
  sourceArchiveSha256: string;
  rows: RoomRow[];
}

export interface RoomMetrics {
  tp: number;
  fp: number;
  tn: number;
  fn: number;
  count: number;
  accuracy: number;
  precision: number | null;
  recall: number | null;
  totalErrorCost: number;
}

export interface RoomProgress {
  epoch: number;
  epochs: 1 | 5 | 15;
  loss: number;
}

export interface RoomTrainingResult {
  runtimeVersion: string;
  backend: string;
  epochs: 1 | 5 | 15;
  losses: number[];
  counts: { train: number; validation: number; reserved: number };
  periods: Record<
    "train" | "validation" | "reserved",
    { from: string; to: string }
  >;
  preprocessing: { features: string[]; mean: number[]; std: number[] };
  modelMetrics: RoomMetrics;
  baselineMetrics: RoomMetrics;
  mistakes: Array<
    Pick<
      RoomRow,
      "id" | "recordedAt" | "temperature" | "light" | "co2" | "occupied"
    > & {
      score: number;
      model: 0 | 1;
      baseline: 0 | 1;
    }
  >;
}

export function runRoomTraining(
  tf: typeof TensorFlow,
  data: RoomData,
  options?: {
    epochs?: 1 | 5 | 15;
    onEpoch?: (progress: RoomProgress) => void | Promise<void>;
  },
): Promise<RoomTrainingResult>;
