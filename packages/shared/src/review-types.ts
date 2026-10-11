import type { RecallCheck } from "./recall-checks";

/** A checked result or the learner's explicit self-assessment. */
export type ReviewOutcome = "got-it" | "review" | "bailed";

/** One schedulable recall prompt. Keys only: never carries question text. */
export interface ReviewItem {
  worldId: string;
  moduleId: string;
  lessonId: string;
  /** Position of the prompt within its lesson, 0-based. Part of the key. */
  promptIndex: number;
  pulls: number;
  successes: number;
  /** ISO 8601, or null if never reviewed. */
  lastReviewedAt: string | null;
  /** ISO 8601. */
  nextReviewAt: string;
}

/** A ReviewItem with its text resolved. Built server-side, never from a client key. */
export interface ResolvedReviewItem extends ReviewItem {
  question: string;
  answer: string;
  checks?: RecallCheck[];
}

export interface ScheduleResult {
  nextReviewAt: string;
  pulls: number;
  successes: number;
}

export interface ReviewStore {
  getDue(worldId: string, limit: number): Promise<ReviewItem[]>;
  record(item: ReviewItem, outcome: ReviewOutcome): Promise<void>;
}
