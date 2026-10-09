import { worlds } from "@tensorcraft/worlds";
import { portraitSources } from "./character-art";

// Reader-facing roles, rather than the story bible's narrative archetypes.
const DEEP_ORBIT_CREW: Record<
  string,
  { aliases: string[]; description: string }
> = {
  "commander-mirza": {
    aliases: ["Mirza"],
    description: "Commander of the research ship Archimedes.",
  },
  "dr-farah": {
    aliases: ["Farah"],
    description: "The crew’s astrophysicist. She studies signals from space.",
  },
  "chief-nazari": {
    aliases: ["Nazari"],
    description: "The ship’s chief engineer. She keeps its systems running.",
  },
  "ensign-demir": {
    aliases: ["Demir"],
    description:
      "The crew’s JavaScript engineer, responsible for communications.",
  },
  aria: {
    aliases: [],
    description:
      "The ship’s AI. She processes signals using rules written by the crew.",
  },
};

export interface LessonCharacter {
  name: string;
  description: string;
  src?: string;
  isAI?: boolean;
}

export function lessonCharacterMatcher(worldSlug: string) {
  const byName = new Map<string, LessonCharacter>();
  for (const character of worlds[worldSlug]?.characters ?? []) {
    const crew =
      worldSlug === "deep-orbit" && character.slug
        ? DEEP_ORBIT_CREW[character.slug]
        : undefined;
    const profile: LessonCharacter = {
      name: character.name,
      description: crew?.description ?? character.role,
      src: portraitSources(worldSlug, character).src,
      isAI: character.isAI,
    };
    for (const name of [
      character.name,
      ...(character.aliases ?? []),
      ...(crew?.aliases ?? []),
    ]) {
      byName.set(name, profile);
    }
  }
  const names = [...byName.keys()].sort((a, b) => b.length - a.length);
  const pattern = names.length
    ? new RegExp(
        `(?<![\\p{L}\\p{N}_])(${names.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})(?![\\p{L}\\p{N}_])`,
        "gu",
      )
    : null;
  return (
    text: string,
  ): Array<{ text: string; character?: LessonCharacter }> => {
    if (!pattern) return [{ text }];
    const parts: Array<{ text: string; character?: LessonCharacter }> = [];
    let cursor = 0;
    for (const match of text.matchAll(pattern)) {
      if (match.index > cursor)
        parts.push({ text: text.slice(cursor, match.index) });
      parts.push({ text: match[0], character: byName.get(match[0]) });
      cursor = match.index + match[0].length;
    }
    if (cursor < text.length) parts.push({ text: text.slice(cursor) });
    return parts;
  };
}
