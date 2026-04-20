import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ThemeCards, type ThemeCardData } from "../theme-cards";

// Render Next's <Link> as a plain <a> so we can assert hrefs without the
// Next runtime in a unit test environment.
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

function makeCard(overrides: Partial<ThemeCardData> = {}): ThemeCardData {
  return {
    slug: "deep-orbit",
    displayName: "Deep Orbit",
    tagline: "Navigate the unknown through signals",
    specialization: "Time-Series & Signals",
    primary: "#6BAA8A",
    owned: false,
    isActive: false,
    completedLessons: 0,
    totalLessons: 55,
    progressPercent: 0,
    ...overrides,
  };
}

describe("ThemeCards", () => {
  it("renders a card for each theme in props", () => {
    const cards = [
      makeCard({ slug: "deep-orbit", displayName: "Deep Orbit" }),
      makeCard({
        slug: "neon-protocol",
        displayName: "Neon Protocol",
        tagline: "See the city through the eyes of AI",
      }),
    ];
    render(<ThemeCards cards={cards} hasFullBundle={false} />);
    expect(screen.getByText("Deep Orbit")).toBeInTheDocument();
    expect(screen.getByText("Neon Protocol")).toBeInTheDocument();
  });

  it("shows bundle summary when all themes are owned", () => {
    const cards = [
      makeCard({ slug: "deep-orbit", owned: true, progressPercent: 50 }),
    ];
    render(<ThemeCards cards={cards} hasFullBundle={true} />);
    expect(screen.getByText("All 5 themes unlocked")).toBeInTheDocument();
  });

  it("shows partial summary when not all themes are owned", () => {
    const cards = [
      makeCard({ slug: "deep-orbit", owned: true }),
      makeCard({ slug: "neon-protocol", displayName: "Neon", owned: false }),
    ];
    render(<ThemeCards cards={cards} hasFullBundle={false} />);
    expect(screen.getByText("1 of 2 unlocked")).toBeInTheDocument();
  });

  it("owned card links into the theme landing page with progress info", () => {
    const cards = [
      makeCard({
        slug: "deep-orbit",
        displayName: "Deep Orbit",
        owned: true,
        isActive: true,
        completedLessons: 11,
        totalLessons: 55,
        progressPercent: 20,
      }),
    ];
    render(<ThemeCards cards={cards} hasFullBundle={false} />);

    const link = screen.getByRole("link", {
      name: /Deep Orbit, 20% complete, open theme/i,
    });
    expect(link).toHaveAttribute("href", "/themes/deep-orbit");

    // Shows lesson counts and an accessible progressbar.
    expect(within(link).getByText("11 / 55 lessons")).toBeInTheDocument();
    const progressbar = within(link).getByRole("progressbar");
    expect(progressbar).toHaveAttribute("aria-valuenow", "20");
    expect(progressbar).toHaveAttribute("aria-valuemin", "0");
    expect(progressbar).toHaveAttribute("aria-valuemax", "100");

    // Active chip is visible.
    expect(within(link).getByText(/Active/i)).toBeInTheDocument();
  });

  it("locked card links to /pricing?locked={slug} and shows Unlock CTA", () => {
    const cards = [
      makeCard({
        slug: "neon-protocol",
        displayName: "Neon Protocol",
        owned: false,
        totalLessons: 55,
      }),
    ];
    render(<ThemeCards cards={cards} hasFullBundle={false} />);

    const link = screen.getByRole("link", {
      name: /Neon Protocol locked, view pricing/i,
    });
    expect(link).toHaveAttribute("href", "/pricing?locked=neon-protocol");

    // Locked cards do NOT render a progressbar.
    expect(within(link).queryByRole("progressbar")).not.toBeInTheDocument();

    // Locked copy is surfaced for sighted users.
    expect(within(link).getByText("55 lessons locked")).toBeInTheDocument();
    expect(within(link).getByText(/Unlock/i)).toBeInTheDocument();
  });

  it("builds distinct hrefs for owned vs. locked cards in the same grid", () => {
    const cards = [
      makeCard({
        slug: "deep-orbit",
        displayName: "Deep Orbit",
        owned: true,
        progressPercent: 40,
      }),
      makeCard({
        slug: "terra-grid",
        displayName: "Terra Grid",
        owned: false,
      }),
    ];
    render(<ThemeCards cards={cards} hasFullBundle={false} />);

    expect(
      screen.getByRole("link", { name: /Deep Orbit, 40% complete/i }),
    ).toHaveAttribute("href", "/themes/deep-orbit");
    expect(
      screen.getByRole("link", { name: /Terra Grid locked/i }),
    ).toHaveAttribute("href", "/pricing?locked=terra-grid");
  });
});
