import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ERROR_MESSAGES } from "../../../../../lib/error-messages";

beforeAll(() => {
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("LessonError", () => {
  it("renders the centralized message for content_not_found", async () => {
    const { default: LessonError } = await import("./error");
    render(
      <LessonError
        error={Object.assign(new Error("raw"), { code: "content_not_found" })}
        reset={() => {}}
      />,
    );
    expect(
      screen.getByText(ERROR_MESSAGES.content_not_found),
    ).toBeInTheDocument();
  });

  it("calls reset() when Try again is clicked", async () => {
    const { default: LessonError } = await import("./error");
    const reset = vi.fn();
    render(<LessonError error={new Error("boom")} reset={reset} />);
    fireEvent.click(screen.getByRole("button", { name: /try again/i }));
    expect(reset).toHaveBeenCalledTimes(1);
  });
});
