import { ImageResponse } from "next/og";
import { cookies } from "next/headers";
import { themes } from "@tensorcraft/themes";
import { DEFAULT_THEME } from "@tensorcraft/shared";

export const runtime = "edge";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default async function AppleIcon() {
  const cookieStore = await cookies();
  const themeSlug = cookieStore.get("tc_theme")?.value || DEFAULT_THEME;
  const primary =
    themes[themeSlug]?.palette.primary || themes[DEFAULT_THEME].palette.primary;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: primary,
        color: "#1C1C1C",
        fontSize: 100,
        fontWeight: 700,
        fontFamily: "monospace",
      }}
    >
      T_
    </div>,
    { ...size },
  );
}
