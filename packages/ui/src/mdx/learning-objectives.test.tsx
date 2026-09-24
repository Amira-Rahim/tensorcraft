import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { LearningObjectives } from "./learning-objectives";

const objectives = [
  "Understand what tensors are",
  "Create tensors with TensorFlow.js",
  "Inspect tensor shapes and data types",
];

describe("LearningObjectives", () => {
  it("renders all objectives", () => {
    render(<LearningObjectives objectives={objectives} />);
    objectives.forEach((obj) => {
      expect(screen.getByText(obj)).toBeInTheDocument();
    });
  });

  it("renders objectives as list items", () => {
    const { container } = render(
      <LearningObjectives objectives={objectives} />,
    );
    const items = container.querySelectorAll("li");
    expect(items).toHaveLength(3);
  });

  it("has no accessibility violations", async () => {
    const { axe } = await import("vitest-axe");
    const { container } = render(
      <LearningObjectives objectives={objectives} />,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it("labels the block as a level-two heading, lays items two across from lg, and pins the inline metrics", () => {
    render(<LearningObjectives objectives={["a", "b"]} />);
    const heading = screen.getByRole("heading", {
      level: 2,
      name: "You will be able to",
    });
    expect(heading).toBeInTheDocument();
    // Inline metrics, so the unlayered .lesson-prose h2 rule
    // (apps/web/app/globals.css) cannot restyle it. Per-property checks,
    // not a toContain substring check: "margin: 0" is a prefix match that
    // would also pass against "margin: 0.5rem".
    // (jest-dom's toHaveStyle is avoided here too: it reads jsdom's
    // computed style, which converts rem to px.)
    expect(heading.style.fontSize).toBe("0.75rem");
    expect(heading.style.fontWeight).toBe("600");
    expect(heading.style.marginTop).toBe("0px");
    expect(heading.style.marginBottom).toBe("0.75rem");
    expect(heading.style.color).toBe("var(--tc-primary)");

    // getByRole("list") also resolves a ul through its built-in role, so
    // that query alone stays green even without role="list" on the
    // element. The toHaveAttribute assertion below is what locks the
    // explicit role in place, the actual Safari fix: WebKit drops a ul's
    // implicit list semantics when its items draw no marker.
    const list = screen.getByRole("list");
    expect(list).toHaveAttribute("role", "list");
    expect(list.className).toContain("lg:grid-cols-2");
    // The unlayered .lesson-prose ul and li rules (apps/web/app/globals.css)
    // would indent the list, space the items and enlarge the text to the
    // body size at md; the metrics are pinned inline for the same reason as
    // the h2.
    expect(list.style.paddingLeft).toBe("0px");
    expect(list.style.marginBottom).toBe("0px");

    const item = screen.getAllByRole("listitem")[0];
    expect(item.style.fontSize).toBe("0.875rem");
    expect(item.style.marginBottom).toBe("0px");
    expect(item.style.lineHeight).toBe("1.625");

    // The bullet glyph is decorative text, hidden from assistive tech so
    // VoiceOver does not read "white circle" before every objective.
    const glyph = item.querySelectorAll("span")[0];
    expect(glyph).toHaveAttribute("aria-hidden", "true");
  });
});
