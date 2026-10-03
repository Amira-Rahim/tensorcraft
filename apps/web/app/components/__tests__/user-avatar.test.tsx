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

  it("renders the first letter when no url, named for assistive tech", () => {
    // aria-label on a role-less div is not reliably announced (ARIA 1.2
    // prohibits it on generic elements), so the fallback is an img role.
    render(<UserAvatar url={null} name="Bob" size={36} />);
    expect(screen.getByRole("img", { name: "Bob's avatar" })).toHaveTextContent(
      "B",
    );
  });

  it("names an unnamed photo avatar 'User's avatar', never \"'s avatar\"", () => {
    render(
      <UserAvatar url="https://example.com/photo.webp" name="" size={56} />,
    );
    expect(screen.getByRole("img")).toHaveAttribute("alt", "User's avatar");
  });

  it("renders '?' when name is empty", () => {
    render(<UserAvatar name="" size={36} />);
    expect(screen.getByText("?")).toBeInTheDocument();
  });

  it("keeps both avatar variants out of PostHog autocapture", () => {
    // The avatar carries the user's name in alt / aria-label, and PostHog
    // autocapture records a clicked element's attributes. ph-no-capture
    // keeps it out of autocapture and blanks it in session replays.
    const { container, rerender } = render(
      <UserAvatar
        url="https://example.com/photo.webp"
        name="Alice"
        size={56}
      />,
    );
    expect(container.firstElementChild).toHaveClass("ph-no-capture");

    rerender(<UserAvatar url={null} name="Bob" size={36} />);
    expect(container.firstElementChild).toHaveClass("ph-no-capture");
  });

  it("exposes no name when decorative, inside an already-labelled control", () => {
    // The user menu passed the account email as the name, so aria-label
    // carried the address into PostHog when the menu button was clicked.
    const { container, rerender } = render(
      <UserAvatar url={null} name="user@example.com" size={32} decorative />,
    );
    expect(container.innerHTML).not.toContain("user@example.com");
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.firstElementChild).not.toHaveAttribute("aria-label");
    expect(screen.getByText("U")).toBeInTheDocument();

    rerender(
      <UserAvatar
        url="https://example.com/photo.webp"
        name="user@example.com"
        size={32}
        decorative
      />,
    );
    expect(container.innerHTML).not.toContain("user@example.com");
    expect(container.querySelector("img")).toHaveAttribute("alt", "");
    expect(container.querySelector("img")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  it("lets clicks on a decorative avatar reach its labelled control", () => {
    // ph-no-capture on a click target drops the whole autocapture event.
    // The avatar fills most of the user-menu button, so without this the
    // menu toggle went unmeasured; the button itself carries no identity.
    const { container, rerender } = render(
      <UserAvatar url={null} name="Bob" size={32} decorative />,
    );
    expect(container.firstElementChild).toHaveClass("pointer-events-none");

    rerender(
      <UserAvatar
        url="https://example.com/photo.webp"
        name="Bob"
        size={32}
        decorative
      />,
    );
    expect(container.firstElementChild).toHaveClass("pointer-events-none");
  });
});
