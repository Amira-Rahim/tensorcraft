"use client";

import { hexCorners } from "@tensorcraft/ui/visualizations";

interface GenomeAxis {
  key: string;
  label: string;
}

const AXES: GenomeAxis[] = [
  { key: "data_prep", label: "Data Prep" },
  { key: "model_arch", label: "Model Arch" },
  { key: "training", label: "Training" },
  { key: "evaluation", label: "Evaluation" },
  { key: "deployment", label: "Deployment" },
  { key: "fe_integration", label: "FE Integration" },
];

interface SkillGenomeProps {
  data: Array<{ skill_axis: string; proficiency: number; velocity: number }>;
}

function RadarChart({
  values,
  size,
  desc,
  isEmpty,
}: {
  values: number[];
  size: number;
  desc: string;
  isEmpty: boolean;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 16;
  const n = AXES.length;

  // Outer hexagon corners (for spokes and for the data polygon at full scale).
  const outerCorners = hexCorners(cx, cy, maxR);

  // Spokes: centre → outer vertex, for each axis.
  const axisLines = outerCorners.map(([x, y]) => `M${cx},${cy} L${x},${y}`);

  // Data polygon: each vertex scaled radially by proficiency/100.
  const dataPoints = values.map((v, i) => {
    const scale = v / 100;
    const [ox, oy] = outerCorners[i];
    const x = cx + (ox - cx) * scale;
    const y = cy + (oy - cy) * scale;
    return [x, y] as [number, number];
  });
  const dataPolygon = dataPoints.map(([x, y]) => `${x},${y}`).join(" ");

  const titleId = "sg-title";
  const descId = "sg-desc";

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      role="img"
      aria-labelledby={titleId}
      aria-describedby={descId}
      style={{ width: "100%", maxWidth: size, height: "auto" }}
    >
      <title id={titleId}>Skill profile</title>
      <desc id={descId}>{desc}</desc>
      {axisLines.map((d, i) => (
        <path
          key={`axis-${i}`}
          d={d}
          stroke="var(--tc-border)"
          strokeWidth="0.5"
        />
      ))}
      {/* Single dashed tick at 50% — Option C uses one reference, not concentric rings. */}
      <circle
        cx={cx}
        cy={cy}
        r={maxR * 0.5}
        fill="none"
        stroke="var(--tc-border)"
        strokeDasharray="1 3"
      />
      {isEmpty ? (
        <>
          <rect
            x={cx - 44}
            y={cy - 9}
            width={88}
            height={18}
            fill="var(--tc-surface-raised)"
          />
          <text
            x={cx}
            y={cy}
            fill="var(--tc-muted)"
            fontSize="10"
            fontFamily="monospace"
            textAnchor="middle"
            dominantBaseline="middle"
          >
            No activity yet
          </text>
        </>
      ) : (
        <polygon
          points={dataPolygon}
          fill="none"
          stroke="var(--tc-primary)"
          strokeWidth="1.5"
        />
      )}
    </svg>
  );
}

export function SkillGenome({ data }: SkillGenomeProps) {
  // Pad/normalise to canonical axis order. Missing axes → 0.
  const axisValues = AXES.map((axis) => {
    const match = data.find((d) => d.skill_axis === axis.key);
    return {
      key: axis.key,
      label: axis.label,
      proficiency: match?.proficiency ?? 0,
    };
  });

  const radarValues = axisValues.map((a) => a.proficiency);
  const isEmpty = radarValues.every((v) => v === 0);

  const desc =
    "Skill profile. " +
    axisValues
      .map((a) => `${a.key} ${(a.proficiency / 100).toFixed(2)}`)
      .join(", ") +
    ".";

  // Velocity footer — unchanged; uses original prop data.
  const velocities = data
    .filter((d) => d.velocity !== 0)
    .map((d) => d.velocity);
  const avgVelocity =
    velocities.length > 0
      ? velocities.reduce((sum, v) => sum + v, 0) / velocities.length
      : 0;

  return (
    <div className="brutalist-shadow bg-surface-raised border border-border overflow-hidden my-6">
      <div className="p-5">
        <div className="font-mono text-xs uppercase tracking-widest text-text-muted mb-4">
          // SKILL GENOME
        </div>
        <div className="flex flex-wrap items-center gap-x-12 gap-y-6">
          <div className="shrink-0">
            <RadarChart
              values={radarValues}
              size={220}
              desc={desc}
              isEmpty={isEmpty}
            />
          </div>
          <div className="flex flex-col gap-1 font-mono text-xs w-full max-w-70 min-w-55">
            <div
              className="text-text-muted pb-1 border-b border-border"
              style={{ color: "var(--tc-muted)" }}
            >
              # skill_genome
            </div>
            {axisValues.map((axis) => (
              <div key={axis.key} className="flex justify-between gap-4 py-0.5">
                <span style={{ color: "var(--tc-text)" }}>{axis.key}</span>
                <span style={{ color: "var(--tc-primary)" }}>
                  {(axis.proficiency / 100).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-5 py-2 border-t border-border bg-surface flex justify-between">
        <span className="font-mono text-xs text-text-muted uppercase tracking-widest">
          Velocity
        </span>
        <span
          className="font-mono text-xs font-semibold"
          style={{
            color:
              avgVelocity > 0
                ? "var(--tc-tier-identity)"
                : avgVelocity < 0
                  ? "var(--tc-axis-evaluation)"
                  : "var(--tc-muted)",
          }}
        >
          {avgVelocity > 0
            ? `▲ +${avgVelocity.toFixed(1)} /week`
            : avgVelocity < 0
              ? `▼ ${avgVelocity.toFixed(1)} /week`
              : "— 0.0 /week"}
        </span>
      </div>
    </div>
  );
}
