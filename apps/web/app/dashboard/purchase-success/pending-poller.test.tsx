import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { PendingPoller } from "./pending-poller";

/**
 * Poller timeout visibility (audit run #7, 2026-07-16).
 *
 * The poller used to stop silently after 60 seconds while the page copy
 * promised "this page updates itself the moment it clears" - a paying
 * customer with a slow or lost webhook stared at a frozen page with no
 * recourse. These tests pin the new contract: bounded polling, then a
 * VISIBLE timeout state with a retry and a support path carrying the
 * session reference.
 */

const refreshMock = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: refreshMock }),
}));

beforeEach(() => {
  vi.useFakeTimers();
  refreshMock.mockClear();
});

afterEach(() => {
  vi.useRealTimers();
});

function exhaustPolling() {
  // 20 refresh ticks + the 21st that flips to timeout.
  act(() => {
    vi.advanceTimersByTime(21 * 3000);
  });
}

describe("PendingPoller", () => {
  it("renders nothing while polling", () => {
    const { container } = render(<PendingPoller sessionId="cs_test_123" />);
    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(container.firstChild).toBeNull();
    expect(refreshMock).toHaveBeenCalled();
  });

  it("polls a bounded number of times, then stops", () => {
    render(<PendingPoller sessionId="cs_test_123" />);
    exhaustPolling();
    const calls = refreshMock.mock.calls.length;
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(refreshMock.mock.calls.length).toBe(calls);
  });

  it("shows a visible timeout state instead of freezing silently", () => {
    render(<PendingPoller sessionId="cs_test_123" />);
    exhaustPolling();
    expect(screen.getByTestId("pending-timeout")).toBeInTheDocument();
    expect(screen.getByText(/taking longer than usual/i)).toBeInTheDocument();
  });

  it("gives the customer a support path carrying their session reference", () => {
    render(<PendingPoller sessionId="cs_test_123" />);
    exhaustPolling();
    const mail = screen.getByRole("link", { name: /email support/i });
    expect(mail.getAttribute("href")).toContain("support@tensorcraft.app");
    expect(mail.getAttribute("href")).toContain("cs_test_123");
  });

  it("Check again restarts the bounded polling loop", () => {
    render(<PendingPoller sessionId="cs_test_123" />);
    exhaustPolling();
    refreshMock.mockClear();

    fireEvent.click(screen.getByRole("button", { name: /check again/i }));
    expect(screen.queryByTestId("pending-timeout")).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(3000);
    });
    expect(refreshMock).toHaveBeenCalled();
  });
});
