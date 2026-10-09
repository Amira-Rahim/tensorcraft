import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  act,
  cleanup,
} from "@testing-library/react";
import { LessonSteps } from "./lesson-steps";
import { trackLessonCompleted, track } from "@/lib/analytics";
import { markLessonCompleted, emitSkillEvent } from "@/lib/progress-client";
import { recordGuestCompletion } from "@/lib/guest-progress";

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

// What the stubbed content reports as its unsettled recall count on mount,
// and the last report handler it received, so a test can settle it later.
const recallState = vi.hoisted(() => ({
  pendingOnMount: 0,
  report: null as null | ((pending: number) => void),
}));

// Step content is exercised in lesson-content.test.tsx; stub it here so the
// suite focuses on step navigation chrome.
vi.mock("./lesson-content", async () => {
  const React = await import("react");
  return {
    LessonContent: ({
      storyRegister,
      hideTeaching,
      hideStoryZone,
      visibleComponents,
      layout,
      onRecallPending,
    }: {
      storyRegister?: boolean;
      hideTeaching?: boolean;
      hideStoryZone?: boolean;
      visibleComponents?: Set<string>;
      layout?: "reading";
      onRecallPending?: (pending: number) => void;
    }) => {
      React.useEffect(() => {
        if (!onRecallPending) return;
        recallState.report = onRecallPending;
        onRecallPending(recallState.pendingOnMount);
      }, [onRecallPending]);
      return (
        <div
          data-testid="lesson-content"
          className="lesson-prose lesson-step-content"
          data-layout={layout}
          data-story-register={storyRegister ? "true" : undefined}
          data-hide-teaching={hideTeaching ? "true" : undefined}
          data-hide-story-zone={hideStoryZone ? "true" : undefined}
          data-visible={
            visibleComponents
              ? Array.from(visibleComponents).sort().join(",")
              : ""
          }
        />
      );
    },
  };
});

vi.mock("./lesson-drawer", () => ({
  LessonDrawer: () => null,
}));

vi.mock("@tensorcraft/ui", () => ({
  SceneHeading: () => null,
  AnimatedAvatar: ({ name }: { name: string }) => (
    <span role="img" aria-label={name} />
  ),
  ScenePortrait: ({ src }: { src: string }) => (
    <div data-testid="scene-portrait-stub" data-src={src} />
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
  trackModuleCompleted: vi.fn(),
  // The Skip control now emits script_skipped through the typed helper;
  // 2026-09-04 added step views and the script_finished denominator.
  track: vi.fn(),
  EVENTS: {
    LESSON_STEP_VIEWED: "lesson_step_viewed",
    SCRIPT_SKIPPED: "script_skipped",
    SCRIPT_FINISHED: "script_finished",
  },
}));

// Scene-clip plumbing (owner ruling 2026-09-04: launch ships with video).
// Default: no clip in the manifest, so every existing test runs the
// pre-video Briefing unchanged; individual tests override sceneClipFor.
vi.mock("@/lib/scene-clips", () => ({
  sceneClipFor: vi.fn(() => null),
}));
vi.mock("@/lib/briefing-variant", () => ({
  getAssignedBriefingVariant: vi.fn(() => "clip"),
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
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe() {} } },
      }),
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
  // Every authored lesson has a scene. Its slugline supplies this chrome
  // fixture's playback beat now that the context is always readable.
  scene: { location: "Archimedes, Bridge" },
  context: { narrative: "n" },
  concept: { explanation: "e" },
  consequence: { narrative: "c" },
};

const STEP_KEY = "tc_step_v2_deep-orbit_introduction-to-tensors";
const MAX_KEY = "tc_step_max_v2_deep-orbit_introduction-to-tensors";

function renderSteps(
  entryStep: 0 | 1 | 2 = 0,
  moduleEntry: {
    moduleSlug: string;
    previousModule?: string;
    previousComplete: boolean;
  } | null = null,
) {
  return render(
    <LessonSteps
      entryStep={entryStep}
      lesson={lesson}
      exercises={[]}
      worldSlug="deep-orbit"
      moduleSlug="foundations"
      moduleName="Foundations: Tensors & Data"
      moduleEntry={moduleEntry}
      prevLesson={null}
      nextLesson={null}
    />,
  );
}

beforeEach(() => {
  localStorage.clear();
  recallState.pendingOnMount = 0;
  recallState.report = null;
  // Steps are URL-addressable (#step-N) since 2026-09-04, and jsdom keeps
  // `location` across tests: a hash left by one test reads as a deep link
  // in the next mount. Reset it like localStorage.
  window.history.replaceState(null, "", window.location.pathname);
});

describe("account-owned lesson position", () => {
  const props = {
    lesson,
    exercises: [],
    worldSlug: "deep-orbit",
    moduleSlug: "foundations",
    prevLesson: null,
    nextLesson: null,
  };
  it("does not adopt a guest's final step or another account's position", () => {
    localStorage.setItem(STEP_KEY, "4");
    localStorage.setItem(MAX_KEY, "4");
    localStorage.setItem(`${STEP_KEY}:account:alice`, "1");
    localStorage.setItem(`${MAX_KEY}:account:alice`, "2");
    const { rerender } = render(
      <LessonSteps {...props} reviewUserId="alice" />,
    );
    expect(screen.getByRole("button", { name: /^Step 2:/ })).toHaveAttribute(
      "aria-current",
      "step",
    );
    rerender(<LessonSteps {...props} reviewUserId="bob" />);
    expect(screen.getByRole("button", { name: /^Step 1:/ })).toHaveAttribute(
      "aria-current",
      "step",
    );
    expect(screen.getByRole("button", { name: /^Step 5:/ })).toBeDisabled();
    expect(localStorage.getItem(`${STEP_KEY}:account:alice`)).toBe("1");
  });
  it("restores access to a completed account lesson without inventing a new completion", () => {
    vi.mocked(markLessonCompleted).mockClear();
    render(
      <LessonSteps
        {...props}
        reviewUserId="alice"
        lessons={[
          {
            slug: lesson.slug,
            title: lesson.title,
            order: 1,
            locked: false,
            completed: true,
          },
        ]}
      />,
    );
    expect(screen.getByRole("button", { name: /^Step 5:/ })).toBeEnabled();
    expect(markLessonCompleted).not.toHaveBeenCalled();
  });
});

describe("LessonSteps, segmented progress bar", () => {
  it.each([1, 2] as const)(
    "opens explicit entry phase %s with earlier context available and no completion credit",
    (entryStep) => {
      vi.mocked(markLessonCompleted).mockClear();
      renderSteps(entryStep);
      expect(
        screen.getByRole("button", {
          name: new RegExp(`^Step ${entryStep + 1}:`),
        }),
      ).toHaveAttribute("aria-current", "step");
      expect(
        screen.getByRole("button", { name: /^Step 1:/ }),
      ).not.toBeDisabled();
      expect(screen.getByRole("button", { name: /^Step 5:/ })).toBeDisabled();
      expect(markLessonCompleted).not.toHaveBeenCalled();
    },
  );

  it("lets an explicit phase link win over the saved position", () => {
    // ?start=challenge from a readiness review, the evidence panel or the
    // Continue CTA is a request, not a default; the saved step used to
    // override it for every returning learner (audit 2026-09-20).
    localStorage.setItem(STEP_KEY, "1");
    renderSteps(2);
    expect(screen.getByRole("button", { name: /^Step 3:/ })).toHaveAttribute(
      "aria-current",
      "step",
    );
  });

  it("restores the saved position when the lesson opens at its default step", () => {
    localStorage.setItem(STEP_KEY, "1");
    renderSteps(0);
    expect(screen.getByRole("button", { name: /^Step 2:/ })).toHaveAttribute(
      "aria-current",
      "step",
    );
  });
  it("renders one segment button per step", () => {
    renderSteps();
    const segments = screen.getAllByRole("button", { name: /^Step \d/ });
    expect(segments).toHaveLength(5);
  });

  it("marks the current step segment with aria-current", () => {
    renderSteps();
    const first = screen.getByRole("button", { name: /^Step 1/ });
    expect(first).toHaveAttribute("aria-current", "step");
  });

  it("jumps back to a visited step when its segment is clicked", () => {
    localStorage.setItem(STEP_KEY, "1");
    renderSteps();
    expect(
      screen.getByRole("group", { name: "Lesson step 2 of 5" }),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^Step 1/ }));
    expect(
      screen.getByRole("group", { name: "Lesson step 1 of 5" }),
    ).toBeInTheDocument();
  });

  it("disables segments beyond the furthest step reached", () => {
    localStorage.setItem(STEP_KEY, "1");
    renderSteps();
    expect(screen.getByRole("button", { name: /^Step 3/ })).toBeDisabled();
    expect(screen.getByRole("button", { name: /^Step 5/ })).toBeDisabled();
  });

  it("keeps forward segments clickable after jumping back", () => {
    localStorage.setItem(STEP_KEY, "1");
    renderSteps();

    fireEvent.click(screen.getByRole("button", { name: /^Step 1/ }));
    expect(
      screen.getByRole("group", { name: "Lesson step 1 of 5" }),
    ).toBeInTheDocument();

    const third = screen.getByRole("button", { name: /^Step 2/ });
    expect(third).not.toBeDisabled();
    fireEvent.click(third);
    expect(
      screen.getByRole("group", { name: "Lesson step 2 of 5" }),
    ).toBeInTheDocument();
  });

  it("restores the furthest step reached from storage after going back in a previous visit", () => {
    // Earlier visit reached step 3 (index 2), then went back to the start.
    localStorage.setItem(STEP_KEY, "0");
    localStorage.setItem(MAX_KEY, "1");
    renderSteps();

    expect(
      screen.getByRole("group", { name: "Lesson step 1 of 5" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Step 2/ })).not.toBeDisabled();
  });

  it("persists the furthest step reached when navigating back", () => {
    localStorage.setItem(STEP_KEY, "1");
    renderSteps();

    fireEvent.click(screen.getByRole("button", { name: /^Step 1/ }));
    expect(localStorage.getItem(STEP_KEY)).toBe("0");
    expect(localStorage.getItem(MAX_KEY)).toBe("1");
  });
});

describe("LessonSteps, exit chip", () => {
  it("labels the exit link Mission Map and points at the world page", () => {
    renderSteps();
    const exit = screen.getByRole("link", { name: /mission map/i });
    expect(exit).toHaveAttribute("href", "/worlds/deep-orbit");
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
        worldSlug="deep-orbit"
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
        worldSlug="deep-orbit"
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
  it("renders no right slot on the Briefing and Concept steps", () => {
    renderSteps();
    expect(screen.queryByTestId("lesson-right")).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(
      screen.getByRole("group", { name: "Lesson step 2 of 5" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("lesson-right")).toBeNull();
  });

  it("stamps the reading layout on the Concept body only", () => {
    renderSteps();
    expect(
      document.querySelector('.lesson-step-content[data-layout="reading"]'),
    ).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(
      document.querySelectorAll('.lesson-step-content[data-layout="reading"]'),
    ).toHaveLength(1);
  });

  it("shows learning goals before the Concept activity", () => {
    renderSteps();
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    const intro = document.querySelector("[data-testid='concept-intro']")!;
    const body = document.querySelector(
      '.lesson-step-content[data-layout="reading"]',
    )!;
    const activity = document.querySelector(".lesson-instrument")!;
    expect(
      intro.compareDocumentPosition(activity) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(intro.closest("details")).toBeNull();
    // Goals retain their own content partition before the activity.
    const introContent = intro.querySelector("[data-testid='lesson-content']");
    expect(introContent).toHaveAttribute("data-visible", "LearningObjectives");
    expect(introContent).not.toHaveAttribute("data-layout");
    expect(introContent).not.toHaveAttribute("data-hide-story-zone");
    expect(body).toHaveAttribute("data-hide-story-zone", "true");
  });

  it("caps the Takeaways prose and lists the terms after it", () => {
    localStorage.setItem(STEP_KEY, "3");
    localStorage.setItem(MAX_KEY, "3");
    render(
      <LessonSteps
        lesson={{
          ...lesson,
          glossaryTerms: [
            { term: "tensor", definition: "a numeric array with a shape" },
          ],
        }}
        exercises={[]}
        worldSlug="deep-orbit"
        moduleSlug="foundations"
        moduleName="Foundations: Tensors & Data"
        moduleEntry={null}
        prevLesson={null}
        nextLesson={null}
      />,
    );
    const prose = document.querySelector("[data-testid='takeaways-prose']")!;
    expect(prose.className).toContain("max-w-[820px]");
    const list = document.querySelector("[data-testid='lesson-terms-list']");
    expect(list).toBeInTheDocument();
    expect(
      prose.compareDocumentPosition(list!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("collapses to a single column on the Consequence step", () => {
    // Reach the final step directly via persisted state.
    localStorage.setItem(STEP_KEY, "4");
    localStorage.setItem(MAX_KEY, "4");
    renderSteps();
    expect(
      screen.getByRole("group", { name: "Lesson step 5 of 5" }),
    ).toBeInTheDocument();
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
    localStorage.setItem(STEP_KEY, "1");
    localStorage.setItem(MAX_KEY, "1");
    renderSteps();
    expect(screen.getByRole("button", { name: /back/i })).toBeInTheDocument();
  });

  it("steps backward when the Back button is activated", () => {
    localStorage.setItem(STEP_KEY, "1");
    localStorage.setItem(MAX_KEY, "1");
    renderSteps();
    expect(
      screen.getByRole("group", { name: "Lesson step 2 of 5" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(
      screen.getByRole("group", { name: "Lesson step 1 of 5" }),
    ).toBeInTheDocument();
  });

  it("shows the lesson title in the chrome on every step but the Briefing and the Epilogue", () => {
    renderSteps();
    const chrome = document.querySelector("[data-testid='lesson-chrome']")!;
    expect(chrome.querySelector("h1")).toBeNull();
    expect(chrome.textContent).not.toContain(lesson.title);
    fireEvent.click(screen.getByRole("button", { name: /skip/i }));
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(
      document.querySelector("[data-testid='lesson-chrome'] h1"),
    ).toHaveTextContent(lesson.title);
    // A second mount in the same test: unmount the first, and clear the
    // #step-2 hash its Continue pushed. jsdom keeps the location, and a
    // leftover hash reads as a deep link that wins over the stored step.
    cleanup();
    window.history.replaceState(null, "", window.location.pathname);
    localStorage.setItem(STEP_KEY, "4");
    localStorage.setItem(MAX_KEY, "4");
    renderSteps();
    expect(
      screen.getByRole("group", { name: "Lesson step 5 of 5" }),
    ).toBeInTheDocument();
    expect(
      document.querySelector("[data-testid='lesson-chrome'] h1"),
    ).toBeNull();
    expect(screen.queryByTestId("next-lesson-card")).toBeNull();
    expect(
      screen.getByRole("link", { name: /Back to Mission Map/ }),
    ).toBeInTheDocument();
  });

  it("puts one next-mission control in the nav row on the last step and no card in the body", () => {
    localStorage.setItem(STEP_KEY, "4");
    localStorage.setItem(MAX_KEY, "4");
    render(
      <LessonSteps
        lesson={lesson}
        exercises={[]}
        worldSlug="deep-orbit"
        moduleSlug="foundations"
        moduleName="Foundations: Tensors & Data"
        moduleEntry={null}
        prevLesson={null}
        nextLesson={{
          slug: "tensor-shapes",
          title: "Understanding Tensor Shapes",
        }}
      />,
    );
    const nav = screen.getByTestId("lesson-nav");
    const control = screen.getByTestId("next-lesson-card");
    expect(nav.contains(control)).toBe(true);
    expect(control).toHaveAttribute(
      "href",
      "/worlds/deep-orbit/foundations/tensor-shapes",
    );
    expect(control).toHaveTextContent("Next Mission");
    expect(control).toHaveTextContent("Understanding Tensor Shapes");
    expect(screen.queryByRole("link", { name: /^Next Lesson/ })).toBeNull();
    // The closing card is the step's one H1.
    const h1s = screen.getAllByRole("heading", { level: 1 });
    expect(h1s).toHaveLength(1);
    expect(h1s[0]).toHaveTextContent(lesson.title);
    // The fade-out marker is atmosphere for sighted readers only: hidden
    // from the tree, no longer exempt from the contrast rule.
    const fade = screen.getByText(/fade out/i);
    expect(fade).toHaveAttribute("aria-hidden", "true");
    expect(fade).not.toHaveAttribute("data-decorative");
  });

  it("leaves the nav's own bottom padding as the whole gap to the footer", () => {
    // Spec section 6: 40 px between the nav row and the footer. The nav's
    // bottom padding (--l-nav-bottom) is that gap, so the reader's wrapper
    // adds none below it. Above, it adds 16 px (the beat gap).
    renderSteps();
    const wrapper = document.querySelector(".lesson-page > div")!;
    const classes = wrapper.className.split(/\s+/);
    expect(classes).toContain("pt-4");
    // No bottom padding of any size or breakpoint, from either utility.
    expect(classes.filter((c) => /(^|:)(pb|py)-/.test(c))).toEqual([]);
    expect(screen.getByTestId("lesson-nav")).toHaveClass("pb-(--l-nav-bottom)");
  });

  it("spaces the chrome, the slugline row, the post-scene slot and the nav on the scale", () => {
    renderSteps(0, {
      moduleSlug: "browser-runtimes",
      previousModule: "training-loop",
      previousComplete: false,
    });
    // The chrome's hairline sits 16 px under its controls and 16 px over
    // the step (spec section 1).
    expect(screen.getByTestId("lesson-chrome")).toHaveClass("pb-4", "mb-4");
    // The plate is the scene's second beat after the slugline, and beats
    // sit 16 px apart (--l-beat).
    const slugline = screen.getByRole("button", {
      name: /skip intro|replay scene/i,
    }).parentElement;
    expect(slugline).toHaveClass("border-b", "pb-2", "mb-4");
    // The rest read the .lesson-page tokens (spec section 6): 24 px above
    // the post-scene slot and between its children; 40 px above the nav's
    // hairline, 24 px below it and between its controls, 40 px under it.
    expect(document.querySelector("[data-post-scene]")).toHaveClass(
      "mt-(--l-slot)",
      "space-y-(--l-slot)",
    );
    expect(screen.getByTestId("lesson-nav")).toHaveClass(
      "mt-(--l-nav-top)",
      "pt-(--l-nav-inner)",
      "gap-(--l-nav-inner)",
      "pb-(--l-nav-bottom)",
    );
  });

  it("leaves no bottom padding under the Consequence step's last block", () => {
    // Padding there stops the last block's margin collapsing into the nav's
    // 40 px, which put the nav 88 px below it (120 with no next lesson).
    localStorage.setItem(STEP_KEY, "4");
    localStorage.setItem(MAX_KEY, "4");
    renderSteps();
    const root = screen.getByRole("group", {
      name: "Step 5 of 5: Epilogue",
    }).firstElementChild;
    expect(root).toHaveClass("text-center", "pt-12");
    expect(root).not.toHaveClass("py-12");
  });

  it("keeps one H1, the lesson title, on every step", () => {
    // The title card is the Briefing's H1, the chrome title is the H1 on
    // steps 2 to 5, and the closing card is step 6's (spec 2026-09-24,
    // section 6).
    for (let step = 0; step < 5; step++) {
      localStorage.clear();
      window.history.replaceState(null, "", window.location.pathname);
      localStorage.setItem(STEP_KEY, String(step));
      localStorage.setItem(MAX_KEY, String(step));
      const { unmount } = renderSteps();
      expect(
        screen.getByRole("group", {
          name: `Lesson step ${step + 1} of 5`,
        }),
      ).toBeInTheDocument();
      const h1s = screen.getAllByRole("heading", { level: 1 });
      expect(h1s, `step ${step + 1}`).toHaveLength(1);
      expect(h1s[0]).toHaveTextContent(lesson.title);
      unmount();
    }
  });

  it("labels every segment with its step name and names the last step Epilogue", () => {
    renderSteps();
    const labels = screen.getAllByTestId("step-label");
    expect(labels.map((l) => l.textContent)).toEqual([
      "Briefing",
      "Concept",
      "Challenge",
      "Takeaways",
      "Epilogue",
    ]);
    // Hidden below lg, shown from it: the class pair is the contract, jsdom
    // applies no breakpoints.
    for (const label of labels) {
      expect(label).toHaveClass("hidden", "lg:block", "truncate");
      expect(label.parentElement).toHaveClass(
        "group",
        "min-w-0",
        "h-6",
        "lg:h-8",
      );
      expect(label.className).not.toMatch(/hover:/);
      // Dimming the whole button took the label below AA on hover, so the
      // button carries no hover or opacity class of its own.
      expect(label.parentElement!.className).not.toMatch(/hover:|opacity-/);
    }
    // The first step is visited on arrival, so its bar carries the hover
    // dim; the label itself never does (checked above).
    expect(labels[0].previousElementSibling).toHaveClass(
      "group-hover:opacity-80",
    );
    // The last step is locked on arrival: its bar and label are dimmed by
    // class, since an inline opacity would beat the hover class.
    expect(labels[4]).toHaveClass("opacity-45");
    expect(labels[4].previousElementSibling).toHaveClass("opacity-45");
    // The visible label is part of the accessible name (WCAG 2.5.3).
    expect(
      screen.getByRole("button", { name: "Step 5: Epilogue" }),
    ).toBeDisabled();
    expect(
      screen.queryByRole("group", { name: "Lesson step 5 of 5" }),
    ).toBeNull();
    expect(
      screen.getByRole("group", { name: "Lesson step 1 of 5" }),
    ).toBeInTheDocument();
  });

  it("keeps the analytics step name for the last step", () => {
    vi.mocked(track).mockClear();
    localStorage.setItem(STEP_KEY, "4");
    localStorage.setItem(MAX_KEY, "4");
    renderSteps();
    expect(
      screen.getByRole("group", { name: "Lesson step 5 of 5" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Step 5: Epilogue" }),
    ).toHaveAttribute("aria-current", "step");
    expect(track).toHaveBeenCalledWith(
      "lesson_step_viewed",
      expect.objectContaining({ step: 4, stepName: "Consequence" }),
    );
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
    localStorage.setItem(STEP_KEY, "4");
    localStorage.setItem(MAX_KEY, "4");
    renderSteps();
    expect(
      screen.getByRole("group", { name: "Lesson step 5 of 5" }),
    ).toBeInTheDocument();
    expect(trackLessonCompleted).not.toHaveBeenCalled();
    expect(emitSkillEvent).not.toHaveBeenCalled();
    // The completion WRITE always runs (idempotent upsert + guest bridge).
    expect(markLessonCompleted).toHaveBeenCalledTimes(1);
  });

  it("fires completion analytics exactly once when walking into step 5 in-session", () => {
    localStorage.setItem(STEP_KEY, "3");
    localStorage.setItem(MAX_KEY, "3");
    renderSteps();
    expect(
      screen.getByRole("group", { name: "Lesson step 4 of 5" }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /continue|complete/i }));
    expect(
      screen.getByRole("group", { name: "Lesson step 5 of 5" }),
    ).toBeInTheDocument();
    expect(trackLessonCompleted).toHaveBeenCalledTimes(1);
  });
});

describe("LessonSteps, patch award moment", () => {
  const closingLessons = [
    {
      slug: "introduction-to-tensors",
      title: "Introduction to Tensors",
      order: 1,
      locked: false,
      completed: false,
    },
    {
      slug: "tensor-shapes",
      title: "Tensor Shapes",
      order: 2,
      locked: false,
      completed: true,
    },
  ];

  function renderWithLessons(lessons: typeof closingLessons) {
    return render(
      <LessonSteps
        lesson={lesson}
        exercises={[]}
        worldSlug="deep-orbit"
        moduleSlug="foundations"
        moduleName="Foundations: Tensors & Data"
        prevLesson={null}
        nextLesson={null}
        lessons={lessons}
      />,
    );
  }

  it("reveals the patch when the module's last remaining lesson completes in-session", () => {
    localStorage.setItem(STEP_KEY, "3");
    localStorage.setItem(MAX_KEY, "3");
    renderWithLessons(closingLessons);
    fireEvent.click(screen.getByRole("button", { name: /continue|complete/i }));
    expect(screen.getByTestId("patch-award")).toBeInTheDocument();
    expect(screen.getByText("Sector Complete")).toBeInTheDocument();
  });

  it("does not award on a mount restored to the final step", () => {
    localStorage.setItem(STEP_KEY, "4");
    localStorage.setItem(MAX_KEY, "4");
    renderWithLessons(closingLessons);
    expect(
      screen.getByRole("group", { name: "Lesson step 5 of 5" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("patch-award")).not.toBeInTheDocument();
  });

  it("does not award while another lesson in the module is still open", () => {
    localStorage.setItem(STEP_KEY, "3");
    localStorage.setItem(MAX_KEY, "3");
    renderWithLessons([
      ...closingLessons,
      {
        slug: "tensor-operations",
        title: "Tensor Operations",
        order: 3,
        locked: false,
        completed: false,
      },
    ]);
    fireEvent.click(screen.getByRole("button", { name: /continue|complete/i }));
    expect(
      screen.getByRole("group", { name: "Lesson step 5 of 5" }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("patch-award")).not.toBeInTheDocument();
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

    const step = screen.getByRole("group", { name: /^Step 2 of 5: Concept$/ });
    expect(document.activeElement).toBe(step);
    expect(document.activeElement).not.toBe(document.body);
  });

  it("does not steal focus on first mount", () => {
    renderSteps();
    expect(document.activeElement).toBe(document.body);
  });

  it("labels each step group for screen readers", () => {
    localStorage.setItem(STEP_KEY, "2");
    localStorage.setItem(MAX_KEY, "2");
    renderSteps();
    expect(
      screen.getByRole("group", { name: /^Step 3 of 5: Challenge$/ }),
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

describe("LessonSteps, prose partition (2026-09-04 audit step 2)", () => {
  const visibleSets = () =>
    screen
      .getAllByTestId("lesson-content")
      .map((s) => (s.dataset.visible ?? "").split(",").filter(Boolean));

  it("keeps the Briefing to the story zone via hideTeaching", () => {
    renderSteps();
    const briefing = screen
      .getAllByTestId("lesson-content")
      .find((s) => s.dataset.hideTeaching === "true");
    expect(briefing).toBeDefined();
  });

  it("renders code inline on the Concept step (the one full read)", () => {
    localStorage.setItem(STEP_KEY, "1");
    localStorage.setItem(MAX_KEY, "1");
    renderSteps();
    const withProse = visibleSets().find((v) => v.includes("prose"));
    expect(withProse).toBeDefined();
    expect(withProse).toContain("CodeBlock");
  });

  it("keeps code with Concept and removes the duplicate Code phase", () => {
    localStorage.setItem(STEP_KEY, "1");
    renderSteps();
    expect(screen.queryByRole("button", { name: /^Step .*Code/ })).toBeNull();
    expect(
      screen
        .getAllByTestId("lesson-content")
        .filter((el) => el.dataset.visible?.includes("CodeBlock")),
    ).toHaveLength(1);
  });

  it("drops the prose re-read from the Challenge left column, keeping the challenge zone + hints", () => {
    localStorage.setItem(STEP_KEY, "2");
    localStorage.setItem(MAX_KEY, "2");
    renderSteps();
    const sets = visibleSets();
    expect(sets.some((v) => v.includes("challenge"))).toBe(true);
    for (const v of sets) {
      expect(v).not.toContain("prose");
    }
  });
});

describe("LessonSteps, URL-addressable steps (2026-09-04 audit step 2)", () => {
  it("pushes a #step-N hash entry per forward step", () => {
    renderSteps();
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    expect(window.location.hash).toBe("#step-concept");
    expect(
      screen.getByRole("group", { name: "Lesson step 2 of 5" }),
    ).toBeInTheDocument();
  });

  it("steps back (not out) on popstate", () => {
    renderSteps();
    fireEvent.click(screen.getByRole("button", { name: /continue/i }));
    act(() => {
      window.dispatchEvent(
        new PopStateEvent("popstate", { state: { tcStep: 0 } }),
      );
    });
    expect(
      screen.getByRole("group", { name: "Lesson step 1 of 5" }),
    ).toBeInTheDocument();
  });

  it("honors a #step-N deep link into already-covered ground", () => {
    localStorage.setItem(MAX_KEY, "2");
    window.history.replaceState(null, "", "#step-3");
    renderSteps();
    expect(
      screen.getByRole("group", { name: "Lesson step 2 of 5" }),
    ).toBeInTheDocument();
  });

  it("clamps a deep link into never-reached ground", () => {
    window.history.replaceState(null, "", "#step-5");
    renderSteps();
    expect(
      screen.getByRole("group", { name: "Lesson step 1 of 5" }),
    ).toBeInTheDocument();
  });
});

describe("LessonSteps, skip to the challenge (2026-09-04 audit step 2)", () => {
  const exercise = {
    slug: "create-a-tensor",
    estimatedMinutes: 6,
  } as unknown as React.ComponentProps<typeof LessonSteps>["exercises"][number];

  function renderWithExercise() {
    return render(
      <LessonSteps
        lesson={lesson}
        exercises={[exercise]}
        worldSlug="deep-orbit"
        moduleSlug="foundations"
        moduleName="Foundations: Tensors & Data"
        prevLesson={null}
        nextLesson={null}
      />,
    );
  }

  it("jumps a first visit straight to the Challenge step and unlocks the bar behind it", () => {
    renderWithExercise();
    fireEvent.click(
      screen.getByRole("button", { name: /skip to the challenge/i }),
    );
    expect(
      screen.getByRole("group", { name: "Lesson step 3 of 5" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^Step 2/ })).not.toBeDisabled();
  });

  it("hides the fast path once the Challenge step is reachable from the bar", () => {
    localStorage.setItem(STEP_KEY, "0");
    localStorage.setItem(MAX_KEY, "2");
    renderWithExercise();
    expect(
      screen.queryByRole("button", { name: /skip to the challenge/i }),
    ).not.toBeInTheDocument();
  });

  it("offers no fast path on exercise-less lessons", () => {
    renderSteps();
    expect(
      screen.queryByRole("button", { name: /skip to the challenge/i }),
    ).not.toBeInTheDocument();
  });
});

describe("LessonSteps, revisit-honest step views (re-audit 2026-09-04)", () => {
  it("fires the very first step view of a brand-new visit with revisit:false", async () => {
    const { track } = await import("@/lib/analytics");
    vi.mocked(track).mockClear();
    renderSteps();
    const stepViews = vi
      .mocked(track)
      .mock.calls.filter(([name]) => name === "lesson_step_viewed");
    expect(stepViews.length).toBeGreaterThan(0);
    // The old unconditional visited-seed made this fire revisit:true and
    // zeroed the baseline funnel's step-0 first views.
    expect(stepViews[0][1]).toMatchObject({ step: 0, revisit: false });
  });

  it("marks a restored session's landing step as a revisit", async () => {
    const { track } = await import("@/lib/analytics");
    vi.mocked(track).mockClear();
    localStorage.setItem(STEP_KEY, "1");
    localStorage.setItem(MAX_KEY, "1");
    renderSteps();
    const stepViews = vi
      .mocked(track)
      .mock.calls.filter(([name]) => name === "lesson_step_viewed");
    expect(stepViews[0][1]).toMatchObject({ step: 1, revisit: true });
  });

  it("does not mark jumped-over steps as visited", async () => {
    const { track } = await import("@/lib/analytics");
    // First session: jump straight to the challenge (steps 1-2 never seen).
    const exercise = { slug: "e1", estimatedMinutes: 5 } as never;
    const first = render(
      <LessonSteps
        lesson={lesson}
        exercises={[exercise]}
        worldSlug="deep-orbit"
        moduleSlug="foundations"
        moduleName="Foundations: Tensors & Data"
        prevLesson={null}
        nextLesson={null}
      />,
    );
    fireEvent.click(
      screen.getByRole("button", { name: /skip to the challenge/i }),
    );
    first.unmount();
    // A fresh browser session carries no step hash; without this reset the
    // jump's #step-4 deep link would win over the seeded position.
    window.history.replaceState(null, "", window.location.pathname);

    // Second session: walking back to step 1 must read as a FIRST view.
    localStorage.setItem(STEP_KEY, "1");
    vi.mocked(track).mockClear();
    renderSteps();
    const stepViews = vi
      .mocked(track)
      .mock.calls.filter(([name]) => name === "lesson_step_viewed");
    expect(stepViews[0][1]).toMatchObject({ step: 1, revisit: false });
  });
});

describe("LessonSteps, briefing clip variant (owner ruling 2026-09-04)", () => {
  afterEach(async () => {
    // Reset here, not at test tails: a thrown assertion must not leak a
    // manifest entry into the next test.
    const { sceneClipFor } = await import("@/lib/scene-clips");
    const { getAssignedBriefingVariant } =
      await import("@/lib/briefing-variant");
    vi.mocked(sceneClipFor).mockReturnValue(null);
    vi.mocked(getAssignedBriefingVariant).mockReturnValue("clip");
  });

  const sceneLesson = {
    ...lesson,
    scene: {
      location: "Archimedes, Bridge",
      portraitAlt: "A holo column of noise.",
    },
  };

  function renderWithScene() {
    return render(
      <LessonSteps
        lesson={sceneLesson}
        exercises={[]}
        worldSlug="deep-orbit"
        moduleSlug="foundations"
        moduleName="Foundations: Tensors & Data"
        prevLesson={null}
        nextLesson={null}
      />,
    );
  }

  it("renders the SceneClip and tags step views briefingVariant=clip when a clip is approved", async () => {
    const { sceneClipFor } = await import("@/lib/scene-clips");
    const { track } = await import("@/lib/analytics");
    vi.mocked(sceneClipFor).mockReturnValue({
      url: "https://cdn.example/clip.mp4",
      durationMs: 10000,
      bytes: 1,
      ingestedAt: "2026-09-05",
    });
    vi.mocked(track).mockClear();
    renderWithScene();
    expect(screen.getByTestId("scene-clip")).toBeInTheDocument();
    const stepViews = vi
      .mocked(track)
      .mock.calls.filter(([name]) => name === "lesson_step_viewed");
    expect(stepViews[0][1]).toMatchObject({ briefingVariant: "clip" });
    vi.mocked(sceneClipFor).mockReturnValue(null);
  });

  it("keeps the pre-video Briefing and tags briefingVariant=text when no clip is shipped", async () => {
    const { track } = await import("@/lib/analytics");
    vi.mocked(track).mockClear();
    renderWithScene();
    expect(screen.queryByTestId("scene-clip")).not.toBeInTheDocument();
    expect(screen.getByTestId("scene-portrait-stub")).toBeInTheDocument();
    const stepViews = vi
      .mocked(track)
      .mock.calls.filter(([name]) => name === "lesson_step_viewed");
    expect(stepViews[0][1]).toMatchObject({ briefingVariant: "text" });
  });

  it("keeps the pre-video Briefing for the holdback cohort even when a clip exists", async () => {
    const { sceneClipFor } = await import("@/lib/scene-clips");
    const { getAssignedBriefingVariant } =
      await import("@/lib/briefing-variant");
    vi.mocked(sceneClipFor).mockReturnValue({
      url: "https://cdn.example/clip.mp4",
      durationMs: 10000,
      bytes: 1,
      ingestedAt: "2026-09-05",
    });
    vi.mocked(getAssignedBriefingVariant).mockReturnValue("text");
    renderWithScene();
    expect(screen.queryByTestId("scene-clip")).not.toBeInTheDocument();
    expect(screen.getByTestId("scene-portrait-stub")).toBeInTheDocument();
    vi.mocked(sceneClipFor).mockReturnValue(null);
    vi.mocked(getAssignedBriefingVariant).mockReturnValue("clip");
  });
});

describe("mid-module catch-up", () => {
  const entry = {
    moduleSlug: "browser-runtimes",
    previousModule: "training-loop",
    previousComplete: false,
  };

  it("closes the Briefing rather than preceding it", () => {
    const { container } = renderSteps(0, entry);
    const recap = container.querySelector("[data-post-scene]");
    expect(recap).not.toBeNull();
    // Held back during playback by the same mechanism as the teaching body,
    // and out of the scene's own beat timeline.
    expect(recap!.querySelector("[data-script-beat]")).toBeNull();
    // Everything the scene shows comes first in the document.
    const scene = container.querySelector("[data-script-beat]");
    expect(
      scene!.compareDocumentPosition(recap!) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });

  it("states what the crew knows and what the lesson assumes", () => {
    renderSteps(0, entry);
    expect(
      screen.getByText("Where the investigation stands"),
    ).toBeInTheDocument();
    expect(screen.getByText(/DEEP SCAN has been trained/)).toBeInTheDocument();
    expect(screen.getByText(/Useful prerequisites:/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "revisit its lessons" }),
    ).toHaveAttribute("href", "/worlds/deep-orbit#module-training-loop");
  });

  it("drops the backtrack offer once the previous module is finished", () => {
    renderSteps(0, { ...entry, previousComplete: true });
    expect(
      screen.queryByRole("link", { name: "revisit its lessons" }),
    ).toBeNull();
    expect(screen.getByText(/DEEP SCAN has been trained/)).toBeInTheDocument();
  });

  it("renders nothing without it, which is every lesson of module 1", () => {
    const { container } = renderSteps(0);
    expect(container.querySelector("[data-post-scene]")).toBeNull();
    expect(screen.queryByText("Where the investigation stands")).toBeNull();
  });

  it("stays on the Briefing and never follows the reader to a later step", () => {
    const { container } = renderSteps(1, entry);
    expect(container.querySelector("[data-post-scene]")).toBeNull();
  });
});

describe("Takeaways: the recap after the recall (spec 2026-09-24, section 2)", () => {
  const RECALL_KEY = "tc_recall_deep-orbit_introduction-to-tensors";
  const withTerms = {
    ...lesson,
    glossaryTerms: [
      { term: "tensor", definition: "a numeric array with a shape" },
    ],
  };
  function openTakeaways(
    extra: Partial<React.ComponentProps<typeof LessonSteps>> = {},
    owner: string | null = null,
  ) {
    // A signed-in reader restores from the account-suffixed keys (see the
    // account-owned position tests at the top of this file).
    const suffix = owner ? `:account:${owner}` : "";
    localStorage.setItem(`${STEP_KEY}${suffix}`, "3");
    localStorage.setItem(`${MAX_KEY}${suffix}`, "3");
    render(
      <LessonSteps
        lesson={withTerms}
        exercises={[]}
        worldSlug="deep-orbit"
        moduleSlug="foundations"
        moduleName="Foundations: Tensors & Data"
        moduleEntry={null}
        prevLesson={null}
        nextLesson={null}
        {...extra}
      />,
    );
    expect(
      screen.getByRole("group", { name: "Lesson step 4 of 5" }),
    ).toBeInTheDocument();
  }

  it("holds the recap and the terms list until the recall settles, then remembers it", () => {
    recallState.pendingOnMount = 1;
    openTakeaways();
    expect(screen.getByTestId("takeaways-recall")).toBeInTheDocument();
    expect(screen.queryByTestId("takeaways-prose")).toBeNull();
    expect(screen.queryByTestId("lesson-terms-list")).toBeNull();
    expect(localStorage.getItem(RECALL_KEY)).toBeNull();
    act(() => recallState.report?.(0));
    expect(screen.getByTestId("takeaways-prose")).toBeInTheDocument();
    expect(screen.getByTestId("lesson-terms-list")).toBeInTheDocument();
    expect(localStorage.getItem(RECALL_KEY)).toBe("1");
    // Sticky for the mount: a later non-zero report never hides it again.
    act(() => recallState.report?.(1));
    expect(screen.getByTestId("takeaways-prose")).toBeInTheDocument();
  });

  it("shows everything at once when this browser remembers the recall", () => {
    recallState.pendingOnMount = 1;
    localStorage.setItem(RECALL_KEY, "1");
    openTakeaways();
    expect(screen.getByTestId("takeaways-prose")).toBeInTheDocument();
    expect(screen.getByTestId("lesson-terms-list")).toBeInTheDocument();
  });

  it("shows everything at once when the server knows the lesson is complete", () => {
    recallState.pendingOnMount = 1;
    openTakeaways({
      lessons: [
        {
          slug: lesson.slug,
          title: lesson.title,
          order: 1,
          locked: false,
          completed: true,
        },
      ],
    });
    expect(screen.getByTestId("takeaways-prose")).toBeInTheDocument();
    expect(localStorage.getItem(RECALL_KEY)).toBeNull();
  });

  it("shows everything at once when this browser holds a guest completion of the lesson", () => {
    // A guest who finished lesson 1, came back and stepped back from the
    // Epilogue: the server never knew them, the guest record does.
    recallState.pendingOnMount = 1;
    recordGuestCompletion("deep-orbit", "foundations", lesson.slug);
    openTakeaways();
    expect(screen.getByTestId("takeaways-prose")).toBeInTheDocument();
    expect(screen.getByTestId("lesson-terms-list")).toBeInTheDocument();
    expect(localStorage.getItem(RECALL_KEY)).toBeNull();
  });

  it("settles for a signed-in owner from a guest completion of the lesson", () => {
    // Deliberate: GuestProgressBridge replays guest completions into whichever account signs in.
    recallState.pendingOnMount = 1;
    recordGuestCompletion("deep-orbit", "foundations", lesson.slug);
    openTakeaways({ reviewUserId: "alice" }, "alice");
    expect(screen.getByTestId("takeaways-prose")).toBeInTheDocument();
    expect(screen.getByTestId("lesson-terms-list")).toBeInTheDocument();
  });

  it("keeps the gate when the guest completion is another lesson's", () => {
    recallState.pendingOnMount = 1;
    recordGuestCompletion("deep-orbit", "foundations", "tensor-shapes");
    openTakeaways();
    expect(screen.getByTestId("takeaways-recall")).toBeInTheDocument();
    expect(screen.queryByTestId("takeaways-prose")).toBeNull();
    expect(screen.queryByTestId("lesson-terms-list")).toBeNull();
  });

  it("writes no flag when the body has no card", () => {
    openTakeaways();
    expect(screen.getByTestId("takeaways-prose")).toBeInTheDocument();
    expect(localStorage.getItem(RECALL_KEY)).toBeNull();
  });

  it("keys the flag to the account like the step keys", () => {
    recallState.pendingOnMount = 1;
    openTakeaways({ reviewUserId: "alice" }, "alice");
    act(() => recallState.report?.(0));
    expect(localStorage.getItem(`${RECALL_KEY}:account:alice`)).toBe("1");
    expect(localStorage.getItem(RECALL_KEY)).toBeNull();
  });
});

/* Swipe paging on phones. A horizontal pan that starts where content can
   pan sideways is content scrolling (2026-07-14 UX audit). Code wraps
   below 1,024 px since spec 2026-09-24 section 4, so a code block that
   cannot pan lets the swipe through. jsdom lays nothing out: each test
   stubs the block's scroll box and appends it inside the stubbed body. */
describe("LessonSteps, swipe navigation", () => {
  function openConcept() {
    localStorage.setItem(STEP_KEY, "1");
    renderSteps();
    expect(
      screen.getByRole("group", { name: "Lesson step 2 of 5" }),
    ).toBeInTheDocument();
  }

  // The Concept step mounts the objectives and the body as two instances;
  // either sits inside the element that listens for the swipe.
  const contentRoot = () => screen.getAllByTestId("lesson-content")[0];

  function stubScrollBox(
    el: HTMLElement,
    scrollWidth: number,
    clientWidth: number,
  ) {
    Object.defineProperty(el, "scrollWidth", {
      configurable: true,
      value: scrollWidth,
    });
    Object.defineProperty(el, "clientWidth", {
      configurable: true,
      value: clientWidth,
    });
  }

  function codeBlock(scrollWidth: number, clientWidth: number) {
    const pre = document.createElement("pre");
    const code = document.createElement("code");
    code.textContent = "const t = tf.tensor([1, 2, 3]);";
    pre.appendChild(code);
    stubScrollBox(pre, scrollWidth, clientWidth);
    contentRoot().appendChild(pre);
    // The touch lands on the inline code, as a finger on a sample does.
    return code;
  }

  // Inline code in a prose paragraph, with no pre around it.
  function inlineCode(scrollWidth: number, clientWidth: number) {
    const p = document.createElement("p");
    const code = document.createElement("code");
    code.textContent = "tf.tensor1d";
    p.append("Call ", code, " on the readings.");
    stubScrollBox(code, scrollWidth, clientWidth);
    contentRoot().appendChild(p);
    return code;
  }

  function swipeLeft(el: Element) {
    fireEvent.touchStart(el, { touches: [{ clientX: 300, clientY: 100 }] });
    fireEvent.touchEnd(el, {
      changedTouches: [{ clientX: 100, clientY: 105 }],
    });
  }

  it("pages on a swipe that starts on a code block that cannot pan", () => {
    openConcept();
    swipeLeft(codeBlock(320, 320));
    expect(
      screen.getByRole("group", { name: "Lesson step 3 of 5" }),
    ).toBeInTheDocument();
  });

  it("pages when the block's widths differ by one rounding pixel", () => {
    // scrollWidth and clientWidth round separately, so at a fractional
    // width they can differ by 1 px with nothing overflowing.
    openConcept();
    swipeLeft(codeBlock(321, 320));
    expect(
      screen.getByRole("group", { name: "Lesson step 3 of 5" }),
    ).toBeInTheDocument();
  });

  it("pages on a swipe that starts on inline code outside any pre", () => {
    openConcept();
    swipeLeft(inlineCode(120, 120));
    expect(
      screen.getByRole("group", { name: "Lesson step 3 of 5" }),
    ).toBeInTheDocument();
  });

  it("leaves a swipe on code outside a pre to the code when its own box pans", () => {
    // The closest("code") fallback: with no pre, the code is the block.
    openConcept();
    swipeLeft(inlineCode(480, 120));
    expect(
      screen.getByRole("group", { name: "Lesson step 2 of 5" }),
    ).toBeInTheDocument();
  });

  it("leaves a swipe on a code block that pans sideways to the block", () => {
    openConcept();
    swipeLeft(codeBlock(640, 320));
    expect(
      screen.getByRole("group", { name: "Lesson step 2 of 5" }),
    ).toBeInTheDocument();
  });

  it("leaves a swipe on the editor to the editor", () => {
    openConcept();
    const editor = document.createElement("div");
    editor.className = "sp-wrapper";
    const line = document.createElement("div");
    line.textContent = "const model = tf.sequential();";
    editor.appendChild(line);
    contentRoot().appendChild(editor);
    swipeLeft(line);
    expect(
      screen.getByRole("group", { name: "Lesson step 2 of 5" }),
    ).toBeInTheDocument();
  });
});
