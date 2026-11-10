import { CAPSTONE_INVESTIGATIONS } from "./capstone-investigations";
import type {
  InvestigationControl,
  InvestigationGraphic,
  LessonInvestigationSpec,
} from "./investigation-types";
import {
  RETRIEVAL_EXAMPLE_NOW,
  RETRIEVAL_EXAMPLE_QUERIES,
  ragRetrievalExample,
} from "./rag-retrieval-example";

import { inspectReply, replyExample } from "./llm-report-examples";

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
  scaleGroup?: string,
): InvestigationGraphic => ({
  kind: "bars",
  label,
  labels,
  values,
  scaleGroup,
});

const cells = (
  label: string,
  values: Array<number | string>,
  columns = values.length,
): InvestigationGraphic => ({ kind: "cells", label, values, columns });

const round = (value: number) => Math.round(value * 100) / 100;

/** Small, inspectable calculations. None of these activities run a model or service. */
export const FLOW_INVESTIGATIONS: Record<string, LessonInvestigationSpec> = {
  "why-the-browser": {
    title: "The requirement that decides the recommendation",
    brief:
      "Follow the supplied policy in order. Keep local requirements, the download budget, and the latency preference separate.",
    boundary:
      "These inputs exercise the Challenge's authored decision policy. The 50 MB and 50 ms cutoffs are policy values, separate from the ship's one-reading-per-second deadline. This activity measures no download, network, or device speed.",
    controls: [
      choice("dataSensitive", "Input privacy requirement", [
        "Inputs may leave the device",
        "All inputs must stay local",
      ]),
      choice("needsOffline", "Connection requirement", [
        "A connection is allowed",
        "Predictions must work offline",
      ]),
      range("modelSizeMB", "Model download size (MB)", 50, 0, 100),
      range("latencyBudgetMs", "Latency preference (ms)", 49, 0, 1000),
    ],
    cases: [
      {
        id: "one",
        label: "Initial policy preset",
        description:
          "Starts at 50 MB and 49 ms, with neither hard local requirement. These are supplied boundary-check values.",
        values: {
          dataSensitive: 0,
          needsOffline: 0,
          modelSizeMB: 50,
          latencyBudgetMs: 49,
        },
      },
      {
        id: "batch",
        label: "Alternate policy preset",
        description:
          "Starts at 51 MB with sensitive inputs and a 500 ms preference. The download budget conflicts with the local requirement.",
        values: {
          dataSensitive: 1,
          needsOffline: 0,
          modelSizeMB: 51,
          latencyBudgetMs: 500,
        },
      },
    ],
    prediction: {
      prompt: "Which recommendation follows from these requirements?",
      choices: ["client", "server", "reconsider"],
    },
    evaluate: ({
      dataSensitive,
      needsOffline,
      modelSizeMB,
      latencyBudgetMs,
    }) => {
      const local = dataSensitive === 1 || needsOffline === 1;
      const overBudget = modelSizeMB > 50;
      const prefersClient = latencyBudgetMs < 50;
      const recommendation = overBudget
        ? local
          ? "reconsider"
          : "server"
        : local || prefersClient
          ? "client"
          : "server";
      const decisive = overBudget ? 1 : local ? 0 : 2;
      const reason = overBudget
        ? local
          ? "The model exceeds the download budget while predictions must stay local. A server would violate that requirement. Reconsider the model or download plan."
          : "The model exceeds the download budget and no requirement forces local predictions. The size rule chooses server before the latency preference."
        : local
          ? "The model fits the inclusive download budget and a hard requirement calls for local predictions. The latency preference cannot override that requirement."
          : prefersClient
            ? "The model fits the download budget, and the latency preference is strictly below 50 ms. The policy prefers client."
            : "The model fits the download budget, but there is no local requirement or latency preference below 50 ms. The policy chooses server.";
      return {
        graphics: [
          {
            ...cells(
              "Supplied policy inputs",
              [
                dataSensitive === 1
                  ? "All inputs stay local"
                  : "Inputs may leave",
                needsOffline === 1 ? "Must work offline" : "Connection allowed",
                modelSizeMB,
                latencyBudgetMs,
              ],
              2,
            ),
            labels: [
              "Privacy",
              "Connection",
              "Model size (MB)",
              "Latency preference (ms)",
            ],
          },
          pipeline(
            "Authored policy, checked in order",
            [
              `Local requirement: ${local ? "yes" : "no"}. Privacy and offline needs are hard requirements.`,
              `Download budget: ${modelSizeMB} MB ${overBudget ? ">" : "≤"} 50 MB. ${overBudget ? (local ? "Conflict: reconsider" : "Choose server") : "Model fits"}.`,
              overBudget || local
                ? "Latency preference does not decide this case."
                : `${latencyBudgetMs} ms ${prefersClient ? "<" : "≥"} 50 ms: choose ${recommendation}.`,
            ],
            [decisive],
          ),
          {
            ...cells(
              "Recommendation and decisive rule",
              [
                recommendation,
                [
                  "Local requirement, with a model inside budget",
                  "Download budget",
                  "Strict latency preference",
                ][decisive]!,
              ],
              2,
            ),
            labels: ["Recommendation", "Decisive rule"],
          },
          pipeline("Work that remains after this policy choice", [
            recommendation === "reconsider"
              ? "Change the conflicting model or download plan before choosing a location."
              : `Test the ${recommendation} design on supported devices and connections.`,
            "Offline use needs the app, runtime, model, and other required assets available locally.",
            "Measure completed predictions, startup, and memory use. This policy guarantees no response time.",
          ]),
        ],
        answer: recommendation,
        answerLabel: "Policy recommendation",
        explanation: `${reason} Exactly 50 MB fits. Exactly 50 ms does not satisfy the strict latency preference. These are supplied policy rules, not device measurements.`,
        code: `const supplied = ${JSON.stringify({ dataSensitive: dataSensitive === 1, needsOffline: needsOffline === 1, modelSizeMB, latencyBudgetMs })};\nconst checked = {\n  localRequired: supplied.dataSensitive || supplied.needsOffline,\n  exceedsDownloadBudget: supplied.modelSizeMB > 50,\n  belowLatencyPreference: supplied.latencyBudgetMs < 50,\n};\n// Decisive rule for this case: ${["local requirement with size inside budget", "download budget", "latency preference"][decisive]}.\n// Recommendation for these inputs: ${recommendation}.`,
      };
    },
  },
  "tensorflow-js-setup": {
    title: "A request, readiness, and the reported runtime",
    brief:
      "Move through one controlled startup. A preferred name can start, refuse, or be unknown. Read the actual selected test backend and version after readiness.",
    boundary:
      "This is a fixed illustration of the Challenge's simulated cold runtime. Its test names and probe versions are supplied examples, not results from your browser. The grader generates fresh names and a fresh test version. This activity imports no backend and measures no startup time.",
    controls: [
      choice(
        "scenario",
        "Startup scenario",
        [
          "No preferred name",
          "Preferred backend starts",
          "Registered preference refuses",
          "Preferred name is unregistered",
          "No backend can start",
        ],
        1,
      ),
      range("stage", "Startup point", 3, 0, 3),
    ],
    cases: [
      {
        id: "available",
        label: "Initial controlled preset",
        description:
          "Starts with an accepted preference. Fixed example names are probe-101 and good-202. The supplied test version is 4.22.0-probe.",
        values: { scenario: 1, stage: 3 },
      },
      {
        id: "failed",
        label: "Alternate controlled preset",
        description:
          "Starts with a registered preference that refuses. The ready runtime selects probe-707. Its supplied test version is 4.317.0-probe.",
        values: { scenario: 2, stage: 3 },
      },
    ],
    prediction: {
      prompt: "What backend can this controlled startup report at this point?",
      choices: [
        "not ready",
        "probe-101",
        "good-202",
        "probe-707",
        "good-808",
        "initialization error",
      ],
    },
    evaluate: ({ scenario, stage }, caseId) => {
      const fixture =
        caseId === "failed"
          ? {
              fallback: "probe-707",
              good: "good-808",
              bad: "bad-909",
              unknown: "never-606",
              version: "4.317.0-probe",
            }
          : {
              fallback: "probe-101",
              good: "good-202",
              bad: "bad-303",
              unknown: "never-404",
              version: "4.22.0-probe",
            };
      const preferred =
        scenario === 0
          ? undefined
          : scenario === 1
            ? fixture.good
            : scenario === 3
              ? fixture.unknown
              : fixture.bad;
      const request =
        scenario === 0
          ? "No preferred name. Skip setBackend()."
          : scenario === 1
            ? `setBackend('${preferred}') resolves true.`
            : scenario === 3
              ? `setBackend('${preferred}') rejects: name unregistered. Catch this request error.`
              : `setBackend('${preferred}') resolves false. The request did not start a backend.`;
      const failed = scenario === 4;
      const settled = scenario === 1 ? fixture.good : fixture.fallback;
      const readyReached = stage >= 2;
      const answer = !readyReached
        ? "not ready"
        : failed
          ? "initialization error"
          : settled;
      const backendRead = !readyReached
        ? "Not read before readiness"
        : failed
          ? "No result: ready() rejects"
          : settled;
      const versionRead =
        !readyReached || failed ? "Not read" : fixture.version;
      return {
        graphics: [
          {
            ...cells(
              "Controlled startup inputs",
              [preferred ?? "Omitted", fixture.version],
              2,
            ),
            labels: ["Supplied preference", "Supplied test version"],
          },
          pipeline(
            "Startup sequence",
            [
              "0. Import the supplied runtime. Its cold metadata is not ready to read.",
              `1. ${stage >= 1 ? request : "Preference request has not run."}`,
              `2. ${readyReached ? (failed ? "Await ready(): no backend starts, so the promise rejects." : "Await ready(): initialization resolves.") : "Readiness has not resolved."}`,
              `3. ${stage >= 3 ? (failed ? "Reject to the caller. Return no invented backend." : `Report backend ${settled} and version ${fixture.version}.`) : "The function has not returned a report."}`,
            ],
            [stage],
          ),
          {
            ...cells(
              "Metadata available after awaited readiness",
              [backendRead, versionRead],
              2,
            ),
            labels: ["Backend", "Version"],
          },
          pipeline("Readiness and return status", [
            !readyReached
              ? "Keep waiting. This controlled cold runtime exposes no backend name before ready() resolves."
              : failed
                ? "The initialization error reaches the caller."
                : stage >= 3
                  ? `The caller receives backend ${settled}, even when another name was requested.`
                  : `Ready metadata can now be read: backend ${settled}. The function has not returned yet.`,
            !readyReached || failed
              ? "No successful result object yet."
              : stage >= 3
                ? `Return the test version read from runtime.version.tfjs: ${fixture.version}.`
                : `Version ${fixture.version} is available to read. There is no returned report yet.`,
          ]),
        ],
        answer,
        answerLabel: "Controlled startup outcome",
        explanation: !readyReached
          ? `At startup point ${stage}, this cold check has not resolved ready(). Its getBackend() still returns null. Request acceptance and a completed metadata report are separate steps in this simulated check.`
          : failed
            ? "The preference returns false, then ready() rejects because no backend can start. Catching a preference request is allowed. Swallowing this initialization failure would invent a successful startup."
            : `${request} After awaited readiness, read ${settled} and ${fixture.version} from the simulated runtime. ${scenario === 1 ? "The accepted preference is the selected test backend." : scenario === 0 ? "With no preference, make no setBackend call." : "The refused or unknown name is not the selected backend."} These fixed example names are not your device report.`,
        code: `// Controlled illustration only. No real runtime starts here.\nconst point = ${stage};\nconst preference = ${JSON.stringify(preferred) ?? "undefined"};\nconst requestOutcome = ${JSON.stringify(scenario === 0 ? "not requested" : scenario === 1 ? "true" : scenario === 3 ? "unregistered error" : "false")};\nconst readiness = ${JSON.stringify(!readyReached ? "pending" : failed ? "rejected" : "resolved")};\nconst report = ${stage < 3 || failed ? "null" : JSON.stringify({ backend: settled, version: fixture.version })};`,
      };
    },
  },
  "model-loading": {
    title: "One model load, one owner",
    brief:
      "Follow the bridge asset from manifest and shard to copied shapes and cleanup.",
    boundary:
      "This models the deployed example's one-shard manifest and 3-input/1-output architecture. It makes no requests and creates no model. The coding exercise supplies a simulated loader whose returned shapes can differ.",
    controls: [
      choice("graph", "Manifest request", ["Fails", "Succeeds"], 1),
      range("shards", "Available weight shards", 1, 0, 1),
      choice("paths", "Shard path", [
        "Resolves beside the manifest",
        "Resolves to a missing file",
      ]),
      choice(
        "awaited",
        "Loader Promise",
        ["Still pending", "Resolved and awaited"],
        1,
      ),
      choice(
        "released",
        "Inspection model",
        ["Still retained", "Released after copying metadata"],
        1,
      ),
    ],
    cases: [
      {
        id: "small",
        label: "Bridge asset",
        description:
          "The deployed manifest names weights.bin: 673 float32 values, 2,692 bytes.",
        values: { graph: 1, shards: 1, paths: 0, awaited: 1, released: 1 },
      },
      {
        id: "large",
        label: "Interrupted hosting",
        description:
          "The same manifest is served while its weight file is unavailable.",
        values: { graph: 1, shards: 0, paths: 0, awaited: 1, released: 1 },
      },
    ],
    prediction: {
      prompt: "Which state has the inspection helper reached?",
      choices: [
        "files unavailable",
        "waiting for model",
        "cleanup pending",
        "inspection complete",
      ],
    },
    evaluate: (v) => {
      const availableShard = v.paths === 0 && v.shards === 1;
      const missing = (v.graph === 1 ? 0 : 1) + (availableShard ? 0 : 1);
      const ready = missing === 0 && v.awaited === 1;
      const answer =
        missing > 0
          ? "files unavailable"
          : !ready
            ? "waiting for model"
            : v.released === 1
              ? "inspection complete"
              : "cleanup pending";
      return {
        graphics: [
          pipeline("Manifest and its relative shard path", [
            "/models/deep-scan/model.json",
            "weightsManifest.paths: weights.bin",
            "/models/deep-scan/weights.bin",
          ]),
          cells(
            "Required files",
            [
              v.graph === 1 ? "Manifest available" : "Manifest unavailable",
              availableShard
                ? "Weight shard available"
                : "Weight shard unavailable",
              `Unavailable: ${missing} of 2 files`,
            ],
            3,
          ),
          pipeline("Promise, copied metadata, and owner", [
            ready
              ? "Await completed: one LayersModel"
              : "No completed model to inspect",
            ready
              ? "Copied input [null, 3], output [null, 1], layers 3"
              : "Shapes are not available yet",
            !ready
              ? "No inspected model to release"
              : v.released === 1
                ? "Model disposed. Plain metadata remains"
                : "Inspector still owns the model",
          ]),
        ],
        answer,
        answerLabel: "Inspection state",
        explanation: `${missing} required files are unavailable. ${ready ? "All three fields come from the same awaited model. null is the variable batch dimension. Copying metadata does not release model weights." : "The Promise must finish successfully before the helper reads model properties."} ${ready && v.released === 1 ? "The inspection helper has released its model. A prediction handler separately retains its own model until teardown." : ready ? "Release the inspection model in finally, including when reading a field fails." : "File availability alone does not establish a constructed model."}`,
        code: "const inspected = await tf.loadLayersModel(url);\ntry { console.log([...inspected.inputs[0].shape]); }\nfinally { inspected.dispose(); }",
      };
    },
  },
  "inference-pipeline": {
    title: "One reading from raw fields to a verdict",
    brief:
      "Inspect a feature's range, then change scaling, order, batch shape, or temporary ownership.",
    boundary:
      "This is JavaScript arithmetic for the exercise's linear feature-reading probes. It runs no TensorFlow model. These probes check preparation and cleanup, and establish no DEEP SCAN accuracy or score calibration. Displayed values are rounded.",
    controls: [
      choice("feature", "Inspect stored field", [
        "amplitude",
        "frequency: zero crossings",
        "phase: sample-pair angle",
      ]),
      choice(
        "scale",
        "Preprocessing",
        ["Raw values", "Declared min-max ranges"],
        1,
      ),
      choice("order", "Feature order", [
        "amplitude, frequency, phase",
        "phase, frequency, amplitude",
      ]),
      choice(
        "batch",
        "Input shape",
        ["Missing batch axis: [3]", "One row: [1, 3]"],
        1,
      ),
      choice(
        "cleanup",
        "Temporary ownership",
        ["Caller keeps the tensors", "Synchronous tidy releases them"],
        1,
      ),
    ],
    cases: [
      {
        id: "normal",
        label: "Three-field reading",
        description:
          "Amplitude probe with raw fields 512, 21, pi/2, in their declared order.",
      },
      {
        id: "changed",
        label: "Second reading",
        description: "The amplitude probe receives 1536, 0, -pi.",
      },
      {
        id: "boundary",
        label: "Threshold reading",
        description:
          "A phase-reading probe receives 0, 0, 0. Its normalized phase is 0.5.",
        values: { feature: 2 },
      },
    ],
    prediction: {
      prompt:
        "Which class does this probe return, or does the input shape fail?",
      choices: ["noise", "anomaly", "shape error"],
    },
    evaluate: (v, caseId) => {
      const raw =
        caseId === "changed"
          ? [1536, 0, -Math.PI]
          : caseId === "boundary"
            ? [0, 0, 0]
            : [512, 21, Math.PI / 2];
      const minima = [0, 0, -Math.PI];
      const maxima = [2048, 63, Math.PI];
      const normalized = raw.map(
        (value, index) =>
          (value - minima[index]!) / (maxima[index]! - minima[index]!),
      );
      const scaled = v.scale === 1 ? normalized : raw;
      const prepared = v.order === 0 ? scaled : [...scaled].reverse();
      const readIndex = caseId === "boundary" ? 2 : 0;
      const p = prepared[readIndex]!;
      const validShape = v.batch === 1;
      const verdict = p > 0.5 ? "anomaly" : "noise";
      const confidence = p > 0.5 ? p : 1 - p;
      const feature = v.feature!;
      const fieldNames = [
        "amplitude (counts)",
        "frequency (zero crossings)",
        "phase (radians)",
      ];
      return {
        graphics: [
          cells(
            "Selected raw field and saved range",
            [
              fieldNames[feature]!,
              `Raw: ${round(raw[feature]!)}`,
              `Range: ${round(minima[feature]!)} to ${round(maxima[feature]!)}`,
              `Scaled: ${round(normalized[feature]!)}`,
            ],
            2,
          ),
          cells(
            `Prepared input, shape ${validShape ? "[1, 3]" : "[3]"}`,
            prepared.map(round),
            3,
          ),
          pipeline(
            "Probe output and class rule",
            validShape
              ? [
                  `Probe reads input column ${readIndex + 1}`,
                  `Reference p = ${round(p)}`,
                  `p > 0.5: ${verdict}. Selected score ${round(confidence)}`,
                ]
              : [
                  "The probe expects one row of three features",
                  "Prediction fails for this flat input",
                  "There is no class score to read",
                ],
          ),
          cells(
            "Temporary tensor ownership",
            [
              v.cleanup === 1
                ? "No temporary tensor remains after tidy"
                : validShape
                  ? "Caller still owns input and output"
                  : "Caller must release input on failure",
              "The model keeps its own weights until teardown",
            ],
            2,
          ),
        ],
        answer: validShape ? verdict : "shape error",
        answerLabel: "Diagnostic result",
        explanation: `The stored frequency field is a zero-crossing count, and phase is a sample-pair angle in radians. ${validShape ? `The ${readIndex === 0 ? "amplitude" : "phase"} probe reads column ${readIndex + 1}, giving p=${p} and ${verdict} with selected score ${confidence}.` : "The missing batch axis prevents a usable prediction."} ${v.scale === 1 && v.order === 0 ? "The prepared values match the declared feature contract." : "A numerically readable output can still come from the wrong scale or order."} ${v.cleanup === 1 ? "A synchronous tidy releases temporary tensors even if prediction throws." : "Returning a JavaScript number does not dispose tensors."}`,
        code:
          v.cleanup === 1
            ? `const score = tf.tidy(() => {\n  const input = tf.tensor${validShape ? "2d([" : "1d("}[${prepared.join(", ")}]${validShape ? "]" : ""});\n  return (model.predict(input) as tf.Tensor).dataSync()[0];\n});`
            : `const input = tf.tensor${validShape ? "2d([" : "1d("}[${prepared.join(", ")}]${validShape ? "]" : ""});\nconst output = model.predict(input) as tf.Tensor;\nconst score = output.dataSync()[0];\n// The caller still owns input and output.`,
      };
    },
  },
  "onnx-runtime-web": {
    title: "Inputs, outputs, and timer boundaries",
    brief:
      "Follow one input into both paths. Compare supplied output scores, then inspect what each timer includes.",
    boundary:
      "This worksheet supplies scores and event costs. It runs no model and measures no device. The coding task uses a separate real TFJS model with a simulated ONNX session and clock. The downloadable lab runs real runtimes.",
    controls: [
      choice("input", "ONNX input values", [
        "Same three values",
        "Changed last value",
      ]),
      choice("load", "ONNX timer starts", [
        "After session loading",
        "Before session loading",
      ]),
      choice(
        "read",
        "Timers stop",
        ["After dispatch", "After output readback"],
        1,
      ),
      choice("output", "Supplied ONNX score", ["0.50005", "0.5001", "0.5002"]),
    ],
    cases: [
      {
        id: "nearby",
        label: "Nearby scores preset",
        description:
          "Start with supplied scores 0.5 and 0.50005, matching inputs, and completed-call timers.",
        values: { input: 0, load: 0, read: 1, output: 0 },
      },
      {
        id: "changed",
        label: "Changed score preset",
        description:
          "Start with supplied scores 0.5 and 0.5002. The input and timing rules stay the same.",
        values: { input: 0, load: 0, read: 1, output: 2 },
      },
    ],
    prediction: {
      prompt: "Do the supplied scores satisfy an absolute tolerance of 0.0001?",
      choices: ["true", "false"],
    },
    evaluate: (v) => {
      const tfjsScore = 0.5;
      const onnxScore = [0.50005, 0.5001, 0.5002][v.output!]!;
      const difference = Math.abs(tfjsScore - onnxScore);
      const outputsAgree = difference <= 0.0001;
      const tfjsMs = v.read === 1 ? 10 : 2;
      const onnxMs = (v.read === 1 ? 15 : 3) + (v.load === 1 ? 40 : 0);
      return {
        graphics: [
          cells(
            "Inputs sent to the two paths",
            [
              "TFJS: float32 [1, 3]",
              "[0.5, 0.3, 0.7]",
              "ONNX: float32 [1, 3]",
              v.input === 0 ? "[0.5, 0.3, 0.7]" : "[0.5, 0.3, 0.6]",
            ],
            2,
          ),
          pipeline("What each timer includes", [
            "TFJS model already loaded",
            v.load === 0
              ? "ONNX loading outside timer"
              : "ONNX loading adds 40 illustrative ms",
            v.read === 1
              ? "Stop after completed output readback"
              : "Stop after dispatch, before readback",
          ]),
          bars(
            "Illustrative timer intervals (ms)",
            ["TFJS path", "ONNX path"],
            [tfjsMs, onnxMs],
            "illustrative-comparison-ms",
          ),
          cells(
            "Supplied output comparison",
            [
              `TFJS score: ${tfjsScore}`,
              `ONNX score: ${onnxScore}`,
              `Absolute difference: ${Number(difference.toPrecision(7))}`,
              `outputsAgree: ${outputsAgree}`,
            ],
            2,
          ),
          pipeline("Interpretation checks", [
            v.input === 0
              ? "Both inputs match"
              : "Different inputs prevent a parity conclusion",
            v.load === 0
              ? "Session loading excluded"
              : "Loading included in the inference interval",
            v.read === 1
              ? "Both output reads completed"
              : "Timer ends before the result is ready",
            "Illustrative intervals cannot rank real runtimes",
          ]),
        ],
        answer: String(outputsAgree),
        answerLabel: "Score agreement",
        explanation: `The supplied scores differ by ${Number(difference.toPrecision(7))}, so outputsAgree is ${outputsAgree} at tolerance 0.0001. ${v.input === 0 ? "The two input arrays match." : "The input arrays differ, so agreement between these numbers would not establish conversion parity."} ${v.read === 1 ? "The timers include output readback." : "The timers omit unfinished work after dispatch."} ${v.load === 1 ? "Move session loading outside the ONNX inference timer." : "Session loading stays outside inference timing."} The chosen event costs illustrate timer boundaries. They measure neither speed nor accuracy.`,
        code: `// These are supplied worksheet outputs, not model predictions.
const tfjsScore = ${tfjsScore};
const onnxScore = ${onnxScore};
const difference = Math.abs(tfjsScore - onnxScore);
const outputsAgree = difference <= 0.0001;`,
      };
    },
  },
  "transformers-js": {
    title: "A report keeps its prediction when sorted",
    brief:
      "Select an original report. Follow its label and score into the returned queue, then inspect loading and batch calls.",
    boundary:
      "This worksheet reuses three supplied sentiment probes from the coding task. It simulates queue assembly and call counts. It downloads and runs no pretrained model. Scores describe supplied label preferences, not report urgency or verified accuracy.",
    controls: [
      range("report", "Original report index", 1, 0, 2),
      choice("pair", "Queue assembly", [
        "Pair reports before sorting",
        "Sort predictions before pairing",
      ]),
      choice("load", "Loading strategy", [
        "Load once for the batch",
        "Load once per report",
        "Load before checking for empty input",
      ]),
    ],
    cases: [
      {
        id: "reports",
        label: "Three reports",
        description: "Three supplied texts and positional predictions.",
        values: { report: 1 },
      },
      {
        id: "empty",
        label: "Empty batch",
        description:
          "No reports need classification. Check whether the factory is still called.",
        values: { report: 0 },
      },
    ],
    prediction: {
      prompt: "How many factory calls does this flow make?",
      unit: "calls",
      tolerance: 0,
    },
    evaluate: (v, caseId) => {
      const reports =
        caseId === "empty"
          ? []
          : [
              "coupling nominal",
              "coolant loop warning",
              "watch handover clean",
            ];
      const predictions = reports.length
        ? [
            { label: "POS", score: 0.5 },
            { label: "NEG", score: 0.99 },
            { label: "POS", score: 0.7 },
          ]
        : [];
      const sorted = [...predictions].sort(
        (left, right) => right.score - left.score,
      );
      const paired = reports.map((text, i) => ({
        text,
        ...(v.pair === 0 ? predictions[i] : sorted[i])!,
      }));
      const queue = paired.sort((left, right) => right.score - left.score);
      const factoryCalls =
        v.load === 2
          ? 1
          : v.load === 1
            ? reports.length
            : Number(reports.length > 0);
      const batchCalls = reports.length
        ? v.load === 1
          ? reports.length
          : 1
        : 0;
      const index = v.report!;
      const selected = reports[index];
      const prediction = predictions[index];
      const returned = selected
        ? queue.findIndex((row) => row.text === selected)
        : -1;
      const row = queue[returned];
      const matches =
        prediction &&
        row?.label === prediction.label &&
        row.score === prediction.score;
      return {
        graphics: [
          cells(
            "Supplied report and prediction pairs",
            reports.length
              ? reports.flatMap((text, i) => [
                  `${i}: ${text}`,
                  `${predictions[i]!.label}, score ${predictions[i]!.score}`,
                ])
              : ["No reports", "No predictions"],
            2,
          ),
          pipeline(
            "Selected report through the queue",
            selected && prediction && row
              ? [
                  `Original index ${index}: ${selected}`,
                  `Supplied: ${prediction.label}, ${prediction.score}`,
                  `Queue position ${returned + 1}: ${row.label}, ${row.score}`,
                  matches
                    ? "Original pairing preserved"
                    : "Prediction attached to the wrong report",
                ]
              : ["Empty input", "Return []", "No classifier call needed"],
          ),
          cells(
            "Returned queue: text, label, score",
            queue.length
              ? queue.flatMap((item) => [item.text, item.label, item.score])
              : ["[]"],
            queue.length ? 3 : 1,
          ),
          bars(
            "Simulated integration calls",
            ["Factory calls", "Classifier calls"],
            [factoryCalls, batchCalls],
          ),
        ],
        answer: factoryCalls,
        answerLabel: "Factory calls",
        explanation: reports.length
          ? `${factoryCalls} factory call${factoryCalls === 1 ? "" : "s"} and ${batchCalls} classifier call${batchCalls === 1 ? "" : "s"}. ${matches ? "The selected report retains its supplied label and score." : "The selected report has another report's label or score. Pair by original index before sorting."} Descending score puts the supplied NEG 0.99 prediction first when pairing is correct. The score does not measure urgency. The task requires one factory call and one full-batch classifier call.`
          : `There are no reports. Return [] with no classifier call. ${factoryCalls ? "This flow still calls the factory once. Move the empty-input return before loading." : "This flow avoids factory loading too."}`,
        code: `// Supplied positional predictions, without loading a real model.
const reports = ${JSON.stringify(reports)};
const predictions = ${JSON.stringify(predictions)};
${v.pair === 1 ? "predictions.sort((left, right) => right.score - left.score);\n" : ""}const queue = reports.map((text, index) => ({ text, ...predictions[index] }));
queue.sort((left, right) => right.score - left.score);`,
      };
    },
  },
  "model-profiling": {
    title: "Measure the complete prediction",
    brief:
      "Follow one input through the timer. Change when it starts and stops, then inspect which costs enter the average.",
    boundary:
      "This simulation uses chosen event costs and tensor counts. The Challenge uses a separate supplied clock and real model inventories. Neither timing table measures your device.",
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
          pipeline("One prediction through the timer", [
            "Create input before timing",
            "Start timer",
            "Queue prediction: 4 ms",
            v.read === 1
              ? "Finish and read result: 16 ms"
              : "Stop timer: 4 ms counted",
            v.read === 1
              ? "Stop timer: 20 ms counted"
              : "Finish and read outside timer: 16 ms",
            "Dispose input and output",
          ]),
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
        answerLabel: "Average counted time in this simulation",
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
      range("request", "Request to inspect", 3, 1, 5),
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
      const details: string[][] = [];
      const trace = inputs.map((input, i) => {
        const scaler = i === 2 && v.version === 1 ? "s2" : "s1";
        const identity = `${input}/m1/${scaler}`;
        const key = v.key === 1 ? identity : input;
        const found = cache.get(key);
        if (found !== undefined) {
          cache.delete(key);
          cache.set(key, found);
          details.push([
            `Key: ${key}`,
            `Stored identity: ${found}`,
            `Required identity: ${identity}`,
            "No model call",
            `LRU oldest to newest: ${[...cache.keys()].join(", ")}`,
          ]);
          if (found === identity) {
            hits++;
            return `${input}: valid hit`;
          }
          stale++;
          return `${input}: stale hit`;
        }
        misses++;
        cache.set(key, identity);
        const evicted =
          cache.size > v.capacity! ? cache.keys().next().value! : null;
        if (evicted !== null) cache.delete(evicted);
        details.push([
          `Key: ${key}`,
          `Computed identity: ${identity}`,
          `Model calls so far: ${misses}`,
          evicted === null ? "No eviction" : `Evicted key: ${evicted}`,
          `LRU oldest to newest: ${[...cache.keys()].join(", ")}`,
        ]);
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
          pipeline("Request trace", trace, [v.request! - 1]),
          cells("Selected request decision", details[(v.request ?? 3) - 1]!, 1),
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
    title: "The backend that actually starts",
    brief:
      "Follow the preference order through false results, thrown errors, readiness, and the returned backend name.",
    boundary:
      "These are controlled runtime outcomes, like the gpu-backend exercise. No backend starts here, and this activity measures no GPU support or performance.",
    controls: [
      choice(
        "success",
        "First successful attempt",
        ["First", "Second", "Third", "Fourth", "None"],
        2,
      ),
      choice(
        "failures",
        "Earlier attempts",
        ["Resolve false", "Throw errors", "Alternate false and error"],
        2,
      ),
      choice("ready", "Readiness outcome", ["Resolves", "Rejects"]),
    ],
    cases: [
      {
        id: "standard",
        label: "GPU-first order",
        description:
          "Try webgpu, webgl, wasm, then cpu. Start with success on the third attempt.",
        values: { success: 2 },
      },
      {
        id: "changed",
        label: "Reordered preferences",
        description:
          "Try wasm, cpu, webgl, then webgpu. Follow this supplied order rather than a hardcoded list.",
        values: { success: 1 },
      },
    ],
    prediction: {
      prompt: "What will this selector return after readiness?",
      choices: [
        "webgpu",
        "webgl",
        "wasm",
        "cpu",
        "prior-backend",
        "Startup rejects",
      ],
    },
    evaluate: (v, caseId) => {
      const names =
        caseId === "changed"
          ? ["wasm", "cpu", "webgl", "webgpu"]
          : ["webgpu", "webgl", "wasm", "cpu"];
      const attempts = names.slice(0, Math.min(4, v.success! + 1));
      const success = v.success! < names.length ? names[v.success!]! : null;
      const outcomes = attempts.map((name, index) => ({
        name,
        outcome:
          index === v.success
            ? "true"
            : v.failures === 1 || (v.failures === 2 && index % 2 === 1)
              ? "throws"
              : "false",
      }));
      const answer =
        v.ready === 1 ? "Startup rejects" : (success ?? "prior-backend");
      return {
        graphics: [
          cells("Supplied preference order", names, 1),
          pipeline(
            "Initialization attempts",
            outcomes.map(
              (item) =>
                `${item.name}: ${item.outcome}${item.outcome === "true" ? ", stop trying names" : ", try next name"}`,
            ),
          ),
          pipeline("Readiness and result", [
            "Await ready() once after attempts",
            v.ready === 1
              ? "Readiness rejects. Propagate the error."
              : "Readiness resolves",
            v.ready === 1
              ? "No backend value returned"
              : success
                ? `Return successful name: ${success}`
                : "All attempts failed. Read active name: prior-backend",
          ]),
          bars(
            "Controlled call counts",
            ["setBackend", "ready", "getBackend"],
            [attempts.length, 1, !success && v.ready === 0 ? 1 : 0],
          ),
        ],
        answer,
        answerLabel: "Selector result",
        explanation: `${attempts.length} initialization attempts run in the supplied order. A false result and a thrown error both allow the next attempt. ${success ? `Stop attempts after ${success} returns true.` : "No preference started. After readiness, ask the runtime for its active backend."} ${v.ready === 1 ? "A ready() rejection reaches the caller rather than becoming a success label." : `Readiness resolves, so return ${answer}.`} None of these controlled outcomes establishes device speed.`,
        code: `// Supplied outcomes for inspecting the selector contract.
const preference = ${JSON.stringify(names)};
const observedAttempts = ${JSON.stringify(outcomes)};
const returned = ${v.ready === 1 ? "null" : JSON.stringify(answer)};
// Await readiness once. Propagate rejection.`,
      };
    },
  },
  "llms-for-science": {
    title: "A reply crosses the JSON boundary",
    brief:
      "Locate the supplied reply's JSON, inspect one required field, then decide whether the client can return it.",
    boundary:
      "These are supplied callback replies. The activity parses and validates locally, with no model or API request. An accepted structure establishes no scientific claim or calibrated confidence.",
    controls: [
      choice("reply", "Supplied reply", [
        "Numeric score",
        "Zero score",
        "String score",
        "Missing reasoning",
        "Unsupported class",
        "Blank reasoning",
        "Broken JSON",
      ]),
      choice(
        "field",
        "Field to inspect",
        ["classification", "confidence", "reasoning"],
        1,
      ),
    ],
    cases: [
      {
        id: "plain",
        label: "JSON reply",
        description: "A supplied reply contains one JSON object.",
      },
      {
        id: "wrapped",
        label: "Reply with surrounding text",
        description:
          "The same object appears inside text with no other braces.",
      },
    ],
    prediction: {
      prompt: "Can the client return these checked fields?",
      choices: ["Accepted fields", "Rejected reply"],
    },
    evaluate: (v, caseId) => {
      const raw = replyExample(v.reply!, caseId === "wrapped");
      const inspected = inspectReply(raw);
      const selected = inspected.checks[v.field!]!;
      const value = inspected.parsed?.[selected.field];
      return {
        graphics: [
          { ...cells("Supplied raw reply", [raw], 1), layout: "prose" },
          pipeline("Reply parsing", [
            inspected.json ?? "No complete JSON block",
            inspected.parseError || "JSON parsed into fields",
          ]),
          cells(
            "Selected required field",
            [
              selected.field,
              value === undefined ? "missing" : JSON.stringify(value),
              `Type: ${typeof value}`,
              selected.rule,
            ],
            2,
          ),
          pipeline(
            "Required field checks",
            inspected.checks.map(
              (check) => `${check.field}: ${check.valid ? "valid" : "invalid"}`,
            ),
            inspected.checks.flatMap((check, i) => (check.valid ? [i] : [])),
          ),
          pipeline("Client result", [
            inspected.accepted
              ? "Return checked fields"
              : "Throw before using the reply",
            "Claims still need evidence review",
          ]),
        ],
        answer: inspected.accepted ? "Accepted fields" : "Rejected reply",
        answerLabel: "Reply boundary result",
        explanation:
          inspected.parseError ||
          `${selected.field} must be ${selected.rule}. ${selected.valid ? "This field passes." : "This field fails."} ${inspected.accepted ? "Every required field passes, including a numeric zero when supplied. Extra fields are allowed. The reasoning still needs a source check." : "Reject the reply if any required field fails. Do not coerce a numeric string or use truthiness to reject zero."}`,
        code: `const response = ${JSON.stringify(raw)};
const located = response.match(/\\{[\\s\\S]*\\}/)?.[0];
// Check JSON parsing and each required field before returning it.`,
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
    title: "Matching records and omitted evidence",
    brief:
      "Apply the query's field filters, count all matches, then keep the first twenty in database order.",
    boundary:
      "These supplied diagnostic records come from the retrieve-signals exercise checks. This local reference calculation makes no model request and does not read the mission archive. Its frequency values are supplied, not measured here.",
    controls: [
      choice("claim", "Claim to inspect", [
        "Frequency from keeper",
        "Wrong unit",
        "Wrong source",
        "Swapped field",
        "Repeated sum citation",
        "Unsupported interpretation",
      ]),
      choice(
        "query",
        "Query",
        ["No recognized filters", "Band-7 anomalies, last 72 hours", "Band-3"],
        1,
      ),
    ],
    cases: [
      {
        id: "filters",
        label: "Four supplied records",
        description:
          "The exercise's four-row check has a wrong band, a noise record, an old record, and one keeper. Follow which rows pass every active filter.",
      },
      {
        id: "capped",
        label: "Forty supplied records",
        description:
          "The exercise's larger check has forty rows. Every fourth row belongs to Band-3. All rows are one hour old and classified as anomalies.",
      },
    ],
    prediction: {
      prompt: "How many matching records will the twenty-row limit leave out?",
      unit: "records",
    },
    evaluate: (v, caseId) => {
      const records = ragRetrievalExample(caseId);
      const query = RETRIEVAL_EXAMPLE_QUERIES[v.query!]!;
      const band = query.match(/band[- ]?(\w+)/i)?.[1]?.toLowerCase();
      const hours = query.match(/(\d+)\s*hours/i)?.[1];
      const anomaly = /anomal/i.test(query);
      const inspected = records.map((record) => {
        const timestamp = Date.parse(record.timestamp);
        const reasons = [
          band && record.band.toLowerCase() !== band ? "different band" : null,
          hours &&
          !(
            timestamp > RETRIEVAL_EXAMPLE_NOW - Number(hours) * 3600000 &&
            timestamp <= RETRIEVAL_EXAMPLE_NOW
          )
            ? "outside time window"
            : null,
          anomaly && record.classification !== "anomaly"
            ? "different classification"
            : null,
        ].filter(Boolean);
        return { record, reasons };
      });
      const matches = inspected
        .filter(({ reasons }) => reasons.length === 0)
        .map(({ record }) => record);
      const returned = matches.slice(0, 20);
      const omitted = matches.length - returned.length;
      const claimIndex = v.claim ?? 0;
      const claims = [
        [
          "keeper",
          "frequencyHz",
          "73.4",
          "Hz",
          "Supported: one cited frequency field",
        ],
        [
          "keeper",
          "frequencyHz",
          "73.4",
          "events",
          "Rejected: frequencyHz requires Hz",
        ],
        [
          "missing-id",
          "frequencyHz",
          "73.4",
          "Hz",
          "Rejected: the cited row does not exist",
        ],
        [
          "keeper",
          "eventCount",
          "73.4",
          "events",
          "Rejected: keeper contributes one event",
        ],
        [
          "keeper, keeper",
          "eventCount",
          "2",
          "events",
          "Rejected: a sum cannot repeat a cited row",
        ],
        [
          "keeper",
          "text",
          "The signal is safe",
          "none",
          "Unverified: the checker has no rule for this interpretation",
        ],
      ];
      const claim = claims[claimIndex]!;
      return {
        graphics: [
          cells(
            "Query and fixed clock",
            [query, new Date(RETRIEVAL_EXAMPLE_NOW).toISOString()],
            1,
          ),
          cells(
            caseId === "capped"
              ? "First eight supplied records, of forty"
              : "Supplied records in database order",
            inspected
              .slice(0, 8)
              .map(
                ({ record, reasons }) =>
                  `${record.id}: Band-${record.band}, ${record.classification}, ${Math.round((RETRIEVAL_EXAMPLE_NOW - Date.parse(record.timestamp)) / 3600000)} hours old. ${reasons.length ? reasons.join(", ") : "Matches every active filter"}.`,
              ),
            1,
          ),
          cells(
            "Returned record IDs",
            [
              returned.length
                ? returned.map((record) => record.id).join(", ")
                : "No matching records",
            ],
            1,
          ),
          cells(
            "Omitted matching record IDs",
            [
              omitted
                ? matches
                    .slice(20)
                    .map((record) => record.id)
                    .join(", ")
                : "No matching records omitted",
            ],
            1,
          ),
          bars(
            "Retrieval counts",
            ["All matches", "Returned", "Omitted matches"],
            [matches.length, returned.length, omitted],
            "retrieval-counts",
          ),
          cells(
            "Selected structured claim",
            [
              `Sources: ${claim[0]}`,
              `Field: ${claim[1]}`,
              `Value: ${claim[2]}`,
              `Unit: ${claim[3]}`,
              claim[4]!,
            ],
            1,
          ),
          cells(
            "Cited evidence mapping",
            [
              "Separate supplied keeper evidence: eventCount 1 events",
              "Raw frequency 73.4 becomes frequencyHz 73.4 Hz",
              "This fixed claim example is separate from the selected retrieval query. A source omitted from a result cannot support its report.",
            ],
            1,
          ),
          cells(
            "Result metadata",
            [`matched: ${matches.length}`, `truncated: ${omitted > 0}`],
            1,
          ),
        ],
        answer: omitted,
        answerLabel: "Matching records omitted",
        explanation: `${matches.length} records pass every active filter. The result keeps ${returned.length} in database order and leaves out ${omitted} matching records. Count before applying the cap. These omissions come from the row limit, with no ranking by relevance or anomaly score. A later claim checker must still check the cited row, field, unit, and calculation.`,
        code: `const rows = matches.slice(0, 20);\nconst matched = matches.length;\nconst truncated = matched > rows.length;`,
      };
    },
  },
  "report-generation": {
    title: "A reviewed section reaches the report",
    brief:
      "Select an authored section, inspect its supplied review flag, and trace its body or omission into the assembled report.",
    boundary:
      "The mixed case uses the exact section texts from the generate-report exercise check. The review variants are controlled comparisons. No prose is generated, no new claim is verified, and no report is sent.",
    controls: [
      choice(
        "section",
        "Section to inspect",
        ["Executive Summary", "Hypotheses", "Results"],
        1,
      ),
      choice("review", "Review flags", [
        "Supplied mixed flags",
        "Approve every section",
        "Withhold every section",
      ]),
    ],
    cases: [
      {
        id: "mixed",
        label: "Supplied mixed review",
        description:
          "Executive Summary and Results passed earlier review. Hypotheses did not. These flags are supplied inputs to the formatter.",
      },
      {
        id: "empty",
        label: "No supplied sections",
        description:
          "An empty section list leaves only the title and its following blank line.",
      },
    ],
    prediction: {
      prompt: "How many section bodies will the assembled report include?",
      unit: "sections",
    },
    evaluate: (v, caseId) => {
      const sections =
        caseId === "empty"
          ? []
          : [
              {
                heading: "Executive Summary",
                content: "12,001 events catalogued.",
                validated: true,
              },
              {
                heading: "Hypotheses",
                content: "The pulse train is a reply.",
                validated: false,
              },
              {
                heading: "Results",
                content: "153 anomalous, 1 unclassified.",
                validated: true,
              },
            ].map((section) => ({
              ...section,
              validated:
                v.review === 1
                  ? true
                  : v.review === 2
                    ? false
                    : section.validated,
            }));
      const selected = sections[v.section!];
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
            "Selected section handoff",
            selected
              ? [
                  selected.heading,
                  selected.content,
                  `validated: ${selected.validated}`,
                  selected.validated
                    ? "Include this body at its original position"
                    : "Include this heading in Withheld. Omit its body.",
                ]
              : [
                  "No supplied sections",
                  "No body or omission list",
                  "Return the title and blank line",
                ],
            1,
          ),
          pipeline(
            "Recorded review decisions",
            sections.length
              ? sections.map(
                  (section) =>
                    `${section.heading}: ${section.validated ? "approved" : "withheld"}`,
                )
              : ["No review flags supplied"],
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
        explanation: `${withheld.length ? `Withheld: ${withheld.map((section) => section.heading).join(", ")}. Their headings remain visible and their bodies are absent.` : "No section is withheld, so omit the Withheld block."} ${approved.length} approved bodies retain their input order. The flags record earlier supplied decisions. The assembler cannot approve a changed claim. Farah reviews the assembled report before release.`,
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
  "system-architecture": CAPSTONE_INVESTIGATIONS["system-architecture"]!,
  "ci-cd-pipeline": CAPSTONE_INVESTIGATIONS["ci-cd-pipeline"]!,
  monitoring: CAPSTONE_INVESTIGATIONS["monitoring"]!,
  documentation: CAPSTONE_INVESTIGATIONS["documentation"]!,
  launch: CAPSTONE_INVESTIGATIONS["launch"]!,
};
