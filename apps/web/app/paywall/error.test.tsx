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

describe("PaywallError", () => {
  it("renders the centralized message for forbidden", async () => {
    const { default: PaywallError } = await import("./error");
    render(
      <PaywallError
        error={Object.assign(new Error("raw"), { code: "forbidden" })}
        reset={() => {}}
      />,
    );
    expect(screen.getByText(ERROR_MESSAGES.forbidden)).toBeInTheDocument();
  });

  it("calls reset() when Try again is clicked", async () => {
    const { default: PaywallError } = await import("./error");
    const reset = vi.fn();
    render(<PaywallError error={new Error("boom")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
