"use client";

import { useEffect, useId, useRef, useState } from "react";
import { AnimatedAvatar, ScenePortrait } from "@tensorcraft/ui";
import { portraitSources, resolveCharacter } from "@/lib/character-art";
import { TensorFlowApiLink } from "../mdx/tensorflow-reference";
import type { LessonVisualSpec } from "./deep-orbit-visuals";
import { FIRST_PACKET } from "./instrument-math";
import { runTensorExample } from "./tensor-example";

const fmt = (value: number, digits = 2) =>
  Number(value.toFixed(digits)).toString();
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

  useEffect(() => {
    // Follow a requested calculation, but do not pull the reader back if
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

  async function calculate() {
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
          alt="On the Archimedes bridge, Demir studies the unfamiliar signal at a console."
          aspectRatio="16 / 9"
          className="tensor-investigation-art"
        />
        <div className="tensor-investigation-request">
          <p className="tensor-investigation-location">Archimedes, Bridge</p>
          <div className="tensor-investigation-speaker">
            <AnimatedAvatar name="Ensign Demir" {...demir} />
            <p>
              <strong>Demir</strong>
              <span>At the signal console</span>
            </p>
          </div>
          <blockquote className="iv-instruction">{spec.action}</blockquote>
        </div>
      </div>

      <div className="tensor-investigation-console">
        <figure className="iv-reading-chart tensor-investigation-packet">
          <figcaption>
            <strong>Sector 7-G: the first packet</strong>
            <span>Five sensor readings in a JavaScript array</span>
          </figcaption>
          <svg viewBox="0 0 400 150" aria-hidden="true">
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
                fill={result ? "var(--tc-primary)" : "var(--tc-muted)"}
                fillOpacity={result ? 1 : 0.7}
              />
            ))}
            {result && (
              <g>
                <line
                  x1="0"
                  x2="400"
                  y1={120 - result.average * 104}
                  y2={120 - result.average * 104}
                  stroke="var(--iv-brass)"
                  strokeWidth="2"
                  strokeDasharray="6 4"
                />
                <text x="0" y="145">
                  Dashed line: average {fmt(result.average, 3)}
                </text>
              </g>
            )}
          </svg>
          <div
            className={`iv-cells${result ? "" : " iv-cells-muted"}`}
            style={{ gridTemplateColumns: "repeat(5, minmax(0, 1fr))" }}
            role="list"
            aria-label="Five sensor readings in a JavaScript array"
          >
            {(result?.values ?? FIRST_PACKET).map((value, index) => (
              <span key={index} role="listitem">
                {fmt(value)}
              </span>
            ))}
          </div>
          {result ? (
            <div className="iv-creation-shape">
              <code>shape [{result.shape.join(", ")}]</code>
              <span>
                The tensor still holds all {result.values.length} readings.
              </span>
            </div>
          ) : (
            <p className="tensor-packet-note">
              This is the same five-reading teaching packet you will use in the
              challenge.
            </p>
          )}
        </figure>

        <section className="iv-worked-example" aria-label="Worked example">
          <div className="iv-example-step">
            <h3>Keep the five readings together</h3>
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
              Here, <code>tf</code> is TensorFlow.js. The tensor{" "}
              <code>reading</code> holds the values from your array,{" "}
              <code>streamValues</code>.
            </p>
          </div>
          <div className="iv-example-step">
            <h3>Calculate Demir's summary</h3>
            <pre className="iv-example-code">
              <code>
                <span className="iv-code-keyword">const</span>{" "}
                <span className="iv-code-average">average</span>
                {" = "}
                <TensorFlowApiLink symbol="tf.mean" />(
                <span className="iv-code-reading">reading</span>);
              </code>
            </pre>
            <p>
              <code>mean</code> means average: add the five readings, then
              divide by five. Like <code>.reduce()</code>, this combines them
              into one result.
            </p>
          </div>
          <div className="iv-creation-line">
            <button
              ref={runButton}
              type="button"
              disabled={pending}
              aria-expanded={Boolean(result)}
              aria-controls={resultId}
              onClick={calculate}
            >
              {pending
                ? "Calculating…"
                : result
                  ? "Reset example"
                  : "Calculate average"}
            </button>
            {!result && <span>Run both lines for this packet.</span>}
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
            <div className="tensor-investigation-speaker">
              <AnimatedAvatar name="ARIA" {...aria} />
              <p>
                <strong>ARIA</strong>
                <span>Responding to the calculation</span>
              </p>
            </div>
            <div>
              <p className="iv-average-result">
                Average reading <strong>{fmt(result.average, 3)}</strong>
              </p>
              <p>
                The lowest reading is {fmt(Math.min(...result.values))}; the
                highest is {fmt(Math.max(...result.values))}. An average does
                not identify unusual readings.
              </p>
              <p className="tensor-investigation-consequence">
                Demir keeps the full packet for Farah. She will need the
                individual readings to investigate further.
              </p>
            </div>
          </div>
        ) : failed ? (
          <p>
            The calculation could not run. Select Calculate average to try
            again.
          </p>
        ) : pending ? (
          <p>Loading TensorFlow.js and calculating the average…</p>
        ) : null}
      </div>

      <div className="tensor-investigation-reference">
        <details>
          <summary>Why use a tensor for an average?</summary>
          <p className="iv-takeaway">{spec.takeaway}</p>
        </details>
        <p className="iv-provenance">
          Runs with TensorFlow.js in your browser. Values are rounded for
          display.
        </p>
      </div>
    </div>
  );
}
