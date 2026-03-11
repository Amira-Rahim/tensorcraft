import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { SiteFooter } from "./site-footer";

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

describe("SiteFooter snapshots", () => {
  it("matches snapshot", () => {
    const { container } = render(<SiteFooter />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
