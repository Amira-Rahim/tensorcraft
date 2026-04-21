import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { CookieConsent } from "./cookie-consent";

// Mock localStorage
const mockStorage: Record<string, string> = {};
const localStorageMock = {
  getItem: vi.fn((key: string) => mockStorage[key] ?? null),
  setItem: vi.fn((key: string, value: string) => {
    mockStorage[key] = value;
  }),
  removeItem: vi.fn((key: string) => {
    delete mockStorage[key];
  }),
  clear: vi.fn(),
  length: 0,
  key: vi.fn(),
};

Object.defineProperty(window, "localStorage", { value: localStorageMock });

describe("CookieConsent", () => {
  beforeEach(() => {
    Object.keys(mockStorage).forEach((k) => delete mockStorage[k]);
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it("shows banner when no consent stored", () => {
    render(<CookieConsent />);
    expect(screen.getByText(/accept all/i)).toBeInTheDocument();
    expect(screen.getByText(/essential only/i)).toBeInTheDocument();
  });

  it("hides banner when consent already stored", () => {
    mockStorage["tc-cookie-consent"] = "accepted";
    render(<CookieConsent />);
    expect(screen.queryByText(/accept all/i)).not.toBeInTheDocument();
  });

  it("stores 'accepted' and hides on Accept All click", () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByText(/accept all/i));
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "tc-cookie-consent",
      "accepted",
    );
    expect(screen.queryByText(/accept all/i)).not.toBeInTheDocument();
  });

  it("stores 'declined' and hides on Essential Only click", () => {
    render(<CookieConsent />);
    fireEvent.click(screen.getByText(/essential only/i));
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      "tc-cookie-consent",
      "declined",
    );
    expect(screen.queryByText(/essential only/i)).not.toBeInTheDocument();
  });

  it("links to privacy policy", () => {
    render(<CookieConsent />);
    const link = screen.getByText(/privacy policy/i);
    expect(link).toHaveAttribute("href", "/privacy");
  });

  it("renders a brutalist card (rounded-none + brutalist-shadow)", () => {
    const { container } = render(<CookieConsent />);
    const card = container.querySelector('[data-testid="cookie-consent-card"]');
    expect(card).not.toBeNull();
    expect(card?.className).toMatch(/rounded-none/);
    expect(card?.className).toMatch(/brutalist-shadow/);
    expect(card?.className).toMatch(/border/);
  });

  it("buttons use brutalist square-edge style (rounded-none, font-mono, type=button)", () => {
    render(<CookieConsent />);
    const accept = screen.getByRole("button", { name: /accept all/i });
    const decline = screen.getByRole("button", { name: /essential only/i });
    for (const btn of [accept, decline]) {
      expect(btn.className).toMatch(/rounded-none/);
      expect(btn.className).toMatch(/font-mono/);
      expect(btn).toHaveAttribute("type", "button");
    }
  });

  it("banner is announced as region with aria-label", () => {
    const { container } = render(<CookieConsent />);
    const region = container.querySelector('[role="region"]');
    expect(region).toHaveAttribute("aria-label", "Cookie consent");
  });

  it("has no `outline-none` / `outline: none` on any descendant", () => {
    const { container } = render(<CookieConsent />);
    expect(container.innerHTML).not.toMatch(/outline-none/);
    expect(container.innerHTML).not.toMatch(/outline:\s*none/);
  });

  it("has no accessibility violations", async () => {
    const { axe } = await import("vitest-axe");
    const { container } = render(<CookieConsent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
