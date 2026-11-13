import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderToStaticMarkup } from "react-dom/server";
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

  it("keeps paid lesson metadata inside a closed native disclosure", async () => {
    const user = userEvent.setup();
    const mod = makeModule({
      status: "locked",
      lessons: [
        makeLesson({ slug: "x", order: 1, title: "Blocked", status: "locked" }),
      ],
    });
    const { container } = render(
      <ModuleMapClient {...defaultProps} modules={[mod]} />,
    );
    const details = container.querySelector("details");
    const summary = container.querySelector("summary");

    expect(details).not.toHaveAttribute("open");
    expect(summary).toHaveAttribute(
      "aria-label",
      "Module 1: Foundations, locked module",
    );
    expect(summary).toHaveClass("min-h-11", "focus-visible:outline-2");
    expect(summary?.querySelector("a, button, input, select")).toBeNull();
    expect(within(details!).getByTestId("lesson-list")).toHaveTextContent(
      "Blocked",
    );
    expect(within(details!).getByTestId("lesson-list")).toHaveTextContent(
      "12 min",
    );
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();

    await user.tab();
    expect(summary).toHaveFocus();
    await user.click(summary!);
    expect(details).toHaveAttribute("open");
    await user.click(summary!);
    expect(details).not.toHaveAttribute("open");
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

  const paidModules = [
    makeModule({
      slug: "neural-networks",
      title: "Neural Networks",
      order: 2,
      description: "Build a neural network and inspect its predictions.",
      status: "locked",
      lessons: [
        makeLesson({
          slug: "neuron",
          title: "A Single Neuron",
          estimatedMinutes: 18,
          status: "locked",
        }),
        makeLesson({
          slug: "layers",
          title: "Layers and Activations",
          order: 2,
          estimatedMinutes: 21,
          status: "locked",
        }),
      ],
    }),
    makeModule({
      slug: "training",
      title: "Training",
      order: 3,
      description: "Train a model and compare its errors on later readings.",
      status: "locked",
      lessons: [
        makeLesson({
          slug: "loss",
          title: "Loss Functions",
          estimatedMinutes: 15,
          status: "locked",
        }),
      ],
    }),
  ];
  const guestTeaser = {
    href: "/pricing?locked=deep-orbit",
    label: "From $79, Module 1 free",
  };

  it.each([
    { viewer: "guest", access: { lockedTeaser: guestTeaser } },
    { viewer: "signed-in non-purchaser", access: { unlockHref: "/paywall" } },
  ])(
    "includes the complete syllabus in initial HTML for a $viewer",
    ({ access }) => {
      const html = renderToStaticMarkup(
        <ModuleMapClient
          {...defaultProps}
          modules={[makeModule(), ...paidModules]}
          {...access}
        />,
      );
      const markup = document.createElement("div");
      markup.innerHTML = html;

      for (const mod of paidModules) {
        const details = markup.querySelector(
          `details[data-module="${mod.slug}"]`,
        );
        expect(details).not.toBeNull();
        expect(details).not.toHaveAttribute("open");
        expect(details).toHaveTextContent(mod.description);
        expect(details).toHaveTextContent("Paid module");
        for (const lesson of mod.lessons) {
          const title = within(details as HTMLElement).getByText(lesson.title);
          expect(title.closest("a")).toBeNull();
          expect(title).not.toHaveClass("truncate");
          expect(title).toHaveStyle({ color: "var(--tc-text)" });
          expect(details).toHaveTextContent(`${lesson.estimatedMinutes} min`);
          expect(
            markup.querySelector(
              `a[href="/worlds/deep-orbit/${mod.slug}/${lesson.slug}"]`,
            ),
          ).toBeNull();
        }
      }
      expect(
        markup.querySelector('a[href="/worlds/deep-orbit/foundations/l1"]'),
      ).not.toBeNull();
    },
  );

  it("shows one guest course pricing action outside the first paid disclosure", () => {
    const { container } = render(
      <ModuleMapClient
        {...defaultProps}
        modules={[makeModule(), ...paidModules]}
        lockedTeaser={guestTeaser}
      />,
    );

    const teasers = screen.getAllByTestId("locked-teaser");
    expect(teasers).toHaveLength(1);
    const teaser = screen.getByRole("link", { name: "View course pricing" });
    expect(teaser).toHaveAttribute("href", "/pricing?locked=deep-orbit");
    expect(teaser).toHaveTextContent("View course pricing");
    expect(teaser).toHaveClass("min-h-11");
    expect(teaser.closest("details, summary, ul")).toBeNull();
    expect(
      screen.getAllByText(`Course access: ${guestTeaser.label}`),
    ).toHaveLength(1);
    expect(
      container.querySelector("#module-neural-networks")?.parentElement,
    ).toContainElement(teaser);
    expect(
      container
        .querySelector("#module-training")
        ?.parentElement?.querySelector("a"),
    ).toBeNull();
    expect(
      container.querySelectorAll('a[href="/pricing?locked=deep-orbit"]'),
    ).toHaveLength(1);
  });

  it("shows one signed-in course unlock action and keeps later rows as syllabus disclosures", () => {
    const { container } = render(
      <ModuleMapClient
        {...defaultProps}
        modules={paidModules}
        unlockHref="/paywall"
      />,
    );

    const link = screen.getByRole("link", { name: "Unlock course" });
    expect(link).toHaveAttribute("href", "/paywall");
    expect(link).toHaveTextContent("Unlock course");
    expect(link.closest("summary, details, ul")).toBeNull();
    expect(
      container.querySelector("#module-neural-networks")?.parentElement,
    ).toContainElement(link);
    expect(
      container
        .querySelector("#module-training")
        ?.parentElement?.querySelector("a"),
    ).toBeNull();
    expect(container.querySelectorAll('a[href="/paywall"]')).toHaveLength(1);
    expect(screen.getAllByText(/Paid module/)).toHaveLength(paidModules.length);
  });

  it("never links a paid lesson when saved progress says it was available or completed", () => {
    const { container } = render(
      <ModuleMapClient
        {...defaultProps}
        modules={[
          makeModule({
            status: "locked",
            lessons: [
              makeLesson({
                slug: "previously-open",
                title: "Previously Open",
                status: "available",
              }),
              makeLesson({
                slug: "previously-done",
                title: "Previously Done",
                status: "completed",
              }),
            ],
          }),
        ]}
        unlockHref="/paywall"
      />,
    );

    const list = screen.getByTestId("lesson-list");
    expect(list.querySelector("a")).toBeNull();
    expect(within(list).getAllByLabelText("Purchase required")).toHaveLength(2);
    expect(
      container.querySelectorAll('[data-lesson-status="locked"]'),
    ).toHaveLength(2);
  });

  it("keeps later syllabus rows available without purchase language for purchasers", () => {
    const { container } = render(
      <ModuleMapClient {...defaultProps} modules={paidModules} />,
    );
    expect(container.querySelectorAll("details")).toHaveLength(2);
    expect(screen.getAllByTestId("lesson-list")).toHaveLength(2);
    expect(screen.queryByTestId("locked-teaser")).not.toBeInTheDocument();
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getAllByText(/Locked module/)).toHaveLength(2);
    expect(screen.queryByText(/Paid module/)).not.toBeInTheDocument();
    expect(
      screen.queryByLabelText("Purchase required"),
    ).not.toBeInTheDocument();
  });

  it("preserves purchased module progress, current lesson links, and completed lessons", () => {
    const mod = makeModule({
      slug: "neural-networks",
      title: "Neural Networks",
      status: "active",
      completedLessons: 1,
      lessons: [
        makeLesson({ slug: "done", title: "Done", status: "completed" }),
        makeLesson({
          slug: "current",
          title: "Current",
          status: "in_progress",
        }),
      ],
    });
    const { container } = render(
      <ModuleMapClient
        {...defaultProps}
        modules={[mod]}
        continueHref="/worlds/deep-orbit/neural-networks/current"
      />,
    );

    expect(container.querySelector("details")).toHaveAttribute("open");
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "aria-valuenow",
      "50",
    );
    expect(
      screen.getByRole("link", { name: "Done, Completed" }),
    ).toHaveAttribute("href", "/worlds/deep-orbit/neural-networks/done");
    expect(
      screen.getByRole("link", { name: "Current, In progress" }),
    ).toHaveAttribute("href", "/worlds/deep-orbit/neural-networks/current");
    expect(screen.queryByText(/Paid module/)).not.toBeInTheDocument();
    expect(screen.queryByText("View course pricing")).not.toBeInTheDocument();
    expect(screen.queryByText("Unlock course")).not.toBeInTheDocument();
  });
});
