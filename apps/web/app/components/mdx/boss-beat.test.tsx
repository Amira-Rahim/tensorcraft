import { describe, it, expect, vi, beforeEach } from "vitest";
import { act, render, screen, waitFor } from "@testing-library/react";
import { BossBeat } from "./boss-beat";
import { STORY_HISTORY } from "@tensorcraft/shared";

// First unit coverage for BossBeat, added by the 2026-07-13 P3 round-3
// audit after two answer-key leaks shipped in a row: the stance label was
// rendered on the buttons, and the first shuffle fix parked "dominant" at
// one position for every beat. These tests pin both properties.

vi.mock("@/lib/boss-beat-client", () => ({
  BOSS_BEAT_CHANGED: "tensorcraft:story-choice-saved",
  getBossBeatChoice: vi.fn().mockResolvedValue(null),
  recordBossBeatChoice: vi.fn().mockResolvedValue(true),
}));

import {
  getBossBeatChoice,
  recordBossBeatChoice,
} from "@/lib/boss-beat-client";

const OPTIONS = [
  { label: "cooperate", display: "Wait for the rerun", consequence: "C-WAIT" },
  { label: "defect", display: "Push deploy now", consequence: "C-PUSH" },
  { label: "random", display: "Flip a coin", consequence: "C-COIN" },
  { label: "dominant", display: "Run the canary", consequence: "C-CANARY" },
] as const;

function renderBeat(beatId: string) {
  return render(
    <BossBeat
      beatId={beatId}
      worldId="deep-orbit"
      lessonId="launch"
      prompt="Your call, operator?"
      options={[...OPTIONS] as never}
    />,
  );
}

const SHIPPED_BEATS = [
  "deep-orbit-foundations-7741-first-flag",
  "deep-orbit-anomaly-7741-training-set",
  "deep-orbit-llm-cut-call",
  "deep-orbit-launch-deploy-call",
  "deep-orbit-cache-policy",
  "deep-orbit-drift-response",
];

async function optionOrder(beatId: string): Promise<string[]> {
  const { unmount } = renderBeat(beatId);
  await waitFor(() =>
    expect(screen.getByTestId("boss-beat-option-dominant")).toBeTruthy(),
  );
  const buttons = screen
    .getAllByRole("button")
    .filter((b) => b.dataset.testid?.startsWith("boss-beat-option-"));
  const order = buttons.map((b) =>
    b.dataset.testid!.replace("boss-beat-option-", ""),
  );
  unmount();
  return order;
}

beforeEach(() => {
  vi.mocked(getBossBeatChoice).mockResolvedValue(null);
  vi.mocked(recordBossBeatChoice).mockResolvedValue(true);
});

describe("BossBeat answer-key resistance", () => {
  it("lets a reflective choice omit the countdown while keeping all options available", async () => {
    render(
      <BossBeat
        beatId="reflective"
        worldId="deep-orbit"
        lessonId="normalization"
        prompt="Compare the evidence"
        options={[...OPTIONS] as never}
        showTimer={false}
      />,
    );
    await screen.findByText("Compare the evidence");
    expect(screen.queryByRole("progressbar")).toBeNull();
    expect(screen.getByText("Decision · take your time")).toBeInTheDocument();
    expect(screen.getAllByTestId(/^boss-beat-option-/)).toHaveLength(4);
  });
  it.each([0, 1, 2, 3])(
    "keeps the historical meaning of original option %s after a revision",
    async (index) => {
      const beatId = SHIPPED_BEATS[0];
      const original = STORY_HISTORY[beatId]![1]!.options[index]!;
      vi.mocked(getBossBeatChoice).mockResolvedValue({
        beatId,
        choiceIndex: index,
        choiceLabel: original.label,
        contentVersion: 1,
        reactionMs: 5,
        chosenAt: "2026-09-18",
      });
      render(
        <BossBeat
          beatId={beatId}
          worldId="deep-orbit"
          lessonId="normalization"
          prompt="Revised prompt"
          options={[...OPTIONS] as never}
          contentVersion={2}
        />,
      );
      await screen.findByText(original.display);
      expect(screen.getByText(original.consequence)).toBeInTheDocument();
      expect(screen.getByTestId("boss-beat-resolved")).toHaveAttribute(
        "data-content-version",
        "1",
      );
      expect(screen.queryByTestId("boss-beat-active")).toBeNull();
    },
  );
  it("never renders the stance enum text on the buttons", async () => {
    renderBeat(SHIPPED_BEATS[3]);
    await waitFor(() =>
      expect(screen.getByTestId("boss-beat-option-dominant")).toBeTruthy(),
    );
    for (const stance of ["cooperate", "defect", "random", "dominant"]) {
      const btn = screen.getByTestId(`boss-beat-option-${stance}`);
      expect(btn.textContent!.toLowerCase()).not.toContain(stance);
    }
  });

  it("display order is deterministic per beat", async () => {
    const a = await optionOrder(SHIPPED_BEATS[0]);
    const b = await optionOrder(SHIPPED_BEATS[0]);
    expect(a).toEqual(b);
  });

  it("the strong option does NOT sit at one position across the shipped beats", async () => {
    const positions = new Set<number>();
    for (const beatId of SHIPPED_BEATS) {
      const order = await optionOrder(beatId);
      positions.add(order.indexOf("dominant"));
    }
    // One fixed position for all four beats = a movable answer key.
    expect(positions.size).toBeGreaterThan(1);
  });

  it("clicking an option records its stance and shows its consequence", async () => {
    renderBeat(SHIPPED_BEATS[3]);
    await waitFor(() =>
      expect(screen.getByTestId("boss-beat-option-dominant")).toBeTruthy(),
    );
    screen.getByTestId("boss-beat-option-dominant").click();
    await waitFor(() => {
      expect(vi.mocked(recordBossBeatChoice)).toHaveBeenCalledWith(
        expect.objectContaining({ choiceLabel: "dominant" }),
      );
    });
    await waitFor(() => {
      expect(screen.getByText("C-CANARY")).toBeTruthy();
    });
  });
});

/**
 * Failure-path coverage added 2026-07-21.
 *
 * `handleChoice` used to call `setSubmittedIndex(idx)` BEFORE awaiting the
 * write. Combined with the `submittedIndex !== null` guard at the top of the
 * handler, that made a failed save indistinguishable from a successful one:
 * the beat rendered its consequence, retry was permanently blocked, and the
 * choice was never recorded. It looked saved and never was - the worst shape
 * of failure available, because the learner has no reason to suspect it.
 */
describe("BossBeat failure paths", () => {
  beforeEach(() => {
    vi.mocked(getBossBeatChoice).mockReset().mockResolvedValue(null);
    vi.mocked(recordBossBeatChoice).mockReset().mockResolvedValue(true);
  });

  it("stays interactive when recording the choice fails", async () => {
    vi.mocked(recordBossBeatChoice).mockRejectedValue(new Error("network"));
    const { container } = renderBeat("fail-beat-1");

    await waitFor(() =>
      expect(screen.queryByTestId("boss-beat-loading")).toBeNull(),
    );

    const buttons = container.querySelectorAll("button");
    expect(buttons.length).toBeGreaterThan(0);
    (buttons[0] as HTMLButtonElement).click();

    // The write rejected, so the beat must NOT advance to its consequence.
    // Choice buttons remain, meaning the learner can try again.
    await waitFor(() => {
      expect(container.querySelectorAll("button").length).toBe(buttons.length);
    });
  });

  it("does not hang on 'Loading beat…' when the prior-choice lookup fails", async () => {
    // setLoading(false) previously lived only inside .then(), so a rejection
    // left the component permanently in its loading state.
    vi.mocked(getBossBeatChoice).mockRejectedValue(new Error("network"));
    renderBeat("fail-beat-2");

    await waitFor(() =>
      expect(screen.queryByTestId("boss-beat-loading")).toBeNull(),
    );
  });
  it("records nothing when the clock runs out, and stays playable", async () => {
    // The timer used to auto-submit the "random" stance at zero, which
    // credited a slow reader with a choice they never made. Now the beat
    // names the stance the bridge takes on silence and waits.
    vi.mocked(recordBossBeatChoice).mockClear();
    render(
      <BossBeat
        beatId="timeout-beat"
        worldId="deep-orbit"
        lessonId="l"
        prompt="Your call, operator?"
        options={[...OPTIONS] as never}
        timeoutSeconds={1}
      />,
    );
    await screen.findByText("Decision · 1s");
    // The note's node is always mounted (a live region), so wait for its
    // text rather than its presence.
    await waitFor(
      () => {
        expect(screen.getByTestId("boss-beat-silence").textContent).toContain(
          "Clock out.",
        );
      },
      { timeout: 4000 },
    );
    expect(screen.getByTestId("boss-beat-silence")).toHaveAttribute(
      "role",
      "status",
    );
    expect(screen.getByTestId("boss-beat-silence").textContent).toContain(
      "standing proposal",
    );
    expect(screen.getByText("Decision · clock out")).toBeInTheDocument();
    expect(recordBossBeatChoice).not.toHaveBeenCalled();
    // The note names the standing option by its display text, not by its
    // stance enum: "goes with random" read as a coin flip (round 7).
    expect(screen.getByTestId("boss-beat-silence").textContent).toContain(
      "Flip a coin",
    );
    expect(screen.getByTestId("boss-beat-silence").textContent).not.toContain(
      "with random",
    );
    // Still playable: a click after the clock records exactly one choice.
    screen.getByText("Run the canary").click();
    await waitFor(() => {
      expect(recordBossBeatChoice).toHaveBeenCalledTimes(1);
    });
  });
});

describe("BossBeat confirmed persistence", () => {
  it("does not display the requested choice when another tab saved first", async () => {
    vi.mocked(recordBossBeatChoice).mockResolvedValue(false);
    vi.mocked(getBossBeatChoice).mockResolvedValueOnce(null).mockResolvedValue({
      beatId: "race",
      choiceIndex: 0,
      choiceLabel: "cooperate",
      reactionMs: 1,
      chosenAt: "2026-09-18T12:00:00Z",
    });
    renderBeat("race");
    (await screen.findByText("Run the canary")).click();
    await screen.findByText("C-WAIT");
    expect(screen.queryByText("C-CANARY")).toBeNull();
  });
  it("shows an error when an idempotent save cannot be read back", async () => {
    vi.mocked(getBossBeatChoice).mockReset().mockResolvedValue(null);
    vi.mocked(recordBossBeatChoice).mockResolvedValue(false);
    renderBeat("missing");
    (await screen.findByText("Run the canary")).click();
    await screen.findByRole("alert");
    expect(screen.queryByText("C-CANARY")).toBeNull();
    expect(screen.getByText("Run the canary")).toBeEnabled();
  });
  it("lets the reader retry a failed initial lookup before choosing", async () => {
    vi.mocked(getBossBeatChoice)
      .mockReset()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValue(null);
    renderBeat("retry-read");
    (await screen.findByText("Retry loading choice")).click();
    await screen.findByText("Run the canary");
  });
});

describe("BossBeat navigation during a save", () => {
  it("does not show an old lesson's completed write as the new lesson's choice", async () => {
    let finish!: (value: boolean) => void;
    vi.mocked(getBossBeatChoice).mockReset().mockResolvedValue(null);
    vi.mocked(recordBossBeatChoice).mockReturnValueOnce(
      new Promise((resolve) => {
        finish = resolve;
      }),
    );
    const { rerender } = renderBeat("first");
    (await screen.findByText("Run the canary")).click();
    rerender(
      <BossBeat
        beatId="next"
        worldId="deep-orbit"
        lessonId="next"
        prompt="Next call"
        options={[...OPTIONS] as never}
      />,
    );
    await screen.findByText("Next call");
    await act(async () => finish(true));
    expect(screen.queryByTestId("boss-beat-resolved")).toBeNull();
    expect(screen.getByTestId("boss-beat-active")).toHaveAttribute(
      "data-beat-id",
      "next",
    );
    expect(screen.getByText("Run the canary")).toBeEnabled();
  });
});
