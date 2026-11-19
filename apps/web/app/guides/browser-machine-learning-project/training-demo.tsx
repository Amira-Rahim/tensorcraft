"use client";

import { useEffect, useId, useRef, useState } from "react";
import { startTrainingRun, type TrainingRun } from "./training-runner";
import type { TrainingEpochs, TrainingResult } from "./training-types";

const button =
  "min-h-11 border border-border px-4 py-2 font-medium hover:bg-surface-hover focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary aria-disabled:opacity-50";
const select =
  "min-h-11 w-full border border-border bg-background px-3 py-2 text-text focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary disabled:opacity-50";
const cell = "border-b border-border px-4 py-3 text-left tabular-nums";
const number = (value: number) => Number(value.toPrecision(5)).toString();

export function TrainingDemo() {
  const id = useId();
  const [epochs, setEpochs] = useState<TrainingEpochs>(5);
  const [phase, setPhase] = useState<"idle" | "loading" | "training">("idle");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Ready to train the supplied example.");
  const [error, setError] = useState("");
  const [result, setResult] = useState<TrainingResult | null>(null);
  const runRef = useRef<TrainingRun | null>(null);
  const pending = phase !== "idle";

  useEffect(
    () => () => {
      const active = runRef.current;
      runRef.current = null;
      active?.cancel();
    },
    [],
  );

  function changeEpochs(value: TrainingEpochs) {
    if (runRef.current) return;
    setEpochs(value);
    setResult(null);
    setError("");
    setStatus("Settings changed. Train again to see results for this choice.");
  }

  async function train() {
    if (runRef.current) return;
    setResult(null);
    setError("");
    setProgress(0);
    setPhase("loading");
    setStatus("Loading TensorFlow.js and the recorded room data…");
    const active = startTrainingRun(epochs, {
      onTraining: () => {
        setPhase("training");
        setStatus(
          `Training for ${epochs} ${epochs === 1 ? "epoch" : "epochs"}.`,
        );
      },
      onProgress: (epoch, loss) => {
        setProgress(epoch);
        setStatus(
          `Finished epoch ${epoch} of ${epochs}. Training loss: ${number(loss)}.`,
        );
      },
    });
    runRef.current = active;
    try {
      const completed = await active.result;
      if (runRef.current !== active) return;
      setResult(completed);
      setStatus(
        `Training finished. The model and rule were evaluated on the same ${completed.counts.validation} validation readings. ${completed.counts.reserved} final-test readings remain unused.`,
      );
    } catch (cause) {
      if (runRef.current !== active) return;
      setError(
        cause instanceof Error ? cause.message : "The run failed. Try again.",
      );
      setStatus("Training did not finish. No result is shown.");
    } finally {
      if (runRef.current === active) {
        runRef.current = null;
        setPhase("idle");
      }
    }
  }

  function cancel() {
    const active = runRef.current;
    if (!active) return;
    runRef.current = null;
    active.cancel();
    setPhase("idle");
    setResult(null);
    setError("");
    setStatus(
      "Training cancelled. No result is shown. You can start another run.",
    );
  }

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="mt-12 max-w-3xl space-y-5 leading-relaxed"
    >
      <h2
        id={`${id}-title`}
        className="font-mono text-2xl font-bold tracking-tight sm:text-3xl"
      >
        Training and validation in your browser
      </h2>
      <p>
        Run this maintainer-supplied example on the room recording. It fits a
        small model using temperature, light and CO₂, then compares it with the
        rule that calls a room occupied when its light reaches 100 lux. The code
        and choices are supplied. This demonstration is separate from your
        independent project.
      </p>
      <dl className="grid gap-5 border-y border-border py-5 sm:grid-cols-3">
        <div>
          <dt className="font-semibold">First 1,200 readings</dt>
          <dd className="mt-1 text-text-muted">
            Fit the scaler and train the model.
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Next 400 readings</dt>
          <dd className="mt-1 text-text-muted">
            Compare both policies on validation data.
          </dd>
        </div>
        <div>
          <dt className="font-semibold">Last 456 readings</dt>
          <dd className="mt-1 text-text-muted">
            Reserve for the project’s final test. This demo leaves them unused.
          </dd>
        </div>
      </dl>
      <p>
        The scaler learns each feature’s mean and standard deviation from the
        training rows. It subtracts that mean and divides by that standard
        deviation for both training and validation inputs.
      </p>
      <details className="space-y-3">
        <summary className="min-h-11 cursor-pointer py-2 font-medium focus-visible:outline-2 focus-visible:outline-primary">
          Training choices and source
        </summary>
        <p>
          This example uses one sigmoid unit, which produces a score between 0
          and 1. Adam updates its weights with a learning rate of 0.01. Each
          batch contains up to 32 training rows, kept in their recorded order
          without shuffling.
        </p>
        <p>
          Seed 17 fixes the starting weights. Binary cross-entropy measures the
          training error against the occupied or empty labels. These settings
          stay fixed while you choose the number of epochs.
        </p>
      </details>
      <p>
        Inspect the{" "}
        <a
          href="/demos/room-training.mjs"
          className="text-primary underline underline-offset-4"
        >
          training and evaluation code
        </a>{" "}
        and the{" "}
        <a
          href="/assignments/room-occupancy-v1/data.json"
          className="text-primary underline underline-offset-4"
        >
          recorded input data
        </a>
        .
      </p>
      <p>
        An epoch is one pass through the training rows. Choose how many passes
        to make. Each run starts a fresh model, with the same starting weights
        and a decision threshold of 0.5. More training does not guarantee a
        better result on later readings.
      </p>
      <div className="max-w-sm space-y-2">
        <label htmlFor={`${id}-epochs`} className="block font-medium">
          Training epochs
        </label>
        <select
          id={`${id}-epochs`}
          className={select}
          value={epochs}
          disabled={pending}
          onChange={(event) =>
            changeEpochs(Number(event.target.value) as TrainingEpochs)
          }
        >
          <option value={1}>1 epoch</option>
          <option value={5}>5 epochs</option>
          <option value={15}>15 epochs</option>
        </select>
      </div>
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          className={button}
          aria-disabled={pending}
          onClick={train}
        >
          Train and compare
        </button>
        <button
          type="button"
          className={button}
          aria-disabled={!pending}
          onClick={cancel}
        >
          Cancel run
        </button>
      </div>
      <p className="text-sm text-text-muted">
        TensorFlow.js 4.22.0 and the data load when you run the example.
        Training uses your browser’s CPU. No installation is needed.
      </p>
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="font-medium"
      >
        {status}
      </p>
      {phase === "training" && (
        <progress
          aria-label="Completed training epochs"
          max={epochs}
          value={progress}
          className="h-3 w-full accent-primary"
        >
          {progress} of {epochs}
        </progress>
      )}
      {error && (
        <p role="alert" className="text-error">
          {error}
        </p>
      )}
      {result && <RunResults result={result} id={id} />}
      <p className="text-sm text-text-muted">
        These are readings from one room. Nearby observations remain related,
        and these results do not establish performance in another building.
        Repeatedly inspecting validation results helps choose a model. It does
        not turn those readings into an independent final test. Model scores are
        not calibrated probabilities.
      </p>
    </section>
  );
}

function RunResults({ result, id }: { result: TrainingResult; id: string }) {
  const [selected, setSelected] = useState(0);
  const [costs, setCosts] = useState({ falsePositive: 1, falseNegative: 4 });
  const choices = [0, 1, 2, 4, 8, 16, 32];
  const row = result.mistakes[selected];
  const model = result.modelMetrics,
    baseline = result.baselineMetrics;
  const modelCost =
    model.fp * costs.falsePositive + model.fn * costs.falseNegative;
  const baselineCost =
    baseline.fp * costs.falsePositive + baseline.fn * costs.falseNegative;
  const preferred =
    modelCost === baselineCost
      ? "Both policies have the same illustrative validation error cost."
      : modelCost < baselineCost
        ? "The model has the lower illustrative validation error cost."
        : "The light rule has the lower illustrative validation error cost.";

  function changeCost(key: keyof typeof costs, value: string) {
    const next = Number(value);
    if (choices.includes(next))
      setCosts((current) => ({ ...current, [key]: next }));
  }
  return (
    <div className="space-y-8 border-t border-border pt-7">
      <div className="space-y-3">
        <h3 className="text-xl font-semibold">This browser run</h3>
        <p>
          {result.epochs} {result.epochs === 1 ? "epoch" : "epochs"} with
          TensorFlow.js {result.runtimeVersion}, using the {result.backend}{" "}
          backend. The values below come from the model trained in this tab.
        </p>
      </div>
      <LossChart losses={result.losses} id={id} />
      <div>
        <h3 className="mb-3 text-xl font-semibold">
          Two policies on the same {result.counts.validation} readings
        </h3>
        <p className="mb-4">
          A false alarm calls an empty room occupied. A miss calls an occupied
          room empty. Choose illustrative costs for those two mistakes. The
          predictions and error counts stay fixed while their costs change.
        </p>
        <div className="my-5 grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <label
              htmlFor={`${id}-false-alarm-cost`}
              className="block font-medium"
            >
              Cost per false alarm
            </label>
            <select
              id={`${id}-false-alarm-cost`}
              className={select}
              value={costs.falsePositive}
              onChange={(event) =>
                changeCost("falsePositive", event.target.value)
              }
            >
              {choices.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor={`${id}-miss-cost`} className="block font-medium">
              Cost per missed occupied reading
            </label>
            <select
              id={`${id}-miss-cost`}
              className={select}
              value={costs.falseNegative}
              onChange={(event) =>
                changeCost("falseNegative", event.target.value)
              }
            >
              {choices.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div
          role="region"
          aria-label="Validation policy comparison"
          tabIndex={0}
          className="max-w-full overflow-x-auto focus-visible:outline-2 focus-visible:outline-primary"
        >
          <table className="w-full text-sm">
            <caption className="sr-only">
              Results on validation readings, excluding all training and
              final-test rows
            </caption>
            <thead>
              <tr>
                <th scope="col" className={cell}>
                  Outcome
                </th>
                <th scope="col" className={cell}>
                  Light rule
                </th>
                <th scope="col" className={cell}>
                  Trained model
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row" className={cell}>
                  Correct occupied
                </th>
                <td className={cell}>{baseline.tp}</td>
                <td className={cell}>{model.tp}</td>
              </tr>
              <tr>
                <th scope="row" className={cell}>
                  Correct empty
                </th>
                <td className={cell}>{baseline.tn}</td>
                <td className={cell}>{model.tn}</td>
              </tr>
              <tr>
                <th scope="row" className={cell}>
                  False alarms
                </th>
                <td className={cell}>{baseline.fp}</td>
                <td className={cell}>{model.fp}</td>
              </tr>
              <tr>
                <th scope="row" className={cell}>
                  Missed occupancy
                </th>
                <td className={cell}>{baseline.fn}</td>
                <td className={cell}>{model.fn}</td>
              </tr>
              <tr>
                <th scope="row" className={cell}>
                  Correct predictions
                </th>
                <td className={cell}>
                  {(baseline.accuracy * 100).toFixed(1)}%
                </td>
                <td className={cell}>{(model.accuracy * 100).toFixed(1)}%</td>
              </tr>
              <tr>
                <th scope="row" className={cell}>
                  Illustrative error cost
                </th>
                <td className={cell}>{baselineCost}</td>
                <td className={cell}>{modelCost}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-sm text-text-muted">
          Cost = {costs.falsePositive} × false alarms + {costs.falseNegative} ×
          misses. Changing these costs does not retrain the model or inspect the
          reserved final-test readings.
        </p>
        <p aria-live="polite" aria-atomic="true" className="mt-3 font-medium">
          {preferred}
        </p>
      </div>
      <div className="space-y-4">
        <h3 className="text-xl font-semibold">A mistaken validation reading</h3>
        {row ? (
          <>
            <p>
              Inspect up to eight readings where at least one policy was wrong.
              Shared mistakes appear first. This selection is not the full error
              count.
            </p>
            <label htmlFor={`${id}-reading`} className="block font-medium">
              Validation reading to inspect
            </label>
            <select
              id={`${id}-reading`}
              value={selected}
              onChange={(event) => setSelected(Number(event.target.value))}
              className={select}
            >
              {result.mistakes.map((mistake, index) => (
                <option key={mistake.id} value={index}>
                  {mistake.id}: {mistake.recordedAt}
                </option>
              ))}
            </select>
            <div
              role="region"
              aria-label="Selected validation reading"
              tabIndex={0}
              className="max-w-full overflow-x-auto focus-visible:outline-2 focus-visible:outline-primary"
            >
              <table className="w-full text-sm">
                <caption className="sr-only">
                  Recorded inputs and decisions for {row.id}
                </caption>
                <tbody>
                  <tr>
                    <th scope="row" className={cell}>
                      Temperature
                    </th>
                    <td className={cell}>{row.temperature} °C</td>
                  </tr>
                  <tr>
                    <th scope="row" className={cell}>
                      Light
                    </th>
                    <td className={cell}>{row.light} lux</td>
                  </tr>
                  <tr>
                    <th scope="row" className={cell}>
                      CO₂
                    </th>
                    <td className={cell}>{number(row.co2)} ppm</td>
                  </tr>
                  <tr>
                    <th scope="row" className={cell}>
                      Recorded label
                    </th>
                    <td className={cell}>
                      {row.occupied ? "Occupied" : "Empty"}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className={cell}>
                      Model score from this run
                    </th>
                    <td className={cell}>{number(row.score)}</td>
                  </tr>
                  <tr>
                    <th scope="row" className={cell}>
                      Light rule
                    </th>
                    <td className={cell}>
                      {row.baseline ? "Occupied" : "Empty"},{" "}
                      {row.baseline === row.occupied ? "correct" : "incorrect"}
                    </td>
                  </tr>
                  <tr>
                    <th scope="row" className={cell}>
                      Model at threshold 0.5
                    </th>
                    <td className={cell}>
                      {row.model ? "Occupied" : "Empty"},{" "}
                      {row.model === row.occupied ? "correct" : "incorrect"}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p aria-live="polite" className="text-sm text-text-muted">
              Reading {row.id}: the recorded room was{" "}
              {row.occupied ? "occupied" : "empty"}. The model is{" "}
              {row.model === row.occupied ? "correct" : "incorrect"} and the
              rule is {row.baseline === row.occupied ? "correct" : "incorrect"}.
            </p>
          </>
        ) : (
          <p>
            Neither policy made a mistake on these validation rows. This result
            still applies only to the selected period and room.
          </p>
        )}
      </div>
      <details className="space-y-4">
        <summary className="min-h-11 cursor-pointer py-2 font-medium focus-visible:outline-2 focus-visible:outline-primary">
          Data periods and fitted scaling
        </summary>
        <p>
          The source timestamps have no assigned timezone. Scaling uses the
          training rows only. The model reuses those means and standard
          deviations on validation rows.
        </p>
        <div
          role="region"
          aria-label="Data periods"
          tabIndex={0}
          className="max-w-full overflow-x-auto"
        >
          <table className="w-full text-sm">
            <caption className="sr-only">Chronological data periods</caption>
            <thead>
              <tr>
                <th scope="col" className={cell}>
                  Period
                </th>
                <th scope="col" className={cell}>
                  Rows
                </th>
                <th scope="col" className={cell}>
                  From
                </th>
                <th scope="col" className={cell}>
                  To
                </th>
              </tr>
            </thead>
            <tbody>
              {(["train", "validation", "reserved"] as const).map((name) => (
                <tr key={name}>
                  <th scope="row" className={cell}>
                    {name === "train"
                      ? "Training"
                      : name === "validation"
                        ? "Validation"
                        : "Unused final test"}
                  </th>
                  <td className={cell}>{result.counts[name]}</td>
                  <td className={`${cell} whitespace-nowrap`}>
                    {result.periods[name].from}
                  </td>
                  <td className={`${cell} whitespace-nowrap`}>
                    {result.periods[name].to}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div
          role="region"
          aria-label="Training scaler"
          tabIndex={0}
          className="max-w-full overflow-x-auto"
        >
          <table className="w-full text-sm">
            <caption className="sr-only">
              Scaling parameters fitted on training rows
            </caption>
            <thead>
              <tr>
                <th scope="col" className={cell}>
                  Feature
                </th>
                <th scope="col" className={cell}>
                  Mean
                </th>
                <th scope="col" className={cell}>
                  Standard deviation
                </th>
              </tr>
            </thead>
            <tbody>
              {result.preprocessing.features.map((feature, index) => (
                <tr key={feature}>
                  <th scope="row" className={cell}>
                    {feature}
                  </th>
                  <td className={cell}>
                    {number(result.preprocessing.mean[index]!)}
                  </td>
                  <td className={cell}>
                    {number(result.preprocessing.std[index]!)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}

function LossChart({ losses, id }: { losses: number[]; id: string }) {
  const maximum = Math.max(...losses, 0.001);
  const x = (index: number) =>
    losses.length === 1 ? 320 : 70 + (index * 510) / (losses.length - 1);
  const y = (loss: number) => 175 - (loss / maximum) * 140;
  return (
    <figure>
      <figcaption id={`${id}-loss-title`} className="text-xl font-semibold">
        Training loss by epoch
      </figcaption>
      <p id={`${id}-loss-description`} className="mt-3">
        Loss measures the model’s error while fitting training labels. A smaller
        training loss does not establish better predictions on later data.
      </p>
      <svg
        role="img"
        aria-labelledby={`${id}-loss-title ${id}-loss-description`}
        viewBox="0 0 640 225"
        className="mt-4 block h-auto w-full"
      >
        <line
          x1="70"
          y1="175"
          x2="580"
          y2="175"
          stroke="currentColor"
          opacity="0.3"
        />
        <line
          x1="70"
          y1="35"
          x2="70"
          y2="175"
          stroke="currentColor"
          opacity="0.3"
        />
        <text x="60" y="40" textAnchor="end" fill="currentColor" fontSize="14">
          {number(maximum)}
        </text>
        <text x="60" y="180" textAnchor="end" fill="currentColor" fontSize="14">
          0
        </text>
        <text
          x={x(0)}
          y="202"
          textAnchor="middle"
          fill="currentColor"
          fontSize="14"
        >
          1
        </text>
        {losses.length > 1 && (
          <text
            x="580"
            y="202"
            textAnchor="middle"
            fill="currentColor"
            fontSize="14"
          >
            {losses.length}
          </text>
        )}
        <text
          x="320"
          y="222"
          textAnchor="middle"
          fill="currentColor"
          fontSize="14"
        >
          Epoch
        </text>
        <polyline
          points={losses
            .map((loss, index) => `${x(index)},${y(loss)}`)
            .join(" ")}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
        />
        {losses.map((loss, index) => (
          <circle
            key={index}
            cx={x(index)}
            cy={y(loss)}
            r="4"
            fill="currentColor"
            className="text-primary"
          />
        ))}
      </svg>
      <details className="mt-2">
        <summary className="min-h-11 cursor-pointer py-2 font-medium focus-visible:outline-2 focus-visible:outline-primary">
          Exact loss values
        </summary>
        <table className="mt-2 w-full text-sm">
          <caption className="sr-only">
            Binary cross-entropy loss after each training epoch
          </caption>
          <thead>
            <tr>
              <th scope="col" className={cell}>
                Epoch
              </th>
              <th scope="col" className={cell}>
                Training loss
              </th>
            </tr>
          </thead>
          <tbody>
            {losses.map((loss, index) => (
              <tr key={index}>
                <th scope="row" className={cell}>
                  {index + 1}
                </th>
                <td className={cell}>{loss}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
