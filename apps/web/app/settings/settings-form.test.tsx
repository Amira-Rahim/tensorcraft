import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

/**
 * Settings brutalist redesign tests.
 *
 * Covers: 4-tab sidebar (Profile / Notifications / GitHub / Account), Toggle
 * component ON/OFF states, GitHub connect/disconnect wiring to
 * `/api/github/*` endpoints, and `rounded-none` brutalist surfaces. The
 * preferred-theme picker was removed when launch scoped to a single theme.
 */

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, refresh: refreshMock }),
}));

const signOutMock = vi.fn(async () => ({ error: null }));
const getUserMock = vi.fn(async () => ({ data: { user: { id: "user-1" } } }));
const getSessionMock = vi.fn(async () => ({
  data: { session: { access_token: "TOKEN" } },
}));
const updateEqMock = vi.fn(() => Promise.resolve({ data: null, error: null }));
const fromUpdateMock = vi.fn(() => ({ eq: updateEqMock }));

vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: {
      getUser: getUserMock,
      getSession: getSessionMock,
      signOut: signOutMock,
    },
    from: () => ({
      update: fromUpdateMock,
    }),
    storage: {
      from: () => ({
        upload: vi.fn(async () => ({ error: null })),
        getPublicUrl: () => ({ data: { publicUrl: "https://x/avatar.webp" } }),
      }),
    },
  }),
}));

vi.mock("@/lib/api-url", () => ({
  getApiUrl: () => "http://api.test",
}));

vi.mock("@/lib/resize-image", () => ({
  resizeImage: vi.fn(async () => new Blob([new Uint8Array(1)])),
}));

// UserAvatar pulls in ambient assets, stub it.
vi.mock("@/app/components/user-avatar", () => ({
  UserAvatar: ({ name }: { name: string }) => (
    <div data-testid="user-avatar">{name}</div>
  ),
}));

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

const locationOriginal = Object.getOwnPropertyDescriptor(window, "location");

beforeEach(() => {
  pushMock.mockClear();
  refreshMock.mockClear();
  signOutMock.mockClear();
  getUserMock.mockClear();
  getSessionMock.mockClear();
  updateEqMock.mockClear();
  fromUpdateMock.mockClear();
  vi.restoreAllMocks();
  // Mock window.location.href assignment for GitHub connect redirect.
  // jsdom blocks re-assigning location; replace it with a plain object.
  Object.defineProperty(window, "location", {
    configurable: true,
    writable: true,
    value: { href: "", assign: vi.fn(), replace: vi.fn() },
  });
});

afterEach(() => {
  if (locationOriginal) {
    Object.defineProperty(window, "location", locationOriginal);
  }
});

async function importForm() {
  const mod = await import("./settings-form");
  return mod.SettingsForm;
}

function defaultProps(
  overrides: Partial<
    Parameters<Awaited<ReturnType<typeof importForm>>>[0]
  > = {},
): Parameters<Awaited<ReturnType<typeof importForm>>>[0] {
  return {
    email: "learner@example.com",
    displayName: "Learner One",
    avatarUrl: "",
    githubUsername: "",
    githubConnected: false,
    emailAlerts: false,
    weeklyDigest: true,
    purchases: [],
    ...overrides,
  };
}

async function renderForm(
  props?: Partial<Parameters<Awaited<ReturnType<typeof importForm>>>[0]>,
) {
  const SettingsForm = await importForm();
  return render(<SettingsForm {...defaultProps(props)} />);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("SettingsForm", () => {
  it("renders all 4 tabs in the sidebar (Profile / Notifications / GitHub / Account)", async () => {
    await renderForm();
    expect(screen.getByTestId("settings-tab-profile")).toBeTruthy();
    expect(screen.getByTestId("settings-tab-notifications")).toBeTruthy();
    expect(screen.getByTestId("settings-tab-github")).toBeTruthy();
    expect(screen.getByTestId("settings-tab-account")).toBeTruthy();
    expect(screen.queryByTestId("settings-tab-theme")).toBeNull();
  });

  it("defaults to the Profile tab and exposes display name + email fields", async () => {
    await renderForm();
    const name = screen.getByLabelText("Display Name") as HTMLInputElement;
    expect(name.value).toBe("Learner One");
    const email = screen.getByLabelText("Email") as HTMLInputElement;
    expect(email.value).toBe("learner@example.com");
    expect(email.readOnly).toBe(true);
  });

  it("active tab carries aria-selected + left-border primary indicator", async () => {
    await renderForm();
    const profileTab = screen.getByTestId("settings-tab-profile");
    expect(profileTab.getAttribute("aria-selected")).toBe("true");
    fireEvent.click(screen.getByTestId("settings-tab-notifications"));
    expect(
      screen
        .getByTestId("settings-tab-notifications")
        .getAttribute("aria-selected"),
    ).toBe("true");
    expect(profileTab.getAttribute("aria-selected")).toBe("false");
  });

  it("switches tab content when a tab is clicked", async () => {
    await renderForm();
    fireEvent.click(screen.getByTestId("settings-tab-github"));
    expect(screen.getByTestId("github-status")).toBeTruthy();
    fireEvent.click(screen.getByTestId("settings-tab-account"));
    expect(screen.getByTestId("sign-out")).toBeTruthy();
  });

  it("Notifications tab renders two brutalist toggles (email + weekly)", async () => {
    await renderForm();
    fireEvent.click(screen.getByTestId("settings-tab-notifications"));
    const emailToggle = screen.getByTestId("toggle-email-on-lesson-complete");
    const weeklyToggle = screen.getByTestId("toggle-weekly-progress-digest");
    expect(emailToggle.getAttribute("role")).toBe("switch");
    expect(emailToggle.getAttribute("aria-checked")).toBe("false");
    expect(weeklyToggle.getAttribute("aria-checked")).toBe("true");
  });

  it("toggling a switch flips aria-checked", async () => {
    await renderForm();
    fireEvent.click(screen.getByTestId("settings-tab-notifications"));
    const emailToggle = screen.getByTestId("toggle-email-on-lesson-complete");
    fireEvent.click(emailToggle);
    expect(emailToggle.getAttribute("aria-checked")).toBe("true");
  });

  it("does not render the deprecated Theme tab or theme picker grid", async () => {
    await renderForm();
    expect(screen.queryByTestId("settings-tab-theme")).toBeNull();
    expect(screen.queryByTestId("theme-grid")).toBeNull();
  });

  it("GitHub: shows NOT CONNECTED + Connect button when disconnected", async () => {
    await renderForm({ githubConnected: false });
    fireEvent.click(screen.getByTestId("settings-tab-github"));
    expect(screen.getByTestId("github-status").textContent).toMatch(
      /NOT CONNECTED/,
    );
    expect(screen.getByTestId("github-connect")).toBeTruthy();
  });

  it("GitHub connect: POSTs to /api/github/connect and redirects to returned url", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({
        url: "https://github.com/login/oauth/authorize?...",
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await renderForm({ githubConnected: false });
    fireEvent.click(screen.getByTestId("settings-tab-github"));
    fireEvent.click(screen.getByTestId("github-connect"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "http://api.test/api/github/connect",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer TOKEN",
          }),
        }),
      );
    });
    await waitFor(() => {
      expect(window.location.href).toBe(
        "https://github.com/login/oauth/authorize?...",
      );
    });
  });

  it("GitHub disconnect: POSTs to /api/github/disconnect and flips UI", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ disconnected: true }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await renderForm({
      githubConnected: true,
      githubUsername: "octocat",
    });
    fireEvent.click(screen.getByTestId("settings-tab-github"));
    expect(screen.getByTestId("github-status").textContent).toMatch(
      /^CONNECTED$/,
    );
    fireEvent.click(screen.getByTestId("github-disconnect"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "http://api.test/api/github/disconnect",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer TOKEN",
          }),
        }),
      );
    });
    await waitFor(() => {
      expect(screen.getByTestId("github-status").textContent).toMatch(
        /NOT CONNECTED/,
      );
    });
  });

  it("GitHub connect surfaces API error in a11y alert region", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: false,
      json: async () => ({
        error: "GitHub App is not configured on this server",
      }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await renderForm({ githubConnected: false });
    fireEvent.click(screen.getByTestId("settings-tab-github"));
    fireEvent.click(screen.getByTestId("github-connect"));

    await waitFor(() => {
      expect(screen.getByTestId("github-error").textContent).toMatch(
        /not configured/,
      );
    });
  });

  it("Account tab lists purchases when present", async () => {
    await renderForm({
      purchases: [
        {
          planId: "single",
          themeIds: ["deep-orbit"],
          amount: 49,
          createdAt: "2026-04-01T00:00:00Z",
        },
      ],
    });
    fireEvent.click(screen.getByTestId("settings-tab-account"));
    expect(screen.getByText(/Deep Orbit/)).toBeTruthy();
    expect(screen.getByText(/\$49/)).toBeTruthy();
  });

  it("Account tab: sign-out calls supabase signOut + pushes to /", async () => {
    await renderForm();
    fireEvent.click(screen.getByTestId("settings-tab-account"));
    fireEvent.click(screen.getByTestId("sign-out"));
    await waitFor(() => {
      expect(signOutMock).toHaveBeenCalled();
      expect(pushMock).toHaveBeenCalledWith("/");
    });
  });

  it("Account tab: delete button toggles a support-contact notice", async () => {
    await renderForm();
    fireEvent.click(screen.getByTestId("settings-tab-account"));
    expect(screen.queryByTestId("delete-confirm-notice")).toBeNull();
    fireEvent.click(screen.getByTestId("delete-account"));
    expect(screen.getByTestId("delete-confirm-notice")).toBeTruthy();
    expect(screen.getByTestId("delete-confirm-notice").textContent).toMatch(
      /support@tensorcraft\.app/,
    );
  });

  it("Profile save: writes display_name to profiles (no notification prefs)", async () => {
    await renderForm();
    const name = screen.getByLabelText("Display Name") as HTMLInputElement;
    fireEvent.change(name, { target: { value: "New Name" } });
    fireEvent.click(screen.getByTestId("save-profile"));
    await waitFor(() => {
      expect(fromUpdateMock).toHaveBeenCalledWith(
        expect.objectContaining({ display_name: "New Name" }),
      );
    });
    // Notification prefs now go through PATCH /api/preferences (§4e).
    const lastCall = fromUpdateMock.mock.calls.at(-1)?.[0] as
      | Record<string, unknown>
      | undefined;
    expect(lastCall).toBeDefined();
    expect(lastCall).not.toHaveProperty("email_alerts");
    expect(lastCall).not.toHaveProperty("weekly_digest");
  });

  it("Notifications save: PATCH /api/preferences when toggles change", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ email_alerts: true, weekly_digest: true }),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await renderForm({ emailAlerts: false, weeklyDigest: true });
    fireEvent.click(screen.getByTestId("settings-tab-notifications"));
    // Flip "email alerts" ON.
    fireEvent.click(screen.getByTestId("toggle-email-on-lesson-complete"));
    fireEvent.click(screen.getByTestId("save-notifications"));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "http://api.test/api/preferences",
        expect.objectContaining({
          method: "PATCH",
          headers: expect.objectContaining({
            Authorization: "Bearer TOKEN",
          }),
        }),
      );
    });
    const call = fetchMock.mock.calls.at(-1);
    const body = JSON.parse((call?.[1] as { body: string }).body);
    expect(body).toEqual({ email_alerts: true, weekly_digest: true });
  });

  it("Notifications save: skips /api/preferences when toggles unchanged", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({}),
    }));
    vi.stubGlobal("fetch", fetchMock);

    await renderForm();
    fireEvent.click(screen.getByTestId("save-profile"));
    await waitFor(() => {
      expect(fromUpdateMock).toHaveBeenCalled();
    });
    const preferencesCalls = fetchMock.mock.calls.filter(
      (c) => typeof c[0] === "string" && c[0].includes("/api/preferences"),
    );
    expect(preferencesCalls).toHaveLength(0);
  });

  it("uses rounded-none on the tab buttons and panel containers (brutalist)", async () => {
    await renderForm();
    const tab = screen.getByTestId("settings-tab-profile");
    expect(tab.className).toMatch(/rounded-none/);
  });
});
