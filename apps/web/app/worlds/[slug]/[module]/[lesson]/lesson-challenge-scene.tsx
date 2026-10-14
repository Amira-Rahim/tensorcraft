import type { ComponentProps } from "react";
import { LessonMissionScene } from "@/app/components/lesson-visuals/lesson-workbench";

type Props = Pick<
  ComponentProps<typeof LessonMissionScene>,
  "lesson" | "worldSlug" | "moduleSlug"
>;

export function LessonChallengeScene(props: Props) {
  return (
    <section
      className="orbit-challenge-scene"
      data-testid="challenge-scene"
      aria-label="Mission scene"
    >
      <LessonMissionScene {...props} compact narrativeFirst />
    </section>
  );
}
