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

  it("has no accessibility violations", async () => {
    const { axe } = await import("vitest-axe");
    const { container } = render(<CookieConsent />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
