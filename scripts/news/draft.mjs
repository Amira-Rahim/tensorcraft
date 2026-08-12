#!/usr/bin/env node
/**
 * Blog draft generator.
 *
 * For every shortlisted news_item in the given week, generates an MDX file
 * at packages/content/content/blog/YYYY-Www-<slug>.mdx and a weekly digest
 * post that aggregates the items. Marks each news_item as published with
 * the resulting blog slug.
 *
 * Run:
 *   pnpm tsx scripts/news/draft.mjs --week=2026-W18           # write to disk + DB
 *   pnpm tsx scripts/news/draft.mjs --week=2026-W18 --dry-run # print to stdout
 *
 * Required env:
 *   ANTHROPIC_API_KEY            — for the draft call
 *   SUPABASE_URL                 — to load shortlisted items
 *   SUPABASE_SERVICE_ROLE_KEY    — same
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..", "..");
const blogDir = resolve(repoRoot, "packages/content/content/blog");

const argv = parseArgs(process.argv.slice(2));
const DRY_RUN = !!argv["dry-run"];
const WEEK = argv.week;
const DRAFT_MODEL = "claude-sonnet-4-6";

if (!WEEK) {
  console.error("[draft] pass --week=YYYY-Www");
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* Drafting                                                             */
/* ------------------------------------------------------------------ */

function buildItemPrompt(item) {
  const lessons = (item.matched_lessons || [])
    .map(
      (m, i) =>
        `${i + 1}. ${m.title}  →  /learn/${m.worldId}/${m.moduleId}/${m.slug}${m.rationale ? `\n   rationale: ${m.rationale}` : ""}`,
    )
    .join("\n");

  const system = `You are a writer for The Bridge — Tensorcraft's blog. Voice rules:

- Practitioner-honest, not hype. Never use "perfect", "amazing", "must-read", "game-changing", "revolutionary", or marketing superlatives.
- Frontend-engineer perspective. Anchor every concept to something FE devs already know (DOM, typed arrays, requestAnimationFrame, fetch, web workers).
- Use FE↔ML bridges when relevant (e.g. "WebGPU is to inference what requestAnimationFrame is to paint").
- Sentences are short. Paragraphs are short. No filler.
- Don't pad. If a section has nothing real to say, omit it.

Structure (in this order, no extra headings):

## What shipped
1-2 sentences summarizing the news, grounded in concrete details (version numbers, feature names, what's now possible).

## Why it matters for FE engineers
1 paragraph (3-5 sentences) explaining the practical impact. Use a bridge to something FE devs know. Be specific about what changes for someone shipping browser ML today.

## Where we teach this
1-2 sentences pointing at the primary lesson with a markdown link. Brief honest description of what they'll learn there. End with one short line: who this is for.

Output: MDX body only, starting with "## What shipped". No frontmatter, no preamble, no closing remarks.`;

  const user = `NEWS ITEM
Source: ${item.source}
Title: ${item.title}
URL: ${item.url}

Summary:
${(item.summary || "").slice(0, 1500)}

MATCHED LESSONS (in priority order)
${lessons || "(none)"}

Write the MDX body for the post.`;

  return { system, user };
}

async function callAnthropic({ system, user, maxTokens = 1024 }) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();
  const response = await client.messages.create({
    model: DRAFT_MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  const block = response.content.find((b) => b.type === "text");
  return block ? block.text : "";
}

function slugifyTitle(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function frontmatter(item, slug, body) {
  const worldSlug = item.matched_lessons?.[0]?.worldId;
  const primaryLessonSlug = item.matched_lessons?.[0]?.slug;
  const sourceLabel = item.source.replace(/^(rss|github):/, "").replace(/\/.*$/, "");
  const summaryLine = body
    .split("\n")
    .find((l) => l.trim() && !l.startsWith("#"))
    ?.slice(0, 240) ?? item.title;

  const matchedYaml = (item.matched_lessons || [])
    .slice(0, 3)
    .map(
      (m) => `  - worldId: ${m.worldId}
    moduleId: ${m.moduleId}
    slug: ${m.slug}
    title: ${JSON.stringify(m.title)}${m.rationale ? `\n    rationale: ${JSON.stringify(m.rationale)}` : ""}`,
    )
    .join("\n");

  return `---
slug: ${slug}
title: ${JSON.stringify(item.title)}
publishedAt: ${new Date().toISOString().slice(0, 10)}
weekIso: ${WEEK}
sourceUrl: ${item.url}
sourceLabel: ${sourceLabel}
${primaryLessonSlug ? `primaryLessonSlug: ${primaryLessonSlug}\n` : ""}${worldSlug ? `worldSlug: ${worldSlug}\n` : ""}summary: ${JSON.stringify(summaryLine.trim())}
matchedLessons:
${matchedYaml}
tags:
  - news
${worldSlug ? `  - ${worldSlug}\n` : ""}---

${body}
`;
}

function buildDigestPrompt(items) {
  const lines = items
    .map(
      (it, i) =>
        `${i + 1}. ${it.title}\n   source: ${it.source}\n   summary: ${(it.summary || "").slice(0, 300)}\n   teaches: ${(it.matched_lessons?.[0]?.title) || "(none)"}`,
    )
    .join("\n\n");

  const system = `Same voice rules as before: practitioner-honest, frontend-engineer perspective, no hype words, short sentences.

Write the MDX body for a weekly digest covering ${items.length} items. Structure:

## This week
1 short paragraph (2-3 sentences) on the through-line — what world connects these items (e.g. "WebGPU keeps shipping", "transformers.js is doing what tfjs once promised"). If there is no through-line, say so honestly.

## Items
For each item, one bullet:
- **[Title]** — 1 sentence on what shipped, then "Teaches: [Lesson Title]" with no link.

## Where to start
1-2 sentences pointing the reader at the top item to read first this week. Be specific about who it's for.

Output: MDX body only, starting with "## This week". No frontmatter.`;

  return { system, user: `ITEMS\n\n${lines}\n\nWrite the digest body.` };
}

/* ------------------------------------------------------------------ */
/* Pipeline                                                             */
/* ------------------------------------------------------------------ */

async function loadShortlisted(week) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
  }
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data, error } = await supabase
    .from("news_items")
    .select("*")
    .eq("status", "shortlisted")
    .eq("week_iso", week);
  if (error) throw error;
  return { supabase, items: data || [] };
}

async function main() {
  if (!existsSync(blogDir)) mkdirSync(blogDir, { recursive: true });
  const { supabase, items } = await loadShortlisted(WEEK);
  console.log(`[draft] ${items.length} shortlisted items for ${WEEK}`);
  if (items.length === 0) return;

  const generated = [];

  for (const item of items) {
    const { system, user } = buildItemPrompt(item);
    let body;
    try {
      body = await callAnthropic({ system, user });
    } catch (err) {
      console.error(`[draft] LLM call failed for ${item.url}: ${err.message}`);
      continue;
    }

    const slug = `${WEEK.toLowerCase()}-${slugifyTitle(item.title)}`;
    const mdx = frontmatter(item, slug, body.trim());
    const filePath = resolve(blogDir, `${slug}.mdx`);

    if (DRY_RUN) {
      console.log(`\n--- ${filePath} ---\n${mdx}\n`);
    } else {
      writeFileSync(filePath, mdx);
      console.log(`[draft] wrote ${filePath}`);
      const { error } = await supabase
        .from("news_items")
        .update({ status: "published", published_blog_slug: slug })
        .eq("id", item.id);
      if (error) console.error(`[draft] mark-published failed: ${error.message}`);
    }
    generated.push({ item, slug });
  }

  // Weekly digest
  if (generated.length > 0) {
    const digestSlug = `${WEEK.toLowerCase()}-digest`;
    const { system, user } = buildDigestPrompt(items);
    let digestBody;
    try {
      digestBody = await callAnthropic({ system, user, maxTokens: 1500 });
    } catch (err) {
      console.error(`[draft] digest LLM call failed: ${err.message}`);
      return;
    }
    const summary = `Weekly browser-ML digest covering ${generated.length} items.`;
    const matchedYaml = generated
      .slice(0, 5)
      .map(({ item }) => {
        const m = item.matched_lessons?.[0];
        if (!m) return "";
        return `  - worldId: ${m.worldId}
    moduleId: ${m.moduleId}
    slug: ${m.slug}
    title: ${JSON.stringify(m.title)}`;
      })
      .filter(Boolean)
      .join("\n");
    const digestMdx = `---
slug: ${digestSlug}
title: ${JSON.stringify(`The Bridge: ${WEEK}`)}
publishedAt: ${new Date().toISOString().slice(0, 10)}
weekIso: ${WEEK}
summary: ${JSON.stringify(summary)}
matchedLessons:
${matchedYaml}
tags:
  - digest
---

${digestBody.trim()}
`;
    const digestPath = resolve(blogDir, `${digestSlug}.mdx`);
    if (DRY_RUN) {
      console.log(`\n--- ${digestPath} ---\n${digestMdx}\n`);
    } else {
      writeFileSync(digestPath, digestMdx);
      console.log(`[draft] wrote ${digestPath}`);
    }
  }
}

function parseArgs(args) {
  const out = {};
  for (const a of args) {
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      out[k] = v ?? true;
    }
  }
  return out;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
