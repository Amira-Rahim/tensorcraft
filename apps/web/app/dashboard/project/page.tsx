import type { Metadata } from "next";
import Link from "next/link";
import { SystemEvidence } from "@/app/components/system-evidence";
import { loadDashboardData } from "../_lib/load-dashboard";
import styles from "../dashboard-view.module.css";
export const metadata: Metadata = {
  title: "Project | Tensorcraft",
  robots: { index: false, follow: false },
};
export default async function ProjectPage() {
  const { userId, stages, evidenceUnavailable, entitled } =
    await loadDashboardData("project");
  return (
    <main className={styles.main}>
      <Link className={styles.textLink} href="/dashboard">
        ← Back to learning
      </Link>
      <h1>Your project</h1>
      <p className={styles.secondary}>
        Follow the practice and checkpoints behind your DEEP SCAN system.
      </p>
      <SystemEvidence
        userId={userId}
        stages={stages}
        unavailable={evidenceUnavailable}
        entitled={entitled}
      />
    </main>
  );
}
