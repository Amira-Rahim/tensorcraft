"use client";

import { useId, useState } from "react";
import { AnimatedAvatar, Dialogue, ScenePortrait } from "@tensorcraft/ui";
import { ExerciseOutput } from "@tensorcraft/ui";
import { portraitSources, resolveCharacter } from "@/lib/character-art";
import { TensorFlowApiLink } from "../mdx/tensorflow-reference";
import { WORKED_PACKET, WORKED_EXCERPT } from "../mdx/channel-layout-data";
import type { LessonVisualSpec } from "./deep-orbit-visuals";
import { runTensorExample } from "./tensor-example";

const demir = portraitSources(
  "deep-orbit",
  resolveCharacter("deep-orbit", "Ensign Demir"),
  "focused",
);

/** A supplied viewer, driven by actual TensorFlow.js output. */
export function TensorInvestigation({ spec }: { spec: LessonVisualSpec }) {
  const id = useId();
  const [moments, setMoments] = useState(3);
  const [completed, setCompleted] = useState<{
    moments: number;
    result: Awaited<ReturnType<typeof runTensorExample>>;
  } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const values = WORKED_PACKET.slice(0, moments).flat();
  async function run() {
    if (pending) return;
    setCompleted(null);
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
            row.length !== moments ||
            row.some(
              (v, moment) => Math.abs(v - values[moment * 4 + sensor]!) > 1e-6,
            ),
        )
      ) {
        throw new Error("The viewer returned different readings.");
      }
      setCompleted({ moments, result });
    } catch {
      setError(
        "The viewer could not read the selected values. Try running it again.",
      );
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
          src="/scenes/deep-orbit/foundations/introduction-to-tensors.webp"
          alt="Demir opens the signal viewer at a console aboard the Archimedes."
          aspectRatio="16 / 9"
          className="tensor-investigation-art"
        />
        <div className="tensor-investigation-request">
          <Dialogue
            speaker="Demir"
            direction="At the signal console"
            layout="speech"
            avatarSlot={<AnimatedAvatar name="Ensign Demir" {...demir} />}
          >
            {spec.action}
          </Dialogue>
        </div>
      </div>
      <section className="tensor-investigation-purpose">
        <h3>Connect the recording to the viewer</h3>
        <p>{spec.takeaway}</p>
      </section>
      <section className="tensor-investigation-console">
        <h3>Demir’s selected readings</h3>
        <p>
          The recording lists A, B, C, D at each moment. These are the same
          selected sensors and moments you’ll work with in the challenge.
        </p>
        <div className="my-6">
          <label htmlFor={`${id}-moments`} className="block mb-3 text-lg">
            How much of the excerpt should the viewer use?
          </label>
          <select
            id={`${id}-moments`}
            value={moments}
            disabled={pending}
            onChange={(e) => {
              setMoments(Number(e.target.value));
              setError("");
            }}
            className="border border-border bg-surface-raised text-text-primary px-4 py-3 text-lg"
          >
            <option value={3}>All three moments: 12 readings</option>
            <option value={2}>First two moments: 8 readings</option>
          </select>
        </div>
        <pre
          className="overflow-x-auto py-5 text-lg"
          aria-label="Selected readings"
        >
          <code>[{values.join(", ")}]</code>
        </pre>
        <p>
          <TensorFlowApiLink symbol="tf.tensor">tf.tensor()</TensorFlowApiLink>{" "}
          creates the viewer’s input. The supplied code groups the readings and
          draws the lines. It does not train a model.
        </p>
        <button
          type="button"
          onClick={run}
          disabled={pending}
          className="my-6 px-6 py-3 bg-accent text-surface font-semibold text-lg border border-border rounded"
        >
          {pending ? "Opening the viewer…" : "Create tensor and open viewer"}
        </button>
        {error && <p role="alert">{error}</p>}
        {completed && (
          <>
            <p className="text-xl">
              The tensor has shape{" "}
              <code>[{completed.result.shape.join(", ")}]</code>. The supplied
              viewer reads it into {WORKED_EXCERPT.sensorIds.length} sensor
              lines.
            </p>
            <ExerciseOutput
              outputLabel="Output from the supplied viewer"
              stale={completed.moments !== moments}
              staleMessage="Your selection has changed. Run the viewer again to update these results."
              complete
              artifacts={[
                {
                  kind: "series",
                  title: "Readings over time",
                  summary:
                    "From the tensor you just created. Select a sensor to follow its readings. The moments are positions within this fictional excerpt, not timestamps.",
                  xLabel: "Moment in this excerpt",
                  yLabel: "Recorded reading",
                  labels: Array.from({ length: completed.moments }, (_, i) =>
                    String(i + 1),
                  ),
                  series: completed.result.chartRows.map((readings, i) => ({
                    name: `Sensor ${WORKED_EXCERPT.sensorIds[i]}`,
                    values: readings,
                  })),
                },
              ]}
            />
            <p>
              Change the excerpt length and run again to see what the viewer
              receives. In the next mission, you’ll build its grouping steps
              with Farah.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
