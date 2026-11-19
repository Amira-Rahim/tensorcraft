// @vitest-environment node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { beforeAll, describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs";
import ts from "typescript";
import { FLOW_INVESTIGATIONS } from "./flow-investigations";
import { initialInvestigationValues } from "./investigation-types";
import { parseAndRunTests } from "../../../../../packages/ui/src/mdx/exercise-runner-node";
import { validateArtifacts } from "../../../../../packages/ui/src/mdx/exercise-artifacts.mjs";

const base = new URL("../../../../../", import.meta.url);
const content = "packages/content/content/deep-orbit/browser-runtimes/";
const source = (name: string) =>
  readFileSync(new URL(content + name, base), "utf8");
const compile = (code: string) =>
  ts.transpileModule(code.replace(/^import .*?;\s*$/gm, ""), {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.None,
    },
  }).outputText;
function block(file: string, title: string) {
  const code = [
    ...source(file).matchAll(
      /<CodeBlock[^>]*title="([^"]+)"[^>]*>\s*\{`([\s\S]*?)`}\s*<\/CodeBlock>/g,
    ),
  ].find((match) => match[1] === title)?.[2];
  if (!code) throw Error(`Missing ${title}`);
  return compile(code);
}
const manifest = JSON.parse(
  readFileSync(
    new URL("apps/web/public/models/deep-scan/model.json", base),
    "utf8",
  ),
);
const weightBytes = Uint8Array.from(
  readFileSync(new URL("apps/web/public/models/deep-scan/weights.bin", base)),
);
async function loadSavedAsset() {
  return tf.loadLayersModel(
    tf.io.fromMemory({
      modelTopology: manifest.modelTopology,
      weightSpecs: manifest.weightsManifest.flatMap(
        (group: { weights: tf.io.WeightsManifestEntry[] }) => group.weights,
      ),
      weightData: weightBytes.slice().buffer,
    }),
  );
}
const handlers = new Function(
  "tf",
  block("04-inference-pipeline.mdx", "inference-pipeline.ts") +
    block("04-inference-pipeline.mdx", "classify-async.ts") +
    "\nreturn {preprocess,classify,classifyAsync};",
)(tf) as {
  preprocess: (raw: {
    amplitude: number;
    frequency: number;
    phase: number;
  }) => number[];
  classify: (
    model: tf.LayersModel,
    raw: { amplitude: number; frequency: number; phase: number },
  ) => { class: string; confidence: number };
  classifyAsync: (
    model: tf.LayersModel,
    raw: { amplitude: number; frequency: number; phase: number },
  ) => Promise<{ class: string; confidence: number }>;
};
const makeProbe = (phase = false) => {
  const model = tf.sequential({
    layers: [tf.layers.dense({ inputShape: [3], units: 1, useBias: false })],
  });
  tf.tidy(() =>
    model.layers[0]!.setWeights([
      tf.tensor2d(phase ? [[0], [0], [1]] : [[1], [0], [0]]),
    ]),
  );
  return model;
};
beforeAll(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
});

describe("model loading and inference investigations", () => {
  it("loads the unchanged deployed weights through real TFJS IO and executes the inspection block once", async () => {
    const before = tf.memory().numTensors;
    const model = await loadSavedAsset();
    const weights = model.getWeights();
    expect(model.countParams()).toBe(673);
    expect(weightBytes.byteLength).toBe(2692);
    expect(
      manifest.weightsManifest.flatMap(
        (group: { paths: string[] }) => group.paths,
      ),
    ).toEqual(["weights.bin"]);
    let loads = 0;
    const logs: unknown[] = [];
    const loader = {
      ...tf,
      loadLayersModel: async (url: string) => {
        expect(url).toBe("/models/deep-scan/model.json");
        loads++;
        await Promise.resolve();
        return model;
      },
    };
    const summary = model.summary.bind(model);
    model.summary = () => {};
    try {
      await new Function(
        "tf",
        "console",
        `return (async()=>{${block("03-model-loading.mdx", "model-loading.ts")}})();`,
      )(loader, { log: (value: unknown) => logs.push(value) });
      expect(loads).toBe(1);
      expect(logs[0]).toEqual({
        inputShape: [null, 3],
        outputShape: [null, 1],
        layerCount: 3,
      });
      expect(weights.every((weight) => weight.isDisposed)).toBe(true);
    } finally {
      model.summary = summary;
      if (weights.some((weight) => !weight.isDisposed)) model.dispose();
    }
    expect(tf.memory().numTensors).toBe(before);
  });

  it("releases a real loaded model when inspecting its input shape throws", async () => {
    const before = tf.memory().numTensors;
    const model = await loadSavedAsset();
    const weights = model.getWeights();
    Object.defineProperty(model, "inputs", {
      get() {
        throw Error("Inspection unavailable");
      },
    });
    try {
      const loader = { ...tf, loadLayersModel: async () => model };
      await expect(
        new Function(
          "tf",
          `return (async()=>{${block("03-model-loading.mdx", "model-loading.ts")}})();`,
        )(loader),
      ).rejects.toThrow("Inspection unavailable");
      expect(weights.every((weight) => weight.isDisposed)).toBe(true);
    } finally {
      if (weights.some((weight) => !weight.isDisposed)) model.dispose();
    }
    expect(tf.memory().numTensors).toBe(before);
  });

  it("separates missing files, a pending Promise, copied metadata, and retained ownership", () => {
    const spec = FLOW_INVESTIGATIONS["model-loading"]!;
    for (let graph = 0; graph < 2; graph++)
      for (let shards = 0; shards < 2; shards++)
        for (let paths = 0; paths < 2; paths++)
          for (let awaited = 0; awaited < 2; awaited++)
            for (let released = 0; released < 2; released++) {
              const result = spec.evaluate(
                { graph, shards, paths, awaited, released },
                "small",
              );
              const available = graph === 1 && shards === 1 && paths === 0;
              expect(result.answer).toBe(
                !available
                  ? "files unavailable"
                  : !awaited
                    ? "waiting for model"
                    : released
                      ? "inspection complete"
                      : "cleanup pending",
              );
              if (!available || !awaited)
                expect(result.graphics[2]!.values).toContain(
                  "Shapes are not available yet",
                );
            }
  });

  it("matches every prepared row and verdict against the actual feature-reading probes", () => {
    const before = tf.memory().numTensors;
    const spec = FLOW_INVESTIGATIONS["inference-pipeline"]!;
    for (const example of spec.cases) {
      const model = makeProbe(example.id === "boundary");
      try {
        for (let scale = 0; scale < 2; scale++)
          for (let order = 0; order < 2; order++)
            for (let batch = 0; batch < 2; batch++)
              for (let cleanup = 0; cleanup < 2; cleanup++)
                for (let feature = 0; feature < 3; feature++) {
                  const result = spec.evaluate(
                    {
                      ...initialInvestigationValues(spec, example.id),
                      scale,
                      order,
                      batch,
                      cleanup,
                      feature,
                    },
                    example.id,
                  );
                  const run = () =>
                    tf.tidy(
                      () =>
                        new Function(
                          "tf",
                          "model",
                          compile(result.code!) + "\nreturn score;",
                        )(tf, model) as number,
                    );
                  if (!batch) {
                    expect(run).toThrow();
                    expect(result.answer).toBe("shape error");
                  } else {
                    const p = run();
                    expect(result.answer).toBe(p > 0.5 ? "anomaly" : "noise");
                  }
                }
      } finally {
        model.dispose();
      }
    }
    expect(tf.memory().numTensors).toBe(before);
  });

  it("executes synchronous and asynchronous handlers while preserving the model and releasing failed readbacks", async () => {
    const before = tf.memory().numTensors;
    const model = makeProbe();
    const raw = { amplitude: 512, frequency: 21, phase: Math.PI / 2 };
    expect(handlers.preprocess(raw)).toEqual([0.25, 1 / 3, 0.75]);
    const live = tf.memory().numTensors;
    try {
      for (let i = 0; i < 20; i++) {
        expect(handlers.classify(model, raw)).toEqual({
          class: "noise",
          confidence: 0.75,
        });
        expect(await handlers.classifyAsync(model, raw)).toEqual({
          class: "noise",
          confidence: 0.75,
        });
        expect(tf.memory().numTensors).toBe(live);
      }
      let returned: tf.Tensor | undefined;
      const broken = {
        predict(input: tf.Tensor) {
          returned = model.predict(input) as tf.Tensor;
          returned.data = () => Promise.reject(Error("readback failed"));
          return returned;
        },
      };
      await expect(
        handlers.classifyAsync(broken as unknown as tf.LayersModel, raw),
      ).rejects.toThrow("readback failed");
      expect(returned?.isDisposed).toBe(true);
      expect(tf.memory().numTensors).toBe(live);
      expect(model.getWeights()[0]!.isDisposed).toBe(false);
    } finally {
      model.dispose();
    }
    expect(tf.memory().numTensors).toBe(before);
  });

  it("executes the independent endpoint-rate-headroom example", () => {
    const values = new Function(
      "console",
      block("04-inference-pipeline.mdx", "tensor-headroom.js") +
        "\nreturn {elapsedHours,increase,hourlyGrowth,remaining};",
    )({ log() {} });
    expect(values).toEqual({
      elapsedHours: 1,
      increase: 120,
      hourlyGrowth: 120,
      remaining: 9480,
    });
    expect(values.remaining / values.hourlyGrowth).toBe(79);
  });
});

const contentRequire = createRequire(
  new URL("packages/content/package.json", base),
);
const { parse } = createRequire(contentRequire.resolve("velite"))("yaml");
const loading = parse(source("exercises/load-model.yaml")) as {
  solutionCode: string;
  testCode: string;
};
describe("loading ownership through the shipped Worker", () => {
  it("accepts the canonical three checks and retains the existing metadata table", async () => {
    const result = await parseAndRunTests(
      loading.solutionCode,
      loading.testCode,
    );
    expect(result.results).toHaveLength(3);
    expect(result.results.filter((check) => !check.passed)).toEqual([]);
    expect(
      validateArtifacts(result.artifacts).map((artifact) => artifact.title),
    ).toEqual(["The loaded model's input contract"]);
  });
  it("rejects cleanup confined to successful inspection, retaining useful metadata from successful loads", async () => {
    const code = `async function loadAndInspect(url) {
      const model=await tf.loadLayersModel(url);
      const info={inputShape:[...model.inputs[0].shape],outputShape:[...model.outputs[0].shape],layerCount:model.layers.length};
      model.dispose(); return info;
    }`;
    const result = await parseAndRunTests(code, loading.testCode);
    const failed = result.results.filter((check) => !check.passed);
    expect(failed).toHaveLength(1);
    expect(failed[0]!.name).toContain(
      "reads the architecture off the model it loaded",
    );
    expect(failed[0]!.error).toContain(
      "including when reading its shapes throws",
    );
    expect(
      validateArtifacts(result.artifacts).map((artifact) => artifact.title),
    ).toEqual(["The loaded model's input contract"]);
  });
});
