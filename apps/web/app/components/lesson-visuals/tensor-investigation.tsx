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

/** The opening investigation responds only to a completed TensorFlow.js run. */
export function TensorInvestigation({ spec }: { spec: LessonVisualSpec }) {
  const [result, setResult] = useState<Awaited<
    ReturnType<typeof runTensorExample>
  > | null>(null);
  const [pending, setPending] = useState(false);
  const [failed, setFailed] = useState(false);
  const resultId = useId();
  const response = useRef<HTMLDivElement>(null);
  const runButton = useRef<HTMLButtonElement>(null);
  // Compare the readback with the input, allowing TensorFlow.js float32 rounding.
  const readingsPreserved =
    result !== null &&
    result.shape.length === 1 &&
    result.shape[0] === FIRST_PACKET.length &&
    result.values.length === FIRST_PACKET.length &&
    result.values.every(
      (value, index) => Math.abs(value - FIRST_PACKET[index]!) < 1e-6,
    );

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
      setResult(null);
      return;
    }
    setPending(true);
    setFailed(false);
    try {
      setResult(await runTensorExample(FIRST_PACKET));
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
        <div className="tensor-investigation-console">
          <figure className="iv-reading-chart tensor-investigation-packet">
            <figcaption>
              <strong>
                <span className="tensor-stage-number">1</span> JavaScript array
              </strong>
              <span>Sector 7-G: the first packet</span>
            </figcaption>
            <svg viewBox="0 0 400 130" aria-hidden="true">
              <text x="0" y="18">
                1
              </text>
              <text x="0" y="125">
                0
              </text>
              <line x1="0" x2="400" y1="120" y2="120" className="iv-gridline" />
              {FIRST_PACKET.map((value, index) => (
                <rect
                  key={index}
                  x={20 + index * 80}
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
              style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}
              role="list"
              aria-label="Five sensor readings in a JavaScript array"
            >
              {FIRST_PACKET.map((value, index) => (
                <span key={index} role="listitem">
                  {fmt(value)}
                </span>
              ))}
            </div>
            <p className="tensor-packet-note">
              <code>streamValues</code> holds these five readings.
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
              {readingsPreserved && (
                <div className="tensor-investigation-consequence">
                  <p>
                    <ProseText>
                      Demir records the successful check for Farah. The readings
                      are prepared; finding patterns in them comes later.
                    </ProseText>
                  </p>
                </div>
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
