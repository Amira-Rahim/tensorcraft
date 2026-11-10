import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import type { ExerciseArtifact } from "@tensorcraft/ui";
import { readLessonResultExplanation } from "@/lib/lesson-result-explanations";
import { LessonResultExplanation } from "./lesson-result-explanation";
import {
  policyArtifacts,
  inferenceArtifacts,
  capacityArtifacts,
  reportArtifacts,
  parityArtifacts,
} from "./__fixtures__/runtime-results";

const value = (label: string) =>
  screen.getByText(label, { selector: "dt" }).nextElementSibling;
function view(
  slug: string,
  artifacts: ExerciseArtifact[],
  complete = true,
  stale = false,
) {
  const result = readLessonResultExplanation(slug, artifacts);
  if (!result) throw Error("Expected fixture");
  return render(
    <LessonResultExplanation
      result={result}
      artifacts={artifacts}
      complete={complete}
      stale={stale}
    />,
  );
}
function table(artifacts: ExerciseArtifact[], i: number) {
  const item = artifacts[i];
  if (item?.kind !== "table") throw Error("Expected table");
  return item;
}
describe("runtime result explanations", () => {
  it("does not call overflow or an underflowed positive rate a flat trend", () => {
    const artifacts = capacityArtifacts();
    table(artifacts, 0).rows[0]![1] = -1e308;
    table(artifacts, 0).rows[1]![1] = 1e308;
    view("incident-tensor-leak", artifacts, false);
    fireEvent.change(screen.getByLabelText("Projection calculation"), {
      target: { value: "4" },
    });
    expect(value("Selected calculation reference")).toHaveTextContent(
      "Outside JavaScript’s finite number range",
    );
    expect(
      screen.queryByText("No projected growth deadline"),
    ).not.toBeInTheDocument();
    expect(value("Your returned hours to budget")).toHaveTextContent("79");
  });
  it("distinguishes both result landmarks when a lesson has two exercises", async () => {
    const inference = inferenceArtifacts(),
      capacity = capacityArtifacts();
    const { container } = render(
      <>
        <LessonResultExplanation
          result={readLessonResultExplanation("inference-pipeline", inference)!}
          artifacts={inference}
          complete
          stale={false}
          scopeLabel="Inference pipeline"
        />
        <LessonResultExplanation
          result={readLessonResultExplanation(
            "incident-tensor-leak",
            capacity,
          )!}
          artifacts={capacity}
          complete
          stale={false}
          scopeLabel="Tensor capacity estimate"
        />
      </>,
    );
    expect(
      screen.getByRole("region", {
        name: "Inference pipeline: explanation of your captured result",
      }),
    ).toBeVisible();
    expect(
      screen.getByRole("region", {
        name: "Tensor capacity estimate: output from your code",
      }),
    ).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });
  it("keeps a wrong recommendation separate from hard local requirements and strict boundaries", async () => {
    const artifacts = policyArtifacts();
    table(artifacts, 0).rows[0]![4] = "server";
    const { container } = view("browser-ml-tradeoffs", artifacts, false, true);
    expect(value("Your returned recommendation")).toHaveTextContent("server");
    expect(value("Reference from the stated policy")).toHaveTextContent(
      "reconsider",
    );
    fireEvent.change(screen.getByLabelText("Policy probe"), {
      target: { value: "3" },
    });
    expect(value("Reference from the stated policy")).toHaveTextContent(
      "client",
    );
    fireEvent.change(screen.getByLabelText("Policy probe"), {
      target: { value: "4" },
    });
    expect(value("Reference from the stated policy")).toHaveTextContent(
      "server",
    );
    expect(screen.getByText(/The editor has changed/)).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });
  it("links raw fields, reference scaling, observed inputs and the actual returned score", async () => {
    const artifacts = inferenceArtifacts();
    table(artifacts, 1).rows[0]![2] = 0.25;
    const { container } = view("inference-pipeline", artifacts, false);
    expect(value("Your selected-class score")).toHaveTextContent("0.25");
    expect(value("Score from the stated class rule")).toHaveTextContent("0.75");
    fireEvent.change(screen.getByLabelText("Feature"), {
      target: { value: "2" },
    });
    expect(value("Feature position in the model row")).toHaveTextContent("2");
    expect(value("JavaScript scaling reference")).toHaveTextContent("0.75");
    expect(value("Observed value at model.predict")).toHaveTextContent("0.75");
    expect(value("Separate cleanup probe: count change")).toHaveTextContent(
      "0",
    );
    expect(await axe(container)).toHaveNoViolations();
  });
  it("traces the capacity arithmetic without replacing a wrong projection or claiming its cause", async () => {
    const artifacts = capacityArtifacts();
    table(artifacts, 1).rows[0]![2] = 902;
    const { container } = view("incident-tensor-leak", artifacts, false);
    fireEvent.change(screen.getByLabelText("Projection calculation"), {
      target: { value: "4" },
    });
    expect(value("Selected calculation reference")).toHaveTextContent("79");
    expect(value("Your returned hours to budget")).toHaveTextContent("902");
    expect(
      screen.getByText(/These counts cannot identify a leak/),
    ).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });
  it("retains mismatched and duplicated returned report pairs", async () => {
    const artifacts = reportArtifacts();
    table(artifacts, 1).rows[0]![1] = "POS";
    const { container } = view("load-pretrained-pipeline", artifacts, false);
    fireEvent.change(screen.getByLabelText("Original report"), {
      target: { value: "1" },
    });
    expect(value("Supplied sentiment label")).toHaveTextContent("NEG");
    expect(value("Your returned label")).toHaveTextContent("POS");
    expect(screen.getByText(/differ from the supplied pair/)).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });
  it("keeps parity, returned decision and simulated intervals separate from performance", async () => {
    const artifacts = parityArtifacts();
    table(artifacts, 1).rows[0]![0] = false;
    const { container } = view("onnx-comparison", artifacts, false);
    fireEvent.change(screen.getByLabelText("Input position"), {
      target: { value: "2" },
    });
    expect(value("Observed TFJS input")).toHaveTextContent("0.31");
    expect(value("Reference outputs agree")).toHaveTextContent("true");
    expect(value("Your returned outputsAgree")).toHaveTextContent("false");
    expect(
      screen.getByText(/These intervals measure no device speed/),
    ).toBeVisible();
    expect(await axe(container)).toHaveNoViolations();
  });
});
