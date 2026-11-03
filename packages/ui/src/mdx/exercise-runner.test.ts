// @vitest-environment node
import { Worker as NodeWorker } from "node:worker_threads";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  parseAndRunTestsWith,
  WORKER_BODY_STRING,
  type SpawnWorker,
  type WorkerHandle,
  type WorkerReply,
} from "./exercise-runner";
import { parseAndRunTests } from "./exercise-runner-node";

/* ------------------------------------------------------------------ */
/* Browser branch of the worker, executed under Node                    */
/* ------------------------------------------------------------------ */

// Runs the shipped worker source down its BROWSER branch inside a Node
// worker thread. The template decides it is in a browser when importScripts
// exists, so the preamble supplies importScripts, self.location and the
// postMessage/addEventListener pair a Worker global scope provides, and its
// importScripts installs the given tf stand-in in place of the 1.4 MB
// bundle. The stand-in carries only the backend API the load path touches;
// applyShims guards every other tf member it reads.
interface BrowserLikeRun {
  spawn: SpawnWorker;
  /** Every message the worker posted, in arrival order, probes included. */
  raw: string[];
}

function browserLike(
  tfSource: string,
  options: { vendoredThrows?: boolean } = {},
): BrowserLikeRun {
  const raw: string[] = [];
  const preamble = `
    var __parentPort = require('node:worker_threads').parentPort;
    globalThis.self = { location: { origin: 'http://localhost:3000' } };
    globalThis.postMessage = function(m) { __parentPort.postMessage(m); };
    globalThis.addEventListener = function(type, cb) {
      __parentPort.on('message', function(data) { cb({ data: data }); });
    };
    globalThis.__importedUrls = [];
    globalThis.importScripts = function(url) {
      globalThis.__importedUrls.push(url);
      if (${options.vendoredThrows ? "true" : "false"} && url.indexOf('/vendor/') !== -1) {
        throw new Error('vendored copy unavailable');
      }
      globalThis.tf = (${tfSource});
    };
  `;
  const spawn: SpawnWorker = () => {
    const w = new NodeWorker(preamble + WORKER_BODY_STRING, { eval: true });
    return Promise.resolve<WorkerHandle>({
      send: (m) => w.postMessage(m),
      onReply: (cb) => {
        w.on("message", (data: WorkerReply | { probe: string }) => {
          if ("probe" in data) {
            raw.push("probe:" + data.probe);
            return;
          }
          if ("ready" in data) raw.push("ready");
          else if ("fit" in data) raw.push("fit:" + data.fit);
          else raw.push(data.ok ? "ok" : "error");
          cb(data);
        });
      },
      terminate: async () => {
        await w.terminate();
      },
    });
  };
  return { spawn, raw };
}

// A stand-in for the tfjs global with only the backend API. `mode` scripts
// setBackend: 'ok' resolves true after a tick and switches the backend,
// 'false' resolves false, 'reject' rejects, 'missing' omits setBackend
// altogether. The default backend is 'webgl' because that is what tfjs
// auto-selects inside a Chromium worker. Every step is asynchronous so a
// template that forgot to wait would be caught, not masked.
function fakeTf(mode: "ok" | "false" | "reject" | "missing"): string {
  return `(function() {
    var mode = ${JSON.stringify(mode)};
    var state = { backend: 'webgl', log: [] };
    var tf = {
      __state: state,
      getBackend: function() { return state.backend; },
      ready: function() {
        state.log.push('ready');
        return new Promise(function(resolve) {
          setTimeout(function() {
            state.log.push('ready:done');
            postMessage({ probe: 'ready-done' });
            resolve();
          }, 20);
        });
      },
    };
    if (mode !== 'missing') {
      tf.setBackend = function(name) {
        state.log.push('setBackend:' + name);
        return new Promise(function(resolve, reject) {
          setTimeout(function() {
            if (mode === 'reject') return reject(new Error('no such backend'));
            if (mode === 'false') return resolve(false);
            state.backend = name;
            resolve(true);
          }, 20);
        });
      };
    }
    return tf;
  })()`;
}

const VENDORED = "http://localhost:3000/vendor/tfjs-4.22.0.min.js";
const CDN =
  "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js";

describe("browser worker backend pin", () => {
  it(
    "pins the cpu backend after the vendored bundle loads, and signals ready only once tf.ready has resolved",
    { timeout: 15_000 },
    async () => {
      const run = browserLike(fakeTf("ok"));
      const outcome = await parseAndRunTestsWith(
        run.spawn,
        "",
        `it('runs on the cpu backend', () => {
          expect(tf.getBackend()).toBe('cpu');
          expect(tf.__state.log).toEqual(['setBackend:cpu', 'ready', 'ready:done']);
          expect(globalThis.__importedUrls).toEqual(${JSON.stringify([VENDORED])});
        });`,
        5_000,
      );
      expect(outcome.errored).not.toBe(true);
      expect(outcome.results.filter((r) => !r.passed)).toEqual([]);
      // The ready signal starts the learner's execution budget, so it must
      // follow the backend switch, never race it.
      expect(run.raw.slice(0, 2)).toEqual(["probe:ready-done", "ready"]);
    },
  );

  it(
    "pins the cpu backend on the CDN fallback path as well",
    { timeout: 15_000 },
    async () => {
      const run = browserLike(fakeTf("ok"), { vendoredThrows: true });
      const outcome = await parseAndRunTestsWith(
        run.spawn,
        "",
        `it('fell back to the CDN and still runs on cpu', () => {
          expect(globalThis.__importedUrls).toEqual(${JSON.stringify([VENDORED, CDN])});
          expect(tf.getBackend()).toBe('cpu');
        });`,
        5_000,
      );
      expect(outcome.errored).not.toBe(true);
      expect(outcome.results.filter((r) => !r.passed)).toEqual([]);
      expect(run.raw.slice(0, 2)).toEqual(["probe:ready-done", "ready"]);
    },
  );

  for (const [mode, verb] of [
    ["reject", "rejects"],
    ["false", "returns false"],
  ] as const) {
    it(
      `leaves the default backend in place and still runs when setBackend ${verb}`,
      { timeout: 15_000 },
      async () => {
        const run = browserLike(fakeTf(mode));
        const outcome = await parseAndRunTestsWith(
          run.spawn,
          "",
          `it('runs on the default backend', () => {
            expect(tf.__state.log[0]).toBe('setBackend:cpu');
            expect(tf.getBackend()).toBe('webgl');
          });`,
          5_000,
        );
        expect(outcome.errored).not.toBe(true);
        expect(outcome.results.filter((r) => !r.passed)).toEqual([]);
        expect(run.raw).toContain("ready");
      },
    );
  }

  it(
    "runs when the runtime exposes no setBackend at all",
    { timeout: 15_000 },
    async () => {
      const run = browserLike(fakeTf("missing"));
      const outcome = await parseAndRunTestsWith(
        run.spawn,
        "",
        `it('runs', () => { expect(tf.getBackend()).toBe('webgl'); });`,
        5_000,
      );
      expect(outcome.errored).not.toBe(true);
      expect(outcome.results.filter((r) => !r.passed)).toEqual([]);
    },
  );

  it("pins in the browser branch of the source and leaves the Node branch alone", () => {
    const src = WORKER_BODY_STRING;
    const pin = src.indexOf("setBackend('cpu')");
    expect(pin).toBeGreaterThan(-1);
    expect(pin).toBeLessThan(src.indexOf("post(Object.assign({ ready: true }"));
    // The Node branch is the graded reference (exercise-runner-node.ts) and
    // already runs on cpu, so it stays untouched.
    const nodeStart = src.indexOf(
      "globalThis.tf = require('@tensorflow/tfjs')",
    );
    expect(nodeStart).toBeGreaterThan(-1);
    const nodeBranch = src.slice(nodeStart, src.indexOf("} else {", nodeStart));
    expect(nodeBranch).toContain("tfReady = Promise.resolve();");
    expect(nodeBranch).not.toMatch(/setBackend|pinCpuBackend/);
  });
});

/* ------------------------------------------------------------------ */
/* Execution budget wording (host side, scripted worker)               */
/* ------------------------------------------------------------------ */

// A worker stand-in that plays back a scripted list of replies on send and
// then never answers, so the execution budget expires.
function scripted(replies: WorkerReply[]): SpawnWorker {
  return () => {
    let deliver: ((reply: WorkerReply) => void) | undefined;
    return Promise.resolve<WorkerHandle>({
      send: () => replies.forEach((reply) => deliver?.(reply)),
      onReply: (cb) => {
        deliver = cb;
      },
      terminate: () => {},
    });
  };
}

describe("execution budget message", () => {
  const budget = 30_000;
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const expire = async (replies: WorkerReply[]) => {
    const pending = parseAndRunTestsWith(scripted(replies), "", "", budget);
    await vi.advanceTimersByTimeAsync(budget + 1);
    return pending;
  };

  it("names an unfinished training loop when a recorded fit is still running at the deadline", async () => {
    const outcome = await expire([{ ready: true }, { fit: true }]);
    expect(outcome).toEqual({
      results: [
        {
          name: "Code execution",
          passed: false,
          error:
            "Training did not finish within the 30-second budget. Use fewer epochs or a larger batch size, then run again.",
        },
      ],
      logs: [],
      errored: true,
    });
  });

  it("keeps the plain timeout when no fit was recorded", async () => {
    const outcome = await expire([{ ready: true }]);
    expect(outcome.errored).toBe(true);
    expect(outcome.results).toEqual([
      {
        name: "Code execution",
        passed: false,
        error: "Timed out after 30 seconds",
      },
    ]);
  });

  it("keeps the plain timeout when every recorded fit finished before the deadline", async () => {
    const outcome = await expire([
      { ready: true },
      { fit: true },
      { fit: false },
    ]);
    expect(outcome.errored).toBe(true);
    expect(outcome.results[0].error).toBe("Timed out after 30 seconds");
  });
});

/* ------------------------------------------------------------------ */
/* Execution budget through the real worker and real tfjs              */
/* ------------------------------------------------------------------ */

describe("execution budget through the Node worker", () => {
  const model = `
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 1, inputShape: [1] }));
    model.compile({ optimizer: 'sgd', loss: 'meanSquaredError' });
    const x = tf.tensor2d([[1], [2]]);
    const y = tf.tensor2d([[0], [1]]);
  `;
  const never = "it('never graded', () => { expect(true).toBe(true); });";

  it(
    "reports a fit that outlives the budget as training that did not finish",
    { timeout: 60_000 },
    async () => {
      const outcome = await parseAndRunTests(
        model + "await model.fit(x, y, { epochs: 1000000, verbose: 0 });",
        never,
        2_000,
      );
      expect(outcome.errored).toBe(true);
      expect(outcome.results).toEqual([
        {
          name: "Code execution",
          passed: false,
          error:
            "Training did not finish within the 2-second budget. Use fewer epochs or a larger batch size, then run again.",
        },
      ]);
    },
  );

  it(
    "reports a hang after training finished as a plain timeout",
    { timeout: 60_000 },
    async () => {
      const outcome = await parseAndRunTests(
        model +
          "await model.fit(x, y, { epochs: 1, verbose: 0 });\nwhile (true) {}",
        never,
        2_000,
      );
      expect(outcome.errored).toBe(true);
      expect(outcome.results).toEqual([
        {
          name: "Code execution",
          passed: false,
          error: "Timed out after 2 seconds",
        },
      ]);
    },
  );
});
