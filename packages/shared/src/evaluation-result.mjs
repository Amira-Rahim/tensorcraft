import { EVALUATION_FIXTURE } from "./evaluation-fixture.mjs";

export { EVALUATION_FIXTURE };

const freeze = (value) => {
  if (value && typeof value === "object") {
    for (const item of Object.values(value)) freeze(item);
    Object.freeze(value);
  }
  return value;
};

export const EVALUATION_CONTEXT_KEYS = Object.freeze([
  "definitionId",
  "contractVersion",
  "fixtureId",
  "fixtureVersion",
  "captureStatus",
  "evaluationSourceStatus",
  "trainingSourceStatus",
  "fitHistoryStatus",
  "recordingStatus",
  "trainingLogStatus",
  "modelStateStatus",
  "modelSupportStatus",
  "measurementStatus",
  "submittedEvaluationStatus",
  "observedFitCount",
  "modelFitCount",
  "trainingRows",
  "evaluationRows",
  "requestedEpochs",
  "completedEpochs",
  "batchSize",
  "shuffle",
  "initialEpoch",
  "validationSplit",
  "parameterCount",
  "inputWidth",
  "layer1",
  "layer2",
  "layer3",
  "optimizer",
  "loss",
  "metric",
  "decisionRule",
  "class0",
  "class1",
  "learnerDiagnosis",
  "callbacksPresent",
  "evaluationBatchSize",
]);

const caseColumns = [
  "Row ID",
  "Source",
  "Feature 1",
  "Feature 2",
  "Feature 3",
  "Label",
  "Score",
];
export const EVALUATION_ROLES = freeze({
  measuredScores: {
    id: "measured-scores",
    title: "The scores from your evaluation run",
    columns: ["Dataset", "Rows", "Loss", "Accuracy"],
  },
  runContext: {
    id: "run-context",
    title: "Evaluation run context",
    columns: ["Key", "Value", "Detail"],
  },
  generatedCases: {
    id: "generated-cases",
    title: "Captured evaluation cases 0-39",
    columns: caseColumns,
  },
  authoredCases: {
    id: "authored-cases",
    title: "Captured evaluation cases 40-42",
    columns: [...caseColumns],
  },
});

// Explicit status/detail pairs. Array order also documents reason priority.
export const EVALUATION_STATUS_REASONS = freeze({
  captureStatus: {
    complete: [null],
    partial: [
      "capture-error",
      "unsupported-model",
      "missing-cases",
      "missing-evaluation",
      "missing-training-log",
    ],
    unavailable: [
      "capture-error",
      "unsupported-model",
      "missing-cases",
      "missing-evaluation",
      "missing-training-log",
    ],
  },
  evaluationSourceStatus: {
    matched: [null],
    mismatch: [
      "shape-mismatch",
      "row-order-mismatch",
      "feature-mismatch",
      "label-mismatch",
    ],
    unknown: ["input-read-failed", "unsupported-runtime"],
  },
  trainingSourceStatus: {
    matched: [null],
    mismatch: ["shape-mismatch", "pair-mismatch", "label-mismatch"],
    unknown: ["input-read-failed", "missing-fit", "recording-overflow"],
  },
  fitHistoryStatus: {
    matched: [null],
    mismatch: [
      "wrong-model",
      "evaluation-rows-in-fit",
      "extra-model-fit",
      "failed-fit",
      "wrong-schedule",
      "validation-data-present",
    ],
    unknown: [
      "callbacks-unobserved",
      "missing-fit",
      "recording-overflow",
      "fit-in-flight",
      "unsupported-fit",
    ],
  },
  recordingStatus: {
    complete: [null],
    overflow: ["recording-overflow"],
    "in-flight": ["fit-in-flight"],
    unsupported: ["unsupported-fit"],
  },
  trainingLogStatus: {
    available: [null],
    partial: [
      "history-shape-mismatch",
      "metric-unavailable",
      "nonfinite-metric",
      "failed-fit",
    ],
    unavailable: [
      "callbacks-unobserved",
      "history-shape-mismatch",
      "metric-unavailable",
      "nonfinite-metric",
      "failed-fit",
      "missing-fit",
    ],
  },
  modelStateStatus: {
    matched: [null],
    changed: ["changed-during-capture", "weights-changed", "config-changed"],
    unknown: ["checkpoint-unavailable"],
  },
  modelSupportStatus: {
    supported: [null],
    unsupported: ["unsupported-model", "unsupported-metric", "over-limit"],
    unknown: ["model-unavailable"],
  },
  measurementStatus: {
    consistent: [null],
    inconsistent: ["changed-during-capture", "accuracy-count-mismatch"],
    unknown: ["missing-cases", "missing-evaluation", "prediction-failed"],
    unavailable: [
      "nonfinite-metric",
      "missing-cases",
      "missing-evaluation",
      "prediction-failed",
    ],
  },
  submittedEvaluationStatus: {
    matched: [null],
    mismatch: ["value-mismatch", "invalid-result-shape"],
    unknown: ["metric-unavailable", "missing-evaluation"],
  },
});

const roles = Object.values(EVALUATION_ROLES);
const activations = [
  "relu",
  "sigmoid",
  "linear",
  "tanh",
  "elu",
  "selu",
  "softplus",
  "softsign",
  "hardSigmoid",
  "softmax",
];
const optimizers = ["Adam", "SGD", "RMSProp", "Adagrad", "Adadelta", "Adamax"];
const diagnoses = ["large-gap", "low-scores", "no-gap-warning"];
const finite = (v, low, high = Infinity) =>
  typeof v === "number" && Number.isFinite(v) && v >= low && v <= high;
const integer = (v, low, high) => Number.isInteger(v) && finite(v, low, high);
const optional = (v, check) => v === null || check(v);
const equal = (a, b) => a.length === b.length && a.every((v, i) => v === b[i]);
const failures = new WeakSet();

function fail(code, field) {
  const issue = { code, ...(field ? { field } : {}) };
  failures.add(issue);
  throw issue;
}

// Inspect descriptors instead of executing getters or toJSON on unknown input.
function ownObject(value, allowed) {
  if (!value || typeof value !== "object" || Array.isArray(value))
    fail("invalid-object");
  const prototype = Object.getPrototypeOf(value);
  if (prototype !== Object.prototype && prototype !== null)
    fail("invalid-object");
  const properties = Object.getOwnPropertyDescriptors(value);
  if (
    Reflect.ownKeys(properties).some(
      (key) => typeof key !== "string" || !allowed.includes(key),
    )
  )
    fail("unexpected-field");
  const result = {};
  for (const key of Object.keys(properties)) {
    if (!("value" in properties[key])) fail("accessor-field", key);
    result[key] = properties[key].value;
  }
  return result;
}

function denseArray(value, min, max) {
  if (!Array.isArray(value) || value.length < min || value.length > max)
    fail("invalid-array");
  const properties = Object.getOwnPropertyDescriptors(value);
  if (Reflect.ownKeys(properties).length !== value.length + 1)
    fail("invalid-array");
  const out = [];
  for (let i = 0; i < value.length; i++) {
    if (!properties[i] || !("value" in properties[i]))
      fail("sparse-or-accessor-array");
    out.push(properties[i].value);
  }
  return out;
}

function text(value, max) {
  if (typeof value !== "string" || value.length > max) fail("invalid-text");
  return value;
}

function copyArtifacts(input) {
  const artifacts = denseArray(input, 0, 4).map((raw) => {
    const a = ownObject(raw, ["kind", "title", "summary", "columns", "rows"]);
    if (a.kind !== "table") fail("unsupported-artifact-kind");
    const columns = denseArray(a.columns, 1, 12).map((v) => text(v, 180));
    const result = {
      kind: "table",
      title: text(a.title, 180),
      columns,
      rows: denseArray(a.rows, 1, 40).map((row) =>
        denseArray(row, columns.length, columns.length).map((v) => {
          if (
            v === null ||
            typeof v === "boolean" ||
            (typeof v === "number" && Number.isFinite(v))
          )
            return v;
          return text(v, 1200);
        }),
      ),
    };
    if (a.summary !== undefined) result.summary = text(a.summary, 1200);
    return result;
  });
  if (
    new globalThis.TextEncoder().encode(JSON.stringify(artifacts)).length >
    65536
  )
    fail("artifact-byte-limit");
  return artifacts;
}

function readContext(rows) {
  if (rows.length !== EVALUATION_CONTEXT_KEYS.length) fail("context-row-count");
  const values = {},
    details = {};
  rows.forEach(([key, value, detail], i) => {
    if (key !== EVALUATION_CONTEXT_KEYS[i]) fail("context-key-order");
    values[key] = value;
    details[key] = detail;
  });
  const fixed = {
    definitionId: "deep-orbit.evaluation-cases",
    contractVersion: 1,
    fixtureId: "deep-scan-evaluation-100-43",
    fixtureVersion: "1",
    decisionRule: 0.5,
    class0: 0,
    class1: 1,
    evaluationBatchSize: 32,
  };
  for (const [key, value] of Object.entries(fixed))
    if (values[key] !== value) fail("context-identity", key);
  const specialDetails = new Set([
    ...Object.keys(EVALUATION_STATUS_REASONS),
    "layer1",
    "layer2",
    "layer3",
    "optimizer",
    "metric",
    "decisionRule",
    "class0",
    "class1",
    "learnerDiagnosis",
  ]);
  for (const key of EVALUATION_CONTEXT_KEYS)
    if (!specialDetails.has(key) && details[key] !== null)
      fail("context-detail", key);
  for (const [key, statuses] of Object.entries(EVALUATION_STATUS_REASONS)) {
    if (
      typeof values[key] !== "string" ||
      !Object.hasOwn(statuses, values[key]) ||
      !statuses[values[key]].includes(details[key])
    )
      fail("status-reason-pair", key);
  }
  const bounds = {
    observedFitCount: [0, 16, false],
    modelFitCount: [0, 16, true],
    trainingRows: [0, 8192, true],
    evaluationRows: [0, 8192, true],
    requestedEpochs: [0, 1000000, true],
    completedEpochs: [0, 1000000, true],
    batchSize: [1, 8192, true],
    initialEpoch: [0, 1000000, true],
    parameterCount: [0, 8192, true],
    inputWidth: [0, 8192, true],
  };
  for (const [key, [min, max, nullable]] of Object.entries(bounds)) {
    if (!(nullable && values[key] === null) && !integer(values[key], min, max))
      fail("context-value", key);
  }
  for (const key of ["shuffle", "callbacksPresent"])
    if (!optional(values[key], (v) => typeof v === "boolean"))
      fail("context-value", key);
  if (!optional(values.validationSplit, (v) => finite(v, 0) && v < 1))
    fail("context-value", "validationSplit");
  for (const key of ["layer1", "layer2", "layer3"]) {
    if (
      !optional(values[key], (v) => integer(v, 1, 8192)) ||
      !optional(details[key], (v) => activations.includes(v))
    )
      fail("context-layer", key);
  }
  if (
    !optional(values.optimizer, (v) => optimizers.includes(v)) ||
    !optional(details.optimizer, (v) => finite(v, 0))
  )
    fail("context-optimizer");
  if (!optional(values.loss, (v) => v === "binaryCrossentropy"))
    fail("context-loss");
  if (
    !optional(values.metric, (v) => v === "binaryAccuracy") ||
    !optional(details.metric, (v) =>
      ["accuracy", "acc", "binaryAccuracy"].includes(v),
    )
  )
    fail("context-metric");
  if (
    details.decisionRule !== "gt" ||
    details.class0 !== "calm" ||
    details.class1 !== "flagged"
  )
    fail("context-decision-rule");
  if (
    !["present", "invalid", "missing"].includes(details.learnerDiagnosis) ||
    (details.learnerDiagnosis === "present"
      ? !diagnoses.includes(values.learnerDiagnosis)
      : values.learnerDiagnosis !== null)
  )
    fail("context-diagnosis");
  return { values, details };
}

function readMetrics(rows) {
  if (
    rows.length !== 2 ||
    rows[0][0] !== "Final training log" ||
    rows[1][0] !== "Final model evaluation"
  )
    fail("metric-row-identity");
  const metrics = rows.map(([, count, loss, accuracy]) => {
    if (
      !optional(count, (v) => integer(v, 0, 8192)) ||
      !optional(loss, (v) => finite(v, 0)) ||
      !optional(accuracy, (v) => finite(v, 0, 1))
    )
      fail("metric-value");
    return { rows: count, loss, accuracy };
  });
  return { training: metrics[0], evaluation: metrics[1] };
}

function readCases(rows, start, end) {
  let previous = start - 1;
  return rows.map(([position, source, f1, f2, f3, label, score]) => {
    if (!integer(position, start, end) || position <= previous)
      fail("case-id-order-or-partition");
    previous = position;
    if (
      !["generated", "authored", "unknown"].includes(source) ||
      ![f1, f2, f3, score].every((v) => finite(v, 0, 1)) ||
      !integer(label, 0, 1)
    )
      fail("case-value");
    const canonical = EVALUATION_FIXTURE.evaluation[position];
    const matches = equal([position, f1, f2, f3, label], canonical);
    const expectedSource = position < 40 ? "generated" : "authored";
    if (source !== "unknown" && (!matches || source !== expectedSource))
      fail("case-source-forgery");
    const predicted = score > 0.5 ? 1 : 0;
    const category =
      label === 1
        ? predicted === 1
          ? "true-positive"
          : "false-negative"
        : predicted === 1
          ? "false-positive"
          : "true-negative";
    return {
      position,
      canonicalId: source === "unknown" ? null : position,
      source,
      features: [f1, f2, f3],
      label,
      score,
      predicted,
      category,
    };
  });
}

function emptyResult(issue, invalid = false) {
  return freeze({
    status: "unavailable",
    integrity: {
      status: invalid ? "invalid" : "valid",
      issues: issue ? [issue] : [],
    },
    context: null,
    cases: [],
    caseCoverage: {
      status: "unavailable",
      available: 0,
      total: 43,
      missingIds: EVALUATION_FIXTURE.evaluation.map((r) => r[0]),
    },
    counts: null,
    metrics: { training: null, evaluation: null },
    metricAvailability: {
      training: "unavailable",
      evaluation: "unavailable",
      comparison: false,
      summary: false,
    },
    sourceStatus: null,
    fitStatus: null,
    stateContinuity: null,
    diagnosis: null,
  });
}

/** Decode both current artifacts and persisted artifacts without a model runtime. */
export function decodeEvaluationResult(unknownArtifacts) {
  try {
    const artifacts = copyArtifacts(unknownArtifacts);
    const selected = {};
    let previousRole = -1;
    for (const artifact of artifacts) {
      const index = roles.findIndex((role) => role.title === artifact.title);
      if (index < 0) fail("unknown-role");
      if (index <= previousRole) fail("duplicate-or-unordered-role");
      previousRole = index;
      const role = roles[index];
      if (!equal(artifact.columns, role.columns)) fail("role-columns", role.id);
      selected[role.id] = artifact;
    }
    if (!selected["run-context"])
      return emptyResult({ code: "missing-context" });
    const context = readContext(selected["run-context"].rows);
    const v = context.values,
      d = context.details;
    const metrics = selected["measured-scores"]
      ? readMetrics(selected["measured-scores"].rows)
      : { training: null, evaluation: null };
    const cases = [
      ...(selected["generated-cases"]
        ? readCases(selected["generated-cases"].rows, 0, 39)
        : []),
      ...(selected["authored-cases"]
        ? readCases(selected["authored-cases"].rows, 40, 42)
        : []),
    ];
    const positions = new Set(cases.map((row) => row.position));
    const missingIds = EVALUATION_FIXTURE.evaluation
      .map((row) => row[0])
      .filter((id) => !positions.has(id));
    const complete = missingIds.length === 0;
    const issues = [];
    const issue = (code, field) =>
      issues.push({ code, ...(field ? { field } : {}) });
    const has = (metric) =>
      metric !== null &&
      metric.rows !== null &&
      metric.loss !== null &&
      metric.accuracy !== null;
    const availability = (metric) =>
      has(metric)
        ? "available"
        : metric && (metric.loss !== null || metric.accuracy !== null)
          ? "partial"
          : "unavailable";
    const trainingAvailable =
      has(metrics.training) && v.trainingLogStatus === "available";
    const evaluationAvailable = has(metrics.evaluation);
    const rawCounts = {
      truePositive: 0,
      trueNegative: 0,
      falsePositive: 0,
      falseNegative: 0,
      correct: 0,
      total: cases.length,
      accuracy: null,
    };
    for (const row of cases) {
      if (row.label === 1)
        rawCounts[row.predicted === 1 ? "truePositive" : "falseNegative"]++;
      else rawCounts[row.predicted === 1 ? "falsePositive" : "trueNegative"]++;
      if (row.predicted === row.label) rawCounts.correct++;
    }
    if (complete) rawCounts.accuracy = rawCounts.correct / 43;
    const agrees =
      complete &&
      evaluationAvailable &&
      metrics.evaluation.rows === 43 &&
      Math.abs(rawCounts.accuracy - metrics.evaluation.accuracy) <= 1e-6;

    for (const [field, metric] of [
      ["trainingRows", metrics.training],
      ["evaluationRows", metrics.evaluation],
    ]) {
      if (metric && metric.rows !== v[field])
        issue("context-metric-row-mismatch", field);
    }
    if (v.modelFitCount !== null && v.modelFitCount > v.observedFitCount)
      issue("context-fit-count");
    if (v.trainingSourceStatus === "matched" && v.trainingRows !== 100)
      issue("context-training-source");
    if (
      v.evaluationSourceStatus === "matched" &&
      (v.evaluationRows !== 43 || cases.some((row) => row.source === "unknown"))
    )
      issue("context-evaluation-source");
    if (
      cases.length &&
      (v.evaluationRows === null ||
        cases.some((row) => row.position >= v.evaluationRows))
    )
      issue("context-case-coverage");
    if (v.trainingLogStatus === "available" && !has(metrics.training))
      issue("context-training-log");
    if (
      v.trainingLogStatus === "unavailable" &&
      metrics.training &&
      (metrics.training.loss !== null || metrics.training.accuracy !== null)
    )
      issue("context-training-log");
    if (
      v.callbacksPresent === true &&
      (v.trainingLogStatus !== "unavailable" ||
        d.trainingLogStatus !== "callbacks-unobserved")
    )
      issue("context-callback-log");
    if (
      v.fitHistoryStatus === "matched" &&
      (v.recordingStatus !== "complete" ||
        v.modelFitCount !== 1 ||
        v.observedFitCount < 1 ||
        v.requestedEpochs !== 30 ||
        v.completedEpochs !== 30 ||
        v.batchSize !== 16 ||
        v.initialEpoch !== 0 ||
        v.validationSplit !== 0 ||
        v.callbacksPresent !== false)
    )
      issue("context-fit-history");
    if (v.modelSupportStatus === "supported") {
      const units = [v.layer1, v.layer2, v.layer3];
      // The wire does not retain useBias, so widths cannot reconstruct countParams.
      if (
        v.inputWidth !== 3 ||
        units.some((n) => n === null) ||
        [d.layer1, d.layer2, d.layer3].some((a) => a === null) ||
        v.layer3 !== 1 ||
        d.layer3 !== "sigmoid" ||
        v.parameterCount === null ||
        v.optimizer === null ||
        v.loss !== "binaryCrossentropy" ||
        v.metric !== "binaryAccuracy"
      )
        issue("context-model-support");
    }
    if (
      v.measurementStatus === "consistent" &&
      (!agrees ||
        v.modelSupportStatus !== "supported" ||
        d.modelStateStatus === "changed-during-capture")
    )
      issue("context-measurement-consistency");
    if (complete && evaluationAvailable && !agrees)
      issue("accuracy-count-mismatch");
    if (d.measurementStatus === "accuracy-count-mismatch" && agrees)
      issue("context-measurement-reason");
    if (
      (d.measurementStatus === "missing-cases" && complete) ||
      (["missing-evaluation", "nonfinite-metric"].includes(
        d.measurementStatus,
      ) &&
        evaluationAvailable)
    )
      issue("context-measurement-reason");
    if (
      d.measurementStatus === "changed-during-capture" &&
      d.modelStateStatus !== "changed-during-capture"
    )
      issue("context-state-continuity");
    if (
      v.modelStateStatus === "matched" &&
      (v.modelFitCount === null ||
        v.modelFitCount < 1 ||
        d.fitHistoryStatus === "wrong-model")
    )
      issue("context-state-continuity");
    if (v.submittedEvaluationStatus === "matched" && !evaluationAvailable)
      issue("context-submitted-evaluation");
    if (
      v.captureStatus === "complete" &&
      (!complete ||
        !trainingAvailable ||
        !evaluationAvailable ||
        v.measurementStatus !== "consistent")
    )
      issue("context-completeness");
    if (v.captureStatus === "unavailable" && cases.length)
      issue("context-unavailable-cases");
    if (
      (d.captureStatus === "missing-cases" && complete) ||
      (d.captureStatus === "missing-evaluation" &&
        evaluationAvailable &&
        v.measurementStatus === "consistent") ||
      (d.captureStatus === "missing-training-log" && trainingAvailable) ||
      (d.captureStatus === "unsupported-model" &&
        v.modelSupportStatus === "supported")
    )
      issue("context-capture-reason");

    const summary =
      agrees &&
      v.measurementStatus === "consistent" &&
      v.modelSupportStatus === "supported" &&
      issues.length === 0;
    const comparison =
      summary &&
      trainingAvailable &&
      v.modelStateStatus === "matched" &&
      v.fitHistoryStatus === "matched";
    const expected =
      trainingAvailable && summary
        ? metrics.training.accuracy - metrics.evaluation.accuracy > 0.15
          ? "large-gap"
          : metrics.training.accuracy < 0.7 && metrics.evaluation.accuracy < 0.7
            ? "low-scores"
            : "no-gap-warning"
        : null;
    const statusField = (key) => ({ status: v[key], reason: d[key] });
    return freeze({
      status: summary ? "usable" : cases.length ? "partial" : "unavailable",
      integrity: {
        status:
          issues.length || v.measurementStatus === "inconsistent"
            ? "inconsistent"
            : "valid",
        issues,
      },
      context,
      cases,
      caseCoverage: {
        status: complete
          ? "complete"
          : cases.length
            ? "partial"
            : "unavailable",
        available: cases.length,
        total: 43,
        missingIds,
      },
      counts: summary ? rawCounts : null,
      metrics,
      metricAvailability: {
        training: availability(metrics.training),
        evaluation: availability(metrics.evaluation),
        comparison,
        summary,
      },
      sourceStatus: {
        training: statusField("trainingSourceStatus"),
        evaluation: statusField("evaluationSourceStatus"),
      },
      fitStatus: statusField("fitHistoryStatus"),
      stateContinuity: statusField("modelStateStatus"),
      diagnosis: {
        value: v.learnerDiagnosis,
        status: d.learnerDiagnosis,
        expected,
        agrees:
          expected !== null && d.learnerDiagnosis === "present"
            ? v.learnerDiagnosis === expected
            : null,
      },
    });
  } catch (error) {
    const issue = failures.has(error) ? error : { code: "invalid-payload" };
    return emptyResult(issue, true);
  }
}
