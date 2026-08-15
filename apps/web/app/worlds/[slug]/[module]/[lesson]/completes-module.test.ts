import { describe, it, expect } from "vitest";
import { completesModule } from "./completes-module";

const LESSONS = [
  { slug: "a", completed: true },
  { slug: "b", completed: true },
  { slug: "c", completed: false },
];

const NONE = new Set<string>();

describe("completesModule", () => {
  it("true when every other lesson is done and the current one is not", () => {
    expect(completesModule(LESSONS, "c", NONE)).toBe(true);
  });

  it("false when the current lesson is already done (replay)", () => {
    expect(
      completesModule(
        [
          { slug: "a", completed: true },
          { slug: "b", completed: true },
        ],
        "b",
        NONE,
      ),
    ).toBe(false);
  });

  it("false while another lesson is still open", () => {
    expect(
      completesModule(
        [
          { slug: "a", completed: true },
          { slug: "b", completed: false },
          { slug: "c", completed: false },
        ],
        "c",
        NONE,
      ),
    ).toBe(false);
  });

  it("false without lesson data", () => {
    expect(completesModule(undefined, "c", NONE)).toBe(false);
    expect(completesModule([], "c", NONE)).toBe(false);
  });

  it("guest records stand in for server truth", () => {
    const lessons = [
      { slug: "a", completed: false },
      { slug: "b", completed: false },
      { slug: "c", completed: false },
    ];
    expect(completesModule(lessons, "c", new Set(["a", "b"]))).toBe(true);
    // A guest record for the CURRENT lesson means replay: no award.
    expect(completesModule(lessons, "c", new Set(["a", "b", "c"]))).toBe(false);
  });

  it("mixed server and guest completion covers the others", () => {
    const lessons = [
      { slug: "a", completed: true },
      { slug: "b", completed: false },
      { slug: "c", completed: false },
    ];
    expect(completesModule(lessons, "c", new Set(["b"]))).toBe(true);
  });
});
