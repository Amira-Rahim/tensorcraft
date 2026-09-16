import { beforeEach, expect, it, vi } from "vitest";
import {
  enqueueReviews,
  recordReview,
  flushReviewOutbox,
  mergeGuestReviews,
} from "./review-store-api";
import {
  enqueueGuestReviews,
  getGuestReviews,
  recordGuestReview,
} from "./review-store-guest";
const mocks = vi.hoisted(() => ({
  userId: "alice" as string | null,
  upsert: vi.fn(),
  report: vi.fn(),
}));
vi.mock("./supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getSession: async () => ({
        data: {
          session: mocks.userId
            ? { user: { id: mocks.userId }, access_token: "test-token" }
            : null,
        },
      }),
    },
    from: () => ({ upsert: mocks.upsert }),
  }),
}));
vi.mock("./report-data-error", () => ({ reportDataError: mocks.report }));
const item = {
  worldId: "deep-orbit",
  moduleId: "foundations",
  lessonId: "first",
  promptIndex: 0,
  pulls: 0,
  successes: 0,
  lastReviewedAt: null,
  nextReviewAt: "2026-01-01T00:00:00Z",
};
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  mocks.userId = "alice";
  mocks.upsert.mockResolvedValue({ error: null });
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true }));
});
it("queues failed writes and retries under the same account", async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));
  await enqueueReviews("alice", "deep-orbit", "foundations", "first", [0]);
  expect(JSON.parse(localStorage.getItem("tc_review_outbox_v1")!)).toHaveLength(
    1,
  );
  mocks.userId = "bob";
  await flushReviewOutbox();
  expect(fetch).toHaveBeenCalledTimes(1);
  mocks.userId = "alice";
  await flushReviewOutbox();
  expect(fetch).toHaveBeenCalledTimes(2);
  expect(JSON.parse(localStorage.getItem("tc_review_outbox_v1")!)).toEqual([]);
});
it("records against the version shown to the learner for safe retries", async () => {
  await recordReview("alice", item, "got-it");
  const init = vi.mocked(fetch).mock.calls[0][1]!;
  expect(JSON.parse(init.body as string)).toEqual({
    worldId: "deep-orbit",
    lessonId: "first",
    promptIndex: 0,
    outcome: "got-it",
    expectedLastReviewedAt: null,
  });
});
it("keeps failed retries and reports them", async () => {
  vi.mocked(fetch).mockRejectedValue(new Error("offline"));
  await recordReview("alice", item, "review");
  await flushReviewOutbox();
  expect(JSON.parse(localStorage.getItem("tc_review_outbox_v1")!)).toHaveLength(
    1,
  );
  expect(mocks.report).toHaveBeenCalledWith(
    "review.outbox.retry",
    expect.anything(),
  );
});
it("drops permanently deleted keys instead of retrying forever", async () => {
  vi.mocked(fetch).mockResolvedValue({ ok: false, status: 404 } as Response);
  await recordReview("alice", item, "review");
  expect(localStorage.getItem("tc_review_outbox_v1")).toBeNull();
  expect(mocks.report).toHaveBeenCalledWith(
    "review.write.rejected",
    expect.anything(),
  );
});
it("merges the guest schedule without resetting server rows", async () => {
  enqueueGuestReviews("deep-orbit", "foundations", "first", [0]);
  recordGuestReview("deep-orbit", "foundations", "first", 0, "got-it");
  const original = getGuestReviews()[0];
  expect(await mergeGuestReviews("alice")).toBe(true);
  expect(mocks.upsert).toHaveBeenCalledWith(
    [
      expect.objectContaining({
        user_id: "alice",
        pulls: 1,
        successes: 1,
        next_review_at: original.nextReviewAt,
      }),
    ],
    {
      onConflict: "user_id,world_id,lesson_id,prompt_index",
      ignoreDuplicates: true,
    },
  );
  expect(getGuestReviews()).toEqual([]);
});
it("retains the guest schedule if merge fails", async () => {
  enqueueGuestReviews("deep-orbit", "foundations", "first", [0]);
  mocks.upsert.mockResolvedValue({ error: { message: "offline" } });
  expect(await mergeGuestReviews("alice")).toBe(false);
  expect(getGuestReviews()).toHaveLength(1);
});
it("guest writes use local storage and never call the API", async () => {
  await enqueueReviews(null, "deep-orbit", "foundations", "first", [0]);
  await recordReview(null, getGuestReviews()[0], "bailed");
  expect(getGuestReviews()[0]).toMatchObject({ pulls: 1, successes: 0 });
  expect(fetch).not.toHaveBeenCalled();
});

it("never persists resolved prompt text in the outbox", async () => {
  vi.mocked(fetch).mockRejectedValueOnce(new Error("offline"));
  const resolved = {
    ...item,
    question: "Paid question",
    answer: "Paid answer",
  };
  await recordReview("alice", resolved, "review");
  const pending = JSON.parse(localStorage.getItem("tc_review_outbox_v1")!);
  expect(pending[0].item).toEqual(item);
  expect(localStorage.getItem("tc_review_outbox_v1")).not.toContain("Paid");
});

it("reports a rejected merge promise and keeps the guest queue", async () => {
  enqueueGuestReviews("deep-orbit", "foundations", "first", [0]);
  mocks.upsert.mockRejectedValueOnce(new Error("network disconnected"));
  expect(await mergeGuestReviews("alice")).toBe(false);
  expect(getGuestReviews()).toHaveLength(1);
  expect(mocks.report).toHaveBeenCalledWith(
    "review.guest.merge",
    expect.anything(),
  );
});
