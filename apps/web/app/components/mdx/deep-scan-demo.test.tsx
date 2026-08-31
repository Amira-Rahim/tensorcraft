import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DeepScanDemo } from "./deep-scan-demo";

// Mock tfjs: model returns a fixed score per input row (last row = 0.513).
const predictMock = vi.fn((input: { arraySync: () => number[][] }) => {
  const rows = input.arraySync();
  const scores = rows.map((r) =>
    r[0] === 0.5 && r[1] === 0.5 && r[2] === 0.5 ? 0.513 : 0.1,
  );
  return {
    data: async () => Float32Array.from(scores),
    dispose: () => {},
  };
});

vi.mock("@tensorflow/tfjs-core", () => ({
  setBackend: vi.fn(async () => true),
  ready: vi.fn(async () => undefined),
  tensor2d: (rows: number[][]) => ({
    arraySync: () => rows,
    dispose: () => {},
  }),
}));
vi.mock("@tensorflow/tfjs-backend-cpu", () => ({}));
vi.mock("@tensorflow/tfjs-backend-webgl", () => ({}));
vi.mock("@tensorflow/tfjs-layers", () => ({
  loadLayersModel: vi.fn(async () => ({
    predict: predictMock,
    dispose: () => {},
  })),
}));

describe("DeepScanDemo", () => {
  it("loads the preview model, classifies the stream, and surfaces sample 7741", async () => {
    render(<DeepScanDemo />);
    // Starts in loading state
    expect(screen.getByTestId("deep-scan-demo")).toBeInTheDocument();

    // After the run completes, sample 7741's ambiguous verdict is shown
    await waitFor(
      () => {
        expect(screen.getByTestId("demo-verdict-7741")).toBeInTheDocument();
      },
      { timeout: 8000 },
    );
    expect(screen.getByTestId("demo-verdict-7741").textContent).toMatch(/51/);
  }, 10000);

  // The framing caption renders on the landing page, before lesson 1, so it
  // carries no story vocabulary (owner bar 2026-08-16; pre-lesson copy audit
  // 2026-08-19 cut "scoring archived sensor readings from the story's ship").
  it("frames the demo without story vocabulary", () => {
    const { container } = render(<DeepScanDemo framing />);
    expect(container.textContent).toMatch(/4 KB neural network/i);
    for (const term of ["ship", "Archimedes", "story", "sensor"]) {
      expect(container.textContent).not.toMatch(new RegExp(term, "i"));
    }
  });

  it("omits the framing caption inside lessons, where the story is set", () => {
    const { container } = render(<DeepScanDemo />);
    expect(container.textContent).not.toMatch(/4 KB neural network/i);
  });

  // The landing hero passes headerLabel={null} (owner request 2026-08-31):
  // the panel opens on the framing line instead of terminal chrome. null is
  // the opt-out; undefined still means the lesson default label.
  it("hides the terminal header bar when headerLabel is null", () => {
    render(<DeepScanDemo framing headerLabel={null} />);
    expect(screen.queryByTestId("demo-header")).not.toBeInTheDocument();
  });

  it("keeps the default header bar inside lessons", () => {
    render(<DeepScanDemo />);
    expect(screen.getByTestId("demo-header").textContent).toMatch(
      /deep scan · preview build/i,
    );
  });
});
