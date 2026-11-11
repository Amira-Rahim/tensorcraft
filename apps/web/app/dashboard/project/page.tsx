import type { Metadata } from "next";
import { getExercise } from "@tensorcraft/content";
import { learningEvidenceVersion } from "@/lib/learning-evidence-types";
import { LearningEvidenceProject } from "@/app/components/learning-evidence-project";
import Link from "next/link";
import { loadDashboardData } from "../_lib/load-dashboard";
import styles from "../dashboard-view.module.css";
import { ExpeditionHeader } from "../expedition-header";
import { ProjectPipeline } from "./project-pipeline";
import { heroPlateSrc } from "@/lib/location-art";
export const metadata: Metadata = {
  title: "Project | Tensorcraft",
};
export default async function ProjectPage() {
  const { userId, stages, evidenceUnavailable, entitled, dashboard } =
    await loadDashboardData("project");
  const normalization = getExercise("normalize-data");
  const currentVersion = normalization
    ? await learningEvidenceVersion(
        normalization.starterCode,
        normalization.testCode,
      )
    : null;
  // Resolve paid lesson source only for an entitled account. Send hashes and
  // starter code to the panel, never grading or authored solution source.
  const network =
    entitled && dashboard.worldSlug === "deep-orbit"
      ? getExercise("simple-network")
      : undefined;
  const networkEvidence = network
    ? {
        currentVersion: await learningEvidenceVersion(
          network.starterCode,
          network.testCode,
        ),
        starterCode: network.starterCode,
      }
    : undefined;
  const evaluation =
    entitled && dashboard.worldSlug === "deep-orbit"
      ? getExercise("deep-scan-eval")
      : undefined;
  const evaluationEvidence = evaluation
    ? {
        currentVersion: await learningEvidenceVersion(
          evaluation.starterCode,
          evaluation.testCode,
        ),
        starterCode: evaluation.starterCode,
      }
    : undefined;
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
      <LearningEvidenceProject
        userId={userId}
        currentVersion={currentVersion}
        starterCode={normalization?.starterCode ?? ""}
        network={networkEvidence}
        evaluation={evaluationEvidence}
        stages={stages}
        unavailable={evidenceUnavailable}
        entitled={entitled}
      />
    </main>
  );
}
