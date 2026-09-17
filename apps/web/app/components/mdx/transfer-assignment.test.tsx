import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TransferAssignment } from "./transfer-assignment";
import {
  DRAFT_KEY,
  REPORT_FIELDS,
  canSelfReview,
  emptyDraft,
  parseDraft,
} from "./transfer-assignment-state";

beforeEach(() => sessionStorage.clear());
afterEach(() => vi.restoreAllMocks());

describe("independent assignment evidence", () => {
  it("keeps assistance and draft answers across remounts without claiming an assessment pass", () => {
    const first = render(<TransferAssignment />);
    fireEvent.change(screen.getByLabelText("Decision and error costs"), {
      target: { value: "Review likely failures before deploying." },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "I need help with the split" }),
    );
    first.unmount();
    render(<TransferAssignment />);
    expect(screen.getByLabelText("Decision and error costs")).toHaveValue(
      "Review likely failures before deploying.",
    );
    expect(
      screen.getByRole("button", { name: "I need help with the split" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(
      screen.getByRole("button", { name: "Mark self-reviewed" }),
    ).toBeDisabled();
    const draft = parseDraft(sessionStorage.getItem(DRAFT_KEY)!);
    expect(draft.openedRescues).toEqual(["split"]);
    expect(draft.selfReviewedAt).toBeNull();
    expect(
      screen.getByText(/not a graded pass or verified independent assessment/),
    ).toBeInTheDocument();
  });

  it("requires the report and checklist and invalidates self-review after an edit", () => {
    render(<TransferAssignment />);
    for (const field of REPORT_FIELDS)
      fireEvent.change(screen.getByLabelText(field.label), {
        target: { value: `Evidence for ${field.id}` },
      });
    expect(
      screen.getByRole("button", { name: "Mark self-reviewed" }),
    ).toBeDisabled();
    for (const check of screen.getAllByRole("checkbox")) fireEvent.click(check);
    fireEvent.click(screen.getByRole("button", { name: "Mark self-reviewed" }));
    expect(
      parseDraft(sessionStorage.getItem(DRAFT_KEY)!).selfReviewedAt,
    ).not.toBeNull();
    fireEvent.change(screen.getByLabelText("Baseline and chosen metric"), {
      target: { value: "I revised the metric after looking at test results." },
    });
    expect(
      parseDraft(sessionStorage.getItem(DRAFT_KEY)!).selfReviewedAt,
    ).toBeNull();
  });

  it("recovers from a corrupt tab draft and describes storage failures honestly", () => {
    sessionStorage.setItem(DRAFT_KEY, "{broken");
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    render(<TransferAssignment />);
    expect(
      screen.getByText(/previous tab draft could not be loaded/),
    ).toBeInTheDocument();
    expect(screen.getByText(/Tab storage is unavailable/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Download report" }),
    ).toBeEnabled();
  });

  it("does not erase revealed help when an earlier draft is imported", async () => {
    render(<TransferAssignment />);
    fireEvent.click(
      screen.getByRole("button", { name: "I need help with the baseline" }),
    );
    const imported = emptyDraft();
    imported.answers.decision = "Earlier attempt";
    const file = new File([JSON.stringify(imported)], "draft.json", {
      type: "application/json",
    });
    // jsdom does not implement File.text in every supported version.
    Object.defineProperty(file, "text", {
      value: async () => JSON.stringify(imported),
    });
    fireEvent.change(screen.getByLabelText(/Load a saved report/), {
      target: { files: [file] },
    });
    await waitFor(() =>
      expect(screen.getByLabelText("Decision and error costs")).toHaveValue(
        "Earlier attempt",
      ),
    );
    expect(
      parseDraft(sessionStorage.getItem(DRAFT_KEY)!).openedRescues,
    ).toEqual(["baseline"]);
    expect(
      parseDraft(sessionStorage.getItem(DRAFT_KEY)!).selfReviewedAt,
    ).toBeNull();
  });

  it("rejects malformed imports and clears unsupported self-review claims", () => {
    const draft = emptyDraft();
    draft.selfReviewedAt = "2026-09-17T00:00:00.000Z";
    expect(parseDraft(JSON.stringify(draft)).selfReviewedAt).toBeNull();
    expect(canSelfReview(draft)).toBe(false);
    for (const invalid of [
      null,
      {},
      { ...draft, version: "other" },
      { ...draft, openedRescues: ["solution"] },
      { ...draft, checks: [true] },
      { ...draft, answers: { decision: 3 } },
    ]) {
      expect(() => parseDraft(JSON.stringify(invalid))).toThrow();
    }
  });
});
