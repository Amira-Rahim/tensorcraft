import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ERROR_MESSAGES } from "../lib/error-messages";

beforeAll(() => {
  // Silence expected console.error from the error boundary.
  vi.spyOn(console, "error").mockImplementation(() => {});
});

// Stub next/link, error.tsx uses it for a "Go home" link.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("RootError", () => {
  it("renders centralized message for a known error code", async () => {
    const { default: ErrorBoundary } = await import("./error");
    render(
      <ErrorBoundary
        error={Object.assign(new Error("raw"), { code: "network" })}
        reset={() => {}}
      />,
    );
    expect(screen.getByText(ERROR_MESSAGES.network)).toBeInTheDocument();
  });

  it("shows the adrift plate above the card", async () => {
    const { default: ErrorBoundary } = await import("./error");
    render(<ErrorBoundary error={new Error("boom")} reset={() => {}} />);
    expect(screen.getByTestId("art-plate").getAttribute("src")).toBe(
      "/locations/deep-orbit/adrift.webp",
    );
  });

  it("falls back to unknown message when no code is present", async () => {
    const { default: ErrorBoundary } = await import("./error");
    render(<ErrorBoundary error={new Error("boom")} reset={() => {}} />);
    expect(screen.getByText(ERROR_MESSAGES.unknown)).toBeInTheDocument();
  });

  it("calls reset() when the Try again button is clicked", async () => {
    const { default: ErrorBoundary } = await import("./error");
    const reset = vi.fn();
    render(<ErrorBoundary error={new Error("boom")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
