#!/usr/bin/env node
/**
 * Social copy generator. Drafts an X thread and a LinkedIn post for the
 * weekly digest, writes both to dist/social/<weekIso>.md. Curator copies
 * + pastes manually - no API auth, no auto-post risk.
 *
 * Run:
 *   pnpm tsx scripts/news/social.mjs --week=2026-W18
 *   pnpm tsx scripts/news/social.mjs --week=2026-W18 --dry-run
 *
 * Required env:
 *   ANTHROPIC_API_KEY - for the LLM draft call
 *   SUPABASE_URL - to load the week's items
 *   SUPABASE_SERVICE_ROLE_KEY - same
 */
import { mkdirSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..", "..");
const outDir = resolve(repoRoot, "dist/social");

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://tensorcraft.app";
const DRAFT_MODEL = "claude-sonnet-4-6";

const argv = parseArgs(process.argv.slice(2));
const WEEK = argv.week;
const DRY_RUN = !!argv["dry-run"];
if (!WEEK) {
  console.error("[social] pass --week=YYYY-Www");
  process.exit(1);
}

/* ------------------------------------------------------------------ */
/* Prompts - same voice as draft.mjs                                    */
/* ------------------------------------------------------------------ */

function buildThreadPrompt(items, digestUrl) {
  const itemLines = items
    .map((it, i) => {
      const m = it.matched_lessons?.[0];
      const lessonUrl = m
        ? `${SITE}/learn/${m.worldId}/${m.moduleId}/${m.slug}?utm_source=x&utm_medium=thread&utm_campaign=${WEEK}&utm_content=${i + 1}`
        : "";
      return `${i + 1}. ${it.title}
   source: ${it.url}
   teaches: ${m ? m.title : "(none)"}
   lesson_url: ${lessonUrl}`;
    })
    .join("\n\n");

  const system = `You are writing an X (Twitter) thread for The Bridge - Tensorcraft's weekly browser-ML digest.

Voice rules:
- Practitioner-honest, not hype. NEVER use "perfect", "amazing", "must-read", "game-changing", "breakthrough", emoji-stacks, or marketing superlatives.
- Frontend-engineer perspective. Anchor concepts to FE primitives (DOM, typed arrays, requestAnimationFrame, fetch, web workers).
- Each tweet <= 270 characters (leave room for retweet UI + auto-shortened links).
- One blank line between tweets. Number them 1/, 2/, 3/, etc.
- Plain text. Markdown link syntax becomes raw URLs after copy-paste - write URLs inline.

Structure:
- Tweet 1: Hook. State the through-line of the week. Tease ${items.length} items. End with the digest URL.
- Tweets 2..N: One per news item. Pattern: "[short take on news]. Teaches X. {lesson_url}"
- Final tweet: One-line CTA pointing to ${SITE}/worlds ("Built for FE devs moving into ML →")

Output: thread text only, no preamble. Each tweet on its own paragraph.`;

  const user = `WEEK: ${WEEK}
DIGEST URL: ${digestUrl}

ITEMS:

${itemLines}

Write the thread.`;

  return { system, user };
}

function buildLinkedInPrompt(items, digestUrl) {
  const itemLines = items
    .map((it) => {
      const m = it.matched_lessons?.[0];
      return `- ${it.title}\n  Source: ${it.url}\n  Teaches: ${m ? m.title : "(none)"}`;
    })
    .join("\n");

  const system = `You are writing a LinkedIn post for The Bridge - Tensorcraft's weekly browser-ML digest.

Voice rules:
- Practitioner-honest, not hype. NEVER use "perfect", "amazing", "must-read", "game-changing", "breakthrough", "thrilled", "humbled", emoji-stacks.
- Frontend-engineer perspective. Anchor concepts to FE primitives.
- ~1000-1200 characters total. LinkedIn truncates beyond ~210 chars on first view, so the first 1-2 sentences matter most.
- Plain text. No hashtag walls. At most 3 hashtags at the very end.
- One short paragraph for the through-line, then a bulleted list of items, then one CTA line.

Structure:
- Para 1 (hook, <= 200 chars): the through-line of the week.
- Bulleted list: one bullet per item, "Title - 1 sentence on what shipped - Teaches: <Lesson Title>"
- Closing line: "Read the digest: ${digestUrl}"
- Final line: 2-3 hashtags max (#WebGPU #BrowserML #FrontendEngineering or similar - match the actual content).

Output: post text only, no preamble.`;

  const user = `WEEK: ${WEEK}
DIGEST URL: ${digestUrl}

ITEMS:

${itemLines}

Write the post.`;

  return { system, user };
}

async function callAnthropic({ system, user, maxTokens = 1500 }) {
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

/* ------------------------------------------------------------------ */
/* Pipeline                                                             */
/* ------------------------------------------------------------------ */

async function loadItems(week) {
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
    .select("title,url,source,summary,matched_lessons,published_blog_slug")
    .in("status", ["shortlisted", "published"])
    .eq("week_iso", week);
  if (error) throw error;
  return data || [];
}

async function main() {
  const items = await loadItems(WEEK);
  if (items.length === 0) {
    console.error(`[social] no items for ${WEEK}`);
    process.exit(1);
  }
  const digestUrl = `${SITE}/blog/${WEEK.toLowerCase()}-digest?utm_source=social&utm_medium=organic&utm_campaign=${WEEK}`;

  console.log(`[social] generating for ${items.length} items, week ${WEEK}`);

  const threadPrompt = buildThreadPrompt(items, digestUrl);
  const liPrompt = buildLinkedInPrompt(items, digestUrl);

  const [thread, linkedin] = await Promise.all([
    callAnthropic(threadPrompt),
    callAnthropic(liPrompt),
  ]);

  const out = `# Social copy - The Bridge ${WEEK}

Generated: ${new Date().toISOString()}
Items: ${items.length}
Digest URL: ${digestUrl}

---

## X / Twitter thread

Copy each tweet (separated by blank lines) and post as a thread.

\`\`\`
${thread.trim()}
\`\`\`

---

## LinkedIn post

\`\`\`
${linkedin.trim()}
\`\`\`
`;

  if (DRY_RUN) {
    console.log(out);
    return;
  }

  if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true });
  const file = resolve(outDir, `${WEEK}.md`);
  writeFileSync(file, out);
  console.log(`[social] wrote ${file}`);
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
