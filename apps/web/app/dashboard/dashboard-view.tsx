"use client";

import { useState, useEffect, type ReactNode } from "react";
import Link from "next/link";
import { SkillGenome } from "./skill-genome";
import { BridgeCollection } from "./bridge-collection";
import { PatchCollection } from "./patch-collection";
import { LossCurve, type WeeklyHints } from "@tensorcraft/ui/visualizations";
import { ArtPlate } from "@tensorcraft/ui/art-plate";
import { ModulePatch } from "@tensorcraft/ui/module-patch";
import { UserAvatar } from "@/app/components/user-avatar";
import { worlds } from "@tensorcraft/worlds";

/* ── Design tokens (use CSS vars from world system) ── */
const LIME = "var(--tc-primary)";
const BG = "var(--tc-bg)";
const PANEL = "var(--tc-surface)";
const CARD = "var(--tc-surface-overlay)";
const WHITE = "var(--tc-text)";
const MUTED = "var(--tc-muted)";
const BORDER_VAR = "var(--tc-border)";
const ON_PRIMARY = "var(--tc-on-primary)";
const MONO = "var(--font-mono), 'JetBrains Mono', monospace";

/* ── Types ── */
export interface DashboardModule {
  number: string;
  name: string;
  status: "done" | "active" | "locked";
  score: number | null;
  formula: string;
  slug: string;
  /** Mission-patch emblem, earned on completion (lib/patch-art.ts).
   *  Rendered only when status is "done"; the status box is the fallback. */
  patchSrc?: string;
}

export interface DashboardBridge {
  jsTitle: string;
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
  worldName: string;
  worldSlug: string;
  modules: DashboardModule[];
  currentModule: {
    number: number;
    name: string;
    lessonNumber: number;
    totalLessons: number;
    estimatedMinutes: number;
    topic: string;
  } | null;
  worldProgressPercent: number;
  worldPoints: { current: number; total: number };
  currentStreak: number;
  bestStreak: number;
  averageScore: number;
  bridges: DashboardBridge[];
  activityDays: number[];
  recentActivity: ActivityRecord[];
  resumeUrl: string | null;
  /** Override for the resume CTA text; "Unlock Module N →" when the next
   *  lesson sits behind the paywall (2026-07-14 UX audit: the button said
   *  "Resume Lesson" and redirected to pricing mid-click). */
  resumeLabel?: string;
  totalModules: number;
  completedModules: number;
  genomeData: Array<{
    skill_axis: string;
    proficiency: number;
    velocity: number;
  }>;
  lossCurveData: { weekly: WeeklyHints[] };
  worldCards?: ReactNode;
  /**
   * True when at least one streak's last_activity_date == today - 1 AND the
   * user has not yet completed a lesson today. Renders a gentle nudge toast.
   */
  streakAtRisk?: boolean;
  /**
   * Location plate for the module sidebar's station feed panel
   * (lib/location-art.ts `surfacePlateSrc(world, "dashboard")`). Absent for
   * worlds without art; the sidebar then renders exactly as before.
   */
  plateSrc?: string;
}

export function DashboardView(props: DashboardProps) {
  const {
    displayName,
    avatarUrl,
    worldName,
    worldSlug,
    modules,
    currentModule,
    worldProgressPercent,
    worldPoints,
    currentStreak,
    bestStreak,
    averageScore,
    bridges,
    activityDays,
    recentActivity,
    resumeUrl,
    resumeLabel,
    totalModules,
    completedModules,
    genomeData,
    lossCurveData,
    worldCards,
    streakAtRisk = false,
    plateSrc,
  } = props;

  // Resolve the world's lesson word (re-audit N2/F-C): "Mission" is Deep
  // Orbit's; other worlds say Protocol/Procedure/etc. Falls back to "Mission".
  const lessonTerm = worlds[worldSlug]?.terminology.lesson ?? "Mission";

  const [heatVis, setHeatVis] = useState(false);
  const [hovM, setHovM] = useState<number | null>(null);
  const [hovBtn, setHovBtn] = useState<string | null>(null);
  const [ring, setRing] = useState(0);

  useEffect(() => {
    let f = 0;
    const ri = setInterval(() => {
      f++;
      setRing(Math.min(f * 1.6, worldProgressPercent));
      if (f > Math.ceil(worldProgressPercent / 1.6)) clearInterval(ri);
    }, 32);
    setTimeout(() => setHeatVis(true), 400);
    return () => clearInterval(ri);
  }, [worldProgressPercent]);

  return (
    <div
      style={{
        background: BG,
        color: WHITE,
        WebkitFontSmoothing: "antialiased",
        // iOS Safari URL-bar resize stays stable with 100svh.
        minHeight: "100svh",
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
          {/* Station feed: the monitoring alcove the dashboard is named
              for, framed as a ship monitor above the module map. Decorative;
              ArtPlate renders nothing if the asset is missing. */}
          {plateSrc && (
            <div
              aria-hidden="true"
              style={{
                padding: 16,
                borderBottom: `1px solid ${BORDER_VAR}`,
              }}
            >
              <ArtPlate src={plateSrc} />
            </div>
          )}
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
                m.status !== "locked" ? `/worlds/${worldSlug}/${m.slug}` : "#"
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
                      ? "var(--tc-primary-muted)"
                      : "transparent",
                transition: "background 0.1s",
                position: "relative",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              {(() => {
                const statusBox = (
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
                        m.status === "done" || m.status === "active"
                          ? LIME
                          : MUTED,
                    }}
                  >
                    {m.status === "done"
                      ? "✓"
                      : m.status === "locked"
                        ? "·"
                        : ">"}
                  </div>
                );
                // Patches are earned: only a done module trades its ✓ box
                // for the emblem, and the box returns if the art fails.
                return m.status === "done" && m.patchSrc ? (
                  <ModulePatch
                    src={m.patchSrc}
                    size={28}
                    fallback={statusBox}
                  />
                ) : (
                  statusBox
                );
              })()}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: MONO,
                    fontSize: 9,
                    color:
                      m.status === "done"
                        ? "color-mix(in srgb, var(--tc-primary) 50%, transparent)"
                        : "var(--tc-muted)",
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
              {/* No left accent bar here: banned repo-wide (owner
                  directive 2026-08-16). The active state already reads
                  through the background wash above, the bold title, and
                  the lime status box. */}
            </Link>
          ))}
        </aside>

        {/* Main content */}
        <main className="grid-bg" style={{ flex: 1, overflow: "auto" }}>
          {streakAtRisk && (
            <div
              data-testid="streak-at-risk-toast"
              style={{
                padding: "12px 40px",
                background:
                  "color-mix(in srgb, var(--tc-streak) 8%, transparent)",
                borderBottom: `1px solid ${BORDER_VAR}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
                fontFamily: MONO,
                fontSize: 12,
              }}
            >
              <span style={{ color: WHITE }}>
                <strong style={{ color: "var(--tc-streak)", fontWeight: 700 }}>
                  Streak at risk.
                </strong>{" "}
                Yesterday you stayed active. Show up today to keep the count.
              </span>
              {resumeUrl && (
                <Link
                  href={resumeUrl}
                  style={{
                    color: "var(--tc-streak)",
                    textTransform: "uppercase",
                    letterSpacing: "0.12em",
                    fontSize: 10,
                    textDecoration: "none",
                  }}
                >
                  Resume now →
                </Link>
              )}
            </div>
          )}
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
                    {/* Middot, not a colon: module titles carry their
                        own colon, and the prefix colon stacked two. */}
                    Module {currentModule.number} · {currentModule.name}
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
                    {lessonTerm} Complete
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
                    {worldName}
                  </h1>
                  <p style={{ fontFamily: MONO, fontSize: 12, color: MUTED }}>
                    {completedModules > 0
                      ? "Pick up where you left off"
                      : "Start learning"}
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
                  color: hovBtn === "resume" ? LIME : ON_PRIMARY,
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
                {resumeLabel ?? "Resume Lesson →"}
              </Link>
            ) : (
              <Link
                href={
                  modules.every((m) => m.status === "done")
                    ? `/worlds/${worldSlug}/capstone`
                    : `/worlds/${worldSlug}`
                }
                onMouseEnter={() => setHovBtn("resume")}
                onMouseLeave={() => setHovBtn(null)}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "14px 28px",
                  background: hovBtn === "resume" ? "transparent" : LIME,
                  color: hovBtn === "resume" ? LIME : ON_PRIMARY,
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
                label: "World progress",
                val: `${Math.round(ring)}%`,
                sub: `${worldPoints.current} / ${worldPoints.total} pts`,
                accent: true,
              },
              {
                label: "Current streak",
                val: `${currentStreak} day${currentStreak !== 1 ? "s" : ""}`,
                sub:
                  bestStreak > 0 ? `Best: ${bestStreak} days` : "Start today",
                onFire: currentStreak >= 7,
              },
              {
                label: "Average score",
                val: averageScore.toFixed(1),
                sub: "out of 100",
              },
            ].map((s, i) => (
              <div
                key={s.label}
                data-on-fire={s.onFire ? "true" : undefined}
                style={{
                  padding: "36px 40px",
                  borderRight: i < 2 ? `1px solid ${BORDER_VAR}` : "none",
                  background: s.onFire
                    ? "color-mix(in srgb, var(--tc-streak) 8%, transparent)"
                    : s.accent
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

          {/* Heatmap */}
          <div style={{ borderBottom: `1px solid ${BORDER_VAR}` }}>
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
                  // Fixed cells: `1fr` scaled with the viewport, so on a
                  // wide monitor the heatmap became three rows of giant
                  // squares (owner report, 2026-08-16).
                  gridTemplateColumns: "repeat(10, 18px)",
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

          {/* The three collection panels share the main column's 40px
              gutter; they previously sat flush against the sidebar edge,
              alone among the dashboard's panels. */}
          <div style={{ padding: "0 40px" }}>
            {/* Skill Genome */}
            <SkillGenome data={genomeData} />

            {/* Bridge collectibles.
                The data for this was being fetched (page.tsx: getLessonsWithBridges
                + a `collected` flag per lesson), threaded through as a prop, and
                dropped on the floor: the component existed, the pipeline existed,
                and nothing rendered it. Meanwhile prd.md, marketing-plan.md, and
                dev-plan.md all describe dashboard bridge collectibles as the
                shipped replacement for the removed /bridges route. Wired up
                2026-07-15 so the docs are true. */}
            <BridgeCollection bridges={bridges} />

            {/* Mission patches, the same collection framing one panel down.
                Renders nothing for worlds without patch art. */}
            <PatchCollection modules={modules} />
          </div>

          {/* Learning trend, rolling 7-day avg hints per exercise */}
          <section
            aria-labelledby="loss-curve-heading"
            style={{ borderBottom: `1px solid ${BORDER_VAR}` }}
          >
            <div
              style={{
                padding: "20px 40px",
                borderBottom: `1px solid ${BORDER_VAR}`,
              }}
            >
              <h2
                id="loss-curve-heading"
                style={{
                  fontFamily: MONO,
                  fontSize: 10,
                  fontWeight: 700,
                  color: MUTED,
                  letterSpacing: "0.12em",
                  margin: 0,
                  textTransform: "uppercase",
                }}
              >
                LEARNING TREND
              </h2>
            </div>
            <div style={{ padding: "24px 40px" }}>
              <LossCurve weekly={lossCurveData.weekly} />
            </div>
          </section>

          {/* World catalog, owned vs locked */}
          {worldCards}

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
