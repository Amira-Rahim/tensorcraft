import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SkillGenome } from "./skill-genome";

// Matches the genomeData prop shape in dashboard-view.tsx:97
// Array<{ skill_axis: string; proficiency: number; velocity: number }>
const sampleData = [
  { skill_axis: "data_prep", proficiency: 60, velocity: 0 },
  { skill_axis: "model_arch", proficiency: 30, velocity: 0 },
  { skill_axis: "training", proficiency: 45, velocity: 0 },
  { skill_axis: "evaluation", proficiency: 20, velocity: 0 },
  { skill_axis: "deployment", proficiency: 15, velocity: 0 },
  { skill_axis: "js_integration", proficiency: 85, velocity: 0 },
];

describe("SkillGenome (Option C)", () => {
  it("renders role=img with title and desc for a11y", () => {
    const { container } = render(<SkillGenome data={sampleData} />);
    const svg = container.querySelector("svg");
    expect(svg?.getAttribute("role")).toBe("img");
    expect(svg?.querySelector("title")?.textContent).toBeTruthy();
    expect(svg?.querySelector("desc")?.textContent).toMatch(/data_prep/);
  });

  it("renders NO concentric ring polygons (Option C uses only one dashed tick)", () => {
    const { container } = render(<SkillGenome data={sampleData} />);
    const polygons = container.querySelectorAll("polygon");
    expect(polygons.length).toBe(1); // only the data polygon
  });

  it("renders exactly one dashed tick circle at 50%", () => {
    const { container } = render(<SkillGenome data={sampleData} />);
    const dashed = container.querySelector("circle[stroke-dasharray]");
    expect(dashed).not.toBeNull();
  });

  it("renders NO data-point dots", () => {
    const { container } = render(<SkillGenome data={sampleData} />);
    const circles = Array.from(container.querySelectorAll("circle"));
    const nonTickCircles = circles.filter(
      (c) => !c.hasAttribute("stroke-dasharray"),
    );
    expect(nonTickCircles.length).toBe(0);
  });

  it("data polygon has fill=none (stroke only)", () => {
    const { container } = render(<SkillGenome data={sampleData} />);
    const polygon = container.querySelector("polygon");
    expect(polygon?.getAttribute("fill")).toBe("none");
  });

  it("renders mono legend table with # skill_genome header", () => {
    const { container } = render(<SkillGenome data={sampleData} />);
    expect(container.textContent).toMatch(/# skill_genome/);
    for (const axis of [
      "data_prep",
      "model_arch",
      "training",
      "evaluation",
      "deployment",
      "js_integration",
    ]) {
      expect(container.textContent).toContain(axis);
    }
  });

  it("values are formatted as 0.XX, not 0\u2013100 or percentages", () => {
    const { container } = render(<SkillGenome data={sampleData} />);
    expect(container.textContent).toMatch(/0\.60/);
    expect(container.textContent).not.toMatch(/60%/);
  });

  it("shows empty-state when all proficiencies are zero", () => {
    const empty = sampleData.map((d) => ({ ...d, proficiency: 0 }));
    const { container } = render(<SkillGenome data={empty} />);
    expect(container.textContent).toMatch(/No activity yet/);
  });

  it("matches snapshot for typical data", () => {
    const { container } = render(<SkillGenome data={sampleData} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
