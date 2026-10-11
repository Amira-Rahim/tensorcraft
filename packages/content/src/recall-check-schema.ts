import { z } from "zod";

const text = z.string().trim().min(1);
const base = { question: text, explanation: text };

export const recallChecksSchema = z
  .array(
    z.discriminatedUnion("kind", [
      z
        .object({
          ...base,
          kind: z.literal("choice"),
          options: z
            .array(z.object({ text, feedback: text }).strict())
            .min(2)
            .max(4),
          correctIndex: z.number().int().nonnegative(),
        })
        .strict()
        .refine(
          (check) => check.correctIndex < check.options.length,
          "The correct choice must be one of the options",
        )
        .refine(
          (check) =>
            new Set(check.options.map((option) => option.text)).size ===
            check.options.length,
          "Choice labels must be distinct",
        ),
      z
        .object({
          ...base,
          kind: z.literal("shape"),
          expected: z.array(z.number().int().nonnegative()).max(8),
          hint: text,
        })
        .strict(),
      z
        .object({
          ...base,
          kind: z.literal("number"),
          expected: z.number().finite(),
          tolerance: z.number().finite().nonnegative().optional(),
          hint: text,
        })
        .strict(),
    ]),
  )
  .min(1)
  .max(4);
