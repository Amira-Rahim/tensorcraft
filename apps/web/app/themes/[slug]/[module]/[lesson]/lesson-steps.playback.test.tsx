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
  return {
    Dialogue,
    SceneHeading,
    CharacterAvatar: () => null,
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
  trackLessonStarted: vi.fn(),
  trackLessonCompleted: vi.fn(),
  trackCheckpointSubmitted: vi.fn(),
  trackExerciseSubmitted: vi.fn(),
  trackHintRequested: vi.fn(),
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
    },
  }),
}));

vi.mock("@/app/components/mdx", () => ({
  BossBeat: () => null,
  Concept: () => null,
  DeepScanDemo: () => null,
  DispatchTease: () => null,
  InteractiveDemo: () => null,
  MathBlock: () => null,
  NextLesson: () => null,
  RecallPrompt: () => null,
  StrategyThread: () => null,
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
        themeSlug="deep-orbit"
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
          themeSlug="deep-orbit"
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
          themeSlug="deep-orbit"
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
