import { describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs";
import {
  WORKED_PACKET,
  CHECK_PACKET,
  transformPacket,
  channelValues,
  matchesTrace,
  checkChannelTransfer,
  channelDraft,
  parseChannelDraft,
} from "./channel-layout-data";

describe("channel layout numerical contract", () => {
  it("matches real TFJS on the worked, changed, and additional rectangular packets without retaining tensors", async () => {
    await tf.setBackend("cpu");
    await tf.ready();
    const before = tf.memory().numTensors;
    for (const packet of [
      WORKED_PACKET,
      CHECK_PACKET,
      [
        [-2, 5],
        [0, 8],
        [11, 3],
        [7, -4],
      ],
    ]) {
      for (const operation of ["reshape", "transpose"] as const) {
        const expected = tf.tidy(() => {
          const tensor = tf.tensor2d(packet);
          return (
            operation === "reshape"
              ? tensor.reshape([packet[0].length, packet.length])
              : tensor.transpose()
          ).arraySync();
        });
        expect(transformPacket(packet, operation)).toEqual(expected);
      }
    }
    expect(tf.memory().numTensors).toBe(before);
    expect(transformPacket(WORKED_PACKET, "reshape")[2]).toEqual([6, 7, 8]);
    expect(transformPacket(WORKED_PACKET, "transpose")[2]).toEqual([2, 6, 10]);
  });
  it("rejects dimensions-only and wrong-value answers", () => {
    expect(checkChannelTransfer("reshape", "20, 21")).toEqual({
      operationCorrect: false,
      valuesCorrect: true,
    });
    expect(checkChannelTransfer("transpose", "30, 11")).toEqual({
      operationCorrect: true,
      valuesCorrect: false,
    });
    expect(checkChannelTransfer("transpose", "20, 21")).toEqual({
      operationCorrect: true,
      valuesCorrect: true,
    });
    for (const value of [
      "",
      "20,21,",
      "20,21,31",
      "0x14,21",
      "20,Infinity",
      "20,,21",
      "3,2",
    ])
      expect(matchesTrace(value, [20, 21])).toBe(false);
  });
  it("rejects malformed packets instead of assigning fictional axes", () => {
    for (const packet of [[], [[]], [[1, 2], [3]], [[NaN]], [[Infinity]]])
      expect(() => transformPacket(packet, "transpose")).toThrow();
    expect(() => channelValues(WORKED_PACKET, 4)).toThrow();
  });
  it("validates persisted version and bounded record fields", () => {
    const draft = channelDraft();
    expect(parseChannelDraft(JSON.stringify(draft))).toEqual(draft);
    for (const patch of [
      { version: 2 },
      { channel: 4 },
      { checkAttempts: -1 },
      { checkAttempts: 21 },
      { firstCheck: { correct: true } },
      { prediction: "x".repeat(81) },
      { checkAttempts: 1 },
    ])
      expect(() =>
        parseChannelDraft(JSON.stringify({ ...draft, ...patch })),
      ).toThrow();
    expect(() => parseChannelDraft("null")).toThrow();
  });
});
