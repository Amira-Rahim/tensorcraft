import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { LessonSteps } from "./lesson-steps";
import { trackLessonCompleted } from "@/lib/analytics";
import { markLessonCompleted, emitSkillEvent } from "@/lib/progress-client";

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
  AnimatedAvatar: ({ name, src }: { name: string; src?: string }) => (
    <div
      data-testid="animated-avatar-stub"
      data-name={name}
      data-src={src ?? ""}
    />
  ),
  ScenePortrait: ({ src }: { src: string }) => (
    <div data-testid="scene-portrait-stub" data-src={src} />
  ),
}));

vi.mock("@tensorcraft/ui/effects", () => ({
  AriaWaveformAvatar: ({ name }: { name?: string }) => (
    <div data-testid="aria-waveform-stub" data-name={name ?? "ARIA"} />
  ),
}));

vi.mock("@/lib/progress-client", () => ({
  markLessonStarted: vi.fn().mockResolvedValue(undefined),
  markLessonCompleted: vi.fn().mockResolvedValue(undefined),
  emitSkillEvent: vi.fn(),
}));

vi.mock("@/lib/analytics", () => ({
  trackLessonStarted: vi.fn(),
  trackLessonCompleted: vi.fn(),
  // The Skip control now emits script_skipped through the typed helper.
  track: vi.fn(),
  EVENTS: { SCRIPT_SKIPPED: "script_skipped" },
}));

// Reaching the final step fires a lazy import chain (api-url → supabase
// client → getSession → fetch) for the "first lesson" Kit tag. Stub it so the
// dynamic imports resolve to mocks instead of transforming the real modules
// after the test ends: otherwise the worker closes mid-import ("Closing rpc
// while fetch was pending").
vi.mock("@/lib/api-url", () => ({
  getApiUrl: () => "http://localhost",
}));
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
    },
  }),
}));

const lesson = {
  slug: "introduction-to-tensors",
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

  it("sums lesson + exercise minutes and pluralizes the count", () => {
    // 10 lesson + 12 + 18 exercise minutes: the meta line must charge the
    // page at its full cost, not the reading time alone (P4 round 3).
    render(
      <LessonSteps
        lesson={lesson}
        exercises={
          [
            { slug: "a", estimatedMinutes: 12 },
            { slug: "b", estimatedMinutes: 18 },
          ] as never
        }
        themeSlug="deep-orbit"
        moduleSlug="foundations"
        moduleName="Foundations: Tensors & Data"
        prevLesson={null}
        nextLesson={null}
      />,
    );
    expect(screen.getByText(/40 min · 2 exercises/i)).toBeInTheDocument();
  });

  it("uses the singular form for one exercise", () => {
    render(
      <LessonSteps
        lesson={lesson}
        exercises={[{ slug: "a", estimatedMinutes: 12 }] as never}
        themeSlug="deep-orbit"
        moduleSlug="foundations"
        moduleName="Foundations: Tensors & Data"
        prevLesson={null}
        nextLesson={null}
      />,
    );
    expect(screen.getByText(/22 min · 1 exercise$/i)).toBeInTheDocument();
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
  /**
   * This suite used to assert "has no bottom Back button; backward nav is the
   * segmented bar". A Back button was added in the 2026-07-14 UX audit and the
   * assertion was never updated, but it kept passing: renderSteps() defaults to
   * step 0, and step 0 is the one step that renders no Back button by design.
   * A guard that only holds where the feature cannot appear guards nothing.
   */
  it("renders no bottom Back button on the first step", () => {
    renderSteps();
    expect(
      screen.queryByRole("button", { name: /back/i }),
    ).not.toBeInTheDocument();
  });

  it("renders a bottom Back button once past the first step", () => {
    localStorage.setItem(STEP_KEY, "2");
    localStorage.setItem(MAX_KEY, "2");
    renderSteps();
    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
  });

  it("steps backward when the Back button is activated", () => {
    localStorage.setItem(STEP_KEY, "2");
    localStorage.setItem(MAX_KEY, "2");
    renderSteps();
    expect(screen.getByText("3 / 6")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByText("2 / 6")).toBeInTheDocument();
  });
});

describe("LessonSteps, completion signal dedupe (R3-7 / diff review D1)", () => {
  beforeEach(() => {
    vi.mocked(trackLessonCompleted).mockClear();
    vi.mocked(emitSkillEvent).mockClear();
    vi.mocked(markLessonCompleted).mockClear();
  });

  it("does NOT re-fire completion analytics or skill events on a mount restored to step 5", () => {
    // The refire scenario: a finished lesson is reloaded. prevStepRef alone
    // cannot catch this (the effect's first run stamps prev=0 before the
    // restore's setCurrentStep(5) lands), so restoredAtFinalStepRef must.
    localStorage.setItem(STEP_KEY, "5");
    localStorage.setItem(MAX_KEY, "5");
    renderSteps();
    expect(screen.getByText("6 / 6")).toBeInTheDocument();
    expect(trackLessonCompleted).not.toHaveBeenCalled();
    expect(emitSkillEvent).not.toHaveBeenCalled();
    // The completion WRITE always runs (idempotent upsert + guest bridge).
    expect(markLessonCompleted).toHaveBeenCalledTimes(1);
  });

  it("fires completion analytics exactly once when walking into step 5 in-session", () => {
    localStorage.setItem(STEP_KEY, "4");
    localStorage.setItem(MAX_KEY, "4");
    renderSteps();
    expect(screen.getByText("5 / 6")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /continue|complete/i }));
    expect(screen.getByText("6 / 6")).toBeInTheDocument();
    expect(trackLessonCompleted).toHaveBeenCalledTimes(1);
  });
});

describe("LessonSteps, focus management", () => {
  /**
   * The left column carries key={currentStep} to retrigger the step animation,
   * so React unmounts the subtree (bottomNav included) on every step change.
   * Without explicit focus management the button the user just activated is
   * destroyed and focus lands on <body>, forcing a keyboard user to tab from
   * the top of the document again on every one of the six steps (WCAG 2.4.3).
   */
  // Anchored: the segmented progress bar is also a role="group", labelled
  // "Lesson step N of 6", so an unanchored /step 2 of 6/ matches both it and
  // the step container.
  it("moves focus to the new step after navigating, not to the body", () => {
    renderSteps();
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));

    const step = screen.getByRole("group", { name: /^Step 2 of 6: Concept$/ });
    expect(document.activeElement).toBe(step);
    expect(document.activeElement).not.toBe(document.body);
  });

  it("does not steal focus on first mount", () => {
    renderSteps();
    expect(document.activeElement).toBe(document.body);
  });

  it("labels each step group for screen readers", () => {
    localStorage.setItem(STEP_KEY, "3");
    localStorage.setItem(MAX_KEY, "3");
    renderSteps();
    expect(
      screen.getByRole("group", { name: /^Step 4 of 6: Challenge$/ }),
    ).toBeInTheDocument();
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

describe("LessonSteps, SceneCard cast avatars", () => {
  // The Cast list is regex-extracted from the compiled body's
  // speaker: "..." attributes; three registers matter: a human character
  // (portrait via the art resolver), ARIA (procedural waveform, never
  // raster) and an unregistered speaker (extras' Instructor), which must
  // stay on the monogram path with no src.
  const castLesson = {
    ...lesson,
    body: `jsx(Dialogue, {speaker: "Dr. Farah", children: "x"});
jsx(Dialogue, {speaker: "ARIA", children: "y"});
jsx(Dialogue, {speaker: "Instructor", children: "z"});`,
  };

  function renderCast() {
    return render(
      <LessonSteps
        lesson={castLesson}
        exercises={[]}
        themeSlug="deep-orbit"
        moduleSlug="foundations"
        moduleName="Foundations: Tensors & Data"
        prevLesson={null}
        nextLesson={null}
      />,
    );
  }

  it("routes human cast rows through the portrait resolver", () => {
    renderCast();
    const stubs = screen.getAllByTestId("animated-avatar-stub");
    const farah = stubs.find((s) => s.dataset.name === "Dr. Farah");
    expect(farah?.dataset.src).toBe("/characters/deep-orbit/dr-farah.webp");
  });

  it("renders ARIA as the live waveform glyph", () => {
    renderCast();
    expect(screen.getByTestId("aria-waveform-stub")).toBeInTheDocument();
  });

  it("keeps unregistered speakers on the srcless monogram path", () => {
    renderCast();
    const stubs = screen.getAllByTestId("animated-avatar-stub");
    const instructor = stubs.find((s) => s.dataset.name === "Instructor");
    expect(instructor).toBeDefined();
    expect(instructor?.dataset.src).toBe("");
  });
});
