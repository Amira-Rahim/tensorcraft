import { beforeEach, expect, it, vi } from "vitest";
import { saveActivity } from "./learning-activity-client";
import { type ActivitySnapshot } from "@tensorcraft/shared";
const rpc = vi.hoisted(() => vi.fn());
vi.mock("./supabase/client", () => ({
  getSupabaseBrowserClient: () => ({ rpc }),
}));
const record: ActivitySnapshot = {
  activityId: "deep-orbit-cache",
  version: 1,
  phase: "changed_case",
  streamId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  count: 1,
  first: { correct: false, assisted: false },
  latest: { correct: false, assisted: false },
  assistance: true,
  completedAt: null,
};
beforeEach(() => {
  rpc.mockReset().mockResolvedValue({ error: null });
});
it("includes the expected owner and bounded summary, without answers or code", async () => {
  await saveActivity("owner", record);
  expect(rpc).toHaveBeenCalledWith("record_learning_activity", {
    p_expected_user_id: "owner",
    p_activity_id: "deep-orbit-cache",
    p_content_version: 1,
    p_phase: "changed_case",
    p_stream_id: record.streamId,
    p_attempt_count: 1,
    p_first_correct: false,
    p_first_assisted: false,
    p_latest_correct: false,
    p_latest_assisted: false,
    p_assistance_observed: true,
    p_completed_at: undefined,
  });
});
it("rejects incompatible records before sending and surfaces RPC errors for retry", async () => {
  await expect(saveActivity("owner", { ...record, count: 21 })).rejects.toThrow(
    "Incompatible",
  );
  expect(rpc).not.toHaveBeenCalled();
  rpc.mockResolvedValue({ error: { message: "account changed" } });
  await expect(saveActivity("owner", record)).rejects.toThrow("local draft");
});
