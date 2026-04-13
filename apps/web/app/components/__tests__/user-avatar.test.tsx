import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { UserAvatar } from "../user-avatar";

describe("UserAvatar", () => {
  it("renders an img when url is provided", () => {
    render(
      <UserAvatar
        url="https://example.com/photo.webp"
        name="Alice"
        size={56}
      />,
    );
    const img = screen.getByRole("img", { name: /alice/i });
    expect(img).toHaveAttribute("src", "https://example.com/photo.webp");
  });

  it("renders the first letter when no url", () => {
    render(<UserAvatar url={null} name="Bob" size={36} />);
    expect(screen.getByText("B")).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("renders '?' when name is empty", () => {
    render(<UserAvatar name="" size={36} />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });
});
