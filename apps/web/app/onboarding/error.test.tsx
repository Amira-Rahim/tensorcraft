import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ERROR_MESSAGES } from "../../lib/error-messages";

beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

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

describe("OnboardingError", () => {
  it("falls back to unknown when no code is provided", async () => {
    const { default: OnboardingError } = await import("./error");
    render(<OnboardingError error={new Error("boom")} reset={() => {}} />);
    expect(screen.getByText(ERROR_MESSAGES.unknown)).toBeInTheDocument();
  });

  it("calls reset() when Try again is clicked", async () => {
    const { default: OnboardingError } = await import("./error");
    const reset = vi.fn();
    render(<OnboardingError error={new Error("boom")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
