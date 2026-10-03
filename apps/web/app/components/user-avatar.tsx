import Image from "next/image";

interface UserAvatarProps {
  url?: string | null;
  name: string;
  size: number;
  /**
   * Set when the avatar sits inside a control that already names itself,
   * like the user menu button. The avatar is then hidden from assistive tech,
   * carries no name in any attribute, and lets clicks through to the control
   * (ph-no-capture on a click target would drop the control's own click).
   */
  decorative?: boolean;
}

// The avatar holds a person's name (alt, aria-label) and photo URL, so it is
// always marked ph-no-capture: PostHog autocapture skips it and session
// replays blank it.
export function UserAvatar({
  url,
  name,
  size,
  decorative = false,
}: UserAvatarProps) {
  const initial = name.charAt(0).toUpperCase() || "?";
  const label = `${name || "User"}'s avatar`;

  if (url) {
    return (
      <Image
        src={url}
        alt={decorative ? "" : label}
        aria-hidden={decorative || undefined}
        className={
          decorative ? "ph-no-capture pointer-events-none" : "ph-no-capture"
        }
        width={size}
        height={size}
        unoptimized
        style={{
          objectFit: "cover",
          border: "2px solid var(--tc-primary)",
          flexShrink: 0,
        }}
      />
    );
  }

  return (
    <div
      role={decorative ? undefined : "img"}
      aria-label={decorative ? undefined : label}
      aria-hidden={decorative || undefined}
      className={
        decorative
          ? "flex items-center justify-center font-mono ph-no-capture pointer-events-none"
          : "flex items-center justify-center font-mono ph-no-capture"
      }
      style={{
        width: size,
        height: size,
        background: "color-mix(in srgb, var(--tc-primary) 12%, transparent)",
        border: "2px solid var(--tc-primary)",
        fontSize: size * 0.4,
        color: "var(--tc-primary)",
        flexShrink: 0,
      }}
    >
      {initial}
    </div>
  );
}
