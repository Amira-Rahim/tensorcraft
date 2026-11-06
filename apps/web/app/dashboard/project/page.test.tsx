import { beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "@testing-library/react";

const mocks = vi.hoisted(() => ({
  load: vi.fn(),
  exercise: vi.fn(),
  received: vi.fn(),
}));
vi.mock("../_lib/load-dashboard", () => ({ loadDashboardData: mocks.load }));
vi.mock("@tensorcraft/content", () => ({ getExercise: mocks.exercise }));
vi.mock("@/lib/learning-evidence-types", () => ({
  learningEvidenceVersion: async () => "content-hash",
}));
vi.mock("@/app/components/learning-evidence-project", () => ({
  LearningEvidenceProject: (props: unknown) => {
    mocks.received(props);
    return null;
  },
}));
vi.mock("@/app/components/system-evidence", () => ({
  SystemEvidence: () => null,
}));
vi.mock("../expedition-header", () => ({ ExpeditionHeader: () => null }));
vi.mock("./project-pipeline", () => ({ ProjectPipeline: () => null }));
vi.mock("@/lib/location-art", () => ({ heroPlateSrc: () => "/unused.png" }));

import ProjectPage from "./page";

describe("project saved-run content access", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.exercise.mockImplementation((slug: string) => ({
      slug,
      starterCode: `${slug} starter`,
      testCode: "hidden grading source",
      solutionCode: "authored solution source",
    }));
  });

  it("does not resolve Deep Orbit training content for another world's purchase", async () => {
    mocks.load.mockResolvedValue({
      userId: "alice",
      stages: [],
      evidenceUnavailable: false,
      entitled: true,
      dashboard: { worldSlug: "neon-protocol", worldName: "Neon Protocol" },
    });
    render(await ProjectPage());
    expect(mocks.exercise).not.toHaveBeenCalledWith("simple-network");
    expect(mocks.exercise).not.toHaveBeenCalledWith("deep-scan-eval");
    expect(mocks.received.mock.calls[0][0].network).toBeUndefined();
  });

  it.each([false, true])(
    "resolves paid model content only when entitled=%s",
    async (entitled) => {
      mocks.load.mockResolvedValue({
        userId: "alice",
        stages: [],
        evidenceUnavailable: false,
        entitled,
        dashboard: { worldSlug: "deep-orbit", worldName: "Deep Orbit" },
      });
      render(await ProjectPage());
      const resolved = mocks.exercise.mock.calls.map(([slug]) => slug);
      expect(resolved).toEqual(
        entitled
          ? ["normalize-data", "simple-network", "deep-scan-eval"]
          : ["normalize-data"],
      );
      const props = mocks.received.mock.calls[0][0];
      expect(props.network).toEqual(
        entitled
          ? {
              starterCode: "simple-network starter",
              currentVersion: "content-hash",
            }
          : undefined,
      );
      expect(props.evaluation).toEqual(
        entitled
          ? {
              starterCode: "deep-scan-eval starter",
              currentVersion: "content-hash",
            }
          : undefined,
      );
      expect(props.stages).toEqual([]);
      expect(JSON.stringify(props)).not.toContain("hidden grading source");
      expect(JSON.stringify(props)).not.toContain("authored solution source");
    },
  );
});
