import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { LearningRoutePicker, GUEST_ROUTE_KEY } from "./learning-route-picker";
import { ML_READINESS_QUESTIONS } from "@tensorcraft/shared";

const { refresh, apiFetch, track } = vi.hoisted(() => ({
  refresh: vi.fn(),
  apiFetch: vi.fn(),
  track: vi.fn(),
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/lib/api-fetch", () => ({ apiFetch }));
vi.mock("@/lib/analytics-events", () => ({
  track,
  EVENTS: { LEARNING_ROUTE_SELECTED: "learning_route_selected" },
}));
beforeEach(() => {
  localStorage.clear();
  vi.clearAllMocks();
  apiFetch.mockResolvedValue({ ok: true });
});
const guided = () =>
  screen.getByRole("button", { name: /Learn ML from the beginning/ });
const challenge = () =>
  screen.getByRole("button", { name: /I know the basics/ });

describe("ML learning route", () => {
  it("restores the guest choice and makes switching reversible without awarding credit", async () => {
    localStorage.setItem(GUEST_ROUTE_KEY, "challenge");
    render(
      <LearningRoutePicker
        accountId={null}
        initialRoute={null}
        source="world"
      />,
    );
    expect(challenge()).toHaveAttribute("aria-pressed", "true");
    fireEvent.click(guided());
    await waitFor(() =>
      expect(localStorage.getItem(GUEST_ROUTE_KEY)).toBe("guided"),
    );
    expect(apiFetch).not.toHaveBeenCalled();
    expect(track).toHaveBeenCalledWith("learning_route_selected", {
      worldId: "deep-orbit",
      route: "guided",
      source: "world",
      persistence: "browser",
    });
  });

  it("keeps an account preference until explicitly adopting a conflicting guest preference", async () => {
    localStorage.setItem(GUEST_ROUTE_KEY, "challenge");
    render(
      <LearningRoutePicker
        accountId="alice"
        initialRoute="guided"
        source="settings"
      />,
    );
    expect(guided()).toHaveAttribute("aria-pressed", "true");
    expect(apiFetch).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: /Use.*browser/i }));
    await waitFor(() =>
      expect(challenge()).toHaveAttribute("aria-pressed", "true"),
    );
    expect(apiFetch).toHaveBeenCalledWith("/api/onboarding", {
      method: "PATCH",
      body: JSON.stringify({ ml_learning_route: "challenge" }),
    });
    expect(localStorage.getItem(GUEST_ROUTE_KEY)).toBeNull();
    expect(refresh).toHaveBeenCalledOnce();
  });

  it("does not change the saved selection or emit a success event when the API fails", async () => {
    apiFetch.mockResolvedValue({ ok: false });
    render(
      <LearningRoutePicker
        accountId="alice"
        initialRoute="guided"
        source="lesson"
      />,
    );
    fireEvent.click(challenge());
    await screen.findByText(/could not be saved/);
    expect(guided()).toHaveAttribute("aria-pressed", "true");
    expect(track).not.toHaveBeenCalled();
  });

  it("resets page state when the signed-in account changes", async () => {
    const view = render(
      <LearningRoutePicker
        accountId="alice"
        initialRoute="guided"
        source="settings"
      />,
    );
    fireEvent.click(challenge());
    await waitFor(() =>
      expect(challenge()).toHaveAttribute("aria-pressed", "true"),
    );
    view.rerender(
      <LearningRoutePicker
        accountId="bob"
        initialRoute="guided"
        source="settings"
      />,
    );
    expect(guided()).toHaveAttribute("aria-pressed", "true");
  });

  it("keeps starting links usable without browser storage", () => {
    const get = vi
      .spyOn(Storage.prototype, "getItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    const set = vi
      .spyOn(Storage.prototype, "setItem")
      .mockImplementation(() => {
        throw new Error("blocked");
      });
    render(
      <LearningRoutePicker
        accountId={null}
        initialRoute={null}
        source="world"
      />,
    );
    fireEvent.click(challenge());
    expect(challenge()).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Selected for this page/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Open the runtime challenge" }),
    ).toHaveAttribute("href", expect.stringContaining("?start=challenge"));
    get.mockRestore();
    set.mockRestore();
  });

  it("suggests specific review from the optional check, without persisting answers or credit", () => {
    render(
      <LearningRoutePicker
        accountId={null}
        initialRoute={null}
        source="world"
        showReadiness
      />,
    );
    fireEvent.click(screen.getByText(/Optional: check/));
    expect(
      screen.getByRole("button", { name: "Show suggested review" }),
    ).toBeDisabled();
    ML_READINESS_QUESTIONS.forEach((q, i) =>
      fireEvent.click(
        screen.getByLabelText(q.options[i === 0 ? 1 : q.correct]!),
      ),
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Show suggested review" }),
    );
    expect(
      screen.getByRole("link", { name: "Channel layout" }),
    ).toHaveAttribute(
      "href",
      "/worlds/deep-orbit/foundations/tensor-shapes?start=concept",
    );
    expect(
      screen.queryByRole("link", { name: "Evaluation and baselines" }),
    ).toBeNull();
    expect(apiFetch).not.toHaveBeenCalled();
    expect(track).not.toHaveBeenCalled();
  });
});
