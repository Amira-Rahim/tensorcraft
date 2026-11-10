// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs";
import { parseAndRunTests } from "../../../../../packages/ui/src/mdx/exercise-runner-node";
import { stripTypeScript } from "../../../../../packages/ui/src/mdx/strip-typescript";
import { FLOW_INVESTIGATIONS } from "./flow-investigations";
import { initialInvestigationValues } from "./investigation-types";

const lessonRoot = resolve(
  import.meta.dirname,
  "../../../../../packages/content/content/deep-orbit/browser-runtimes",
);
beforeAll(async () => {
  expect(tf.version.tfjs).toBe("4.22.0");
  await tf.setBackend("cpu");
  await tf.ready();
});
function run(
  slug: string,
  changes: Record<string, number> = {},
  caseId?: string,
) {
  const spec = FLOW_INVESTIGATIONS[slug]!;
  const selected = caseId ?? spec.cases[0]!.id;
  return spec.evaluate(
    { ...initialInvestigationValues(spec, selected), ...changes },
    selected,
  );
}
function exercise(slug: string) {
  const source = readFileSync(
    resolve(lessonRoot, "exercises", `${slug}.yaml`),
    "utf8",
  );
  const field = (name: string, next: string) =>
    source
      .split(`${name}: |\n`)[1]!
      .split(`\n${next}:`)[0]!
      .replace(/^ {2}/gm, "");
  return {
    starter: field("starterCode", "solutionCode"),
    solution: field("solutionCode", "testCode"),
    tests: field("testCode", "estimatedMinutes"),
  };
}
function clean(code: string) {
  return stripTypeScript(code).replace(/^import .*?;\s*$/gm, "");
}
function authoredBlock(lesson: string, title: string) {
  const source = readFileSync(resolve(lessonRoot, lesson), "utf8");
  const match = [
    ...source.matchAll(
      /<CodeBlock language="(?:typescript|javascript)" title="([^"]+)">\s*\{`([\s\S]*?)`}\s*<\/CodeBlock>/g,
    ),
  ].find(([, name]) => name === title);
  if (!match) throw Error(`Missing authored block ${title}`);
  return clean(new Function("return `" + match[2] + "`;")());
}
async function execute(lesson: string, title: string) {
  const before = tf.memory().numTensors;
  const logs: unknown[][] = [];
  await new Function(
    "tf",
    "console",
    `return (async () => {\n${authoredBlock(lesson, title)}\n})();`,
  )(tf, { log: (...args: unknown[]) => logs.push(args) });
  expect(tf.memory().numTensors).toBe(before);
  return logs;
}

describe("the deployment policy requirement trace", () => {
  it("matches the authored policy across both hard requirements and both exact boundaries", () => {
    const recommend = new Function(
      `${clean(exercise("browser-ml-tradeoffs").solution)}\nreturn recommendDeployment;`,
    )() as (input: {
      modelSizeMB: number;
      latencyBudgetMs: number;
      dataSensitive: boolean;
      needsOffline: boolean;
    }) => string;
    for (const modelSizeMB of [0, 49, 50, 51, 100])
      for (const latencyBudgetMs of [0, 20, 49, 50, 500, 1000])
        for (const dataSensitive of [0, 1])
          for (const needsOffline of [0, 1]) {
            const input = {
              modelSizeMB,
              latencyBudgetMs,
              dataSensitive: dataSensitive === 1,
              needsOffline: needsOffline === 1,
            };
            const result = run("why-the-browser", {
              modelSizeMB,
              latencyBudgetMs,
              dataSensitive,
              needsOffline,
            });
            expect(result.answer).toBe(recommend(input));
            const generated = new Function(`${result.code}\nreturn checked;`)();
            expect(generated).toEqual({
              localRequired: input.dataSensitive || input.needsOffline,
              exceedsDownloadBudget: modelSizeMB > 50,
              belowLatencyPreference: latencyBudgetMs < 50,
            });
            expect(result.graphics[1]!.highlight).toEqual([
              modelSizeMB > 50 ? 1 : dataSensitive || needsOffline ? 0 : 2,
            ]);
            if (modelSizeMB > 50 && (dataSensitive || needsOffline))
              expect(result.answer).toBe("reconsider");
          }
  });

  it("keeps the original case IDs and explains the decisive policy instead of claiming a measured speed", () => {
    expect(
      FLOW_INVESTIGATIONS["why-the-browser"]!.cases.map((item) => item.id),
    ).toEqual(["one", "batch"]);
    expect(run("why-the-browser").answer).toBe("client");
    expect(run("why-the-browser", { latencyBudgetMs: 50 }).answer).toBe(
      "server",
    );
    const conflict = run("why-the-browser", {}, "batch");
    expect(conflict.answer).toBe("reconsider");
    expect(conflict.explanation).toContain("server would violate");
    expect(conflict.graphics[1]!.highlight).toEqual([1]);
    const sizeFirst = run("why-the-browser", {
      modelSizeMB: 100,
      latencyBudgetMs: 20,
    });
    expect(sizeFirst.answer).toBe("server");
    expect(sizeFirst.explanation).toContain("before the latency preference");
    expect(FLOW_INVESTIGATIONS["why-the-browser"]!.boundary).toContain(
      "measures no",
    );
  });

  it("executes the visible condition probes and uses decimal MB separately from MiB", async () => {
    const conditions = await execute(
      "01-why-the-browser.mdx",
      "deployment-policy-probes.js",
    );
    expect(conditions.map((row) => row[0])).toEqual([
      {
        localRequired: false,
        exceedsDownloadBudget: false,
        belowLatencyPreference: true,
      },
      {
        localRequired: false,
        exceedsDownloadBudget: false,
        belowLatencyPreference: false,
      },
      {
        localRequired: true,
        exceedsDownloadBudget: true,
        belowLatencyPreference: false,
      },
    ]);
    const bytes = await execute(
      "01-why-the-browser.mdx",
      "model-download-budget.js",
    );
    expect(bytes[0]![0]).toBe(40);
    expect(bytes[1]![0]).toBeCloseTo(38.14697265625, 10);
  });
});

const fixtures = {
  available: {
    tag: "probe-101",
    good: "good-202",
    bad: "bad-303",
    unknown: "never-404",
    version: "4.22.0-probe",
  },
  failed: {
    tag: "probe-707",
    good: "good-808",
    bad: "bad-909",
    unknown: "never-606",
    version: "4.317.0-probe",
  },
};
function controlledRuntime(caseId: keyof typeof fixtures, scenario: number) {
  const values = fixtures[caseId];
  const events: string[] = [];
  let initialized = false;
  let selected = values.tag;
  const runtime = {
    setBackend: async (name: string) => {
      events.push(`request:${name}`);
      if (name === values.good) {
        selected = name;
        return true;
      }
      if (name === values.bad) {
        selected = name;
        return false;
      }
      throw new Error("Unregistered preference");
    },
    ready: async () => {
      events.push("ready:start");
      await Promise.resolve();
      if (scenario === 4) throw Error("No backend can start");
      if (selected === values.bad) selected = values.tag;
      initialized = true;
      events.push("ready:resolved");
    },
    getBackend: () => {
      events.push("read:backend");
      return initialized ? selected : null;
    },
    version: {
      get tfjs() {
        events.push("read:version");
        return values.version;
      },
    },
  };
  return { values, events, runtime };
}

describe("the controlled startup sequence", () => {
  it("matches the authored initialization function for accepted, refused, omitted, unknown, and failed startup", async () => {
    for (const caseId of ["available", "failed"] as const)
      for (let scenario = 0; scenario <= 4; scenario++) {
        const { values, events, runtime } = controlledRuntime(caseId, scenario);
        const init = new Function(
          "tf",
          `${clean(exercise("tfjs-setup").solution)}\nreturn initTF;`,
        )(runtime) as (
          preference?: string,
        ) => Promise<{ backend: string; version: string }>;
        const preferred =
          scenario === 0
            ? undefined
            : scenario === 1
              ? values.good
              : scenario === 3
                ? values.unknown
                : values.bad;
        const pending = init(preferred);
        expect(events.some((event) => event.startsWith("read:"))).toBe(false);
        if (scenario === 4) {
          await expect(pending).rejects.toThrow("No backend can start");
          expect(events.some((event) => event.startsWith("read:"))).toBe(false);
          expect(
            run("tensorflow-js-setup", { scenario, stage: 3 }, caseId).answer,
          ).toBe("initialization error");
        } else {
          const actual = await pending;
          const result = run(
            "tensorflow-js-setup",
            { scenario, stage: 3 },
            caseId,
          );
          expect(result.answer).toBe(actual.backend);
          expect(result.graphics[2]!.values).toEqual([
            actual.backend,
            actual.version,
          ]);
          const generated = new Function(`${result.code}\nreturn report;`)();
          expect(generated).toEqual(actual);
          const readyPoint = run(
            "tensorflow-js-setup",
            { scenario, stage: 2 },
            caseId,
          );
          expect(readyPoint.answer).toBe(actual.backend);
          expect(readyPoint.graphics[2]!.values).toEqual([
            actual.backend,
            actual.version,
          ]);
          expect(readyPoint.graphics[1]!.highlight).toEqual([2]);
          expect(
            new Function(`${readyPoint.code}\nreturn report;`)(),
          ).toBeNull();
          expect(readyPoint.graphics[3]!.values[0]).toContain(
            "has not returned yet",
          );
          expect(events.indexOf("ready:resolved")).toBeLessThan(
            events.indexOf("read:backend"),
          );
          expect(events.indexOf("ready:resolved")).toBeLessThan(
            events.indexOf("read:version"),
          );
        }
        expect(events.filter((event) => event.startsWith("request:"))).toEqual(
          preferred ? [`request:${preferred}`] : [],
        );
        for (const stage of [0, 1]) {
          const beforeReady = run(
            "tensorflow-js-setup",
            { scenario, stage },
            caseId,
          );
          expect(beforeReady.answer).toBe("not ready");
          expect(beforeReady.graphics[2]!.values).toEqual([
            "Not read before readiness",
            "Not read",
          ]);
          expect(
            new Function(`${beforeReady.code}\nreturn report;`)(),
          ).toBeNull();
          expect(beforeReady.graphics[1]!.highlight).toEqual([stage]);
        }
      }
  });

  it("separates the simulated report from the real installed CPU backend and version", async () => {
    expect(
      FLOW_INVESTIGATIONS["tensorflow-js-setup"]!.cases.map((item) => item.id),
    ).toEqual(["available", "failed"]);
    expect(FLOW_INVESTIGATIONS["tensorflow-js-setup"]!.boundary).toContain(
      "not results from your browser",
    );
    const logs = await execute("02-tensorflow-js-setup.mdx", "setup.ts");
    expect(logs).toEqual([
      [{ preferenceStatus: "accepted", backend: "cpu", version: "4.22.0" }],
    ]);
    expect(run("tensorflow-js-setup").answer).toBe("good-202");
    expect(run("tensorflow-js-setup", {}, "failed").answer).toBe("probe-707");
  });

  it("verifies the pinned false-request and unknown-name contracts with the real TensorFlow.js engine", async () => {
    const original = tf.getBackend();
    const refused = "clarity-refused-test";
    tf.registerBackend(
      refused,
      () => Promise.reject(Error("Controlled factory refusal")),
      100,
    );
    try {
      expect(await tf.setBackend(refused)).toBe(false);
      expect(tf.getBackend()).toBe(refused);
      await tf.ready();
      expect(tf.getBackend()).toBe("cpu");
      await expect(tf.setBackend("clarity-unregistered-test")).rejects.toThrow(
        "not found in registry",
      );
      await tf.ready();
      expect(tf.getBackend()).toBe("cpu");
      expect(tf.version.tfjs).toBe("4.22.0");
    } finally {
      tf.removeBackend(refused);
      await tf.setBackend(original);
      await tf.ready();
    }
  });
});

describe("the unchanged authored browser policy and startup graders", () => {
  it.each(["browser-ml-tradeoffs", "tfjs-setup"])(
    "accepts its solution and rejects its starter for %s",
    async (slug) => {
      const { solution, starter, tests } = exercise(slug);
      const good = await parseAndRunTests(solution, tests);
      expect(good.errored).not.toBe(true);
      expect(good.results).toHaveLength(slug === "tfjs-setup" ? 6 : 5);
      expect(good.results.filter((check) => !check.passed)).toEqual([]);
      const empty = await parseAndRunTests(starter, tests);
      expect(
        empty.results.filter((check) => !check.passed).length,
      ).toBeGreaterThan(0);
    },
  );

  it.each([
    [
      "server before local conflict",
      "return mustStayLocal ? 'reconsider' : 'server';",
      "return 'server';",
      "keeps privacy and offline",
    ],
    [
      "exclusive download limit",
      "modelSizeMB > 50",
      "modelSizeMB >= 50",
      "prefers the client within budget",
    ],
    [
      "inclusive latency preference",
      "latencyBudgetMs < 50",
      "latencyBudgetMs <= 50",
      "inclusive size budget",
    ],
    [
      "both local requirements",
      "dataSensitive || useCase.needsOffline",
      "dataSensitive && useCase.needsOffline",
      "keeps privacy and offline",
    ],
  ])(
    "rejects %s in the policy",
    async (_name, original, replacement, failing) => {
      const { solution, tests } = exercise("browser-ml-tradeoffs");
      const wrong = solution.replace(original, replacement);
      expect(wrong).not.toBe(solution);
      const result = await parseAndRunTests(wrong, tests);
      expect(result.errored).not.toBe(true);
      expect(
        result.results.find((check) => check.name.includes(failing))?.passed,
      ).toBe(false);
    },
  );

  it.each([
    [
      "unawaited readiness",
      "await tf.ready();",
      // Handle the rejected fixture promise so the Worker can report the
      // readiness-order failures instead of emitting an unhandled error.
      "tf.ready().catch(() => {});",
      "only after ready() resolves",
    ],
    [
      "requested name as actual",
      "backend: tf.getBackend()",
      "backend: preferred || tf.getBackend()",
      "starts another available",
    ],
    [
      "hardcoded version",
      "version: tf.version.tfjs",
      "version: '4.22.0'",
      "only after ready() resolves",
    ],
    [
      "swallowed initialization error",
      "await tf.ready();",
      "try { await tf.ready(); } catch {}",
      "propagates failure",
    ],
    [
      "unconditional preference request",
      "if (preferred)",
      "if (true)",
      "only after ready() resolves",
    ],
  ])("rejects %s in startup", async (_name, original, replacement, failing) => {
    const { solution, tests } = exercise("tfjs-setup");
    const wrong = solution.replace(original, replacement);
    expect(wrong).not.toBe(solution);
    const result = await parseAndRunTests(wrong, tests);
    expect(result.errored).not.toBe(true);
    expect(
      result.results.find((check) => check.name.includes(failing))?.passed,
    ).toBe(false);
  });
});
