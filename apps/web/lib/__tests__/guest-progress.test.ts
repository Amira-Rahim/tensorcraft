// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  recordGuestCompletion,
  getGuestCompletions,
  countGuestCompletedInModule,
  clearGuestCompletions,
} from "../guest-progress";

describe("guest progress evidence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("records and counts completions per module", () => {
    recordGuestCompletion(
      "deep-orbit",
      "foundations",
      "introduction-to-tensors",
    );
    recordGuestCompletion("deep-orbit", "foundations", "tensor-operations");
    recordGuestCompletion("deep-orbit", "neural-networks", "your-first-neuron");

    expect(countGuestCompletedInModule("deep-orbit", "foundations")).toBe(2);
    expect(countGuestCompletedInModule("deep-orbit", "neural-networks")).toBe(
      1,
    );
    expect(getGuestCompletions()).toHaveLength(3);
  });

  it("is idempotent per lesson and keeps the first timestamp", () => {
    recordGuestCompletion("deep-orbit", "foundations", "normalization");
    const first = getGuestCompletions()[0];
    recordGuestCompletion("deep-orbit", "foundations", "normalization");

    const after = getGuestCompletions();
    expect(after).toHaveLength(1);
    expect(after[0].completedAt).toBe(first.completedAt);
  });

  it("clears all evidence after migration", () => {
    recordGuestCompletion("deep-orbit", "foundations", "data-loading");
    clearGuestCompletions();
    expect(getGuestCompletions()).toEqual([]);
  });

  it("survives corrupted storage without throwing", () => {
    localStorage.setItem("tc_guest_completed_v1", "{not json");
    expect(getGuestCompletions()).toEqual([]);
    recordGuestCompletion("deep-orbit", "foundations", "data-loading");
    expect(getGuestCompletions()).toHaveLength(1);
  });
});
