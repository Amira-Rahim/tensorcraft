"use client";

import { useEffect, useState } from "react";

interface GenomeAxis {
  key: string;
  label: string;
  shortLabel: string;
  proficiency: number;
  color: string;
}

const AXES: Omit<GenomeAxis, "proficiency">[] = [
  {
    key: "data_prep",
    label: "Data Prep",
    shortLabel: "DATA",
    color: "var(--tc-axis-data-prep)",
  },
  {
    key: "model_arch",
    label: "Model Arch",
    shortLabel: "MODEL",
    color: "var(--tc-axis-model-arch)",
  },
  {
    key: "training",
    label: "Training",
    shortLabel: "TRAIN",
    color: "var(--tc-axis-training)",
  },
  {
    key: "evaluation",
    label: "Evaluation",
    shortLabel: "EVAL",
    color: "var(--tc-axis-evaluation)",
  },
  {
    key: "deployment",
    label: "Deployment",
    shortLabel: "DEPLOY",
    color: "var(--tc-axis-deployment)",
  },
  {
    key: "fe_integration",
    label: "FE Integration",
    shortLabel: "FE INT",
    color: "var(--tc-axis-fe-integration)",
  },
];

interface SkillGenomeProps {
  data: Array<{ skill_axis: string; proficiency: number; velocity: number }>;
}

function polarToCartesian(
  cx: number,
  cy: number,
  radius: number,
  index: number,
  total: number,
): [number, number] {
  const angle = (Math.PI * 2 * index) / total - Math.PI / 2;
  return [cx + radius * Math.cos(angle), cy + radius * Math.sin(angle)];
}

function RadarChart({ values, size }: { values: number[]; size: number }) {
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 24;
  const n = AXES.length;

  const rings = [0.33, 0.66, 1.0];

  const axisLines = Array.from({ length: n }, (_, i) => {
    const [x, y] = polarToCartesian(cx, cy, maxR, i, n);
    return `M${cx},${cy} L${x},${y}`;
  });

  const ringPolygons = rings.map((r) => {
    const points = Array.from({ length: n }, (_, i) => {
      const [x, y] = polarToCartesian(cx, cy, maxR * r, i, n);
      return `${x},${y}`;
    }).join(" ");
    return points;
  });

  const dataPoints = values.map((v, i) => {
    const r = (v / 100) * maxR;
    const [x, y] = polarToCartesian(cx, cy, r, i, n);
    return { x, y };
  });
  const dataPolygon = dataPoints.map((p) => `${p.x},${p.y}`).join(" ");

  const labelPositions = AXES.map((axis, i) => {
    const [x, y] = polarToCartesian(cx, cy, maxR + 16, i, n);
    return { x, y, label: axis.shortLabel };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {axisLines.map((d, i) => (
        <path
          key={`axis-${i}`}
          d={d}
          stroke="var(--tc-border)"
          strokeWidth="0.5"
        />
      ))}
      {ringPolygons.map((points, i) => (
        <polygon
          key={`ring-${i}`}
          points={points}
          fill="none"
          stroke="var(--tc-border)"
          strokeWidth="1"
        />
      ))}
      <polygon
        points={dataPolygon}
        fill="var(--tc-primary)"
        fillOpacity="0.15"
        stroke="var(--tc-primary)"
        strokeWidth="2"
      />
      {dataPoints.map((p, i) => (
        <circle
          key={`dot-${i}`}
          cx={p.x}
          cy={p.y}
          r="4"
          fill="var(--tc-primary)"
        />
      ))}
      {labelPositions.map((lp, i) => (
        <text
          key={`label-${i}`}
          x={lp.x}
          y={lp.y}
          fill="var(--tc-text)"
          fontSize="9"
          fontFamily="monospace"
          textAnchor="middle"
          dominantBaseline="middle"
        >
          {lp.label}
        </text>
      ))}
    </svg>
  );
}

export function SkillGenome({ data }: SkillGenomeProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  if (data.length === 0) {
    return (
      <div className="brutalist-shadow bg-surface-raised border border-border p-5 my-6">
        <div className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-6">
          // SKILL GENOME
        </div>
        <div className="flex flex-col items-center justify-center py-8">
          <span className="text-4xl text-primary opacity-40 mb-4">◎</span>
          <p className="font-mono text-[13px] text-text-muted text-center mb-4">
            Complete exercises to unlock
            <br />
            your Skill Genome
          </p>
          <div className="w-full max-w-[240px]">
            <div className="h-1 bg-border w-full" />
            <div className="font-mono text-[9px] text-text-muted text-center mt-2">
              0 / 6 axes active
            </div>
          </div>
        </div>
      </div>
    );
  }

  const axisData: GenomeAxis[] = AXES.map((axis) => {
    const match = data.find((d) => d.skill_axis === axis.key);
    return { ...axis, proficiency: match?.proficiency ?? 0 };
  });

  const radarValues = axisData.map((a) => a.proficiency);

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
        <div className="font-mono text-[9px] uppercase tracking-widest text-text-muted mb-4">
          // SKILL GENOME
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6">
          <div className="flex justify-center sm:justify-start">
            <div className="hidden sm:block">
              <RadarChart values={radarValues} size={200} />
            </div>
            <div className="block sm:hidden">
              <RadarChart values={radarValues} size={160} />
            </div>
          </div>
          <div className="flex flex-col gap-3 justify-center">
            {axisData.map((axis, i) => (
              <div key={axis.key}>
                <div className="flex justify-between mb-1">
                  <span className="font-mono text-[9px] text-text-primary">
                    {axis.label}
                  </span>
                  <span
                    className="font-mono text-[9px] font-semibold"
                    style={{ color: axis.color }}
                  >
                    {Math.round(axis.proficiency)}%
                  </span>
                </div>
                <div className="h-1 bg-border">
                  <div
                    className="h-full transition-all ease-out"
                    style={{
                      width: mounted ? `${axis.proficiency}%` : "0%",
                      background: axis.color,
                      transitionDuration: "600ms",
                      transitionDelay: `${i * 100}ms`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div className="px-5 py-2 border-t border-border bg-surface flex justify-between">
        <span className="font-mono text-[9px] text-text-muted uppercase tracking-widest">
          Velocity
        </span>
        <span
          className="font-mono text-[9px] font-semibold"
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
