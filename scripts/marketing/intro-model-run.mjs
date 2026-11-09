/**
 * Records one supplied course solution run for the Tensorcraft intro film.
 * The chart describes training on generated practice data. It makes no claim
 * about predictions on new data or an independent learner's work.
 *
 * Usage: node scripts/marketing/intro-model-run.mjs [output-path]
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import * as tf from "@tensorflow/tfjs";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);
const SOURCE =
  "packages/content/content/deep-orbit/neural-networks/exercises/simple-network.yaml";
const DEFAULT_OUTPUT = "output/tensorcraft-intro-video/training-run.json";
const FIT = "await model.fit(readings, labels, { epochs: 50, batchSize: 16 });";

function extractSolution(yaml) {
  const block = yaml.match(/^solutionCode: \|\r?\n((?:[ \t].*\r?\n|\r?\n)+)/m);
  if (!block) throw new Error("The course solution block was not found.");
  return block[1].replace(/^  /gm, "");
}

export async function recordIntroModelRun(outputPath = DEFAULT_OUTPUT) {
  const yaml = await fs.readFile(path.join(ROOT, SOURCE), "utf8");
  const solution = extractSolution(yaml);
  if (solution.split(FIT).length !== 2) {
    throw new Error(
      "The course training call changed. Review the film excerpt.",
    );
  }
  if (tf.version.tfjs !== "4.22.0") {
    throw new Error(`Expected TensorFlow.js 4.22.0, found ${tf.version.tfjs}.`);
  }
  await tf.setBackend("cpu");
  await tf.ready();
  const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;
  const runSolution = new AsyncFunction(
    "tf",
    solution.replace(FIT, `const trainingRun = ${FIT}`) +
      `
      const result = {
        losses: Array.from(trainingRun.history.loss),
        inputShape: readings.shape,
        targetShape: labels.shape,
        units: model.layers.map(layer => layer.getConfig().units),
        parameters: model.countParams(),
        codeExcerpt: ${JSON.stringify(FIT)}
      };
      model.optimizer.dispose();
      second.optimizer.dispose();
      model.dispose();
      second.dispose();
      readings.dispose();
      labels.dispose();
      return result;
      `,
  );

  tf.engine().startScope();
  let observed;
  try {
    observed = await runSolution(tf);
  } finally {
    tf.engine().endScope();
    tf.disposeVariables();
  }
  if (
    observed.losses.length !== 50 ||
    observed.losses.some((loss) => !Number.isFinite(loss)) ||
    observed.inputShape.join(",") !== "120,8" ||
    observed.units.join(",") !== "24,12,1" ||
    observed.parameters !== 529
  ) {
    throw new Error("The executed course run did not match the expected task.");
  }

  const report = {
    schemaVersion: 1,
    source: SOURCE,
    solutionSha256: createHash("sha256").update(solution).digest("hex"),
    runtime: { tensorflowJs: tf.version.tfjs, backend: tf.getBackend() },
    provenance:
      "Executed supplied course solution on generated practice data. This is a demonstration run, separate from the ship's recordings and independent learner work.",
    scope:
      "Training batch only. Training loss does not measure performance on new readings.",
    initialization:
      "The course seeds generated inputs and uses default random starting model weights. Recorded values belong to this run.",
    settings: {
      epochs: 50,
      batchSize: 16,
      rowCount: 120,
      inputShape: observed.inputShape,
      targetShape: observed.targetShape,
      layerUnits: observed.units,
      parameters: observed.parameters,
      loss: "binaryCrossentropy",
      optimizer: "Adam",
    },
    chart: { xLabel: "Epoch", yLabel: "Training loss" },
    losses: observed.losses,
    epochs: observed.losses.map((loss, index) => ({ epoch: index + 1, loss })),
    codeExcerpt: observed.codeExcerpt,
    remainingTensors: tf.memory().numTensors,
  };
  const destination = path.resolve(ROOT, outputPath);
  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.writeFile(destination, JSON.stringify(report, null, 2) + "\n");
  return { report, destination };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const { report, destination } = await recordIntroModelRun(process.argv[2]);
  console.log(
    JSON.stringify({
      file: path.relative(ROOT, destination),
      epochs: report.losses.length,
      firstLoss: report.losses[0],
      lastLoss: report.losses.at(-1),
      remainingTensors: report.remainingTensors,
    }),
  );
}
