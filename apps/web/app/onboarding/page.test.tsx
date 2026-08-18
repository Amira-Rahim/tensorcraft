import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

/**
 * Onboarding page brutalist redesign tests.
 *
 * Covers the 4-step wizard (Welcome, Background, Goal, Ready), back
 * navigation, canonical enum values from migration 018, and the final PATCH
 * to `/api/onboarding`. World selection step was removed when launch was
 * scoped to Deep Orbit only, every learner is auto-routed to that world.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

const getUserMock = vi.fn(async () => ({ data: { user: { id: "user-1" } } }));
const getSessionMock = vi.fn(async () => ({
  data: { session: { access_token: "TOKEN" } },
}));
const updateEqMock = vi.fn(() => Promise.resolve({ data: null, error: null }));
// Onboarding completion refreshes the session so the new JWT carries the
// onboarding_completed claim (custom access token hook, migration 046).
const refreshSessionMock = vi.fn(async () => ({
  data: { session: null },
  error: null,
}));
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getUser: getUserMock,
      getSession: getSessionMock,
      refreshSession: refreshSessionMock,
    },
    from: () => ({
      update: () => ({ eq: updateEqMock }),
    }),
  }),
}));

vi.mock("@/lib/analytics", () => ({ trackWorldSelected: vi.fn() }));

const trackMock = vi.fn();
vi.mock("@/lib/analytics-events", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/lib/analytics-events")>();
  return { ...mod, track: trackMock };
});

vi.mock("@/lib/api-url", () => ({
  getApiUrl: () => "http://api.test",
}));

vi.mock("@/app/components/ambient-background", () => ({
  AmbientBackground: () => <div data-testid="ambient-stub" />,
}));

// jsdom shims for ParticleField / canvas deps used by downstream imports.
beforeAll(() => {
  class MockResizeObserver {
    observe() {}
    disconnect() {}
    unobserve() {}
  }
  if (typeof globalThis.ResizeObserver === "undefined") {
    (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver =
      MockResizeObserver;
  }
});

beforeEach(() => {
  pushMock.mockClear();
  updateEqMock.mockClear();
  getUserMock.mockClear();
  getSessionMock.mockClear();
  trackMock.mockClear();
  vi.restoreAllMocks();
});

async function importPage() {
  const mod = await import("./page");
  return mod.default;
}

async function renderPage() {
  const Page = await importPage();
  return render(<Page />);
}

function clickNext() {
  const btn = screen.getByTestId("onboarding-next");
  fireEvent.click(btn);
}

function clickBack() {
  const btn = screen.getByTestId("onboarding-back");
  fireEvent.click(btn);
}

// (World-step helpers removed, onboarding no longer asks the learner to
//  pick a world; Deep Orbit is auto-selected on submit.)

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("OnboardingPage", () => {
  it("renders step 1 (Welcome) by default with mission briefing", async () => {
    await renderPage();
    expect(screen.getByTestId("step-welcome")).toBeTruthy();
    expect(screen.getByTestId("onboarding-step-text").textContent).toMatch(
      /STEP 1 OF 4/,
    );
  });

  it("progress indicator labels all 4 step names as user advances", async () => {
    await renderPage();
    const labels = ["WELCOME", "BACKGROUND", "GOAL", "READY"];
    for (let i = 0; i < 4; i++) {
      const t = screen.getByTestId("onboarding-step-text").textContent ?? "";
      expect(t).toMatch(new RegExp(labels[i]));
      if (i === 1) {
        fireEvent.click(screen.getByTestId("experience-beginner"));
      }
      if (i === 2) {
        fireEvent.click(screen.getByTestId("goal-hobby"));
      }
      if (i < 3) clickNext();
    }
  });

  it("shows 4 pips in progress indicator", async () => {
    await renderPage();
    for (let i = 0; i < 4; i++) {
      expect(screen.getByTestId(`step-pip-${i}`)).toBeTruthy();
    }
    expect(screen.queryByTestId("step-pip-4")).toBeNull();
  });

  it("advances from Welcome to Background on Next click", async () => {
    await renderPage();
    expect(screen.getByTestId("step-welcome")).toBeTruthy();
    clickNext();
    expect(screen.getByTestId("step-background")).toBeTruthy();
  });

  it("Background step surfaces all 4 experience_level enum options", async () => {
    await renderPage();
    clickNext(); // Welcome -> Background
    for (const id of ["beginner", "intermediate", "advanced", "expert"]) {
      expect(screen.getByTestId(`experience-${id}`)).toBeTruthy();
    }
  });

  it("Background step blocks advance without experience level", async () => {
    await renderPage();
    clickNext(); // -> Background
    clickNext(); // try to advance without picking
    expect(screen.getByTestId("step-background")).toBeTruthy();
    expect(screen.getByTestId("onboarding-step-error").textContent).toMatch(
      /experience level/i,
    );
  });

  it("Goal step shows 5 canonical radio options", async () => {
    await renderPage();
    clickNext(); // -> Background
    fireEvent.click(screen.getByTestId("experience-beginner"));
    clickNext(); // -> Goal
    for (const id of ["hobby", "career", "research", "team", "curiosity"]) {
      const el = screen.getByTestId(`goal-${id}`);
      expect(el.getAttribute("data-value")).toBe(id);
    }
  });

  it("Goal step blocks advance without a selection", async () => {
    await renderPage();
    clickNext();
    fireEvent.click(screen.getByTestId("experience-beginner"));
    clickNext(); // -> Goal
    clickNext(); // try to advance
    expect(screen.getByTestId("step-goal")).toBeTruthy();
    expect(screen.getByTestId("onboarding-step-error").textContent).toMatch(
      /goal/i,
    );
  });

  it("does not render the legacy World step", async () => {
    await renderPage();
    clickNext();
    fireEvent.click(screen.getByTestId("experience-beginner"));
    clickNext();
    fireEvent.click(screen.getByTestId("goal-hobby"));
    clickNext(); // would have been -> World; now -> Ready
    expect(screen.queryByTestId("step-world")).toBeNull();
    expect(screen.getByTestId("step-ready")).toBeTruthy();
  });

  it("Ready step renders a configuration summary with Deep Orbit auto-selected", async () => {
    await renderPage();
    clickNext();
    fireEvent.click(screen.getByTestId("experience-beginner"));
    clickNext();
    fireEvent.click(screen.getByTestId("goal-hobby"));
    clickNext(); // -> Ready
    expect(screen.getByTestId("step-ready")).toBeTruthy();
    const summary = screen.getByTestId("ready-summary");
    expect(summary.textContent).toMatch(/deep orbit/i);
  });

  it("Ready step grounds the launch moment on the bridge plate", async () => {
    await renderPage();
    clickNext();
    fireEvent.click(screen.getByTestId("experience-beginner"));
    clickNext();
    fireEvent.click(screen.getByTestId("goal-hobby"));
    clickNext(); // -> Ready
    const ready = screen.getByTestId("step-ready");
    const plate = ready.querySelector('img[data-testid="art-plate"]');
    expect(plate?.getAttribute("src")).toBe(
      "/locations/deep-orbit/bridge.webp",
    );
  });

  it("back button is absent on step 1, present on step 2", async () => {
    await renderPage();
    expect(screen.queryByTestId("onboarding-back")).toBeNull();
    clickNext();
    expect(screen.getByTestId("onboarding-back")).toBeTruthy();
  });

  it("back button returns to prior step", async () => {
    await renderPage();
    clickNext(); // -> Background
    clickBack(); // -> Welcome
    expect(screen.getByTestId("step-welcome")).toBeTruthy();
  });

  it("final submit PATCHes /api/onboarding with canonical enum payload", async () => {
    const fetchMock = vi.fn(async (url: string) => {
      if (url.includes("/api/onboarding")) {
        return {
          ok: true,
          json: async () => ({ profile: { id: "user-1" } }),
        } as unknown as Response;
      }
      return { ok: true, json: async () => ({}) } as unknown as Response;
    });
    vi.stubGlobal("fetch", fetchMock);

    await renderPage();
    clickNext(); // -> Background
    fireEvent.click(screen.getByTestId("experience-intermediate"));
    fireEvent.change(screen.getByTestId("js-experience-years"), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByTestId("js-background"), {
      target: { value: "Shipped a Next.js dashboard" },
    });
    clickNext(); // -> Goal
    fireEvent.click(screen.getByTestId("goal-career"));
    clickNext(); // -> Ready

    fireEvent.click(screen.getByTestId("onboarding-submit"));

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(
        ([u]) => typeof u === "string" && u.includes("/api/onboarding"),
      );
      expect(patchCall).toBeTruthy();
    });

    const patchCall = (fetchMock.mock.calls as unknown[][]).find(
      ([u]) => typeof u === "string" && u.includes("/api/onboarding"),
    )!;
    const init = patchCall[1] as RequestInit;
    expect(init.method).toBe("PATCH");
    const headers = init.headers as Record<string, string>;
    expect(headers.Authorization).toBe("Bearer TOKEN");
    const body = JSON.parse(init.body as string);
    expect(body).toMatchObject({
      experience_level: "intermediate",
      learning_goal: "career",
      js_background: "Shipped a Next.js dashboard",
      js_experience_years: 4,
    });
    // The fe_framework key was retired with migration 059; the page must
    // not send it.
    expect(body).not.toHaveProperty("fe_framework");

    // Also writes onboarding_completed via supabase client.
    await waitFor(() => {
      expect(updateEqMock).toHaveBeenCalled();
    });
  });

  it("final submit hard-navigates so middleware re-evaluates the fresh JWT", async () => {
    // Regression guard for the 2026-08-17 frozen-LAUNCHING bug: the client
    // router cache had a pre-completion prefetch of /dashboard (a middleware
    // redirect BACK to /onboarding, minted while onboarding_completed was
    // still false). router.push replayed that stale entry, so the learner
    // never left the wizard. Completion must escape the soft-nav cache with
    // a full page load: window.location.assign, never router.push.
    const assignMock = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      assign: assignMock,
      search: "?redirectTo=%2Fdashboard",
    });
    const fetchMock = vi.fn(
      async () => ({ ok: true, json: async () => ({}) }) as unknown as Response,
    );
    vi.stubGlobal("fetch", fetchMock);

    await renderPage();
    clickNext(); // -> Background
    fireEvent.click(screen.getByTestId("experience-intermediate"));
    clickNext(); // -> Goal
    fireEvent.click(screen.getByTestId("goal-career"));
    clickNext(); // -> Ready
    fireEvent.click(screen.getByTestId("onboarding-submit"));

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("/dashboard");
    });
    expect(pushMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("final submit falls back to the launch world without a redirectTo", async () => {
    const assignMock = vi.fn();
    vi.stubGlobal("location", {
      ...window.location,
      assign: assignMock,
      search: "",
    });
    const fetchMock = vi.fn(
      async () => ({ ok: true, json: async () => ({}) }) as unknown as Response,
    );
    vi.stubGlobal("fetch", fetchMock);

    await renderPage();
    clickNext(); // -> Background
    fireEvent.click(screen.getByTestId("experience-beginner"));
    clickNext(); // -> Goal
    fireEvent.click(screen.getByTestId("goal-hobby"));
    clickNext(); // -> Ready
    fireEvent.click(screen.getByTestId("onboarding-submit"));

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("/worlds/deep-orbit");
    });
    expect(pushMock).not.toHaveBeenCalled();

    vi.unstubAllGlobals();
  });

  it("fires onboarding_step_viewed for each step as the user advances", async () => {
    await renderPage();
    // Step 1 (Welcome) fires on mount.
    expect(trackMock).toHaveBeenCalledWith("onboarding_step_viewed", {
      step: 1,
      stepName: "Welcome",
    });
    clickNext(); // -> Background
    expect(trackMock).toHaveBeenCalledWith("onboarding_step_viewed", {
      step: 2,
      stepName: "Background",
    });
    fireEvent.click(screen.getByTestId("experience-beginner"));
    clickNext(); // -> Goal
    expect(trackMock).toHaveBeenCalledWith("onboarding_step_viewed", {
      step: 3,
      stepName: "Goal",
    });
    fireEvent.click(screen.getByTestId("goal-hobby"));
    clickNext(); // -> Ready
    expect(trackMock).toHaveBeenCalledWith("onboarding_step_viewed", {
      step: 4,
      stepName: "Ready",
    });
  });

  it("fires onboarding_completed with cohort properties on final submit", async () => {
    const fetchMock = vi.fn(
      async () => ({ ok: true, json: async () => ({}) }) as unknown as Response,
    );
    vi.stubGlobal("fetch", fetchMock);

    await renderPage();
    clickNext(); // -> Background
    fireEvent.click(screen.getByTestId("experience-intermediate"));
    fireEvent.change(screen.getByTestId("js-experience-years"), {
      target: { value: "4" },
    });
    clickNext(); // -> Goal
    fireEvent.click(screen.getByTestId("goal-career"));
    clickNext(); // -> Ready
    fireEvent.click(screen.getByTestId("onboarding-submit"));

    await waitFor(() => {
      expect(trackMock).toHaveBeenCalledWith("onboarding_completed", {
        experienceLevel: "intermediate",
        learningGoal: "career",
        framework: "react",
        yearsExperience: 4,
      });
    });
  });

  it("brutalist markers, next/back buttons are rounded-none", async () => {
    await renderPage();
    expect(screen.getByTestId("onboarding-next").className).toMatch(
      /rounded-none/,
    );
    clickNext();
    expect(screen.getByTestId("onboarding-back").className).toMatch(
      /rounded-none/,
    );
    expect(screen.getByTestId("onboarding-next").className).toMatch(
      /rounded-none/,
    );
  });

  it("brutalist markers, no soft-corner rounded utilities in rendered tree", async () => {
    const { container } = await renderPage();
    expect(container.innerHTML).not.toMatch(/rounded-(sm|md|lg|xl|2xl|full)/);
  });

  it("brutalist markers, primary CTA has focus-visible outline", async () => {
    await renderPage();
    expect(screen.getByTestId("onboarding-next").className).toMatch(
      /focus-visible:outline-2/,
    );
    expect(screen.getByTestId("onboarding-next").className).toMatch(
      /focus-visible:outline-primary/,
    );
  });

  it("Goal radio group has role=radiogroup and 5 role=radio children", async () => {
    await renderPage();
    clickNext();
    fireEvent.click(screen.getByTestId("experience-beginner"));
    clickNext();
    const group = screen.getByTestId("goal-radiogroup");
    expect(group.getAttribute("role")).toBe("radiogroup");
    const radios = group.querySelectorAll('[role="radio"]');
    expect(radios).toHaveLength(5);
  });

  it("years input rejects out-of-range values (inline error)", async () => {
    await renderPage();
    clickNext();
    fireEvent.click(screen.getByTestId("experience-beginner"));
    fireEvent.change(screen.getByTestId("js-experience-years"), {
      target: { value: "99" },
    });
    expect(screen.getByTestId("js-years-error")).toBeTruthy();
    clickNext();
    // still on Background
    expect(screen.getByTestId("step-background")).toBeTruthy();
  });
});
