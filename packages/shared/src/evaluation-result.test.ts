// @vitest-environment node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it, vi } from "vitest";
import {
  EVALUATION_CONTEXT_KEYS,
  EVALUATION_FIXTURE,
  EVALUATION_ROLES,
  EVALUATION_STATUS_REASONS,
  decodeEvaluationResult,
  type EvaluationContextKey,
  type EvaluationRole,
} from "./evaluation-result.mjs";
import { parseAndRunTests } from "../../ui/src/mdx/exercise-runner-node";

type Cell = string | number | boolean | null;
type Artifact = {
  kind: "table";
  title: string;
  columns: string[];
  rows: Cell[][];
  summary?: string;
};
const table = (role: EvaluationRole, rows: Cell[][]): Artifact => ({
  kind: "table",
  title: role.title,
  columns: [...role.columns],
  rows,
});

function bundle(): Artifact[] {
  const values: Record<EvaluationContextKey, Cell> = {
    definitionId: "deep-orbit.evaluation-cases",
    contractVersion: 1,
    fixtureId: "deep-scan-evaluation-100-43",
    fixtureVersion: "1",
    captureStatus: "complete",
    evaluationSourceStatus: "matched",
    trainingSourceStatus: "matched",
    fitHistoryStatus: "matched",
    recordingStatus: "complete",
    trainingLogStatus: "available",
    modelStateStatus: "matched",
    modelSupportStatus: "supported",
    measurementStatus: "consistent",
    submittedEvaluationStatus: "matched",
    observedFitCount: 1,
    modelFitCount: 1,
    trainingRows: 100,
    evaluationRows: 43,
    requestedEpochs: 30,
    completedEpochs: 30,
    batchSize: 16,
    shuffle: true,
    initialEpoch: 0,
    validationSplit: 0,
    parameterCount: 673,
    inputWidth: 3,
    layer1: 32,
    layer2: 16,
    layer3: 1,
    optimizer: "Adam",
    loss: "binaryCrossentropy",
    metric: "binaryAccuracy",
    decisionRule: 0.5,
    class0: 0,
    class1: 1,
    learnerDiagnosis: "no-gap-warning",
    callbacksPresent: false,
    evaluationBatchSize: 32,
  };
  const detail: Partial<Record<EvaluationContextKey, Cell>> = {
    layer1: "relu",
    layer2: "relu",
    layer3: "sigmoid",
    optimizer: 0.001,
    metric: "accuracy",
    decisionRule: "gt",
    class0: "calm",
    class1: "flagged",
    learnerDiagnosis: "present",
  };
  const cases = EVALUATION_FIXTURE.evaluation.map(([id, f1, f2, f3, label]) => [
    id,
    id < 40 ? "generated" : "authored",
    f1,
    f2,
    f3,
    label,
    label ? 0.8 : 0.2,
  ]);
  return [
    table(EVALUATION_ROLES.measuredScores, [
      ["Final training log", 100, 0.2, 0.9],
      ["Final model evaluation", 43, 0.1, 1],
    ]),
    table(
      EVALUATION_ROLES.runContext,
      EVALUATION_CONTEXT_KEYS.map((key) => [
        key,
        values[key],
        detail[key] ?? null,
      ]),
    ),
    table(EVALUATION_ROLES.generatedCases, cases.slice(0, 40)),
    table(EVALUATION_ROLES.authoredCases, cases.slice(40)),
  ];
}

function context(
  artifacts: Artifact[],
  key: EvaluationContextKey,
  value: Cell,
  detail: Cell = null,
) {
  artifacts[1].rows[EVALUATION_CONTEXT_KEYS.indexOf(key)] = [
    key,
    value,
    detail,
  ];
}

function refreshAccuracy(artifacts: Artifact[]) {
  const cases = artifacts.slice(2).flatMap((a) => a.rows);
  artifacts[0].rows[1][3] =
    cases.filter((r) => (Number(r[6]) > 0.5 ? 1 : 0) === r[5]).length / 43;
}

const codes = (input: unknown) =>
  decodeEvaluationResult(input).integrity.issues.map((issue) => issue.code);

describe("evaluation fixture version 1", () => {
  it("pins exact public float32 rows without a runtime dependency", () => {
    const digest = (value: unknown) =>
      createHash("sha256").update(JSON.stringify(value)).digest("hex");
    expect(EVALUATION_FIXTURE.training).toHaveLength(100);
    expect(EVALUATION_FIXTURE.evaluation).toHaveLength(43);
    expect(digest(EVALUATION_FIXTURE.training)).toBe(
      "6718c866d6bbc2c9b8698cc1dedf01feb777d2e4f51d51d1943da992b6bfcd5f",
    );
    expect(digest(EVALUATION_FIXTURE.evaluation)).toBe(
      "cf86b9fedf49e2ab03e99ea575df915bf8e3205633d38e09fe32c9a006671ad1",
    );
    expect(EVALUATION_FIXTURE.evaluation[40]).toEqual([
      40, 0.30000001192092896, 0.6800000071525574, 0.3400000035762787, 1,
    ]);
    expect(
      EVALUATION_FIXTURE.training.every(
        (row, i) => row[3] === (i < 50 ? 0 : 1),
      ),
    ).toBe(true);
    expect(Object.isFrozen(EVALUATION_FIXTURE)).toBe(true);
    expect(Object.isFrozen(EVALUATION_FIXTURE.evaluation[0])).toBe(true);
  });
});

describe("decodeEvaluationResult", () => {
  it("uses the same pure decoder for current and serialized saved artifacts", () => {
    const artifacts = bundle();
    const current = decodeEvaluationResult(artifacts);
    expect(current).toEqual(
      decodeEvaluationResult(JSON.parse(JSON.stringify(artifacts))),
    );
    expect(current.status).toBe("usable");
    expect(current.integrity).toEqual({ status: "valid", issues: [] });
    expect(current.counts).toMatchObject({
      truePositive: 23,
      trueNegative: 20,
      falsePositive: 0,
      falseNegative: 0,
      correct: 43,
      accuracy: 1,
    });
    expect(current.caseCoverage).toEqual({
      status: "complete",
      available: 43,
      total: 43,
      missingIds: [],
    });
    expect(current.metricAvailability).toEqual({
      training: "available",
      evaluation: "available",
      comparison: true,
      summary: true,
    });
    artifacts[2].rows[0][6] = 0.99;
    expect(current.cases[0].score).toBe(0.2);
    expect(Object.isFrozen(current.cases[0].features)).toBe(true);
  });

  it("classifies full precision with strict greater than 0.5", () => {
    const artifacts = bundle();
    artifacts[2].rows[0][6] = 0.5;
    artifacts[2].rows[1][6] = 0.5000000000000001;
    artifacts[2].rows[20][6] = 0.49999999999999994;
    refreshAccuracy(artifacts);
    const result = decodeEvaluationResult(artifacts);
    expect(result.status).toBe("usable");
    expect(result.cases.slice(0, 2).map((row) => row.predicted)).toEqual([
      0, 1,
    ]);
    expect(result.cases[20].predicted).toBe(0);
    expect(result.counts).toMatchObject({
      correct: 41,
      falsePositive: 1,
      falseNegative: 1,
    });
  });

  it("accepts measured float32 accuracy tolerance and rejects a one-case discrepancy", () => {
    const artifacts = bundle();
    artifacts[0].rows[1][3] = 1 - 0.0000009;
    expect(decodeEvaluationResult(artifacts).status).toBe("usable");
    artifacts[0].rows[1][3] = 42 / 43;
    const result = decodeEvaluationResult(artifacts);
    expect(result.status).toBe("partial");
    expect(result.integrity.status).toBe("inconsistent");
    expect(result.counts).toBeNull();
    expect(result.cases).toHaveLength(43);
    expect(result.metrics.evaluation?.accuracy).toBe(42 / 43);
  });

  it("keeps failed diagnosis and changed weights separate from final measurements", () => {
    const artifacts = bundle();
    context(artifacts, "learnerDiagnosis", "large-gap", "present");
    context(artifacts, "modelStateStatus", "changed", "weights-changed");
    const result = decodeEvaluationResult(artifacts);
    expect(result.status).toBe("usable");
    expect(result.diagnosis).toEqual({
      value: "large-gap",
      status: "present",
      expected: "no-gap-warning",
      agrees: false,
    });
    expect(result.stateContinuity).toEqual({
      status: "changed",
      reason: "weights-changed",
    });
    expect(result.metricAvailability.comparison).toBe(false);
  });

  it("retains exact changed rows with unknown source and no canonical marker", () => {
    const artifacts = bundle();
    artifacts[2].rows[0][1] = "unknown";
    artifacts[2].rows[0][2] = 0.123456789;
    context(
      artifacts,
      "evaluationSourceStatus",
      "mismatch",
      "feature-mismatch",
    );
    const result = decodeEvaluationResult(artifacts);
    expect(result.status).toBe("usable");
    expect(result.cases[0]).toMatchObject({
      canonicalId: null,
      source: "unknown",
      features: [0.123456789, artifacts[2].rows[0][3], artifacts[2].rows[0][4]],
    });
    artifacts[2].rows[0][1] = "generated";
    expect(codes(artifacts)).toContain("case-source-forgery");
  });

  it("does not accept decimal-rounded authored inputs as canonical float32 values", () => {
    const artifacts = bundle();
    artifacts[3].rows[0][2] = 0.3;
    expect(decodeEvaluationResult(artifacts).status).toBe("unavailable");
    expect(codes(artifacts)).toContain("case-source-forgery");
  });

  it("represents omitted partitions and gaps without inventing rows or whole-run totals", () => {
    const artifacts = bundle();
    artifacts.pop();
    artifacts[2].rows.splice(5, 1);
    context(artifacts, "captureStatus", "partial", "missing-cases");
    context(artifacts, "measurementStatus", "unknown", "missing-cases");
    const result = decodeEvaluationResult(artifacts);
    expect(result.status).toBe("partial");
    expect(result.integrity.status).toBe("valid");
    expect(result.caseCoverage).toEqual({
      status: "partial",
      available: 39,
      total: 43,
      missingIds: [5, 40, 41, 42],
    });
    expect(result.counts).toBeNull();
    expect(result.cases[5].position).toBe(6);
  });

  it("withholds a combined summary when evaluation metrics are absent", () => {
    const artifacts = bundle();
    artifacts[0].rows[1][2] = null;
    artifacts[0].rows[1][3] = null;
    context(artifacts, "captureStatus", "partial", "missing-evaluation");
    context(artifacts, "measurementStatus", "unknown", "missing-evaluation");
    context(
      artifacts,
      "submittedEvaluationStatus",
      "unknown",
      "missing-evaluation",
    );
    const result = decodeEvaluationResult(artifacts);
    expect(result.caseCoverage.status).toBe("complete");
    expect(result.status).toBe("partial");
    expect(result.counts).toBeNull();
    expect(result.metricAvailability.evaluation).toBe("unavailable");
  });

  it("keeps complete evaluation usable when custom callbacks withhold the training log", () => {
    const artifacts = bundle();
    artifacts[0].rows[0][2] = null;
    artifacts[0].rows[0][3] = null;
    context(artifacts, "captureStatus", "partial", "missing-training-log");
    context(
      artifacts,
      "trainingLogStatus",
      "unavailable",
      "callbacks-unobserved",
    );
    context(artifacts, "fitHistoryStatus", "unknown", "callbacks-unobserved");
    context(artifacts, "callbacksPresent", true);
    const result = decodeEvaluationResult(artifacts);
    expect(result.status).toBe("usable");
    expect(result.metricAvailability).toMatchObject({
      training: "unavailable",
      comparison: false,
      summary: true,
    });
    expect(result.diagnosis?.expected).toBeNull();
  });

  it("rejects changed columns, duplicate IDs, reordered IDs, and wrong partitions", () => {
    const columns = bundle();
    [columns[2].columns[2], columns[2].columns[3]] = [
      columns[2].columns[3],
      columns[2].columns[2],
    ];
    expect(codes(columns)).toContain("role-columns");
    for (const edit of [
      (a: Artifact[]) => {
        a[2].rows[1][0] = 0;
      },
      (a: Artifact[]) => {
        [a[2].rows[0], a[2].rows[1]] = [a[2].rows[1], a[2].rows[0]];
      },
      (a: Artifact[]) => {
        a[3].rows[0][0] = 39;
      },
    ]) {
      const artifacts = bundle();
      edit(artifacts);
      expect(codes(artifacts)).toContain("case-id-order-or-partition");
    }
  });

  it("does not let asserted complete or matched status override contradictory data", () => {
    const missing = bundle();
    missing.pop();
    expect(codes(missing)).toContain("context-completeness");
    expect(decodeEvaluationResult(missing).counts).toBeNull();
    const source = bundle();
    source[2].rows[0][1] = "unknown";
    expect(codes(source)).toContain("context-evaluation-source");
    const count = bundle();
    context(count, "modelFitCount", 2);
    expect(codes(count)).toContain("context-fit-count");
    const model = bundle();
    context(model, "layer3", 1, "linear");
    expect(codes(model)).toContain("context-model-support");
    const reason = bundle();
    context(reason, "captureStatus", "partial", "missing-cases");
    expect(codes(reason)).toContain("context-capture-reason");
  });

  it("validates context identity, order, detail types, enums, and exact reason pairings", () => {
    const invalid: [EvaluationContextKey, Cell, Cell][] = [
      ["fixtureVersion", 1, null],
      ["contractVersion", 2, null],
      ["trainingRows", 8193, null],
      ["shuffle", "true", null],
      ["evaluationBatchSize", 16, null],
      ["decisionRule", 0.5, "gte"],
      ["evaluationSourceStatus", "matched", "feature-mismatch"],
      ["recordingStatus", "overflow", null],
      ["modelStateStatus", "unknown", "weights-changed"],
      ["layer1", 32, "custom"],
      ["optimizer", "Unknown", 0.1],
      ["metric", "binaryAccuracy", "precision"],
      ["learnerDiagnosis", "large-gap", "missing"],
    ];
    for (const [key, value, detail] of invalid) {
      const artifacts = bundle();
      context(artifacts, key, value, detail);
      expect(decodeEvaluationResult(artifacts).integrity.status, key).toBe(
        "invalid",
      );
    }
    const order = bundle();
    [order[1].rows[0], order[1].rows[1]] = [order[1].rows[1], order[1].rows[0]];
    expect(codes(order)).toContain("context-key-order");
    const duplicate = bundle();
    duplicate[1].rows[1] = [...duplicate[1].rows[0]];
    expect(codes(duplicate)).toContain("context-key-order");
    expect(EVALUATION_CONTEXT_KEYS).toHaveLength(38);
    expect(EVALUATION_STATUS_REASONS.modelStateStatus.changed).toContain(
      "weights-changed",
    );
  });

  it("requires context while allowing a valid context to record an unavailable result", () => {
    const artifacts = bundle();
    expect(codes([artifacts[0]])).toContain("missing-context");
    context(artifacts, "captureStatus", "unavailable", "capture-error");
    context(
      artifacts,
      "evaluationSourceStatus",
      "unknown",
      "input-read-failed",
    );
    context(artifacts, "trainingSourceStatus", "unknown", "missing-fit");
    context(artifacts, "fitHistoryStatus", "unknown", "missing-fit");
    context(artifacts, "trainingLogStatus", "unavailable", "missing-fit");
    context(artifacts, "modelSupportStatus", "unknown", "model-unavailable");
    context(artifacts, "modelStateStatus", "unknown", "checkpoint-unavailable");
    context(
      artifacts,
      "measurementStatus",
      "unavailable",
      "missing-evaluation",
    );
    context(
      artifacts,
      "submittedEvaluationStatus",
      "unknown",
      "missing-evaluation",
    );
    context(artifacts, "observedFitCount", 0);
    context(artifacts, "modelFitCount", 0);
    context(artifacts, "trainingRows", null);
    context(artifacts, "evaluationRows", null);
    const result = decodeEvaluationResult([artifacts[1]]);
    expect(result.status).toBe("unavailable");
    expect(result.integrity.status).toBe("valid");
    expect(result.context?.values.captureStatus).toBe("unavailable");
  });

  it("rejects sparse arrays, invalid scalars, extra roles, and nonempty placeholders", () => {
    for (const value of [NaN, Infinity, -0.01, 1.01, "0.8", null]) {
      const artifacts = bundle();
      artifacts[2].rows[0][6] = value;
      expect(decodeEvaluationResult(artifacts).integrity.status).toBe(
        "invalid",
      );
    }
    const sparse = bundle();
    delete sparse[2].rows[0][2];
    expect(decodeEvaluationResult(sparse).integrity.status).toBe("invalid");
    const empty = bundle();
    empty[3].rows = [];
    expect(decodeEvaluationResult(empty).integrity.status).toBe("invalid");
    const duplicate = bundle();
    duplicate[3] = duplicate[2];
    expect(codes(duplicate)).toContain("duplicate-or-unordered-role");
    const unknown = bundle();
    unknown[3].title = "Other results";
    expect(codes(unknown)).toContain("unknown-role");
  });

  it("does not execute accessors or toJSON and contains thrown hostile values", () => {
    const artifacts = bundle();
    const getTitle = vi.fn(() => EVALUATION_ROLES.measuredScores.title);
    Object.defineProperty(artifacts[0], "title", { get: getTitle });
    expect(decodeEvaluationResult(artifacts).integrity.status).toBe("invalid");
    expect(getTitle).not.toHaveBeenCalled();
    const toJSON = vi.fn();
    const custom = Object.assign(bundle()[0], { toJSON });
    expect(decodeEvaluationResult([custom]).integrity.status).toBe("invalid");
    expect(toJSON).not.toHaveBeenCalled();
    const hostile = new Proxy(
      {},
      {
        getPrototypeOf() {
          throw Object.defineProperty({}, "code", {
            get() {
              throw Error("must not inspect exception");
            },
          });
        },
      },
    );
    expect(codes([hostile])).toEqual(["invalid-payload"]);
  });

  it("enforces the UTF-8 host byte bound before semantic decoding", () => {
    const artifact = table(
      EVALUATION_ROLES.generatedCases,
      Array.from({ length: 40 }, () => Array(7).fill("界".repeat(1200))),
    );
    expect(codes([artifact])).toContain("artifact-byte-limit");
  });
});

describe("captured worker results", () => {
  const contentRequire = createRequire(
    new URL("../../content/package.json", import.meta.url),
  );
  const { parse } = createRequire(contentRequire.resolve("velite"))("yaml");
  const exercise = parse(
    readFileSync(
      new URL(
        "../../content/content/deep-orbit/training-loop/exercises/deep-scan-eval.yaml",
        import.meta.url,
      ),
      "utf8",
    ),
  ) as { solutionCode: string; testCode: string };

  it(
    "decodes the authored worker reference and its serialized form without a fixed score",
    { timeout: 30000 },
    async () => {
      const outcome = await parseAndRunTests(
        exercise.solutionCode,
        exercise.testCode,
        20000,
      );
      expect(outcome.errored, JSON.stringify(outcome.results)).not.toBe(true);
      expect(outcome.results.filter((result) => !result.passed)).toEqual([]);
      const result = decodeEvaluationResult(outcome.artifacts);
      expect(result.integrity, JSON.stringify(result.context)).toEqual({
        status: "valid",
        issues: [],
      });
      expect(result.status).toBe("usable");
      expect(result.caseCoverage.available).toBe(43);
      expect(result.counts?.correct).toBe(
        result.cases.filter((row) => row.predicted === row.label).length,
      );
      expect(result).toEqual(
        decodeEvaluationResult(JSON.parse(JSON.stringify(outcome.artifacts))),
      );
    },
  );

  it(
    "keeps captured decisions usable after a wrong diagnosis",
    { timeout: 30000 },
    async () => {
      const anchor = "const verdict = diagnose(trainAcc, testAcc);";
      expect(exercise.solutionCode.split(anchor)).toHaveLength(2);
      const code = exercise.solutionCode.replace(
        anchor,
        "const actualVerdict = diagnose(trainAcc, testAcc); const verdict = actualVerdict === 'large-gap' ? 'low-scores' : 'large-gap';",
      );
      const outcome = await parseAndRunTests(code, exercise.testCode, 20000);
      expect(outcome.errored).not.toBe(true);
      expect(outcome.results.some((result) => !result.passed)).toBe(true);
      const result = decodeEvaluationResult(outcome.artifacts);
      expect(result.status, JSON.stringify(result.integrity)).toBe("usable");
      expect(result.diagnosis?.agrees).toBe(false);
      expect(result.caseCoverage.available).toBe(43);
    },
  );

  it(
    "decodes a changed fixture as measured unknown-source rows",
    { timeout: 30000 },
    async () => {
      const anchor = "tf.randomNormal([20, 1], 0.17, 0.1, 'float32', 204)";
      expect(exercise.solutionCode.split(anchor)).toHaveLength(2);
      const code = exercise.solutionCode.replace(
        anchor,
        "tf.randomNormal([20, 1], 0.17, 0.1, 'float32', 304)",
      );
      const outcome = await parseAndRunTests(code, exercise.testCode, 20000);
      expect(outcome.errored).not.toBe(true);
      expect(outcome.results.some((result) => !result.passed)).toBe(true);
      const result = decodeEvaluationResult(outcome.artifacts);
      expect(result.status, JSON.stringify(result.integrity)).toBe("usable");
      expect(result.sourceStatus?.evaluation).toEqual({
        status: "mismatch",
        reason: "feature-mismatch",
      });
      expect(
        result.cases.some(
          (row) => row.source === "unknown" && row.canonicalId === null,
        ),
      ).toBe(true);
      expect(result.caseCoverage.available).toBe(43);
    },
  );
});
