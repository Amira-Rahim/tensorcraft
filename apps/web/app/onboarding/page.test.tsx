import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

/**
 * Phase 11 §11d Wave 2 — Onboarding page brutalist redesign tests.
 *
 * Covers the 5-step wizard (Welcome, Background, Goal, Theme, Ready), back
 * navigation, canonical enum values from migration 018, and the final PATCH
 * to `/api/onboarding`.
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
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { getUser: getUserMock, getSession: getSessionMock },
    from: () => ({
      update: () => ({ eq: updateEqMock }),
    }),
  }),
}));

vi.mock("@/lib/analytics", () => ({ trackThemeSelected: vi.fn() }));

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

/**
 * Scope theme-card lookups to the active theme radiogroup so we don't
 * accidentally match ambient elements outside the wizard.
 */
function pickFirstTheme(): HTMLElement {
  const group = screen.getByTestId("theme-radiogroup");
  const radios = group.querySelectorAll('[role="radio"]');
  if (radios.length === 0) throw new Error("No theme radios rendered");
  return radios[0] as HTMLElement;
}

function allThemeRadios(): HTMLElement[] {
  const group = screen.getByTestId("theme-radiogroup");
  return Array.from(group.querySelectorAll('[role="radio"]')) as HTMLElement[];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("OnboardingPage — §11d Wave 2", () => {
  it("renders step 1 (Welcome) by default with mission briefing", async () => {
    await renderPage();
    expect(screen.getByTestId("step-welcome")).toBeTruthy();
    expect(screen.getByTestId("onboarding-step-text").textContent).toMatch(
      /STEP 1 OF 5/,
    );
  });

  it("progress indicator labels all 5 step names as user advances", async () => {
    await renderPage();
    const labels = ["WELCOME", "BACKGROUND", "GOAL", "THEME", "READY"];
    for (let i = 0; i < 5; i++) {
      const t = screen.getByTestId("onboarding-step-text").textContent ?? "";
      expect(t).toMatch(new RegExp(labels[i]));
      if (i === 1) {
        fireEvent.click(screen.getByTestId("experience-beginner"));
      }
      if (i === 2) {
        fireEvent.click(screen.getByTestId("goal-hobby"));
      }
      if (i === 3) {
        fireEvent.click(pickFirstTheme());
      }
      if (i < 4) clickNext();
    }
  });

  it("shows 5 pips in progress indicator", async () => {
    await renderPage();
    for (let i = 0; i < 5; i++) {
      expect(screen.getByTestId(`step-pip-${i}`)).toBeTruthy();
    }
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

  it("Theme step shows 5 theme cards", async () => {
    await renderPage();
    clickNext();
    fireEvent.click(screen.getByTestId("experience-beginner"));
    clickNext();
    fireEvent.click(screen.getByTestId("goal-hobby"));
    clickNext(); // -> Theme
    expect(allThemeRadios()).toHaveLength(5);
  });

  it("Theme step blocks advance without a theme", async () => {
    await renderPage();
    clickNext();
    fireEvent.click(screen.getByTestId("experience-beginner"));
    clickNext();
    fireEvent.click(screen.getByTestId("goal-hobby"));
    clickNext(); // -> Theme
    clickNext();
    expect(screen.getByTestId("step-theme")).toBeTruthy();
    expect(screen.getByTestId("onboarding-step-error").textContent).toMatch(
      /theme/i,
    );
  });

  it("Ready step renders a configuration summary", async () => {
    await renderPage();
    clickNext();
    fireEvent.click(screen.getByTestId("experience-beginner"));
    clickNext();
    fireEvent.click(screen.getByTestId("goal-hobby"));
    clickNext();
    fireEvent.click(pickFirstTheme());
    clickNext(); // -> Ready
    expect(screen.getByTestId("step-ready")).toBeTruthy();
    expect(screen.getByTestId("ready-summary")).toBeTruthy();
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
    fireEvent.click(screen.getByTestId("framework-react"));
    fireEvent.change(screen.getByTestId("fe-experience-years"), {
      target: { value: "4" },
    });
    fireEvent.change(screen.getByTestId("fe-background"), {
      target: { value: "Shipped a Next.js dashboard" },
    });
    clickNext(); // -> Goal
    fireEvent.click(screen.getByTestId("goal-career"));
    clickNext(); // -> Theme
    fireEvent.click(pickFirstTheme());
    clickNext(); // -> Ready

    fireEvent.click(screen.getByTestId("onboarding-submit"));

    await waitFor(() => {
      const patchCall = fetchMock.mock.calls.find(
        ([u]) => typeof u === "string" && u.includes("/api/onboarding"),
      );
      expect(patchCall).toBeTruthy();
    });

    const patchCall = fetchMock.mock.calls.find(
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
      fe_background: "Shipped a Next.js dashboard",
      fe_framework: "react",
      fe_experience_years: 4,
    });

    // Also writes preferred_theme_id + onboarding_completed via supabase client.
    await waitFor(() => {
      expect(updateEqMock).toHaveBeenCalled();
    });
  });

  it("brutalist markers — next/back buttons are rounded-none", async () => {
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

  it("brutalist markers — no soft-corner rounded utilities in rendered tree", async () => {
    const { container } = await renderPage();
    expect(container.innerHTML).not.toMatch(/rounded-(sm|md|lg|xl|2xl|full)/);
  });

  it("brutalist markers — primary CTA has focus-visible outline", async () => {
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
    fireEvent.change(screen.getByTestId("fe-experience-years"), {
      target: { value: "99" },
    });
    expect(screen.getByTestId("fe-years-error")).toBeTruthy();
    clickNext();
    // still on Background
    expect(screen.getByTestId("step-background")).toBeTruthy();
  });
});
