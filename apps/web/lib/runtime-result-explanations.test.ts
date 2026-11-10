// @vitest-environment node
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { parseAndRunTests } from "../../../packages/ui/src/mdx/exercise-runner-node";
import {
  readLessonResultExplanation,
  supportsLessonResultExplanation,
} from "./lesson-result-explanations";
import { policyReference } from "./runtime-result-explanations";
import {
  policyArtifacts,
  inferenceArtifacts,
  capacityArtifacts,
  reportArtifacts,
  parityArtifacts,
} from "../app/components/__fixtures__/runtime-results";
import type { ExerciseArtifact } from "@tensorcraft/ui";

const fixtures = [
  ["browser-ml-tradeoffs", policyArtifacts, "deployment-policy"],
  ["inference-pipeline", inferenceArtifacts, "inference-trace"],
  ["incident-tensor-leak", capacityArtifacts, "capacity-estimate"],
  ["load-pretrained-pipeline", reportArtifacts, "report-pairing"],
  ["onnx-comparison", parityArtifacts, "runtime-parity"],
] as const;
const contentRequire = createRequire(
  new URL("../../../packages/content/package.json", import.meta.url),
);
const { parse } = createRequire(contentRequire.resolve("velite"))("yaml");
function exercise(slug: string): {
  solutionCode: string;
  testCode: string;
  starterCode: string;
} {
  return parse(
    readFileSync(
      new URL(
        `../../../packages/content/content/deep-orbit/browser-runtimes/exercises/${slug}.yaml`,
        import.meta.url,
      ),
      "utf8",
    ),
  );
}
function table(artifacts: ExerciseArtifact[], i: number) {
  const row = artifacts[i];
  if (row?.kind !== "table") throw Error("Expected table");
  return row;
}
describe("bounded runtime result contracts", () => {
  it.each(fixtures)(
    "decodes %s and rejects missing, duplicate, or malformed roles",
    (slug, fixture, kind) => {
      const artifacts = fixture();
      expect(supportsLessonResultExplanation(slug)).toBe(true);
      expect(readLessonResultExplanation(slug, artifacts)?.kind).toBe(kind);
      expect(readLessonResultExplanation(slug, [])).toBeNull();
      artifacts.push(artifacts[0]!);
      expect(readLessonResultExplanation(slug, artifacts)).toBeNull();
      artifacts.pop();
      table(artifacts, 0).columns.reverse();
      expect(readLessonResultExplanation(slug, artifacts)).toBeNull();
      expect(
        readLessonResultExplanation(slug, Array(5).fill(fixture()[0])),
      ).toBeNull();
    },
  );
  it("keeps policy boundaries and source-group partial output explicit", () => {
    const base = {
      source: "probe",
      size: 50,
      latency: 50,
      sensitive: false,
      offline: false,
      returned: "wrong",
    };
    expect(policyReference(base).decision).toBe("server");
    expect(policyReference({ ...base, latency: 49 }).decision).toBe("client");
    expect(policyReference({ ...base, sensitive: true }).decision).toBe(
      "client",
    );
    expect(
      policyReference({ ...base, size: 51, sensitive: true }).decision,
    ).toBe("reconsider");
    expect(policyReference({ ...base, size: 51, latency: 1 }).decision).toBe(
      "server",
    );
    expect(
      readLessonResultExplanation(
        "browser-ml-tradeoffs",
        policyArtifacts().slice(0, 1),
      )?.kind,
    ).toBe("deployment-policy");
  });
  it("retains mismatched report pairings, duplicate returned texts, and wrong numeric values", () => {
    const reports = reportArtifacts();
    table(reports, 1).rows[0]![1] = "POS";
    table(reports, 1).rows[1]![0] = "coolant loop warning";
    expect(
      readLessonResultExplanation("load-pretrained-pipeline", reports)?.kind,
    ).toBe("report-pairing");
    const capacity = capacityArtifacts();
    table(capacity, 1).rows[0]![2] = 902;
    const decoded = readLessonResultExplanation(
      "incident-tensor-leak",
      capacity,
    );
    expect(
      decoded?.kind === "capacity-estimate" && decoded.returned.hours,
    ).toBe(902);
    const inference = inferenceArtifacts();
    table(inference, 1).rows[0]![1] = "anomaly";
    expect(
      readLessonResultExplanation("inference-pipeline", inference)?.kind,
    ).toBe("inference-trace");
    const parity = parityArtifacts();
    table(parity, 1).rows[0]![0] = false;
    expect(readLessonResultExplanation("onnx-comparison", parity)?.kind).toBe(
      "runtime-parity",
    );
  });
  it.each([
    "feature-order",
    "range",
    "memory",
    "position",
    "source-duplicate",
    "runtime-order",
    "capacity-time",
    "nonfinite",
  ])("falls back for invalid %s metadata", (failure) => {
    let slug = "inference-pipeline",
      artifacts = inferenceArtifacts();
    if (failure === "feature-order") table(artifacts, 0).rows.reverse();
    if (failure === "range") table(artifacts, 0).rows[0]![3] = 0;
    if (failure === "memory") table(artifacts, 3).rows[0]![0] = -0.5;
    if (failure === "position" || failure === "source-duplicate") {
      slug = "load-pretrained-pipeline";
      artifacts = reportArtifacts();
      table(artifacts, 0).rows[1]![failure === "position" ? 0 : 1] =
        failure === "position" ? 1 : "coupling nominal";
    }
    if (failure === "runtime-order") {
      slug = "onnx-comparison";
      artifacts = parityArtifacts();
      table(artifacts, 0).rows.reverse();
    }
    if (failure === "capacity-time") {
      slug = "incident-tensor-leak";
      artifacts = capacityArtifacts();
      table(artifacts, 0).rows[1]![1] = 0;
    }
    if (failure === "nonfinite") table(artifacts, 1).rows[0]![0] = Infinity;
    expect(readLessonResultExplanation(slug, artifacts)).toBeNull();
  });
});
describe("real shipped runtime Worker captures", () => {
  it.each(fixtures)(
    "preserves canonical checks and captures for %s",
    { timeout: 30000 },
    async (slug, _fixture, kind) => {
      const source = exercise(slug),
        run = await parseAndRunTests(source.solutionCode, source.testCode);
      expect(run.errored).not.toBe(true);
      expect(run.results.filter((row) => !row.passed)).toEqual([]);
      expect(run.results).toHaveLength(slug === "onnx-comparison" ? 2 : 5);
      expect(run.artifacts).toHaveLength(
        slug === "browser-ml-tradeoffs"
          ? 3
          : slug === "inference-pipeline"
            ? 4
            : 2,
      );
      const result = readLessonResultExplanation(slug, run.artifacts);
      expect(result?.kind).toBe(kind);
      if (result?.kind === "inference-trace") {
        expect(result.features[1]!.observed).toBe(Math.fround(1 / 3));
        expect(result.output).toBe(0.25);
      }
      if (result?.kind === "runtime-parity") {
        expect(result.runs[0]!.inputs).toEqual(
          [0.42, 0.66, 0.31].map(Math.fround),
        );
        expect(result.runs[1]!.inputs).toEqual(result.runs[0]!.inputs);
      }
    },
  );
  it.each(fixtures)(
    "retains useful failed output from %s",
    { timeout: 30000 },
    async (slug, _fixture, kind) => {
      const source = exercise(slug);
      let code = source.solutionCode;
      if (slug === "browser-ml-tradeoffs")
        code = code.replace(
          "mustStayLocal ? 'reconsider' : 'server'",
          "'server'",
        );
      if (slug === "inference-pipeline")
        code = code.replace(
          /confidence: p > 0.5 \? p : 1 - p/,
          "confidence: p",
        );
      if (slug === "incident-tensor-leak")
        code = code.replace(
          "(budgetTensors - last.numTensors) / ratePerHour",
          "budgetTensors / ratePerHour",
        );
      if (slug === "load-pretrained-pipeline")
        code = code.replace(
          "const predictions = await classifier(reports);",
          "const predictions = await classifier(reports); predictions.sort((a,b)=>b.score-a.score);",
        );
      if (slug === "onnx-comparison")
        code = code.replace(
          "outputsAgree: Math.abs(tfjsValue - onnxValue) <= 0.0001",
          "outputsAgree: false",
        );
      expect(code).not.toBe(source.solutionCode);
      const run = await parseAndRunTests(code, source.testCode);
      expect(run.results.some((row) => !row.passed)).toBe(true);
      const decoded = readLessonResultExplanation(slug, run.artifacts);
      expect(decoded?.kind).toBe(kind);
      if (decoded?.kind === "inference-trace") expect(decoded.score).toBe(0.25);
      if (decoded?.kind === "runtime-parity")
        expect(decoded.returned).toBe(false);
      if (decoded?.kind === "report-pairing")
        expect(
          decoded.returned.find((row) => row.text === "coolant loop warning")
            ?.label,
        ).toBe("POS");
    },
  );
});
