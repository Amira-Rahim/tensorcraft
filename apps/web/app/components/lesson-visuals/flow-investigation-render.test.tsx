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

describe("the ordered backend startup activity", () => {
  it("keeps call counts comparable across ordered success and all-failed traces", () => {
    render(
      <LessonInvestigation
        spec={FLOW_INVESTIGATIONS["webgpu-acceleration"]!}
        lessonSlug="webgpu-acceleration"
      />,
    );
    const run = screen.getByRole("button", { name: "Run experiment" });
    fireEvent.click(run);
    expect(
      screen.getByRole("img", { name: "Controlled call counts" }),
    ).toHaveAttribute("data-domain-high", "3");
    expect(
      screen.getByRole("status", { name: "Experiment status" }),
    ).toHaveTextContent("Selector result: wasm");
    const attempts = screen.getByRole("list", {
      name: "Initialization attempts",
    });
    expect(attempts).toHaveTextContent("webgpu: false");
    expect(attempts).toHaveTextContent("webgl: throws");
    expect(attempts).toHaveTextContent("wasm: true");
    expect(attempts).not.toHaveTextContent("cpu:");
    fireEvent.change(screen.getByLabelText("First successful attempt"), {
      target: { value: "4" },
    });
    fireEvent.click(run);
    fireEvent.click(
      screen.getByRole("button", { name: "Compare with previous run" }),
    );
    for (const region of ["Previous run", "Latest run"]) {
      expect(
        within(screen.getByRole("region", { name: region })).getByRole("img", {
          name: "Controlled call counts",
        }),
      ).toHaveAttribute("data-domain-high", "4");
    }
    const latest = screen.getByRole("region", { name: "Latest run" });
    expect(latest).toHaveTextContent("prior-backend");
    expect(
      within(latest).getByRole("list", { name: "Initialization attempts" }),
    ).toHaveTextContent("cpu:");
    fireEvent.change(screen.getByLabelText("Readiness outcome"), {
      target: { value: "1" },
    });
    fireEvent.click(run);
    expect(
      screen.getByRole("status", { name: "Experiment status" }),
    ).toHaveTextContent("Startup rejects");
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
    fireEvent.change(screen.getByLabelText("Section to inspect"), {
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
      "## Executive Summary\n\n12,001 events catalogued.",
    );
    expect(blocks[2]!.textContent).toContain("## Results\n\n");
    expect(blocks[3]!.textContent).toContain("Omission notice");
    expect(blocks[3]!.textContent).toContain("## Withheld\n\n- Hypotheses");
    expect(report).not.toHaveTextContent("The pulse train is a reply.");
    expect(
      screen.getByRole("list", {
        name: "Selected section handoff",
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
    fireEvent.change(screen.getByLabelText("Review flags"), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Run experiment" }));

    const report = screen.getByRole("list", { name: "Assembled relay report" });
    expect(within(report).getAllByRole("listitem")).toHaveLength(2);
    expect(report.textContent).toContain(
      "## Withheld\n\n- Executive Summary\n- Hypotheses\n- Results",
    );
    expect(report).not.toHaveTextContent("Approved section");
    expect(report).not.toHaveTextContent("12,001 events catalogued.");
    expect(report).not.toHaveTextContent("The pulse train is a reply.");
  });
});
