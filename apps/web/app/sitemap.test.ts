import { afterEach, describe, expect, it, vi } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { resolveSitemap } from "next/dist/build/webpack/loaders/metadata/resolve-route-data";
import { getModules, getPosts, getWorldLessons } from "@tensorcraft/content";
import { LAUNCHED_WORLDS } from "@tensorcraft/shared";
import { worldSlugs } from "@tensorcraft/worlds";
import sitemap from "./sitemap";
import { buildLearnVideo } from "./learn/learn-jsonld";
import { GUIDES } from "@/lib/guides";

const SITE = "https://tensorcraft.app";

afterEach(() => {
  vi.useRealTimers();
  vi.clearAllMocks();
});

describe("public sitemap", () => {
  it("lists exactly the launched lessons readable without an account", () => {
    const expected = LAUNCHED_WORLDS.flatMap((slug) => {
      const freeModule = getModules(slug).find((module) => module.order === 1);
      expect(freeModule).toBeDefined();
      return getWorldLessons(slug)
        .filter((lesson) => lesson.moduleId === freeModule!.slug)
        .map(
          (lesson) =>
            `${SITE}/worlds/${slug}/${lesson.moduleId}/${lesson.slug}`,
        );
    });
    const listedLessons = sitemap()
      .map((entry) => entry.url)
      .filter((url) => new URL(url).pathname.split("/").length === 5);
    expect(listedLessons.sort()).toEqual(expected.sort());
    expect(listedLessons.length).toBeGreaterThan(0);
  });

  it("includes public course and article pages and excludes utility pages", () => {
    const urls = sitemap().map((entry) => entry.url);
    for (const slug of worldSlugs) {
      expect(urls).toContain(`${SITE}/worlds/${slug}`);
    }
    for (const post of getPosts()) {
      expect(urls).toContain(`${SITE}/blog/${post.slug}`);
    }
    expect(urls).toContain(`${SITE}/guides`);
    for (const guide of GUIDES) {
      expect(urls).toContain(`${SITE}${guide.path}`);
    }
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls.every((url) => url.startsWith(SITE))).toBe(true);
    expect(
      urls.some((url) =>
        /\/(auth|dashboard|settings|admin|onboarding|paywall|unsubscribe|design)(\/|$)|\/capstone$/.test(
          new URL(url).pathname,
        ),
      ),
    ).toBe(false);
  });

  it("does not claim a content update when the generation clock changes", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2030-01-01T00:00:00Z"));
    const first = sitemap();
    vi.setSystemTime(new Date("2031-01-01T00:00:00Z"));
    expect(sitemap()).toEqual(first);

    const recordedDates = new Map<string, string>([
      ...getPosts().map(
        (post) => [`${SITE}/blog/${post.slug}`, post.publishedAt] as const,
      ),
      ...GUIDES.map(
        (guide) => [`${SITE}${guide.path}`, guide.updatedAt] as const,
      ),
    ]);
    for (const entry of first) {
      const recordedDate = recordedDates.get(entry.url);
      expect(entry.lastModified).toEqual(
        recordedDate ? new Date(recordedDate) : undefined,
      );
    }
  });

  it("lists the introduction as the primary video and keeps course pages separate", () => {
    const entries = sitemap();
    const introduction = buildLearnVideo();
    expect(
      entries.find((entry) => entry.url === `${SITE}/learn`)?.videos,
    ).toEqual([
      {
        title: introduction.name,
        thumbnail_loc: introduction.thumbnailUrl[0],
        description: introduction.description,
        content_loc: introduction.contentUrl,
      },
    ]);
    for (const slug of worldSlugs) {
      const entry = entries.find(
        (item) => item.url === `${SITE}/worlds/${slug}`,
      );
      expect(entry).toBeDefined();
      expect(entry?.videos).toBeUndefined();
    }
  });

  it("emits media URLs in the real Next.js video XML", () => {
    const xml = resolveSitemap(sitemap());
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    expect(doc.querySelector("parsererror")).toBeNull();
    const videos = [
      ...doc.getElementsByTagNameNS(
        "http://www.google.com/schemas/sitemap-video/1.1",
        "video",
      ),
    ];
    expect(videos).toHaveLength(1);
    const mediaUrls = videos.map((video) => {
      const mediaUrl = video.getElementsByTagNameNS(
        "http://www.google.com/schemas/sitemap-video/1.1",
        "content_loc",
      )[0]?.textContent;
      expect(mediaUrl).toMatch(/^https:\/\/tensorcraft\.app\/media\/.+\.mp4$/);
      const localPath = path.join(
        path.dirname(fileURLToPath(import.meta.url)),
        "../public",
        new URL(mediaUrl!).pathname,
      );
      expect(fs.existsSync(localPath), localPath).toBe(true);
      return mediaUrl;
    });
    expect(mediaUrls).toEqual([buildLearnVideo().contentUrl]);
  });
});
