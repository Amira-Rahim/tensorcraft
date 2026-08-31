import fs from "node:fs";
import path from "node:path";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import LearnPage from "./page";

// Stub next/link so render works without the Next router.
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

const FREE_LESSON = "/worlds/deep-orbit/foundations/introduction-to-tensors";
const COMING_SOON_SLUGS = [
  "neon-protocol",
  "signal-ward",
  "nova-canvas",
  "terra-grid",
];

/* Video-first page (owner ruling 2026-08-27): the trailer is the page.
   These tests pin the invariants that survived every redesign plus the
   video-era additions. */

describe("LearnPage world links", () => {
  it("links the launched world by name", () => {
    render(<LearnPage />);
    expect(screen.getByRole("link", { name: "Deep Orbit" })).toHaveAttribute(
      "href",
      "/worlds/deep-orbit",
    );
  });

  it("never links coming-soon worlds", () => {
    // The sections listing them are gone; the invariant that remains is
    // that no link to an unlaunched world exists anywhere on the page.
    const { container } = render(<LearnPage />);
    for (const slug of COMING_SOON_SLUGS) {
      expect(container.querySelector(`a[href="/worlds/${slug}"]`)).toBeNull();
    }
  });
});

describe("LearnPage free-lesson CTAs", () => {
  it("renders the hero and footer CTAs to the free lesson", () => {
    render(<LearnPage />);
    for (const id of ["learn-cta-hero", "learn-cta-footer"]) {
      expect(screen.getByTestId(id)).toHaveAttribute("href", FREE_LESSON);
    }
  });
});

describe("LearnPage SEO payload", () => {
  it("keeps the query-cluster H1", () => {
    render(<LearnPage />);
    expect(
      screen.getByRole("heading", {
        level: 1,
        name: /Learn Machine Learning with JavaScript/,
      }),
    ).toBeInTheDocument();
  });

  it("no longer renders the About this video transcript block (removed 2026-08-31)", () => {
    // Owner request 2026-08-31. The intro paragraphs are now the page's
    // whole indexable text layer; the VideoObject JSON-LD and sitemap
    // video entry are untouched.
    const { container } = render(<LearnPage />);
    expect(screen.queryByText("About this video")).toBeNull();
    expect(container.textContent).not.toContain("where the analogy breaks");
  });

  it("emits BreadcrumbList always, VideoObject only with the trailer", () => {
    const hasTrailer = fs.existsSync(
      path.join(process.cwd(), "public/media/learn-trailer.mp4"),
    );
    const { container } = render(<LearnPage />);
    const types = Array.from(
      container.querySelectorAll('script[type="application/ld+json"]'),
    ).map((script) => JSON.parse(script.innerHTML)["@type"]);
    expect(types).toContain("BreadcrumbList");
    expect(types.includes("VideoObject")).toBe(hasTrailer);
  });
});

describe("LearnPage trailer gate", () => {
  it("gates the trailer controls on the asset actually existing", () => {
    const hasTrailer = fs.existsSync(
      path.join(process.cwd(), "public/media/learn-trailer.mp4"),
    );
    const { container } = render(<LearnPage />);
    if (hasTrailer) {
      expect(screen.getByTestId("learn-watch-trailer")).toBeInTheDocument();
    } else {
      expect(screen.queryByTestId("learn-watch-trailer")).toBeNull();
    }
    // The lightbox video mounts only when opened; never at rest.
    expect(container.querySelector("video")).toBeNull();
  });

  it("renders the crew strip", () => {
    render(<LearnPage />);
    expect(screen.getByTestId("learn-crew-strip")).toBeInTheDocument();
  });
});
