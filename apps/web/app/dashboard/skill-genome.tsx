const AXES = [
  { key: "data_prep", label: "Data preparation" },
  { key: "model_arch", label: "Model architecture" },
  { key: "training", label: "Training" },
  { key: "evaluation", label: "Evaluation" },
  { key: "deployment", label: "Deployment" },
  { key: "js_integration", label: "JavaScript integration" },
];
export function SkillGenome({
  data,
}: {
  data: Array<{ skill_axis: string; proficiency: number; velocity: number }>;
}) {
  const recorded = AXES.flatMap((axis) => {
    const value = data.find((d) => d.skill_axis === axis.key)?.proficiency ?? 0;
    return Number.isFinite(value) && value > 0
      ? [{ ...axis, value: Math.min(100, value) }]
      : [];
  });
  if (!recorded.length) return null;
  return (
    <section
      className="my-6 bg-surface-raised p-6"
      aria-labelledby="skills-heading"
    >
      <h2 id="skills-heading" className="text-xl font-semibold">
        Skill practice
      </h2>
      <p className="mt-2 text-sm text-text-muted">
        These signals summarize recorded practice on a 0–100 scale. They are not
        a mastery percentage or a certification.
      </p>
      <dl className="mt-5 grid gap-4 sm:grid-cols-2">
        {recorded.map((axis) => (
          <div
            key={axis.key}
            className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-3 bg-surface p-4"
          >
            <dt className="font-medium">{axis.label}</dt>
            <dd className="text-sm text-text-muted">
              {Math.round(axis.value)} / 100
            </dd>
            <dd
              aria-hidden="true"
              className="col-span-2 h-2 bg-surface-overlay"
            >
              <div
                className="h-full bg-primary"
                style={{ width: `${axis.value}%` }}
              />
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
