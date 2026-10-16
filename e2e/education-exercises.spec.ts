import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";
import {
  parseAndRunTestsWith,
  WORKER_BODY_STRING,
  type WorkerReply,
} from "../packages/ui/src/mdx/exercise-runner";

// Each training fixture uses the learner's 30-second execution budget.
// Run this file sequentially so competing training jobs do not consume it.
test.describe.configure({ mode: "default" });

const exercises = JSON.parse(
  readFileSync("packages/content/.velite/exercises.json", "utf8"),
) as Array<{
  slug: string;
  starterCode: string;
  solutionCode: string;
  testCode: string;
}>;

// Use the shipped runner and a real browser Worker without changing paid
// content access. This covers execution, not the paid lesson's navigation UI.
async function browserRun(
  page: Page,
  code: string,
  testCode: string,
  id: number,
) {
  const name = `exerciseReply${id}`;
  const pending: WorkerReply[] = [];
  let receiver: ((reply: WorkerReply) => void) | undefined;
  await page.exposeFunction(name, (reply: WorkerReply) => {
    if (receiver) receiver(reply);
    else pending.push(reply);
  });
  return parseAndRunTestsWith(
    async () => {
      await page.evaluate(
        ({ source, name, id }) => {
          const host = globalThis as unknown as {
            exerciseWorkers: Record<number, { worker: Worker; url: string }>;
            [key: string]: unknown;
          };
          host.exerciseWorkers ??= {};
          const url = URL.createObjectURL(
            new Blob([source], { type: "application/javascript" }),
          );
          const worker = new Worker(url);
          const reply = host[name] as (message: unknown) => void;
          worker.onmessage = (event) => reply(event.data);
          worker.onerror = (event) =>
            reply({ ok: false, error: event.message, logs: [] });
          host.exerciseWorkers[id] = { worker, url };
        },
        { source: WORKER_BODY_STRING, name, id },
      );
      return {
        send: (message: unknown) => {
          void page.evaluate(
            ({ id, message }) => {
              const host = globalThis as unknown as {
                exerciseWorkers: Record<number, { worker: Worker }>;
              };
              host.exerciseWorkers[id].worker.postMessage(message);
            },
            { id, message },
          );
        },
        onReply: (callback: (reply: WorkerReply) => void) => {
          receiver = callback;
          pending.splice(0).forEach(callback);
        },
        terminate: () =>
          page.evaluate((id) => {
            const host = globalThis as unknown as {
              exerciseWorkers: Record<number, { worker: Worker; url: string }>;
            };
            const entry = host.exerciseWorkers[id];
            entry.worker.terminate();
            URL.revokeObjectURL(entry.url);
            delete host.exerciseWorkers[id];
          }, id),
      };
    },
    code,
    testCode,
    30_000,
  );
}

for (const slug of [
  "batch-data",
  "reshape-tensor",
  "normalize-data",
  "rag-pipeline",
  "find-threshold",
  "weighted-ensemble",
  "incident-tensor-leak",
  "ci-cd-gate",
  "simple-attention",
  "temporal-attention",
  "quantize-weights",
  "fft-features",
  "llm-client",
  "classify-anomaly",
  "model-pipeline",
  "mse-loss",
  "browser-ml-tradeoffs",
  "incident-baseline-drift",
  "incident-missed-anomaly",
  "incident-false-alarm-storm",
  "simple-network",
  "prompt-template",
  "training-loop-exercise",
  "deep-scan-eval",
  "build-autoencoder",
  "predict-next",
  "forecast-signal",
  "profile-model",
  "ensemble-detector",
  "detect-anomaly",
  "prune-weights",
  "inference-cache",
  "model-monitor",
  "verify-deployment",
  "compute-fft",
  "apply-window",
]) {
  test(`${slug}: browser accepts the solution and rejects the starter and misconception`, async ({
    page,
  }) => {
    test.setTimeout(180_000);
    const exercise = exercises.find((item) => item.slug === slug)!;
    expect(exercise).toBeDefined();
    await page.goto("/worlds/deep-orbit/foundations/introduction-to-tensors");
    const solution = await browserRun(
      page,
      exercise.solutionCode,
      exercise.testCode,
      1,
    );
    expect(solution.errored, JSON.stringify(solution)).not.toBe(true);
    expect(solution.results.length).toBeGreaterThan(0);
    expect(solution.results.filter((item) => !item.passed)).toEqual([]);

    const starter = await browserRun(
      page,
      exercise.starterCode,
      exercise.testCode,
      2,
    );
    expect(starter.results.length).toBeGreaterThan(0);
    expect(starter.results.every((item) => item.passed)).toBe(false);

    const cheatPath = ["batch-data", "normalize-data"].includes(slug)
      ? `${slug}.2.js`
      : `${slug}.js`;
    const cheat = await browserRun(
      page,
      readFileSync(`scripts/exercise-cheats/${cheatPath}`, "utf8"),
      exercise.testCode,
      3,
    );
    expect(cheat.errored, JSON.stringify(cheat)).not.toBe(true);
    expect(cheat.results.some((item) => item.passed)).toBe(true);
    expect(cheat.results.some((item) => !item.passed)).toBe(true);
  });
}
