import { PRICING } from "@tensorcraft/shared";

/**
 * Single source for the landing FAQ: the visible <details> section on the
 * landing page AND the sitewide FAQPage JSON-LD in layout.tsx both map over
 * this list, keeping schema and on-page content from drifting apart.
 */
export const FAQ_ITEMS: { q: string; a: string }[] = [
  {
    q: "Can I learn machine learning with JavaScript?",
    a: "Yes. In Deep Orbit, you build, train, and run models in JavaScript, mainly with TensorFlow.js. The lessons run in your browser without Python. You start with tensors and neural networks, then work with signals, sequences, attention, and language models. The independent project takes that work into a local browser app.",
  },
  // The next two absorb the load-bearing "Skip it if you" objections when
  // the landing Who This Is For section was cut (2026-08-16): Python-stack
  // mismatch and the time commitment. The "Is there a video track?" entry
  // (with its owner-ruled video-scenes tease, 2026-08-24) was removed
  // 2026-09-01 by owner request, superseding that ruling.
  {
    q: "What if I need Python or PyTorch?",
    a: "Choose a course focused on those tools. Tensorcraft is for JavaScript engineers who want to learn ML using a language they already know.",
  },
  {
    q: "How much math do I need?",
    a: "You need to be comfortable with JavaScript functions, arrays, and async code. We explain the math as it comes up, with optional derivations if you want to go deeper.",
  },
  {
    q: "How long does Deep Orbit take?",
    a: "Deep Orbit is 56 lessons across 11 modules, about 28 hours of lessons and exercises. Follow them in order: each mission continues the story and builds on earlier work. Per-module estimates are on the pricing page and the Deep Orbit course page.",
  },
  {
    q: "Is Tensorcraft free?",
    a: `Module 1 of Deep Orbit is free. You can start without an account or credit card. The full course costs $${PRICING.single.price}. Pay once for lifetime access to that world.`,
  },
  {
    q: "What if it turns out not to be for me?",
    a: "Try Module 1 for free first. If you buy the course and decide it is not for you, you can get a full refund within 5 days, no questions asked.",
  },
];
