import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeCast } from "./theme-cast";

describe("ThemeCast", () => {
  it("renders one portrait per crew member, ARIA included", () => {
    render(<ThemeCast slug="deep-orbit" />);
    expect(screen.getAllByTestId("animated-avatar")).toHaveLength(5);
  });

  it("names every crew member and their role", () => {
    render(<ThemeCast slug="deep-orbit" />);
    expect(screen.getByText("Commander Mirza")).toBeInTheDocument();
    expect(screen.getByText("Mentor")).toBeInTheDocument();
    expect(screen.getByText("ARIA")).toBeInTheDocument();
    expect(screen.getByText("Ship AI")).toBeInTheDocument();
  });

  it("keeps authoring guidance off the page", () => {
    render(<ThemeCast slug="deep-orbit" />);
    // `personality` is a writing-room note, and Nazari's is a spoiler for
    // her arc. Names and roles only.
    expect(screen.queryByText(/last mission/i)).toBeNull();
    expect(screen.queryByText(/Calm authority/i)).toBeNull();
  });

  it("resolves portraits through the manifest, not hand-built paths", () => {
    render(<ThemeCast slug="deep-orbit" />);
    const srcs = screen
      .getAllByTestId("animated-avatar-base")
      .map((el) => el.getAttribute("src"));
    for (const src of srcs) {
      expect(src).toMatch(/^\/characters\/deep-orbit\/[a-z-]+\.webp$/);
    }
    expect(srcs).toContain("/characters/deep-orbit/aria.webp");
  });

  it("shows the neutral portrait, never an expression variant", () => {
    // A cast card is a dossier, not a performance: no -concerned/-haunted.
    render(<ThemeCast slug="deep-orbit" />);
    expect(screen.queryAllByTestId("animated-avatar-expression")).toHaveLength(
      0,
    );
  });

  it("opts back to the dark palette when it sits on a location plate", () => {
    // The row lives inside the backdrop's first viewport. Without this its
    // names render near-black on the near-black plate in light scheme.
    render(<ThemeCast slug="deep-orbit" />);
    expect(screen.getByTestId("theme-cast").className).toContain("tc-on-art");
  });

  it("renders nothing for a theme with no characters", () => {
    const { container } = render(<ThemeCast slug="not-a-theme" />);
    expect(container.firstChild).toBeNull();
  });
});
