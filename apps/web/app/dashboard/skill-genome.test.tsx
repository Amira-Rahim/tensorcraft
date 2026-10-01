import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkillGenome } from "./skill-genome";
describe("skill practice", () => {
  it("uses readable names and explains the recorded scale", () => {
    render(
      <SkillGenome
        data={[{ skill_axis: "data_prep", proficiency: 15, velocity: 0 }]}
      />,
    );
    expect(screen.getByText("Data preparation")).toBeInTheDocument();
    expect(screen.getByText("15 / 100")).toBeInTheDocument();
    expect(screen.getByText(/not a mastery percentage/)).toBeInTheDocument();
    expect(screen.queryByText(/data_prep|velocity|0\.00/)).toBeNull();
  });
  it("hides zeroed axes and empty panels", () => {
    const { container } = render(
      <SkillGenome
        data={[{ skill_axis: "data_prep", proficiency: 0, velocity: 0 }]}
      />,
    );
    expect(container.firstChild).toBeNull();
  });
});
