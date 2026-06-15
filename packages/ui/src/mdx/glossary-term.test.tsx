import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { GlossaryTerm } from "./glossary-term";

describe("GlossaryTerm", () => {
  it("renders children with a glossary affordance and fires onActivate on click", () => {
    const onActivate = vi.fn();
    render(
      <GlossaryTerm
        term="rank"
        definition="number of axes"
        onActivate={onActivate}
      >
        rank
      </GlossaryTerm>,
    );
    const el = screen.getByText("rank");
    expect(el.getAttribute("data-glossary-term")).toBe("rank");
    fireEvent.click(el);
    expect(onActivate).toHaveBeenCalledWith("rank");
  });

  it("exposes the definition as an accessible title/tooltip", () => {
    render(
      <GlossaryTerm term="rank" definition="number of axes">
        rank
      </GlossaryTerm>,
    );
    expect(screen.getByText("rank").getAttribute("title")).toContain(
      "number of axes",
    );
  });
});
