import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { getSupabaseBrowserClient } = vi.hoisted(() => ({
  getSupabaseBrowserClient: vi.fn(),
}));
vi.mock("@/lib/supabase/client", () => ({ getSupabaseBrowserClient }));
vi.mock("@/lib/waitlist", () => ({ submitWaitlist: vi.fn() }));

import {
  GUEST_EMAIL_CAPTURE_ENABLED,
  GuestEmailCapture,
} from "./guest-email-capture";

describe("GuestEmailCapture", () => {
  it("stays hidden while no email is sent for free-module signups", () => {
    // The form used to confirm "Sent." without any email going out.
    expect(GUEST_EMAIL_CAPTURE_ENABLED).toBe(false);
    const { container } = render(<GuestEmailCapture worldSlug="deep-orbit" />);
    expect(container.innerHTML).toBe("");
    expect(container.textContent).not.toContain("Email me my spot");
    expect(getSupabaseBrowserClient).not.toHaveBeenCalled();
  });
});
