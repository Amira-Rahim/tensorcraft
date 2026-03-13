import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import PrivacyPage from "./page";

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

describe("Privacy page snapshots", () => {
  it("matches snapshot", () => {
    const { container } = render(<PrivacyPage />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
