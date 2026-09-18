import { describe, expect, it, vi, beforeEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { StoryConsequence } from "./story-consequence";
import { BOSS_BEAT_CHANGED, getBossBeatChoice } from "@/lib/boss-beat-client";
vi.mock("@/lib/boss-beat-client", () => ({
  BOSS_BEAT_CHANGED: "tensorcraft:story-choice-saved",
  getBossBeatChoice: vi.fn(),
}));
const outcomes = {
  cooperate: "Investigate",
  defect: "Restore archive",
  random: "Rebuild context",
  dominant: "Replay tag",
};
const saved = {
  beatId: "one",
  choiceIndex: 3,
  choiceLabel: "dominant" as const,
  reactionMs: 1,
  chosenAt: "2026-09-18T12:00:00Z",
};
beforeEach(() =>
  vi.mocked(getBossBeatChoice).mockReset().mockResolvedValue(null),
);
describe("later story scenes", () => {
  it("acknowledges an earlier saved choice after mounting a later lesson", async () => {
    vi.mocked(getBossBeatChoice).mockResolvedValue(saved);
    render(
      <StoryConsequence
        beatId="one"
        outcomes={outcomes}
        fallback="No decision"
      />,
    );
    await screen.findByText("Replay tag");
    expect(screen.queryByText("No decision")).toBeNull();
  });
  it("refreshes a same-page scene only after a confirmed save event", async () => {
    render(
      <StoryConsequence
        beatId="one"
        outcomes={outcomes}
        fallback="No decision"
      />,
    );
    await screen.findByText("No decision");
    vi.mocked(getBossBeatChoice).mockResolvedValue(saved);
    act(() =>
      window.dispatchEvent(
        new CustomEvent(BOSS_BEAT_CHANGED, { detail: "one" }),
      ),
    );
    await screen.findByText("Replay tag");
  });
  it("retries a failed read without inventing a choice", async () => {
    vi.mocked(getBossBeatChoice)
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(saved);
    render(
      <StoryConsequence
        beatId="one"
        outcomes={outcomes}
        fallback="No decision"
      />,
    );
    (await screen.findByText("Retry scene")).click();
    await screen.findByText("Replay tag");
  });
  it("ignores an old lesson read that resolves after navigation", async () => {
    let finish!: (value: typeof saved) => void;
    vi.mocked(getBossBeatChoice)
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finish = resolve;
        }),
      )
      .mockResolvedValue(null);
    const { rerender } = render(
      <StoryConsequence
        beatId="one"
        outcomes={outcomes}
        fallback="No decision"
      />,
    );
    rerender(
      <StoryConsequence
        beatId="two"
        outcomes={outcomes}
        fallback="Skipped second"
      />,
    );
    await screen.findByText("Skipped second");
    await act(async () => finish(saved));
    expect(screen.queryByText("Replay tag")).toBeNull();
  });
});
