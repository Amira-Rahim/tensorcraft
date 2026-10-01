import type { SystemEvidenceStage } from "@/lib/system-evidence";
import { MissionIcon } from "../mission-icon";
import styles from "../dashboard-view.module.css";

export function ProjectPipeline({ stages }: { stages: SystemEvidenceStage[] }) {
  return (
    <figure className={styles.pipeline} aria-labelledby="pipeline-heading">
      <figcaption id="pipeline-heading">
        <span className={styles.kicker}>Inside DEEP SCAN</span>
        <h2>From incoming signal to a working system</h2>
      </figcaption>
      <ol className={styles.pipelineStages}>
        {stages.map((stage) => (
          <li key={stage.id} data-recorded={stage.work.length > 0}>
            <span className={styles.pipelineNode}>
              <MissionIcon name={stage.id} />
            </span>
            <strong>{stage.title}</strong>
            <span className={styles.secondary}>
              {stage.work.length
                ? `${stage.work.length} linked ${stage.work.length === 1 ? "record" : "records"}`
                : "Awaiting practice"}
            </span>
            {stage.due.length > 0 && (
              <span className={styles.pipelineDue}>
                {stage.due.length}{" "}
                {stage.due.length === 1 ? "review" : "reviews"} due
              </span>
            )}
          </li>
        ))}
      </ol>
      <p className={styles.secondary}>
        The route through your project. Linked records show practice, not
        verified system readiness.
      </p>
    </figure>
  );
}
