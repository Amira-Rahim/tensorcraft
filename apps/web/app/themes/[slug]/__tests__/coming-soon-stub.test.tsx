import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { ComingSoonStub } from "../coming-soon-stub";
import { signalWard } from "@tensorcraft/themes";
import type { ThemeManifest } from "@tensorcraft/themes";

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
    render(<ComingSoonStub theme={signalWard} />);

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
      screen.getByText(/5 Procedures per Ward · 55 in the full rebuild/i),
    ).toBeInTheDocument();

    // Status-board rows: module 1 online + free, 9 pending, capstone finale.
    expect(
      screen.getByTestId("coming-soon-roster-signal-ward"),
    ).toBeInTheDocument();
    expect(screen.getByText("Online · Free")).toBeInTheDocument();
    expect(screen.getAllByText("Pending")).toHaveLength(9);
    expect(screen.getByText("Finale")).toBeInTheDocument();

    expect(screen.getByText("clinical NLP")).toBeInTheDocument();
    expect(screen.getByText(/NLP Engineer/)).toBeInTheDocument();

    expect(
      screen.getByText("Shows concern through action, not speeches"),
    ).toBeInTheDocument();
    expect(screen.getByText(/Dr\. Khalil, MEDI/)).toBeInTheDocument();

    expect(
      screen.getByTestId("theme-waitlist-input-signal-ward-hero"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("theme-waitlist-input-signal-ward-footer"),
    ).toBeInTheDocument();

    const crossSell = screen.getByRole("link", { name: /deep orbit/i });
    expect(crossSell).toHaveAttribute("href", "/themes/deep-orbit");
  });

  it("hides preview-driven sections when preview is absent", () => {
    const stripped: ThemeManifest = { ...signalWard, preview: undefined };
    render(<ComingSoonStub theme={stripped} />);
    expect(screen.queryByText(/ML Through Text/)).not.toBeInTheDocument();
    expect(screen.queryByText(/The 11 Wards/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Pending")).not.toBeInTheDocument();
    expect(
      screen.getByTestId("theme-waitlist-input-signal-ward-hero"),
    ).toBeInTheDocument();
  });

  it("keeps the JSON-LD PreOrder offer", () => {
    const { container } = render(<ComingSoonStub theme={signalWard} />);
    const ld = container.querySelector('script[type="application/ld+json"]');
    expect(ld!.textContent).toContain("PreOrder");
  });
});
