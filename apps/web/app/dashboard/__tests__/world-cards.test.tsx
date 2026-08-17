import { describe, it, expect, vi } from "vitest";
import { render, screen, within, fireEvent } from "@testing-library/react";
import { WorldCards, type WorldCardData } from "../world-cards";

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

// The modal's own behavior (form, focus trap, submit) has its own
// coverage; here only the NotifyMeButton open wiring matters.
vi.mock("@/app/worlds/newsletter-modal", () => ({
  NewsletterModal: ({ open }: { open: boolean }) =>
    open ? <div data-testid="newsletter-modal-stub" /> : null,
}));

function makeCard(overrides: Partial<WorldCardData> = {}): WorldCardData {
  return {
    slug: "deep-orbit",
    displayName: "Deep Orbit",
    tagline: "Where signals guide you through the unknown",
    specialization: "Time-Series & Signals",
    primary: "#6BAA8A",
    owned: false,
    isActive: false,
    completedLessons: 0,
    totalLessons: 55,
    progressPercent: 0,
    comingSoon: false,
    ...overrides,
  };
}

describe("WorldCards", () => {
  it("renders a card for each world in props", () => {
    const cards = [
      makeCard({ slug: "deep-orbit", displayName: "Deep Orbit" }),
      makeCard({
        slug: "neon-protocol",
        displayName: "Neon Protocol",
        tagline: "Where AI watches the city",
      }),
    ];
    render(<WorldCards cards={cards} hasFullBundle={false} />);
    expect(screen.getByText("Deep Orbit")).toBeInTheDocument();
    expect(screen.getByText("Neon Protocol")).toBeInTheDocument();
  });

  it("shows bundle summary when all available worlds are owned", () => {
    const cards = [
      makeCard({ slug: "deep-orbit", owned: true, progressPercent: 50 }),
    ];
    render(<WorldCards cards={cards} hasFullBundle={true} />);
    expect(
      screen.getByText("You own all available worlds"),
    ).toBeInTheDocument();
  });

  it("partial summary excludes coming-soon worlds from the owned count", () => {
    const cards = [
      makeCard({ slug: "deep-orbit", owned: true }),
      makeCard({
        slug: "neon-protocol",
        displayName: "Neon",
        owned: false,
        comingSoon: true,
      }),
    ];
    render(<WorldCards cards={cards} hasFullBundle={false} />);
    expect(screen.getByText(/1 of 1 owned/i)).toBeInTheDocument();
    expect(screen.getByText(/1 coming soon/i)).toBeInTheDocument();
  });

  it("renders coming-soon card inert: no link, not-allowed cursor", () => {
    const cards = [
      makeCard({
        slug: "neon-protocol",
        displayName: "Neon Protocol",
        owned: false,
        totalLessons: 0,
        comingSoon: true,
      }),
    ];
    const { container } = render(
      <WorldCards cards={cards} hasFullBundle={false} />,
    );
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
    const shell = container.querySelector(".tc-world-card");
    expect(shell).toBeInstanceOf(HTMLDivElement);
    expect((shell as HTMLElement).style.cursor).toBe("not-allowed");
    expect(
      within(shell as HTMLElement).getByText(/Notify me/i),
    ).toBeInTheDocument();
  });

  it("opens the newsletter modal from the coming-soon Notify me CTA", () => {
    const cards = [
      makeCard({
        slug: "neon-protocol",
        displayName: "Neon Protocol",
        owned: false,
        totalLessons: 0,
        comingSoon: true,
      }),
    ];
    render(<WorldCards cards={cards} hasFullBundle={false} />);
    expect(screen.queryByTestId("newsletter-modal-stub")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /notify me/i }));
    expect(screen.getByTestId("newsletter-modal-stub")).toBeInTheDocument();
  });

  it("owned card links into the world landing page with progress info", () => {
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
    render(<WorldCards cards={cards} hasFullBundle={false} />);

    const link = screen.getByRole("link", {
      name: /Deep Orbit, 20% complete, open world/i,
    });
    expect(link).toHaveAttribute("href", "/worlds/deep-orbit");

    // Shows lesson counts and an accessible progressbar.
    expect(within(link).getByText("11 / 55 lessons")).toBeInTheDocument();
    const progressbar = within(link).getByRole("progressbar");
    expect(progressbar).toHaveAttribute("aria-valuenow", "20");
    expect(progressbar).toHaveAttribute("aria-valuemin", "0");
    expect(progressbar).toHaveAttribute("aria-valuemax", "100");

    // Active chip is visible.
    expect(within(link).getByText(/Active/i)).toBeInTheDocument();
  });

  it("locked card links to /pricing?locked={slug} and shows Get access CTA", () => {
    const cards = [
      makeCard({
        slug: "neon-protocol",
        displayName: "Neon Protocol",
        owned: false,
        totalLessons: 55,
      }),
    ];
    render(<WorldCards cards={cards} hasFullBundle={false} />);

    const link = screen.getByRole("link", {
      name: /Neon Protocol locked, view pricing/i,
    });
    expect(link).toHaveAttribute("href", "/pricing?locked=neon-protocol");

    // Locked cards do NOT render a progressbar.
    expect(within(link).queryByRole("progressbar")).not.toBeInTheDocument();

    // Locked copy is surfaced for sighted users.
    expect(within(link).getByText("55 lessons locked")).toBeInTheDocument();
    expect(within(link).getByText(/Get access/i)).toBeInTheDocument();
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
    render(<WorldCards cards={cards} hasFullBundle={false} />);

    expect(
      screen.getByRole("link", { name: /Deep Orbit, 40% complete/i }),
    ).toHaveAttribute("href", "/worlds/deep-orbit");
    expect(
      screen.getByRole("link", { name: /Terra Grid locked/i }),
    ).toHaveAttribute("href", "/pricing?locked=terra-grid");
  });
});
