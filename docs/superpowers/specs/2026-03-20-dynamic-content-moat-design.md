# Dynamic Content Moat — Design Spec

## Context

TensorCraft's content (275 MDX lessons, 200+ YAML exercises, 50 bridge definitions) is static and reproducible. This spec defines the **V0.5 "light moat"** — a data foundation and personalization layer that ships with launch, plus a roadmap for heavier moat features post-PMF.

**Problem:** ~80% of TensorCraft's value is static files that could be cloned after purchase.
**Solution:** Ship a tracking foundation and personalized bridge delivery now; layer on AI-powered features after proving product-market fit.
**Timeline:** 2-3 weeks of engineering work, parallel to content writing.

---

## Architecture Overview

### V0.5 Scope (This Spec — Ship With Launch)

```text
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Skill Genome   │     │  Adaptive        │     │  Onboarding      │
│  (schema +      │     │  Bridges         │     │  Persistence     │
│   event logging)│     │  (20 shared,     │     │  (fix lost data) │
│                 │     │   framework-     │     │                  │
│                 │     │   personalized)  │     │                  │
└─────────────────┘     └──────────────────┘     └──────────────────┘
```

### Future Roadmap (Post-PMF, Not In Scope)

Saved in this spec for reference. Build priority determined by user data from V0.5.

- **V0.8:** Portfolio Generator, Spaced Repetition, Adaptive Bridges (all 50)
- **V1.0:** Dynamic Exercise Generation (AI-powered), AI Wrong Moments

---

## V0.5 Feature 1: Skill Genome — Data Foundation

A per-user, per-skill event log that captures every learning signal. In V0.5, we **log events only** — no proficiency computation, no UI. The data accumulates silently so future features have a foundation.

### Skill Dimensions (6 axes)

| Axis | Measures | Signal Sources |
| --- | --- | --- |
| Data Prep | Tensor ops, normalization, augmentation | Exercise scores on data lessons |
| Model Architecture | Layers, activations, network design | Exercise scores, hint usage |
| Training | Loss functions, optimizers, epochs | Exercise scores, attempt count |
| Evaluation | Metrics, overfitting detection | Quiz scores, capstone rubrics |
| Deployment | Browser inference, WASM optimization | Exercise scores on deployment lessons |
| FE Integration | Bridge comprehension, JS/ML interop | Bridge interaction tracking |

### Schema

#### New table: `skill_genome` (pre-created, populated later)

```sql
CREATE TABLE public.skill_genome (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme_id TEXT NOT NULL,
  skill_axis TEXT NOT NULL CHECK (skill_axis IN (
    'data_prep', 'model_arch', 'training', 'evaluation', 'deployment', 'fe_integration'
  )),
  proficiency NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (proficiency >= 0 AND proficiency <= 100),
  confidence NUMERIC(3,2) NOT NULL DEFAULT 0.00 CHECK (confidence >= 0 AND confidence <= 1),
  velocity NUMERIC(5,2) NOT NULL DEFAULT 0.00 CHECK (velocity BETWEEN -100.00 AND 100.00),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE(user_id, theme_id, skill_axis)
);

CREATE INDEX idx_skill_genome_user ON public.skill_genome(user_id);
CREATE INDEX idx_skill_genome_user_theme ON public.skill_genome(user_id, theme_id);

CREATE TRIGGER skill_genome_updated_at
  BEFORE UPDATE ON public.skill_genome
  FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at();

-- RLS
ALTER TABLE public.skill_genome ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own genome"
  ON public.skill_genome FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages genome"
  ON public.skill_genome FOR ALL
  USING (auth.role() = 'service_role');
```

**V0.5 note:** Table is created but rows are not populated. Proficiency computation comes in V0.8+. The table exists so the migration doesn't need to run retroactively.

#### New table: `skill_events` (append-only signal log)

```sql
CREATE TABLE public.skill_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  theme_id TEXT NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN (
    'exercise_pass', 'exercise_fail', 'hint_reveal', 'solution_view',
    'lesson_complete', 'bridge_interaction', 'review_recall'
  )),
  skill_axis TEXT NOT NULL CHECK (skill_axis IN (
    'data_prep', 'model_arch', 'training', 'evaluation', 'deployment', 'fe_integration'
  )),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_skill_events_user ON public.skill_events(user_id);
CREATE INDEX idx_skill_events_user_theme ON public.skill_events(user_id, theme_id);
CREATE INDEX idx_skill_events_user_axis ON public.skill_events(user_id, skill_axis);
CREATE INDEX idx_skill_events_created ON public.skill_events(created_at);

-- RLS
ALTER TABLE public.skill_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
  ON public.skill_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role inserts events"
  ON public.skill_events FOR INSERT
  USING (auth.role() = 'service_role');
```

**Retention strategy:** Archive events older than 90 days to cold storage once table exceeds 1M rows. Not needed at V0.5 scale.

#### Additions to `profiles` table

```sql
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS fe_background TEXT,
  ADD COLUMN IF NOT EXISTS learning_goal TEXT,
  ADD COLUMN IF NOT EXISTS fe_framework TEXT CHECK (fe_framework IN ('react', 'vue', 'angular', 'svelte', 'vanilla')),
  ADD COLUMN IF NOT EXISTS fe_experience_years INTEGER CHECK (fe_experience_years >= 0 AND fe_experience_years <= 50);
```

### Event Emission (V0.5 Implementation)

On each user action, insert a `skill_event` row via the API. No proficiency computation — just log the raw data.

| User Action | Event Type | Metadata Logged |
| --- | --- | --- |
| Exercise passes | exercise_pass | `{score, hints_used, attempts, duration_ms, exercise_slug, skill_axis}` |
| Exercise fails | exercise_fail | `{attempts, duration_ms, exercise_slug, skill_axis}` |
| Hint revealed | hint_reveal | `{hint_level, exercise_slug, skill_axis}` |
| Solution viewed | solution_view | `{exercise_slug, skill_axis}` |
| Lesson completed | lesson_complete | `{lesson_id, module_id, skill_axes}` |

### Content Annotations

Add optional `skillAxes` / `skillAxis` fields to content schemas:

```typescript
// In Velite lesson schema — OPTIONAL, default []
skillAxes: z.array(z.enum([
  'data_prep', 'model_arch', 'training', 'evaluation', 'deployment', 'fe_integration'
])).optional().default([])

// In exercise YAML schema — OPTIONAL, default undefined
skillAxis: z.enum([
  'data_prep', 'model_arch', 'training', 'evaluation', 'deployment', 'fe_integration'
]).optional()
```

**V0.5 scope:** Annotate the 25 existing Deep Orbit lessons and 24 exercises with appropriate axes. Unannotated content defaults to no event emission (graceful degradation).

---

## V0.5 Feature 2: Onboarding Persistence Fix

Currently, onboarding captures `fe_background` and `learning_goal` in React state but never persists them. Only `preferred_theme_id` is saved. Fix this.

### Changes to Onboarding Flow

**Existing steps** (no change to UX):

1. Welcome
2. Background Assessment → save to `profiles.fe_background`
3. Learning Goal → save to `profiles.learning_goal`

**New step** (insert between steps 2 and 3):

4. **"What's your primary framework?"** → save to `profiles.fe_framework`
   - Options: React, Vue, Angular, Svelte, Vanilla JS

5. Theme Selection (existing)
6. Ready / Launch (existing)

### Database Persistence

Update the onboarding completion handler:

```typescript
await supabase
  .from("profiles")
  .update({
    onboarding_completed: true,
    preferred_theme_id: selectedTheme,
    fe_background: selectedBackground,    // NEW: was lost in React state
    learning_goal: selectedGoal,          // NEW: was lost in React state
    fe_framework: selectedFramework,      // NEW: new onboarding step
  })
  .eq("id", user.id);
```

---

## V0.5 Feature 3: Adaptive Bridges (20 Shared Bridges)

### Bridge Variant Structure

Extend `packages/shared/src/bridges.ts`:

```typescript
type Framework = 'react' | 'vue' | 'angular' | 'svelte' | 'vanilla';

interface BridgeVariant {
  feCode: string;
  feConcept?: string;  // Override when framework uses different terminology
}

interface Bridge {
  id: number;
  mlConcept: string;
  feConcept: string;
  tier: BridgeTier;
  connection: string;
  category: BridgeCategory;
  variants?: Partial<Record<Framework, BridgeVariant>>;  // OPTIONAL — fallback to generic
  mlCode: string;
}
```

**Key design decision:** `variants` is optional and uses `Partial<Record>`. Bridges without variants render the existing generic `feConcept`. Bridges with partial framework coverage (e.g., React + Vue but not Angular) fall back to `vanilla` or generic.

### Runtime Resolution

```typescript
function BridgeCallout({ bridge }: { bridge: Bridge }) {
  const { user } = useSession();
  const framework = user?.fe_framework || 'vanilla';

  // Fallback chain: user's framework → vanilla → generic (no variant)
  const variant = bridge.variants?.[framework]
    ?? bridge.variants?.['vanilla']
    ?? null;

  return (
    <div className="bridge-callout">
      <div className="fe-side">
        <h4>{variant?.feConcept || bridge.feConcept}</h4>
        <CodeBlock>{variant?.feCode || bridge.connection}</CodeBlock>
      </div>
      <div className="ml-side">
        <h4>{bridge.mlConcept}</h4>
        <CodeBlock>{bridge.mlCode}</CodeBlock>
      </div>
    </div>
  );
}
```

### V0.5 Scope

- Write framework variants for the **20 shared bridges** (bridges #1-20)
- Each bridge gets 5 framework variants = 100 code snippets total
- Use Claude to draft variants, human-review before committing as static content
- Theme-specific bridges (30) get variants post-V0.5

### Variant Content Production

Use a batch Claude prompt to generate all 100 variants, then review:

```text
For each of these 20 ML-to-FE bridges, write idiomatic code examples
in React, Vue, Angular, Svelte, and Vanilla JS that demonstrate the
FE concept. Keep snippets under 8 lines. Use current framework APIs
(React 18+, Vue 3, Angular 17+, Svelte 5, ES2022).
```

Estimated production time: 1 day to generate + 1 day to review/edit.

---

## Files to Modify (V0.5)

| File | Change |
| --- | --- |
| `packages/supabase/migrations/010_skill_genome.sql` | New migration: skill_genome, skill_events tables, profiles columns, RLS policies |
| `packages/shared/src/bridges.ts` | Add optional `variants` field to Bridge interface, populate 20 shared bridges |
| `apps/web/app/onboarding/page.tsx` | Add framework selection step, persist background + goal + framework to DB |
| `apps/web/lib/progress-client.ts` | Emit skill_events on exercise pass/fail/hint/solution/lesson completion |
| `packages/content/velite.config.ts` | Add optional `skillAxes` to lesson schema, optional `skillAxis` to exercise schema |
| `packages/ui/src/mdx/bridge-callout.tsx` | Read user framework, render matching variant with fallback chain |
| `apps/api/src/routes/skill-events.ts` | New API route for inserting skill events |
| Deep Orbit lesson MDX (25 files) | Add `skillAxes` frontmatter field |
| Deep Orbit exercise YAML (24 files) | Add `skillAxis` field |

---

## Verification Plan

### Happy Path

1. **Onboarding persistence:** Complete onboarding → query profiles table → verify `fe_framework`, `fe_background`, `learning_goal` are saved
2. **Skill event logging:** Complete an exercise → query skill_events table → verify event row inserted with correct metadata
3. **Adaptive bridges (React):** Set framework to React → load a lesson with a shared bridge → verify React code snippet appears
4. **Adaptive bridges (Vue):** Change framework to Vue → reload same lesson → verify Vue code snippet appears
5. **Adaptive bridges (fallback):** Load a theme-specific bridge (no variants yet) → verify generic `feConcept` renders without error
6. **Migration safety:** Run all 10 migrations on fresh DB → verify no errors, all constraints and RLS policies hold

### Edge Cases

7. **Cold start:** New user who skips onboarding → verify bridges render generic variant, skill events emit with `skill_axis: null` gracefully (or are skipped)
8. **Framework change:** User changes `fe_framework` in settings after completing lessons → verify bridges update immediately, existing skill_events retain original framework in metadata
9. **Unannotated content:** Load a lesson without `skillAxes` → verify no skill event is emitted, no error thrown
10. **Missing bridge variant:** Bridge has React and Vue variants but user selected Angular → verify vanilla fallback renders

---

## Future Roadmap (Reference Only — Not V0.5 Scope)

### V0.8: Portfolio Generator + Spaced Repetition

**Portfolio Generator** — public profile at `tensorcraft.app/@username`:

- Skill Radar (6-axis SVG from Genome data)
- Completed capstones with embedded Sandpack demos
- Bridge mastery map by tier
- Learning journey timeline
- GitHub integration (auto-commit capstones to portfolio repo)

**Spaced Repetition** — Modified SM-2 algorithm:

- Bridge concepts enter review queue after lesson completion
- Micro-challenges (30-60s): multiple choice, code snippets, free text
- Dashboard widget: "N concepts ready for review"
- Quality-to-score mapping: MC wrong=1/right=4, code wrong=1/partial=3/right=5

**Schema additions** (V0.8 migration):

```sql
-- review_schedule table
-- portfolio_settings table with CHECK (username_slug ~ '^[a-z0-9][a-z0-9_-]{2,29}$')
```

### V1.0: Dynamic Exercises + AI Wrong Moments

**Dynamic Exercise Generation:**

- Exercise templates with parameterized scenarios and difficulty scaling
- Claude API (Haiku) generates variations based on Skill Genome proficiency
- Validation pipeline: JS parse check → solution passes tests → invariant check
- Cache key: `hash(template_slug + difficulty + scenario + fe_framework)`
- Static YAML fallback on any failure
- Per-template circuit breaker: 3 consecutive failures disables dynamic generation
- Cost: ~$0.02/exercise generation, ~$5-15/month at 500 users

**AI Wrong Moments:**

- 20% random trigger after exercise pass (or targeted at overconfident profiles)
- Claude analyzes submitted code, introduces realistic bug
- Learner diagnoses and fixes; AI debriefs on production ML implications
- Uses service role to read exercise_attempts (bypasses RLS)
- Trigger mechanism: client calls API after exercise pass, server decides whether to generate challenge
- Cost: ~$0.05-0.10/challenge

### Proficiency Algorithm (V0.8+ — When Genome Goes Live)

Source of truth: weighted average recomputed from last N events per insertion. `skill_events` metadata is the raw input.

```text
proficiency = weighted_average(
  recent_exercise_scores     × 0.40
  hint_penalty               × 0.15
  attempt_efficiency          × 0.15
  time_efficiency             × 0.10
  solution_view_penalty       × 0.10
  spaced_recall_accuracy      × 0.10
)

confidence = min(1.0, event_count / 10)

velocity = linear regression slope of proficiency across last 5 events
           for (user, theme, skill_axis). Returns 0.0 when < 2 events.
```
