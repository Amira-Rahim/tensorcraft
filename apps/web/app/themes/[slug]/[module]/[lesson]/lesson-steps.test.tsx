import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
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
  LessonContent: ({ storyRegister }: { storyRegister?: boolean }) => (
    <div
      data-testid="lesson-content"
      data-story-register={storyRegister ? "true" : undefined}
    />
  ),
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

describe("LessonSteps, exit chip", () => {
  it("labels the exit link Mission Map and points at the theme page", () => {
    renderSteps();
    const exit = screen.getByRole("link", { name: /mission map/i });
    expect(exit).toHaveAttribute("href", "/themes/deep-orbit");
  });
});

describe("LessonSteps, briefing meta line", () => {
  it("shows minutes only when there are no exercises, no bridge tier", () => {
    renderSteps();
    expect(screen.getByText(/10 min/i)).toBeInTheDocument();
    expect(screen.queryByText(/exercise/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/bridge/i)).not.toBeInTheDocument();
  });

  it("appends pluralized exercise count when exercises exist", () => {
    render(
      <LessonSteps
        lesson={lesson}
        exercises={[{ slug: "a" }, { slug: "b" }] as never}
        theme={theme}
        themeSlug="deep-orbit"
        moduleSlug="foundations"
        moduleName="Foundations: Tensors & Data"
        prevLesson={null}
        nextLesson={null}
      />,
    );
    expect(screen.getByText(/10 min · 2 exercises/i)).toBeInTheDocument();
  });

  it("uses the singular form for one exercise", () => {
    render(
      <LessonSteps
        lesson={lesson}
        exercises={[{ slug: "a" }] as never}
        theme={theme}
        themeSlug="deep-orbit"
        moduleSlug="foundations"
        moduleName="Foundations: Tensors & Data"
        prevLesson={null}
        nextLesson={null}
      />,
    );
    expect(screen.getByText(/10 min · 1 exercise$/i)).toBeInTheDocument();
  });
});

describe("LessonSteps, story register", () => {
  it("flags Briefing content as story register, Concept step not", () => {
    renderSteps();
    expect(
      document.querySelector("[data-story-register='true']"),
    ).toBeInTheDocument();

    // Skip the script playback so Continue is reachable in later asserts.
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(
      document.querySelector("[data-story-register='true']"),
    ).not.toBeInTheDocument();
  });
});

describe("LessonSteps, LessonShell layout", () => {
  it("renders the Briefing through a right-rail shell", () => {
    renderSteps();
    const right = screen.getByTestId("lesson-right");
    expect(right).toHaveAttribute("data-kind", "rail");
  });

  it("renders a two-column rail shell on the Concept step", () => {
    renderSteps();
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    const right = screen.getByTestId("lesson-right");
    expect(right).toHaveAttribute("data-kind", "rail");
  });

  it("collapses to a single column on the Consequence step", () => {
    // Reach the final step directly via persisted state.
    localStorage.setItem(STEP_KEY, "5");
    localStorage.setItem(MAX_KEY, "5");
    renderSteps();
    expect(screen.getByText("6 / 6")).toBeInTheDocument();
    expect(screen.queryByTestId("lesson-right")).not.toBeInTheDocument();
  });
});

describe("LessonSteps, step navigation chrome", () => {
  it("has no bottom Back button; backward nav is the segmented bar", () => {
    renderSteps();
    expect(
      screen.queryByRole("button", { name: /back/i }),
    ).not.toBeInTheDocument();
  });
});

describe("LessonSteps, script playback", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("auto-plays the script on first visit to the Briefing step", () => {
    renderSteps();
    expect(
      document.querySelector("[data-script-state='playing']"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /skip/i })).toBeInTheDocument();
  });

  it("finishes after the timeline and offers Replay", () => {
    renderSteps();
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(
      document.querySelector("[data-script-state='done']"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /replay/i })).toBeInTheDocument();
  });

  it("Skip jumps straight to the finished state", () => {
    renderSteps();
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    expect(
      document.querySelector("[data-script-state='done']"),
    ).toBeInTheDocument();
  });

  it("Replay restarts the playback", () => {
    renderSteps();
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    fireEvent.click(screen.getByRole("button", { name: /replay/i }));
    expect(
      document.querySelector("[data-script-state='playing']"),
    ).toBeInTheDocument();
  });

  it("does not auto-play again when returning to the Briefing step", () => {
    renderSteps();
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    fireEvent.click(screen.getByRole("button", { name: /^Step 1/ }));
    expect(
      document.querySelector("[data-script-state='done']"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /replay/i })).toBeInTheDocument();
  });
});
