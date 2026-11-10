import { courseResultFixtures } from "../../apps/web/app/components/__fixtures__/course-results";
// Predetermined browser data exercises the production presentation only.
// The separate Worker contract tests establish capture/decoder integration.
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { type ExerciseArtifact } from "@tensorcraft/ui";
import { LessonResultExplanation } from "../../apps/web/app/components/lesson-result-explanation";
import { readLessonResultExplanation } from "../../apps/web/lib/lesson-result-explanations";
import {
  gradientArtifacts,
  sensorArtifacts,
  denseForwardArtifacts,
  lossArtifacts,
  scalarArtifacts,
  historyArtifacts,
} from "../../apps/web/app/components/__fixtures__/lesson-results";
import "../../apps/web/app/globals.css";
import {
  policyArtifacts,
  inferenceArtifacts,
  capacityArtifacts,
  reportArtifacts,
  parityArtifacts,
} from "../../apps/web/app/components/__fixtures__/runtime-results";

function Fixture() {
  const [scenario, setScenario] = useState("arrange");
  const [stale, setStale] = useState(false);
  const [complete, setComplete] = useState(true);
  const runtimeSlug = scenario.startsWith("policy")
    ? "browser-ml-tradeoffs"
    : scenario.startsWith("inference")
      ? "inference-pipeline"
      : scenario.startsWith("capacity")
        ? "incident-tensor-leak"
        : scenario.startsWith("reports")
          ? "load-pretrained-pipeline"
          : scenario.startsWith("parity")
            ? "onnx-comparison"
            : null;
  const trainingSlug =
    scenario === "loss" || scenario === "loss-wrong"
      ? "mse-loss"
      : scenario === "scalar"
        ? "gradient-step"
        : scenario.startsWith("history")
          ? "training-loop-exercise"
          : null;
  const courseSlug = Object.hasOwn(courseResultFixtures, scenario)
    ? scenario
    : null;
  const slug =
    courseSlug ??
    runtimeSlug ??
    trainingSlug ??
    (scenario.startsWith("forward")
      ? "forward-pass"
      : scenario === "gradient"
        ? "backprop-chain"
        : scenario === "create"
          ? "create-a-tensor"
          : "reshape-tensor");
  const artifacts: ExerciseArtifact[] = courseSlug
    ? structuredClone(courseResultFixtures[courseSlug]!)
    : runtimeSlug === "browser-ml-tradeoffs"
      ? policyArtifacts()
      : runtimeSlug === "inference-pipeline"
        ? inferenceArtifacts()
        : runtimeSlug === "incident-tensor-leak"
          ? capacityArtifacts()
          : runtimeSlug === "load-pretrained-pipeline"
            ? reportArtifacts()
            : runtimeSlug === "onnx-comparison"
              ? parityArtifacts()
              : trainingSlug === "mse-loss"
                ? lossArtifacts()
                : trainingSlug === "gradient-step"
                  ? scalarArtifacts()
                  : trainingSlug === "training-loop-exercise"
                    ? historyArtifacts(scenario === "history-short" ? 5 : 500)
                    : scenario.startsWith("forward")
                      ? denseForwardArtifacts()
                      : scenario === "gradient"
                        ? gradientArtifacts()
                        : sensorArtifacts(slug);
  if (scenario.endsWith("-wrong") && runtimeSlug) {
    const table = artifacts[scenario === "policy-wrong" ? 0 : 1]!;
    if (table.kind !== "table") throw Error("Expected runtime fixture");
    if (scenario === "policy-wrong") table.rows[0]![4] = "server";
    if (scenario === "inference-wrong") table.rows[0]![2] = 0.25;
    if (scenario === "capacity-wrong") table.rows[0]![2] = 902;
    if (scenario === "reports-wrong") table.rows[0]![1] = "POS";
    if (scenario === "parity-wrong") table.rows[0]![0] = false;
  }
  if (scenario === "loss-wrong") {
    const table = artifacts[1]!;
    if (table.kind !== "table") throw Error("Expected loss fixture");
    table.rows[1]![1] = 0;
  }
  if (scenario === "history-threw") {
    const table = artifacts[1]!;
    if (table.kind !== "table") throw Error("Expected diagnosis fixture");
    table.rows[9]![1] = "threw";
    table.rows[10]![1] = null;
    table.rows[11]![1] = "Predetermined diagnostic error";
  }
  if (scenario === "forward-different") {
    const table = artifacts[0]!;
    if (table.kind !== "table") throw Error("Expected forward fixture table");
    table.rows[0]![3] = 902;
  }
  if (scenario === "different") {
    const chart = artifacts[0]!;
    if (chart.kind !== "series") throw Error("Expected fixture chart");
    chart.series[0]!.values[0] = 902;
  }
  // A preceding artifact verifies that chart linkage uses the decoded index.
  if (artifacts.length < 4)
    artifacts.unshift({
      kind: "text",
      title: "Browser capture context",
      text: "Predetermined test values. This fixture executes no learner code.",
    });
  const result = readLessonResultExplanation(slug, artifacts);
  if (!result) throw Error("The known browser fixture did not decode");
  return (
    <main
      className="lesson-page deep-orbit-lesson mx-auto max-w-5xl p-4"
      data-testid="lesson-result-fixture"
    >
      <h1 className="text-2xl font-semibold">Lesson result browser fixture</h1>
      <p className="my-3 text-base">
        Predetermined captures check the production viewer and styles. This page
        executes no learner code and makes no account or network writes.
      </p>
      <fieldset className="grid gap-4 my-6 border border-border p-4">
        <legend className="text-lg font-semibold">
          Browser fixture controls
        </legend>
        <label className="grid gap-2">
          Fixture scenario
          <select
            className="min-h-11 max-w-full border border-border bg-page px-3 py-2"
            value={scenario}
            onChange={(event) => setScenario(event.target.value)}
          >
            {Object.keys(courseResultFixtures).map((slug) => (
              <option key={slug} value={slug}>
                {slug}
              </option>
            ))}
            <option value="arrange">Tensor arrangement capture</option>
            <option value="create">Tensor creation capture</option>
            <option value="different">Different captured value</option>
            <option value="gradient">Gradient capture</option>
            <option value="forward">Forward pass capture</option>
            <option value="forward-different">Different forward output</option>
            <option value="loss">Loss captures</option>
            <option value="loss-wrong">Wrong returned loss</option>
            <option value="scalar">Scalar update captures</option>
            <option value="history">Long training history</option>
            <option value="history-short">Short training history</option>
            <option value="history-threw">Thrown diagnosis</option>
            <option value="policy">Deployment policy</option>
            <option value="policy-wrong">Wrong deployment decision</option>
            <option value="inference">Inference trace</option>
            <option value="inference-wrong">Wrong selected-class score</option>
            <option value="capacity">Capacity estimate</option>
            <option value="capacity-wrong">Wrong capacity projection</option>
            <option value="reports">Report pairing</option>
            <option value="reports-wrong">Wrong report pairing</option>
            <option value="parity">Runtime parity</option>
            <option value="parity-wrong">Wrong parity decision</option>
          </select>
        </label>
        <label className="flex items-center gap-3 min-h-11">
          <input
            type="checkbox"
            checked={stale}
            onChange={(event) => setStale(event.target.checked)}
          />
          Editor changed after capture
        </label>
        <label className="flex items-center gap-3 min-h-11">
          <input
            type="checkbox"
            checked={complete}
            onChange={(event) => setComplete(event.target.checked)}
          />
          All checks passed
        </label>
      </fieldset>
      <div className="lesson-prose">
        <LessonResultExplanation
          key={scenario}
          result={result}
          artifacts={artifacts}
          stale={stale}
          complete={complete}
        />
      </div>
    </main>
  );
}

createRoot(document.getElementById("root")!).render(<Fixture />);
