import { afterEach, describe, expect, it, vi } from "vitest";
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { TensorInvestigation } from "./tensor-investigation";
import * as tensorExample from "./tensor-example";
import { DEEP_ORBIT_VISUALS } from "./deep-orbit-visuals";
import { WORKED_PACKET } from "../mdx/channel-layout-data";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
const renderExample = () =>
  render(
    <TensorInvestigation
      spec={DEEP_ORBIT_VISUALS["introduction-to-tensors"]!}
    />,
  );

describe("the opening signal chart", () => {
  it("uses the same twelve readings as the mission without a time-window choice", async () => {
    const run = vi
      .spyOn(tensorExample, "runTensorExample")
      .mockImplementation(async (values) => ({
        shape: [values.length],
        values: [...values],
        chartRows: [0, 1, 2, 3].map((sensor) =>
          values.filter((_, i) => i % 4 === sensor),
        ),
      }));
    const { container } = renderExample();
    const example = container.querySelector("[data-code-block] code");
    expect(example).toHaveTextContent(
      "const reading = tf.tensor(streamValues);",
    );
    expect(example).toHaveTextContent("const shape = reading.shape;");
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Run example" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "From your latest run",
      ),
    );
    expect(
      screen.getByRole("region", { name: "Chart from this example" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("region", { name: "Output from your code" }),
    ).not.toBeInTheDocument();
    expect(run).toHaveBeenCalledWith(WORKED_PACKET.flat());
    expect(screen.getByText("[12]")).toBeInTheDocument();
    expect(screen.queryByText(/practice packet/i)).not.toBeInTheDocument();
  });
  it("prevents duplicate runs and refuses a corrupted chart", async () => {
    let finish!: (
      value: Awaited<ReturnType<typeof tensorExample.runTensorExample>>,
    ) => void;
    const runSpy = vi
      .spyOn(tensorExample, "runTensorExample")
      .mockImplementation(
        () =>
          new Promise((resolve) => {
            finish = resolve;
          }),
      );
    renderExample();
    fireEvent.click(screen.getByRole("button", { name: "Run example" }));
    // aria-disabled, not disabled: a disabled button drops keyboard focus to
    // the page body mid-run (e2e/lesson-continuity.spec.ts checks focus).
    const busy = screen.getByRole("button", { name: "Running example…" });
    expect(busy).toHaveAttribute("aria-disabled", "true");
    expect(busy).not.toBeDisabled();
    fireEvent.click(busy);
    expect(runSpy).toHaveBeenCalledTimes(1);
    finish({
      shape: [12],
      values: WORKED_PACKET.flat(),
      chartRows: [
        [2, 20, 5],
        [8, 3, 18],
        [7, 8, 4],
        [16, 6, 9],
      ],
    });
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "couldn’t draw the chart",
      ),
    );
    expect(
      screen.queryByRole("region", { name: "Chart from this example" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Run example" }),
    ).not.toHaveAttribute("aria-disabled");
  });
  it("removes the earlier chart when a rerun of the same readings fails", async () => {
    let fail!: (reason: Error) => void;
    const run = vi
      .spyOn(tensorExample, "runTensorExample")
      .mockResolvedValueOnce({
        shape: [12],
        values: WORKED_PACKET.flat(),
        chartRows: [0, 1, 2, 3].map((sensor) =>
          WORKED_PACKET.map((row) => row[sensor]!),
        ),
      })
      .mockImplementationOnce(
        () =>
          new Promise((_, reject) => {
            fail = reject;
          }),
      );
    renderExample();
    fireEvent.click(screen.getByRole("button", { name: "Run example" }));
    await screen.findByRole("region", {
      name: "Chart from this example",
    });

    fireEvent.click(screen.getByRole("button", { name: "Run example" }));
    expect(run).toHaveBeenNthCalledWith(2, WORKED_PACKET.flat());
    expect(
      screen.queryByRole("region", { name: "Chart from this example" }),
    ).not.toBeInTheDocument();
    fail(new Error("backend unavailable"));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "couldn’t draw the chart",
      ),
    );
    expect(
      screen.queryByRole("region", { name: "Chart from this example" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("From your latest run")).not.toBeInTheDocument();
  });
});
