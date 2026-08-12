# Future: AI-Generated Video Scenes

> Status: **Deferred** (2026-04-15) — revisit when budget allows (~$540-1,140 one-time generation cost)
> Supersedes: Audio narration deferral (2026-04-14) — video includes voice acting, making standalone audio redundant

## Overview

Replace all text-based narrative content (Dialogue, SceneHeading, stage directions, context/consequence narratives) with short AI-generated stylized video clips. Existing screenplay text becomes synchronized captions/subtitles.

This transforms the lesson experience from "reading a screenplay" to "watching an animated series" while preserving full accessibility through captions.

## What Was Decided

| Decision | Choice |
|----------|--------|
| **Scope** | All narrative moments across all 6 lesson steps |
| **Video style** | Stylized/animated (per-world art direction, not photorealistic) |
| **Generation timing** | Pre-generated at build time, stored as static assets |
| **Text handling** | Video primary, existing screenplay text becomes captions/subtitles |
| **Clip length** | Short (5-15 seconds each), multiple clips per scene |
| **Generation tool** | Runway Gen-3/4 |
| **Audio** | AI voice acting (ElevenLabs) + ambient soundscapes per world |

## Recommended Approach: Video Component Swap

Replace `<Dialogue>`, `<SceneHeading>`, and narrative prose with a single `<VideoScene>` MDX component. The existing lesson structure (MDX, Velite, 6-step progression) stays intact.

### New `<VideoScene>` Component

```mdx
<!-- Replaces multiple <Dialogue> and narrative elements -->
<VideoScene
  clips={["neon-01-seeing-beat-01", "neon-01-seeing-beat-02"]}
  captions={[
    { speaker: "Dilan", text: "When you need to sort an array...", start: 0, end: 6.5 },
    { speaker: "Noor", text: "Exactly. Transfer learning is the npm install of ML.", start: 7, end: 11 }
  ]}
/>
```

**Fallback:** If `clips` is empty or fails to load, the component renders captions as styled text (identical to current `<Dialogue>` appearance). Zero-config graceful degradation.

### Schema Changes (schemas.ts)

- Add optional `videoClips` field to lesson schema — maps beat IDs to CDN URLs and metadata (duration, aspect ratio)
- Add `captions` structure — derived from existing dialogue/narrative text with timing data
- Existing `scene`, `context.narrative`, `consequence.narrative` fields remain as source material for prompt generation

## Generation Pipeline (4 Stages)

### Stage 1: Author
Content author writes a `video-spec.yaml` alongside each MDX lesson:

```yaml
world_style_ref: neon-protocol/style-pack  # 3-5 reference images per world
beats:
  - id: beat-01
    visual: "Close-up of Dilan at holographic terminal, neon rain outside, cyberpunk"
    dialogue: "When you need to sort an array..."
    speaker: Dilan
    voice: dilan-v1          # ElevenLabs voice profile ID
    mood: confident           # Modulates voice delivery
    duration: 8               # Target seconds
  - id: beat-02
    visual: "Noor leans forward, data streams reflected in glasses"
    dialogue: "Exactly. Transfer learning is the npm install of ML."
    speaker: Noor
    voice: noor-v1
    mood: enthusiastic
    duration: 5
```

### Stage 2: Generate
CLI tool `tc-video generate` processes each beat:
1. Compose Runway prompt from `visual` + world style reference pack + character reference images
2. Call **Runway Gen-3/4 API** -> raw video clip
3. Call **ElevenLabs API** -> voice audio for dialogue line
4. Mix ambient audio from world soundscape library (loopable segments at -12dB under voice)
5. **FFmpeg** merge: video + voice + ambient -> final clip (.mp4, H.264)

### Stage 3: QA & Upload
CLI tool `tc-video review`:
1. Opens local preview server showing all generated clips for a lesson
2. Author approves or flags clips for re-generation
3. Approved clips upload to **Cloudflare R2** (zero egress fees)
4. Generates `video-manifest.json` with CDN URLs, durations, caption timings

### Stage 4: Build & Deploy
Integrated into Velite build step:
1. Velite reads `video-manifest.json` per lesson
2. Validates clip IDs match `<VideoScene>` references in MDX
3. Injects CDN URLs + caption data into compiled lesson output
4. `<VideoScene>` component loads clips from R2 CDN at runtime

## Consistency Strategy

### Per-World Style Reference Packs
Each world ships 3-5 AI-generated reference images defining its visual language (color palette, lighting, character art style). These are passed to Runway as style anchors for every clip in that world:
- **Neon Protocol:** Cyberpunk noir, neon-lit rain, holographic interfaces
- **Deep Orbit:** Space stations, starfields, orbital command centers
- **Signal Ward:** Clinical environments, medical monitors, sterile lighting
- **Nova Canvas:** Creative studios, paint splashes, generative art
- **Terra Grid:** Industrial settings, factory floors, edge hardware

### Character Reference Sheets
Each recurring character gets AI-generated reference sheets (face, clothing, proportions) to maintain visual consistency across hundreds of clips.

### Voice Profiles
Each character gets a designed voice ID on ElevenLabs. Mood tags (confident, worried, excited) modulate delivery. Consistent across all 275 lessons.

### World Ambient Sound Packs
5 ambient libraries (one per world): space hum, neon rain, hospital beeps, creative studio buzz, factory floor. Loopable segments, crossfaded between clips.

## Cost Estimate

| Item | Unit Cost | Volume | Total |
|------|-----------|--------|-------|
| Runway Gen-3/4 clips | ~$0.50-1.00/clip | ~800 clips | $400-800 |
| ElevenLabs voice gen | ~$0.10-0.30/clip | ~600 voiced clips | $60-180 |
| Cloudflare R2 storage | $0.015/GB/mo | ~20-40 GB | $0.30-0.60/mo |
| R2 egress (CDN) | Free | -- | $0 |
| Re-generation (QA fails, ~20%) | -- | ~160 re-gens | $80-160 |
| **One-time generation total** | | | **$540-1,140** |
| **Ongoing monthly** | | | **< $1/mo** |

## Rollout Strategy

1. **Proof of concept:** Generate video for 1 lesson (Neon Protocol Module 1, Lesson 1 — "Seeing Like a Machine") to validate quality, consistency, and pipeline
2. **Single world:** If POC passes, generate all 55 Neon Protocol lessons (~160 clips)
3. **Full rollout:** Remaining 4 worlds (220 lessons, ~640 clips)

Ship one world at a time. Text fallback ensures lessons without video still work identically to today.

## Why Deferred

- One-time generation cost of $540-1,140 not in current budget
- AI video tools (Runway, Kling, Pika) are improving rapidly — waiting reduces cost and increases quality
- Current text-based screenplay format is functional and ships V1
- This subsumes the previously deferred audio narration idea (video includes voice acting)
- User engagement data from V1 (narrative skip rates, lesson completion, time-on-step) will validate whether the investment is worth it

## When to Revisit

- Post-V1 launch, once revenue from world sales can fund generation costs
- If Runway or competitors drop pricing significantly (watch for sub-$0.25/clip)
- If user feedback specifically requests richer narrative presentation
- If narrative skip rates are high (>40%), video may not be the right investment — consider other engagement strategies first

## Files That Will Change

- `packages/content/src/schemas.ts` — add videoClips, captions to lesson schema
- `packages/ui/src/mdx/video-scene.tsx` — new component (replaces Dialogue + SceneHeading for video-enabled lessons)
- `packages/ui/src/mdx/index.ts` — register VideoScene in MDX component map
- `packages/content/velite.config.ts` — add video-manifest.json ingestion
- `apps/web/app/worlds/[slug]/[module]/[lesson]/lesson-content.tsx` — add VideoScene to visibleComponents for steps 0 and 5
- New: `tools/tc-video/` — CLI for generate, review, upload pipeline
- New: `packages/content/content/<world>/video-specs/` — per-lesson video-spec.yaml files
- New: `packages/content/content/<world>/video-manifests/` — generated manifest JSON files
