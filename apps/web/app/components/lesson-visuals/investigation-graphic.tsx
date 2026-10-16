import { useId } from "react";
import type { InvestigationGraphic as Graphic } from "./investigation-types";

export const formatInvestigationValue = (value: number | string): string =>
  typeof value === "number"
    ? Number.isFinite(value)
      ? Number(value.toFixed(3)).toString()
      : "Unavailable"
    : value;

export function investigationDomain(
  graphics: Graphic[],
): [number, number] | undefined {
  const values = graphics.flatMap((graphic) =>
    graphic.values.filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value),
    ),
  );
  if (!values.length) return undefined;
  const low = Math.min(0, ...values);
  const high = Math.max(0, ...values);
  return low === high ? [low, high + 1] : [low, high];
}

function GraphicValues({ graphic }: { graphic: Graphic }) {
  return (
    <details className="orbit-investigation-values">
      <summary>Read the values</summary>
      <div
        className="orbit-investigation-values-scroll"
        tabIndex={0}
        role="region"
        aria-label={`${graphic.label}: values table`}
      >
        <table className="orbit-investigation-values-table">
          <caption>{graphic.label}</caption>
          <thead>
            <tr>
              <th scope="col">Position</th>
              <th scope="col">Value</th>
            </tr>
          </thead>
          <tbody>
            {graphic.values.map((value, index) => (
              <tr key={index}>
                <th scope="row">{graphic.labels?.[index] ?? index + 1}</th>
                <td>{formatInvestigationValue(value)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function NumericChart({
  graphic,
  domain,
}: {
  graphic: Graphic;
  domain?: [number, number];
}) {
  const descriptionId = useId();
  const values = graphic.values.map((value) =>
    typeof value === "number" && Number.isFinite(value) ? value : 0,
  );
  const [low, high] = domain ?? investigationDomain([graphic]) ?? [0, 1];
  const width = 460;
  const height = 220;
  const left = 62;
  const right = width - 20;
  const top = 22;
  const bottom = height - 64;
  const scaleY = (value: number) =>
    Number(
      (bottom - ((value - low) / (high - low)) * (bottom - top)).toFixed(3),
    );
  const zero = scaleY(0);
  const step = (right - left) / Math.max(values.length, 1);
  const scaleX = (index: number) =>
    Number((left + step * (index + 0.5)).toFixed(3));
  const labelIndexes = [
    ...new Set([0, Math.floor((values.length - 1) / 2), values.length - 1]),
  ].filter((index) => index >= 0);
  const labelFor = (index: number) =>
    graphic.labels?.[index] ?? String(index + 1);
  const axisLabel = (label: string) => {
    if (label.length <= 13) return [label];
    const words = label.split(" ");
    const first: string[] = [];
    while (words.length && [...first, words[0]].join(" ").length <= 13)
      first.push(words.shift()!);
    if (!first.length) return [label.slice(0, 12) + "…"];
    const rest = words.join(" ");
    return [first.join(" "), rest.length > 13 ? rest.slice(0, 12) + "…" : rest];
  };

  return (
    <>
      <svg
        className="orbit-investigation-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={graphic.label}
        aria-describedby={descriptionId}
      >
        <desc id={descriptionId}>
          {graphic.values
            .map(
              (value, index) =>
                `${labelFor(index)}: ${formatInvestigationValue(value)}${graphic.highlight?.includes(index) ? " (selected)" : ""}`,
            )
            .join(", ")}
        </desc>
        <line
          x1={left}
          x2={right}
          y1={zero}
          y2={zero}
          className="orbit-investigation-chart-axis"
        />
        <line
          x1={left}
          x2={left}
          y1={top}
          y2={bottom}
          className="orbit-investigation-chart-axis"
        />
        {[high, low].map((value, index) => (
          <text
            key={index}
            x={left - 12}
            y={scaleY(value) + 6}
            textAnchor="end"
            fontSize="22"
          >
            {formatInvestigationValue(value)}
          </text>
        ))}
        {low < 0 && high > 0 && (
          <text x={left - 12} y={zero + 6} textAnchor="end" fontSize="22">
            0
          </text>
        )}
        {graphic.kind === "line" ? (
          <>
            <polyline
              points={values
                .map((value, index) => `${scaleX(index)},${scaleY(value)}`)
                .join(" ")}
              fill="none"
              stroke="var(--tc-primary)"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            {values.map((value, index) => (
              <circle
                key={index}
                cx={scaleX(index)}
                cy={scaleY(value)}
                r={graphic.highlight?.includes(index) ? 6 : 3}
                fill="var(--tc-primary)"
                stroke="currentColor"
                strokeWidth={graphic.highlight?.includes(index) ? 2 : 0}
              />
            ))}
          </>
        ) : (
          values.map((value, index) => (
            <rect
              key={index}
              x={Number((left + step * index + step * 0.15).toFixed(3))}
              y={Math.min(zero, scaleY(value))}
              width={Number((step * 0.7).toFixed(3))}
              height={Math.max(Math.abs(scaleY(value) - zero), 1)}
              fill="var(--tc-primary)"
              fillOpacity={
                graphic.highlight?.length && !graphic.highlight.includes(index)
                  ? 0.4
                  : 0.8
              }
              stroke={
                graphic.highlight?.includes(index) ? "currentColor" : "none"
              }
              strokeWidth="2"
            />
          ))
        )}
        {labelIndexes.map((index) => (
          <text
            key={index}
            x={scaleX(index)}
            y={height - 35}
            textAnchor="middle"
            fontSize="22"
          >
            {axisLabel(labelFor(index)).map((part, lineIndex) => (
              <tspan
                key={lineIndex}
                x={scaleX(index)}
                dy={lineIndex === 0 ? 0 : 24}
              >
                {part}
              </tspan>
            ))}
          </text>
        ))}
      </svg>
      <GraphicValues graphic={graphic} />
    </>
  );
}

export function InvestigationGraphic({
  graphic,
  domain,
}: {
  graphic: Graphic;
  domain?: [number, number];
}) {
  return (
    <figure
      className={`orbit-investigation-graphic orbit-investigation-graphic-${graphic.kind}`}
    >
      <figcaption className="orbit-investigation-graphic-title">
        {graphic.label}
      </figcaption>
      {graphic.kind === "cells" ? (
        <ol
          className="orbit-investigation-cells"
          tabIndex={0}
          style={{
            gridTemplateColumns: `repeat(${Math.max(1, graphic.columns ?? graphic.values.length)}, minmax(52px, 1fr))`,
          }}
          aria-label={graphic.label}
        >
          {graphic.values.map((value, index) => (
            <li
              key={index}
              className="orbit-investigation-cell"
              data-highlight={
                graphic.highlight?.includes(index) ? "true" : undefined
              }
            >
              {graphic.labels?.[index] && (
                <span className="orbit-investigation-cell-label">
                  {graphic.labels[index]}
                </span>
              )}
              <span>{formatInvestigationValue(value)}</span>
              {graphic.highlight?.includes(index) && (
                <span className="orbit-investigation-cell-mark">Selected</span>
              )}
            </li>
          ))}
        </ol>
      ) : graphic.kind === "pipeline" ? (
        <ol className="orbit-investigation-pipeline" aria-label={graphic.label}>
          {graphic.values.map((value, index) => (
            <li
              key={index}
              className="orbit-investigation-stage"
              data-highlight={
                graphic.highlight?.includes(index) ? "true" : undefined
              }
            >
              <span className="orbit-investigation-stage-label">
                {graphic.labels?.[index] ?? `Step ${index + 1}`}
              </span>
              <span className="orbit-investigation-stage-value">
                {formatInvestigationValue(value)}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <NumericChart graphic={graphic} domain={domain} />
      )}
    </figure>
  );
}
