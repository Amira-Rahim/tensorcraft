import { describe, expect, it } from "vitest";
import { isEarlierInCourse } from "./course-position";

describe("isEarlierInCourse", () => {
  const opening = { moduleOrder: 2, lessonOrder: 3 };

  it("is true for an earlier module, whatever the lesson number", () => {
    expect(isEarlierInCourse({ moduleOrder: 1, lessonOrder: 5 }, opening)).toBe(
      true,
    );
  });

  it("is true for an earlier lesson in the same module", () => {
    expect(isEarlierInCourse({ moduleOrder: 2, lessonOrder: 2 }, opening)).toBe(
      true,
    );
  });

  it("is false for the lesson being opened", () => {
    expect(isEarlierInCourse({ moduleOrder: 2, lessonOrder: 3 }, opening)).toBe(
      false,
    );
  });

  it("is false for a later lesson in the same module", () => {
    expect(isEarlierInCourse({ moduleOrder: 2, lessonOrder: 4 }, opening)).toBe(
      false,
    );
  });

  it("is false for a later module, whatever the lesson number", () => {
    expect(isEarlierInCourse({ moduleOrder: 3, lessonOrder: 1 }, opening)).toBe(
      false,
    );
  });
});
