import { describe, it, expect, vi } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChallengePassedBanner } from "./challenge-passed-banner";

/**
 * Saved completion and current-attempt feedback remain distinct.
 *
 * Extracted from lesson-steps.tsx on 2026-08-23 to fix an announcement bug:
 * the banner mounted `role="status"` together with its own text. A polite
 * live region inserted at the same instant as its content is announced
 * unreliably, because assistive technology has nothing to observe changing.
 * The pending poller already fixed this same defect; the banner was the last
 * site carrying it.
 *
 * The region is therefore always mounted and only its text changes. The
 * visual banner stays conditional, since an empty bordered box would be
 * nonsense to sighted users.
 */
describe("ChallengePassedBanner", () => {
  it("mounts the live region before there is anything to announce", () => {
    render(
      <ChallengePassedBanner
        passed={false}
        exerciseCount={1}
        onContinue={() => {}}
      />,
    );

    // Present but silent. This is the whole point: the region must already
    // exist so that filling it later reads as a change.
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("");
  });

  it("shows nothing visual until the challenge is passed", () => {
    render(
      <ChallengePassedBanner
        passed={false}
        exerciseCount={1}
        onContinue={() => {}}
      />,
    );

    expect(
      screen.queryByTestId("challenge-passed-banner"),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /continue/i }),
    ).not.toBeInTheDocument();
  });

  it("announces saved completion without claiming the current code passed", () => {
    render(
      <ChallengePassedBanner passed exerciseCount={1} onContinue={() => {}} />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(/completion saved/i);
    expect(screen.getByRole("status")).toHaveTextContent(
      /run the checks again after editing your code/i,
    );
    expect(screen.queryByText(/^exercise passed$/i)).not.toBeInTheDocument();
    expect(screen.getByTestId("challenge-passed-banner")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /continue/i }),
    ).toBeInTheDocument();
  });

  it("pluralises for a multi-exercise challenge", () => {
    render(
      <ChallengePassedBanner passed exerciseCount={3} onContinue={() => {}} />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      /all exercise completions are saved/i,
    );
  });

  it("keeps the earned route open while announcing a failed retry separately", () => {
    const { rerender } = render(
      <ChallengePassedBanner passed exerciseCount={1} onContinue={() => {}} />,
    );
    const status = screen.getByRole("status");
    rerender(
      <ChallengePassedBanner
        passed
        exerciseCount={1}
        latestAttemptFailed
        compact
        onContinue={() => {}}
      />,
    );
    expect(screen.getByRole("status")).toBe(status);
    expect(status).toHaveTextContent(/completed earlier/i);
    expect(status).toHaveTextContent(
      /latest checked attempt still needs work/i,
    );
    expect(screen.getByTestId("challenge-passed-banner")).toHaveAttribute(
      "data-completion-state",
      "earlier",
    );
    expect(
      within(screen.getByTestId("challenge-passed-banner")).getByText(
        /your saved progress is unchanged/i,
      ),
    ).toBeVisible();
    expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
    expect(screen.queryByText(/^exercise passed$/i)).not.toBeInTheDocument();
  });

  it("continues when the button is pressed", async () => {
    const onContinue = vi.fn();
    const user = userEvent.setup();
    render(
      <ChallengePassedBanner
        passed
        exerciseCount={1}
        onContinue={onContinue}
      />,
    );

    await user.click(screen.getByRole("button", { name: /continue/i }));

    expect(onContinue).toHaveBeenCalledTimes(1);
  });

  it("spaces itself on the lesson scale", () => {
    // 24 px under the editor (--l-row) and between the message and its
    // Continue (--l-nav-inner), read from the .lesson-page tokens the banner
    // always renders inside (lesson layout spec, section 6).
    render(
      <ChallengePassedBanner passed exerciseCount={1} onContinue={() => {}} />,
    );

    expect(screen.getByTestId("challenge-passed-banner")).toHaveClass(
      "mt-(--l-row)",
      "gap-(--l-nav-inner)",
    );
  });
});
