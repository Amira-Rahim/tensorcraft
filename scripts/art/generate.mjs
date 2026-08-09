#!/usr/bin/env node
/**
 * Art generation driver for the character/scene pipeline
 * (docs/character-bible.md, docs/scene-bible.md).
 *
 * Candidates land in the gitignored art-src/<phase>/ staging tree with a
 * lineage record per file; approved winners are shipped separately by
 * scripts/art/ingest.mjs. This script never touches apps/web/public.
 *
 * Usage:
 *   node scripts/art/generate.mjs \
 *     --provider openai|fal        (required)
 *     --phase bakeoff|neutrals|expressions|masters|scenes  (required)
 *     --id <slug>                  (output name stem, e.g. commander-mirza)
 *     --character <slug>           (pull the Image-gen prompt from the bible)
 *     --prompt "<text>"            (explicit prompt; overrides --character)
 *     --count 3                    (candidates per run, default 3)
 *     --size 1024x1024|1536x1024   (default 1024x1024)
 *     --quality low|medium|high    (openai only, default medium)
 *     --ref <path> [--ref <path>]  (reference image(s): identity/master plate)
 *
 * Keys: OPENAI_API_KEY / FAL_KEY from the environment, or from a repo-root
 * .env.art file (gitignored, KEY=value lines). Never commit keys.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

// ── env ──────────────────────────────────────────────────────────────
// Repo root or inside the gitignored staging dir; both are ignored, so
// whichever the operator reaches for first works.
for (const envFile of [
  path.join(ROOT, ".env.art"),
  path.join(ROOT, "art-src", ".env.art"),
]) {
  if (!fs.existsSync(envFile)) continue;
  for (const line of fs.readFileSync(envFile, "utf8").split("\n")) {
    const m = line.match(/^\s*(?:export\s+)?([A-Z_]+)\s*=\s*(.*)$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    }
  }
}

// ── args ─────────────────────────────────────────────────────────────
const args = { ref: [] };
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i++) {
  const key = argv[i].replace(/^--/, "");
  const val = argv[i + 1];
  if (key === "ref") args.ref.push(val);
  else args[key] = val;
  i++;
}

const PROVIDERS = ["openai", "fal"];
const PHASES = ["bakeoff", "neutrals", "expressions", "masters", "scenes"];
if (!PROVIDERS.includes(args.provider)) die(`--provider must be one of ${PROVIDERS.join("|")}`);
if (!PHASES.includes(args.phase)) die(`--phase must be one of ${PHASES.join("|")}`);
if (!args.id) die("--id <slug> is required (output name stem)");
const count = Number(args.count ?? 3);
const size = args.size ?? "1024x1024";
const quality = args.quality ?? "medium";
if (!/^\d+x\d+$/.test(size)) die("--size must look like 1536x1024");

function die(msg) {
  console.error(`error: ${msg}`);
  process.exit(1);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * fal intermittently 422s an identical, valid request ("Invalid or corrupted
 * image input" on a call whose sibling requests succeed against the same
 * reference file). Retry transients with backoff so a 60-call scene batch
 * does not need babysitting; genuine 4xx like auth or balance fail fast.
 */
async function withRetry(attempt, { tries = 4 } = {}) {
  for (let i = 1; ; i++) {
    const result = await attempt();
    if (result.ok || i >= tries || !result.retryable) return result;
    const wait = 1500 * i;
    console.error(`  transient ${result.status}, retry ${i}/${tries - 1} in ${wait}ms`);
    await sleep(wait);
  }
}

// ── prompt ───────────────────────────────────────────────────────────
function biblePrompt(slug) {
  const bible = fs.readFileSync(path.join(ROOT, "docs/character-bible.md"), "utf8");
  const sheet = bible.split(/^### /m).find((s) => s.includes(`\`${slug}\``));
  if (!sheet) die(`no character-bible sheet for '${slug}'`);
  const m = sheet.match(/\*\*Image-gen prompt\*\*\s*([\s\S]*?)(?:\n- \*\*|\n### |$)/);
  if (!m) die(`no Image-gen prompt line on the '${slug}' sheet`);
  return m[1].replace(/\s+/g, " ").trim();
}

const prompt = args.prompt ?? (args.character ? biblePrompt(args.character) : null);
if (!prompt) die("provide --prompt or --character");

// ── providers ────────────────────────────────────────────────────────
async function openaiGenerate() {
  const key = process.env.OPENAI_API_KEY;
  if (!key) die("OPENAI_API_KEY is not set (env or .env.art)");
  const model = process.env.OPENAI_IMAGE_MODEL ?? "gpt-image-2";

  // Reference images route through the edits endpoint (multipart).
  if (args.ref.length > 0) {
    const form = new FormData();
    form.append("model", model);
    form.append("prompt", prompt);
    form.append("n", String(count));
    form.append("size", size);
    form.append("quality", quality);
    for (const ref of args.ref) {
      const buf = fs.readFileSync(ref);
      form.append("image[]", new Blob([buf], { type: "image/png" }), path.basename(ref));
    }
    const res = await fetch("https://api.openai.com/v1/images/edits", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}` },
      body: form,
    });
    return openaiImages(res, model);
  }

  const res = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, prompt, n: count, size, quality }),
  });
  return openaiImages(res, model);
}

async function openaiImages(res, model) {
  const body = await res.json();
  if (!res.ok) die(`openai ${res.status}: ${JSON.stringify(body.error ?? body)}`);
  return {
    model,
    buffers: body.data.map((d) => Buffer.from(d.b64_json, "base64")),
  };
}

async function falGenerate() {
  const key = process.env.FAL_KEY;
  if (!key) die("FAL_KEY is not set (env or .env.art)");
  const [w, h] = size.split("x").map(Number);
  const edit = args.ref.length > 0;
  const model = edit ? "fal-ai/flux-2-pro/edit" : "fal-ai/flux-2-pro";
  const payload = {
    prompt,
    image_size: { width: w, height: h },
    num_images: count,
  };
  if (edit) {
    payload.image_urls = args.ref.map((ref) => {
      const buf = fs.readFileSync(ref);
      return `data:image/png;base64,${buf.toString("base64")}`;
    });
  }
  const attempt = async () => {
    const res = await fetch(`https://fal.run/${model}`, {
      method: "POST",
      headers: {
        Authorization: `Key ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    // A content-checker rejection is a permanent verdict on this prompt:
    // retrying it just burns three more calls on the same refusal. Only the
    // unexplained 422 flake is worth retrying.
    const filtered = JSON.stringify(json).includes("content checker");
    return {
      ok: res.ok,
      status: res.status,
      json,
      retryable:
        !filtered &&
        (res.status === 422 || res.status === 429 || res.status >= 500),
    };
  };

  const { ok, status, json: body } = await withRetry(attempt);
  if (!ok) {
    // Echoed request bodies carry the base64 reference image; printing one
    // buries the terminal in a megabyte of payload.
    const detail = Array.isArray(body.detail)
      ? body.detail.map((d) => d.msg ?? JSON.stringify(d)).join("; ")
      : JSON.stringify(body).slice(0, 300);
    die(`fal ${status}: ${detail}`);
  }
  const buffers = [];
  for (const img of body.images ?? []) {
    const dl = await fetch(img.url);
    buffers.push(Buffer.from(await dl.arrayBuffer()));
  }
  if (buffers.length === 0) die(`fal returned no images: ${JSON.stringify(body)}`);
  return { model, buffers };
}

// ── run ──────────────────────────────────────────────────────────────
const outDir = path.join(ROOT, "art-src", args.phase);
fs.mkdirSync(outDir, { recursive: true });

const { model, buffers } = await (args.provider === "openai"
  ? openaiGenerate()
  : falGenerate());

const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
const written = [];
buffers.forEach((buf, i) => {
  const file = path.join(
    outDir,
    `${args.id}-${args.provider}-${stamp}-${i + 1}.png`,
  );
  fs.writeFileSync(file, buf);
  written.push(path.relative(ROOT, file));
});

fs.appendFileSync(
  path.join(ROOT, "art-src", "lineage.jsonl"),
  written
    .map((file) =>
      JSON.stringify({
        file,
        phase: args.phase,
        id: args.id,
        provider: args.provider,
        model,
        size,
        quality: args.provider === "openai" ? quality : undefined,
        refs: args.ref.map((r) => path.relative(ROOT, path.resolve(r))),
        prompt,
        date: new Date().toISOString(),
      }),
    )
    .join("\n") + "\n",
);

console.log(`${written.length} candidate(s) written:`);
for (const f of written) console.log(`  ${f}`);
