import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { ProjectExport } from "./project-export";
import { apiFetch } from "@/lib/api-fetch";
import { ROOM_PROJECT_FILES, ROOM_MODEL_FILES } from "@tensorcraft/shared";
import { readProjectFolder } from "@/lib/project-export";
vi.mock("@/lib/api-fetch", () => ({ apiFetch: vi.fn() }));
const selected = () =>
  [
    ...ROOM_PROJECT_FILES,
    ...ROOM_MODEL_FILES,
    "runs/test-1.json",
    "runs/validation-1.json",
    ".env",
    "node_modules/tf.js",
  ].map((path) => ({
    webkitRelativePath: `room-occupancy-v1/${path}`,
    size: 3,
    arrayBuffer: async () => new Uint8Array([0, 255, 128]).buffer,
  })) as File[];
beforeEach(() => vi.mocked(apiFetch).mockReset());
afterEach(() => vi.restoreAllMocks());
it("requires a complete folder and excludes unsupported files before reading them", async () => {
  const input = selected();
  input.at(-1)!.arrayBuffer = vi
    .fn()
    .mockRejectedValue(new Error("Must not read dependency"));
  const result = await readProjectFolder(input);
  expect(result.skipped).toBe(2);
  expect(result.files.some((file) => file.path === ".env")).toBe(false);
  expect(
    result.files.find((file) => file.path === "model/weights.bin")!.base64,
  ).toBe("AP+A");
  await expect(
    readProjectFolder(
      input.filter((file) => !file.webkitRelativePath.endsWith("weights.bin")),
    ),
  ).rejects.toThrow("Missing");
});
it("keeps selection local until preview and sends files only after explicit publication", async () => {
  vi.mocked(apiFetch)
    .mockResolvedValueOnce(
      Response.json({
        repositoryId: 17,
        fullName: "learner/tensorcraft-deep-orbit",
        private: false,
        url: "https://github.com/learner/tensorcraft-deep-orbit",
      }),
    )
    .mockResolvedValueOnce(
      Response.json({
        url: "https://github.com/learner/tensorcraft-deep-orbit/tree/commit/projects/snapshot",
      }),
    );
  render(<ProjectExport />);
  fireEvent.change(screen.getByLabelText("Completed project folder"), {
    target: { files: selected() },
  });
  await screen.findByText(/2 other files excluded/);
  expect(apiFetch).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: "Preview GitHub destination" }),
  );
  await screen.findByText(/public. Anyone can read these files/);
  expect(vi.mocked(apiFetch).mock.calls[0][1]!.body).toBeUndefined();
  const publish = screen.getByRole("button", {
    name: "Publish project snapshot",
  });
  expect(publish).toBeDisabled();
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(publish);
  await screen.findByRole("status");
  expect(vi.mocked(apiFetch).mock.calls[1][1]!.method).toBe("POST");
  const body = JSON.parse(String(vi.mocked(apiFetch).mock.calls[1][1]!.body));
  expect(body.repositoryId).toBe(17);
  expect(body.private).toBe(false);
  expect(body.files.some((file: any) => file.path === ".env")).toBe(false);
  expect(screen.getByRole("checkbox")).not.toBeChecked();
  fireEvent.change(screen.getByLabelText("Completed project folder"), {
    target: { files: selected() },
  });
  await waitFor(() =>
    expect(screen.queryByText(/Destination:/)).not.toBeInTheDocument(),
  );
});
it("reports connection failure without uploading or showing a success", async () => {
  vi.mocked(apiFetch).mockResolvedValue(
    Response.json({ error: "Connect GitHub in Settings" }, { status: 400 }),
  );
  render(<ProjectExport />);
  fireEvent.change(screen.getByLabelText("Completed project folder"), {
    target: { files: selected() },
  });
  await screen.findByText(/2 other files excluded/);
  fireEvent.click(
    screen.getByRole("button", { name: "Preview GitHub destination" }),
  );
  await screen.findByRole("alert");
  expect(screen.queryByRole("status")).not.toBeInTheDocument();
  expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
});
