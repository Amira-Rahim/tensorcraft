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

// Canvas/rAF-driven client component; irrelevant to stub layout assertions.
vi.mock("@/app/components/ambient-background", () => ({
  AmbientBackground: () => null,
}));

describe("ComingSoonStub", () => {
  it("renders status board, roster, skills, careers, cast, and both forms", () => {
    render(<ComingSoonStub theme={signalWard} />);

    expect(
      screen.getByText("MERIDIAN GENERAL HOSPITAL · EHR STATUS BOARD"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("SYSTEM OFFLINE · REBUILD PENDING"),
    ).toBeInTheDocument();

    expect(screen.getByText(/ML Through Text/)).toBeInTheDocument();
    expect(screen.getByText("FREE")).toBeInTheDocument();
    expect(screen.getByText(/Capstone: Diagnostic One/)).toBeInTheDocument();

    // These match the roster heading and roster footnote, not the stats strip.
    expect(screen.getByText(/11 Wards/i)).toBeInTheDocument();
    expect(screen.getByText(/55 Procedures/i)).toBeInTheDocument();

    // These are unique to the stats strip (value/label rendered as sibling divs).
    expect(screen.getByText("Capstone Model")).toBeInTheDocument();
    expect(screen.getByText(/Ward 1 at Launch/i)).toBeInTheDocument();

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
    expect(screen.queryByText(/11 Wards/i)).not.toBeInTheDocument();
    expect(screen.queryByText("Capstone Model")).not.toBeInTheDocument();
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
