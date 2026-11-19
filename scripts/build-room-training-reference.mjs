// Record a supplied numerical reference without starting a browser.
import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import * as tf from "@tensorflow/tfjs";
import {
  ROOM_DATA_SHA256,
  runRoomTraining,
} from "../apps/web/public/demos/room-training.mjs";

const root = new URL("../", import.meta.url);
const output = new URL(
  "apps/web/public/assignments/room-training-reference-v1.json",
  root,
);
const check = process.argv.slice(2);
if (check.some((arg) => arg !== "--check") || check.length > 1) {
  throw new Error(
    "Usage: node scripts/build-room-training-reference.mjs [--check]",
  );
}
const paths = [
  "demos/room-training.mjs",
  "assignments/room-occupancy-v1/preprocessing.mjs",
  "assignments/room-occupancy-v1/evaluation.mjs",
  "assignments/room-occupancy-v1/data.json",
];
const files = await Promise.all(
  paths.map((path) => readFile(new URL(`apps/web/public/${path}`, root))),
);
const hashes = Object.fromEntries(
  paths.map((path, index) => [
    `/${path}`,
    createHash("sha256").update(files[index]).digest("hex"),
  ]),
);
if (hashes[`/${paths[3]}`] !== ROOM_DATA_SHA256) {
  throw new Error(
    "The recorded input data does not match the training source.",
  );
}
const result = await runRoomTraining(tf, JSON.parse(files[3].toString()), {
  epochs: 5,
});
const previous = check.length
  ? JSON.parse(await readFile(output, "utf8"))
  : null;
const reference = {
  version: "room-training-reference-v1",
  kind: "supplied-maintainer-reference",
  verifiedOn: previous?.verifiedOn ?? new Date().toISOString().slice(0, 10),
  source: "https://doi.org/10.24432/C5X01N",
  sourceHashes: hashes,
  runtimeVersion: result.runtimeVersion,
  backend: result.backend,
  epochs: result.epochs,
  counts: result.counts,
  periods: result.periods,
  costs: { falsePositive: 1, falseNegative: 4 },
  baselineMetrics: result.baselineMetrics,
  modelMetrics: result.modelMetrics,
  limitations:
    "Supplied maintainer results on 400 validation readings from one room. The final 456 readings are unused. This is not a learner outcome or an independent final test. Scores are not calibrated probabilities.",
};
if (previous) {
  if (JSON.stringify(previous) !== JSON.stringify(reference)) {
    throw new Error(
      "The supplied training reference is stale. Regenerate and review it.",
    );
  }
  console.log(
    "Supplied training reference matches the current source and real CPU run.",
  );
} else {
  await writeFile(output, JSON.stringify(reference, null, 2) + "\n");
  console.log(`Recorded supplied training reference: ${fileURLToPath(output)}`);
}
