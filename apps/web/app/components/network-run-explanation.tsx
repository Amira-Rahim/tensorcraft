"use client";

import { useId, useState } from "react";
import { ExerciseOutput } from "@tensorcraft/ui";
import type { ExerciseArtifact } from "@tensorcraft/ui";

type Table = Extract<ExerciseArtifact, { kind: "table" }>;
type Series = Extract<ExerciseArtifact, { kind: "series" }>;
const selectedIds = [
  ...Array.from({ length: 8 }, (_, i) => i),
  ...Array.from({ length: 8 }, (_, i) => i + 60),
];
const features = [
  "Amplitude proxy",
  "Zero-crossing proxy",
  "Phase proxy",
  "Practice feature 4",
  "Practice feature 5",
  "Practice feature 6",
  "Practice feature 7",
  "Practice feature 8",
];
const settingsNames = [
  "Parameters",
  "Layer units",
  "Activations",
  "Optimizer",
  "Loss",
  "Metrics",
  "Requested epochs",
  "Batch size",
  "Shuffle",
  "Completed epochs",
  "Training rows",
  "Rows passed to fit",
  "Learning rate",
  "Initial epoch",
  "Validation split",
  "Fits on first model",
];

function table(
  artifacts: ExerciseArtifact[],
  title: string,
  columns: string[],
): Table | null {
  const found = artifacts.filter((artifact) => artifact?.title === title);
  const value = found[0];
  if (
    found.length !== 1 ||
    value?.kind !== "table" ||
    !Array.isArray(value.columns) ||
    value.columns.length !== columns.length ||
    !Array.from(value.columns).every(
      (column, index) => column === columns[index],
    ) ||
    !Array.isArray(value.rows) ||
    !value.rows.length ||
    value.rows.length > 40 ||
    !Array.from(value.rows).every(
      (row) => Array.isArray(row) && row.length === columns.length,
    )
  )
    return null;
  return value;
}

const finite = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);
const probability = (value: unknown): value is number =>
  finite(value) && value >= 0 && value <= 1;
const format = (value: number) =>
  value.toLocaleString(undefined, { maximumSignificantDigits: 6 });

function comparison(artifacts: ExerciseArtifact[]) {
  const inputs = table(artifacts, "Selected training readings", [
    "Row ID",
    "Label",
    ...features,
  ]);
  const scores = table(artifacts, "Scores from your before-and-after run", [
    "Row ID",
    "Label",
    "First model before training",
    "Second model untrained",
    "First model after training",
  ]);
  if (
    !inputs ||
    !scores ||
    inputs.rows.length !== selectedIds.length ||
    scores.rows.length !== selectedIds.length
  )
    return null;
  const valid = selectedIds.every((id, index) => {
    const input = inputs.rows[index]!,
      score = scores.rows[index]!;
    return (
      input[0] === id &&
      score[0] === id &&
      input[1] === score[1] &&
      (input[1] === 0 || input[1] === 1) &&
      Array.from(input.slice(2)).every(finite) &&
      Array.from(score.slice(2)).every(probability)
    );
  });
  if (!valid) return null;
  return scores.rows.map((row, index) => ({
    id: row[0] as number,
    label: row[1] as number,
    before: row[2] as number,
    second: row[3] as number,
    after: row[4] as number,
    inputs: inputs.rows[index]!.slice(2) as number[],
  }));
}

function trainingSettings(artifacts: ExerciseArtifact[]) {
  const settings = table(artifacts, "Training settings from this run", [
    "Setting",
    "Value",
  ]);
  if (
    !settings ||
    new Set(settings.rows.map((row) => row[0])).size !== settings.rows.length ||
    !settings.rows.every(
      (row) =>
        typeof row[0] === "string" &&
        settingsNames.includes(row[0]) &&
        (typeof row[1] === "string" ||
          typeof row[1] === "boolean" ||
          finite(row[1]) ||
          row[1] === null),
    )
  )
    return null;
  return settings.rows;
}

function trainingLoss(artifacts: ExerciseArtifact[]): Series | null {
  const found = artifacts.filter(
    (artifact) => artifact?.title === "Training loss from this run",
  );
  const loss = found[0];
  if (
    found.length !== 1 ||
    loss?.kind !== "series" ||
    loss.xLabel !== "Epoch" ||
    !["Binary crossentropy", "Training loss"].includes(loss.yLabel) ||
    !Array.isArray(loss.labels) ||
    !loss.labels.length ||
    loss.labels.length > 64 ||
    !Array.from(loss.labels).every(
      (epoch, index) =>
        typeof epoch === "string" &&
        /^\d+$/.test(epoch) &&
        Number(epoch) > 0 &&
        (index === 0 || Number(epoch) > Number(loss.labels[index - 1])),
    ) ||
    !Array.isArray(loss.series) ||
    loss.series.length !== 1 ||
    loss.series[0]?.name !== "Loss" ||
    !Array.isArray(loss.series[0].values) ||
    loss.series[0].values.length !== loss.labels.length ||
    !Array.from(loss.series[0].values).every(
      (value) =>
        finite(value) && (loss.yLabel === "Training loss" || value >= 0),
    )
  )
    return null;
  return loss;
}

export function readNetworkRun(artifacts: ExerciseArtifact[]): {
  rows:
    | {
        id: number;
        label: number;
        before: number;
        second: number;
        after: number;
        inputs: number[];
      }[]
    | null;
  settings: Table["rows"] | null;
  loss: Series | null;
} | null {
  if (!Array.isArray(artifacts)) return null;
  const rows = comparison(artifacts);
  const settings = trainingSettings(artifacts);
  const loss = trainingLoss(artifacts);
  return rows || settings || loss ? { rows, settings, loss } : null;
}

export function NetworkRunExplanation({
  artifacts,
  complete,
}: {
  artifacts: ExerciseArtifact[];
  complete: boolean;
}) {
  const id = useId();
  const [rowIndex, setRowIndex] = useState(0);
  const { rows, settings, loss } = readNetworkRun(artifacts) ?? {
    rows: null,
    settings: null,
    loss: null,
  };
  const row = rows?.[rowIndex] ?? rows?.[0];

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="my-6 w-full min-w-0 space-y-5 border border-border bg-surface p-4 sm:p-6"
    >
      <h3
        id={`${id}-title`}
        className="text-xl font-semibold text-text-primary"
      >
        Your model before and after training
      </h3>
      <p className="text-base leading-relaxed text-text-secondary">
        This exercise supplies a synthetic rehearsal with eight features. It is
        separate from the normalization exercise and the ship’s three-feature
        model. These predictions reuse training rows. They do not measure
        performance on new data.
      </p>
      {!complete && (
        <p className="text-base text-warning" role="status">
          Some checks did not pass. These captured results may contain mistakes.
        </p>
      )}
      {row && rows ? (
        <>
          <div className="space-y-2">
            <label
              htmlFor={`${id}-row`}
              className="block text-sm text-text-secondary"
            >
              Training row
            </label>
            <select
              id={`${id}-row`}
              value={rowIndex}
              onChange={(event) => setRowIndex(Number(event.target.value))}
              className="min-h-11 w-full border border-border bg-surface px-3 py-2 text-base text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              {rows.map((item, index) => (
                <option key={item.id} value={index}>
                  Row {item.id}, label {item.label}
                </option>
              ))}
            </select>
          </div>
          <div aria-live="polite" aria-atomic="true" className="space-y-4">
            <p className="text-sm text-text-secondary">
              Row {row.id} has label {row.label} (
              {row.label === 0 ? "calm" : "flagged"}). All three scores below
              use this same captured input.
            </p>
            <dl className="space-y-4">
              {[
                {
                  name: "First model before training",
                  score: row.before,
                  tone: "bg-text-muted",
                },
                {
                  name: "First model after training",
                  score: row.after,
                  tone: "bg-primary",
                },
                {
                  name: "Second model, kept untrained",
                  score: row.second,
                  tone: "bg-text-primary",
                },
              ].map(({ name, score, tone }) => (
                <div
                  key={name}
                  className="grid grid-cols-[minmax(0,1fr)_auto] gap-2"
                >
                  <dt className="text-sm">{name}</dt>
                  <dd className="font-mono text-base text-text-primary">
                    {format(score)}
                  </dd>
                  <dd
                    aria-hidden="true"
                    className="col-span-2 h-3 w-full bg-surface-overlay"
                  >
                    <div
                      className={`h-full ${tone}`}
                      style={{ width: `${score * 100}%` }}
                    />
                  </dd>
                </div>
              ))}
            </dl>
            <p
              aria-hidden="true"
              className="flex justify-between text-xs text-text-muted"
            >
              <span>Score 0</span>
              <span>Score 1</span>
            </p>
          </div>
          <p className="text-base leading-relaxed text-text-secondary">
            The first model’s two scores show its output before and after
            training. The second model starts with its own weights and stays
            untrained. A larger score means the model leans toward the flagged
            label. It does not establish accuracy.
          </p>
          <details>
            <summary className="min-h-11 cursor-pointer py-2">
              Selected input values
            </summary>
            <dl className="mt-3 grid gap-3 sm:grid-cols-2">
              {features.map((feature, index) => (
                <div key={feature} className="min-w-0 bg-surface-raised p-3">
                  <dt className="text-sm text-text-muted">{feature}</dt>
                  <dd className="mt-1 break-words font-mono">
                    {format(row.inputs[index]!)}
                  </dd>
                </div>
              ))}
            </dl>
            <p className="mt-3 text-sm text-text-muted">
              These generated practice values have no physical units. The view
              rounds displayed numbers to six significant digits. The saved
              record retains the captured values.
            </p>
          </details>
        </>
      ) : (
        <p className="text-sm text-text-muted">
          This run did not capture matching input rows and before-and-after
          scores. The captured output and checks below remain available.
        </p>
      )}
      {settings ? (
        <section aria-label="Captured training settings" className="space-y-3">
          <h4 className="text-lg font-semibold">
            Training settings from this run
          </h4>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {settings.map(([name, value]) => (
              <div key={String(name)} className="min-w-0 bg-surface-raised p-3">
                <dt className="text-sm text-text-muted">{String(name)}</dt>
                <dd className="mt-1 break-words font-mono">
                  {value === null ? "Unavailable" : String(value)}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      ) : (
        <p className="text-sm text-text-muted">
          This run captured no usable training settings.
        </p>
      )}
      {loss ? (
        <ExerciseOutput
          artifacts={[loss]}
          stale={false}
          complete={complete}
          outputLabel="Captured training loss"
          statusMessage="Captured loss from the training rows. Epoch labels identify the recorded points."
        />
      ) : (
        <p className="text-sm text-text-muted">
          This run captured no usable training loss history.
        </p>
      )}
    </section>
  );
}
