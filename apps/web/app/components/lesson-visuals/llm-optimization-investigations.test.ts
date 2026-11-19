// @vitest-environment node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import * as tf from "@tensorflow/tfjs";
import ts from "typescript";
import { beforeAll, describe, expect, it } from "vitest";
import { FLOW_INVESTIGATIONS } from "./flow-investigations";
import { NUMERIC_INVESTIGATIONS } from "./numeric-investigations";
import { initialInvestigationValues } from "./investigation-types";
import { inspectReply, replyExample } from "./llm-report-examples";
import {
  PRUNING_KERNELS,
  PRUNING_LEVELS,
  PRUNING_RECALL,
  QUANTIZATION_CASES,
  pruningReference,
  quantizedKernel,
} from "./optimization-examples";

const contentRequire = createRequire(
  new URL("../../../../../packages/content/package.json", import.meta.url),
);
const { parse } = createRequire(contentRequire.resolve("velite"))("yaml");
function exercise(module: string, slug: string) {
  return parse(
    readFileSync(
      new URL(
        `../../../../../packages/content/content/deep-orbit/${module}/exercises/${slug}.yaml`,
        import.meta.url,
      ),
      "utf8",
    ),
  ) as { solutionCode: string; testCode: string };
}
function compile(source: string, returned: string) {
  const javascript = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.None,
    },
  }).outputText;
  return new Function("tf", `${javascript}\nreturn ${returned};`)(tf);
}
function authored(module: string, slug: string, name: string) {
  return compile(exercise(module, slug).solutionCode, name);
}
function run(
  slug: string,
  values: Record<string, number> = {},
  caseId?: string,
) {
  const spec = FLOW_INVESTIGATIONS[slug] ?? NUMERIC_INVESTIGATIONS[slug]!;
  const id = caseId ?? spec.cases[0]!.id;
  return spec.evaluate(
    { ...initialInvestigationValues(spec, id), ...values },
    id,
  );
}
beforeAll(async () => {
  await tf.setBackend("cpu");
  await tf.ready();
});

describe("LLM and optimization task references", () => {
  it.each([false, true])(
    "agrees with the actual client on every supplied reply, wrapped=%s",
    async (wrapped) => {
      const analyze = authored(
        "llm-integration",
        "llm-client",
        "analyzeSignal",
      );
      for (let reply = 0; reply <= 6; reply++) {
        const raw = replyExample(reply, wrapped);
        const inspected = inspectReply(raw);
        let calls = 0;
        const result = analyze("supplied probe", async () => {
          calls++;
          return raw;
        });
        if (inspected.accepted) expect(await result).toEqual(inspected.parsed);
        else await expect(result).rejects.toThrow();
        expect(calls).toBe(1);
        expect(
          run("llms-for-science", { reply }, wrapped ? "wrapped" : "plain")
            .answer,
        ).toBe(inspected.accepted ? "Accepted fields" : "Rejected reply");
      }
      expect(inspectReply(replyExample(1)).accepted).toBe(true);
      expect(inspectReply(replyExample(2)).accepted).toBe(false);
    },
  );

  it("checks a selected claim against the exact cited source, field, unit and operation", () => {
    const verify = authored("llm-integration", "rag-pipeline", "verifyClaims");
    const row = {
      id: "keeper",
      eventCount: 1,
      frequencyHz: 73.4,
      intervalSeconds: 73.4,
    };
    const claims = [
      {
        id: "frequency",
        kind: "reading",
        rowIds: ["keeper"],
        field: "frequencyHz",
        value: 73.4,
        unit: "Hz",
      },
      {
        id: "unit",
        kind: "reading",
        rowIds: ["keeper"],
        field: "frequencyHz",
        value: 73.4,
        unit: "events",
      },
      {
        id: "source",
        kind: "reading",
        rowIds: ["missing-id"],
        field: "frequencyHz",
        value: 73.4,
        unit: "Hz",
      },
      {
        id: "field",
        kind: "reading",
        rowIds: ["keeper"],
        field: "eventCount",
        value: 73.4,
        unit: "events",
      },
      {
        id: "duplicate",
        kind: "sum",
        rowIds: ["keeper", "keeper"],
        field: "eventCount",
        value: 2,
        unit: "events",
      },
      {
        id: "text",
        kind: "text",
        rowIds: ["keeper"],
        field: "text",
        value: "The signal is safe",
        unit: "none",
      },
    ];
    expect(verify(claims, [row])).toEqual({
      verified: ["frequency"],
      unverified: ["unit", "source", "field", "duplicate", "text"],
    });
    for (let claim = 0; claim < claims.length; claim++) {
      const result = run("rag-for-signals", { claim });
      const trace = result.graphics.find(
        (item) => item.label === "Selected structured claim",
      )!;
      expect(trace.values.join(" ")).toContain(
        claim === 0 ? "Supported:" : claim === 5 ? "Unverified:" : "Rejected:",
      );
    }
    expect(
      verify([{ ...claims[0], id: "boundary", value: 73.45 }], [row]).verified,
    ).toEqual(["boundary"]);
    expect(
      verify([{ ...claims[0], id: "outside", value: 73.451 }], [row])
        .unverified,
    ).toEqual(["outside"]);
  });

  it("uses the exact mixed-section fixture and exposes the selected omission without its body", () => {
    const assembler = authored(
      "llm-integration",
      "generate-report",
      "assembleReport",
    );
    for (const caseId of ["mixed", "empty"])
      for (const review of [0, 1, 2]) {
        const result = run("report-generation", { review, section: 1 }, caseId);
        const { sections, report } = new Function(
          `${result.code}\nreturn { sections, report };`,
        )();
        expect(report).toBe(assembler("Relay Report", sections));
        expect(result.answer).toBe(
          sections.filter(
            (section: { validated: boolean }) => section.validated,
          ).length,
        );
        if (caseId === "mixed" && review !== 1) {
          expect(report).toContain("- Hypotheses");
          expect(report).not.toContain("The pulse train is a reply.");
        }
        if (caseId === "empty") expect(report).toBe("# Relay Report\n\n");
      }
  });

  it("scales raw values into one real model row and preserves the sigmoid tie without retaining tensors", async () => {
    const stage = authored(
      "llm-integration",
      "model-pipeline",
      "classifierStage",
    );
    const before = tf.memory().numTensors;
    const model = tf.sequential({
      layers: [
        tf.layers.dense({
          units: 1,
          inputShape: [3],
          activation: "sigmoid",
          kernelInitializer: "zeros",
          biasInitializer: "zeros",
        }),
      ],
    });
    const rows: number[][] = [];
    const classify = stage({
      predict(input: tf.Tensor) {
        rows.push(Array.from(input.dataSync()));
        return model.predict(input);
      },
    });
    try {
      expect(await classify([180, 5, 0.3])).toEqual({
        class: "noise",
        confidence: 0.5,
      });
      rows[0]!.forEach((value, i) =>
        expect(value).toBeCloseTo(
          [180 / 2048, 5 / 63, (0.3 + Math.PI) / (2 * Math.PI)][i]!,
          6,
        ),
      );
      await expect(classify([180, NaN, 0.3])).rejects.toThrow();
      await expect(classify([180, 5])).rejects.toThrow();
      expect(rows).toHaveLength(1);
    } finally {
      model.dispose();
    }
    expect(tf.memory().numTensors).toBe(before);
  });

  it("includes a completed slow call and excludes warmup from the actual profiling calculation", async () => {
    const profile = authored(
      "optimization-edge",
      "profile-model",
      "profileModel",
    );
    let clock = 0,
      call = 0,
      releases = 0;
    const durations = [120, 4, 4, 4, 4, 104];
    const model = {
      countParams: () => 209,
      layers: [
        { name: "empty", countParams: () => 0 },
        { name: "weights", countParams: () => 209 },
      ],
      predict: () => ({
        data: async () => {
          clock += durations[call++]!;
        },
        dispose: () => {
          releases++;
        },
      }),
    };
    const report = await profile(
      model,
      () => ({
        dispose: () => {
          releases++;
        },
      }),
      5,
      () => clock,
    );
    expect(report).toMatchObject({
      avgInferenceMs: 24,
      parameterCount: 209,
      memorySizeMB: 0.000836,
      leakedTensors: 0,
    });
    expect(report.layerBreakdown[0]).toEqual({ name: "empty", params: 0 });
    expect(call).toBe(6);
    expect(releases).toBe(12);
    let disposed = 0;
    await expect(
      profile(
        {
          ...model,
          predict: () => ({
            data: async () => {
              throw Error("readback");
            },
            dispose: () => {
              disposed++;
            },
          }),
        },
        () => ({
          dispose: () => {
            disposed++;
          },
        }),
        1,
      ),
    ).rejects.toThrow("readback");
    expect(disposed).toBe(2);
  });

  it.each(
    Object.keys(QUANTIZATION_CASES) as Array<keyof typeof QUANTIZATION_CASES>,
  )(
    "checks the %s quantization reference through actual TFJS predictions and owned cleanup",
    async (caseId) => {
      const source = QUANTIZATION_CASES[caseId];
      const quantize = authored(
        "optimization-edge",
        "quantize-weights",
        "quantizeModel",
      );
      const before = tf.memory().numTensors;
      const model = tf.sequential({
        layers: [
          tf.layers.dense({ units: 2, inputShape: [2], activation: "softmax" }),
        ],
      });
      tf.tidy(() =>
        model.setWeights([
          tf.tensor(source.kernel, [2, 2]),
          tf.tensor1d([...source.bias]),
        ]),
      );
      const decisions = () =>
        tf.tidy(() =>
          Array.from(
            (
              model.predict(
                tf.tensor2d(source.captures.map((row) => [...row])),
              ) as tf.Tensor
            )
              .argMax(1)
              .dataSync(),
          ),
        );
      try {
        expect(decisions()).toEqual(source.before);
        const result = await quantize(
          model,
          source.captures.map((row) => [...row]),
        );
        const reference = quantizedKernel(source.kernel);
        expect(result.kernels).toEqual([
          {
            quantized: reference.stored,
            scale: reference.scale,
            min: reference.min,
            shape: [2, 2],
          },
        ]);
        expect(result.maxWeightError).toBe(Math.max(...reference.error));
        expect(decisions()).toEqual(source.after);
        expect(Array.from(model.getWeights()[1]!.dataSync())).toEqual(
          source.bias.map(Math.fround),
        );
        expect(result.predictionsChanged).toBe(
          source.before.filter((value, i) => value !== source.after[i]).length,
        );
        expect(run("quantization", { position: 3 }, caseId).answer).toBe(
          reference.stored[3],
        );
      } finally {
        model.dispose();
      }
      expect(tf.memory().numTensors).toBe(before);
    },
  );

  it("matches the frozen pruning fixture, all-class recalls, strict ties, and restores after readback failure", async () => {
    const exerciseSource = exercise("optimization-edge", "prune-weights");
    const setup = exerciseSource.testCode.slice(
      exerciseSource.testCode.indexOf("const ANOMALY"),
      exerciseSource.testCode.indexOf("const LEVELS"),
    );
    const source = compile(
      exerciseSource.solutionCode + "\n" + setup,
      "{ pruneAndScore, classifier, evalSlice, HIDDEN_KERNEL, OUTPUT_KERNEL }",
    );
    expect(PRUNING_KERNELS).toEqual(
      [source.HIDDEN_KERNEL, source.OUTPUT_KERNEL].map((rows: number[][]) =>
        rows.flat().map(Math.fround),
      ),
    );
    const before = tf.memory().numTensors;
    const model = tf.tidy(() => source.classifier()) as tf.LayersModel;
    const original = model
      .getWeights()
      .map((weight) => Array.from(weight.dataSync()));
    const { samples, labels } = source.evalSlice();
    try {
      const result = await source.pruneAndScore(model, samples, labels, [
        ...PRUNING_LEVELS,
      ]);
      expect(result.map((row: { perClass: number[] }) => row.perClass)).toEqual(
        PRUNING_RECALL,
      );
      expect(
        model.getWeights().map((weight) => Array.from(weight.dataSync())),
      ).toEqual(original);
      for (let level = 0; level < PRUNING_LEVELS.length; level++) {
        const reference = pruningReference(level);
        reference.original.forEach((value, i) =>
          expect(reference.output[i]).toBe(
            Math.abs(value) < reference.cutoff ? 0 : value,
          ),
        );
        expect(run("pruning", { level, classIndex: 4 }).answer).toBe(
          PRUNING_RECALL[level]![4]! * 40,
        );
      }
      const broken = {
        getWeights: () => model.getWeights(),
        setWeights: (weights: tf.Tensor[]) => model.setWeights(weights),
        predict: () => {
          throw Error("prediction failed");
        },
      };
      await expect(
        source.pruneAndScore(broken, samples, labels, [0.8]),
      ).rejects.toThrow("prediction failed");
      expect(
        model.getWeights().map((weight) => Array.from(weight.dataSync())),
      ).toEqual(original);
    } finally {
      model.dispose();
    }
    expect(tf.memory().numTensors).toBe(before);
  });

  it("runs the taught LRU sequence with actual model outputs, fresh caller arrays and no retained tensors", () => {
    const makeCache = authored(
      "optimization-edge",
      "inference-cache",
      "makeInferenceCache",
    );
    const before = tf.memory().numTensors;
    const cache = makeCache(
      { predict: (input: tf.Tensor) => input.mul(2) },
      2,
      2,
    );
    const requests = [1, 2, 1, 3, 1, 2].map((value) => tf.tensor2d([[value]]));
    try {
      const outputs = requests.map((input) => cache.predict(input));
      expect(outputs).toEqual([[2], [4], [2], [6], [2], [4]]);
      expect(cache.stats).toEqual({ hits: 2, misses: 4 });
      outputs[5][0] = 99;
      expect(cache.predict(requests[5])).toEqual([4]);
      requests.forEach((input) => expect(input.isDisposed).toBe(false));
    } finally {
      requests.forEach((input) => input.dispose());
    }
    expect(tf.memory().numTensors).toBe(before);
  });

  it("matches both startup orders for false, throwing and successful attempts, including readiness rejection", async () => {
    const select = authored(
      "optimization-edge",
      "gpu-backend",
      "initBestBackend",
    );
    for (const caseId of ["standard", "changed"])
      for (let success = 0; success <= 4; success++)
        for (let failures = 0; failures < 3; failures++)
          for (let ready = 0; ready < 2; ready++) {
            const names =
              caseId === "standard"
                ? ["webgpu", "webgl", "wasm", "cpu"]
                : ["wasm", "cpu", "webgl", "webgpu"];
            const calls: string[] = [];
            const runtime = {
              setBackend: async (name: string) => {
                calls.push(name);
                const index = names.indexOf(name);
                if (index === success) return true;
                if (failures === 1 || (failures === 2 && index % 2 === 1))
                  throw Error("unregistered");
                return false;
              },
              ready: async () => {
                calls.push("ready");
                if (ready === 1) throw Error("readiness");
              },
              getBackend: () => {
                calls.push("getBackend");
                return "prior-backend";
              },
            };
            const expected = run(
              "webgpu-acceleration",
              { success, failures, ready },
              caseId,
            );
            if (ready) {
              await expect(select(names, runtime)).rejects.toThrow("readiness");
              expect(expected.answer).toBe("Startup rejects");
            } else expect(await select(names, runtime)).toBe(expected.answer);
            expect(calls.filter((name) => name === "ready")).toHaveLength(1);
            expect(calls.slice(0, Math.min(4, success + 1))).toEqual(
              names.slice(0, Math.min(4, success + 1)),
            );
            expect(calls).toHaveLength(
              Math.min(4, success + 1) + 1 + (success === 4 && !ready ? 1 : 0),
            );
          }
  });
});

describe("new required JavaScript excerpts", () => {
  it.each([
    ["llm-integration/01-llms-for-science.mdx", "reply-boundary.js"],
    ["llm-integration/02-prompt-engineering.mdx", "prompt-argument-lines.js"],
    ["llm-integration/04-report-generation.mdx", "section-review-handoff.js"],
    [
      "llm-integration/05-multi-model-systems.mdx",
      "classifier-feature-handoff.js",
    ],
    ["optimization-edge/01-model-profiling.mdx", "profile-duration-mean.js"],
    ["optimization-edge/02-quantization.mdx", "selected-kernel-code.js"],
    ["optimization-edge/04-caching-strategies.mdx", "cache-key-fields.js"],
  ])(
    "executes the actual %s excerpt %s without a hidden prefix",
    (file, title) => {
      const mdx = readFileSync(
        new URL(
          `../../../../../packages/content/content/deep-orbit/${file}`,
          import.meta.url,
        ),
        "utf8",
      );
      const source = mdx
        .split(`title="${title}">`)[1]!
        .split("</CodeBlock>")[0]!
        .trim();
      const generated = new Function(
        `return (${source.slice(1, -1)});`,
      )() as string;
      const logs: unknown[][] = [];
      new Function("console", generated)({
        log: (...values: unknown[]) => logs.push(values),
      });
      expect(logs).toHaveLength(1);
      if (title === "reply-boundary.js")
        expect(logs[0]).toEqual(["anomaly", 0.95, "High amplitude"]);
      if (title === "prompt-argument-lines.js")
        expect(logs[0]).toEqual([
          "Known reference frequencies: 5, 12, 23, 47 Hz\nCurrent reading:\namplitude: 1024 counts\nfrequency: 73.4 Hz\nphase: 0.23 rad",
        ]);
      if (title === "section-review-handoff.js")
        expect(logs[0]).toEqual([
          {
            heading: "Hypotheses",
            content: "The pulse train is a reply.",
            validated: false,
          },
        ]);
      if (title === "classifier-feature-handoff.js")
        expect(logs[0]).toEqual([
          [180 / 2048, 5 / 63, (0.3 + Math.PI) / (2 * Math.PI)],
        ]);
      if (title === "profile-duration-mean.js")
        expect(logs[0]).toEqual([{ measuredCalls: 5, meanMs: 24 }]);
      if (title === "selected-kernel-code.js")
        expect(logs[0]![0]).toMatchObject({
          original: Math.fround(0.05),
          code: 51,
          decoded: 0,
          error: Math.fround(0.05),
        });
      if (title === "cache-key-fields.js")
        expect(logs[0]).toEqual([
          { rounded: [0.5, 0.5], key: '["float32",[1,2],[0.5,0.5]]' },
        ]);
    },
  );
});
