"use client";

import { useId, useState } from "react";
import type { ExerciseRunSnapshot } from "@tensorcraft/ui";

type Artifacts = ExerciseRunSnapshot["artifacts"];
type Table = Extract<Artifacts[number], { kind: "table" }>;
const features = ["Temperature", "Signal strength"] as const;

function table(artifacts: Artifacts, title: string, columns: string[]) {
  const matches = artifacts.filter((artifact) => artifact?.title === title);
  if (matches.length !== 1) return null;
  const artifact = matches[0];
  if (
    artifact?.kind !== "table" ||
    !Array.isArray(artifact.columns) ||
    artifact.columns.length !== columns.length ||
    !artifact.columns.every((column, index) => column === columns[index]) ||
    !Array.isArray(artifact.rows) ||
    !artifact.rows.length ||
    artifact.rows.length > 40 ||
    !artifact.rows.every(
      (row) => Array.isArray(row) && row.length === columns.length,
    )
  )
    return null;
  return artifact;
}

function numericRows(value: Table) {
  return value.rows.every((row) =>
    row.every((cell) => typeof cell === "number" && Number.isFinite(cell)),
  );
}

function readCapturedValues(artifacts: Artifacts) {
  if (!Array.isArray(artifacts)) return null;
  const inputs = table(artifacts, "Input readings", [
    "Reading",
    "Temperature",
    "Signal strength",
  ]);
  const statistics = table(artifacts, "Saved training statistics", [
    "Feature",
    "Mean",
    "Standard deviation",
  ]);
  const outputs = table(artifacts, "Scaled readings entering Farah's preview", [
    "Reading",
    "Temperature z-score",
    "Signal z-score",
    "Model score",
  ]);
  if (
    !inputs ||
    !statistics ||
    !outputs ||
    !numericRows(inputs) ||
    !numericRows(outputs) ||
    inputs.rows.length !== outputs.rows.length ||
    statistics.rows.length !== features.length
  )
    return null;
  if (
    !statistics.rows.every(
      (row, index) =>
        row[0] === features[index] &&
        row
          .slice(1)
          .every((cell) => typeof cell === "number" && Number.isFinite(cell)),
    )
  )
    return null;
  if (
    !inputs.rows.every(
      (row, index) =>
        row[0] === index + 1 && outputs.rows[index]?.[0] === row[0],
    )
  )
    return null;

  return {
    rows: inputs.rows.map((row, index) => ({
      id: row[0] as number,
      input: [row[1] as number, row[2] as number],
      scaled: [
        outputs.rows[index]![1] as number,
        outputs.rows[index]![2] as number,
      ],
      score: outputs.rows[index]![3] as number,
    })),
    statistics: statistics.rows.map((row) => ({
      mean: row[1] as number,
      std: row[2] as number,
    })),
  };
}

function format(value: number) {
  return value.toLocaleString(undefined, { maximumSignificantDigits: 7 });
}

export function NormalizationRunExplanation({
  artifacts,
  complete,
}: {
  artifacts: Artifacts;
  complete: boolean;
}) {
  const id = useId();
  const [rowIndex, setRowIndex] = useState(0);
  const [featureIndex, setFeatureIndex] = useState(0);
  const captured = readCapturedValues(artifacts);
  if (!captured) return null;
  const selectedRowIndex = rowIndex < captured.rows.length ? rowIndex : 0;
  const row = captured.rows[selectedRowIndex]!;
  const stats = captured.statistics[featureIndex]!;
  const field =
    "min-h-11 w-full border border-border bg-surface px-3 py-2 text-base text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="my-6 w-full space-y-4 border border-border bg-surface p-4 sm:p-6"
    >
      <h3
        id={`${id}-title`}
        className="text-xl font-semibold text-text-primary"
      >
        A reading from this run
      </h3>
      <p className="text-base leading-relaxed text-text-secondary">
        Compare the input with your stored statistics and scaled output. Every
        value below comes from this run. Numbers round to seven significant
        digits.
      </p>
      {!complete && (
        <p role="status" className="text-base text-warning">
          Some checks did not pass. These captured values may contain mistakes.
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        <label
          htmlFor={`${id}-row`}
          className="space-y-2 text-sm text-text-secondary"
        >
          <span className="block">Reading</span>
          <select
            id={`${id}-row`}
            className={field}
            value={selectedRowIndex}
            onChange={(event) => setRowIndex(Number(event.target.value))}
          >
            {captured.rows.map((item, index) => (
              <option value={index} key={item.id}>
                Reading {item.id}
              </option>
            ))}
          </select>
        </label>
        <label
          htmlFor={`${id}-feature`}
          className="space-y-2 text-sm text-text-secondary"
        >
          <span className="block">Feature</span>
          <select
            id={`${id}-feature`}
            className={field}
            value={featureIndex}
            onChange={(event) => setFeatureIndex(Number(event.target.value))}
          >
            {features.map((feature, index) => (
              <option value={index} key={feature}>
                {feature}
              </option>
            ))}
          </select>
        </label>
      </div>
      <dl
        className="grid gap-4 sm:grid-cols-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {[
          ["Input value", row.input[featureIndex]!],
          ["Stored mean", stats.mean],
          ["Stored standard deviation", stats.std],
          ["Captured scaled value", row.scaled[featureIndex]!],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0 bg-surface-raised p-3">
            <dt className="text-sm text-text-muted">{label}</dt>
            <dd className="mt-1 break-words font-mono text-xl text-text-primary">
              {format(value as number)}
            </dd>
          </div>
        ))}
      </dl>
      <p className="text-base leading-relaxed text-text-secondary">
        {stats.std === 0
          ? "The stored standard deviation is 0. This task uses a divisor of 1 for that case, so subtracting the stored mean gives the required scaled value."
          : "The task asks your code to subtract the stored mean, then divide by the stored standard deviation. The captured scaled value shows what your code returned."}
      </p>
      <p className="text-base leading-relaxed text-text-secondary">
        The supplied fixed neuron scored both scaled features together. Its
        captured score for reading {row.id} is{" "}
        <strong className="font-mono text-text-primary">
          {format(row.score)}
        </strong>
        . This score does not measure classifier accuracy.
      </p>
      <p className="text-sm leading-relaxed text-text-muted">
        Feature order: temperature, then signal strength. This practice fixture
        does not specify physical units.
      </p>
    </section>
  );
}
