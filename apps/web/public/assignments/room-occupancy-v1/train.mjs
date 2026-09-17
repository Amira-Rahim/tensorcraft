import { readFile } from "node:fs/promises";
import * as tf from "@tensorflow/tfjs";
import { saveArtifact } from "./artifact.mjs";
import { vectorFor } from "./preprocessing.mjs";
await tf.setBackend("cpu");
await tf.ready();
const { rows } = JSON.parse(await readFile("data.json", "utf8"));
console.log(
  `Loaded ${rows.length} room readings. Choose your split before fitting.`,
);
// Read README.md, then write your experiment here or in modules you import.
// 1. Record your chronological split IDs and choices in plan.json.
// 2. Choose a simple baseline and error costs using training/validation data.
// 3. Fit means/scales on training rows only. Choose features yourself.
// 4. Train a small binary classifier. Use vectorFor(row, metadata) for its inputs.
// 5. Freeze threshold and metadata, then saveArtifact(model, metadata, rawRows).
// metadata: {version: 1, features: [...], mean: [...], std: [...], threshold: number}
// Export at least three varied raw rows for parity checks. No model is provided.
throw new Error(
  "Implement your experiment before running the artifact checks. README.md defines the deliverables.",
);
