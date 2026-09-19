import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComingSoonStub } from "../coming-soon-stub";
import { signalWard } from "@tensorcraft/worlds";
import type { WorldManifest } from "@tensorcraft/worlds";

// Render Next's <Link> as a plain anchor for href assertions in unit tests.
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

describe("ComingSoonStub", () => {
  it("renders status board, roster, skills, careers, cast, and both forms", () => {
    render(<ComingSoonStub world={signalWard} />);

    expect(
      screen.getByText("MERIDIAN GENERAL HOSPITAL · EHR STATUS BOARD"),
    ).toBeInTheDocument();
    // Status line lives in the hero scene frame's caption bar.
    expect(
      screen.getByText("SYSTEM OFFLINE · REBUILD PENDING"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("coming-soon-scene-signal-ward"),
    ).toBeInTheDocument();

    expect(screen.getByText(/ML Through Text/)).toBeInTheDocument();
    expect(screen.getByText(/Capstone: Diagnostic One/)).toBeInTheDocument();

    // Roster header carries the curriculum counts.
    expect(screen.getByText(/The 11 Wards/i)).toBeInTheDocument();
    expect(
      screen.getByText(/5 Procedures per Ward · 55 in the full course/i),
    ).toBeInTheDocument();

    // Status-board rows: module 1 online + free, 9 pending, capstone finale.
    expect(
      screen.getByTestId("coming-soon-roster-signal-ward"),
    ).toBeInTheDocument();
    expect(screen.getByText("Free at launch")).toBeInTheDocument();
    expect(screen.getAllByText("Planned")).toHaveLength(9);
    expect(screen.getByText("Planned finale")).toBeInTheDocument();

    // Skills: counted prose. Careers: salary range bars on a shared axis.
    expect(screen.getByText("clinical NLP")).toBeInTheDocument();
    expect(screen.getByText(/\d+ capabilities/)).toBeInTheDocument();
    expect(screen.getByText(/NLP Engineer/)).toBeInTheDocument();
    expect(screen.getByTestId("career-bars-signal-ward")).toBeInTheDocument();
    expect(screen.getByText("$114K–$237K")).toBeInTheDocument();
    expect(screen.getByText(/to \$350K \/ yr/)).toBeInTheDocument();

    // Cast: personnel dossier rows with initial-block avatars.
    expect(screen.getAllByTestId("character-avatar-placeholder")).toHaveLength(
      3,
    );

    expect(
      screen.getByText("Shows concern through action, not speeches"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Dr\. Khalil, MEDI/)).toBeInTheDocument();

    expect(
      screen.getByTestId("world-waitlist-input-signal-ward-hero"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("world-waitlist-input-signal-ward-footer"),
    ).toBeInTheDocument();

    const crossSell = screen.getByRole("link", { name: /deep orbit/i });
    expect(crossSell).toHaveAttribute("href", "/worlds/deep-orbit");
  });

  it("hides preview-driven sections when preview is absent", () => {
    const stripped: WorldManifest = { ...signalWard, preview: undefined };
    render(<ComingSoonStub world={stripped} />);
    expect(screen.queryByText(/ML Through Text/)).not.toBeInTheDocument();
    expect(screen.queryByText(/The 11 Wards/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Pending")).not.toBeInTheDocument();
    expect(
      screen.getByTestId("world-waitlist-input-signal-ward-hero"),
    ).toBeInTheDocument();
  });

  /**
   * Changed from PreOrder to OutOfStock on 2026-07-21.
   *
   * schema.org PreOrder means "orderable now, delivered later". These worlds
   * cannot be ordered at all: `validateWorldIds` in payments.ts hard-rejects
   * any unlaunched slug, so checkout refuses them even for a crafted request,
   * and the only affordance on the page is a waitlist. OutOfStock is the
   * truthful term for an item that exists but cannot currently be bought.
   */
  it("marks the JSON-LD offer OutOfStock, not PreOrder", () => {
    const { container } = render(<ComingSoonStub world={signalWard} />);
    const ld = container.querySelector('script[type="application/ld+json"]');
    expect(ld!.textContent).toContain("OutOfStock");
    expect(ld!.textContent).not.toContain("PreOrder");
  });
});
