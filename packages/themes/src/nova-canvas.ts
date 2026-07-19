import type { ThemeManifest } from "./types";

export const novaCanvas: ThemeManifest = {
  id: "creative",
  slug: "nova-canvas",
  displayName: "Nova Canvas",
  tagline: "Where AI learns to imagine",
  description:
    "NOVA LABS' AI co-creation system crashed during a major exhibition. Build Nova Canvas, a multimodal creative assistant.",
  palette: {
    bg: "#1C1C1C",
    primary: "#E08058",
    accent: "#9A88D8",
    surface: "#252525",
    text: "#E0E0E0",
    muted: "#A0A0A0",
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
  modelBuilt: "Nova Canvas: multimodal creative assistant",
  careerPaths: [
    "GenAI Engineer ($130K-$280K)",
    "Multimodal ML Engineer ($150K-$250K)",
  ],
  preview: {
    statusBoard: {
      org: "NOVA LABS · INSTALLATION CONTROL",
      status: "CO-CREATION SYSTEM OFFLINE",
    },
    ctaLabel: "Save my invite",
    modules: [
      { order: 1, title: "Generative Basics", free: true },
      { order: 2, title: "Latent Spaces" },
      { order: 3, title: "Generative Adversarial Networks" },
      { order: 4, title: "Variational Autoencoders" },
      { order: 5, title: "Diffusion Models" },
      { order: 6, title: "Style Transfer" },
      { order: 7, title: "Multimodal Learning" },
      { order: 8, title: "CLIP & Alignment" },
      { order: 9, title: "Audio Generation" },
      { order: 10, title: "Creative Deployment" },
      { order: 11, title: "Capstone: The Biennale", capstone: true },
    ],
    skills: [
      "GANs",
      "VAEs",
      "diffusion models",
      "latent spaces",
      "style transfer",
      "CLIP & multimodal",
      "audio generation",
      "creative deployment",
    ],
  },
};
