import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { axe } from "vitest-axe";
import { readLessonResultExplanation } from "@/lib/lesson-result-explanations";
import { LessonResultExplanation } from "./lesson-result-explanation";
import {
  sensorArtifacts,
  gradientArtifacts,
  denseForwardArtifacts,
} from "./__fixtures__/lesson-results";

function sensorView(complete = true, stale = false) {
  const artifacts = sensorArtifacts();
  const result = readLessonResultExplanation("reshape-tensor", artifacts)!;
  return render(
    <LessonResultExplanation
      result={result}
      artifacts={artifacts}
      complete={complete}
      stale={stale}
    />,
  );
}
const value = (label: string) =>
  screen.getByText(label, { selector: "dt" }).nextElementSibling;

describe("current-result explanation", () => {
  it("links chart selection, source position, and equal readings without changing them", () => {
    sensorView();
    fireEvent.change(screen.getByLabelText("Sensor"), {
      target: { value: "3" },
    });
    expect(value("Index in supplied flat list")).toHaveTextContent("3");
    const chart = screen.getByRole("group", { name: "Choose a series" });
    expect(
      within(chart).getByRole("button", { name: "Sensor D" }),
    ).toHaveAttribute("aria-pressed", "true");
    fireEvent.change(screen.getByLabelText("Selected moment"), {
      target: { value: "1" },
    });
    expect(value("Value in captured chart")).toHaveTextContent("8");
    expect(value("Index in supplied flat list")).toHaveTextContent("7");
    fireEvent.click(within(chart).getByRole("button", { name: "Sensor B" }));
    expect(screen.getByLabelText("Sensor")).toHaveValue("1");
    expect(value("Value in captured chart")).toHaveTextContent("18");
    const source = screen.getByRole("list", {
      name: "Supplied recording in flat order",
    });
    fireEvent.click(
      within(source).getByRole("button", { name: /D at 1.*flat index 3/ }),
    );
    expect(value("Index in supplied flat list")).toHaveTextContent("3");
    expect(screen.getByLabelText("Selected moment")).toHaveValue("0");
    fireEvent.click(within(chart).getByRole("button", { name: "All series" }));
    expect(
      within(chart).getByRole("button", { name: "All series" }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("shows a captured disagreement and stale/partial state without substituting a reference answer", () => {
    const artifacts = sensorArtifacts();
    const chart = artifacts[0]!;
    if (chart.kind !== "series") throw Error("Expected chart");
    chart.series[0]!.values[0] = 902;
    render(
      <LessonResultExplanation
        result={readLessonResultExplanation("reshape-tensor", artifacts)!}
        artifacts={artifacts}
        complete={false}
        stale
      />,
    );
    expect(value("Value in supplied recording")).toHaveTextContent("2");
    expect(value("Value in captured chart")).toHaveTextContent("902");
    expect(
      screen.getByText(/It differs from the supplied reading/),
    ).toBeVisible();
    expect(
      screen.getByText(/This explanation belongs to the submitted code/),
    ).toBeVisible();
  });

  it("keeps gradient estimates and forward counts distinct from updates and speed", () => {
    const artifacts = gradientArtifacts();
    render(
      <LessonResultExplanation
        result={readLessonResultExplanation("backprop-chain", artifacts)!}
        artifacts={artifacts}
        complete={false}
        stale={false}
      />,
    );
    expect(value("Captured automatic gradient")).toHaveTextContent("0.32");
    expect(value("Captured numerical estimate")).toHaveTextContent("0.321");
    expect(value("Automatic forward calculations")).toHaveTextContent("1");
    expect(value("Numerical forward calculations")).toHaveTextContent("6");
    fireEvent.change(screen.getByLabelText("Variable"), {
      target: { value: "1" },
    });
    expect(value("Captured automatic gradient")).toHaveTextContent("-1");
    expect(
      screen.getByText(/Gradient values alone cannot confirm that restoration/),
    ).toBeVisible();
    expect(screen.getByText(/Some checks still need attention/)).toBeVisible();
  });

  it("keeps labeled controls and the linked result accessible", async () => {
    const { container } = sensorView();
    expect(await axe(container)).toHaveNoViolations();
  });

  it("traces a selected forward output through its captured kernel column and bias", async () => {
    const artifacts = denseForwardArtifacts();
    const { container } = render(
      <LessonResultExplanation
        result={readLessonResultExplanation("forward-pass", artifacts)!}
        artifacts={artifacts}
        complete
        stale={false}
      />,
    );
    fireEvent.change(screen.getByRole("combobox", { name: "Reading" }), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByRole("combobox", { name: "Output unit" }), {
      target: { value: "2" },
    });
    const terms = screen.getByRole("list", {
      name: "Captured inputs and their contributions",
    });
    expect(terms).toHaveTextContent(
      "Input 1: 3 times captured weight 2 gives 6",
    );
    expect(terms).toHaveTextContent(
      "Input 2: 4 times captured weight -0.5 gives -2",
    );
    expect(value("Captured bias")).toHaveTextContent("-0.3");
    expect(value("Sum of captured terms and bias")).toHaveTextContent("3.7");
    expect(value("Captured output")).toHaveTextContent("3.7");
    expect(value("Difference from that sum")).toHaveTextContent("0");
    expect(await axe(container)).toHaveNoViolations();
  });

  it("keeps a partial forward output separate from the calculated sum", () => {
    const artifacts = denseForwardArtifacts();
    const values = artifacts[0]!;
    if (values.kind !== "table") throw Error("Expected table");
    values.rows[0]![3] = 902;
    render(
      <LessonResultExplanation
        result={readLessonResultExplanation("forward-pass", artifacts)!}
        artifacts={artifacts}
        complete={false}
        stale
      />,
    );
    expect(value("Captured output")).toHaveTextContent("902");
    expect(value("Sum of captured terms and bias")).toHaveTextContent("2.6");
    expect(value("Difference from that sum")).toHaveTextContent("899.4");
    expect(
      screen.getByText(/This explanation belongs to the submitted code/),
    ).toBeVisible();
    expect(
      screen.getByText(/Your code has changed. Run it again/),
    ).toBeVisible();
  });

  it("keeps finite captured outputs when calculating their terms exceeds JavaScript's finite range", () => {
    const artifacts = denseForwardArtifacts();
    const values = artifacts[0]!;
    if (values.kind !== "table") throw Error("Expected table");
    values.rows[0]![1] = Number.MAX_VALUE;
    values.rows[0]![2] = Number.MAX_VALUE;
    render(
      <LessonResultExplanation
        result={readLessonResultExplanation("forward-pass", artifacts)!}
        artifacts={artifacts}
        complete={false}
        stale={false}
      />,
    );
    expect(value("Captured output")).toHaveTextContent("2.6");
    expect(value("Sum of captured terms and bias")).toHaveTextContent(
      "Outside JavaScript’s finite number range",
    );
  });
});
