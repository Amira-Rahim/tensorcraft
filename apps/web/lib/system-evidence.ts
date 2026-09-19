import {
  LEARNING_ACTIVITIES,
  activityEvidenceLabel,
  type ActivitySummary,
  type SystemStage,
} from "@tensorcraft/shared";

export interface EvidenceLesson {
  slug: string;
  moduleId: string;
  title: string;
}
export interface EvidenceAttempt {
  lesson_id: string;
  world_id: string;
  score: number | null;
  hints_used: number | null;
  attempted_at: string;
}
export interface EvidenceProgress {
  lesson_id: string;
  world_id: string;
  status: string;
}
export interface EvidenceReview {
  lesson_id: string;
  next_review_at: string;
}
export interface SystemEvidenceItem {
  label: string;
  href: string;
  detail: string;
}
export interface SystemEvidenceStage {
  id: SystemStage;
  title: string;
  purpose: string;
  completedLessons: number;
  due: SystemEvidenceItem[];
  work: SystemEvidenceItem[];
  next: SystemEvidenceItem;
}
const stageDetails: [SystemStage, string, string, string][] = [
  [
    "data",
    "Data",
    "Keep feature meaning and fit preprocessing on training rows.",
    "normalization",
  ],
  [
    "model",
    "Model",
    "Trace a prediction and test how the model uses its inputs.",
    "first-neuron",
  ],
  [
    "evaluation",
    "Evaluation",
    "Compare a baseline and account for misses and false alarms.",
    "evaluating-deep-scan",
  ],
  [
    "runtime",
    "Runtime",
    "Reload the intended artifact and handle resource and cache boundaries.",
    "model-loading",
  ],
  [
    "operations",
    "Operations",
    "Run the external application and explain what remains uncertain.",
    "launch",
  ],
];
function stageFor(lesson: EvidenceLesson): SystemStage {
  if (
    lesson.slug === "evaluating-deep-scan" ||
    lesson.moduleId === "anomaly-detection"
  )
    return "evaluation";
  if (lesson.moduleId === "foundations") return "data";
  if (["browser-runtimes", "optimization-edge"].includes(lesson.moduleId))
    return "runtime";
  if (["capstone", "llm-integration"].includes(lesson.moduleId))
    return "operations";
  return "model";
}
export function buildSystemEvidence({
  lessons,
  attempts,
  progress,
  activities,
  reviews,
  now,
}: {
  lessons: EvidenceLesson[];
  attempts: EvidenceAttempt[];
  progress: EvidenceProgress[];
  activities: ActivitySummary[];
  reviews: EvidenceReview[];
  now: Date;
}): SystemEvidenceStage[] {
  const lessonMap = new Map(lessons.map((l) => [l.slug, l]));
  const link = (l: EvidenceLesson, phase = "challenge") =>
    `/worlds/deep-orbit/${l.moduleId}/${l.slug}?start=${phase}`;
  return stageDetails.map(([id, title, purpose, defaultLesson]) => {
    const work: SystemEvidenceItem[] = [];
    for (const row of activities) {
      if (!Object.hasOwn(LEARNING_ACTIVITIES, row.activity_id)) continue;
      const spec =
        LEARNING_ACTIVITIES[
          row.activity_id as keyof typeof LEARNING_ACTIVITIES
        ];
      if (spec.stage !== id) continue;
      work.push({
        label: `${spec.title}: ${activityEvidenceLabel(row)}`,
        href: `/worlds/deep-orbit/${spec.module}/${spec.lesson}?start=${row.phase === "application" ? "challenge" : "concept"}`,
        detail: `${row.attempt_count} browser-reported attempts. First ${row.first_correct === null ? "outcome unavailable" : row.first_correct ? "matched" : "did not match"}; ${row.first_assisted === null ? "assistance not recorded" : row.first_assisted ? "with help" : "before help"}. ${row.source === "learner_report" ? "The learner reports a local run; Tensorcraft has not verified it." : "Numerical practice checks are reported by the browser."}`,
      });
    }
    // One recent attempt per lesson. A pass in a lesson with two exercises does
    // not imply both passed, so the label deliberately names one recorded pass.
    const seen = new Set<string>();
    for (const row of [...attempts].sort((a, b) =>
      b.attempted_at.localeCompare(a.attempted_at),
    )) {
      const lesson = lessonMap.get(row.lesson_id);
      if (
        row.world_id !== "deep-orbit" ||
        !lesson ||
        stageFor(lesson) !== id ||
        seen.has(row.lesson_id)
      )
        continue;
      seen.add(row.lesson_id);
      work.push({
        label: `${lesson.title}: ${row.hints_used === null ? (row.score === 100 ? "Earlier completion; assistance not recorded" : "Earlier attempt; assistance not recorded") : row.score === 100 ? (row.hints_used > 0 ? "Practised with help" : "Recorded exercise pass") : "Exercise needs another look"}`,
        href: link(lesson),
        detail: `Latest recorded exercise score: ${row.score ?? "unavailable"}. ${row.hints_used === null ? "This older record does not identify assistance." : `${row.hints_used} hint levels recorded.`} Exercise records are client-reported; one pass does not certify the whole lesson or an independent project.`,
      });
    }
    const due = reviews
      .filter((r) => new Date(r.next_review_at) <= now)
      .flatMap((row) => {
        const lesson = lessonMap.get(row.lesson_id);
        return lesson && stageFor(lesson) === id
          ? [
              {
                label: `Review due: ${lesson.title}`,
                href: `/worlds/deep-orbit/${lesson.moduleId}/${lesson.slug}#step-1`,
                detail:
                  "Open Briefing for the due-recall warm-up. A recall rating is a self-report, separate from exercise and lesson status.",
              },
            ]
          : [];
      });
    const nextSpec = Object.entries(LEARNING_ACTIVITIES).find(
      ([activity, s]) =>
        s.stage === id &&
        !activities.some(
          (r) =>
            r.activity_id === activity &&
            r.content_version === s.version &&
            (r.phase === "changed_case" || r.phase === "application") &&
            r.latest_correct,
        ),
    );
    const lesson = lessonMap.get(defaultLesson);
    const next =
      due[0] ??
      (nextSpec
        ? {
            label: nextSpec[1].title,
            href: `/worlds/deep-orbit/${nextSpec[1].module}/${nextSpec[1].lesson}?start=${nextSpec[0] === "room-project-run" ? "challenge" : "concept"}`,
            detail: "Continue the practice and inspect a changed case.",
          }
        : {
            label: lesson?.title ?? "Open the course map",
            href: lesson ? link(lesson) : "/worlds/deep-orbit",
            detail: "Revisit the evidence or apply it in the room project.",
          });
    return {
      id,
      title,
      purpose,
      work: work.slice(0, 10),
      due,
      completedLessons: progress.filter(
        (r) =>
          r.world_id === "deep-orbit" &&
          r.status === "completed" &&
          lessonMap.has(r.lesson_id) &&
          stageFor(lessonMap.get(r.lesson_id)!) === id,
      ).length,
      next,
    };
  });
}
