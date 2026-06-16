"use client";
import { useState } from "react";

interface CharacterAvatarProps {
  name: string;
  src?: string;
  accentColor?: string;
  isAI?: boolean;
  size?: number;
}

function initials(name: string): string {
  const words = name
    .replace(/[^A-Za-z ]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0]!.slice(0, 2).toUpperCase();
  return (words[0]![0]! + words[words.length - 1]![0]!).toUpperCase();
}

export function CharacterAvatar({
  name,
  src,
  accentColor = "var(--tc-primary)",
  isAI = false,
  size = 40,
}: CharacterAvatarProps) {
  const [failed, setFailed] = useState(false);
  const frame = {
    width: size,
    height: size,
    border: `2px solid ${accentColor}`,
    background: "var(--tc-surface)",
    borderRadius: 0,
  } as const;

  if (!src || failed) {
    return (
      <div
        data-testid="character-avatar-placeholder"
        role="img"
        aria-label={name}
        className="shrink-0 select-none flex items-center justify-center font-mono font-bold"
        style={{ ...frame, color: accentColor }}
      >
        {isAI ? (
          <span aria-hidden="true" style={{ fontSize: size * 0.5 }}>
            &#9673;
          </span>
        ) : (
          <span style={{ fontSize: size * 0.32, letterSpacing: "1px" }}>
            {initials(name)}
          </span>
        )}
      </div>
    );
  }

  return (
    <img
      data-testid="character-avatar-img"
      src={src}
      alt={name}
      width={size}
      height={size}
      onError={() => setFailed(true)}
      className="shrink-0"
      style={{ ...frame, objectFit: "cover" }}
    />
  );
}
