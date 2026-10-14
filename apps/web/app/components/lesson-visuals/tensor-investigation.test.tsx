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
import { FIRST_PACKET } from "./instrument-math";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

function renderExample() {
  return render(
    <TensorInvestigation
      spec={DEEP_ORBIT_VISUALS["introduction-to-tensors"]!}
    />,
  );
}

describe("the opening tensor investigation practice", () => {
  it("runs the three-reading practice packet through TensorFlow.js and checks the actual shape prediction", async () => {
    const run = vi
      .spyOn(tensorExample, "runTensorExample")
      .mockImplementation(async (values) => ({
        shape: [values.length],
        values: Array.from(new Float32Array(values)),
      }));
    renderExample();
    fireEvent.change(screen.getByLabelText("Choose a packet"), {
      target: { value: "practice" },
    });
    expect(
      screen.getByRole("list", {
        name: "Three practice readings in a JavaScript array",
      }),
    ).toHaveTextContent(FIRST_PACKET.slice(0, 3).join(""));
    fireEvent.change(
      screen.getByLabelText("How many values will the tensor contain?"),
      { target: { value: "3" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Create tensor" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "Your prediction matches. The tensor has 3 values",
      ),
    );
    expect(run).toHaveBeenCalledWith(FIRST_PACKET.slice(0, 3));
    expect(screen.getByRole("status")).toHaveTextContent(
      "All 3 readings match",
    );
    expect(screen.getByText("shape [3]")).toBeInTheDocument();
    expect(screen.getByRole("status")).not.toHaveTextContent(
      "Demir records the successful check",
    );
  });

  it("preserves a previous packet snapshot while a changed reading creates a new tensor", async () => {
    vi.spyOn(tensorExample, "runTensorExample").mockImplementation(
      async (values) => ({ shape: [values.length], values: [...values] }),
    );
    renderExample();
    fireEvent.click(screen.getByRole("button", { name: "Create tensor" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "All 5 readings match",
      ),
    );
    fireEvent.change(screen.getByLabelText("Choose a packet"), {
      target: { value: "practice" },
    });
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    fireEvent.change(screen.getByLabelText("First reading"), {
      target: { value: "0.75" },
    });
    fireEvent.change(
      screen.getByLabelText("How many values will the tensor contain?"),
      { target: { value: "5" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Create tensor" }));
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "You predicted 5 values. The tensor returned 3 values",
      ),
    );
    expect(
      screen.getByRole("list", { name: "Readings returned from the tensor" }),
    ).toHaveTextContent([0.75, ...FIRST_PACKET.slice(1, 3)].join(""));
    const comparison = screen
      .getByText("Compare with the previous packet")
      .closest("details")!;
    fireEvent.click(screen.getByText("Compare with the previous packet"));
    expect(comparison).toHaveTextContent(
      `Previous: Mission packetInput: [${FIRST_PACKET.join(", ")}]`,
    );
    expect(comparison).toHaveTextContent("Shape: [5]");
    expect(comparison).toHaveTextContent("Shape: [3]");
    fireEvent.click(screen.getByRole("button", { name: "Reset example" }));
    expect(screen.getByLabelText("Choose a packet")).toHaveValue("mission");
    expect(screen.getByLabelText("First reading")).toHaveValue(
      String(FIRST_PACKET[0]),
    );
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(
      screen.queryByText("Compare with the previous packet"),
    ).not.toBeInTheDocument();
  });

  it("locks controls while running and refuses prediction success for a corrupted readback", async () => {
    let finish!: (
      value: Awaited<ReturnType<typeof tensorExample.runTensorExample>>,
    ) => void;
    const run = vi.spyOn(tensorExample, "runTensorExample").mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = resolve;
        }),
    );
    renderExample();
    fireEvent.change(screen.getByLabelText("Choose a packet"), {
      target: { value: "practice" },
    });
    fireEvent.change(
      screen.getByLabelText("How many values will the tensor contain?"),
      { target: { value: "3" } },
    );
    fireEvent.click(screen.getByRole("button", { name: "Create tensor" }));
    expect(screen.getByLabelText("Choose a packet")).toBeDisabled();
    expect(screen.getByLabelText("First reading")).toBeDisabled();
    expect(
      screen.getByLabelText("How many values will the tensor contain?"),
    ).toBeDisabled();
    finish({ shape: [3], values: [...FIRST_PACKET.slice(0, 3)].reverse() });
    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "The readback did not match the input",
      ),
    );
    expect(screen.getByRole("status")).not.toHaveTextContent(
      "Your prediction matches",
    );
    expect(run).toHaveBeenCalledTimes(1);
    expect(run).toHaveBeenCalledWith(FIRST_PACKET.slice(0, 3));
    expect(screen.getByLabelText("Choose a packet")).not.toBeDisabled();
  });
});
