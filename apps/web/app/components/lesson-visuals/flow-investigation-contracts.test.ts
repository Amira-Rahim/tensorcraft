// @vitest-environment node
import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { FLOW_INVESTIGATIONS } from "./flow-investigations";
import {
  initialInvestigationValues,
  type InvestigationResult,
} from "./investigation-types";

function evaluate(
  slug: string,
  changes: Record<string, number | undefined> = {},
  caseId?: string,
) {
  const spec = FLOW_INVESTIGATIONS[slug]!;
  const selectedCase = caseId ?? spec.cases[0]!.id;
  return spec.evaluate(
    {
      ...initialInvestigationValues(spec, selectedCase),
      ...Object.fromEntries(
        Object.entries(changes).filter(
          (entry): entry is [string, number] => entry[1] !== undefined,
        ),
      ),
    },
    selectedCase,
  );
}

function graphic(result: InvestigationResult, label: string) {
  const found = result.graphics.find((item) => item.label === label);
  if (!found) throw new Error(`Missing graphic: ${label}`);
  return found;
}

// Execute the report assembler learners implement, rather than a test copy.
function reportAssembler() {
  const yaml = readFileSync(
    new URL(
      "../../../../../packages/content/content/deep-orbit/llm-integration/exercises/generate-report.yaml",
      import.meta.url,
    ),
    "utf8",
  );
  const source = yaml
    .split("solutionCode: |\n")[1]!
    .split("\ntestCode:")[0]!
    .replace(/^ {2}/gm, "");
  const javascript = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.None,
    },
  }).outputText;
  return new Function(`${javascript}\nreturn assembleReport;`)() as (
    title: string,
    sections: Array<{
      heading: string;
      content: string;
      validated: boolean;
    }>,
  ) => string;
}

describe("flow activity teaching contracts", () => {
  it("adds the missing catalogue as separate reference context in the visible prompt", () => {
    const incomplete = evaluate("prompt-engineering");
    const complete = evaluate("prompt-engineering", { catalogue: 1 });
    const before = graphic(incomplete, "Assembled prompt");
    const after = graphic(complete, "Assembled prompt");
    const catalogue = "Known natural frequencies: 5, 12, 23, 47 Hz.";
    expect(incomplete.answer).toBe(1);
    expect(complete.answer).toBe(0);
    expect(before.values).not.toContain(catalogue);
    expect(after.values).toContain(catalogue);
    expect(after.values.indexOf(catalogue)).toBeGreaterThan(0);
    expect(after.values.indexOf(catalogue)).toBeLessThan(
      after.values.indexOf("Practice reading P1:"),
    );
    expect(after.labels?.[after.values.indexOf(catalogue)]).toBe(
      "Reference facts",
    );
    expect(after.values).toContain("Amplitude: 1024 counts");
    expect(after.values).toContain("Frequency: 23 Hz");
    expect(after.values).toContain("Phase: 0.23 rad");
    // The code must build exactly the prompt already visible in the activity.
    const prompt = new Function(`${complete.code}\nreturn prompt;`)();
    expect(prompt.split("\n")).toEqual(after.values);
    expect(complete.explanation).toContain(
      "does not guarantee valid JSON or correct claims",
    );
  });

  it("changes the reading identity, values and units while keeping reference context fixed", () => {
    const first = evaluate(
      "prompt-engineering",
      { catalogue: 1 },
      "practice-a",
    );
    const second = evaluate(
      "prompt-engineering",
      { catalogue: 1 },
      "practice-b",
    );
    const before = graphic(first, "Assembled prompt").values;
    const after = graphic(second, "Assembled prompt").values;
    expect(first.answer).toBe(0);
    expect(second.answer).toBe(0);
    expect(after).toContain("Practice reading P2:");
    expect(after).not.toContain("Practice reading P1:");
    expect(after).toContain("Amplitude: 768 counts");
    expect(after).not.toContain("Amplitude: 1024 counts");
    expect(after).toContain("Frequency: 73.4 Hz");
    expect(after).toContain("Phase: -0.4 rad");
    expect(after[1]).toBe(before[1]);
    expect(FLOW_INVESTIGATIONS["prompt-engineering"]!.boundary).toContain(
      "made-up practice readings",
    );
  });

  it.each([
    ["role", "Role", "classification task"],
    ["catalogue", "Reference facts", "natural-frequency catalogue"],
    ["reading", "Current reading", "values and units"],
    ["format", "Output request", "classification, confidence and reasoning"],
  ])(
    "removing %s removes that prompt content and explains the missing requirement",
    (control, label, reason) => {
      const result = evaluate("prompt-engineering", {
        role: 1,
        catalogue: 1,
        reading: 1,
        format: 1,
        [control]: 0,
      });
      expect(result.answer).toBe(1);
      expect(graphic(result, "Assembled prompt").labels).not.toContain(label);
      expect(result.explanation).toContain(reason);
      expect(graphic(result, "Required prompt parts").values).toContain(
        `${label}: missing`,
      );
    },
  );

  it("keeps an empty prompt visible rather than inventing instructions", () => {
    const result = evaluate("prompt-engineering", {
      role: 0,
      catalogue: 0,
      reading: 0,
      format: 0,
    });
    expect(result.answer).toBe(4);
    expect(graphic(result, "Assembled prompt").values).toEqual([
      "The prompt is empty. Add a part to begin.",
    ]);
    expect(new Function(`${result.code}\nreturn prompt;`)()).toBe("");
  });

  it.each([
    ["routine", 2],
    ["changed", 12],
  ] as const)(
    "shows the actual %s missing-input percentage against a zero limit",
    (caseId, observed) => {
      const result = evaluate("monitoring", { missing: 0 }, caseId);
      const missing = graphic(result, "Missing inputs (%)");
      expect(missing.values).toEqual([observed, 0]);
      expect(missing.labels).toEqual(["Observed", "Alert limit"]);
      expect(graphic(result, "Review signals").values).toContain(
        "Missing inputs exceed limit",
      );
      expect(result.answer).toBe(caseId === "routine" ? 1 : 3);
      expect(result.explanation).toContain("undefined");
      const relative = graphic(
        result,
        "Latency and score change as percentages of their limits",
      );
      expect(relative.labels).not.toContain("Missing inputs");
      for (const value of relative.values)
        expect(Number.isFinite(value)).toBe(true);
    },
  );

  it("changing the missing-input limit changes the alert without changing the observation", () => {
    const equal = evaluate("monitoring", { missing: 2 }, "routine");
    const below = evaluate("monitoring", { missing: 1 }, "routine");
    expect(graphic(equal, "Missing inputs (%)").values).toEqual([2, 2]);
    expect(graphic(below, "Missing inputs (%)").values).toEqual([2, 1]);
    expect(equal.answer).toBe(0);
    expect(below.answer).toBe(1);
  });

  it.each([
    ["strong", 0.8, 0.7, 0.9],
    ["borderline", 0.6, 0.5, 0.7],
  ] as const)(
    "does not alert at exact threshold equality for the %s detector case",
    (caseId, score, lower, higher) => {
      const equal = evaluate(
        "multi-model-systems",
        { threshold: score },
        caseId,
      );
      const above = evaluate(
        "multi-model-systems",
        { threshold: lower },
        caseId,
      );
      const below = evaluate(
        "multi-model-systems",
        { threshold: higher },
        caseId,
      );
      expect(equal.answer).toBe(2);
      expect(above.answer).toBe(3);
      expect(below.answer).toBe(2);
      expect(graphic(equal, "Detector decision (raw score)").values).toEqual([
        score,
        score,
      ]);
      expect(graphic(equal, "Alert-report handoff").values[0]).toBe(
        "Does not exceed alert threshold",
      );
      expect(equal.explanation).toContain("not a calibrated probability");
    },
  );

  it.each([
    {
      name: "an incomplete observation",
      caseId: "partial",
      changes: {},
      expected: [false, true, true],
      withheld: ["Observations"],
    },
    {
      name: "an unsupported analysis",
      caseId: "full",
      changes: { claim: 1 },
      expected: [true, false, true],
      withheld: ["Analysis"],
    },
    {
      name: "three failed sections",
      caseId: "partial",
      changes: { sources: 0, claim: 1, limits: 0 },
      expected: [false, false, false],
      withheld: ["Observations", "Analysis", "Limits"],
    },
  ])(
    "assembles approved sections and names omissions after $name",
    ({ caseId, changes, expected, withheld }) => {
      const result = evaluate("report-generation", changes, caseId);
      const contract = new Function(
        `${result.code}\nreturn { sectionsPass, completeReportReady };`,
      )() as { sectionsPass: boolean[]; completeReportReady: boolean };
      expect(contract.sectionsPass).toEqual(expected);
      expect(contract.completeReportReady).toBe(false);

      const headings = ["Observations", "Analysis", "Limits"];
      const report = reportAssembler()(
        "Review",
        headings.map((heading, i) => ({
          heading,
          content: `Body for ${heading}`,
          validated: contract.sectionsPass[i]!,
        })),
      );
      expect(report).toContain("## Withheld");
      for (const heading of headings) {
        if (withheld.includes(heading)) {
          expect(report).toContain(`- ${heading}`);
          expect(report).not.toContain(`Body for ${heading}`);
        } else {
          expect(report).toContain(`## ${heading}\n\nBody for ${heading}`);
        }
      }
    },
  );

  it.each([
    ["repeat", 0, 2, 1, [2, 1, 2]],
    ["repeat", 1, 2, 1, [1, 0, 4]],
    ["repeat", 1, 2, 0, [3, 0, 2]],
    ["rotate", 0, 2, 1, [1, 1, 3]],
    ["rotate", 1, 2, 1, [0, 0, 5]],
    ["rotate", 1, 4, 1, [1, 0, 4]],
  ] as const)(
    "traces %s requests with key policy %s, capacity %s and scaler change %s",
    (caseId, key, capacity, version, expected) => {
      const result = evaluate(
        "caching-strategies",
        { key, capacity, version },
        caseId,
      );
      const outcomes = graphic(result, "Outcomes");
      expect(outcomes.labels).toEqual([
        "Valid hits",
        "Stale hits",
        "Compute misses",
      ]);
      expect(outcomes.values).toEqual(expected);
      expect(result.answer).toBe(expected[0]);
      expect(expected.reduce<number>((total, count) => total + count, 0)).toBe(
        5,
      );
      expect(result.explanation).toContain("numerical value might match");
    },
  );

  it("the displayed versioned key separates scalers without claiming different model outputs", () => {
    const keyFor = (policy: number, scalerVersion: string) => {
      const result = evaluate("caching-strategies", { key: policy });
      return new Function(
        "input",
        "modelVersion",
        "scalerVersion",
        `${result.code}\nreturn key;`,
      )("A", "m1", scalerVersion);
    };
    expect(keyFor(1, "s1")).not.toBe(keyFor(1, "s2"));
    expect(keyFor(0, "s1")).toBe(keyFor(0, "s2"));
    expect(FLOW_INVESTIGATIONS["caching-strategies"]!.boundary).toContain(
      "makes no predictions",
    );
  });
});
