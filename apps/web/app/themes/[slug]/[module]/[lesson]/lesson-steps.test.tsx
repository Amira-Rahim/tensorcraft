import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { LessonSteps } from "./lesson-steps";

// Stub next/link so render works without the Next router.
vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Step content is exercised in lesson-content.test.tsx; stub it here so the
// suite focuses on step navigation chrome.
vi.mock("./lesson-content", () => ({
  LessonContent: () => <div data-testid="lesson-content" />,
}));

vi.mock("./lesson-drawer", () => ({
  LessonDrawer: () => null,
}));

vi.mock("@tensorcraft/ui", () => ({
  SceneHeading: () => null,
}));

vi.mock("@/lib/progress-client", () => ({
  markLessonStarted: vi.fn().mockResolvedValue(undefined),
  markLessonCompleted: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/analytics", () => ({
  trackLessonStarted: vi.fn(),
  trackLessonCompleted: vi.fn(),
}));

const theme = {
  displayName: "Deep Orbit",
  palette: {
    primary: "#6ee7b7",
    accent: "#34d399",
    text: "#e7fff5",
    muted: "#9fb8ac",
    surface: "#0d1f18",
    bg: "#081410",
    border: "#1d3a2e",
    codeBg: "#0a1a13",
  },
  terminology: { lesson: "mission", module: "sector", exercise: "drill" },
};

const lesson = {
  title: "Introduction to Tensors",
  order: 1,
  estimatedMinutes: 10,
  body: "",
  context: { narrative: "n" },
  concept: { explanation: "e" },
  consequence: { narrative: "c" },
};

const STEP_KEY = "tc_step_deep-orbit_introduction-to-tensors";
const MAX_KEY = "tc_step_max_deep-orbit_introduction-to-tensors";

function renderSteps() {
  return render(
    <LessonSteps
      lesson={lesson}
      exercises={[]}
      theme={theme}
      themeSlug="deep-orbit"
      moduleSlug="foundations"
      moduleName="Foundations: Tensors & Data"
      prevLesson={null}
      nextLesson={null}
    />,
  );
}

beforeEach(() => {
  localStorage.clear();
});

describe("LessonSteps, segmented progress bar", () => {
  it("renders one segment button per step", () => {
    renderSteps();
    const segments = screen.getAllByRole("button", { name: /^Step \d/ });
    expect(segments).toHaveLength(6);
  });

  it("marks the current step segment with aria-current", () => {
    renderSteps();
    const first = screen.getByRole("button", { name: /^Step 1/ });
    expect(first).toHaveAttribute("aria-current", "step");
  });

  it("jumps back to a visited step when its segment is clicked", () => {
    localStorage.setItem(STEP_KEY, "2");
    renderSteps();
    expect(screen.getByText("3 / 6")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Step 1/ }));
    expect(screen.getByText("1 / 6")).toBeInTheDocument();
  });

  it("disables segments beyond the furthest step reached", () => {
    localStorage.setItem(STEP_KEY, "2");
    renderSteps();
    expect(screen.getByRole("button", { name: /^Step 4/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Step 6/ })).toBeDisabled();
  });

  it("keeps forward segments clickable after jumping back", () => {
    localStorage.setItem(STEP_KEY, "2");
    renderSteps();

    fireEvent.click(screen.getByRole("button", { name: /^Step 1/ }));
    expect(screen.getByText("1 / 6")).toBeInTheDocument();

    const third = screen.getByRole("button", { name: /^Step 3/ });
    expect(third).not.toBeDisabled();
    fireEvent.click(third);
    expect(screen.getByText("3 / 6")).toBeInTheDocument();
  });

  it("restores the furthest step reached from storage after going back in a previous visit", () => {
    // Earlier visit reached step 3 (index 2), then went back to the start.
    localStorage.setItem(STEP_KEY, "0");
    localStorage.setItem(MAX_KEY, "2");
    renderSteps();

    expect(screen.getByText("1 / 6")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Step 3/ })).not.toBeDisabled();
  });

  it("persists the furthest step reached when navigating back", () => {
    localStorage.setItem(STEP_KEY, "2");
    renderSteps();

    fireEvent.click(screen.getByRole("button", { name: /^Step 1/ }));
    expect(localStorage.getItem(STEP_KEY)).toBe("0");
    expect(localStorage.getItem(MAX_KEY)).toBe("2");
  });
});
