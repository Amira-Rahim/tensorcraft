import { ImageResponse } from "next/og";
import type { NextRequest } from "next/server";
import { themes } from "@tensorcraft/themes";
import { DEFAULT_THEME } from "@tensorcraft/shared";

export const runtime = "edge";

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const title = searchParams.get("title") || "Tensorcraft";
  const theme = searchParams.get("theme") || DEFAULT_THEME;
  const subtitle = searchParams.get("subtitle") || "";

  const accentColor =
    themes[theme]?.palette.primary || themes[DEFAULT_THEME].palette.primary;

  return new ImageResponse(
    <div
      tw="flex flex-col w-full h-full"
      style={{ backgroundColor: "#181818" }}
    >
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
            <p tw="text-2xl mt-4 m-0" style={{ color: "#A0A0A0" }}>
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
        "Cache-Control": "public, max-age=86400",
      },
    },
  );
}
