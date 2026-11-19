// @vitest-environment node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { beforeAll, describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs";
import ts from "typescript";
import { FLOW_INVESTIGATIONS } from "./flow-investigations";
import { initialInvestigationValues } from "./investigation-types";

const contentRequire = createRequire(
  new URL("../../../../../packages/content/package.json", import.meta.url),
);
const { parse } = createRequire(contentRequire.resolve("velite"))("yaml");
const rootRequire = createRequire(
  new URL("../../../../../package.json", import.meta.url),
);
const { TextClassificationPipeline, Tensor: PipelineTensor } = rootRequire(
  "@huggingface/transformers",
) as typeof import("@huggingface/transformers");
const { Tensor: OnnxTensor } = rootRequire(
  "onnxruntime-web",
) as typeof import("onnxruntime-web");
const runtimeSpec = FLOW_INVESTIGATIONS["onnx-runtime-web"]!;
const reportsSpec = FLOW_INVESTIGATIONS["transformers-js"]!;
const content = (path: string) =>
  readFileSync(
    new URL(
      `../../../../../packages/content/content/deep-orbit/browser-runtimes/${path}`,
      import.meta.url,
    ),
    "utf8",
  );
function block(path: string, title: string) {
  const match = [
    ...content(path).matchAll(
      /<CodeBlock[^>]*title="([^"]+)"[^>]*>\s*\{`([\s\S]*?)`}\s*<\/CodeBlock>/g,
    ),
  ].find((row) => row[1] === title);
  if (!match) throw Error(`Missing taught block ${title}`);
  return ts.transpileModule(match[2]!, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.None,
    },
  }).outputText;
}
const exercise = parse(content("exercises/load-pretrained-pipeline.yaml")) as {
  solutionCode: string;
};
const classifyReports = new Function(
  `${exercise.solutionCode}\nreturn classifyReports;`,
)() as (
  reports: string[],
  factory: (
    task: string,
  ) => Promise<
    (reports: string[]) => Promise<{ label: string; score: number }[]>
  >,
) => Promise<{ text: string; label: string; score: number }[]>;
const suppliedReports = [
  "coupling nominal",
  "coolant loop warning",
  "watch handover clean",
];
const suppliedPredictions = [
  { label: "POS", score: 0.5 },
  { label: "NEG", score: 0.99 },
  { label: "POS", score: 0.7 },
];

beforeAll(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
});

describe("runtime comparison and report integration teaching", () => {
  it("keeps score agreement separate from input identity and timer scope", () => {
    for (const output of [0, 1, 2]) {
      for (const [load, read, intervals] of [
        [0, 0, [2, 3]],
        [0, 1, [10, 15]],
        [1, 0, [2, 43]],
        [1, 1, [10, 55]],
      ] as const) {
        const result = runtimeSpec.evaluate(
          {
            ...initialInvestigationValues(runtimeSpec),
            output,
            load,
            read,
            input: 1,
          },
          "nearby",
        );
        const calculation = new Function(
          `${result.code}\nreturn { difference, outputsAgree };`,
        )();
        expect(calculation.outputsAgree).toBe(output !== 2);
        expect(result.answer).toBe(String(calculation.outputsAgree));
        expect(
          result.graphics.find(
            (graphic) => graphic.label === "Illustrative timer intervals (ms)",
          )!.values,
        ).toEqual(intervals);
        expect(result.graphics.at(-1)!.values).toContain(
          "Different inputs prevent a parity conclusion",
        );
      }
    }
  });

  it("uses identical float32 values for the two declared input shapes", () => {
    const before = tf.memory().numTensors;
    const values = [0.5, 0.3, 0.7];
    const tfjs = tf.tensor2d([values], [1, 3], "float32");
    const onnx = new OnnxTensor("float32", new Float32Array(values), [1, 3]);
    try {
      expect(tfjs.shape).toEqual(onnx.dims);
      expect(Array.from(tfjs.dataSync())).toEqual(
        Array.from(onnx.data as Float32Array),
      );
      expect(tfjs.dtype).toBe(onnx.type);
    } finally {
      tfjs.dispose();
      onnx.dispose();
    }
    expect(tf.memory().numTensors).toBe(before);
  });

  it("executes the taught TFJS timer through asynchronous readback and releases only owned tensors", async () => {
    const before = tf.memory().numTensors;
    let clock = 0,
      callerDisposals = 0;
    let observedInput: tf.Tensor | undefined,
      observedOutput: tf.Tensor | undefined;
    const model = {
      predict(input: tf.Tensor) {
        clock += 2;
        observedInput = input;
        const output = tf.tidy(() => input.sum().sigmoid().reshape([1, 1]));
        observedOutput = output;
        const data = output.data.bind(output);
        output.data = async () => {
          await Promise.resolve();
          clock += 8;
          return data();
        };
        return output;
      },
      dispose() {
        callerDisposals++;
      },
    };
    const run = new Function(
      "tf",
      "model",
      "performance",
      "console",
      `return (async () => {${block("05-onnx-runtime-web.mdx", "completed-tfjs-call.ts")}\nreturn {tfjsMs,tfjsScore};})();`,
    );
    const result = await run(tf, model, { now: () => clock }, { log() {} });
    expect(result.tfjsMs).toBe(10);
    expect(result.tfjsScore).toBeCloseTo(1 / (1 + Math.exp(-1.5)), 6);
    expect(observedInput!.isDisposed).toBe(true);
    expect(observedOutput!.isDisposed).toBe(true);
    expect(callerDisposals).toBe(0);
    await expect(
      run(
        tf,
        {
          predict(input: tf.Tensor) {
            observedInput = input;
            throw Error("controlled prediction failure");
          },
        },
        { now: () => clock },
        { log() {} },
      ),
    ).rejects.toThrow("controlled prediction failure");
    expect(observedInput!.isDisposed).toBe(true);
    expect(tf.memory().numTensors).toBe(before);
  });

  it("matches the authored report function and exposes a prediction-first pairing error", async () => {
    let factoryCalls = 0,
      batchCalls = 0;
    const factory = async (task: string) => {
      factoryCalls++;
      expect(task).toBe("sentiment-analysis");
      return async (batch: string[]) => {
        batchCalls++;
        expect(batch).toEqual(suppliedReports);
        return structuredClone(suppliedPredictions);
      };
    };
    const expected = await classifyReports(suppliedReports, factory);
    expect([factoryCalls, batchCalls]).toEqual([1, 1]);
    const main = new Function(
      `${block("06-transformers-js.mdx", "report-pairing.js")}\nreturn queue;`,
    )();
    expect(main).toEqual(expected);
    for (let report = 0; report < 3; report++) {
      const good = reportsSpec.evaluate(
        { ...initialInvestigationValues(reportsSpec), report },
        "reports",
      );
      const wrong = reportsSpec.evaluate(
        { ...initialInvestigationValues(reportsSpec), report, pair: 1 },
        "reports",
      );
      expect(new Function(`${good.code}\nreturn queue;`)()).toEqual(expected);
      expect(new Function(`${wrong.code}\nreturn queue;`)()).not.toEqual(
        expected,
      );
      expect(good.graphics[1]!.values.at(-1)).toBe(
        "Original pairing preserved",
      );
      expect(wrong.graphics[1]!.values.at(-1)).toBe(
        "Prediction attached to the wrong report",
      );
    }
    const batch = new Function(
      "reports",
      "pipelineFactory",
      `return (async () => {${block("06-transformers-js.mdx", "batch-report-call.ts")}\nreturn predictions;})();`,
    );
    expect(await batch(suppliedReports, factory)).toEqual(suppliedPredictions);
    expect([factoryCalls, batchCalls]).toEqual([2, 2]);
    expect(await classifyReports([], factory)).toEqual([]);
    expect([factoryCalls, batchCalls]).toEqual([2, 2]);
    expect(
      reportsSpec.evaluate(
        initialInvestigationValues(reportsSpec, "empty"),
        "empty",
      ).answer,
    ).toBe(0);
    expect(
      reportsSpec.evaluate(
        { ...initialInvestigationValues(reportsSpec, "empty"), load: 2 },
        "empty",
      ).answer,
    ).toBe(1);
    expect(
      reportsSpec.evaluate(
        { ...initialInvestigationValues(reportsSpec), load: 1 },
        "reports",
      ).answer,
    ).toBe(3);
  });

  it("verifies installed pipeline batch ordering and disposal with controlled logits, without pretrained downloads", async () => {
    let tokenizations = 0,
      modelCalls = 0,
      disposals = 0;
    const logits = new PipelineTensor(
      "float32",
      new Float32Array([3, -3, -2, 2, 0.2, 0.8]),
      [3, 2],
    );
    const model = Object.assign(
      async () => {
        modelCalls++;
        return { logits };
      },
      {
        config: { id2label: { 0: "NEGATIVE", 1: "POSITIVE" } },
        dispose: async () => {
          disposals++;
        },
      },
    );
    const classifier = new TextClassificationPipeline({
      task: "text-classification",
      model,
      tokenizer: (texts: string[], options: unknown) => {
        tokenizations++;
        expect(texts).toEqual(suppliedReports);
        expect(options).toEqual({ padding: true, truncation: true });
        return {};
      },
    } as unknown as ConstructorParameters<
      typeof TextClassificationPipeline
    >[0]);
    try {
      const output = await classifier(suppliedReports);
      expect(output.map((row) => row.label)).toEqual([
        "NEGATIVE",
        "POSITIVE",
        "POSITIVE",
      ]);
      for (const [index, expected] of [
        1 / (1 + Math.exp(-6)),
        1 / (1 + Math.exp(-4)),
        1 / (1 + Math.exp(-0.6)),
      ].entries())
        expect(output[index]!.score).toBeCloseTo(expected, 6);
      expect([tokenizations, modelCalls]).toEqual([1, 1]);
    } finally {
      await classifier.dispose();
      logits.dispose();
    }
    expect(disposals).toBe(1);
  });
});
