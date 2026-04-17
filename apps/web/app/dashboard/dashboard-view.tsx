"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SkillGenome } from "./skill-genome";
import { UserAvatar } from "@/app/components/user-avatar";

/* ── Design tokens (use CSS vars from theme system) ── */
const LIME = "var(--tc-primary)";
const BG = "var(--tc-bg)";
const PANEL = "var(--tc-surface)";
const CARD = "var(--tc-surface-overlay)";
const WHITE = "var(--tc-text)";
const MUTED = "var(--tc-muted)";
const BORDER_VAR = "var(--tc-border)";
const MONO = "var(--font-mono), 'JetBrains Mono', monospace";

const TIER_COLORS: Record<string, string> = {
  identity: "var(--tc-tier-identity, #6BAA8A)",
  structural: "var(--tc-tier-structural, #7096B0)",
  intuition: "var(--tc-tier-intuition, #A89060)",
};

/** Resolve a CSS custom property to a hex/rgb string for Canvas 2D context */
function resolveVar(varName: string, fallback: string): string {
  if (typeof window === "undefined") return fallback;
  const resolved = getComputedStyle(document.documentElement)
    .getPropertyValue(varName)
    .trim();
  return resolved || fallback;
}

/** Resolve CSS var to RGB tuple for canvas rgba() usage */
function resolveRGB(
  varName: string,
  fallback: [number, number, number],
): [number, number, number] {
  const hex = resolveVar(varName, "");
  if (!hex || !hex.startsWith("#")) return fallback;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return [r, g, b];
}

/* ── Types ── */
export interface DashboardModule {
  number: string;
  name: string;
  status: "done" | "active" | "locked";
  score: number | null;
  formula: string;
  slug: string;
}

export interface DashboardBridge {
  feTitle: string;
  mlTitle: string;
  tier: "identity" | "structural" | "intuition";
  collected: boolean;
  lessonSlug: string;
  moduleSlug: string;
}

export interface ActivityRecord {
  time: string;
  event: string;
  detail: string;
  score: number | null;
}

export interface DashboardProps {
  displayName: string;
  avatarUrl?: string | null;
  themeName: string;
  themeSlug: string;
  modules: DashboardModule[];
  currentModule: {
    number: number;
    name: string;
    lessonNumber: number;
    totalLessons: number;
    estimatedMinutes: number;
    topic: string;
  } | null;
  themeProgressPercent: number;
  themePoints: { current: number; total: number };
  currentStreak: number;
  bestStreak: number;
  averageScore: number;
  bridges: DashboardBridge[];
  activityDays: number[];
  recentActivity: ActivityRecord[];
  resumeUrl: string | null;
  totalModules: number;
  completedModules: number;
  genomeData: Array<{
    skill_axis: string;
    proficiency: number;
    velocity: number;
  }>;
}

/* ── Loss curve data (visualisation) ── */
const CURVE = (() => {
  const a: { l: number; v: number }[] = [];
  let l = 2.5,
    v = 2.8;
  for (let i = 0; i <= 140; i++) {
    const n = (Math.sin(i * 7.3) + Math.sin(i * 2.1)) * 0.011;
    l = Math.max(0.04, l * 0.915 + n);
    v = Math.max(0.08, v * 0.928 + n * 1.4);
    a.push({ l, v });
  }
  return a;
})();

/* ── Radar helper ── */
const radarAxes = [
  "Data Prep",
  "Model Arch",
  "Training",
  "Evaluation",
  "Deployment",
  "FE Integ.",
];
const rpt = (scores: number[], cx: number, cy: number, R: number) =>
  scores.map((s, i) => {
    const a = (i / scores.length) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(a) * s * R, y: cy + Math.sin(a) * s * R };
  });

export function DashboardView(props: DashboardProps) {
  const {
    displayName,
    avatarUrl,
    themeName,
    themeSlug,
    modules,
    currentModule,
    themeProgressPercent,
    themePoints,
    currentStreak,
    bestStreak,
    averageScore,
    bridges,
    activityDays,
    recentActivity,
    resumeUrl,
    totalModules,
    completedModules,
    genomeData,
  } = props;

  const lossCanvasRef = useRef<HTMLCanvasElement>(null);
  const lossRaf = useRef(0);
  const plotProg = useRef(0);
  const [heatVis, setHeatVis] = useState(false);
  const [hovM, setHovM] = useState<number | null>(null);
  const [hovBtn, setHovBtn] = useState<string | null>(null);
  const [ring, setRing] = useState(0);

  useEffect(() => {
    let f = 0;
    const ri = setInterval(() => {
      f++;
      setRing(Math.min(f * 1.6, themeProgressPercent));
      if (f > Math.ceil(themeProgressPercent / 1.6)) clearInterval(ri);
    }, 32);
    setTimeout(() => setHeatVis(true), 400);
    return () => clearInterval(ri);
  }, [themeProgressPercent]);

  /* ── Loss curve canvas ── */
  useEffect(() => {
    const canvas = lossCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };
    resize();

    // Debounce resize to avoid excessive canvas recalculations
    let resizeTimer: ReturnType<typeof setTimeout>;
    const debouncedResize = () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    };
    window.addEventListener("resize", debouncedResize);

    const draw = () => {
      const W = canvas.offsetWidth,
        H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);
      const [pr, pg, pb] = resolveRGB("--tc-primary", [107, 170, 138]);
      plotProg.current = Math.min(CURVE.length - 1, plotProg.current + 0.55);
      const vis = Math.floor(plotProg.current);
      const CX = W * 0.07,
        CY = H * 0.12,
        CW = W * 0.86,
        CH = H * 0.74;
      const maxL = 2.8;
      const toX = (i: number) => CX + (i / (CURVE.length - 1)) * CW;
      const toY = (v: number) => CY + CH - Math.min(1, v / maxL) * CH;

      // Grid
      ctx.strokeStyle = "rgba(42,42,42,0.7)";
      ctx.lineWidth = 1;
      for (let i = 0; i <= 4; i++) {
        const y = CY + (i / 4) * CH;
        ctx.beginPath();
        ctx.moveTo(CX, y);
        ctx.lineTo(CX + CW, y);
        ctx.stroke();
      }
      for (let i = 0; i <= 6; i++) {
        const x = CX + (i / 6) * CW;
        ctx.beginPath();
        ctx.moveTo(x, CY);
        ctx.lineTo(x, CY + CH);
        ctx.stroke();
      }

      // Axis labels
      ctx.font = `9px JetBrains Mono, monospace`;
      ctx.fillStyle = "rgba(90,90,90,0.6)";
      ctx.textAlign = "right";
      for (let i = 0; i <= 4; i++) {
        ctx.fillText(
          ((maxL * (4 - i)) / 4).toFixed(1),
          CX - 6,
          CY + (i / 4) * CH + 3,
        );
      }
      ctx.textAlign = "center";
      ctx.fillText("<- epochs ->", CX + CW / 2, CY + CH + 14);

      if (vis > 0) {
        // Fill
        const gf = ctx.createLinearGradient(0, CY, 0, CY + CH);
        gf.addColorStop(0, `rgba(${pr},${pg},${pb},0.1)`);
        gf.addColorStop(1, `rgba(${pr},${pg},${pb},0)`);
        ctx.beginPath();
        ctx.moveTo(toX(0), CY + CH);
        CURVE.slice(0, vis + 1).forEach((p, i) => ctx.lineTo(toX(i), toY(p.l)));
        ctx.lineTo(toX(vis), CY + CH);
        ctx.closePath();
        ctx.fillStyle = gf;
        ctx.fill();

        // Train line
        ctx.beginPath();
        ctx.setLineDash([]);
        CURVE.slice(0, vis + 1).forEach((p, i) =>
          i === 0 ? ctx.moveTo(toX(i), toY(p.l)) : ctx.lineTo(toX(i), toY(p.l)),
        );
        ctx.strokeStyle = `rgba(${pr},${pg},${pb},0.65)`;
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Val line
        ctx.beginPath();
        ctx.setLineDash([4, 3]);
        CURVE.slice(0, vis + 1).forEach((p, i) =>
          i === 0 ? ctx.moveTo(toX(i), toY(p.v)) : ctx.lineTo(toX(i), toY(p.v)),
        );
        ctx.strokeStyle = "rgba(90,90,90,0.45)";
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.setLineDash([]);

        if (vis >= CURVE.length - 1) {
          // Animation complete — stop the loop instead of restarting
          return;
        }

        // Current values
        const cur = CURVE[vis];
        ctx.font = `9px JetBrains Mono, monospace`;
        ctx.textAlign = "left";
        ctx.fillStyle = `rgba(${pr},${pg},${pb},0.6)`;
        ctx.fillText(`train ${cur.l.toFixed(4)}`, toX(vis) + 4, toY(cur.l) - 4);
        ctx.fillStyle = "rgba(90,90,90,0.55)";
        ctx.fillText(
          `val   ${cur.v.toFixed(4)}`,
          toX(vis) + 4,
          toY(cur.v) + 12,
        );
      }

      // Legend
      ctx.font = `9px JetBrains Mono, monospace`;
      ctx.textAlign = "left";
      ctx.fillStyle = "color-mix(in srgb, var(--tc-primary) 50%, transparent)";
      ctx.fillRect(CX, CY + 6, 18, 1.5);
      ctx.fillText("train loss", CX + 24, CY + 10);
      ctx.fillStyle = "rgba(90,90,90,0.5)";
      ctx.fillRect(CX, CY + 20, 18, 1.5);
      ctx.fillText("val loss", CX + 24, CY + 24);

      lossRaf.current = requestAnimationFrame(draw);
    };
    lossRaf.current = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(lossRaf.current);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", debouncedResize);
    };
  }, []);

  /* ── Radar SVG ── */
  const radarScores = (() => {
    // Derive rough skill scores from module completion
    const done = modules.filter((m) => m.status === "done").length;
    const total = modules.length;
    const base = total > 0 ? done / total : 0;
    return [
      Math.min(1, base * 1.2), // Data Prep
      Math.min(1, base * 0.9), // Model Arch
      Math.min(1, base * 0.8), // Training
      Math.min(1, base * 0.7), // Evaluation
      Math.min(1, base * 0.3), // Deployment
      Math.min(1, base * 1.3), // FE Integ.
    ];
  })();

  const radarSVG = () => {
    const cx = 100,
      cy = 100,
      R = 76;
    const rings = [0.25, 0.5, 0.75, 1];
    const scorePts = rpt(radarScores, cx, cy, R);
    const scorePath =
      scorePts
        .map(
          (p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`,
        )
        .join(" ") + "Z";

    return (
      <svg viewBox="0 0 200 200" width="100%" height="100%">
        {rings.map((r, ri) => {
          const pts = rpt(Array(6).fill(r), cx, cy, R);
          const d =
            pts
              .map(
                (p, i) =>
                  `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`,
              )
              .join(" ") + "Z";
          return (
            <path
              key={ri}
              d={d}
              fill="none"
              stroke={resolveVar("--tc-border", "#3D3D3D")}
              strokeWidth="0.8"
            />
          );
        })}
        {radarAxes.map((_, i) => {
          const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
          const pt = { x: cx + Math.cos(a) * R, y: cy + Math.sin(a) * R };
          return (
            <line
              key={i}
              x1={cx}
              y1={cy}
              x2={pt.x.toFixed(1)}
              y2={pt.y.toFixed(1)}
              stroke={resolveVar("--tc-border", "#3D3D3D")}
              strokeWidth="0.8"
            />
          );
        })}
        <path
          d={scorePath}
          fill="color-mix(in srgb, var(--tc-primary) 8%, transparent)"
          stroke={resolveVar("--tc-primary", "#6BAA8A")}
          strokeWidth="1.5"
        />
        {scorePts.map((p, i) => (
          <circle
            key={i}
            cx={p.x.toFixed(1)}
            cy={p.y.toFixed(1)}
            r="3"
            fill={resolveVar("--tc-primary", "#6BAA8A")}
            stroke="#232323"
            strokeWidth="2"
          />
        ))}
        {radarAxes.map((label, i) => {
          const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
          const pt = {
            x: cx + Math.cos(a) * (R + 15),
            y: cy + Math.sin(a) * (R + 15),
          };
          const anchor =
            Math.abs(pt.x - cx) < 5 ? "middle" : pt.x < cx ? "end" : "start";
          return (
            <text
              key={i}
              x={pt.x.toFixed(1)}
              y={(pt.y + 3).toFixed(1)}
              textAnchor={anchor}
              fontSize="7.5"
              fill="#A0A0A0"
              fontFamily="JetBrains Mono,monospace"
            >
              {label}
            </text>
          );
        })}
        {radarScores.map((s, i) => {
          const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
          const pt = {
            x: cx + Math.cos(a) * (s * R - 10),
            y: cy + Math.sin(a) * (s * R - 10),
          };
          return (
            <text
              key={i}
              x={pt.x.toFixed(1)}
              y={(pt.y + 3).toFixed(1)}
              textAnchor="middle"
              fontSize="7"
              fill="color-mix(in srgb, var(--tc-primary) 45%, transparent)"
              fontFamily="JetBrains Mono,monospace"
            >
              {Math.round(s * 100)}%
            </text>
          );
        })}
      </svg>
    );
  };

  return (
    <div
      style={{
        background: BG,
        color: WHITE,
        WebkitFontSmoothing: "antialiased",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Grid overlay */}
      <div className="fixed inset-0 grid-bg pointer-events-none z-0" />

      {/* Main layout: sidebar + content */}
      <div
        style={{
          display: "flex",
          flex: 1,
          overflow: "hidden",
          position: "relative",
          zIndex: 2,
        }}
      >
        {/* Module sidebar */}
        <aside
          className="hidden lg:flex"
          style={{
            width: 300,
            borderRight: `1px solid ${BORDER_VAR}`,
            flexDirection: "column",
            overflowY: "auto",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              padding: "20px 24px",
              borderBottom: `1px solid ${BORDER_VAR}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                fontWeight: 700,
                color: MUTED,
                letterSpacing: "0.12em",
              }}
            >
              MODULE MAP
            </span>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 12,
                color: LIME,
                fontWeight: 700,
              }}
            >
              {completedModules} / {totalModules}
            </span>
          </div>

          {modules.map((m, i) => (
            <Link
              key={m.slug}
              href={
                m.status !== "locked" ? `/themes/${themeSlug}/${m.slug}` : "#"
              }
              onMouseEnter={() => setHovM(i)}
              onMouseLeave={() => setHovM(null)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "16px 24px",
                borderBottom: `1px solid ${BORDER_VAR}`,
                cursor: m.status === "locked" ? "default" : "pointer",
                background:
                  m.status === "active"
                    ? "color-mix(in srgb, var(--tc-primary) 3%, transparent)"
                    : hovM === i && m.status !== "locked"
                      ? "rgba(255,255,255,0.02)"
                      : "transparent",
                transition: "background 0.1s",
                position: "relative",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div
                style={{
                  width: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  fontFamily: MONO,
                  fontSize: 11,
                  fontWeight: 800,
                  border: `1px solid ${m.status === "done" || m.status === "active" ? LIME : BORDER_VAR}`,
                  color:
                    m.status === "done" || m.status === "active" ? LIME : MUTED,
                }}
              >
                {m.status === "done" ? "✓" : m.status === "locked" ? "·" : ">"}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 9,
                    color:
                      m.status === "done"
                        ? "color-mix(in srgb, var(--tc-primary) 50%, transparent)"
                        : "#A0A0A0",
                    letterSpacing: "0.06em",
                    marginBottom: 3,
                  }}
                >
                  {m.number}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: m.status === "active" ? 700 : 400,
                    color: m.status === "locked" ? MUTED : WHITE,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    marginBottom: 2,
                  }}
                >
                  {m.name}
                </div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 9,
                    color: MUTED,
                    opacity: 0.6,
                  }}
                >
                  {m.formula}
                </div>
              </div>
              {m.score !== null && (
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 12,
                    fontWeight: 900,
                    color: LIME,
                    flexShrink: 0,
                  }}
                >
                  {m.score}%
                </span>
              )}
              {m.status === "active" && (
                <div
                  style={{
                    position: "absolute",
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: 2,
                    background: LIME,
                  }}
                />
              )}
            </Link>
          ))}
        </aside>

        {/* Main content */}
        <main className="grid-bg" style={{ flex: 1, overflow: "auto" }}>
          {/* Lesson header */}
          <div
            style={{
              padding: "32px 40px",
              borderBottom: `1px solid ${BORDER_VAR}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 8,
                }}
              >
                <UserAvatar url={avatarUrl} name={displayName} size={36} />
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 11,
                    color: MUTED,
                    letterSpacing: "0.08em",
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      width: 5,
                      height: 5,
                      background: LIME,
                    }}
                  />
                  Good to see you, {displayName}
                </div>
              </div>
              {currentModule ? (
                <>
                  <h1
                    style={{
                      fontSize: 24,
                      fontWeight: 900,
                      letterSpacing: "-0.03em",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    Module {currentModule.number} — {currentModule.name}
                  </h1>
                  <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>
                    Lesson {currentModule.lessonNumber} of{" "}
                    {currentModule.totalLessons} · ~
                    {currentModule.estimatedMinutes} min · {currentModule.topic}
                  </p>
                </>
              ) : modules.every((m) => m.status === "done") ? (
                <>
                  <h1
                    style={{
                      fontSize: 24,
                      fontWeight: 900,
                      letterSpacing: "-0.03em",
                      textTransform: "uppercase",
                      marginBottom: 6,
                      color: LIME,
                    }}
                  >
                    Mission Complete
                  </h1>
                  <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>
                    All {modules.length} modules finished. View your capstone.
                  </p>
                </>
              ) : (
                <>
                  <h1
                    style={{
                      fontSize: 24,
                      fontWeight: 900,
                      letterSpacing: "-0.03em",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    {themeName}
                  </h1>
                  <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>
                    Start your learning journey
                  </p>
                </>
              )}
            </div>
            {resumeUrl ? (
              <Link
                href={resumeUrl}
                onMouseEnter={() => setHovBtn("resume")}
                onMouseLeave={() => setHovBtn(null)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 28px",
                  background: hovBtn === "resume" ? "transparent" : LIME,
                  color: hovBtn === "resume" ? LIME : BG,
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  flexShrink: 0,
                  border: `2px solid ${LIME}`,
                  boxShadow:
                    hovBtn === "resume"
                      ? `5px 5px 0 color-mix(in srgb, var(--tc-primary) 30%, transparent)`
                      : `3px 3px 0 color-mix(in srgb, var(--tc-primary) 20%, transparent)`,
                  transform:
                    hovBtn === "resume" ? "translate(-2px,-2px)" : "none",
                  transition: "all 0.12s ease",
                  textDecoration: "none",
                }}
              >
                {"Resume Lesson →"}
              </Link>
            ) : (
              <Link
                href={
                  modules.every((m) => m.status === "done")
                    ? `/themes/${themeSlug}/capstone`
                    : `/themes/${themeSlug}`
                }
                onMouseEnter={() => setHovBtn("resume")}
                onMouseLeave={() => setHovBtn(null)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 28px",
                  background: hovBtn === "resume" ? "transparent" : LIME,
                  color: hovBtn === "resume" ? LIME : BG,
                  fontSize: 14,
                  fontWeight: 900,
                  cursor: "pointer",
                  fontFamily: "inherit",
                  textTransform: "uppercase",
                  letterSpacing: "0.03em",
                  flexShrink: 0,
                  border: `2px solid ${LIME}`,
                  boxShadow:
                    hovBtn === "resume"
                      ? `5px 5px 0 color-mix(in srgb, var(--tc-primary) 30%, transparent)`
                      : `3px 3px 0 color-mix(in srgb, var(--tc-primary) 20%, transparent)`,
                  transform:
                    hovBtn === "resume" ? "translate(-2px,-2px)" : "none",
                  transition: "all 0.12s ease",
                  textDecoration: "none",
                }}
              >
                {modules.every((m) => m.status === "done")
                  ? "View Capstone →"
                  : "Start Learning →"}
              </Link>
            )}
          </div>

          {/* Stats strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              borderBottom: `1px solid ${BORDER_VAR}`,
            }}
          >
            {[
              {
                label: "Theme progress",
                val: `${Math.round(ring)}%`,
                sub: `${themePoints.current} / ${themePoints.total} pts`,
                accent: true,
              },
              {
                label: "Current streak",
                val: `${currentStreak} day${currentStreak !== 1 ? "s" : ""}`,
                sub:
                  bestStreak > 0 ? `Best: ${bestStreak} days` : "Start today",
              },
              {
                label: "Average score",
                val: averageScore.toFixed(1),
                sub: "out of 100",
              },
            ].map((s, i) => (
              <div
                key={s.label}
                style={{
                  padding: "36px 40px",
                  borderRight: i < 2 ? `1px solid ${BORDER_VAR}` : "none",
                  background: s.accent
                    ? "color-mix(in srgb, var(--tc-primary) 2.5%, transparent)"
                    : "transparent",
                }}
              >
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    color: s.accent ? LIME : MUTED,
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    marginBottom: 12,
                    textTransform: "uppercase",
                  }}
                >
                  {s.label}
                </div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 40,
                    fontWeight: 900,
                    color: s.accent ? LIME : WHITE,
                    lineHeight: 1,
                    marginBottom: 8,
                  }}
                >
                  {s.val}
                </div>
                <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
                  {s.sub}
                </div>
              </div>
            ))}
          </div>

          {/* Loss curve */}
          <div style={{ borderBottom: `1px solid ${BORDER_VAR}` }}>
            <div
              style={{
                padding: "20px 40px",
                borderBottom: `1px solid ${BORDER_VAR}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  fontWeight: 700,
                  color: MUTED,
                  letterSpacing: "0.12em",
                }}
              >
                TRAINING LOSS CURVE
              </span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
                {"// re-render cost ↔ model loss"}
              </span>
            </div>
            <canvas
              ref={lossCanvasRef}
              role="img"
              aria-label="Training loss curve visualization showing model training and validation loss decreasing over epochs"
              style={{ width: "100%", height: 220, display: "block" }}
            />
          </div>

          {/* Radar + Heatmap */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              borderBottom: `1px solid ${BORDER_VAR}`,
            }}
          >
            {/* Radar */}
            <div style={{ borderRight: `1px solid ${BORDER_VAR}` }}>
              <div
                style={{
                  padding: "20px 40px",
                  borderBottom: `1px solid ${BORDER_VAR}`,
                }}
              >
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    fontWeight: 700,
                    color: MUTED,
                    letterSpacing: "0.12em",
                  }}
                >
                  SKILL RADAR
                </span>
              </div>
              <div
                style={{
                  padding: "24px 40px",
                  height: 260,
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {radarSVG()}
              </div>
            </div>

            {/* Heatmap */}
            <div>
              <div
                style={{
                  padding: "20px 40px",
                  borderBottom: `1px solid ${BORDER_VAR}`,
                }}
              >
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    fontWeight: 700,
                    color: MUTED,
                    letterSpacing: "0.12em",
                  }}
                >
                  ACTIVITY · 30 DAYS
                </span>
              </div>
              <div style={{ padding: "32px 40px" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(10, 1fr)",
                    gap: 6,
                    marginBottom: 16,
                  }}
                >
                  {activityDays.map((v, i) => (
                    <div
                      key={i}
                      style={{
                        aspectRatio: "1",
                        background:
                          v === 0
                            ? CARD
                            : `color-mix(in srgb, var(--tc-primary) ${[18, 38, 62, 90][v - 1]}%, transparent)`,
                        border: `1px solid ${BORDER_VAR}`,
                        animation: heatVis
                          ? `hpop .2s ${i * 0.01}s ease both`
                          : "none",
                        opacity: heatVis ? 1 : 0,
                      }}
                    />
                  ))}
                </div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 9,
                    color: MUTED,
                    display: "flex",
                    gap: 6,
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  Less
                  {[0.18, 0.38, 0.62, 0.9].map((o, i) => (
                    <div
                      key={i}
                      style={{
                        width: 10,
                        height: 10,
                        background: `color-mix(in srgb, var(--tc-primary) ${Math.round(o * 100)}%, transparent)`,
                        border: `1px solid ${BORDER_VAR}`,
                      }}
                    />
                  ))}
                  More
                </div>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 12,
                    color: MUTED,
                    lineHeight: 2.0,
                  }}
                >
                  <div>
                    <span style={{ color: LIME }}>{"→ "}</span>
                    {currentStreak}-day streak active
                  </div>
                  <div>
                    <span style={{ color: MUTED }}>{"→ "}</span>
                    {activityDays.filter((d) => d > 0).length} of{" "}
                    {activityDays.length} days studied
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Skill Genome */}
          <SkillGenome data={genomeData} />

          {/* Recent activity */}
          {recentActivity.length > 0 && (
            <div>
              <div
                style={{
                  padding: "20px 40px",
                  borderBottom: `1px solid ${BORDER_VAR}`,
                }}
              >
                <span
                  style={{
                    fontFamily: MONO,
                    fontSize: 10,
                    fontWeight: 700,
                    color: MUTED,
                    letterSpacing: "0.12em",
                  }}
                >
                  RECENT ACTIVITY
                </span>
              </div>
              {recentActivity.map((a, i) => (
                <div
                  key={i}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "130px 1fr 80px",
                    borderBottom: `1px solid ${BORDER_VAR}`,
                    padding: "18px 40px",
                    gap: 24,
                    alignItems: "center",
                  }}
                >
                  <div style={{ fontFamily: MONO, fontSize: 11, color: MUTED }}>
                    {a.time}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 12,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: MONO,
                        fontSize: 10,
                        color: LIME,
                        flexShrink: 0,
                      }}
                    >
                      {a.event}
                    </span>
                    <span style={{ fontSize: 13, color: WHITE }}>
                      {a.detail}
                    </span>
                  </div>
                  {a.score !== null ? (
                    <div
                      style={{
                        fontFamily: MONO,
                        fontSize: 13,
                        color: LIME,
                        fontWeight: 900,
                        textAlign: "right",
                      }}
                    >
                      {a.score}%
                    </div>
                  ) : (
                    <div />
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
