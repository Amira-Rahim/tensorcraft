import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  within,
} from "@testing-library/react";
import { ProseText } from "@tensorcraft/ui/prose-text";
import { InstructionText } from "../../../../packages/ui/src/mdx/instruction-text";
import { lessonCharacterMatcher } from "@/lib/lesson-characters";
import { LessonCharacters } from "./lesson-characters";
import { LessonConceptWorkbench } from "./lesson-visuals/lesson-workbench";

beforeEach(() => {
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      disconnect() {}
    },
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("lesson character mentions", () => {
  it("matches canonical and short names without swallowing punctuation or matching identifiers", () => {
    const match = lessonCharacterMatcher("deep-orbit");
    const text =
      "Ensign Demir’s readings: Demir, Dr. Farah, Mirza, Chief Nazari and ARIA. DemirValues demir _ARIA ARIA2 VARIANCE éDemir.";
    const parts = match(text);
    expect(parts.map((p) => p.text).join("")).toBe(text);
    expect(
      parts.filter((p) => p.character).map((p) => p.character?.name),
    ).toEqual([
      "Ensign Demir",
      "Ensign Demir",
      "Dr. Farah",
      "Commander Mirza",
      "Chief Nazari",
      "ARIA",
    ]);
    expect(match("Demir")[0].character?.src).toBe(
      "/characters/deep-orbit/ensign-demir.webp",
    );
    expect(lessonCharacterMatcher("unknown")("Demir")).toEqual([
      { text: "Demir" },
    ]);
  });

  it("annotates formatted prose and exercise instructions, leaving code and controls intact", () => {
    const { container } = render(
      <LessonCharacters worldSlug="deep-orbit">
        <p>
          <ProseText>
            Help <strong>Demir</strong> and <em>Farah</em>.<code>ARIA</code>
            <a href="#">Mirza</a>
            <button>Nazari</button>
            <span role="button">ARIA</span>
          </ProseText>
        </p>
        <InstructionText
          text={"Show Demir the `ARIA` result.\n\n  const Demir = 1;"}
        />
      </LessonCharacters>,
    );
    expect(container.querySelectorAll("[data-character-mention]")).toHaveLength(
      3,
    );
    expect(container.querySelector("strong button")).toHaveTextContent("Demir");
    expect(
      container.querySelector(
        "code button, pre button, a button, button button, [role=button] button",
      ),
    ).toBeNull();
  });

  it.each(["training-loop", "evaluating-deep-scan"])(
    "identifies the crew in %s as well as Foundations",
    (slug) => {
      const { container } = render(
        <LessonCharacters worldSlug="deep-orbit">
          <LessonConceptWorkbench
            worldSlug="deep-orbit"
            moduleSlug="training-loop"
            lesson={{
              slug,
              context: {
                narrative: "Demir and Farah review the readings.",
                speaker: "Dr. Farah",
              },
            }}
          />
        </LessonCharacters>,
      );
      const name = container.querySelector<HTMLButtonElement>(
        ".mission-context-narrative [data-character-mention]",
      );
      expect(name).not.toBeNull();
      fireEvent.focus(name!);
      expect(screen.getByRole("tooltip")).toHaveTextContent(name!.textContent!);
      expect(
        within(screen.getByRole("tooltip")).getByRole("img"),
      ).toHaveAttribute(
        "src",
        expect.stringContaining("/characters/deep-orbit/"),
      );
    },
  );

  it("opens on focus, shows the canonical avatar and role, and dismisses with Escape", () => {
    render(
      <LessonCharacters worldSlug="deep-orbit">
        <ProseText>Demir</ProseText>
      </LessonCharacters>,
    );
    const name = screen.getByRole("button", { name: "Demir" });
    fireEvent.focus(name);
    const tooltip = screen.getByRole("tooltip");
    expect(tooltip).toHaveTextContent("JavaScript engineer");
    expect(
      within(tooltip).getByRole("img", { name: "Ensign Demir" }),
    ).toHaveAttribute("src", "/characters/deep-orbit/ensign-demir.webp");
    expect(name).toHaveAttribute("aria-describedby", tooltip.id);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("tooltip")).toBeNull();
    expect(name).toHaveAttribute("aria-expanded", "false");
  });

  it("shows only the latest character even across nested lesson renderers", () => {
    render(
      <LessonCharacters worldSlug="deep-orbit">
        <ProseText>Demir</ProseText>
        <LessonCharacters worldSlug="deep-orbit">
          <ProseText>ARIA</ProseText>
        </LessonCharacters>
      </LessonCharacters>,
    );
    fireEvent.focus(screen.getByRole("button", { name: "Demir" }));
    fireEvent.pointerEnter(screen.getByRole("button", { name: "ARIA" }));
    expect(screen.getAllByRole("tooltip")).toHaveLength(1);
    expect(screen.getByRole("tooltip")).toHaveTextContent("The ship’s AI");
    fireEvent.pointerDown(document.body);
    expect(screen.queryByRole("tooltip")).toBeNull();
  });
});
