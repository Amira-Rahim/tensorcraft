import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { SceneHeading } from "./scene-heading";

describe("SceneHeading", () => {
  it("renders location in uppercase", () => {
    render(<SceneHeading location="Hospital Conference Room" />);
    expect(screen.getByText(/hospital conference room/i)).toBeInTheDocument();
  });

  it("includes time when provided", () => {
    render(<SceneHeading location="Server Room" time="Morning" />);
    expect(screen.getByText(/server room/i)).toBeInTheDocument();
    expect(screen.getByText(/morning/i)).toBeInTheDocument();
  });

  it("omits time separator when no time", () => {
    const { container } = render(<SceneHeading location="Lab" />);
    const text = container.textContent ?? "";
    expect(text).not.toContain(" - ");
  });

  it("renders with optional prefix", () => {
    render(<SceneHeading location="Lab" prefix="Epilogue" />);
    expect(screen.getByText(/epilogue/i)).toBeInTheDocument();
  });

  it("renders the prefix in the world primary color", () => {
    render(<SceneHeading location="Lab" prefix="Int." />);
    const prefix = screen.getByText(/INT\./);
    expect(prefix).toHaveAttribute(
      "style",
      expect.stringContaining("--tc-primary"),
    );
  });

  it("draws its own hairline and spacing by default", () => {
    const { container } = render(<SceneHeading location="Lab" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.borderBottom).toContain("1px solid");
    expect(root).toHaveClass("pb-3", "mb-7");
  });

  it("drops its hairline and spacing when a host row draws the line", () => {
    const { container } = render(
      <SceneHeading location="Lab" divider={false} />,
    );
    const root = container.firstElementChild as HTMLElement;
    expect(root.style.borderBottom).toBe("");
    expect(root).not.toHaveClass("pb-3");
    expect(root).not.toHaveClass("mb-7");
  });
});
