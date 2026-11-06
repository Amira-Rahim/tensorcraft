import {
  validateArtifacts,
  type ExerciseArtifact,
  type ExerciseRunSnapshot,
} from "@tensorcraft/ui";
import { decodeEvaluationResult } from "@tensorcraft/shared";

export const LEARNING_EVIDENCE_LIMITS = {
  codeBytes: 256 * 1024,
  artifactBytes: 64 * 1024,
  ownerBytes: 2 * 1024 * 1024,
} as const;

// These descriptors preserve the exact schema-1 meanings already stored in
// browsers. Add another descriptor for a new contract instead of editing one.
const HISTORICAL_CONTEXTS = {
  "normalize-data": {
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
  },
  "simple-network": {
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
    units: Array<string>(8).fill("dimensionless practice value"),
  },
  "deep-scan-eval": {
    worldId: "deep-orbit",
    moduleId: "training-loop",
    lessonId: "evaluating-deep-scan",
    exerciseSlug: "deep-scan-eval",
    milestoneId: "held-out-evaluation",
    fixtureId: "deep-scan-evaluation-100-43",
    fixtureVersion: "1",
    sourceLabel: "Assigned exercise: 100 training rows and 43 evaluation cases",
    origin: "browser exercise run",
    featureOrder: [
      "Practice feature 1",
      "Practice feature 2",
      "Practice feature 3",
    ],
    units: Array<string>(3).fill("dimensionless practice value"),
  },
} as const;

export type LearningEvidenceExerciseSlug = keyof typeof HISTORICAL_CONTEXTS;
type EvidenceContext =
  (typeof HISTORICAL_CONTEXTS)[LearningEvidenceExerciseSlug];
export type LearningEvidenceMilestoneId = EvidenceContext["milestoneId"];

for (const context of Object.values(HISTORICAL_CONTEXTS)) {
  Object.freeze(context.featureOrder);
  Object.freeze(context.units);
  Object.freeze(context);
}
Object.freeze(HISTORICAL_CONTEXTS);

function authoringContext<T extends EvidenceContext>(context: T): T {
  // Keep the current registry independent, including its nested arrays.
  return JSON.parse(JSON.stringify(context)) as T;
}

export const LEARNING_EVIDENCE_CONTEXTS = {
  "normalize-data": authoringContext(HISTORICAL_CONTEXTS["normalize-data"]),
  "simple-network": authoringContext(HISTORICAL_CONTEXTS["simple-network"]),
  "deep-scan-eval": authoringContext(HISTORICAL_CONTEXTS["deep-scan-eval"]),
} as const;

type DescriptorId = "normalization-v1" | "network-v1" | "evaluation-v1";
interface EvidenceDescriptor {
  readonly id: DescriptorId;
  readonly schemaVersion: 1;
  readonly context: EvidenceContext;
}
const HISTORICAL_DESCRIPTORS: readonly EvidenceDescriptor[] = Object.freeze([
  Object.freeze({
    id: "normalization-v1",
    schemaVersion: 1,
    context: HISTORICAL_CONTEXTS["normalize-data"],
  } as const),
  Object.freeze({
    id: "network-v1",
    schemaVersion: 1,
    context: HISTORICAL_CONTEXTS["simple-network"],
  } as const),
  Object.freeze({
    id: "evaluation-v1",
    schemaVersion: 1,
    context: HISTORICAL_CONTEXTS["deep-scan-eval"],
  } as const),
]);
const IDENTITY_KEYS = [
  "worldId",
  "moduleId",
  "lessonId",
  "exerciseSlug",
  "milestoneId",
  "fixtureId",
  "fixtureVersion",
] as const;

function historicalDescriptor(value: unknown): EvidenceDescriptor | null {
  if (!record(value)) return null;
  return (
    HISTORICAL_DESCRIPTORS.find(
      (descriptor) =>
        value.schemaVersion === descriptor.schemaVersion &&
        IDENTITY_KEYS.every((key) => value[key] === descriptor.context[key]),
    ) ?? null
  );
}

export function getHistoricalLearningEvidenceContext(
  value: unknown,
): EvidenceContext | null {
  return historicalDescriptor(value)?.context ?? null;
}

export const LEARNING_EVIDENCE_MILESTONES = Object.freeze([
  ...new Set(
    HISTORICAL_DESCRIPTORS.map((descriptor) => descriptor.context.milestoneId),
  ),
]);

export function getLearningEvidenceMilestones(
  slug: unknown,
): readonly LearningEvidenceMilestoneId[] {
  return Object.freeze([
    ...new Set(
      HISTORICAL_DESCRIPTORS.filter(
        (descriptor) => descriptor.context.exerciseSlug === slug,
      ).map((descriptor) => descriptor.context.milestoneId),
    ),
  ]);
}

export function getLearningEvidenceContext(
  slug: unknown,
): EvidenceContext | null {
  return typeof slug === "string" &&
    Object.hasOwn(LEARNING_EVIDENCE_CONTEXTS, slug)
    ? LEARNING_EVIDENCE_CONTEXTS[slug as LearningEvidenceExerciseSlug]
    : null;
}

/** Reader support ships before the separately enabled evaluation writer. */
export function canSaveLearningEvidence(slug: unknown): boolean {
  if (slug === "normalize-data" || slug === "simple-network") return true;
  return (
    slug === "deep-scan-eval" &&
    process.env.NEXT_PUBLIC_EVALUATION_SAVES_ENABLED === "true"
  );
}

const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;

export interface LearningEvidenceSnapshot {
  schemaVersion: 1;
  runId: string;
  ownerScope: string;
  worldId: EvidenceContext["worldId"];
  moduleId: EvidenceContext["moduleId"];
  lessonId: EvidenceContext["lessonId"];
  exerciseSlug: EvidenceContext["exerciseSlug"];
  milestoneId: EvidenceContext["milestoneId"];
  capturedAt: string;
  exerciseVersion: string;
  starterHash: string;
  testHash: string;
  codeHash: string;
  submittedCode: string;
  runtimeVersion: string | null;
  backend: string | null;
  fixtureId: EvidenceContext["fixtureId"];
  fixtureVersion: EvidenceContext["fixtureVersion"];
  sourceLabel: EvidenceContext["sourceLabel"];
  featureOrder: string[];
  units: string[];
  selectedRowIds: number[];
  actualSelectedValues: number[][];
  artifacts: ExerciseArtifact[];
  checks: { name: string; passed: boolean; error?: string }[];
  runOutcome: "passed" | "partial" | "failed" | "errored";
  assistance: {
    hintsRevealed: number[];
    hintHistory: "session-only";
    solutionViewed: boolean;
  };
  origin: EvidenceContext["origin"];
}

export function evidenceBytes(value: string): number {
  return new TextEncoder().encode(value).byteLength;
}

export function validEvidenceOwner(value: unknown): value is string {
  return (
    typeof value === "string" &&
    (value === "guest:browser" ||
      /^account:[a-zA-Z0-9_-]{1,128}$/.test(value) ||
      (value.startsWith("guest:") && UUID.test(value.slice(6))))
  );
}

async function hash(value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(value),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function learningEvidenceVersion(
  starterCode: string,
  testCode: string,
): Promise<string> {
  const [starterHash, testHash] = await Promise.all([
    hash(starterCode),
    hash(testCode),
  ]);
  return hash(`${starterHash}:${testHash}`);
}

function legacySelectedInputs(
  artifacts: ExerciseArtifact[],
  context: EvidenceContext,
  network: boolean,
) {
  const title = network ? "Selected training readings" : "Input readings";
  const tables = artifacts.filter((artifact) => artifact.title === title);
  if (!tables.length) return { selectedRowIds: [], actualSelectedValues: [] };
  const table = tables[0]!;
  const columns = network
    ? ["Row ID", "Label", ...context.featureOrder]
    : ["Reading", ...context.featureOrder];
  const rowIds = [
    ...Array.from({ length: 8 }, (_, i) => i),
    ...Array.from({ length: 8 }, (_, i) => i + 60),
  ];
  if (
    tables.length !== 1 ||
    table.kind !== "table" ||
    JSON.stringify(table.columns) !== JSON.stringify(columns) ||
    (network && table.rows.length !== rowIds.length)
  ) {
    throw new Error("The saved input table has an unsupported format.");
  }
  const rows = table.rows.map((row, index) => {
    if (
      row[0] !== (network ? rowIds[index] : index + 1) ||
      row.some((cell) => typeof cell !== "number" || !Number.isFinite(cell))
    ) {
      throw new Error("The saved input table contains invalid readings.");
    }
    return row as number[];
  });
  return {
    selectedRowIds: rows.map((row) => row[0]!),
    actualSelectedValues: rows.map((row) => row.slice(network ? 2 : 1)),
  };
}

function selectedInputs(
  artifacts: ExerciseArtifact[],
  descriptor: EvidenceDescriptor,
) {
  switch (descriptor.id) {
    case "normalization-v1":
      return legacySelectedInputs(artifacts, descriptor.context, false);
    case "network-v1":
      return legacySelectedInputs(artifacts, descriptor.context, true);
    case "evaluation-v1": {
      const decoded = decodeEvaluationResult(artifacts);
      if (!decoded.context || decoded.integrity.status === "invalid")
        throw new Error(
          "This evaluation result has an unsupported or invalid format.",
        );
      return {
        selectedRowIds: decoded.cases.map((row) => row.position),
        actualSelectedValues: decoded.cases.map((row) => [...row.features]),
      };
    }
  }
}

/** Hashes identify submitted source. They do not verify browser execution. */
export async function createLearningEvidence(
  incoming: ExerciseRunSnapshot,
  ownerScope: string,
): Promise<LearningEvidenceSnapshot> {
  // Copy before the first await so later UI changes cannot alter this run.
  const run: ExerciseRunSnapshot = {
    ...incoming,
    artifacts: validateArtifacts(incoming.artifacts),
    checks: incoming.checks.map((check) => ({ ...check })),
    assistance: {
      ...incoming.assistance,
      hintsRevealed: [...incoming.assistance.hintsRevealed],
    },
  };
  const currentContext = getLearningEvidenceContext(run.exerciseSlug);
  const descriptor =
    currentContext &&
    historicalDescriptor({ schemaVersion: 1, ...currentContext });
  if (
    !currentContext ||
    !descriptor ||
    Object.entries(descriptor.context).some(
      ([key, expected]) =>
        JSON.stringify(currentContext[key as keyof EvidenceContext]) !==
        JSON.stringify(expected),
    )
  )
    throw new Error("This exercise does not support saved runs yet.");
  const context = descriptor.context;
  if (evidenceBytes(run.submittedCode) > LEARNING_EVIDENCE_LIMITS.codeBytes)
    throw new Error("This run's source is too large to save.");
  const [starterHash, testHash, codeHash] = await Promise.all([
    hash(run.starterCode),
    hash(run.testCode),
    hash(run.submittedCode),
  ]);
  const artifacts = validateArtifacts(run.artifacts);
  return validateLearningEvidence(
    {
      schemaVersion: 1,
      runId: crypto.randomUUID(),
      ownerScope,
      ...context,
      capturedAt: run.capturedAt,
      exerciseVersion: await hash(`${starterHash}:${testHash}`),
      starterHash,
      testHash,
      codeHash,
      submittedCode: run.submittedCode,
      runtimeVersion: run.runtimeVersion,
      backend: run.backend,
      ...selectedInputs(artifacts, descriptor),
      artifacts,
      checks: run.checks.map(({ name, passed, error }) => ({
        name,
        passed,
        ...(error === undefined ? {} : { error }),
      })),
      runOutcome: run.errored
        ? "errored"
        : run.checks.length > 0 && run.checks.every((check) => check.passed)
          ? "passed"
          : artifacts.length > 0 || run.checks.some((check) => check.passed)
            ? "partial"
            : "failed",
      assistance: {
        hintsRevealed: [...run.assistance.hintsRevealed],
        hintHistory: run.assistance.hintHistory,
        solutionViewed: run.assistance.solutionViewed,
      },
    },
    ownerScope,
  );
}

function boundedString(
  value: unknown,
  max: number,
  empty = false,
): value is string {
  return (
    typeof value === "string" &&
    (empty || value.length > 0) &&
    value.length <= max
  );
}

function record(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

/** Reject malformed local records rather than silently changing their meaning. */
export function validateLearningEvidence(
  value: unknown,
  ownerScope: string,
): LearningEvidenceSnapshot {
  const invalid = () => {
    throw new Error("This saved run is invalid or belongs to another account.");
  };
  if (
    !record(value) ||
    !validEvidenceOwner(ownerScope) ||
    value.ownerScope !== ownerScope ||
    value.schemaVersion !== 1
  )
    return invalid();
  const descriptor = historicalDescriptor(value);
  if (!descriptor) return invalid();
  const context = descriptor.context;
  const allowed = [
    "schemaVersion",
    "runId",
    "ownerScope",
    ...Object.keys(context),
    "capturedAt",
    "exerciseVersion",
    "starterHash",
    "testHash",
    "codeHash",
    "submittedCode",
    "runtimeVersion",
    "backend",
    "featureOrder",
    "units",
    "selectedRowIds",
    "actualSelectedValues",
    "artifacts",
    "checks",
    "runOutcome",
    "assistance",
  ];
  if (
    Object.keys(value).some((key) => !allowed.includes(key)) ||
    Object.entries(context).some(
      ([key, expected]) =>
        JSON.stringify(value[key]) !== JSON.stringify(expected),
    ) ||
    !boundedString(value.runId, 36) ||
    !UUID.test(value.runId) ||
    !boundedString(value.capturedAt, 30) ||
    !Number.isFinite(Date.parse(value.capturedAt)) ||
    new Date(value.capturedAt).toISOString() !== value.capturedAt ||
    [
      value.exerciseVersion,
      value.starterHash,
      value.testHash,
      value.codeHash,
    ].some(
      (item) => typeof item !== "string" || !/^[a-f0-9]{64}$/.test(item),
    ) ||
    typeof value.submittedCode !== "string" ||
    evidenceBytes(value.submittedCode) > LEARNING_EVIDENCE_LIMITS.codeBytes ||
    [value.runtimeVersion, value.backend].some(
      (item) => item !== null && !boundedString(item, 80),
    )
  )
    return invalid();
  const artifacts = validateArtifacts(value.artifacts);
  if (
    JSON.stringify(artifacts) !== JSON.stringify(value.artifacts) ||
    evidenceBytes(JSON.stringify(artifacts)) >
      LEARNING_EVIDENCE_LIMITS.artifactBytes
  )
    return invalid();
  const inputs = selectedInputs(artifacts, descriptor);
  if (
    JSON.stringify(value.selectedRowIds) !==
      JSON.stringify(inputs.selectedRowIds) ||
    JSON.stringify(value.actualSelectedValues) !==
      JSON.stringify(inputs.actualSelectedValues)
  )
    return invalid();
  if (
    !Array.isArray(value.checks) ||
    value.checks.length > 100 ||
    Array.from(value.checks).some(
      (check) =>
        !record(check) ||
        Object.keys(check).some(
          (key) => !["name", "passed", "error"].includes(key),
        ) ||
        !boundedString(check.name, 1000) ||
        typeof check.passed !== "boolean" ||
        (check.error !== undefined && !boundedString(check.error, 6000, true)),
    )
  )
    return invalid();
  const assistance = value.assistance;
  if (
    !record(assistance) ||
    Object.keys(assistance).some(
      (key) =>
        !["hintsRevealed", "hintHistory", "solutionViewed"].includes(key),
    ) ||
    assistance.hintHistory !== "session-only" ||
    typeof assistance.solutionViewed !== "boolean" ||
    !Array.isArray(assistance.hintsRevealed) ||
    assistance.hintsRevealed.length > 3 ||
    Array.from(assistance.hintsRevealed).some(
      (level) => ![1, 2, 3].includes(level),
    ) ||
    new Set(assistance.hintsRevealed).size !== assistance.hintsRevealed.length
  )
    return invalid();
  const passed =
    value.checks.length > 0 && value.checks.every((check) => check.passed);
  const expectedOutcome = passed
    ? "passed"
    : artifacts.length > 0 || value.checks.some((check) => check.passed)
      ? "partial"
      : "failed";
  if (value.runOutcome !== "errored" && value.runOutcome !== expectedOutcome)
    return invalid();
  return JSON.parse(JSON.stringify(value)) as LearningEvidenceSnapshot;
}

export async function verifyLearningEvidence(
  value: unknown,
  ownerScope: string,
): Promise<LearningEvidenceSnapshot> {
  const snapshot = validateLearningEvidence(value, ownerScope);
  const [codeHash, exerciseVersion] = await Promise.all([
    hash(snapshot.submittedCode),
    hash(`${snapshot.starterHash}:${snapshot.testHash}`),
  ]);
  if (
    codeHash !== snapshot.codeHash ||
    exerciseVersion !== snapshot.exerciseVersion
  ) {
    throw new Error("The saved source no longer matches this run's record.");
  }
  return snapshot;
}
