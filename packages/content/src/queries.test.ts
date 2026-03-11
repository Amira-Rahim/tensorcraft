import { describe, it, expect, vi } from "vitest";

vi.mock("../.velite", () => ({
  modules: [
    {
      slug: "foundations",
      themeId: "deep-orbit",
      title: "Foundations",
      order: 1,
    },
    {
      slug: "neural-networks",
      themeId: "deep-orbit",
      title: "Neural Networks",
      order: 2,
    },
    {
      slug: "training-loop",
      themeId: "deep-orbit",
      title: "Training Loop",
      order: 3,
    },
    { slug: "basics", themeId: "neon-protocol", title: "Basics", order: 1 },
  ],
  lessons: [
    {
      slug: "intro-tensors",
      themeId: "deep-orbit",
      moduleId: "foundations",
      title: "Introduction to Tensors",
      order: 1,
    },
    {
      slug: "tensor-shapes",
      themeId: "deep-orbit",
      moduleId: "foundations",
      title: "Tensor Shapes",
      order: 2,
    },
    {
      slug: "tensor-ops",
      themeId: "deep-orbit",
      moduleId: "foundations",
      title: "Tensor Operations",
      order: 3,
    },
    {
      slug: "first-neuron",
      themeId: "deep-orbit",
      moduleId: "neural-networks",
      title: "First Neuron",
      order: 1,
    },
    {
      slug: "activation-functions",
      themeId: "deep-orbit",
      moduleId: "neural-networks",
      title: "Activation Functions",
      order: 2,
    },
  ],
  exercises: [
    {
      slug: "create-a-tensor",
      title: "Create a Tensor",
      starterCode: "// start",
      solutionCode: "// done",
      testCode: "// test",
    },
    {
      slug: "reshape-tensor",
      title: "Reshape a Tensor",
      starterCode: "// start",
      solutionCode: "// done",
      testCode: "// test",
    },
  ],
}));

import {
  getModules,
  getModule,
  getThemeLessons,
  getModuleLessons,
  getLesson,
  getExercise,
  getAdjacentLessons,
} from "./queries";

describe("Content Queries", () => {
  describe("getModules", () => {
    it("returns modules for a given theme", () => {
      const result = getModules("deep-orbit");
      expect(result).toHaveLength(3);
      expect(result.map((m) => m.slug)).toEqual([
        "foundations",
        "neural-networks",
        "training-loop",
      ]);
    });

    it("returns modules sorted by order", () => {
      const result = getModules("deep-orbit");
      expect(result[0].order).toBe(1);
      expect(result[1].order).toBe(2);
      expect(result[2].order).toBe(3);
    });

    it("returns empty array for unknown theme", () => {
      expect(getModules("unknown-theme")).toEqual([]);
    });

    it("filters by theme correctly", () => {
      const result = getModules("neon-protocol");
      expect(result).toHaveLength(1);
      expect(result[0].slug).toBe("basics");
    });
  });

  describe("getModule", () => {
    it("returns a specific module", () => {
      const result = getModule("deep-orbit", "foundations");
      expect(result).not.toBeNull();
      expect(result?.title).toBe("Foundations");
    });

    it("returns null for non-existent module", () => {
      expect(getModule("deep-orbit", "nonexistent")).toBeNull();
    });

    it("returns null for wrong theme", () => {
      expect(getModule("neon-protocol", "foundations")).toBeNull();
    });
  });

  describe("getThemeLessons", () => {
    it("returns all lessons for a theme", () => {
      const result = getThemeLessons("deep-orbit");
      expect(result).toHaveLength(5);
    });

    it("returns lessons sorted by order", () => {
      const result = getThemeLessons("deep-orbit");
      for (let i = 1; i < result.length; i++) {
        expect(result[i].order).toBeGreaterThanOrEqual(result[i - 1].order);
      }
    });

    it("returns empty for unknown theme", () => {
      expect(getThemeLessons("unknown")).toEqual([]);
    });
  });

  describe("getModuleLessons", () => {
    it("returns lessons for a specific module", () => {
      const result = getModuleLessons("deep-orbit", "foundations");
      expect(result).toHaveLength(3);
    });

    it("returns lessons sorted by order", () => {
      const result = getModuleLessons("deep-orbit", "foundations");
      expect(result[0].order).toBe(1);
      expect(result[1].order).toBe(2);
      expect(result[2].order).toBe(3);
    });

    it("returns empty for non-existent module", () => {
      expect(getModuleLessons("deep-orbit", "nonexistent")).toEqual([]);
    });
  });

  describe("getLesson", () => {
    it("returns a specific lesson", () => {
      const result = getLesson("deep-orbit", "foundations", "intro-tensors");
      expect(result).not.toBeNull();
      expect(result?.title).toBe("Introduction to Tensors");
    });

    it("returns null for non-existent lesson", () => {
      expect(getLesson("deep-orbit", "foundations", "nonexistent")).toBeNull();
    });

    it("returns null when theme doesn't match", () => {
      expect(
        getLesson("neon-protocol", "foundations", "intro-tensors"),
      ).toBeNull();
    });
  });

  describe("getExercise", () => {
    it("returns an exercise by slug", () => {
      const result = getExercise("create-a-tensor");
      expect(result).not.toBeNull();
      expect(result?.title).toBe("Create a Tensor");
    });

    it("returns null for non-existent exercise", () => {
      expect(getExercise("nonexistent")).toBeNull();
    });
  });

  describe("getAdjacentLessons", () => {
    it("returns prev and next for middle lesson", () => {
      const result = getAdjacentLessons({
        themeId: "deep-orbit",
        moduleId: "foundations",
        order: 2,
      });
      expect(result.prev?.slug).toBe("intro-tensors");
      expect(result.next?.slug).toBe("tensor-ops");
    });

    it("returns null prev for first lesson", () => {
      const result = getAdjacentLessons({
        themeId: "deep-orbit",
        moduleId: "foundations",
        order: 1,
      });
      expect(result.prev).toBeNull();
      expect(result.next?.slug).toBe("tensor-shapes");
    });

    it("returns null next for last lesson", () => {
      const result = getAdjacentLessons({
        themeId: "deep-orbit",
        moduleId: "foundations",
        order: 3,
      });
      expect(result.prev?.slug).toBe("tensor-shapes");
      expect(result.next).toBeNull();
    });

    it("returns both null for single-lesson module or unknown", () => {
      const result = getAdjacentLessons({
        themeId: "deep-orbit",
        moduleId: "unknown",
        order: 1,
      });
      expect(result.prev).toBeNull();
      expect(result.next).toBeNull();
    });
  });
});
