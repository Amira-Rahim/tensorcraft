import fs from "node:fs";
import path from "node:path";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { renderToStaticMarkup } from "react-dom/server";
import LearnPage from "./page";
import { INTRO_VIDEO } from "@/lib/intro-video";

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

  it("identifies Deep Orbit as the first available world", () => {
    const { container } = render(<LearnPage />);
    expect(container.textContent).toContain(
      "Deep Orbit, the first available world",
    );
    expect(container.textContent).toMatch(/Four more worlds are coming\s+soon/);
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
        name: /Machine Learning with JavaScript/,
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
      path.join(process.cwd(), "public", INTRO_VIDEO.src),
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
  it("opens the approved introduction with its captions", () => {
    const exists = vi.spyOn(fs, "existsSync").mockReturnValue(true);
    try {
      const { container } = render(<LearnPage />);
      expect(exists).toHaveBeenCalledWith(
        path.join(process.cwd(), "public", "/media/tensorcraft-intro.mp4"),
      );
      expect(
        container.querySelector(
          'video[poster="/media/tensorcraft-intro-poster.webp"]',
        ),
      ).toBeInTheDocument();
      expect(container.querySelector("video")).toHaveAttribute(
        "preload",
        "none",
      );
      expect(screen.queryByRole("dialog")).toBeNull();

      fireEvent.click(screen.getByTestId("learn-watch-trailer"));
      expect(screen.getByRole("dialog")).toHaveAccessibleName(
        "Tensorcraft introduction",
      );
      expect(screen.getByRole("dialog").querySelector("video")).toHaveAttribute(
        "src",
        "/media/tensorcraft-intro.mp4",
      );
      expect(
        screen.getByRole("dialog").querySelector('track[kind="captions"]'),
      ).toHaveAttribute("src", "/media/tensorcraft-intro.vtt");
    } finally {
      exists.mockRestore();
    }
  });

  it("gates the trailer controls on the asset actually existing", () => {
    const hasTrailer = fs.existsSync(
      path.join(process.cwd(), "public", INTRO_VIDEO.src),
    );
    const { container } = render(<LearnPage />);
    if (hasTrailer) {
      expect(screen.getByTestId("learn-watch-trailer")).toBeInTheDocument();
    } else {
      expect(screen.queryByTestId("learn-watch-trailer")).toBeNull();
    }
    // The preview video is present at rest. The lightbox still waits for
    // the visitor to choose playback with sound.
    expect(container.querySelectorAll("video")).toHaveLength(
      hasTrailer ? 1 : 0,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
  });

  it("includes the visible poster-backed video and captions in the first response", () => {
    const exists = vi.spyOn(fs, "existsSync").mockReturnValue(true);
    try {
      const html = renderToStaticMarkup(<LearnPage />);
      const doc = new DOMParser().parseFromString(html, "text/html");
      const video = doc.querySelector("video");
      expect(video?.getAttribute("src")).toBe(INTRO_VIDEO.src);
      expect(video?.getAttribute("poster")).toBe(INTRO_VIDEO.poster);
      expect(video?.getAttribute("preload")).toBe("none");
      expect(video?.hasAttribute("autoplay")).toBe(false);
      expect(video?.className).not.toMatch(/opacity-0|hidden/);
      expect(video?.closest('[hidden], [aria-hidden="true"]')).toBeNull();
      expect(
        video?.querySelector('track[kind="captions"]')?.getAttribute("src"),
      ).toBe(INTRO_VIDEO.captions);
      const data = [
        ...doc.querySelectorAll('script[type="application/ld+json"]'),
      ].map((script) => JSON.parse(script.textContent!));
      const declaredVideo = data.find(
        (item) => item["@type"] === "VideoObject",
      );
      expect(new URL(declaredVideo.contentUrl).pathname).toBe(
        video?.getAttribute("src"),
      );
      expect(new URL(declaredVideo.thumbnailUrl[0]).pathname).toBe(
        video?.getAttribute("poster"),
      );
    } finally {
      exists.mockRestore();
    }
  });

  it("renders the crew strip", () => {
    render(<LearnPage />);
    expect(screen.getByTestId("learn-crew-strip")).toBeInTheDocument();
  });
});
