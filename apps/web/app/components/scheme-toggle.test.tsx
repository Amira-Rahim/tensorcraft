import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { WorldProvider } from "./world-provider";
import { SchemeToggle } from "./scheme-toggle";
import { SCHEME_STORAGE_KEY } from "@tensorcraft/shared";
import { mockMatchMedia } from "./test-utils/mock-match-media";

/**
 * Nav scheme toggle (light-mode rollout, Task 5). Cycle order: System ->
 * Light -> Dark -> System. Uses the shared mockMatchMedia helper (see
 * test-utils/mock-match-media.ts) so the toggle can be exercised inside a
 * real WorldProvider rather than a hand-rolled context mock.
 */

function renderToggle() {
  return render(
    <WorldProvider>
      <SchemeToggle />
    </WorldProvider>,
  );
}

// `title` is a deliberate duplicate of the accessible name (see the comment
// at the `title` attr in scheme-toggle.tsx) — assert the two stay in lockstep
// at every cycle position rather than trusting that by inspection.
function expectTitleMatchesAccessibleName(button: HTMLElement) {
  const title = button.getAttribute("title");
  expect(title).toBeTruthy();
  expect(button).toHaveAccessibleName(title!);
}

describe("SchemeToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.scheme;
    mockMatchMedia(true); // OS = dark, so the "system" state starts resolved dark
  });

  afterEach(() => {
    // No vi.stubGlobal in this file (mockMatchMedia uses
    // Object.defineProperty, redefined fresh every beforeEach) — only
    // restoreAllMocks is relevant here, for the vi.fn() inside the helper.
    vi.restoreAllMocks();
    localStorage.clear();
    delete document.documentElement.dataset.scheme;
  });

  it("renders a single button with an accessible name reflecting the system default", () => {
    renderToggle();
    const button = screen.getByRole("button", {
      name: /color scheme: system/i,
    });
    expect(button).toBeInTheDocument();
    expectTitleMatchesAccessibleName(button);
  });

  it("cycles System -> Light -> Dark -> System, syncing the DOM attr and localStorage each step", () => {
    renderToggle();
    const button = screen.getByRole("button");

    // Starting state: system, OS is dark, so no data-scheme attr and nothing
    // persisted yet.
    expect(document.documentElement.dataset.scheme).toBeUndefined();
    expect(localStorage.getItem(SCHEME_STORAGE_KEY)).toBeNull();
    expect(button).toHaveAccessibleName(
      /color scheme: system \(activate for light\)/i,
    );
    expectTitleMatchesAccessibleName(button);

    // Click 1: System -> Light
    fireEvent.click(button);
    expect(document.documentElement.dataset.scheme).toBe("light");
    expect(localStorage.getItem(SCHEME_STORAGE_KEY)).toBe("light");
    expect(button).toHaveAccessibleName(
      /color scheme: light \(activate for dark\)/i,
    );
    expectTitleMatchesAccessibleName(button);

    // Click 2: Light -> Dark
    fireEvent.click(button);
    expect(document.documentElement.dataset.scheme).toBeUndefined();
    expect(localStorage.getItem(SCHEME_STORAGE_KEY)).toBe("dark");
    expect(button).toHaveAccessibleName(
      /color scheme: dark \(activate for system\)/i,
    );
    expectTitleMatchesAccessibleName(button);

    // Click 3: Dark -> System (back to OS-resolved dark, no stored override)
    fireEvent.click(button);
    expect(document.documentElement.dataset.scheme).toBeUndefined();
    expect(localStorage.getItem(SCHEME_STORAGE_KEY)).toBeNull();
    expect(button).toHaveAccessibleName(
      /color scheme: system \(activate for light\)/i,
    );
    expectTitleMatchesAccessibleName(button);
  });

  it("announces the new state via a polite status region after activation, silent before it", () => {
    const { container } = renderToggle();
    const button = screen.getByRole("button");
    const status = container.querySelector('[role="status"]');
    expect(status).not.toBeNull();
    // Quiet on initial render/mount — nothing has happened yet.
    expect(status?.textContent).toBe("");

    fireEvent.click(button);
    expect(status?.textContent).toMatch(/light/i);

    fireEvent.click(button);
    expect(status?.textContent).toMatch(/dark/i);
  });

  it("has no accessibility violations", async () => {
    const { axe } = await import("vitest-axe");
    const { container } = renderToggle();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
