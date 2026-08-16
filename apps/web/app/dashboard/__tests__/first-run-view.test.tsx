import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { axe } from "vitest-axe";
import { FirstRunView, type FirstRunProps } from "../first-run-view";

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

function baseProps(overrides: Partial<FirstRunProps> = {}): FirstRunProps {
  return {
    displayName: "Amira",
    worldName: "Deep Orbit",
    worldSlug: "deep-orbit",
    plateSrc: "/locations/deep-orbit/dashboard-station.webp",
    briefing: {
      number: 1,
      name: "Foundations: Tensors & Data",
      lessonNumber: 1,
      totalLessons: 5,
      estimatedMinutes: 12,
      topic: "Introduction to Tensors",
    },
    resumeUrl: "/worlds/deep-orbit/foundations/introduction-to-tensors",
    firstPatchLessonCount: 5,
    totalWorldLessons: 56,
    ...overrides,
  };
}

describe("FirstRunView", () => {
  it("renders the transmission header, operator line, and briefing", () => {
    render(<FirstRunView {...baseProps()} />);
    expect(
      screen.getByText(/ARCHIMEDES · MONITORING STATION/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/SIGNAL: SECTOR 7-G · 64 CHANNELS · LIVE/i),
    ).toBeInTheDocument();
    expect(screen.getByText(/OPERATOR: Amira/i)).toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Module 1: Foundations: Tensors & Data/i,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Lesson 1 of 5 · ~12 min · Introduction to Tensors/i),
    ).toBeInTheDocument();
  });

  it("links the CTA to the first lesson using world terminology", () => {
    render(<FirstRunView {...baseProps()} />);
    const cta = screen.getByRole("link", { name: /Start First Mission/i });
    expect(cta).toHaveAttribute(
      "href",
      "/worlds/deep-orbit/foundations/introduction-to-tensors",
    );
  });

  it("renders the stat strip and instruments line", () => {
    render(<FirstRunView {...baseProps()} />);
    expect(screen.getByText(/starts today/i)).toBeInTheDocument();
    expect(screen.getByText(/after 5 lessons/i)).toBeInTheDocument();
    expect(screen.getByText(/0 \/ 56 lessons/i)).toBeInTheDocument();
    expect(
      screen.getByText(
        /Activity, skill genome, bridges, and patches switch on after your first completed lesson\./i,
      ),
    ).toBeInTheDocument();
  });

  it("omits the first-patch stat when no patch art exists", () => {
    render(
      <FirstRunView {...baseProps({ firstPatchLessonCount: undefined })} />,
    );
    expect(screen.queryByText(/after 5 lessons/i)).not.toBeInTheDocument();
  });

  it("renders no art and no status line for a world without them", () => {
    render(
      <FirstRunView
        {...baseProps({
          worldSlug: "neon-protocol",
          worldName: "Neon Protocol",
          plateSrc: undefined,
        })}
      />,
    );
    expect(screen.queryByTestId("art-plate")).not.toBeInTheDocument();
    expect(screen.queryByText(/SECTOR 7-G/i)).not.toBeInTheDocument();
    // Kicker falls back to the world name.
    expect(screen.getByText("NEON PROTOCOL")).toBeInTheDocument();
    // CTA consumes the world's own terminology (neon-protocol's lesson
    // term is "Protocol"; the "Lesson" fallback only fires for slugs
    // absent from the worlds record).
    expect(
      screen.getByRole("link", { name: /Start First Protocol/i }),
    ).toBeInTheDocument();
  });

  it("falls back to the world page when there is no resume URL", () => {
    render(
      <FirstRunView {...baseProps({ resumeUrl: null, briefing: null })} />,
    );
    const cta = screen.getByRole("link", { name: /Start Learning/i });
    expect(cta).toHaveAttribute("href", "/worlds/deep-orbit");
    // Briefing falls back to the world name as the heading.
    expect(
      screen.getByRole("heading", { level: 1, name: /Deep Orbit/i }),
    ).toBeInTheDocument();
  });

  it("renders none of the analytics panels", () => {
    render(<FirstRunView {...baseProps()} />);
    // Case-sensitive exact panel headings: the instruments sentence
    // mentions "skill genome" and "bridges" in lowercase prose, which a
    // case-insensitive regex would false-match.
    expect(screen.queryByText("SKILL GENOME")).not.toBeInTheDocument();
    expect(screen.queryByText("ACTIVITY · 30 DAYS")).not.toBeInTheDocument();
    expect(screen.queryByText("Bridges Collected")).not.toBeInTheDocument();
    expect(screen.queryByText("Mission Patches")).not.toBeInTheDocument();
    expect(screen.queryByText("LEARNING TREND")).not.toBeInTheDocument();
  });

  it("has no accessibility violations", async () => {
    const { container } = render(<FirstRunView {...baseProps()} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
