interface SceneHeadingProps {
  location: string;
  time?: string;
  prefix?: string;
}

export function SceneHeading({ location, time, prefix }: SceneHeadingProps) {
  const parts: string[] = [];
  if (prefix) parts.push(prefix);
  parts.push(location);

  const heading = parts.join(" - ").toUpperCase();
  const full = time ? `${heading} - ${time.toUpperCase()}` : heading;

  return (
    <div
      className="font-mono text-[10px] uppercase tracking-[2.5px] pb-3 mb-7"
      style={{
        color: "var(--tc-muted, #555555)",
        borderBottom: "1px solid var(--tc-border, #2a2a2a)",
      }}
    >
      {full}
    </div>
  );
}
