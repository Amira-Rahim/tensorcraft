export type MissionIconName =
  | "signal"
  | "review"
  | "check"
  | "lock"
  | "data"
  | "model"
  | "evaluation"
  | "runtime"
  | "operations";

/** Ship-console symbols, drawn in code so they follow each color scheme. */
export function MissionIcon({
  name,
  className,
}: {
  name: MissionIconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {name === "signal" && <path d="M2 16h5l3-9 5 19 5-22 4 12h6" />}
      {name === "check" && <path d="m8 16 5 5 11-12" />}
      {name === "lock" && (
        <>
          <rect x="7" y="14" width="18" height="13" rx="1" />
          <path d="M11 14V9a5 5 0 0 1 10 0v5M16 19v3" />
        </>
      )}
      {name === "review" && (
        <>
          <path d="M25 10A11 11 0 1 0 27 18M25 4v6h-6M16 9v7l5 3" />
        </>
      )}
      {name === "data" && (
        <>
          <ellipse cx="16" cy="7" rx="10" ry="4" />
          <path d="M6 7v18c0 5 20 5 20 0V7M6 16c0 5 20 5 20 0" />
        </>
      )}
      {name === "model" && (
        <>
          <path d="m7 7 16 9M7 25l16-9M7 7v18" />
          <circle cx="6" cy="7" r="3" />
          <circle cx="6" cy="25" r="3" />
          <circle cx="25" cy="16" r="4" />
        </>
      )}
      {name === "evaluation" && (
        <>
          <path d="M5 5v22h22M10 21l6-7 5 2 6-9" />
          <path d="m22 7 5 0 0 5" />
        </>
      )}
      {name === "runtime" && (
        <>
          <rect x="4" y="5" width="24" height="19" rx="1" />
          <path d="m10 11 4 4-4 4M18 19h5M11 28h10M16 24v4" />
        </>
      )}
      {name === "operations" && (
        <>
          <path d="M16 3c-6 5-7 12-6 18h12c1-6 0-13-6-18ZM10 15l-6 7v4l6-3M22 15l6 7v4l-6-3M13 26l3 4 3-4" />
          <circle cx="16" cy="13" r="3" />
        </>
      )}
    </svg>
  );
}
