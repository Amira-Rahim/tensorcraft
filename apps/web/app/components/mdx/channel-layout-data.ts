import { LEARNING_ACTIVITIES } from "@tensorcraft/shared";

export const CHANNEL_EXPERIMENT_ID = "deep-orbit-channel-layout";
export const CHANNEL_EXPERIMENT_VERSION =
  LEARNING_ACTIVITIES[CHANNEL_EXPERIMENT_ID].version;
export const CHANNEL_STORAGE_KEY = `tensorcraft:experiment:${CHANNEL_EXPERIMENT_ID}:v${CHANNEL_EXPERIMENT_VERSION}`;
export type LayoutOperation = "reshape" | "transpose";
export const WORKED_PACKET = [
  [2, 20, 5, 8],
  [3, 18, 7, 8],
  [4, 16, 6, 9],
];
export const CHECK_PACKET = [
  [10, 20, 30],
  [11, 21, 31],
];

/** Only rectangular finite numeric packets have an axis interpretation. */
export function packetShape(packet: readonly (readonly number[])[]) {
  const width = packet[0]?.length ?? 0;
  if (
    !width ||
    packet.some(
      (row) => row.length !== width || row.some((n) => !Number.isFinite(n)),
    )
  )
    throw new Error("Expected a nonempty rectangular numeric packet");
  return [packet.length, width] as const;
}

export function channelValues(
  packet: readonly (readonly number[])[],
  channel: number,
) {
  const [, channels] = packetShape(packet);
  if (!Number.isInteger(channel) || channel < 0 || channel >= channels)
    throw new Error("Channel is outside this packet");
  return packet.map((row) => row[channel]);
}

export function transformPacket(
  packet: readonly (readonly number[])[],
  operation: LayoutOperation,
) {
  const [times, channels] = packetShape(packet);
  if (operation === "transpose")
    return Array.from({ length: channels }, (_, channel) =>
      channelValues(packet, channel),
    );
  if (operation !== "reshape") throw new Error("Unknown layout operation");
  const flat = packet.flat();
  return Array.from({ length: channels }, (_, row) =>
    flat.slice(row * times, (row + 1) * times),
  );
}

export function parseTrace(value: string): number[] | null {
  const normalized = value.trim();
  if (!normalized || normalized.length > 80) return null;
  const parts = normalized.split(/\s*,\s*|\s+/);
  if (parts.some((part) => !/^-?\d+(?:\.\d+)?$/.test(part))) return null;
  return parts.map(Number);
}

export function matchesTrace(value: string, expected: readonly number[]) {
  const actual = parseTrace(value);
  return (
    actual !== null &&
    actual.length === expected.length &&
    actual.every((v, i) => v === expected[i])
  );
}

export function checkChannelTransfer(
  operation: LayoutOperation | null,
  values: string,
) {
  return {
    operationCorrect: operation === "transpose",
    valuesCorrect: matchesTrace(values, channelValues(CHECK_PACKET, 1)),
  };
}

export interface LayoutAttempt {
  correct: boolean;
  assisted: boolean;
}
export interface ChannelDraft {
  version: typeof CHANNEL_EXPERIMENT_VERSION;
  mode: "worked" | "check";
  channel: number;
  tableBuilt: boolean;
  operation: LayoutOperation | null;
  prediction: string;
  predictionResult: LayoutAttempt | null;
  latestPrediction: LayoutAttempt | null;
  firstPrediction: LayoutAttempt | null;
  predictionAttempts: number;
  predictionHelp: boolean;
  explanation: boolean;
  checkOperation: LayoutOperation | null;
  checkValues: string;
  checkResult: LayoutAttempt | null;
  latestCheck: LayoutAttempt | null;
  firstCheck: LayoutAttempt | null;
  checkAttempts: number;
  checkHelp: boolean;
  checkAnswer: boolean;
  started: boolean;
}
export function channelDraft(): ChannelDraft {
  return {
    version: CHANNEL_EXPERIMENT_VERSION,
    mode: "worked",
    channel: 0,
    tableBuilt: false,
    operation: null,
    prediction: "",
    predictionResult: null,
    latestPrediction: null,
    firstPrediction: null,
    predictionAttempts: 0,
    predictionHelp: false,
    explanation: false,
    checkOperation: null,
    checkValues: "",
    checkResult: null,
    latestCheck: null,
    firstCheck: null,
    checkAttempts: 0,
    checkHelp: false,
    checkAnswer: false,
    started: false,
  };
}

/** Reject incompatible/corrupt drafts instead of presenting plausible results. */
export function parseChannelDraft(raw: string): ChannelDraft {
  if (raw.length > 3000) throw new Error("Experiment draft is too large");
  const d = JSON.parse(raw) as ChannelDraft;
  const operation = (v: unknown) =>
    v === null || v === "reshape" || v === "transpose";
  const attempt = (v: LayoutAttempt | null) =>
    v === null ||
    (typeof v === "object" &&
      typeof v.correct === "boolean" &&
      typeof v.assisted === "boolean");
  const count = (v: unknown) =>
    typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 20;
  if (
    !d ||
    d.version !== CHANNEL_EXPERIMENT_VERSION ||
    !["worked", "check"].includes(d.mode) ||
    !Number.isInteger(d.channel) ||
    d.channel < 0 ||
    d.channel > 3 ||
    !operation(d.operation) ||
    !operation(d.checkOperation) ||
    typeof d.prediction !== "string" ||
    d.prediction.length > 80 ||
    typeof d.checkValues !== "string" ||
    d.checkValues.length > 80 ||
    !count(d.predictionAttempts) ||
    !count(d.checkAttempts) ||
    ![
      d.predictionHelp,
      d.explanation,
      d.checkHelp,
      d.checkAnswer,
      d.started,
      d.tableBuilt,
    ].every((v) => typeof v === "boolean") ||
    ![
      d.predictionResult,
      d.latestPrediction,
      d.firstPrediction,
      d.checkResult,
      d.latestCheck,
      d.firstCheck,
    ].every(attempt) ||
    (d.predictionAttempts === 0) !== (d.firstPrediction === null) ||
    (d.checkAttempts === 0) !== (d.firstCheck === null)
  )
    throw new Error("Experiment draft is incompatible");
  // Copy only the known fields. Stored results are practice records, not credit.
  return Object.fromEntries(
    Object.keys(channelDraft()).map((key) => [
      key,
      d[key as keyof ChannelDraft],
    ]),
  ) as unknown as ChannelDraft;
}
