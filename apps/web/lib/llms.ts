import { PRICING, LAUNCHED_WORLDS, isLaunched } from "@tensorcraft/shared";
import { worlds, worldSlugs } from "@tensorcraft/worlds";
import {
  exercises,
  getModules,
  getModuleLessons,
  getWorldLessons,
} from "@tensorcraft/content";
import { GUIDES } from "./guides";
import { SITE_URL } from "./site-identity";

/** Optional reader documentation. This file does not control crawler access. */
export function buildLlmsText(): string {
  const launched = LAUNCHED_WORLDS.map((slug) => {
    const world = worlds[slug];
    const modules = getModules(slug);
    const lessons = getWorldLessons(slug);
    const lessonSlugs = new Set(lessons.map((lesson) => lesson.slug));
    const freeModule = modules.find((module) => module.order === 1);
    const freeLessons = freeModule
      ? getModuleLessons(slug, freeModule.slug)
      : [];
    const exerciseCount = exercises.filter((exercise) =>
      lessonSlugs.has(exercise.lessonSlug),
    ).length;
    return [
      `### ${world.displayName}`,
      "",
      `- Course: [${world.displayName}](${SITE_URL}/worlds/${slug})`,
      `- Scope: ${modules.length} modules, ${lessons.length} lessons, ${exerciseCount} coding exercises.`,
      `- Free preview: the first module has ${freeLessons.length} lessons and requires no account.`,
      "- Full course access requires a one-time purchase. Later modules unlock as you complete earlier work.",
      ...freeLessons.map(
        (lesson) =>
          `- Free lesson: [${lesson.title}](${SITE_URL}/worlds/${slug}/${lesson.moduleId}/${lesson.slug})`,
      ),
      "",
    ].join("\n");
  });
  const comingSoon = worldSlugs.filter((slug) => !isLaunched(slug));

  return [
    "# Tensorcraft",
    "",
    "> Tensorcraft teaches machine learning to JavaScript engineers through interactive stories and browser exercises. Deep Orbit is the first available course.",
    "",
    "## Teaching approach",
    "",
    "Learners inspect fictional sensor readings, write JavaScript, train small TensorFlow.js models, and compare results. The course connects ML concepts to familiar JavaScript concepts and explains the limits of each comparison. Some exercises use supplied models or controlled outputs. Those examples do not establish real scientific findings or external model accuracy.",
    "",
    "Lessons and embedded exercises run in the browser. The independent project uses a local browser app.",
    "",
    "## Available courses and free lessons",
    "",
    ...launched,
    "## Pricing and access",
    "",
    PRICING.single.price < PRICING.single.regularPrice
      ? `A single available course costs USD ${PRICING.single.price} at the introductory price. The regular price is USD ${PRICING.single.regularPrice}. One payment gives lifetime access to that world. No offer deadline is scheduled.`
      : `A single available course costs USD ${PRICING.single.price}. One payment gives lifetime access to that world.`,
    "",
    `- [Current pricing and purchase terms](${SITE_URL}/pricing)`,
    `- [Course catalog](${SITE_URL}/worlds)`,
    "",
    "## Planned courses",
    "",
    ...comingSoon.map(
      (slug) =>
        `- [${worlds[slug].displayName}](${SITE_URL}/worlds/${slug}): ${worlds[slug].specialization}. Coming soon. Lessons and purchases are not available.`,
    ),
    "",
    "## Public worked guides",
    "",
    `- [JavaScript machine learning guides](${SITE_URL}/guides)`,
    ...GUIDES.map(
      (guide) =>
        `- [${guide.title}](${SITE_URL}${guide.path}): ${guide.description}`,
    ),
    "",
    "## Publisher and policies",
    "",
    `- [About Tensorcraft](${SITE_URL}/about): built by a group of JavaScript engineers.`,
    `- [Privacy](${SITE_URL}/privacy)`,
    `- [Terms](${SITE_URL}/terms)`,
    "- Contact: support@tensorcraft.app",
    "",
    "This optional summary links to the public source pages. The pricing page describes the current offer. Crawler access follows robots.txt and page-level indexing directives.",
    "",
  ].join("\n");
}
