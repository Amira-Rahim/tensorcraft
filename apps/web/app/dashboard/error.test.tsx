import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ERROR_MESSAGES } from "../../lib/error-messages";

beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("DashboardError", () => {
  it("renders the centralized message for a known code", async () => {
    const { default: DashboardError } = await import("./error");
    render(
      <DashboardError
        error={Object.assign(new Error("raw"), { code: "session_expired" })}
        reset={() => {}}
      />,
    );
    expect(
      screen.getByText(ERROR_MESSAGES.session_expired),
    ).toBeInTheDocument();
  });

  it("calls reset() when the Try again button is clicked", async () => {
    const { default: DashboardError } = await import("./error");
    const reset = vi.fn();
    render(<DashboardError error={new Error("boom")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
