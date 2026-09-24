interface SceneHeadingProps {
  location: string;
  time?: string;
  prefix?: string;
  /** false when a host row draws the hairline, as the Briefing's slugline
   *  row does. */
  divider?: boolean;
}

export function SceneHeading({
  location,
  time,
  prefix,
  divider = true,
}: SceneHeadingProps) {
  const rest = [location, ...(time ? [time] : [])].join(" - ").toUpperCase();

  return (
    <div
      className={
        divider
          ? "font-mono text-[10px] uppercase tracking-[2.5px] pb-3 mb-7"
          : "font-mono text-[10px] uppercase tracking-[2.5px]"
      }
      style={{
        color: "var(--tc-muted, #555555)",
        ...(divider
          ? { borderBottom: "1px solid var(--tc-border, #2a2a2a)" }
          : {}),
      }}
    >
      {prefix && (
        <span style={{ color: "var(--tc-primary, #6baa8a)" }}>
          {`${prefix.toUpperCase()} - `}
        </span>
      )}
      {rest}
    </div>
  );
}
