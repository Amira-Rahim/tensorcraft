import { beforeEach, describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { LessonWarmup } from "./lesson-warmup";
import { recordReview } from "@/lib/review-store-api";
vi.mock("@/lib/review-store-api", () => ({
  recordReview: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("@/lib/analytics", () => ({ trackRecallAnswered: vi.fn() }));
const item = {
  worldId: "deep-orbit",
  moduleId: "foundations",
  lessonId: "introduction-to-tensors",
  promptIndex: 0,
  pulls: 0,
  successes: 0,
  nextReviewAt: "2020-01-01T00:00:00Z",
  lastReviewedAt: null,
  question: "What is a tensor?",
  answer: "An array.",
};
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
});
describe("LessonWarmup", () => {
  it("releases playback on an empty queue", async () => {
    const onDone = vi.fn();
    render(
      <LessonWarmup
        userId={null}
        worldId="deep-orbit"
        dueReviews={[]}
        freePrompts={[]}
        onDone={onDone}
      />,
    );
    await waitFor(() => expect(onDone).toHaveBeenCalledOnce());
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
  it("caps at two, records each answer once, and releases after the answer is read", () => {
    const onDone = vi.fn();
    render(
      <LessonWarmup
        userId="alice"
        worldId="deep-orbit"
        dueReviews={[
          item,
          { ...item, promptIndex: 1 },
          { ...item, promptIndex: 2 },
        ]}
        freePrompts={[]}
        onDone={onDone}
      />,
    );
    expect(
      screen.getByRole("region", { name: "Warm-up, item 1 of 2" }),
    ).toBeVisible();
    fireEvent.click(screen.getByText("I couldn't recall it"));
    expect(recordReview).toHaveBeenCalledExactlyOnceWith(
      "alice",
      item,
      "bailed",
    );
    expect(onDone).not.toHaveBeenCalled();
    fireEvent.click(screen.getByText("Continue to lesson"));
    expect(
      screen.getByRole("region", { name: "Warm-up, item 2 of 2" }),
    ).toBeVisible();
    fireEvent.click(screen.getByText("I couldn't recall it"));
    fireEvent.click(screen.getByText("Continue to lesson"));
    expect(recordReview).toHaveBeenCalledTimes(2);
    expect(onDone).toHaveBeenCalledOnce();
    expect(screen.queryByRole("region")).not.toBeInTheDocument();
  });
  it("ignores forged guest keys before applying the limit", async () => {
    localStorage.setItem(
      "tc_guest_reviews_v1",
      JSON.stringify(
        Object.fromEntries(
          ["paid-one", "paid-two", item.lessonId].map((lesson) => [
            `deep-orbit/foundations/${lesson}/0`,
            item,
          ]),
        ),
      ),
    );
    render(
      <LessonWarmup
        userId={null}
        worldId="deep-orbit"
        dueReviews={[]}
        freePrompts={[{ ...item }]}
        onDone={vi.fn()}
      />,
    );
    await screen.findByRole("region", { name: "Warm-up, item 1 of 1" });
    expect(screen.getByText(item.question)).toBeVisible();
  });
});
