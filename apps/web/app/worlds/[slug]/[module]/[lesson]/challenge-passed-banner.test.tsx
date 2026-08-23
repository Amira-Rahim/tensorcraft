import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChallengePassedBanner } from "./challenge-passed-banner";

/**
 * The "tests passed" moment.
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

  it("announces and shows the way forward once passed", () => {
    render(
      <ChallengePassedBanner passed exerciseCount={1} onContinue={() => {}} />,
    );

    expect(screen.getByRole("status")).toHaveTextContent(/exercise passed/i);
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
      /all exercises passed/i,
    );
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
});
