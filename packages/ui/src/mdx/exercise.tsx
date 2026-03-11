"use client";

interface ExerciseProps {
  slug: string;
}

/**
 * Exercise component — placeholder for Sandpack integration.
 * Will be replaced with full Sandpack editor in Step 4.
 */
export function Exercise({ slug }: ExerciseProps) {
  return (
    <div
      className="rounded-[14px] p-6 my-6"
      style={{
        background: "var(--tc-surface, #0F1320)",
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-base">⚡</span>
        <h4
          className="text-xs font-semibold uppercase tracking-widest"
          style={{ color: "var(--tc-accent, #00D4FF)" }}
        >
          Exercise
        </h4>
      </div>
      <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>
        Interactive exercise:{" "}
        <code
          className="text-xs px-1.5 py-0.5 rounded"
          style={{
            background: "rgba(255,255,255,0.06)",
            color: "var(--tc-accent, #00D4FF)",
          }}
        >
          {slug}
        </code>
      </p>
      <div
        className="rounded-lg p-8 text-center"
        style={{
          background: "var(--tc-bg, #080B16)",
          border: "1px dashed rgba(255,255,255,0.1)",
        }}
      >
        <p className="text-sm" style={{ color: "var(--tc-muted, #8B92A5)" }}>
          Sandpack code editor loading...
        </p>
      </div>
    </div>
  );
}
