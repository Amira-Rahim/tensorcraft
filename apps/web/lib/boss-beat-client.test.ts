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
  it("writes the explicit content version without a legacy fallback", async () => {
    rpc.mockResolvedValue({ data: true, error: null });
    await recordBossBeatChoice({ ...args, contentVersion: 2 });
    expect(rpc).toHaveBeenCalledWith(
      "record_boss_beat_choice_versioned",
      expect.objectContaining({ p_content_version: 2 }),
    );
    rpc
      .mockClear()
      .mockResolvedValue({ data: null, error: { code: "PGRST202" } });
    await expect(
      recordBossBeatChoice({ ...args, contentVersion: 2 }),
    ).rejects.toThrow("save");
    expect(rpc).toHaveBeenCalledTimes(1);
  });
  it("preserves returned versions and treats only the old read RPC as version 1", async () => {
    const row = {
      beat_id: "test",
      choice_index: 0,
      choice_label: "cooperate",
      reaction_ms: 1,
      chosen_at: "2026-09-19",
    };
    rpc.mockResolvedValueOnce({
      data: [{ ...row, content_version: 2 }],
      error: null,
    });
    expect((await getBossBeatChoice("test"))?.contentVersion).toBe(2);
    rpc
      .mockResolvedValueOnce({ data: null, error: { code: "PGRST202" } })
      .mockResolvedValueOnce({ data: [row], error: null });
    expect((await getBossBeatChoice("test"))?.contentVersion).toBe(1);
    expect(rpc).toHaveBeenLastCalledWith("get_boss_beat_choice", {
      p_beat_id: "test",
    });
    rpc.mockResolvedValueOnce({
      data: [{ ...row, content_version: 99 }],
      error: null,
    });
    await expect(getBossBeatChoice("test")).rejects.toThrow("Invalid");
  });
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
