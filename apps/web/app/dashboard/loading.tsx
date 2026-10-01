import styles from "./dashboard-view.module.css";

export default function DashboardLoading() {
  return (
    <main
      aria-label="Loading dashboard"
      aria-busy="true"
      className={`${styles.main} motion-safe:animate-pulse`}
    >
      <div aria-hidden="true">
        <div className="h-10 w-56 bg-surface-overlay mb-6" />
        <div className={styles.continue}>
          <div className={styles.missionCopy}>
            <div className="h-4 w-36 bg-surface-overlay mb-6" />
            <div className="h-16 w-full bg-surface-overlay mb-6" />
            <div className="h-12 w-full bg-surface-overlay mb-6" />
            <div className="h-11 w-44 bg-surface-overlay" />
          </div>
          <div className={`${styles.missionScene} bg-surface-overlay`} />
        </div>
        <div className="py-8">
          <div className="h-6 w-48 bg-surface-overlay mb-5" />
          <div className="h-1 w-full bg-surface-overlay mb-6" />
          <div className="flex justify-around gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="size-10 sm:size-14 rounded-full bg-surface-overlay"
              />
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
