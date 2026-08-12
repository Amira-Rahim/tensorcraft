import { ImageResponse } from "next/og";
import { cookies } from "next/headers";
import { worlds } from "@tensorcraft/worlds";
import { DEFAULT_WORLD } from "@tensorcraft/shared";

export const runtime = "edge";
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default async function Icon() {
  const cookieStore = await cookies();
  const worldSlug = cookieStore.get("tc_world")?.value || DEFAULT_WORLD;
  const primary =
    worlds[worldSlug]?.palette.primary || worlds[DEFAULT_WORLD].palette.primary;

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: primary,
        color: "#181818",
        fontSize: 18,
        fontWeight: 700,
        fontFamily: "monospace",
      }}
    >
      T_
    </div>,
    { ...size },
  );
}
