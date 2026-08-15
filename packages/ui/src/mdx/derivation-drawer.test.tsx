import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DerivationDrawer } from "./derivation-drawer";
import { LessonPrefsProvider } from "./lesson-prefs";

describe("DerivationDrawer", () => {
  it("renders summary in trigger", () => {
    render(
      <DerivationDrawer summary="Chain rule, two-layer example">
        <p>derivation body</p>
      </DerivationDrawer>,
    );
    expect(
      screen.getByText(/Chain rule, two-layer example/),
    ).toBeInTheDocument();
  });

  it("starts closed: hides content panel by default", () => {
    render(
      <DerivationDrawer summary="x">
        <p>derivation body</p>
      </DerivationDrawer>,
    );
    expect(screen.queryByTestId("derivation-drawer-content")).toBeNull();
    expect(screen.queryByText("derivation body")).toBeNull();
  });

  // Onboarding's calibration promise: advanced/expert learners get the
  // math opened by default (2026-07-14, the experience_level wiring).
  it("starts open when LessonPrefs sets expandDerivations", () => {
    render(
      <LessonPrefsProvider value={{ expandDerivations: true }}>
        <DerivationDrawer summary="x">
          <p>derivation body</p>
        </DerivationDrawer>
      </LessonPrefsProvider>,
    );
    expect(screen.getByText("derivation body")).toBeInTheDocument();
    // Toggle still wins after the default.
    fireEvent.click(screen.getByRole("button"));
    expect(screen.queryByText("derivation body")).toBeNull();
  });

  it("opens content panel on trigger click", () => {
    render(
      <DerivationDrawer summary="x">
        <p>derivation body</p>
      </DerivationDrawer>,
    );
    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);
    expect(screen.getByTestId("derivation-drawer-content")).toBeInTheDocument();
    expect(screen.getByText("derivation body")).toBeInTheDocument();
  });

  it("toggles closed on second click", () => {
    render(
      <DerivationDrawer summary="x">
        <p>derivation body</p>
      </DerivationDrawer>,
    );
    const trigger = screen.getByRole("button");
    fireEvent.click(trigger);
    fireEvent.click(trigger);
    expect(screen.queryByTestId("derivation-drawer-content")).toBeNull();
  });

  it("trigger has correct ARIA expansion state", () => {
    render(
      <DerivationDrawer summary="x">
        <p>body</p>
      </DerivationDrawer>,
    );
    const trigger = screen.getByRole("button");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
    fireEvent.click(trigger);
    expect(trigger.getAttribute("aria-expanded")).toBe("true");
  });
});
