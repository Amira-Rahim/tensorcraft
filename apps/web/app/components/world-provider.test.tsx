import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { WorldProvider, useWorld } from "./world-provider";
import { SCHEME_STORAGE_KEY } from "@tensorcraft/shared";
import { mockMatchMedia } from "./test-utils/mock-match-media";

/**
 * Scheme state (light-mode rollout, 2026-07-22). Covers the `scheme` /
 * `schemePreference` / `setScheme` additions to the shared world+scheme
 * provider: OS-default resolution, explicit persistence, `null` = follow OS,
 * live OS-change reactivity gated on "no stored override", and the
 * storage-blocked survival path (see the SecurityError comment at the top of
 * world-provider.tsx - every localStorage touch must be try/catch'd because
 * getSnapshot runs during render).
 */

function SchemeProbe() {
  const { scheme, schemePreference, setScheme } = useWorld();
  return (
    <div>
      <span data-testid="scheme">{scheme}</span>
      <span data-testid="pref">{String(schemePreference)}</span>
      <button onClick={() => setScheme("light")}>set-light</button>
      <button onClick={() => setScheme("dark")}>set-dark</button>
      <button onClick={() => setScheme(null)}>set-system</button>
    </div>
  );
}

describe("WorldProvider scheme state", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.scheme;
  });

  afterEach(() => {
    // Unstub BEFORE touching localStorage below: if a test stubs a
    // throwing localStorage (the storage-blocked case) and then a later
    // assertion in that test fails, the stub is still live when this
    // afterEach runs. `localStorage.clear()` would call `.clear()` on the
    // throwing stub object, which doesn't implement it, masking the real
    // failure with an unrelated TypeError in every subsequent test.
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    localStorage.clear();
    delete document.documentElement.dataset.scheme;
  });

  it("resolves 'dark' from the OS when no override is stored", () => {
    mockMatchMedia(true);
    render(
      <WorldProvider>
        <SchemeProbe />
      </WorldProvider>,
    );
    expect(screen.getByTestId("scheme").textContent).toBe("dark");
    expect(screen.getByTestId("pref").textContent).toBe("null");
    expect(document.documentElement.dataset.scheme).toBeUndefined();
  });

  it("resolves 'light' from the OS when no override is stored", () => {
    mockMatchMedia(false);
    render(
      <WorldProvider>
        <SchemeProbe />
      </WorldProvider>,
    );
    expect(screen.getByTestId("scheme").textContent).toBe("light");
    expect(document.documentElement.dataset.scheme).toBe("light");
  });

  it("setScheme('light') applies the DOM attr and persists to tc-scheme", () => {
    mockMatchMedia(true); // OS is dark, so this is a genuine override
    render(
      <WorldProvider>
        <SchemeProbe />
      </WorldProvider>,
    );

    fireEvent.click(screen.getByText("set-light"));

    expect(document.documentElement.dataset.scheme).toBe("light");
    expect(localStorage.getItem(SCHEME_STORAGE_KEY)).toBe("light");
    expect(screen.getByTestId("scheme").textContent).toBe("light");
    expect(screen.getByTestId("pref").textContent).toBe("light");
  });

  it("setScheme('dark') applies the DOM attr (no attribute) and persists", () => {
    mockMatchMedia(false); // OS is light, so this is a genuine override
    render(
      <WorldProvider>
        <SchemeProbe />
      </WorldProvider>,
    );

    fireEvent.click(screen.getByText("set-dark"));

    expect(document.documentElement.dataset.scheme).toBeUndefined();
    expect(localStorage.getItem(SCHEME_STORAGE_KEY)).toBe("dark");
    expect(screen.getByTestId("scheme").textContent).toBe("dark");
  });

  it("setScheme(null) removes the override and re-applies the CURRENT OS value", () => {
    const media = mockMatchMedia(true); // OS is dark
    render(
      <WorldProvider>
        <SchemeProbe />
      </WorldProvider>,
    );

    fireEvent.click(screen.getByText("set-light"));
    expect(document.documentElement.dataset.scheme).toBe("light");

    // OS flips to light behind the scenes before the override is cleared.
    act(() => {
      media.fireChange(false);
    });

    fireEvent.click(screen.getByText("set-system"));

    expect(localStorage.getItem(SCHEME_STORAGE_KEY)).toBeNull();
    expect(screen.getByTestId("pref").textContent).toBe("null");
    // Current OS value (light, after the flip) wins, not the stale dark
    // value that was true when the component first mounted.
    expect(screen.getByTestId("scheme").textContent).toBe("light");
    expect(document.documentElement.dataset.scheme).toBe("light");
  });

  it("an OS change event flips the attr only when there is NO stored override", () => {
    const media = mockMatchMedia(true); // starts dark
    render(
      <WorldProvider>
        <SchemeProbe />
      </WorldProvider>,
    );
    expect(screen.getByTestId("scheme").textContent).toBe("dark");

    act(() => {
      media.fireChange(false); // OS flips to light
    });
    expect(screen.getByTestId("scheme").textContent).toBe("light");
    expect(document.documentElement.dataset.scheme).toBe("light");

    act(() => {
      media.fireChange(true); // OS flips back to dark
    });
    expect(screen.getByTestId("scheme").textContent).toBe("dark");
    expect(document.documentElement.dataset.scheme).toBeUndefined();
  });

  it("does NOT flip on an OS change event when an explicit override is stored", () => {
    const media = mockMatchMedia(true); // OS starts dark
    render(
      <WorldProvider>
        <SchemeProbe />
      </WorldProvider>,
    );

    fireEvent.click(screen.getByText("set-light")); // explicit override
    expect(document.documentElement.dataset.scheme).toBe("light");

    act(() => {
      media.fireChange(false); // OS "changes" to light too, irrelevant here
    });

    // Still the explicit override value, unaffected by the OS event.
    expect(screen.getByTestId("scheme").textContent).toBe("light");
    expect(document.documentElement.dataset.scheme).toBe("light");
    expect(localStorage.getItem(SCHEME_STORAGE_KEY)).toBe("light");
  });

  it("still applies the DOM attr without crashing when storage access throws, and keeps JS state in sync with the DOM after setScheme", () => {
    mockMatchMedia(false); // OS is light
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new DOMException("The operation is insecure.", "SecurityError");
      },
      setItem: () => {
        throw new DOMException("The operation is insecure.", "SecurityError");
      },
      removeItem: () => {
        throw new DOMException("The operation is insecure.", "SecurityError");
      },
    });

    expect(() =>
      render(
        <WorldProvider>
          <SchemeProbe />
        </WorldProvider>,
      ),
    ).not.toThrow();

    expect(screen.getByTestId("scheme").textContent).toBe("light");
    expect(document.documentElement.dataset.scheme).toBe("light");

    expect(() => {
      fireEvent.click(screen.getByText("set-dark"));
    }).not.toThrow();

    // The DOM attribute updates even though storage access throws...
    expect(document.documentElement.dataset.scheme).toBeUndefined();
    // ...and, load-bearing: so does the React-visible state. Without the
    // in-memory fallback, the next snapshot read would hit the catch
    // branch, see nothing to read, and silently resolve back to the OS
    // value (light here) - the app would show "light" copy/toggle state
    // while the DOM sat in dark, permanently disagreeing with itself for
    // the rest of the session.
    expect(screen.getByTestId("scheme").textContent).toBe("dark");
    expect(screen.getByTestId("pref").textContent).toBe("dark");
  });

  it("removes the matchMedia change listener on unmount", () => {
    const media = mockMatchMedia(true);
    const { unmount } = render(
      <WorldProvider>
        <SchemeProbe />
      </WorldProvider>,
    );
    expect(media.listenerCount()).toBe(1);

    unmount();

    expect(media.listenerCount()).toBe(0);
  });
});
