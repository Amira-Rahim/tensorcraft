"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  decodeEvaluationResult,
  type EvaluationCase,
  type EvaluationResult,
} from "@tensorcraft/shared";
import type { ExerciseArtifact } from "@tensorcraft/ui";

type Category = "all" | "missed" | "false-alarm" | "correct";
type InspectableResult = Exclude<EvaluationResult, { status: "unavailable" }>;
const field =
  "min-h-11 min-w-0 border border-interactive bg-surface px-3 py-2 text-base text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const button = `${field} disabled:cursor-not-allowed disabled:opacity-45`;
const matches = (row: EvaluationCase, category: Category) =>
  category === "all" ||
  (category === "missed" && row.category === "false-negative") ||
  (category === "false-alarm" && row.category === "false-positive") ||
  (category === "correct" && row.predicted === row.label);
const known = (row: EvaluationCase) => row.canonicalId !== null;
const name = (row: EvaluationCase) =>
  `${known(row) ? "Case" : "Input position"} ${row.position}`;
const sourceName = (row: EvaluationCase) =>
  row.source === "generated"
    ? "Generated practice case"
    : row.source === "authored"
      ? "Authored practice case"
      : "Source unverified";
const labelName = (row: EvaluationCase, label: 0 | 1) =>
  known(row) ? `${label === 0 ? "calm" : "flagged"} (${label})` : String(label);
function outcome(row: EvaluationCase) {
  if (!known(row))
    return row.predicted === row.label
      ? "Prediction matches the supplied label"
      : `Predicted ${row.predicted}, supplied label ${row.label}`;
  return {
    "true-positive": "Correct flagged prediction",
    "true-negative": "Correct calm prediction",
    "false-positive": "False alarm",
    "false-negative": "Missed anomaly",
  }[row.category];
}

function plotLayout(cases: readonly EvaluationCase[], width: number) {
  const x = (score: number) => 16 + score * (width - 32);
  let top = 8;
  const lanes = ([0, 1] as const).map((label) => {
    const rows = cases
      .filter((row) => row.label === label)
      .sort((a, b) => a.score - b.score || a.position - b.position);
    const lastAtLevel: number[] = [];
    const placed = rows.map((row) => {
      const left = x(row.score);
      let level = 0;
      while (
        lastAtLevel[level] !== undefined &&
        left - lastAtLevel[level]! < 12
      )
        level++;
      lastAtLevel[level] = left;
      return { row, x: left, y: top + 40 + level * 12 };
    });
    const height = Math.max(64, lastAtLevel.length * 12 + 20);
    const lane = { label, top, height, placed };
    top += height + 44;
    return lane;
  });
  return { lanes, axisY: top - 12, height: top + 40, x };
}

function ScorePlot({
  cases,
  selected,
  category,
  numericLabels,
  onSelect,
  id,
}: {
  cases: readonly EvaluationCase[];
  selected: number | null;
  category: Category;
  numericLabels: boolean;
  onSelect: (row: EvaluationCase) => void;
  id: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(640);
  useEffect(() => {
    const element = host.current;
    if (!element) return;
    const measure = () => {
      const measured = element.getBoundingClientRect().width;
      if (measured > 0) setWidth(Math.max(220, Math.round(measured)));
    };
    measure();
    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const layout = plotLayout(cases, width);

  return (
    <figure
      aria-labelledby={`${id}-plot-title`}
      aria-describedby={`${id}-plot-description`}
      className="space-y-3"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h4 id={`${id}-plot-title`} className="font-semibold text-text-primary">
          Scores and supplied labels
        </h4>
        <p className="text-sm text-text-secondary">
          Predict 1 when score &gt; 0.5
        </p>
      </div>
      <div
        className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-text-secondary"
        aria-label="Point meanings"
      >
        {cases.some((row) => row.source === "generated") && (
          <span className="inline-flex items-center gap-2">
            <svg width="14" height="14" aria-hidden="true">
              <circle cx="7" cy="7" r="4" fill="currentColor" />
            </svg>
            Generated practice case
          </span>
        )}
        {cases.some((row) => row.source === "authored") && (
          <span className="inline-flex items-center gap-2">
            <svg width="14" height="14" aria-hidden="true">
              <rect x="3" y="3" width="8" height="8" fill="currentColor" />
            </svg>
            Authored practice case
          </span>
        )}
        {numericLabels && (
          <span className="inline-flex items-center gap-2">
            <svg width="14" height="14" aria-hidden="true">
              <path
                d="M7 2 L12 7 L7 12 L2 7 Z"
                fill="none"
                stroke="currentColor"
              />
            </svg>
            Source unverified
          </span>
        )}
        <span className="inline-flex items-center gap-2">
          <svg width="14" height="14" aria-hidden="true" className="text-error">
            <circle
              cx="7"
              cy="7"
              r="5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            />
          </svg>
          Prediction differs from label
        </span>
      </div>
      <div ref={host} className="w-full min-w-0">
        <svg
          viewBox={`0 0 ${width} ${layout.height}`}
          width="100%"
          height={layout.height}
          role="group"
          aria-label="Captured scores by supplied label"
          className="block overflow-visible text-xs text-text-secondary"
        >
          {layout.lanes.map((lane) => (
            <g key={lane.label}>
              <text x="16" y={lane.top + 13} fill="currentColor">
                {numericLabels
                  ? `Supplied label ${lane.label}`
                  : `Supplied ${lane.label === 0 ? "calm" : "flagged"} label (${lane.label})`}
              </text>
              <rect
                x="0"
                y={lane.top + 24}
                width={width}
                height={lane.height}
                fill="var(--tc-surface-raised)"
              />
            </g>
          ))}
          {layout.lanes.map((lane) => (
            <g key={`grid-${lane.label}`}>
              {[0, 0.25, 0.75, 1].map((tick) => (
                <line
                  key={tick}
                  x1={layout.x(tick)}
                  x2={layout.x(tick)}
                  y1={lane.top + 24}
                  y2={lane.top + 24 + lane.height}
                  stroke="var(--tc-border)"
                />
              ))}
              <line
                x1={layout.x(0.5)}
                x2={layout.x(0.5)}
                y1={lane.top + 24}
                y2={lane.top + 24 + lane.height}
                stroke="var(--tc-text)"
                strokeDasharray="4 4"
              />
            </g>
          ))}
          {layout.lanes
            .flatMap((lane) => lane.placed)
            .map(({ row, x, y }) => {
              const isSelected = selected === row.position;
              const error = row.predicted !== row.label;
              return (
                <g
                  key={row.position}
                  data-case-id={row.position}
                  data-source={row.source}
                  data-score={row.score}
                  data-highlighted={matches(row, category)}
                  role="button"
                  tabIndex={-1}
                  aria-label={`${name(row)}, ${outcome(row)}, score ${String(row.score)}`}
                  aria-pressed={isSelected}
                  onClick={() => onSelect(row)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelect(row);
                    }
                  }}
                  className="cursor-pointer focus:outline-none"
                  opacity={matches(row, category) ? 1 : 0.3}
                >
                  <title>
                    {name(row)}: {outcome(row)}
                  </title>
                  <circle cx={x} cy={y} r="9" fill="transparent" />
                  {row.source === "authored" ? (
                    <rect
                      data-score-mark
                      x={x - 4}
                      y={y - 4}
                      width="8"
                      height="8"
                      fill="var(--tc-text)"
                    />
                  ) : row.source === "generated" ? (
                    <circle
                      data-score-mark
                      cx={x}
                      cy={y}
                      r="4"
                      fill="var(--tc-text)"
                    />
                  ) : (
                    <path
                      data-score-mark
                      d={`M${x} ${y - 5} L${x + 5} ${y} L${x} ${y + 5} L${x - 5} ${y} Z`}
                      fill="var(--tc-surface-raised)"
                      stroke="var(--tc-text)"
                      strokeWidth="1.5"
                    />
                  )}
                  {error && (
                    <circle
                      cx={x}
                      cy={y}
                      r="6"
                      fill="none"
                      stroke="var(--tc-error)"
                      strokeWidth="2"
                    />
                  )}
                  {isSelected && (
                    <circle
                      cx={x}
                      cy={y}
                      r="9"
                      fill="none"
                      stroke="var(--tc-primary)"
                      strokeWidth="2"
                    />
                  )}
                </g>
              );
            })}
          {[0, 0.25, 0.5, 0.75, 1].map((tick) => (
            <text
              key={tick}
              x={layout.x(tick)}
              y={layout.axisY + 22}
              textAnchor={tick === 0 ? "start" : tick === 1 ? "end" : "middle"}
              fill="currentColor"
            >
              {tick}
            </text>
          ))}
          <text
            x={width / 2}
            y={layout.axisY + 46}
            textAnchor="middle"
            fill="currentColor"
          >
            Model score
          </text>
        </svg>
      </div>
      <figcaption
        id={`${id}-plot-description`}
        className="text-sm leading-relaxed text-text-muted"
      >
        Horizontal position shows the exact score. Overlapping points stack
        vertically to stay visible. The lanes show the supplied labels.
      </figcaption>
    </figure>
  );
}

function EvaluationInspector({
  result,
  complete,
}: {
  result: InspectableResult;
  complete: boolean;
}) {
  const id = useId();
  const [category, setCategory] = useState<Category>("all");
  const [selectedId, setSelectedId] = useState(
    result.cases[0]?.position ?? null,
  );
  const available = result.cases.length;
  const numericLabels = result.cases.some((row) => !known(row));
  const filtered = result.cases.filter((row) => matches(row, category));
  const selected =
    filtered.find((row) => row.position === selectedId) ?? filtered[0] ?? null;
  const index = selected
    ? filtered.findIndex((row) => row.position === selected.position)
    : -1;
  const filters: { category: Category; label: string; empty: string }[] = [
    { category: "all", label: "All cases", empty: "No available cases" },
    {
      category: "missed",
      label: numericLabels ? "Label 1 predicted 0" : "Missed anomalies",
      empty: numericLabels ? "No label 1 predicted 0" : "No missed anomalies",
    },
    {
      category: "false-alarm",
      label: numericLabels ? "Label 0 predicted 1" : "False alarms",
      empty: numericLabels ? "No label 0 predicted 1" : "No false alarms",
    },
    {
      category: "correct",
      label: "Matching labels",
      empty: "No matching predictions",
    },
  ];
  const empty = filters.find((item) => item.category === category)!.empty;
  const scope = selected
    ? `${filtered.length} of ${available} available cases highlighted. Inspecting ${name(selected).toLowerCase()}.`
    : `${empty} in these ${available} available cases. All points remain visible.`;
  const chooseCategory = (next: Category) => {
    const nextRows = result.cases.filter((row) => matches(row, next));
    setSelectedId(
      nextRows.some((row) => row.position === selected?.position)
        ? selected!.position
        : (nextRows[0]?.position ?? null),
    );
    setCategory(next);
  };
  const counts = result.counts;
  const context = result.context.values;
  const measurementMismatch =
    result.integrity.issues.some(
      (issue) => issue.code === "accuracy-count-mismatch",
    ) || result.context.details.measurementStatus === "accuracy-count-mismatch";

  return (
    <section
      aria-labelledby={`${id}-title`}
      className="my-6 w-full min-w-0 space-y-5 border border-border bg-surface p-4 sm:p-6"
    >
      <div className="space-y-2">
        <h3
          id={`${id}-title`}
          className="text-xl font-semibold text-text-primary"
        >
          The cases behind this evaluation
        </h3>
        <p className="text-base leading-relaxed text-text-secondary">
          Your model scored these practice inputs. Inspect its decisions before
          choosing what the crew should investigate next.
        </p>
        {counts ? (
          <p className="text-base text-text-primary">
            <strong>
              {counts.correct} of {counts.total}{" "}
              {numericLabels
                ? "predictions match their supplied labels"
                : "cases classified correctly"}
              .
            </strong>
            {counts.correct === counts.total
              ? " This result covers these practice cases."
              : ` ${counts.falseNegative} ${numericLabels ? `label 1 ${counts.falseNegative === 1 ? "case" : "cases"} predicted 0` : counts.falseNegative === 1 ? "missed anomaly" : "missed anomalies"}. ${counts.falsePositive} ${numericLabels ? `label 0 ${counts.falsePositive === 1 ? "case" : "cases"} predicted 1` : counts.falsePositive === 1 ? "false alarm" : "false alarms"}.`}
          </p>
        ) : (
          <p className="text-base text-warning">
            {available} of 43 case records available.{" "}
            {measurementMismatch
              ? "The case decisions and recorded accuracy disagree."
              : result.integrity.status === "inconsistent"
                ? "Some run details conflict."
                : "The record does not support a complete evaluation summary."}{" "}
            Whole-run accuracy and totals are unavailable.
          </p>
        )}
        {numericLabels && (
          <p className="text-sm text-warning">
            Some case sources could not be verified. Those points use input
            positions and numeric labels.
          </p>
        )}
        {!complete && (
          <p className="text-sm text-warning">
            {result.diagnosis?.agrees === false
              ? "The diagnosis check is incorrect. These case decisions remain available."
              : "Some checks did not pass. These captured case decisions remain available."}
          </p>
        )}
        {context.modelStateStatus === "changed" && (
          <p className="text-sm text-warning">
            {result.context.details.modelStateStatus ===
            "changed-during-capture"
              ? "The model changed during measurement. The recorded accuracy and case scores cannot describe one state."
              : "The model changed after the recorded fit. These scores describe its final state."}
          </p>
        )}
        {(context.fitHistoryStatus !== "matched" ||
          context.trainingSourceStatus !== "matched") && (
          <p className="text-sm text-text-muted">
            The fit record does not establish the requested training procedure.
            It cannot confirm that this model used only the supplied training
            rows.
          </p>
        )}
        {context.trainingLogStatus !== "available" && (
          <p className="text-sm text-text-muted">
            The training log is unavailable for a training-to-evaluation
            comparison.
          </p>
        )}
      </div>
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Cases to inspect"
      >
        {filters.map((item) => (
          <button
            key={item.category}
            type="button"
            aria-pressed={category === item.category}
            onClick={() => chooseCategory(item.category)}
            className={`${button} ${category === item.category ? "border-primary bg-primary/10 text-primary" : "hover:bg-surface-raised"}`}
          >
            {item.label}
          </button>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto] sm:items-end">
        <label
          className="min-w-0 space-y-2 text-sm text-text-secondary"
          htmlFor={`${id}-case`}
        >
          <span className="block">Case to inspect</span>
          <select
            id={`${id}-case`}
            value={selected?.position ?? ""}
            disabled={!selected}
            onChange={(event) => setSelectedId(Number(event.target.value))}
            className={`${field} w-full disabled:opacity-45`}
          >
            {filtered.length ? (
              filtered.map((row) => (
                <option key={row.position} value={row.position}>
                  {name(row)}, {sourceName(row).toLowerCase()}
                </option>
              ))
            ) : (
              <option value="">No matching cases</option>
            )}
          </select>
        </label>
        <div className="grid grid-cols-2 gap-3 sm:contents">
          <button
            type="button"
            className={button}
            disabled={index <= 0}
            onClick={() => setSelectedId(filtered[index - 1]?.position ?? null)}
          >
            Previous case
          </button>
          <button
            type="button"
            className={button}
            disabled={index < 0 || index >= filtered.length - 1}
            onClick={() => setSelectedId(filtered[index + 1]?.position ?? null)}
          >
            Next case
          </button>
        </div>
      </div>
      <p
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="text-sm leading-relaxed text-text-secondary"
      >
        {scope}
      </p>
      <ScorePlot
        cases={result.cases}
        selected={selected?.position ?? null}
        category={category}
        numericLabels={numericLabels}
        id={id}
        onSelect={(row) => {
          if (!matches(row, category)) setCategory("all");
          setSelectedId(row.position);
        }}
      />
      {selected ? (
        <section
          aria-labelledby={`${id}-selected`}
          className="space-y-3 border-t border-border pt-4"
        >
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h4
              id={`${id}-selected`}
              className="text-lg font-semibold text-text-primary"
            >
              {name(selected)}
            </h4>
            <p className="text-sm text-text-muted">{sourceName(selected)}</p>
          </div>
          <p
            className={`text-base font-medium ${selected.predicted !== selected.label ? "text-error" : "text-text-primary"}`}
          >
            {outcome(selected)}
          </p>
          <dl className="space-y-1">
            <dt className="text-sm text-text-secondary">Captured score</dt>
            <dd>
              <strong className="break-all font-mono text-base text-text-primary">
                {String(selected.score)}
              </strong>
            </dd>
          </dl>
          <p className="text-base leading-relaxed text-text-secondary">
            {selected.score > 0.5
              ? "It exceeds 0.5"
              : selected.score === 0.5
                ? "It equals 0.5"
                : "It is below 0.5"}
            , so the rule predicts {labelName(selected, selected.predicted)}.
            The supplied label is {labelName(selected, selected.label)}.
          </p>
          <dl className="grid gap-4 sm:grid-cols-3">
            {selected.features.map((value, feature) => (
              <div key={feature} className="min-w-0 space-y-2">
                <dt className="text-sm text-text-secondary">
                  {known(selected) ? "Practice feature" : "Input"} {feature + 1}
                </dt>
                <dd className="break-all font-mono text-sm text-text-primary">
                  {String(value)}
                </dd>
                <div aria-hidden="true" className="h-1 bg-surface-overlay">
                  <div
                    className="h-full bg-primary"
                    style={{ width: `${value * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </dl>
          <p className="text-sm leading-relaxed text-text-muted">
            {known(selected)
              ? "These dimensionless inputs describe the case."
              : "These recorded input values describe this input position. Their source and meaning are unverified."}{" "}
            The inputs do not explain the prediction. The crew’s fictional 94%
            result remains separate from this run.
          </p>
        </section>
      ) : (
        <p className="text-base text-text-secondary">
          {empty} in this selection. Choose another category to inspect a case.
        </p>
      )}
    </section>
  );
}

export function EvaluationRunExplanation({
  artifacts,
  complete,
}: {
  artifacts: ExerciseArtifact[];
  complete: boolean;
}) {
  const result = useMemo(() => decodeEvaluationResult(artifacts), [artifacts]);
  if (result.status === "unavailable" || !result.cases.length) return null;
  // A changed captured result starts at All cases without an effect that reruns code.
  const identity = JSON.stringify({
    cases: result.cases,
    context: result.context,
    metrics: result.metrics,
  });
  return (
    <EvaluationInspector key={identity} result={result} complete={complete} />
  );
}
