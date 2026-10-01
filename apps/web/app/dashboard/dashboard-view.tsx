import Link from "next/link";
import { ArtPlate } from "@tensorcraft/ui/art-plate";
import { MissionJourney } from "./mission-journey";
import { MissionIcon } from "./mission-icon";
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
  story?: string;
  missions?: Array<{ title: string; completed: boolean }>;
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
  sceneSrc?: string;
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
  missionScene?: {
    src: string;
    alt: string;
    location: string;
    narrative: string;
  };
}

export function DashboardView(props: DashboardProps) {
  const { currentModule, worldSlug, modules } = props;
  const allDone =
    modules.length > 0 && modules.every((m) => m.status === "done");
  const recent = props.recentActivity
    .filter((a) => a.event === "lesson_completed")
    .slice(0, 3);
  const latestBridge = props.bridges.find(
    (b) =>
      b.collected && recent.some((a) => a.href.endsWith(`/${b.lessonSlug}`)),
  );
  const scene = props.missionScene;
  const sceneSrc =
    !props.progressUnavailable && !allDone ? scene?.src : undefined;
  return (
    <main className={styles.main}>
      <header className={styles.worldBanner}>
        <div className={styles.shipIdentity}>
          <span className={styles.shipMark}>
            <MissionIcon name="signal" />
          </span>
          <div>
            <p className={styles.kicker}>{props.worldName} · Mission control</p>
            <p className={styles.secondary}>
              {worldSlug === "deep-orbit"
                ? "Aboard the Archimedes"
                : "Your learning expedition"}
            </p>
          </div>
        </div>
        <p className={styles.welcome}>
          {props.resumeLabel === "Start learning →"
            ? "Welcome aboard"
            : "Welcome back"}
          , {props.displayName}
        </p>
      </header>

      <section className={styles.continue} aria-labelledby="continue-heading">
        <div className={styles.missionCopy}>
          <p className={styles.kicker}>
            {props.progressUnavailable
              ? "Your mission"
              : allDone
                ? "Voyage complete"
                : `Sector ${String(currentModule?.number ?? 1).padStart(2, "0")} · Your next mission`}
          </p>
          <h1 id="continue-heading">
            {props.progressUnavailable
              ? "Return to the mission"
              : allDone
                ? "Your course is complete"
                : (currentModule?.topic ??
                  `Your journey into ${props.worldName}`)}
          </h1>
          {!props.progressUnavailable && !allDone && scene?.narrative && (
            <p className={styles.storyHook}>{scene.narrative}</p>
          )}
          {allDone && !props.progressUnavailable && (
            <p className={styles.storyHook}>
              Every sector explored. Bring your work together in the capstone.
            </p>
          )}
          {currentModule && !props.progressUnavailable && !allDone && (
            <>
              <p className={styles.moduleContext}>
                Module {currentModule.number} · {currentModule.name}
              </p>
              <div className={styles.missionMeta}>
                <span>
                  Mission {currentModule.lessonNumber} of{" "}
                  {currentModule.totalLessons}
                </span>
                <span>About {currentModule.estimatedMinutes} minutes</span>
              </div>
            </>
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
        </div>
        <figure className={styles.missionScene}>
          {sceneSrc || props.plateSrc ? (
            <ArtPlate
              src={(sceneSrc ?? props.plateSrc)!}
              alt={
                sceneSrc
                  ? scene?.alt
                  : "The monitoring alcove aboard the Archimedes, with glowing green signal displays."
              }
              bleed
              fallback={
                props.plateSrc && sceneSrc ? (
                  <ArtPlate src={props.plateSrc} bleed />
                ) : (
                  <MissionIcon name="signal" className={styles.sceneFallback} />
                )
              }
            />
          ) : (
            <MissionIcon name="signal" className={styles.sceneFallback} />
          )}
          <figcaption className={styles.sceneCaption}>
            <span className={styles.sceneLight} aria-hidden="true" />
            {sceneSrc ? scene?.location : props.worldName}
            <span>Mission scene</span>
          </figcaption>
        </figure>
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
            <span className={styles.reviewSymbol}>
              <MissionIcon name="review" />
            </span>
            <div className={styles.reviewCopy}>
              <p className={styles.kicker}>Keep the signal clear</p>
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
          <div>
            <p className={styles.kicker}>Your course · {props.worldName}</p>
            <h2 id="course-heading">Chart your voyage</h2>
          </div>
          <Link className={styles.textLink} href={`/worlds/${worldSlug}`}>
            View curriculum →
          </Link>
        </div>
        {!props.progressUnavailable && (
          <>
            <div className={styles.voyageMeta}>
              <p>
                {props.completedLessons} of {props.totalLessons} lessons
                completed
              </p>
              <span className={styles.secondary}>
                {props.completedModules} of {props.totalModules} sectors
                complete
              </span>
            </div>
            <progress
              className={styles.progress}
              value={props.completedLessons}
              max={Math.max(1, props.totalLessons)}
              aria-label="Course lesson completion"
            />
            <MissionJourney modules={modules} worldSlug={worldSlug} />
          </>
        )}
        <div className={styles.courseMeta}>
          {props.currentStreak > 0 && (
            <span className={styles.streak}>
              <MissionIcon name="signal" />
              {props.currentStreak}-day streak
              {props.streakAtRisk ? " · Continue today to keep it going" : ""}
            </span>
          )}
          <Link className={styles.textLink} href="/dashboard/progress">
            View progress and collections →
          </Link>
        </div>
      </section>

      {(recent.length > 0 || props.projectCheckpoint || latestBridge) && (
        <section
          className={styles.accomplishments}
          aria-labelledby="accomplishments-heading"
        >
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.kicker}>Your discoveries</p>
              <h2 id="accomplishments-heading">Recent accomplishments</h2>
            </div>
          </div>
          {recent.length > 0 && (
            <ul className={styles.missionLog}>
              {recent.map((item) => (
                <li key={item.href}>
                  <Link
                    className={styles.logCard}
                    href={item.href}
                    aria-label={`Completed ${item.detail}`}
                  >
                    <div className={styles.logArt}>
                      {item.sceneSrc ? (
                        <ArtPlate
                          src={item.sceneSrc}
                          bleed
                          fallback={<MissionIcon name="check" />}
                        />
                      ) : (
                        <MissionIcon name="check" />
                      )}
                      <span className={styles.logCheck}>
                        <MissionIcon name="check" />
                      </span>
                    </div>
                    <div>
                      <p className={styles.kicker}>Completed · {item.time}</p>
                      <span>{item.detail}</span>
                    </div>
                    <span className={styles.logArrow} aria-hidden="true">
                      ↗
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {latestBridge && (
            <Link className={styles.discovery} href="/dashboard/progress">
              <span className={styles.kicker}>Bridge discovered</span>
              <span className={styles.bridgePair}>
                <span>{latestBridge.jsTitle}</span>
                <span aria-hidden="true">⟷</span>
                <span>{latestBridge.mlTitle}</span>
              </span>
              <span className={styles.secondary}>
                Explore your collection →
              </span>
            </Link>
          )}
          {props.projectCheckpoint && (
            <Link className={styles.projectTeaser} href="/dashboard/project">
              <MissionIcon name="model" />
              <div>
                <p className={styles.kicker}>Building DEEP SCAN</p>
                <p>
                  Your {props.projectCheckpoint.toLowerCase()} practice is
                  linked to the project.
                </p>
              </div>
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </section>
      )}
    </main>
  );
}
