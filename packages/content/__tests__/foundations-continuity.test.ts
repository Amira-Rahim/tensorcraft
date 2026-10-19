import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { WORKED_PACKET } from "../../../apps/web/app/components/mdx/channel-layout-data";

const foundations = resolve(
  import.meta.dirname,
  "../content/deep-orbit/foundations",
);
const lesson = (name: string) =>
  readFileSync(resolve(foundations, name + ".mdx"), "utf8").split("---")[2]!;
const requiredRead = (name: string) =>
  lesson(name)
    .split("## Challenge")[0]!
    .replace(/<ConceptReference[\s\S]*?<\/ConceptReference>/g, "");

describe("the opening investigation's visible prerequisites", () => {
  it("keeps the first task to creation and shape, with supplied readback and cleanup", () => {
    const read = requiredRead("01-introduction-to-tensors");
    expect(read).toContain("[2, 20, 5, 8, 3, 18, 7, 8, 4, 16, 6, 9]");
    // TensorInvestigation now renders the runnable creation/shape example.
    // Its component test checks that both lines are visible before running.
    const exercise = readFileSync(
      resolve(foundations, "exercises/create-a-tensor.yaml"),
      "utf8",
    );
    const starter = exercise
      .split("starterCode: |")[1]!
      .split("solutionCode:")[0]!;
    expect(starter).toContain("[2, 20, 5, 8, 3, 18, 7, 8, 4, 16, 6, 9]");
    expect(starter).toContain("const reading = null;");
    expect(starter).toContain("const shape = null;");
    expect(starter.match(/\bnull\b/g)).toHaveLength(2);
    expect(starter).toContain("const values = reading?.arraySync();");
    expect(starter).toContain("reading?.dispose();");
    expect(starter.indexOf("reading?.arraySync()")).toBeLessThan(
      starter.indexOf("reading?.dispose()"),
    );
    expect(lesson("01-introduction-to-tensors")).toContain(
      "Four lines appear on the chart, one for each selected sensor.",
    );
    for (const deferred of [
      "reading.sum()",
      "tf.tidy(",
      "rank",
      "256",
      "float32",
    ])
      expect(read).not.toContain(deferred);
    expect(requiredRead("02-tensor-shapes")).toContain("rank 1");
    expect(requiredRead("03-tensor-operations")).toContain(
      "synchronous callback",
    );
    expect(read).not.toContain("?start=experiment");
  });
  it("uses the same selected recording in both delivered exercises and the interactive chart", () => {
    const exercises = JSON.parse(
      readFileSync(
        resolve(foundations, "../../../.velite/exercises.json"),
        "utf8",
      ),
    );
    for (const slug of ["create-a-tensor", "reshape-tensor"]) {
      const exercise = exercises.find(
        (item: { slug: string }) => item.slug === slug,
      );
      for (const field of ["starterCode", "solutionCode", "testCode"]) {
        expect(exercise[field]).toContain(
          JSON.stringify(WORKED_PACKET.flat()).replaceAll(",", ", "),
        );
      }
      expect(exercise.testCode).toContain("recordResult(");
    }
  });
  it("keeps row extraction, sample shapes, lazy iteration and split membership in the visible teaching", () => {
    expect(requiredRead("02-tensor-shapes")).toContain("grid.arraySync()[1]");
    const read = requiredRead("04-data-loading");
    for (const operation of [
      "function* rowsById",
      "readSample(id)",
      "yield",
      "tf.tensor([row.label])",
      "source.shuffle(10).batch(4)",
      "await batches.forEachAsync",
      "createShuffledIndices(12)",
      "i + 12",
    ])
      expect(read).toContain(operation);
  });
  it("teaches scaling and inference before optional reference, while supplying model construction", () => {
    const read = requiredRead("05-normalization");
    for (const operation of [
      "tf.moments(batch, 0)",
      "variance.sqrt()",
      "tf.where",
      "tf.onesLike",
      "batch.sub(mean).div(divisor)",
      "previewModel.predict(normalized)",
      "scaled.expandDims(0)",
      "batch.min(0)",
      "batch.max(0)",
    ])
      expect(read).toContain(operation);
    expect(read).toContain("training rows only");
    const exercise = readFileSync(
      resolve(foundations, "exercises/normalize-data.yaml"),
      "utf8",
    );
    const starter = exercise
      .split("starterCode: |")[1]!
      .split("solutionCode:")[0]!;
    expect(starter).toContain("const previewModel = tf.sequential()");
    expect(starter).toContain("return { mean: null, std: null }");
    expect(exercise).toContain("supplied model");
  });
});
