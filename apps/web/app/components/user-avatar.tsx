import Image from "next/image";

interface UserAvatarProps {
  url?: string | null;
  name: string;
  size: number;
}

export function UserAvatar({ url, name, size }: UserAvatarProps) {
  const initial = name.charAt(0).toUpperCase() || "?";

  if (url) {
    return (
      <Image
        src={url}
        alt={`${name}'s avatar`}
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
      aria-label={`${name || "User"}'s avatar`}
      className="flex items-center justify-center font-mono"
      style={{
        width: size,
        height: size,
        background: "rgba(107,170,138,0.12)",
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
