import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GlossaryTerm } from "./glossary-term";

describe("GlossaryTerm", () => {
  it("renders children with a glossary affordance", () => {
    render(
      <GlossaryTerm term="rank" definition="number of axes">
        rank
      </GlossaryTerm>,
    );
    const el = screen.getByText("rank");
    expect(el.getAttribute("data-glossary-term")).toBe("rank");
  });

  it("shows the definition on activation and dismisses it with Escape", () => {
    render(
      <GlossaryTerm term="rank" definition="number of axes">
        rank
      </GlossaryTerm>,
    );
    const button = screen.getByRole("button", { name: "rank" });
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    fireEvent.click(button);
    expect(screen.getByRole("note")).toHaveTextContent("number of axes");
    expect(button).toHaveAttribute("aria-expanded", "true");
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });
});
