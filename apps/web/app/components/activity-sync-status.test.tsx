import {
  fireEvent,
  render,
  screen,
  waitFor,
  act,
} from "@testing-library/react";
import { beforeEach, afterEach, expect, it, vi } from "vitest";
import { LearningActivityScope } from "./learning-activity-scope";
import { LearningExperiment } from "./mdx/learning-experiment";
import { experimentDraft } from "./mdx/learning-experiment-data";
import { saveActivity, readActivities } from "@/lib/learning-activity-client";
const auth = vi.hoisted(() => ({
  change: null as null | ((event: string, session: unknown) => void),
}));
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      onAuthStateChange: (fn: typeof auth.change) => {
        auth.change = fn;
        return { data: { subscription: { unsubscribe: vi.fn() } } };
      },
    },
  }),
}));
vi.mock("@/lib/learning-activity-client", () => ({
  saveActivity: vi.fn(),
  readActivities: vi.fn(),
}));
vi.mock("@/lib/analytics-events", () => ({ EVENTS: {}, track: vi.fn() }));
const guestKey = "tensorcraft:experiment:deep-orbit-normalization:v1";
beforeEach(() => {
  sessionStorage.clear();
  vi.mocked(saveActivity).mockReset().mockResolvedValue();
  vi.mocked(readActivities).mockReset().mockResolvedValue([]);
});
afterEach(() => vi.restoreAllMocks());
const submit = (s: string) => {
  fireEvent.change(screen.getByRole("textbox"), { target: { value: s } });
  fireEvent.click(screen.getByRole("button", { name: "Check prediction" }));
};
it("hides server-owned lesson data immediately when the authenticated identity changes", () => {
  const view = render(
    <LearningActivityScope userId="account-a" requireServerIdentity>
      <p>Account A lesson state</p>
    </LearningActivityScope>,
  );
  act(() => auth.change?.("SIGNED_IN", { user: { id: "account-b" } }));
  expect(screen.queryByText("Account A lesson state")).not.toBeInTheDocument();
  expect(screen.getByRole("status")).toHaveTextContent(
    "Loading this account’s lesson",
  );
  view.rerender(
    <LearningActivityScope userId="account-b" requireServerIdentity>
      <p>Account B lesson state</p>
    </LearningActivityScope>,
  );
  expect(screen.getByText("Account B lesson state")).toBeInTheDocument();
  act(() => auth.change?.("SIGNED_OUT", null));
  expect(screen.queryByText("Account B lesson state")).not.toBeInTheDocument();
});
it("separates drafts immediately on account switch and sends each record with its expected owner", async () => {
  render(
    <LearningActivityScope userId="account-a">
      <LearningExperiment id="normalization" />
    </LearningActivityScope>,
  );
  submit("99,99");
  await waitFor(() =>
    expect(saveActivity).toHaveBeenCalledWith(
      "account-a",
      expect.objectContaining({
        count: 1,
        first: { correct: false, assisted: false },
      }),
    ),
  );
  act(() => auth.change?.("SIGNED_IN", { user: { id: "account-b" } }));
  expect(screen.getByRole("textbox")).toHaveValue("");
  submit("1,1");
  await waitFor(() =>
    expect(saveActivity).toHaveBeenCalledWith(
      "account-b",
      expect.objectContaining({
        count: 1,
        first: { correct: true, assisted: false },
      }),
    ),
  );
  act(() => auth.change?.("SIGNED_IN", { user: { id: "account-a" } }));
  expect(screen.getByRole("textbox")).toHaveValue("99,99");
  expect(
    JSON.parse(sessionStorage.getItem(`${guestKey}:account:account-b`)!)
      .prediction.first.correct,
  ).toBe(true);
});
it("imports a compatible guest summary explicitly, preserving the stable retry identity and leaving account controls alone", async () => {
  const d = experimentDraft("normalization");
  d.prediction = {
    first: { correct: false, assisted: false },
    latest: { correct: true, assisted: true },
    count: 2,
    help: true,
  };
  d.answer = "guest answer";
  sessionStorage.setItem(guestKey, JSON.stringify(d));
  render(
    <LearningActivityScope userId="account-a">
      <LearningExperiment id="normalization" />
    </LearningActivityScope>,
  );
  expect(screen.getByRole("textbox")).toHaveValue("");
  fireEvent.click(
    await screen.findByRole("button", {
      name: "Import this tab’s guest practice",
    }),
  );
  await waitFor(() =>
    expect(saveActivity).toHaveBeenCalledWith(
      "account-a",
      expect.objectContaining({
        count: 2,
        first: { correct: false, assisted: false },
        completedAt: null,
      }),
    ),
  );
  expect(screen.getByRole("textbox")).toHaveValue("");
  expect(JSON.stringify(vi.mocked(saveActivity).mock.calls)).not.toContain(
    "guest answer",
  );
  expect(
    JSON.parse(sessionStorage.getItem(`${guestKey}:sync`)!).streamId,
  ).toMatch(/^[0-9a-f-]{36}$/);
});
it("shows a failed save, retains the draft and retries with the same stream and count", async () => {
  vi.mocked(saveActivity).mockRejectedValueOnce(new Error("Offline"));
  render(
    <LearningActivityScope userId="account-a">
      <LearningExperiment id="normalization" />
    </LearningActivityScope>,
  );
  submit("1,1");
  fireEvent.click(
    await screen.findByRole("button", { name: "Retry account sync" }),
  );
  await waitFor(() => expect(saveActivity).toHaveBeenCalledTimes(2));
  expect(vi.mocked(saveActivity).mock.calls[0]).toEqual(
    vi.mocked(saveActivity).mock.calls[1],
  );
  expect(screen.getByRole("textbox")).toHaveValue("1,1");
});
it("does not import a corrupt guest draft or overwrite a remote first attempt", async () => {
  sessionStorage.setItem(guestKey, '{"version":99}');
  vi.mocked(readActivities).mockResolvedValue([
    {
      activity_id: "deep-orbit-normalization",
      content_version: 1,
      phase: "changed_case",
      first_correct: false,
      first_assisted: true,
      latest_correct: true,
      latest_assisted: false,
      attempt_count: 4,
      assistance_observed: true,
      completed_at: null,
      source: "browser_check",
      updated_at: new Date().toISOString(),
    },
  ]);
  render(
    <LearningActivityScope userId="account-a">
      <LearningExperiment id="normalization" />
    </LearningActivityScope>,
  );
  await waitFor(() =>
    expect(screen.getByText(/4 recorded attempts/)).toBeInTheDocument(),
  );
  expect(
    screen.getByText(/First: did not match with help/),
  ).toBeInTheDocument();
  fireEvent.click(
    screen.getByRole("button", { name: "Import this tab’s guest practice" }),
  );
  await waitFor(() =>
    expect(
      screen.getByText(/Incompatible experiment draft/),
    ).toBeInTheDocument(),
  );
  expect(saveActivity).not.toHaveBeenCalled();
});
