import { stepPath } from "./helpers";

export interface WeeklyHints {
  weekStart: string;
  avgHints: number | null;
}

export interface LossCurveProps {
  weekly: WeeklyHints[];
  className?: string;
}

const MONO = "var(--font-mono), 'JetBrains Mono', ui-monospace, monospace";
const VIEW_W = 260;
const VIEW_H = 130;
const LEFT = 30;
const RIGHT = 250;
const TOP = 20;
const BOTTOM = 115;

export function LossCurve({ weekly, className }: LossCurveProps) {
  const nonNull = weekly.filter(
    (w): w is WeeklyHints & { avgHints: number } => w.avgHints !== null,
  );
  const isEmpty = nonNull.length === 0;
  const isInsufficient = nonNull.length > 0 && nonNull.length < 3;

  const titleId = "lc-title";
  const descId = "lc-desc";

  const yMax = Math.max(5, ...nonNull.map((w) => w.avgHints)) + 1.0;
  const plotY = (v: number) => BOTTOM - (v / yMax) * (BOTTOM - TOP);
  const plotX = (i: number) =>
    LEFT + (i / Math.max(1, weekly.length - 1)) * (RIGHT - LEFT);

  const points: Array<[number, number]> = [];
  weekly.forEach((w, i) => {
    if (w.avgHints !== null) points.push([plotX(i), plotY(w.avgHints)]);
  });

  const first = nonNull[0];
  const last = nonNull[nonNull.length - 1];
  const direction =
    nonNull.length < 2
      ? "single data point"
      : last.avgHints < first.avgHints
        ? "decreasing"
        : last.avgHints > first.avgHints
          ? "increasing"
          : "flat";

  const desc = isEmpty
    ? "No exercise data yet. Complete 3 or more exercises to see a trend."
    : `Rolling 7-day average hints per exercise, last ${weekly.length} weeks. ` +
      `Started at ${first.avgHints.toFixed(1)} hints in the earliest week, ` +
      `currently ${last.avgHints.toFixed(1)} hints. Trend: ${direction}.`;

  return (
    <svg
      viewBox={`0 0 ${VIEW_W} ${VIEW_H}`}
      role="img"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className={className}
      style={{ width: "100%", maxWidth: 560, display: "block" }}
    >
      <title id={titleId}>Rolling 7-day average hints per exercise</title>
      <desc id={descId}>{desc}</desc>

      {/* Comment header */}
      <text
        x={LEFT}
        y={10}
        fontFamily={MONO}
        fontSize="9"
        fill="var(--tc-muted)"
      >
        // loss.hints — {weekly.length}wk
      </text>

      {/* Baseline */}
      <line
        x1={LEFT}
        y1={BOTTOM}
        x2={RIGHT}
        y2={BOTTOM}
        stroke="var(--tc-border)"
      />

      {isEmpty ? (
        <text
          x={VIEW_W / 2}
          y={(TOP + BOTTOM) / 2}
          textAnchor="middle"
          fontFamily={MONO}
          fontSize="10"
          fill="var(--tc-muted)"
        >
          Complete 3+ exercises to see trend
        </text>
      ) : (
        <>
          {/* Staircase line */}
          <polyline
            points={stepPath(points)}
            fill="none"
            stroke="var(--tc-primary)"
            strokeWidth="1.5"
          />

          {/* Start/end labels */}
          <text
            x={LEFT}
            y={TOP - 6}
            fontFamily={MONO}
            fontSize="9"
            fill="var(--tc-muted)"
          >
            {first.avgHints.toFixed(1)} W1
          </text>
          {last !== first && (
            <text
              x={RIGHT}
              y={plotY(last.avgHints) - 6}
              fontFamily={MONO}
              fontSize="9"
              fill="var(--tc-primary)"
              textAnchor="end"
            >
              {last.avgHints.toFixed(1)} W{weekly.length}
            </text>
          )}

          {/* Insufficient-data notice */}
          {isInsufficient && (
            <text
              x={VIEW_W / 2}
              y={BOTTOM + 12}
              textAnchor="middle"
              fontFamily={MONO}
              fontSize="9"
              fill="var(--tc-muted)"
            >
              {nonNull.length} of 3+ exercises
            </text>
          )}
        </>
      )}
    </svg>
  );
}
