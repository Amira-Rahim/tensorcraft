import type { DashboardProps } from "../dashboard-view";
export function dashboardFixture(
  overrides: Partial<DashboardProps> = {},
): DashboardProps {
  return {
    displayName: "Ada",
    worldName: "Deep Orbit",
    worldSlug: "deep-orbit",
    modules: [
      {
        number: "M01",
        name: "Foundations: Tensors & Data",
        status: "active",
        score: null,
        formula: "",
        slug: "foundations",
        completedLessons: 1,
        totalLessons: 5,
      },
    ],
    currentModule: {
      number: 1,
      name: "Foundations: Tensors & Data",
      lessonNumber: 2,
      totalLessons: 5,
      estimatedMinutes: 18,
      topic: "Understanding Tensor Shapes",
    },
    worldProgressPercent: 2,
    completedLessons: 1,
    totalLessons: 56,
    currentStreak: 1,
    bestStreak: 1,
    averageScore: 100,
    scoredAttemptCount: 1,
    exerciseLessonCount: 1,
    bridges: [],
    activityDays: Array(30).fill(0),
    recentActivity: [],
    resumeUrl: "/worlds/deep-orbit/foundations/tensor-shapes",
    resumeLabel: "Continue course →",
    totalModules: 11,
    completedModules: 0,
    genomeData: [],
    lossCurveData: { weekly: [] },
    dueReviews: [],
    ...overrides,
  };
}
