import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { CookieConsent } from "./cookie-consent";

// Mock localStorage to show the banner
const mockStorage: Record<string, string> = {};
Object.defineProperty(window, "localStorage", {
  value: {
    getItem: vi.fn((key: string) => mockStorage[key] ?? null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: vi.fn(),
  },
});

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe("CookieConsent snapshots", () => {
  it("matches snapshot when visible", () => {
    const { container } = render(<CookieConsent />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
