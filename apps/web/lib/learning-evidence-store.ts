import {
  evidenceBytes,
  canSaveLearningEvidence,
  getLearningEvidenceMilestones,
  LEARNING_EVIDENCE_MILESTONES,
  LEARNING_EVIDENCE_LIMITS,
  validateLearningEvidence,
  validEvidenceOwner,
  verifyLearningEvidence,
  type LearningEvidenceSnapshot,
  type LearningEvidenceExerciseSlug,
  type LearningEvidenceMilestoneId,
} from "./learning-evidence-types";

const DATABASE = "tc-learning-evidence";
const STORE = "owners";

interface MilestoneRecords {
  first: LearningEvidenceSnapshot | null;
  latest: LearningEvidenceSnapshot | null;
}

interface OwnerRecords {
  ownerScope: string;
  milestones: Partial<Record<LearningEvidenceMilestoneId, MilestoneRecords>>;
}

const MILESTONES = LEARNING_EVIDENCE_MILESTONES;

/** Signing in never adopts the browser's guest records automatically. */
export function resolveEvidenceOwner(userId: string | null): string {
  if (userId !== null) {
    const owner = `account:${userId}`;
    if (!validEvidenceOwner(owner))
      throw new Error("The account identity is invalid.");
    return owner;
  }
  // IndexedDB already isolates browsers. A fixed guest scope also lets two
  // new tabs save concurrently without racing to create a shared identity.
  return "guest:browser";
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("This browser cannot save run records."));
      return;
    }
    const request = indexedDB.open(DATABASE, 1);
    let settled = false;
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE)) {
        request.result.createObjectStore(STORE, { keyPath: "ownerScope" });
      }
    };
    request.onerror = () => {
      settled = true;
      reject(request.error);
    };
    request.onblocked = () => {
      settled = true;
      reject(
        new Error(
          "Another tab is preventing this browser from opening saved runs.",
        ),
      );
    };
    request.onsuccess = () => {
      const db = request.result;
      db.onversionchange = () => db.close();
      if (settled) db.close();
      else resolve(db);
    };
  });
}

function object(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readMilestone(
  value: unknown,
  ownerScope: string,
  milestoneId: LearningEvidenceMilestoneId,
): MilestoneRecords {
  if (
    !object(value) ||
    Object.keys(value).some((key) => !["first", "latest"].includes(key))
  )
    throw new Error("This browser could not read saved runs.");
  const first =
    value.first === null
      ? null
      : validateLearningEvidence(value.first, ownerScope);
  const latest =
    value.latest === null
      ? null
      : validateLearningEvidence(value.latest, ownerScope);
  if (
    (!first && latest) ||
    (first && first.milestoneId !== milestoneId) ||
    (latest && latest.milestoneId !== milestoneId) ||
    (first && latest && first.runId === latest.runId)
  )
    throw new Error("This browser could not read saved runs.");
  return { first, latest };
}

function readOwner(value: unknown, ownerScope: string): OwnerRecords {
  if (!validEvidenceOwner(ownerScope))
    throw new Error("The account identity is invalid.");
  if (value === undefined) return { ownerScope, milestones: {} };
  if (!object(value) || value.ownerScope !== ownerScope)
    throw new Error("This browser could not read saved runs.");
  const records: OwnerRecords = { ownerScope, milestones: {} };
  if (!Object.hasOwn(value, "milestones")) {
    // The first release stored normalization directly on the owner record.
    // Read it without a write. A later successful mutation stores this same
    // data in its own milestone inside the existing atomic transaction.
    if (
      Object.keys(value).some(
        (key) => !["ownerScope", "first", "latest"].includes(key),
      )
    )
      throw new Error("This browser could not read saved runs.");
    records.milestones["reusable-scaling"] = readMilestone(
      { first: value.first, latest: value.latest },
      ownerScope,
      "reusable-scaling",
    );
  } else {
    if (
      Object.keys(value).some(
        (key) => !["ownerScope", "milestones"].includes(key),
      ) ||
      !object(value.milestones) ||
      Object.keys(value.milestones).some(
        (key) => !MILESTONES.includes(key as LearningEvidenceMilestoneId),
      )
    )
      throw new Error("This browser could not read saved runs.");
    for (const milestone of MILESTONES) {
      if (Object.hasOwn(value.milestones, milestone)) {
        records.milestones[milestone] = readMilestone(
          value.milestones[milestone],
          ownerScope,
          milestone,
        );
      }
    }
  }
  const snapshots = ownerSnapshots(records);
  if (
    new Set(snapshots.map((snapshot) => snapshot.runId)).size !==
    snapshots.length
  )
    throw new Error("This browser could not read saved runs.");
  if (
    evidenceBytes(JSON.stringify(value)) > LEARNING_EVIDENCE_LIMITS.ownerBytes
  )
    throw new Error("This browser's saved runs exceed the storage limit.");
  return records;
}

function ownerSnapshots(
  records: OwnerRecords,
  exerciseSlug?: LearningEvidenceExerciseSlug,
) {
  const milestoneIds = exerciseSlug
    ? getLearningEvidenceMilestones(exerciseSlug)
    : MILESTONES;
  return milestoneIds.flatMap((id) => {
    const milestone = records.milestones[id];
    return milestone
      ? [milestone.first, milestone.latest].filter(
          (snapshot): snapshot is LearningEvidenceSnapshot => snapshot !== null,
        )
      : [];
  });
}

async function transaction<T>(
  ownerScope: string,
  mode: IDBTransactionMode,
  operation: (records: OwnerRecords, store: IDBObjectStore) => T,
): Promise<T> {
  if (!validEvidenceOwner(ownerScope))
    throw new Error("The account identity is invalid.");
  const db = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = db.transaction(STORE, mode);
      const store = tx.objectStore(STORE);
      let result: T;
      let failure: unknown;
      tx.oncomplete = () => resolve(result);
      tx.onerror = () =>
        reject(
          failure ??
            tx.error ??
            new Error("This browser could not save the run."),
        );
      tx.onabort = () =>
        reject(
          failure ??
            tx.error ??
            new Error("This browser could not save the run."),
        );
      const request = store.get(ownerScope);
      request.onsuccess = () => {
        try {
          result = operation(readOwner(request.result, ownerScope), store);
        } catch (error) {
          failure = error;
          tx.abort();
        }
      };
    });
  } finally {
    db.close();
  }
}

export async function listLearningEvidence(
  ownerScope: string,
  exerciseSlug?: LearningEvidenceExerciseSlug,
): Promise<LearningEvidenceSnapshot[]> {
  if (
    exerciseSlug !== undefined &&
    !getLearningEvidenceMilestones(exerciseSlug).length
  )
    throw new Error("This exercise does not support saved runs yet.");
  const snapshots = await transaction(ownerScope, "readonly", (records) =>
    ownerSnapshots(records, exerciseSlug),
  );
  return Promise.all(
    snapshots.map((snapshot) => verifyLearningEvidence(snapshot, ownerScope)),
  );
}

async function mutateVerifiedOwner(
  ownerScope: string,
  operation: (records: OwnerRecords, store: IDBObjectStore) => void,
): Promise<void> {
  // Hash verification is asynchronous and cannot hold an IDB transaction open.
  // Recheck the inspected state inside the write transaction, retrying when
  // another tab saved in between. Never replace an unverified existing record.
  for (let attempt = 0; attempt < 8; attempt++) {
    const inspected = await transaction(
      ownerScope,
      "readonly",
      (records) => records,
    );
    await Promise.all(
      ownerSnapshots(inspected).map((snapshot) =>
        verifyLearningEvidence(snapshot, ownerScope),
      ),
    );
    const applied = await transaction(
      ownerScope,
      "readwrite",
      (current, store) => {
        if (JSON.stringify(current) !== JSON.stringify(inspected)) return false;
        operation(current, store);
        return true;
      },
    );
    if (applied) return;
  }
  throw new Error("Another tab is updating saved runs. Try again.");
}

/** Each milestone retains its first save while its latest save can change. */
export async function saveLearningEvidence(
  snapshot: LearningEvidenceSnapshot,
): Promise<void> {
  if (!canSaveLearningEvidence(snapshot.exerciseSlug))
    throw new Error(
      "Saving this exercise's runs is not enabled yet. You can inspect or download this run.",
    );
  const validated = await verifyLearningEvidence(snapshot, snapshot.ownerScope);
  return mutateVerifiedOwner(validated.ownerScope, (records, store) => {
    const existing = ownerSnapshots(records).find(
      (item) => item.runId === validated.runId,
    );
    if (existing) {
      if (JSON.stringify(existing) !== JSON.stringify(validated))
        throw new Error(
          "A saved run cannot be overwritten with different results.",
        );
      return;
    }
    const previous = records.milestones[validated.milestoneId];
    records.milestones[validated.milestoneId] = previous?.first
      ? { first: previous.first, latest: validated }
      : { first: validated, latest: null };
    if (
      evidenceBytes(JSON.stringify(records)) >
      LEARNING_EVIDENCE_LIMITS.ownerBytes
    ) {
      throw new Error(
        "Saved runs have reached this browser's storage limit. Download or delete a saved run before saving again.",
      );
    }
    store.put(records);
  });
}

export async function deleteLearningEvidence(
  ownerScope: string,
  runId: string,
): Promise<void> {
  return mutateVerifiedOwner(ownerScope, (records, store) => {
    for (const id of MILESTONES) {
      const milestone = records.milestones[id];
      if (!milestone) continue;
      if (milestone.first?.runId === runId) {
        milestone.first = milestone.latest;
        milestone.latest = null;
      } else if (milestone.latest?.runId === runId) {
        milestone.latest = null;
      }
      if (!milestone.first) delete records.milestones[id];
    }
    if (ownerSnapshots(records).length) store.put(records);
    else store.delete(ownerScope);
  });
}
