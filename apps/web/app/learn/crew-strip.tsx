import { worlds } from "@tensorcraft/worlds";
import { AnimatedAvatar } from "@tensorcraft/ui/animated-avatar";
import { portraitSources } from "@/lib/character-art";

/**
 * The crew, on /learn: the story dimension made visible with the shipped
 * character art (world-cast grammar, page-surface edition: no plate behind
 * it, so no veil or tc-on-art needed). Role only; `personality` is a
 * writing-room note, and Nazari's gives away her arc.
 */
const WORLD = "deep-orbit";

export function CrewStrip() {
  const characters = worlds[WORLD]?.characters ?? [];
  if (characters.length === 0) return null;

  return (
    <ul
      data-testid="learn-crew-strip"
      className="flex flex-wrap gap-x-10 gap-y-8 list-none p-0 m-0"
    >
      {characters.map((c) => (
        <li key={c.name} className="flex items-center gap-3">
          <AnimatedAvatar
            name={c.name}
            src={portraitSources(WORLD, c).src}
            size={72}
          />
          <div className="flex flex-col">
            <span className="font-mono text-sm text-text-primary">
              {c.name}
            </span>
            {c.role && (
              <span className="font-mono text-xs text-text-muted">
                {c.role}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
