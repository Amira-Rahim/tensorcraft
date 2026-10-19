// @vitest-environment node
import { readFileSync } from "node:fs";
import ts from "typescript";
import { describe, expect, it } from "vitest";
import { FLOW_INVESTIGATIONS } from "./flow-investigations";
import { DEEP_ORBIT_VISUALS } from "./deep-orbit-visuals";
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

// Compare activity results with the authored implementation learners build.
function exerciseFunction(slug: string, name: string) {
  const yaml = readFileSync(
    new URL(
      `../../../../../packages/content/content/deep-orbit/llm-integration/exercises/${slug}.yaml`,
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
  return new Function(`${javascript}\nreturn ${name};`)();
}

function reportAssembler() {
  return exerciseFunction("generate-report", "assembleReport") as (
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

  it("keeps the reference diagrams on the exercise's fields and stages", () => {
    const format = DEEP_ORBIT_VISUALS["prompt-engineering"]!.stages!.find(
      (stage) => stage.name === "Format",
    )!;
    expect(new Function(`${format.code}\nreturn required;`)()).toEqual([
      "classification",
      "confidence",
      "reasoning",
    ]);
    expect(
      DEEP_ORBIT_VISUALS["multi-model-systems"]!.stages!.map(
        (stage) => stage.name,
      ),
    ).toEqual(["Classifier", "Detector", "Alert writer"]);
    expect(
      DEEP_ORBIT_VISUALS["report-generation"]!.stages!.at(-1)!.code,
    ).toContain("assembleReport(title, checked)");
  });

  it("matches the authored pipeline for every controlled stage reply and both raw readings", async () => {
    const authoredPipeline = exerciseFunction("model-pipeline", "pipeline");
    for (const caseId of ["calm", "loud"]) {
      for (let classifier = 0; classifier < 4; classifier++) {
        for (let detector = 0; detector < 3; detector++) {
          for (let writer = 0; writer < 2; writer++) {
            const result = evaluate(
              "multi-model-systems",
              { classifier, detector, writer },
              caseId,
            );
            const calls: string[] = [];
            let original: number[] = [];
            const tracedPipeline = async (
              signal: number[],
              classify: (reading: number[]) => Promise<unknown>,
              detect: (reading: number[], label: string) => Promise<unknown>,
              write: (reading: number[], label: string) => Promise<unknown>,
            ) => {
              original = signal;
              return authoredPipeline(
                signal,
                async (reading: number[]) => {
                  expect(reading).toBe(original);
                  calls.push(`Classifier received [${reading.join(", ")}]`);
                  return classify(reading);
                },
                async (reading: number[], label: string) => {
                  expect(reading).toBe(original);
                  calls.push(
                    `Detector received [${reading.join(", ")}] + ${label}`,
                  );
                  return detect(reading, label);
                },
                async (reading: number[], label: string) => {
                  expect(reading).toBe(original);
                  calls.push(
                    `Alert writer received [${reading.join(", ")}] + ${label}`,
                  );
                  return write(reading, label);
                },
              );
            };
            const observed = await new Function(
              "pipeline",
              `return (async () => { ${result.code}\nreturn result; })();`,
            )(tracedPipeline).then(
              (value: {
                classification: string;
                confidence: number;
                isAnomaly: boolean;
                alert: string | null;
              }) => ({ value, failed: false }),
              () => ({ value: null, failed: true }),
            );
            expect(original).toEqual(
              caseId === "loud" ? [1650, 41, -2.4] : [180, 5, 0.3],
            );
            expect(graphic(result, "Calls made this run").values).toEqual(
              calls,
            );
            expect(result.answer).toBe(
              observed.failed
                ? "Run stopped"
                : observed.value!.isAnomaly
                  ? "Alert returned"
                  : "No alert requested",
            );
            const visible = graphic(result, "Pipeline result").values;
            if (observed.failed) {
              expect(visible).toContain("No result returned.");
            } else {
              expect(visible).toEqual([
                `classification: ${observed.value!.classification}`,
                `confidence: ${observed.value!.confidence} (chosen-class score)`,
                `isAnomaly: ${observed.value!.isAnomaly}`,
                observed.value!.alert === null
                  ? "alert: null (writer skipped)"
                  : `alert: ${observed.value!.alert}`,
              ]);
            }
          }
        }
      }
    }
  });

  it.each([
    [{ classifier: 3 }, 1, "finite number from 0 to 1"],
    [{ detector: 2 }, 2, "string. It must return a boolean"],
    [{ writer: 1 }, 3, "only whitespace"],
  ])(
    "explains a failed contract and skips later stages: %o",
    (changes, calls, reason) => {
      const result = evaluate(
        "multi-model-systems",
        changes as Record<string, number>,
      );
      expect(result.answer).toBe("Run stopped");
      expect(graphic(result, "Calls made this run").values).toHaveLength(
        calls as number,
      );
      expect(result.explanation).toContain(reason as string);
    },
  );

  it("lets the detector decide whether to call the writer and carries an unknown class", () => {
    const noAlert = evaluate("multi-model-systems", {
      classifier: 1,
      detector: 0,
      writer: 1,
    });
    expect(noAlert.answer).toBe("No alert requested");
    expect(graphic(noAlert, "Calls made this run").values).toHaveLength(2);
    expect(graphic(noAlert, "Pipeline result").values).toContain(
      "alert: null (writer skipped)",
    );
    const unknown = evaluate("multi-model-systems", {
      classifier: 2,
      detector: 1,
    });
    expect(unknown.answer).toBe("Alert returned");
    expect(graphic(unknown, "Pipeline result").values).toContain(
      "classification: unknown",
    );
    expect(graphic(unknown, "Calls made this run").values[1]).toContain(
      "+ unknown",
    );
    expect(unknown.explanation).toContain(
      "unsupported classifier label becomes unknown",
    );
    expect(FLOW_INVESTIGATIONS["multi-model-systems"]!.boundary).toContain(
      "No classifier, detector or language model runs",
    );
  });

  it.each([
    {
      name: "three approved sections",
      caseId: "full",
      changes: {},
      expected: [true, true, true],
      withheld: [],
    },
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
      const assembled = new Function(
        `${result.code}\nreturn { sections, report };`,
      )() as {
        sections: Array<{
          heading: string;
          content: string;
          validated: boolean;
        }>;
        report: string;
      };
      expect(assembled.sections.map((section) => section.validated)).toEqual(
        expected,
      );
      expect(result.answer).toBe(expected.filter(Boolean).length);
      const report = reportAssembler()("Relay Report", assembled.sections);
      expect(assembled.report).toBe(report);
      const displayed = graphic(result, "Assembled relay report").values;
      expect(displayed[0]).toBe("# Relay Report");
      expect(
        "# Relay Report\n\n" + displayed.slice(1).join("\n\n---\n\n"),
      ).toBe(report);
      if (withheld.length) expect(report).toContain("## Withheld");
      else expect(report).not.toContain("## Withheld");
      for (const section of assembled.sections) {
        if (withheld.includes(section.heading)) {
          expect(report).toContain(`- ${section.heading}`);
          if (section.content) expect(report).not.toContain(section.content);
        } else {
          expect(report).toContain(
            `## ${section.heading}\n\n${section.content}`,
          );
        }
      }
      expect(result.explanation).toContain("assembler does not check claims");
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
        "Cache misses",
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
