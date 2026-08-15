import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorldProvider } from "../world-provider";

/**
 * Regression cover for a whole-site outage class.
 *
 * `localStorage` does not return null when a browser blocks site data - it
 * THROWS SecurityError on access. That happens for Safari "Block All
 * Cookies", Chrome site-data blocking, enterprise policy, and any sandboxed
 * iframe.
 *
 * WorldProvider reads it inside the `getSnapshot` of a useSyncExternalStore,
 * and it wraps the entire app. So an unguarded throw happened DURING RENDER
 * and unwound to global-error.tsx: a white screen on every route, including
 * /terms and /privacy, for every user in that configuration.
 *
 * Falling back to the default world is fully recoverable. Crashing is not.
 */
describe("WorldProvider with blocked storage", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  function blockStorage() {
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
  }

  it("still renders its children when localStorage access throws", () => {
    blockStorage();

    expect(() =>
      render(
        <WorldProvider>
          <p>site content</p>
        </WorldProvider>,
      ),
    ).not.toThrow();

    expect(screen.getByText("site content")).toBeInTheDocument();
  });

  it("renders normally when storage works", () => {
    render(
      <WorldProvider>
        <p>site content</p>
      </WorldProvider>,
    );
    expect(screen.getByText("site content")).toBeInTheDocument();
  });
});
