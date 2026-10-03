import Link from "next/link";
import { ArtPlate } from "@tensorcraft/ui/art-plate";
import { MissionJourney } from "./mission-journey";
import { MissionIcon } from "./mission-icon";
import { CharacterAvatar } from "@tensorcraft/ui/character-avatar";
import { ModulePatch } from "@tensorcraft/ui/module-patch";
import { BridgeArt } from "./bridge-art";
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
  chapterTitle?: string;
  sceneSrc?: string;
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
    character?: { name: string; src?: string; isAI?: boolean };
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
  const earnedPatch = !props.progressUnavailable
    ? modules
        .filter((module) => module.status === "done" && module.patchSrc)
        .at(-1)
    : undefined;
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
        {/* ph-no-capture: the learner's name stays out of PostHog
            autocapture and session replays. */}
        <p className={`${styles.welcome} ph-no-capture`}>
          {props.resumeLabel === "Start learning →"
            ? "Welcome aboard"
            : "Welcome back"}
          , {props.displayName}
        </p>
      </header>

      <section
        className={`${styles.continue} tc-on-art`}
        aria-labelledby="continue-heading"
      >
        <figure className={styles.missionScene}>
          {sceneSrc || props.plateSrc ? (
            <ArtPlate
              src={(sceneSrc ?? props.plateSrc)!}
              loading="eager"
              alt={
                sceneSrc
                  ? scene?.alt
                  : "The Archimedes mission station, illuminated by green signal displays."
              }
              bleed
              fallback={
                <MissionIcon name="signal" className={styles.sceneFallback} />
              }
            />
          ) : (
            <MissionIcon name="signal" className={styles.sceneFallback} />
          )}
        </figure>
        <div className={styles.sceneTopline}>
          <span>
            <span className={styles.sceneLight} aria-hidden="true" />
            {sceneSrc ? scene?.location : props.worldName}
          </span>
          {currentModule && !props.progressUnavailable && (
            <span>
              Sector {String(currentModule.number).padStart(2, "0")} · Mission{" "}
              {currentModule.lessonNumber}/{currentModule.totalLessons}
            </span>
          )}
        </div>
        <div className={styles.missionCopy}>
          {scene?.character && !props.progressUnavailable && !allDone && (
            <div className={styles.crewBriefing}>
              <CharacterAvatar {...scene.character} size={40} />
              <span>
                {scene.character.name}
                <small>In this mission</small>
              </span>
            </div>
          )}
          <p className={styles.kicker}>
            {props.progressUnavailable
              ? "Your mission"
              : allDone
                ? "Voyage complete"
                : (currentModule?.topic ?? "Your next mission")}
          </p>
          <h1 id="continue-heading">
            {props.progressUnavailable
              ? "Return to the mission"
              : allDone
                ? "Every sector explored."
                : scene?.narrative ||
                  currentModule?.topic ||
                  `Your journey into ${props.worldName}`}
          </h1>
          <div className={styles.missionActions}>
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
            {currentModule && !props.progressUnavailable && !allDone && (
              <span className={styles.missionDuration}>
                About {currentModule.estimatedMinutes} minutes
              </span>
            )}
          </div>
        </div>
        <div className={styles.sceneTag} aria-hidden="true">
          <MissionIcon name="signal" />
          <span>
            ARCHIMEDES
            <br />
            MISSION SCENE
          </span>
        </div>
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
              <h2 id="review-heading">
                {props.dueReviews.length}{" "}
                {props.dueReviews.length === 1 ? "review" : "reviews"} ready
              </h2>
              <p className={styles.secondary}>
                {props.dueReviews[0].label.replace(/^Review due: /, "")}
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
            <p className={styles.kicker}>Into the unknown</p>
            <h2 id="course-heading">Your voyage</h2>
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

      {(recent.length > 0 ||
        props.projectCheckpoint ||
        latestBridge ||
        earnedPatch) && (
        <section
          className={styles.accomplishments}
          aria-labelledby="accomplishments-heading"
        >
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.kicker}>Brought back from the voyage</p>
              <h2 id="accomplishments-heading">Your discoveries</h2>
            </div>
            <Link className={styles.textLink} href="/dashboard/progress">
              Open collection →
            </Link>
          </div>
          <ul className={styles.missionLog}>
            {recent
              .slice(0, latestBridge || earnedPatch ? 2 : 3)
              .map((item) => (
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
                    </div>
                    <span className={styles.logCheck}>
                      <MissionIcon name="check" />
                    </span>
                    <div className={styles.logCaption}>
                      <p className={styles.kicker}>
                        Mission complete · {item.time}
                      </p>
                      <span>{item.detail}</span>
                      <span aria-hidden="true">↗</span>
                    </div>
                  </Link>
                </li>
              ))}
            {earnedPatch ? (
              <li>
                <Link
                  className={styles.artifactCard}
                  href="/dashboard/progress"
                >
                  <div className={styles.patchArtifact}>
                    <ModulePatch
                      src={earnedPatch.patchSrc!}
                      size={120}
                      alt={`${earnedPatch.name} mission patch`}
                    />
                  </div>
                  <div className={styles.artifactCaption}>
                    <p className={styles.kicker}>Mission patch earned</p>
                    <span>{earnedPatch.chapterTitle ?? earnedPatch.name}</span>
                    <span aria-hidden="true">↗</span>
                  </div>
                </Link>
              </li>
            ) : (
              latestBridge && (
                <li>
                  <Link
                    className={styles.artifactCard}
                    href="/dashboard/progress"
                    aria-label={`Bridge discovered: ${latestBridge.jsTitle} to ${latestBridge.mlTitle}`}
                  >
                    <div className={styles.bridgeArtifact}>
                      <BridgeArt />
                    </div>
                    <div className={styles.artifactCaption}>
                      <p className={styles.kicker}>Bridge discovered</p>
                      <span>
                        {latestBridge.jsTitle} ⟷ {latestBridge.mlTitle}
                      </span>
                      <span aria-hidden="true">↗</span>
                    </div>
                  </Link>
                </li>
              )
            )}
          </ul>
          {props.projectCheckpoint && (
            <Link className={styles.projectTeaser} href="/dashboard/project">
              <div>
                <p className={styles.kicker}>DEEP SCAN</p>
                <span>{props.projectCheckpoint} practice recorded</span>
              </div>
              <span className={styles.miniPipeline} aria-hidden="true">
                {(
                  [
                    "data",
                    "model",
                    "evaluation",
                    "runtime",
                    "operations",
                  ] as const
                ).map((stage) => (
                  <span
                    key={stage}
                    data-recorded={
                      stage === props.projectCheckpoint?.toLowerCase()
                    }
                  >
                    <MissionIcon name={stage} />
                  </span>
                ))}
              </span>
              <span aria-hidden="true">→</span>
            </Link>
          )}
        </section>
      )}
    </main>
  );
}
