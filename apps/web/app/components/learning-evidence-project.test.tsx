import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SystemEvidenceStage } from "@/lib/system-evidence";
import type { LearningEvidenceSnapshot } from "@/lib/learning-evidence-types";

const mocks = vi.hoisted(() => ({
  list: vi.fn(),
  listeners: new Set<
    (event: string, session: { user: { id: string } } | null) => void
  >(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: vi.fn() }) }));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      onAuthStateChange: (
        listener: (
          event: string,
          session: { user: { id: string } } | null,
        ) => void,
      ) => {
        mocks.listeners.add(listener);
        return {
          data: {
            subscription: {
              unsubscribe: () => mocks.listeners.delete(listener),
            },
          },
        };
      },
    },
  }),
}));
vi.mock("@/lib/learning-evidence-store", () => ({
  resolveEvidenceOwner: (owner: string | null) => `account:${owner}`,
  listLearningEvidence: mocks.list,
  saveLearningEvidence: vi.fn(),
  deleteLearningEvidence: vi.fn(),
}));
// Keep the actual draft reader and result renderer. Avoid importing the editor
// runtime into a project-page test, since this page never opens an editor.
vi.mock("@tensorcraft/ui", async () => ({
  ...(await import("../../../../packages/ui/src/mdx/exercise-draft")),
  ...(await import("../../../../packages/ui/src/mdx/exercise-output")),
}));

import { LearningEvidenceProject } from "./learning-evidence-project";
import { exerciseDraftKey } from "@tensorcraft/ui";

function record(owner = "alice"): LearningEvidenceSnapshot {
  return {
    schemaVersion: 1,
    runId: `${owner}-run`,
    ownerScope: `account:${owner}`,
    worldId: "deep-orbit",
    moduleId: "foundations",
    lessonId: "normalization",
    exerciseSlug: "normalize-data",
    milestoneId: "reusable-scaling",
    capturedAt: "2026-11-02T10:00:00.000Z",
    exerciseVersion: "current-version",
    starterHash: "starter-hash",
    testHash: "test-hash",
    codeHash: "saved-code-hash",
    submittedCode: `${owner} saved code`,
    runtimeVersion: "4.22.0",
    backend: "cpu",
    fixtureId: "normalization-four-readings",
    fixtureVersion: "1",
    sourceLabel: "Supplied two-feature practice readings",
    featureOrder: ["Temperature", "Signal strength"],
    units: ["unspecified", "unspecified"],
    selectedRowIds: [1],
    actualSelectedValues: [[20, 0.2]],
    artifacts: [
      {
        kind: "table",
        title: `${owner} captured result`,
        columns: ["Mean"],
        rows: [[23]],
      },
    ],
    checks: [{ name: "Saved statistics", passed: true }],
    runOutcome: "passed",
    assistance: {
      hintsRevealed: [],
      hintHistory: "session-only",
      solutionViewed: false,
    },
    origin: "browser exercise run",
  };
}

function saveDraft(owner: string, code: string) {
  localStorage.setItem(
    exerciseDraftKey("normalize-data", owner),
    JSON.stringify({
      version: 1,
      code,
      starter: "starter code",
      solutionViewed: false,
      stashedCode: null,
    }),
  );
}

function changeAccount(owner: string | null) {
  act(() => {
    for (const listener of mocks.listeners)
      listener(
        owner ? "SIGNED_IN" : "SIGNED_OUT",
        owner ? { user: { id: owner } } : null,
      );
  });
}

async function openCapturedTables() {
  const saved = await screen.findByText("Saved run: All checks passed");
  if (!saved.parentElement?.hasAttribute("open")) fireEvent.click(saved);
  const summary = await screen.findByText("All captured tables");
  expect(summary.parentElement).not.toHaveAttribute("open");
  fireEvent.click(summary);
}

describe("project normalization records", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.listeners.clear();
    localStorage.clear();
    mocks.list.mockImplementation((owner: string) =>
      Promise.resolve([record(owner.slice("account:".length))]),
    );
  });

  it("loads the signed-in owner's output and compares it with their current draft", async () => {
    saveDraft("alice", "alice newer draft");
    saveDraft("bob", "alice saved code");
    render(
      <LearningEvidenceProject
        userId="alice"
        currentVersion="current-version"
        starterCode="starter code"
      />,
    );
    fireEvent.click(await screen.findByText("Saved run: All checks passed"));
    expect(
      await screen.findByText(/Saved results from earlier code/),
    ).toBeVisible();
    expect(screen.getByText("alice captured result")).not.toBeVisible();
    await openCapturedTables();
    expect(
      await screen.findByRole("heading", { name: "alice captured result" }),
    ).toBeVisible();
    expect(mocks.list).toHaveBeenCalledWith("account:alice", "normalize-data");
    expect(screen.getByText(/Saved results from earlier code/)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Open exercise to restore" }),
    ).toHaveAttribute(
      "href",
      "/worlds/deep-orbit/foundations/normalization#step-challenge",
    );

    saveDraft("alice", "alice saved code");
    fireEvent(
      window,
      new StorageEvent("storage", {
        key: exerciseDraftKey("normalize-data", "alice"),
      }),
    );
    expect(
      screen.queryByText(/Saved results from earlier code/),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText("Captured output. All checks passed."),
    ).toBeVisible();
  });

  it("hides the old account immediately, then loads only the refreshed server identity", async () => {
    saveDraft("alice", "alice saved code");
    saveDraft("bob", "bob saved code");
    const { rerender } = render(
      <LearningEvidenceProject
        userId="alice"
        currentVersion="current-version"
        starterCode="starter code"
      />,
    );
    await openCapturedTables();
    expect(
      await screen.findByRole("heading", { name: "alice captured result" }),
    ).toBeVisible();

    changeAccount("bob");
    expect(
      screen.queryByRole("heading", { name: "alice captured result" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("region", { name: "Saved normalization runs" }),
    ).not.toBeInTheDocument();
    expect(mocks.list).not.toHaveBeenCalledWith(
      "account:bob",
      "normalize-data",
    );

    rerender(
      <LearningEvidenceProject
        userId="bob"
        currentVersion="current-version"
        starterCode="starter code"
      />,
    );
    await openCapturedTables();
    expect(
      await screen.findByRole("heading", { name: "bob captured result" }),
    ).toBeVisible();
    expect(
      screen.queryByRole("heading", { name: "alice captured result" }),
    ).not.toBeInTheDocument();
    expect(mocks.list).toHaveBeenCalledWith("account:bob", "normalize-data");
    changeAccount(null);
    expect(
      screen.queryByRole("heading", { name: "bob captured result" }),
    ).not.toBeInTheDocument();
  });

  it("ignores an old account's pending read after an auth switch", async () => {
    let resolveAlice!: (records: LearningEvidenceSnapshot[]) => void;
    mocks.list.mockImplementation((owner: string) =>
      owner === "account:alice"
        ? new Promise((resolve) => {
            resolveAlice = resolve;
          })
        : Promise.resolve([record("bob")]),
    );
    const { rerender } = render(
      <LearningEvidenceProject
        userId="alice"
        currentVersion="current-version"
        starterCode="starter code"
      />,
    );
    await waitFor(() =>
      expect(mocks.list).toHaveBeenCalledWith(
        "account:alice",
        "normalize-data",
      ),
    );
    changeAccount("bob");
    rerender(
      <LearningEvidenceProject
        userId="bob"
        currentVersion="current-version"
        starterCode="starter code"
      />,
    );
    await openCapturedTables();
    await screen.findByRole("heading", { name: "bob captured result" });
    await act(async () => {
      resolveAlice([record("alice")]);
    });
    expect(
      screen.queryByRole("heading", { name: "alice captured result" }),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "bob captured result" }),
    ).toBeVisible();
  });

  it("keeps the Data and Model milestones separate and reads each exercise's draft", async () => {
    const network: LearningEvidenceSnapshot = {
      ...record(),
      runId: "network-run",
      moduleId: "neural-networks",
      lessonId: "building-a-network",
      exerciseSlug: "simple-network",
      milestoneId: "first-trained-network",
      fixtureId: "synthetic-eight-feature-rehearsal",
      sourceLabel: "Supplied 120-row synthetic training rehearsal",
      submittedCode: "network saved code",
      artifacts: [
        { kind: "text", title: "Network captured output", text: "Actual run" },
      ],
    };
    mocks.list.mockImplementation((_owner: string, slug: string) =>
      Promise.resolve(slug === "simple-network" ? [network] : [record()]),
    );
    saveDraft("alice", "alice saved code");
    localStorage.setItem(
      exerciseDraftKey("simple-network", "alice"),
      JSON.stringify({
        version: 1,
        code: "network newer code",
        starter: "network starter",
        solutionViewed: false,
        stashedCode: null,
      }),
    );
    render(
      <LearningEvidenceProject
        userId="alice"
        currentVersion="current-version"
        starterCode="starter code"
        network={{
          currentVersion: "current-version",
          starterCode: "network starter",
        }}
      />,
    );
    await screen.findByText("Network captured output");
    expect(mocks.list).toHaveBeenCalledWith("account:alice", "simple-network");
    expect(screen.getByText("Model milestone")).toBeVisible();
    expect(screen.getByText("Data milestone")).toBeVisible();
    const data = screen.getByRole("region", {
      name: "Saved normalization runs",
    });
    const model = screen.getByRole("region", { name: "Saved network runs" });
    expect(data).not.toHaveTextContent(
      "Your current editor contains different code",
    );
    expect(model).toHaveTextContent(
      "Your current editor contains different code",
    );
    expect(model).not.toHaveTextContent("alice captured result");
    expect(data).not.toHaveTextContent("Network captured output");
  });
  it("keeps local runs within their matching project stage and separates server practice", async () => {
    mocks.list.mockResolvedValue([]);
    const stages: SystemEvidenceStage[] = (
      ["data", "model", "evaluation"] as const
    ).map((id) => ({
      id,
      title: id === "data" ? "Data" : id === "model" ? "Model" : "Evaluation",
      purpose: "Practice for this stage",
      completedLessons: 1,
      due: [],
      work: [
        {
          label: "Recorded exercise attempt",
          href: "/dashboard",
          detail: "Browser-reported practice",
        },
      ],
      next: { label: "Continue practice", href: "/dashboard", detail: "" },
    }));
    render(
      <LearningEvidenceProject
        userId="alice"
        currentVersion="current-version"
        starterCode="starter code"
        network={{
          currentVersion: "network-version",
          starterCode: "network starter",
        }}
        evaluation={{
          currentVersion: "evaluation-version",
          starterCode: "evaluation starter",
        }}
        stages={stages}
      />,
    );
    await waitFor(() =>
      expect(mocks.list).toHaveBeenCalledWith(
        "account:alice",
        "deep-scan-eval",
      ),
    );
    const evaluationStage = screen.getByText("Evaluation", {
      selector: "summary",
    }).parentElement!;
    expect(
      within(evaluationStage).getByRole("region", {
        name: "Saved evaluation runs",
        hidden: true,
      }),
    ).not.toBeVisible();
    fireEvent.click(
      within(evaluationStage).getByText("Evaluation", { selector: "summary" }),
    );
    expect(
      within(evaluationStage).getByRole("region", {
        name: "Saved evaluation runs",
      }),
    ).toBeVisible();
    expect(
      within(evaluationStage).queryByRole("region", {
        name: "Saved network runs",
        hidden: true,
      }),
    ).not.toBeInTheDocument();
    expect(
      within(evaluationStage).getByText("Practice and review records"),
    ).toBeVisible();
    expect(
      within(evaluationStage).getByText("Recorded exercise attempt"),
    ).toBeVisible();
    expect(
      within(evaluationStage).getByRole("link", {
        name: "Open the evaluation exercise",
      }),
    ).toHaveAttribute(
      "href",
      "/worlds/deep-orbit/training-loop/evaluating-deep-scan#step-challenge",
    );
  });
});
