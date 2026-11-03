// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  listLearningEvidence,
  resolveEvidenceOwner,
} from "./learning-evidence-store";

afterEach(() => vi.unstubAllGlobals());

function storage() {
  const data = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => data.set(key, value),
  });
  return data;
}

describe("saved run ownership", () => {
  it("reuses a browser guest identity without adopting it on sign-in", () => {
    const data = storage();
    const guest = resolveEvidenceOwner(null);
    expect(guest).toBe("guest:browser");
    expect(resolveEvidenceOwner(null)).toBe(guest);
    expect(resolveEvidenceOwner("learner-a")).toBe("account:learner-a");
    expect(resolveEvidenceOwner("learner-b")).toBe("account:learner-b");
    expect(resolveEvidenceOwner(null)).toBe(guest);
    expect(data.size).toBe(0);
  });

  it("uses the same guest scope regardless of localStorage contents", () => {
    const data = storage();
    data.set("tc-learning-evidence-guest", "invalid");
    expect(resolveEvidenceOwner(null)).toBe("guest:browser");
    expect(data.get("tc-learning-evidence-guest")).toBe("invalid");
  });

  it("resolves owners independently of localStorage access", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("Storage blocked");
      },
    });
    expect(resolveEvidenceOwner(null)).toBe("guest:browser");
    expect(resolveEvidenceOwner("learner-a")).toBe("account:learner-a");
  });

  it("reports unavailable IndexedDB instead of returning an empty saved history", async () => {
    vi.stubGlobal("indexedDB", undefined);
    await expect(listLearningEvidence("account:learner-a")).rejects.toThrow(
      "cannot save run records",
    );
    await expect(listLearningEvidence("invalid-owner")).rejects.toThrow(
      "account identity is invalid",
    );
  });
});
