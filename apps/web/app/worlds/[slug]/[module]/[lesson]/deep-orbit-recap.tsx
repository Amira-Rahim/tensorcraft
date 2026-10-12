import { useId, type ComponentProps } from "react";
import type { LessonRecap } from "@tensorcraft/ui";
import { ProseText } from "@tensorcraft/ui/prose-text";
import { TensorConversionFigure } from "./deep-orbit-tensor-figure";

function RecapText({ children }: { children: string }) {
  return children
    .split(/`([^`]+)`/g)
    .map((part, index) =>
      index % 2 ? (
        <code key={index}>{part}</code>
      ) : (
        <ProseText key={index}>{part}</ProseText>
      ),
    );
}

export function DeepOrbitRecap({
  lessonId,
  whatYouLearned,
  bridge,
  youCanNow,
}: ComponentProps<typeof LessonRecap> & { lessonId?: string }) {
  const headingId = useId();
  if (lessonId === "introduction-to-tensors") {
    return (
      <section className="orbit-recap" aria-labelledby={headingId}>
        <div className="orbit-recap-layout">
          <div className="orbit-recap-copy">
            <h2 id={headingId} className="orbit-section-heading">
              Reading the shape
            </h2>
            <p className="orbit-recap-intro">
              A shape lists the length of each axis. Here, three values sit on a
              single axis.
            </p>
            <p className="orbit-recap-note">
              <code>tf.tensor()</code> prepares these numbers for TensorFlow.js.
              Training a model is a separate step.
            </p>
          </div>
          <TensorConversionFigure />
        </div>
      </section>
    );
  }

  return (
    <section className="orbit-recap" aria-labelledby={headingId}>
      <h2 id={headingId} className="orbit-section-heading">
        What you learned
      </h2>
      <div className="orbit-recap-summary">
        <ul>
          {whatYouLearned.map((item, index) => (
            <li key={index}>
              <RecapText>{item}</RecapText>
            </li>
          ))}
        </ul>
        <div className="orbit-recap-application">
          <h3>Connecting the ideas</h3>
          <p>
            <RecapText>{bridge}</RecapText>
          </p>
          <h3>You can now</h3>
          <p>
            <RecapText>{youCanNow}</RecapText>
          </p>
        </div>
      </div>
    </section>
  );
}
