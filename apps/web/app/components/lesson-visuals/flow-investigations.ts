import type {
  InvestigationControl,
  InvestigationGraphic,
  LessonInvestigationSpec,
} from "./investigation-types";

const choice = (
  id: string,
  label: string,
  options: string[],
  initial = 0,
): InvestigationControl => ({
  id,
  label,
  kind: "choice",
  initial,
  options: options.map((label, value) => ({ value, label })),
});

const range = (
  id: string,
  label: string,
  initial: number,
  min: number,
  max: number,
  step = 1,
): InvestigationControl => ({
  id,
  label,
  kind: "range",
  initial,
  min,
  max,
  step,
});

const pipeline = (
  label: string,
  values: string[],
  highlight: number[] = [],
): InvestigationGraphic => ({ kind: "pipeline", label, values, highlight });

const bars = (
  label: string,
  labels: string[],
  values: number[],
): InvestigationGraphic => ({ kind: "bars", label, labels, values });

const cells = (
  label: string,
  values: Array<number | string>,
  columns = values.length,
): InvestigationGraphic => ({ kind: "cells", label, values, columns });

const round = (value: number) => Math.round(value * 100) / 100;

/** Small, inspectable calculations. None of these activities run a model or service. */
export const FLOW_INVESTIGATIONS: Record<string, LessonInvestigationSpec> = {
  "why-the-browser": {
    title: "Can this reading stay on the device?",
    brief:
      "Track the readings and model files separately. Change the connection and choose where predictions run.",
    boundary:
      "This simulates where readings and model files go. It makes no network requests and runs no model.",
    controls: [
      choice("online", "Connection", ["Offline", "Online"], 1),
      choice(
        "assets",
        "Model and runtime files",
        ["Not stored locally", "Stored locally"],
        1,
      ),
      choice("location", "Prediction location", [
        "On this device",
        "On a server",
      ]),
    ],
    cases: [
      {
        id: "one",
        label: "One reading",
        description: "One sensor record contains 12 values.",
      },
      {
        id: "batch",
        label: "A batch",
        description:
          "The next capture contains 8 records, each with 12 values.",
      },
    ],
    prediction: {
      prompt: "How many sensor values leave the device?",
      unit: "values",
    },
    evaluate: (v, caseId) => {
      const count = caseId === "batch" ? 96 : 12;
      const server = v.location === 1;
      const ready = server ? v.online === 1 : v.assets === 1 || v.online === 1;
      const sent = server && ready ? count : 0;
      return {
        graphics: [
          cells(
            "Current setup",
            [
              `Input: ${count} sensor values`,
              server ? "Prediction: server" : "Prediction: device",
              v.online === 1 ? "Connection: online" : "Connection: offline",
              v.assets === 1 ? "Local files: stored" : "Local files: missing",
            ],
            2,
          ),
          bars(
            "Sensor values by location",
            ["On device", "Sent to server"],
            [count, sent],
          ),
          pipeline(
            "Reading path",
            [
              "Sensor",
              `${count} values on device`,
              server ? "Server" : "Local runtime",
              ready ? "Result available" : "Blocked",
            ],
            ready ? [3] : [],
          ),
        ],
        answer: sent,
        answerLabel: "Sensor values sent",
        explanation: !ready
          ? server
            ? "Server prediction needs a connection. This offline request stops before sending any values."
            : "Local prediction needs the model and runtime files. It cannot start if the device lacks those files and has no connection to download them."
          : server
            ? "The server receives the whole input record. Moving prediction off the device changes the data path."
            : "This input stays on the device. Downloading model files does not require uploading these readings. Check whether other parts of the app send data.",
        code: `const canPredict = ${ready};\nconst sensorValuesSent = ${sent};`,
      };
    },
  },
  "tensorflow-js-setup": {
    title: "Wait for the backend",
    brief:
      "Compare when initialization finishes with when the first operation starts.",
    boundary:
      "The times are example values. This checks event ordering without importing TensorFlow.js or measuring a device.",
    controls: [
      range("delay", "Backend initialization time (ms)", 80, 20, 200, 20),
      range("start", "Requested operation time (ms)", 40, 0, 240, 20),
      choice(
        "await",
        "When to start",
        ["Start immediately", "Wait until ready"],
        1,
      ),
    ],
    cases: [
      {
        id: "available",
        label: "Backend initializes",
        description:
          "The chosen backend becomes ready after its initialization time.",
      },
      {
        id: "failed",
        label: "Backend fails",
        description:
          "The selected backend fails to start. The fallback needs another 40 ms to become ready.",
      },
    ],
    prediction: {
      prompt: "What is the earliest safe start time for this operation?",
      unit: "ms",
    },
    evaluate: (v, caseId) => {
      const readyAt = v.delay! + (caseId === "failed" ? 40 : 0);
      const safeAt = Math.max(v.start!, readyAt);
      const actual = v.await === 1 ? safeAt : v.start!;
      const safe = actual >= readyAt;
      return {
        graphics: [
          cells(
            "Initialization inputs",
            [
              `Selected backend: ${v.delay} ms`,
              caseId === "failed"
                ? "Selected backend: fails"
                : "Selected backend: succeeds",
              caseId === "failed" ? "Fallback: 40 ms" : "Fallback: not needed",
              `Requested start: ${v.start} ms`,
            ],
            2,
          ),
          bars(
            "Event times (ms)",
            ["Backend ready", "Requested start", "Actual start"],
            [readyAt, v.start!, actual],
          ),
          pipeline(
            "Runtime sequence",
            [
              "Import API",
              caseId === "failed"
                ? "Selected backend fails"
                : "Initialize backend",
              caseId === "failed" ? "Initialize fallback" : "Backend ready",
              safe ? "Operation can start" : "Operation starts too early",
            ],
            safe ? [3] : [],
          ),
        ],
        answer: safeAt,
        answerLabel: "Earliest safe start",
        explanation: `${caseId === "failed" ? "After initialization fails, the fallback must become ready too. " : ""}The backend becomes ready at ${readyAt} ms. ${safe ? "This operation starts after that point." : `Starting at ${actual} ms is too early.`} Waiting for readiness puts these steps in order. A real app must also handle startup failures.`,
        code: "try {\n  const initialized = await tf.setBackend(preferredBackend);\n  if (!initialized) throw new Error('Preferred backend failed');\n  await tf.ready();\n} catch {\n  const initialized = await tf.setBackend(fallbackBackend);\n  if (!initialized) throw new Error('Fallback backend failed');\n  await tf.ready();\n}",
      };
    },
  },
  "model-loading": {
    title: "Missing model files",
    brief:
      "Count the files a model needs. A successful model.json request is only one part of the load.",
    boundary:
      "These example asset checks simulate loading. They download no files and load no model.",
    controls: [
      choice("graph", "model.json request", ["Fails", "Succeeds"], 1),
      range("shards", "Weight files available", 2, 0, 4),
      choice("paths", "Paths to weight files", [
        "Resolve correctly",
        "Resolve to the wrong folder",
      ]),
    ],
    cases: [
      {
        id: "small",
        label: "Two-shard model",
        description:
          "This model needs model.json and two binary weight files, called shards.",
      },
      {
        id: "large",
        label: "Four-shard model",
        description:
          "This model needs model.json and four binary weight files, called shards.",
        values: { shards: 3 },
      },
    ],
    prediction: {
      prompt: "How many required files are still unavailable?",
      unit: "files",
    },
    evaluate: (v, caseId) => {
      const required = caseId === "large" ? 4 : 2;
      const loaded = v.paths === 0 ? Math.min(v.shards!, required) : 0;
      const missing = 1 - v.graph! + required - loaded;
      return {
        graphics: [
          cells(
            "Model file setup",
            [
              `Manifest: ${required} shards`,
              v.graph === 1 ? "JSON request: succeeds" : "JSON request: fails",
              `Hosted shards: ${v.shards}`,
              v.paths === 0 ? "Paths: correct folder" : "Paths: wrong folder",
            ],
            2,
          ),
          bars(
            "Required and available files",
            ["Required", "Available", "Missing"],
            [required + 1, loaded + v.graph!, missing],
          ),
          cells(
            "Required model files",
            [
              v.graph === 1 ? "JSON ready" : "JSON missing",
              ...Array.from({ length: required }, (_, i) =>
                i < loaded ? `Shard ${i + 1} ready` : `Shard ${i + 1} missing`,
              ),
            ],
            3,
          ),
        ],
        answer: missing,
        answerLabel: "Required files unavailable",
        explanation: `${loaded} of ${required} shards are available at the resolved URLs. ${v.paths === 1 ? "The wrong folder prevents every shard request from finding its file. " : ""}${missing === 0 ? "All required files are available. You still need to load the model and check its required input format." : "The model cannot complete loading until model.json and every referenced shard are available."}`,
        code: `const requiredShards = ${required};\nconst availableShards = ${loaded};\nconst assetsComplete = ${missing === 0};`,
      };
    },
  },
  "inference-pipeline": {
    title: "The model’s input contract",
    brief:
      "Check the values, feature order and batch axis before sending the input to the model.",
    boundary:
      "This scales example readings using fixed training values. It checks the required input format without running a model.",
    controls: [
      choice(
        "scale",
        "Preprocessing",
        ["Raw readings", "Divide by training scales"],
        1,
      ),
      choice("order", "Feature order", [
        "Temperature, pressure, vibration",
        "Vibration, pressure, temperature",
      ]),
      choice(
        "batch",
        "Batch dimension",
        ["Missing: [3]", "Present: [1, 3]"],
        1,
      ),
    ],
    cases: [
      {
        id: "normal",
        label: "Routine reading",
        description:
          "Temperature 20, pressure 100, vibration 4. The saved training scales are 40, 200 and 8.",
      },
      {
        id: "changed",
        label: "Uneven reading",
        description:
          "Temperature 30, pressure 80, vibration 2. The same saved training scales must apply.",
      },
    ],
    prediction: {
      prompt: "How many input requirements does this setup meet?",
      unit: "of 3 checks",
    },
    evaluate: (v, caseId) => {
      const raw = caseId === "changed" ? [30, 80, 2] : [20, 100, 4];
      const scaled =
        v.scale === 1 ? raw.map((x, i) => x / [40, 200, 8][i]!) : raw;
      const prepared = v.order === 0 ? scaled : [...scaled].reverse();
      const passed = v.scale! + (v.order === 0 ? 1 : 0) + v.batch!;
      return {
        graphics: [
          cells("Raw input: temperature, pressure, vibration", raw),
          cells(
            `Prepared input, shape ${v.batch === 1 ? "[1, 3]" : "[3]"}`,
            prepared.map(round),
          ),
          pipeline(
            "Input contract",
            [
              v.scale === 1 ? "Scaling matches" : "Scaling differs",
              v.order === 0 ? "Order matches" : "Order differs",
              v.batch === 1 ? "Shape matches" : "Shape differs",
            ],
            [
              v.scale === 1 ? 0 : -1,
              v.order === 0 ? 1 : -1,
              v.batch === 1 ? 2 : -1,
            ].filter((x) => x >= 0),
          ),
        ],
        answer: passed,
        answerLabel: "Input checks passed",
        explanation: `The model expects scaled temperature, pressure and vibration in that order, with shape [1, 3]. ${passed === 3 ? "This input matches all three requirements." : "Valid numbers can still use the wrong scale, feature order or shape."} The scales stay fixed because they come from training.`,
        code: `const input = tf.tensor${v.batch === 1 ? "2d([" : "1d("}[${prepared.map(round).join(", ")}]${v.batch === 1 ? "]" : ""});`,
      };
    },
  },
  "onnx-runtime-web": {
    title: "Graph and input compatibility",
    brief:
      "Check whether the example provider supports the model’s operations. Then check the input name and shape.",
    boundary:
      "We invented these operator support lists for the exercise. They do not describe current ONNX Runtime providers.",
    controls: [
      choice("provider", "Example provider", [
        "Provider A: Add, MatMul",
        "Provider B: Add, MatMul, Conv",
      ]),
      choice("name", "Input name", ["readings", "input"]),
      choice("width", "Input shape", ["[1, 3]", "[1, 1, 4]"]),
    ],
    cases: [
      {
        id: "dense",
        label: "Dense graph",
        description:
          "Uses Add and MatMul. Expects float32 readings with shape [1, 3].",
      },
      {
        id: "conv",
        label: "Convolution graph",
        description:
          "Uses Add and 1D Conv. Expects float32 readings with shape [1, 1, 4]: batch, channel, spatial axis.",
        values: { width: 1 },
      },
    ],
    prediction: {
      prompt: "How many compatibility checks fail?",
      unit: "checks",
    },
    evaluate: (v, caseId) => {
      const conv = caseId === "conv";
      const supported = !conv || v.provider === 1;
      const nameMatches = v.name === 0;
      const shapeMatches = v.width === (conv ? 1 : 0);
      const failures =
        Number(!supported) + Number(!nameMatches) + Number(!shapeMatches);
      return {
        graphics: [
          cells(
            "Model requirements",
            [
              conv ? "Add + 1D Conv" : "Add + MatMul",
              "readings",
              conv ? "[1, 1, 4]" : "[1, 3]",
              "float32",
            ],
            2,
          ),
          pipeline(
            "Compatibility checks",
            [
              supported ? "Operators supported" : "Conv unsupported",
              nameMatches ? "Name matches" : "Name mismatch",
              shapeMatches ? "Shape matches" : "Shape mismatch",
            ],
            [
              supported ? 0 : -1,
              nameMatches ? 1 : -1,
              shapeMatches ? 2 : -1,
            ].filter((x) => x >= 0),
          ),
        ],
        answer: failures,
        answerLabel: "Compatibility checks failed",
        explanation: `Graph operators, input names and shapes are independent requirements. ${failures === 0 ? "This example passes all three. A real exported model still needs a known-input comparison against its source model." : "A compatible file format cannot fix an unsupported operator or a mismatched input."}`,
      };
    },
  },
  "transformers-js": {
    title: "Pipeline requirements",
    brief:
      "Check whether the model fits the task, its license allows this use, and its files fit the download budget.",
    boundary:
      "We invented these model profiles for the activity. It downloads and runs no pretrained model.",
    controls: [
      choice("model", "Example model", [
        "Text classifier: 30 MB",
        "Text generator: 150 MB",
        "Sensor forecaster: 20 MB",
      ]),
      range("budget", "Download budget (MB)", 60, 20, 200, 10),
      choice(
        "permission",
        "License review",
        ["No approval for this use", "Approval for this use"],
        1,
      ),
    ],
    cases: [
      {
        id: "classify",
        label: "Classify a crew note",
        description: "The requested output is a text category.",
      },
      {
        id: "generate",
        label: "Draft a crew note",
        description: "The requested output is new text.",
        values: { model: 1 },
      },
    ],
    prediction: {
      prompt: "How many selection checks pass?",
      unit: "of 3 checks",
    },
    evaluate: (v, caseId) => {
      const size = [30, 150, 20][v.model!]!;
      const taskMatch = v.model === (caseId === "generate" ? 1 : 0);
      const withinBudget = size <= v.budget!;
      const pass = Number(taskMatch) + Number(withinBudget) + v.permission!;
      return {
        graphics: [
          bars(
            "Asset size and budget (MB)",
            ["Model assets", "Budget"],
            [size, v.budget!],
          ),
          pipeline(
            "Selection checks",
            [
              taskMatch ? "Task matches" : "Wrong task",
              withinBudget ? "Fits download budget" : "Exceeds budget",
              v.permission === 1 ? "Use approved" : "License unresolved",
            ],
            [
              taskMatch ? 0 : -1,
              withinBudget ? 1 : -1,
              v.permission === 1 ? 2 : -1,
            ].filter((x) => x >= 0),
          ),
        ],
        answer: pass,
        answerLabel: "Selection checks passed",
        explanation: `${pass === 3 ? "This model meets the example’s selection requirements." : "Resolve every failed requirement before loading the pipeline."} Passing these checks does not establish output quality. Test the model and its preprocessing on inputs like the ones your app will receive.`,
      };
    },
  },
  "model-profiling": {
    title: "Measure the complete prediction",
    brief:
      "Choose whether to include startup and waiting for prediction results, then compare repeated calls.",
    boundary:
      "These example times and tensor counts show what your timer includes. They are not measurements from your device.",
    controls: [
      choice("cold", "Include cold initialization", [
        "Exclude it",
        "Include it",
      ]),
      choice(
        "read",
        "Timing stops",
        ["After queuing the work", "After reading the result"],
        1,
      ),
      range("runs", "Prediction calls", 5, 1, 10),
    ],
    cases: [
      {
        id: "clean",
        label: "Disposed temporaries",
        description:
          "Each call takes 4 ms to queue work and another 16 ms to finish and read the result. Startup takes 80 ms. The simulation releases temporary tensors.",
      },
      {
        id: "leak",
        label: "Retained output",
        description:
          "Same example timings. The simulation retains one output tensor after every call.",
      },
    ],
    prediction: {
      prompt: "What average time will this timer report?",
      unit: "ms per call",
      tolerance: 0.05,
    },
    evaluate: (v, caseId) => {
      const total = v.runs! * (v.read === 1 ? 20 : 4) + (v.cold === 1 ? 80 : 0);
      const average = round(total / v.runs!);
      const retained = caseId === "leak" ? v.runs! : 0;
      return {
        graphics: [
          bars(
            "Example cost per event (ms)",
            ["Dispatch", "Completion/read", "Cold initialization"],
            [4, 16, 80],
          ),
          bars(
            "Counted time (ms)",
            [
              "Time spent queuing",
              "Time spent finishing and reading",
              "Cold initialization",
            ],
            [
              4 * v.runs!,
              v.read === 1 ? 16 * v.runs! : 0,
              v.cold === 1 ? 80 : 0,
            ],
          ),
          {
            kind: "line",
            label: "Extra retained tensors after each call",
            labels: Array.from({ length: v.runs! + 1 }, (_, i) => String(i)),
            values: Array.from({ length: v.runs! + 1 }, (_, i) =>
              caseId === "leak" ? i : 0,
            ),
          },
        ],
        answer: average,
        answerLabel: "Average measured time",
        explanation: `${total} counted milliseconds divided by ${v.runs} calls gives ${average} ms per call. ${v.read === 0 ? "Stopping after queuing work leaves out the time to finish and read the result. " : ""}${v.cold === 1 ? "Report cold start separately when comparing steady-state calls. " : ""}${retained} extra tensors remain. Rising retained counts need investigation even when timing looks stable.`,
      };
    },
  },
  "caching-strategies": {
    title: "Valid and stale cache hits",
    brief:
      "Replay a short list of requests. Change the cache key and capacity to see which saved results the cache reuses or removes, and when it returns an outdated result.",
    boundary:
      "This simulates a cache that removes the least recently used entry when full. It makes no predictions and saves nothing between visits.",
    controls: [
      choice("key", "Cache key", ["Input only", "Input + model + scaler"], 1),
      range("capacity", "Maximum cached entries", 2, 1, 4),
      choice("version", "Third request uses", ["Same scaler", "New scaler"], 1),
    ],
    cases: [
      {
        id: "repeat",
        label: "Repeated readings",
        description:
          "Requests use inputs A, A, A, B, A. Only request 3 may use a different scaler.",
      },
      {
        id: "rotate",
        label: "Rotating readings",
        description:
          "Requests use inputs A, B, A, C, A. Only request 3 may use a different scaler.",
      },
    ],
    prediction: {
      prompt: "How many requests return a valid cached result?",
      unit: "valid hits",
    },
    evaluate: (v, caseId) => {
      const inputs =
        caseId === "rotate"
          ? ["A", "B", "A", "C", "A"]
          : ["A", "A", "A", "B", "A"];
      const cache = new Map<string, string>();
      let hits = 0;
      let stale = 0;
      let misses = 0;
      const trace = inputs.map((input, i) => {
        const scaler = i === 2 && v.version === 1 ? "s2" : "s1";
        const identity = `${input}/m1/${scaler}`;
        const key = v.key === 1 ? identity : input;
        const found = cache.get(key);
        if (found !== undefined) {
          cache.delete(key);
          cache.set(key, found);
          if (found === identity) {
            hits++;
            return `${input}: valid hit`;
          }
          stale++;
          return `${input}: stale hit`;
        }
        misses++;
        cache.set(key, identity);
        if (cache.size > v.capacity!) cache.delete(cache.keys().next().value!);
        return `${input}: compute miss`;
      });
      return {
        graphics: [
          cells(
            "Input request sequence",
            inputs.map(
              (input, i) =>
                `${i + 1}: ${input}, model m1, scaler ${i === 2 && v.version === 1 ? "s2" : "s1"}`,
            ),
            1,
          ),
          pipeline("Request trace", trace),
          bars(
            "Outcomes",
            ["Valid hits", "Stale hits", "Cache misses"],
            [hits, stale, misses],
          ),
        ],
        answer: hits,
        answerLabel: "Valid cache hits",
        explanation: `${v.key === 0 ? "An input-only key can return a result produced by a different scaler. " : "Including model and scaler versions separates results with different meanings. "}The cache removes the least recently used entry when storage exceeds ${v.capacity} entries. A stale hit reuses a result from the wrong version. Its numerical value might match, but no check establishes whether it matches the current version.`,
        code:
          v.key === 1
            ? "const key = JSON.stringify([input, modelVersion, scalerVersion]);"
            : "const key = JSON.stringify(input); // ignores version changes",
      };
    },
  },
  "webgpu-acceleration": {
    title: "When is the GPU worth the overhead?",
    brief:
      "Compare faster GPU calculations with the extra time needed to start the GPU and transfer data.",
    boundary:
      "We chose these cost rates for the example. This activity uses no GPU or browser backend. Measure WebGPU performance on a real device separately.",
    controls: [
      range("units", "Workload units", 20, 1, 100),
      choice(
        "warm",
        "GPU initialization",
        ["Cold: add 40 ms", "Already initialized"],
        1,
      ),
      choice("supported", "Operation support", [
        "Supported by example GPU",
        "Unsupported: use fallback",
      ]),
    ],
    cases: [
      {
        id: "near",
        label: "Small transfer",
        description:
          "CPU costs 2 ms per unit. GPU costs 0.5 ms per unit plus 6 ms transfer.",
      },
      {
        id: "large",
        label: "Large transfer",
        description:
          "Calculation speeds stay the same. Moving the data and reading the result take 30 ms.",
      },
    ],
    prediction: {
      prompt: "How much time does the selected path take?",
      unit: "ms",
      tolerance: 0.05,
    },
    evaluate: (v, caseId) => {
      const cpu = 2 * v.units!;
      const transfer = caseId === "large" ? 30 : 6;
      const initialization = v.warm === 0 ? 40 : 0;
      const gpu = v.units! * 0.5 + transfer + initialization;
      const selected = v.supported === 1 ? cpu : gpu;
      return {
        graphics: [
          cells(
            "Example workload costs",
            [
              `Units: ${v.units}`,
              "CPU: 2 ms/unit",
              "GPU: 0.5 ms/unit",
              `Transfer: ${transfer} ms`,
              `Initialization: ${initialization} ms`,
              v.supported === 0
                ? "Operation: GPU-supported"
                : "Operation: fallback required",
            ],
            3,
          ),
          bars(
            "End-to-end time (ms)",
            ["CPU fallback", "Example GPU"],
            [cpu, gpu],
          ),
          bars(
            "GPU time components (ms)",
            ["Compute", "Transfer/readback", "Initialization"],
            [v.units! * 0.5, transfer, initialization],
          ),
        ],
        answer: selected,
        answerLabel: "Selected path time",
        explanation: `The example GPU cost is 0.5 × ${v.units} + ${transfer} + ${initialization} = ${gpu} ms. The CPU cost is ${cpu} ms. ${v.supported === 1 ? "This operation uses the fallback because GPU support is missing." : gpu < cpu ? "Parallel work saves more time than the fixed overhead costs here." : "The fixed GPU costs outweigh its faster computation here."} Measure the real end-to-end workload on the target device.`,
      };
    },
  },
  "llms-for-science": {
    title: "Scientific claims and their evidence",
    brief:
      "Compare a fixed draft with the supplied observations. Count which claims the evidence actually supports.",
    boundary:
      "This activity uses a fixed draft and records. This checks explicit facts without calling a language model.",
    controls: [
      choice("measurements", "Measurement record", ["Missing", "Attached"], 1),
      choice("source", "Source identity", ["Missing", "Attached"], 1),
      choice(
        "draft",
        "Draft claims",
        ["Frequency + amplitude", "Frequency + amplitude + alien origin"],
        1,
      ),
    ],
    cases: [
      {
        id: "full",
        label: "Complete capture",
        description:
          "Record S7 reports frequency 8 Hz and amplitude 0.4. It contains no evidence about origin.",
      },
      {
        id: "partial",
        label: "Partial capture",
        description:
          "Record S8 reports frequency 8 Hz. The amplitude measurement is missing. Origin remains unknown.",
      },
    ],
    prediction: {
      prompt:
        "How many draft claims have supporting measurements and a source ID?",
      unit: "claims",
    },
    evaluate: (v, caseId) => {
      const claims =
        v.draft === 1
          ? ["Frequency is 8 Hz", "Amplitude is 0.4", "Signal has alien origin"]
          : ["Frequency is 8 Hz", "Amplitude is 0.4"];
      const supported =
        v.measurements === 1 && v.source === 1
          ? caseId === "partial"
            ? 1
            : 2
          : 0;
      return {
        graphics: [
          cells(
            "Supplied evidence",
            [
              v.measurements === 1 ? "Frequency: 8 Hz" : "No measurements",
              v.measurements === 1 && caseId === "full"
                ? "Amplitude: 0.4"
                : "Amplitude: unknown",
              v.source === 1
                ? caseId === "full"
                  ? "Source: S7"
                  : "Source: S8"
                : "Source: missing",
            ],
            3,
          ),
          pipeline(
            "Draft claim checks",
            claims.map(
              (claim, i) =>
                `${claim}: ${i < supported ? "supported" : "unverified"}`,
            ),
            Array.from({ length: supported }, (_, i) => i),
          ),
        ],
        answer: supported,
        answerLabel: "Supported traceable claims",
        explanation: `${claims.length - supported} claims need revision. Remove them, explain their limits, or provide evidence that supports them. ${v.source === 0 ? "Without a source identity, the crew cannot trace the measurement. " : ""}A plausible explanation is not a new measurement. Neither record establishes the signal's origin.`,
      };
    },
  },
  "prompt-engineering": {
    title: "Farah’s report prompt",
    brief:
      "Add the role, reference facts, current reading and JSON request. Watch each part appear in the prompt.",
    boundary:
      "P1 and P2 are made-up practice readings. The example supplies a natural-frequency catalogue as context. This activity builds text locally. It calls no language model and does not predict a classification.",
    controls: [
      choice(
        "role",
        "Role and task",
        ["Missing", "Name DEEP SCAN's classification task"],
        1,
      ),
      choice("catalogue", "Reference facts", [
        "Missing",
        "Include the natural-frequency catalogue",
      ]),
      choice(
        "reading",
        "Current reading",
        ["Missing", "Include its ID, values and units"],
        1,
      ),
      choice(
        "format",
        "Output request",
        ["Missing", "Request the three JSON fields"],
        1,
      ),
    ],
    cases: [
      {
        id: "practice-a",
        label: "Practice reading P1",
        description:
          "P1 has amplitude 1024 counts, frequency 23 Hz and phase 0.23 rad. The supplied natural-frequency catalogue is 5, 12, 23 and 47 Hz.",
      },
      {
        id: "practice-b",
        label: "Practice reading P2",
        description:
          "P2 has amplitude 768 counts, frequency 73.4 Hz and phase -0.4 rad. Use the same reference catalogue. Its absence from that list would not prove an artificial origin.",
      },
    ],
    prediction: {
      prompt: "How many of the four required prompt parts are still missing?",
      unit: "parts",
    },
    evaluate: (v, caseId) => {
      const reading =
        caseId === "practice-b"
          ? { id: "P2", amplitude: 768, frequency: 73.4, phase: -0.4 }
          : { id: "P1", amplitude: 1024, frequency: 23, phase: 0.23 };
      const parts = [
        {
          included: v.role === 1,
          label: "Role",
          lines: [
            "You are DEEP SCAN, a signal classifier for deep space signals.",
          ],
          missing: "The role needs to name the classification task.",
        },
        {
          included: v.catalogue === 1,
          label: "Reference facts",
          lines: ["Known natural frequencies: 5, 12, 23, 47 Hz."],
          missing:
            "Add the natural-frequency catalogue so the model receives the reference facts.",
        },
        {
          included: v.reading === 1,
          label: "Current reading",
          lines: [
            `Practice reading ${reading.id}:`,
            `Amplitude: ${reading.amplitude} counts`,
            `Frequency: ${reading.frequency} Hz`,
            `Phase: ${reading.phase} rad`,
          ],
          missing: `Include ${reading.id}'s values and units. Reference facts alone do not supply the reading.`,
        },
        {
          included: v.format === 1,
          label: "Output request",
          lines: [
            "Respond in JSON with classification (noise, anomaly or unknown), confidence (self-reported score, 0 to 1) and reasoning. The score is not a calibrated probability.",
          ],
          missing:
            "Request JSON and name classification, confidence and reasoning so the checker knows which fields to expect.",
        },
      ];
      const missing = parts.filter((part) => !part.included);
      const included = parts.filter((part) => part.included);
      const lines = included.flatMap((part) => part.lines);
      return {
        graphics: [
          cells(
            "Supplied practice reading and reference facts",
            [
              `Reading: ${reading.id} (made up)`,
              `Amplitude: ${reading.amplitude} counts`,
              `Frequency: ${reading.frequency} Hz`,
              `Phase: ${reading.phase} rad`,
              "Reference catalogue: 5, 12, 23, 47 Hz",
            ],
            1,
          ),
          {
            kind: "pipeline",
            label: "Assembled prompt",
            values: lines.length
              ? lines
              : ["The prompt is empty. Add a part to begin."],
            labels: included.length
              ? included.flatMap((part) => part.lines.map(() => part.label))
              : ["No content"],
          },
          pipeline(
            "Required prompt parts",
            parts.map(
              (part) =>
                `${part.label}: ${part.included ? "present" : "missing"}`,
            ),
            parts.flatMap((part, i) => (part.included ? [i] : [])),
          ),
        ],
        answer: missing.length,
        answerLabel: "Missing prompt parts",
        explanation: `${missing.length ? missing.map((part) => part.missing).join(" ") : "All four parts are present."} The catalogue and current reading stay separate. A complete prompt does not guarantee valid JSON or correct claims. Parse the reply and review its claims against the supplied evidence.`,
        code: `const prompt = ${JSON.stringify(lines, null, 2)}.join('\\n');`,
      };
    },
  },
  "rag-for-signals": {
    title: "Evidence for a specific claim",
    brief:
      "Search three archive records, then check whether the returned passage supports the claim.",
    boundary:
      "Retrieval uses a small, fixed keyword score. It does not use embeddings, call a language model or prove a source is true.",
    controls: [
      choice(
        "query",
        "Search terms",
        ["signal", "signal frequency", "sensor calibration"],
        1,
      ),
      range("top", "Records to retrieve", 1, 1, 3),
      choice("ids", "Keep source IDs", ["Discard them", "Keep them"], 1),
    ],
    cases: [
      {
        id: "frequency",
        label: "Check the frequency",
        description:
          "Claim: capture S7 has a measured frequency of 8 Hz. Only record A contains this measurement.",
      },
      {
        id: "calibration",
        label: "Check calibration",
        description:
          "Claim: sensor S7 passed calibration. Only record C records that result.",
      },
    ],
    prediction: {
      prompt: "How many retrieved records support the claim with a source ID?",
      unit: "records",
    },
    evaluate: (v, caseId) => {
      const queries = [
        ["signal"],
        ["signal", "frequency"],
        ["sensor", "calibration"],
      ];
      const records = [
        { id: "A", terms: ["signal", "frequency"], text: "S7 frequency: 8 Hz" },
        { id: "B", terms: ["signal"], text: "Signal origin: unknown" },
        {
          id: "C",
          terms: ["sensor", "calibration"],
          text: "S7 calibration: passed",
        },
      ];
      const ranked = records
        .map((record) => ({
          ...record,
          score: queries[v.query!]!.filter((term) =>
            record.terms.includes(term),
          ).length,
        }))
        .sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
      const retrieved = ranked.slice(0, v.top!);
      const required = caseId === "calibration" ? "C" : "A";
      const supports =
        v.ids === 1 && retrieved.some((record) => record.id === required)
          ? 1
          : 0;
      return {
        graphics: [
          cells(
            "Archive records",
            records.map((r) => `${r.id}: ${r.text} [${r.terms.join(", ")}]`),
            1,
          ),
          bars(
            "Keyword matches per record",
            ranked.map((r) => `Record ${r.id}`),
            ranked.map((r) => r.score),
          ),
          cells(
            "Retrieved passages",
            retrieved.map((r) => `${v.ids === 1 ? r.id : "No ID"}: ${r.text}`),
            1,
          ),
        ],
        answer: supports,
        answerLabel: "Supporting records with source IDs",
        explanation: `Record ${required} is the supporting passage for this claim. ${supports === 1 ? "The retrieved set contains it and keeps its ID." : v.ids === 0 ? "Discarding IDs prevents this activity from tracing the claim to a source." : "The retrieved set does not include the supporting passage."} A high retrieval score only counts matched terms. It does not establish that a passage supports a claim.`,
      };
    },
  },
  "report-generation": {
    title: "Reviewed sections and missing evidence",
    brief:
      "Farah has reviewed the draft. Change the review conditions, then see which section text reaches the relay report and which headings stay under Withheld.",
    boundary:
      "These fixed drafts have supplied review rules. The activity assembles their text locally. It does not generate prose, verify new claims or send a report.",
    controls: [
      choice("sources", "Observation source links", ["Missing", "Present"], 1),
      choice("claim", "Analysis claim", [
        "States only measured facts",
        "Adds an unsupported origin",
      ]),
      choice(
        "limits",
        "Limits section",
        ["Missing", "Names unknown origin"],
        1,
      ),
    ],
    cases: [
      {
        id: "full",
        label: "Complete observation",
        description:
          "In this draft, the source records an 8 Hz frequency and 0.4 amplitude. Farah approves Observations only when both measurements and their source link are present.",
      },
      {
        id: "partial",
        label: "Incomplete observation",
        description:
          "The source lacks the amplitude measurement claimed by Observations. Farah withholds that section. The other sections keep their own review decisions.",
      },
    ],
    prediction: {
      prompt: "How many section bodies will the assembled report include?",
      unit: "sections",
    },
    evaluate: (v, caseId) => {
      const sections = [
        {
          heading: "Observations",
          content:
            "The capture has frequency 8 Hz and amplitude 0.4. Source: S7.",
          validated: v.sources === 1 && caseId === "full",
        },
        {
          heading: "Analysis",
          content:
            v.claim === 0
              ? "The recorded frequency is 8 Hz. Its origin is unknown."
              : "The signal is a reply from an artificial source.",
          validated: v.claim === 0,
        },
        {
          heading: "Limits",
          content:
            v.limits === 1
              ? "These measurements do not establish the signal's origin."
              : "",
          validated: v.limits === 1,
        },
      ];
      const approved = sections.filter((section) => section.validated);
      const withheld = sections.filter((section) => !section.validated);
      const blocks = approved.map(
        (section) => `## ${section.heading}\n\n${section.content}`,
      );
      if (withheld.length)
        blocks.push(
          `## Withheld\n\n${withheld.map((section) => `- ${section.heading}`).join("\n")}`,
        );
      return {
        graphics: [
          cells(
            "Draft and supplied review conditions",
            [
              caseId === "full"
                ? "Source S7: 8 Hz, amplitude 0.4"
                : "Source S7: 8 Hz, amplitude missing",
              v.sources === 1
                ? "Observation source link: present"
                : "Observation source link: missing",
              ...sections.map(
                (section) =>
                  `${section.heading}: ${section.content || "No draft text"}`,
              ),
            ],
            1,
          ),
          pipeline(
            "Recorded review decisions",
            sections.map(
              (section) =>
                `${section.heading}: ${section.validated ? "approved" : "withheld"}`,
            ),
            sections.flatMap((section, i) => (section.validated ? [i] : [])),
          ),
          {
            kind: "cells",
            layout: "prose",
            label: "Assembled relay report",
            values: ["# Relay Report", ...blocks],
            labels: [
              "Title",
              ...approved.map(() => "Approved section"),
              ...(withheld.length ? ["Omission notice"] : []),
            ],
          },
        ],
        answer: approved.length,
        answerLabel: "Section bodies included",
        explanation: `${withheld.length ? `Withheld: ${withheld.map((section) => section.heading).join(", ")}. The report omits their text and keeps their headings visible.` : "Every section passed review, so the report needs no Withheld block."} ${approved.length ? "The approved sections remain in their original order." : "The assembled report contains no approved section text."} These flags record the supplied review decisions. The assembler does not check claims, and Farah still reviews the assembled report for consistency before sending it.`,
        code: `const sections = ${JSON.stringify(sections, null, 2)};\nconst approved = sections.filter(s => s.validated);\nconst withheld = sections.filter(s => !s.validated);\nconst blocks = approved.map(s => '## ' + s.heading + '\\n\\n' + s.content);\nif (withheld.length) blocks.push('## Withheld\\n\\n' + withheld.map(s => '- ' + s.heading).join('\\n'));\nconst report = '# Relay Report\\n\\n' + blocks.join('\\n\\n---\\n\\n');\n// Review this assembled report before sending.`,
      };
    },
  },
  "multi-model-systems": {
    title: "Model handoff checks",
    brief:
      "Demir connects the classifier, detector and alert writer. Change a stage's reply and trace which stages run, what they receive, and what the pipeline returns.",
    boundary:
      "These are the exercise's two example readings with controlled stage replies. The activity checks the replies and formats text in your browser. No classifier, detector or language model runs. Supplied scores are not calibrated probabilities.",
    controls: [
      choice(
        "classifier",
        "Supplied classifier reply",
        [
          "noise, score 0.73",
          "anomaly, score 0.88",
          "unsupported label, score 0.42",
          "anomaly, invalid score 1.2",
        ],
        1,
      ),
      choice(
        "detector",
        "Supplied detector reply",
        [
          "false: no alert requested",
          "true: request an alert",
          "string 'false': invalid reply",
        ],
        1,
      ),
      choice("writer", "Supplied writer reply", [
        "A nonblank alert",
        "Whitespace only",
      ]),
    ],
    cases: [
      {
        id: "calm",
        label: "Lower-amplitude reading",
        description:
          "The exercise supplies [180, 5, 0.3]: amplitude in counts, zero-crossing count and phase in radians. Each stage must receive this original array.",
      },
      {
        id: "loud",
        label: "Higher-amplitude reading",
        description:
          "The second exercise input is [1650, 41, -2.4], in the same feature order and units. Changing inputs does not run a model here. Stage replies remain the values you selected.",
      },
    ],
    prediction: {
      prompt: "What will this pipeline run produce?",
      choices: ["Alert returned", "No alert requested", "Run stopped"],
    },
    evaluate: (v, caseId) => {
      const signal = caseId === "loud" ? [1650, 41, -2.4] : [180, 5, 0.3];
      const verdict = [
        { class: "noise", confidence: 0.73 },
        { class: "anomaly", confidence: 0.88 },
        { class: "unsupported", confidence: 0.42 },
        { class: "anomaly", confidence: 1.2 },
      ][v.classifier!]!;
      const detectorReply: unknown = [false, true, "false"][v.detector!];
      const calls: string[] = [];
      const classify = (reading: number[]) => {
        calls.push(`Classifier received [${reading.join(", ")}]`);
        return verdict;
      };
      const detectAnomaly = (reading: number[], classification: string) => {
        calls.push(
          `Detector received [${reading.join(", ")}] + ${classification}`,
        );
        return detectorReply;
      };
      const generateAlert = (reading: number[], classification: string) => {
        calls.push(
          `Alert writer received [${reading.join(", ")}] + ${classification}`,
        );
        return v.writer === 1
          ? "   "
          : `Review requested: ${classification}. Reading [${reading.join(", ")}].`;
      };
      let result: {
        classification: string;
        confidence: number;
        isAnomaly: boolean;
        alert: string | null;
      } | null = null;
      let failure = "";
      try {
        const classified = classify(signal);
        if (
          !Number.isFinite(classified.confidence) ||
          classified.confidence < 0 ||
          classified.confidence > 1
        ) {
          throw new Error(
            "Classifier score must be a finite number from 0 to 1. The pipeline stopped before calling the detector or writer.",
          );
        }
        const classification = ["noise", "anomaly"].includes(classified.class)
          ? classified.class
          : "unknown";
        const isAnomaly = detectAnomaly(signal, classification);
        if (typeof isAnomaly !== "boolean")
          throw new Error(
            "The detector returned a string. It must return a boolean, so the pipeline stopped before calling the writer.",
          );
        const alert = isAnomaly ? generateAlert(signal, classification) : null;
        if (isAnomaly && (typeof alert !== "string" || !alert.trim()))
          throw new Error(
            "The writer returned only whitespace. The pipeline returns no result.",
          );
        result = {
          classification,
          confidence: classified.confidence,
          isAnomaly,
          alert,
        };
      } catch (error) {
        failure = (error as Error).message;
      }
      const outcome = failure
        ? "Run stopped"
        : result!.isAnomaly
          ? "Alert returned"
          : "No alert requested";
      return {
        graphics: [
          cells(
            "Reading and supplied stage replies",
            [
              `Raw reading: [${signal.join(", ")}] (counts, crossings, radians)`,
              `Classifier reply: ${JSON.stringify(verdict)}`,
              `Detector reply: ${JSON.stringify(detectorReply)}`,
              v.writer === 1
                ? "Writer reply: whitespace only"
                : "Writer reply: review request using the raw reading and checked class",
            ],
            1,
          ),
          pipeline("Calls made this run", calls),
          cells(
            "Pipeline result",
            result
              ? [
                  `classification: ${result.classification}`,
                  `confidence: ${result.confidence} (chosen-class score)`,
                  `isAnomaly: ${result.isAnomaly}`,
                  result.alert === null
                    ? "alert: null (writer skipped)"
                    : `alert: ${result.alert}`,
                ]
              : [failure, "No result returned."],
            1,
          ),
        ],
        answer: outcome,
        answerLabel: "Pipeline outcome",
        explanation:
          failure ||
          `${verdict.class === "unsupported" ? "The unsupported classifier label becomes unknown before the next stage. " : ""}${result!.isAnomaly ? "The detector returned true, so the pipeline ran the writer and returned its nonblank text." : "The detector returned false, so the pipeline skipped the writer and returned null for alert, even if the classifier said anomaly."} Every called stage received the original raw reading. Valid fields do not establish that a prediction is right. These controlled replies only test the handoff.`,
        code: `// Pass these controlled callbacks to the exercise's pipeline.\nconst signal = ${JSON.stringify(signal)};\nconst classify = async () => (${JSON.stringify(verdict)});\nconst detectAnomaly = async () => (${JSON.stringify(detectorReply)});\nconst generateAlert = async (reading, classification) => ${v.writer === 1 ? JSON.stringify("   ") : "'Review requested: ' + classification + '. Reading [' + reading.join(', ') + '].'"};\nconst result = await pipeline(signal, classify, detectAnomaly, generateAlert);`,
      };
    },
  },
  "system-architecture": {
    title: "Fit the pipeline into its budget",
    brief:
      "Add the time spent in each stage. Find what prevents the crew from completing a report or tracing it to its input and model.",
    boundary:
      "The stage costs are fixed planning examples. This is not a performance measurement or production pipeline.",
    controls: [
      choice("model", "Model path", ["Small: 20 ms", "Large: 65 ms"]),
      range("budget", "End-to-end time budget (ms)", 100, 50, 150, 10),
      choice("metadata", "Carry input and model IDs", ["No", "Yes"], 1),
    ],
    cases: [
      {
        id: "valid",
        label: "Valid sensor record",
        description:
          "Ingest takes 5 ms, preprocessing 10 ms and reporting 25 ms. The sensor schema is valid.",
      },
      {
        id: "malformed",
        label: "Malformed sensor record",
        description:
          "The record is missing a required timestamp. Ingest rejects it after 5 ms.",
      },
    ],
    prediction: {
      prompt: "How much pipeline time is spent before completion or rejection?",
      unit: "ms",
    },
    evaluate: (v, caseId) => {
      const invalid = caseId === "malformed";
      const costs = invalid
        ? [5, 0, 0, 0]
        : [5, 10, v.model === 0 ? 20 : 65, 25];
      const total = costs.reduce((a, b) => a + b, 0);
      const ready = !invalid && total <= v.budget! && v.metadata === 1;
      return {
        graphics: [
          cells(
            "Pipeline inputs",
            [
              invalid ? "Timestamp: missing" : "Timestamp: present",
              "Ingest: 5 ms",
              "Preprocess: 10 ms",
              `Infer: ${v.model === 0 ? 20 : 65} ms`,
              "Report: 25 ms",
              `Budget: ${v.budget} ms`,
            ],
            3,
          ),
          bars(
            "Executed stage time (ms)",
            ["Ingest", "Preprocess", "Infer", "Report"],
            costs,
          ),
          pipeline(
            "Report path",
            [
              invalid ? "Ingest rejects timestamp" : "Input validated",
              invalid ? "Preprocessing skipped" : "Feature contract matched",
              invalid
                ? "Inference skipped"
                : total <= v.budget!
                  ? "Within time budget"
                  : "Time budget exceeded",
              ready ? "Traceable report" : "Report blocked",
            ],
            ready ? [3] : [],
          ),
        ],
        answer: total,
        answerLabel: "Pipeline time spent",
        explanation: invalid
          ? "Rejecting a malformed record stops later stages. A missing reading is not an ordinary low model score."
          : `The stage costs add to ${total} ms against a ${v.budget} ms budget. ${v.metadata === 0 ? "Without input and model IDs, the crew cannot trace the report to its source and model version." : "Source and version IDs travel with the result."} Check input validity, resource limits and source IDs separately.`,
      };
    },
  },
  "ci-cd-pipeline": {
    title: "Release the model bundle you tested",
    brief:
      "Check that the proposed release matches the tested model bundle. Then check whether it finds enough held-out anomalies.",
    boundary:
      "These version IDs and evaluation results are examples. This activity does not build, test or deploy a model.",
    controls: [
      choice("identity", "Candidate bundle", [
        "Same graph, weights and scaler",
        "Weights rebuilt",
        "Scaler replaced",
      ]),
      range("minimum", "Minimum anomaly recall (%)", 90, 70, 100, 5),
      choice("contract", "Input/output contract test", ["Fails", "Passes"], 1),
    ],
    cases: [
      {
        id: "high",
        label: "Evaluation report A",
        description:
          "The tested bundle finds 19 of 20 held-out anomalies: 95% recall.",
      },
      {
        id: "lower",
        label: "Evaluation report B",
        description:
          "The tested bundle finds 17 of 20 held-out anomalies: 85% recall.",
      },
    ],
    prediction: { prompt: "How many release checks pass?", unit: "of 3 gates" },
    evaluate: (v, caseId) => {
      const recall = caseId === "lower" ? 85 : 95;
      const checks = [v.identity === 0, v.contract === 1, recall >= v.minimum!];
      const passed = checks.filter(Boolean).length;
      return {
        graphics: [
          cells(
            "Tested and candidate bundle",
            [
              "Tested: graph G1",
              "Tested: weights W1",
              "Tested: scaler S1",
              "Candidate: graph G1",
              v.identity === 1
                ? "Candidate: weights W2"
                : "Candidate: weights W1",
              v.identity === 2
                ? "Candidate: scaler S2"
                : "Candidate: scaler S1",
            ],
            3,
          ),
          bars(
            "Held-out anomaly recall (%)",
            ["Measured recall", "Required recall"],
            [recall, v.minimum!],
          ),
          pipeline(
            "Release gates",
            [
              checks[0] ? "Artifact matches" : "Artifact changed",
              checks[1] ? "Contract passes" : "Contract fails",
              checks[2] ? "Recall passes" : "Recall fails",
            ],
            checks.flatMap((ok, i) => (ok ? [i] : [])),
          ),
        ],
        answer: passed,
        answerLabel: "Release checks passed",
        explanation: `${v.identity !== 0 ? "The evaluation belongs to a different bundle. Test the replacement weights or scaler before releasing it. " : "The candidate is the same bundle that produced this evaluation. "}Recall is ${recall}% against a ${v.minimum}% requirement. A passing application build alone does not check these model requirements.`,
        code: `const release = ${checks[0]} && ${checks[1]} && ${checks[2]};`,
      };
    },
  },
  monitoring: {
    title: "Monitoring alerts and prediction accuracy",
    brief:
      "Set limits for latency, missing inputs and a changed mean score. See which recorded metrics trigger review.",
    boundary:
      "These are fixed monitoring examples. A score change needs investigation. It does not prove a data shift, an anomaly or lower accuracy.",
    controls: [
      range("latency", "Latency limit (ms)", 100, 50, 250, 10),
      range("missing", "Missing-input limit (%)", 5, 0, 20),
      range("shift", "Mean-score change limit", 0.2, 0.05, 0.5, 0.05),
    ],
    cases: [
      {
        id: "routine",
        label: "Routine window",
        description:
          "95th-percentile latency: 80 ms. Missing inputs: 2%. Mean score changed from 0.3 to 0.35.",
      },
      {
        id: "changed",
        label: "Changed window",
        description:
          "95th-percentile latency: 180 ms. Missing inputs: 12%. Mean score changed from 0.3 to 0.65.",
      },
    ],
    prediction: {
      prompt: "How many recorded metrics exceed their limits?",
      unit: "alerts",
    },
    evaluate: (v, caseId) => {
      const changed = caseId === "changed";
      const latency = changed ? 180 : 80;
      const missing = changed ? 12 : 2;
      const delta = changed ? 0.35 : 0.05;
      const checks = [
        latency > v.latency!,
        missing > v.missing!,
        delta > v.shift! + 1e-9,
      ];
      const count = checks.filter(Boolean).length;
      return {
        graphics: [
          cells(
            "Recorded monitoring window",
            [
              `95th-percentile latency: ${latency} ms`,
              `Missing inputs: ${missing}%`,
              "Previous mean score: 0.3",
              `Current mean score: ${changed ? 0.65 : 0.35}`,
            ],
            2,
          ),
          bars(
            "Latency and score change as percentages of their limits",
            ["Latency", "Mean-score change"],
            [
              round((latency / v.latency!) * 100),
              round((delta / v.shift!) * 100),
            ],
          ),
          bars(
            "Missing inputs (%)",
            ["Observed", "Alert limit"],
            [missing, v.missing!],
          ),
          pipeline(
            "Review signals",
            [
              checks[0] ? "Latency exceeds limit" : "Latency within limit",
              checks[1]
                ? "Missing inputs exceed limit"
                : "Missing inputs within limit",
              checks[2]
                ? "Score change exceeds limit"
                : "Score change within limit",
            ],
            checks.flatMap((alert, i) => (alert ? [i] : [])),
          ),
        ],
        answer: count,
        answerLabel: "Metrics requiring review",
        explanation: `${latency} ms latency, ${missing}% missing inputs and a ${delta} mean-score change each have their own check. ${v.missing === 0 ? "The missing-input limit is zero, so any missing input triggers review. A percentage of that zero limit would be undefined, so the missing-input chart shows the observed percentage and the limit directly. " : ""}Changing limits changes which alerts fire. The underlying measurements stay the same. Check prediction accuracy against reviewed labels.`,
      };
    },
  },
  documentation: {
    title: "Give the next watch enough context",
    brief:
      "Complete the model card for the next watch. Include the evaluation results and when and how to roll back the model.",
    boundary:
      "Check the required fields in two example handovers. A complete card still needs evidence for its claims.",
    controls: [
      choice(
        "scope",
        "Scope and training data",
        ["Not recorded", "Task, exclusions and data recorded"],
        1,
      ),
      choice(
        "evaluation",
        "Evaluation record",
        ["Only a score", "Score + dataset + conditions"],
        1,
      ),
      choice(
        "operations",
        "Operations record",
        ["Owner only", "Owner + monitoring + rollback"],
        1,
      ),
    ],
    cases: [
      {
        id: "normal",
        label: "Routine handover",
        description:
          "The next watch needs scope, training data, evaluation conditions, an owner, monitoring and rollback steps.",
      },
      {
        id: "new",
        label: "New sensor handover",
        description:
          "The card reports evaluation on sensor A. The next watch plans to use sensor B, which has no recorded evaluation.",
      },
    ],
    prediction: {
      prompt: "How many handover requirements are still missing?",
      unit: "requirements",
    },
    evaluate: (v, caseId) => {
      const missingScope = v.scope === 0;
      const missingEvaluation = v.evaluation === 0;
      const missingOperations = v.operations === 0;
      const unevaluated = caseId === "new";
      const count =
        Number(missingScope) +
        Number(missingEvaluation) +
        Number(missingOperations) +
        Number(unevaluated);
      return {
        graphics: [
          cells(
            "Model card fields",
            [
              missingScope ? "Scope/data: missing" : "Scope/data: recorded",
              missingEvaluation
                ? "Evaluation: score only"
                : "Evaluation: conditions recorded",
              missingOperations
                ? "Operations: owner only"
                : "Operations: recovery recorded",
              unevaluated
                ? "Sensor B evaluation: missing"
                : "Intended sensor: evaluated",
            ],
            2,
          ),
          bars(
            "Handover checks",
            ["Required", "Complete", "Missing"],
            [unevaluated ? 4 : 3, (unevaluated ? 4 : 3) - count, count],
          ),
        ],
        answer: count,
        answerLabel: "Handover requirements missing",
        explanation: `${missingEvaluation ? "A score without its dataset and conditions is hard to interpret. " : ""}${missingOperations ? "An owner name does not explain monitoring or rollback. " : ""}${unevaluated ? "Documenting sensor A's results does not validate sensor B. Record that gap and evaluate the new use before approval." : "Keep task, data, evaluation conditions and recovery steps with the model version."}`,
      };
    },
  },
  launch: {
    title: "Rehearse the complete launch path",
    brief:
      "Check app files, model files, required services and a known reading at the target location.",
    boundary:
      "These are example checks for a release rehearsal. The activity does not contact a real URL, service, device or deployment.",
    controls: [
      choice("assets", "Deployed assets", [
        "App and model complete",
        "App script missing",
        "Weight shard missing",
      ]),
      choice("services", "Required service check", ["Fails", "Passes"], 1),
      choice(
        "fixture",
        "Known reading result",
        ["Differs from expected", "Matches expected"],
        1,
      ),
    ],
    cases: [
      {
        id: "local",
        label: "Local-only console",
        description:
          "Prediction and reporting stay on the device. This example needs no server service.",
      },
      {
        id: "connected",
        label: "Authenticated console",
        description:
          "The console needs an authentication service before opening the report.",
      },
    ],
    prediction: {
      prompt: "How many release checks pass at the target?",
      unit: "of 4 checks",
    },
    evaluate: (v, caseId) => {
      const app = v.assets !== 1;
      const model = v.assets !== 2;
      const service = caseId === "local" || v.services === 1;
      const canRun = app && model && service;
      const fixture = canRun && v.fixture === 1;
      const checks = [app, model, service, fixture];
      const passed = checks.filter(Boolean).length;
      return {
        graphics: [
          cells(
            "Example release setup",
            [
              v.assets === 1 ? "App script: absent" : "App scripts: present",
              v.assets === 2 ? "Weight shard: absent" : "Model files: present",
              caseId === "local"
                ? "Server service: not required"
                : v.services === 1
                  ? "Authentication: available"
                  : "Authentication: unavailable",
              v.fixture === 1
                ? "Recorded result: matches expected"
                : "Recorded result: differs",
            ],
            2,
          ),
          pipeline(
            "Target release checks",
            [
              app ? "App assets pass" : "App assets fail",
              model ? "Model assets pass" : "Model assets fail",
              caseId === "local"
                ? "No required server service"
                : service
                  ? "Authentication passes"
                  : "Authentication fails",
              !canRun
                ? "Known reading blocked"
                : fixture
                  ? "Known reading matches"
                  : "Known reading differs",
            ],
            checks.flatMap((ok, i) => (ok ? [i] : [])),
          ),
          bars("Checks passed", ["Passed", "Required"], [passed, 4]),
        ],
        answer: passed,
        answerLabel: "Target checks passed",
        explanation: `${!canRun ? "A missing dependency prevents the known reading from completing the deployed path. " : !fixture ? "The complete path runs, but its known result differs from the expected result. " : "The known reading completes the full path and matches its expected result. "}Local success is separate from checks at the deployed asset paths and target console.`,
        code: `const targetChecks = [${checks.join(", ")}];\nconst canLaunch = targetChecks.every(Boolean);`,
      };
    },
  },
};
