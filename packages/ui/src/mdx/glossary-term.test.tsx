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

  it("makes documentation reachable inside the note and returns focus to the term", () => {
    render(
      <GlossaryTerm
        term="tensor"
        definition="A container for numbers"
        documentation={{
          href: "https://js.tensorflow.org/api/4.22.0/#tensor",
          title: "tf.tensor",
          source: "TensorFlow.js",
          kind: "api",
        }}
      >
        tensor
      </GlossaryTerm>,
    );
    const trigger = screen.getByRole("button", { name: "tensor" });
    fireEvent.click(trigger);
    expect(
      screen.getByRole("button", { name: "Close definition" }),
    ).toHaveFocus();
    const link = screen.getByRole("link", { name: /TensorFlow.js: tf.tensor/ });
    expect(link).toHaveAttribute(
      "href",
      "https://js.tensorflow.org/api/4.22.0/#tensor",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
    link.focus();
    fireEvent.keyDown(link, { key: "Escape" });
    expect(trigger).toHaveFocus();
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });
});
