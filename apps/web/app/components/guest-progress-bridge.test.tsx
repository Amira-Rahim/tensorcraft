import { StrictMode } from "react";
import { render, waitFor } from "@testing-library/react";
import { beforeEach, it, expect, vi } from "vitest";
import { GuestProgressBridge } from "./guest-progress-bridge";
const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  merge: vi.fn(),
  flush: vi.fn(),
  reviews: vi.fn(),
  completions: vi.fn(),
  clear: vi.fn(),
  complete: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { getUser: async () => ({ data: { user: { id: "alice" } } }) },
  }),
}));
vi.mock("@/lib/review-store-api", () => ({
  flushReviewOutbox: mocks.flush,
  mergeGuestReviews: mocks.merge,
}));
vi.mock("@/lib/review-store-guest", () => ({ getGuestReviews: mocks.reviews }));
vi.mock("@/lib/guest-progress", () => ({
  getGuestCompletions: mocks.completions,
  clearGuestCompletions: mocks.clear,
}));
vi.mock("@/lib/progress-client", () => ({
  markLessonCompleted: mocks.complete,
}));
beforeEach(() => {
  vi.clearAllMocks();
  mocks.reviews.mockReturnValue([{}]);
  mocks.completions.mockReturnValue([]);
  mocks.flush.mockResolvedValue(undefined);
  mocks.merge.mockResolvedValue(true);
  mocks.complete.mockResolvedValue({});
});
it("merges reviews without guest completions, including under StrictMode", async () => {
  render(
    <StrictMode>
      <GuestProgressBridge />
    </StrictMode>,
  );
  await waitFor(() =>
    expect(mocks.merge).toHaveBeenCalledExactlyOnceWith("alice"),
  );
  expect(mocks.refresh).toHaveBeenCalledOnce();
});
it("reads the guest queue after retrying pending writes", async () => {
  mocks.reviews.mockReturnValue([]);
  mocks.flush.mockImplementation(async () => {
    mocks.reviews.mockReturnValue([{}]);
  });
  render(<GuestProgressBridge />);
  await waitFor(() => expect(mocks.merge).toHaveBeenCalledWith("alice"));
});
it("preserves guest completions if a replay fails", async () => {
  mocks.completions.mockReturnValue([
    {
      worldId: "deep-orbit",
      moduleId: "foundations",
      lessonId: "first",
      completedAt: "2026-01-01",
    },
  ]);
  mocks.complete.mockRejectedValue(new Error("offline"));
  render(<GuestProgressBridge />);
  await waitFor(() => expect(mocks.complete).toHaveBeenCalledOnce());
  expect(mocks.clear).not.toHaveBeenCalled();
});
