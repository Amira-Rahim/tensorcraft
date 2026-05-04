#!/usr/bin/env node
/**
 * News matcher — two-stage retrieval.
 *
 * Stage 1: cheap concept-index lookup. Tokenizes each news item's title +
 *          summary, normalizes via the same pipeline used at index build,
 *          and joins against the reverse map to get candidate lessons.
 *
 * Stage 2: LLM rerank with Haiku 4.5. Given the news item + top-K candidates,
 *          the model picks the best 3 lessons and writes a one-line rationale
 *          per choice. Falls back to stage-1 ordering if the LLM call fails.
 *
 *          When the LLM returns picks=[] (no candidate lesson actually teaches
 *          the concept), the matcher sets is_content_gap=true and writes
 *          gap_concept + gap_rationale. Surfaced under /admin/digest?status=gap.
 *          Gap detection ONLY runs when --no-llm is not set; without LLM the
 *          deterministic top-3 always populates matched_lessons.
 *
 * Run:
 *   node scripts/news/match.mjs --all-pending             # match every pending row
 *   node scripts/news/match.mjs --week=2026-W18           # filter by week_iso
 *   node scripts/news/match.mjs --fixture=path.json       # local dry-run, no DB
 *   node scripts/news/match.mjs --all-pending --no-llm    # skip LLM rerank
 *
 * Required env:
 *   ANTHROPIC_API_KEY            — for the rerank call
 *   SUPABASE_URL                 — only when not using --fixture
 *   SUPABASE_SERVICE_ROLE_KEY    — same
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const repoRoot = resolve(__dirname, "..", "..");
const conceptIndexPath = resolve(
  repoRoot,
  "packages/content/.velite/concept-index.json",
);

const CANDIDATE_LIMIT = 8; // pass to LLM rerank
const TOP_K = 3; // matches we keep per item
const RERANK_MODEL = "claude-haiku-4-5";

const argv = parseArgs(process.argv.slice(2));
const useLlm = !argv["no-llm"];

/* ------------------------------------------------------------------ */
/* Stage 1 — concept-index candidate retrieval                          */
/* ------------------------------------------------------------------ */

const STOPWORDS = new Set([
  "the", "a", "an", "and", "or", "of", "in", "to", "for",
  "with", "is", "are", "this", "that", "it",
]);

function normalizeConcept(raw) {
  const cleaned = raw.toLowerCase().trim();
  if (!cleaned || STOPWORDS.has(cleaned)) return [];
  const canonical = cleaned.replace(/[\s\-_.]+/g, "");
  const dotParts = cleaned
    .split(".")
    .map((p) => p.replace(/[\s\-_]+/g, ""))
    .filter((p) => p.length > 1 && !STOPWORDS.has(p));
  return [...new Set([canonical, ...dotParts])];
}

function tokenize(input) {
  return input
    .split(/[\s,/()[\]{}<>"'`]+/)
    .map((t) => t.trim())
    .filter((t) => t.length > 0 && !STOPWORDS.has(t.toLowerCase()));
}

const SOURCE_WEIGHT = {
  keyword: 4,
  bridge_ml: 3,
  bridge_fe: 2,
  module_id: 2,
  skill_axis: 1,
};

function findCandidates(index, terms, limit = CANDIDATE_LIMIT) {
  const concepts = terms.flatMap((t) => normalizeConcept(t));
  if (concepts.length === 0) return { matchedConcepts: [], candidates: [] };

  const matched = new Set();
  const accum = new Map();

  for (const concept of concepts) {
    const refs = index.byConcept[concept];
    if (!refs) continue;
    matched.add(concept);
    for (const ref of refs) {
      const key = `${ref.themeId}/${ref.moduleId}/${ref.slug}`;
      const slot = accum.get(key) ?? {
        lesson: {
          themeId: ref.themeId,
          moduleId: ref.moduleId,
          slug: ref.slug,
          title: ref.title,
        },
        score: 0,
        matched: new Set(),
      };
      slot.score += SOURCE_WEIGHT[ref.source] ?? 1;
      slot.matched.add(concept);
      accum.set(key, slot);
    }
  }

  const candidates = [...accum.values()]
    .map((s) => ({
      lesson: s.lesson,
      score: s.score,
      matched: [...s.matched].sort(),
    }))
    .sort((a, b) => b.score - a.score || b.matched.length - a.matched.length)
    .slice(0, limit);

  return { matchedConcepts: [...matched].sort(), candidates };
}

/* ------------------------------------------------------------------ */
/* Stage 2 — LLM rerank prompt — USER CONTRIBUTION                     */
/* ------------------------------------------------------------------ */

/**
 * Build the rerank prompt for one news item + its candidate lessons.
 *
 * USER CONTRIBUTION POINT — see request below.
 *
 * Returns { system, user } strings. Output spec: model returns JSON matching
 * `rerankSchema` (top 3 picks, each with lessonSlug + rationale ≤ 140 chars).
 *
 * Trade-offs the prompt encodes:
 *   - How strict is "must teach this exact concept" vs "tangentially related"?
 *   - Should the model favor specialization lessons over foundations?
 *   - Voice for the rationale: factual ("teaches WebGPU acceleration") vs
 *     editorial ("perfect entry-point for FE devs hitting WebGPU news")?
 *   - When to return empty (no good match) vs always pick 3?
 */
function buildRerankPrompt(item, candidates) {
  const system = `You are a curator for Tensorcraft, a frontend-engineer-to-machine-learning course.
Your job: given a browser-ML news item and candidate lessons from our curriculum, pick the 1-3 lessons that DIRECTLY TEACH the underlying concept the news is about.

Rules:
- A lesson "teaches" the concept if a reader could open it and learn the skill the news depends on.
- A lesson that merely MENTIONS the concept does NOT count. Pick zero rather than stretch.
- Prefer specialization modules over foundations when both could apply (specialization is theme-specific and deeper).
- Rationale: <= 140 chars, practitioner voice, factual. Pattern: "Teaches X - read this if you want to Y." NEVER marketing language. NEVER "perfect", "amazing", "must-read".
- Return { "picks": [] } when nothing in the candidate set actually teaches this. Empty is correct.

When picks is empty, ALSO include a "gap" object:
- gap.concept: <= 120 chars, 1-line description of what the news teaches that no candidate lesson covers. Practitioner voice. Examples: "WebGPU compute shaders for tensor inference", "GPU buffer lifecycle for on-device transformers".
- gap.rationale: <= 240 chars, factual. Pattern: "Item teaches X; closest current lesson covers Y. Would fit in <theme>/<module> or as a new module." Suggests a curriculum placement.

When picks is non-empty, OMIT the gap field entirely.

Output: JSON only, conforming to the schema you've been given.`;

  const candidateList = candidates
    .map(
      (c, i) =>
        `${i + 1}. [${c.lesson.themeId}/${c.lesson.moduleId}/${c.lesson.slug}] ${c.lesson.title}`,
    )
    .join("\n");

  const user = `NEWS ITEM
Source: ${item.source}
Title: ${item.title}
Summary: ${(item.summary || "").slice(0, 800)}

CANDIDATE LESSONS (from concept-index pass)
${candidateList}

Pick the lessons that teach what this news is about. Return JSON.`;

  return { system, user };
}

const rerankSchema = {
  type: "object",
  properties: {
    picks: {
      type: "array",
      maxItems: 3,
      items: {
        type: "object",
        properties: {
          lessonSlug: { type: "string" },
          rationale: { type: "string", maxLength: 140 },
        },
        required: ["lessonSlug", "rationale"],
        additionalProperties: false,
      },
    },
    gap: {
      type: "object",
      properties: {
        concept: { type: "string", maxLength: 120 },
        rationale: { type: "string", maxLength: 240 },
      },
      required: ["concept", "rationale"],
      additionalProperties: false,
    },
  },
  required: ["picks"],
  additionalProperties: false,
};

/**
 * Returns { picks: MatchedLesson[]; gap: { concept, rationale } | null }.
 * `picks` empty + `gap` populated indicates a content-gap candidate.
 */
async function rerankWithLlm(item, candidates) {
  if (candidates.length === 0) return { picks: [], gap: null };
  const { default: Anthropic } = await import("@anthropic-ai/sdk");
  const client = new Anthropic();
  const { system, user } = buildRerankPrompt(item, candidates);

  const response = await client.messages.create({
    model: RERANK_MODEL,
    max_tokens: 1024,
    system,
    messages: [{ role: "user", content: user }],
    output_config: {
      format: { type: "json_schema", schema: rerankSchema },
    },
  });

  const block = response.content.find((b) => b.type === "text");
  if (!block) return { picks: [], gap: null };
  let parsed;
  try {
    parsed = JSON.parse(block.text);
  } catch {
    console.warn(`[match] failed to parse rerank JSON for ${item.url}`);
    return { picks: [], gap: null };
  }

  const bySlug = new Map(candidates.map((c) => [c.lesson.slug, c]));
  const picks = (parsed.picks ?? [])
    .map((p, i) => {
      const cand = bySlug.get(p.lessonSlug);
      if (!cand) return null;
      return {
        themeId: cand.lesson.themeId,
        moduleId: cand.lesson.moduleId,
        slug: cand.lesson.slug,
        title: cand.lesson.title,
        score: cand.score + (TOP_K - i), // bonus for LLM rank
        rationale: p.rationale,
      };
    })
    .filter((x) => x !== null)
    .slice(0, TOP_K);

  // Only honor `gap` when picks is empty (LLM should follow the prompt rule
  // but defend against schema returning gap alongside non-empty picks).
  const gap = picks.length === 0 && parsed.gap ? parsed.gap : null;
  return { picks, gap };
}

/* ------------------------------------------------------------------ */
/* Pipeline                                                             */
/* ------------------------------------------------------------------ */

function fallbackTopK(candidates) {
  return candidates.slice(0, TOP_K).map((c) => ({
    themeId: c.lesson.themeId,
    moduleId: c.lesson.moduleId,
    slug: c.lesson.slug,
    title: c.lesson.title,
    score: c.score,
  }));
}

async function matchOne(item, conceptIndex) {
  const terms = [...tokenize(item.title), ...tokenize(item.summary || "")];
  const { matchedConcepts, candidates } = findCandidates(conceptIndex, terms);

  let matched_lessons;
  let is_content_gap = false;
  let gap_concept = null;
  let gap_rationale = null;

  if (useLlm && candidates.length > 0) {
    try {
      const { picks, gap } = await rerankWithLlm(item, candidates);
      if (picks.length > 0) {
        matched_lessons = picks;
      } else if (gap) {
        // LLM signaled content gap. Leave matched_lessons empty so curator
        // sees explicitly that no lesson teaches this.
        matched_lessons = [];
        is_content_gap = true;
        gap_concept = gap.concept;
        gap_rationale = gap.rationale;
      } else {
        // LLM returned empty picks without a gap object — degraded LLM
        // response. Fall back to deterministic top-3.
        matched_lessons = fallbackTopK(candidates);
      }
    } catch (err) {
      console.warn(`[match] rerank failed for ${item.url}: ${err.message}`);
      matched_lessons = fallbackTopK(candidates);
    }
  } else {
    // --no-llm path or zero candidates. Gap detection requires LLM, so
    // we never set is_content_gap here.
    matched_lessons = fallbackTopK(candidates);
  }

  return {
    matched_concepts: matchedConcepts,
    matched_lessons,
    is_content_gap,
    gap_concept,
    gap_rationale,
  };
}

async function loadPending(week) {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) {
    throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY missing");
  }
  const { createClient } = await import("@supabase/supabase-js");
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const query = supabase.from("news_items").select("*").eq("status", "pending");
  if (week) query.eq("week_iso", week);
  const { data, error } = await query;
  if (error) throw error;
  return { supabase, items: data || [] };
}

async function main() {
  const conceptIndex = JSON.parse(readFileSync(conceptIndexPath, "utf-8"));
  console.log(
    `[match] loaded concept index: ${conceptIndex.totalLessons} lessons, ${conceptIndex.totalConcepts} concepts`,
  );

  if (argv.fixture) {
    const items = JSON.parse(readFileSync(argv.fixture, "utf-8"));
    for (const item of items) {
      const out = await matchOne(item, conceptIndex);
      console.log(`\n[${item.source}] ${item.title}`);
      console.log(`  concepts: ${out.matched_concepts.slice(0, 8).join(", ")}`);
      if (out.is_content_gap) {
        console.log(`  ⚠ CONTENT GAP: ${out.gap_concept}`);
        console.log(`    ${out.gap_rationale}`);
      } else {
        for (const m of out.matched_lessons) {
          console.log(
            `  → ${m.themeId}/${m.moduleId}/${m.slug}  (${m.score})${m.rationale ? `  — ${m.rationale}` : ""}`,
          );
        }
      }
    }
    return;
  }

  // --week filters by week_iso (only set on shortlist). Omit to match all
  // pending items — typical post-scrape flow before any curation.
  const week = argv.week;
  if (!week && !argv["all-pending"]) {
    console.error("[match] pass --week=YYYY-Www, --all-pending, or --fixture=path.json");
    process.exit(1);
  }
  const { supabase, items } = await loadPending(week);
  console.log(
    `[match] ${items.length} pending items${week ? ` for ${week}` : " (all weeks)"}`,
  );

  let updated = 0;
  for (const item of items) {
    const out = await matchOne(item, conceptIndex);
    const { error } = await supabase
      .from("news_items")
      .update({
        matched_concepts: out.matched_concepts,
        matched_lessons: out.matched_lessons,
        is_content_gap: out.is_content_gap,
        gap_concept: out.gap_concept,
        gap_rationale: out.gap_rationale,
      })
      .eq("id", item.id);
    if (error) {
      console.error(`[match] update failed for ${item.id}: ${error.message}`);
      continue;
    }
    updated += 1;
  }
  console.log(`[match] updated ${updated}/${items.length} rows`);
}

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

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
