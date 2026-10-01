"use client";
import { useEffect, useId, useRef, useState } from "react";

export interface WeeklyHints {
  weekStart: string;
  avgHints: number | null;
}
export interface LossCurveProps {
  weekly: WeeklyHints[];
  className?: string;
}

/** Calendar-week averages. A trend needs observations in three separate weeks. */
export function LossCurve({ weekly, className }: LossCurveProps) {
  const root = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(320);
  const id = useId();
  useEffect(() => {
    if (!root.current || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver((entries) => {
      const measured = entries[0]?.contentRect.width;
      if (measured) setWidth(Math.max(200, measured));
    });
    observer.observe(root.current);
    return () => observer.disconnect();
  }, [weekly]);
  const observations = weekly.flatMap((w, i) =>
    w.avgHints !== null && Number.isFinite(w.avgHints)
      ? [{ ...w, avgHints: w.avgHints, i }]
      : [],
  );
  if (observations.length < 3)
    return (
      <p className={className} role="status">
        {observations.length === 0
          ? "No hint data recorded yet."
          : `${observations.length} of 3 weeks with hint data.`}{" "}
        A trend appears after practice in at least 3 separate weeks.
      </p>
    );
  const height = 220,
    left = 42,
    right = width - 16,
    top = 24,
    bottom = 174;
  const yMax = Math.max(
    1,
    Math.ceil(Math.max(...observations.map((w) => w.avgHints))),
  );
  const x = (i: number) =>
    left + (i / Math.max(1, weekly.length - 1)) * (right - left);
  const y = (hints: number) => bottom - (hints / yMax) * (bottom - top);
  const dateLabel = (date: string) =>
    new Date(`${date}T00:00:00Z`).toLocaleDateString("en", {
      month: "short",
      day: "numeric",
      timeZone: "UTC",
    });
  const segments: string[] = [];
  let previous = -2;
  for (const w of observations) {
    const point = `${x(w.i)},${y(w.avgHints)}`;
    if (w.i !== previous + 1) segments.push(point);
    else segments[segments.length - 1] += ` ${point}`;
    previous = w.i;
  }
  return (
    <div
      ref={root}
      className={className}
      style={{ width: "100%", maxWidth: 560, marginTop: 16 }}
    >
      <p style={{ fontSize: 12, color: "var(--tc-muted)", marginBottom: 8 }}>
        Last {weekly.length} weeks
      </p>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-desc`}
        style={{ width: "100%", display: "block" }}
      >
        <title id={`${id}-title`}>
          Weekly average hints per exercise attempt
        </title>
        <desc id={`${id}-desc`}>
          {observations.length} weeks with recorded hint data. First recorded
          week: {observations[0].avgHints.toFixed(1)} hint levels per attempt.
          Latest recorded week: {observations.at(-1)!.avgHints.toFixed(1)}. Gaps
          indicate weeks with no recorded hint data.
        </desc>
        <text x={left} y={12} fontSize={12} fill="var(--tc-muted)">
          Hint levels per attempt
        </text>
        {[0, yMax / 2, yMax].map((v) => (
          <g key={v}>
            <line
              x1={left}
              x2={right}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--tc-border)"
            />
            <text
              x={left - 8}
              y={y(v) + 4}
              textAnchor="end"
              fontSize={12}
              fill="var(--tc-muted)"
            >
              {Number.isInteger(v) ? v : v.toFixed(1)}
            </text>
          </g>
        ))}
        {segments.map((points, i) => (
          <polyline
            key={i}
            points={points}
            fill="none"
            stroke="var(--tc-primary)"
            strokeWidth={2}
          />
        ))}
        {observations.map((w) => (
          <circle
            key={w.weekStart}
            cx={x(w.i)}
            cy={y(w.avgHints)}
            r={3}
            fill="var(--tc-primary)"
          >
            <title>
              Week of {dateLabel(w.weekStart)}: {w.avgHints.toFixed(1)} hint
              levels per attempt
            </title>
          </circle>
        ))}
        <text x={left} y={bottom + 24} fontSize={12} fill="var(--tc-muted)">
          {dateLabel(weekly[0].weekStart)}
        </text>
        <text
          x={right}
          y={bottom + 24}
          textAnchor="end"
          fontSize={12}
          fill="var(--tc-muted)"
        >
          {dateLabel(weekly.at(-1)!.weekStart)}
        </text>
      </svg>
    </div>
  );
}
