interface SceneHeadingProps {
  location: string;
  time?: string;
  prefix?: string;
}

export function SceneHeading({ location, time, prefix }: SceneHeadingProps) {
  const rest = [location, ...(time ? [time] : [])].join(" - ").toUpperCase();

  return (
    <div
      className="font-mono text-[10px] uppercase tracking-[2.5px] pb-3 mb-7"
      style={{
        color: "var(--tc-muted, #555555)",
        borderBottom: "1px solid var(--tc-border, #2a2a2a)",
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
