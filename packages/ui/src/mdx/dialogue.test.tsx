import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Dialogue } from "./dialogue";

describe("Dialogue", () => {
  // The row layout (the Briefing) repeats the speaker, direction and line
  // blocks in its own branch, so the content and style checks run on both.
  describe.each(["stack", "row"] as const)("%s layout", (layout) => {
    it("renders the speaker name", () => {
      render(
        <Dialogue speaker="ARIA" layout={layout}>
          Hello, Commander.
        </Dialogue>,
      );
      expect(screen.getByText("ARIA")).toBeInTheDocument();
    });

    it("renders children content", () => {
      render(
        <Dialogue speaker="Dr. Farah" layout={layout}>
          The signal is fading.
        </Dialogue>,
      );
      expect(screen.getByText("The signal is fading.")).toBeInTheDocument();
    });

    it("displays speaker in uppercase monospace style", () => {
      render(
        <Dialogue speaker="Ensign Demir" layout={layout}>
          Report ready.
        </Dialogue>,
      );
      const speaker = screen.getByText("Ensign Demir");
      expect(speaker).toHaveClass("uppercase", "tracking-[2px]");
    });

    it("renders optional direction as parenthetical", () => {
      render(
        <Dialogue
          speaker="Imran"
          direction="pulling up the chart"
          layout={layout}
        >
          The note said PCN allergy.
        </Dialogue>,
      );
      expect(screen.getByText("(pulling up the chart)")).toBeInTheDocument();
    });

    it("omits parenthetical when no direction prop", () => {
      const { container } = render(
        <Dialogue speaker="ARIA" layout={layout}>
          Scanning.
        </Dialogue>,
      );
      expect(
        container.querySelector("[data-testid='direction']"),
      ).not.toBeInTheDocument();
    });

    it("colors the speaker with the world primary variable", () => {
      render(
        <Dialogue speaker="ARIA" layout={layout}>
          Test
        </Dialogue>,
      );
      expect(screen.getByText("ARIA")).toHaveAttribute(
        "style",
        expect.stringContaining("--tc-primary"),
      );
    });

    it("has no accessibility violations", async () => {
      const { axe } = await import("vitest-axe");
      const { container } = render(
        <Dialogue speaker="ARIA" layout={layout}>
          Scanning for anomalies.
        </Dialogue>,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  it("renders as a div, not a blockquote", () => {
    const { container } = render(<Dialogue speaker="ARIA">Test</Dialogue>);
    expect(container.querySelector("blockquote")).not.toBeInTheDocument();
    expect(container.querySelector("div")).toBeInTheDocument();
  });

  it("marks its root with data-dialogue for positional CSS", () => {
    const { container } = render(<Dialogue speaker="ARIA">Test</Dialogue>);
    expect(
      container.querySelector("[data-dialogue='true']"),
    ).toBeInTheDocument();
  });

  it("omits the scene transition when no destination is provided", () => {
    const { container } = render(<Dialogue speaker="ARIA">Test</Dialogue>);
    expect(container.querySelector(".tc-cut-to")).not.toBeInTheDocument();
  });

  it("lays out as a centered screenplay column", () => {
    const { container } = render(<Dialogue speaker="ARIA">Test</Dialogue>);
    const root = container.querySelector("[data-dialogue='true']");
    expect(root).toHaveClass("mx-auto", "max-w-[440px]");
  });

  it("centers the speaker name above the line", () => {
    render(<Dialogue speaker="ARIA">Test</Dialogue>);
    expect(screen.getByText("ARIA")).toHaveClass("text-center");
  });

  it("centers the parenthetical direction", () => {
    render(
      <Dialogue speaker="Imran" direction="pulling up the chart">
        The note said PCN allergy.
      </Dialogue>,
    );
    expect(screen.getByText("(pulling up the chart)")).toHaveClass(
      "text-center",
    );
  });

  it("uses a custom cutTo label when provided", () => {
    const { container } = render(
      <Dialogue speaker="ARIA" cutTo="Debrief">
        Test
      </Dialogue>,
    );
    expect(container.querySelector(".tc-cut-to")).toHaveTextContent(
      /cut to: debrief/i,
    );
    expect(container.querySelector(".tc-cut-to")).toHaveClass("hidden");
    expect(container.querySelector(".tc-cut-to")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });
});

describe("Dialogue avatar", () => {
  it("renders no avatar by default", () => {
    render(<Dialogue speaker="Chief Nazari">Line.</Dialogue>);
    expect(screen.queryByTestId("character-avatar-placeholder")).toBeNull();
    expect(screen.queryByTestId("character-avatar-img")).toBeNull();
  });
  it("renders an avatar when avatarName is provided", () => {
    render(
      <Dialogue
        speaker="Chief Nazari"
        avatarName="Chief Nazari"
        avatarSrc="/characters/deep-orbit/chief-nazari.webp"
      >
        Line.
      </Dialogue>,
    );
    expect(screen.getByTestId("character-avatar-img")).toBeInTheDocument();
    expect(screen.getByText("Chief Nazari")).toBeInTheDocument();
  });
  it("renders a provided avatarSlot", () => {
    render(
      <Dialogue speaker="ARIA" avatarSlot={<div data-testid="custom-avatar" />}>
        Line.
      </Dialogue>,
    );
    expect(screen.getByTestId("custom-avatar")).toBeInTheDocument();
  });
  it("prefers avatarSlot over the legacy avatarSrc path", () => {
    render(
      <Dialogue
        speaker="Chief Nazari"
        avatarName="Chief Nazari"
        avatarSrc="/characters/deep-orbit/chief-nazari.webp"
        avatarSlot={<div data-testid="custom-avatar" />}
      >
        Line.
      </Dialogue>,
    );
    expect(screen.getByTestId("custom-avatar")).toBeInTheDocument();
    expect(screen.queryByTestId("character-avatar-img")).toBeNull();
    expect(screen.queryByTestId("character-avatar-placeholder")).toBeNull();
  });
  it("falls back to the avatarName path when avatarSlot is falsy", () => {
    render(
      <Dialogue
        speaker="Chief Nazari"
        avatarName="Chief Nazari"
        avatarSrc="/characters/deep-orbit/chief-nazari.webp"
        avatarSlot={false}
      >
        Line.
      </Dialogue>,
    );
    expect(screen.getByTestId("character-avatar-img")).toBeInTheDocument();
  });
});

describe("Dialogue row layout", () => {
  it("keeps the stacked, centred layout by default", () => {
    const { container } = render(
      <Dialogue speaker="ARIA" avatarSlot={<i data-testid="slot" />}>
        Line.
      </Dialogue>,
    );
    const root = container.querySelector("[data-dialogue]");
    expect(root).toBeInTheDocument();
    expect(root).toHaveClass("max-w-[440px]");
    expect(root).toHaveAttribute("data-layout", "stack");
  });

  it("puts the avatar slot beside the line in row layout, root still a block", () => {
    const { container } = render(
      <Dialogue
        speaker="ARIA"
        layout="row"
        avatarSlot={<i data-testid="slot" />}
      >
        Line.
      </Dialogue>,
    );
    const root = container.querySelector("[data-dialogue]");
    expect(root).toBeInTheDocument();
    expect(root).toHaveAttribute("data-layout", "row");
    expect(root).not.toHaveClass("max-w-[440px]");
    // A flex or grid root would pull the cut-to divider beside the line.
    for (const display of ["flex", "inline-flex", "grid", "inline-grid"]) {
      expect(root).not.toHaveClass(display);
    }
    const row = root?.querySelector("[data-dialogue-row]");
    expect(row).toBeInTheDocument();
    expect(row).toHaveClass("grid");
    expect(row).toContainElement(screen.getByTestId("slot"));
    expect(row).toContainElement(screen.getByText("Line."));
  });

  it.each(["stack", "row"] as const)(
    "keeps the cut-to divider as the root's last direct child in %s layout",
    (layout) => {
      const { container } = render(
        <Dialogue speaker="ARIA" layout={layout} cutTo="Debrief">
          Line.
        </Dialogue>,
      );
      const root = container.querySelector("[data-dialogue]");
      expect(root).toBeInTheDocument();
      expect(root?.lastElementChild).toHaveClass("tc-cut-to");
    },
  );
});
