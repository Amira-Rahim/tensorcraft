import type { ThemeManifest } from "./types";

export const novaCanvas: ThemeManifest = {
  id: "creative",
  slug: "nova-canvas",
  displayName: "Nova Canvas",
  tagline: "Where AI learns to imagine",
  description:
    "NOVA LABS' AI co-creation system crashed during a major exhibition. Build Nova Canvas AI — a multimodal creative assistant.",
  status: "coming-soon",
  palette: {
    bg: "#0D0D1A",
    primary: "#FF6B6B",
    accent: "#A78BFA",
    surface: "#1A1A30",
    text: "#E2E8F0",
    muted: "#6B7280",
    glow: "#FF6B6B",
    neonLine: "#A78BFA",
  },
  terminology: {
    lesson: "Session",
    module: "Gallery",
    exercise: "Creation",
  },
  protagonist: "Creative Engineer",
  sandpackTheme: "nightOwl",
  characters: [
    {
      name: "Director Yara Okonkwo",
      role: "Mentor",
      personality: "Visionary artist-technologist",
    },
    {
      name: "Kai Zhang",
      role: "Peer",
      personality: "Generative art researcher, experimental",
    },
    {
      name: "Professor Elena Petrov",
      role: "Skeptic",
      personality: "Traditional art critic questioning AI creativity",
    },
    {
      name: "Ren Kobayashi",
      role: "Peer",
      personality: "Audio engineer, cross-modal thinker",
    },
    {
      name: "MUSE",
      role: "Studio AI",
      personality: "Poetic and eccentric",
    },
  ],
  comingSoon: {
    previewArt: "/themes/creative/preview.webp",
    storySummary:
      "NOVA LABS is where AI and human artists collaborate. Their AI co-creation system crashed during a major exhibition. Director Yara Okonkwo brings you in to rebuild it. You'll build Nova Canvas AI — a multimodal creative assistant that generates, transforms, and composes across text, image, and audio.",
    modelPreview:
      "Nova Canvas AI: multimodal generation using GANs, VAEs, diffusion models, CLIP, and cross-modal transformers",
    estimatedLaunchDate: "2028-Q1",
  },
  specialization: "Multimodal & Generative AI",
  modelBuilt: "Nova Canvas AI — multimodal creative assistant",
  careerPaths: [
    "GenAI Engineer ($130K–$280K)",
    "Multimodal ML Engineer ($150K–$250K)",
  ],
};
