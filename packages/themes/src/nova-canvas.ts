import type { ThemeManifest } from "./types";

export const novaCanvas: ThemeManifest = {
  id: "creative",
  slug: "nova-canvas",
  displayName: "Nova Canvas",
  tagline: "Where AI learns to imagine",
  description:
    "NOVA LABS' AI co-creation system crashed during a major exhibition. Build Nova Canvas — a multimodal creative assistant.",
  palette: {
    bg: "#1C1C1C",
    primary: "#C06060",
    accent: "#7868A8",
    surface: "#252525",
    text: "#C8C8C8",
    muted: "#8A8A8A",
    surfaceOverlay: "#313131",
    border: "#2A2A2A",
    codeBg: "#161616",
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
  specialization: "Multimodal & Generative AI",
  modelBuilt: "Nova Canvas — multimodal creative assistant",
  careerPaths: [
    "GenAI Engineer ($130K–$280K)",
    "Multimodal ML Engineer ($150K–$250K)",
  ],
};
