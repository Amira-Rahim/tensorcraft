import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  Children,
  isValidElement,
  type ComponentProps,
  type ReactNode,
} from "react";
import { renderToStaticMarkup } from "react-dom/server";
import {
  getLessonTotalMinutes,
  getModuleLessons,
  getModules,
  getWorldLessons,
} from "@tensorcraft/content";
import { COMING_SOON_WORLDS, PRICING } from "@tensorcraft/shared";
import { worlds } from "@tensorcraft/worlds";
import WorldDetailPage, { generateMetadata } from "../page";
import { ModuleMapClient } from "../module-map-client";

const mocks = vi.hoisted(() => ({
  getUser: vi.fn(),
  purchase: vi.fn(),
  progress: vi.fn(),
  preference: vi.fn(),
}));

vi.mock("@/lib/supabase/server", () => ({
  getSupabaseServerClient: async () => ({ auth: { getUser: mocks.getUser } }),
}));
vi.mock("@/lib/progress", () => ({
  hasWorldPurchase: mocks.purchase,
  getUserProgress: mocks.progress,
}));
vi.mock("@/lib/learning-route-server", () => ({
  getLearningRoutePreference: mocks.preference,
}));

// Canvas, portraits and video do not contribute to the syllabus contract.
// Keep the real module map and project preview in the server-rendered page.
vi.mock("../world-scene-backdrop", () => ({ WorldSceneBackdrop: () => null }));
vi.mock("../world-cast", () => ({ WorldCast: () => null }));
vi.mock("../world-trailer-panel", () => ({ WorldTrailerPanel: () => null }));

const slug = "deep-orbit";
const modules = getModules(slug);
const lessons = getWorldLessons(slug);
const freeModule = modules.find((module) => module.order === 1)!;
const freeLessons = getModuleLessons(slug, freeModule.slug);
const paidLessons = lessons.filter(
  (lesson) => lesson.moduleId !== freeModule.slug,
);
const totalMinutes = lessons.reduce(
  (sum, lesson) => sum + getLessonTotalMinutes(lesson),
  0,
);
const hours = Math.round(totalMinutes / 60);

function text(element: Element) {
  return element.textContent!.replace(/\s+/g, " ").trim();
}

async function initialDocument() {
  const page = await WorldDetailPage({ params: Promise.resolve({ slug }) });
  return new DOMParser().parseFromString(
    renderToStaticMarkup(page),
    "text/html",
  );
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.getUser.mockResolvedValue({ data: { user: null } });
  mocks.purchase.mockResolvedValue(false);
  mocks.progress.mockResolvedValue([]);
  mocks.preference.mockResolvedValue({ route: null, unavailable: false });
});

describe("anonymous public course syllabus", () => {
  it("includes all real lesson titles in module and lesson order before hydration", async () => {
    const doc = await initialDocument();
    expect(modules).toHaveLength(11);
    expect(lessons).toHaveLength(56);
    const rows = [
      ...doc.querySelectorAll(
        "[data-testid='module-map'] details[data-module]",
      ),
    ];
    expect(rows.map((row) => row.getAttribute("data-module"))).toEqual(
      modules.map((module) => module.slug),
    );
    expect(
      doc.querySelectorAll("[data-testid='lesson-list'] > li"),
    ).toHaveLength(lessons.length);

    for (const [index, module] of modules.entries()) {
      const row = rows[index];
      const moduleLessons = getModuleLessons(slug, module.slug);
      const summary = row.querySelector("summary")!;
      expect(text(summary)).toContain(module.title);
      const cards = [
        ...row.querySelectorAll("[data-testid='lesson-list'] > li"),
      ];
      expect(cards).toHaveLength(moduleLessons.length);
      for (const [lessonIndex, lesson] of moduleLessons.entries()) {
        expect(text(cards[lessonIndex])).toContain(lesson.title);
      }

      if (module.order === 1) {
        expect(row.hasAttribute("open")).toBe(true);
        expect(
          summary
            .querySelector("[role='progressbar']")!
            .getAttribute("aria-label"),
        ).toBe(`0 of ${moduleLessons.length} lessons complete`);
      } else {
        expect(row.hasAttribute("open")).toBe(false);
        expect(row.getAttribute("data-status")).toBe("locked");
        expect(text(summary)).toContain(
          `Paid module. ${moduleLessons.length} lessons.`,
        );
      }
    }
  });

  it("offers real free lesson links without exposing paid lesson routes or bodies", async () => {
    const doc = await initialDocument();
    const lessonLinks = [
      ...doc.querySelectorAll("[data-testid='lesson-list'] a"),
    ];
    expect(lessonLinks.map((link) => link.getAttribute("href"))).toEqual(
      freeLessons.map(
        (lesson) => `/worlds/${slug}/${freeModule.slug}/${lesson.slug}`,
      ),
    );
    expect(freeLessons).toHaveLength(5);
    const linkedPaths = [...doc.querySelectorAll("a[href]")].map(
      (link) =>
        new URL(link.getAttribute("href")!, "https://tensorcraft.app").pathname,
    );
    for (const lesson of paidLessons) {
      expect(linkedPaths).not.toContain(
        `/worlds/${slug}/${lesson.moduleId}/${lesson.slug}`,
      );
      expect(text(doc.body)).not.toContain(lesson.context.narrative);
    }
    expect(
      doc.querySelector("[data-testid='continue-cta']")!.getAttribute("href"),
    ).toBe(`/worlds/${slug}/${freeModule.slug}/${freeLessons[0].slug}`);
    expect(doc.querySelector('a[href^="/auth"]')).toBeNull();
    expect(doc.querySelector("input[type='password']")).toBeNull();
    expect(mocks.getUser).toHaveBeenCalledOnce();
    expect(mocks.preference).toHaveBeenCalledWith(expect.anything(), null);
    expect(mocks.purchase).not.toHaveBeenCalled();
    expect(mocks.progress).not.toHaveBeenCalled();
  });

  it("sends syllabus metadata to the client map without paid lesson bodies", async () => {
    const pending: ReactNode[] = [
      await WorldDetailPage({ params: Promise.resolve({ slug }) }),
    ];
    let mapProps: ComponentProps<typeof ModuleMapClient> | undefined;
    while (pending.length) {
      const element = pending.pop();
      if (!isValidElement<{ children?: ReactNode }>(element)) continue;
      if (element.type === ModuleMapClient) {
        mapProps = element.props as ComponentProps<typeof ModuleMapClient>;
        break;
      }
      pending.push(...Children.toArray(element.props.children));
    }
    expect(mapProps).toBeDefined();
    const mapLessons = mapProps!.modules.flatMap((module) => module.lessons);
    expect(mapLessons.map((lesson) => lesson.title)).toEqual(
      lessons.map((lesson) => lesson.title),
    );
    for (const lesson of mapLessons) {
      for (const field of [
        "body",
        "context",
        "concept",
        "consequence",
        "scene",
        "hints",
        "exercises",
      ]) {
        expect(lesson).not.toHaveProperty(field);
      }
    }
  });

  it("explains prerequisites, scope, estimates and the current offer beside a usable demo link", async () => {
    const doc = await initialDocument();
    const overview = doc.querySelector(
      "section[aria-labelledby='course-syllabus-title']",
    )!;
    expect(text(overview)).toContain(
      "JavaScript functions, arrays, objects, modules and async code",
    );
    expect(text(overview)).toContain(
      "ML foundations through intermediate and advanced topics",
    );
    expect(text(overview)).toContain(
      "Training and evaluation use TensorFlow.js",
    );
    expect(text(overview)).toContain(
      "ONNX Runtime Web, Transformers.js and WebGPU",
    );
    expect(text(overview)).toContain("controlled simulations");
    expect(text(overview)).toContain(
      `${lessons.length} lesson titles across ${modules.length} modules`,
    );
    expect(text(overview)).toContain(
      `about ${hours} hours for lessons and exercises`,
    );
    expect(text(overview)).toContain("These are our estimates.");
    expect(text(overview)).toContain("The first module is free.");
    expect(text(overview)).toContain(
      `The full course costs $${PRICING.single.price}`,
    );
    if (PRICING.single.price < PRICING.single.regularPrice) {
      expect(text(overview)).toContain(
        `The regular price is $${PRICING.single.regularPrice}.`,
      );
    }
    expect(overview.querySelector('a[href="/pricing"]')).not.toBeNull();
    expect(text(overview)).toContain(
      "One payment gives lifetime access to Deep Orbit.",
    );
    const demo = doc.querySelector(
      'a[href="/guides/browser-machine-learning-project"]',
    )!;
    expect(text(demo)).toBe("Try the browser training example");
    expect(text(demo.closest("section")!)).toContain(
      "This is a demonstration you can inspect before starting your own project.",
    );
    expect(text(demo.closest("section")!)).toContain(
      "4–8 hours for the project",
    );
  });

  it("matches Course schema and launched metadata to the visible course scope and offer", async () => {
    const doc = await initialDocument();
    const course = [
      ...doc.querySelectorAll('script[type="application/ld+json"]'),
    ]
      .map((script) => JSON.parse(script.textContent!))
      .find((data) => data["@type"] === "Course");
    expect(course).toBeDefined();
    const metadata = await generateMetadata({
      params: Promise.resolve({ slug }),
    });
    expect(metadata.title).toBe(
      "Deep Orbit: Machine Learning in JavaScript, Tensorcraft",
    );
    expect(metadata.openGraph?.title).toBe(metadata.title);
    expect(metadata.twitter?.title).toBe(metadata.title);
    expect(metadata.alternates?.canonical).toBe(course.url);
    expect(metadata.openGraph?.url).toBe(course.url);
    expect(text(doc.querySelector("h1")!)).toBe(worlds[slug].displayName);
    expect(text(doc.querySelector("header")!)).toContain(
      "Learn machine learning through JavaScript and TensorFlow.js.",
    );
    expect(course.name).toBe(
      `${worlds[slug].displayName}: Machine Learning in JavaScript`,
    );
    expect(metadata.title).toBe(`${course.name}, Tensorcraft`);
    expect(course.educationalLevel).toBe(
      "ML foundations through intermediate and advanced topics",
    );
    expect(
      text(
        doc.querySelector("section[aria-labelledby='course-syllabus-title']")!,
      ),
    ).toContain(course.educationalLevel);
    expect(course.hasCourseInstance.courseWorkload).toBe(`PT${hours}H`);
    expect(course.offers).toMatchObject({
      category: "Paid",
      price: String(PRICING.single.price),
      priceCurrency: "USD",
      url: "https://tensorcraft.app/pricing",
    });
  });
});

describe("unreleased world metadata", () => {
  it.each(COMING_SOON_WORLDS)(
    "keeps the coming-soon category for %s",
    async (worldSlug) => {
      const world = worlds[worldSlug];
      const metadata = await generateMetadata({
        params: Promise.resolve({ slug: worldSlug }),
      });
      const title = `${world.displayName}: Coming Soon, Tensorcraft`;
      expect(metadata.title).toBe(title);
      expect(metadata.openGraph?.title).toBe(title);
      expect(metadata.twitter?.title).toBe(title);
      expect(metadata.description).toBe(
        `${world.displayName} is a planned machine learning course in JavaScript: ${world.specialization.toLowerCase()}, taught in the browser with TensorFlow.js. Not released yet. Join the waitlist.`,
      );
      expect(metadata.alternates?.canonical).toBe(
        `https://tensorcraft.app/worlds/${worldSlug}`,
      );
      expect(mocks.getUser).not.toHaveBeenCalled();
    },
  );
});
