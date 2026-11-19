import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import type { ReactElement } from "react";

/**
 * Public certificate share page. The page fetches its ShareRecord from the
 * API; we stub global fetch with a canned payload and render the RSC to
 * static markup, the same pattern as purchase-success/page.test.tsx.
 */

vi.mock("@/lib/api-url", () => ({ getApiUrl: () => "http://api.test" }));

const RECORD = {
  id: "12345678-1234-4123-8123-123456789abc",
  world_id: "deep-orbit",
  issued_at: "2026-08-01T00:00:00.000Z",
  cert_hash: "abcdef1234567890abcdef1234567890",
  user_display_name: "Amira Salah",
  user_avatar_url: "https://cdn.example.test/avatar.png",
};

function stubFetch(payload: unknown, status = 200): void {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: status >= 200 && status < 300,
      status,
      json: async () => payload,
    })),
  );
}

async function renderPage(id: string = RECORD.id): Promise<string> {
  const { default: CertificateSharePage } = await import("./page");
  const element = (await CertificateSharePage({
    params: Promise.resolve({ id }),
  })) as ReactElement;
  return renderToStaticMarkup(element);
}

async function metadata(id: string = RECORD.id) {
  const { generateMetadata } = await import("./page");
  return generateMetadata({ params: Promise.resolve({ id }) });
}

describe("certificates/[id] share page", () => {
  beforeEach(() => {
    vi.unstubAllGlobals();
  });

  it("renders the learner's avatar beside the awarded-to name", async () => {
    stubFetch(RECORD);
    const html = await renderPage();
    expect(html).toContain(RECORD.user_avatar_url);
    expect(html).toContain("Amira Salah");
  });

  it("keeps the learner's name and avatar out of PostHog replays", async () => {
    // A third party's name and avatar URL would otherwise sit in the
    // session replay of every consenting visitor who opens the link.
    stubFetch(RECORD);
    const doc = new DOMParser().parseFromString(
      await renderPage(),
      "text/html",
    );
    const name = Array.from(doc.querySelectorAll("p")).find(
      (p) => p.textContent === "Amira Salah",
    );
    const block = name?.closest(".ph-no-capture");
    expect(block).not.toBeNull();
    expect(
      block?.querySelector('[data-testid^="character-avatar"]'),
    ).not.toBeNull();
  });

  it("falls back to the initials monogram when there is no avatar URL", async () => {
    stubFetch({ ...RECORD, user_avatar_url: null });
    const html = await renderPage();
    expect(html).toContain("character-avatar-placeholder");
    expect(html).toContain("AS");
    expect(html).not.toContain("character-avatar-img");
  });

  it("crowns a deep-orbit certificate with the seal and the full patch strip", async () => {
    stubFetch(RECORD);
    const html = await renderPage();
    expect(html).toContain("/seals/deep-orbit.webp");
    // A certificate exists only when every module is complete, so the
    // strip carries all eleven patches.
    const patchCount = (html.match(/\/patches\/deep-orbit\//g) ?? []).length;
    expect(patchCount).toBe(11);
  });

  it("keeps the text-only card for a world without patch art", async () => {
    stubFetch({ ...RECORD, world_id: "neon-protocol" });
    const html = await renderPage();
    expect(html).not.toContain("/seals/");
    expect(html).not.toContain("/patches/");
  });

  it("keeps the document title generic while preserving the intentional share preview", async () => {
    stubFetch(RECORD);
    const result = await metadata();
    expect(result.title).toBe("Certificate of completion, Tensorcraft");
    expect(result.title).not.toContain(RECORD.user_display_name);
    expect(result.robots).toEqual({ index: false, follow: true });
    expect(result.alternates?.canonical).toBe(
      `https://tensorcraft.app/certificates/${RECORD.id}`,
    );
    expect(result.openGraph?.title).toBe(
      "Amira Salah completed Deep Orbit, Tensorcraft",
    );
    expect(result.twitter?.title).toEqual(result.openGraph?.title);
    expect(result.twitter).toMatchObject({ card: "summary_large_image" });
    const images = result.openGraph?.images as string[];
    const image = new URL(images[0], "https://tensorcraft.app");
    expect(image.searchParams.get("learner")).toBe(RECORD.user_display_name);
    expect(image.searchParams.get("world")).toBe(RECORD.world_id);
    expect(result.twitter?.images).toEqual(images);
  });

  it("uses a generic title and share fallback when the learner has no display name", async () => {
    stubFetch({ ...RECORD, user_display_name: null });
    const result = await metadata();
    expect(result.title).toBe("Certificate of completion, Tensorcraft");
    expect(result.openGraph?.title).toBe(
      "A Tensorcraft learner completed Deep Orbit, Tensorcraft",
    );
    expect(result.twitter?.title).toEqual(result.openGraph?.title);
  });

  it("handles an unrecognized world without using record values in the document title", async () => {
    stubFetch({ ...RECORD, world_id: "retired-world" });
    const result = await metadata();
    expect(result.title).toBe("Certificate of completion, Tensorcraft");
    expect(result.openGraph?.title).toBe(
      "Amira Salah completed retired-world, Tensorcraft",
    );
    expect(result.robots).toEqual({ index: false, follow: true });
  });

  it("keeps missing and malformed certificate metadata generic and out of search", async () => {
    stubFetch(null, 404);
    expect(await metadata()).toEqual({
      title: "Certificate of completion, Tensorcraft",
      robots: { index: false, follow: true },
    });
    vi.mocked(fetch).mockClear();
    expect(await metadata("not-a-certificate-id")).toEqual({
      title: "Certificate of completion, Tensorcraft",
      robots: { index: false, follow: true },
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
