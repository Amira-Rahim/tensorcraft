#!/usr/bin/env node
/**
 * Blog idea-brief generator.
 *
 * For every shortlisted news_item in the given week, generates an idea
 * brief at dist/drafts/YYYY-Www-<slug>.md plus a weekly digest brief.
 * Briefs are raw material for a human writer, not publishable posts
 * (owner decision 2026-08-14: every published post is written by hand).
 * Nothing is written to packages/content/content/blog/ and the
 * news_item rows stay at status='shortlisted'; flip a row to
 * 'published' with its published_blog_slug by hand once the
 * hand-written post ships.
 *
 * Run:
 *   pnpm tsx scripts/news/draft.mjs --week=2026-W18           # write briefs
 *   pnpm tsx scripts/news/draft.mjs --week=2026-W18 --dry-run # print to stdout
 *
 * Required env:
 *   ANTHROPIC_API_KEY - for the draft call
 *   SUPABASE_URL - to load shortlisted items
 *   SUPABASE_SERVICE_ROLE_KEY - same
 */
import { writeFileSync, mkdirSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..", "..");
const draftsDir = resolve(repoRoot, "dist", "drafts");

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
  // Lessons live at /worlds/<world>/<module>/<lesson>; the /learn/<nested>
  // shape 404s (the blog-links gate exists because a shipped post used it).
  const lessons = (item.matched_lessons || [])
    .map(
      (m, i) =>
        `${i + 1}. ${m.title}  →  /worlds/${m.worldId}/${m.moduleId}/${m.slug}${m.rationale ? `\n   rationale: ${m.rationale}` : ""}`,
    )
    .join("\n");

  const system = `You are a writer for The Bridge - Tensorcraft's blog. Voice rules:

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

// Plain-markdown brief, deliberately without velite frontmatter so the
// file cannot pass the posts schema if pasted into content/blog unedited.
function ideaBrief(item, body) {
  const sourceLabel = item.source
    .replace(/^(rss|github):/, "")
    .replace(/\/.*$/, "");
  const lessons = (item.matched_lessons || [])
    .slice(0, 3)
    .map(
      (m) =>
        `- ${m.title}  →  /worlds/${m.worldId}/${m.moduleId}/${m.slug}${m.rationale ? `\n  rationale: ${m.rationale}` : ""}`,
    )
    .join("\n");

  return `# Idea brief (${WEEK}): ${item.title}

> Raw LLM draft. Not publishable. A human writes the real post by hand in
> packages/content/content/blog/ and only then flips the news_item row to
> published.

Source: ${sourceLabel} - ${item.url}

Matched lessons:
${lessons || "(none)"}

## Suggested angle

${body}
`;
}

function buildDigestPrompt(items) {
  const lines = items
    .map(
      (it, i) =>
        `${i + 1}. ${it.title}\n   source: ${it.source}\n   summary: ${(it.summary || "").slice(0, 300)}\n   teaches: ${it.matched_lessons?.[0]?.title || "(none)"}`,
    )
    .join("\n\n");

  const system = `Same voice rules as before: practitioner-honest, frontend-engineer perspective, no hype words, short sentences.

Write the MDX body for a weekly digest covering ${items.length} items. Structure:

## This week
1 short paragraph (2-3 sentences) on the through-line - what world connects these items (e.g. "WebGPU keeps shipping", "transformers.js is doing what tfjs once promised"). If there is no through-line, say so honestly.

## Items
For each item, one bullet:
- **[Title]** - 1 sentence on what shipped, then "Teaches: [Lesson Title]" with no link.

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
  return data || [];
}

async function main() {
  if (!DRY_RUN && !existsSync(draftsDir))
    mkdirSync(draftsDir, { recursive: true });
  const items = await loadShortlisted(WEEK);
  console.log(`[draft] ${items.length} shortlisted items for ${WEEK}`);
  if (items.length === 0) return;

  let generated = 0;

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
    const brief = ideaBrief(item, body.trim());
    const filePath = resolve(draftsDir, `${slug}.md`);

    if (DRY_RUN) {
      console.log(`\n--- ${filePath} ---\n${brief}\n`);
    } else {
      writeFileSync(filePath, brief);
      console.log(`[draft] wrote ${filePath}`);
    }
    generated += 1;
  }

  // Weekly digest brief
  if (generated > 0) {
    const { system, user } = buildDigestPrompt(items);
    let digestBody;
    try {
      digestBody = await callAnthropic({ system, user, maxTokens: 1500 });
    } catch (err) {
      console.error(`[draft] digest LLM call failed: ${err.message}`);
      return;
    }
    const digestBrief = `# Idea brief (${WEEK}): weekly digest

> Raw LLM draft. Not publishable. A human writes the real post by hand in
> packages/content/content/blog/ and only then flips the news_item rows to
> published.

## Suggested angle

${digestBody.trim()}
`;
    const digestPath = resolve(draftsDir, `${WEEK.toLowerCase()}-digest.md`);
    if (DRY_RUN) {
      console.log(`\n--- ${digestPath} ---\n${digestBrief}\n`);
    } else {
      writeFileSync(digestPath, digestBrief);
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
