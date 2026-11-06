import { afterEach, describe, expect, it } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { FLOW_INVESTIGATIONS } from "./flow-investigations";
import { LessonInvestigation } from "./lesson-investigation";

afterEach(cleanup);

describe("the GPU workload activity", () => {
  it("keeps workload totals and their components on one time axis across runs", () => {
    render(
      <LessonInvestigation
        spec={FLOW_INVESTIGATIONS["webgpu-acceleration"]!}
        lessonSlug="webgpu-acceleration"
      />,
    );
    const run = screen.getByRole("button", { name: "Run experiment" });
    fireEvent.change(screen.getByLabelText("GPU initialization"), {
      target: { value: "0" },
    });
    fireEvent.click(run);
    for (const name of ["End-to-end time (ms)", "GPU time components (ms)"]) {
      expect(screen.getByRole("img", { name })).toHaveAttribute(
        "data-domain-high",
        "56",
      );
    }

    fireEvent.change(screen.getByRole("slider", { name: "Workload units" }), {
      target: { value: "50" },
    });
    fireEvent.click(run);
    fireEvent.click(
      screen.getByRole("button", { name: "Compare with previous run" }),
    );
    for (const region of ["Previous run", "Latest run"]) {
      for (const name of ["End-to-end time (ms)", "GPU time components (ms)"]) {
        expect(
          within(screen.getByRole("region", { name: region })).getByRole(
            "img",
            { name },
          ),
        ).toHaveAttribute("data-domain-high", "100");
      }
    }
  });
});

describe("the assembled report activity", () => {
  it("shows approved text and a separate omission block in full-width prose cells", () => {
    render(
      <LessonInvestigation
        spec={FLOW_INVESTIGATIONS["report-generation"]!}
        lessonSlug="report-generation"
      />,
    );
    fireEvent.change(screen.getByLabelText("Analysis claim"), {
      target: { value: "1" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));

    const report = screen.getByRole("list", { name: "Assembled relay report" });
    expect(report).toHaveClass("orbit-investigation-prose");
    expect(report).toHaveStyle({
      gridTemplateColumns: "repeat(1, minmax(52px, 1fr))",
    });
    expect(report.querySelector(".orbit-investigation-stage")).toBeNull();
    const blocks = within(report).getAllByRole("listitem");
    expect(blocks).toHaveLength(4);
    expect(blocks[1]!.textContent).toContain(
      "## Observations\n\nThe capture has frequency 8 Hz and amplitude 0.4. Source: S7.",
    );
    expect(blocks[2]!.textContent).toContain("## Limits\n\n");
    expect(blocks[3]!.textContent).toContain("Omission notice");
    expect(blocks[3]!.textContent).toContain("## Withheld\n\n- Analysis");
    expect(report).not.toHaveTextContent("reply from an artificial source");
    expect(
      screen.getByRole("list", {
        name: "Draft and supplied review conditions",
      }),
    ).not.toHaveClass("orbit-investigation-prose");
  });

  it("keeps all withheld headings visible without presenting rejected text as a report", () => {
    render(
      <LessonInvestigation
        spec={FLOW_INVESTIGATIONS["report-generation"]!}
        lessonSlug="report-generation"
      />,
    );
    fireEvent.change(screen.getByLabelText("Choose an example"), {
      target: { value: "partial" },
    });
    fireEvent.change(screen.getByLabelText("Analysis claim"), {
      target: { value: "1" },
    });
    fireEvent.change(screen.getByLabelText("Limits section"), {
      target: { value: "0" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));

    const report = screen.getByRole("list", { name: "Assembled relay report" });
    expect(within(report).getAllByRole("listitem")).toHaveLength(2);
    expect(report.textContent).toContain(
      "## Withheld\n\n- Observations\n- Analysis\n- Limits",
    );
    expect(report).not.toHaveTextContent("Approved section");
    expect(report).not.toHaveTextContent("amplitude 0.4");
    expect(report).not.toHaveTextContent("reply from an artificial source");
  });
});
