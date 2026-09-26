import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LessonContent } from "./lesson-content";

vi.mock("@tensorcraft/ui", () => ({
  Dialogue: ({
    speaker,
    layout,
    children,
  }: {
    speaker: string;
    layout?: "stack" | "row";
    children: React.ReactNode;
  }) => (
    <div data-testid="dialogue" data-layout={layout}>
      {speaker}: {children}
    </div>
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
  HintPanel: () => <div data-testid="hint-panel" />,
  KeyTakeaways: () => null,
  LearningObjectives: () => null,
  LessonRecap: () => <div>Lesson recap</div>,
  Quiz: () => null,
  Exercise: () => null,
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
  RecallPrompt: () => null,
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

const lesson = {
  body: COMPILED_BODY,
  concept: { explanation: "x" },
};

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

  it("renders the hint panel as the content root's last child", () => {
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
        visibleComponents={new Set(["challenge", "HintPanel"])}
      />,
    );
    const root = container.querySelector(".lesson-step-content")!;
    expect(root).toHaveAttribute("data-show-challenge", "true");
    expect(root.lastElementChild).toBe(screen.getByTestId("hint-panel"));
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
