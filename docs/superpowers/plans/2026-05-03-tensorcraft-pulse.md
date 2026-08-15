# Tensorcraft Pulse Implementation Plan

> **Status: DEFERRED - POST-V1 / FUTURE WORK**
> Not scheduled. Captured here for activation after launch settles.
> Spec lives at `~/.claude/plans/brainstorm-how-to-keep-giggly-lightning.md` (move to `docs/superpowers/specs/2026-05-01-pulse-content-freshness-design.md` when activated).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Daily-refreshed signal layer that gives users a live "what's happening in browser ML" feed, surfaces topic-relevant items per lesson via an editor-approved Currents block, and detects stale lessons via library-release-driven rewrite signals.

**Architecture:** Separate Fly.io worker app (`tc-pulse`) runs a daily cron that fans out to source adapters (HN, Lobsters, HF, vendor RSS, GitHub releases/trending, X best-effort), normalizes items, embeds via OpenAI, matches against 275 lesson embeddings using pgvector cosine similarity, splits results into auto-published pulse feed (high quality threshold) and an editor approval queue (high lesson-similarity threshold), then runs release-driven signal detection with optional LLM diff escalation. Public reads served by existing Next.js app from same Postgres (Supabase).

**Tech Stack:** Node 20, TypeScript, Postgres (Supabase) + pgvector, OpenAI text-embedding-3-small, Claude Haiku (summarize + LLM diff), Fly.io machines + cron, existing Next.js 15 web app, vitest.

---

## File Structure

**New package - `apps/pulse-worker/`:**
- `src/cron.ts` - entrypoint, daily orchestrator
- `src/db.ts` - Postgres pool, typed queries
- `src/adapters/types.ts` - `SourceAdapter`, `RawItem` interfaces
- `src/adapters/hn.ts`, `lobsters.ts`, `hf-papers.ts`, `hf-models.ts`, `gh-releases.ts`, `gh-trending.ts`, `blogs.ts`, `x.ts` - one file per source
- `src/adapters/__fixtures__/` - canned API responses for unit tests
- `src/pipeline/ingest.ts` - dedup + insert raw_items
- `src/pipeline/summarize.ts` - Claude Haiku summarizer
- `src/pipeline/embed.ts` - OpenAI embedding batcher
- `src/pipeline/match.ts` - pgvector cosine top-K
- `src/pipeline/score.ts` - quality_score formula
- `src/pipeline/publish.ts` - auto-publish + queue split
- `src/pipeline/sweep.ts` - TTL cleanup
- `src/signals/keywords.ts` - `LIB_KEYWORDS` map + symbol regex
- `src/signals/detect-keyword.ts` - Trigger A
- `src/signals/detect-symbol.ts` - Trigger B
- `src/signals/detect-llm.ts` - Trigger D
- `src/lib/budget.ts` - daily cost tracker
- `src/lib/rate-limit.ts` - per-host token bucket
- `src/lib/report.ts` - Slack webhook + run summary
- `src/scripts/embed-lessons.ts` - one-shot lesson backfill
- `Dockerfile`, `fly.toml`, `package.json`, `tsconfig.json`, `vitest.config.ts`

**Modify in `packages/supabase/migrations/`:**
- New: `024_pulse_schema.sql`

**New in `apps/web/`:**
- `app/pulse/page.tsx` - global feed
- `app/pulse/[themeId]/page.tsx` - theme feed
- `app/pulse/_lib/queries.ts` - `getPulseItems`, `getCurrentsForLesson`
- `app/pulse/_components/pulse-card.tsx` - feed card
- `app/admin/queue/page.tsx` - editor approval table
- `app/admin/queue/_actions.ts` - approve/reject server actions
- `app/admin/signals/page.tsx` - signals dashboard
- `app/admin/signals/_actions.ts` - status mutations

**Modify in `packages/ui/`:**
- New: `src/mdx/currents.tsx` - `<Currents>` lesson block
- New: `src/mdx/__tests__/currents.test.tsx`

**Modify in `apps/web/`:**
- Lesson page renderer (find via grep `\[lesson\]` route) - inject `<Currents>` between Concept and Code sections.

**Modify root:**
- `pnpm-workspace.yaml` - add `apps/pulse-worker`
- `turbo.json` - register pulse-worker tasks
- `docs/dev-plan.md` - mark Pulse as deferred V2 item with link to this plan

---

## Phase 0 - Foundation (schema + scaffolding)

### Task 0.1: Migration 024 - pulse schema + pgvector

**Files:**
- Create: `packages/supabase/migrations/024_pulse_schema.sql`

- [ ] **Step 1: Write migration with full schema**

```sql
-- packages/supabase/migrations/024_pulse_schema.sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE pulse_raw_items (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source          text NOT NULL,
  source_id       text NOT NULL,
  url             text NOT NULL,
  title           text NOT NULL,
  summary         text,
  raw_payload     jsonb NOT NULL,
  scraped_at      timestamptz NOT NULL DEFAULT now(),
  published_at    timestamptz,
  embedding       vector(1536),
  quality_score   real,
  banned          boolean NOT NULL DEFAULT false,
  UNIQUE (source, source_id)
);

CREATE TABLE pulse_lesson_embeddings (
  lesson_slug    text PRIMARY KEY,
  theme_id       text NOT NULL,
  module_id      text NOT NULL,
  keywords       text[] NOT NULL,
  embedding      vector(1536) NOT NULL,
  body_hash      text NOT NULL,
  embedded_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE pulse_item_lesson_matches (
  item_id       uuid REFERENCES pulse_raw_items(id) ON DELETE CASCADE,
  lesson_slug   text REFERENCES pulse_lesson_embeddings(lesson_slug) ON DELETE CASCADE,
  similarity    real NOT NULL,
  PRIMARY KEY (item_id, lesson_slug)
);

CREATE TABLE pulse_items (
  item_id        uuid PRIMARY KEY REFERENCES pulse_raw_items(id) ON DELETE CASCADE,
  theme_id       text,
  rank_score     real NOT NULL,
  published_at   timestamptz NOT NULL DEFAULT now(),
  expires_at     timestamptz NOT NULL
);

CREATE TABLE pulse_editor_queue (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id        uuid REFERENCES pulse_raw_items(id) ON DELETE CASCADE,
  lesson_slug    text REFERENCES pulse_lesson_embeddings(lesson_slug) ON DELETE CASCADE,
  similarity     real NOT NULL,
  status         text NOT NULL CHECK (status IN ('pending','approved','rejected')),
  decided_by     text,
  decided_at     timestamptz,
  UNIQUE (item_id, lesson_slug)
);

CREATE TABLE pulse_lesson_currents (
  lesson_slug    text REFERENCES pulse_lesson_embeddings(lesson_slug) ON DELETE CASCADE,
  item_id        uuid REFERENCES pulse_raw_items(id) ON DELETE CASCADE,
  position       int NOT NULL,
  pinned_until   timestamptz,
  PRIMARY KEY (lesson_slug, item_id)
);

CREATE TABLE pulse_rewrite_signals (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_slug    text REFERENCES pulse_lesson_embeddings(lesson_slug) ON DELETE CASCADE,
  trigger        text NOT NULL CHECK (trigger IN ('release_keyword','api_symbol','llm_diff')),
  severity       text NOT NULL CHECK (severity IN ('low','med','high')),
  evidence       jsonb NOT NULL,
  source_release text,
  status         text NOT NULL DEFAULT 'open' CHECK (status IN ('open','acknowledged','fixed','dismissed')),
  detected_at    timestamptz NOT NULL DEFAULT now(),
  resolved_at    timestamptz,
  UNIQUE (lesson_slug, source_release, trigger)
);

CREATE TABLE pulse_cost_log (
  day            date PRIMARY KEY,
  embeddings_usd numeric(10,4) NOT NULL DEFAULT 0,
  haiku_usd      numeric(10,4) NOT NULL DEFAULT 0,
  total_usd      numeric(10,4) GENERATED ALWAYS AS (embeddings_usd + haiku_usd) STORED
);

CREATE INDEX pulse_raw_items_embedding_idx ON pulse_raw_items
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
CREATE INDEX pulse_lesson_embeddings_idx ON pulse_lesson_embeddings
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 10);
CREATE INDEX pulse_items_publish_idx ON pulse_items (published_at DESC, rank_score DESC);
CREATE INDEX pulse_items_theme_idx ON pulse_items (theme_id, published_at DESC);
CREATE INDEX pulse_signals_lesson_idx ON pulse_rewrite_signals (lesson_slug, status);
CREATE INDEX pulse_queue_status_idx ON pulse_editor_queue (status, similarity DESC);

ALTER TABLE pulse_raw_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_lesson_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_item_lesson_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_editor_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_lesson_currents ENABLE ROW LEVEL SECURITY;
ALTER TABLE pulse_rewrite_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY pulse_items_public_read ON pulse_items FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY pulse_lesson_currents_public_read ON pulse_lesson_currents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY pulse_raw_items_public_read ON pulse_raw_items FOR SELECT TO anon, authenticated USING (banned = false);
```

- [ ] **Step 2: Apply via Supabase SQL editor**

Run in Supabase dashboard → SQL editor → paste migration → execute. Verify all tables created via `\dt pulse_*`.

- [ ] **Step 3: Commit**

```bash
git add packages/supabase/migrations/024_pulse_schema.sql
git commit -m "feat(pulse): migration 024 - pulse schema + pgvector"
```

---

### Task 0.2: Scaffold pulse-worker package

**Files:**
- Create: `apps/pulse-worker/package.json`
- Create: `apps/pulse-worker/tsconfig.json`
- Create: `apps/pulse-worker/vitest.config.ts`
- Modify: `pnpm-workspace.yaml`
- Modify: `turbo.json`

- [ ] **Step 1: Create package.json**

```json
{
  "name": "@tensorcraft/pulse-worker",
  "private": true,
  "type": "module",
  "scripts": {
    "build": "tsc -p tsconfig.json",
    "dev": "tsx watch src/cron.ts --dry-run",
    "start": "node dist/cron.js",
    "test": "vitest run",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@anthropic-ai/sdk": "^0.30.0",
    "openai": "^4.70.0",
    "pg": "^8.13.0",
    "pgvector": "^0.2.0",
    "rss-parser": "^3.13.0",
    "robots-parser": "^3.0.1",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/node": "^22.0.0",
    "@types/pg": "^8.11.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^4.0.18"
  }
}
```

- [ ] **Step 2: Create tsconfig.json + vitest.config.ts**

```json
// tsconfig.json
{
  "extends": "../../packages/config/tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src",
    "module": "ES2022",
    "moduleResolution": "bundler"
  },
  "include": ["src/**/*"]
}
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: { globals: true, environment: 'node' }
});
```

- [ ] **Step 3: Add to pnpm-workspace.yaml**

Append `apps/pulse-worker` if `apps/*` glob doesn't already include it. Verify with `pnpm install`.

- [ ] **Step 4: Add turbo.json entry**

Add `pulse-worker#build`, `pulse-worker#test`, `pulse-worker#typecheck` to existing pipeline if explicit tasks needed.

- [ ] **Step 5: Verify install + typecheck**

```bash
pnpm install
pnpm --filter @tensorcraft/pulse-worker typecheck
```

Expected: install succeeds, typecheck passes (no source files yet → trivial pass).

- [ ] **Step 6: Commit**

```bash
git add apps/pulse-worker pnpm-workspace.yaml turbo.json pnpm-lock.yaml
git commit -m "feat(pulse): scaffold pulse-worker package"
```

---

### Task 0.3: DB client + env validation

**Files:**
- Create: `apps/pulse-worker/src/db.ts`
- Create: `apps/pulse-worker/src/env.ts`
- Create: `apps/pulse-worker/src/__tests__/env.test.ts`

- [ ] **Step 1: Write env validation test**

```ts
// src/__tests__/env.test.ts
import { describe, it, expect } from 'vitest';
import { parseEnv } from '../env';

describe('parseEnv', () => {
  it('throws when SUPABASE_DB_URL missing', () => {
    expect(() => parseEnv({})).toThrow(/SUPABASE_DB_URL/);
  });

  it('parses valid env', () => {
    const env = parseEnv({
      SUPABASE_DB_URL: 'postgres://x',
      OPENAI_API_KEY: 'sk-x',
      ANTHROPIC_API_KEY: 'sk-x',
      GITHUB_TOKEN: 'ghp_x',
      MAX_DAILY_USD: '0.5',
      SLACK_WEBHOOK_URL: 'https://hooks.slack.com/x'
    });
    expect(env.MAX_DAILY_USD).toBe(0.5);
  });
});
```

- [ ] **Step 2: Run test, verify failure**

```bash
pnpm --filter @tensorcraft/pulse-worker test
```

Expected: FAIL - module './env' not found.

- [ ] **Step 3: Implement env.ts**

```ts
// src/env.ts
import { z } from 'zod';

const schema = z.object({
  SUPABASE_DB_URL: z.string().url(),
  OPENAI_API_KEY: z.string().min(1),
  ANTHROPIC_API_KEY: z.string().min(1),
  GITHUB_TOKEN: z.string().min(1),
  MAX_DAILY_USD: z.coerce.number().positive().default(0.5),
  SLACK_WEBHOOK_URL: z.string().url().optional(),
  PULSE_ITEM_TTL_DAYS: z.coerce.number().int().positive().default(30),
  PULSE_THRESHOLD: z.coerce.number().min(0).max(1).default(0.55),
  LESSON_THRESHOLD: z.coerce.number().min(0).max(1).default(0.78)
});

export type Env = z.infer<typeof schema>;
export function parseEnv(raw: NodeJS.ProcessEnv | Record<string, string | undefined>): Env {
  return schema.parse(raw);
}
export const env = parseEnv(process.env);
```

- [ ] **Step 4: Implement db.ts**

```ts
// src/db.ts
import pg from 'pg';
import pgvector from 'pgvector/pg';
import { env } from './env';

export const pool = new pg.Pool({
  connectionString: env.SUPABASE_DB_URL,
  max: 5,
  idleTimeoutMillis: 30_000
});

pool.on('connect', async (client) => {
  await pgvector.registerType(client);
});

export async function query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool.query(sql, params);
  return res.rows as T[];
}
```

- [ ] **Step 5: Run tests, verify pass**

```bash
pnpm --filter @tensorcraft/pulse-worker test
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/pulse-worker/src/env.ts apps/pulse-worker/src/db.ts apps/pulse-worker/src/__tests__/env.test.ts
git commit -m "feat(pulse): env validation + db pool"
```

---

## Phase 1 - Lesson embedder

### Task 1.1: Lesson embed script - read .velite + compute body_hash

**Files:**
- Create: `apps/pulse-worker/src/scripts/embed-lessons.ts`
- Create: `apps/pulse-worker/src/__tests__/body-hash.test.ts`

- [ ] **Step 1: Write hash + skip-unchanged test**

```ts
import { describe, it, expect } from 'vitest';
import { computeBodyHash, shouldReembed } from '../scripts/embed-lessons';

describe('computeBodyHash', () => {
  it('stable for identical input', () => {
    expect(computeBodyHash({ keywords: ['a','b'], body: 'x' }))
      .toBe(computeBodyHash({ keywords: ['a','b'], body: 'x' }));
  });
  it('changes on body change', () => {
    expect(computeBodyHash({ keywords: ['a'], body: 'x' }))
      .not.toBe(computeBodyHash({ keywords: ['a'], body: 'y' }));
  });
});

describe('shouldReembed', () => {
  it('reembed when no row exists', () => {
    expect(shouldReembed(undefined, 'h1')).toBe(true);
  });
  it('skip when hash matches', () => {
    expect(shouldReembed({ body_hash: 'h1' }, 'h1')).toBe(false);
  });
});
```

- [ ] **Step 2: Implement minimal**

```ts
// src/scripts/embed-lessons.ts
import { createHash } from 'node:crypto';

export function computeBodyHash(input: { keywords: string[]; body: string }): string {
  const canonical = JSON.stringify({ k: [...input.keywords].sort(), b: input.body });
  return createHash('sha256').update(canonical).digest('hex');
}

export function shouldReembed(existing: { body_hash: string } | undefined, newHash: string): boolean {
  return !existing || existing.body_hash !== newHash;
}
```

- [ ] **Step 3: Verify pass + commit**

```bash
pnpm --filter @tensorcraft/pulse-worker test
git add . && git commit -m "feat(pulse): lesson body hash + reembed predicate"
```

---

### Task 1.2: Backfill all 275 lessons

**Files:**
- Modify: `apps/pulse-worker/src/scripts/embed-lessons.ts` - add `main()`

- [ ] **Step 1: Add velite-data reader**

```ts
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import OpenAI from 'openai';
import { query } from '../db';
import { env } from '../env';

interface VeliteLesson {
  slug: string;
  themeId: string;
  moduleId: string;
  keywords: string[];
  body: string;
}

export async function loadLessons(): Promise<VeliteLesson[]> {
  const path = resolve(process.cwd(), '../../packages/content/.velite/lessons.json');
  return JSON.parse(readFileSync(path, 'utf8'));
}
```

- [ ] **Step 2: Add embed batch + upsert**

```ts
const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

async function embedBatch(texts: string[]): Promise<number[][]> {
  const res = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts
  });
  return res.data.map(d => d.embedding);
}

async function upsertLessonEmbedding(
  lesson: VeliteLesson,
  hash: string,
  vec: number[]
): Promise<void> {
  await query(
    `INSERT INTO pulse_lesson_embeddings (lesson_slug, theme_id, module_id, keywords, embedding, body_hash)
     VALUES ($1,$2,$3,$4,$5::vector,$6)
     ON CONFLICT (lesson_slug) DO UPDATE
       SET keywords=$4, embedding=$5::vector, body_hash=$6, embedded_at=now()`,
    [lesson.slug, lesson.themeId, lesson.moduleId, lesson.keywords,
     JSON.stringify(vec), hash]
  );
}

export async function main(): Promise<void> {
  const lessons = await loadLessons();
  const existing = await query<{ lesson_slug: string; body_hash: string }>(
    'SELECT lesson_slug, body_hash FROM pulse_lesson_embeddings'
  );
  const existingMap = new Map(existing.map(r => [r.lesson_slug, r]));

  const toEmbed = lessons
    .map(l => ({ lesson: l, hash: computeBodyHash({ keywords: l.keywords, body: l.body }) }))
    .filter(({ lesson, hash }) => shouldReembed(existingMap.get(lesson.slug), hash));

  console.log(`Embedding ${toEmbed.length}/${lessons.length} lessons`);
  const BATCH = 50;
  for (let i = 0; i < toEmbed.length; i += BATCH) {
    const slice = toEmbed.slice(i, i + BATCH);
    const texts = slice.map(({ lesson }) =>
      `${lesson.keywords.join(' ')} ${lesson.body.slice(0, 2000)}`
    );
    const vecs = await embedBatch(texts);
    for (let j = 0; j < slice.length; j++) {
      await upsertLessonEmbedding(slice[j].lesson, slice[j].hash, vecs[j]);
    }
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
}
```

- [ ] **Step 3: Run backfill against staging DB**

```bash
SUPABASE_DB_URL=... OPENAI_API_KEY=... pnpm --filter @tensorcraft/pulse-worker tsx src/scripts/embed-lessons.ts
```

Expected: "Embedding 275/275 lessons" then exit 0. Verify in Supabase: `SELECT count(*) FROM pulse_lesson_embeddings` = 275.

- [ ] **Step 4: Commit**

```bash
git add apps/pulse-worker/src/scripts/embed-lessons.ts
git commit -m "feat(pulse): lesson embedding backfill script"
```

---

### Task 1.3: Post-content-build hook for incremental re-embed

**Files:**
- Modify: `packages/content/package.json` (add postbuild)
- Or: root `scripts/embed-lessons-on-build.mjs`

- [ ] **Step 1: Add postbuild script**

Add to `packages/content/package.json`:
```json
"scripts": {
  "build": "velite",
  "postbuild": "node ../../scripts/embed-lessons-on-build.mjs"
}
```

- [ ] **Step 2: Wrapper script**

```js
// scripts/embed-lessons-on-build.mjs
import { spawnSync } from 'node:child_process';
if (!process.env.SUPABASE_DB_URL || !process.env.OPENAI_API_KEY) {
  console.warn('[pulse] skipping lesson re-embed - secrets not set');
  process.exit(0);
}
const r = spawnSync('pnpm', ['--filter', '@tensorcraft/pulse-worker', 'tsx',
  'src/scripts/embed-lessons.ts'], { stdio: 'inherit' });
process.exit(r.status ?? 1);
```

Skip silently in CI without secrets so non-prod builds don't fail.

- [ ] **Step 3: Commit**

```bash
git add packages/content/package.json scripts/embed-lessons-on-build.mjs
git commit -m "feat(pulse): incremental lesson re-embed on content build"
```

---

## Phase 2 - Source adapters

### Task 2.1: Common adapter interface

**Files:**
- Create: `apps/pulse-worker/src/adapters/types.ts`
- Create: `apps/pulse-worker/src/adapters/__tests__/types.test.ts`

- [ ] **Step 1: Define types + helper**

```ts
// src/adapters/types.ts
export interface RawItem {
  sourceId: string;
  url: string;
  title: string;
  bodyText?: string;
  publishedAt?: Date;
  raw: unknown;
}

export interface SourceAdapter {
  id: string;
  status?: 'stable' | 'best-effort';
  fetchSince(cursor?: string): Promise<{ items: RawItem[]; nextCursor: string }>;
}

export async function safeFetch(adapter: SourceAdapter, cursor?: string) {
  try {
    return { ok: true as const, ...(await adapter.fetchSince(cursor)) };
  } catch (e) {
    return { ok: false as const, error: e instanceof Error ? e.message : String(e), items: [] };
  }
}
```

- [ ] **Step 2: Test safe wrapping isolates failures**

```ts
import { describe, it, expect } from 'vitest';
import { safeFetch } from '../types';

describe('safeFetch', () => {
  it('returns ok=false on throw', async () => {
    const r = await safeFetch({ id: 't', fetchSince: async () => { throw new Error('boom'); } });
    expect(r.ok).toBe(false);
    expect(r.items).toEqual([]);
  });
});
```

- [ ] **Step 3: Commit**

```bash
git add apps/pulse-worker/src/adapters/
git commit -m "feat(pulse): adapter interface + safe wrapper"
```

---

### Task 2.2: HN adapter (Algolia)

**Files:**
- Create: `apps/pulse-worker/src/adapters/hn.ts`
- Create: `apps/pulse-worker/src/adapters/__fixtures__/hn-response.json`
- Create: `apps/pulse-worker/src/adapters/__tests__/hn.test.ts`

- [ ] **Step 1: Save canned fixture**

Run once via `curl 'https://hn.algolia.com/api/v1/search_by_date?tags=story&numericFilters=points>30&query=tensorflow.js'` and save output to fixture.

- [ ] **Step 2: Test parses fixture → RawItem[]**

```ts
import { describe, it, expect, vi } from 'vitest';
import fixture from '../__fixtures__/hn-response.json';
import { hn } from '../hn';

describe('hn adapter', () => {
  it('parses fixture', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => fixture });
    const r = await hn().fetchSince();
    expect(r.items.length).toBeGreaterThan(0);
    expect(r.items[0]).toMatchObject({ sourceId: expect.any(String), url: expect.any(String) });
  });
});
```

- [ ] **Step 3: Implement**

```ts
// src/adapters/hn.ts
import type { SourceAdapter, RawItem } from './types';

const QUERY = 'tensorflow.js OR onnx OR webgpu OR transformers.js OR webnn OR webllm';
const URL = 'https://hn.algolia.com/api/v1/search_by_date';

export const hn = (): SourceAdapter => ({
  id: 'hn',
  async fetchSince(cursor?: string) {
    const after = cursor ? Number(cursor) : Math.floor((Date.now() - 86_400_000) / 1000);
    const url = `${URL}?tags=story&numericFilters=points>30,created_at_i>${after}&query=${encodeURIComponent(QUERY)}`;
    const res = await fetch(url, { headers: { 'User-Agent': 'tensorcraft-pulse/1.0' } });
    if (!res.ok) throw new Error(`HN ${res.status}`);
    const json = await res.json() as { hits: Array<{ objectID: string; url: string; title: string; story_text?: string; created_at_i: number }> };
    const items: RawItem[] = json.hits
      .filter(h => h.url && h.title)
      .map(h => ({
        sourceId: h.objectID,
        url: h.url,
        title: h.title,
        bodyText: h.story_text,
        publishedAt: new Date(h.created_at_i * 1000),
        raw: h
      }));
    const newest = json.hits.reduce((m, h) => Math.max(m, h.created_at_i), after);
    return { items, nextCursor: String(newest) };
  }
});
```

- [ ] **Step 4: Test passes + commit**

```bash
pnpm --filter @tensorcraft/pulse-worker test
git add . && git commit -m "feat(pulse): HN adapter"
```

---

### Tasks 2.3–2.9: Remaining adapters

Each follows the same TDD pattern as 2.2:
1. Fetch real response once → save fixture
2. Test parses fixture → RawItem[]
3. Implement adapter
4. Verify + commit

| Task | Adapter | Endpoint / source | Notes |
|---|---|---|---|
| 2.3 | `lobsters.ts` | `https://lobste.rs/t/ai,programming.json` | Filter `tags` includes ML keywords |
| 2.4 | `hf-papers.ts` | `https://huggingface.co/api/daily_papers` | Already ranked, take top 20/day |
| 2.5 | `hf-models.ts` | `https://huggingface.co/api/models?sort=trendingScore&filter=tensorflow.js,onnxruntime,transformers.js` | Filter library tags |
| 2.6 | `blogs.ts` | RSS via `rss-parser`: googleai, openai, anthropic, meta-ai, mozilla | Single adapter w/ array of feeds |
| 2.7 | `gh-releases.ts` | `https://api.github.com/repos/{owner}/{repo}/releases` | Auth header `Bearer ${GITHUB_TOKEN}`; watchlist hardcoded |
| 2.8 | `gh-trending.ts` | Scrape `github.com/trending/javascript?since=daily` | HTML parse via `cheerio`; respect robots.txt |
| 2.9 | `x.ts` | RSS bridges (e.g. `https://nitter.net/{user}/rss`) | `status: 'best-effort'`, no body cache, fail soft |

Per-task: 4–6 commit cycles of ~5 min each. Watchlist for `gh-releases.ts`:

```ts
const RELEASES_WATCHLIST = [
  'tensorflow/tfjs', 'microsoft/onnxruntime',
  'huggingface/transformers.js', 'mlc-ai/web-llm',
  'google/mediapipe', 'pytorch/executorch'
];
```

---

## Phase 3 - Pipeline

### Task 3.1: Ingest - dedup + insert raw_items

**Files:**
- Create: `apps/pulse-worker/src/pipeline/ingest.ts`
- Create: `apps/pulse-worker/src/pipeline/__tests__/ingest.test.ts`

- [ ] **Step 1: Test ON CONFLICT skip**

```ts
it('skips duplicates by source+source_id', async () => {
  const item = { sourceId: 'x1', url: 'http://x/1', title: 't', raw: {} };
  await ingestItems('hn', [item, item]);
  const rows = await query<{ count: number }>(
    'SELECT count(*)::int FROM pulse_raw_items WHERE source=$1', ['hn']
  );
  expect(rows[0].count).toBe(1);
});
```

- [ ] **Step 2: Implement**

```ts
// src/pipeline/ingest.ts
import { query } from '../db';
import type { RawItem } from '../adapters/types';

export async function ingestItems(source: string, items: RawItem[]): Promise<string[]> {
  const inserted: string[] = [];
  for (const it of items) {
    const r = await query<{ id: string }>(
      `INSERT INTO pulse_raw_items (source, source_id, url, title, raw_payload, published_at)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (source, source_id) DO NOTHING
       RETURNING id`,
      [source, it.sourceId, it.url, it.title, JSON.stringify(it.raw), it.publishedAt ?? null]
    );
    if (r.length > 0) inserted.push(r[0].id);
  }
  return inserted;
}
```

- [ ] **Step 3: Verify + commit**

---

### Task 3.2: LLM summarizer (Claude Haiku)

**Files:**
- Create: `apps/pulse-worker/src/pipeline/summarize.ts`
- Test: `apps/pulse-worker/src/pipeline/__tests__/summarize.test.ts`

- [ ] **Step 1: Test schema validation rejects bad output**

```ts
it('rejects summary > 280 chars', () => {
  expect(() => parseSummary(JSON.stringify({ summary: 'a'.repeat(300) }))).toThrow();
});
```

- [ ] **Step 2: Implement**

```ts
// src/pipeline/summarize.ts
import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { env } from '../env';

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
const ResponseSchema = z.object({ summary: z.string().max(280) });

export function parseSummary(raw: string): string {
  const obj = JSON.parse(raw.match(/\{[\s\S]*\}/)?.[0] ?? raw);
  return ResponseSchema.parse(obj).summary;
}

export async function summarizeBatch(
  items: Array<{ id: string; title: string; bodyText?: string }>
): Promise<Map<string, string>> {
  const results = new Map<string, string>();
  for (const item of items) {
    const r = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 200,
      messages: [{
        role: 'user',
        content: `Summarize this for a browser-ML news feed in ≤280 chars. Return JSON {"summary": "..."}.\n\nTitle: ${item.title}\n\nBody: ${item.bodyText?.slice(0, 1500) ?? ''}`
      }]
    });
    const text = r.content.find(c => c.type === 'text')?.text ?? '{}';
    try {
      results.set(item.id, parseSummary(text));
    } catch {
      // skip malformed; will be retried next run if still relevant
    }
  }
  return results;
}
```

- [ ] **Step 3: Persist summaries**

```ts
export async function applySummaries(map: Map<string, string>): Promise<void> {
  for (const [id, summary] of map) {
    await query('UPDATE pulse_raw_items SET summary=$1 WHERE id=$2', [summary, id]);
  }
}
```

- [ ] **Step 4: Commit**

---

### Task 3.3: Item embedder

**Files:**
- Create: `apps/pulse-worker/src/pipeline/embed.ts`

- [ ] **Step 1: Embed unembedded rows in batches of 50**

```ts
// src/pipeline/embed.ts
import OpenAI from 'openai';
import { query } from '../db';
import { env } from '../env';

const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function embedNewItems(): Promise<number> {
  const rows = await query<{ id: string; title: string; summary: string | null }>(
    'SELECT id, title, summary FROM pulse_raw_items WHERE embedding IS NULL LIMIT 500'
  );
  if (rows.length === 0) return 0;

  const BATCH = 50;
  for (let i = 0; i < rows.length; i += BATCH) {
    const slice = rows.slice(i, i + BATCH);
    const res = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: slice.map(r => `${r.title}\n${r.summary ?? ''}`)
    });
    for (let j = 0; j < slice.length; j++) {
      await query(
        'UPDATE pulse_raw_items SET embedding=$1::vector WHERE id=$2',
        [JSON.stringify(res.data[j].embedding), slice[j].id]
      );
    }
  }
  return rows.length;
}
```

- [ ] **Step 2: Commit**

---

### Task 3.4: Matcher (pgvector cosine top-K)

**Files:**
- Create: `apps/pulse-worker/src/pipeline/match.ts`

- [ ] **Step 1: SQL - match unmatched items**

```ts
// src/pipeline/match.ts
import { query } from '../db';

export async function matchNewItems(topK = 5): Promise<number> {
  const r = await query<{ inserted: number }>(`
    WITH new_items AS (
      SELECT i.id, i.embedding
      FROM pulse_raw_items i
      LEFT JOIN pulse_item_lesson_matches m ON m.item_id = i.id
      WHERE i.embedding IS NOT NULL AND m.item_id IS NULL
    ),
    ranked AS (
      SELECT
        ni.id AS item_id,
        le.lesson_slug,
        1 - (ni.embedding <=> le.embedding) AS similarity,
        ROW_NUMBER() OVER (PARTITION BY ni.id
                           ORDER BY ni.embedding <=> le.embedding) AS rk
      FROM new_items ni CROSS JOIN pulse_lesson_embeddings le
    ),
    inserted AS (
      INSERT INTO pulse_item_lesson_matches (item_id, lesson_slug, similarity)
      SELECT item_id, lesson_slug, similarity FROM ranked WHERE rk <= $1
      ON CONFLICT DO NOTHING
      RETURNING 1
    )
    SELECT count(*)::int AS inserted FROM inserted;
  `, [topK]);
  return r[0]?.inserted ?? 0;
}
```

- [ ] **Step 2: Commit**

---

### Task 3.5: Scorer

**Files:**
- Create: `apps/pulse-worker/src/pipeline/score.ts`
- Test: `apps/pulse-worker/src/pipeline/__tests__/score.test.ts`

- [ ] **Step 1: Pure function tests**

```ts
import { qualityScore } from '../score';

it('weights freshness inversely with age', () => {
  const fresh = qualityScore({ source: 'hn', ageHours: 1, engagement: 50, topMatch: 0.5 });
  const stale = qualityScore({ source: 'hn', ageHours: 720, engagement: 50, topMatch: 0.5 });
  expect(fresh).toBeGreaterThan(stale);
});
```

- [ ] **Step 2: Implement**

```ts
// src/pipeline/score.ts
const SOURCE_WEIGHT: Record<string, number> = {
  'hn': 0.6, 'lobsters': 0.55, 'hf:papers': 0.9, 'hf:models': 0.75,
  'gh:trending': 0.5, 'x': 0.4
};

export function qualityScore(input: {
  source: string;
  ageHours: number;
  engagement: number;
  topMatch: number;
}): number {
  const sourceWeight = input.source.startsWith('gh:release:') ? 1.0
    : input.source.startsWith('blog:') ? 0.85
    : SOURCE_WEIGHT[input.source] ?? 0.5;
  const freshness = Math.max(0, 1 - input.ageHours / 168); // 7-day decay
  const engagement = Math.min(1, input.engagement / 200);
  return sourceWeight * 0.4 + freshness * 0.3 + engagement * 0.2 + input.topMatch * 0.1;
}

export async function scoreAll(): Promise<void> {
  const rows = await query<{ id: string; source: string; published_at: Date; raw_payload: any; top_sim: number | null }>(`
    SELECT i.id, i.source, i.published_at, i.raw_payload,
           (SELECT max(similarity) FROM pulse_item_lesson_matches m WHERE m.item_id = i.id) AS top_sim
    FROM pulse_raw_items i
    WHERE i.quality_score IS NULL
  `);
  for (const r of rows) {
    const ageHours = r.published_at ? (Date.now() - new Date(r.published_at).getTime()) / 3_600_000 : 24;
    const engagement = (r.raw_payload?.points ?? r.raw_payload?.likes ?? r.raw_payload?.stars ?? 0) as number;
    const score = qualityScore({ source: r.source, ageHours, engagement, topMatch: r.top_sim ?? 0 });
    await query('UPDATE pulse_raw_items SET quality_score=$1 WHERE id=$2', [score, r.id]);
  }
}
```

- [ ] **Step 3: Commit**

---

### Tasks 3.6–3.8: Publisher, Queuer, Sweeper

| Task | File | Behavior |
|---|---|---|
| 3.6 | `pipeline/publish.ts` | INSERT into `pulse_items` WHERE `quality_score >= env.PULSE_THRESHOLD`, pick `theme_id` from top match, set `expires_at = now() + interval '$TTL_DAYS days'` |
| 3.7 | `pipeline/queue.ts` | INSERT into `pulse_editor_queue (status='pending')` for items where top1 similarity >= `env.LESSON_THRESHOLD` |
| 3.8 | `pipeline/sweep.ts` | `DELETE FROM pulse_items WHERE expires_at < now()` |

Each: ~5 min - write SQL, test against staging, commit.

---

## Phase 4 - Signal detector

### Task 4.1: Lib keywords + symbol regex

**Files:**
- Create: `apps/pulse-worker/src/signals/keywords.ts`

```ts
export const LIB_KEYWORDS: Record<string, string[]> = {
  'tensorflow/tfjs': ['tensorflow.js', 'tfjs', 'tf.layers', 'tf.tensor'],
  'microsoft/onnxruntime': ['onnxruntime', 'onnx', 'ort.InferenceSession'],
  'huggingface/transformers.js': ['transformers.js', 'pipeline', 'AutoTokenizer'],
  'mlc-ai/web-llm': ['webllm', 'mlc-ai'],
  'google/mediapipe': ['mediapipe', 'tasks-vision'],
  'pytorch/executorch': ['executorch', 'pytorch']
};

export const SYMBOL_RE = /\b(tf\.[\w.]+|ort\.[\w.]+|pipeline\([^)]+\)|AutoTokenizer\.\w+)/g;

export function extractSymbols(text: string): string[] {
  return Array.from(new Set(text.match(SYMBOL_RE) ?? []));
}
```

Test extracts symbols from sample release note; commit.

---

### Task 4.2: Trigger A - release-keyword

```ts
// src/signals/detect-keyword.ts
const BREAKING_RE = /BREAKING|breaking change|removed|deprecat(ed|ion)/i;

export async function detectKeywordSignals(): Promise<number> {
  const releases = await query<{ id: string; source: string; raw_payload: any }>(`
    SELECT i.id, i.source, i.raw_payload
    FROM pulse_raw_items i
    WHERE i.source LIKE 'gh:release:%'
      AND i.scraped_at > now() - interval '1 day'
  `);
  let inserted = 0;
  for (const r of releases) {
    const repo = r.source.replace('gh:release:', '');
    const text = `${r.raw_payload.name ?? ''} ${r.raw_payload.body ?? ''}`;
    if (!BREAKING_RE.test(text)) continue;
    const keywords = LIB_KEYWORDS[repo];
    if (!keywords) continue;
    const lessons = await query<{ lesson_slug: string }>(
      'SELECT lesson_slug FROM pulse_lesson_embeddings WHERE keywords && $1',
      [keywords]
    );
    for (const l of lessons) {
      const r2 = await query(`
        INSERT INTO pulse_rewrite_signals (lesson_slug, trigger, severity, evidence, source_release)
        VALUES ($1, 'release_keyword', 'med', $2, $3)
        ON CONFLICT (lesson_slug, source_release, trigger) DO NOTHING
        RETURNING id
      `, [l.lesson_slug, JSON.stringify({ release_url: r.raw_payload.html_url, excerpt: text.slice(0, 500) }), `${repo}@${r.raw_payload.tag_name}`]);
      if (r2.length > 0) inserted++;
    }
  }
  return inserted;
}
```

Test with fake release row; commit.

---

### Task 4.3: Trigger B - API symbol grep

Same pattern. Read lesson MDX from `.velite/lessons.json`, grep code blocks for each symbol, insert signal with `severity = 'high'` if symbol appears in BREAKING section else `'low'`.

---

### Task 4.4: Trigger D - LLM diff (escalation)

**Files:**
- Create: `apps/pulse-worker/src/signals/detect-llm.ts`

- [ ] **Step 1: Select candidates (max 20/day)**

```ts
const candidates = await query<{ lesson_slug: string; release_id: string; release_body: string }>(`
  SELECT DISTINCT s.lesson_slug, i.id AS release_id, i.raw_payload->>'body' AS release_body
  FROM pulse_rewrite_signals s
  JOIN pulse_raw_items i ON i.id::text = s.evidence->>'release_id'
  WHERE s.severity IN ('med','high')
    AND s.trigger IN ('release_keyword','api_symbol')
    AND NOT EXISTS (
      SELECT 1 FROM pulse_rewrite_signals s2
      WHERE s2.lesson_slug = s.lesson_slug
        AND s2.source_release = s.source_release
        AND s2.trigger = 'llm_diff'
    )
  LIMIT 20
`);
```

- [ ] **Step 2: For each, call Claude Haiku w/ structured prompt**

```ts
for (const c of candidates) {
  const lesson = lessonsById.get(c.lesson_slug);
  if (!lesson) continue;
  const codeBlocks = extractCodeBlocks(lesson.body);
  const r = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 600,
    messages: [{
      role: 'user',
      content: `Release notes:\n${c.release_body}\n\nLesson code:\n${codeBlocks.join('\n---\n')}\n\nQuestion: would this lesson code still run on the new lib version? Output JSON: {"breaks": bool, "severity": "low"|"med"|"high", "reasoning": str, "suggested_fix": str|null}`
    }]
  });
  const json = parseJson(r.content[0].type === 'text' ? r.content[0].text : '{}');
  await query(`
    INSERT INTO pulse_rewrite_signals (lesson_slug, trigger, severity, evidence, source_release, status)
    VALUES ($1, 'llm_diff', $2, $3, $4, $5)
    ON CONFLICT (lesson_slug, source_release, trigger) DO UPDATE
      SET evidence = EXCLUDED.evidence, severity = EXCLUDED.severity
  `, [c.lesson_slug, json.severity, JSON.stringify(json), `release_${c.release_id}`,
      json.breaks ? 'open' : 'dismissed']);
}
```

- [ ] **Step 3: Commit**

---

## Phase 5 - Cron orchestration

### Task 5.1: Pipeline orchestrator

**Files:**
- Create: `apps/pulse-worker/src/cron.ts`

```ts
import { hn, lobsters, hfPapers, hfModels, blogs, ghReleases, ghTrending, x } from './adapters';
import { safeFetch } from './adapters/types';
import { ingestItems } from './pipeline/ingest';
import { summarizeBatch, applySummaries } from './pipeline/summarize';
import { embedNewItems } from './pipeline/embed';
import { matchNewItems } from './pipeline/match';
import { scoreAll } from './pipeline/score';
import { publishHighQuality } from './pipeline/publish';
import { enqueueEditorCandidates } from './pipeline/queue';
import { sweepExpired } from './pipeline/sweep';
import { detectKeywordSignals } from './signals/detect-keyword';
import { detectSymbolSignals } from './signals/detect-symbol';
import { detectLlmSignals } from './signals/detect-llm';
import { checkBudget, recordCost } from './lib/budget';
import { sendReport } from './lib/report';

const adapters = [hn(), lobsters(), hfPapers(), hfModels(), blogs(), ghReleases(), ghTrending(), x()];

export async function runDaily(opts: { dryRun?: boolean } = {}): Promise<void> {
  await checkBudget();

  const fanout = await Promise.all(adapters.map(a => safeFetch(a)));
  const counts: Record<string, number> = {};
  let inserted = 0;

  for (let i = 0; i < adapters.length; i++) {
    const r = fanout[i];
    counts[adapters[i].id] = r.items.length;
    if (r.ok && !opts.dryRun) {
      const ids = await ingestItems(adapters[i].id, r.items);
      inserted += ids.length;
    }
  }

  if (opts.dryRun) {
    console.log(JSON.stringify({ counts }, null, 2));
    return;
  }

  // summarize → embed → match → score → publish/queue → signals
  const newRows = await query<{ id: string; title: string; bodyText: string | null }>(
    "SELECT id, title, raw_payload->>'story_text' as bodyText FROM pulse_raw_items WHERE summary IS NULL LIMIT 200"
  );
  const summaries = await summarizeBatch(newRows);
  await applySummaries(summaries);

  await embedNewItems();
  await matchNewItems();
  await scoreAll();
  await publishHighQuality();
  await enqueueEditorCandidates();
  await sweepExpired();

  await detectKeywordSignals();
  await detectSymbolSignals();
  await detectLlmSignals();

  await sendReport({ counts, inserted });
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const dryRun = process.argv.includes('--dry-run');
  runDaily({ dryRun }).then(() => process.exit(0)).catch(e => {
    console.error(e); process.exit(1);
  });
}
```

Test runs end-to-end with dry-run flag against staging; commit.

---

### Task 5.2: Cost tracker + budget guard

```ts
// src/lib/budget.ts
export async function recordCost(kind: 'embeddings' | 'haiku', usd: number): Promise<void> {
  await query(`
    INSERT INTO pulse_cost_log (day, embeddings_usd, haiku_usd)
    VALUES (current_date, $1, $2)
    ON CONFLICT (day) DO UPDATE
      SET embeddings_usd = pulse_cost_log.embeddings_usd + EXCLUDED.embeddings_usd,
          haiku_usd      = pulse_cost_log.haiku_usd      + EXCLUDED.haiku_usd
  `, [kind === 'embeddings' ? usd : 0, kind === 'haiku' ? usd : 0]);
}

export async function checkBudget(): Promise<void> {
  const r = await query<{ total: number }>(
    'SELECT total_usd::float AS total FROM pulse_cost_log WHERE day = current_date'
  );
  const today = r[0]?.total ?? 0;
  if (today > env.MAX_DAILY_USD) throw new Error(`Daily budget exceeded: $${today}`);
}
```

Wrap embed + summarize calls to record per-call cost. Commit.

---

### Task 5.3: Run report (Slack)

```ts
// src/lib/report.ts
export async function sendReport(data: {
  counts: Record<string, number>;
  inserted: number;
}): Promise<void> {
  if (!env.SLACK_WEBHOOK_URL) return;
  const text = `🌊 Pulse run\nInserted: ${data.inserted}\n` +
    Object.entries(data.counts).map(([k, v]) => `  ${k}: ${v}`).join('\n');
  await fetch(env.SLACK_WEBHOOK_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ text })
  });
}
```

Commit.

---

## Phase 6 - Public surfaces

### Task 6.1: getPulseItems server fn

**Files:**
- Create: `apps/web/app/pulse/_lib/queries.ts`

```ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface PulseCard {
  id: string;
  source: string;
  url: string;
  title: string;
  summary: string;
  publishedAt: string;
  themeId: string | null;
  linkedLessons: { slug: string; title: string }[];
}

export async function getPulseItems(opts: { themeId?: string; limit?: number } = {}): Promise<PulseCard[]> {
  const { data } = await supabase
    .from('pulse_items')
    .select(`
      item_id, theme_id, rank_score, published_at,
      raw:pulse_raw_items!inner(source, url, title, summary),
      matches:pulse_item_lesson_matches(lesson_slug, similarity)
    `)
    .eq(opts.themeId ? 'theme_id' : '', opts.themeId ?? '')
    .order('rank_score', { ascending: false })
    .limit(opts.limit ?? 20);
  // map + join lesson titles from velite data
  return (data ?? []).map(/* ... */);
}
```

Commit.

---

### Tasks 6.2–6.7: Pages + components

| Task | File | Notes |
|---|---|---|
| 6.2 | `app/pulse/page.tsx` | Server component, calls `getPulseItems()`, renders grid of `<PulseCard>` |
| 6.3 | `app/pulse/[themeId]/page.tsx` | Same but filters by theme; theme tab nav |
| 6.4 | `app/pulse/_components/pulse-card.tsx` | Source badge, title, summary, age, linked-lesson chips |
| 6.5 | `app/pulse/_lib/queries.ts` add `getCurrentsForLesson(slug)` | Reads `pulse_lesson_currents` joined with `pulse_raw_items` |
| 6.6 | `packages/ui/src/mdx/currents.tsx` | `<Currents>` component, accepts items prop, dim styling, max 3 cards |
| 6.7 | Modify lesson page renderer | Inject `<Currents>` between Concept and Code; locate via grep `\[lesson\]` route file in `apps/web/app/` |

Each: ~5–10 min - copy theme styling from existing dashboard cards, write minimal snapshot test, commit.

---

## Phase 7 - Admin surfaces

### Task 7.1: /admin/queue

**Files:**
- Create: `apps/web/app/admin/queue/page.tsx`
- Create: `apps/web/app/admin/queue/_actions.ts`

- [ ] **Step 1: Auth gate via existing `tc_admin` middleware**

Locate existing admin route examples (e.g. `apps/web/app/admin/...`) and mirror the auth pattern.

- [ ] **Step 2: Server actions**

```ts
'use server';
export async function approveQueueItem(formData: FormData): Promise<void> {
  const itemId = formData.get('item_id') as string;
  const lessonSlug = formData.get('lesson_slug') as string;
  await supabase.from('pulse_editor_queue').update({
    status: 'approved', decided_by: user.email, decided_at: new Date().toISOString()
  }).eq('item_id', itemId).eq('lesson_slug', lessonSlug);
  // determine next position
  const { data: existing } = await supabase
    .from('pulse_lesson_currents')
    .select('position')
    .eq('lesson_slug', lessonSlug);
  const nextPos = (existing?.length ?? 0) + 1;
  await supabase.from('pulse_lesson_currents').insert({
    lesson_slug: lessonSlug, item_id: itemId, position: nextPos
  });
}

export async function rejectQueueItem(formData: FormData): Promise<void> { /* ... */ }
```

- [ ] **Step 3: Page table - pending items sorted by similarity DESC, [Approve] [Reject] [Skip] forms**

- [ ] **Step 4: Commit**

---

### Task 7.2: Keyboard shortcuts + bulk approve

Client component overlay binding `j/k/a/r/s` to dispatch the same server actions; "Bulk approve all >0.85" calls a multi-row server action.

---

### Task 7.3: /admin/signals

Mirror 7.1 pattern. Detail drawer renders `evidence` jsonb. Actions: acknowledge, dismiss, mark fixed.

---

## Phase 8 - Deploy

### Task 8.1: Dockerfile

**Files:**
- Create: `apps/pulse-worker/Dockerfile`

```dockerfile
FROM node:20-slim AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml turbo.json ./
COPY apps/pulse-worker/package.json apps/pulse-worker/
RUN corepack enable && pnpm install --frozen-lockfile --prod=false

FROM deps AS build
COPY . .
RUN pnpm --filter @tensorcraft/pulse-worker build

FROM node:20-slim AS run
WORKDIR /app
COPY --from=build /app/apps/pulse-worker/dist ./dist
COPY --from=build /app/apps/pulse-worker/package.json ./
COPY --from=build /app/node_modules ./node_modules
CMD ["node", "dist/cron.js"]
```

Commit.

---

### Task 8.2: fly.toml

```toml
app = "tc-pulse"
primary_region = "iad"

[build]
  dockerfile = "apps/pulse-worker/Dockerfile"

[[mounts]]

[machine]
  size = "shared-cpu-1x"
  memory = "512mb"

# Daily cron at 06:00 UTC
[[machine.schedules]]
  schedule = "0 6 * * *"
  command = ["node", "dist/cron.js"]
```

Set secrets via `fly secrets set` for: `SUPABASE_DB_URL`, `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GITHUB_TOKEN`, `SLACK_WEBHOOK_URL`, `MAX_DAILY_USD`.

- [ ] `fly deploy --app tc-pulse`
- [ ] `fly machine run --app tc-pulse --schedule daily`
- [ ] Commit fly.toml.

---

### Task 8.3: Production smoke test

- [ ] Manual cron trigger: `fly ssh console -a tc-pulse -C 'node dist/cron.js --dry-run'`
- [ ] Verify counts > 0 per source.
- [ ] Real run: `fly ssh console -a tc-pulse -C 'node dist/cron.js'`
- [ ] `SELECT count(*) FROM pulse_items WHERE published_at > now()-interval '1h'` ≥ 10
- [ ] Visit `https://tensorcraft.app/pulse` - feed renders.
- [ ] Visit `/pulse/deep-orbit` - theme filter works.
- [ ] Visit `/admin/queue` - items pending.
- [ ] Approve 1 → visit linked lesson → Currents block renders.
- [ ] Insert fake release w/ `BREAKING` body → `/admin/signals` row appears within 1 cron cycle.

---

## Reactivation Checklist

When V1 launch is settled and you want to start this:

1. Move spec from `~/.claude/plans/brainstorm-how-to-keep-giggly-lightning.md` to `docs/superpowers/specs/2026-05-01-pulse-content-freshness-design.md` and commit.
2. Update this plan's status header to ACTIVE.
3. Run plan-document-reviewer subagent on this plan; fix issues.
4. Choose execution mode (subagent-driven vs inline).
5. Begin with Task 0.1.

## References
- Spec: `~/.claude/plans/brainstorm-how-to-keep-giggly-lightning.md`
- Related: `docs/post-launch-backlog.md` (canonical post-launch index), `docs/dev-plan.md`
- Existing patterns to follow: `apps/api/` for service structure, `packages/supabase/migrations/` for schema, `apps/web/app/admin/` (if exists) for admin route conventions.
