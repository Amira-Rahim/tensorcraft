import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { StrictMode } from "react";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { LessonSteps, PATTERN_LABELS } from "./lesson-steps";

// Unlike lesson-steps.test.tsx, this suite uses the REAL LessonContent and
// REAL Dialogue so the playback timeline runs against the actual MDX DOM.

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

vi.mock("./lesson-drawer", () => ({
  LessonDrawer: () => null,
}));

// Importing the whole package pulls Sandpack (crashes jsdom); keep the two
// components under test real and stub the rest.
vi.mock("@tensorcraft/ui", async () => {
  const { Dialogue } = await vi.importActual<{
    Dialogue: React.ComponentType<{
      speaker: string;
      children: React.ReactNode;
    }>;
  }>("@tensorcraft/ui/mdx/dialogue");
  const { SceneHeading } = await vi.importActual<{
    SceneHeading: React.ComponentType<{ location: string }>;
  }>("@tensorcraft/ui/mdx/scene-heading");
  const { ScenePortrait } = await vi.importActual<{
    ScenePortrait: React.ComponentType<{ src: string; beat?: boolean }>;
  }>("@tensorcraft/ui/scene-portrait");
  return {
    Dialogue,
    SceneHeading,
    ScenePortrait,
    AnimatedAvatar: () => null,
    ExerciseDataProvider: ({ children }: { children: React.ReactNode }) => (
      <>{children}</>
    ),
    BridgeCallout: () => null,
    CodeBlock: () => null,
    DerivationDrawer: () => null,
    HintPanel: () => null,
    KeyTakeaways: () => null,
    LessonRecap: () => null,
    LearningObjectives: () => null,
    Quiz: () => null,
    Exercise: () => null,
    ExerciseBrief: () => null,
  };
});

vi.mock("@/lib/progress-client", () => ({
  markLessonStarted: vi.fn().mockResolvedValue(undefined),
  markLessonCompleted: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/lib/analytics", () => ({
  trackRecallAnswered: vi.fn(),
  trackLessonStarted: vi.fn(),
  trackLessonCompleted: vi.fn(),
  trackModuleCompleted: vi.fn(),
  trackCheckpointSubmitted: vi.fn(),
  trackExerciseSubmitted: vi.fn(),
  trackHintRequested: vi.fn(),
  // The step machine emits step views and script skip/finish through the
  // typed helper (2026-09-04 instrumentation).
  track: vi.fn(),
  EVENTS: {
    LESSON_STEP_VIEWED: "lesson_step_viewed",
    SCRIPT_SKIPPED: "script_skipped",
    SCRIPT_FINISHED: "script_finished",
  },
}));

// Final step fires a lazy import chain (api-url → supabase client → getSession
// → fetch) for the Kit "first lesson" tag. Stub it so the dynamic imports
// resolve to mocks rather than transforming the real modules after teardown
// ("Closing rpc while fetch was pending").
vi.mock("@/lib/api-url", () => ({
  getApiUrl: () => "http://localhost",
}));
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
    },
  }),
}));

vi.mock("@/app/components/mdx", () => ({
  BossBeat: () => null,
  StoryConsequence: () => null,
  Concept: () => null,
  DeepScanDemo: () => null,
  DispatchTease: () => null,
  InteractiveDemo: () => null,
  MathBlock: () => null,
  NextLesson: () => null,
  RecallPrompt: () => null,
  StrategyThread: () => null,
  TransferAssignment: () => null,
  DecisionTask: () => null,
  IndependentProject: () => null,
  ProjectMilestone: () => null,
  ConceptReference: () => null,
  ChannelLayoutExperiment: () => null,
  LearningExperiment: () => null,
}));

// Velite-style compiled MDX: two opening dialogues, a story paragraph
// between them, then a heading and instructional prose.
const COMPILED_BODY = `const {Fragment, jsx, jsxs} = arguments[0];
function _createMdxContent(props) {
  const _components = props.components || {};
  const Dialogue = _components.Dialogue;
  return jsxs(Fragment, {children: [
    jsx(Dialogue, {speaker: "Commander Mirza", children: "We are picking up a structured data stream."}),
    jsx("p", {children: "The deck lights dim while the array retargets."}),
    jsx(Dialogue, {speaker: "ARIA", children: "Six hours, fourteen minutes of parsing failures."}),
    jsx("h2", {children: "What Is a Tensor?"}),
    jsx("p", {children: "A tensor is a multi-dimensional array with opinions."})
  ]});
}
return {default: function(props) { return _createMdxContent(props); }};`;

const lesson = {
  slug: "introduction-to-tensors",
  title: "Introduction to Tensors",
  order: 1,
  estimatedMinutes: 10,
  body: COMPILED_BODY,
  context: { narrative: "The Archimedes receives a mysterious data stream." },
  concept: { explanation: "e" },
  consequence: { narrative: "c" },
};

function renderReal() {
  return render(
    <StrictMode>
      <LessonSteps
        lesson={lesson}
        exercises={[]}
        worldSlug="deep-orbit"
        moduleSlug="foundations"
        moduleName="Foundations"
        prevLesson={null}
        nextLesson={null}
      />
    </StrictMode>,
  );
}

function shownBeatCount(): number {
  return document.querySelectorAll("[data-beat-shown]").length;
}

beforeEach(() => {
  localStorage.clear();
  // Reset the step hash like localStorage: jsdom keeps `location` across
  // tests and a stale #step-N reads as a deep link on the next mount.
  window.history.replaceState(null, "", window.location.pathname);
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("LessonSteps, playback against real MDX DOM", () => {
  it("reveals every beat progressively and keeps attributes through re-renders", () => {
    renderReal();
    expect(
      document.querySelector("[data-script-state='playing']"),
    ).toBeInTheDocument();

    // The context is always visible. Beats: dialogue + story P + dialogue = 3.
    expect(shownBeatCount()).toBe(0);

    act(() => {
      vi.advanceTimersByTime(400); // first beat at 350ms
    });
    expect(shownBeatCount()).toBe(1);

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(shownBeatCount()).toBeGreaterThanOrEqual(2);

    act(() => {
      vi.advanceTimersByTime(20_000);
    });
    expect(shownBeatCount()).toBe(3);
    expect(
      document.querySelector("[data-script-state='done']"),
    ).toBeInTheDocument();

    // The dialogue elements specifically must still carry the attribute.
    const dialogues = document.querySelectorAll("[data-dialogue]");
    expect(dialogues).toHaveLength(2);
    for (const d of Array.from(dialogues)) {
      expect(d.hasAttribute("data-beat-shown")).toBe(true);
      // Playback preserves the shared full-width Deep Orbit speech layout.
      expect(d).toHaveAttribute("data-layout", "speech");
    }
  });

  it("completes the timeline and supports replay from a clean slate", () => {
    renderReal();
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(shownBeatCount()).toBe(1);

    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(shownBeatCount()).toBe(3);

    // Replay resets and re-reveals.
    act(() => {
      screen.getByRole("button", { name: /replay/i }).click();
    });
    expect(shownBeatCount()).toBe(0);
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(shownBeatCount()).toBe(3);
  });
});

describe("LessonSteps, scene portrait beat", () => {
  const sceneLesson = {
    ...lesson,
    scene: { location: "Archimedes, Bridge", time: "After hours" },
  };

  function renderWithScene() {
    return render(
      <StrictMode>
        <LessonSteps
          lesson={sceneLesson}
          exercises={[]}
          worldSlug="deep-orbit"
          moduleSlug="foundations"
          prevLesson={null}
          nextLesson={null}
          moduleName="Foundations"
        />
      </StrictMode>,
    );
  }

  it("keeps context readable while the slugline and establishing shot play", () => {
    renderWithScene();
    // Five beats: slugline, narrated introduction, then the scene image.
    // jsdom never loads images, so the portrait stays mounted.
    expect(screen.getByTestId("scene-context")).toBeVisible();
    expect(screen.getByTestId("scene-context")).not.toHaveAttribute(
      "data-script-beat",
    );
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(shownBeatCount()).toBe(5);

    const beats = Array.from(document.querySelectorAll("[data-beat-shown]"));
    const portraitIdx = beats.findIndex(
      (b) => b.getAttribute("data-testid") === "scene-portrait",
    );
    expect(portraitIdx).toBe(beats.length - 1);
  });

  it("keeps the playback control outside every beat wrapper", () => {
    renderWithScene();
    // Still playing: a control inside a beat wrapper would inherit that
    // beat's hidden state until the timeline reveals it.
    expect(
      document.querySelector("[data-script-state='playing']"),
    ).toBeInTheDocument();
    expect(
      screen
        .getByRole("button", { name: /skip intro/i })
        .closest("[data-script-beat]"),
    ).toBeNull();
  });

  it("gives Skip and Replay the same minimum box, so the row never jumps", () => {
    renderWithScene();
    // A 428 px phone fits the slugline and Skip on one line; a wider Replay
    // would wrap the row when the scene ends. Both are at least 44 by 160.
    expect(screen.getByRole("button", { name: /skip intro/i })).toHaveClass(
      "min-h-11",
      "min-w-40",
    );
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.getByRole("button", { name: /replay/i })).toHaveClass(
      "min-h-11",
      "min-w-40",
    );
  });

  it("collapses to today's timeline when the portrait 404s (art-agnostic)", () => {
    renderWithScene();
    const img = document.querySelector("[data-testid='scene-portrait'] img")!;
    act(() => {
      img.dispatchEvent(new Event("error"));
    });
    expect(
      document.querySelector("[data-testid='scene-portrait']"),
    ).not.toBeInTheDocument();

    // Replay collects four art-less beats: slugline + dialogue + story P
    // + dialogue. The context remains outside playback.
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    act(() => {
      screen.getByRole("button", { name: /replay/i }).click();
    });
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(shownBeatCount()).toBe(4);
  });
});

describe("structure-variety machinery (P2 gate)", () => {
  it("PATTERN_LABELS covers every non-standard pattern the content schema accepts", () => {
    // The velite config is the authoring-side source of truth for the enum.
    // A pattern value added there without a label here would render nothing
    // in the Briefing FORMAT tag (the DerivationDrawer bug class), so this
    // test fails on any drift between the two lists.
    const configPath = join(
      fileURLToPath(import.meta.url),
      "../../../../../../../../packages/content/velite.config.ts",
    );
    const src = readFileSync(configPath, "utf8");
    const enumBlock = src.match(/pattern: s\s*\.enum\(\[([\s\S]*?)\]\)/);
    expect(enumBlock).not.toBeNull();
    const schemaValues = Array.from(
      enumBlock![1].matchAll(/"([a-z_]+)"/g),
      (m) => m[1],
    );
    expect(schemaValues).toContain("standard");
    const nonStandard = schemaValues.filter((v) => v !== "standard").sort();
    expect(Object.keys(PATTERN_LABELS).sort()).toEqual(nonStandard);
    for (const label of Object.values(PATTERN_LABELS)) {
      expect(label.length).toBeGreaterThan(0);
    }
  });

  it("renders the FORMAT tag and slugline when pattern and scene are set", () => {
    render(
      <StrictMode>
        <LessonSteps
          lesson={{
            ...lesson,
            pattern: "broken_code_first",
            scene: { location: "Archimedes, Bridge", time: "Second watch" },
          }}
          exercises={[]}
          worldSlug="deep-orbit"
          moduleSlug="foundations"
          moduleName="Foundations"
          prevLesson={null}
          nextLesson={null}
        />
      </StrictMode>,
    );
    const tag = screen.getByTestId("pattern-format-tag");
    expect(tag).toHaveTextContent(PATTERN_LABELS.broken_code_first);
    expect(tag.closest("[data-testid='lesson-eyebrow']")).not.toBeNull();
    // Module term and slug, lesson term and number, the tag, the duration.
    expect(tag.closest("[data-testid='lesson-eyebrow']")?.textContent).toBe(
      `SECTOR foundations · MISSION 1 · ${PATTERN_LABELS.broken_code_first} · 10 min`,
    );
    expect(screen.getAllByText(/Archimedes, Bridge/i).length).toBeGreaterThan(
      0,
    );
  });

  it("renders no FORMAT tag for standard-pattern lessons", () => {
    render(
      <StrictMode>
        <LessonSteps
          lesson={{ ...lesson, pattern: "standard" }}
          exercises={[]}
          worldSlug="deep-orbit"
          moduleSlug="foundations"
          moduleName="Foundations"
          prevLesson={null}
          nextLesson={null}
        />
      </StrictMode>,
    );
    expect(screen.queryByTestId("pattern-format-tag")).toBeNull();
  });
});

describe("LessonSteps, script telemetry (2026-09-04 instrumentation)", () => {
  it("emits script_finished with run=auto when the timeline completes, and run=replay after Replay", async () => {
    const { track } = await import("@/lib/analytics");
    vi.mocked(track).mockClear();
    renderReal();
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(track).toHaveBeenCalledWith(
      "script_finished",
      expect.objectContaining({ run: "auto", step: 0 }),
    );

    act(() => {
      screen.getByRole("button", { name: /replay/i }).click();
    });
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(track).toHaveBeenCalledWith(
      "script_finished",
      expect.objectContaining({ run: "replay" }),
    );
  });

  it("counts the remembered skip preference as script_skipped via=auto", async () => {
    const { track } = await import("@/lib/analytics");
    vi.mocked(track).mockClear();
    // One prior manual skip anywhere arms the forever preference; before
    // 2026-09-04 this path emitted nothing and the skip rate was biased
    // low by construction.
    localStorage.setItem("tc-script-skip", "1");
    renderReal();
    expect(track).toHaveBeenCalledWith(
      "script_skipped",
      expect.objectContaining({ via: "auto", elapsedMs: 0 }),
    );
    expect(track).not.toHaveBeenCalledWith(
      "script_finished",
      expect.anything(),
    );
  });
});

it("plays the scene first and shows a due warm-up after it, in the post-scene slot", async () => {
  // Before 2026-09-22 the warm-up sat above the scene and held playback in
  // "idle" until it was answered, so a returning learner saw one card and a
  // hidden scene's worth of empty page. It now follows the scene.
  const { track } = await import("@/lib/analytics");
  vi.mocked(track).mockClear();
  localStorage.setItem("tc-script-skip", "1");
  render(
    <StrictMode>
      <LessonSteps
        lesson={lesson}
        exercises={[]}
        worldSlug="deep-orbit"
        moduleSlug="foundations"
        prevLesson={null}
        nextLesson={null}
        reviewUserId="alice"
        dueReviews={[
          {
            worldId: "deep-orbit",
            moduleId: "foundations",
            lessonId: lesson.slug,
            promptIndex: 0,
            pulls: 0,
            successes: 0,
            lastReviewedAt: null,
            nextReviewAt: "2020-01-01",
            question: "Recall?",
            answer: "Answer.",
          },
        ]}
      />
    </StrictMode>,
  );
  // The remembered skip resolves the scene on mount; nothing waits on the card.
  expect(document.querySelector("[data-script-state='idle']")).toBeNull();
  expect(
    document.querySelector("[data-script-state='done']"),
  ).toBeInTheDocument();
  expect(
    vi.mocked(track).mock.calls.filter(([event]) => event === "script_skipped"),
  ).toHaveLength(1);
  // The card is inside the Briefing root, in the block the stylesheet holds
  // back during playback, and below the title.
  const warmup = screen.getByRole("region", { name: "Warm-up, item 1 of 1" });
  expect(warmup.closest("[data-post-scene]")).not.toBeNull();
  expect(document.querySelector("[data-script-state]")?.contains(warmup)).toBe(
    true,
  );
  const h1 = screen.getByRole("heading", { level: 1 });
  expect(
    h1.compareDocumentPosition(warmup) & Node.DOCUMENT_POSITION_FOLLOWING,
  ).toBeTruthy();
  act(() => screen.getByText("I couldn't recall it").click());
  act(() => screen.getByText("Continue to lesson").click());
  expect(screen.queryByRole("region", { name: /Warm-up/ })).toBeNull();
  // Still exactly one skip: answering the card never replays the scene.
  expect(
    vi.mocked(track).mock.calls.filter(([event]) => event === "script_skipped"),
  ).toHaveLength(1);
});
