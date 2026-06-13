interface Props {
  slug: string;
  color: string;
}

/**
 * Decorative per-theme hero motif. Pure presentational SVG; every variant
 * keeps the same viewBox so the hero layout is identical across themes.
 */
export function ComingSoonMotif({ slug, color }: Props) {
  const paths: Record<string, React.ReactNode> = {
    // ECG pulse line
    "signal-ward": (
      <polyline
        points="0,18 180,18 195,18 205,4 215,32 225,18 420,18 435,8 445,28 455,18 800,18"
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
    ),
    // Camera scanline grid: horizontal sweep + tick marks
    "neon-protocol": (
      <>
        <line x1="0" y1="18" x2="800" y2="18" stroke={color} strokeWidth="2" />
        {[80, 160, 240, 320, 400, 480, 560, 640, 720].map((x) => (
          <line
            key={x}
            x1={x}
            y1="10"
            x2={x}
            y2="26"
            stroke={color}
            strokeWidth="1"
          />
        ))}
        <rect
          x="392"
          y="6"
          width="24"
          height="24"
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
      </>
    ),
    // Audio waveform bars
    "nova-canvas": (
      <>
        {Array.from({ length: 40 }, (_, i) => {
          const heights = [6, 14, 22, 30, 22, 14];
          const h = heights[i % heights.length]!;
          return (
            <line
              key={i}
              x1={i * 20 + 10}
              y1={18 - h / 2}
              x2={i * 20 + 10}
              y2={18 + h / 2}
              stroke={color}
              strokeWidth="2"
            />
          );
        })}
      </>
    ),
    // Topographic grid: baseline + rising contour
    "terra-grid": (
      <>
        <line x1="0" y1="30" x2="800" y2="30" stroke={color} strokeWidth="1" />
        <polyline
          points="0,30 120,26 240,28 360,14 480,20 600,8 720,16 800,12"
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      width="100%"
      height="36"
      viewBox="0 0 800 36"
      preserveAspectRatio="none"
    >
      {paths[slug] ?? (
        <polyline
          points="0,18 380,18 392,6 404,30 416,18 800,18"
          fill="none"
          stroke={color}
          strokeWidth="2"
        />
      )}
    </svg>
  );
}
