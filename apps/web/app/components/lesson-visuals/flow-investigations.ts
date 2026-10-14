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
      "Follow the input and assets separately. Change the connection and decide where prediction happens.",
    boundary:
      "This is an asset and data-path simulation. It makes no network requests and runs no model.",
    controls: [
      choice("online", "Connection", ["Offline", "Online"], 1),
      choice(
        "assets",
        "Model and runtime assets",
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
            "Configured request",
            [
              `Input: ${count} sensor values`,
              server ? "Prediction: server" : "Prediction: device",
              v.online === 1 ? "Connection: online" : "Connection: offline",
              v.assets === 1 ? "Local assets: stored" : "Local assets: absent",
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
            : "Local prediction needs the model and runtime assets. With neither local assets nor a connection, it cannot start."
          : server
            ? "The server receives the whole input record. Moving prediction off the device changes the data path."
            : "This input stays on the device. Downloading model assets does not require sending these sensor values. Other app requests still need their own review.",
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
        "Readiness handling",
        ["Start immediately", "Await readiness"],
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
          "Initialization rejects. A fallback takes another 40 ms to initialize.",
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
        explanation: `${caseId === "failed" ? "After initialization fails, the fallback must become ready too. " : ""}Readiness finishes at ${readyAt} ms. ${safe ? "This operation starts after that point." : `Starting at ${actual} ms races initialization.`} Awaiting readiness handles the ordering. Production code must also handle a rejected initialization.`,
        code: "try {\n  const initialized = await tf.setBackend(preferredBackend);\n  if (!initialized) throw new Error('Preferred backend failed');\n  await tf.ready();\n} catch {\n  const initialized = await tf.setBackend(fallbackBackend);\n  if (!initialized) throw new Error('Fallback backend failed');\n  await tf.ready();\n}",
      };
    },
  },
  "model-loading": {
    title: "Find the missing model file",
    brief:
      "Count the files a model needs. A successful model.json request is only one part of the load.",
    boundary:
      "These are example asset checks. No files are downloaded and no model is loaded.",
    controls: [
      choice("graph", "model.json request", ["Fails", "Succeeds"], 1),
      range("shards", "Weight shards available", 2, 0, 4),
      choice("paths", "Relative shard paths", [
        "Resolve correctly",
        "Resolve to the wrong folder",
      ]),
    ],
    cases: [
      {
        id: "small",
        label: "Two-shard model",
        description: "The manifest names two weight shards, plus model.json.",
      },
      {
        id: "large",
        label: "Four-shard model",
        description: "The manifest names four weight shards, plus model.json.",
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
            "Asset request inputs",
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
            "Required assets",
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
        explanation: `${loaded} of ${required} shards are available at the resolved URLs. ${v.paths === 1 ? "The wrong folder prevents every shard request from finding its file. " : ""}${missing === 0 ? "The asset check passes. Loading the actual graph and checking its input contract are separate checks." : "The model cannot complete loading until model.json and every referenced shard are available."}`,
        code: `const requiredShards = ${required};\nconst availableShards = ${loaded};\nconst assetsComplete = ${missing === 0};`,
      };
    },
  },
  "inference-pipeline": {
    title: "Prepare the exact input",
    brief:
      "Inspect the values, their order and the batch axis before they reach the model.",
    boundary:
      "This activity applies a fixed scaler to example readings. It checks an input contract without running a model.",
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
      prompt: "How many input-contract checks pass?",
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
        explanation: `The model contract expects scaled temperature, pressure and vibration in that order, with shape [1, 3]. ${passed === 3 ? "This input matches all three requirements." : "A tensor with valid numbers can still violate scaling, feature order or shape."} The scales stay fixed because they come from training.`,
        code: `const input = tf.tensor${v.batch === 1 ? "2d([" : "1d("}[${prepared.map(round).join(", ")}]${v.batch === 1 ? "]" : ""});`,
      };
    },
  },
  "onnx-runtime-web": {
    title: "Check graph and input compatibility",
    brief:
      "Compare an exported graph with a provider's example support list and its named input contract.",
    boundary:
      "The operator support lists below are invented for this exercise. They do not describe current ONNX Runtime providers.",
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
            "Graph contract",
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
    title: "Choose a pipeline that fits",
    brief:
      "Compare the requested task, the model's permitted use and the download budget before choosing a pipeline.",
    boundary:
      "These model profiles are invented examples. No pretrained model is downloaded or executed.",
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
        ["Use is not approved", "Use is approved"],
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
        explanation: `${pass === 3 ? "This profile meets the example selection requirements." : "Resolve every failed requirement before loading the pipeline."} Passing these checks does not establish output quality. Test the selected model and its processor on representative inputs.`,
      };
    },
  },
  "model-profiling": {
    title: "Measure the complete prediction",
    brief:
      "Decide whether the timing includes cold start and output readback, then compare repeated calls.",
    boundary:
      "These fixed timings and tensor counts illustrate measurement scope. They are not a device benchmark.",
    controls: [
      choice("cold", "Include cold initialization", [
        "Exclude it",
        "Include it",
      ]),
      choice(
        "read",
        "Timing stops",
        ["After dispatch", "After output read"],
        1,
      ),
      range("runs", "Prediction calls", 5, 1, 10),
    ],
    cases: [
      {
        id: "clean",
        label: "Disposed temporaries",
        description:
          "Each call takes 4 ms dispatch and 16 ms to finish/read. Initialization takes 80 ms. Temporary tensors are released.",
      },
      {
        id: "leak",
        label: "Retained output",
        description:
          "Same example timings. One output tensor is retained after every call.",
      },
    ],
    prediction: {
      prompt: "What average time does this timing scope report?",
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
            ["Dispatch total", "Completion/read total", "Cold initialization"],
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
        explanation: `${total} counted milliseconds divided by ${v.runs} calls gives ${average} ms per call. ${v.read === 0 ? "Stopping after dispatch misses completion and output readback. " : ""}${v.cold === 1 ? "Report cold start separately when comparing steady-state calls. " : ""}${retained} extra tensors remain. Rising retained counts need investigation even when timing looks stable.`,
      };
    },
  },
  "caching-strategies": {
    title: "Trace valid cache hits",
    brief:
      "Replay a short request sequence. Change the cache key and storage limit to see valid hits, stale hits and evictions.",
    boundary:
      "This is an in-memory LRU simulation with fixed requests. It performs no prediction and stores nothing between visits.",
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
            ["Valid hits", "Stale hits", "Compute misses"],
            [hits, stale, misses],
          ),
        ],
        answer: hits,
        answerLabel: "Valid cache hits",
        explanation: `${v.key === 0 ? "An input-only key can return a result produced by a different scaler. " : "Including model and scaler versions separates results with different meanings. "}The least recently used entry is removed when storage exceeds ${v.capacity} entries. A stale hit saves work but returns the wrong cached result.`,
        code:
          v.key === 1
            ? "const key = JSON.stringify([input, modelVersion, scalerVersion]);"
            : "const key = JSON.stringify(input); // ignores version changes",
      };
    },
  },
  "webgpu-acceleration": {
    title: "Find the workload crossover",
    brief:
      "Balance faster parallel work against fixed initialization and transfer time.",
    boundary:
      "The cost rates are invented examples, not WebGPU measurements. No GPU or browser backend is used.",
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
        description: "Same compute rates. Transfer and readback cost 30 ms.",
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
    title: "Check each scientific claim",
    brief:
      "Compare a fixed draft with the supplied observations. Count which claims the evidence actually supports.",
    boundary:
      "The draft and records are fixed examples. This checks explicit facts without calling a language model.",
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
      prompt: "How many draft claims are supported and traceable?",
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
        explanation: `${claims.length - supported} claims need removal, qualification or more evidence. ${v.source === 0 ? "Without a source identity, the measurement cannot be traced. " : ""}A plausible explanation is not a new measurement. Neither record establishes the signal's origin.`,
      };
    },
  },
  "prompt-engineering": {
    title: "Make the output contract checkable",
    brief:
      "Set requirements for a fixed response and inspect the validation failures those requirements expose.",
    boundary:
      "This activity validates two fixed response objects. Prompt settings do not generate text or guarantee that a model follows them.",
    controls: [
      choice("sources", "Require source IDs", ["No", "Yes"], 1),
      choice("unknown", "Require unknowns to stay unknown", ["No", "Yes"], 1),
      choice("format", "Require a structured object", ["No", "Yes"], 1),
    ],
    cases: [
      {
        id: "loose",
        label: "Fluent but unverified",
        description:
          "Plain text says the signal is artificial. It names no source and fills in an unknown origin.",
      },
      {
        id: "structured",
        label: "Structured response",
        description:
          "An object includes a summary and source S7, but still claims the unknown origin is artificial.",
      },
    ],
    prediction: {
      prompt: "How many required checks reject this response?",
      unit: "checks",
    },
    evaluate: (v, caseId) => {
      const object = caseId === "structured";
      const missingSources = v.sources === 1 && !object;
      const inventedOrigin = v.unknown === 1;
      const wrongFormat = v.format === 1 && !object;
      const failures =
        Number(missingSources) + Number(inventedOrigin) + Number(wrongFormat);
      return {
        graphics: [
          cells(
            "Fixed response",
            object
              ? [
                  "summary: artificial signal",
                  "sources: [S7]",
                  "origin: artificial",
                ]
              : ["Plain text", "No source IDs", "Origin: artificial"],
            3,
          ),
          pipeline(
            "Active validation",
            [
              v.sources === 0
                ? "Sources: not checked"
                : missingSources
                  ? "Sources: reject"
                  : "Sources: present",
              v.unknown === 0
                ? "Unknowns: not checked"
                : "Unknown origin: reject",
              v.format === 0
                ? "Format: not checked"
                : wrongFormat
                  ? "Format: reject"
                  : "Format: object",
            ],
            [],
          ),
        ],
        answer: failures,
        answerLabel: "Response checks failed",
        explanation: `Removing a requirement reduces the number of reported failures without making the claim true. ${object ? "The source field exists, but S7 does not establish an artificial origin." : "This draft has neither a structured object nor source IDs."} Check both the returned structure and the evidence behind each claim.`,
        code: `const required = { sources: ${v.sources === 1}, preserveUnknowns: ${v.unknown === 1}, object: ${v.format === 1} };`,
      };
    },
  },
  "rag-for-signals": {
    title: "Retrieve evidence for a specific claim",
    brief:
      "Rank three archive records, then check whether the retrieved passage supports the requested fact.",
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
        explanation: `Record ${required} is the supporting passage for this claim. ${supports === 1 ? "It is in the retrieved set and its ID is preserved." : v.ids === 0 ? "Discarding IDs prevents this activity from tracing the claim to a source." : "The retrieved set does not include the supporting passage."} A high retrieval score only counts matched terms. It does not establish that a passage supports a claim.`,
      };
    },
  },
  "report-generation": {
    title: "Assemble only checked sections",
    brief:
      "Review observation, analysis and limits sections independently before releasing a report.",
    boundary:
      "The sections and checks are fixed examples. This activity performs no text generation or report publication.",
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
          "The required frequency and amplitude measurements are both present.",
      },
      {
        id: "partial",
        label: "Incomplete observation",
        description:
          "The required amplitude measurement is missing. Source links alone cannot fill the gap.",
      },
    ],
    prediction: {
      prompt: "How many required sections pass their checks?",
      unit: "of 3 sections",
    },
    evaluate: (v, caseId) => {
      const checks = [
        v.sources === 1 && caseId === "full",
        v.claim === 0,
        v.limits === 1,
      ];
      const count = checks.filter(Boolean).length;
      return {
        graphics: [
          cells(
            "Draft section inputs",
            [
              caseId === "full"
                ? "Observations: frequency and amplitude"
                : "Observations: frequency only",
              v.sources === 1
                ? "Source links: present"
                : "Source links: absent",
              v.claim === 0
                ? "Analysis: measured facts"
                : "Analysis: unverified origin",
              v.limits === 1 ? "Limits: origin unknown" : "Limits: absent",
            ],
            2,
          ),
          pipeline(
            "Section checks",
            ["Observations", "Analysis", "Limits"].map(
              (name, i) => `${name}: ${checks[i] ? "pass" : "revise"}`,
            ),
            checks.flatMap((ok, i) => (ok ? [i] : [])),
          ),
          bars(
            "Release requirements",
            ["Passed sections", "Required sections"],
            [count, 3],
          ),
        ],
        answer: count,
        answerLabel: "Report sections passed",
        explanation: `${caseId === "partial" ? "The observation section needs its missing amplitude measurement. " : ""}${v.claim === 1 ? "The analysis adds an origin claim that the measurements do not support. " : ""}${v.limits === 0 ? "The report must include the known limit: origin is unknown. " : ""}A complete report requires all three checked sections. Keep failures visible instead of silently dropping a section.`,
        code: `const sectionsPass = [${checks.join(", ")}];\nconst canAssemble = sectionsPass.every(Boolean);`,
      };
    },
  },
  "multi-model-systems": {
    title: "Validate the handoffs",
    brief:
      "Follow a detector result into retrieval and a fixed explanation. Check each stage's contract before release.",
    boundary:
      "The detector scores and explanation are example fixtures. No detector, retrieval service or language model runs here.",
    controls: [
      range("threshold", "Detector alert threshold (%)", 70, 30, 90, 10),
      choice(
        "version",
        "Detector version metadata",
        ["Missing", "Attached"],
        1,
      ),
      choice(
        "evidence",
        "Explanation evidence",
        ["Missing", "Linked to this reading"],
        1,
      ),
    ],
    cases: [
      {
        id: "strong",
        label: "High detector score",
        description:
          "Detector D2 gives reading R7 an 80% anomaly score. Its correctness has not been independently established.",
      },
      {
        id: "borderline",
        label: "Borderline detector score",
        description:
          "Detector D2 gives reading R8 a 60% anomaly score. Its correctness has not been independently established.",
      },
    ],
    prediction: {
      prompt: "How many handoff requirements for an alert report pass?",
      unit: "of 3 checks",
    },
    evaluate: (v, caseId) => {
      const score = caseId === "borderline" ? 60 : 80;
      const alert = score >= v.threshold!;
      const checks = [alert, v.version === 1, v.evidence === 1];
      const passed = checks.filter(Boolean).length;
      return {
        graphics: [
          bars(
            "Detector decision (%)",
            ["Anomaly score", "Alert threshold"],
            [score, v.threshold!],
          ),
          pipeline(
            "Alert-report handoff",
            [
              alert ? "Alert selected" : "Below alert threshold",
              v.version === 1 ? "Detector version retained" : "Version missing",
              v.evidence === 1 ? "Reading evidence linked" : "Evidence missing",
              passed === 3 ? "Ready for claim review" : "Handoff blocked",
            ],
            checks.flatMap((ok, i) => (ok ? [i] : [])),
          ),
        ],
        answer: passed,
        answerLabel: "Alert-report checks passed",
        explanation: `A score of ${score}% ${alert ? "meets" : "does not meet"} the ${v.threshold}% alert threshold. Version metadata and linked evidence are separate requirements. Passing the handoff only permits claim review; it does not establish that the detector or explanation is correct.`,
      };
    },
  },
  "system-architecture": {
    title: "Fit the pipeline into its budget",
    brief:
      "Add stage costs and locate the stage that blocks a traceable report.",
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
          : `The stage costs add to ${total} ms against a ${v.budget} ms budget. ${v.metadata === 0 ? "Without input and model IDs, the report cannot be traced back to its source and model version." : "Source and version IDs travel with the result."} Keep validation, resource limits and traceability as separate contracts.`,
      };
    },
  },
  "ci-cd-pipeline": {
    title: "Release the artifact that passed",
    brief:
      "Compare the candidate bundle with the tested bundle, then apply the held-out recall requirement.",
    boundary:
      "These hashes and evaluation results are fixtures. No build, CI job, evaluation or deployment runs here.",
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
    prediction: { prompt: "How many release gates pass?", unit: "of 3 gates" },
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
        answerLabel: "Release gates passed",
        explanation: `${v.identity !== 0 ? "The evaluation belongs to a different bundle. Test the replacement weights or scaler before releasing it. " : "The candidate is the same bundle that produced this evaluation. "}Recall is ${recall}% against a ${v.minimum}% requirement. A passing application build alone does not check these model requirements.`,
        code: `const release = ${checks[0]} && ${checks[1]} && ${checks[2]};`,
      };
    },
  },
  monitoring: {
    title: "Inspect alerts without assuming accuracy",
    brief:
      "Set limits for latency, missing inputs and a changed mean score. See which recorded metrics trigger review.",
    boundary:
      "These are fixed monitoring windows. The score change is a review signal, not proof of drift, an anomaly or lost accuracy.",
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
            "Metric as a percentage of its limit",
            ["Latency", "Missing inputs", "Mean-score change"],
            [
              round((latency / v.latency!) * 100),
              v.missing === 0 ? 200 : round((missing / v.missing!) * 100),
              round((delta / v.shift!) * 100),
            ],
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
        explanation: `${latency} ms latency, ${missing}% missing inputs and a ${delta} mean-score change are checked separately. ${v.missing === 0 ? "The missing-input limit is zero, so any missing value triggers review. Its chart bar is capped at 200%. " : ""}Changing limits changes alerts, not the underlying measurements. Reviewed labels are needed to check prediction accuracy.`,
      };
    },
  },
  documentation: {
    title: "Give the next watch enough context",
    brief:
      "Complete a model card for a specific handover. Check whether its evaluation and recovery details answer the next watch's questions.",
    boundary:
      "This checks required fields in two example handovers. A complete card does not establish that its claims are correct.",
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
          "The card was evaluated on sensor A. The next watch plans to use sensor B, which has no recorded evaluation.",
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
      "These are fixture checks for a release rehearsal. No live URL, service, device or deployment is contacted.",
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
          "Prediction and reporting stay on the device. No server service is required for this fixture.",
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
            "Target fixture inputs",
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
        explanation: `${!canRun ? "A missing dependency prevents the known reading from completing the deployed path. " : !fixture ? "The complete path runs, but its known result differs from the expected result. " : "The known reading completes the checked path and matches the expected fixture. "}Local success is separate from checks at the deployed asset paths and target console.`,
        code: `const targetChecks = [${checks.join(", ")}];\nconst canLaunch = targetChecks.every(Boolean);`,
      };
    },
  },
};
