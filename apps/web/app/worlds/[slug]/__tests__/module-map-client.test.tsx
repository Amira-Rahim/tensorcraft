import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import { ModuleMapClient } from "../module-map-client";

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

type ModuleProps = React.ComponentProps<typeof ModuleMapClient>;
type ModuleItem = ModuleProps["modules"][number];
type LessonItem = ModuleItem["lessons"][number];

function makeLesson(overrides: Partial<LessonItem> = {}): LessonItem {
  return {
    slug: "intro-tensors",
    title: "Intro to Tensors",
    moduleSlug: "foundations",
    order: 1,
    estimatedMinutes: 12,
    difficulty: "beginner",
    status: "available",
    ...overrides,
  };
}

function makeModule(overrides: Partial<ModuleItem> = {}): ModuleItem {
  return {
    slug: "foundations",
    title: "Foundations",
    order: 1,
    description: "Tensors, shapes, and broadcasting basics.",
    status: "active",
    completedLessons: 0,
    totalLessons: 2,
    avgScore: null,
    lessons: [
      makeLesson({ slug: "l1", order: 1, title: "Lesson One" }),
      makeLesson({
        slug: "l2",
        order: 2,
        title: "Lesson Two",
        status: "locked",
      }),
    ],
    ...overrides,
  };
}

const defaultProps: ModuleProps = {
  modules: [makeModule()],
  worldSlug: "deep-orbit",
  continueHref: "/worlds/deep-orbit/foundations/l1",
  continueLabel: "Continue M1",
};

describe("ModuleMapClient", () => {
  it("renders the module title and continue CTA", () => {
    render(<ModuleMapClient {...defaultProps} />);

    expect(screen.getByText("Foundations")).toBeInTheDocument();
    const cta = screen.getByTestId("continue-cta");
    expect(cta).toHaveAttribute("href", "/worlds/deep-orbit/foundations/l1");
    expect(cta).toHaveTextContent(/Continue M1/i);
  });

  it("lists every lesson from module content", () => {
    render(<ModuleMapClient {...defaultProps} />);

    const list = screen.getByTestId("lesson-list");
    expect(within(list).getByText("Lesson One")).toBeInTheDocument();
    expect(within(list).getByText("Lesson Two")).toBeInTheDocument();
  });

  it("renders status icons per lesson progress", () => {
    const mod = makeModule({
      status: "active",
      completedLessons: 1,
      totalLessons: 3,
      lessons: [
        makeLesson({
          slug: "done",
          order: 1,
          title: "Done",
          status: "completed",
        }),
        makeLesson({
          slug: "current",
          order: 2,
          title: "Current",
          status: "in_progress",
        }),
        makeLesson({
          slug: "open",
          order: 3,
          title: "Open",
          status: "available",
        }),
      ],
    });
    render(<ModuleMapClient {...defaultProps} modules={[mod]} />);

    expect(screen.getByTestId("lesson-icon-completed")).toHaveTextContent("✓");
    expect(screen.getByTestId("lesson-icon-in_progress")).toHaveTextContent(
      "●",
    );
    expect(screen.getByTestId("lesson-icon-available")).toHaveTextContent("○");
  });

  it("shows the mission patch on a completed module, never on others", () => {
    const done = makeModule({
      slug: "foundations",
      status: "completed",
      patchSrc: "/patches/deep-orbit/foundations.webp",
    });
    const active = makeModule({
      slug: "neural-networks",
      title: "Neural Networks",
      order: 2,
      status: "active",
      patchSrc: "/patches/deep-orbit/neural-networks.webp",
    });
    render(<ModuleMapClient {...defaultProps} modules={[done, active]} />);

    const patches = screen.getAllByTestId("module-patch");
    expect(patches).toHaveLength(1);
    expect(patches[0]!.getAttribute("src")).toBe(
      "/patches/deep-orbit/foundations.webp",
    );
  });

  it("renders a locked icon for locked lessons in active modules", () => {
    render(<ModuleMapClient {...defaultProps} />);
    // makeModule default: l2 is locked, module is active
    const icon = screen.getByTestId("lesson-icon-locked");
    expect(icon).toHaveTextContent("🔒");
  });

  it("applies brutalist rounded-none class on lesson cards and CTA", () => {
    const { container } = render(<ModuleMapClient {...defaultProps} />);
    const roundedNoneEls = container.querySelectorAll(".rounded-none");
    // Expect several brutalist markers (module, lessons, CTA, icons).
    expect(roundedNoneEls.length).toBeGreaterThanOrEqual(4);
    const cta = screen.getByTestId("continue-cta");
    expect(cta.className).toMatch(/rounded-none/);
  });

  it("links clickable lessons to the world/module/lesson route", () => {
    const mod = makeModule({
      status: "active",
      completedLessons: 0,
      totalLessons: 1,
      lessons: [
        makeLesson({
          slug: "clickable",
          order: 1,
          title: "Clickable",
          status: "available",
        }),
      ],
    });
    render(<ModuleMapClient {...defaultProps} modules={[mod]} />);

    const link = screen.getByRole("link", {
      name: /Clickable, Not started/i,
    });
    expect(link).toHaveAttribute(
      "href",
      "/worlds/deep-orbit/foundations/clickable",
    );
  });

  it("marks the active module's <details> as open", () => {
    const { container } = render(<ModuleMapClient {...defaultProps} />);
    const details = container.querySelector(
      "details[data-module='foundations']",
    );
    expect(details).not.toBeNull();
    expect(details).toHaveAttribute("open");
  });

  it("does not auto-open a locked module and hides its lesson list", () => {
    const mod = makeModule({
      status: "locked",
      lessons: [
        makeLesson({ slug: "x", order: 1, title: "Blocked", status: "locked" }),
      ],
    });
    render(<ModuleMapClient {...defaultProps} modules={[mod]} />);

    // Lesson list is omitted for locked modules (they render no expanded body).
    expect(screen.queryByTestId("lesson-list")).not.toBeInTheDocument();
  });

  it("exposes a progressbar for module completion with correct percent", () => {
    const mod = makeModule({
      status: "active",
      completedLessons: 1,
      totalLessons: 4,
      lessons: [
        makeLesson({ slug: "a", order: 1, status: "completed" }),
        makeLesson({ slug: "b", order: 2, status: "in_progress" }),
        makeLesson({ slug: "c", order: 3, status: "locked" }),
        makeLesson({ slug: "d", order: 4, status: "locked" }),
      ],
    });
    render(<ModuleMapClient {...defaultProps} modules={[mod]} />);

    const bar = screen.getByRole("progressbar");
    expect(bar).toHaveAttribute("aria-valuenow", "25");
    expect(bar).toHaveAttribute("aria-valuemin", "0");
    expect(bar).toHaveAttribute("aria-valuemax", "100");
  });

  it("guest locked rows render the pricing teaser link, not a bare lock", () => {
    const locked = makeModule({
      slug: "neural-networks",
      title: "Neural Networks",
      order: 2,
      status: "locked",
    });
    render(
      <ModuleMapClient
        {...defaultProps}
        modules={[locked]}
        unlockHref={undefined}
        lockedTeaser={{
          href: "/pricing?locked=deep-orbit",
          label: "From $50 · Module 1 free",
        }}
      />,
    );

    const teaser = screen.getByTestId("locked-teaser");
    expect(teaser).toHaveAttribute("href", "/pricing?locked=deep-orbit");
    expect(teaser).toHaveTextContent("From $50 · Module 1 free");
  });

  it("locked guest rows are clickable across the whole row, title included", () => {
    // The teaser used to be a chip absolutely positioned into the title row;
    // at phone widths it sat on top of the module titles (2026-08-29 design
    // audit). The link now wraps the full row, so the title lives inside it.
    const locked2 = makeModule({
      slug: "neural-networks",
      title: "Neural Networks",
      order: 2,
      status: "locked",
    });
    const locked3 = makeModule({
      slug: "training",
      title: "Training",
      order: 3,
      status: "locked",
    });
    render(
      <ModuleMapClient
        {...defaultProps}
        modules={[makeModule(), locked2, locked3]}
        lockedTeaser={{
          href: "/pricing?locked=deep-orbit",
          label: "From $50 · Module 1 free",
        }}
      />,
    );

    const teasers = screen.getAllByTestId("locked-teaser");
    expect(teasers).toHaveLength(2);
    for (const teaser of teasers) {
      expect(teaser).toHaveAttribute("href", "/pricing?locked=deep-orbit");
    }
    expect(teasers[0]).toHaveTextContent("Neural Networks");
    expect(teasers[1]).toHaveTextContent("Training");
  });

  it("states the price fact once; later locked rows carry the lock glyph", () => {
    const locked2 = makeModule({
      slug: "neural-networks",
      title: "Neural Networks",
      order: 2,
      status: "locked",
    });
    const locked3 = makeModule({
      slug: "training",
      title: "Training",
      order: 3,
      status: "locked",
    });
    render(
      <ModuleMapClient
        {...defaultProps}
        modules={[makeModule(), locked2, locked3]}
        lockedTeaser={{
          href: "/pricing?locked=deep-orbit",
          label: "From $50 · Module 1 free",
        }}
      />,
    );

    expect(screen.getAllByText("From $50 · Module 1 free")).toHaveLength(1);
    const teasers = screen.getAllByTestId("locked-teaser");
    expect(teasers[1]).toHaveTextContent("🔒");
  });

  it("locked rows for signed-in non-purchasers link the whole row to the paywall", () => {
    const locked = makeModule({
      slug: "neural-networks",
      title: "Neural Networks",
      order: 2,
      status: "locked",
    });
    render(
      <ModuleMapClient
        {...defaultProps}
        modules={[locked]}
        unlockHref="/paywall"
      />,
    );

    const link = screen.getByRole("link", {
      name: /Unlock module 2: Neural Networks/i,
    });
    expect(link).toHaveAttribute("href", "/paywall");
    expect(link).toHaveTextContent("Neural Networks");
  });

  it("locked rows without teaser or unlockHref keep the lock glyph", () => {
    const locked = makeModule({ status: "locked" });
    const { container } = render(
      <ModuleMapClient
        {...defaultProps}
        modules={[locked]}
        unlockHref={undefined}
      />,
    );
    expect(screen.queryByTestId("locked-teaser")).toBeNull();
    expect(container.textContent).toContain("🔒");
  });
});
