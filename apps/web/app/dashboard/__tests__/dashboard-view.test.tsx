import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { DashboardView } from "../dashboard-view";
import { dashboardFixture } from "./fixtures";

describe("learning dashboard", () => {
  it("leads with the lesson and labels the sequential recommendation honestly", () => {
    render(<DashboardView {...dashboardFixture()} />);
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent(
      "Understanding Tensor Shapes",
    );
    expect(
      screen.getByRole("link", { name: "Continue course →" }),
    ).toHaveAttribute("href", "/worlds/deep-orbit/foundations/tensor-shapes");
    expect(screen.getByText("1 of 56 lessons completed")).toBeInTheDocument();
    expect(
      screen.queryByText(
        /pts|average score|skill genome|learning trend|coming soon/i,
      ),
    ).toBeNull();
  });
  it("makes due review a direct action before the curriculum", () => {
    const { container } = render(
      <DashboardView
        {...dashboardFixture({
          dueReviews: [
            {
              label: "Review due: Introduction to Tensors",
              href: "/review",
              detail: "",
            },
          ],
        })}
      />,
    );
    const review = screen.getByRole("link", { name: "Review now →" });
    expect(review).toHaveAttribute("href", "/review");
    const sections = [...container.querySelectorAll("section")];
    expect(sections.findIndex((s) => s.contains(review))).toBeLessThan(
      sections.findIndex((s) => s.querySelector("#course-heading")),
    );
  });
  it("omits review and accomplishment panels when nothing is actionable", () => {
    render(
      <DashboardView
        {...dashboardFixture({ completedLessons: 0, currentStreak: 0 })}
      />,
    );
    expect(
      screen.queryByRole("heading", { name: /reviews? ready/ }),
    ).toBeNull();
    expect(
      screen.queryByRole("heading", { name: "Your discoveries" }),
    ).toBeNull();
    expect(
      screen.getByRole("link", { name: "View curriculum →" }),
    ).toHaveAttribute("href", "/worlds/deep-orbit");
  });
  it("limits recent accomplishments to three completed lessons with links", () => {
    const items = Array.from({ length: 5 }, (_, i) => ({
      event: "lesson_completed",
      time: "yesterday",
      detail: `Lesson ${i}`,
      href: `/lesson-${i}`,
      score: null,
    }));
    render(<DashboardView {...dashboardFixture({ recentActivity: items })} />);
    expect(
      screen.getAllByRole("link", { name: /^Completed Lesson/ }),
    ).toHaveLength(3);
    expect(
      screen.getByRole("link", { name: "Completed Lesson 0" }),
    ).toHaveAttribute("href", "/lesson-0");
    expect(screen.queryByText("lesson_completed")).toBeNull();
  });
  it("does not invent zero progress when records fail to load", () => {
    render(
      <DashboardView
        {...dashboardFixture({
          progressUnavailable: true,
          reviewsUnavailable: true,
        })}
      />,
    );
    expect(
      screen.getByText(/Course progress could not load/),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Continue course →" }),
    ).toBeNull();
  });
  it("has no accessibility violations", async () => {
    const { axe } = await import("vitest-axe");
    const { container } = render(
      <DashboardView
        {...dashboardFixture({
          dueReviews: [
            { label: "Review due: Tensors", href: "/review", detail: "" },
          ],
        })}
      />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
