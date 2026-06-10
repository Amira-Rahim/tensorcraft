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
});
