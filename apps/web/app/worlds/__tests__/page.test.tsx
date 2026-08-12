import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

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

// Scene canvases are visual decoration only, stub them to avoid jsdom
// canvas / IntersectionObserver work in the test environment.
vi.mock("@tensorcraft/ui/effects", () => ({
  ParticleField: ({ density }: { density?: number }) => (
    <div data-testid="particle-field" data-density={density ?? "default"} />
  ),
  SceneCanvas: ({ hovered }: { hovered?: boolean }) => (
    <div data-testid="scene-canvas" data-hovered={hovered ?? false} />
  ),
  drawOrbit: () => {},
  drawNeonProtocol: () => {},
  drawSignalWard: () => {},
  drawNovaCanvas: () => {},
  drawTerraGrid: () => {},
}));

// FocusTrap: keep the Escape + onEscape contract but render children
// directly. This mirrors the real primitive's behavior for the portions
// the modal depends on (container div, onKeyDown → Escape handler).
vi.mock("@tensorcraft/ui/a11y", () => ({
  FocusTrap: ({
    children,
    onEscape,
  }: {
    children: React.ReactNode;
    active?: boolean;
    onEscape?: () => void;
  }) => (
    <div
      data-focus-trap="active"
      onKeyDown={(e) => {
        if (e.key === "Escape" && onEscape) onEscape();
      }}
    >
      {children}
    </div>
  ),
}));

// Waitlist helper, we only care that it was called correctly.
const submitWaitlistMock = vi.fn();
vi.mock("@/lib/waitlist", () => ({
  submitWaitlist: (...args: unknown[]) => submitWaitlistMock(...args),
}));

// Server supabase helper: empty user → ownedWorlds is empty.
const getUserMock = vi.fn();
const purchasesResultRef: { data: Array<{ world_ids: string[] }> } = {
  data: [],
};

function buildQuery(data: unknown) {
  const result = { data };
  const api: Record<string, unknown> = {};
  const chain = () => api;
  api.select = chain;
  api.eq = chain;
  api.in = chain;
  api.limit = chain;
  api.order = chain;
  api.single = () => result;
  api.then = (
    onFulfilled: (value: { data: unknown }) => unknown,
    onRejected?: (err: unknown) => unknown,
  ) => Promise.resolve(result).then(onFulfilled, onRejected);
  return api;
}

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: async () => ({
    auth: { getUser: getUserMock },
    from: (table: string) =>
      buildQuery(table === "purchases" ? purchasesResultRef.data : []),
  }),
}));

// Next metadata types aren't exercised here.
vi.mock("next", () => ({}));

import WorldsPage from "../page";
import { NewsletterModal } from "../newsletter-modal";

beforeEach(() => {
  getUserMock.mockReset();
  getUserMock.mockResolvedValue({ data: { user: null } });
  purchasesResultRef.data = [];
  submitWaitlistMock.mockReset();
  submitWaitlistMock.mockResolvedValue("done");
});

// ─── Tests ─────────────────────────────────────────────────────────────

describe("WorldsPage (Deep Orbit launch + 4 coming-soon)", () => {
  it("renders all 5 world cards with displayName", async () => {
    render(await WorldsPage());
    for (const name of [
      "Deep Orbit",
      "Neon Protocol",
      "Signal Ward",
      "Nova Canvas",
      "Terra Grid",
    ]) {
      expect(screen.getByText(name)).toBeInTheDocument();
    }
  });

  it("renders a card per world slug via test-id", async () => {
    render(await WorldsPage());
    for (const slug of [
      "deep-orbit",
      "neon-protocol",
      "signal-ward",
      "nova-canvas",
      "terra-grid",
    ]) {
      expect(screen.getByTestId(`world-card-${slug}`)).toBeInTheDocument();
    }
  });

  it("marks Deep Orbit Live and the other 4 worlds Coming soon", async () => {
    render(await WorldsPage());
    expect(screen.getByTestId("world-status-deep-orbit").textContent).toMatch(
      /live/i,
    );
    for (const slug of [
      "neon-protocol",
      "signal-ward",
      "nova-canvas",
      "terra-grid",
    ]) {
      expect(screen.getByTestId(`world-status-${slug}`).textContent).toMatch(
        /coming soon/i,
      );
    }
  });

  it("renders a signature SceneCanvas per card (5 total)", async () => {
    render(await WorldsPage());
    const scenes = screen.getAllByTestId("scene-canvas");
    expect(scenes).toHaveLength(5);
  });

  it("applies rounded-none (brutalist) to each card link", async () => {
    render(await WorldsPage());
    for (const slug of [
      "deep-orbit",
      "neon-protocol",
      "signal-ward",
      "nova-canvas",
      "terra-grid",
    ]) {
      const card = screen.getByTestId(`world-card-${slug}`);
      const link = card.querySelector("a");
      expect(link).not.toBeNull();
      expect(link!.className).toContain("rounded-none");
    }
  });

  it("CTA: launched world says Start, coming-soon worlds say Notify me", async () => {
    render(await WorldsPage());
    expect(screen.getByTestId("world-cta-deep-orbit").textContent).toContain(
      "Start",
    );
    for (const slug of [
      "neon-protocol",
      "signal-ward",
      "nova-canvas",
      "terra-grid",
    ]) {
      expect(screen.getByTestId(`world-cta-${slug}`).textContent).toContain(
        "Notify me",
      );
    }
  });

  it("CTA flips to 'Continue →' on a launched world the user owns", async () => {
    getUserMock.mockResolvedValue({ data: { user: { id: "u1" } } });
    purchasesResultRef.data = [{ world_ids: ["deep-orbit"] }];

    render(await WorldsPage());

    expect(screen.getByTestId("world-cta-deep-orbit").textContent).toContain(
      "Continue",
    );
    // Coming-soon worlds ignore ownership state, they always invite waitlist.
    expect(screen.getByTestId("world-cta-neon-protocol").textContent).toContain(
      "Notify me",
    );
  });

  it("opens the newsletter modal when 'Get updates' is clicked", async () => {
    render(await WorldsPage());
    expect(screen.queryByTestId("newsletter-modal")).toBeNull();

    fireEvent.click(screen.getByTestId("open-newsletter-modal"));

    const dialog = await screen.findByTestId("newsletter-modal");
    expect(dialog).toBeInTheDocument();
    expect(dialog).toHaveAttribute("role", "dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  it("newsletter modal sits inside an active FocusTrap", async () => {
    render(await WorldsPage());
    fireEvent.click(screen.getByTestId("open-newsletter-modal"));
    const dialog = await screen.findByTestId("newsletter-modal");
    // The FocusTrap mock sets this data attribute on its container.
    const trap = dialog.closest("[data-focus-trap]");
    expect(trap).not.toBeNull();
    expect(trap!.getAttribute("data-focus-trap")).toBe("active");
  });

  it("newsletter modal uses rounded-none (brutalist)", async () => {
    render(await WorldsPage());
    fireEvent.click(screen.getByTestId("open-newsletter-modal"));
    const dialog = await screen.findByTestId("newsletter-modal");
    expect(dialog.className).toContain("rounded-none");
  });
});

describe("NewsletterModal, interactions", () => {
  it("submits the waitlist with the entered email and the 'world-selection' source", async () => {
    const onClose = vi.fn();
    render(<NewsletterModal open={true} onClose={onClose} />);

    fireEvent.change(screen.getByTestId("newsletter-email-input"), {
      target: { value: "jane@example.com" },
    });
    fireEvent.click(screen.getByTestId("newsletter-submit"));

    await waitFor(() => {
      // The 4th arg is the explicit digest opt-in: this modal IS the
      // newsletter signup, the only call site allowed to pass it
      // (Tier 1-LEGAL waitlist consent fix, migration 050).
      expect(submitWaitlistMock).toHaveBeenCalledWith(
        "jane@example.com",
        "all",
        "world-selection",
        { subscribeToDigest: true },
      );
    });

    // Success state should render afterward.
    expect(await screen.findByTestId("newsletter-success")).toBeInTheDocument();
  });

  it("Escape key triggers onClose (FocusTrap onEscape contract)", () => {
    const onClose = vi.fn();
    render(<NewsletterModal open={true} onClose={onClose} />);
    fireEvent.keyDown(screen.getByTestId("newsletter-modal"), {
      key: "Escape",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("click on backdrop triggers onClose, click on panel does not", () => {
    const onClose = vi.fn();
    render(<NewsletterModal open={true} onClose={onClose} />);

    // Click inside the dialog panel, should NOT close.
    fireEvent.click(screen.getByTestId("newsletter-modal"));
    expect(onClose).not.toHaveBeenCalled();

    // Click on the backdrop (outside the panel), should close.
    fireEvent.click(screen.getByTestId("newsletter-modal-backdrop"));
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
