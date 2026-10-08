export function MissionLearningGoals({ objectives }: { objectives: string[] }) {
  return (
    <section className="lesson-goals">
      <h3>Learning goals for this mission</h3>
      <ul role="list">
        {objectives.map((objective) => (
          <li key={objective}>{objective}</li>
        ))}
      </ul>
    </section>
  );
}
