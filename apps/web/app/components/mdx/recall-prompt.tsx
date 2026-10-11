"use client";

import type { RecallCheck } from "@tensorcraft/shared";
import type { ReactNode } from "react";
import { ReviewPromptCard, type RecallAction } from "../review-prompt-card";

interface RecallPromptProps {
  question: string;
  checks?: RecallCheck[];
  children?: ReactNode;
  answer?: string;
  onAnswer?: (result: RecallAction) => void;
}

export function RecallPrompt({
  question,
  checks,
  children,
  answer,
  onAnswer,
}: RecallPromptProps) {
  return (
    <ReviewPromptCard
      question={question}
      checks={checks}
      answer={children ?? answer}
      onAction={onAnswer}
    />
  );
}
