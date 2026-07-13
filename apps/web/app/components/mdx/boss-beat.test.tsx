import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { BossBeat } from "./boss-beat";

// First unit coverage for BossBeat, added by the 2026-07-13 P3 round-3
// audit after two answer-key leaks shipped in a row: the stance label was
// rendered on the buttons, and the first shuffle fix parked "dominant" at
// one position for every beat. These tests pin both properties.

vi.mock("@/lib/boss-beat-client", () => ({
  getBossBeatChoice: vi.fn().mockResolvedValue(null),
  recordBossBeatChoice: vi.fn().mockResolvedValue(undefined),
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
      themeId="deep-orbit"
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
  vi.mocked(recordBossBeatChoice).mockResolvedValue(undefined as never);
});

describe("BossBeat answer-key resistance", () => {
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
