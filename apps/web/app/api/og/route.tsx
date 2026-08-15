import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { worlds, worldSlugs } from "@tensorcraft/worlds";
import { DEFAULT_WORLD } from "@tensorcraft/shared";
import { ogPlatePath, ogSealPath } from "./og-assets";

export const runtime = "edge";

// Hard caps to keep `/api/og` from being abused as an arbitrary string
// renderer. Two layers of defense:
//   1. Input validation here (length caps + world allowlist) so a hammer
//      attack can't reflect 10 KB strings into the PNG buffer.
//   2. Aggressive `Cache-Control: public, max-age=86400, s-maxage=86400`
//      headers below, so identical (title, subtitle, world, kind) tuples
//      collapse to one render per day at Vercel's edge.
// True per-IP rate-limit lives at the Vercel platform / firewall layer.
const MAX_TITLE_LEN = 200;
const MAX_SUBTITLE_LEN = 200;
const VALID_KINDS = new Set(["default", "digest", "cert"]);
const MAX_LEARNER_LEN = 100;

function clamp(value: string, max: number): string {
  if (value.length <= max) return value;
  return value.slice(0, max - 1) + "…";
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;

  const rawKind = searchParams.get("kind") || "default";
  const kind = VALID_KINDS.has(rawKind) ? rawKind : "default";

  const title = clamp(
    searchParams.get("title") || "Tensorcraft",
    MAX_TITLE_LEN,
  );
  const subtitle = clamp(searchParams.get("subtitle") || "", MAX_SUBTITLE_LEN);

  const worldParam = searchParams.get("world") || DEFAULT_WORLD;
  const world = (worldSlugs as readonly string[]).includes(worldParam)
    ? worldParam
    : DEFAULT_WORLD;

  const accentColor =
    worlds[world]?.palette.primary || worlds[DEFAULT_WORLD].palette.primary;

  if (kind === "digest") {
    const lessonTitle = clamp(
      searchParams.get("lessonTitle") || "",
      MAX_TITLE_LEN,
    );
    const sourceLabel = clamp(
      searchParams.get("sourceLabel") || "",
      MAX_SUBTITLE_LEN,
    );
    return new ImageResponse(
      <div
        tw="flex flex-col w-full h-full"
        style={{ backgroundColor: "#181818" }}
      >
        {/* Top half: news headline */}
        <div tw="flex flex-col flex-1 px-16 pt-14 pb-8">
          <div tw="flex items-center justify-between mb-auto">
            <span
              tw="text-sm font-bold tracking-widest"
              style={{ color: "#B0B0B0" }}
            >
              THE BRIDGE
            </span>
            {sourceLabel && (
              <span tw="text-sm tracking-wider" style={{ color: "#B0B0B0" }}>
                via {sourceLabel}
              </span>
            )}
          </div>
          <h1
            tw="text-5xl font-bold leading-tight m-0 mt-auto"
            style={{ color: "#E0E0E0" }}
          >
            {title}
          </h1>
        </div>

        {/* World accent band */}
        <div tw="w-full h-3" style={{ backgroundColor: accentColor }} />

        {/* Bottom half: lesson teach */}
        <div
          tw="flex flex-col px-16 py-10"
          style={{ backgroundColor: "#0E0E0E" }}
        >
          <span
            tw="text-sm font-bold tracking-widest mb-3"
            style={{ color: accentColor }}
          >
            TEACHES
          </span>
          <p
            tw="text-3xl font-bold leading-snug m-0"
            style={{ color: "#E0E0E0" }}
          >
            {lessonTitle || "Read the post →"}
          </p>
        </div>
      </div>,
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control":
            "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  }

  // The world's hero plate as the card's ground (deep-orbit only today).
  // Fetched from our own origin; any failure leaves `plate` undefined and
  // the text-only card below is the floor.
  let plate: ArrayBuffer | undefined;
  const platePath = ogPlatePath(world);
  if (platePath) {
    try {
      const plateRes = await fetch(new URL(platePath, req.nextUrl.origin));
      if (plateRes.ok) plate = await plateRes.arrayBuffer();
    } catch {
      /* text-only card is the floor */
    }
  }

  if (kind === "cert") {
    // Certificate share card: what the public share page already shows —
    // seal, learner, world. Every asset is optional; all-text is the floor.
    const learner = clamp(
      searchParams.get("learner") || "A Tensorcraft learner",
      MAX_LEARNER_LEN,
    );
    let seal: ArrayBuffer | undefined;
    const sealPath = ogSealPath(world);
    if (sealPath) {
      try {
        const sealRes = await fetch(new URL(sealPath, req.nextUrl.origin));
        if (sealRes.ok) seal = await sealRes.arrayBuffer();
      } catch {
        /* seal-less card is fine */
      }
    }
    return new ImageResponse(
      <div
        tw="flex flex-col w-full h-full items-center"
        style={{ backgroundColor: "#181818" }}
      >
        {plate && (
          <img
            src={plate as unknown as string}
            tw="absolute inset-0 w-full h-full"
            style={{ objectFit: "cover" }}
          />
        )}
        <div
          tw="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(14,14,14,0.55) 0%, rgba(14,14,14,0.88) 80%)",
          }}
        />
        <div tw="flex flex-col flex-1 items-center justify-center px-16">
          {seal && (
            <img
              src={seal as unknown as string}
              width={120}
              height={120}
              tw="mb-8"
            />
          )}
          <span
            tw="text-sm font-bold tracking-widest mb-4"
            style={{ color: "#B0B0B0" }}
          >
            CERTIFICATE OF COMPLETION
          </span>
          <h1
            tw="text-6xl font-bold leading-tight m-0 text-center"
            style={{ color: "#E0E0E0" }}
          >
            {title}
          </h1>
          <p tw="text-3xl mt-6 m-0" style={{ color: accentColor }}>
            {learner}
          </p>
        </div>
        <div tw="w-full h-2" style={{ backgroundColor: accentColor }} />
      </div>,
      {
        width: 1200,
        height: 630,
        headers: {
          "Cache-Control":
            "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        },
      },
    );
  }

  return new ImageResponse(
    <div
      tw="flex flex-col w-full h-full"
      style={{ backgroundColor: "#181818" }}
    >
      {plate && (
        <img
          // satori accepts an ArrayBuffer img src; the DOM typing does not.
          src={plate as unknown as string}
          tw="absolute inset-0 w-full h-full"
          style={{ objectFit: "cover" }}
        />
      )}
      {plate && (
        <div
          tw="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(14,14,14,0.30) 0%, rgba(14,14,14,0.84) 75%)",
          }}
        />
      )}
      {/* Top section with branding and content */}
      <div tw="flex flex-col flex-1 px-16 pt-14 pb-8">
        {/* Branding */}
        <div tw="flex items-center mb-auto">
          <div
            tw="w-10 h-10 mr-4 flex items-center justify-center"
            style={{ backgroundColor: accentColor }}
          >
            <span tw="text-xl font-bold" style={{ color: "#181818" }}>
              T_
            </span>
          </div>
          <span
            tw="text-2xl font-bold tracking-tight"
            style={{ color: "#E0E0E0" }}
          >
            TENSORCRAFT
          </span>
        </div>

        {/* Title */}
        <div tw="flex flex-col mt-auto mb-8">
          <h1
            tw="text-6xl font-bold leading-tight m-0"
            style={{ color: "#E0E0E0" }}
          >
            {title}
          </h1>
          {subtitle && (
            <p tw="text-2xl mt-4 m-0" style={{ color: "#B0B0B0" }}>
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Accent strip at bottom */}
      <div tw="w-full h-2" style={{ backgroundColor: accentColor }} />
    </div>,
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control":
          "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
      },
    },
  );
}
