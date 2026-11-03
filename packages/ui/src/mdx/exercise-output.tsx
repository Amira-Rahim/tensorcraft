"use client";

import { useEffect, useId, useRef, useState } from "react";
import type { ArtifactCell, ExerciseArtifact } from "./exercise-artifacts.mjs";

const COLORS = [
  "#6baa8a",
  "#85b4ce",
  "#c1a678",
  "#c58d9b",
  "#a39dcc",
  "#ce9b72",
  "#8ebdb6",
  "#b3b795",
];
const display = (value: ArtifactCell) =>
  typeof value === "number"
    ? Number(value.toPrecision(6)).toString()
    : value === null
      ? "No value"
      : String(value);

function DataTable({
  title,
  columns,
  rows,
}: {
  title: string;
  columns: string[];
  rows: ArtifactCell[][];
}) {
  return (
    <div
      className="max-w-full overflow-x-auto"
      role="region"
      aria-label={`${title}: result data`}
      tabIndex={0}
    >
      <table
        className="text-left text-base leading-relaxed"
        // Narrative tables use fixed columns. Exact run values need their
        // natural widths inside this keyboard-accessible scrolling region.
        style={{ tableLayout: "auto", width: "max-content", minWidth: "100%" }}
      >
        <thead>
          <tr>
            {columns.map((c, i) => (
              <th
                key={i}
                scope="col"
                className="px-4 py-3 font-semibold border-b border-border whitespace-nowrap"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i}>
              {row.map((c, j) => (
                <td
                  key={j}
                  className="px-4 py-3 border-b border-border tabular-nums"
                >
                  {c === null ? "No value" : String(c)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SeriesOutput({
  artifact,
}: {
  artifact: Extract<ExerciseArtifact, { kind: "series" }>;
}) {
  const id = useId();
  const frame = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(800);
  useEffect(() => {
    if (!frame.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const next = entries[0]?.contentRect.width;
      if (next) setWidth(Math.max(240, next));
    });
    observer.observe(frame.current);
    return () => observer.disconnect();
  }, []);
  const [selected, setSelected] = useState<number | null>(null);
  const shown = artifact.series.filter(
    (_, i) => selected === null || selected === i,
  );
  const values = artifact.series.flatMap((s) => s.values);
  const min = Math.min(...values),
    max = Math.max(...values);
  // Normalize before subtraction so finite values at either numeric extreme
  // cannot overflow the SVG coordinates. Constant series stay in the middle.
  const scale = Math.max(Math.abs(min), Math.abs(max)) || 1;
  const low = min / scale,
    high = max / scale;
  const ticks =
    min === max
      ? [{ value: min, position: 140 }]
      : [
          { value: max, position: 56 },
          { value: min / 2 + max / 2, position: 140 },
          { value: min, position: 224 },
        ];
  // Keep the sign and leading decimals inside the viewport, including when
  // a captured loss series uses more digits than a narrow card can spare.
  const left = Math.max(
    60,
    ...ticks.map((tick) => display(tick.value).length * 9 + 16),
  );
  const x = (i: number) =>
    artifact.labels.length === 1
      ? width / 2
      : left + (i * (width - left - 30)) / (artifact.labels.length - 1);
  const y = (v: number) =>
    min === max ? 140 : 224 - ((v / scale - low) / (high - low)) * 168;
  return (
    <>
      <div
        className="flex flex-wrap gap-3 my-5"
        role="group"
        aria-label="Choose a series"
      >
        <button
          type="button"
          data-selected={selected === null}
          aria-pressed={selected === null}
          onClick={() => setSelected(null)}
          className="px-4 py-2 border border-border rounded data-[selected=true]:bg-surface-hover data-[selected=true]:font-bold focus-visible:outline focus-visible:outline-2"
        >
          All series
        </button>
        {artifact.series.map((series, i) => (
          <button
            key={i}
            type="button"
            data-selected={selected === i}
            aria-pressed={selected === i}
            onClick={() => setSelected(i)}
            className="px-4 py-2 border border-border rounded data-[selected=true]:bg-surface-hover data-[selected=true]:font-bold focus-visible:outline focus-visible:outline-2"
          >
            <span aria-hidden="true" style={{ color: COLORS[i] }}>
              ●{" "}
            </span>
            {series.name}
          </button>
        ))}
      </div>
      <div ref={frame}>
        <svg
          viewBox={`0 0 ${width} 300`}
          role="img"
          aria-labelledby={id}
          className="w-full min-w-0"
          style={{ height: 300 }}
        >
          <title id={id}>
            {artifact.title}. {artifact.yLabel} by {artifact.xLabel}. Values
            follow in the data table.
          </title>
          {ticks.map((tick, i) => (
            <g key={i}>
              <line
                x1={left}
                x2={width - 30}
                y1={tick.position}
                y2={tick.position}
                stroke="currentColor"
                opacity=".15"
              />
              <text
                data-exercise-y-tick
                x={left - 10}
                y={tick.position + 5}
                textAnchor="end"
                fill="currentColor"
                fontSize="14"
              >
                {display(tick.value)}
              </text>
            </g>
          ))}
          <text x="8" y="20" fill="currentColor" fontSize="16">
            {artifact.yLabel}
          </text>
          {shown.map((series) => {
            const index = artifact.series.indexOf(series);
            return (
              <g key={index} fill={COLORS[index]} stroke={COLORS[index]}>
                <polyline
                  fill="none"
                  strokeWidth="3"
                  strokeDasharray={
                    index % 3 === 0
                      ? undefined
                      : index % 3 === 1
                        ? "9 4"
                        : "3 4"
                  }
                  points={series.values
                    .map((v, i) => `${x(i)},${y(v)}`)
                    .join(" ")}
                />
                {series.values.map((v, i) => (
                  <circle key={i} cx={x(i)} cy={y(v)} r="4">
                    <title>
                      {series.name}, {artifact.labels[i]}: {display(v)}
                    </title>
                  </circle>
                ))}
              </g>
            );
          })}
          {[
            ...new Set([
              0,
              Math.floor((artifact.labels.length - 1) / 2),
              artifact.labels.length - 1,
            ]),
          ].map((i) => (
            <text
              key={i}
              x={x(i)}
              y="265"
              textAnchor="middle"
              fill="currentColor"
              fontSize="14"
            >
              {artifact.labels[i]}
            </text>
          ))}
          <text
            x={width / 2}
            y="295"
            textAnchor="middle"
            fill="currentColor"
            fontSize="16"
          >
            {artifact.xLabel}
          </text>
        </svg>
      </div>
      <details className="mt-5">
        <summary className="cursor-pointer py-3 text-lg">
          Read the values
        </summary>
        <DataTable
          title={artifact.title}
          columns={[artifact.xLabel, ...artifact.series.map((s) => s.name)]}
          rows={artifact.labels.map((label, i) => [
            label,
            ...artifact.series.map((s) => s.values[i]!),
          ])}
        />
      </details>
    </>
  );
}

export function ExerciseOutput({
  artifacts,
  stale,
  complete,
  staleMessage = "Your code has changed. Run it again to update these results.",
  outputLabel = "Output from your code",
  statusMessage,
}: {
  artifacts: ExerciseArtifact[];
  stale: boolean;
  complete: boolean;
  staleMessage?: string;
  outputLabel?: string;
  statusMessage?: string;
}) {
  if (!artifacts.length) return null;
  return (
    <section
      className="my-8 w-full min-w-0 border-t border-border pt-6"
      aria-label={outputLabel}
    >
      <p
        role="status"
        className={`mb-5 text-lg leading-relaxed ${stale ? "text-warning" : "text-text-secondary"}`}
      >
        {stale
          ? staleMessage
          : (statusMessage ??
            (complete
              ? "From your latest run"
              : "From your latest run. Some checks still need attention."))}
      </p>
      <div className={stale ? "opacity-60" : ""}>
        {artifacts.map((artifact, i) => (
          <div key={i} className={i ? "mt-8 pt-8 border-t border-border" : ""}>
            <h3
              data-exercise-output-title
              className="mb-3 text-2xl font-semibold text-text-primary"
            >
              {artifact.title}
            </h3>
            {artifact.summary && (
              <p className="mb-6 text-xl leading-relaxed text-text-secondary">
                {artifact.summary}
              </p>
            )}
            {artifact.kind === "table" ? (
              <DataTable
                title={artifact.title}
                columns={artifact.columns}
                rows={artifact.rows}
              />
            ) : artifact.kind === "series" ? (
              <SeriesOutput
                key={JSON.stringify(artifact)}
                artifact={artifact}
              />
            ) : (
              <pre className="whitespace-pre-wrap break-words text-base leading-relaxed font-sans">
                {artifact.text}
              </pre>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
