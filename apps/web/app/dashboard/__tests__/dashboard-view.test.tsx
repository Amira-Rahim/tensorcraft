import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { DashboardView, type DashboardProps } from "../dashboard-view";

// Render Next's <Link> as a plain <a> so the dashboard view can mount
// without the Next app runtime.
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

// UserAvatar pulls in Next <Image>; stub it for the unit test environment.
vi.mock("@/app/components/user-avatar", () => ({
  UserAvatar: () => null,
}));

// SkillGenome is already covered by skill-genome.test.tsx — we don't want
// its internals (or subpath import of @tensorcraft/ui/visualizations for
// hexCorners) interacting with assertions about the adjacent LossCurve.
vi.mock("../skill-genome", () => ({
  SkillGenome: () => <div data-testid="skill-genome-mock" />,
}));

/** 12 weeks of non-null hint averages, monotonically decreasing. */
const fullWeekly = Array.from({ length: 12 }, (_, i) => ({
  weekStart: `2026-0${1 + Math.floor(i / 4)}-${String((i % 4) * 7 + 1).padStart(2, "0")}`,
  avgHints: 5 - i * 0.3,
}));

/** 12 weeks of all-null averages — drives the LossCurve empty state. */
const emptyWeekly = Array.from({ length: 12 }, (_, i) => ({
  weekStart: `2026-0${1 + Math.floor(i / 4)}-${String((i % 4) * 7 + 1).padStart(2, "0")}`,
  avgHints: null,
}));

function baseProps(overrides: Partial<DashboardProps> = {}): DashboardProps {
  return {
    displayName: "Ada",
    avatarUrl: null,
    themeName: "Deep Orbit",
    themeSlug: "deep-orbit",
    modules: [
      {
        number: "M01",
        name: "Foundations",
        status: "active",
        score: null,
        formula: "y=mx+b",
        slug: "foundations",
      },
    ],
    currentModule: null,
    themeProgressPercent: 0,
    themePoints: { current: 0, total: 100 },
    currentStreak: 0,
    bestStreak: 0,
    averageScore: 0,
    bridges: [],
    activityDays: Array(30).fill(0),
    recentActivity: [],
    resumeUrl: null,
    totalModules: 1,
    completedModules: 0,
    genomeData: [],
    lossCurveData: { weekly: fullWeekly },
    ...overrides,
  };
}

describe("DashboardView (LossCurve integration)", () => {
  it("renders the LossCurve comment header when lossCurveData is provided", () => {
    render(<DashboardView {...baseProps()} />);
    // The LossCurve SVG text: "// loss.hints — {n}wk"
    expect(screen.getByText(/\/\/\s*loss\.hints/i)).toBeInTheDocument();
  });

  it("wraps the LossCurve in a <section aria-labelledby=...> with a section heading", () => {
    const { container } = render(<DashboardView {...baseProps()} />);

    // The LossCurve SVG is the visual anchor.
    const lossCurveSvg = container.querySelector(
      "svg[aria-labelledby='lc-title']",
    );
    expect(lossCurveSvg).not.toBeNull();

    // Walk up to a <section> that exposes aria-labelledby pointing at a
    // heading inside the same section. This matches the pattern from
    // spec §9 (accessible sectioning).
    const section = lossCurveSvg!.closest("section");
    expect(section).not.toBeNull();
    const labelledBy = section!.getAttribute("aria-labelledby");
    expect(labelledBy).toBeTruthy();

    const heading = section!.querySelector(`#${labelledBy}`);
    expect(heading).not.toBeNull();
    expect(heading!.textContent?.trim().length).toBeGreaterThan(0);
  });

  it("renders the LossCurve empty-state copy when weekly avgHints are all null", () => {
    render(
      <DashboardView
        {...baseProps({ lossCurveData: { weekly: emptyWeekly } })}
      />,
    );
    expect(
      screen.getByText(/Complete 3\+ exercises to see trend/i),
    ).toBeInTheDocument();
  });
});
