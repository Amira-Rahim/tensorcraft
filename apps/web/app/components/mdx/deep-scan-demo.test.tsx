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
});
