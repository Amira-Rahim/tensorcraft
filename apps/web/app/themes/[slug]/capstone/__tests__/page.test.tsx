import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";

// ─── Mocks ─────────────────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
    ...rest
  }: {
    children: React.ReactNode;
    href: string;
    [key: string]: unknown;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/app/components/ambient-background", () => ({
  AmbientBackground: () => <div data-testid="ambient-bg" />,
}));

// Inline-email side effect on the capstone page; not under test.
vi.mock("../capstone-email-tag", () => ({
  CapstoneEmailTag: () => null,
}));

// Redirect / notFound need to throw (mirror Next's real behavior) so the
// page aborts rendering when the theme is incomplete / missing.
const { redirectMock, notFoundMock } = vi.hoisted(() => ({
  redirectMock: vi.fn((_path: string) => {
    throw new Error("__redirect__");
  }),
  notFoundMock: vi.fn(() => {
    throw new Error("__not_found__");
  }),
}));
vi.mock("next/navigation", () => ({
  redirect: redirectMock,
  notFound: notFoundMock,
}));

// Content: supply enough structure for a fully-completed theme with
// 2 modules × 1 lesson each. `getLessonsWithBridges` must return the
// `moduleSlug` so the timeline "key bridge" lookup works.
vi.mock("@tensorcraft/content", () => {
  const modules = [
    {
      slug: "foundations",
      title: "Foundations",
      order: 1,
      track: "foundations",
    },
    {
      slug: "sector-one",
      title: "Sector One",
      order: 2,
      track: "specialization",
    },
  ];
  const lessonsByModule: Record<
    string,
    Array<{
      slug: string;
      title: string;
      order: number;
      estimatedMinutes: number;
    }>
  > = {
    foundations: [
      {
        slug: "intro-tensors",
        title: "Intro to Tensors",
        order: 1,
        estimatedMinutes: 12,
      },
    ],
    "sector-one": [
      {
        slug: "signal-basics",
        title: "Signal Basics",
        order: 2,
        estimatedMinutes: 18,
      },
    ],
  };
  return {
    getModules: () => modules,
    getModuleLessons: (_t: string, m: string) => lessonsByModule[m] ?? [],
    getThemeLessons: () => [
      ...lessonsByModule.foundations,
      ...lessonsByModule["sector-one"],
    ],
    getLessonsWithBridges: () => [
      {
        lessonSlug: "intro-tensors",
        moduleSlug: "foundations",
        feTitle: "Array.map",
        mlTitle: "torch.Tensor.map",
        tier: "identity",
      },
      {
        lessonSlug: "signal-basics",
        moduleSlug: "sector-one",
        feTitle: "FFT-JS",
        mlTitle: "torch.fft",
        tier: "structural",
      },
    ],
  };
});

// Progress helper — two completed lessons, spanning both modules.
const progressRef = vi.hoisted(() => ({
  data: [
    {
      lesson_id: "intro-tensors",
      module_id: "foundations",
      status: "completed",
      score: 92,
      completed_at: "2026-04-10T12:00:00.000Z",
    },
    {
      lesson_id: "signal-basics",
      module_id: "sector-one",
      status: "completed",
      score: 88,
      completed_at: "2026-04-18T09:30:00.000Z",
    },
  ] as Array<{
    lesson_id: string;
    module_id: string;
    status: string;
    score: number;
    completed_at: string;
  }>,
}));
vi.mock("@/lib/progress", () => ({
  getUserProgress: async () => progressRef.data,
}));

// ParticleField / a11y / etc aren't used on capstone, but they're pulled
// in via other transitive imports; stub defensively.
vi.mock("@tensorcraft/ui/effects", () => ({
  ParticleField: () => <div data-testid="particle-field" />,
}));

// Browser Supabase client — exercised by the certificate card's
// POST-on-mount flow.
const getSessionMock = vi.fn();
vi.mock("@/lib/supabase/client", () => ({
  getSupabaseBrowserClient: () => ({
    auth: { getSession: getSessionMock },
  }),
}));

// API URL helper.
vi.mock("@/lib/api-url", () => ({
  getApiUrl: () => "http://api.local",
}));

// Server Supabase client. Dynamic per-test via the refs below.
const getUserMock = vi.fn();
const profileRef: { data: { display_name: string } | null } = {
  data: { display_name: "Amira" },
};
const certRef: {
  data: {
    id: string;
    issued_at: string;
    cert_hash: string;
    pdf_url: string | null;
  } | null;
} = { data: null };
const exerciseAttemptsRef: {
  data: Array<{ passed: boolean; hints_used: number }>;
} = {
  data: [
    { passed: true, hints_used: 0 },
    { passed: true, hints_used: 2 },
    { passed: false, hints_used: 3 },
  ],
};
const purchasesRef: { data: Array<{ theme_ids: string[] }> } = {
  data: [{ theme_ids: ["deep-orbit"] }],
};

function buildQuery(data: unknown, single = false) {
  const result = { data };
  const api: Record<string, unknown> = {};
  const chain = () => api;
  api.select = chain;
  api.eq = chain;
  api.limit = chain;
  api.order = chain;
  api.contains = chain;
  api.single = () => Promise.resolve(result);
  api.maybeSingle = () => Promise.resolve(result);
  api.then = (
    onFulfilled: (value: { data: unknown }) => unknown,
    onRejected?: (err: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return api;
}

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: async () => ({
    auth: { getUser: getUserMock },
    from: (table: string) => {
      switch (table) {
        case "profiles":
          return buildQuery(profileRef.data, true);
        case "certificates":
          return buildQuery(certRef.data);
        case "exercise_attempts":
          return buildQuery(exerciseAttemptsRef.data);
        case "purchases":
          return buildQuery(purchasesRef.data);
        default:
          return buildQuery(null);
      }
    },
  }),
}));

import CapstonePage from "../page";

// Reset state between tests.
beforeEach(() => {
  vi.restoreAllMocks();
  redirectMock.mockClear();
  notFoundMock.mockClear();
  getUserMock.mockReset();
  getUserMock.mockResolvedValue({ data: { user: { id: "u-1" } } });
  progressRef.data = [
    {
      lesson_id: "intro-tensors",
      module_id: "foundations",
      status: "completed",
      score: 92,
      completed_at: "2026-04-10T12:00:00.000Z",
    },
    {
      lesson_id: "signal-basics",
      module_id: "sector-one",
      status: "completed",
      score: 88,
      completed_at: "2026-04-18T09:30:00.000Z",
    },
  ];
  profileRef.data = { display_name: "Amira" };
  certRef.data = null;
  exerciseAttemptsRef.data = [
    { passed: true, hints_used: 0 },
    { passed: true, hints_used: 2 },
    { passed: false, hints_used: 3 },
  ];
  purchasesRef.data = [{ theme_ids: ["deep-orbit"] }];
  getSessionMock.mockReset();
  getSessionMock.mockResolvedValue({ data: { session: null } });
  // Default: no network — individual tests install a fetch stub.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: async () => ({}),
  });
});

async function renderPage() {
  const ui = await CapstonePage({
    params: Promise.resolve({ slug: "deep-orbit" }),
  });
  let view!: ReturnType<typeof render>;
  await act(async () => {
    view = render(ui);
  });
  return view;
}

// ─── Tests ─────────────────────────────────────────────────────────────

describe("CapstonePage — Phase 11 §11d", () => {
  it("renders the hero, 4 stat cards, the timeline, and the certificate card", async () => {
    await renderPage();

    // Hero
    expect(screen.getByText("All Systems Mapped")).toBeInTheDocument();

    // Stats — 4 brutalist cards
    const stats = screen.getByTestId("capstone-stats");
    expect(stats).toBeInTheDocument();
    for (let i = 0; i < 4; i++) {
      expect(screen.getByTestId(`stat-card-${i}`)).toBeInTheDocument();
    }
    expect(screen.getByText("Lessons Completed")).toBeInTheDocument();
    expect(screen.getByText("Bridges Explored")).toBeInTheDocument();
    expect(screen.getByText("Hints Used")).toBeInTheDocument();
    expect(screen.getByText("Exercises Passed")).toBeInTheDocument();

    // Timeline
    expect(screen.getByTestId("capstone-timeline")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-node-0")).toBeInTheDocument();
    expect(screen.getByTestId("timeline-node-1")).toBeInTheDocument();

    // Certificate card (brutalist)
    const cert = screen.getByTestId("certificate-card");
    expect(cert).toBeInTheDocument();
    expect(cert.className).toContain("rounded-none");
    expect(cert.className).toContain("brutalist-shadow");
  });

  it("stats cards show real values derived from progress + attempts", async () => {
    await renderPage();

    // 2 completed lessons / 2 total
    expect(screen.getByText("2 / 2")).toBeInTheDocument();
    // Stat cards: bridges=2, hints=5, exercises-passed=2
    const hintsCard = screen.getByTestId("stat-card-2");
    expect(hintsCard.textContent).toContain("5");
    expect(hintsCard.textContent).toContain("Hints Used");
    const bridgesCard = screen.getByTestId("stat-card-1");
    expect(bridgesCard.textContent).toContain("2");
    const passedCard = screen.getByTestId("stat-card-3");
    expect(passedCard.textContent).toContain("2");
    expect(passedCard.textContent).toContain("Exercises Passed");
  });

  it("timeline shows module titles, completion dates, and key bridges", async () => {
    await renderPage();
    const node0 = screen.getByTestId("timeline-node-0");
    expect(node0.textContent).toContain("M01");
    expect(node0.textContent).toContain("Foundations");
    expect(node0.textContent).toContain("Completed");
    expect(node0.textContent).toContain("Array.map");
    expect(node0.textContent).toContain("torch.Tensor.map");

    const node1 = screen.getByTestId("timeline-node-1");
    expect(node1.textContent).toContain("M02");
    expect(node1.textContent).toContain("Sector One");
  });

  it("redirects to the theme page if the theme is not complete", async () => {
    // Drop one completed lesson so the gate blocks us.
    progressRef.data = [
      {
        lesson_id: "intro-tensors",
        module_id: "foundations",
        status: "completed",
        score: 90,
        completed_at: "2026-04-10T12:00:00.000Z",
      },
      // signal-basics not completed
    ];

    await expect(renderPage()).rejects.toThrow("__redirect__");
    expect(redirectMock).toHaveBeenCalledWith("/themes/deep-orbit");
  });

  it("calls notFound for an unknown theme slug", async () => {
    await expect(
      CapstonePage({
        params: Promise.resolve({ slug: "not-a-theme" }),
      }),
    ).rejects.toThrow("__not_found__");
    expect(notFoundMock).toHaveBeenCalled();
  });

  it("renders the V1.0-coming placeholder when only Deep Orbit is launched and the user owns it", async () => {
    // V1 scope-revert: the next-theme teaser is filtered to launched themes
    // only. With deep-orbit the sole launched theme and the user owning it,
    // the placeholder fires instead of a coming-soon teaser.
    await renderPage();
    expect(screen.queryByTestId("next-theme-teaser")).toBeNull();
    expect(screen.getByTestId("next-theme-placeholder")).toBeInTheDocument();
  });

  it("renders the V1.0-coming placeholder when the user owns every theme", async () => {
    purchasesRef.data = [
      {
        theme_ids: [
          "deep-orbit",
          "neon-protocol",
          "signal-ward",
          "nova-canvas",
          "terra-grid",
        ],
      },
    ];
    await renderPage();
    expect(screen.queryByTestId("next-theme-teaser")).toBeNull();
    const placeholder = screen.getByTestId("next-theme-placeholder");
    expect(placeholder).toBeInTheDocument();
    expect(placeholder.textContent).toContain("V1.0 coming");
  });

  it("renders certificate number + hash preview when an existing cert is found server-side", async () => {
    certRef.data = {
      id: "abcdef12-3456-7890-1234-567890abcdef",
      issued_at: "2026-04-20T10:00:00.000Z",
      cert_hash:
        "deadbeefcafef00dbabe1234567890abcdef1234567890abcdef1234567890ab",
      pdf_url: null,
    };

    await renderPage();

    // Cert number — first 8 of UUID, upper
    expect(screen.getByTestId("cert-number").textContent).toBe("TC-ABCDEF12");
    // Hash preview — first 8 of hash, upper
    expect(screen.getByTestId("cert-hash-preview").textContent).toBe(
      "DEADBEEF",
    );
    // No loading state
    expect(screen.queryByTestId("cert-loading")).toBeNull();
  });

  it("POSTs /api/certificates on mount when no cert exists + updates UI", async () => {
    certRef.data = null;
    getSessionMock.mockResolvedValue({
      data: { session: { access_token: "jwt-token" } },
    });
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: "11111111-2222-3333-4444-555555555555",
        theme_id: "deep-orbit",
        issued_at: "2026-04-21T08:00:00.000Z",
        cert_hash:
          "feedfacecafe1234567890abcdef1234567890abcdef1234567890abcdef1234",
      }),
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = fetchMock;

    await act(async () => {
      await renderPage();
    });

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "http://api.local/api/certificates",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ themeId: "deep-orbit" }),
        }),
      );
    });

    await waitFor(() => {
      expect(screen.getByTestId("cert-number").textContent).toBe("TC-11111111");
    });
    expect(screen.getByTestId("cert-hash-preview").textContent).toBe(
      "FEEDFACE",
    );
  });

  it("shows an error state when the certificate POST fails", async () => {
    certRef.data = null;
    getSessionMock.mockResolvedValue({
      data: { session: { access_token: "jwt-token" } },
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ error: "boom" }),
    });

    await act(async () => {
      await renderPage();
    });
    expect(await screen.findByTestId("cert-error")).toBeInTheDocument();
  });

  it("exposes Download PDF and Share Link action buttons on the certificate", async () => {
    certRef.data = {
      id: "abcdef12-3456-7890-1234-567890abcdef",
      issued_at: "2026-04-20T10:00:00.000Z",
      cert_hash: "deadbeef" + "0".repeat(56),
      pdf_url: null,
    };
    await renderPage();

    expect(screen.getByTestId("download-pdf-button")).toBeInTheDocument();
    expect(screen.getByTestId("share-link-button")).toBeInTheDocument();
  });

  it("Share Link copies a /certificates/:id URL to the clipboard", async () => {
    certRef.data = {
      id: "abcdef12-3456-7890-1234-567890abcdef",
      issued_at: "2026-04-20T10:00:00.000Z",
      cert_hash: "deadbeef" + "0".repeat(56),
      pdf_url: null,
    };
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis.navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    await renderPage();
    const btn = screen.getByTestId("share-link-button");
    await act(async () => {
      fireEvent.click(btn);
    });

    await waitFor(() => {
      expect(writeText).toHaveBeenCalledWith(
        expect.stringContaining(
          "/certificates/abcdef12-3456-7890-1234-567890abcdef",
        ),
      );
    });
  });
});
