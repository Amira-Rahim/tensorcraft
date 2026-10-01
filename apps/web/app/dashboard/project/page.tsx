import type { Metadata } from "next";
import Link from "next/link";
import { SystemEvidence } from "@/app/components/system-evidence";
import { loadDashboardData } from "../_lib/load-dashboard";
import styles from "../dashboard-view.module.css";
import { ExpeditionHeader } from "../expedition-header";
import { ProjectPipeline } from "./project-pipeline";
import { heroPlateSrc } from "@/lib/location-art";
export const metadata: Metadata = {
  title: "Project | Tensorcraft",
  robots: { index: false, follow: false },
};
export default async function ProjectPage() {
  const { userId, stages, evidenceUnavailable, entitled, dashboard } =
    await loadDashboardData("project");
  return (
    <main className={styles.main}>
      <Link className={styles.textLink} href="/dashboard">
        ← Back to learning
      </Link>
      <ExpeditionHeader
        title="Building DEEP SCAN"
        worldName={dashboard.worldName}
        description="Build the Archimedes’ signal classifier. Follow the practice and checkpoints behind each part of the system."
        plateSrc={heroPlateSrc(dashboard.worldSlug)}
      />
      {!evidenceUnavailable && <ProjectPipeline stages={stages} />}
      <SystemEvidence
        userId={userId}
        stages={stages}
        unavailable={evidenceUnavailable}
        entitled={entitled}
      />
    </main>
  );
}
