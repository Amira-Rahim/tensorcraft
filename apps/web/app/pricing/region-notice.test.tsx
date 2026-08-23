import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RegionNotice } from "./region-notice";

const submitWaitlist = vi.fn();
vi.mock("@/lib/waitlist", () => ({
  submitWaitlist: (...args: unknown[]) => submitWaitlist(...args),
}));

/**
 * EU/UK region notice. Replaces the buy buttons while checkout is gated
 * (owner decision 2026-08-23). Its job is not to apologise: it is the only
 * place blocked demand can be measured, and that measurement is evidence for
 * the 500-user gate that decides whether the LLC gets formed at all.
 */
describe("RegionNotice", () => {
  beforeEach(() => {
    submitWaitlist.mockReset();
    submitWaitlist.mockResolvedValue("done");
  });

  it("says purchases are not open rather than showing a generic error", () => {
    render(<RegionNotice />);

    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      /not open in the EU or UK/i,
    );
  });

  it("records a blocked buyer against the region-blocked source", async () => {
    const user = userEvent.setup();
    render(<RegionNotice />);

    await user.type(screen.getByLabelText(/email/i), "buyer@example.de");
    await user.click(screen.getByRole("button", { name: /email me/i }));

    await waitFor(() => {
      expect(submitWaitlist).toHaveBeenCalledWith(
        "buyer@example.de",
        "all",
        "region-blocked",
      );
    });
  });

  it("confirms the signup in place", async () => {
    const user = userEvent.setup();
    render(<RegionNotice />);

    await user.type(screen.getByLabelText(/email/i), "buyer@example.de");
    await user.click(screen.getByRole("button", { name: /email me/i }));

    // The live region is always mounted, so wait for its CONTENT rather than
    // for the element to appear.
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(/we will email/i),
    );
  });

  /**
   * `submitWaitlist` resolves "error" instead of throwing, so a component
   * that only handles the happy path leaves the form stuck on "submitting"
   * with no way back. Same defect class the helper's own docstring warns
   * about.
   */
  it("recovers from a failed submission instead of hanging", async () => {
    submitWaitlist.mockResolvedValue("error");
    const user = userEvent.setup();
    render(<RegionNotice />);

    await user.type(screen.getByLabelText(/email/i), "buyer@example.de");
    await user.click(screen.getByRole("button", { name: /email me/i }));

    expect(await screen.findByRole("alert")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /email me/i })).toBeEnabled();
  });
});
