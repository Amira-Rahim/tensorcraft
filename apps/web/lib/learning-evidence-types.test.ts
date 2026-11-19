// @vitest-environment node
import { createHash } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ExerciseRunSnapshot } from "@tensorcraft/ui";
import {
  EVALUATION_CONTEXT_KEYS,
  EVALUATION_FIXTURE,
  EVALUATION_ROLES,
  type EvaluationContextKey,
  type EvaluationRole,
} from "@tensorcraft/shared";
import {
  createLearningEvidence,
  learningEvidenceVersion,
  LEARNING_EVIDENCE_LIMITS,
  validateLearningEvidence,
  verifyLearningEvidence,
  LEARNING_EVIDENCE_CONTEXTS,
  canSaveLearningEvidence,
  getHistoricalLearningEvidenceContext,
} from "./learning-evidence-types";

const owner = "account:learner-a";
afterEach(() => vi.unstubAllEnvs());

type Cell = string | number | boolean | null;
type Table = Extract<
  ExerciseRunSnapshot["artifacts"][number],
  { kind: "table" }
>;
const table = (role: EvaluationRole, rows: Cell[][]): Table => ({
  kind: "table",
  title: role.title,
  columns: [...role.columns],
  rows,
});
function evaluationRun(): ExerciseRunSnapshot {
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
  const details: Partial<Record<EvaluationContextKey, Cell>> = {
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
  const cases = EVALUATION_FIXTURE.evaluation.map(([id, ...values]) => [
    id,
    id < 40 ? "generated" : "authored",
    ...values,
    values[3] ? 0.8 : 0.2,
  ]);
  return {
    ...run(),
    exerciseSlug: "deep-scan-eval",
    submittedCode: "// Supplied storage test fixture",
    artifacts: [
      table(EVALUATION_ROLES.measuredScores, [
        ["Final training log", 100, 0.2, 0.9],
        ["Final model evaluation", 43, 0.1, 1],
      ]),
      table(
        EVALUATION_ROLES.runContext,
        EVALUATION_CONTEXT_KEYS.map((key) => [
          key,
          values[key],
          details[key] ?? null,
        ]),
      ),
      table(EVALUATION_ROLES.generatedCases, cases.slice(0, 40)),
      table(EVALUATION_ROLES.authoredCases, cases.slice(40)),
    ],
  };
}

function context(
  source: ExerciseRunSnapshot,
  key: EvaluationContextKey,
  value: Cell,
  detail: Cell = null,
) {
  const artifact = source.artifacts.find(
    (item) => item.title === EVALUATION_ROLES.runContext.title,
  ) as Table;
  artifact.rows[EVALUATION_CONTEXT_KEYS.indexOf(key)] = [key, value, detail];
}

function frozenLegacyFixture(network: boolean) {
  const sha = (value: string) =>
    createHash("sha256").update(value).digest("hex");
  const starterHash = sha("// Historical starter");
  const testHash = sha("// Historical grader");
  const submittedCode = "// Historical submitted source";
  const historicalContext = network
    ? {
        worldId: "deep-orbit",
        moduleId: "neural-networks",
        lessonId: "building-a-network",
        exerciseSlug: "simple-network",
        milestoneId: "first-trained-network",
        fixtureId: "synthetic-eight-feature-rehearsal",
        fixtureVersion: "1",
        sourceLabel: "Supplied 120-row synthetic training rehearsal",
        origin: "browser exercise run",
        featureOrder: [
          "Amplitude proxy",
          "Zero-crossing proxy",
          "Phase proxy",
          "Practice feature 4",
          "Practice feature 5",
          "Practice feature 6",
          "Practice feature 7",
          "Practice feature 8",
        ],
        units: Array(8).fill("dimensionless practice value"),
      }
    : {
        worldId: "deep-orbit",
        moduleId: "foundations",
        lessonId: "normalization",
        exerciseSlug: "normalize-data",
        milestoneId: "reusable-scaling",
        fixtureId: "normalization-four-readings",
        fixtureVersion: "1",
        sourceLabel: "Supplied two-feature practice readings",
        origin: "browser exercise run",
        featureOrder: ["Temperature", "Signal strength"],
        units: ["unspecified", "unspecified"],
      };
  // This fixture predates result definitions and carries no new provenance.
  return JSON.parse(
    JSON.stringify({
      schemaVersion: 1,
      runId: "11111111-1111-4111-8111-111111111111",
      ownerScope: owner,
      ...historicalContext,
      capturedAt: "2026-11-02T10:00:00.000Z",
      exerciseVersion: sha(`${starterHash}:${testHash}`),
      starterHash,
      testHash,
      codeHash: sha(submittedCode),
      submittedCode,
      runtimeVersion: null,
      backend: null,
      selectedRowIds: [],
      actualSelectedValues: [],
      artifacts: [],
      checks: [],
      runOutcome: "errored",
      assistance: {
        hintsRevealed: [],
        hintHistory: "session-only",
        solutionViewed: false,
      },
    }),
  );
}

function run(): ExerciseRunSnapshot {
  return {
    exerciseSlug: "normalize-data",
    submittedCode: "const batch = tf.tensor2d([[30, 0.25]]);",
    starterCode: "// starter",
    testCode: "// authored hidden test source",
    capturedAt: "2026-11-02T10:00:00.000Z",
    artifacts: [
      {
        kind: "table",
        title: "Input readings",
        columns: ["Reading", "Temperature", "Signal strength"],
        rows: [[1, 30, 0.25]],
      },
    ],
    checks: [
      { name: "saved statistics", passed: false, error: "Incorrect mean" },
    ],
    errored: false,
    runtimeVersion: "4.22.0",
    backend: "cpu",
    assistance: {
      hintsRevealed: [1],
      hintHistory: "session-only",
      solutionViewed: false,
    },
  };
}

describe("normalization saved run contract", () => {
  it("keeps actual edited input and partial output without authored source", async () => {
    const source = run();
    const snapshot = await createLearningEvidence(source, owner);
    expect(snapshot.actualSelectedValues).toEqual([[30, 0.25]]);
    expect(snapshot.selectedRowIds).toEqual([1]);
    expect(snapshot.runOutcome).toBe("partial");
    expect(snapshot.units).toEqual(["unspecified", "unspecified"]);
    expect(snapshot.submittedCode).toBe(source.submittedCode);
    expect(JSON.stringify(snapshot)).not.toContain(source.testCode);
    expect(snapshot).not.toHaveProperty("starterCode");
    expect(snapshot).not.toHaveProperty("testCode");
    expect(snapshot.exerciseVersion).toBe(
      await learningEvidenceVersion(source.starterCode, source.testCode),
    );
    expect(await verifyLearningEvidence(snapshot, owner)).toEqual(snapshot);
  });

  it("copies values before hashing yields control", async () => {
    const source = run();
    const pending = createLearningEvidence(source, owner);
    source.checks[0]!.passed = true;
    source.assistance.hintsRevealed.push(2);
    source.submittedCode = "different source";
    if (source.artifacts[0]?.kind === "table")
      source.artifacts[0].rows[0]![1] = 999;
    const snapshot = await pending;
    expect(snapshot.actualSelectedValues).toEqual([[30, 0.25]]);
    expect(snapshot.checks[0]?.passed).toBe(false);
    expect(snapshot.assistance.hintsRevealed).toEqual([1]);
    expect(snapshot.submittedCode).not.toBe(source.submittedCode);
  });

  it("distinguishes failed execution from grading and retains solution use", async () => {
    const source = run();
    source.errored = true;
    source.assistance.solutionViewed = true;
    expect(await createLearningEvidence(source, owner)).toMatchObject({
      runOutcome: "errored",
      assistance: { solutionViewed: true },
    });
    source.errored = false;
    source.artifacts = [];
    expect((await createLearningEvidence(source, owner)).runOutcome).toBe(
      "failed",
    );
    source.checks[0]!.passed = true;
    expect((await createLearningEvidence(source, owner)).runOutcome).toBe(
      "passed",
    );
  });

  it("rejects another owner, another fixture and unexpected hidden fields", async () => {
    const snapshot = await createLearningEvidence(run(), owner);
    expect(() =>
      validateLearningEvidence(snapshot, "account:learner-b"),
    ).toThrow();
    expect(() =>
      validateLearningEvidence({ ...snapshot, fixtureVersion: "2" }, owner),
    ).toThrow();
    expect(() =>
      validateLearningEvidence(
        { ...snapshot, testCode: "hidden source" },
        owner,
      ),
    ).toThrow();
    expect(() =>
      validateLearningEvidence(
        { ...snapshot, actualSelectedValues: [[20, 0.2]] },
        owner,
      ),
    ).toThrow();
  });

  it("rejects sparse corrupt records and incorrect source hashes", async () => {
    const snapshot = await createLearningEvidence(run(), owner);
    expect(() =>
      validateLearningEvidence({ ...snapshot, checks: Array(1) }, owner),
    ).toThrow();
    expect(() =>
      validateLearningEvidence(
        {
          ...snapshot,
          assistance: { ...snapshot.assistance, hintsRevealed: Array(1) },
        },
        owner,
      ),
    ).toThrow();
    await expect(
      verifyLearningEvidence(
        { ...snapshot, submittedCode: "different code" },
        owner,
      ),
    ).rejects.toThrow();
    await expect(
      verifyLearningEvidence({ ...snapshot, testHash: "0".repeat(64) }, owner),
    ).rejects.toThrow();
  });

  it("measures source limits in bytes and rejects unsupported exercises", async () => {
    const source = run();
    source.submittedCode = "é".repeat(
      LEARNING_EVIDENCE_LIMITS.codeBytes / 2 + 1,
    );
    await expect(createLearningEvidence(source, owner)).rejects.toThrow();
    source.exerciseSlug = "another-exercise";
    await expect(createLearningEvidence(source, owner)).rejects.toThrow();
  });
});

describe("trained network saved run contract", () => {
  function networkRun(): ExerciseRunSnapshot {
    const rowIds = [
      ...Array.from({ length: 8 }, (_, i) => i),
      ...Array.from({ length: 8 }, (_, i) => i + 60),
    ];
    return {
      ...run(),
      exerciseSlug: "simple-network",
      submittedCode:
        "await model.fit(readings, labels, { epochs: 50, batchSize: 16 });",
      artifacts: [
        {
          kind: "table",
          title: "Selected training readings",
          columns: [
            "Row ID",
            "Label",
            ...LEARNING_EVIDENCE_CONTEXTS["simple-network"].featureOrder,
          ],
          rows: rowIds.map((id) => [
            id,
            id < 60 ? 0 : 1,
            ...Array.from({ length: 8 }, (_, feature) => id + feature / 10),
          ]),
        },
        {
          kind: "series",
          title: "Training loss from this run",
          xLabel: "Epoch",
          yLabel: "Binary crossentropy",
          labels: ["1", "2"],
          series: [{ name: "Loss", values: [0.9, 0.8] }],
        },
      ],
      checks: [
        {
          name: "training schedule",
          passed: false,
          error: "Only two epochs completed.",
        },
      ],
    };
  }

  it("preserves selected actual training rows, loss and partial checks under the model milestone", async () => {
    const source = networkRun();
    const snapshot = await createLearningEvidence(source, owner);
    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      exerciseSlug: "simple-network",
      lessonId: "building-a-network",
      moduleId: "neural-networks",
      milestoneId: "first-trained-network",
      fixtureId: "synthetic-eight-feature-rehearsal",
      runOutcome: "partial",
    });
    expect(snapshot.selectedRowIds).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7, 60, 61, 62, 63, 64, 65, 66, 67,
    ]);
    expect(snapshot.actualSelectedValues[8]).toEqual([
      60, 60.1, 60.2, 60.3, 60.4, 60.5, 60.6, 60.7,
    ]);
    expect(snapshot.actualSelectedValues.every((row) => row.length === 8)).toBe(
      true,
    );
    expect(snapshot.artifacts).toEqual(source.artifacts);
    expect(snapshot.units).toEqual(
      Array(8).fill("dimensionless practice value"),
    );
    expect(await verifyLearningEvidence(snapshot, owner)).toEqual(snapshot);
  });

  it("rejects mixed lesson identities, feature order and misleading selected row metadata", async () => {
    const snapshot = await createLearningEvidence(networkRun(), owner);
    for (const patch of [
      { milestoneId: "reusable-scaling" },
      { moduleId: "foundations" },
      { lessonId: "normalization" },
      { fixtureId: "normalization-four-readings" },
      { featureOrder: [...snapshot.featureOrder].reverse() },
      { selectedRowIds: snapshot.selectedRowIds.map((id) => id + 1) },
    ])
      expect(() =>
        validateLearningEvidence({ ...snapshot, ...patch }, owner),
      ).toThrow();
  });

  it("rejects duplicate or reordered input excerpts while permitting an errored run without a table", async () => {
    const source = networkRun();
    source.artifacts.push(source.artifacts[0]!);
    await expect(createLearningEvidence(source, owner)).rejects.toThrow();
    source.artifacts.pop();
    if (source.artifacts[0]?.kind === "table")
      source.artifacts[0].rows.reverse();
    await expect(createLearningEvidence(source, owner)).rejects.toThrow();
    source.artifacts = [];
    source.errored = true;
    expect(await createLearningEvidence(source, owner)).toMatchObject({
      runOutcome: "errored",
      selectedRowIds: [],
      actualSelectedValues: [],
    });
  });
});

describe("frozen historical readers and evaluation rollout", () => {
  it.each([false, true])(
    "reads the historical contract after current metadata changes (network: %s)",
    async (network) => {
      const fixture = frozenLegacyFixture(network);
      const originalJSON = JSON.stringify(fixture);
      const slug = network ? "simple-network" : "normalize-data";
      const current = LEARNING_EVIDENCE_CONTEXTS[slug] as unknown as Record<
        string,
        unknown
      >;
      const previous = {
        ...current,
        featureOrder: [...(current.featureOrder as string[])],
      };
      try {
        current.fixtureVersion = "2";
        current.sourceLabel = "A future source description";
        (current.featureOrder as string[])[0] = "A future feature";
        expect(await verifyLearningEvidence(fixture, owner)).toEqual(fixture);
        expect(JSON.stringify(fixture)).toBe(originalJSON);
        const historical = getHistoricalLearningEvidenceContext(fixture);
        expect(historical?.fixtureVersion).toBe("1");
        expect(Object.isFrozen(historical)).toBe(true);
        expect(Object.isFrozen(historical?.featureOrder)).toBe(true);
        expect(historical?.sourceLabel).not.toBe(current.sourceLabel);
        expect(fixture).not.toHaveProperty("definitionId");
        expect(fixture.runtimeVersion).toBeNull();
      } finally {
        Object.assign(current, previous);
      }
    },
  );

  it.each([undefined, "", "false", "1", "TRUE"])(
    "keeps evaluation writes disabled for %s while legacy writes remain enabled",
    (value) => {
      vi.stubEnv("NEXT_PUBLIC_EVALUATION_SAVES_ENABLED", value);
      expect(canSaveLearningEvidence("deep-scan-eval")).toBe(false);
      expect(canSaveLearningEvidence("normalize-data")).toBe(true);
      expect(canSaveLearningEvidence("simple-network")).toBe(true);
      expect(canSaveLearningEvidence("unknown")).toBe(false);
    },
  );

  it("enables only the recognized evaluation writer with the explicit flag", () => {
    vi.stubEnv("NEXT_PUBLIC_EVALUATION_SAVES_ENABLED", "true");
    expect(canSaveLearningEvidence("deep-scan-eval")).toBe(true);
    expect(canSaveLearningEvidence("unknown")).toBe(false);
  });
});

describe("evaluation saved result contract", () => {
  it("creates a downloadable snapshot while writes are disabled, retaining assignment and observed source separately", async () => {
    vi.stubEnv("NEXT_PUBLIC_EVALUATION_SAVES_ENABLED", undefined);
    const source = evaluationRun();
    const cases = source.artifacts[2] as Table;
    cases.rows[0]![1] = "unknown";
    cases.rows[0]![2] = 0.123456789;
    context(source, "evaluationSourceStatus", "mismatch", "feature-mismatch");
    const snapshot = await createLearningEvidence(source, owner);
    expect(snapshot).toMatchObject({
      schemaVersion: 1,
      exerciseSlug: "deep-scan-eval",
      milestoneId: "held-out-evaluation",
      fixtureVersion: "1",
    });
    expect(snapshot.sourceLabel).toMatch(/^Assigned exercise:/);
    expect(snapshot.selectedRowIds).toEqual(
      Array.from({ length: 43 }, (_, index) => index),
    );
    expect(snapshot.actualSelectedValues[0]?.[0]).toBe(0.123456789);
    expect(snapshot.artifacts).toEqual(source.artifacts);
    expect(await verifyLearningEvidence(snapshot, owner)).toEqual(snapshot);
    expect(canSaveLearningEvidence(snapshot.exerciseSlug)).toBe(false);
    expect(snapshot).not.toHaveProperty("evaluationSourceStatus");
  });

  it("retains safe partial cases without filling missing IDs from the fixture", async () => {
    const source = evaluationRun();
    source.artifacts.pop();
    (source.artifacts[2] as Table).rows.splice(5, 1);
    context(source, "captureStatus", "partial", "missing-cases");
    context(source, "measurementStatus", "unknown", "missing-cases");
    const snapshot = await createLearningEvidence(source, owner);
    expect(snapshot.selectedRowIds).toHaveLength(39);
    expect(snapshot.selectedRowIds).not.toContain(5);
    expect(snapshot.selectedRowIds).not.toContain(40);
    expect(snapshot.actualSelectedValues).toHaveLength(39);
    expect(await verifyLearningEvidence(snapshot, owner)).toEqual(snapshot);
  });

  it("retains an explicit supported unavailable context without inventing observed settings", async () => {
    const source = evaluationRun();
    context(source, "captureStatus", "unavailable", "capture-error");
    context(source, "evaluationSourceStatus", "unknown", "input-read-failed");
    context(source, "trainingSourceStatus", "unknown", "missing-fit");
    context(source, "fitHistoryStatus", "unknown", "missing-fit");
    context(source, "trainingLogStatus", "unavailable", "missing-fit");
    context(source, "modelSupportStatus", "unknown", "model-unavailable");
    context(source, "modelStateStatus", "unknown", "checkpoint-unavailable");
    context(source, "measurementStatus", "unavailable", "missing-evaluation");
    context(
      source,
      "submittedEvaluationStatus",
      "unknown",
      "missing-evaluation",
    );
    context(source, "observedFitCount", 0);
    context(source, "modelFitCount", 0);
    context(source, "trainingRows", null);
    context(source, "evaluationRows", null);
    context(source, "requestedEpochs", null);
    source.artifacts = [source.artifacts[1]!];
    const snapshot = await createLearningEvidence(source, owner);
    expect(snapshot.selectedRowIds).toEqual([]);
    expect(snapshot.actualSelectedValues).toEqual([]);
    expect(snapshot.artifacts).toEqual(source.artifacts);
    expect(await verifyLearningEvidence(snapshot, owner)).toEqual(snapshot);
  });

  it("keeps a supported inconsistent metric result explicit instead of repairing it", async () => {
    const source = evaluationRun();
    (source.artifacts[0] as Table).rows[1]![3] = 42 / 43;
    const snapshot = await createLearningEvidence(source, owner);
    expect((snapshot.artifacts[0] as Table).rows[1]?.[3]).toBe(42 / 43);
    expect(await verifyLearningEvidence(snapshot, owner)).toEqual(snapshot);
  });

  it("rejects missing context, unsupported semantic versions, duplicate cases, and forged case source", async () => {
    for (const edit of [
      (source: ExerciseRunSnapshot) => {
        source.artifacts.splice(1, 1);
      },
      (source: ExerciseRunSnapshot) => context(source, "contractVersion", 2),
      (source: ExerciseRunSnapshot) => {
        (source.artifacts[2] as Table).rows[1]![0] = 0;
      },
      (source: ExerciseRunSnapshot) => {
        (source.artifacts[2] as Table).rows[0]![2] = 0.123456789;
      },
    ]) {
      const source = evaluationRun();
      edit(source);
      await expect(createLearningEvidence(source, owner)).rejects.toThrow();
    }
  });

  it("rejects bounded-wire violations and altered selected-value mirrors", async () => {
    const source = evaluationRun();
    const snapshot = await createLearningEvidence(source, owner);
    expect(() =>
      validateLearningEvidence(
        { ...snapshot, actualSelectedValues: [] },
        owner,
      ),
    ).toThrow();
    (source.artifacts[2] as Table).rows.push([
      ...(source.artifacts[2] as Table).rows[0]!,
    ]);
    await expect(createLearningEvidence(source, owner)).rejects.toThrow();
    const tooLarge = evaluationRun();
    (tooLarge.artifacts[2] as Table).rows = Array.from({ length: 40 }, () =>
      Array(7).fill("界".repeat(1200)),
    );
    await expect(createLearningEvidence(tooLarge, owner)).rejects.toThrow();
  });
});
