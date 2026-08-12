import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { WorldWaitlistForm } from "../world-waitlist-form";
import { signalWard } from "@tensorcraft/worlds";
import { submitWaitlist } from "@/lib/waitlist";

vi.mock("@/lib/waitlist", () => ({
  submitWaitlist: vi.fn().mockResolvedValue("done"),
}));

const baseProps = {
  worldSlug: "signal-ward",
  worldName: "Signal Ward",
  palette: signalWard.palette,
};

describe("WorldWaitlistForm", () => {
  beforeEach(() => {
    vi.mocked(submitWaitlist).mockClear();
  });

  it("appends idSuffix to input id and testids", () => {
    render(
      <WorldWaitlistForm
        {...baseProps}
        idSuffix="hero"
        source="coming-soon-hero"
      />,
    );
    const input = screen.getByTestId("world-waitlist-input-signal-ward-hero");
    expect(input.id).toBe("waitlist-signal-ward-hero");
    expect(
      screen.getByTestId("world-waitlist-submit-signal-ward-hero"),
    ).toBeInTheDocument();
  });

  it("defaults to no suffix and legacy source for backward compatibility", async () => {
    render(<WorldWaitlistForm {...baseProps} />);
    expect(
      screen.getByTestId("world-waitlist-input-signal-ward"),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByTestId("world-waitlist-input-signal-ward"), {
      target: { value: "a@b.co" },
    });
    fireEvent.click(screen.getByTestId("world-waitlist-submit-signal-ward"));
    await waitFor(() =>
      expect(submitWaitlist).toHaveBeenCalledWith(
        "a@b.co",
        "signal-ward",
        "coming-soon-stub",
      ),
    );
  });

  it("passes source through to submitWaitlist", async () => {
    render(
      <WorldWaitlistForm
        {...baseProps}
        idSuffix="footer"
        source="coming-soon-footer"
      />,
    );
    fireEvent.change(
      screen.getByTestId("world-waitlist-input-signal-ward-footer"),
      { target: { value: "a@b.co" } },
    );
    fireEvent.click(
      screen.getByTestId("world-waitlist-submit-signal-ward-footer"),
    );
    await waitFor(() =>
      expect(submitWaitlist).toHaveBeenCalledWith(
        "a@b.co",
        "signal-ward",
        "coming-soon-footer",
      ),
    );
  });

  it("renders custom ctaLabel", () => {
    render(<WorldWaitlistForm {...baseProps} ctaLabel="Get paged" />);
    expect(screen.getByText("Get paged")).toBeInTheDocument();
  });
});
