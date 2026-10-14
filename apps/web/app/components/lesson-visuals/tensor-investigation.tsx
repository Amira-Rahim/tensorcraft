"use client";
import { ProseText } from "@tensorcraft/ui/prose-text";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatedAvatar, ScenePortrait } from "@tensorcraft/ui";
import { portraitSources, resolveCharacter } from "@/lib/character-art";
import { TensorFlowApiLink } from "../mdx/tensorflow-reference";
import type { LessonVisualSpec } from "./deep-orbit-visuals";
import { FIRST_PACKET } from "./instrument-math";
import { runTensorExample } from "./tensor-example";

const fmt = (value: number) => Number(value.toFixed(2)).toString();
const demir = portraitSources(
  "deep-orbit",
  resolveCharacter("deep-orbit", "Ensign Demir"),
  "focused",
);
const aria = portraitSources(
  "deep-orbit",
  resolveCharacter("deep-orbit", "ARIA"),
  "deadpan",
);

type TensorResult = Awaited<ReturnType<typeof runTensorExample>>;
interface TensorRun {
  packet: number[];
  packetLabel: string;
  prediction: string;
  result: TensorResult;
}
const PRACTICE_PACKET = FIRST_PACKET.slice(0, 3);

/** The opening investigation responds only to a completed TensorFlow.js run. */
export function TensorInvestigation({ spec }: { spec: LessonVisualSpec }) {
  const [packetId, setPacketId] = useState("mission");
  const [packet, setPacket] = useState<number[]>([...FIRST_PACKET]);
  const [prediction, setPrediction] = useState("");
  const [completed, setCompleted] = useState<TensorRun | null>(null);
  const [previous, setPrevious] = useState<TensorRun | null>(null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const result = completed?.result ?? null;
  const packetLabel =
    packetId === "mission" ? "Mission packet" : "Practice packet";
  const resultId = useId();
  const response = useRef<HTMLDivElement>(null);
  const runButton = useRef<HTMLButtonElement>(null);
  // Compare the readback with the input, allowing TensorFlow.js float32 rounding.
  const readingsPreserved =
    result !== null &&
    result.shape.length === 1 &&
    result.shape[0] === completed!.packet.length &&
    result.values.length === completed!.packet.length &&
    result.values.every(
      (value, index) => Math.abs(value - completed!.packet[index]!) < 1e-6,
    );
  const shapePredictionMatches =
    readingsPreserved &&
    Boolean(completed?.prediction.trim()) &&
    Number(completed!.prediction) === result?.shape[0];

  function changePacket(nextId: string, nextValues: number[]) {
    if (pending) return;
    if (completed) setPrevious(completed);
    setPacketId(nextId);
    setPacket(nextValues);
    setCompleted(null);
    setFailed(false);
  }

  function resetExample() {
    setPacketId("mission");
    setPacket([...FIRST_PACKET]);
    setPrediction("");
    setCompleted(null);
    setPrevious(null);
    setFailed(false);
  }

  useEffect(() => {
    // Show the created tensor, but do not pull the reader back if
    // they moved elsewhere while TensorFlow.js was loading.
    if ((result || failed) && document.activeElement === runButton.current) {
      response.current?.scrollIntoView?.({
        block: "nearest",
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
      });
    }
  }, [result, failed]);

  async function createTensor() {
    if (pending) return;
    if (result) {
      resetExample();
      return;
    }
    setPending(true);
    setFailed(false);
    const capturedPacket = [...packet];
    const capturedPrediction = prediction;
    try {
      const nextResult = await runTensorExample(capturedPacket);
      setCompleted({
        packet: capturedPacket,
        packetLabel,
        prediction: capturedPrediction,
        result: nextResult,
      });
    } catch {
      setFailed(true);
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
          alt="In the control room aboard the research ship Archimedes, Demir studies the unfamiliar signal at a console."
          aspectRatio="16 / 9"
          className="tensor-investigation-art"
        />
        <div className="tensor-investigation-request">
          <p className="tensor-investigation-location">
            Control room aboard the research ship Archimedes
          </p>
          <div className="tensor-investigation-speaker">
            <AnimatedAvatar name="Ensign Demir" {...demir} />
            <p>
              <strong>
                <ProseText>Demir</ProseText>
              </strong>
              <span>At the signal console</span>
            </p>
          </div>
          <blockquote className="iv-instruction">
            <ProseText>{spec.action}</ProseText>
          </blockquote>
        </div>
      </div>

      <section className="tensor-investigation-purpose">
        <h3>Why create a tensor?</h3>
        <p>
          <ProseText>{spec.takeaway}</ProseText>
        </p>
      </section>

      <div className="tensor-investigation-workspace">
        <fieldset className="tensor-investigation-practice" disabled={pending}>
          <legend>Try the readings yourself</legend>
          <div className="tensor-investigation-practice-control">
            <label htmlFor={`${resultId}-packet`}>Choose a packet</label>
            <select
              id={`${resultId}-packet`}
              value={packetId}
              onChange={(event) => {
                const nextId = event.target.value;
                changePacket(nextId, [
                  ...(nextId === "mission" ? FIRST_PACKET : PRACTICE_PACKET),
                ]);
                setPrediction("");
              }}
            >
              <option value="mission">Mission packet: five readings</option>
              <option value="practice">Practice packet: three readings</option>
            </select>
          </div>
          <div className="tensor-investigation-practice-control">
            <div className="tensor-investigation-practice-heading">
              <label htmlFor={`${resultId}-reading`}>First reading</label>
              <span>{fmt(packet[0]!)}</span>
            </div>
            <input
              id={`${resultId}-reading`}
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={packet[0]}
              onChange={(event) =>
                changePacket(packetId, [
                  Number(event.target.value),
                  ...packet.slice(1),
                ])
              }
            />
          </div>
          <div className="tensor-investigation-practice-control">
            <label htmlFor={`${resultId}-prediction`}>
              How many values will the tensor contain?
            </label>
            <input
              id={`${resultId}-prediction`}
              type="number"
              min={0}
              step={1}
              value={prediction}
              onChange={(event) => setPrediction(event.target.value)}
              aria-describedby={`${resultId}-prediction-help`}
            />
            <p id={`${resultId}-prediction-help`}>
              Make a prediction, then create the tensor to check. You can leave
              this blank.
            </p>
          </div>
          <p className="tensor-investigation-practice-note">
            {packetId === "mission"
              ? "Start with the mission's five readings. Change the first value, or try the three-reading practice packet."
              : "This practice packet starts with three of the mission readings. It lets you compare a shorter list with the five-reading packet."}
          </p>
        </fieldset>
        <div className="tensor-investigation-console">
          <figure className="iv-reading-chart tensor-investigation-packet">
            <figcaption>
              <strong>
                <span className="tensor-stage-number">1</span> JavaScript array
              </strong>
              <span>
                {packetId === "mission"
                  ? "Sector 7-G: the first packet"
                  : "Practice packet: three readings"}
              </span>
            </figcaption>
            <svg viewBox="0 0 400 130" aria-hidden="true">
              <text x="0" y="18">
                1
              </text>
              <text x="0" y="125">
                0
              </text>
              <line x1="0" x2="400" y1="120" y2="120" className="iv-gridline" />
              {packet.map((value, index) => (
                <rect
                  key={index}
                  x={(400 / packet.length) * (index + 0.5) - 20}
                  y={120 - value * 104}
                  width="40"
                  height={value * 104}
                  fill="var(--tc-muted)"
                  fillOpacity={0.7}
                />
              ))}
            </svg>
            <div
              className="iv-cells iv-cells-muted"
              style={{
                gridTemplateColumns: `repeat(${packet.length}, minmax(0, 1fr))`,
              }}
              role="list"
              aria-label={
                packetId === "mission"
                  ? "Five sensor readings in a JavaScript array"
                  : "Three practice readings in a JavaScript array"
              }
            >
              {packet.map((value, index) => (
                <span key={index} role="listitem">
                  {fmt(value)}
                </span>
              ))}
            </div>
            <p className="tensor-packet-note">
              <code>streamValues</code> holds these{" "}
              {packet.length === 5 ? "five" : "three"} readings.
            </p>
          </figure>

          <div className="tensor-flow-connector" aria-hidden="true">
            <svg viewBox="0 0 40 24" fill="none">
              <path d="M1 12h36M29 4l8 8-8 8" />
            </svg>
          </div>

          <section className="iv-worked-example" aria-label="Worked example">
            <div className="iv-example-step">
              <h3>
                <span className="tensor-stage-number">2</span> Create a tensor
              </h3>
              <pre className="iv-example-code">
                <code>
                  <span className="iv-code-keyword">const</span>{" "}
                  <span className="iv-code-reading">reading</span>
                  {" = "}
                  <TensorFlowApiLink symbol="tf.tensor" />
                  (streamValues);
                </code>
              </pre>
              <p>
                <code>tf</code> is TensorFlow.js. This line creates a tensor
                from your array so TensorFlow.js can calculate with the
                readings.
              </p>
            </div>
            <div className="iv-creation-line">
              <button
                ref={runButton}
                type="button"
                aria-disabled={pending}
                aria-expanded={Boolean(result)}
                aria-controls={resultId}
                onClick={createTensor}
              >
                {pending
                  ? "Creating tensor…"
                  : result
                    ? "Reset example"
                    : "Create tensor"}
              </button>
              <span>This example runs for you.</span>
            </div>
          </section>
        </div>

        <div
          ref={response}
          id={resultId}
          className="iv-creation-status tensor-investigation-response"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {result ? (
            <div
              className="tensor-investigation-findings"
              data-testid="tensor-story-response"
            >
              <div className="tensor-investigation-result">
                <h3>
                  <span className="tensor-stage-number">3</span> Inspect the
                  tensor
                </h3>
                <div
                  className="iv-cells"
                  style={{
                    gridTemplateColumns: `repeat(${result.values.length}, minmax(0, 1fr))`,
                  }}
                  role="list"
                  aria-label="Readings returned from the tensor"
                >
                  {result.values.map((value, index) => (
                    <span key={index} role="listitem">
                      {fmt(value)}
                    </span>
                  ))}
                </div>
                <div className="iv-creation-shape">
                  <code>shape [{result.shape.join(", ")}]</code>
                  <span>{result.values.length} numbers in one list.</span>
                </div>
                {completed?.prediction.trim() && (
                  <p
                    className="tensor-investigation-prediction-feedback"
                    data-correct={shapePredictionMatches ? "true" : "false"}
                  >
                    {!readingsPreserved
                      ? "The readback did not match the input, so this run cannot confirm your prediction. Reset the example and try again."
                      : shapePredictionMatches
                        ? `Your prediction matches. The tensor has ${result.shape[0]} values and shape [${result.shape[0]}].`
                        : `You predicted ${completed.prediction} values. The tensor returned ${result.shape[0]} values, so its shape is [${result.shape[0]}]. Try the other packet and predict again.`}
                  </p>
                )}
              </div>
              <div className="tensor-investigation-interpretation">
                <div className="tensor-investigation-speaker">
                  <AnimatedAvatar name="ARIA" {...aria} />
                  <h3>
                    <ProseText>ARIA</ProseText>
                  </h3>
                </div>
                <blockquote>
                  {readingsPreserved
                    ? `All ${result.values.length} readings match the original array, in the same order. They are now in a tensor that TensorFlow.js can work with.`
                    : "The tensor does not match the original readings. Reset the example and try again."}
                </blockquote>
              </div>
              {readingsPreserved && packetId === "mission" && (
                <div className="tensor-investigation-consequence">
                  <p>
                    <ProseText>
                      Demir records the successful check for Farah. The readings
                      are prepared; finding patterns in them comes later.
                    </ProseText>
                  </p>
                </div>
              )}
              {previous && (
                <details className="tensor-investigation-comparison">
                  <summary>Compare with the previous packet</summary>
                  <div className="tensor-investigation-comparison-runs">
                    <div>
                      <h4>Previous: {previous.packetLabel}</h4>
                      <p>Input: [{previous.packet.map(fmt).join(", ")}]</p>
                      <p>
                        Returned: [{previous.result.values.map(fmt).join(", ")}]
                      </p>
                      <p>Shape: [{previous.result.shape.join(", ")}]</p>
                    </div>
                    <div>
                      <h4>Current: {completed!.packetLabel}</h4>
                      <p>Input: [{completed!.packet.map(fmt).join(", ")}]</p>
                      <p>Returned: [{result.values.map(fmt).join(", ")}]</p>
                      <p>Shape: [{result.shape.join(", ")}]</p>
                    </div>
                  </div>
                </details>
              )}
            </div>
          ) : failed ? (
            <p>
              The tensor could not be created. Select Create tensor to try
              again.
            </p>
          ) : pending ? (
            <p>Loading TensorFlow.js and creating the tensor…</p>
          ) : null}
        </div>

        <div className="tensor-investigation-reference">
          <p className="iv-provenance">
            Runs with TensorFlow.js in your browser. Values are rounded for
            display.
          </p>
        </div>
      </div>
    </div>
  );
}
