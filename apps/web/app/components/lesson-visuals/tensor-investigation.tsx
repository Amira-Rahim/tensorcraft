"use client";

import { useState } from "react";
import {
  AnimatedAvatar,
  CodeBlock,
  Dialogue,
  ScenePortrait,
} from "@tensorcraft/ui";
import { ExerciseOutput } from "@tensorcraft/ui";
import { portraitSources, resolveCharacter } from "@/lib/character-art";
import { TensorFlowApiLink } from "../mdx/tensorflow-reference";
import { WORKED_PACKET, WORKED_EXCERPT } from "../mdx/channel-layout-data";
import type { LessonVisualSpec } from "./deep-orbit-visuals";
import { runTensorExample } from "./tensor-example";
import { resolveLessonSceneArt } from "@/lib/lesson-scene-art";

const demir = portraitSources(
  "deep-orbit",
  resolveCharacter("deep-orbit", "Ensign Demir"),
  "focused",
);

/** Plot the selected recording using actual TensorFlow.js output. */
export function TensorInvestigation({ spec }: { spec: LessonVisualSpec }) {
  const art = resolveLessonSceneArt({
    worldSlug: "deep-orbit",
    moduleSlug: "foundations",
    lessonSlug: "introduction-to-tensors",
    phase: "concept",
  })!;
  const [completed, setCompleted] = useState<Awaited<
    ReturnType<typeof runTensorExample>
  > | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [selectedSensor, setSelectedSensor] = useState<number | null>(null);
  const values = WORKED_PACKET.flat();
  async function run() {
    if (pending) return;
    setCompleted(null);
    setSelectedSensor(null);
    setPending(true);
    setError("");
    try {
      const result = await runTensorExample(values);
      if (
        result.shape.length !== 1 ||
        result.shape[0] !== values.length ||
        result.values.length !== values.length ||
        result.values.some((v, i) => Math.abs(v - values[i]!) > 1e-6) ||
        result.chartRows.length !== 4 ||
        result.chartRows.some(
          (row, sensor) =>
            row.length !== WORKED_PACKET.length ||
            row.some(
              (v, moment) => Math.abs(v - values[moment * 4 + sensor]!) > 1e-6,
            ),
        )
      ) {
        throw new Error("The chart data does not match the selected readings.");
      }
      setCompleted(result);
    } catch {
      setError("We couldn’t draw the chart. Try running the code again.");
    } finally {
      setPending(false);
    }
  }
  return (
    <div
      className="lesson-instrument tensor-investigation"
      data-no-swipe
      data-instrument="tensor"
      data-mode="create"
    >
      <div className="tensor-investigation-opening">
        <ScenePortrait
          src={art.src}
          alt={art.alt}
          aspectRatio="3 / 2"
          className="tensor-investigation-art"
        />
        <div className="tensor-investigation-request">
          <Dialogue
            speaker="Demir"
            direction="At the signal console"
            layout="speech"
            avatarSlot={
              <AnimatedAvatar name="Ensign Demir" {...demir} size={64} />
            }
          >
            {spec.action}
          </Dialogue>
        </div>
      </div>
      <section className="tensor-investigation-purpose">
        <h3>Give the chart code its readings</h3>
        <p>{spec.takeaway}</p>
      </section>
      <section className="tensor-investigation-console">
        <h3>Demir’s selected readings</h3>
        <p>
          The recording lists A, B, C, D at each moment. These are the same
          selected sensors and moments you’ll work with in the challenge.
        </p>
        <p>
          <TensorFlowApiLink symbol="tf.tensor">tf.tensor()</TensorFlowApiLink>{" "}
          creates the tensor. <code>reading.shape</code> tells us how many
          values it holds. Run this example to see the shape, then explore the
          chart drawn by the supplied code.
        </p>
        <CodeBlock
          language="javascript"
          title="prepare-readings.js"
          footer={
            <div className="tensor-example-actions">
              {/* aria-disabled, not disabled: a disabled button drops
                  keyboard focus to the page body mid-run. run() already
                  ignores clicks while pending. */}
              <button
                type="button"
                onClick={run}
                aria-disabled={pending || undefined}
                className="tensor-example-run"
              >
                {pending ? "Running example…" : "Run example"}
              </button>
            </div>
          }
        >
          {`const streamValues = [
${WORKED_PACKET.map((row) => `  ${row.join(", ")},`).join("\n")}
];

const reading = tf.tensor(streamValues);
const shape = reading.shape;`}
        </CodeBlock>
        {error && <p role="alert">{error}</p>}
        {completed && (
          <>
            <p className="text-xl">
              The example’s tensor has shape{" "}
              <code>[{completed.shape.join(", ")}]</code>: one axis holding{" "}
              {completed.values.length} values. The supplied chart code groups
              those readings into {WORKED_EXCERPT.sensorIds.length} lines, one
              for each sensor.
            </p>
            <div aria-label="Positions in the example's flat list">
              <h3>Each sensor’s positions in the list</h3>
              <p>
                Select a sensor on the chart below to highlight its values here.
                JavaScript indices start at 0. The recording’s header gives the
                repeating order A, B, C, D.
              </p>
              <ol className="flex flex-wrap gap-3 my-5 list-none p-0">
                {completed.values.map((value, index) => (
                  <li
                    key={index}
                    data-reading-index={index}
                    data-source-sensor={WORKED_EXCERPT.sensorIds[index % 4]}
                    data-selected={
                      selectedSensor === null || index % 4 === selectedSensor
                    }
                    className="flex flex-col items-center px-3 py-2 border border-border rounded data-[selected=true]:bg-surface-hover data-[selected=true]:font-bold"
                  >
                    <span className="text-sm">Index {index}</span>
                    <code>{value}</code>
                  </li>
                ))}
              </ol>
              <p aria-live="polite">
                {selectedSensor === null
                  ? "All sensors are visible. Each group of four values records one selected moment."
                  : `Sensor ${WORKED_EXCERPT.sensorIds[selectedSensor]} uses indices ${completed.values.flatMap((_, index) => (index % 4 === selectedSensor ? [index] : [])).join(", ")}. Its readings are ${completed.chartRows[selectedSensor]!.join(", ")}, in moment order.`}
              </p>
            </div>
            <ExerciseOutput
              outputLabel="Chart from this example"
              statusMessage="From this supplied example run"
              stale={false}
              complete
              seriesSelection={{
                artifactIndex: 0,
                seriesIndex: selectedSensor,
              }}
              onSeriesSelect={(_, sensor) => setSelectedSensor(sensor)}
              artifacts={[
                {
                  kind: "series",
                  title: "Readings over time",
                  summary:
                    "This chart uses the example’s tensor. Select a sensor to follow its line. The numbers along the bottom show the selected moments in order. They carry no clock timestamps. The readings are part of the ship’s fictional recording.",
                  xLabel: "Selected moment",
                  yLabel: "Recorded reading",
                  labels: Array.from({ length: WORKED_PACKET.length }, (_, i) =>
                    String(i + 1),
                  ),
                  series: completed.chartRows.map((readings, i) => ({
                    name: `Sensor ${WORKED_EXCERPT.sensorIds[i]}`,
                    values: readings,
                  })),
                },
              ]}
            />
            <p>
              Next, Farah will help you write the code that keeps each sensor’s
              readings together.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
