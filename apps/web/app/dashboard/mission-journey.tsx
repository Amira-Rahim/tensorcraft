"use client";

import { useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArtPlate } from "@tensorcraft/ui/art-plate";
import { ModulePatch } from "@tensorcraft/ui/module-patch";
import type { DashboardModule } from "./dashboard-view";
import { moduleDestination } from "./mission-destination";
import { MissionIcon, type MissionIconName } from "./mission-icon";
import styles from "./dashboard-view.module.css";

const DESKTOP = [
  [70, 120],
  [210, 65],
  [350, 125],
  [490, 65],
  [630, 130],
  [770, 65],
  [920, 140],
  [840, 290],
  [650, 270],
  [450, 290],
  [240, 265],
];
const MOBILE = [
  [60, 65],
  [200, 125],
  [340, 65],
  [340, 245],
  [200, 305],
  [60, 245],
  [60, 425],
  [200, 480],
  [340, 425],
  [290, 630],
  [110, 630],
];
const ICONS: MissionIconName[] = [
  "data",
  "model",
  "evaluation",
  "runtime",
  "signal",
  "review",
  "evaluation",
  "evaluation",
  "model",
  "runtime",
  "operations",
];

function sectorStatus(module: DashboardModule) {
  if (module.status === "done") return "Completed";
  if (module.lockReason === "access") return "Paid access required";
  if (module.lockReason === "prerequisite")
    return `Complete ${module.prerequisiteName ?? "the previous module"} first`;
  return module.status === "available" ? "Available" : "Current module";
}

function Chart({
  points,
  width,
  height,
  modules,
  className,
}: {
  points: number[][];
  width: number;
  height: number;
  modules: DashboardModule[];
  className: string;
}) {
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      {Array.from({ length: 85 }, (_, i) => (
        <circle
          key={i}
          cx={(i * 137 + 23) % width}
          cy={(i * 79 + 11) % height}
          r={i % 5 === 0 ? 1.5 : 0.65}
          fill="currentColor"
          opacity={i % 3 === 0 ? 0.45 : 0.18}
        />
      ))}
      <ellipse
        cx={width / 2}
        cy={height / 2}
        rx={width * 0.43}
        ry={height * 0.35}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.12"
      />
      <ellipse
        cx={width / 2}
        cy={height / 2}
        rx={width * 0.29}
        ry={height * 0.25}
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.08"
      />
      {points.slice(0, Math.max(0, modules.length - 1)).map(([x, y], i) => {
        const [nx, ny] = points[i + 1];
        return (
          <path
            key={i}
            d={`M ${x} ${y} C ${(x + nx) / 2} ${y}, ${(x + nx) / 2} ${ny}, ${nx} ${ny}`}
            fill="none"
            stroke={
              modules[i]?.status === "done"
                ? "var(--tc-primary)"
                : "currentColor"
            }
            opacity={modules[i]?.status === "done" ? 0.85 : 0.3}
            strokeWidth="1.5"
            strokeDasharray={modules[i]?.status === "done" ? undefined : "4 6"}
          />
        );
      })}
    </svg>
  );
}

export function MissionJourney({
  modules,
  worldSlug,
}: {
  modules: DashboardModule[];
  worldSlug: string;
}) {
  const initial =
    modules.find((m) => m.status === "active" || m.lockReason === "access") ??
    modules.find((m) => m.status !== "done") ??
    modules.at(-1);
  const [selectedSlug, setSelectedSlug] = useState(initial?.slug);
  const [showBrief, setShowBrief] = useState(false);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const selected = modules.find((m) => m.slug === selectedSlug) ?? initial;
  function closeBrief() {
    setShowBrief(false);
    if (selected) buttons.current.get(selected.slug)?.focus();
  }
  if (!selected) return null;
  return (
    <div className={`${styles.journey} tc-on-art`}>
      <div className={styles.starMap}>
        <div className={styles.chartLegend}>
          <span className={styles.sceneLight} />
          Archimedes · Voyage chart<span>Select a sector</span>
        </div>
        <Chart
          points={DESKTOP}
          width={1000}
          height={380}
          modules={modules}
          className={styles.desktopChart}
        />
        <Chart
          points={MOBILE}
          width={400}
          height={740}
          modules={modules}
          className={styles.mobileChart}
        />
        <ol className={styles.sectorTrack} aria-label="Sector journey">
          {modules.map((module, i) => {
            const open = showBrief && module.slug === selectedSlug;
            const [x, y] = DESKTOP[i % DESKTOP.length];
            const [mx, my] = MOBILE[i % MOBILE.length];
            return (
              <li
                key={module.slug}
                style={
                  {
                    "--sector-x": `${x / 10}%`,
                    "--sector-y": `${y / 3.8}%`,
                    "--mobile-x": `${mx / 4}%`,
                    "--mobile-y": `${my / 7.4}%`,
                  } as CSSProperties
                }
              >
                <button
                  ref={(element) => {
                    if (element) buttons.current.set(module.slug, element);
                    else buttons.current.delete(module.slug);
                  }}
                  type="button"
                  className={styles.sectorButton}
                  data-state={module.status}
                  aria-expanded={open}
                  aria-controls={open ? "sector-briefing" : undefined}
                  aria-label={`${module.number}: ${module.name}. ${sectorStatus(module)}`}
                  onClick={() => {
                    setSelectedSlug(module.slug);
                    setShowBrief(!open);
                  }}
                >
                  <span className={styles.sectorNode}>
                    {module.status === "done" && module.patchSrc ? (
                      <ModulePatch
                        src={module.patchSrc}
                        size={64}
                        fallback={<MissionIcon name="check" />}
                      />
                    ) : module.sceneSrc ? (
                      <ArtPlate
                        src={`/_next/image?url=${encodeURIComponent(module.sceneSrc)}&w=128&q=75`}
                        loading="eager"
                        bleed
                        fallback={
                          <MissionIcon name={ICONS[i % ICONS.length]} />
                        }
                      />
                    ) : (
                      <MissionIcon name={ICONS[i % ICONS.length]} />
                    )}
                    {module.status === "locked" && (
                      <span className={styles.sectorLock}>
                        <MissionIcon name="lock" />
                      </span>
                    )}
                    {module.status === "active" && (
                      <span className={styles.shipBeacon} aria-hidden="true">
                        ◆
                      </span>
                    )}
                  </span>
                  <span className={styles.sectorLabel}>
                    {module.status === "active"
                      ? "You are here"
                      : `Sector ${module.number.replace(/^M/, "")}`}
                  </span>
                  <span className={styles.sectorTitle}>
                    {module.chapterTitle ?? module.name}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
      {showBrief && (
        <section
          id="sector-briefing"
          className={styles.sectorBrief}
          aria-labelledby="sector-title"
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closeBrief();
            }
          }}
        >
          <button
            className={styles.closeBrief}
            type="button"
            aria-label="Close sector briefing"
            onClick={closeBrief}
          >
            ×
          </button>
          {selected.sceneSrc && (
            <div className={styles.sectorArt}>
              <ArtPlate src={selected.sceneSrc} bleed />
            </div>
          )}
          <div className={styles.briefCopy}>
            <div aria-live="polite">
              <p className={styles.kicker}>
                Sector {selected.number.replace(/^M/, "")} ·{" "}
                {sectorStatus(selected)}
              </p>
              <h3 id="sector-title">
                {selected.chapterTitle ?? selected.name}
              </h3>
              <p className={styles.secondary}>
                {selected.chapterTitle ? selected.name : null}
              </p>
            </div>
            {selected.story && (
              <details className={styles.storyDetails}>
                <summary>Story briefing</summary>
                <p className={styles.secondary}>{selected.story}</p>
              </details>
            )}
            <Link
              className={styles.textLink}
              href={moduleDestination(selected, worldSlug)}
            >
              {selected.lockReason === "access"
                ? "Get sector access →"
                : selected.lockReason === "prerequisite"
                  ? "View prerequisite →"
                  : "Explore this sector →"}
            </Link>
          </div>
          {selected.totalLessons != null && (
            <div className={styles.missionCheckpoints}>
              <p className={styles.secondary}>
                {selected.completedLessons ?? 0} of {selected.totalLessons}{" "}
                lessons completed
              </p>
              <div
                className={styles.checkpoints}
                aria-label="Sector lesson completion"
              >
                {Array.from({ length: selected.totalLessons }, (_, i) => {
                  const complete =
                    selected.missions?.[i]?.completed ??
                    i < (selected.completedLessons ?? 0);
                  const title =
                    selected.missions?.[i]?.title ?? `Lesson ${i + 1}`;
                  return (
                    <span
                      key={i}
                      className={styles.checkpoint}
                      data-completed={complete}
                      title={`${title}: ${complete ? "completed" : "not completed"}`}
                      aria-label={`${title}: ${complete ? "completed" : "not completed"}`}
                      role="img"
                    >
                      {complete ? <MissionIcon name="check" /> : i + 1}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
