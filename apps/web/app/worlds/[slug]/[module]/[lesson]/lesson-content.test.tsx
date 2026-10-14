import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { LessonContent } from "./lesson-content";
import { LessonChallengeScene } from "./lesson-challenge-scene";
import { trackHintRequested } from "@/lib/analytics";

vi.mock("@tensorcraft/ui", () => ({
  Dialogue: ({
    speaker,
    layout,
    children,
  }: {
    speaker: string;
    layout?: "stack" | "row" | "speech";
    children: React.ReactNode;
  }) => (
    <div data-testid="dialogue" data-layout={layout}>
      {speaker}: {children}
    </div>
  ),
  AnimatedAvatar: () => <div data-testid="animated-avatar" />,
  ScenePortrait: ({ src, alt }: { src: string; alt?: string }) => (
    <img data-testid="scene-portrait" src={src} alt={alt} />
  ),
  BridgeCallout: () => <div data-testid="bridge" />,
  CodeBlock: ({ children }: { children: React.ReactNode }) => (
    <pre>{children}</pre>
  ),
  DerivationDrawer: ({ summary }: { summary?: string }) => (
    <div data-testid="derivation-drawer">{summary}</div>
  ),
  ExerciseDataProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  GlossaryTerm: ({
    term,
    children,
  }: {
    term: string;
    children: React.ReactNode;
  }) => (
    <button type="button" data-glossary-term={term}>
      {children}
    </button>
  ),
  HintPanel: ({ compact }: { compact?: boolean }) => (
    <div data-testid="hint-panel" data-compact={compact || undefined} />
  ),
  KeyTakeaways: () => null,
  LearningObjectives: () => null,
  LessonRecap: () => <div>Lesson recap</div>,
  Quiz: () => null,
  Exercise: ({
    brief,
    titled,
    workspace,
    editorHeading,
    hints,
    onHintRevealed,
  }: {
    brief?: "inline" | "external";
    titled?: boolean;
    workspace?: boolean;
    editorHeading?: string;
    hints?: Array<{ level: string; content: string }>;
    onHintRevealed?: (hintLevel: 1 | 2 | 3) => void;
  }) => (
    <div
      data-testid="exercise-pane"
      data-brief={brief ?? "inline"}
      data-titled={titled ? "true" : undefined}
      data-workspace={workspace ? "true" : undefined}
      data-editor-heading={editorHeading}
      data-hints={hints?.map((hint) => hint.level).join(",")}
    >
      <button type="button" onClick={() => onHintRevealed?.(1)}>
        pane reveal
      </button>
    </div>
  ),
  ExerciseBrief: ({
    slug,
    onHintRevealed,
    compactHints,
  }: {
    slug: string;
    onHintRevealed?: (hintLevel: 1 | 2 | 3) => void;
    compactHints?: boolean;
  }) => (
    <div
      data-testid="exercise-brief"
      data-compact-hints={compactHints || undefined}
    >
      {slug}
      <button type="button" onClick={() => onHintRevealed?.(1)}>
        reveal
      </button>
    </div>
  ),
}));

vi.mock("@/app/components/mdx", () => ({
  BossBeat: () => null,
  StoryConsequence: () => <p>Saved follow-up</p>,
  Concept: () => null,
  ConceptReference: () => null,
  DeepScanDemo: () => null,
  DispatchTease: () => null,
  InteractiveDemo: () => null,
  LearningExperiment: () => <div>Numerical experiment mounted</div>,
  ChannelLayoutExperiment: () => <div>Channel experiment mounted</div>,
  MathBlock: () => null,
  NextLesson: () => null,
  RecallPrompt: ({
    question,
    onAnswer,
  }: {
    question: string;
    onAnswer?: (result: "attempted" | "got-it" | "bailed") => void;
  }) => (
    <>
      <button type="button" onClick={() => onAnswer?.("attempted")}>
        Attempt {question}
      </button>
      <button type="button" onClick={() => onAnswer?.("got-it")}>
        Answer {question}
      </button>
    </>
  ),
  StrategyThread: () => null,
  TransferAssignment: () => <div>Independent assignment</div>,
  DecisionTask: () => <div>Decision task</div>,
  ProjectMilestone: () => <div>Project milestone</div>,
  IndependentProject: () => <div>Independent project</div>,
}));
vi.mock("@/lib/analytics", () => ({
  trackCheckpointSubmitted: vi.fn(),
  trackExerciseSubmitted: vi.fn(),
  trackHintRequested: vi.fn(),
  trackRecallAnswered: vi.fn(),
}));

// Minimal Velite-style compiled MDX body: an opening Dialogue, lesson prose,
// and an <Epilogue> wrapping a closing scene (prose + Dialogue).
const COMPILED_BODY = `const {Fragment, jsx, jsxs} = arguments[0];
function _createMdxContent(props) {
  const _components = props.components || {};
  const Dialogue = _components.Dialogue;
  const Epilogue = _components.Epilogue;
  return jsxs(Fragment, {children: [
    jsx(Dialogue, {speaker: "Dr. Farah", children: "Opening line."}),
    jsx("p", {children: "Lesson prose."}),
    jsx(Epilogue, {children: jsxs(Fragment, {children: [
      jsx("p", {children: "The scene after the work."}),
      jsx(Dialogue, {speaker: "Dr. Farah", children: "Closing line."})
    ]})})
  ]});
}
return {default: function(props) { return _createMdxContent(props); }};`;

// Two recall cards, as 24 of the 56 lessons carry (spec 2026-09-24, section 2).
const RECALL_BODY = `const {Fragment, jsx, jsxs} = arguments[0];
function _createMdxContent(props) {
  const _components = props.components || {};
  const RecallPrompt = _components.RecallPrompt;
  return jsxs(Fragment, {children: [
    jsx(RecallPrompt, {question: "one", answer: "a"}),
    jsx(RecallPrompt, {question: "two", answer: "b"})
  ]});
}
return {default: function(props) { return _createMdxContent(props); }};`;

const EXERCISE_BODY = `const {Fragment, jsx, jsxs} = arguments[0];
function _createMdxContent(props) {
  const _components = props.components || {};
  const Exercise = _components.Exercise;
  return jsxs(Fragment, {children: [
    jsx("p", {children: "Now it is your turn."}),
    jsx(Exercise, {slug: "create-a-tensor"})
  ]});
}
return {default: function(props) { return _createMdxContent(props); }};`;

const CHALLENGE_BODY = `const {Fragment, jsx, jsxs} = arguments[0];
return {default: function(props) {
  const c = props.components;
  return jsxs(Fragment, {children: [
    jsx(c.h2, {children: "Challenge"}),
    jsx(c.p, {children: "Arrange the twelve readings into rows."}),
    jsx(c.Exercise, {slug: "reshape-tensor"})
  ]});
}};`;

const lesson = {
  body: COMPILED_BODY,
  concept: { explanation: "x" },
};

describe("LessonContent, visible challenge scene", () => {
  const challengeLesson = {
    ...lesson,
    slug: "tensor-shapes",
    body: CHALLENGE_BODY,
    context: { narrative: "Farah checks the readings.", speaker: "Dr. Farah" },
    scene: {
      location: "Archimedes, Lab",
      portraitAlt: "Farah examines the sensor readings.",
    },
  };
  const challengeProps = {
    lesson: challengeLesson,
    worldId: "deep-orbit",
    moduleId: "foundations",
    lessonId: "tensor-shapes",
    visibleComponents: new Set(["challenge"]),
  };

  it("shows the scene between the Challenge heading and authored task", () => {
    render(
      <LessonContent
        {...challengeProps}
        challengeScene={
          <LessonChallengeScene
            lesson={challengeLesson}
            worldSlug="deep-orbit"
            moduleSlug="foundations"
          />
        }
      />,
    );
    const heading = screen.getByRole("heading", { name: "Challenge" });
    const scene = screen.getByTestId("challenge-scene");
    const task = screen.getByText("Arrange the twelve readings into rows.");
    expect(heading).toHaveAttribute("data-heading", "challenge");
    expect(heading.nextElementSibling).toBe(scene);
    expect(scene.nextElementSibling).toBe(task);
    expect(scene).toBeVisible();
    expect(scene.tagName).toBe("SECTION");
    expect(scene.closest("details")).toBeNull();
    expect(scene.querySelector("details, summary")).toBeNull();
    expect(
      screen.queryByText("View the mission scene"),
    ).not.toBeInTheDocument();

    const narrative = screen.getByTestId("mission-handoff");
    const image = screen.getByRole("img", {
      name: "Farah examines the sensor readings.",
    });
    const caption = screen.getByText(
      "Inside the science lab on the spaceship Archimedes.",
    );
    expect(narrative).toBeVisible();
    expect(narrative.compareDocumentPosition(image)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(image.compareDocumentPosition(caption)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING,
    );
    expect(image).toHaveAttribute(
      "src",
      "/scenes/deep-orbit/foundations/tensor-shapes.webp",
    );
  });

  it("does not repeat the scene in a content instance that does not request it", () => {
    render(<LessonContent {...challengeProps} />);
    expect(screen.queryByTestId("challenge-scene")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Challenge" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Arrange the twelve readings into rows."),
    ).toBeInTheDocument();
  });

  it("updates the scene slot without remounting the exercise brief", () => {
    const props = {
      ...challengeProps,
      visibleComponents: new Set(["challenge", "ExerciseBrief"]),
    };
    const { rerender } = render(
      <LessonContent
        {...props}
        challengeScene={<section>First scene.</section>}
      />,
    );
    const brief = screen.getByTestId("exercise-brief");
    const hintButton = screen.getByRole("button", { name: "reveal" });
    fireEvent.click(hintButton);
    rerender(
      <LessonContent
        {...props}
        challengeScene={<section>Updated scene.</section>}
      />,
    );
    expect(screen.queryByText("First scene.")).not.toBeInTheDocument();
    expect(screen.getByText("Updated scene.")).toBeVisible();
    expect(screen.getByTestId("exercise-brief")).toBe(brief);
    expect(screen.getByRole("button", { name: "reveal" })).toBe(hintButton);
  });
});

describe("LessonContent, briefing notes", () => {
  it("keeps the idea and task readable once when placed in separate sections", () => {
    const briefingLesson = {
      ...lesson,
      body: `const {jsx} = arguments[0];
        return {default: function(props) {
          return jsx(props.components.BriefingTakeaway, {
            task: "Arrange the readings into rows.",
            children: jsx("p", {children: "Shape describes the layout."})
          });
        }};`,
    };
    const visible = new Set(["BriefingTakeaway"]);
    const { rerender } = render(
      <LessonContent lesson={briefingLesson} visibleComponents={visible} />,
    );
    expect(screen.getByText("Shape describes the layout.")).toBeVisible();
    expect(screen.getByText("Arrange the readings into rows.")).toBeVisible();
    rerender(
      <>
        <LessonContent
          lesson={briefingLesson}
          visibleComponents={visible}
          briefingTakeawayPart="idea"
        />
        <LessonContent
          lesson={briefingLesson}
          visibleComponents={visible}
          briefingTakeawayPart="task"
        />
      </>,
    );
    expect(screen.getAllByText("Shape describes the layout.")).toHaveLength(1);
    expect(screen.getAllByText("Arrange the readings into rows.")).toHaveLength(
      1,
    );
    expect(screen.getByRole("heading", { name: "Key idea" })).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Your first task" }),
    ).toBeVisible();
  });
});

describe("LessonContent, story register", () => {
  it("sets data-story-register and row dialogues only when the flag is passed", () => {
    // One Set for both renders: a fresh Set would rebuild the components
    // memo on rerender and hide a missing storyRegister dependency.
    const visible = new Set(["Dialogue", "prose"]);
    const { container, rerender } = render(
      <LessonContent
        lesson={lesson}
        visibleComponents={visible}
        storyRegister
      />,
    );
    expect(
      container.querySelector("[data-story-register='true']"),
    ).toBeInTheDocument();
    expect(screen.getByTestId("dialogue")).toHaveAttribute(
      "data-layout",
      "row",
    );

    rerender(<LessonContent lesson={lesson} visibleComponents={visible} />);
    expect(
      container.querySelector("[data-story-register]"),
    ).not.toBeInTheDocument();
    expect(screen.getByTestId("dialogue")).toHaveAttribute(
      "data-layout",
      "stack",
    );
  });

  it.each([
    {
      name: "Briefing",
      storyRegister: true,
      layout: undefined,
      visible: ["Dialogue", "prose"],
    },
    {
      name: "Concept",
      storyRegister: false,
      layout: "reading" as const,
      visible: ["Dialogue", "prose"],
    },
    {
      name: "Epilogue",
      storyRegister: false,
      layout: undefined,
      visible: ["Epilogue"],
    },
  ])(
    "uses the shared Deep Orbit speech treatment on $name",
    ({ storyRegister, layout, visible }) => {
      render(
        <LessonContent
          lesson={lesson}
          worldId="deep-orbit"
          storyRegister={storyRegister}
          layout={layout}
          visibleComponents={new Set(visible)}
        />,
      );
      expect(screen.getByTestId("dialogue")).toHaveAttribute(
        "data-layout",
        "speech",
      );
    },
  );
});

describe("LessonContent, reading layout", () => {
  it("stamps data-layout on the content root only when the layout is passed", () => {
    // globals.css keys the Concept step's two-track grid on
    // .lesson-step-content[data-layout="reading"]. lesson-steps.test.tsx
    // stubs this component, so the stamp itself is checked here, on the
    // root this component renders (the Dialogue stub carries its own
    // data-layout, so the root is read directly, not by attribute).
    const visible = new Set(["Dialogue", "prose"]);
    const { container, rerender } = render(
      <LessonContent
        lesson={lesson}
        visibleComponents={visible}
        layout="reading"
      />,
    );
    let root = container.firstElementChild;
    expect(root).toHaveClass("lesson-step-content");
    expect(root).toHaveAttribute("data-layout", "reading");

    rerender(<LessonContent lesson={lesson} visibleComponents={visible} />);
    root = container.firstElementChild;
    expect(root).toHaveClass("lesson-step-content");
    expect(root).not.toHaveAttribute("data-layout");
  });
});

// Body with a glossary span (as emitted by rehype-glossary) inside prose.
const GLOSSARY_BODY = `const {Fragment, jsx, jsxs} = arguments[0];
function _createMdxContent(props) {
  const _components = props.components || {};
  const _span = _components.span || "span";
  return jsxs(Fragment, {children: [
    jsxs("p", {children: ["A ", jsx(_span, {"data-glossary-term": "tensor", children: "tensor"}), " is an array."]}),
    jsx("p", {children: jsx(_span, {className: "plain", children: "not a term"})})
  ]});
}
return {default: function(props) { return _createMdxContent(props); }};`;

describe("LessonContent, glossary span upgrade", () => {
  it("upgrades data-glossary-term spans into a GlossaryTerm, leaves plain spans alone", () => {
    render(
      <LessonContent
        lesson={{ body: GLOSSARY_BODY, concept: { explanation: "x" } }}
        visibleComponents={new Set(["prose"])}
        glossaryTerms={[{ term: "tensor", definition: "A multi-dim array." }]}
      />,
    );
    const chip = screen.getByRole("button", { name: /tensor/i });
    expect(chip).toHaveAttribute("data-glossary-term", "tensor");
    // The plain span passes through (still rendered, but not a button).
    expect(screen.getByText("not a term").tagName).toBe("SPAN");
  });
});

describe("LessonContent, Epilogue step routing", () => {
  it("keeps a post-recap archive separate from both the opening and closing scenes", () => {
    const { container } = render(
      <LessonContent
        lesson={lesson}
        visibleComponents={new Set(["postrecap"])}
        showPostRecap
      />,
    );
    expect(container.querySelector(".lesson-step-content")).toHaveAttribute(
      "data-show-prose",
      "false",
    );
    expect(container.querySelector(".lesson-step-content")).toHaveAttribute(
      "data-show-postrecap",
      "true",
    );
    expect(screen.queryByText(/Opening line\./)).not.toBeInTheDocument();
    expect(screen.queryByText(/Closing line\./)).not.toBeInTheDocument();
    expect(screen.queryByTestId("epilogue")).not.toBeInTheDocument();
  });

  it("Briefing step (Dialogue+prose) shows opening dialogue but NOT epilogue content", () => {
    render(
      <LessonContent
        lesson={lesson}
        visibleComponents={new Set(["Dialogue", "prose"])}
      />,
    );
    expect(screen.getByText(/Opening line\./)).toBeInTheDocument();
    expect(screen.queryByText(/Closing line\./)).toBeNull();
    expect(screen.queryByText(/scene after the work/)).toBeNull();
  });

  it("Consequence step (Epilogue) shows epilogue scene incl. nested dialogue, NOT opening dialogue", () => {
    render(
      <LessonContent
        lesson={lesson}
        visibleComponents={new Set(["Epilogue"])}
      />,
    );
    expect(screen.getByText(/Closing line\./)).toBeInTheDocument();
    expect(screen.getByText(/scene after the work/)).toBeInTheDocument();
    expect(screen.queryByText(/Opening line\./)).toBeNull();
  });
});

// Compiled MDX body that uses LessonRecap.
const LESSON_RECAP_BODY = `const {Fragment, jsx, jsxs} = arguments[0];
function _createMdxContent(props) {
  const _components = props.components || {};
  const LessonRecap = _components.LessonRecap;
  return jsx(LessonRecap, {
    whatYouLearned: ["Tensors are n-dimensional arrays."],
    bridge: "Arrays in JS become tensors in TF.js.",
    youCanNow: "Create and inspect tensors."
  });
}
return {default: function(props) { return _createMdxContent(props); }};`;

describe("LessonContent, LessonRecap visibility", () => {
  it("renders LessonRecap when visibleComponents includes LessonRecap", () => {
    render(
      <LessonContent
        lesson={{ body: LESSON_RECAP_BODY, concept: { explanation: "x" } }}
        visibleComponents={new Set(["LessonRecap"])}
      />,
    );
    expect(screen.getByText(/Lesson recap/i)).toBeInTheDocument();
  });

  it("does not render LessonRecap when visibleComponents excludes it", () => {
    render(
      <LessonContent
        lesson={{ body: LESSON_RECAP_BODY, concept: { explanation: "x" } }}
        visibleComponents={new Set(["Dialogue", "prose"])}
      />,
    );
    expect(screen.queryByText(/Lesson recap/i)).toBeNull();
  });
});

// Regression: a Velite-compiled body destructures every referenced component
// from props.components and throws via _missingMdxReference if one is absent.
// DerivationDrawer was once dropped from the live map, which crashed all 8
// lessons that use it. Guard the full production component roster.
const ALL_COMPONENTS = [
  "Dialogue",
  "Epilogue",
  "CodeBlock",
  "BridgeCallout",
  "LearningObjectives",
  "LessonRecap",
  "RecallPrompt",
  "Exercise",
  "HintPanel",
  "DerivationDrawer",
  "MathBlock",
  "InteractiveDemo",
  "DeepScanDemo",
  "BossBeat",
  "StoryConsequence",
  "DispatchTease",
  "StrategyThread",
  "Concept",
  "NextLesson",
  "KeyTakeaways",
  "Quiz",
];

const ROSTER_BODY = `const {Fragment, jsx, jsxs} = arguments[0];
function _missing(name) { throw new Error("Expected component " + name + " to be defined"); }
function _createMdxContent(props) {
  const _components = props.components || {};
${ALL_COMPONENTS.map(
  (n) => `  const ${n} = _components.${n} || _missing("${n}");`,
).join("\n")}
  return jsxs(Fragment, {children: [
    jsx(DerivationDrawer, {summary: "Chain rule by hand"}),
    jsx("p", {children: "prose"})
  ]});
}
return {default: function(props) { return _createMdxContent(props); }};`;

describe("LessonContent, MDX component roster coverage", () => {
  it("provides every production component the compiled MDX may reference (no _missingMdxReference throw)", () => {
    expect(() =>
      render(
        <LessonContent
          lesson={{ body: ROSTER_BODY, concept: { explanation: "x" } }}
          visibleComponents={new Set(["prose"])}
        />,
      ),
    ).not.toThrow();
  });

  it("renders DerivationDrawer when its step set includes it, hides it otherwise", () => {
    const { unmount } = render(
      <LessonContent
        lesson={{ body: ROSTER_BODY, concept: { explanation: "x" } }}
        visibleComponents={new Set(["DerivationDrawer", "prose"])}
      />,
    );
    expect(screen.getByTestId("derivation-drawer")).toHaveTextContent(
      "Chain rule by hand",
    );
    unmount();
    render(
      <LessonContent
        lesson={{ body: ROSTER_BODY, concept: { explanation: "x" } }}
        visibleComponents={new Set(["prose"])}
      />,
    );
    expect(screen.queryByTestId("derivation-drawer")).toBeNull();
  });
});

describe("LessonContent, prose partition attributes (2026-09-04 audit step 2)", () => {
  it("stamps data-hide-teaching for the Briefing's story-zone-only render", () => {
    const { container } = render(
      <LessonContent
        lesson={lesson}
        visibleComponents={new Set(["Dialogue", "prose"])}
        storyRegister
        hideTeaching
      />,
    );
    expect(
      container.querySelector("[data-hide-teaching='true']"),
    ).toBeInTheDocument();
  });

  it("stamps data-show-challenge when the challenge zone renders without prose", () => {
    const { container } = render(
      <LessonContent
        lesson={lesson}
        visibleComponents={new Set(["challenge", "HintPanel"])}
      />,
    );
    const root = container.querySelector(".lesson-step-content");
    expect(root).toHaveAttribute("data-show-prose", "false");
    expect(root).toHaveAttribute("data-show-challenge", "true");
  });

  it.each([
    { worldId: "deep-orbit", compact: true },
    { worldId: "neon-protocol", compact: false },
  ])(
    "keeps $worldId hints last with its own presentation",
    ({ worldId, compact }) => {
      // globals.css ends the Challenge instructions column with
      // `[data-show-challenge="true"] > :last-child { margin-bottom: 0; }`,
      // which reaches the panel only while it renders inside the root with
      // nothing after it.
      const { container } = render(
        <LessonContent
          lesson={{
            ...lesson,
            hints: [{ level: "nudge", content: "Start from the shape." }],
          }}
          worldId={worldId}
          visibleComponents={new Set(["challenge", "HintPanel"])}
        />,
      );
      const root = container.querySelector(".lesson-step-content")!;
      expect(root).toHaveAttribute("data-show-challenge", "true");
      expect(root.lastElementChild).toBe(screen.getByTestId("hint-panel"));
      if (compact) {
        expect(root.lastElementChild).toHaveAttribute("data-compact", "true");
      } else {
        expect(root.lastElementChild).not.toHaveAttribute("data-compact");
      }
    },
  );

  it("keeps full lesson hints unchanged outside a step partition", () => {
    render(
      <LessonContent
        lesson={{
          ...lesson,
          hints: [{ level: "nudge", content: "Start from the shape." }],
        }}
        worldId="deep-orbit"
      />,
    );
    expect(screen.getByTestId("hint-panel")).not.toHaveAttribute(
      "data-compact",
    );
  });

  it("never stamps data-show-challenge while prose is visible", () => {
    const { container } = render(
      <LessonContent
        lesson={lesson}
        visibleComponents={new Set(["challenge", "prose"])}
      />,
    );
    expect(
      container.querySelector("[data-show-challenge]"),
    ).not.toBeInTheDocument();
  });
});

describe("LessonContent, re-audit fixes (2026-09-04)", () => {
  it("stamps data-hide-story-zone for the Concept step's scene-free read", () => {
    const { container } = render(
      <LessonContent
        lesson={lesson}
        visibleComponents={new Set(["Dialogue", "CodeBlock", "prose"])}
        hideStoryZone
      />,
    );
    expect(
      container.querySelector("[data-hide-story-zone='true']"),
    ).toBeInTheDocument();
  });

  it("stamps data-show-postrecap for the Consequence step", () => {
    const { container } = render(
      <LessonContent
        lesson={lesson}
        visibleComponents={new Set(["Epilogue", "DispatchTease"])}
        showPostRecap
      />,
    );
    expect(
      container.querySelector("[data-show-postrecap='true']"),
    ).toBeInTheDocument();
  });
});

describe("LessonContent, independent assignment placement", () => {
  const body = `const {jsx} = arguments[0]; return {default: (props) => jsx(props.components.TransferAssignment, {})};`;
  it("renders the journal only in its selected partition", () => {
    const { rerender } = render(
      <LessonContent
        lesson={{ body, concept: { explanation: "x" } }}
        visibleComponents={new Set(["TransferAssignment"])}
      />,
    );
    expect(screen.getByText("Independent assignment")).toBeInTheDocument();
    for (const part of ["prose", "Exercise", "LessonRecap", "Epilogue"]) {
      rerender(
        <LessonContent
          lesson={{ body, concept: { explanation: "x" } }}
          visibleComponents={new Set([part])}
        />,
      );
      expect(
        screen.queryByText("Independent assignment"),
      ).not.toBeInTheDocument();
    }
  });
});

for (const [component, label] of [
  ["DecisionTask", "Decision task"],
  ["IndependentProject", "Independent project"],
]) {
  it(`${component} stays in the challenge partition`, () => {
    const body = `const {jsx} = arguments[0]; return {default: (props) => jsx(props.components.${component}, {})};`;
    const { rerender } = render(
      <LessonContent
        lesson={{ body, concept: { explanation: "x" } }}
        visibleComponents={new Set([component])}
      />,
    );
    expect(screen.getByText(label)).toBeInTheDocument();
    rerender(
      <LessonContent
        lesson={{ body, concept: { explanation: "x" } }}
        visibleComponents={new Set(["Epilogue"])}
      />,
    );
    expect(screen.queryByText(label)).not.toBeInTheDocument();
  });
}

describe("LessonContent, recall cards pending (spec 2026-09-24, section 2)", () => {
  it("reports the unsettled card count after mount and after each first answer", () => {
    const report = vi.fn();
    const { unmount } = render(
      <LessonContent
        lesson={{ body: RECALL_BODY, concept: { explanation: "x" } }}
        visibleComponents={new Set(["RecallPrompt"])}
        onRecallPending={report}
      />,
    );
    expect(report).toHaveBeenLastCalledWith(2);
    fireEvent.click(screen.getByRole("button", { name: "Attempt one" }));
    expect(report).toHaveBeenLastCalledWith(2);
    fireEvent.click(screen.getByRole("button", { name: "Answer one" }));
    expect(report).toHaveBeenLastCalledWith(1);
    // A second answer from the same card (the rating) changes nothing.
    fireEvent.click(screen.getByRole("button", { name: "Answer one" }));
    expect(report).toHaveBeenLastCalledWith(1);
    fireEvent.click(screen.getByRole("button", { name: "Answer two" }));
    expect(report).toHaveBeenLastCalledWith(0);
    // The whole instance unmounts on every step change; the cleanup that
    // deletes without reporting must stay that way (spec 2026-09-24, section 2).
    report.mockClear();
    unmount();
    expect(report).not.toHaveBeenCalled();
  });

  it("reports zero once for a body with no card", () => {
    const report = vi.fn();
    render(
      <LessonContent
        lesson={{ body: LESSON_RECAP_BODY, concept: { explanation: "x" } }}
        visibleComponents={new Set(["RecallPrompt"])}
        onRecallPending={report}
      />,
    );
    expect(report).toHaveBeenCalledWith(0);
    expect(report.mock.calls.every(([n]) => n === 0)).toBe(true);
    expect(report).toHaveBeenCalledTimes(1);
  });
});

describe("LessonContent, the exercise brief and the pane (spec 2026-09-24, section 3)", () => {
  const one = [
    {
      slug: "create-a-tensor",
      title: "t",
      instructions: "i",
      starterCode: "",
      solutionCode: "",
      testCode: "",
      estimatedMinutes: 6,
      difficulty: "beginner" as const,
    },
  ];
  const two = [...one, { ...one[0], slug: "second" }];
  const lessonBody = { body: EXERCISE_BODY, concept: { explanation: "x" } };

  it("renders the brief and no pane for a set that names ExerciseBrief", () => {
    render(
      <LessonContent
        lesson={lessonBody}
        exercises={one}
        worldId="deep-orbit"
        lessonId="introduction-to-tensors"
        visibleComponents={new Set(["challenge", "ExerciseBrief"])}
      />,
    );
    expect(screen.getByTestId("exercise-brief")).toHaveTextContent(
      "create-a-tensor",
    );
    expect(screen.getByTestId("exercise-brief")).toHaveAttribute(
      "data-compact-hints",
      "true",
    );
    expect(screen.queryByText("Loading editor…")).toBeNull();
    expect(screen.queryByTestId("exercise-pane")).toBeNull();
  });

  it("wires the brief's own ladder to the page hook and analytics", () => {
    vi.mocked(trackHintRequested).mockClear();
    const spy = vi.fn();
    render(
      <LessonContent
        lesson={lessonBody}
        exercises={one}
        worldId="deep-orbit"
        lessonId="introduction-to-tensors"
        visibleComponents={new Set(["challenge", "ExerciseBrief"])}
        onHintRevealed={spy}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "reveal" }));
    expect(spy).toHaveBeenCalledWith(1);
    expect(trackHintRequested).toHaveBeenCalledWith(1, {
      worldId: "deep-orbit",
      lessonId: "introduction-to-tensors",
    });
  });

  it("renders the pane without its brief for a set that names Exercise", async () => {
    render(
      <LessonContent
        lesson={lessonBody}
        exercises={one}
        worldId="deep-orbit"
        lessonId="introduction-to-tensors"
        visibleComponents={new Set(["Exercise"])}
      />,
    );
    const pane = await screen.findByTestId("exercise-pane");
    expect(pane).toHaveAttribute("data-brief", "external");
    expect(pane).toHaveAttribute("data-editor-heading", "Your JavaScript");
    expect(pane).not.toHaveAttribute("data-titled");
    expect(screen.queryByTestId("exercise-brief")).toBeNull();
  });

  it("names the pane when the lesson has more than one exercise", async () => {
    render(
      <LessonContent
        lesson={lessonBody}
        exercises={two}
        visibleComponents={new Set(["Exercise"])}
      />,
    );
    expect(await screen.findByTestId("exercise-pane")).toHaveAttribute(
      "data-titled",
      "true",
    );
  });

  it("renders the inline pane alone when no set is passed", async () => {
    render(
      <LessonContent
        lesson={lessonBody}
        exercises={one}
        worldId="deep-orbit"
      />,
    );
    const pane = await screen.findByTestId("exercise-pane");
    expect(pane).toHaveAttribute("data-brief", "inline");
    expect(pane).not.toHaveAttribute("data-editor-heading");
    expect(screen.queryByTestId("exercise-brief")).toBeNull();
  });

  it("keeps the default editor heading for other worlds", async () => {
    render(
      <LessonContent
        lesson={lessonBody}
        exercises={one}
        worldId="neon-protocol"
        visibleComponents={new Set(["Exercise"])}
      />,
    );
    expect(await screen.findByTestId("exercise-pane")).not.toHaveAttribute(
      "data-editor-heading",
    );
  });

  const ladder = [
    { level: "nudge" as const, content: "n" },
    { level: "guidance" as const, content: "g" },
  ];

  it("hands the lesson's ladder to the workspace pane and wires it to the page hook", async () => {
    vi.mocked(trackHintRequested).mockClear();
    const spy = vi.fn();
    render(
      <LessonContent
        lesson={{ ...lessonBody, hints: ladder }}
        exercises={one}
        worldId="deep-orbit"
        lessonId="introduction-to-tensors"
        visibleComponents={new Set(["Exercise"])}
        exerciseWorkspace
        onHintRevealed={spy}
      />,
    );
    const pane = await screen.findByTestId("exercise-pane");
    expect(pane).toHaveAttribute("data-workspace", "true");
    expect(pane).toHaveAttribute("data-hints", "nudge,guidance");
    fireEvent.click(screen.getByRole("button", { name: "pane reveal" }));
    expect(spy).toHaveBeenCalledWith(1);
    expect(trackHintRequested).toHaveBeenCalledWith(1, {
      worldId: "deep-orbit",
      lessonId: "introduction-to-tensors",
    });
  });

  it("gives a non-workspace pane no ladder", async () => {
    render(
      <LessonContent
        lesson={{ ...lessonBody, hints: ladder }}
        exercises={one}
        visibleComponents={new Set(["Exercise"])}
      />,
    );
    expect(await screen.findByTestId("exercise-pane")).not.toHaveAttribute(
      "data-hints",
    );
  });

  it("renders no lesson-level hint panel in the workspace", () => {
    render(
      <LessonContent
        lesson={{ ...lesson, hints: ladder }}
        visibleComponents={new Set(["challenge", "HintPanel"])}
        exerciseWorkspace
      />,
    );
    expect(screen.queryByTestId("hint-panel")).toBeNull();
  });
});
