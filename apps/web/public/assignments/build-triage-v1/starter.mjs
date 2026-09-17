import { readFile } from "node:fs/promises";
import * as tf from "@tensorflow/tfjs";

await tf.setBackend("cpu");
await tf.ready();
const dataset = JSON.parse(
  await readFile(new URL("./data.json", import.meta.url), "utf8"),
);
console.log(
  `Loaded ${dataset.rows.length} synthetic builds on ${tf.getBackend()}.`,
);
console.log("First row:", dataset.rows[0]);
// Write your experiment here. README.md explains the decision and fields.
// Choose your inputs, time split, baseline and evaluation before fitting.
// Save the commands, settings and results someone else needs to rerun it.
