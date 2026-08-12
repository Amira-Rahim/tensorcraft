import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { WorldCast } from "./world-cast";

describe("WorldCast", () => {
  it("renders one portrait per crew member, ARIA included", () => {
    render(<WorldCast slug="deep-orbit" />);
    expect(screen.getAllByTestId("animated-avatar")).toHaveLength(5);
  });

  it("names every crew member and their role", () => {
    render(<WorldCast slug="deep-orbit" />);
    expect(screen.getByText("Commander Mirza")).toBeInTheDocument();
    expect(screen.getByText("Mentor")).toBeInTheDocument();
    expect(screen.getByText("ARIA")).toBeInTheDocument();
    expect(screen.getByText("Ship AI")).toBeInTheDocument();
  });

  it("keeps authoring guidance off the page", () => {
    render(<WorldCast slug="deep-orbit" />);
    // `personality` is a writing-room note, and Nazari's is a spoiler for
    // her arc. Names and roles only.
    expect(screen.queryByText(/last mission/i)).toBeNull();
    expect(screen.queryByText(/Calm authority/i)).toBeNull();
  });

  it("resolves portraits through the manifest, not hand-built paths", () => {
    render(<WorldCast slug="deep-orbit" />);
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
    render(<WorldCast slug="deep-orbit" />);
    expect(screen.queryAllByTestId("animated-avatar-expression")).toHaveLength(
      0,
    );
  });

  it("opts back to the dark palette when it sits on a location plate", () => {
    // The row lives inside the backdrop's first viewport. Without this its
    // names render near-black on the near-black plate in light scheme.
    render(<WorldCast slug="deep-orbit" />);
    expect(screen.getByTestId("world-cast").className).toContain("tc-on-art");
  });

  it("renders nothing for a world with no characters", () => {
    const { container } = render(<WorldCast slug="not-a-world" />);
    expect(container.firstChild).toBeNull();
  });
});
