export type TrainingEpochs = 1 | 5 | 15;

import type { RoomTrainingResult } from "@/public/demos/room-training.mjs";
export type {
  RoomTrainingResult as TrainingResult,
  RoomMetrics as PolicyMetrics,
} from "@/public/demos/room-training.mjs";

export type TrainingMessage =
  | { type: "loading"; stage?: "resources" | "training" }
  | { type: "progress"; epoch: number; epochs: TrainingEpochs; loss: number }
  | { type: "result"; result: RoomTrainingResult }
  | { type: "error"; message: string };
