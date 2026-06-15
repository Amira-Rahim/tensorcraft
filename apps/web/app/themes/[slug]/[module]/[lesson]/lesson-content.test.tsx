import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { LessonContent } from "./lesson-content";

vi.mock("@tensorcraft/ui", () => ({
  Dialogue: ({
    speaker,
    children,
  }: {
    speaker: string;
    children: React.ReactNode;
  }) => (
    <div data-testid="dialogue">
      {speaker}: {children}
    </div>
  ),
  BridgeCallout: () => <div data-testid="bridge" />,
  CodeBlock: ({ children }: { children: React.ReactNode }) => (
    <pre>{children}</pre>
  ),
  DerivationDrawer: () => null,
  ExerciseDataProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  GlossaryTerm: ({
    term,
    active,
    onActivate,
    children,
  }: {
    term: string;
    active?: boolean;
    onActivate?: (t: string) => void;
    children: React.ReactNode;
  }) => (
    <button
      type="button"
      data-glossary-term={term}
      data-active={active ? "true" : "false"}
      onClick={() => onActivate?.(term)}
    >
      {children}
    </button>
  ),
  HintPanel: () => null,
  KeyTakeaways: () => null,
  LearningObjectives: () => null,
  LessonRecap: () => <div>Lesson recap</div>,
  Quiz: () => null,
  Exercise: () => null,
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
  it("sets data-story-register only when the flag is passed", () => {
    const { container, rerender } = render(
      <LessonContent
        lesson={lesson}
        visibleComponents={new Set(["Dialogue", "prose"])}
        storyRegister
      />,
    );
    expect(
      container.querySelector("[data-story-register='true']"),
    ).toBeInTheDocument();

    rerender(
      <LessonContent
        lesson={lesson}
        visibleComponents={new Set(["Dialogue", "prose"])}
      />,
    );
    expect(
      container.querySelector("[data-story-register]"),
    ).not.toBeInTheDocument();
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
