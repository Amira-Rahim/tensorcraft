import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LessonResultExplanation } from "./lesson-result-explanation";
import { readLessonResultExplanation } from "@/lib/lesson-result-explanations";
import { courseResultFixtures as fixtures } from "./__fixtures__/course-results";
function show(slug: string, stale = false) {
  const artifacts = fixtures[slug]!;
  return render(
    <LessonResultExplanation
      result={readLessonResultExplanation(slug, artifacts)!}
      artifacts={artifacts}
      stale={stale}
      complete
    />,
  );
}
describe("later-module actual-result inspection", () => {
  it("selects the actual frame magnitude and separately names the supplied interval", () => {
    show("build-spectrogram");
    fireEvent.change(screen.getByRole("combobox", { name: "Captured frame" }), {
      target: { value: "1" },
    });
    expect(screen.getByText("32", { selector: "dd" })).toBeInTheDocument();
    expect(
      screen.getByText("64 through 127", { selector: "dd" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/source samples and other spectrum bins are absent/),
    ).toBeInTheDocument();
  });
  it("selects an actual pipeline output without treating the reference as observed intermediates", () => {
    show("pipeline-architecture", true);
    fireEvent.change(screen.getByRole("combobox", { name: "FFT bin" }), {
      target: { value: "4" },
    });
    expect(screen.getAllByText("8", { selector: "dd" }).length).toBeGreaterThan(
      0,
    );
    expect(
      screen.getByText(/does not observe your intermediate stages/),
    ).toBeInTheDocument();
    expect(screen.getByText(/editor has changed/)).toBeInTheDocument();
  });
  it("inspects a line from the returned card with its source calculation", () => {
    show("write-model-card");
    fireEvent.change(screen.getByRole("combobox", { name: "Card line" }), {
      target: { value: "8" },
    });
    expect(
      screen.getByLabelText("Selected captured card line"),
    ).toHaveTextContent("Lowest recall: anomaly at 84.0%");
    expect(
      screen.getByRole("status", { name: "Selected card line reference" }),
    ).toHaveTextContent("Find the minimum again");
  });
});
