import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CodeBlock } from "./code-block";

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn().mockResolvedValue(undefined),
  },
});

describe("CodeBlock", () => {
  it("renders code content", () => {
    render(<CodeBlock>const x = 42;</CodeBlock>);
    expect(screen.getByText("const x = 42;")).toBeInTheDocument();
  });

  it("shows default language badge as typescript", () => {
    render(<CodeBlock>code</CodeBlock>);
    expect(screen.getByText("typescript")).toBeInTheDocument();
  });

  it("shows custom language badge", () => {
    render(<CodeBlock language="python">print("hi")</CodeBlock>);
    expect(screen.getByText("python")).toBeInTheDocument();
  });

  it("shows title when provided", () => {
    render(<CodeBlock title="example.ts">code</CodeBlock>);
    expect(screen.getByText("example.ts")).toBeInTheDocument();
  });

  it("does not show title when not provided", () => {
    const { container } = render(<CodeBlock>code</CodeBlock>);
    const header = container.querySelector(".flex.min-w-0.flex-wrap");
    expect(header?.children.length).toBe(1); // only language badge
  });

  it("has a copy button", () => {
    render(<CodeBlock>code</CodeBlock>);
    expect(screen.getByText("Copy")).toBeInTheDocument();
  });

  it("copies code to clipboard on click", async () => {
    render(<CodeBlock>const x = 42;</CodeBlock>);
    fireEvent.click(screen.getByText("Copy"));
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith("const x = 42;");
  });

  it("shows 'Copied!' after copying", async () => {
    render(<CodeBlock>code</CodeBlock>);
    fireEvent.click(screen.getByText("Copy"));
    // Wait for the state update
    await vi.waitFor(() => {
      expect(screen.getByText("Copied!")).toBeInTheDocument();
    });
  });

  it("renders code inside pre > code tags", () => {
    const { container } = render(<CodeBlock>test code</CodeBlock>);
    const pre = container.querySelector("pre");
    const code = pre?.querySelector("code");
    expect(pre).toBeInTheDocument();
    expect(code).toBeInTheDocument();
  });

  it("uses tensorcraft-dark theme (not github-dark-default)", async () => {
    const { tensorcraftTheme } = await import("./tensorcraft-theme");
    expect(tensorcraftTheme.name).toBe("tensorcraft-dark");
    expect(tensorcraftTheme.type).toBe("dark");
    expect(tensorcraftTheme.tokenColors.length).toBeGreaterThan(10);
  });
});
