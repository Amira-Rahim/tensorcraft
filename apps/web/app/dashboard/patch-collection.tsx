import { ModulePatch } from "@tensorcraft/ui/module-patch";
import type { DashboardModule } from "./dashboard-view";
import styles from "./dashboard-view.module.css";
export function PatchCollection({ modules }: { modules: DashboardModule[] }) {
  const earned = modules.filter((m) => m.status === "done" && m.patchSrc);
  if (!earned.length) return null;
  return (
    <section
      className="mb-8"
      data-testid="patch-collection"
      aria-labelledby="patches-heading"
    >
      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 id="patches-heading" className="font-medium">
          Mission patches
        </h3>
        <p
          className="text-sm text-text-muted"
          data-testid="patch-collection-count"
        >
          {earned.length} of {modules.length} earned
        </p>
      </div>
      <ul className={styles.patchGallery}>
        {earned.map((m) => (
          <li key={m.slug}>
            <ModulePatch src={m.patchSrc!} size={96} />
            <span className={styles.kicker}>
              Sector {m.number.replace(/^M/, "")} · Earned
            </span>
            <span className="text-sm">{m.name}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
