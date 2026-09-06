import { PRICING } from "@tensorcraft/shared";

/**
 * Single source for the landing FAQ: the visible <details> section on the
 * landing page AND the sitewide FAQPage JSON-LD in layout.tsx both map over
 * this list, keeping schema and on-page content from drifting apart.
 */
export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Can I learn machine learning with JavaScript?",
    a: "Yes. Tensorcraft teaches machine learning entirely in JavaScript using the TensorFlow.js library. You will build models, then train and run them in the browser right in the lessons; the same code runs under Node. No Python required. The live world, Deep Orbit, covers topics like neural networks, recurrent networks (LSTMs, models that read data in sequence), signal processing (finding patterns in noisy data), and attention, the mechanism behind today's AI models. More topics are covered in the upcoming worlds.",
  },
  // The next two absorb the load-bearing "Skip it if you" objections when
  // the landing Who This Is For section was cut (2026-08-16): Python-stack
  // mismatch and the time commitment. The "Is there a video track?" entry
  // (with its owner-ruled video-scenes tease, 2026-08-24) was removed
  // 2026-09-01 by owner request, superseding that ruling.
  {
    q: "What if I need Python or PyTorch?",
    a: "Then skip Tensorcraft. It is entirely taught with TensorFlow.js and intended as a fun and easy way for JavaScript engineers to break into machine learning.",
  },
  {
    q: "How much math do I need?",
    a: "None upfront. You just need JavaScript knowledge and comfort with concepts like functions, arrays, and async. The math will be introduced when you need it, in optional expandable drawers.",
  },
  {
    q: "How long does Deep Orbit take?",
    a: "Deep Orbit is 56 lessons across 11 modules, about 27 hours of lessons and exercises. Since it's story-based, it's meant to be tackled in order. Per-module estimates are on the pricing page and the Deep Orbit course page.",
  },
  {
    q: "Is Tensorcraft free?",
    a: `Module 1 of Deep Orbit is free, no account or credit card is required. However, the full course costs $${PRICING.single.price}. You will make a one-time payment and get lifetime access to your purchased world.`,
  },
  {
    q: "What if it turns out not to be for me?",
    a: "Module 1 is free. The full course is paid: after purchase there's a 5-day refund guarantee, no questions asked.",
  },
];
