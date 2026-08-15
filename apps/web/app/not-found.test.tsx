import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import NotFound from "./not-found";

// Stub next/link, not-found.tsx uses it for its two CTAs.
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

describe("NotFound", () => {
  it("shows the adrift plate above the card", () => {
    render(<NotFound />);
    expect(screen.getByTestId("art-plate").getAttribute("src")).toBe(
      "/locations/deep-orbit/adrift.webp",
    );
  });

  it("keeps the heading and both CTAs", () => {
    render(<NotFound />);
    expect(screen.getByText("Page not found")).toBeInTheDocument();
    expect(screen.getByText("Browse worlds")).toBeInTheDocument();
    expect(screen.getByText("Go home")).toBeInTheDocument();
  });
});
