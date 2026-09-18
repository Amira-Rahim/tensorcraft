import * as tf from "@tensorflow/tfjs";
import { setWasmPaths, setThreadsCount } from "@tensorflow/tfjs-backend-wasm";
import * as ort from "onnxruntime-web/wasm";
import { pipeline, env } from "@huggingface/transformers";
import "@tensorflow/tfjs-backend-webgpu";

setWasmPaths("/tf-wasm/");
setThreadsCount(1);
ort.env.wasm.wasmPaths = "/ort-wasm/";
ort.env.wasm.numThreads = 1;
const requireTrue = (ok, message) => {
  if (!ok) throw Error(message);
};
const modelUrl = "/models/deep-scan/model.json";
const cacheKey = "indexeddb://runtime-lab-v1";
let model;

async function score(network, row) {
  const input = tf.tensor2d([row]);
  let output;
  try {
    output = network.predict(input);
    return (await output.data())[0];
  } finally {
    output?.dispose();
    input.dispose();
  }
}

// Cache persistence is optional. A failed download is not optional.
export async function loadWithCache(key, url, onCacheError = () => {}) {
  try {
    return await tf.loadLayersModel(key);
  } catch {
    /* miss or damaged entry */
  }
  const loaded = await tf.loadLayersModel(url);
  try {
    await loaded.save(key);
  } catch (error) {
    onCacheError(error);
  }
  return loaded;
}

async function measure(fn, warmups = 20, iterations = 200) {
  for (let i = 0; i < warmups; i++) await fn();
  const samples = [];
  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    samples.push(performance.now() - start);
  }
  const sorted = [...samples].sort((a, b) => a - b);
  // Tiny calls can round to zero on browser timers. Grouped totals improve
  // resolution for mean throughput; they are not individual-call percentiles.
  const groupedTotalsMs = [];
  for (let group = 0; group < 10; group++) {
    const start = performance.now();
    for (let i = 0; i < 100; i++) await fn();
    groupedTotalsMs.push(performance.now() - start);
  }
  return {
    warmups,
    iterations,
    samplesMs: samples,
    medianMs: sorted[Math.floor(sorted.length / 2)],
    p95Ms: sorted[Math.ceil(sorted.length * 0.95) - 1],
    groupedCalls: 100,
    groupedTotalsMs,
    amortizedMeanMs: groupedTotalsMs.reduce((a, b) => a + b, 0) / 1000,
  };
}

// Fixed probes cover normalized inputs, boundaries and values outside training
// support. They measure conversion error, not accuracy on labeled field data.
const probes = [
  [0.42, 0.66, 0.31],
  [0, 0, 0],
  [1, 1, 1],
  [-1, 0.5, 2],
];
for (let i = 0; i < 257; i++)
  probes.push([i / 256, ((i * 73) % 257) / 256, ((i * 131) % 257) / 256]);

window.lab = {
  async init(backend = "wasm") {
    requireTrue(
      await tf.setBackend(backend),
      `Backend unavailable: ${backend}`,
    );
    await tf.ready();
    return {
      backend: tf.getBackend(),
      userAgent: navigator.userAgent,
      hardwareConcurrency: navigator.hardwareConcurrency,
      crossOriginIsolated,
      tfjs: tf.version.tfjs,
      ort: ort.env.versions,
    };
  },
  async compare() {
    model = await tf.loadLayersModel(modelUrl);
    const session = await ort.InferenceSession.create(
      "/models/deep-scan.onnx",
      { executionProviders: ["wasm"] },
    );
    const baseTensors = tf.memory().numTensors;
    const runOrt = async (row) => {
      const input = new ort.Tensor("float32", Float32Array.from(row), [1, 3]);
      const outputs = await session.run({ input });
      try {
        return outputs.output.data[0];
      } finally {
        input.dispose();
        Object.values(outputs).forEach((t) => t.dispose());
      }
    };
    try {
      let maxError = 0;
      for (const row of probes)
        maxError = Math.max(
          maxError,
          Math.abs((await score(model, row)) - (await runOrt(row))),
        );
      requireTrue(maxError < 1e-5, `Runtime parity error ${maxError}`);
      const tfjs = await measure(() => score(model, probes[0]));
      const onnx = await measure(() => runOrt(probes[0]));
      requireTrue(
        tf.memory().numTensors === baseTensors,
        "Inference leaked TFJS tensors",
      );
      return {
        probes: probes.length,
        maxError,
        tfjs,
        onnx,
        tensorCountStable: true,
      };
    } finally {
      await session.release();
      model.dispose();
      model = null;
    }
  },
  async backends() {
    const results = {};
    let reference;
    for (const backend of ["cpu", "wasm", "webgl", "webgpu"]) {
      let started = false;
      try {
        started = await tf.setBackend(backend);
      } catch {
        /* unavailable */
      }
      if (!started) {
        results[backend] = { status: "unavailable" };
        continue;
      }
      await tf.ready();
      const network = await tf.loadLayersModel(modelUrl);
      try {
        const prediction = await score(network, probes[0]);
        requireTrue(
          Number.isFinite(prediction),
          `${backend} prediction was not finite`,
        );
        const values = [];
        for (const row of probes) values.push(await score(network, row));
        reference ??= values;
        const maxError = Math.max(
          ...values.map((value, i) => Math.abs(value - reference[i])),
        );
        requireTrue(
          maxError < 1e-4,
          `${backend} backend parity error: ${maxError}`,
        );
        const timing = await measure(() => score(network, probes[0]));
        results[backend] = {
          status: "passed",
          actualBackend: tf.getBackend(),
          score: prediction,
          probes: probes.length,
          maxError,
          timing,
        };
      } finally {
        network.dispose();
      }
    }
    await tf.setBackend("wasm");
    await tf.ready();
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl");
    const debug = gl?.getExtension("WEBGL_debug_renderer_info");
    const renderer = debug
      ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)
      : "not exposed";
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return {
      results,
      renderer,
      scope:
        "Isolated Playwright browser; software GPU renderers are not physical-device performance evidence.",
    };
  },
  async cacheSeed() {
    await tf.io.removeModel(cacheKey).catch(() => {});
    const loaded = await loadWithCache(cacheKey, modelUrl);
    try {
      return {
        score: await score(loaded, probes[0]),
        models: Object.keys(await tf.io.listModels()),
      };
    } finally {
      loaded.dispose();
    }
  },
  async cacheOffline() {
    const loaded = await loadWithCache(cacheKey, modelUrl);
    try {
      return await score(loaded, probes[0]);
    } finally {
      loaded.dispose();
    }
  },
  async cacheMissingOffline() {
    try {
      const loaded = await loadWithCache(
        "indexeddb://runtime-lab-absent",
        modelUrl,
      );
      loaded.dispose();
      return false;
    } catch {
      return true;
    }
  },
  async inferenceCache() {
    const network = await tf.loadLayersModel(modelUrl);
    const cache = new Map();
    const distinct = [
      ...new Map(probes.map((row) => [JSON.stringify(row), row])).values(),
    ];
    const rows = distinct.flatMap((row) => [row, row]);
    let hits = 0,
      misses = 0;
    const initial = tf.memory().numTensors;
    try {
      const baseline = [];
      const startBaseline = performance.now();
      for (const row of rows) baseline.push(await score(network, row));
      const baselineMs = performance.now() - startBaseline;
      const startCache = performance.now();
      for (let i = 0; i < rows.length; i++) {
        const key = JSON.stringify(rows[i]); // exact values, fixed shape/dtype
        let value;
        if (cache.has(key)) {
          hits++;
          value = cache.get(key);
          cache.delete(key);
          cache.set(key, value);
        } else {
          misses++;
          value = await score(network, rows[i]);
          cache.set(key, value);
          if (cache.size > 64) cache.delete(cache.keys().next().value);
        }
        requireTrue(value === baseline[i], "Exact cache changed a prediction");
      }
      const cachedMs = performance.now() - startCache;
      requireTrue(
        hits === distinct.length && misses === distinct.length,
        "Unexpected repeat-trace hit count",
      );
      requireTrue(tf.memory().numTensors === initial, "Cache leaked tensors");
      // A constructed threshold model makes the risk of rounding observable.
      const boundary = tf.sequential();
      boundary.add(
        tf.layers.dense({ units: 1, activation: "sigmoid", inputShape: [1] }),
      );
      tf.tidy(() =>
        boundary.setWeights([tf.tensor2d([[10]]), tf.tensor1d([-5])]),
      );
      try {
        const left = 0.499,
          right = 0.501;
        const a = await score(boundary, [left]),
          b = await score(boundary, [right]);
        requireTrue(
          Math.round(left * 100) === Math.round(right * 100) &&
            a > 0.5 !== b > 0.5,
          "Rounding counterexample did not cross a threshold",
        );
        return {
          calls: rows.length,
          hits,
          misses,
          hitRate: hits / rows.length,
          baselineMs,
          cachedMs,
          maxEntries: 64,
          exactParity: true,
          roundingCounterexample: {
            inputs: [left, right],
            scores: [a, b],
            roundedKey: 0.5,
            threshold: 0.5,
          },
        };
      } finally {
        boundary.dispose();
      }
    } finally {
      network.dispose();
    }
  },
  async cacheWriteFailure() {
    // Inject a quota error at the real IndexedDB boundary, without replacing
    // loadLayersModel or the cache loader under test.
    const realPut = IDBObjectStore.prototype.put;
    let notified = false;
    IDBObjectStore.prototype.put = function () {
      throw new DOMException("Test storage quota", "QuotaExceededError");
    };
    let network;
    try {
      network = await loadWithCache(
        "indexeddb://runtime-lab-quota",
        modelUrl,
        () => {
          notified = true;
        },
      );
      const value = await score(network, probes[0]);
      requireTrue(
        notified && Number.isFinite(value),
        "Failed cache write lost the loaded model",
      );
      return { notified, score: value };
    } finally {
      IDBObjectStore.prototype.put = realPut;
      network?.dispose();
    }
  },
  async quantized() {
    const original = await tf.loadLayersModel(modelUrl);
    const results = {};
    try {
      const baseline = await Promise.all(
        probes.map((row) => score(original, row)),
      );
      for (const name of ["q8", "q16"]) {
        const network = await tf.loadLayersModel(`/models/${name}/model.json`);
        try {
          let maxScoreError = 0,
            changedAtThreshold = 0;
          for (let i = 0; i < probes.length; i++) {
            const value = await score(network, probes[i]);
            maxScoreError = Math.max(
              maxScoreError,
              Math.abs(value - baseline[i]),
            );
            if (value > 0.5 !== baseline[i] > 0.5) changedAtThreshold++;
          }
          results[name] = {
            probes: probes.length,
            maxScoreError,
            changedAtThreshold,
            params: network.countParams(),
          };
          requireTrue(
            maxScoreError < 0.03,
            `${name} conversion changed scores beyond this fixture's tolerance`,
          );
        } finally {
          network.dispose();
        }
      }
      return results;
    } finally {
      original.dispose();
    }
  },
  async missingShard() {
    try {
      const loaded = await tf.loadLayersModel(modelUrl);
      loaded.dispose();
      return false;
    } catch {
      return true;
    }
  },
  async pretrained(dtype = "q8") {
    env.allowRemoteModels = false;
    env.allowLocalModels = true;
    env.localModelPath = "/hf/";
    env.useBrowserCache = true;
    env.backends.onnx.wasm.wasmPaths = "/hf-wasm/";
    env.backends.onnx.wasm.numThreads = 1;
    const start = performance.now();
    const classify = await pipeline("sentiment-analysis", "sentiment", {
      dtype,
      device: "wasm",
    });
    const loadedMs = performance.now() - start;
    try {
      const texts = [
        "Starboard array cleared diagnostics ahead of schedule.",
        "Sensor array is functioning within tolerance.",
        "Catastrophic failure on the port-side coupling.",
        "Signal classification: anomalous.",
      ];
      const predictions = await classify(texts);
      requireTrue(
        predictions.length === texts.length &&
          predictions.every((p) => Number.isFinite(p.score)),
        "Pretrained pipeline result contract",
      );
      return {
        dtype,
        loadedMs,
        predictions: texts.map((text, i) => ({ text, ...predictions[i] })),
        caches: await caches.keys(),
      };
    } finally {
      await classify.dispose();
    }
  },
};
document.querySelector("#status").textContent = "Ready";
