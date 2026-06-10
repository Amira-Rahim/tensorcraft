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
  HintPanel: () => null,
  KeyTakeaways: () => null,
  LearningObjectives: () => null,
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

describe("LessonContent — Epilogue step routing", () => {
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
