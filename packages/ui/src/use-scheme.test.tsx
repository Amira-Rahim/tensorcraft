import { describe, it, expect, vi, afterEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { useScheme, getServerSnapshot } from "./use-scheme";

function Probe() {
  const scheme = useScheme();
  return <div data-testid="scheme">{scheme}</div>;
}

afterEach(() => {
  delete document.documentElement.dataset.scheme;
  vi.restoreAllMocks();
});

describe("useScheme", () => {
  it('returns "dark" by default (no data-scheme attribute)', () => {
    const { getByTestId } = render(<Probe />);
    expect(getByTestId("scheme").textContent).toBe("dark");
  });

  it('flips to "light" when data-scheme="light" is set after mount', async () => {
    const { getByTestId } = render(<Probe />);
    expect(getByTestId("scheme").textContent).toBe("dark");

    // MutationObserver callbacks fire as a microtask — how many ticks isn't
    // a contract we control (batching/scheduling can add more), so a
    // one-shot `await Promise.resolve()` is a race, not a fix. `waitFor`
    // polls (its asyncWrapper keeps an act() window open across however
    // many ticks it actually takes) instead of gambling on a fixed count.
    document.documentElement.dataset.scheme = "light";

    await waitFor(() => {
      expect(getByTestId("scheme").textContent).toBe("light");
    });
  });

  it('returns to "dark" when the data-scheme attribute is removed', async () => {
    document.documentElement.dataset.scheme = "light";
    const { getByTestId } = render(<Probe />);
    expect(getByTestId("scheme").textContent).toBe("light");

    delete document.documentElement.dataset.scheme;

    await waitFor(() => {
      expect(getByTestId("scheme").textContent).toBe("dark");
    });
  });

  it('getServerSnapshot is SSR-safe and returns "dark"', () => {
    expect(getServerSnapshot()).toBe("dark");
  });

  it("disconnects the shared MutationObserver once the last consumer unmounts", () => {
    const disconnectSpy = vi.spyOn(MutationObserver.prototype, "disconnect");
    const { unmount } = render(<Probe />);
    expect(disconnectSpy).not.toHaveBeenCalled();
    unmount();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });

  it("shares a single MutationObserver across multiple simultaneous consumers", () => {
    const observeSpy = vi.spyOn(MutationObserver.prototype, "observe");
    const a = render(<Probe />);
    const b = render(<Probe />);

    expect(observeSpy).toHaveBeenCalledTimes(1);

    a.unmount();
    b.unmount();
  });

  it("notifies every mounted consumer, not just the first subscriber", async () => {
    // Regression guard: a `notifyListeners` that only fires `listeners[0]`
    // would still pass every other test in this file (they all render a
    // single Probe), so this test needs at least two live subscribers in
    // one tree to catch that bug.
    const { getAllByTestId } = render(
      <>
        <Probe />
        <Probe />
      </>,
    );
    const [first, second] = getAllByTestId("scheme");
    expect(first.textContent).toBe("dark");
    expect(second.textContent).toBe("dark");

    document.documentElement.dataset.scheme = "light";

    await waitFor(() => {
      expect(first.textContent).toBe("light");
      expect(second.textContent).toBe("light");
    });
  });

  it("does not disconnect the shared observer while other consumers remain mounted", () => {
    const disconnectSpy = vi.spyOn(MutationObserver.prototype, "disconnect");
    const a = render(<Probe />);
    const b = render(<Probe />);

    a.unmount();
    expect(disconnectSpy).not.toHaveBeenCalled();

    b.unmount();
    expect(disconnectSpy).toHaveBeenCalledTimes(1);
  });
});
