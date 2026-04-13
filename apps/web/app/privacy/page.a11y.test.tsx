import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { axe } from "vitest-axe";
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

describe("Privacy page accessibility", () => {
  it("has no accessibility violations", async () => {
    const { container } = render(<PrivacyPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
