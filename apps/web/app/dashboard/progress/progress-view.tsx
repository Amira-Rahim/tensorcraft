import Link from "next/link";
import { LossCurve } from "@tensorcraft/ui/visualizations";
import { BridgeCollection } from "../bridge-collection";
import { PatchCollection } from "../patch-collection";
import { SkillGenome } from "../skill-genome";
import type { DashboardProps } from "../dashboard-view";
import styles from "../dashboard-view.module.css";

export function ProgressView(
  props: DashboardProps & { recordsUnavailable?: boolean },
) {
  const activityDayCount = props.activityDays.filter((v) => v > 0).length;
  const hasActivity = activityDayCount > 0;
  const hasTrend =
    props.lossCurveData.weekly.filter((w) => w.avgHints !== null).length >= 3;
  const hasSkills = props.genomeData.some((axis) => axis.proficiency > 0);
  const hasBridges = props.bridges.some((b) => b.collected);
  const hasPatches = props.modules.some(
    (m) => m.status === "done" && m.patchSrc,
  );
  return (
    <main className={styles.main}>
      <Link className={styles.textLink} href="/dashboard">
        ← Back to learning
      </Link>
      <h1>Your progress</h1>
      <p className={styles.secondary}>
        {props.worldName} · {props.completedLessons} of {props.totalLessons}{" "}
        lessons completed
      </p>
      {props.recordsUnavailable && (
        <p role="status" className={styles.notice}>
          Some records could not load.{" "}
          <a href="/dashboard/progress" className={styles.textLink}>
            Retry records
          </a>
        </p>
      )}
      <div className={styles.panels}>
        {props.scoredAttemptCount > 0 && (
          <section className={styles.panel} aria-labelledby="score-heading">
            <h2 id="score-heading">Exercise scores</h2>
            <p className={styles.metric}>
              {props.averageScore?.toFixed(0)} / 100
            </p>
            <p className={styles.secondary}>
              Average across {props.scoredAttemptCount} recorded{" "}
              {props.scoredAttemptCount === 1 ? "attempt" : "attempts"} in{" "}
              {props.exerciseLessonCount}{" "}
              {props.exerciseLessonCount === 1 ? "lesson" : "lessons"},
              including repeat attempts. Exercise scores describe recorded
              attempts, not overall mastery.
            </p>
          </section>
        )}
        {props.currentStreak > 0 && (
          <section className={styles.panel} aria-labelledby="streak-heading">
            <h2 id="streak-heading">Learning streak</h2>
            <p className={styles.metric}>
              {props.currentStreak} {props.currentStreak === 1 ? "day" : "days"}
            </p>
            <p className={styles.secondary}>
              Best: {props.bestStreak} {props.bestStreak === 1 ? "day" : "days"}
            </p>
          </section>
        )}
        {hasActivity && (
          <section className={styles.panel} aria-labelledby="activity-heading">
            <h2 id="activity-heading">Recorded lesson activity</h2>
            <p className={styles.secondary}>
              Last 30 days. Each square shows the number of lessons last updated
              on that day.
            </p>
            <div
              className={styles.heatmap}
              role="img"
              aria-label={`${activityDayCount} ${activityDayCount === 1 ? "day" : "days"} with recorded lesson updates in the last 30 days`}
            >
              {props.activityDays.map((v, i) => (
                <span
                  key={i}
                  title={`${props.activityDays.length - i - 1} days ago: ${v === 0 ? "no updates" : ["", "1 lesson", "2–3 lessons", "4–5 lessons", "6+ lessons"][v]}`}
                  style={{
                    background:
                      v === 0
                        ? "var(--tc-surface-overlay)"
                        : `color-mix(in srgb, var(--tc-primary) ${[0, 30, 50, 70, 100][v]}%, var(--tc-surface-overlay))`,
                  }}
                />
              ))}
            </div>
            <p className={styles.secondary}>Less activity → More activity</p>
          </section>
        )}
        {hasTrend && (
          <section className={styles.panel} aria-labelledby="trend-heading">
            <h2 id="trend-heading">Hints used over time</h2>
            <p className={styles.secondary}>
              Weekly average hint levels per exercise attempt. Exercise
              difficulty can change; fewer hints alone do not establish mastery.
            </p>
            <LossCurve weekly={props.lossCurveData.weekly} />
          </section>
        )}
      </div>
      {hasSkills && <SkillGenome data={props.genomeData} />}
      {(hasBridges || hasPatches) && (
        <section
          className={styles.collections}
          aria-labelledby="collections-heading"
        >
          <h2 id="collections-heading">Your collections</h2>
          {hasBridges && (
            <BridgeCollection
              bridges={props.bridges}
              worldSlug={props.worldSlug}
            />
          )}
          {hasPatches && <PatchCollection modules={props.modules} />}
        </section>
      )}
      {!props.recordsUnavailable &&
        !hasSkills &&
        !hasActivity &&
        props.scoredAttemptCount === 0 &&
        !hasBridges &&
        !hasPatches && (
          <p className={styles.notice}>
            Your recorded practice and earned collections will appear here as
            you learn.{" "}
            <Link
              className={styles.textLink}
              href={props.resumeUrl ?? `/worlds/${props.worldSlug}`}
            >
              Start learning →
            </Link>
          </p>
        )}
    </main>
  );
}
