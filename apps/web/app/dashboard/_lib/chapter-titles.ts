/** Short story labels for the authored Deep Orbit chapters. */
const CHAPTER_TITLES: Record<string, string> = {
  foundations: "First contact",
  "neural-networks": "Beyond the rules",
  "training-loop": "Teach DEEP SCAN",
  "browser-runtimes": "Bring it aboard",
  "signal-processing": "Read the signal",
  "recurrent-networks": "Find the rhythm",
  "anomaly-detection": "The anomaly",
  "advanced-time-series": "Chase the forecast",
  "llm-integration": "Report to Earth",
  "optimization-edge": "The capture window",
  capstone: "Launch DEEP SCAN",
};

export function chapterTitle(worldSlug: string, moduleSlug: string) {
  return worldSlug === "deep-orbit" ? CHAPTER_TITLES[moduleSlug] : undefined;
}
