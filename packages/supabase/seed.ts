/** Local review fixtures. Use `pnpm review:prepare` from the repo root. */
import { seedReviewDatabase } from "./review-seed.mjs";

seedReviewDatabase()
  .then((counts) => console.log("[seed] Local review fixtures ready:", counts))
  .catch((error: unknown) => {
    console.error(
      "[seed]",
      error instanceof Error ? error.message : "Review seed failed.",
    );
    process.exitCode = 1;
  });
