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

describe("SettingsError", () => {
  it("renders the centralized message for a known code", async () => {
    const { default: SettingsError } = await import("./error");
    render(
      <SettingsError
        error={Object.assign(new Error("raw"), { code: "validation" })}
        reset={() => {}}
      />,
    );
    expect(screen.getByText(ERROR_MESSAGES.validation)).toBeInTheDocument();
  });

  it("calls reset() when Try again is clicked", async () => {
    const { default: SettingsError } = await import("./error");
    const reset = vi.fn();
    render(<SettingsError error={new Error("boom")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
