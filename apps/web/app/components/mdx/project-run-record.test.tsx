import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { ProjectRunRecord } from "./project-run-record";
vi.mock("../activity-sync-status", () => ({ ActivitySyncStatus: () => null }));
beforeEach(() => sessionStorage.clear());
it("requires an explicit local-run report, accepts a baseline win, and preserves help and first report", () => {
  const view = render(<ProjectRunRecord />);
  expect(
    screen.getByRole("button", { name: "Record external run" }),
  ).toBeDisabled();
  fireEvent.change(screen.getByLabelText("Baseline result"), {
    target: { value: "0.95" },
  });
  fireEvent.change(screen.getByLabelText("Model result"), {
    target: { value: "0.7" },
  });
  fireEvent.change(screen.getByLabelText("Final-test row count"), {
    target: { value: "200" },
  });
  fireEvent.change(screen.getByLabelText(/Why this split/), {
    target: {
      value:
        "Later dates held out; the scaler used earlier training rows only.",
    },
  });
  fireEvent.change(screen.getByLabelText(/What did you observe/), {
    target: {
      value: "Reload returned the same score; dark occupied rooms were missed.",
    },
  });
  fireEvent.change(screen.getByLabelText(/Help beyond/), {
    target: { value: "used" },
  });
  expect(
    screen.getByRole("button", { name: "Record external run" }),
  ).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: "Record external run" }));
  expect(screen.getByRole("status")).toHaveTextContent(
    "does not award an independent project pass",
  );
  let stored = JSON.parse(
    sessionStorage.getItem("tensorcraft:project-run:room-occupancy:v1")!,
  );
  expect(stored.record).toMatchObject({
    count: 1,
    first: { correct: true, assisted: true },
  });
  view.unmount();
  render(<ProjectRunRecord />);
  expect(screen.getByLabelText("Model result")).toHaveValue("0.7");
  fireEvent.change(screen.getByLabelText(/Help beyond/), {
    target: { value: "none" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Record external run" }));
  stored = JSON.parse(
    sessionStorage.getItem("tensorcraft:project-run:room-occupancy:v1")!,
  );
  expect(stored.record).toMatchObject({
    count: 2,
    first: { correct: true, assisted: true },
    latest: { correct: true, assisted: true },
  });
});
