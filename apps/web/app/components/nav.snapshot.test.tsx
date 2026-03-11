import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { Nav } from "./nav";

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

describe("Nav snapshots", () => {
  it("matches snapshot", () => {
    const { container } = render(<Nav />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
