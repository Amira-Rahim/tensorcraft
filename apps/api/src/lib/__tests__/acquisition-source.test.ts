import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../logger", () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

import { logger } from "../logger";
import {
  ACQUISITION_SOURCES,
  acquisitionSourceFields,
  sourceOptionProblems,
} from "../acquisition-source";

beforeEach(() => vi.mocked(logger.warn).mockClear());

describe("acquisitionSourceFields", () => {
  it("asks one optional dropdown question, so it never blocks a purchase", () => {
    const options = [
      { label: "A friend or colleague", value: "friend" },
      { label: "Hacker News", value: "hackernews" },
    ];
    expect(acquisitionSourceFields(options)).toEqual([
      {
        key: "source",
        label: { type: "custom", custom: "How did you find Tensorcraft?" },
        type: "dropdown",
        optional: true,
        dropdown: { options },
      },
    ]);
  });

  it("asks nothing while the option list is empty", () => {
    expect(acquisitionSourceFields([])).toEqual([]);
  });

  it("asks nothing when an option breaks Stripe's limits, so checkout still opens", () => {
    expect(
      acquisitionSourceFields([{ label: "DEV Community", value: "dev.to" }]),
    ).toEqual([]);
  });

  // A dropped question is otherwise invisible: no error, no answers in the
  // Dashboard, and the pre-push test is the only other gate.
  it("logs the problems when it drops a filled list", () => {
    acquisitionSourceFields([{ label: "DEV Community", value: "dev.to" }]);
    expect(logger.warn).toHaveBeenCalledTimes(1);
    expect(logger.warn).toHaveBeenCalledWith(
      expect.objectContaining({
        problems: [expect.stringContaining('"dev.to"')],
      }),
      expect.stringContaining("source question"),
    );
  });

  it("logs nothing while the list is empty", () => {
    acquisitionSourceFields([]);
    expect(logger.warn).not.toHaveBeenCalled();
  });

  it("asks nothing when two options share a label, which Stripe rejects", () => {
    expect(
      acquisitionSourceFields([
        { label: "Reddit", value: "reddit1" },
        { label: "Reddit", value: "reddit2" },
      ]),
    ).toEqual([]);
  });
});

// Stripe rejects the whole Checkout Session when a custom field breaks its
// limits, which would stop every purchase. The limits come from the
// stripe@23.0.1 SessionCreateParams.CustomField types.
describe("sourceOptionProblems", () => {
  it("accepts unique alphanumeric values with short labels", () => {
    expect(
      sourceOptionProblems([
        { label: "JavaScript Weekly", value: "jsweekly" },
        { label: "Search engine", value: "search" },
      ]),
    ).toEqual([]);
  });

  it("rejects values that are empty, longer than 100 characters, or not alphanumeric", () => {
    expect(
      sourceOptionProblems([
        { label: "DEV Community", value: "dev_to" },
        { label: "Long value", value: "x".repeat(101) },
        { label: "Empty value", value: "" },
      ]),
    ).toHaveLength(3);
  });

  it("rejects a value used twice", () => {
    expect(
      sourceOptionProblems([
        { label: "Reddit", value: "reddit" },
        { label: "Reddit again", value: "reddit" },
      ]),
    ).toHaveLength(1);
  });

  // Missing from Stripe's docs and types: a test-mode session on 2026-11-02
  // was rejected with "Ensure each `label` is unique". Stripe trims outer
  // spaces before comparing labels, and it accepted "Reddit" next to "reddit".
  it("rejects two labels that match once outer spaces are trimmed", () => {
    expect(
      sourceOptionProblems([
        { label: "Reddit", value: "reddit1" },
        { label: " Reddit", value: "reddit2" },
      ]),
    ).toHaveLength(1);
  });

  it("accepts labels that differ only in case, as Stripe does", () => {
    expect(
      sourceOptionProblems([
        { label: "Reddit", value: "reddit1" },
        { label: "reddit", value: "reddit2" },
      ]),
    ).toEqual([]);
  });

  it("rejects labels that are blank or longer than 100 characters", () => {
    expect(
      sourceOptionProblems([
        { label: "  ", value: "blank" },
        { label: "y".repeat(101), value: "long" },
      ]),
    ).toHaveLength(2);
  });

  it("rejects more than 200 options", () => {
    const many = Array.from({ length: 201 }, (_, i) => ({
      label: `Option ${i}`,
      value: `o${i}`,
    }));
    const problems = sourceOptionProblems(many);
    expect(problems).toHaveLength(1);
    expect(problems[0]).toMatch(/200/);
  });
});

describe("ACQUISITION_SOURCES", () => {
  it("stays inside Stripe's limits", () => {
    expect(sourceOptionProblems(ACQUISITION_SOURCES)).toEqual([]);
  });
});
