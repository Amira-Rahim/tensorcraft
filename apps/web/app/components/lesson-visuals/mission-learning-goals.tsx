import { ProseText } from "@tensorcraft/ui/prose-text";
export function MissionLearningGoals({
  objectives,
  introduction,
}: {
  objectives: string[];
  introduction?: string;
}) {
  return (
    <section
      className="lesson-goals"
      aria-label="Learning goals for this mission"
    >
      {introduction ? (
        <p className="mb-5">
          <ProseText>{introduction}</ProseText>
        </p>
      ) : (
        <h3>Learning goals for this mission</h3>
      )}
      <ul role="list">
        {objectives.map((objective) => (
          <li key={objective}>
            <ProseText>
              {objective
                .split(/(`[^`]+`)/g)
                .map((part, index) =>
                  part.startsWith("`") && part.endsWith("`") ? (
                    <code key={index}>{part.slice(1, -1)}</code>
                  ) : (
                    part
                  ),
                )}
            </ProseText>
          </li>
        ))}
      </ul>
    </section>
  );
}
