import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import AuthPage from "./page";

/**
 * Phase 11 §11d Wave 1, Auth page brutalist split-layout tests.
 *
 * We mock out the client-side dependencies of <AuthForm> and <ParticleField>
 * so the server-component page can be rendered synchronously and its layout
 * structure asserted.
 */

// AuthForm is a client component pulling `useSearchParams` + supabase; we
// only care that the page renders it, so stub it with a sentinel.
vi.mock("../components/auth-form", () => ({
  AuthForm: () => <div data-testid="auth-form-stub">AUTH_FORM</div>,
}));

// OrbitCanvas uses canvas + rAF; stub to a marker element so we can assert
// the left pane renders the decorative backdrop.
vi.mock("@tensorcraft/ui/effects", () => ({
  OrbitCanvas: ({ className }: { className?: string }) => (
    <div data-testid="orbit-canvas-stub" className={className} />
  ),
}));

describe("AuthPage, Phase 11 §11d Wave 1 split layout", () => {
  it("renders both left and right panes", () => {
    render(<AuthPage />);
    expect(screen.getByTestId("auth-left-pane")).toBeTruthy();
    expect(screen.getByTestId("auth-right-pane")).toBeTruthy();
  });

  it("left pane renders the onboarding tagline verbatim", () => {
    render(<AuthPage />);
    const tagline = screen.getByTestId("auth-tagline");
    // Exact copy from project_copy_lines.md, do not silently rewrite.
    expect(tagline.textContent).toBe("You Already Think Like an ML Engineer");
  });

  it("left pane is hidden on mobile (hidden md:flex)", () => {
    render(<AuthPage />);
    const left = screen.getByTestId("auth-left-pane");
    expect(left.className).toMatch(/\bhidden\b/);
    expect(left.className).toMatch(/md:flex/);
  });

  it("left pane uses a right border divider", () => {
    render(<AuthPage />);
    const left = screen.getByTestId("auth-left-pane");
    expect(left.className).toMatch(/border-r/);
    expect(left.className).toMatch(/border-border/);
  });

  it("left pane is square-edged (rounded-none, no rounded-* corners)", () => {
    const { container } = render(<AuthPage />);
    expect(container.innerHTML).not.toMatch(/rounded-(sm|md|lg|xl|full)/);
  });

  it("right pane renders <AuthForm>", () => {
    render(<AuthPage />);
    expect(screen.getByTestId("auth-right-pane")).toBeTruthy();
    expect(screen.getByTestId("auth-form-stub")).toBeTruthy();
  });

  it("right pane is full-width on mobile, 45% on desktop", () => {
    render(<AuthPage />);
    const right = screen.getByTestId("auth-right-pane");
    expect(right.className).toMatch(/\bw-full\b/);
    expect(right.className).toMatch(/md:w-\[45%\]/);
  });

  it("renders the OrbitCanvas backdrop in the left pane", () => {
    render(<AuthPage />);
    expect(screen.getByTestId("orbit-canvas-stub")).toBeTruthy();
  });

  it("left pane grounds on the lab plate with the canvas as its reflection", () => {
    render(<AuthPage />);
    const left = screen.getByTestId("auth-left-pane");
    const plate = left.querySelector('img[data-testid="art-plate"]');
    expect(plate?.getAttribute("src")).toBe("/locations/deep-orbit/lab.webp");
    // Over dark art the canvas is the reflection on the glass, not the scene
    // (WorldSceneBackdrop precedent).
    expect(screen.getByTestId("orbit-canvas-stub").className).toContain(
      "opacity-50",
    );
  });

  it("does NOT import or render any LossLandscape component (deferred §11b)", () => {
    const { container } = render(<AuthPage />);
    expect(container.innerHTML).not.toMatch(/LossLandscape/i);
    expect(container.innerHTML).not.toMatch(/loss-landscape/i);
  });
});
