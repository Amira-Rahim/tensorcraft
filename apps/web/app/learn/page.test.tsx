import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LearnPage from "./page";

// Stub next/link so render works without the Next router.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const COMING_SOON = [
  { slug: "neon-protocol", name: "Neon Protocol" },
  { slug: "signal-ward", name: "Signal Ward" },
  { slug: "nova-canvas", name: "Nova Canvas" },
  { slug: "terra-grid", name: "Terra Grid" },
];

describe("LearnPage world links", () => {
  it("links the launched world", () => {
    render(<LearnPage />);
    expect(screen.getByRole("link", { name: "Deep Orbit" })).toHaveAttribute(
      "href",
      "/worlds/deep-orbit",
    );
  });

  it("lists coming-soon worlds as plain text, never links", () => {
    const { container } = render(<LearnPage />);
    for (const world of COMING_SOON) {
      // Name is present for SEO copy but carries no link.
      expect(screen.getByText(world.name)).toBeInTheDocument();
      expect(
        container.querySelector(`a[href="/worlds/${world.slug}"]`),
      ).toBeNull();
    }
  });
});
