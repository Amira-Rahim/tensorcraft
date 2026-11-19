// @vitest-environment node
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { beforeAll, describe, expect, it } from "vitest";
import * as tf from "@tensorflow/tfjs";
import {
  ROOM_DATA_SHA256,
  runRoomTraining,
  type RoomData,
  type RoomProgress,
  type RoomTrainingResult,
} from "../../../public/demos/room-training.mjs";
import preview from "../../../public/assignments/room-project-preview.json";
import reference from "../../../public/assignments/room-training-reference-v1.json";

const bytes = readFileSync(
  new URL(
    "../../../public/assignments/room-occupancy-v1/data.json",
    import.meta.url,
  ),
);
const data: RoomData = JSON.parse(bytes.toString());
let result: RoomTrainingResult;
const progress: RoomProgress[] = [];

beforeAll(async () => {
  const before = tf.memory().numTensors;
  result = await runRoomTraining(tf, data, {
    onEpoch: (value) => {
      progress.push(value);
    },
  });
  expect(tf.memory().numTensors).toBe(before);
});

describe("browser room training", () => {
  it("keeps the published supplied reference tied to the actual numerical run and source versions", () => {
    expect(reference.kind).toBe("supplied-maintainer-reference");
    expect(reference.runtimeVersion).toBe(result.runtimeVersion);
    expect(reference.backend).toBe(result.backend);
    expect(reference.epochs).toBe(result.epochs);
    expect(reference.counts).toEqual(result.counts);
    expect(reference.periods).toEqual(result.periods);
    expect(reference.modelMetrics).toEqual(result.modelMetrics);
    expect(reference.baselineMetrics).toEqual(result.baselineMetrics);
    for (const [url, hash] of Object.entries(reference.sourceHashes)) {
      const bytes = readFileSync(
        new URL(`../../../public${url}`, import.meta.url),
      );
      expect(createHash("sha256").update(bytes).digest("hex")).toBe(hash);
    }
  });

  it("reproduces the identified fixture and computes a paired validation comparison", () => {
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      ROOM_DATA_SHA256,
    );
    expect(result).toMatchObject({
      runtimeVersion: "4.22.0",
      backend: "cpu",
      epochs: 5,
      counts: { train: 1200, validation: 400, reserved: 456 },
      modelMetrics: {
        tp: 60,
        fp: 20,
        tn: 319,
        fn: 1,
        count: 400,
        accuracy: 0.9475,
        totalErrorCost: 24,
      },
      baselineMetrics: {
        tp: 61,
        fp: 36,
        tn: 303,
        fn: 0,
        count: 400,
        accuracy: 0.91,
        totalErrorCost: 36,
      },
      periods: {
        train: { from: "2015-02-02 14:19:00", to: "2015-02-12 10:30:00" },
        validation: { from: "2015-02-12 10:40:00", to: "2015-02-15 05:10:00" },
        reserved: { from: "2015-02-15 05:19:59", to: "2015-02-18 09:10:00" },
      },
    });
    expect(result.losses).toHaveLength(5);
    expect(result.losses.every(Number.isFinite)).toBe(true);
    expect(progress).toEqual(
      result.losses.map((loss, index) => ({
        epoch: index + 1,
        epochs: 5,
        loss,
      })),
    );
    expect(result.mistakes[0]).toMatchObject({
      id: preview.row.id,
      occupied: preview.row.occupied,
      model: preview.prediction.model,
      baseline: preview.prediction.baseline,
    });
    expect(result.mistakes[0]!.score).toBeCloseTo(preview.prediction.score, 5);
    const validationIds = new Set(
      data.rows.slice(1200, 1600).map((row) => row.id),
    );
    expect(result.mistakes).toHaveLength(8);
    for (const row of result.mistakes) {
      expect(validationIds.has(row.id)).toBe(true);
      expect(row.model !== row.occupied || row.baseline !== row.occupied).toBe(
        true,
      );
    }
  });

  it("keeps changed validation inputs and labels out of fitted parameters", async () => {
    const changed = structuredClone(data);
    for (const row of changed.rows.slice(1200, 1600)) {
      row.co2 += 1000;
      row.light += 300;
      row.occupied = row.occupied === 1 ? 0 : 1;
    }
    const before = tf.memory().numTensors;
    const altered = await runRoomTraining(tf, changed);
    expect(tf.memory().numTensors).toBe(before);
    expect(altered.preprocessing).toEqual(result.preprocessing);
    expect(altered.losses).toEqual(result.losses);
    expect(altered.modelMetrics).not.toEqual(result.modelMetrics);
    const labels = changed.rows.slice(1200, 1600).map((row) => row.occupied);
    const occupied = labels.filter((label) => label === 1).length;
    expect(altered.modelMetrics.tp + altered.modelMetrics.fn).toBe(occupied);
    expect(altered.baselineMetrics.tp + altered.baselineMetrics.fn).toBe(
      occupied,
    );
    expect(altered.modelMetrics.count).toBe(400);
    expect(altered.baselineMetrics.count).toBe(400);
  });

  it("never uses reserved inputs or labels for training or evaluation", async () => {
    const changed = structuredClone(data);
    for (const row of changed.rows.slice(1600)) {
      row.temperature += 100;
      row.co2 += 10000;
      row.light += 5000;
      row.occupied = row.occupied === 1 ? 0 : 1;
    }
    const before = tf.memory().numTensors;
    expect(await runRoomTraining(tf, changed)).toEqual(result);
    expect(tf.memory().numTensors).toBe(before);
  });

  it.each([1, 15] as const)(
    "runs the bounded %i epoch setting and releases its tensors",
    async (epochs) => {
      const before = tf.memory().numTensors;
      const measured = await runRoomTraining(tf, data, { epochs });
      expect(measured.epochs).toBe(epochs);
      expect(measured.losses).toHaveLength(epochs);
      expect(measured.modelMetrics.count).toBe(400);
      expect(tf.memory().numTensors).toBe(before);
    },
  );

  it("uses scale 1 for a constant training feature", async () => {
    const changed = structuredClone(data);
    for (const row of changed.rows.slice(0, 1200)) row.light = 100;
    const measured = await runRoomTraining(tf, changed, { epochs: 1 });
    expect(measured.preprocessing.mean[1]).toBe(100);
    expect(measured.preprocessing.std[1]).toBe(1);
    expect(measured.losses.every(Number.isFinite)).toBe(true);
  });

  it("rejects unsupported settings, changed provenance and invalid row structure before allocating tensors", async () => {
    const before = tf.memory().numTensors;
    for (const epochs of [0, 2, 16, 1.5, NaN]) {
      await expect(
        runRoomTraining(tf, data, { epochs: epochs as 5 }),
      ).rejects.toThrow("Choose 1, 5 or 15");
    }
    const mutations = [
      (value: RoomData) => {
        value.rows.pop();
      },
      (value: RoomData) => {
        value.sourceArchiveSha256 = "changed";
      },
      (value: RoomData) => {
        value.rows[1]!.id = value.rows[0]!.id;
      },
      (value: RoomData) => {
        value.rows[1]!.recordedAt = value.rows[0]!.recordedAt;
      },
      (value: RoomData) => {
        value.rows[1]!.temperature = NaN;
      },
      (value: RoomData) => {
        value.rows[1200]!.light = -1;
      },
      (value: RoomData) => {
        value.rows[1600]!.occupied = 2 as 1;
      },
    ];
    for (const mutate of mutations) {
      const changed = structuredClone(data);
      mutate(changed);
      await expect(runRoomTraining(tf, changed)).rejects.toThrow();
    }
    await expect(
      runRoomTraining(
        { ...tf, version: { ...tf.version, tfjs: "0.0.0" } },
        data,
      ),
    ).rejects.toThrow("4.22.0");
    expect(tf.memory().numTensors).toBe(before);
  });

  it("cleans up after a progress callback fails during a real fit", async () => {
    const before = tf.memory().numTensors;
    await expect(
      runRoomTraining(tf, data, {
        onEpoch: () => {
          throw new Error("Stopped progress receiver");
        },
      }),
    ).rejects.toThrow("Stopped progress receiver");
    expect(tf.memory().numTensors).toBe(before);
  });

  it("releases trained weights and optimizer state if validation cannot run", async () => {
    const changed = structuredClone(data);
    changed.rows[1200]!.co2 = 1e100;
    const before = tf.memory().numTensors;
    await expect(runRoomTraining(tf, changed)).rejects.toThrow("float32 range");
    expect(tf.memory().numTensors).toBe(before);
  });
});
