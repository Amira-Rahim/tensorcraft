import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DeepScanDemo } from "./deep-scan-demo";

const { inputDispose, outputDispose } = vi.hoisted(() => ({
  inputDispose: vi.fn(),
  outputDispose: vi.fn(),
}));

// Mock tfjs: model returns a fixed score per input row. Sample 7741's canon
// triple [0.5, 0.59, 0.54] scores 0.514 here: the landing demo rounds to a
// whole percent and the story's line is "fifty-one percent", so the preview
// asset is fine-tuned to land inside 0.505 to 0.515 (2026-09-12); the 673
// parameter module-3 classifier is the one that prints 0.518.
const predictMock = vi.fn((input: { arraySync: () => number[][] }) => {
  const rows = input.arraySync();
  const scores = rows.map((r) =>
    r[0] === 0.5 && r[1] === 0.59 && r[2] === 0.54 ? 0.514 : 0.1,
  );
  return {
    data: async () => Float32Array.from(scores),
    dispose: outputDispose,
  };
});

vi.mock("@tensorflow/tfjs-core", () => ({
  setBackend: vi.fn(async () => true),
  ready: vi.fn(async () => undefined),
  tensor2d: (rows: number[][]) => ({
    arraySync: () => rows,
    dispose: inputDispose,
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

  it("releases both tensors when reading scores fails", async () => {
    inputDispose.mockClear();
    outputDispose.mockClear();
    predictMock.mockReturnValueOnce({
      data: async () => {
        throw new Error("read failed");
      },
      dispose: outputDispose,
    });
    render(<DeepScanDemo />);
    await waitFor(() =>
      expect(screen.getByTestId("deep-scan-demo")).toHaveAttribute(
        "data-status",
        "error",
      ),
    );
    expect(inputDispose).toHaveBeenCalledTimes(1);
    expect(outputDispose).toHaveBeenCalledTimes(1);
  });

  it("rejects invalid model scores and releases the output", async () => {
    inputDispose.mockClear();
    outputDispose.mockClear();
    predictMock.mockReturnValueOnce({
      data: async () => Float32Array.from([NaN, 0, 0, 0, 0, 0]),
      dispose: outputDispose,
    });
    render(<DeepScanDemo />);
    await waitFor(() =>
      expect(screen.getByTestId("deep-scan-demo")).toHaveAttribute(
        "data-status",
        "error",
      ),
    );
    expect(inputDispose).toHaveBeenCalledTimes(1);
    expect(outputDispose).toHaveBeenCalledTimes(1);
  });

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
      /deep scan, preview build/i,
    );
  });
});
