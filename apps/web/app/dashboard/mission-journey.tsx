"use client";

import { useState } from "react";
import Link from "next/link";
import { ModulePatch } from "@tensorcraft/ui/module-patch";
import type { DashboardModule } from "./dashboard-view";
import { moduleDestination } from "./mission-destination";
import { MissionIcon } from "./mission-icon";
import styles from "./dashboard-view.module.css";

function sectorStatus(module: DashboardModule) {
  if (module.status === "done") return "Completed";
  if (module.lockReason === "access") return "Paid access required";
  if (module.lockReason === "prerequisite")
    return `Complete ${module.prerequisiteName ?? "the previous module"} first`;
  return module.status === "available" ? "Available" : "Current module";
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
  const selected = modules.find((m) => m.slug === selectedSlug) ?? initial;
  if (!selected) return null;
  return (
    <div className={styles.journey}>
      <ol className={styles.sectorTrack} aria-label="Sector journey">
        {modules.map((module) => {
          const selected = module.slug === selectedSlug;
          const done = module.status === "done";
          return (
            <li key={module.slug}>
              <button
                type="button"
                className={styles.sectorButton}
                data-state={module.status}
                aria-pressed={selected}
                aria-label={`${module.number}: ${module.name}. ${sectorStatus(module)}`}
                onClick={() => setSelectedSlug(module.slug)}
              >
                <span className={styles.sectorNode}>
                  {done && module.patchSrc ? (
                    <ModulePatch
                      src={module.patchSrc}
                      size={56}
                      fallback={<MissionIcon name="check" />}
                    />
                  ) : done ? (
                    <MissionIcon name="check" />
                  ) : (
                    <span>{module.number.replace(/^M/, "")}</span>
                  )}
                  {module.status === "locked" && (
                    <span className={styles.sectorLock}>
                      <MissionIcon name="lock" />
                    </span>
                  )}
                </span>
                <span className={styles.sectorLabel}>
                  Sector {module.number.replace(/^M/, "")}
                  {module.status === "active" && (
                    <span className={styles.youAreHere}>You are here</span>
                  )}
                </span>
                <span className={styles.sectorTitle}>{module.name}</span>
              </button>
            </li>
          );
        })}
      </ol>
      <div className={styles.sectorBrief} aria-live="polite" aria-atomic="true">
        <div>
          <p className={styles.kicker}>
            Sector {selected.number.replace(/^M/, "")} ·{" "}
            {sectorStatus(selected)}
          </p>
          <h3>{selected.name}</h3>
          {selected.story && (
            <p className={styles.secondary}>{selected.story}</p>
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
            <span className={styles.secondary}>
              {selected.status === "done"
                ? "Sector complete"
                : "Your next mission patch"}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
