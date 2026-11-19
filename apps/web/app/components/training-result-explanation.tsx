"use client";

import { useId, useState } from "react";
import {
  expectedHistoryLabel,
  windowTrend,
  type LossComparisonResult,
  type ScalarUpdatesResult,
  type TrainingHistoryResult,
  type TrainingResult,
} from "@/lib/training-result-explanations";

const control =
  "relative min-h-11 min-w-0 max-w-full border border-border bg-background px-3 py-2 text-base text-text-primary focus-visible:outline-2 focus-visible:outline-interactive";
const number = (value: number) =>
  Number.isFinite(value)
    ? Number(value.toPrecision(7)).toString()
    : "Outside JavaScript’s finite number range";

function Measures({ values }: { values: [string, number | string][] }) {
  return (
    <dl className="grid min-w-0 grid-cols-1 gap-4 text-lg sm:grid-cols-2">
      {values.map(([label, value]) => (
        <div key={label} className="min-w-0 [overflow-wrap:anywhere]">
          <dt className="text-text-secondary">{label}</dt>
          <dd className="font-mono">
            {typeof value === "number" ? number(value) : value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function LossExplanation({ result }: { result: LossComparisonResult }) {
  const uid = useId();
  const [kind, setKind] = useState(result.mse ? "mse" : "bce");
  const [position, setPosition] = useState(0);
  const [caseIndex, setCaseIndex] = useState(0);
  const mse = kind === "mse" ? result.mse : null;
  const bce = kind === "bce" ? result.bce?.[caseIndex] : null;
  const rows = mse?.rows ?? bce!.rows;
  const selected = rows[position]!;
  const difference = mse ? mse.rows[position]!.prediction - selected.label : 0;
  const squared = difference ** 2;
  const bceTerm = (label: number, logit: number) =>
    Math.max(logit, 0) - logit * label + Math.log1p(Math.exp(-Math.abs(logit)));
  const reference = mse
    ? mse.rows.reduce(
        (sum, row) => sum + (row.prediction - row.label) ** 2 / mse.rows.length,
        0,
      )
    : bce!.rows.reduce(
        (sum, row) => sum + bceTerm(row.label, row.logit) / bce!.rows.length,
        0,
      );
  return (
    <>
      <h3 className="text-2xl font-semibold">One row inside your batch loss</h3>
      <p className="text-lg leading-relaxed">
        These numeric probes use the exercise’s supplied inputs. Follow one row,
        then compare the batch calculation with the scalar your function
        returned. JavaScript and TensorFlow.js can round differently.
      </p>
      <div className="flex flex-wrap gap-4">
        <label htmlFor={`${uid}-loss`} className="grid gap-2">
          Loss probe
          <select
            id={`${uid}-loss`}
            className={control}
            value={kind}
            onChange={(event) => {
              setKind(event.target.value);
              setPosition(0);
            }}
          >
            {result.mse && <option value="mse">Mean squared error</option>}
            {result.bce && (
              <option value="bce">Binary cross-entropy from logits</option>
            )}
          </select>
        </label>
        {bce && (
          <label htmlFor={`${uid}-case`} className="grid gap-2">
            Confidence case
            <select
              id={`${uid}-case`}
              className={control}
              value={caseIndex}
              onChange={(event) => setCaseIndex(Number(event.target.value))}
            >
              {result.bce!.map((row, index) => (
                <option key={row.name} value={index}>
                  {row.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label htmlFor={`${uid}-position`} className="grid gap-2">
          Batch position
          <select
            id={`${uid}-position`}
            className={control}
            value={position}
            onChange={(event) => setPosition(Number(event.target.value))}
          >
            {rows.map((row, index) => (
              <option key={row.position} value={index}>
                {row.position}
              </option>
            ))}
          </select>
        </label>
      </div>
      <Measures
        values={
          mse
            ? [
                ["Captured label", selected.label],
                ["Captured prediction", mse.rows[position]!.prediction],
                ["Prediction minus label", difference],
                ["Squared difference", squared],
                [
                  "This row’s contribution to the mean",
                  squared / mse.rows.length,
                ],
                ["JavaScript batch reference", reference],
                ["Your returned batch MSE", mse.returned],
              ]
            : [
                ["Captured label", selected.label],
                ["Captured logit", bce!.rows[position]!.logit],
                [
                  "Sigmoid probability reference",
                  1 / (1 + Math.exp(-bce!.rows[position]!.logit)),
                ],
                [
                  "This row’s cross-entropy reference",
                  bceTerm(selected.label, bce!.rows[position]!.logit),
                ],
                ["JavaScript batch reference", reference],
                ["Your returned batch cross-entropy", bce!.returned],
              ]
        }
      />
      <p role="status" className="text-lg leading-relaxed">
        {mse
          ? "MSE averages every squared difference in this four-row batch."
          : `${bce!.name}: the reference averages both rows using the captured raw logits.`}{" "}
        The returned scalar remains your run’s output even when it differs.
        These numeric captures do not verify your API-selection function.
      </p>
    </>
  );
}

function ScalarExplanation({ result }: { result: ScalarUpdatesResult }) {
  const uid = useId();
  const [selected, setSelected] = useState(0);
  const row = result.steps[selected]!;
  return (
    <>
      <h3 className="text-2xl font-semibold">
        The operands of your weight update
      </h3>
      <p className="text-lg leading-relaxed">
        This trace follows calls to your lossFn. The exercise asks for the
        weight squared. The first capture records an after-state: gradient{" "}
        {number(result.first.gradient)}, learning rate{" "}
        {number(result.first.rate)}, and updated weight{" "}
        {number(result.first.after)}. The next two updates also record their
        starting weights.
      </p>
      <label htmlFor={`${uid}-update`} className="grid gap-2">
        Captured update
        <select
          id={`${uid}-update`}
          className={control}
          value={selected}
          onChange={(event) => setSelected(Number(event.target.value))}
        >
          {result.steps.map((row, index) => (
            <option key={row.update} value={index}>
              Update {row.update}
            </option>
          ))}
        </select>
      </label>
      <Measures
        values={[
          ["Weight before this update", row.before],
          ["Captured stored gradient", row.gradient],
          ["Captured learning rate", row.rate],
          ["Gradient times learning rate", row.gradient * row.rate],
          [
            "JavaScript subtraction reference",
            row.before - row.gradient * row.rate,
          ],
          ["Your weight after this update", row.after],
          ["Your loss after this update", row.loss],
        ]}
      />
      <p role="status" className="text-lg leading-relaxed">
        Update {row.update} subtracts the gradient times the learning rate from
        the starting weight. Compare that reference with your captured
        after-state. A step can increase a loss when the learning rate is too
        large.
      </p>
    </>
  );
}

function HistoryExplanation({ result }: { result: TrainingHistoryResult }) {
  const uid = useId();
  const [selected, setSelected] = useState(0);
  const row = result.samples[selected]!;
  const windows = result.windows;
  const membership = !windows
    ? "There are fewer than 20 epochs."
    : row.epoch >= windows.recent[0]
      ? "This epoch belongs to the recent window."
      : row.epoch >= windows.previous[0]
        ? "This epoch belongs to the previous window."
        : "This epoch is outside the two diagnosis windows.";
  return (
    <>
      <h3 className="text-2xl font-semibold">
        Your curves and the diagnosis windows
      </h3>
      <p className="text-lg leading-relaxed">
        The exercise supplies a fresh model and a synthetic 100-row,
        three-feature fixture. These curves record the submitted fit history.
        The chart keeps up to 64 sampled epochs. Diagnosis means use all values
        in each final ten-epoch window.
      </p>
      <label htmlFor={`${uid}-epoch`} className="grid gap-2">
        Captured sample epoch
        <select
          id={`${uid}-epoch`}
          className={control}
          value={selected}
          onChange={(event) => setSelected(Number(event.target.value))}
        >
          {result.samples.map((row, index) => (
            <option key={row.epoch} value={index}>
              Epoch {row.epoch}
            </option>
          ))}
        </select>
      </label>
      <Measures
        values={[
          ["Captured training loss", row.training],
          ["Captured validation loss", row.validation],
          ["Completed epochs", result.epochs],
          ["Diagnosis status", result.status],
          [
            "Your returned diagnosis",
            result.returned ?? "No valid label returned",
          ],
          [
            "Reference from the captured full-window means",
            expectedHistoryLabel(result),
          ],
        ]}
      />
      <p role="status" className="text-lg leading-relaxed">
        Epoch {row.epoch}: {membership}
      </p>
      {windows ? (
        <>
          <svg
            viewBox="0 0 600 80"
            role="img"
            aria-label={`Full history from epoch 1 to ${result.epochs}. Previous window ${windows.previous.join(" to ")}. Recent window ${windows.recent.join(" to ")}.`}
            className="w-full text-text-secondary"
          >
            <line x1="20" x2="580" y1="30" y2="30" stroke="currentColor" />
            {([windows.previous, windows.recent] as const).map(
              (range, index) => (
                <rect
                  key={index}
                  x={20 + ((range[0] - 1) / result.epochs) * 560}
                  y="18"
                  width={(10 / result.epochs) * 560}
                  height="24"
                  fill="currentColor"
                  opacity={index ? 0.65 : 0.3}
                />
              ),
            )}
            <text x="20" y="67" fill="currentColor" fontSize="18">
              1
            </text>
            <text
              x="580"
              y="67"
              textAnchor="end"
              fill="currentColor"
              fontSize="18"
            >
              {result.epochs}
            </text>
          </svg>
          <Measures
            values={[
              ["Previous ten-epoch window", windows.previous.join(" to ")],
              ["Recent ten-epoch window", windows.recent.join(" to ")],
              ["Training previous mean", windows.training[0]],
              ["Training recent mean", windows.training[1]],
              ["Validation previous mean", windows.validation[0]],
              ["Validation recent mean", windows.validation[1]],
              ["Training trend reference", windowTrend(...windows.training)],
              [
                "Validation trend reference",
                windowTrend(...windows.validation),
              ],
            ]}
          />
          <p className="text-lg leading-relaxed">
            A change must exceed 5% to count as up or down. Exact 5% changes
            stay flat within the exercise’s rounding tolerance. From a zero
            previous mean, zero stays flat and a positive mean counts as up.
            Displayed means are rounded. Trend references use the full captured
            precision, which you can inspect in the result table. These labels
            describe the curves. They do not establish a cause.
          </p>
        </>
      ) : (
        <p className="text-lg leading-relaxed">
          The diagnosis needs 20 epochs for two complete windows. A shorter
          requested training budget can still be valid.
        </p>
      )}
      {result.detail && (
        <p className="text-lg leading-relaxed [overflow-wrap:anywhere]">
          Diagnosis detail: {result.detail}
        </p>
      )}
      <p className="text-lg leading-relaxed">
        The run captures its curves even when diagnosis fails. Validation loss
        guides this training run. Held-out evaluation is a separate step.
      </p>
    </>
  );
}

export function TrainingResultExplanation({
  result,
}: {
  result: TrainingResult;
}) {
  if (result.kind === "loss-comparison")
    return <LossExplanation result={result} />;
  if (result.kind === "scalar-updates")
    return <ScalarExplanation result={result} />;
  return <HistoryExplanation result={result} />;
}
