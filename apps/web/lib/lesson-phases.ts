import { recallContentVersion } from "./recall-content-version";

/** Version 2 combines the old Concept and Code phases. */
export const LESSON_STEPS_VERSION = 2;
export const PHASE = {
  briefing: 0,
  concept: 1,
  challenge: 2,
  takeaways: 3,
  epilogue: 4,
} as const;
export const STEP_NAMES = [
  "Briefing",
  "Concept",
  "Challenge",
  "Takeaways",
  "Epilogue",
] as const;
export const STEP_EVENT_NAMES = [
  "Briefing",
  "Concept",
  "Challenge",
  "Takeaways",
  "Consequence",
] as const;
export const TOTAL_STEPS = STEP_NAMES.length;
const hashes = ["briefing", "concept", "challenge", "takeaways", "epilogue"];
const legacy = [0, 1, 1, 2, 3, 4];

function valid(value: unknown, count: number): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 0 &&
    value < count
  );
}
export function migrateLegacyStep(value: unknown): number | null {
  return valid(value, legacy.length) ? legacy[value]! : null;
}
export function stepHash(step: number): string {
  return `#step-${hashes[step] ?? "briefing"}`;
}
export function parseStepHash(hash: string): number | null {
  const index = hashes.findIndex((name) => hash === `#step-${name}`);
  if (index >= 0) return index;
  const match = /^#step-([1-6])$/.exec(hash);
  return match ? migrateLegacyStep(Number(match[1]) - 1) : null;
}
export function historyStep(state: unknown, hash: string): number | null {
  if (state && typeof state === "object") {
    const { tcStep, tcStepsVersion } = state as {
      tcStep?: unknown;
      tcStepsVersion?: unknown;
    };
    if (tcStepsVersion === LESSON_STEPS_VERSION && valid(tcStep, TOTAL_STEPS))
      return tcStep;
    if (tcStepsVersion === undefined) {
      const mapped = migrateLegacyStep(tcStep);
      if (mapped !== null) return mapped;
    }
  }
  return parseStepHash(hash);
}
export function lessonStepKeys(
  world: string,
  lesson: string,
  owner: string | null,
) {
  const suffix = `${world}_${lesson}${owner ? `:account:${owner}` : ""}`;
  const recallVersion = recallContentVersion(world, lesson);
  return {
    current: `tc_step_v2_${suffix}`,
    max: `tc_step_max_v2_${suffix}`,
    legacyCurrent: `tc_step_${suffix}`,
    legacyMax: `tc_step_max_${suffix}`,
    passed: `tc_step_${suffix}-passed`,
    recall: `tc_recall_${recallVersion > 1 ? `v${recallVersion}_` : ""}${suffix}`,
  };
}
type Reader = Pick<Storage, "getItem">;
function read(storage: Reader, key: string): unknown {
  try {
    const value = storage.getItem(key);
    return value === null ? null : JSON.parse(value);
  } catch {
    return null;
  }
}
/** Each field is isolated: corrupt visited data cannot discard a valid position. */
export function restoreLessonSteps(
  storage: Reader,
  keys: ReturnType<typeof lessonStepKeys>,
) {
  const readStep = (key: string, oldKey: string) => {
    const value = read(storage, key);
    return valid(value, TOTAL_STEPS)
      ? value
      : migrateLegacyStep(read(storage, oldKey));
  };
  const current = readStep(keys.current, keys.legacyCurrent);
  const max = readStep(keys.max, keys.legacyMax);
  const list = (key: string, old: boolean): number[] | null => {
    const value = read(storage, key);
    if (
      !Array.isArray(value) ||
      !value.every((item) => valid(item, old ? 6 : 5))
    )
      return null;
    return [
      ...new Set(value.map((item: number) => (old ? legacy[item]! : item))),
    ];
  };
  const exact =
    list(`${keys.current}-visited`, false) ??
    list(`${keys.legacyCurrent}-visited`, true);
  const visited =
    exact ??
    (current !== null || max !== null
      ? Array.from(
          { length: Math.max(current ?? 0, max ?? 0) + 1 },
          (_, i) => i,
        )
      : []);
  return { current, max, visited };
}
