import { ArtPlate } from "@tensorcraft/ui/art-plate";
import { MissionIcon } from "./mission-icon";
import styles from "./dashboard-view.module.css";

export function ExpeditionHeader({
  title,
  worldName,
  description,
  plateSrc,
  completedLessons,
  totalLessons,
}: {
  title: string;
  worldName: string;
  description: string;
  plateSrc?: string;
  completedLessons?: number;
  totalLessons?: number;
}) {
  const showCompletion = completedLessons != null && totalLessons != null;
  const fraction =
    showCompletion && totalLessons > 0
      ? Math.min(1, Math.max(0, completedLessons / totalLessons))
      : 0;
  return (
    <header className={styles.expeditionHeader}>
      <div className={styles.expeditionCopy}>
        <p className={styles.kicker}>{worldName} · Expedition log</p>
        <h1>{title}</h1>
        <p className={styles.secondary}>{description}</p>
      </div>
      {showCompletion && (
        <div className={styles.voyageRing}>
          <svg viewBox="0 0 120 120" aria-hidden="true">
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke="var(--tc-border)"
              strokeWidth="2"
            />
            <circle
              cx="60"
              cy="60"
              r="48"
              fill="none"
              stroke="var(--tc-primary)"
              strokeWidth="4"
              pathLength="100"
              strokeDasharray={`${fraction * 100} 100`}
              transform="rotate(-90 60 60)"
            />
          </svg>
          <div>
            <strong>{completedLessons}</strong>
            <span>of {totalLessons} lessons</span>
          </div>
        </div>
      )}
      <div className={styles.expeditionArt}>
        {plateSrc ? (
          <ArtPlate src={plateSrc} bleed />
        ) : (
          <MissionIcon name="signal" />
        )}
      </div>
    </header>
  );
}
