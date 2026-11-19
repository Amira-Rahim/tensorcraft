// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  deleteLearningEvidence,
  listLearningEvidence,
  resolveEvidenceOwner,
  saveLearningEvidence,
} from "./learning-evidence-store";
import {
  createLearningEvidence,
  LEARNING_EVIDENCE_CONTEXTS,
  LEARNING_EVIDENCE_LIMITS,
  type LearningEvidenceExerciseSlug,
  type LearningEvidenceSnapshot,
} from "./learning-evidence-types";
import {
  EVALUATION_CONTEXT_KEYS,
  EVALUATION_ROLES,
  type EvaluationContextKey,
} from "@tensorcraft/shared";
import type { ExerciseRunSnapshot } from "@tensorcraft/ui";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

// This transaction fake tests store decisions and abort behavior. Browser
// concurrency remains covered separately by the real IndexedDB checks.
function database() {
  const owners = new Map<string, unknown>();
  const writes: unknown[] = [];
  const open = vi.fn(() => {
    const request = {
      result: undefined as unknown,
      onsuccess: null as (() => void) | null,
    };
    request.result = {
      close() {},
      objectStoreNames: { contains: () => true },
      transaction(_store: string, mode: IDBTransactionMode) {
        let aborted = false;
        const changes = new Map<string, unknown>();
        const removed = new Set<string>();
        const tx = {
          oncomplete: null as (() => void) | null,
          onabort: null as (() => void) | null,
          onerror: null as (() => void) | null,
          abort() {
            aborted = true;
            queueMicrotask(() => tx.onabort?.());
          },
          objectStore() {
            return {
              get(key: string) {
                const read = {
                  result: undefined as unknown,
                  onsuccess: null as (() => void) | null,
                };
                queueMicrotask(() => {
                  read.result = structuredClone(owners.get(key));
                  read.onsuccess?.();
                  queueMicrotask(() => {
                    if (aborted) return;
                    for (const [key, value] of changes) {
                      owners.set(key, value);
                      writes.push(structuredClone(value));
                    }
                    for (const key of removed) {
                      owners.delete(key);
                      writes.push({ deleted: key });
                    }
                    tx.oncomplete?.();
                  });
                });
                return read;
              },
              put(value: { ownerScope: string }) {
                if (mode !== "readwrite")
                  throw new Error("Read-only transaction");
                changes.set(value.ownerScope, structuredClone(value));
              },
              delete(key: string) {
                if (mode !== "readwrite")
                  throw new Error("Read-only transaction");
                removed.add(key);
              },
            };
          },
        };
        return tx;
      },
    };
    queueMicrotask(() => request.onsuccess?.());
    return request;
  });
  vi.stubGlobal("indexedDB", { open });
  return { owners, writes, open };
}

function unavailableEvaluationArtifacts(): ExerciseRunSnapshot["artifacts"] {
  type Cell = string | number | boolean | null;
  const fields: Partial<Record<EvaluationContextKey, [Cell, Cell]>> = {
    definitionId: ["deep-orbit.evaluation-cases", null],
    contractVersion: [1, null],
    fixtureId: ["deep-scan-evaluation-100-43", null],
    fixtureVersion: ["1", null],
    captureStatus: ["unavailable", "capture-error"],
    evaluationSourceStatus: ["unknown", "input-read-failed"],
    trainingSourceStatus: ["unknown", "missing-fit"],
    fitHistoryStatus: ["unknown", "missing-fit"],
    recordingStatus: ["complete", null],
    trainingLogStatus: ["unavailable", "missing-fit"],
    modelStateStatus: ["unknown", "checkpoint-unavailable"],
    modelSupportStatus: ["unknown", "model-unavailable"],
    measurementStatus: ["unavailable", "missing-evaluation"],
    submittedEvaluationStatus: ["unknown", "missing-evaluation"],
    observedFitCount: [0, null],
    modelFitCount: [0, null],
    decisionRule: [0.5, "gt"],
    class0: [0, "calm"],
    class1: [1, "flagged"],
    learnerDiagnosis: [null, "missing"],
    evaluationBatchSize: [32, null],
  };
  return [
    {
      kind: "table",
      title: EVALUATION_ROLES.runContext.title,
      columns: [...EVALUATION_ROLES.runContext.columns],
      rows: EVALUATION_CONTEXT_KEYS.map((key) => [
        key,
        ...(fields[key] ?? [null, null]),
      ]),
    },
  ];
}

async function snapshot(
  slug: LearningEvidenceExerciseSlug,
  large = false,
): Promise<LearningEvidenceSnapshot> {
  return createLearningEvidence(
    {
      exerciseSlug: slug,
      submittedCode: large
        ? "x".repeat(200 * 1024)
        : "// Supplied storage test fixture",
      starterCode: "// Starter fixture",
      testCode: "// Grader fixture",
      capturedAt: "2026-11-06T10:00:00.000Z",
      artifacts:
        slug === "deep-scan-eval" ? unavailableEvaluationArtifacts() : [],
      checks: large
        ? Array.from({ length: 100 }, (_, index) => ({
            name: `Check ${index}`,
            passed: false,
            error: "x".repeat(6000),
          }))
        : [],
      errored: true,
      runtimeVersion: null,
      backend: null,
      assistance: {
        hintsRevealed: [],
        hintHistory: "session-only",
        solutionViewed: false,
      },
    },
    "account:learner-a",
  );
}

function storage() {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
  });
  return data;
}

describe("saved run ownership", () => {
  it("reuses a browser guest identity without adopting it on sign-in", () => {
    const data = storage();
    const guest = resolveEvidenceOwner(null);
    expect(guest).toBe("guest:browser");
    expect(resolveEvidenceOwner(null)).toBe(guest);
    expect(resolveEvidenceOwner("learner-a")).toBe("account:learner-a");
    expect(resolveEvidenceOwner("learner-b")).toBe("account:learner-b");
    expect(resolveEvidenceOwner(null)).toBe(guest);
    expect(data.size).toBe(0);
  });

  it("uses the same guest scope regardless of localStorage contents", () => {
    const data = storage();
    data.set("tc-learning-evidence-guest", "invalid");
    expect(resolveEvidenceOwner(null)).toBe("guest:browser");
    expect(data.get("tc-learning-evidence-guest")).toBe("invalid");
  });

  it("resolves owners independently of localStorage access", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("Storage blocked");
      },
    });
    expect(resolveEvidenceOwner(null)).toBe("guest:browser");
    expect(resolveEvidenceOwner("learner-a")).toBe("account:learner-a");
  });

  it("reports unavailable IndexedDB instead of returning an empty saved history", async () => {
    vi.stubGlobal("indexedDB", undefined);
    await expect(listLearningEvidence("account:learner-a")).rejects.toThrow(
      "cannot save run records",
    );
    await expect(listLearningEvidence("invalid-owner")).rejects.toThrow(
      "account identity is invalid",
    );
  });
});

describe("reader-first evaluation storage", () => {
  it("blocks evaluation writes before opening storage while preserving legacy saves", async () => {
    vi.stubEnv("NEXT_PUBLIC_EVALUATION_SAVES_ENABLED", undefined);
    const db = database();
    const evaluation = await snapshot("deep-scan-eval");
    await expect(saveLearningEvidence(evaluation)).rejects.toThrow(
      "not enabled yet",
    );
    expect(db.open).not.toHaveBeenCalled();
    expect(db.writes).toEqual([]);
    const normalization = await snapshot("normalize-data");
    await saveLearningEvidence(normalization);
    expect(await listLearningEvidence(normalization.ownerScope)).toEqual([
      normalization,
    ]);
  });

  it("keeps evaluation readable and deletable after writes are disabled", async () => {
    const db = database();
    vi.stubEnv("NEXT_PUBLIC_EVALUATION_SAVES_ENABLED", "true");
    const evaluation = await snapshot("deep-scan-eval");
    await saveLearningEvidence(evaluation);
    vi.stubEnv("NEXT_PUBLIC_EVALUATION_SAVES_ENABLED", "false");
    expect(
      await listLearningEvidence(evaluation.ownerScope, "deep-scan-eval"),
    ).toEqual([evaluation]);
    const network = await snapshot("simple-network");
    await saveLearningEvidence(network);
    expect(await listLearningEvidence(evaluation.ownerScope)).toEqual([
      network,
      evaluation,
    ]);
    const before = JSON.stringify(db.owners.get(evaluation.ownerScope));
    await expect(
      saveLearningEvidence(await snapshot("deep-scan-eval")),
    ).rejects.toThrow("not enabled yet");
    expect(JSON.stringify(db.owners.get(evaluation.ownerScope))).toBe(before);
    await deleteLearningEvidence(evaluation.ownerScope, evaluation.runId);
    expect(await listLearningEvidence(evaluation.ownerScope)).toEqual([
      network,
    ]);
  });

  it("retains first/latest save order and idempotency independently for evaluation", async () => {
    const db = database();
    vi.stubEnv("NEXT_PUBLIC_EVALUATION_SAVES_ENABLED", "true");
    const first = await snapshot("deep-scan-eval");
    const replaced = await snapshot("deep-scan-eval");
    const latest = await snapshot("deep-scan-eval");
    await saveLearningEvidence(first);
    await saveLearningEvidence(replaced);
    await saveLearningEvidence(latest);
    expect(
      await listLearningEvidence(first.ownerScope, "deep-scan-eval"),
    ).toEqual([first, latest]);
    const count = db.writes.length;
    await saveLearningEvidence(first);
    expect(db.writes).toHaveLength(count);
    await expect(
      saveLearningEvidence({
        ...first,
        capturedAt: "2026-11-05T10:00:00.000Z",
      }),
    ).rejects.toThrow("cannot be overwritten");
    await deleteLearningEvidence(first.ownerScope, first.runId);
    expect(
      await listLearningEvidence(first.ownerScope, "deep-scan-eval"),
    ).toEqual([latest]);
  });

  it("reads the legacy owner shape without writing and preserves it during migration", async () => {
    const db = database();
    const normalization = await snapshot("normalize-data");
    const original = {
      ownerScope: normalization.ownerScope,
      first: normalization,
      latest: null,
    };
    db.owners.set(normalization.ownerScope, structuredClone(original));
    expect(await listLearningEvidence(normalization.ownerScope)).toEqual([
      normalization,
    ]);
    expect(db.writes).toEqual([]);
    expect(db.owners.get(normalization.ownerScope)).toEqual(original);
    const network = await snapshot("simple-network");
    await saveLearningEvidence(network);
    expect(await listLearningEvidence(normalization.ownerScope)).toEqual([
      normalization,
      network,
    ]);
    expect(db.owners.get(normalization.ownerScope)).toMatchObject({
      milestones: { "reusable-scaling": { first: normalization } },
    });
  });

  it("selects historical milestones after the current authoring registry changes", async () => {
    const db = database();
    const normalization = await snapshot("normalize-data");
    await saveLearningEvidence(normalization);
    const current = LEARNING_EVIDENCE_CONTEXTS[
      "normalize-data"
    ] as unknown as Record<string, unknown>;
    const previous = {
      milestoneId: current.milestoneId,
      fixtureVersion: current.fixtureVersion,
    };
    try {
      current.milestoneId = "future-normalization";
      current.fixtureVersion = "2";
      expect(
        await listLearningEvidence(normalization.ownerScope, "normalize-data"),
      ).toEqual([normalization]);
      const before = db.writes.length;
      await saveLearningEvidence(normalization);
      expect(db.writes).toHaveLength(before);
    } finally {
      Object.assign(current, previous);
    }
  });

  it("rejects owner capacity atomically across all three supported milestones", async () => {
    const db = database();
    vi.stubEnv("NEXT_PUBLIC_EVALUATION_SAVES_ENABLED", "true");
    const normalization = await snapshot("normalize-data", true);
    const network = await snapshot("simple-network", true);
    const evaluation = await snapshot("deep-scan-eval", true);
    await saveLearningEvidence(normalization);
    await saveLearningEvidence(network);
    const before = JSON.stringify(db.owners.get(normalization.ownerScope));
    expect(Buffer.byteLength(before)).toBeLessThan(
      LEARNING_EVIDENCE_LIMITS.ownerBytes,
    );
    const writesBefore = db.writes.length;
    await expect(saveLearningEvidence(evaluation)).rejects.toThrow(
      "storage limit",
    );
    expect(db.writes).toHaveLength(writesBefore);
    expect(JSON.stringify(db.owners.get(normalization.ownerScope))).toBe(
      before,
    );
    expect(await listLearningEvidence(normalization.ownerScope)).toEqual([
      normalization,
      network,
    ]);
  });

  it("blocks the whole owner without mutation when it contains an unsupported milestone", async () => {
    const db = database();
    const normalization = await snapshot("normalize-data");
    await saveLearningEvidence(normalization);
    const stored = db.owners.get(normalization.ownerScope) as {
      milestones: Record<string, unknown>;
    };
    stored.milestones["future-stage"] = { first: normalization, latest: null };
    const before = JSON.stringify(stored);
    const count = db.writes.length;
    await expect(
      listLearningEvidence(normalization.ownerScope, "normalize-data"),
    ).rejects.toThrow("could not read saved runs");
    await expect(
      saveLearningEvidence(await snapshot("simple-network")),
    ).rejects.toThrow("could not read saved runs");
    expect(JSON.stringify(db.owners.get(normalization.ownerScope))).toBe(
      before,
    );
    expect(db.writes).toHaveLength(count);
  });
});
