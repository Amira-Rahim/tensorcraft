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

describe("the opening recording viewer", () => {
  it("selects complete moments from the same recording, without inventing readings", async () => {
    const run = vi
      .spyOn(tensorExample, "runTensorExample")
      .mockImplementation(async (values) => ({
        shape: [values.length],
        values: [...values],
        chartRows: [0, 1, 2, 3].map((sensor) =>
          values.filter((_, i) => i % 4 === sensor),
        ),
      }));
    renderExample();
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "2" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Create tensor and open viewer" }),
    );
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "From your latest run",
      ),
    );
    expect(
      screen.getByRole("region", { name: "Output from the supplied viewer" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("region", { name: "Output from your code" }),
    ).not.toBeInTheDocument();
    expect(run).toHaveBeenCalledWith(WORKED_PACKET.slice(0, 2).flat());
    expect(screen.getByText("[8]")).toBeInTheDocument();
    expect(screen.queryByText(/practice packet/i)).not.toBeInTheDocument();
  });
  it("locks the excerpt while running and refuses a corrupted chart", async () => {
    let finish!: (
      value: Awaited<ReturnType<typeof tensorExample.runTensorExample>>,
    ) => void;
    vi.spyOn(tensorExample, "runTensorExample").mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderExample();
    fireEvent.click(
      screen.getByRole("button", { name: "Create tensor and open viewer" }),
    );
    expect(screen.getByRole("combobox")).toBeDisabled();
    expect(
      screen.getByRole("button", { name: "Opening the viewer…" }),
    ).toBeDisabled();
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
      expect(screen.getByRole("alert")).toHaveTextContent("could not read"),
    );
    expect(
      screen.queryByRole("region", { name: "Output from the supplied viewer" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("combobox")).not.toBeDisabled();
  });
  it("removes the earlier chart when a rerun of the same excerpt fails", async () => {
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
    fireEvent.click(
      screen.getByRole("button", { name: "Create tensor and open viewer" }),
    );
    await screen.findByRole("region", {
      name: "Output from the supplied viewer",
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Create tensor and open viewer" }),
    );
    expect(run).toHaveBeenNthCalledWith(2, WORKED_PACKET.flat());
    expect(
      screen.queryByRole("region", { name: "Output from the supplied viewer" }),
    ).not.toBeInTheDocument();
    fail(new Error("backend unavailable"));
    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("could not read"),
    );
    expect(
      screen.queryByRole("region", { name: "Output from the supplied viewer" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("From your latest run")).not.toBeInTheDocument();
  });
});
