import Link from "next/link";
import { ArtPlate } from "@tensorcraft/ui/art-plate";
import { ModulePatch } from "@tensorcraft/ui/module-patch";
import type { WeeklyHints } from "@tensorcraft/ui/visualizations";
import type { SystemEvidenceItem } from "@/lib/system-evidence";
import styles from "./dashboard-view.module.css";

export interface DashboardModule {
  number: string;
  name: string;
  status: "done" | "active" | "available" | "locked";
  score: number | null;
  formula: string;
  slug: string;
  patchSrc?: string;
  completedLessons?: number;
  totalLessons?: number;
  lockReason?: "prerequisite" | "access";
  prerequisiteName?: string;
}
export interface DashboardBridge {
  jsTitle: string;
  mlTitle: string;
  tier: "identity" | "structural" | "intuition";
  collected: boolean;
  lessonSlug: string;
  moduleSlug: string;
}
export interface ActivityRecord {
  time: string;
  event: string;
  detail: string;
  score: number | null;
  href: string;
}
export interface DashboardProps {
  displayName: string;
  avatarUrl?: string | null;
  worldName: string;
  worldSlug: string;
  modules: DashboardModule[];
  currentModule: {
    number: number;
    name: string;
    lessonNumber: number;
    totalLessons: number;
    estimatedMinutes: number;
    topic: string;
  } | null;
  worldProgressPercent: number;
  completedLessons: number;
  totalLessons: number;
  currentStreak: number;
  bestStreak: number;
  averageScore: number | null;
  scoredAttemptCount: number;
  exerciseLessonCount: number;
  bridges: DashboardBridge[];
  activityDays: number[];
  recentActivity: ActivityRecord[];
  resumeUrl: string | null;
  resumeLabel?: string;
  totalModules: number;
  completedModules: number;
  genomeData: Array<{
    skill_axis: string;
    proficiency: number;
    velocity: number;
  }>;
  lossCurveData: { weekly: WeeklyHints[] };
  dueReviews: SystemEvidenceItem[];
  reviewsUnavailable?: boolean;
  progressUnavailable?: boolean;
  streakAtRisk?: boolean;
  plateSrc?: string;
  projectCheckpoint?: string;
}

export function moduleDestination(module: DashboardModule, worldSlug: string) {
  return module.lockReason === "access"
    ? `/pricing?locked=${worldSlug}&module=${module.slug}`
    : `/worlds/${worldSlug}#module-${module.slug}`;
}

export function DashboardView(props: DashboardProps) {
  const { currentModule, worldSlug, modules } = props;
  const allDone =
    modules.length > 0 && modules.every((m) => m.status === "done");
  const current = modules.find(
    (m) => m.status === "active" || m.lockReason === "access",
  );
  const recent = props.recentActivity
    .filter((a) => a.event === "lesson_completed")
    .slice(0, 3);
  return (
    <main className={styles.main}>
      <header className={styles.worldBanner}>
        <div>
          <p className={styles.kicker}>{props.worldName}</p>
          <p className={styles.secondary}>
            Good to see you, {props.displayName}
          </p>
        </div>
        {props.plateSrc && (
          <div aria-hidden="true" className={styles.art}>
            <ArtPlate src={props.plateSrc} />
          </div>
        )}
      </header>

      <section className={styles.continue} aria-labelledby="continue-heading">
        <p className={styles.kicker}>
          {props.progressUnavailable
            ? "Your learning"
            : allDone
              ? "Course complete"
              : "Your next lesson"}
        </p>
        <h1 id="continue-heading">
          {props.progressUnavailable
            ? "Continue your learning"
            : (currentModule?.topic ??
              (allDone
                ? "Your course is complete"
                : `Learn with ${props.worldName}`))}
        </h1>
        {currentModule && !props.progressUnavailable && (
          <p className={styles.secondary}>
            Module {currentModule.number} · {currentModule.name}
            <br />
            Lesson {currentModule.lessonNumber} of {currentModule.totalLessons}{" "}
            · About {currentModule.estimatedMinutes} minutes
          </p>
        )}
        {props.progressUnavailable ? (
          <p role="status">
            Course progress could not load.{" "}
            <a href="/dashboard" className={styles.textLink}>
              Retry dashboard
            </a>
          </p>
        ) : (
          <Link
            className={styles.primaryButton}
            href={
              props.resumeUrl ??
              (allDone
                ? `/worlds/${worldSlug}/capstone`
                : `/worlds/${worldSlug}`)
            }
          >
            {props.resumeLabel && !allDone
              ? props.resumeLabel
              : allDone
                ? "View capstone →"
                : "Start learning →"}
          </Link>
        )}
      </section>

      {props.reviewsUnavailable ? (
        <p className={styles.notice} role="status">
          Reviews could not load.{" "}
          <a className={styles.textLink} href="/dashboard">
            Retry dashboard
          </a>
        </p>
      ) : (
        props.dueReviews.length > 0 && (
          <section className={styles.review} aria-labelledby="review-heading">
            <div>
              <h2 id="review-heading">
                {props.dueReviews.length}{" "}
                {props.dueReviews.length === 1 ? "review" : "reviews"} ready
              </h2>
              <p className={styles.secondary}>
                {props.dueReviews[0].label.replace(/^Review due: /, "")} is
                ready for review.
              </p>
            </div>
            <Link
              className={styles.secondaryButton}
              href={props.dueReviews[0].href}
            >
              {props.dueReviews[0].href.startsWith("/pricing")
                ? "Get access to review →"
                : "Review now →"}
            </Link>
            {props.dueReviews.length > 1 && (
              <details className={styles.reviewList}>
                <summary>View all due reviews</summary>
                <ul>
                  {props.dueReviews.map((item) => (
                    <li key={item.href}>
                      <Link className={styles.textLink} href={item.href}>
                        {item.label.replace(/^Review due: /, "")}
                      </Link>
                    </li>
                  ))}
                </ul>
              </details>
            )}
          </section>
        )
      )}

      <section className={styles.course} aria-labelledby="course-heading">
        <div className={styles.sectionHeader}>
          <h2 id="course-heading">Your course</h2>
          <Link className={styles.textLink} href={`/worlds/${worldSlug}`}>
            View curriculum →
          </Link>
        </div>
        {!props.progressUnavailable && (
          <>
            <p>
              {props.completedLessons} of {props.totalLessons} lessons completed
            </p>
            <progress
              className={styles.progress}
              value={props.completedLessons}
              max={Math.max(1, props.totalLessons)}
              aria-label="Course lesson completion"
            />
            {current && (
              <p className={styles.secondary}>
                Next milestone: finish {current.name}
                {current.totalLessons
                  ? ` (${current.completedLessons ?? 0} of ${current.totalLessons} lessons completed)`
                  : ""}
                .
              </p>
            )}
          </>
        )}
        <div className={styles.courseMeta}>
          {props.currentStreak > 0 && (
            <span>
              {props.currentStreak}-day streak
              {props.streakAtRisk ? " · Continue today to keep it going" : ""}
            </span>
          )}
          <Link className={styles.textLink} href="/dashboard/progress">
            View progress and collections →
          </Link>
        </div>
        {!props.progressUnavailable && (
          <>
            <details className={styles.moduleMap}>
              <summary>
                Module map · {props.completedModules} of {props.totalModules}{" "}
                complete
              </summary>
              <ol>
                {modules.map((m) => (
                  <li key={m.slug}>
                    <span className={styles.moduleNumber}>
                      {m.status === "done" && m.patchSrc ? (
                        <ModulePatch src={m.patchSrc} size={28} />
                      ) : (
                        m.number
                      )}
                    </span>
                    <div>
                      <Link
                        className={styles.textLink}
                        href={moduleDestination(m, worldSlug)}
                      >
                        {m.name}
                      </Link>
                      <p className={styles.secondary}>
                        {m.status === "done"
                          ? "Completed"
                          : m.lockReason === "prerequisite"
                            ? `Complete ${m.prerequisiteName ?? "the previous module"} first`
                            : m.lockReason === "access"
                              ? "Paid access required"
                              : "Current module"}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </details>
          </>
        )}
      </section>

      {(recent.length > 0 || props.projectCheckpoint) && (
        <section
          className={styles.accomplishments}
          aria-labelledby="accomplishments-heading"
        >
          <h2 id="accomplishments-heading">Recent accomplishments</h2>
          {recent.length > 0 && (
            <ul>
              {recent.map((item) => (
                <li key={item.href}>
                  <Link className={styles.textLink} href={item.href}>
                    Completed {item.detail}
                  </Link>
                  <span className={styles.secondary}>{item.time}</span>
                </li>
              ))}
            </ul>
          )}
          {props.projectCheckpoint && (
            <p className={styles.secondary}>
              Your {props.projectCheckpoint.toLowerCase()} practice is linked to
              DEEP SCAN.{" "}
              <Link className={styles.textLink} href="/dashboard/project">
                View project evidence →
              </Link>
            </p>
          )}
        </section>
      )}
    </main>
  );
}
