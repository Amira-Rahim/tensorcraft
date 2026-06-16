import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CharacterAvatar } from "./character-avatar";

describe("CharacterAvatar", () => {
  it("renders an img with src and alt when given a src", () => {
    render(
      <CharacterAvatar
        name="Commander Mirza"
        src="/characters/deep-orbit/commander-mirza.webp"
      />,
    );
    const img = screen.getByTestId("character-avatar-img") as HTMLImageElement;
    expect(img.getAttribute("alt")).toBe("Commander Mirza");
    expect(img.getAttribute("src")).toContain("commander-mirza.webp");
  });
  it("falls back to a monogram placeholder on image error", () => {
    render(<CharacterAvatar name="Commander Mirza" src="/missing.webp" />);
    fireEvent.error(screen.getByTestId("character-avatar-img"));
    expect(screen.getByTestId("character-avatar-placeholder").textContent).toBe(
      "CM",
    );
  });
  it("shows a monogram placeholder when no src is given", () => {
    render(<CharacterAvatar name="Dr. Farah" />);
    expect(screen.getByTestId("character-avatar-placeholder").textContent).toBe(
      "DF",
    );
  });
  it("shows an AI glyph (no letters) for AI characters", () => {
    render(<CharacterAvatar name="ARIA" isAI />);
    const el = screen.getByTestId("character-avatar-placeholder");
    expect(el.textContent).not.toMatch(/[A-Z]{2}/);
    expect(el.getAttribute("aria-label")).toBe("ARIA");
  });
});
