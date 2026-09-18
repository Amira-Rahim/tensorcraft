import { beforeEach, describe, expect, it, vi } from "vitest";
import { getBossBeatChoice, recordBossBeatChoice } from "./boss-beat-client";

const { getUser, rpc } = vi.hoisted(() => ({ getUser: vi.fn(), rpc: vi.fn() }));
vi.mock("./supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ auth: { getUser }, rpc }),
}));
const args = {
  worldId: "deep-orbit",
  lessonId: "launch",
  beatId: "test",
  choiceIndex: 0,
  choiceLabel: "cooperate" as const,
};
beforeEach(() => {
  vi.resetAllMocks();
  getUser.mockResolvedValue({ data: { user: { id: "fixture" } }, error: null });
});

describe("story choice RPC boundary", () => {
  it("reserves false for an already recorded choice, not an RPC failure", async () => {
    rpc.mockResolvedValueOnce({ data: false, error: null });
    await expect(recordBossBeatChoice(args)).resolves.toBe(false);
    rpc.mockResolvedValueOnce({ data: null, error: { message: "offline" } });
    await expect(recordBossBeatChoice(args)).rejects.toThrow("save");
  });
  it("allows a neutral guest scene but does not hide session verification errors", async () => {
    getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { name: "AuthSessionMissingError" },
    });
    await expect(getBossBeatChoice("test")).resolves.toBeNull();
    getUser.mockResolvedValueOnce({
      data: { user: null },
      error: { name: "AuthRetryableFetchError" },
    });
    await expect(getBossBeatChoice("test")).rejects.toThrow(
      "verify your session",
    );
    expect(rpc).not.toHaveBeenCalled();
  });
  it("rejects a signed-out save", async () => {
    getUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(recordBossBeatChoice(args)).rejects.toThrow("Sign in");
    expect(rpc).not.toHaveBeenCalled();
  });
  it("does not turn failed or malformed reads into an unchosen scene", async () => {
    rpc.mockResolvedValueOnce({ data: null, error: { message: "offline" } });
    await expect(getBossBeatChoice("test")).rejects.toThrow("load");
    rpc.mockResolvedValueOnce({
      data: [{ beat_id: "test", choice_index: 9, choice_label: "dominant" }],
      error: null,
    });
    await expect(getBossBeatChoice("test")).rejects.toThrow("Invalid");
    rpc.mockResolvedValueOnce({ data: [], error: null });
    await expect(getBossBeatChoice("test")).resolves.toBeNull();
  });
});
