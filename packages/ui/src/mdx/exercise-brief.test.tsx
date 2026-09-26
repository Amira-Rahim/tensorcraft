import { describe, it, expect, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ExerciseBrief } from "./exercise-brief";
import { ExerciseDataProvider } from "./exercise-data";
import type { ExerciseData } from "./exercise";

vi.mock("../use-scheme", () => ({ useScheme: () => "dark" }));
vi.mock("@codesandbox/sandpack-react", () => {
  throw new Error("the brief must not load Sandpack");
});

// Source files are read through a path: under the jsdom environment Vite
// rewrites `new URL("<file>", import.meta.url)` as an asset URL resolved
// against jsdom's http location, which fs rejects.
const here = path.dirname(fileURLToPath(import.meta.url));
const source = (name: string) => fs.readFileSync(path.join(here, name), "utf8");

const exercise: ExerciseData = {
  slug: "create-a-tensor",
  title: "First Contact: Tensor In, Memory Clean",
  instructions:
    "Start with the five readings in `streamValues`.\n1. Create a 1D tensor called `reading` from that array.",
  starterCode: "",
  solutionCode: "",
  testCode: "",
  estimatedMinutes: 6,
  difficulty: "beginner",
  mlContent: "data",
  hints: [{ level: "nudge", content: "Three moves." }],
};

function renderBrief(ex: ExerciseData = exercise) {
  return render(
    <ExerciseDataProvider exercises={new Map([[ex.slug, ex]])}>
      <ExerciseBrief slug={ex.slug} />
    </ExerciseDataProvider>,
  );
}

describe("ExerciseBrief (spec 2026-09-24, section 3)", () => {
  it("renders the chips, the title, the instructions and the exercise's own ladder", () => {
    renderBrief();
    expect(screen.getByRole("heading", { level: 3 })).toHaveTextContent(
      "First Contact: Tensor In, Memory Clean",
    );
    expect(screen.getByText("Beginner")).toBeInTheDocument();
    expect(screen.getByTestId("mlcontent-badge")).toHaveTextContent(
      "Tensor Data",
    );
    expect(screen.getByText("~6 min")).toBeInTheDocument();
    expect(screen.getByText(/five readings/)).toBeInTheDocument();
    expect(screen.getByTestId("exercise-hints")).toBeInTheDocument();
  });

  it("wraps its header row between whole items only", () => {
    const { container } = renderBrief();
    const row = container.querySelector(
      "[data-testid='exercise-brief'] > div",
    )!;
    expect(row).toHaveClass("flex-wrap");
    for (const item of Array.from(row.children)) {
      expect(item).toHaveClass("whitespace-nowrap");
    }
  });

  it("reports the exercise's own ladder through onHintRevealed", () => {
    const spy = vi.fn();
    render(
      <ExerciseDataProvider exercises={new Map([[exercise.slug, exercise]])}>
        <ExerciseBrief slug={exercise.slug} onHintRevealed={spy} />
      </ExerciseDataProvider>,
    );
    fireEvent.click(screen.getByRole("button", { name: /reveal nudge/i }));
    expect(spy).toHaveBeenCalledWith(1);
  });

  it("renders the not-found card for an unknown slug", () => {
    render(
      <ExerciseDataProvider exercises={new Map()}>
        <ExerciseBrief slug="missing" />
      </ExerciseDataProvider>,
    );
    expect(screen.getByText(/not found/)).toBeInTheDocument();
  });

  it("imports no Sandpack, directly or through the exercise module", () => {
    const brief = source("exercise-brief.tsx");
    const data = source("exercise-data.tsx");
    // Import lines only: the data module's comment names Sandpack to say
    // why it must not import it.
    expect(brief + data).not.toMatch(/^import[^\n]*sandpack/im);
    expect(brief).not.toMatch(/from "\.\/exercise"/);
    expect(data).not.toMatch(/^import (?!type ).*from "\.\/exercise"/m);
  });

  it("the pane wraps its header between chips and guards its brief behind the inline mode", () => {
    // The pane itself needs Sandpack to render, so its two contracts are
    // pinned in source: the Playwright layout spec proves the page.
    const src = source("exercise.tsx");
    expect(src).toMatch(/brief === "inline" && \(/);
    expect(src).toMatch(
      /titled \? \(\s*<span[\s\S]*?data-testid="exercise-pane-title"/,
    );
    expect(src).toMatch(/mb-4 flex flex-wrap items-center gap-x-3 gap-y-1/);
  });

  it("wraps a pseudo-code block in the instructions with a hanging indent (spec 2026-09-24, section 4, amended 2026-09-25)", () => {
    const withCode: ExerciseData = {
      ...exercise,
      instructions:
        "Start with the five readings in `streamValues`.\n\n  const total = sum(streamValues) // add them up\n  const mean = total / streamValues.length",
    };
    renderBrief(withCode);
    const pre = screen.getByRole("region", { name: "Exercise code contract" });
    expect(pre).toHaveClass("whitespace-pre-wrap");
    const lines = pre.querySelectorAll("span.-indent-\\[2ch\\]");
    expect(lines).toHaveLength(2);
  });
});
