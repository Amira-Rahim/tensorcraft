// @vitest-environment node
import { describe, expect, it } from "vitest";
import type { ExerciseRunSnapshot } from "@tensorcraft/ui";
import {
  createLearningEvidence,
  learningEvidenceVersion,
  LEARNING_EVIDENCE_LIMITS,
  validateLearningEvidence,
  verifyLearningEvidence,
  LEARNING_EVIDENCE_CONTEXTS,
} from "./learning-evidence-types";

const owner = "account:learner-a";

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
