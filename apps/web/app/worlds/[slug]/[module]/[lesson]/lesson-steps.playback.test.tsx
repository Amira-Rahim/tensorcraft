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

    // Beats: narrative P (script-beat) + dialogue + story P + dialogue = 4.
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
    expect(shownBeatCount()).toBe(4);
    expect(
      document.querySelector("[data-script-state='done']"),
    ).toBeInTheDocument();

    // The dialogue elements specifically must still carry the attribute.
    const dialogues = document.querySelectorAll("[data-dialogue]");
    expect(dialogues).toHaveLength(2);
    for (const d of Array.from(dialogues)) {
      expect(d.hasAttribute("data-beat-shown")).toBe(true);
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
    expect(shownBeatCount()).toBe(4);

    // Replay resets and re-reveals.
    act(() => {
      screen.getByRole("button", { name: /replay/i }).click();
    });
    expect(shownBeatCount()).toBe(0);
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(shownBeatCount()).toBe(4);
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

  it("plays slugline, then establishing shot, then stage direction", () => {
    renderWithScene();
    // Six beats now: slugline + portrait + narrative + dialogue + story P
    // + dialogue. jsdom never loads images, so the portrait stays mounted.
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(shownBeatCount()).toBe(6);

    const beats = Array.from(document.querySelectorAll("[data-beat-shown]"));
    const portraitIdx = beats.findIndex(
      (b) => b.getAttribute("data-testid") === "scene-portrait",
    );
    expect(portraitIdx).toBe(1);
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

    // Replay collects beats fresh from the DOM: back to the 5 art-less
    // beats (slugline + narrative + dialogue + story P + dialogue).
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    act(() => {
      screen.getByRole("button", { name: /replay/i }).click();
    });
    act(() => {
      vi.advanceTimersByTime(30_000);
    });
    expect(shownBeatCount()).toBe(5);
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
    expect(screen.getAllByText("Archimedes, Bridge").length).toBeGreaterThan(0);
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

it("defers playback and emits one remembered skip after a warm-up", async () => {
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
  expect(
    document.querySelector("[data-script-state='idle']"),
  ).toBeInTheDocument();
  expect(screen.queryByRole("button", { name: /skip intro/i })).toBeNull();
  expect(track).not.toHaveBeenCalledWith("script_skipped", expect.anything());
  act(() => screen.getByText("I couldn't recall it").click());
  act(() => screen.getByText("Continue to lesson").click());
  expect(
    document.querySelector("[data-script-state='done']"),
  ).toBeInTheDocument();
  expect(
    vi.mocked(track).mock.calls.filter(([event]) => event === "script_skipped"),
  ).toHaveLength(1);
});
